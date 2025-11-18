// src/types/referralDoctor.ts

import { Timestamp } from 'firebase/firestore';

export interface ReferralDoctor {
  id?: string;
  name: string;
  specialty: string;
  qualifications: string;
  titles?: string; // Optional titles like "Dr.", "Prof.", etc.
  contactNumber?: string;
  email?: string;
  hospital?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface ReferralDoctorFormData {
  name: string;
  specialty: string;
  qualifications: string;
  titles?: string;
  contactNumber?: string;
  email?: string;
  hospital?: string;
  address?: string;
  notes?: string;
}
