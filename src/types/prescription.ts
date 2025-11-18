// src/types/prescription.ts
import { Timestamp } from 'firebase/firestore';

export interface PrescriptionImage {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  downloadURL: string;
  description?: string;
  uploadedAt: Date | Timestamp;
}

export interface Prescription {
  id?: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientDateOfBirth?: string; // For multi-patient appointments, store DOB here
  patientAge?: string; // Calculated age for display
  patientContact?: string; // Contact number for new patients added to appointments
  patientGender?: string; // Gender for new patients added to appointments
  doctorId: string;
  doctorName: string;
  medicines?: Medicine[];
  // Multi-patient appointment support
  isPaid?: boolean; // Track if this patient's prescription has been paid
  paidAt?: Date | Timestamp; // When this patient's prescription was paid
  paidThroughPOS?: boolean; // Whether payment was made through POS

   // ENHANCED MEDICAL FIELDS
   presentingComplaint?: string; // P/C - The main reason why the patient is visiting
   
   // Enhanced medical history
   medicalHistory?: {
     pastMedicalHistory?: string; // Previous conditions like "HT, ANT MI, SVD, DES TO PLAD"
     surgicalHistory?: string; // Past surgeries like "DES TO PLAD 14.11.2020@ NHSL"
     currentMedications?: string; // Current meds like "ON THYRXN"
     allergies?: string; // Known allergies
     familyHistory?: string; // Family medical history
   };
   
   // Enhanced examination findings
   onExamination?: {
     temperature?: string; // Tem - Patient's temperature
     bloodPressure?: string; // BP - Patient's blood pressure like "115/75"
     heartRate?: string; // HR - Heart rate like "75"
     respiratoryRate?: string; // RR - Respiratory rate
     oxygenSaturation?: string; // SpO2 - Oxygen saturation
     other?: string; // Other findings like pulse rate, oxygen saturation
   };
   
   // Lab results
   labResults?: {
     tsh?: string; // TSH values like "7.9 -> 0.14 -> 4"
     hba1c?: string; // HbA1c like "N" (normal)
     ldl?: string; // LDL like "38"
     cholesterol?: string; // Total cholesterol
     glucose?: string; // Blood glucose
     creatinine?: string; // Kidney function
     other?: string; // Additional lab values
     // Detailed lab results
     wbc?: string;
     ne?: string;
     ly?: string;
     hb?: string;
     plt?: string;
     crp?: string;
     esr?: string;
     pus?: string;
     red?: string;
     sug?: string;
     aib?: string;
     org?: string;
     tc?: string;
     tg?: string;
     hdl?: string;
     vldl?: string;
     tcHdl?: string;
     fbs?: string;
     sCr?: string;
     ast?: string;
     alt?: string;
     rf?: string;
     // Custom lab results - dynamic name-value pairs
     customLabResults?: Array<{
       id: string;
       name: string;
       value: string;
     }>;
   };
   
   // Imaging/Investigations
   investigations?: {
     ecg?: string; // ECG findings
     echo?: string; // Echocardiogram findings like "DILATED LV, MILD MR"
     xray?: string; // X-ray findings
     ct?: string; // CT scan findings
     mri?: string; // MRI findings
     other?: string; // Other investigations
   };
   
   diagnosis?: string; // Doctor's conclusion about patient's condition

   // MEDICAL TESTS SUPPORT
   medicalTests?: MedicalTest[]; // Array of medical tests prescribed

   // NEXT VISIT DATE
   nextVisitDate?: string; // Date for next visit in YYYY-MM-DD format

   // ADD IMAGE SUPPORT
  images?: PrescriptionImage[]; 

  // REFERRAL LETTER SUPPORT
  referralLetterId?: string; // Reference to associated referral letter

  // APPOINTMENT AMOUNT SUPPORT
  appointmentAmount?: number; // Amount for the appointment that can be loaded to POS

  notes?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  createdBy: string; // userId who created the prescription
}

// Updated Medicine interface to support both inventory and written medicines
export interface Medicine {
  id: string; // unique identifier for this medicine entry
  medicineName: string;
  genericName?: string; // for written medicines
  tradeName?: string; // optional trade name for written medicines
  dose: string; // e.g., "1 tab", "2 tab", "½ tab", "¼ tab", "2.5ml", "5ml", "10ml", "Custom ml"
  customMl?: number; // custom ML value when dose is "Custom ml"
  frequency: string; // e.g., "bd", "tds", "4 hourly", "6 hourly", "8 hourly", "mane", "nocte", "EOD", "Weekly"
  days: number; // number of days
  drugCount: number; // auto-calculated: dose × frequency × days (for ML: defaults to 1 bottle, can be overridden)
  calculatedMl?: number; // calculated total ML needed for the treatment duration
  specialNote?: string; // special instructions
  instructions?: string; // legacy field for backward compatibility
  duration?: string; // legacy field for backward compatibility
  dosage?: string; // legacy field for backward compatibility
  source: 'inventory' | 'written'; // to distinguish between inventory and written medicines
  inventoryId?: string; // reference to inventory item if source is 'inventory'
  pharmacyEdited?: boolean; // Flag to indicate if the item was edited in pharmacy POS
  pharmacyAdded?: boolean; // Flag to indicate if the item was added in pharmacy POS
  originalDrugCount?: number; // Store the original drug count before pharmacy edits
  outOfStock?: boolean; // Flag to indicate if pharmacy marked this medicine as out of stock
  outOfStockNote?: string; // Optional note about out of stock status
}

export interface MedicineTemplate {
  id?: string;
  doctorId: string;
  doctorName?: string;
  name: string;
  description?: string;
  inventoryMedicines: Medicine[];
  writtenMedicines: Medicine[];
  isActive: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Medical Test interfaces
export interface MedicalTest {
  id: string; // unique identifier for this test entry
  testName: string;
  testType?: string; // e.g., "Blood Test", "X-Ray", "Ultrasound", "ECG"
  instructions?: string; // Special instructions for the test
  urgency?: 'routine' | 'urgent' | 'stat'; // Test urgency level
  fastingRequired?: boolean; // Whether patient needs to fast before test
  fastingInstructions?: string; // Specific fasting instructions
}

export interface MedicalTestTemplate {
  id?: string;
  testName: string;
  testType: string;
  commonInstructions: string[];
  category?: string; // e.g., "Blood Tests", "Imaging", "Cardiology"
  isActive: boolean;
  fastingRequired: boolean;
  defaultUrgency: 'routine' | 'urgent' | 'stat';
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}