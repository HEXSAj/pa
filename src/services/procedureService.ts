// // src/services/procedureService.ts

// import { database } from '@/lib/firebase';
// import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
// import { Procedure } from '@/types/procedure';

// const COLLECTION = 'procedures';

// export const procedureService = {
//   async create(procedure: Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>) {
//     const now = Date.now();
    
//     const docData: any = {
//       name: procedure.name,
//       localPatientCharge: procedure.localPatientCharge,
//       foreignPatientCharge: procedure.foreignPatientCharge,
//       description: procedure.description || '',
//       category: procedure.category || '',
//       duration: procedure.duration || 0,
//       isActive: procedure.isActive !== undefined ? procedure.isActive : true,
//       createdAt: now,
//       updatedAt: now
//     };

//     // Generate a new key and set the data
//     const newProcedureRef = push(ref(database, COLLECTION));
//     await set(newProcedureRef, docData);
    
//     return newProcedureRef;
//   },

//   async update(id: string, procedure: Partial<Omit<Procedure, 'id' | 'createdAt'>>) {
//     const procedureRef = ref(database, `${COLLECTION}/${id}`);

//     const updateData: any = {
//       updatedAt: Date.now()
//     };

//     // Only update fields that were provided
//     if (procedure.name !== undefined) updateData.name = procedure.name;
//     if (procedure.localPatientCharge !== undefined) updateData.localPatientCharge = procedure.localPatientCharge;
//     if (procedure.foreignPatientCharge !== undefined) updateData.foreignPatientCharge = procedure.foreignPatientCharge;
//     if (procedure.description !== undefined) updateData.description = procedure.description;
//     if (procedure.category !== undefined) updateData.category = procedure.category;
//     if (procedure.duration !== undefined) updateData.duration = procedure.duration;
//     if (procedure.isActive !== undefined) updateData.isActive = procedure.isActive;

//     return update(procedureRef, updateData);
//   },

//   async delete(id: string) {
//     const procedureRef = ref(database, `${COLLECTION}/${id}`);
//     return remove(procedureRef);
//   },

//   async getAll() {
//     const proceduresRef = ref(database, COLLECTION);
//     const snapshot = await get(proceduresRef);
    
//     if (!snapshot.exists()) {
//       return [];
//     }
    
//     const procedures: Procedure[] = [];
    
//     // Convert the snapshot to array of procedures
//     snapshot.forEach((childSnapshot) => {
//       const data = childSnapshot.val();
//       procedures.push({
//         id: childSnapshot.key,
//         name: data.name || '',
//         localPatientCharge: data.localPatientCharge || 0,
//         foreignPatientCharge: data.foreignPatientCharge || 0,
//         description: data.description || '',
//         category: data.category || '',
//         duration: data.duration || 0,
//         isActive: data.isActive !== undefined ? data.isActive : true,
//         createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
//         updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
//       });
//     });
    
//     return procedures;
//   },
  
//   async getById(id: string) {
//     const procedureRef = ref(database, `${COLLECTION}/${id}`);
//     const snapshot = await get(procedureRef);
    
//     if (!snapshot.exists()) {
//       return null;
//     }
    
//     const data = snapshot.val();
//     const procedure: Procedure = {
//       id: snapshot.key,
//       name: data.name || '',
//       localPatientCharge: data.localPatientCharge || 0,
//       foreignPatientCharge: data.foreignPatientCharge || 0,
//       description: data.description || '',
//       category: data.category || '',
//       duration: data.duration || 0,
//       isActive: data.isActive !== undefined ? data.isActive : true,
//       createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
//       updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
//     };
    
//     return procedure;
//   },
  
//   async getByCategory(category: string) {
//     const proceduresRef = ref(database, COLLECTION);
//     const categoryQuery = query(proceduresRef, orderByChild('category'), equalTo(category));
//     const snapshot = await get(categoryQuery);
    
//     if (!snapshot.exists()) {
//       return [];
//     }
    
//     const procedures: Procedure[] = [];
    
//     snapshot.forEach((childSnapshot) => {
//       const data = childSnapshot.val();
//       procedures.push({
//         id: childSnapshot.key,
//         name: data.name || '',
//         localPatientCharge: data.localPatientCharge || 0,
//         foreignPatientCharge: data.foreignPatientCharge || 0,
//         description: data.description || '',
//         category: data.category || '',
//         duration: data.duration || 0,
//         isActive: data.isActive !== undefined ? data.isActive : true,
//         createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
//         updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
//       });
//     });
    
//     return procedures;
//   },
  
//   async searchByName(searchTerm: string) {
//     // Get all procedures and filter client-side (Firebase RTDB doesn't support text search)
//     const procedures = await this.getAll();
//     return procedures.filter(procedure => 
//       procedure.name.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   },
  
//   async getCategories() {
//     // Get all procedures to extract unique categories
//     const procedures = await this.getAll();
//     const categorySet = new Set<string>();
    
//     procedures.forEach(procedure => {
//       if (procedure.category) {
//         categorySet.add(procedure.category);
//       }
//     });
    
//     return Array.from(categorySet).sort();
//   }
// };

// src/services/procedureService.ts

import { database } from '@/lib/firebase';
import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { Procedure } from '@/types/procedure';

const COLLECTION = 'procedures';

export const procedureService = {
  async create(procedure: Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now();
    
    const docData: any = {
      name: procedure.name,
      charge: procedure.charge,
      description: procedure.description || '',
      category: procedure.category || '',
      duration: procedure.duration || 0,
      isActive: procedure.isActive !== undefined ? procedure.isActive : true,
      createdAt: now,
      updatedAt: now
    };

    // Generate a new key and set the data
    const newProcedureRef = push(ref(database, COLLECTION));
    await set(newProcedureRef, docData);
    
    return newProcedureRef;
  },

  async update(id: string, procedure: Partial<Omit<Procedure, 'id' | 'createdAt'>>) {
    const procedureRef = ref(database, `${COLLECTION}/${id}`);

    const updateData: any = {
      updatedAt: Date.now()
    };

    // Only update fields that were provided
    if (procedure.name !== undefined) updateData.name = procedure.name;
    if (procedure.charge !== undefined) updateData.charge = procedure.charge;
    if (procedure.description !== undefined) updateData.description = procedure.description;
    if (procedure.category !== undefined) updateData.category = procedure.category;
    if (procedure.duration !== undefined) updateData.duration = procedure.duration;
    if (procedure.isActive !== undefined) updateData.isActive = procedure.isActive;

    return update(procedureRef, updateData);
  },

  async delete(id: string) {
    const procedureRef = ref(database, `${COLLECTION}/${id}`);
    return remove(procedureRef);
  },

  async getAll() {
    const proceduresRef = ref(database, COLLECTION);
    const snapshot = await get(proceduresRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const procedures: Procedure[] = [];
    
    // Convert the snapshot to array of procedures
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      procedures.push({
        id: childSnapshot.key,
        name: data.name || '',
        charge: data.charge || data.localPatientCharge || 0, // Handle migration from old structure
        description: data.description || '',
        category: data.category || '',
        duration: data.duration || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    return procedures;
  },
  
  async getById(id: string) {
    const procedureRef = ref(database, `${COLLECTION}/${id}`);
    const snapshot = await get(procedureRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    const procedure: Procedure = {
      id: snapshot.key,
      name: data.name || '',
      charge: data.charge || data.localPatientCharge || 0, // Handle migration from old structure
      description: data.description || '',
      category: data.category || '',
      duration: data.duration || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
    
    return procedure;
  },
  
  async getByCategory(category: string) {
    const proceduresRef = ref(database, COLLECTION);
    const categoryQuery = query(proceduresRef, orderByChild('category'), equalTo(category));
    const snapshot = await get(categoryQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const procedures: Procedure[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      procedures.push({
        id: childSnapshot.key,
        name: data.name || '',
        charge: data.charge || data.localPatientCharge || 0, // Handle migration from old structure
        description: data.description || '',
        category: data.category || '',
        duration: data.duration || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    return procedures;
  },
  
  async searchByName(searchTerm: string) {
    // Get all procedures and filter client-side (Firebase RTDB doesn't support text search)
    const procedures = await this.getAll();
    return procedures.filter(procedure => 
      procedure.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },
  
  async getCategories() {
    // Get all procedures to extract unique categories
    const procedures = await this.getAll();
    const categorySet = new Set<string>();
    
    procedures.forEach(procedure => {
      if (procedure.category) {
        categorySet.add(procedure.category);
      }
    });
    
    return Array.from(categorySet).sort();
  }
};