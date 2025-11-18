// src/services/lowStockService.ts

import { inventoryService } from './inventoryService';
import { purchaseService } from './purchaseService';
import { supplierService } from './supplierService';
import { InventoryItem } from '@/types/inventory';
import { Supplier } from '@/types/supplier';
import { Purchase, PurchaseWithDetails } from '@/types/purchase';
import { database } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';

// Interface for item stock information
export interface ItemStockInfo {
  item: InventoryItem;
  currentStock: number;
  lastPurchaseDate: Date | null;
  lastPurchaseId: string | null;
  stockLevel: 'out_of_stock' | 'critical' | 'low' | 'normal';
}

// Interface for supplier with their low stock items
export interface SupplierWithLowStockItems {
  supplier: Supplier;
  lowStockItems: ItemStockInfo[];
  totalItems: number;
}

export const lowStockService = {
  // Get actual stock quantity for an item
  async getItemCurrentStock(itemId: string): Promise<number> {
    try {
      // This calculates the current stock by summing up all batches for this item
      const batches = await purchaseService.getBatchesByItem(itemId);
      
      // Sum up the quantities across all batches
      const totalStock = batches.reduce((total, batch) => total + batch.quantity, 0);
      
      return totalStock;
    } catch (error) {
      console.error(`Error getting stock for item ${itemId}:`, error);
      return 0;
    }
  },
  
  // Get stock level category based on current and minimum quantities
  getStockLevel(current: number, minimum: number): 'out_of_stock' | 'critical' | 'low' | 'normal' {
    if (current <= 0) return 'out_of_stock';
    if (current < minimum * 0.25) return 'critical';
    if (current < minimum * 0.75) return 'low';
    return 'normal';
  },
  
  // Get low stock items for a specific supplier
  async getLowStockItemsForSupplier(supplierId: string): Promise<ItemStockInfo[]> {
    try {
      // Get all purchases from this supplier
      const purchasesRef = ref(database, 'purchases');
      const supplierPurchasesQuery = query(
        purchasesRef,
        orderByChild('supplierId'),
        equalTo(supplierId)
      );
      
      const purchasesSnapshot = await get(supplierPurchasesQuery);
      
      if (!purchasesSnapshot.exists()) {
        return [];
      }
      
      // Convert to array of purchases
      const supplierPurchases: Purchase[] = [];
      purchasesSnapshot.forEach((childSnapshot) => {
        const purchase = childSnapshot.val();
        supplierPurchases.push({
          id: childSnapshot.key,
          ...purchase,
          purchaseDate: new Date(purchase.purchaseDate),
          createdAt: new Date(purchase.createdAt),
          updatedAt: new Date(purchase.updatedAt)
        });
      });
      
      // Get all inventory items
      const allItems = await inventoryService.getAll();
      
      // Find all items ever purchased from this supplier
      const itemIds = new Set<string>();
      supplierPurchases.forEach(purchase => {
        purchase.items.forEach(item => {
          itemIds.add(item.itemId);
        });
      });
      
      // Get stock info for each item
      const lowStockItems: ItemStockInfo[] = [];
      
      for (const itemId of itemIds) {
        const item = allItems.find(i => i.id === itemId);
        if (!item) continue;
        
        // Get current stock
        const currentStock = await this.getItemCurrentStock(itemId);
        
        // Only include if stock is below minimum
        if (currentStock < item.minQuantity) {
          // Find the most recent purchase date for this item from this supplier
          const relevantPurchases = supplierPurchases.filter(purchase => 
            purchase.items.some(i => i.itemId === itemId)
          );
          
          let lastPurchaseDate: Date | null = null;
          let lastPurchaseId: string | null = null;
          
          if (relevantPurchases.length > 0) {
            const mostRecent = relevantPurchases.reduce((latest, current) => 
              latest.purchaseDate > current.purchaseDate ? latest : current
            );
            
            lastPurchaseDate = mostRecent.purchaseDate;
            lastPurchaseId = mostRecent.id || null;
          }
          
          // Add to results
          lowStockItems.push({
            item,
            currentStock,
            lastPurchaseDate,
            lastPurchaseId,
            stockLevel: this.getStockLevel(currentStock, item.minQuantity)
          });
        }
      }
      
      // Sort by stock level (most critical first)
      return lowStockItems.sort((a, b) => {
        const levelOrder = { 'out_of_stock': 0, 'critical': 1, 'low': 2, 'normal': 3 };
        return levelOrder[a.stockLevel] - levelOrder[b.stockLevel];
      });
    } catch (error) {
      console.error(`Error getting low stock items for supplier ${supplierId}:`, error);
      return [];
    }
  },
  
  // Get all low stock items grouped by their suppliers
  async getAllLowStockItemsBySupplier(): Promise<SupplierWithLowStockItems[]> {
    try {
      // Get all suppliers, inventory items, and purchases
      const [allSuppliers, allInventory, allPurchases] = await Promise.all([
        supplierService.getAll(),
        inventoryService.getAll(),
        purchaseService.getAll()
      ]);
      
      // Check which items are below minimum stock
      const lowStockItemIds: string[] = [];
      const stockLevels: Map<string, { currentStock: number, stockLevel: string }> = new Map();
      
      for (const item of allInventory) {
        if (!item.id) continue;
        
        const currentStock = await this.getItemCurrentStock(item.id);
        
        if (currentStock < item.minQuantity) {
          lowStockItemIds.push(item.id);
          stockLevels.set(item.id, {
            currentStock,
            stockLevel: this.getStockLevel(currentStock, item.minQuantity)
          });
        }
      }
      
      if (lowStockItemIds.length === 0) {
        return [];
      }
      
      // Build a mapping of items to their most recent supplier
      const itemToSupplierMap = new Map<string, { 
        supplierId: string, 
        lastPurchaseDate: Date,
        lastPurchaseId: string | null
      }>();
      
      // Process all purchases to find the most recent supplier for each low stock item
      allPurchases.forEach(purchase => {
        purchase.items.forEach(purchaseItem => {
          if (lowStockItemIds.includes(purchaseItem.itemId)) {
            const currentMapping = itemToSupplierMap.get(purchaseItem.itemId);
            
            // If we haven't seen this item yet, or this purchase is more recent
            if (!currentMapping || purchase.purchaseDate > currentMapping.lastPurchaseDate) {
              itemToSupplierMap.set(purchaseItem.itemId, {
                supplierId: purchase.supplierId,
                lastPurchaseDate: purchase.purchaseDate,
                lastPurchaseId: purchase.id || null
              });
            }
          }
        });
      });
      
      // Group low stock items by supplier
      const supplierMap = new Map<string, SupplierWithLowStockItems>();
      
      for (const itemId of lowStockItemIds) {
        const supplierInfo = itemToSupplierMap.get(itemId);
        
        if (!supplierInfo) {
          continue; // Skip if no supplier found
        }
        
        const { supplierId, lastPurchaseDate, lastPurchaseId } = supplierInfo;
        
        // Find the supplier
        const supplier = allSuppliers.find(s => s.id === supplierId);
        if (!supplier) continue;
        
        // Find the item
        const item = allInventory.find(i => i.id === itemId);
        if (!item) continue;
        
        // Get stock info for this item
        const stockInfo = stockLevels.get(itemId);
        if (!stockInfo) continue;
        
        // Get or create entry for this supplier
        if (!supplierMap.has(supplierId)) {
          supplierMap.set(supplierId, {
            supplier,
            lowStockItems: [],
            totalItems: 0
          });
        }
        
        // Add this item to the supplier's list
        const supplierData = supplierMap.get(supplierId);
        if (supplierData) {
          supplierData.lowStockItems.push({
            item,
            currentStock: stockInfo.currentStock,
            lastPurchaseDate,
            lastPurchaseId,
            stockLevel: stockInfo.stockLevel as 'out_of_stock' | 'critical' | 'low' | 'normal'
          });
          supplierData.totalItems += 1;
        }
      }
      
      // Convert map to array and sort by most critical items first
      return Array.from(supplierMap.values())
        .filter(data => data.lowStockItems.length > 0)
        .map(data => {
          // Sort items by stock level
          data.lowStockItems.sort((a, b) => {
            const levelOrder = { 'out_of_stock': 0, 'critical': 1, 'low': 2, 'normal': 3 };
            return levelOrder[a.stockLevel] - levelOrder[b.stockLevel];
          });
          return data;
        })
        .sort((a, b) => {
          // Count critical items for each supplier
          const aCritical = a.lowStockItems.filter(
            item => item.stockLevel === 'out_of_stock' || item.stockLevel === 'critical'
          ).length;
          
          const bCritical = b.lowStockItems.filter(
            item => item.stockLevel === 'out_of_stock' || item.stockLevel === 'critical'
          ).length;
          
          // Sort by critical items count first, then by total items
          if (aCritical !== bCritical) {
            return bCritical - aCritical;
          }
          
          return b.totalItems - a.totalItems;
        });
    } catch (error) {
      console.error('Error getting low stock items by supplier:', error);
      return [];
    }
  }
};