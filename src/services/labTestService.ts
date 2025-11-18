// // // // // src/services/labTestService.ts

// // // // import { database } from '@/lib/firebase';
// // // // import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
// // // // import { LabTest } from '@/types/labTest';
// // // // import { labService } from './labService';

// // // // const COLLECTION = 'labTests';

// // // // export const labTestService = {
// // // //   async create(test: Omit<LabTest, 'id' | 'createdAt' | 'updatedAt'>) {
// // // //     const now = Date.now();
    
// // // //     const docData: any = {
// // // //       name: test.name,
// // // //       // price: test.price,
// // // //        localPatientCharge: labTest.localPatientCharge,
// // // //     foreignPatientCharge: labTest.foreignPatientCharge,
// // // //       labId: test.labId,
// // // //       labName: test.labName || '',
// // // //       description: test.description || '',
// // // //       isActive: test.isActive !== undefined ? test.isActive : true,
// // // //       createdAt: now,
// // // //       updatedAt: now
// // // //     };

// // // //     // Generate a new key and set the data
// // // //     const newTestRef = push(ref(database, COLLECTION));
// // // //     await set(newTestRef, docData);
    
// // // //     return newTestRef;
// // // //   },

// // // //   async update(id: string, test: Partial<Omit<LabTest, 'id' | 'createdAt'>>) {
// // // //     const testRef = ref(database, `${COLLECTION}/${id}`);

// // // //     const updateData: any = {
// // // //       updatedAt: Date.now()
// // // //     };

// // // //     // Only update fields that were provided
// // // //     if (test.name !== undefined) updateData.name = test.name;
// // // //     if (test.price !== undefined) updateData.price = test.price;
// // // //     if (test.labId !== undefined) updateData.labId = test.labId;
// // // //     if (test.labName !== undefined) updateData.labName = test.labName;
// // // //     if (test.description !== undefined) updateData.description = test.description;
// // // //     if (test.isActive !== undefined) updateData.isActive = test.isActive;

// // // //     return update(testRef, updateData);
// // // //   },

// // // //   async delete(id: string) {
// // // //     const testRef = ref(database, `${COLLECTION}/${id}`);
// // // //     return remove(testRef);
// // // //   },

// // // //   async getAll() {
// // // //     const testsRef = ref(database, COLLECTION);
// // // //     const snapshot = await get(testsRef);
    
// // // //     if (!snapshot.exists()) {
// // // //       return [];
// // // //     }
    
// // // //     const tests: LabTest[] = [];
    
// // // //     // Convert the snapshot to array of tests
// // // //     snapshot.forEach((childSnapshot) => {
// // // //       const data = childSnapshot.val();
// // // //       tests.push({
// // // //         id: childSnapshot.key,
// // // //         name: data.name || '',
// // // //         price: data.price || 0,
// // // //         labId: data.labId || '',
// // // //         labName: data.labName || '',
// // // //         description: data.description || '',
// // // //         isActive: data.isActive !== undefined ? data.isActive : true,
// // // //         createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
// // // //         updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
// // // //       });
// // // //     });
    
// // // //     return tests;
// // // //   },
  
// // // //   async getById(id: string) {
// // // //     const testRef = ref(database, `${COLLECTION}/${id}`);
// // // //     const snapshot = await get(testRef);
    
// // // //     if (!snapshot.exists()) {
// // // //       return null;
// // // //     }
    
// // // //     const data = snapshot.val();
// // // //     const test: LabTest = {
// // // //       id: snapshot.key,
// // // //       name: data.name || '',
// // // //       price: data.price || 0,
// // // //       labId: data.labId || '',
// // // //       labName: data.labName || '',
// // // //       description: data.description || '',
// // // //       isActive: data.isActive !== undefined ? data.isActive : true,
// // // //       createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
// // // //       updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
// // // //     };
    
// // // //     return test;
// // // //   },
  
// // // //   async getByLabId(labId: string) {
// // // //     const testsRef = ref(database, COLLECTION);
// // // //     const labQuery = query(testsRef, orderByChild('labId'), equalTo(labId));
// // // //     const snapshot = await get(labQuery);
    
// // // //     if (!snapshot.exists()) {
// // // //       return [];
// // // //     }
    
// // // //     const tests: LabTest[] = [];
    
// // // //     snapshot.forEach((childSnapshot) => {
// // // //       const data = childSnapshot.val();
// // // //       tests.push({
// // // //         id: childSnapshot.key,
// // // //         name: data.name || '',
// // // //         price: data.price || 0,
// // // //         labId: data.labId || '',
// // // //         labName: data.labName || '',
// // // //         description: data.description || '',
// // // //         isActive: data.isActive !== undefined ? data.isActive : true,
// // // //         createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
// // // //         updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
// // // //       });
// // // //     });
    
// // // //     return tests;
// // // //   },
  
// // // //   async searchByName(searchTerm: string) {
// // // //     // Get all tests and filter client-side (Firebase RTDB doesn't support text search)
// // // //     const tests = await this.getAll();
// // // //     return tests.filter(test => 
// // // //       test.name.toLowerCase().includes(searchTerm.toLowerCase())
// // // //     );
// // // //   }
// // // // };

// // // // src/services/labTestService.ts

// // // import { database } from '@/lib/firebase';
// // // import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
// // // import { LabTest } from '@/types/labTest';
// // // import { labService } from './labService';

// // // const COLLECTION = 'labTests';

// // // export const labTestService = {
// // //   async create(test: Omit<LabTest, 'id' | 'createdAt' | 'updatedAt'>) {
// // //     const now = Date.now();
    
// // //     const docData: any = {
// // //       name: test.name,
// // //       localPatientCharge: test.localPatientCharge,
// // //       foreignPatientCharge: test.foreignPatientCharge,
// // //       labId: test.labId,
// // //       labName: test.labName || '',
// // //       description: test.description || '',
// // //       isActive: test.isActive !== undefined ? test.isActive : true,
// // //       createdAt: now,
// // //       updatedAt: now
// // //     };

// // //     // Generate a new key and set the data
// // //     const newTestRef = push(ref(database, COLLECTION));
// // //     await set(newTestRef, docData);
    
// // //     return newTestRef;
// // //   },

// // //   async update(id: string, test: Partial<Omit<LabTest, 'id' | 'createdAt'>>) {
// // //     const testRef = ref(database, `${COLLECTION}/${id}`);

// // //     const updateData: any = {
// // //       updatedAt: Date.now()
// // //     };

// // //     // Only update fields that were provided
// // //     if (test.name !== undefined) updateData.name = test.name;
// // //     if (test.localPatientCharge !== undefined) updateData.localPatientCharge = test.localPatientCharge;
// // //     if (test.foreignPatientCharge !== undefined) updateData.foreignPatientCharge = test.foreignPatientCharge;
// // //     // Keep price field for backward compatibility during migration
// // //     if (test.price !== undefined) updateData.price = test.price;
// // //     if (test.labId !== undefined) updateData.labId = test.labId;
// // //     if (test.labName !== undefined) updateData.labName = test.labName;
// // //     if (test.description !== undefined) updateData.description = test.description;
// // //     if (test.isActive !== undefined) updateData.isActive = test.isActive;

// // //     return update(testRef, updateData);
// // //   },

// // //   async delete(id: string) {
// // //     const testRef = ref(database, `${COLLECTION}/${id}`);
// // //     return remove(testRef);
// // //   },

// // //   async getAll() {
// // //     const testsRef = ref(database, COLLECTION);
// // //     const snapshot = await get(testsRef);
    
// // //     if (!snapshot.exists()) {
// // //       return [];
// // //     }
    
// // //     const tests: LabTest[] = [];
    
// // //     // Convert the snapshot to array of tests
// // //     snapshot.forEach((childSnapshot) => {
// // //       const data = childSnapshot.val();
// // //       tests.push({
// // //         id: childSnapshot.key,
// // //         name: data.name || '',
// // //         // Handle both old and new price structure for migration compatibility
// // //         localPatientCharge: data.localPatientCharge || data.price || 0,
// // //         foreignPatientCharge: data.foreignPatientCharge || data.price || 0,
// // //         price: data.price || 0, // Keep for backward compatibility
// // //         labId: data.labId || '',
// // //         labName: data.labName || '',
// // //         description: data.description || '',
// // //         isActive: data.isActive !== undefined ? data.isActive : true,
// // //         createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
// // //         updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
// // //       });
// // //     });
    
// // //     return tests;
// // //   },
  
// // //   async getById(id: string) {
// // //     const testRef = ref(database, `${COLLECTION}/${id}`);
// // //     const snapshot = await get(testRef);
    
// // //     if (!snapshot.exists()) {
// // //       return null;
// // //     }
    
// // //     const data = snapshot.val();
// // //     const test: LabTest = {
// // //       id: snapshot.key,
// // //       name: data.name || '',
// // //       // Handle both old and new price structure for migration compatibility
// // //       localPatientCharge: data.localPatientCharge || data.price || 0,
// // //       foreignPatientCharge: data.foreignPatientCharge || data.price || 0,
// // //       price: data.price || 0, // Keep for backward compatibility
// // //       labId: data.labId || '',
// // //       labName: data.labName || '',
// // //       description: data.description || '',
// // //       isActive: data.isActive !== undefined ? data.isActive : true,
// // //       createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
// // //       updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
// // //     };
    
// // //     return test;
// // //   },
  
// // //   async getByLabId(labId: string) {
// // //     const testsRef = ref(database, COLLECTION);
// // //     const labQuery = query(testsRef, orderByChild('labId'), equalTo(labId));
// // //     const snapshot = await get(labQuery);
    
// // //     if (!snapshot.exists()) {
// // //       return [];
// // //     }
    
// // //     const tests: LabTest[] = [];
    
// // //     snapshot.forEach((childSnapshot) => {
// // //       const data = childSnapshot.val();
// // //       tests.push({
// // //         id: childSnapshot.key,
// // //         name: data.name || '',
// // //         // Handle both old and new price structure for migration compatibility
// // //         localPatientCharge: data.localPatientCharge || data.price || 0,
// // //         foreignPatientCharge: data.foreignPatientCharge || data.price || 0,
// // //         price: data.price || 0, // Keep for backward compatibility
// // //         labId: data.labId || '',
// // //         labName: data.labName || '',
// // //         description: data.description || '',
// // //         isActive: data.isActive !== undefined ? data.isActive : true,
// // //         createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
// // //         updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
// // //       });
// // //     });
    
// // //     return tests;
// // //   },
  
// // //   async searchByName(searchTerm: string) {
// // //     // Get all tests and filter client-side (Firebase RTDB doesn't support text search)
// // //     const tests = await this.getAll();
// // //     return tests.filter(test => 
// // //       test.name.toLowerCase().includes(searchTerm.toLowerCase())
// // //     );
// // //   },

// // //   // Helper function to migrate existing data (optional)
// // //   async migrateOldPriceData() {
// // //     const tests = await this.getAll();
// // //     const migrationPromises = tests.map(async (test) => {
// // //       // Only migrate if the test doesn't have the new price fields
// // //       if (test.price && (!test.localPatientCharge || !test.foreignPatientCharge)) {
// // //         return this.update(test.id!, {
// // //           localPatientCharge: test.price,
// // //           foreignPatientCharge: test.price,
// // //         });
// // //       }
// // //     });
    
// // //     return Promise.all(migrationPromises);
// // //   }
// // // };

// // // src/services/labTestService.ts
// // import { database } from '@/lib/firebase';
// // import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
// // import { LabTest } from '@/types/labTest';
// // import { labService } from './labService';

// // const COLLECTION = 'labTests';

// // export const labTestService = {
// //   async create(test: Omit<LabTest, 'id' | 'createdAt' | 'updatedAt'>) {
// //     const now = Date.now();
    
// //     const docData: any = {
// //       name: test.name,
// //       price: test.price,
// //       labId: test.labId,
// //       labName: test.labName || '',
// //       description: test.description || '',
// //       isActive: test.isActive !== undefined ? test.isActive : true,
// //       createdAt: now,
// //       updatedAt: now
// //     };

// //     const newTestRef = push(ref(database, COLLECTION));
// //     await set(newTestRef, docData);
    
// //     return newTestRef;
// //   },

// //   async update(id: string, test: Partial<Omit<LabTest, 'id' | 'createdAt'>>) {
// //     const testRef = ref(database, `${COLLECTION}/${id}`);

// //     const updateData: any = {
// //       updatedAt: Date.now()
// //     };

// //     if (test.name !== undefined) updateData.name = test.name;
// //     if (test.price !== undefined) updateData.price = test.price;
// //     if (test.labId !== undefined) updateData.labId = test.labId;
// //     if (test.labName !== undefined) updateData.labName = test.labName;
// //     if (test.description !== undefined) updateData.description = test.description;
// //     if (test.isActive !== undefined) updateData.isActive = test.isActive;

// //     return update(testRef, updateData);
// //   },

// //   async delete(id: string) {
// //     const testRef = ref(database, `${COLLECTION}/${id}`);
// //     return remove(testRef);
// //   },

// //   async getAll() {
// //     const testsRef = ref(database, COLLECTION);
// //     const snapshot = await get(testsRef);
    
// //     if (!snapshot.exists()) {
// //       return [];
// //     }
    
// //     const tests: LabTest[] = [];
    
// //     snapshot.forEach((childSnapshot) => {
// //       const data = childSnapshot.val();
// //       tests.push({
// //         id: childSnapshot.key,
// //         name: data.name || '',
// //         // Handle migration from old field names
// //         price: data.price || data.localPatientCharge || 0,
// //         labId: data.labId || '',
// //         labName: data.labName || '',
// //         description: data.description || '',
// //         isActive: data.isActive !== undefined ? data.isActive : true,
// //         createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
// //         updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
// //       });
// //     });
    
// //     return tests;
// //   },
  
// //   async getById(id: string) {
// //     const testRef = ref(database, `${COLLECTION}/${id}`);
// //     const snapshot = await get(testRef);
    
// //     if (!snapshot.exists()) {
// //       return null;
// //     }
    
// //     const data = snapshot.val();
// //     const test: LabTest = {
// //       id: snapshot.key,
// //       name: data.name || '',
// //       price: data.price || data.localPatientCharge || 0,
// //       labId: data.labId || '',
// //       labName: data.labName || '',
// //       description: data.description || '',
// //       isActive: data.isActive !== undefined ? data.isActive : true,
// //       createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
// //       updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
// //     };
    
// //     return test;
// //   },
  
// //   async getByLabId(labId: string) {
// //     const testsRef = ref(database, COLLECTION);
// //     const labQuery = query(testsRef, orderByChild('labId'), equalTo(labId));
// //     const snapshot = await get(labQuery);
    
// //     if (!snapshot.exists()) {
// //       return [];
// //     }
    
// //     const tests: LabTest[] = [];
    
// //     snapshot.forEach((childSnapshot) => {
// //       const data = childSnapshot.val();
// //       tests.push({
// //         id: childSnapshot.key,
// //         name: data.name || '',
// //         price: data.price || data.localPatientCharge || 0,
// //         labId: data.labId || '',
// //         labName: data.labName || '',
// //         description: data.description || '',
// //         isActive: data.isActive !== undefined ? data.isActive : true,
// //         createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
// //         updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
// //       });
// //     });
    
// //     return tests;
// //   },
  
// //   async searchByName(searchTerm: string) {
// //     const tests = await this.getAll();
// //     return tests.filter(test => 
// //       test.name.toLowerCase().includes(searchTerm.toLowerCase())
// //     );
// //   }
// // };

// // src/services/labTestService.ts
// import { database } from '@/lib/firebase';
// import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
// import { LabTest } from '@/types/labTest';
// import { labService } from './labService';
// import { priceHistoryService } from './priceHistoryService';

// const COLLECTION = 'labTests';

// export const labTestService = {
//   async create(test: Omit<LabTest, 'id' | 'createdAt' | 'updatedAt'>) {
//     const now = Date.now();
    
//     const docData: any = {
//       name: test.name,
//       price: test.price,
//       labId: test.labId,
//       labName: test.labName || '',
//       description: test.description || '',
//       isActive: test.isActive !== undefined ? test.isActive : true,
//       createdAt: now,
//       updatedAt: now
//     };

//     const newTestRef = push(ref(database, COLLECTION));
//     await set(newTestRef, docData);
    
//     return newTestRef;
//   },

//   async update(id: string, test: Partial<Omit<LabTest, 'id' | 'createdAt'>>, changedBy?: string, reason?: string) {
//     const testRef = ref(database, `${COLLECTION}/${id}`);

//     // Get the current test data to compare prices
//     const currentSnapshot = await get(testRef);
//     const currentData = currentSnapshot.val();

//     const updateData: any = {
//       updatedAt: Date.now()
//     };

//     if (test.name !== undefined) updateData.name = test.name;
//     if (test.price !== undefined) updateData.price = test.price;
//     if (test.labId !== undefined) updateData.labId = test.labId;
//     if (test.labName !== undefined) updateData.labName = test.labName;
//     if (test.description !== undefined) updateData.description = test.description;
//     if (test.isActive !== undefined) updateData.isActive = test.isActive;

//     // Check if price has changed and record history
//     if (test.price !== undefined && currentData && currentData.price !== test.price && changedBy) {
//       try {
//         console.log('Recording price change:', {
//           labTestId: id,
//           labTestName: currentData.name || 'Unknown Test',
//           oldPrice: currentData.price || 0,
//           newPrice: test.price,
//           changedBy: changedBy,
//           reason: reason
//         });

//         await priceHistoryService.recordPriceChange({
//           labTestId: id,
//           labTestName: currentData.name || 'Unknown Test',
//           oldPrice: currentData.price || 0,
//           newPrice: test.price,
//           changedBy: changedBy,
//           reason: reason
//         });

//         console.log('Price change recorded successfully');
//       } catch (error) {
//         console.error('Error recording price history:', error);
//         // Don't fail the update if history recording fails
//       }
//     }

//     return update(testRef, updateData);
//   },

//   async delete(id: string) {
//     const testRef = ref(database, `${COLLECTION}/${id}`);
//     return remove(testRef);
//   },

//   async getAll() {
//     const testsRef = ref(database, COLLECTION);
//     const snapshot = await get(testsRef);
    
//     if (!snapshot.exists()) {
//       return [];
//     }
    
//     const tests: LabTest[] = [];
    
//     snapshot.forEach((childSnapshot) => {
//       const data = childSnapshot.val();
//       tests.push({
//         id: childSnapshot.key,
//         name: data.name || '',
//         price: data.price || data.localPatientCharge || 0,
//         labId: data.labId || '',
//         labName: data.labName || '',
//         description: data.description || '',
//         isActive: data.isActive !== undefined ? data.isActive : true,
//         createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
//         updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
//       });
//     });
    
//     return tests;
//   },
  
//   async getById(id: string) {
//     const testRef = ref(database, `${COLLECTION}/${id}`);
//     const snapshot = await get(testRef);
    
//     if (!snapshot.exists()) {
//       return null;
//     }
    
//     const data = snapshot.val();
//     const test: LabTest = {
//       id: snapshot.key,
//       name: data.name || '',
//       price: data.price || data.localPatientCharge || 0,
//       labId: data.labId || '',
//       labName: data.labName || '',
//       description: data.description || '',
//       isActive: data.isActive !== undefined ? data.isActive : true,
//       createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
//       updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
//     };
    
//     return test;
//   },
  
//   async getByLabId(labId: string) {
//     const testsRef = ref(database, COLLECTION);
//     const labQuery = query(testsRef, orderByChild('labId'), equalTo(labId));
//     const snapshot = await get(labQuery);
    
//     if (!snapshot.exists()) {
//       return [];
//     }
    
//     const tests: LabTest[] = [];
    
//     snapshot.forEach((childSnapshot) => {
//       const data = childSnapshot.val();
//       tests.push({
//         id: childSnapshot.key,
//         name: data.name || '',
//         price: data.price || data.localPatientCharge || 0,
//         labId: data.labId || '',
//         labName: data.labName || '',
//         description: data.description || '',
//         isActive: data.isActive !== undefined ? data.isActive : true,
//         createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
//         updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
//       });
//     });
    
//     return tests;
//   },
  
//   async searchByName(searchTerm: string) {
//     const tests = await this.getAll();
//     return tests.filter(test => 
//       test.name.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   }
// };

// src/services/labTestService.ts
import { database } from '@/lib/firebase';
import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { LabTest } from '@/types/labTest';
import { labService } from './labService';
import { priceHistoryService } from './priceHistoryService';

const COLLECTION = 'labTests';

export const labTestService = {
  async create(test: Omit<LabTest, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now();
    
    const docData: any = {
      name: test.name,
      price: test.price,
      labId: test.labId,
      labName: test.labName || '',
      description: test.description || '',
      isActive: test.isActive !== undefined ? test.isActive : true,
      createdAt: now,
      updatedAt: now
    };

    const newTestRef = push(ref(database, COLLECTION));
    await set(newTestRef, docData);
    
    return newTestRef;
  },

  async update(id: string, test: Partial<Omit<LabTest, 'id' | 'createdAt'>>, changedBy?: string, reason?: string) {
    const testRef = ref(database, `${COLLECTION}/${id}`);

    // Get the current test data to compare prices
    const currentSnapshot = await get(testRef);
    const currentData = currentSnapshot.val();

    const updateData: any = {
      updatedAt: Date.now()
    };

    if (test.name !== undefined) updateData.name = test.name;
    if (test.price !== undefined) updateData.price = test.price;
    if (test.labId !== undefined) updateData.labId = test.labId;
    if (test.labName !== undefined) updateData.labName = test.labName;
    if (test.description !== undefined) updateData.description = test.description;
    if (test.isActive !== undefined) updateData.isActive = test.isActive;

    // Check if price has changed and record history
    if (test.price !== undefined && currentData && currentData.price !== test.price && changedBy) {
      try {
        console.log('Recording price change:', {
          labTestId: id,
          labTestName: currentData.name || 'Unknown Test',
          oldPrice: currentData.price || 0,
          newPrice: test.price,
          changedBy: changedBy,
          reason: reason
        });

        await priceHistoryService.recordPriceChange({
          labTestId: id,
          labTestName: currentData.name || 'Unknown Test',
          oldPrice: currentData.price || 0,
          newPrice: test.price,
          changedBy: changedBy,
          reason: reason
        });

        console.log('Price change recorded successfully');
      } catch (error) {
        console.error('Error recording price history:', error);
        // Don't fail the update if history recording fails
      }
    }

    return update(testRef, updateData);
  },

  async delete(id: string) {
    const testRef = ref(database, `${COLLECTION}/${id}`);
    return remove(testRef);
  },

  async getAll() {
    const testsRef = ref(database, COLLECTION);
    const snapshot = await get(testsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const tests: LabTest[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      tests.push({
        id: childSnapshot.key,
        name: data.name || '',
        price: data.price || 0,
        labId: data.labId || '',
        labName: data.labName || '',
        description: data.description || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    return tests;
  },
  
  async getById(id: string) {
    const testRef = ref(database, `${COLLECTION}/${id}`);
    const snapshot = await get(testRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    const test: LabTest = {
      id: snapshot.key,
      name: data.name || '',
      price: data.price || 0,
      labId: data.labId || '',
      labName: data.labName || '',
      description: data.description || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
    
    return test;
  },
  
  async getByLabId(labId: string) {
    const testsRef = ref(database, COLLECTION);
    const labQuery = query(testsRef, orderByChild('labId'), equalTo(labId));
    const snapshot = await get(labQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const tests: LabTest[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      tests.push({
        id: childSnapshot.key,
        name: data.name || '',
        price: data.price || 0,
        labId: data.labId || '',
        labName: data.labName || '',
        description: data.description || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    return tests;
  },
  
  async searchByName(searchTerm: string) {
    const tests = await this.getAll();
    return tests.filter(test => 
      test.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
};