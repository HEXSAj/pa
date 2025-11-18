// src/services/purchaseService.ts
import { database } from '@/lib/firebase';
import { ref, push, set, get, query, orderByChild, equalTo, update, remove } from 'firebase/database';
import { Purchase, PurchaseWithDetails, BatchWithDetails, PaymentRecord, PurchaseStatus } from '@/types/purchase';
import { InventoryItem } from '@/types/inventory';
import { Supplier } from '@/types/supplier';

const PURCHASES_PATH = 'purchases';
const BATCHES_PATH = 'batches';
const SUPPLIERS_PATH = 'suppliers';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
interface CacheEntry {
  data: BatchWithDetails[] | PurchaseWithDetails[];
  timestamp: number;
  promise?: Promise<any>;
}

interface Cache {
  [key: string]: CacheEntry;
}

let batchCache: Cache = {};
let purchaseCache: Cache = {};

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry: CacheEntry | undefined): boolean => {
  if (!cacheEntry) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
};

// Helper function to get supplier details
const getSupplierDetails = async (supplierId: string): Promise<Supplier | null> => {
  const supplierRef = ref(database, `${SUPPLIERS_PATH}/${supplierId}`);
  const snapshot = await get(supplierRef);
  
  if (!snapshot.exists()) {
    console.warn(`Supplier not found: ${supplierId}`);
    return null;
  }
  
  return { id: snapshot.key, ...snapshot.val() } as Supplier;
};

// Helper function to get inventory item details
const getInventoryDetails = async (itemId: string): Promise<InventoryItem | null> => {
  const itemRef = ref(database, `inventory/${itemId}`);
  const snapshot = await get(itemRef);
  
  if (!snapshot.exists()) {
    console.warn(`Item not found: ${itemId}`);
    return null;
  }
  
  return { id: snapshot.key, ...snapshot.val() } as InventoryItem;
};

function sanitizeForRealtimeDB(data: any): any {
  // Handle null or undefined
  if (data === undefined) {
    return null; // Always convert undefined to null
  }
  
  // Handle primitive types (just return them)
  if (data === null || 
      typeof data !== 'object' || 
      data instanceof Date) {
    return data instanceof Date ? data.getTime() : data;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForRealtimeDB(item));
  }
  
  // Handle objects
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Replace undefined values with null
    sanitized[key] = value !== undefined ? sanitizeForRealtimeDB(value) : null;
  }
  
  return sanitized;
};

export const purchaseService = {
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
        return '001';
      }

      const batchNumbers: number[] = [];
      snapshot.forEach((childSnapshot) => {
        const batchNumber = parseInt(childSnapshot.val().batchNumber);
        if (!isNaN(batchNumber)) {
          batchNumbers.push(batchNumber);
        }
      });
      
      const maxBatchNumber = Math.max(...batchNumbers, 0);
      return (maxBatchNumber + 1).toString().padStart(3, '0');
    } catch (error) {
      console.error('Error getting next batch number:', error);
      throw error;
    }
  },


  // async create(purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>): Promise<{id: string}> {
  //   try {
  //     const now = Date.now();
      
  //     // Prepare purchase data (without payment fields)
  //     const purchaseData: any = {
  //       supplierId: purchase.supplierId,
  //       items: purchase.items.map(item => ({
  //         itemId: item.itemId,
  //         batchNumber: item.batchNumber,
  //         quantity: item.quantity,
  //         unitsPerPack: item.unitsPerPack || null,
  //         totalQuantity: item.totalQuantity,
  //         expiryDate: item.expiryDate.getTime(),
  //         costPricePerUnit: item.costPricePerUnit,
  //         sellingPricePerUnit: item.sellingPricePerUnit,
  //         freeItemCount: item.freeItemCount || null
  //       })),
  //       totalAmount: purchase.totalAmount,
  //       purchaseDate: purchase.purchaseDate.getTime(),
  //       invoiceNumber: purchase.invoiceNumber || null,
  //       notes: purchase.notes || null,
        
  //       // Creator information - preserve from pending or use current
  //       createdByUid: purchase.createdByUid || null,
  //       createdByName: purchase.createdByName || null,
  //       createdByEmail: purchase.createdByEmail || null,
  //       createdByRole: purchase.createdByRole || null,
        
  //       // Set status to completed
  //       status: 'completed',
  //       updatedAt: now,
  //       createdAt: now
  //     };
      
  //     let purchaseId = purchase.id;
      
  //     // If converting from pending, update existing document
  //     if (purchaseId) {
  //       const purchaseRef = ref(database, `${PURCHASES_PATH}/${purchaseId}`);
        
  //       // Delete any existing batches for this purchase
  //       const batchesRef = ref(database, BATCHES_PATH);
  //       const batchesQuery = query(
  //         batchesRef,
  //         orderByChild('purchaseId'),
  //         equalTo(purchaseId)
  //       );
        
  //       const batchesSnapshot = await get(batchesQuery);
  //       if (batchesSnapshot.exists()) {
  //         const deletePromises: Promise<void>[] = [];
  //         batchesSnapshot.forEach((batchSnapshot) => {
  //           const batchRef = ref(database, `${BATCHES_PATH}/${batchSnapshot.key}`);
  //           deletePromises.push(remove(batchRef));
  //         });
          
  //         await Promise.all(deletePromises);
  //       }
        
  //       // Update existing purchase
  //       await update(purchaseRef, purchaseData);
  //     } 
  //     // Otherwise create a new purchase document
  //     else {
  //       const purchasesRef = ref(database, PURCHASES_PATH);
  //       const newPurchaseRef = push(purchasesRef);
  //       purchaseId = newPurchaseRef.key!;
        
  //       await set(newPurchaseRef, purchaseData);
  //     }
  
  //     // Create batch documents for each item
  //     for (const item of purchase.items) {
  //       // First create the main batch with purchased items
  //       const batchesRef = ref(database, BATCHES_PATH);
  //       const newBatchRef = push(batchesRef);
        
  //       await set(newBatchRef, {
  //         batchNumber: item.batchNumber,
  //         itemId: item.itemId,
  //         quantity: (item.freeItemCount ? item.totalQuantity - item.freeItemCount : item.totalQuantity),
  //         expiryDate: item.expiryDate instanceof Date ? item.expiryDate.getTime() : item.expiryDate,
  //         purchaseId: purchaseId,
  //         costPrice: item.costPricePerUnit,
  //         unitPrice: item.sellingPricePerUnit,
  //         supplierId: purchase.supplierId,
  //         createdAt: now,
  //         updatedAt: now
  //       });
        
  //       // If there are free items, create a separate batch entry
  //       if (item.freeItemCount && item.freeItemCount > 0) {
  //         // Use a modified batch number to differentiate the free items
  //         const freeBatchNumber = `${item.batchNumber}-FREE`;
  //         const freeBatchRef = push(batchesRef);
          
  //         await set(freeBatchRef, {
  //           batchNumber: freeBatchNumber,
  //           itemId: item.itemId,
  //           quantity: item.freeItemCount,
  //           expiryDate: item.expiryDate instanceof Date ? item.expiryDate.getTime() : item.expiryDate,
  //           purchaseId: purchaseId,
  //           costPrice: 0, // Cost price is 0 for free items
  //           unitPrice: item.sellingPricePerUnit, // Selling price remains the same
  //           supplierId: purchase.supplierId,
  //           isFreeItem: true, // Flag to indicate this is a free item batch
  //           createdAt: now,
  //           updatedAt: now
  //         });
  //       }
  //     }
  
  //     // Clear caches after successful purchase
  //     this.clearBatchCache();
  //     this.clearPurchaseCache();
  
  //     return { id: purchaseId };
  //   } catch (error) {
  //     console.error('Error creating purchase:', error);
  //     throw error;
  //   }
  // },

  async create(purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>): Promise<{id: string}> {
    try {
      const now = Date.now();
      
      // Calculate payment status and due amount
      let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'paid';
      let dueAmount = 0;
      let isPaid = true;
      
      if (purchase.paymentMethod === 'credit') {
        const initialPayment = purchase.initialPayment || 0;
        dueAmount = purchase.totalAmount - initialPayment;
        
        if (initialPayment > 0 && dueAmount > 0) {
          paymentStatus = 'partial';
          isPaid = false;
        } else if (dueAmount > 0) {
          paymentStatus = 'unpaid';
          isPaid = false;
        } else {
          paymentStatus = 'paid';
          isPaid = true;
        }
      }
      
      // Create initial payment record if there's an initial payment
      const paymentHistory: PaymentRecord[] = [];
      if (purchase.initialPayment && purchase.initialPayment > 0) {
        paymentHistory.push({
          amount: purchase.initialPayment,
          date: new Date(now),
          paymentMethod: 'cash', // Default method for initial payment
          notes: 'Initial payment at time of purchase',
          recordedBy: purchase.createdByName || 'System',
          recordedByName: purchase.createdByName || 'System',
          createdAt: new Date(now)
        });
      }
      
      // Prepare purchase data
      const purchaseData: any = {
        supplierId: purchase.supplierId,
        items: purchase.items.map(item => ({
          itemId: item.itemId,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          unitsPerPack: item.unitsPerPack || null,
          totalQuantity: item.totalQuantity,
          expiryDate: item.expiryDate.getTime(),
          costPricePerUnit: item.costPricePerUnit,
          sellingPricePerUnit: item.sellingPricePerUnit,
          freeItemCount: item.freeItemCount || null
        })),
        totalAmount: purchase.totalAmount,
        purchaseDate: purchase.purchaseDate.getTime(),
        invoiceNumber: purchase.invoiceNumber || null,
        notes: purchase.notes || null,
        
        // Creator information
        createdByUid: purchase.createdByUid || null,
        createdByName: purchase.createdByName || null,
        createdByEmail: purchase.createdByEmail || null,
        createdByRole: purchase.createdByRole || null,
        
        // Payment related fields
        paymentMethod: purchase.paymentMethod,
        paymentStatus: paymentStatus,
        initialPayment: purchase.initialPayment || null,
        dueAmount: dueAmount,
        isPaid: isPaid,
        paymentHistory: paymentHistory,
        hasInstallmentPlan: false,
        installmentPlanId: null,
        
        status: 'completed',
        createdAt: now,
        updatedAt: now
      };
  
      // Create purchase document
      const purchasesRef = ref(database, PURCHASES_PATH);
      const newPurchaseRef = push(purchasesRef);
      const purchaseId = newPurchaseRef.key!;
      
      await set(newPurchaseRef, sanitizeForRealtimeDB(purchaseData));
  
      // Create batches and add to inventory
      const batchesRef = ref(database, BATCHES_PATH);
      
      for (const item of purchase.items) {
        // Main batch entry
        const batchRef = push(batchesRef);
        await set(batchRef, sanitizeForRealtimeDB({
          batchNumber: item.batchNumber,
          itemId: item.itemId,
          quantity: item.freeItemCount ? item.totalQuantity - item.freeItemCount : item.totalQuantity,
          expiryDate: item.expiryDate instanceof Date ? item.expiryDate.getTime() : item.expiryDate,
          purchaseId: purchaseId,
          costPrice: item.costPricePerUnit,
          unitPrice: item.sellingPricePerUnit,
          supplierId: purchase.supplierId,
          createdAt: now,
          updatedAt: now
        }));
        
        // Create separate batch for free items if any
        if (item.freeItemCount && item.freeItemCount > 0) {
          const freeBatchRef = push(batchesRef);
          await set(freeBatchRef, sanitizeForRealtimeDB({
            batchNumber: `${item.batchNumber}-FREE`,
            itemId: item.itemId,
            quantity: item.freeItemCount,
            expiryDate: item.expiryDate instanceof Date ? item.expiryDate.getTime() : item.expiryDate,
            purchaseId: purchaseId,
            costPrice: 0,
            unitPrice: item.sellingPricePerUnit,
            supplierId: purchase.supplierId,
            isFreeItem: true,
            createdAt: now,
            updatedAt: now
          }));
        }
      }
  
      // Clear caches
      this.clearBatchCache();
      this.clearPurchaseCache();
  
      return { id: purchaseId };
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  },

  async hasInstallmentPlan(purchaseId: string): Promise<boolean> {
    try {
      const purchaseRef = ref(database, `${PURCHASES_PATH}/${purchaseId}`);
      const snapshot = await get(purchaseRef);
      
      if (!snapshot.exists()) {
        return false;
      }
      
      const purchase = snapshot.val();
      return purchase.hasInstallmentPlan === true;
    } catch (error) {
      console.error('Error checking installment plan:', error);
      return false;
    }
  },
  



  async recordPayment(purchaseId: string, payment: Omit<PaymentRecord, 'id' | 'createdAt'>) {
    try {
      const now = Date.now();
      
      // Get current purchase document
      const purchaseRef = ref(database, `${PURCHASES_PATH}/${purchaseId}`);
      const purchaseSnapshot = await get(purchaseRef);
      
      if (!purchaseSnapshot.exists()) {
        throw new Error(`Purchase not found: ${purchaseId}`);
      }
      
      const purchaseData = purchaseSnapshot.val() as Purchase;
      const currentDueAmount = purchaseData.dueAmount || 0;
      
      // Validate payment amount
      if (payment.amount <= 0) {
        throw new Error('Payment amount must be greater than zero');
      }
      
      if (payment.amount > currentDueAmount) {
        throw new Error(`Payment amount (${payment.amount}) exceeds the due amount (${currentDueAmount})`);
      }
      
      // Create payment record
      const paymentRecord: PaymentRecord = {
        ...payment,
        date: payment.date instanceof Date ? payment.date : new Date(payment.date),
        createdAt: new Date(now)
      };
      
      // Add to payment history
      const paymentHistory = purchaseData.paymentHistory || [];
      paymentHistory.push(paymentRecord);
      
      // Calculate new due amount and payment status
      const newDueAmount = currentDueAmount - payment.amount;
      const newPaymentStatus = newDueAmount <= 0 ? 'paid' : 'partial';
      const isPaid = newDueAmount <= 0;
      
      // Update purchase document
      await update(purchaseRef, {
        paymentHistory: paymentHistory,
        dueAmount: newDueAmount,
        paymentStatus: newPaymentStatus,
        isPaid: isPaid,
        updatedAt: now
      });
      
      // Clear cache
      this.clearPurchaseCache();
      
      return {
        success: true,
        newDueAmount,
        isPaid,
        paymentRecord
      };
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  },


  async getPaymentHistory(purchaseId: string): Promise<PaymentRecord[]> {
    try {
      const purchaseRef = ref(database, `${PURCHASES_PATH}/${purchaseId}`);
      const purchaseSnapshot = await get(purchaseRef);
      
      if (!purchaseSnapshot.exists()) {
        throw new Error(`Purchase not found: ${purchaseId}`);
      }
      
      const purchaseData = purchaseSnapshot.val() as Purchase;
      const paymentHistory = purchaseData.paymentHistory || [];
      
      // Convert timestamps back to Date objects
      return paymentHistory.map(payment => ({
        ...payment,
        date: new Date(payment.date),
        createdAt: new Date(payment.createdAt)
      }));
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  },
  
  

  // Create a purchase order (directly adds to inventory now)
  async createOrder(purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>): Promise<{id: string}> {
    try {
      // Simply call the create function which now adds items to inventory
      return await this.create(purchase);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  },


  // In purchaseService.ts
async update(id: string, updatedPurchase: Partial<Purchase>) {
  try {
    const now = Date.now();
    const purchaseRef = ref(database, `${PURCHASES_PATH}/${id}`);
    const purchaseSnapshot = await get(purchaseRef);
    
    if (!purchaseSnapshot.exists()) {
      throw new Error(`Purchase not found: ${id}`);
    }
    
    const currentPurchase = purchaseSnapshot.val() as Purchase;
    
    // Prepare update data without payment fields
    const updateData: any = {
      updatedAt: now
    };
    
    // Only add fields that have been provided
    if (updatedPurchase.supplierId !== undefined) updateData.supplierId = updatedPurchase.supplierId;
    if (updatedPurchase.invoiceNumber !== undefined) updateData.invoiceNumber = updatedPurchase.invoiceNumber;
    if (updatedPurchase.notes !== undefined) updateData.notes = updatedPurchase.notes;
    if (updatedPurchase.totalAmount !== undefined) updateData.totalAmount = updatedPurchase.totalAmount;
    if (updatedPurchase.purchaseDate !== undefined) {
      updateData.purchaseDate = updatedPurchase.purchaseDate instanceof Date 
        ? updatedPurchase.purchaseDate.getTime() 
        : updatedPurchase.purchaseDate;
    }
    
    // Handle items update
    if (updatedPurchase.items) {
      // Format items properly
      updateData.items = updatedPurchase.items.map(item => ({
        itemId: item.itemId,
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        unitsPerPack: item.unitsPerPack || null,
        totalQuantity: item.totalQuantity,
        expiryDate: item.expiryDate instanceof Date 
          ? item.expiryDate.getTime() 
          : item.expiryDate,
        costPricePerUnit: item.costPricePerUnit,
        sellingPricePerUnit: item.sellingPricePerUnit,
        freeItemCount: item.freeItemCount || null
      }));
      
      // Get current batches for this purchase
      const batchesRef = ref(database, BATCHES_PATH);
      const batchesQuery = query(
        batchesRef,
        orderByChild('purchaseId'),
        equalTo(id)
      );
      
      const batchesSnapshot = await get(batchesQuery);
      
      // Map of existing batches by batch number and itemId (for uniqueness)
      const existingBatches = new Map();
      if (batchesSnapshot.exists()) {
        batchesSnapshot.forEach((batchSnapshot) => {
          const batchData = batchSnapshot.val();
          const key = `${batchData.itemId}_${batchData.batchNumber}`;
          existingBatches.set(key, {
            id: batchSnapshot.key,
            ...batchData
          });
        });
      }
      
      // Process each item in the updated purchase
      const batchPromises: Promise<void>[] = [];
      for (const item of updatedPurchase.items) {
        const key = `${item.itemId}_${item.batchNumber}`;
        const existingBatch = existingBatches.get(key);
        
        if (existingBatch) {
          // Update existing batch
          const batchRef = ref(database, `${BATCHES_PATH}/${existingBatch.id}`);
          
          // Calculate the actual quantity to store
          const mainQuantity = item.freeItemCount 
            ? item.totalQuantity - item.freeItemCount 
            : item.totalQuantity;
            
          batchPromises.push(update(batchRef, {
            quantity: mainQuantity,
            expiryDate: item.expiryDate instanceof Date 
              ? item.expiryDate.getTime() 
              : item.expiryDate,
            costPrice: item.costPricePerUnit,
            unitPrice: item.sellingPricePerUnit,
            updatedAt: now
          }));
          
          // Remove from map to track which ones we've processed
          existingBatches.delete(key);
          
          // Handle free items batch if needed
          const freeItemKey = `${item.itemId}_${item.batchNumber}-FREE`;
          const existingFreeBatch = existingBatches.get(freeItemKey);
          
          if (item.freeItemCount && item.freeItemCount > 0) {
            if (existingFreeBatch) {
              // Update existing free items batch
              const freeBatchRef = ref(database, `${BATCHES_PATH}/${existingFreeBatch.id}`);
              batchPromises.push(update(freeBatchRef, {
                quantity: item.freeItemCount,
                expiryDate: item.expiryDate instanceof Date 
                  ? item.expiryDate.getTime() 
                  : item.expiryDate,
                unitPrice: item.sellingPricePerUnit,
                updatedAt: now
              }));
              
              existingBatches.delete(freeItemKey);
            } else {
              // Create new free items batch
              const freeBatchRef = push(ref(database, BATCHES_PATH));
              batchPromises.push(set(freeBatchRef, {
                batchNumber: `${item.batchNumber}-FREE`,
                itemId: item.itemId,
                quantity: item.freeItemCount,
                expiryDate: item.expiryDate instanceof Date 
                  ? item.expiryDate.getTime() 
                  : item.expiryDate,
                purchaseId: id,
                costPrice: 0, // Cost price is 0 for free items
                unitPrice: item.sellingPricePerUnit,
                supplierId: updatedPurchase.supplierId || currentPurchase.supplierId,
                isFreeItem: true,
                createdAt: now,
                updatedAt: now
              }));
            }
          } else if (existingFreeBatch) {
            // If there was a free batch but now there's no free items, delete it
            const freeBatchRef = ref(database, `${BATCHES_PATH}/${existingFreeBatch.id}`);
            batchPromises.push(remove(freeBatchRef));
            existingBatches.delete(freeItemKey);
          }
        } else {
          // Create new batch
          const newBatchRef = push(ref(database, BATCHES_PATH));
          
          // Calculate the actual quantity to store
          const mainQuantity = item.freeItemCount 
            ? item.totalQuantity - item.freeItemCount 
            : item.totalQuantity;
            
          batchPromises.push(set(newBatchRef, {
            batchNumber: item.batchNumber,
            itemId: item.itemId,
            quantity: mainQuantity,
            expiryDate: item.expiryDate instanceof Date 
              ? item.expiryDate.getTime() 
              : item.expiryDate,
            purchaseId: id,
            costPrice: item.costPricePerUnit,
            unitPrice: item.sellingPricePerUnit,
            supplierId: updatedPurchase.supplierId || currentPurchase.supplierId,
            createdAt: now,
            updatedAt: now
          }));
          
          // Create free items batch if needed
          if (item.freeItemCount && item.freeItemCount > 0) {
            const freeBatchRef = push(ref(database, BATCHES_PATH));
            batchPromises.push(set(freeBatchRef, {
              batchNumber: `${item.batchNumber}-FREE`,
              itemId: item.itemId,
              quantity: item.freeItemCount,
              expiryDate: item.expiryDate instanceof Date 
                ? item.expiryDate.getTime() 
                : item.expiryDate,
              purchaseId: id,
              costPrice: 0, // Cost price is 0 for free items
              unitPrice: item.sellingPricePerUnit,
              supplierId: updatedPurchase.supplierId || currentPurchase.supplierId,
              isFreeItem: true,
              createdAt: now,
              updatedAt: now
            }));
          }
        }
      }
      
      // Delete batches that are no longer in the purchase
      for (const [_, batch] of existingBatches.entries()) {
        const batchRef = ref(database, `${BATCHES_PATH}/${batch.id}`);
        batchPromises.push(remove(batchRef));
      }
      
      // Wait for all batch operations to complete
      await Promise.all(batchPromises);
    }
    
    // Update the purchase document
    await update(purchaseRef, updateData);
    
    // Clear caches
    this.clearBatchCache();
    this.clearPurchaseCache();
    
    return { success: true };
  } catch (error) {
    console.error('Error updating purchase:', error);
    throw error;
  }
},



  async delete(id: string) {
    try {
      // Check if purchase exists
      const purchaseRef = ref(database, `${PURCHASES_PATH}/${id}`);
      const purchaseSnapshot = await get(purchaseRef);
      
      if (!purchaseSnapshot.exists()) {
        throw new Error(`Purchase not found: ${id}`);
      }
      
      // Get all batches associated with this purchase
      const batchesRef = ref(database, BATCHES_PATH);
      const batchesQuery = query(
        batchesRef,
        orderByChild('purchaseId'),
        equalTo(id)
      );
      
      const batchesSnapshot = await get(batchesQuery);
      
      // Delete all associated batches
      const deletePromises: Promise<void>[] = [];
      let batchesCount = 0;
      
      if (batchesSnapshot.exists()) {
        batchesSnapshot.forEach((batchSnapshot) => {
          batchesCount++;
          const batchRef = ref(database, `${BATCHES_PATH}/${batchSnapshot.key}`);
          deletePromises.push(remove(batchRef));
        });
      }
      
      // Delete the purchase document
      deletePromises.push(remove(purchaseRef));
      
      // Execute all delete operations
      await Promise.all(deletePromises);
      
      // Clear caches
      this.clearBatchCache();
      this.clearPurchaseCache();
      
      return { 
        success: true,
        batchesDeleted: batchesCount
      };
    } catch (error) {
      console.error('Error deleting purchase:', error);
      throw error;
    }
  },

  async savePending(purchase: Omit<Purchase, 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Date.now();
      
      // Sanitize the purchase data to remove any undefined values
      const sanitizedPurchase = sanitizeForRealtimeDB(purchase);
      
      // Prepare purchase data with pending status
      const purchaseData: any = {
        ...sanitizedPurchase,
        status: 'pending',
        updatedAt: now
      };
      
      let purchaseId = purchase.id;
      
      // If purchase already has an ID, update it
      if (purchaseId) {
        const purchaseRef = ref(database, `${PURCHASES_PATH}/${purchaseId}`);
        await update(purchaseRef, purchaseData);
      } 
      // Otherwise create a new pending purchase
      else {
        purchaseData.createdAt = now;
        const purchasesRef = ref(database, PURCHASES_PATH);
        const newPurchaseRef = push(purchasesRef);
        purchaseId = newPurchaseRef.key!;
        
        await set(newPurchaseRef, purchaseData);
      }
      
      return purchaseId;
    } catch (error) {
      console.error('Error saving pending purchase:', error);
      throw error;
    }
  },

  async getAll(): Promise<PurchaseWithDetails[]> {
    try {
      // Check cache
      if (isCacheValid(purchaseCache['all'])) {
        return purchaseCache['all'].data as PurchaseWithDetails[];
      }
  
      // If there's an ongoing request, return its promise
      if (purchaseCache['all']?.promise) {
        return purchaseCache['all'].promise;
      }
  
      const promise = (async () => {
        const purchases: PurchaseWithDetails[] = [];
        const purchasesRef = ref(database, PURCHASES_PATH);
        const snapshot = await get(purchasesRef);
  
        if (!snapshot.exists()) {
          return purchases;
        }
  
        // Process each purchase document
        const purchasePromises: Promise<PurchaseWithDetails | null>[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const purchaseId = childSnapshot.key;
          const data = childSnapshot.val();
          
          if (!data || !data.supplierId || !data.items) {
            console.warn(`Invalid purchase data for document ${purchaseId}`);
            return;
          }
          
          const purchasePromise = (async () => {
            try {
              // Get supplier data
              const supplier = await getSupplierDetails(data.supplierId);
              if (!supplier) return null;
              
              // Get items data
              const itemsWithDetails = [];
              for (const item of data.items) {
                if (!item || !item.itemId) {
                  console.warn('Invalid item data in purchase');
                  continue;
                }
                
                const inventoryItem = await getInventoryDetails(item.itemId);
                if (inventoryItem) {
                  itemsWithDetails.push({
                    ...item,
                    item: inventoryItem,
                    expiryDate: new Date(item.expiryDate)
                  });
                }
              }
              
              // Convert payment history timestamps to dates
              let paymentHistory = [];
              if (data.paymentHistory && Array.isArray(data.paymentHistory)) {
                paymentHistory = data.paymentHistory.map(payment => ({
                  ...payment,
                  date: new Date(payment.date)
                }));
              }
              
              // Convert cheque details timestamps to dates
              let chequeDetails = null;
              if (data.chequeDetails) {
                chequeDetails = {
                  ...data.chequeDetails,
                  chequeDate: new Date(data.chequeDetails.chequeDate),
                  clearingDate: data.chequeDetails.clearingDate ? new Date(data.chequeDetails.clearingDate) : undefined
                };
              }
              
              // Convert payment due date to date object
              const paymentDueDate = data.paymentDueDate ? new Date(data.paymentDueDate) : undefined;
              
              // Convert timestamp fields to Date objects
              const purchase: PurchaseWithDetails = {
                id: purchaseId,
                supplierId: data.supplierId,
                supplier,
                items: itemsWithDetails,
                totalAmount: data.totalAmount,
                purchaseDate: new Date(data.purchaseDate),
                invoiceNumber: data.invoiceNumber || null,
                notes: data.notes || null,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
                
                // Payment fields
                paymentMethod: data.paymentMethod,
                paymentStatus: data.paymentStatus,
                initialPayment: data.initialPayment || null,
                dueAmount: data.dueAmount || null,
                paymentDueDate,
                isPaid: data.isPaid || false,
                paymentHistory,
                chequeDetails,
                
                // Creator information
                createdByUid: data.createdByUid || null,
                createdByName: data.createdByName || null,
                createdByEmail: data.createdByEmail || null,
                createdByRole: data.createdByRole || null,
                
                // Status field
                status: data.status || 'completed' // Default to completed for backwards compatibility
              };
              return purchase;
            } catch (error) {
              console.error(`Error processing purchase ${purchaseId}:`, error);
              return null;
            }
          })();
          
          purchasePromises.push(purchasePromise);
        });
        
        // Wait for all purchases to be processed
        const results = await Promise.all(purchasePromises);
        
        // Filter out null results and add valid purchases
        results.forEach(purchase => {
          if (purchase) {
            purchases.push(purchase);
          }
        });
        
        return purchases;
      })();
  
      // Store the promise in cache
      purchaseCache['all'] = {
        promise,
        data: [] as PurchaseWithDetails[],
        timestamp: Date.now()
      };
  
      const result = await promise;
      
      // Update cache with the result
      purchaseCache['all'] = {
        data: result,
        timestamp: Date.now()
      };
  
      return result;
    } catch (error) {
      console.error('Error getting purchases:', error);
      throw error;
    }
  },

  async getPendingPurchases(): Promise<PurchaseWithDetails[]> {
    try {
      // We'll modify getAll to include status field and then filter
      const allPurchases = await this.getAll();
      return allPurchases.filter(purchase => purchase.status === 'pending');
    } catch (error) {
      console.error('Error getting pending purchases:', error);
      throw error;
    }
  },

  async getUnpaidPurchases(): Promise<PurchaseWithDetails[]> {
    try {
      const allPurchases = await this.getAll();
      return allPurchases.filter(
        purchase => purchase.paymentStatus === 'unpaid' || purchase.paymentStatus === 'partial'
      );
    } catch (error) {
      console.error('Error getting unpaid purchases:', error);
      throw error;
    }
  },

  // Get cheque payments
  async getChequePurchases(): Promise<PurchaseWithDetails[]> {
    try {
      const allPurchases = await this.getAll();
      return allPurchases.filter(purchase => purchase.paymentMethod === 'cheque');
    } catch (error) {
      console.error('Error getting cheque purchases:', error);
      throw error;
    }
  },

  // Get pending cheques
  async getPendingChequePurchases(): Promise<PurchaseWithDetails[]> {
    try {
      const chequePurchases = await this.getChequePurchases();
      return chequePurchases.filter(purchase => 
        purchase.chequeDetails && purchase.chequeDetails.status === 'pending'
      );
    } catch (error) {
      console.error('Error getting pending cheque purchases:', error);
      throw error;
    }
  },

  async getBatchesByItem(itemId: string): Promise<BatchWithDetails[]> {
    try {
      // Check cache first with a faster synchronous check
      if (batchCache[itemId] && 
          batchCache[itemId].data && 
          Date.now() - batchCache[itemId].timestamp < CACHE_DURATION) {
        console.log(`Using cached batch data for item ${itemId}`);
        return batchCache[itemId].data as BatchWithDetails[];
      }

      // If there's an ongoing request, return its promise to prevent duplicate requests
      if (batchCache[itemId]?.promise) {
        console.log(`Using existing promise for item ${itemId}`);
        return batchCache[itemId].promise;
      }

      console.log(`Fetching fresh batch data for item ${itemId}`);
      const promise = (async () => {
        // Create a more efficient query
        const batchesRef = ref(database, BATCHES_PATH);
        const batchesQuery = query(
          batchesRef,
          orderByChild('itemId'),
          equalTo(itemId)
        );
        
        // Parallel fetching of batch data and item data for efficiency
        const [batchesSnapshot, itemSnapshot] = await Promise.all([
          get(batchesQuery),
          get(ref(database, `inventory/${itemId}`))
        ]);
        
        if (!itemSnapshot.exists()) {
          throw new Error(`Item not found: ${itemId}`);
        }

        const item = { id: itemSnapshot.key, ...itemSnapshot.val() } as InventoryItem;
        const batchesWithDetails: BatchWithDetails[] = [];
        
        if (!batchesSnapshot.exists()) {
          return batchesWithDetails;
        }

        // Process batches more efficiently
        const batchPromises: Promise<BatchWithDetails>[] = [];
        const today = new Date();
        
        // Use forEach for better Firebase snapshot traversal
        batchesSnapshot.forEach((batchSnapshot) => {
          const batchId = batchSnapshot.key;
          const data = batchSnapshot.val();
          
          // Skip batches with 0 quantity
          if (data.quantity <= 0) {
            return;
          }
          
          // Check expiry date - only skip if truly expired (not today)
          const expiryDate = new Date(data.expiryDate);
          const expiryDateOnly = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
          const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          // Skip only if expired (before today, not including today)
          if (expiryDateOnly < todayOnly) {
            return;
          }
          
          const batchPromise = (async () => {
            // Only fetch additional purchase/supplier data if really needed
            let purchase = undefined;
            let supplier = undefined;
            
            // Log return batches for debugging
            if (data.isReturn || data.returnId) {
              console.log(`📦 Found return batch ${batchId} for item ${itemId}:`, {
                batchNumber: data.batchNumber,
                quantity: data.quantity,
                expiryDate: new Date(data.expiryDate).toISOString(),
                isReturn: data.isReturn,
                returnId: data.returnId
              });
            }
            
            if (data.purchaseId) {
              try {
                const purchaseSnapshot = await get(ref(database, `${PURCHASES_PATH}/${data.purchaseId}`));
                if (purchaseSnapshot.exists()) {
                  purchase = { id: purchaseSnapshot.key, ...purchaseSnapshot.val() } as Purchase;
                  
                  if (purchase.supplierId) {
                    supplier = await getSupplierDetails(purchase.supplierId);
                  }
                }
              } catch (err) {
                console.warn(`Error fetching additional data for batch ${batchId}:`, err);
                // Continue without the additional data
              }
            }

            return {
              id: batchId,
              ...data,
              item,
              purchase,
              supplier,
              sellingPricePerUnit: data.unitPrice || 0,
              costPricePerUnit: data.costPrice || 0,
              expiryDate: new Date(data.expiryDate),
              createdAt: new Date(data.createdAt),
              updatedAt: new Date(data.updatedAt)
            } as BatchWithDetails;
          })();
          
          batchPromises.push(batchPromise);
        });

        // Await all batch promises
        const batches = await Promise.all(batchPromises);

        // Sort by expiry date - only sort valid batches
        return batches.sort((a, b) => 
          a.expiryDate.getTime() - b.expiryDate.getTime()
        );
      })();

      // Store the promise in cache
      batchCache[itemId] = {
        promise,
        data: [] as BatchWithDetails[],
        timestamp: Date.now()
      };

      const result = await promise;
      
      // Update cache with the result and a new timestamp
      batchCache[itemId] = {
        data: result,
        timestamp: Date.now()
      };

      return result;
    } catch (error) {
      console.error(`Error getting batches for item ${itemId}:`, error);
      
      // Ensure failed requests don't stay in cache
      if (batchCache[itemId] && batchCache[itemId].promise) {
        delete batchCache[itemId];
      }
      
      throw error;
    }
  },
  
  clearItemBatchCache(itemId: string) {
    delete batchCache[itemId];
  },

  clearBatchCache() {
    batchCache = {};
  },

  clearPurchaseCache() {
    purchaseCache = {};
  },

  // Receive a pending purchase order
  async receivePurchaseOrder(pendingPurchaseId: string, receivedData: {
    items: PurchaseItem[];
    totalAmount: number;
    receivedDate: Date;
    receivedByUid: string;
    receivedByName: string;
    receivedNotes?: string;
    paymentMethod: PaymentMethod;
    initialPayment?: number;
  }) {
    try {
      const now = Date.now();
      
      // Get the pending purchase
      const pendingRef = ref(database, `${PURCHASES_PATH}/${pendingPurchaseId}`);
      const pendingSnapshot = await get(pendingRef);
      
      if (!pendingSnapshot.exists()) {
        throw new Error(`Pending purchase not found: ${pendingPurchaseId}`);
      }
      
      const pendingData = pendingSnapshot.val();
      
      // Calculate payment status and due amount
      let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'paid';
      let dueAmount = 0;
      let isPaid = true;
      
      if (receivedData.paymentMethod === 'credit') {
        const initialPayment = receivedData.initialPayment || 0;
        dueAmount = receivedData.totalAmount - initialPayment;
        
        if (initialPayment > 0 && dueAmount > 0) {
          paymentStatus = 'partial';
          isPaid = false;
        } else if (dueAmount > 0) {
          paymentStatus = 'unpaid';
          isPaid = false;
        } else {
          paymentStatus = 'paid';
          isPaid = true;
        }
      }
      
      // Create initial payment record if there's an initial payment
      const paymentHistory: PaymentRecord[] = [];
      if (receivedData.initialPayment && receivedData.initialPayment > 0) {
        paymentHistory.push({
          amount: receivedData.initialPayment,
          date: new Date(now),
          paymentMethod: 'cash', // Default method for initial payment
          notes: 'Initial payment at time of receiving',
          recordedBy: receivedData.receivedByUid,
          recordedByName: receivedData.receivedByName,
          createdAt: new Date(now)
        });
      }
      
      // Prepare completed purchase data
      const completedPurchaseData: any = {
        supplierId: pendingData.supplierId,
        items: receivedData.items.map(item => ({
          itemId: item.itemId,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          unitsPerPack: item.unitsPerPack || null,
          totalQuantity: item.totalQuantity,
          expiryDate: item.expiryDate.getTime(),
          costPricePerUnit: item.costPricePerUnit,
          sellingPricePerUnit: item.sellingPricePerUnit,
          freeItemCount: item.freeItemCount || null
        })),
        totalAmount: receivedData.totalAmount,
        purchaseDate: pendingData.purchaseDate,
        invoiceNumber: pendingData.invoiceNumber || null,
        notes: pendingData.notes || null,
        
        // Creator information (preserve from pending)
        createdByUid: pendingData.createdByUid || null,
        createdByName: pendingData.createdByName || null,
        createdByEmail: pendingData.createdByEmail || null,
        createdByRole: pendingData.createdByRole || null,
        
        // Payment related fields
        paymentMethod: receivedData.paymentMethod,
        paymentStatus: paymentStatus,
        initialPayment: receivedData.initialPayment || null,
        dueAmount: dueAmount,
        isPaid: isPaid,
        paymentHistory: paymentHistory,
        hasInstallmentPlan: false,
        installmentPlanId: null,
        
        // Receiving information
        receivedDate: receivedData.receivedDate.getTime(),
        receivedByUid: receivedData.receivedByUid,
        receivedByName: receivedData.receivedByName,
        receivedNotes: receivedData.receivedNotes || null,
        
        status: 'completed',
        createdAt: pendingData.createdAt,
        updatedAt: now
      };

      // Delete the pending purchase
      await remove(pendingRef);
      
      // Create the completed purchase
      const purchasesRef = ref(database, PURCHASES_PATH);
      const newPurchaseRef = push(purchasesRef);
      const purchaseId = newPurchaseRef.key!;
      
      await set(newPurchaseRef, sanitizeForRealtimeDB(completedPurchaseData));

      // Create batches and add to inventory
      const batchesRef = ref(database, BATCHES_PATH);
      
      for (const item of receivedData.items) {
        // Main batch entry
        const batchRef = push(batchesRef);
        await set(batchRef, sanitizeForRealtimeDB({
          batchNumber: item.batchNumber,
          itemId: item.itemId,
          quantity: item.freeItemCount ? item.totalQuantity - item.freeItemCount : item.totalQuantity,
          expiryDate: item.expiryDate instanceof Date ? item.expiryDate.getTime() : item.expiryDate,
          purchaseId: purchaseId,
          costPrice: item.costPricePerUnit,
          unitPrice: item.sellingPricePerUnit,
          supplierId: pendingData.supplierId,
          createdAt: now,
          updatedAt: now
        }));
        
        // Create separate batch for free items if any
        if (item.freeItemCount && item.freeItemCount > 0) {
          const freeBatchRef = push(batchesRef);
          await set(freeBatchRef, sanitizeForRealtimeDB({
            batchNumber: `${item.batchNumber}-FREE`,
            itemId: item.itemId,
            quantity: item.freeItemCount,
            expiryDate: item.expiryDate instanceof Date ? item.expiryDate.getTime() : item.expiryDate,
            purchaseId: purchaseId,
            costPrice: 0,
            unitPrice: item.sellingPricePerUnit,
            supplierId: pendingData.supplierId,
            isFreeItem: true,
            createdAt: now,
            updatedAt: now
          }));
        }
      }

      // Clear caches
      this.clearBatchCache();
      this.clearPurchaseCache();

      return { id: purchaseId };
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      throw error;
    }
  }
};