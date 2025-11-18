// // src/services/prescriptionService.ts
// import { database } from '@/lib/firebase';
// import { ref, push, get, update, query, orderByChild, equalTo } from 'firebase/database';
// import { Prescription, Medicine, MedicineTemplate, PrescriptionImage, MedicalTest } from '@/types/prescription';
// import { imageUploadService } from './imageUploadService';
// import { medicalTestService } from './medicalTestService';

// const PRESCRIPTIONS_COLLECTION = 'prescriptions';
// const MEDICINE_TEMPLATES_COLLECTION = 'medicineTemplates';

// // Helper function to remove undefined values from objects
// const sanitizeForFirebase = (obj: any): any => {
//   if (obj === null || obj === undefined) {
//     return null;
//   }
  
//   if (Array.isArray(obj)) {
//     return obj.map(item => sanitizeForFirebase(item));
//   }
  
//   if (typeof obj === 'object') {
//     const sanitized: any = {};
//     for (const [key, value] of Object.entries(obj)) {
//       if (value !== undefined) {
//         sanitized[key] = sanitizeForFirebase(value);
//       }
//     }
//     return sanitized;
//   }
  
//   return obj;
// };

// export const prescriptionService = {
//   // Create a new prescription
//   // async createPrescription(prescriptionData: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
//   //   const prescriptionRef = push(ref(database, PRESCRIPTIONS_COLLECTION));
    
//   //   const now = Date.now();
//   //   const prescription: Prescription = {
//   //     ...prescriptionData,
//   //     id: prescriptionRef.key!,
//   //     createdAt: now,
//   //     updatedAt: now
//   //   };
    
//   //   await update(prescriptionRef, prescription);
//   //   return prescriptionRef.key!;
//   // },

//   async createPrescription(prescriptionData: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
//     console.log('=== PRESCRIPTION CREATION DEBUG ===');
//     console.log('Creating prescription with data:', prescriptionData);
    
//     // First, get the appointment to check if it's refunded
//     const { appointmentService } = await import('./appointmentService');
//     const appointment = await appointmentService.getAppointmentById(prescriptionData.appointmentId);
    
//     if (appointment?.payment?.refunded) {
//       throw new Error('Cannot create prescription for refunded appointment');
//     }
    
//     const prescriptionRef = push(ref(database, PRESCRIPTIONS_COLLECTION));
//     const prescriptionId = prescriptionRef.key!;
    
//     console.log('Generated prescription ID:', prescriptionId);
    
//     const now = Date.now();
//     const prescription: Prescription = {
//       ...prescriptionData,
//       id: prescriptionId,
//       createdAt: now,
//       updatedAt: now
//     };
    
//     console.log('Final prescription object:', prescription);
    
//     // Sanitize the data to remove undefined values before saving to Firebase
//     const sanitizedPrescription = sanitizeForFirebase(prescription);
//     console.log('Sanitized prescription object:', sanitizedPrescription);
    
//     await update(prescriptionRef, sanitizedPrescription);
//     console.log('Prescription saved to database');
    
//     return prescriptionId;
//   },


//   // async createPrescription(prescriptionData: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
//   //   // First, get the appointment to check if it's refunded
//   //   const { appointmentService } = await import('./appointmentService');
//   //   const appointment = await appointmentService.getAppointmentById(prescriptionData.appointmentId);
    
//   //   if (appointment?.payment?.refunded) {
//   //     throw new Error('Cannot create prescription for refunded appointment');
//   //   }
    
//   // const prescriptionRef = push(ref(database, PRESCRIPTIONS_COLLECTION));
    
//   //   const now = Date.now();
//   //   const prescription: Prescription = {
//   //     ...prescriptionData,
//   //     id: prescriptionRef.key!,
//   //     createdAt: now,
//   //     updatedAt: now
//   //   };
    
//   //   await update(prescriptionRef, prescription);
//   //   return prescriptionRef.key!;
//   // },

//   // Get prescription by appointment ID
 
 
//   async getPrescriptionByAppointmentId(appointmentId: string): Promise<Prescription | null> {
//     const prescriptionsRef = ref(database, PRESCRIPTIONS_COLLECTION);
//     const prescriptionQuery = query(prescriptionsRef, orderByChild('appointmentId'), equalTo(appointmentId));
    
//     const snapshot = await get(prescriptionQuery);
    
//     if (!snapshot.exists()) {
//       return null;
//     }
    
//     const prescriptions = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
//       ...data,
//       id,
//       createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
//       updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
//     }));
    
//     return prescriptions[0] || null; // Return the first (should be only one)
//   },

//   // Update prescription
//   // async updatePrescription(prescriptionId: string, updates: Partial<Prescription>): Promise<void> {
//   //   const prescriptionRef = ref(database, `${PRESCRIPTIONS_COLLECTION}/${prescriptionId}`);
    
//   //   const updateData = {
//   //     ...updates,
//   //     updatedAt: Date.now()
//   //   };
    
//   //   await update(prescriptionRef, updateData);
//   // },

//   async getPrescriptionById(prescriptionId: string): Promise<Prescription | null> {
//     const prescriptionRef = ref(database, `${PRESCRIPTIONS_COLLECTION}/${prescriptionId}`);
//     const snapshot = await get(prescriptionRef);
    
//     if (!snapshot.exists()) {
//       return null;
//     }
    
//     const data = snapshot.val();
//     return {
//       ...data,
//       id: prescriptionId,
//       createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
//       updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
//     };
//   },

//   async updatePrescriptionImages(
//     prescriptionId: string, 
//     images: PrescriptionImage[]
//   ): Promise<void> {
//     const prescriptionRef = ref(database, `${PRESCRIPTIONS_COLLECTION}/${prescriptionId}`);
//     const updateData = {
//       images: images,
//       updatedAt: Date.now()
//     };
    
//     // Sanitize the data to remove undefined values before saving to Firebase
//     const sanitizedUpdateData = sanitizeForFirebase(updateData);
    
//     await update(prescriptionRef, sanitizedUpdateData);
//   },

//   // Add image to existing prescription
//   async addImageToPrescription(
//     prescriptionId: string, 
//     imageFile: File, 
//     description?: string
//   ): Promise<PrescriptionImage> {
//     try {
//       // Upload image to storage
//       const imageRecord = await imageUploadService.uploadPrescriptionImage(
//         imageFile, 
//         prescriptionId, 
//         description
//       );
      
//       // Get current prescription
//       const prescription = await this.getPrescriptionById(prescriptionId);
//       if (!prescription) {
//         throw new Error('Prescription not found');
//       }
      
//       // Add image to prescription
//       const updatedImages = [...(prescription.images || []), imageRecord];
//       await this.updatePrescriptionImages(prescriptionId, updatedImages);
      
//       return imageRecord;
//     } catch (error) {
//       console.error('Error adding image to prescription:', error);
//       throw error;
//     }
//   },

//   // Remove image from prescription
//   async removeImageFromPrescription(
//     prescriptionId: string, 
//     imageId: string
//   ): Promise<void> {
//     try {
//       // Get current prescription
//       const prescription = await this.getPrescriptionById(prescriptionId);
//       if (!prescription) {
//         throw new Error('Prescription not found');
//       }
      
//       // Find the image to remove
//       const imageToRemove = prescription.images?.find(img => img.id === imageId);
//       if (imageToRemove) {
//         // Delete from storage
//         await imageUploadService.deleteImage(prescriptionId, imageToRemove.fileName);
//       }
      
//       // Remove from prescription
//       const updatedImages = prescription.images?.filter(img => img.id !== imageId) || [];
//       await this.updatePrescriptionImages(prescriptionId, updatedImages);
//     } catch (error) {
//       console.error('Error removing image from prescription:', error);
//       throw error;
//     }
//   },

//   async updatePrescription(prescriptionId: string, updates: Partial<Prescription>): Promise<void> {
//     const prescriptionRef = ref(database, `${PRESCRIPTIONS_COLLECTION}/${prescriptionId}`);
    
//     // If appointment is being updated, check if it's refunded
//     if (updates.appointmentId) {
//       const { appointmentService } = await import('./appointmentService');
//       const appointment = await appointmentService.getAppointmentById(updates.appointmentId);
      
//       if (appointment?.payment?.refunded) {
//         throw new Error('Cannot update prescription for refunded appointment');
//       }
//     }
    
//     const updateData = {
//       ...updates,
//       updatedAt: Date.now()
//     };
    
//     // Sanitize the data to remove undefined values before saving to Firebase
//     const sanitizedUpdateData = sanitizeForFirebase(updateData);
    
//     await update(prescriptionRef, sanitizedUpdateData);
//   },

//   // Get prescriptions by doctor ID
//   async getPrescriptionsByDoctorId(doctorId: string): Promise<Prescription[]> {
//     const prescriptionsRef = ref(database, PRESCRIPTIONS_COLLECTION);
//     const prescriptionQuery = query(prescriptionsRef, orderByChild('doctorId'), equalTo(doctorId));
    
//     const snapshot = await get(prescriptionQuery);
    
//     if (!snapshot.exists()) {
//       return [];
//     }
    
//     return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
//       ...data,
//       id,
//       createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
//       updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
//     }));
//   },

//   // Get prescriptions by patient ID
//   async getPrescriptionsByPatientId(patientId: string): Promise<Prescription[]> {
//     const prescriptionsRef = ref(database, PRESCRIPTIONS_COLLECTION);
//     const prescriptionQuery = query(prescriptionsRef, orderByChild('patientId'), equalTo(patientId));
    
//     const snapshot = await get(prescriptionQuery);
    
//     if (!snapshot.exists()) {
//       return [];
//     }
    
//     return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
//       ...data,
//       id,
//       createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
//       updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
//     }));
//   },

//   // Medicine Templates Management
//   async createMedicineTemplate(templateData: Omit<MedicineTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
//     const templateRef = push(ref(database, MEDICINE_TEMPLATES_COLLECTION));
    
//     const now = Date.now();
//     const template: MedicineTemplate = {
//       ...templateData,
//       id: templateRef.key!,
//       createdAt: now,
//       updatedAt: now
//     };
    
//     await update(templateRef, template);
//     return templateRef.key!;
//   },

//   async getMedicineTemplates(): Promise<MedicineTemplate[]> {
//     const templatesRef = ref(database, MEDICINE_TEMPLATES_COLLECTION);
//     const snapshot = await get(templatesRef);
    
//     if (!snapshot.exists()) {
//       return [];
//     }
    
//     return Object.entries(snapshot.val())
//       .map(([id, data]: [string, any]) => ({
//         ...data,
//         id,
//         createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
//         updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
//       }))
//       .filter(template => template.isActive)
//       .sort((a, b) => a.name.localeCompare(b.name));
//   },

//   // Generate unique ID for medicines
//   generateMedicineId(): string {
//     return `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//   },

//   // Link referral letter to prescription
//   async linkReferralLetterToPrescription(prescriptionId: string, referralLetterId: string): Promise<void> {
//     const prescriptionRef = ref(database, `${PRESCRIPTIONS_COLLECTION}/${prescriptionId}`);
//     await update(prescriptionRef, {
//       referralLetterId: referralLetterId,
//       updatedAt: Date.now()
//     });
//   },

//   // Get prescription with referral letter details
//   async getPrescriptionWithReferralLetter(prescriptionId: string): Promise<{ prescription: Prescription | null; referralLetter: any | null }> {
//     const prescription = await this.getPrescriptionById(prescriptionId);
    
//     if (!prescription || !prescription.referralLetterId) {
//       return { prescription, referralLetter: null };
//     }

//     try {
//       const { referralLetterService } = await import('./referralLetterService');
//       const referralLetter = await referralLetterService.getById(prescription.referralLetterId);
//       return { prescription, referralLetter };
//     } catch (error) {
//       console.error('Error fetching referral letter:', error);
//       return { prescription, referralLetter: null };
//     }
//   },

//   // Medical Tests Management
//   async addMedicalTestToPrescription(prescriptionId: string, medicalTest: MedicalTest): Promise<void> {
//     const prescription = await this.getPrescriptionById(prescriptionId);
//     if (!prescription) {
//       throw new Error('Prescription not found');
//     }

//     const updatedMedicalTests = [...(prescription.medicalTests || []), medicalTest];
    
//     await this.updatePrescription(prescriptionId, { medicalTests: updatedMedicalTests });
    
//     // Save to medical test history for future suggestions
//     try {
//       await medicalTestService.saveMedicalTestHistory(
//         prescription.patientId,
//         prescription.doctorId,
//         [medicalTest]
//       );
//     } catch (error) {
//       console.error('Error saving medical test to history:', error);
//       // Don't throw error - prescription was updated successfully
//     }
//   },

//   async removeMedicalTestFromPrescription(prescriptionId: string, medicalTestId: string): Promise<void> {
//     const prescription = await this.getPrescriptionById(prescriptionId);
//     if (!prescription) {
//       throw new Error('Prescription not found');
//     }

//     const updatedMedicalTests = (prescription.medicalTests || []).filter(test => test.id !== medicalTestId);
    
//     await this.updatePrescription(prescriptionId, { medicalTests: updatedMedicalTests });
//   },

//   async updateMedicalTestInPrescription(prescriptionId: string, medicalTestId: string, updatedTest: MedicalTest): Promise<void> {
//     const prescription = await this.getPrescriptionById(prescriptionId);
//     if (!prescription) {
//       throw new Error('Prescription not found');
//     }

//     const updatedMedicalTests = (prescription.medicalTests || []).map(test => 
//       test.id === medicalTestId ? updatedTest : test
//     );
    
//     await this.updatePrescription(prescriptionId, { medicalTests: updatedMedicalTests });
//   },

//   async getSuggestedMedicalTests(patientId: string, doctorId: string): Promise<MedicalTest[]> {
//     return await medicalTestService.getSuggestedMedicalTests(patientId, doctorId);
//   },

//   async getMedicalTestTemplates(): Promise<any[]> {
//     return await medicalTestService.getMedicalTestTemplates();
//   },

//   async searchMedicalTestTemplates(searchTerm: string): Promise<any[]> {
//     return await medicalTestService.searchMedicalTestTemplates(searchTerm);
//   },

//   // Generate unique ID for medical tests
//   generateMedicalTestId(): string {
//     return medicalTestService.generateMedicalTestId();
//   }
// };



// src/services/prescriptionService.ts
import { database } from '@/lib/firebase';
import { ref, push, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { Prescription, Medicine, MedicineTemplate, PrescriptionImage, MedicalTest } from '@/types/prescription';
import { imageUploadService } from './imageUploadService';
import { medicalTestService } from './medicalTestService';

const PRESCRIPTIONS_COLLECTION = 'prescriptions';
const MEDICINE_TEMPLATES_COLLECTION = 'medicineTemplates';

// Helper function to remove undefined values from objects
const sanitizeForFirebase = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirebase(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirebase(value);
      }
    }
    return sanitized;
  }
  
  return obj;
};

export const prescriptionService = {
  async createPrescription(prescriptionData: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const { appointmentService } = await import('./appointmentService');
    const appointment = await appointmentService.getAppointmentById(prescriptionData.appointmentId);
    
    if (appointment?.payment?.refunded) {
      throw new Error('Cannot create prescription for refunded appointment');
    }
    
    const prescriptionRef = push(ref(database, PRESCRIPTIONS_COLLECTION));
    const prescriptionId = prescriptionRef.key!;
    
    const now = Date.now();
    
    const medicinesWithOriginalCount = prescriptionData.medicines.map(med => ({
      ...med,
      originalDrugCount: med.drugCount 
    }));
    
    const prescription: Prescription = {
      ...prescriptionData,
      medicines: medicinesWithOriginalCount,
      id: prescriptionId,
      createdAt: now,
      updatedAt: now
    };
    
    const sanitizedPrescription = sanitizeForFirebase(prescription);
    await update(prescriptionRef, sanitizedPrescription);
    
    return prescriptionId;
  },

  async getPrescriptionByAppointmentId(appointmentId: string): Promise<Prescription | null> {
    const prescriptionsRef = ref(database, PRESCRIPTIONS_COLLECTION);
    const prescriptionQuery = query(prescriptionsRef, orderByChild('appointmentId'), equalTo(appointmentId));
    
    const snapshot = await get(prescriptionQuery);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const prescriptions = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
      ...data,
      id,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    }));
    
    return prescriptions[0] || null;
  },

  async getAllPrescriptionsByAppointmentId(appointmentId: string): Promise<Prescription[]> {
    const prescriptionsRef = ref(database, PRESCRIPTIONS_COLLECTION);
    const prescriptionQuery = query(prescriptionsRef, orderByChild('appointmentId'), equalTo(appointmentId));
    
    const snapshot = await get(prescriptionQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
      ...data,
      id,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    }));
  },

  async getPrescriptionById(prescriptionId: string): Promise<Prescription | null> {
    const prescriptionRef = ref(database, `${PRESCRIPTIONS_COLLECTION}/${prescriptionId}`);
    const snapshot = await get(prescriptionRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    return {
      ...data,
      id: prescriptionId,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
  },

  async updatePrescription(prescriptionId: string, updates: Partial<Prescription>): Promise<void> {
    const prescriptionRef = ref(database, `${PRESCRIPTIONS_COLLECTION}/${prescriptionId}`);
    
    if (updates.appointmentId) {
      const { appointmentService } = await import('./appointmentService');
      const appointment = await appointmentService.getAppointmentById(updates.appointmentId);
      
      if (appointment?.payment?.refunded) {
        throw new Error('Cannot update prescription for refunded appointment');
      }
    }
    
    const updateData = {
      ...updates,
      updatedAt: Date.now()
    };
    
    const sanitizedUpdateData = sanitizeForFirebase(updateData);
    await update(prescriptionRef, sanitizedUpdateData);
  },

  generateMedicineId(): string {
    return `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  async getPrescriptionsByDoctorId(doctorId: string): Promise<Prescription[]> {
    const prescriptionsRef = ref(database, PRESCRIPTIONS_COLLECTION);
    const prescriptionQuery = query(prescriptionsRef, orderByChild('doctorId'), equalTo(doctorId));
    
    const snapshot = await get(prescriptionQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
      ...data,
      id,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    }));
  },

  async getPrescriptionsByPatientId(patientId: string): Promise<Prescription[]> {
    const prescriptionsRef = ref(database, PRESCRIPTIONS_COLLECTION);
    const prescriptionQuery = query(prescriptionsRef, orderByChild('patientId'), equalTo(patientId));
    
    const snapshot = await get(prescriptionQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    return Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
      ...data,
      id,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    }));
  },

  async createMedicineTemplate(templateData: Omit<MedicineTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const templateRef = push(ref(database, MEDICINE_TEMPLATES_COLLECTION));
    
    const now = Date.now();
    const template: MedicineTemplate = {
      ...templateData,
      inventoryMedicines: templateData.inventoryMedicines || [],
      writtenMedicines: templateData.writtenMedicines || [],
      isActive: templateData.isActive ?? true,
      id: templateRef.key!,
      createdAt: now,
      updatedAt: now
    };
    
    const sanitizedTemplate = sanitizeForFirebase(template);
    await update(templateRef, sanitizedTemplate);
    return templateRef.key!;
  },

  async getMedicineTemplates(doctorId?: string): Promise<MedicineTemplate[]> {
    const templatesRef = ref(database, MEDICINE_TEMPLATES_COLLECTION);
    const snapshot = await get(templatesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    return Object.entries(snapshot.val())
      .map(([id, data]: [string, any]) => ({
        ...data,
        id,
        inventoryMedicines: data.inventoryMedicines || [],
        writtenMedicines: data.writtenMedicines || [],
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      }))
      .filter(template => template.isActive && (!doctorId || template.doctorId === doctorId))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async updateMedicineTemplate(templateId: string, updates: Partial<MedicineTemplate>): Promise<void> {
    const templateRef = ref(database, `${MEDICINE_TEMPLATES_COLLECTION}/${templateId}`);
    const updateData = {
      ...updates,
      updatedAt: Date.now()
    };
    const sanitizedUpdateData = sanitizeForFirebase(updateData);
    await update(templateRef, sanitizedUpdateData);
  },

  async deleteMedicineTemplate(templateId: string): Promise<void> {
    await this.updateMedicineTemplate(templateId, { isActive: false });
  },

  async linkReferralLetterToPrescription(prescriptionId: string, referralLetterId: string): Promise<void> {
    const prescriptionRef = ref(database, `${PRESCRIPTIONS_COLLECTION}/${prescriptionId}`);
    await update(prescriptionRef, {
      referralLetterId: referralLetterId,
      updatedAt: Date.now()
    });
  },

  async getPrescriptionWithReferralLetter(prescriptionId: string): Promise<{ prescription: Prescription | null; referralLetter: any | null }> {
    const prescription = await this.getPrescriptionById(prescriptionId);
    
    if (!prescription || !prescription.referralLetterId) {
      return { prescription, referralLetter: null };
    }

    try {
      const { referralLetterService } = await import('./referralLetterService');
      const referralLetter = await referralLetterService.getById(prescription.referralLetterId);
      return { prescription, referralLetter };
    } catch (error) {
      console.error('Error fetching referral letter:', error);
      return { prescription, referralLetter: null };
    }
  },

  async addMedicalTestToPrescription(prescriptionId: string, medicalTest: MedicalTest): Promise<void> {
    const prescription = await this.getPrescriptionById(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const updatedMedicalTests = [...(prescription.medicalTests || []), medicalTest];
    
    await this.updatePrescription(prescriptionId, { medicalTests: updatedMedicalTests });
    
    try {
      await medicalTestService.saveMedicalTestHistory(
        prescription.patientId,
        prescription.doctorId,
        [medicalTest]
      );
    } catch (error) {
      console.error('Error saving medical test to history:', error);
    }
  },

  async removeMedicalTestFromPrescription(prescriptionId: string, medicalTestId: string): Promise<void> {
    const prescription = await this.getPrescriptionById(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const updatedMedicalTests = (prescription.medicalTests || []).filter(test => test.id !== medicalTestId);
    
    await this.updatePrescription(prescriptionId, { medicalTests: updatedMedicalTests });
  },

  async updateMedicalTestInPrescription(prescriptionId: string, medicalTestId: string, updatedTest: MedicalTest): Promise<void> {
    const prescription = await this.getPrescriptionById(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const updatedMedicalTests = (prescription.medicalTests || []).map(test => 
      test.id === medicalTestId ? updatedTest : test
    );
    
    await this.updatePrescription(prescriptionId, { medicalTests: updatedMedicalTests });
  },

  async getSuggestedMedicalTests(patientId: string, doctorId: string): Promise<MedicalTest[]> {
    return await medicalTestService.getSuggestedMedicalTests(patientId, doctorId);
  },

  async getMedicalTestTemplates(): Promise<any[]> {
    return await medicalTestService.getMedicalTestTemplates();
  },

  async searchMedicalTestTemplates(searchTerm: string): Promise<any[]> {
    return await medicalTestService.searchMedicalTestTemplates(searchTerm);
  },

  generateMedicalTestId(): string {
    return medicalTestService.generateMedicalTestId();
  }
};