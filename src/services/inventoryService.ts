// src/services/inventoryService.ts

import { database } from '@/lib/firebase';
import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { InventoryItem } from '@/types/inventory';
import { categoryService } from './categoryService';
import { purchaseService } from './purchaseService';

import { counterService } from './counterService';

const COLLECTION = 'inventory';
const BATCHES_PATH = 'batches';

// Helper function to delete all batches for an item
async function deleteBatchesByItemId(itemId: string): Promise<void> {
  const batchesRef = ref(database, BATCHES_PATH);
  const batchQuery = query(batchesRef, orderByChild('itemId'), equalTo(itemId));
  const batchSnapshot = await get(batchQuery);
  
  if (batchSnapshot.exists()) {
    const deletePromises: Promise<void>[] = [];
    batchSnapshot.forEach((childSnapshot) => {
      const batchRef = ref(database, `${BATCHES_PATH}/${childSnapshot.key}`);
      deletePromises.push(remove(batchRef));
    });
    await Promise.all(deletePromises);
  }
}

// Helper function to create a batch from inventory data
async function createBatchFromInventory(
  itemId: string,
  quantity: number,
  costPrice: number,
  sellingPrice: number
): Promise<void> {
  const now = Date.now();
  
  // Get next batch number for this item
  const batchNumber = await purchaseService.getNextBatchNumber(itemId);
  
  // Set default expiry date to 2 years from now (or a reasonable default)
  const defaultExpiryDate = new Date();
  defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 2);
  
  const batchData = {
    batchNumber: batchNumber,
    itemId: itemId,
    quantity: quantity,
    expiryDate: defaultExpiryDate.getTime(),
    costPrice: costPrice,
    unitPrice: sellingPrice,
    supplierId: null,
    createdAt: now,
    updatedAt: now
  };
  
  const batchesRef = ref(database, BATCHES_PATH);
  const newBatchRef = push(batchesRef);
  await set(newBatchRef, batchData);
}

export const inventoryService = {
  async create(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now();

     
    // Auto-generate code if not provided
    // let itemCode = item.code;
    // if (!itemCode || itemCode.trim() === '') {
    //   itemCode = await counterService.generateCode('inventory', '', 4);
      
    //   // Ensure code is unique - in the rare case of a collision, try again
    //   while (await counterService.codeExists(COLLECTION, itemCode)) {
    //     itemCode = await counterService.generateCode('inventory', '', 4);
    //   }
    // } else {
    //   // Check if the provided code already exists
    //   const codeExists = await counterService.codeExists(COLLECTION, itemCode);
    //   if (codeExists) {
    //     throw new Error('Item code already exists. Please use a different code.');
    //   }
    // }

    // Auto-generate code if not provided
    let itemCode = item.code;
    if (!itemCode || itemCode.trim() === '') {
      itemCode = await counterService.generateCode('inventory', '', 4);
      
      // Ensure code is unique - in the rare case of a collision, try again
      while (await counterService.codeExists(COLLECTION, itemCode)) {
        itemCode = await counterService.generateCode('inventory', '', 4);
      }
    } else {
      // Check if the provided code already exists
      const codeExists = await counterService.codeExists(COLLECTION, itemCode);
      if (codeExists) {
        throw new Error('Item code already exists. Please use a different code.');
      }
    }

    const docData: any = {
      code: itemCode,
      name: item.name,
      genericName: item.genericName,
      minQuantity: item.minQuantity,
      createdAt: now,
      updatedAt: now,
      hasUnitContains: item.hasUnitContains || false
    };

    // Add type if provided
    if (item.type) {
      docData.type = item.type;
    }

    // Add category information if provided
    if (item.categoryId) {
      docData.categoryId = item.categoryId;
      docData.categoryName = item.categoryName || '';
    }

    // Only include unitContains if it exists
    if (item.hasUnitContains && item.unitContains) {
      docData.unitContains = item.unitContains;
    }

    // Add new optional fields if provided
    if (item.brand !== undefined && item.brand.trim() !== '') {
      docData.brand = item.brand.trim();
    }
    if (item.supplier !== undefined && item.supplier.trim() !== '') {
      docData.supplier = item.supplier.trim();
    }
    if (item.costPrice !== undefined && item.costPrice !== null) {
      docData.costPrice = item.costPrice;
    }
    if (item.sellingPrice !== undefined && item.sellingPrice !== null) {
      docData.sellingPrice = item.sellingPrice;
    }
    if (item.currentStock !== undefined && item.currentStock !== null) {
      docData.currentStock = item.currentStock;
    }

    // Generate a new key and set the data
    const newItemRef = push(ref(database, COLLECTION));
    await set(newItemRef, docData);
    
    const itemId = newItemRef.key;
    
    // If currentStock, costPrice, and sellingPrice are provided, handle batch creation
    if (itemId && 
        item.currentStock !== undefined && item.currentStock !== null && item.currentStock > 0 &&
        item.costPrice !== undefined && item.costPrice !== null &&
        item.sellingPrice !== undefined && item.sellingPrice !== null) {
      try {
        // Delete all existing batches for this item
        await deleteBatchesByItemId(itemId);
        
        // Create a new batch with the provided stock and prices
        await createBatchFromInventory(
          itemId,
          item.currentStock,
          item.costPrice,
          item.sellingPrice
        );
      } catch (error) {
        console.error("Error managing batches for new item:", error);
        // Don't throw error - item is already created, just log the batch issue
        // The user can manually create batches if needed
      }
    }
    
    return newItemRef;
  },

  async update(id: string, item: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>) {
    const itemRef = ref(database, `${COLLECTION}/${id}`);

      // If updating the code, check if it already exists for another item
      if (item.code !== undefined) {
        // Get current item to check if code is actually changing
        const currentSnapshot = await get(itemRef);
        const currentItem = currentSnapshot.val();
        
        if (currentItem.code !== item.code) {
          const codeExists = await counterService.codeExists(COLLECTION, item.code);
          if (codeExists) {
            throw new Error('Item code already exists. Please use a different code.');
          }
        }
      }

    const updateData: any = {
      updatedAt: Date.now()
    };

    // Only update fields that were provided
    if (item.code !== undefined) updateData.code = item.code;
    if (item.name !== undefined) updateData.name = item.name;
    if (item.genericName !== undefined) updateData.genericName = item.genericName;
    if (item.type !== undefined) updateData.type = item.type;
    if (item.minQuantity !== undefined) updateData.minQuantity = item.minQuantity;
    
    // Update category information
    if (item.categoryId !== undefined) {
      updateData.categoryId = item.categoryId;
      // Remove category if empty string or null
      if (!item.categoryId) {
        updateData.categoryName = null;
      } else if (item.categoryName !== undefined) {
        updateData.categoryName = item.categoryName;
      }
    }

    // Update hasUnitContains if provided
    if (item.hasUnitContains !== undefined) {
      updateData.hasUnitContains = item.hasUnitContains;
    }

    // Handle unitContains updates
    if (item.hasUnitContains && item.unitContains) {
      updateData.unitContains = item.unitContains;
    } else if (item.hasUnitContains === false) {
      // Remove unitContains field by setting to null
      updateData.unitContains = null;
    }

    // Update new optional fields if provided
    if (item.brand !== undefined) {
      updateData.brand = item.brand.trim() || null;
    }
    if (item.supplier !== undefined) {
      updateData.supplier = item.supplier.trim() || null;
    }
    if (item.costPrice !== undefined) {
      updateData.costPrice = item.costPrice || null;
    }
    if (item.sellingPrice !== undefined) {
      updateData.sellingPrice = item.sellingPrice || null;
    }
    if (item.currentStock !== undefined) {
      updateData.currentStock = item.currentStock || null;
    }

    await update(itemRef, updateData);

    // If currentStock, costPrice, and sellingPrice are provided, handle batch creation/deletion
    // This only applies when updating via inventory section (not purchases)
    if (item.currentStock !== undefined && item.currentStock !== null && item.currentStock > 0 &&
        item.costPrice !== undefined && item.costPrice !== null &&
        item.sellingPrice !== undefined && item.sellingPrice !== null) {
      try {
        // Delete all existing batches for this item
        await deleteBatchesByItemId(id);
        
        // Create a new batch with the provided stock and prices
        await createBatchFromInventory(
          id,
          item.currentStock,
          item.costPrice,
          item.sellingPrice
        );
      } catch (error) {
        console.error("Error managing batches for updated item:", error);
        // Don't throw error - item is already updated, just log the batch issue
      }
    }

    return;
  },

  async delete(id: string) {
    // Check if any batches reference this item
    const batchesRef = ref(database, 'batches');
    const batchQuery = query(batchesRef, orderByChild('itemId'), equalTo(id));
    const batchSnapshot = await get(batchQuery);
    
    if (batchSnapshot.exists()) {
      throw new Error('Cannot delete item with existing batches. Please delete all batches first.');
    }
    
    // Delete the item
    const itemRef = ref(database, `${COLLECTION}/${id}`);
    return remove(itemRef);
  },

  async getAll() {
    const inventoryRef = ref(database, COLLECTION);
    const snapshot = await get(inventoryRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const items: InventoryItem[] = [];
    
    // Convert the snapshot to array of items
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      items.push({
        id: childSnapshot.key,
        code: data.code || '',
        name: data.name || '',
        genericName: data.genericName || '',
        type: data.type || '',
        categoryId: data.categoryId || '',
        categoryName: data.categoryName || '',
        hasUnitContains: data.hasUnitContains || false,
        unitContains: data.unitContains || null,
        minQuantity: data.minQuantity || 0,
        brand: data.brand || undefined,
        supplier: data.supplier || undefined,
        costPrice: data.costPrice !== undefined ? data.costPrice : undefined,
        sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : undefined,
        currentStock: data.currentStock !== undefined ? data.currentStock : undefined,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Enhance items with category colors for display purposes
    const categoryIds = items
      .filter(item => item.categoryId)
      .map(item => item.categoryId as string);
      
    if (categoryIds.length > 0) {
      try {
        // Get all categories at once for better performance
        const categories = await categoryService.getAll();
        
        // Add category colors to items
        for (const item of items) {
          if (item.categoryId) {
            const category = categories.find(c => c.id === item.categoryId);
            if (category) {
              // Add color as a property for UI display purposes
              (item as any).categoryColor = category.color;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching category colors:", error);
        // Continue without colors if there's an error
      }
    }
    
    return items;
  },
  
  async getById(id: string) {
    const itemRef = ref(database, `${COLLECTION}/${id}`);
    const snapshot = await get(itemRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    const item: InventoryItem = {
      id: snapshot.key,
      code: data.code || '',
      name: data.name || '',
      genericName: data.genericName || '',
      type: data.type || '',
      categoryId: data.categoryId || '',
      categoryName: data.categoryName || '',
      hasUnitContains: data.hasUnitContains || false,
      unitContains: data.unitContains || null,
      minQuantity: data.minQuantity || 0,
      brand: data.brand || undefined,
      supplier: data.supplier || undefined,
      costPrice: data.costPrice !== undefined ? data.costPrice : undefined,
      sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : undefined,
      currentStock: data.currentStock !== undefined ? data.currentStock : undefined,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
    
    // Add category color if there's a categoryId
    if (item.categoryId) {
      try {
        const category = await categoryService.getById(item.categoryId);
        if (category) {
          (item as any).categoryColor = category.color;
        }
      } catch (error) {
        console.error("Error fetching category color:", error);
      }
    }
    
    return item;
  },
  
  async getByCategory(categoryId: string) {
    const inventoryRef = ref(database, COLLECTION);
    const categoryQuery = query(inventoryRef, orderByChild('categoryId'), equalTo(categoryId));
    const snapshot = await get(categoryQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const items: InventoryItem[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      items.push({
        id: childSnapshot.key,
        code: data.code || '',
        name: data.name || '',
        genericName: data.genericName || '',
        type: data.type || '',
        categoryId: data.categoryId || '',
        categoryName: data.categoryName || '',
        hasUnitContains: data.hasUnitContains || false,
        unitContains: data.unitContains || null,
        minQuantity: data.minQuantity || 0,
        brand: data.brand || undefined,
        supplier: data.supplier || undefined,
        costPrice: data.costPrice !== undefined ? data.costPrice : undefined,
        sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : undefined,
        currentStock: data.currentStock !== undefined ? data.currentStock : undefined,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    return items;
  },
  
  async countByCategory(categoryId: string) {
    const inventoryRef = ref(database, COLLECTION);
    const categoryQuery = query(inventoryRef, orderByChild('categoryId'), equalTo(categoryId));
    const snapshot = await get(categoryQuery);
    
    let count = 0;
    snapshot.forEach(() => {
      count++;
    });
    
    return count;
  }
};