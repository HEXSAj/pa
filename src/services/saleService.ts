

// src/services/saleService.ts
import { database } from '@/lib/firebase';
import { 
  ref, 
  set, 
  update, 
  remove, 
  get, 
  push, 
  query, 
  orderByChild, 
  equalTo,
  child
} from 'firebase/database';
import { Sale, SaleItem, PaymentRecord } from '@/types/sale';
import { purchaseService } from './purchaseService';
import { Customer } from '@/types/customer';
import { cashierService } from './cashierService';
import { customerService } from './customerService';

const COLLECTION = 'sales';
const BATCHES_COLLECTION = 'batches';
const INVENTORY_COLLECTION = 'inventory';

export const saleService = {

  private sanitizeForFirebase(obj: any): any {
    if (obj === undefined) return null;
    if (obj === null) return null;
    if (typeof obj !== 'object' || obj === null) return obj;
  
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeForFirebase(item));
    }
  
    const result: any = {};
    for (const key in obj) {
      // Skip undefined values
      if (obj[key] === undefined) continue;
      // Recursively sanitize nested objects
      result[key] = this.sanitizeForFirebase(obj[key]);
    }
    return result;
  },

  // Create a new sale - only supports local patients
  async create(sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'> & {
    paymentMethod: string;
    initialPayment?: number;
    dueAmount?: number;
    createdBy?: any;
    loyaltyPointsUsed?: number;
    patientType: 'local';
    invoiceNumber?: string;
    customerInfo?: {
      id: string | null;
      name: string;
      mobile: string;
      address?: string;
    };
    opdCharges?: number;
    procedures?: any[];
    labTests?: any[];
    proceduresTotal?: number;
    labTestsTotal?: number;
    pharmacyTotal?: number;
    manualAppointmentAmount?: number;
  }) {
    const now = Date.now();
    
    try {
      // First, create the sale
      const salesRef = ref(database, COLLECTION);
      const newSaleRef = push(salesRef);
      const saleId = newSaleRef.key!;

      // Sanitize the sale data
      const sanitizedSale = this.sanitizeForFirebase({
        ...sale,
        createdAt: now,
        updatedAt: now,
        saleDate: now,
      });

      await set(newSaleRef, sanitizedSale);

      // Update inventory - reduce quantities from batches
      if (sale.items && sale.items.length > 0) {
        await Promise.all(sale.items.map(async (item) => {
          if (item.batchId) {
            try {
              // Get the current batch
              const batchRef = ref(database, `${BATCHES_COLLECTION}/${item.batchId}`);
              const batchSnapshot = await get(batchRef);
              
              if (batchSnapshot.exists()) {
                const batchData = batchSnapshot.val();
                const currentQuantity = batchData.quantity || 0;
                const currentSubUnits = batchData.subUnits || 0;
                
                // Calculate new quantities
                const newQuantity = Math.max(0, currentQuantity - (item.unitQuantity || 0));
                const newSubUnits = Math.max(0, currentSubUnits - (item.subUnitQuantity || 0));
                
                // Update the batch
                await update(batchRef, {
                  quantity: newQuantity,
                  subUnits: newSubUnits,
                  updatedAt: Date.now()
                });
                
                console.log(`Updated batch ${item.batchId}: quantity ${currentQuantity} -> ${newQuantity}, subUnits ${currentSubUnits} -> ${newSubUnits}`);
              }
            } catch (batchError) {
              console.error(`Error updating batch ${item.batchId}:`, batchError);
              // Don't throw error - continue with other items
            }
          }
        }));
      }

      // Link to active cashier session if exists
      if (sale.createdBy && sale.createdBy.uid) {
        try {
          const activeSession = await cashierService.getActiveSession(sale.createdBy.uid);
          if (activeSession && activeSession.id) {
            // Calculate total amount (only LKR for local patients)
            const totalAmount = sale.totalAmount;
            
            // Add sale to session
            await cashierService.addSaleToSession(activeSession.id,saleId, totalAmount); 
            //   saleId: saleId,
            //   amount: totalAmount,
            //   paymentMethod: sale.paymentMethod,
            //   patientType: 'local',
            //   customerName: sale.customerInfo?.name || 'No Customer',
            //   timestamp: now
            // });
            
            console.log(`Added sale ${saleId} to cashier session ${activeSession.id}`);
          }
        } catch (sessionError) {
          console.error('Error linking sale to cashier session:', sessionError);
          // Don't fail the sale if session linking fails
        }
      }

      // Calculate and award loyalty points if eligible (local patients only)
      if (sale.customerId && 
          !sale.discountPercentage && 
          !(sale.totalDiscount > 0) && 
          !(sale.loyaltyPointsUsed > 0)) {
        try {
          console.log(`Calculating loyalty points for customer ${sale.customerId} on sale ${saleId}`);
          
          // Calculate points: 0.01 points per Rs 1000
          const pointsEarned = (sale.totalAmount / 1000) * 0.01;
          
          // Round to 2 decimal places
          const roundedPoints = Math.round(pointsEarned * 100) / 100;
          
          if (roundedPoints > 0) {
            console.log(`Awarding ${roundedPoints} loyalty points to customer ${sale.customerId}`);
            
            // Add points to customer's account
            await customerService.addLoyaltyPoints(sale.customerId, roundedPoints);
            
            // Update the sale record with points earned
            const saleRef = ref(database, `${COLLECTION}/${saleId}`);
            await update(saleRef, {
              loyaltyPointsEarned: roundedPoints
            });
            
            console.log(`Successfully awarded loyalty points to customer ${sale.customerId}`);
          } else {
            console.log(`Sale amount too small to earn loyalty points`);
          }
        } catch (loyaltyError) {
          console.error("Error processing loyalty points:", loyaltyError);
          // Don't fail the sale if loyalty points fail
        }
      } else {
        console.log(`Sale not eligible for loyalty points:
          - Has customer: ${Boolean(sale.customerId)}
          - No discount: ${!sale.discountPercentage && !(sale.totalDiscount > 0)}
          - No loyalty points used: ${!(sale.loyaltyPointsUsed > 0)}`);
      }
      
      return { id: saleId };
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  // Get all sales
  async getAll() {
    const salesRef = ref(database, COLLECTION);
    const snapshot = await get(salesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const sales: Sale[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      
      // Convert timestamps to Date objects
      const sale: Sale = {
        id: childSnapshot.key,
        ...data,
        saleDate: new Date(data.saleDate),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        // Ensure patientType is only 'local'
        patientType: 'local'
      };
      
      sales.push(sale);
    });
    
    // Sort by creation date (newest first)
    return sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // Get sale by ID
  async getById(id: string) {
    const saleRef = ref(database, `${COLLECTION}/${id}`);
    const snapshot = await get(saleRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    
    return {
      id: snapshot.key,
      ...data,
      saleDate: new Date(data.saleDate),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      // Ensure patientType is only 'local'
      patientType: 'local' as const
    } as Sale;
  },

  // Update sale
  async update(id: string, updates: Partial<Sale>) {
    const saleRef = ref(database, `${COLLECTION}/${id}`);
    const updateData = {
      ...updates,
      updatedAt: Date.now(),
      // Ensure patientType remains 'local'
      patientType: 'local'
    };
    
    return update(saleRef, this.sanitizeForFirebase(updateData));
  },

  // Delete sale
  async delete(id: string) {
    const saleRef = ref(database, `${COLLECTION}/${id}`);
    return remove(saleRef);
  },

  // Get sales by customer ID
  async getSalesByCustomer(customerId: string) {
    const salesRef = ref(database, COLLECTION);
    const customerQuery = query(salesRef, orderByChild('customerId'), equalTo(customerId));
    const snapshot = await get(customerQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const sales: Sale[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      sales.push({
        id: childSnapshot.key,
        ...data,
        saleDate: new Date(data.saleDate),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        patientType: 'local' as const
      });
    });
    
    return sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // Get sales by date range
  async getSalesByDateRange(startDate: Date, endDate: Date) {
    const salesRef = ref(database, COLLECTION);
    const snapshot = await get(salesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const sales: Sale[] = [];
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      const saleDate = new Date(data.saleDate).getTime();
      
      if (saleDate >= startTime && saleDate <= endTime) {
        sales.push({
          id: childSnapshot.key,
          ...data,
          saleDate: new Date(data.saleDate),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          patientType: 'local' as const
        });
      }
    });
    
    return sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // Add payment to a credit sale
  async addPayment(saleId: string, payment: Omit<PaymentRecord, 'id'>) {
    const saleRef = ref(database, `${COLLECTION}/${saleId}`);
    const snapshot = await get(saleRef);
    
    if (!snapshot.exists()) {
      throw new Error('Sale not found');
    }
    
    const saleData = snapshot.val();
    const paymentHistory = saleData.paymentHistory || [];
    
    // Build new payment object, excluding undefined values
    const newPayment: any = {
      amount: payment.amount,
      date: payment.date.getTime(),
      paymentMethod: payment.paymentMethod
    };
    
    // Only add optional fields if they have values
    if (payment.notes !== undefined && payment.notes !== null && payment.notes !== '') {
      newPayment.notes = payment.notes;
    }
    
    if (payment.recordedBy !== undefined && payment.recordedBy !== null && payment.recordedBy !== '') {
      newPayment.recordedBy = payment.recordedBy;
    }
    
    // Add ID
    newPayment.id = push(ref(database)).key;
    
    paymentHistory.push(newPayment);
    
    // Calculate new due amount
    const totalPaid = paymentHistory.reduce((sum: number, p: any) => sum + p.amount, 0);
    const dueAmount = Math.max(0, saleData.totalAmount - totalPaid);
    const isPaid = dueAmount === 0;
    
    // Update sale - filter out undefined values
    const updateData: any = {
      paymentHistory: paymentHistory.map((p: any) => {
        const cleanPayment: any = {
          amount: p.amount,
          paymentMethod: p.paymentMethod
        };
        
        // Ensure date is valid - convert to timestamp if needed
        if (p.date !== undefined && p.date !== null) {
          if (typeof p.date === 'number') {
            cleanPayment.date = p.date;
          } else if (p.date instanceof Date) {
            cleanPayment.date = p.date.getTime();
          } else {
            // Try to convert to number
            const dateNum = typeof p.date === 'string' ? Date.parse(p.date) : Number(p.date);
            if (!isNaN(dateNum)) {
              cleanPayment.date = dateNum;
            }
          }
        }
        
        // Only include id if it exists and is not undefined
        if (p.id !== undefined && p.id !== null && p.id !== '') {
          cleanPayment.id = p.id;
        }
        
        // Only include optional fields if they exist
        if (p.notes !== undefined && p.notes !== null && p.notes !== '') {
          cleanPayment.notes = p.notes;
        }
        
        if (p.recordedBy !== undefined && p.recordedBy !== null && p.recordedBy !== '') {
          cleanPayment.recordedBy = p.recordedBy;
        }
        
        return cleanPayment;
      }),
      dueAmount,
      isPaid,
      updatedAt: Date.now()
    };
    
    return update(saleRef, updateData);
  },

  // Record payment (alias for addPayment with return value)
  async recordPayment(saleId: string, payment: Omit<PaymentRecord, 'id'>) {
    const saleRef = ref(database, `${COLLECTION}/${saleId}`);
    const snapshot = await get(saleRef);
    
    if (!snapshot.exists()) {
      throw new Error('Sale not found');
    }
    
    const saleData = snapshot.val();
    const paymentHistory = saleData.paymentHistory || [];
    
    // Build new payment object, excluding undefined values
    const newPayment: any = {
      amount: payment.amount,
      date: payment.date.getTime(),
      paymentMethod: payment.paymentMethod
    };
    
    // Only add optional fields if they have values
    if (payment.notes !== undefined && payment.notes !== null && payment.notes !== '') {
      newPayment.notes = payment.notes;
    }
    
    if (payment.recordedBy !== undefined && payment.recordedBy !== null && payment.recordedBy !== '') {
      newPayment.recordedBy = payment.recordedBy;
    }
    
    // Add ID
    newPayment.id = push(ref(database)).key;
    
    paymentHistory.push(newPayment);
    
    // Calculate new due amount
    const totalPaid = paymentHistory.reduce((sum: number, p: any) => sum + p.amount, 0);
    const dueAmount = Math.max(0, saleData.totalAmount - totalPaid);
    const isPaid = dueAmount === 0;
    
    // Update sale - filter out undefined values
    const updateData: any = {
      paymentHistory: paymentHistory.map((p: any) => {
        const cleanPayment: any = {
          amount: p.amount,
          paymentMethod: p.paymentMethod
        };
        
        // Ensure date is valid - convert to timestamp if needed
        if (p.date !== undefined && p.date !== null) {
          if (typeof p.date === 'number') {
            cleanPayment.date = p.date;
          } else if (p.date instanceof Date) {
            cleanPayment.date = p.date.getTime();
          } else {
            // Try to convert to number
            const dateNum = typeof p.date === 'string' ? Date.parse(p.date) : Number(p.date);
            if (!isNaN(dateNum)) {
              cleanPayment.date = dateNum;
            }
          }
        }
        
        // Only include id if it exists and is not undefined
        if (p.id !== undefined && p.id !== null && p.id !== '') {
          cleanPayment.id = p.id;
        }
        
        // Only include optional fields if they exist
        if (p.notes !== undefined && p.notes !== null && p.notes !== '') {
          cleanPayment.notes = p.notes;
        }
        
        if (p.recordedBy !== undefined && p.recordedBy !== null && p.recordedBy !== '') {
          cleanPayment.recordedBy = p.recordedBy;
        }
        
        return cleanPayment;
      }),
      dueAmount,
      isPaid,
      updatedAt: Date.now()
    };
    
    await update(saleRef, updateData);
    
    return {
      newDueAmount: dueAmount,
      isPaid,
      totalPaid
    };
  },

  // Get sales with due amounts
  async getSalesWithDueAmounts() {
    try {
      const salesRef = ref(database, COLLECTION);
      const snapshot = await get(salesRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const salesData = snapshot.val();
      const sales: Sale[] = [];
      
      for (const key in salesData) {
        const sale = salesData[key];
        // Convert timestamps to Date objects
        if (sale.createdAt) {
          sale.createdAt = new Date(sale.createdAt);
        }
        if (sale.updatedAt) {
          sale.updatedAt = new Date(sale.updatedAt);
        }
        if (sale.saleDate) {
          sale.saleDate = new Date(sale.saleDate);
        }
        // Convert payment history dates safely
        if (sale.paymentHistory && Array.isArray(sale.paymentHistory)) {
          sale.paymentHistory = sale.paymentHistory.map((p: any) => {
            let paymentDate: Date;
            if (p.date instanceof Date) {
              paymentDate = p.date;
            } else if (typeof p.date === 'number') {
              paymentDate = new Date(p.date);
            } else if (p.date) {
              paymentDate = new Date(p.date);
            } else {
              paymentDate = new Date(); // Fallback
            }
            
            // Validate date
            if (isNaN(paymentDate.getTime())) {
              paymentDate = new Date(); // Fallback if invalid
            }
            
            return {
              ...p,
              date: paymentDate
            };
          });
        }
        sale.id = key;
        
        // Only include sales with due amounts
        if (sale.dueAmount && sale.dueAmount > 0) {
          sales.push(sale);
        }
      }
      
      // Sort by due amount (highest first) or by date
      sales.sort((a, b) => {
        // First sort by due amount (highest first)
        if (b.dueAmount !== a.dueAmount) {
          return (b.dueAmount || 0) - (a.dueAmount || 0);
        }
        // Then by date (newest first)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      return sales;
    } catch (error) {
      console.error('Error getting sales with due amounts:', error);
      throw error;
    }
  },

  // Get sales statistics
  async getSalesStats(startDate?: Date, endDate?: Date) {
    const sales = startDate && endDate 
      ? await this.getSalesByDateRange(startDate, endDate)
      : await this.getAll();
    
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Payment method breakdown
    const paymentMethods = sales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Insurance vs non-insurance breakdown
    const insuranceBreakdown = sales.reduce((acc, sale) => {
      if (sale.isInsurancePatient) {
        acc.insurance += sale.totalAmount;
        acc.insuranceCount++;
      } else {
        acc.nonInsurance += sale.totalAmount;
        acc.nonInsuranceCount++;
      }
      return acc;
    }, { insurance: 0, insuranceCount: 0, nonInsurance: 0, nonInsuranceCount: 0 });
    
    return {
      totalSales,
      totalRevenue,
      averageSaleValue,
      paymentMethods,
      insuranceBreakdown,
      currency: 'LKR' // Only LKR for local patients
    };
  },

  // Get latest sale (for receipt printing)
  async getLatestSale(userId: string) {
    try {
      const salesRef = ref(database, COLLECTION);
      const snapshot = await get(salesRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      let latestSale = null;
      let latestTimestamp = 0;
      
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.createdBy?.uid === userId && data.createdAt > latestTimestamp) {
          latestTimestamp = data.createdAt;
          latestSale = {
            id: childSnapshot.key,
            ...data
          };
        }
      });
      
      if (!latestSale) {
        return null;
      }
      
      // Populate item and batch details
      const saleId = latestSale.id;
      const saleData = latestSale;
      
      // Get detailed item information
      const itemsPromises = saleData.items.map(async (item: any) => {
        try {
          // Get item details
          const itemRef = ref(database, `${INVENTORY_COLLECTION}/${item.itemId}`);
          const itemSnapshot = await get(itemRef);
          const itemData = itemSnapshot.exists() ? itemSnapshot.val() : {};
          
          // Get batch details
          const batchRef = ref(database, `${BATCHES_COLLECTION}/${item.batchId}`);
          const batchSnapshot = await get(batchRef);
          const batchData = batchSnapshot.exists() ? batchSnapshot.val() : {};
          
          return {
            ...item,
            item: {
              id: item.itemId,
              ...itemData
            },
            batch: {
              id: item.batchId,
              ...batchData,
              expiryDate: new Date(batchData.expiryDate)
            }
          };
        } catch (err) {
          console.error(`Error fetching details for item ${item.itemId}:`, err);
          return item;
        }
      });
      
      const populatedItems = await Promise.all(itemsPromises);
      
      // Get customer information
      let customerData = undefined;
      if (saleData.customerInfo) {
        customerData = {
          id: saleData.customerInfo.id,
          name: saleData.customerInfo.name,
          mobile: saleData.customerInfo.mobile,
          address: saleData.customerInfo.address
        };
      } else if (saleData.customer) {
        customerData = saleData.customer;
      }
      
      return {
        id: saleId,
        ...saleData,
        items: populatedItems,
        discountPercentage: saleData.discountPercentage || 0,
        totalDiscount: saleData.totalDiscount || 0,
        initialPayment: saleData.initialPayment || 0,
        dueAmount: saleData.dueAmount || 0,
        isPaid: saleData.isPaid || false,
        paymentHistory: saleData.paymentHistory || [],
        saleDate: new Date(saleData.saleDate),
        createdAt: new Date(saleData.createdAt),
        updatedAt: new Date(saleData.updatedAt),
        customer: customerData,
        patientType: 'local' as const
      } as Sale;
    } catch (error) {
      console.error('Error getting latest sale:', error);
      return null;
    }
  }
};