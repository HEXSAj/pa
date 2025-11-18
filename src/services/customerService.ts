// src/services/customerService.ts
import { database } from '@/lib/firebase';
import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { Customer } from '@/types/customer';

const COLLECTION = 'customers';

interface DocumentData {
  documentText: string;
  documentName: string;
  uploadedAt: number; // Timestamp as number in Realtime Database
}

export class CustomerExistsError extends Error {
  constructor(name: string) {
    super(`A customer with the name "${name}" already exists.`);
    this.name = 'CustomerExistsError';
  }
}

export const customerService = {
  async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
    // Query for customers with the same name
    const nameQuery = query(ref(database, COLLECTION), orderByChild('name'), equalTo(name));
    const snapshot = await get(nameQuery);
    
    if (!snapshot.exists()) {
      return false;
    }
    
    // If we're updating a customer, exclude the current customer from the check
    if (excludeId) {
      let foundMatch = false;
      snapshot.forEach((childSnapshot) => {
        if (childSnapshot.key !== excludeId) {
          foundMatch = true;
        }
      });
      return foundMatch;
    }
    
    return true;
  },

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) {
    // Check if customer with same name already exists
    const exists = await this.checkNameExists(customer.name);
    if (exists) {
      throw new CustomerExistsError(customer.name);
    }

    const now = Date.now();
    // Generate a new unique key
    const newCustomerRef = push(ref(database, COLLECTION));
    
    // Set data using the generated key
    await set(newCustomerRef, {
      name: customer.name,
      mobile: customer.mobile,
      address: customer.address || '',
      discountPercentage: customer.discountPercentage || 0,
      createdAt: now,
      updatedAt: now
    });
    
    return newCustomerRef;
  },

  async update(id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt'>>) {
    // If we're updating the name, check if that name already exists (excluding this customer)
    if (customer.name) {
      const exists = await this.checkNameExists(customer.name, id);
      if (exists) {
        throw new CustomerExistsError(customer.name);
      }
    }

    const customerRef = ref(database, `${COLLECTION}/${id}`);
    
    // Create update object with only the fields that need updating
    const updates: any = {
      updatedAt: Date.now()
    };
    
    if (customer.name) updates.name = customer.name;
    if (customer.mobile) updates.mobile = customer.mobile;
    if (customer.address !== undefined) updates.address = customer.address;
    if (customer.discountPercentage !== undefined) updates.discountPercentage = customer.discountPercentage;
    
    return update(customerRef, updates);
  },

  async updateDocumentData(id: string, documentData: DocumentData) {
    const customerRef = ref(database, `${COLLECTION}/${id}`);
    
    return update(customerRef, {
      documentText: documentData.documentText,
      documentName: documentData.documentName,
      documentUploadedAt: documentData.uploadedAt,
      updatedAt: Date.now()
    });
  },

  async delete(id: string) {
    const customerRef = ref(database, `${COLLECTION}/${id}`);
    return remove(customerRef);
  },



  async getAll() {
    const customersRef = ref(database, COLLECTION);
    const snapshot = await get(customersRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const customers: Customer[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      customers.push({
        id: childSnapshot.key,
        name: data.name,
        mobile: data.mobile,
        address: data.address,
        discountPercentage: data.discountPercentage,
        // Explicitly include loyalty points with a default of 0
        loyaltyPoints: data.loyaltyPoints || 0,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        documentText: data.documentText,
        documentName: data.documentName,
        documentUploadedAt: data.documentUploadedAt ? new Date(data.documentUploadedAt) : undefined
      });
    });
    
    return customers;
  },
 
  async updateLoyaltyPoints(customerId: string, newPoints: number) {
    if (!customerId) {
      console.error('No customer ID provided for updating loyalty points');
      return;
    }
    
    console.log(`Updating loyalty points for customer ${customerId} to ${newPoints}`);
    
    try {
      const customerRef = ref(database, `${COLLECTION}/${customerId}`);
      
      // Create update object with only the loyalty points field
      const updates = {
        loyaltyPoints: newPoints,
        updatedAt: Date.now()
      };
      
      await update(customerRef, updates);
      console.log(`Successfully updated loyalty points for customer ${customerId}`);
      return true;
    } catch (error) {
      console.error('Error updating customer loyalty points:', error);
      throw error;
    }
  },



  // async addLoyaltyPoints(customerId: string, pointsToAdd: number) {
  //   if (!customerId || pointsToAdd <= 0) return;
    
  //   try {
  //     // Get current customer data
  //     const customer = await this.getById(customerId);
  //     if (!customer) {
  //       throw new Error(`Customer with ID ${customerId} not found`);
  //     }
      
  //     // Calculate new loyalty points total
  //     const currentPoints = customer.loyaltyPoints || 0;
  //     const newPoints = currentPoints + pointsToAdd;
      
  //     // Update the customer record
  //     await this.updateLoyaltyPoints(customerId, newPoints);
      
  //     return newPoints;
  //   } catch (error) {
  //     console.error('Error adding loyalty points:', error);
  //     throw error;
  //   }
  // },
  

  async addLoyaltyPoints(customerId: string, pointsToAdd: number) {
    if (!customerId || pointsToAdd <= 0) {
      console.error('Invalid parameters for adding loyalty points');
      return;
    }
    
    console.log(`Adding ${pointsToAdd} loyalty points to customer ${customerId}`);
    
    try {
      // Get current customer data
      const customer = await this.getById(customerId);
      if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }
      
      // Calculate new loyalty points total
      const currentPoints = customer.loyaltyPoints || 0;
      const newPoints = currentPoints + pointsToAdd;
      
      console.log(`Current points: ${currentPoints}, New points: ${newPoints}`);
      
      // Update the customer record
      await this.updateLoyaltyPoints(customerId, newPoints);
      
      return newPoints;
    } catch (error) {
      console.error('Error adding loyalty points:', error);
      throw error;
    }
  },




  async consumeLoyaltyPoints(customerId: string, pointsToUse: number) {
    if (!customerId || pointsToUse <= 0) {
      console.error('Invalid parameters for consuming loyalty points');
      return;
    }
    
    console.log(`Attempting to consume ${pointsToUse} loyalty points from customer ${customerId}`);
    
    try {
      // Get current customer data with a fresh database call
      const customerRef = ref(database, `${COLLECTION}/${customerId}`);
      const snapshot = await get(customerRef);
      
      if (!snapshot.exists()) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }
      
      const customerData = snapshot.val();
      
      // Ensure we're getting the points as a number
      const currentPoints = parseFloat(customerData.loyaltyPoints || 0);
      
      console.log(`Retrieved customer data - Name: ${customerData.name}, Current points: ${currentPoints}`);
      
      // Check if customer has enough points
      if (currentPoints < pointsToUse) {
        throw new Error(`Customer only has ${currentPoints} points, cannot use ${pointsToUse}`);
      }
      
      // Calculate new loyalty points total
      const newPoints = currentPoints - pointsToUse;
      
      console.log(`Current points: ${currentPoints}, Points to use: ${pointsToUse}, New points after consumption: ${newPoints}`);
      
      // Update the customer record
      await update(customerRef, {
        loyaltyPoints: newPoints,
        updatedAt: Date.now()
      });
      
      console.log(`Successfully updated customer points to ${newPoints}`);
      
      return newPoints;
    } catch (error) {
      console.error('Error consuming loyalty points:', error);
      throw error;
    }
  },


  async getById(id: string) {
    const customerRef = ref(database, `${COLLECTION}/${id}`);
    const snapshot = await get(customerRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        id: snapshot.key,
        name: data.name,
        mobile: data.mobile,
        address: data.address,
        discountPercentage: data.discountPercentage,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        documentText: data.documentText,
        documentName: data.documentName,
        documentUploadedAt: data.documentUploadedAt ? new Date(data.documentUploadedAt) : undefined
      } as Customer;
    }
    
    return null;
  }
};