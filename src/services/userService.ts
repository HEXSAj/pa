// src/services/userService.ts

import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { UserData, UserRole } from '@/types/user';

export const userService = {
  async create(uid: string, userData: Omit<UserData, 'createdAt' | 'updatedAt'>) {
    const user = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await setDoc(doc(db, 'users', uid), user);
    return user;
  },

  async getAll() {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async getById(id: string) {
    const doc = await getDoc(doc(db, 'users', id));
    if (!doc.exists()) return null;
    return {
      id: doc.id,
      ...doc.data()
    };
  },

  async update(id: string, data: Partial<UserData>) {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    await updateDoc(doc(db, 'users', id), updateData);
  },

  async delete(id: string) {
    await deleteDoc(doc(db, 'users', id));
  },

  async updateRole(id: string, role: UserRole) {
    await updateDoc(doc(db, 'users', id), {
      role,
      updatedAt: new Date()
    });
  }
};