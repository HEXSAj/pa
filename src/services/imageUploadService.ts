// // src/services/imageUploadService.ts
// import { storage } from '@/lib/firebase';
// import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
// import { PrescriptionImage } from '@/types/prescription';

// export const imageUploadService = {
//   // Upload image to Firebase Storage
//   async uploadPrescriptionImage(
//     file: File, 
//     prescriptionId: string, 
//     description?: string
//   ): Promise<PrescriptionImage> {
//     try {
//       // Generate unique filename
//       const timestamp = Date.now();
//       const fileExtension = file.name.split('.').pop();
//       const fileName = `prescription_${prescriptionId}_${timestamp}.${fileExtension}`;
      
//       // Create storage reference
//       const storageRef = ref(storage, `prescriptions/${prescriptionId}/${fileName}`);
      
//       // Upload file
//       const snapshot = await uploadBytes(storageRef, file);
//       const downloadURL = await getDownloadURL(snapshot.ref);
      
//       // Create image record
//       const imageRecord: PrescriptionImage = {
//         id: `img_${timestamp}`,
//         fileName,
//         originalName: file.name,
//         fileSize: file.size,
//         mimeType: file.type,
//         downloadURL,
//         description: description || '',
//         uploadedAt: new Date()
//       };
      
//       return imageRecord;
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       throw new Error('Failed to upload image');
//     }
//   },

//   // Delete image from Firebase Storage
//   async deleteImage(prescriptionId: string, fileName: string): Promise<void> {
//     try {
//       const storageRef = ref(storage, `prescriptions/${prescriptionId}/${fileName}`);
//       await deleteObject(storageRef);
//     } catch (error) {
//       console.error('Error deleting image:', error);
//       throw new Error('Failed to delete image');
//     }
//   },

//   // Validate image file
//   validateImageFile(file: File): { isValid: boolean; error?: string } {
//     const maxSize = 5 * 1024 * 1024; // 5MB
//     const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
//     if (file.size > maxSize) {
//       return { isValid: false, error: 'File size must be less than 5MB' };
//     }
    
//     if (!allowedTypes.includes(file.type)) {
//       return { isValid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
//     }
    
//     return { isValid: true };
//   },

//   // Generate image preview URL
//   generatePreviewURL(file: File): string {
//     return URL.createObjectURL(file);
//   }
// };

// src/services/imageUploadService.ts
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { PrescriptionImage } from '@/types/prescription';
import { AppointmentDocument } from '@/types/appointment';

export const imageUploadService = {
  // Upload image to Firebase Storage
  async uploadPrescriptionImage(
    file: File, 
    prescriptionId: string, 
    description?: string
  ): Promise<PrescriptionImage> {
    try {
      console.log('=== IMAGE UPLOAD DEBUG ===');
      console.log('File:', file.name, file.size, file.type);
      console.log('Prescription ID:', prescriptionId);
      console.log('Description:', description);

      if (!prescriptionId || prescriptionId === 'undefined') {
        throw new Error('Invalid prescription ID provided for image upload');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `prescription_${prescriptionId}_${timestamp}.${fileExtension}`;
      
      console.log('Generated filename:', fileName);
      
      // Create storage reference
      const storagePath = `prescriptions/${prescriptionId}/${fileName}`;
      console.log('Storage path:', storagePath);
      
      const storageRef = ref(storage, storagePath);
      
      // Upload file
      console.log('Starting file upload...');
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload completed, getting download URL...');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      // Create image record
      const imageRecord: PrescriptionImage = {
        id: `img_${timestamp}`,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        downloadURL,
        description: description || '',
        uploadedAt: new Date()
      };
      
      console.log('Image record created:', imageRecord);
      return imageRecord;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Delete image from Firebase Storage
  async deleteImage(prescriptionId: string, fileName: string): Promise<void> {
    try {
      if (!prescriptionId || prescriptionId === 'undefined') {
        throw new Error('Invalid prescription ID provided for image deletion');
      }

      const storageRef = ref(storage, `prescriptions/${prescriptionId}/${fileName}`);
      await deleteObject(storageRef);
      console.log('Image deleted successfully:', fileName);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  },

  // Validate image file
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 5MB' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
    }
    
    return { isValid: true };
  },

  // Generate image preview URL
  generatePreviewURL(file: File): string {
    return URL.createObjectURL(file);
  },

  // Upload attendance photo to Firebase Storage
  async uploadAttendancePhoto(
    file: File,
    staffId: string,
    sessionId: string,
    type: 'clockIn' | 'clockOut'
  ): Promise<string> {
    try {
      console.log('=== ATTENDANCE PHOTO UPLOAD DEBUG ===');
      console.log('File:', file.name, file.size, file.type);
      console.log('Staff ID:', staffId);
      console.log('Session ID:', sessionId);
      console.log('Type:', type);

      if (!staffId || !sessionId) {
        throw new Error('Invalid staff ID or session ID provided for photo upload');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `attendance_${staffId}_${sessionId}_${type}_${timestamp}.${fileExtension}`;
      
      console.log('Generated filename:', fileName);
      
      // Create storage reference with date-based folder structure
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const storagePath = `attendance/${year}/${month}/${day}/${fileName}`;
      console.log('Storage path:', storagePath);
      
      const storageRef = ref(storage, storagePath);
      
      // Upload file with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          staffId,
          sessionId,
          type,
          timestamp: timestamp.toString()
        }
      };
      
      console.log('Starting file upload...');
      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('Upload completed, getting download URL...');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading attendance photo:', error);
      throw new Error(`Failed to upload attendance photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Upload appointment document (PDF, images, etc.)
  async uploadAppointmentDocument(
    file: File,
    appointmentId: string,
    description?: string
  ): Promise<AppointmentDocument> {
    try {
      console.log('=== APPOINTMENT DOCUMENT UPLOAD DEBUG ===');
      console.log('File:', file.name, file.size, file.type);
      console.log('Appointment ID:', appointmentId);
      console.log('Description:', description);

      if (!appointmentId || appointmentId === 'undefined') {
        throw new Error('Invalid appointment ID provided for document upload');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `appointment_${appointmentId}_${timestamp}.${fileExtension}`;
      
      console.log('Generated filename:', fileName);
      
      // Create storage reference
      const storagePath = `appointments/${appointmentId}/${fileName}`;
      console.log('Storage path:', storagePath);
      
      const storageRef = ref(storage, storagePath);
      
      // Upload file
      console.log('Starting file upload...');
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload completed, getting download URL...');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      // Create document record
      const documentRecord: AppointmentDocument = {
        id: `doc_${timestamp}`,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        downloadURL,
        description: description || '',
        uploadedAt: new Date()
      };
      
      console.log('Document record created:', documentRecord);
      return documentRecord;
    } catch (error) {
      console.error('Error uploading appointment document:', error);
      throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Delete appointment document from Firebase Storage
  async deleteAppointmentDocument(appointmentId: string, fileName: string): Promise<void> {
    try {
      if (!appointmentId || appointmentId === 'undefined') {
        throw new Error('Invalid appointment ID provided for document deletion');
      }

      const storageRef = ref(storage, `appointments/${appointmentId}/${fileName}`);
      await deleteObject(storageRef);
      console.log('Document deleted successfully:', fileName);
    } catch (error) {
      console.error('Error deleting appointment document:', error);
      throw new Error('Failed to delete document');
    }
  },

  // Validate document file (supports PDFs, images, and common document types)
  validateDocumentFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', // Images
      'application/pdf', // PDFs
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/plain', // .txt
      'text/csv' // .csv
    ];
    
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 10MB' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      // Also check file extension as fallback
      const extension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];
      
      if (!extension || !allowedExtensions.includes(extension)) {
        return { isValid: false, error: 'Only PDFs, images (JPEG, PNG, GIF, WebP), and documents (DOC, DOCX, XLS, XLSX, TXT, CSV) are allowed' };
      }
    }
    
    return { isValid: true };
  },

  // Generate document preview URL
  generateDocumentPreviewURL(file: File): string {
    return URL.createObjectURL(file);
  }
};