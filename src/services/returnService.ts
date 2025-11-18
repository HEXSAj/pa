// src/services/returnService.ts

import { database } from '@/lib/firebase';
import { ref, push, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { Return, ReturnWithDetails } from '@/types/return';
import { InventoryItem } from '@/types/inventory';
import { purchaseService } from './purchaseService';
import { inventoryService } from './inventoryService';

const RETURNS_PATH = 'returns';
const BATCHES_PATH = 'batches';

function sanitizeForRealtimeDB(data: any): any {
  if (data === undefined) {
    return null;
  }
  
  if (data === null || typeof data !== 'object' || data instanceof Date) {
    return data instanceof Date ? data.getTime() : data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForRealtimeDB(item));
  }
  
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = value !== undefined ? sanitizeForRealtimeDB(value) : null;
  }
  
  return sanitized;
}

export const returnService = {
  async getNextBatchNumber(itemId: string): Promise<string> {
    try {
      const batchesRef = ref(database, BATCHES_PATH);
      const queryCriteria = query(
        batchesRef,
        orderByChild('itemId'),
        equalTo(itemId)
      );
      const snapshot = await get(queryCriteria);
      
      if (!snapshot.exists()) {
        return 'RET001';
      }

      const batchNumbers: number[] = [];
      snapshot.forEach((childSnapshot) => {
        const batchNumber = childSnapshot.val().batchNumber;
        if (typeof batchNumber === 'string') {
          // Extract number from batch number (e.g., "RET001" -> 1, "001" -> 1)
          const match = batchNumber.match(/(\d+)$/);
          if (match) {
            batchNumbers.push(parseInt(match[1]));
          }
        }
      });
      
      const maxBatchNumber = Math.max(...batchNumbers, 0);
      return `RET${(maxBatchNumber + 1).toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error getting next batch number:', error);
      throw error;
    }
  },

  async create(returnData: Omit<Return, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string }> {
    try {
      const now = Date.now();
      
      // Prepare return data
      const sanitizedReturnData = sanitizeForRealtimeDB({
        items: returnData.items.map(item => ({
          itemId: item.itemId,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          unitsPerPack: item.unitsPerPack || null,
          totalQuantity: item.totalQuantity,
          expiryDate: item.expiryDate instanceof Date ? item.expiryDate.getTime() : item.expiryDate,
          costPricePerUnit: item.costPricePerUnit,
          sellingPricePerUnit: item.sellingPricePerUnit,
        })),
        returnDate: returnData.returnDate instanceof Date ? returnData.returnDate.getTime() : returnData.returnDate,
        patientDetails: returnData.patientDetails || null,
        notes: returnData.notes || null,
        createdByUid: returnData.createdByUid || null,
        createdByName: returnData.createdByName || null,
        createdByEmail: returnData.createdByEmail || null,
        createdByRole: returnData.createdByRole || null,
        createdAt: now,
        updatedAt: now,
      });

      // Create return record
      const returnsRef = ref(database, RETURNS_PATH);
      const newReturnRef = push(returnsRef);
      const returnId = newReturnRef.key!;
      
      await set(newReturnRef, sanitizedReturnData);

      // Create batches and add to inventory
      const batchesRef = ref(database, BATCHES_PATH);
      
      for (const item of returnData.items) {
        const batchRef = push(batchesRef);
        const batchData = sanitizeForRealtimeDB({
          batchNumber: item.batchNumber,
          itemId: item.itemId,
          quantity: item.totalQuantity,
          expiryDate: item.expiryDate instanceof Date ? item.expiryDate.getTime() : item.expiryDate,
          returnId: returnId,
          costPrice: item.costPricePerUnit,
          unitPrice: item.sellingPricePerUnit,
          isReturn: true, // Flag to indicate this is a return batch
          createdAt: now,
          updatedAt: now
        });
        
        await set(batchRef, batchData);
        const batchId = batchRef.key;
        console.log(`✅ Created return batch ${batchId} for item ${item.itemId}:`, {
          batchNumber: item.batchNumber,
          quantity: item.totalQuantity,
          expiryDate: new Date(item.expiryDate).toISOString(),
          costPrice: item.costPricePerUnit,
          unitPrice: item.sellingPricePerUnit,
          returnId: returnId
        });
        
        // Verify batch was created
        const verifyRef = ref(database, `${BATCHES_PATH}/${batchId}`);
        const verifySnapshot = await get(verifyRef);
        if (verifySnapshot.exists()) {
          console.log(`✅ Verified batch ${batchId} exists in database`);
        } else {
          console.error(`❌ Batch ${batchId} was not found after creation!`);
        }
      }

      // Clear batch cache for affected items and clear entire batch cache to ensure fresh data
      returnData.items.forEach(item => {
        purchaseService.clearItemBatchCache(item.itemId);
      });
      
      // Also clear the entire batch cache to ensure all queries get fresh data
      purchaseService.clearBatchCache();
      
      // Small delay to ensure Firebase has processed the writes
      await new Promise(resolve => setTimeout(resolve, 100));

      return { id: returnId };
    } catch (error) {
      console.error('Error creating return:', error);
      throw error;
    }
  },

  async getAll(): Promise<ReturnWithDetails[]> {
    try {
      const returnsRef = ref(database, RETURNS_PATH);
      const snapshot = await get(returnsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const returns: ReturnWithDetails[] = [];
      const promises: Promise<ReturnWithDetails | null>[] = [];

      snapshot.forEach((childSnapshot) => {
        const returnId = childSnapshot.key;
        const data = childSnapshot.val();
        
        if (!data) return;
        
        const promise = this.enrichReturnData(returnId!, data);
        promises.push(promise);
      });

      const results = await Promise.all(promises);
      results.forEach(result => {
        if (result) {
          returns.push(result);
        }
      });

      // Sort by return date (newest first)
      return returns.sort((a, b) => 
        new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime()
      );
    } catch (error) {
      console.error('Error getting returns:', error);
      throw error;
    }
  },

  async enrichReturnData(returnId: string, data: any): Promise<ReturnWithDetails | null> {
    try {
      const itemsWithDetails = await Promise.all(
        data.items.map(async (item: any) => {
          const inventoryItem = await inventoryService.getById(item.itemId);
          if (!inventoryItem) {
            console.warn(`Item not found for return ${returnId}: ${item.itemId}`);
            return null;
          }
          
          return {
            ...item,
            expiryDate: new Date(item.expiryDate),
            item: inventoryItem
          };
        })
      );

      // Filter out null items
      const validItems = itemsWithDetails.filter(item => item !== null);

      if (validItems.length === 0) {
        console.warn(`No valid items found for return ${returnId}`);
        return null;
      }

      return {
        id: returnId,
        items: validItems,
        returnDate: new Date(data.returnDate),
        patientDetails: data.patientDetails || undefined,
        notes: data.notes || undefined,
        createdByUid: data.createdByUid || undefined,
        createdByName: data.createdByName || undefined,
        createdByEmail: data.createdByEmail || undefined,
        createdByRole: data.createdByRole || undefined,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      console.error(`Error enriching return data for ${returnId}:`, error);
      return null;
    }
  },

  async getById(id: string): Promise<ReturnWithDetails | null> {
    try {
      const returnRef = ref(database, `${RETURNS_PATH}/${id}`);
      const snapshot = await get(returnRef);
      
      if (!snapshot.exists()) {
        return null;
      }

      return this.enrichReturnData(id, snapshot.val());
    } catch (error) {
      console.error('Error getting return by id:', error);
      throw error;
    }
  },
};

