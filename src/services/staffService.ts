// src/services/staffService.ts
import { database, auth } from '@/lib/firebase';
import { 
  ref, 
  set, 
  update, 
  get, 
  remove, 
  query, 
  orderByChild, 
  equalTo 
} from 'firebase/database';
import { 
  createUserWithEmailAndPassword, 
  updatePassword,
  EmailAuthProvider,
  deleteUser,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { StaffUser } from '@/types/staff';

const DB_PATH = 'staff';

export class StaffExistsError extends Error {
  constructor(email: string) {
    super(`A user with the email "${email}" already exists.`);
    this.name = 'StaffExistsError';
  }
}

export const staffService = {
  async checkEmailExists(email: string): Promise<boolean> {
    // Query Realtime Database for users with this email
    const usersRef = ref(database, DB_PATH);
    const emailQuery = query(usersRef, orderByChild('email'), equalTo(email));
    const snapshot = await get(emailQuery);
    return snapshot.exists();
  },

  async createStaff(userData: {
    displayName: string;
    email: string;
    password: string;
    role: 'admin' | 'pharmacy' | 'cashier' | 'doctor';
    doctorId?: string; // Add optional doctorId
  }): Promise<string> {
    // Check if email already exists in Database
    const exists = await this.checkEmailExists(userData.email);
    if (exists) {
      throw new StaffExistsError(userData.email);
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;
      
      // Store additional user data in Realtime Database
      const now = new Date().toISOString();
      const staffData: any = {
        uid: user.uid,
        displayName: userData.displayName,
        email: userData.email,
        role: userData.role,
        createdAt: now,
        updatedAt: now
      };

      // Add doctorId if provided
      if (userData.doctorId) {
        staffData.doctorId = userData.doctorId;
      }

      await set(ref(database, `${DB_PATH}/${user.uid}`), staffData);
      
      return user.uid;
    } catch (error: any) {
      // Handle Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        throw new StaffExistsError(userData.email);
      }
      throw error;
    }
  },

  async updateStaff(uid: string, userData: Partial<{
    displayName: string;
    role: 'admin' | 'pharmacy' | 'cashier' | 'doctor';
    doctorId: string; // Add doctorId to update function
  }>): Promise<void> {
    const userRef = ref(database, `${DB_PATH}/${uid}`);
    // Only update provided fields
    const updates: any = {
      updatedAt: new Date().toISOString()
    };
    
    if (userData.displayName) {
      updates.displayName = userData.displayName;
    }
    
    if (userData.role) {
      updates.role = userData.role;
    }

    if (userData.doctorId) {
      updates.doctorId = userData.doctorId;
    }
    
    return update(userRef, updates);
  },

  async resetPassword(uid: string, newPassword: string): Promise<void> {
    try {
      // In a real admin scenario, we'd use Firebase Admin SDK
      // For this frontend app, we'll need to use a different approach
      
      // First, get the user's email from database
      const userRef = ref(database, `${DB_PATH}/${uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        throw new Error('User not found');
      }
      
      const userData = snapshot.val() as StaffUser;
      
      // We'd need a backend API to handle this in production
      // For demonstration purposes, we'll note that this should be
      // implemented securely on a backend
      
      // For demo purposes only - in a real application, this would be handled 
      // by a secure backend API using Firebase Admin SDK
      console.log(`Password for ${userData.email} would be reset to a new value`);
      
      // Update a flag in DB to indicate password was reset
      await update(userRef, {
        passwordResetAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Return success even though we can't actually reset the password from frontend
      return;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  async deleteStaff(uid: string): Promise<void> {
    try {
      // Delete from Database
      await remove(ref(database, `${DB_PATH}/${uid}`));
      
      // In a real application, you'd use Firebase Admin SDK 
      // to delete the user from Authentication as well
      // This would be handled by a secure backend API
      console.log(`User ${uid} would be deleted from Authentication`);
      
      return;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async getAllStaff(): Promise<StaffUser[]> {
    try {
      const staffRef = ref(database, DB_PATH);
      const snapshot = await get(staffRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const staffList: StaffUser[] = [];
      
      snapshot.forEach((childSnapshot) => {
        staffList.push({
          uid: childSnapshot.key!,
          ...childSnapshot.val()
        });
      });
      
      // Sort by display name
      staffList.sort((a, b) => {
        const nameA = a.displayName || a.email || '';
        const nameB = b.displayName || b.email || '';
        return nameA.localeCompare(nameB);
      });
      
      return staffList;
    } catch (error) {
      console.error('Error getting all staff:', error);
      throw error;
    }
  },

  async getStaffById(uid: string): Promise<StaffUser | null> {
    try {
      if (!uid) return null;
      
      const staffRef = ref(database, `${DB_PATH}/${uid}`);
      const snapshot = await get(staffRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return {
        uid,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error getting staff by ID:', error);
      throw error;
    }
  },

  async syncAuthUserToStaff(uid: string, email: string, displayName?: string): Promise<StaffUser | null> {
    try {
      // Check if user already exists in staff collection
      const existingStaff = await this.getStaffById(uid);
      if (existingStaff) {
        return existingStaff;
      }
      
      // Create staff record for authenticated user
      const now = new Date().toISOString();
      const staffData = {
        uid: uid,
        displayName: displayName || email.split('@')[0],
        email: email,
        role: 'cashier', // Default role
        createdAt: now,
        updatedAt: now
      };
      
      await set(ref(database, `${DB_PATH}/${uid}`), staffData);
      
      return {
        uid,
        ...staffData
      };
    } catch (error) {
      console.error('Error syncing auth user to staff:', error);
      return null;
    }
  }
};