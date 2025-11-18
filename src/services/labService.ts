// src/services/labService.ts

import { database } from '@/lib/firebase';
import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { Lab } from '@/types/lab';

const COLLECTION = 'labs';

export const labService = {
  async create(lab: Omit<Lab, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now();
    
    const docData: any = {
      name: lab.name,
      contactNo: lab.contactNo,
      email: lab.email || '',
      address: lab.address || '',
      description: lab.description || '',
      isActive: lab.isActive !== undefined ? lab.isActive : true,
      createdAt: now,
      updatedAt: now
    };

    // Generate a new key and set the data
    const newLabRef = push(ref(database, COLLECTION));
    await set(newLabRef, docData);
    
    return newLabRef;
  },

  async update(id: string, lab: Partial<Omit<Lab, 'id' | 'createdAt'>>) {
    const labRef = ref(database, `${COLLECTION}/${id}`);

    const updateData: any = {
      updatedAt: Date.now()
    };

    // Only update fields that were provided
    if (lab.name !== undefined) updateData.name = lab.name;
    if (lab.contactNo !== undefined) updateData.contactNo = lab.contactNo;
    if (lab.email !== undefined) updateData.email = lab.email;
    if (lab.address !== undefined) updateData.address = lab.address;
    if (lab.description !== undefined) updateData.description = lab.description;
    if (lab.isActive !== undefined) updateData.isActive = lab.isActive;

    return update(labRef, updateData);
  },

  async delete(id: string) {
    const labRef = ref(database, `${COLLECTION}/${id}`);
    return remove(labRef);
  },

  async getAll() {
    const labsRef = ref(database, COLLECTION);
    const snapshot = await get(labsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const labs: Lab[] = [];
    
    // Convert the snapshot to array of labs
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      labs.push({
        id: childSnapshot.key,
        name: data.name || '',
        contactNo: data.contactNo || '',
        email: data.email || '',
        address: data.address || '',
        description: data.description || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    return labs;
  },
  
  async getById(id: string) {
    const labRef = ref(database, `${COLLECTION}/${id}`);
    const snapshot = await get(labRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    const lab: Lab = {
      id: snapshot.key,
      name: data.name || '',
      contactNo: data.contactNo || '',
      email: data.email || '',
      address: data.address || '',
      description: data.description || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
    
    return lab;
  },
  
  async searchByName(searchTerm: string) {
    // Get all labs and filter client-side (Firebase RTDB doesn't support text search)
    const labs = await this.getAll();
    return labs.filter(lab => 
      lab.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
};