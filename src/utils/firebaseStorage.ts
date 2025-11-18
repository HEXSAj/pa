// src/utils/firebaseStorage.ts
// import { storage } from '@/lib/firebase';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// export const uploadPdfToStorage = async (pdfBlob: Blob, fileName: string): Promise<string> => {
//   try {
//     // Create a reference to the file location with date-based folder structure
//     const date = new Date();
//     const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
//     const fileRef = ref(storage, `bills/${yearMonth}/${fileName}`);
    
//     // Set the content type
//     const metadata = {
//       contentType: 'application/pdf',
//     };

//     // Upload the file with metadata
//     await uploadBytes(fileRef, pdfBlob, metadata);
    
//     // Get the download URL
//     const downloadURL = await getDownloadURL(fileRef);
    
//     return downloadURL;
//   } catch (error) {
//     console.error('Error uploading PDF:', error);
//     throw error;
//   }
// };

// src/utils/firebaseStorage.ts
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadPdfToStorage = async (pdfBlob: Blob, fileName: string): Promise<string> => {
  try {
    // Create a reference to the file location
    const fileRef = ref(storage, `public-bills/${fileName}`);
    
    // Set content type and make it public
    const metadata = {
      contentType: 'application/pdf',
      customMetadata: {
        'access-control-allow-origin': '*'
      }
    };

    // Upload the file
    await uploadBytes(fileRef, pdfBlob, metadata);
    
    // Get a long-lived download URL
    const downloadURL = await getDownloadURL(fileRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
};