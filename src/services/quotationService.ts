// src/services/quotationService.ts

import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  getDocs, 
  Timestamp,
  updateDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  setDoc
} from 'firebase/firestore';
import { Quotation } from '@/types/quotation';

export const quotationService = {
  // async create(quotation: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'quotationNumber'>) {
  //   const now = Timestamp.now();
    
  //   try {
  //     // Generate a unique quotation number
  //     const quotationNumber = await this.generateQuotationNumber();
      
  //     // Create the quotation document
  //     const quotationRef = doc(collection(db, 'quotations'));
      
  //     // Prepare quotation data
  //     const quotationData: any = {
  //       quotationNumber,
  //       items: quotation.items.map(item => ({
  //         itemId: item.itemId,
  //         batchId: item.batchId,
  //         unitQuantity: item.unitQuantity,
  //         subUnitQuantity: item.subUnitQuantity,
  //         unitPrice: item.unitPrice,
  //         subUnitPrice: item.subUnitPrice,
  //         totalPrice: item.totalPrice,
  //         totalCost: item.totalCost,
  //         itemDiscount: item.itemDiscount || null,
  //         itemDiscountPercentage: item.itemDiscountPercentage || null
  //       })),
  //       discountPercentage: quotation.discountPercentage || null,
  //       totalDiscount: quotation.totalDiscount || null,
  //       totalAmount: quotation.totalAmount,
  //       totalCost: quotation.totalCost,
  //       createdAt: now,
  //       updatedAt: now,
  //       convertedToSale: false,
  //       notes: quotation.notes || null,
  //       expiryDate: quotation.expiryDate ? Timestamp.fromDate(quotation.expiryDate) : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // Default 30 days
  //     };

  //     // Only add customer-related fields if customer exists
  //     if (quotation.customer && quotation.customerId) {
  //       quotationData.customerId = quotation.customerId;
  //       quotationData.customerInfo = {
  //         id: quotation.customer.id,
  //         name: quotation.customer.name,
  //         mobile: quotation.customer.mobile || null,
  //         address: quotation.customer.address || null
  //       };
  //     } else {
  //       // Explicitly set to null to avoid undefined values
  //       quotationData.customerId = null;
  //       quotationData.customerInfo = null;
  //     }

  //     // Add the quotation to Firestore
  //     const docRef = await addDoc(collection(db, 'quotations'), quotationData);
      
  //     return { quotationNumber, id: docRef.id };
  //   } catch (error) {
  //     console.error('Error creating quotation:', error);
  //     throw error;
  //   }
  // },


  async create(quotation: {
    items: any[];
    totalAmount: number;
    totalCost: number;
    discountPercentage?: number;
    totalDiscount?: number;
    notes?: string;
    expiryDate: Date;
    customerId?: string;
    customer?: any;
    freeItemsCount?: number;
    freeItemsValue?: number;
    createdBy?: any; // Add createdBy parameter
  }): Promise<{ id: string; quotationNumber: string }> {
    try {
      const now = Timestamp.now();
      
      // Generate a unique quotation number
      const uniqueId = Math.floor(Math.random() * 90000) + 10000; // 5-digit number
      const year = new Date().getFullYear().toString().substr(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const quotationNumber = `Q${year}${month}-${uniqueId}`;
      
      // Add to Firestore
      const quotationRef = doc(collection(db, 'quotations'));
      
      // Prepare data for storage
      const quotationData = {
        quotationNumber,
        items: quotation.items,
        totalAmount: quotation.totalAmount,
        totalCost: quotation.totalCost,
        discountPercentage: quotation.discountPercentage || null,
        totalDiscount: quotation.totalDiscount || null,
        notes: quotation.notes || '',
        expiryDate: Timestamp.fromDate(quotation.expiryDate),
        createdAt: now,
        updatedAt: now,
        status: 'pending', // Default status
        customerId: quotation.customerId || null,
        createdBy: quotation.createdBy || null // Save user info
      };
      
      // If customer info is provided
      if (quotation.customer && quotation.customerId) {
        quotationData.customerInfo = {
          id: quotation.customer.id,
          name: quotation.customer.name,
          mobile: quotation.customer.mobile || null,
          address: quotation.customer.address || null
        };
      } else {
        quotationData.customerInfo = null;
      }
      
      // Add free items statistics if available
      if (quotation.freeItemsCount !== undefined) {
        quotationData.freeItemsCount = quotation.freeItemsCount;
      }
      if (quotation.freeItemsValue !== undefined) {
        quotationData.freeItemsValue = quotation.freeItemsValue;
      }
      
      // Write to Firestore
      await setDoc(quotationRef, quotationData);
      
      return {
        id: quotationRef.id,
        quotationNumber
      };
    } catch (error) {
      console.error('Error creating quotation:', error);
      throw error;
    }
  },


  async getAll() {
    try {
      const q = query(collection(db, 'quotations'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        expiryDate: doc.data().expiryDate?.toDate(),
        customer: doc.data().customerInfo ? {
          id: doc.data().customerInfo.id,
          name: doc.data().customerInfo.name,
          mobile: doc.data().customerInfo.mobile,
          address: doc.data().customerInfo.address
        } : undefined
      })) as Quotation[];
    } catch (error) {
      console.error('Error getting quotations:', error);
      throw error;
    }
  },

  async getById(id: string) {
    try {
      const docRef = doc(db, 'quotations', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Quotation not found');
      }
      
      const data = docSnap.data();
      
      // Fetch full item details for each quotation item
      const itemsPromises = data.items.map(async (item: any) => {
        try {
          // Get item details
          const itemDoc = await getDoc(doc(db, 'inventory', item.itemId));
          if (!itemDoc.exists()) {
            throw new Error(`Item ${item.itemId} not found`);
          }
          const itemData = itemDoc.data();
          
          // Get batch details
          const batchDoc = await getDoc(doc(db, 'batches', item.batchId));
          if (!batchDoc.exists()) {
            throw new Error(`Batch ${item.batchId} not found`);
          }
          const batchData = batchDoc.data();
          
          return {
            ...item,
            item: {
              id: itemDoc.id,
              ...itemData
            },
            batch: {
              id: batchDoc.id,
              ...batchData,
              expiryDate: batchData.expiryDate.toDate()
            }
          };
        } catch (error) {
          console.error(`Error fetching details for item ${item.itemId}:`, error);
          // Provide a minimal valid item if we can't fetch the full details
          return {
            ...item,
            item: { 
              id: item.itemId,
              name: "Unknown Item",
              code: "UNKNOWN",
              type: "Unknown",
              unitContains: null
            },
            batch: {
              id: item.batchId,
              batchNumber: "Unknown",
              expiryDate: new Date(),
              quantity: 0,
              unitPrice: item.unitPrice,
              costPrice: item.totalCost / (item.unitQuantity || 1)
            }
          };
        }
      });
      
      // Wait for all item details to be fetched
      const populatedItems = await Promise.all(itemsPromises);
      
      return {
        id: docSnap.id,
        ...data,
        items: populatedItems,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        expiryDate: data.expiryDate?.toDate(),
        customer: data.customerInfo ? {
          id: data.customerInfo.id,
          name: data.customerInfo.name,
          mobile: data.customerInfo.mobile,
          address: data.customerInfo.address
        } : undefined
      } as Quotation;
    } catch (error) {
      console.error('Error getting quotation:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Quotation>) {
    try {
      const quotationRef = doc(db, 'quotations', id);
      const now = Timestamp.now();
      
      const updateData: any = {
        ...updates,
        updatedAt: now
      };
      
      // If there's a customer update
      if (updates.customer) {
        updateData.customerInfo = {
          id: updates.customer.id,
          name: updates.customer.name,
          mobile: updates.customer.mobile || null,
          address: updates.customer.address || null
        };
        delete updateData.customer; // Remove the customer object
      }
      
      // Convert dates to Firestore timestamps
      if (updates.expiryDate) {
        updateData.expiryDate = Timestamp.fromDate(updates.expiryDate);
      }
      
      await updateDoc(quotationRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating quotation:', error);
      throw error;
    }
  },

  // async delete(id: string) {
  //   try {
  //     const quotationRef = doc(db, 'quotations', id);
  //     await deleteDoc(quotationRef);
  //     return true;
  //   } catch (error) {
  //     console.error('Error deleting quotation:', error);
  //     throw error;
  //   }
  // },


  async delete(id: string) {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error(`Invalid quotation ID: ${id}`);
      }
      
      console.log("Deleting quotation with ID:", id);
      
      // First verify the document exists
      const quotationRef = doc(db, 'quotations', id);
      const quotationDoc = await getDoc(quotationRef);
      
      if (!quotationDoc.exists()) {
        throw new Error(`Quotation with ID ${id} not found`);
      }
      
      // Then delete it
      await deleteDoc(quotationRef);
      console.log("Quotation successfully deleted");
      
      return true;
    } catch (error) {
      console.error(`Error deleting quotation (ID: ${id}):`, error);
      throw error; // Re-throw to allow handling in the UI
    }
  },


  async convertToSale(id: string, saleId: string) {
    try {
      const quotationRef = doc(db, 'quotations', id);
      await updateDoc(quotationRef, {
        convertedToSale: true,
        saleId,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error converting quotation to sale:', error);
      throw error;
    }
  },

  // Generate a unique sequential quotation number
  async generateQuotationNumber() {
    try {
      // Get the latest quotation to determine the next number
      const q = query(collection(db, 'quotations'), orderBy('createdAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      let nextNumber = 1;
      
      if (!snapshot.empty) {
        const latestQuotation = snapshot.docs[0].data();
        if (latestQuotation.quotationNumber) {
          // Extract the number part and increment
          const matches = latestQuotation.quotationNumber.match(/Q-(\d+)/);
          if (matches && matches[1]) {
            nextNumber = parseInt(matches[1]) + 1;
          }
        }
      }
      
      // Format with leading zeros, e.g., Q-00001
      return `Q-${nextNumber.toString().padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating quotation number:', error);
      // Fallback: Use timestamp if there's an error
      return `Q-${Date.now()}`;
    }
  }
};