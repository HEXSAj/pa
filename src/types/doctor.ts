// src/types/doctor.ts

import { Timestamp } from 'firebase/firestore';

export interface Doctor {
  id?: string;
  name: string;
  speciality: string;
  description?: string;
  contactNumber?: string;
  email?: string;
  isActive: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TimeSlot {
  id?: string;
  startTime: string; // Format: HH:MM (24-hour)
  endTime: string;   // Format: HH:MM (24-hour)
}

export interface DoctorSchedule {
  id?: string;
  doctorId: string;
  doctorName?: string; // For easier display
  dayOfWeek: WeekDay;
  timeSlots: TimeSlot[];
  isActive: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface MedicalProcedure {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface DoctorProcedure {
  id?: string;
  doctorId: string;
  doctorName?: string; // For easier display
  procedureId: string;
  procedureName?: string; // For easier display
  doctorCharge: number; // in Rs
  description?: string;
  isActive: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Helper function to get total charge
export const getTotalCharge = (doctorProcedure: DoctorProcedure): number => {
  return doctorProcedure.doctorCharge || 0;
};

// Helper function to format currency in Sri Lankan Rupees
export const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) return 'Rs. 0.00';
  return `Rs. ${amount.toFixed(2)}`;
};