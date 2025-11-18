

// src/services/medicineTypeService.ts

import { database } from '@/lib/firebase';
import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { MedicineTypeModel } from '@/types/inventory';

const COLLECTION = 'medicineTypes';

export const medicineTypeService = {
  async create(type: Omit<MedicineTypeModel, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now();
    const typeData = {
      name: type.name,
      defaultUnit: type.defaultUnit,
      createdAt: now,
      updatedAt: now
    };

    // Generate a new key and set the data
    const newTypeRef = push(ref(database, COLLECTION));
    await set(newTypeRef, typeData);
    
    return newTypeRef;
  },

  async update(id: string, type: Partial<Omit<MedicineTypeModel, 'id' | 'createdAt'>>) {
    const typeRef = ref(database, `${COLLECTION}/${id}`);
    const updateData: any = {
      updatedAt: Date.now()
    };

    // Only update fields that were provided
    if (type.name !== undefined) updateData.name = type.name;
    if (type.defaultUnit !== undefined) updateData.defaultUnit = type.defaultUnit;

    return update(typeRef, updateData);
  },

  async delete(id: string) {
    // In a production app, you might want to check if this type is used by any items
    // before deleting it
    
    const typeRef = ref(database, `${COLLECTION}/${id}`);
    return remove(typeRef);
  },

  async getAll() {
    const typesRef = ref(database, COLLECTION);
    const snapshot = await get(typesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const types: MedicineTypeModel[] = [];
    
    // Convert the snapshot to array of types
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      types.push({
        id: childSnapshot.key,
        name: data.name,
        defaultUnit: data.defaultUnit,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    return types;
  },
  
  async getById(id: string) {
    const typeRef = ref(database, `${COLLECTION}/${id}`);
    const snapshot = await get(typeRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    return {
      id: snapshot.key,
      name: data.name,
      defaultUnit: data.defaultUnit,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    } as MedicineTypeModel;
  },
  
  async getByName(name: string) {
    const typesRef = ref(database, COLLECTION);
    const nameQuery = query(typesRef, orderByChild('name'), equalTo(name));
    const snapshot = await get(nameQuery);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    // Get the first match (should only be one)
    let type: MedicineTypeModel | null = null;
    snapshot.forEach((childSnapshot) => {
      if (!type) { // Only take the first match
        const data = childSnapshot.val();
        type = {
          id: childSnapshot.key,
          name: data.name,
          defaultUnit: data.defaultUnit,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
        };
      }
    });
    
    return type;
  }
};