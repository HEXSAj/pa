// src/services/supplierService.ts
import { database } from '@/lib/firebase';
import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { Supplier } from '@/types/supplier';

const COLLECTION = 'suppliers';

export class SupplierExistsError extends Error {
  constructor(name: string) {
    super(`A supplier with the name "${name}" already exists.`);
    this.name = 'SupplierExistsError';
  }
}

export const supplierService = {
  async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
    // Query for suppliers with the same name
    const nameQuery = query(ref(database, COLLECTION), orderByChild('name'), equalTo(name));
    const snapshot = await get(nameQuery);
    
    if (!snapshot.exists()) {
      return false;
    }
    
    // If we're updating a supplier, exclude the current supplier from the check
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

  async create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) {
    // Check if supplier with same name already exists
    const exists = await this.checkNameExists(supplier.name);
    if (exists) {
      throw new SupplierExistsError(supplier.name);
    }

    const now = Date.now();
    // Generate a new unique key
    const newSupplierRef = push(ref(database, COLLECTION));
    
    // Set data using the generated key
    await set(newSupplierRef, {
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || '',
      notes: supplier.notes || '',
      status: supplier.status,
      createdAt: now,
      updatedAt: now
    });
    
    return newSupplierRef;
  },

  async update(id: string, supplier: Partial<Omit<Supplier, 'id' | 'createdAt'>>) {
    // If we're updating the name, check if that name already exists (excluding this supplier)
    if (supplier.name) {
      const exists = await this.checkNameExists(supplier.name, id);
      if (exists) {
        throw new SupplierExistsError(supplier.name);
      }
    }

    const supplierRef = ref(database, `${COLLECTION}/${id}`);
    
    // Create update object with only the fields that need updating
    const updates: any = {
      updatedAt: Date.now()
    };
    
    if (supplier.name) updates.name = supplier.name;
    if (supplier.phone) updates.phone = supplier.phone;
    if (supplier.email !== undefined) updates.email = supplier.email;
    if (supplier.address !== undefined) updates.address = supplier.address;
    if (supplier.contactPerson !== undefined) updates.contactPerson = supplier.contactPerson;
    if (supplier.notes !== undefined) updates.notes = supplier.notes;
    if (supplier.status) updates.status = supplier.status;
    
    return update(supplierRef, updates);
  },

  async delete(id: string) {
    const supplierRef = ref(database, `${COLLECTION}/${id}`);
    return remove(supplierRef);
  },

  async getAll() {
    const suppliersRef = ref(database, COLLECTION);
    const snapshot = await get(suppliersRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const suppliers: Supplier[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      suppliers.push({
        id: childSnapshot.key,
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        address: data.address || '',
        contactPerson: data.contactPerson || '',
        notes: data.notes || '',
        status: data.status,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      });
    });
    
    return suppliers;
  },

  async getActive() {
    const activeQuery = query(
      ref(database, COLLECTION),
      orderByChild('status'),
      equalTo('active')
    );
    
    const snapshot = await get(activeQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const suppliers: Supplier[] = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      suppliers.push({
        id: childSnapshot.key,
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        address: data.address || '',
        contactPerson: data.contactPerson || '',
        notes: data.notes || '',
        status: data.status,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      });
    });
    
    return suppliers;
  }
};