// src/types/staff.ts

export interface StaffUser {
    uid: string;
    displayName?: string;
    email: string;
     role: 'admin' | 'pharmacy' | 'cashier' | 'doctor'; 
     doctorId?: string; 
    createdAt: string; // ISO date string for Realtime Database
    updatedAt: string;
    passwordResetAt?: Date | any;
  }