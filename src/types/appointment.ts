// Updated src/types/appointment.ts - add payment status and tracking

import { Timestamp } from 'firebase/firestore';
import { Doctor, DoctorProcedure } from './doctor';

export interface Patient {
  id?: string;
  name: string;
  contactNumber: string;
  email?: string;
  dateOfBirth?: string; // Changed from age to dateOfBirth (YYYY-MM-DD format)
  gender?: string;    
  bodyWeight?: number; 
  drugAllergies?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface AppointmentProcedure {
  procedureId: string;
  procedureName: string;
  doctorCharge: number;
  // centerCharge: number;
}

export interface AppointmentDocument {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  downloadURL: string;
  description?: string;
  uploadedAt: Date | Timestamp;
}

export interface AppointmentPayment {
  isPaid: boolean;
  paidAt?: number; // timestamp
  paidBy?: string; // payment method
  refunded?: boolean;
  refundedAt?: number; // timestamp
  transactionId?: string;
  cardDetails?: {
    maskedNumber: string; // 1234 5678 **** 1516
    storedNumber: string; // 1234567816 (only 1st, 2nd, 4th sets)
    cardType?: string; // visa, mastercard, etc.
  };
  // New fields for POS payment tracking
  paidThroughPOS?: boolean; // Whether payment was made through POS system
  posSaleId?: string; // Reference to the POS sale that paid for this appointment
  paidInAppointments?: boolean; // Whether payment was made in appointments section
}

export interface DoctorSession {
  id?: string;
  doctorId: string;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  arrivedAt?: number; // timestamp
  departedAt?: number; // timestamp
  isArrived: boolean;
  isDeparted: boolean;
  totalDoctorFees: number;
  totalPatients: number;
  arrivedPatients: number;
  isPaid: boolean;
  paidAt?: number;
  // expenseId?: string; // Reference to created expense
  // additionalExpenseIds?: string[]; // Array of expense IDs for post-departure patients
  // totalAdditionalDoctorFees?: number; 
  // createdAt?: Date | Timestamp;
  // updatedAt?: Date | Timestamp;
  expenseId?: string; // Reference to created expense
  additionalExpenseIds?: string[]; // Array of expense IDs for post-departure patients
  totalAdditionalDoctorFees?: number;
  unpaidPostDepartureFees?: number; // Add this field to track unpaid fees
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface Appointment {
  id?: string;
  patientId: string;
  patientName: string;
  patientContact: string;
  doctorId: string;
  doctorName: string;
  date: string; // Format: YYYY-MM-DD
  dayOfWeek: string;
  procedures?: AppointmentProcedure[];
  status: AppointmentStatus;
  notes?: string;
  totalCharge: number;
  manualAppointmentAmount?: number; // Manual appointment amount set by doctor
  isPatientArrived?: boolean;
  patientArrivedAt?: number; // timestamp
  payment?: AppointmentPayment;
  sessionId?: string;
  cashierSessionId?: string; 
  sessionAppointmentNumber?: number;
  createdBy?: {
    uid: string;
    email: string;
    role: string;
    displayName: string;
  };
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  // New fields for POS loading tracking
  loadedToPOS?: boolean; // Whether appointment has been loaded to POS
  loadedToPOSAt?: number; // Timestamp when loaded to POS
  loadedToPOSBy?: string; // User ID who loaded it to POS
  posSaleId?: string; // Reference to the POS sale created from this appointment
  isArchived?: boolean; // Whether appointment is archived (for paid appointments)
  archivedAt?: number; // Timestamp when archived
  // Pharmacy review tracking
  pharmacyReviewStatus?: 'pending' | 'reviewed' | 'not_required'; // Pharmacy review status
  pharmacyReviewedAt?: number; // Timestamp when pharmacy review was completed
  pharmacyReviewedBy?: string; // User ID who completed the pharmacy review
  pharmacyReviewNotes?: string; // Notes from pharmacy review
  // Appointment documents (PDFs, images, etc.)
  documents?: AppointmentDocument[];
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

// Helper function to check if a doctor session is available for new appointments

export const isSessionAvailable = (
  doctorId: string,
  date: string,
  sessionId: string,
  existingAppointments: Appointment[],
  currentAppointmentId?: string // For editing existing appointments
): boolean => {
  const relevantAppointments = existingAppointments.filter(
    app => 
      app.doctorId === doctorId && 
      app.date === date && 
      app.sessionId === sessionId &&
      app.id !== currentAppointmentId && // Exclude the current appointment when editing
      app.status !== 'cancelled' // Exclude cancelled appointments
  );

  // Sessions can have multiple appointments, so we don't limit by count
  // The session availability is managed by the doctor's schedule
  return true;
};

// Helper function to format date for display
export const formatAppointmentDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Function to calculate the total charge for an appointment


export const calculateTotalCharge = (procedures: AppointmentProcedure[]): number => {
  return procedures.reduce((total, proc) => total + proc.doctorCharge, 0);
};

// Function to calculate total doctor charges for a list of appointments
export const calculateTotalDoctorCharges = (appointments: Appointment[]): number => {
  return appointments.reduce((total, appointment) => {
    // Only count appointments that are paid and the patient has arrived
    if (appointment.payment?.isPaid && appointment.isPatientArrived) {
      // Sum up all doctor charges for this appointment
      const doctorCharges = (appointment.procedures || []).reduce(
        (sum, proc) => sum + proc.doctorCharge,
        0
      );
      return total + doctorCharges;
    }
    return total;
  }, 0);
};

// Function to calculate total center charges for a list of appointments
// Note: centerCharge is currently commented out in AppointmentProcedure interface
// export const calculateTotalCenterCharges = (appointments: Appointment[]): number => {
//   return appointments.reduce((total, appointment) => {
//     // Only count appointments that are paid
//     if (appointment.payment?.isPaid) {
//       // Sum up all center charges for this appointment
//       const centerCharges = appointment.procedures.reduce(
//         (sum, proc) => sum + proc.centerCharge,
//         0
//       );
//       return total + centerCharges;
//     }
//     return total;
//   }, 0);
// };

// Helper function to get session time from sessionId
export const getSessionTimeFromId = (sessionId: string): { startTime: string; endTime: string } | null => {
  // SessionId format: doctorId_date_startTime_endTime
  const parts = sessionId.split('_');
  if (parts.length >= 4) {
    const startTime = parts[parts.length - 2];
    const endTime = parts[parts.length - 1];
    return { startTime, endTime };
  }
  return null;
};