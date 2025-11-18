// // src/services/stockAdjustmentService.ts

// import { database } from '@/lib/firebase';
// import { ref, push, set, get, query, orderByChild, equalTo, update, orderByKey, limitToLast, remove } from 'firebase/database';
// import { StockAdjustment, StockAdjustmentWithDetails, AdjustmentSummary } from '@/types/stockAdjustment';
// import { BatchWithDetails } from '@/types/purchase';
// import { InventoryItem } from '@/types/inventory';
// import { purchaseService } from './purchaseService';
// import { inventoryService } from './inventoryService';

// const ADJUSTMENTS_PATH = 'stock_adjustments';
// const BATCHES_PATH = 'batches';

// export const stockAdjustmentService = {
  
//   // Create a new stock adjustment
//   async createAdjustment(adjustment: Omit<StockAdjustment, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string }> {
//     try {
//       const now = Date.now();
      
//       // Validate the adjustment
//       if (adjustment.quantity <= 0) {
//         throw new Error('Adjustment quantity must be greater than 0');
//       }
      
//       // If decreasing, ensure we don't go below 0
//       if (adjustment.adjustmentType === 'decrease' && adjustment.newQuantity < 0) {
//         throw new Error('Cannot decrease quantity below 0');
//       }
      
//       // Prepare adjustment data
//       const adjustmentData = {
//         ...adjustment,
//         adjustmentDate: adjustment.adjustmentDate.getTime(),
//         expiryDate: adjustment.expiryDate ? adjustment.expiryDate.getTime() : null,
//         createdAt: now,
//         updatedAt: now
//       };
      
//       // Create adjustment record
//       const adjustmentsRef = ref(database, ADJUSTMENTS_PATH);
//       const newAdjustmentRef = push(adjustmentsRef);
//       const adjustmentId = newAdjustmentRef.key!;
      
//       await set(newAdjustmentRef, adjustmentData);
      
//       // Update or create batch
//       if (adjustment.batchId) {
//         // Update existing batch
//         const batchRef = ref(database, `${BATCHES_PATH}/${adjustment.batchId}`);
//         await update(batchRef, {
//           quantity: adjustment.newQuantity,
//           updatedAt: now
//         });
//       } else {
//         // Create new batch (when adding stock to item with no batches)
//         const batchesRef = ref(database, BATCHES_PATH);
//         const newBatchRef = push(batchesRef);
        
//         // Generate batch number
//         const batchNumber = await this.generateBatchNumber(adjustment.itemId);
        
//         await set(newBatchRef, {
//           batchNumber: batchNumber,
//           itemId: adjustment.itemId,
//           quantity: adjustment.newQuantity,
//           expiryDate: adjustment.expiryDate ? adjustment.expiryDate.getTime() : null,
//           costPrice: adjustment.costPrice || 0,
//           unitPrice: adjustment.unitPrice || 0,
//           supplierId: adjustment.supplierId || null,
//           purchaseId: null, // This is an adjustment, not a purchase
//           isAdjustment: true, // Flag to indicate this batch was created via adjustment
//           createdAt: now,
//           updatedAt: now
//         });
//       }
      
//       // Clear purchase service cache for this item
//       purchaseService.clearItemBatchCache(adjustment.itemId);
      
//       return { id: adjustmentId };
//     } catch (error) {
//       console.error('Error creating stock adjustment:', error);
//       throw error;
//     }
//   },
  
//   // Generate batch number for new batches
//   async generateBatchNumber(itemId: string): Promise<string> {
//     try {
//       const batchesRef = ref(database, BATCHES_PATH);
//       const itemBatchesQuery = query(
//         batchesRef,
//         orderByChild('itemId'),
//         equalTo(itemId)
//       );
      
//       const snapshot = await get(itemBatchesQuery);
      
//       if (!snapshot.exists()) {
//         return 'ADJ001';
//       }
      
//       const batchNumbers: number[] = [];
//       snapshot.forEach((childSnapshot) => {
//         const batchNumber = childSnapshot.val().batchNumber;
//         if (typeof batchNumber === 'string') {
//           // Extract number from batch number (e.g., "ADJ001" -> 1, "001" -> 1)
//           const match = batchNumber.match(/(\d+)$/);
//           if (match) {
//             batchNumbers.push(parseInt(match[1]));
//           }
//         }
//       });
      
//       const maxBatchNumber = Math.max(...batchNumbers, 0);
//       return `ADJ${(maxBatchNumber + 1).toString().padStart(3, '0')}`;
//     } catch (error) {
//       console.error('Error generating batch number:', error);
//       return `ADJ${Date.now().toString().slice(-3)}`;
//     }
//   },
  
//   // Get all adjustments with pagination
//   async getAdjustments(limit?: number): Promise<StockAdjustmentWithDetails[]> {
//     try {
//       const adjustmentsRef = ref(database, ADJUSTMENTS_PATH);
//       const adjustmentsQuery = limit 
//         ? query(adjustmentsRef, orderByKey(), limitToLast(limit))
//         : query(adjustmentsRef, orderByKey());
        
//       const snapshot = await get(adjustmentsQuery);
      
//       if (!snapshot.exists()) {
//         return [];
//       }
      
//       const adjustments: StockAdjustmentWithDetails[] = [];
//       const promises: Promise<StockAdjustmentWithDetails | null>[] = [];
      
//       snapshot.forEach((childSnapshot) => {
//         const adjustmentId = childSnapshot.key;
//         const data = childSnapshot.val();
        
//         if (!data) return;
        
//         const promise = this.enrichAdjustmentData(adjustmentId!, data);
//         promises.push(promise);
//       });
      
//       const results = await Promise.all(promises);
//       results.forEach(result => {
//         if (result) {
//           adjustments.push(result);
//         }
//       });
      
//       // Sort by adjustment date (newest first)
//       return adjustments.sort((a, b) => 
//         new Date(b.adjustmentDate).getTime() - new Date(a.adjustmentDate).getTime()
//       );
//     } catch (error) {
//       console.error('Error getting adjustments:', error);
//       throw error;
//     }
//   },
  
//   // Get adjustments for a specific item
//   async getAdjustmentsByItem(itemId: string): Promise<StockAdjustmentWithDetails[]> {
//     try {
//       const adjustmentsRef = ref(database, ADJUSTMENTS_PATH);
//       const itemAdjustmentsQuery = query(
//         adjustmentsRef,
//         orderByChild('itemId'),
//         equalTo(itemId)
//       );
      
//       const snapshot = await get(itemAdjustmentsQuery);
      
//       if (!snapshot.exists()) {
//         return [];
//       }
      
//       const adjustments: StockAdjustmentWithDetails[] = [];
//       const promises: Promise<StockAdjustmentWithDetails | null>[] = [];
      
//       snapshot.forEach((childSnapshot) => {
//         const adjustmentId = childSnapshot.key;
//         const data = childSnapshot.val();
        
//         if (!data) return;
        
//         const promise = this.enrichAdjustmentData(adjustmentId!, data);
//         promises.push(promise);
//       });
      
//       const results = await Promise.all(promises);
//       results.forEach(result => {
//         if (result) {
//           adjustments.push(result);
//         }
//       });
      
//       // Sort by adjustment date (newest first)
//       return adjustments.sort((a, b) => 
//         new Date(b.adjustmentDate).getTime() - new Date(a.adjustmentDate).getTime()
//       );
//     } catch (error) {
//       console.error('Error getting adjustments by item:', error);
//       throw error;
//     }
//   },
  
//   // Enrich adjustment data with item and batch details
//   async enrichAdjustmentData(adjustmentId: string, data: any): Promise<StockAdjustmentWithDetails | null> {
//     try {
//       // Get item details
//       const item = await inventoryService.getById(data.itemId);
//       if (!item) {
//         console.warn(`Item not found for adjustment ${adjustmentId}`);
//         return null;
//       }
      
//       // Get batch details if batch ID exists
//       let batch = undefined;
//       if (data.batchId) {
//         const batchRef = ref(database, `${BATCHES_PATH}/${data.batchId}`);
//         const batchSnapshot = await get(batchRef);
//         if (batchSnapshot.exists()) {
//           batch = {
//             id: batchSnapshot.key!,
//             ...batchSnapshot.val(),
//             expiryDate: new Date(batchSnapshot.val().expiryDate)
//           };
//         }
//       }
      
//       const adjustment: StockAdjustmentWithDetails = {
//         id: adjustmentId,
//         ...data,
//         adjustmentDate: new Date(data.adjustmentDate),
//         expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
//         createdAt: new Date(data.createdAt),
//         updatedAt: new Date(data.updatedAt),
//         item: {
//           id: item.id!,
//           name: item.name,
//           code: item.code,
//           type: item.type,
//           categoryName: item.categoryName,
//           unitContains: item.unitContains
//         },
//         batch
//       };
      
//       return adjustment;
//     } catch (error) {
//       console.error(`Error enriching adjustment data for ${adjustmentId}:`, error);
//       return null;
//     }
//   },
  
//   // Get adjustment summary
//   async getAdjustmentSummary(days?: number): Promise<AdjustmentSummary> {
//     try {
//       const adjustments = await this.getAdjustments(100); // Get last 100 adjustments
      
//       let filteredAdjustments = adjustments;
      
//       // Filter by date range if specified
//       if (days) {
//         const cutoffDate = new Date();
//         cutoffDate.setDate(cutoffDate.getDate() - days);
        
//         filteredAdjustments = adjustments.filter(adj => 
//           new Date(adj.adjustmentDate) >= cutoffDate
//         );
//       }
      
//       const summary: AdjustmentSummary = {
//         totalAdjustments: filteredAdjustments.length,
//         totalIncreases: filteredAdjustments.filter(adj => adj.adjustmentType === 'increase').length,
//         totalDecreases: filteredAdjustments.filter(adj => adj.adjustmentType === 'decrease').length,
//         recentAdjustments: adjustments.slice(0, 10) // Most recent 10
//       };
      
//       return summary;
//     } catch (error) {
//       console.error('Error getting adjustment summary:', error);
//       throw error;
//     }
//   },
  
//   // Delete an adjustment (admin only)
//   async deleteAdjustment(adjustmentId: string): Promise<void> {
//     try {
//       const adjustmentRef = ref(database, `${ADJUSTMENTS_PATH}/${adjustmentId}`);
//       const snapshot = await get(adjustmentRef);
      
//       if (!snapshot.exists()) {
//         throw new Error('Adjustment not found');
//       }
      
//       // Note: This is a simple delete. In a production system, you might want to
//       // implement a reversal system instead of direct deletion to maintain audit trail
      
//       await adjustmentRef.remove();
//     } catch (error) {
//       console.error('Error deleting adjustment:', error);
//       throw error;
//     }
//   }
// };

// src/services/stockAdjustmentService.ts

import { database } from '@/lib/firebase';
import { ref, push, set, get, query, orderByChild, equalTo, update, orderByKey, limitToLast, remove } from 'firebase/database';
import { StockAdjustment, StockAdjustmentWithDetails, AdjustmentSummary } from '@/types/stockAdjustment';
import { BatchWithDetails } from '@/types/purchase';
import { InventoryItem } from '@/types/inventory';
import { purchaseService } from './purchaseService';
import { inventoryService } from './inventoryService';

const ADJUSTMENTS_PATH = 'stock_adjustments';
const BATCHES_PATH = 'batches';

// Helper function to sanitize data for Firebase
function sanitizeForFirebase(data: any): any {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (data instanceof Date) {
    return data.getTime();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirebase(item));
  }
  
  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Convert undefined to null, keep everything else
      sanitized[key] = value === undefined ? null : sanitizeForFirebase(value);
    }
    return sanitized;
  }
  
  return data;
}

export const stockAdjustmentService = {
  
  // Create a new stock adjustment
  async createAdjustment(adjustment: Omit<StockAdjustment, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string }> {
    try {
      const now = Date.now();
      
      // Validate the adjustment
      if (adjustment.quantity <= 0) {
        throw new Error('Adjustment quantity must be greater than 0');
      }
      
      // If decreasing, ensure we don't go below 0
      if (adjustment.adjustmentType === 'decrease' && adjustment.newQuantity < 0) {
        throw new Error('Cannot decrease quantity below 0');
      }
      
      // Prepare adjustment data with proper sanitization
      const adjustmentData = sanitizeForFirebase({
        itemId: adjustment.itemId,
        itemName: adjustment.itemName,
        itemCode: adjustment.itemCode,
        batchId: adjustment.batchId || null,
        batchNumber: adjustment.batchNumber || null,
        adjustmentType: adjustment.adjustmentType,
        quantity: adjustment.quantity,
        reason: adjustment.reason,
        notes: adjustment.notes || null, // Explicitly convert empty string/undefined to null
        
        // Before and after quantities
        previousQuantity: adjustment.previousQuantity,
        newQuantity: adjustment.newQuantity,
        
        // Batch details
        expiryDate: adjustment.expiryDate ? adjustment.expiryDate.getTime() : null,
        costPrice: adjustment.costPrice || null,
        unitPrice: adjustment.unitPrice || null,
        supplierId: adjustment.supplierId || null,
        
        // User information
        adjustedByUid: adjustment.adjustedByUid,
        adjustedByName: adjustment.adjustedByName,
        adjustedByEmail: adjustment.adjustedByEmail || null,
        adjustedByRole: adjustment.adjustedByRole || null,
        
        // Timestamps
        adjustmentDate: adjustment.adjustmentDate.getTime(),
        createdAt: now,
        updatedAt: now
      });
      
      // Create adjustment record
      const adjustmentsRef = ref(database, ADJUSTMENTS_PATH);
      const newAdjustmentRef = push(adjustmentsRef);
      const adjustmentId = newAdjustmentRef.key!;
      
      await set(newAdjustmentRef, adjustmentData);
      
      // Update or create batch
      if (adjustment.batchId) {
        // Update existing batch
        const batchRef = ref(database, `${BATCHES_PATH}/${adjustment.batchId}`);
        await update(batchRef, {
          quantity: adjustment.newQuantity,
          updatedAt: now
        });
      } else {
        // Create new batch (when adding stock to item with no batches)
        const batchesRef = ref(database, BATCHES_PATH);
        const newBatchRef = push(batchesRef);
        
        // Generate batch number
        const batchNumber = await this.generateBatchNumber(adjustment.itemId);
        
        const newBatchData = sanitizeForFirebase({
          batchNumber: batchNumber,
          itemId: adjustment.itemId,
          quantity: adjustment.newQuantity,
          expiryDate: adjustment.expiryDate ? adjustment.expiryDate.getTime() : null,
          costPrice: adjustment.costPrice || 0,
          unitPrice: adjustment.unitPrice || 0,
          supplierId: adjustment.supplierId || null,
          purchaseId: null, // This is an adjustment, not a purchase
          isAdjustment: true, // Flag to indicate this batch was created via adjustment
          createdAt: now,
          updatedAt: now
        });
        
        await set(newBatchRef, newBatchData);
      }
      
      // Clear purchase service cache for this item
      purchaseService.clearItemBatchCache(adjustment.itemId);
      
      return { id: adjustmentId };
    } catch (error) {
      console.error('Error creating stock adjustment:', error);
      throw error;
    }
  },
  
  // Generate batch number for new batches
  async generateBatchNumber(itemId: string): Promise<string> {
    try {
      const batchesRef = ref(database, BATCHES_PATH);
      const itemBatchesQuery = query(
        batchesRef,
        orderByChild('itemId'),
        equalTo(itemId)
      );
      
      const snapshot = await get(itemBatchesQuery);
      
      if (!snapshot.exists()) {
        return 'ADJ001';
      }
      
      const batchNumbers: number[] = [];
      snapshot.forEach((childSnapshot) => {
        const batchNumber = childSnapshot.val().batchNumber;
        if (typeof batchNumber === 'string') {
          // Extract number from batch number (e.g., "ADJ001" -> 1, "001" -> 1)
          const match = batchNumber.match(/(\d+)$/);
          if (match) {
            batchNumbers.push(parseInt(match[1]));
          }
        }
      });
      
      const maxBatchNumber = Math.max(...batchNumbers, 0);
      return `ADJ${(maxBatchNumber + 1).toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating batch number:', error);
      return `ADJ${Date.now().toString().slice(-3)}`;
    }
  },
  
  // Get all adjustments with pagination
  async getAdjustments(limit?: number): Promise<StockAdjustmentWithDetails[]> {
    try {
      const adjustmentsRef = ref(database, ADJUSTMENTS_PATH);
      const adjustmentsQuery = limit 
        ? query(adjustmentsRef, orderByKey(), limitToLast(limit))
        : query(adjustmentsRef, orderByKey());
        
      const snapshot = await get(adjustmentsQuery);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const adjustments: StockAdjustmentWithDetails[] = [];
      const promises: Promise<StockAdjustmentWithDetails | null>[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const adjustmentId = childSnapshot.key;
        const data = childSnapshot.val();
        
        if (!data) return;
        
        const promise = this.enrichAdjustmentData(adjustmentId!, data);
        promises.push(promise);
      });
      
      const results = await Promise.all(promises);
      results.forEach(result => {
        if (result) {
          adjustments.push(result);
        }
      });
      
      // Sort by adjustment date (newest first)
      return adjustments.sort((a, b) => 
        new Date(b.adjustmentDate).getTime() - new Date(a.adjustmentDate).getTime()
      );
    } catch (error) {
      console.error('Error getting adjustments:', error);
      throw error;
    }
  },
  
  // Get adjustments for a specific item
  async getAdjustmentsByItem(itemId: string): Promise<StockAdjustmentWithDetails[]> {
    try {
      const adjustmentsRef = ref(database, ADJUSTMENTS_PATH);
      const itemAdjustmentsQuery = query(
        adjustmentsRef,
        orderByChild('itemId'),
        equalTo(itemId)
      );
      
      const snapshot = await get(itemAdjustmentsQuery);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const adjustments: StockAdjustmentWithDetails[] = [];
      const promises: Promise<StockAdjustmentWithDetails | null>[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const adjustmentId = childSnapshot.key;
        const data = childSnapshot.val();
        
        if (!data) return;
        
        const promise = this.enrichAdjustmentData(adjustmentId!, data);
        promises.push(promise);
      });
      
      const results = await Promise.all(promises);
      results.forEach(result => {
        if (result) {
          adjustments.push(result);
        }
      });
      
      // Sort by adjustment date (newest first)
      return adjustments.sort((a, b) => 
        new Date(b.adjustmentDate).getTime() - new Date(a.adjustmentDate).getTime()
      );
    } catch (error) {
      console.error('Error getting adjustments by item:', error);
      throw error;
    }
  },
  
  // Enrich adjustment data with item and batch details
  async enrichAdjustmentData(adjustmentId: string, data: any): Promise<StockAdjustmentWithDetails | null> {
    try {
      // Get item details
      const item = await inventoryService.getById(data.itemId);
      if (!item) {
        console.warn(`Item not found for adjustment ${adjustmentId}`);
        return null;
      }
      
      // Get batch details if batch ID exists
      let batch = undefined;
      if (data.batchId) {
        const batchRef = ref(database, `${BATCHES_PATH}/${data.batchId}`);
        const batchSnapshot = await get(batchRef);
        if (batchSnapshot.exists()) {
          batch = {
            id: batchSnapshot.key!,
            ...batchSnapshot.val(),
            expiryDate: new Date(batchSnapshot.val().expiryDate || Date.now())
          };
        }
      }
      
      const adjustment: StockAdjustmentWithDetails = {
        id: adjustmentId,
        itemId: data.itemId,
        itemName: data.itemName,
        itemCode: data.itemCode,
        batchId: data.batchId || undefined,
        batchNumber: data.batchNumber || undefined,
        adjustmentType: data.adjustmentType,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes || undefined,
        previousQuantity: data.previousQuantity,
        newQuantity: data.newQuantity,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        costPrice: data.costPrice || undefined,
        unitPrice: data.unitPrice || undefined,
        supplierId: data.supplierId || undefined,
        adjustedByUid: data.adjustedByUid,
        adjustedByName: data.adjustedByName,
        adjustedByEmail: data.adjustedByEmail || undefined,
        adjustedByRole: data.adjustedByRole || undefined,
        adjustmentDate: new Date(data.adjustmentDate),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        item: {
          id: item.id!,
          name: item.name,
          code: item.code,
          type: item.type,
          categoryName: item.categoryName,
          unitContains: item.unitContains
        },
        batch
      };
      
      return adjustment;
    } catch (error) {
      console.error(`Error enriching adjustment data for ${adjustmentId}:`, error);
      return null;
    }
  },
  
  // Get adjustment summary
  async getAdjustmentSummary(days?: number): Promise<AdjustmentSummary> {
    try {
      const adjustments = await this.getAdjustments(100); // Get last 100 adjustments
      
      let filteredAdjustments = adjustments;
      
      // Filter by date range if specified
      if (days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        filteredAdjustments = adjustments.filter(adj => 
          new Date(adj.adjustmentDate) >= cutoffDate
        );
      }
      
      const summary: AdjustmentSummary = {
        totalAdjustments: filteredAdjustments.length,
        totalIncreases: filteredAdjustments.filter(adj => adj.adjustmentType === 'increase').length,
        totalDecreases: filteredAdjustments.filter(adj => adj.adjustmentType === 'decrease').length,
        recentAdjustments: adjustments.slice(0, 10) // Most recent 10
      };
      
      return summary;
    } catch (error) {
      console.error('Error getting adjustment summary:', error);
      throw error;
    }
  },
  
  // Delete an adjustment (admin only)
  async deleteAdjustment(adjustmentId: string): Promise<void> {
    try {
      const adjustmentRef = ref(database, `${ADJUSTMENTS_PATH}/${adjustmentId}`);
      const snapshot = await get(adjustmentRef);
      
      if (!snapshot.exists()) {
        throw new Error('Adjustment not found');
      }
      
      // Note: This is a simple delete. In a production system, you might want to
      // implement a reversal system instead of direct deletion to maintain audit trail
      
      await remove(adjustmentRef);
    } catch (error) {
      console.error('Error deleting adjustment:', error);
      throw error;
    }
  }
};