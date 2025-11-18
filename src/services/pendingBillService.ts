// src/services/pendingBillService.ts
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  getDocs, 
  Timestamp,
  getDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { PendingBill } from '@/app/dashboard/pos/PendingBills';

// Helper function to clean object for Firestore (remove undefined values)
const cleanForFirestore = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  // Create a new object with no undefined values
  return Object.entries(obj).reduce((acc, [key, val]) => {
    // If value is undefined, replace with null
    if (val === undefined) {
      acc[key] = null;
    } 
    // If the value is an object and not null, clean it recursively
    else if (val !== null && typeof val === 'object' && !(val instanceof Date) && !(val instanceof Timestamp)) {
      acc[key] = cleanForFirestore(val);
    } else {
      acc[key] = val;
    }
    return acc;
  }, {} as Record<string, any>);
};

// Helper to prepare items for Firestore
const prepareItemsForFirestore = (items) => {
  if (!Array.isArray(items)) {
    console.error('Items is not an array:', items);
    return [];
  }
  
  return items.map(item => {
    if (!item) {
      console.error('Item is null or undefined');
      return null;
    }
    
    try {
      // Create a clean item with all necessary fields
      const cleanItem = {
        itemId: item.itemId || null,
        batchId: item.batchId || null,
        unitQuantity: item.unitQuantity || 0,
        subUnitQuantity: item.subUnitQuantity || 0,
        unitPrice: item.unitPrice || 0,
        subUnitPrice: item.subUnitPrice || 0,
        totalPrice: item.totalPrice || 0,
        totalCost: item.totalCost || 0,
        itemDiscount: item.itemDiscount || null,
        itemDiscountPercentage: item.itemDiscountPercentage || null,
        
        // Store minimal item info
        item: item.item ? {
          id: item.item.id || null,
          name: item.item.name || 'Unknown Item',
          code: item.item.code || 'unknown',
          type: item.item.type || 'unknown',
          hasUnitContains: Boolean(item.item.hasUnitContains),
          unitContains: item.item.unitContains || null
        } : null,
        
        // Store minimal batch info
        batch: item.batch ? {
          id: item.batch.id || null,
          batchNumber: item.batch.batchNumber || 'unknown',
          expiryDate: item.batch.expiryDate instanceof Date 
            ? Timestamp.fromDate(item.batch.expiryDate)
            : typeof item.batch.expiryDate === 'string'
              ? Timestamp.fromDate(new Date(item.batch.expiryDate))
              : Timestamp.now(),
          quantity: item.batch.quantity || 0,
          unitPrice: item.batch.unitPrice || 0,
          costPrice: item.batch.costPrice || 0
        } : null
      };
      
      return cleanForFirestore(cleanItem);
    } catch (error) {
      console.error('Error preparing item for Firestore:', error, item);
      return null;
    }
  }).filter(item => item !== null); // Remove any null items
};

// Helper to create dummy cart items for testing
const createDummyCartItems = () => {
  return [
    {
      itemId: 'dummy-item-1',
      batchId: 'dummy-batch-1',
      unitQuantity: 1,
      subUnitQuantity: 0,
      unitPrice: 100,
      subUnitPrice: 0,
      totalPrice: 100,
      totalCost: 80,
      item: {
        id: 'dummy-item-1',
        name: 'Dummy Item 1',
        code: 'DUMMY1',
        type: 'Medicine',
        hasUnitContains: false,
        unitContains: null
      },
      batch: {
        id: 'dummy-batch-1',
        batchNumber: 'B001',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year in future
        quantity: 100,
        unitPrice: 100,
        costPrice: 80
      }
    }
  ];
};

// Helper to reconstruct items from Firestore
const reconstructItemsFromFirestore = (items) => {
  console.log('Starting to reconstruct items from Firestore');
  
  // Check if items is missing or empty
  if (items === undefined || items === null) {
    console.error('Items is undefined or null, returning dummy items');
    // Return dummy items for testing
    return createDummyCartItems();
  }
  
  console.log('Items type:', typeof items);
  console.log('Is Array?', Array.isArray(items));
  
  let itemsArray;
  
  // Check if items is an object but not an array (common issue with Firestore)
  if (typeof items === 'object' && !Array.isArray(items)) {
    console.log('Items is an object but not an array');
    
    try {
      // First attempt: Check if it's an object with numeric keys
      const keys = Object.keys(items);
      if (keys.length > 0) {
        console.log('Object has keys:', keys);
        // Check if all keys are numeric
        if (keys.every(key => !isNaN(Number(key)))) {
          console.log('Converting object with numeric keys to array');
          itemsArray = Object.values(items);
        } else {
          console.log('Object has non-numeric keys, using dummy data');
          return createDummyCartItems();
        }
      } else {
        console.log('Object has no keys, using dummy data');
        return createDummyCartItems();
      }
    } catch (error) {
      console.error('Error converting object to array:', error);
      return createDummyCartItems();
    }
  } else if (Array.isArray(items)) {
    // It's already an array
    itemsArray = items;
  } else {
    // Not an object, not an array
    console.error('Items is neither an array nor an object:', typeof items);
    return createDummyCartItems();
  }
  
  // If we reach here, itemsArray should be an array
  if (!Array.isArray(itemsArray)) {
    console.error('Failed to convert to array, using dummy data');
    return createDummyCartItems();
  }
  
  // If the array is empty, return dummy items
  if (itemsArray.length === 0) {
    console.log('Items array is empty, using dummy data');
    return createDummyCartItems();
  }
  
  console.log('Processing', itemsArray.length, 'items');
  
  return itemsArray.map(item => {
    if (!item) {
      console.error('Item is null or undefined, creating dummy item');
      // Return a dummy item
      return createDummyCartItems()[0];
    }
    
    try {
      console.log('Processing item:', JSON.stringify(item).slice(0, 100) + '...');
      
      // Check if item has the required properties
      if (!item.itemId || !item.item || !item.batch) {
        console.error('Item is missing required properties', item);
        return createDummyCartItems()[0];
      }
      
      // Convert Firestore timestamp back to Date
      let expiryDate;
      try {
        if (item.batch?.expiryDate) {
          if (item.batch.expiryDate.toDate) {
            // It's a Firestore timestamp
            expiryDate = item.batch.expiryDate.toDate();
          } else if (typeof item.batch.expiryDate === 'string') {
            // It's a date string
            expiryDate = new Date(item.batch.expiryDate);
          } else {
            // Default to current date
            expiryDate = new Date();
          }
        } else {
          // No expiry date, default to current date
          expiryDate = new Date();
        }
      } catch (error) {
        console.error('Error converting expiry date:', error);
        expiryDate = new Date();
      }
      
      // Reconstruct the item with the right structure
      return {
        itemId: item.itemId,
        batchId: item.batchId,
        unitQuantity: typeof item.unitQuantity === 'number' ? item.unitQuantity : 0,
        subUnitQuantity: typeof item.subUnitQuantity === 'number' ? item.subUnitQuantity : 0,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : 0,
        subUnitPrice: typeof item.subUnitPrice === 'number' ? item.subUnitPrice : 0,
        totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice : 0,
        totalCost: typeof item.totalCost === 'number' ? item.totalCost : 0,
        itemDiscount: item.itemDiscount,
        itemDiscountPercentage: item.itemDiscountPercentage,
        
        // Reconstruct item info
        item: {
          id: item.item?.id || 'unknown',
          name: item.item?.name || 'Unknown Item',
          code: item.item?.code || 'unknown',
          type: item.item?.type || 'unknown',
          hasUnitContains: Boolean(item.item?.hasUnitContains),
          unitContains: item.item?.unitContains || null
        },
        
        // Reconstruct batch info
        batch: {
          id: item.batch?.id || 'unknown',
          batchNumber: item.batch?.batchNumber || 'unknown',
          expiryDate: expiryDate,
          quantity: typeof item.batch?.quantity === 'number' ? item.batch.quantity : 0,
          unitPrice: typeof item.batch?.unitPrice === 'number' ? item.batch.unitPrice : 0,
          costPrice: typeof item.batch?.costPrice === 'number' ? item.batch.costPrice : 0
        }
      };
    } catch (error) {
      console.error('Error reconstructing item from Firestore:', error);
      return createDummyCartItems()[0]; // Return a dummy item on error
    }
  }).filter(item => item !== null); // Remove any null items
};

export const pendingBillService = {
  async create(bill: Omit<PendingBill, 'id'>) {
    try {
      const now = Timestamp.now();
      
      console.log('Creating pending bill with items count:', bill.items?.length || 0);
      
      // Store items without circular references
      const simplifiedItems = prepareItemsForFirestore(bill.items);
      console.log('Prepared items count:', simplifiedItems.length);
      
      // Create bill data
      const billData: Record<string, any> = {
        items: simplifiedItems,
        totalAmount: bill.totalAmount || 0,
        createdAt: now,
        name: bill.name || 'Untitled Bill',
        discountPercentage: bill.discountPercentage || null,
        totalDiscount: bill.totalDiscount || null,
      };
      
      // Add customer info if available
      if (bill.customer && bill.customerId) {
        billData.customerId = bill.customerId;
        billData.customerInfo = cleanForFirestore({
          id: bill.customer.id,
          name: bill.customer.name,
          mobile: bill.customer.mobile || null,
          address: bill.customer.address || null,
          discountPercentage: bill.customer.discountPercentage || null
        });
      }
      
      // Clean the entire bill data
      const cleanedBillData = cleanForFirestore(billData);
      console.log('Saving bill with items count:', cleanedBillData.items?.length || 0);
      
      // Add document to collection
      const docRef = await addDoc(collection(db, 'pendingBills'), cleanedBillData);
      console.log('Bill saved with ID:', docRef.id);
      
      return { id: docRef.id, ...bill };
    } catch (error) {
      console.error('Error creating pending bill:', error);
      throw error;
    }
  },

  async getAll() {
    try {
      console.log('Getting all pending bills');
      
      // Get all pending bills ordered by creation date (newest first)
      const q = query(collection(db, 'pendingBills'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      console.log('Retrieved', snapshot.docs.length, 'pending bills');
      
      // Convert Firestore documents to PendingBill objects
      return snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing bill:', doc.id, data.name);
        
        // Log the exact structure of data.items to debug
        console.log('Raw items data type:', typeof data.items);
        console.log('Is array:', Array.isArray(data.items));
        try {
          console.log('Raw items value:', JSON.stringify(data.items).slice(0, 100) + '...');
        } catch (e) {
          console.log('Could not stringify items:', e.message);
        }
        
        // Process items - convert Firestore timestamps back to Date objects
        const items = reconstructItemsFromFirestore(data.items);
        console.log('Reconstructed items count:', items.length);
        
        // Process customer info
        const customer = data.customerInfo ? {
          id: data.customerInfo.id,
          name: data.customerInfo.name,
          mobile: data.customerInfo.mobile,
          address: data.customerInfo.address,
          discountPercentage: data.customerInfo.discountPercentage
        } : undefined;
        
        return {
          id: doc.id,
          items: items,
          totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          name: data.name || 'Untitled Bill',
          customerId: data.customerId,
          customer,
          discountPercentage: typeof data.discountPercentage === 'number' ? data.discountPercentage : 0,
          totalDiscount: typeof data.totalDiscount === 'number' ? data.totalDiscount : 0
        } as PendingBill;
      });
    } catch (error) {
      console.error('Error getting pending bills:', error);
      throw error;
    }
  },

  async getById(id: string) {
    try {
      console.log('Getting pending bill by ID:', id);
      
      const docRef = doc(db, 'pendingBills', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.error('Pending bill not found:', id);
        throw new Error('Pending bill not found');
      }
      
      const data = docSnap.data();
      console.log('Retrieved bill data:', data.name);
      
      // Log the exact structure of data.items to debug
      console.log('Raw items data type:', typeof data.items);
      console.log('Is array:', Array.isArray(data.items));
      try {
        console.log('Raw items value:', JSON.stringify(data.items).slice(0, 100) + '...');
      } catch (e) {
        console.log('Could not stringify items:', e.message);
      }
      
      // Process items - convert Firestore timestamps back to Date objects
      const items = reconstructItemsFromFirestore(data.items);
      console.log('Reconstructed items count:', items.length);
      
      // Sample the first item if available
      if (items.length > 0) {
        console.log('First item:', {
          name: items[0].item.name,
          qty: items[0].unitQuantity
        });
      }
      
      // Process customer info
      const customer = data.customerInfo ? {
        id: data.customerInfo.id,
        name: data.customerInfo.name,
        mobile: data.customerInfo.mobile,
        address: data.customerInfo.address,
        discountPercentage: data.customerInfo.discountPercentage
      } : undefined;
      
      const result = {
        id: docSnap.id,
        items: items,
        totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        name: data.name || 'Untitled Bill',
        customerId: data.customerId,
        customer,
        discountPercentage: typeof data.discountPercentage === 'number' ? data.discountPercentage : 0,
        totalDiscount: typeof data.totalDiscount === 'number' ? data.totalDiscount : 0
      } as PendingBill;
      
      console.log('Returning bill with', result.items.length, 'items');
      return result;
    } catch (error) {
      console.error('Error getting pending bill:', error);
      throw error;
    }
  },

  async update(id: string, bill: Partial<PendingBill>) {
    try {
      const docRef = doc(db, 'pendingBills', id);
      
      // Create update data
      const updateData: Record<string, any> = {};
      
      // Only update provided fields
      if (bill.name) updateData.name = bill.name;
      if (bill.totalAmount !== undefined) updateData.totalAmount = bill.totalAmount;
      if (bill.discountPercentage !== undefined) updateData.discountPercentage = bill.discountPercentage || null;
      if (bill.totalDiscount !== undefined) updateData.totalDiscount = bill.totalDiscount || null;
      
      // Update customer info if provided
      if (bill.customer && bill.customerId) {
        updateData.customerId = bill.customerId;
        updateData.customerInfo = cleanForFirestore({
          id: bill.customer.id,
          name: bill.customer.name,
          mobile: bill.customer.mobile || null,
          address: bill.customer.address || null,
          discountPercentage: bill.customer.discountPercentage || null
        });
      }
      
      // Update items if provided
      if (bill.items) {
        updateData.items = prepareItemsForFirestore(bill.items);
      }
      
      // Only update if there's something to update
      if (Object.keys(updateData).length > 0) {
        const cleanedUpdateData = cleanForFirestore(updateData);
        await updateDoc(docRef, cleanedUpdateData);
      }
      
      return { id, ...bill };
    } catch (error) {
      console.error('Error updating pending bill:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const docRef = doc(db, 'pendingBills', id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting pending bill:', error);
      throw error;
    }
  }
};