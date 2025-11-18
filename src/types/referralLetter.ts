// src/types/referralLetter.ts

import { Timestamp } from 'firebase/firestore';
import { ReferralDoctor } from './referralDoctor';
import { Patient } from './appointment';

export interface ReferralLetter {
  id?: string;
  appointmentId?: string; // Optional link to appointment
  patientId: string;
  patientName: string;
  patientContact: string;
  patientAge?: number | null;
  patientGender?: string | null;
  referralDoctorId: string;
  referralDoctorName: string;
  referralDoctorSpecialty: string;
  referralDoctorQualifications: string;
  referralDoctorTitles?: string | null;
  referralDoctorHospital?: string | null;
  referralDoctorContact?: string | null;
  referralDoctorEmail?: string | null;
  referralDoctorAddress?: string | null;
  referralNote: string;
  referralDate: string; // Format: YYYY-MM-DD
  status: ReferralStatus;
  createdBy?: {
    uid: string;
    email: string;
    role: string;
    displayName: string;
  } | null;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export type ReferralStatus = 'pending' | 'sent' | 'received' | 'completed' | 'cancelled';

export interface ReferralLetterFormData {
  patientId: string;
  referralDoctorId: string;
  referralNote: string;
  referralDate: string;
}

export interface ReferralLetterSearchFilters {
  patientName?: string;
  patientContact?: string;
  referralDoctorName?: string;
  specialty?: string;
  status?: ReferralStatus;
  dateFrom?: string;
  dateTo?: string;
}

// Helper function to format referral date for display
export const formatReferralDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to get status color
export const getReferralStatusColor = (status: ReferralStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'sent':
      return 'bg-blue-100 text-blue-800';
    case 'received':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Helper function to get status label
export const getReferralStatusLabel = (status: ReferralStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'sent':
      return 'Sent';
    case 'received':
      return 'Received';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};
