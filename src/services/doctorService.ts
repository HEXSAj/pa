// src/services/doctorService.ts

import { database } from '@/lib/firebase';
import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { Doctor, DoctorSchedule, DoctorProcedure, MedicalProcedure } from '@/types/doctor';

const DOCTORS_COLLECTION = 'doctors';
const SCHEDULES_COLLECTION = 'doctorSchedules';
const PROCEDURES_COLLECTION = 'medicalProcedures';
const DOCTOR_PROCEDURES_COLLECTION = 'doctorProcedures';

export const doctorService = {
  // Doctor CRUD operations
//   async createDoctor(doctor: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>) {
//     const now = Date.now();
    
//     const docData = {
//       ...doctor,
//       createdAt: now,
//       updatedAt: now
//     };
    
//     // Generate a new key and set the data
//     const newDoctorRef = push(ref(database, DOCTORS_COLLECTION));
//     await set(newDoctorRef, docData);
    
//     return { ...docData, id: newDoctorRef.key };
//   },

    async createDoctor(doctor: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>) {
        const now = Date.now();

        const docData = {
            ...doctor,
            createdAt: now,
            updatedAt: now
        };

        // Generate a new key and set the data
        const newDoctorRef = push(ref(database, DOCTORS_COLLECTION));
        await set(newDoctorRef, docData);

        return { ...docData, id: newDoctorRef.key };
    },
  
  async updateDoctor(id: string, doctor: Partial<Omit<Doctor, 'id' | 'createdAt'>>) {
    const doctorRef = ref(database, `${DOCTORS_COLLECTION}/${id}`);
    
    const updateData = {
      ...doctor,
      updatedAt: Date.now()
    };
    
    await update(doctorRef, updateData);
    return { ...doctor, id };
  },
  
  async deleteDoctor(id: string) {
    // Check if any schedules or procedures reference this doctor
    const scheduleRef = ref(database, SCHEDULES_COLLECTION);
    const scheduleQuery = query(scheduleRef, orderByChild('doctorId'), equalTo(id));
    const scheduleSnapshot = await get(scheduleQuery);
    
    const procedureRef = ref(database, DOCTOR_PROCEDURES_COLLECTION);
    const procedureQuery = query(procedureRef, orderByChild('doctorId'), equalTo(id));
    const procedureSnapshot = await get(procedureQuery);
    
    if (scheduleSnapshot.exists() || procedureSnapshot.exists()) {
      throw new Error('Cannot delete doctor with existing schedules or procedures. Please delete those first.');
    }
    
    // Delete the doctor
    const doctorRef = ref(database, `${DOCTORS_COLLECTION}/${id}`);
    await remove(doctorRef);
  },
  
  async getAllDoctors() {
    const doctorsRef = ref(database, DOCTORS_COLLECTION);
    const snapshot = await get(doctorsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const doctors: Doctor[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      doctors.push({
        id: childSnapshot.key,
        name: data.name || '',
        speciality: data.speciality || '',
        description: data.description || '',
        contactNumber: data.contactNumber || '',
        email: data.email || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Sort by name for convenience
    return doctors.sort((a, b) => a.name.localeCompare(b.name));
  },
  
  async getDoctorById(id: string) {
    const doctorRef = ref(database, `${DOCTORS_COLLECTION}/${id}`);
    const snapshot = await get(doctorRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    
    return {
      id: snapshot.key,
      name: data.name || '',
      speciality: data.speciality || '',
      description: data.description || '',
      contactNumber: data.contactNumber || '',
      email: data.email || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
  },
  
  // Doctor Schedule operations
  async createSchedule(schedule: Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now();
    
    // Get doctor name for easy reference
    const doctorRef = ref(database, `${DOCTORS_COLLECTION}/${schedule.doctorId}`);
    const doctorSnapshot = await get(doctorRef);
    const doctorName = doctorSnapshot.exists() 
      ? doctorSnapshot.val().name 
      : 'Unknown Doctor';
    
    const scheduleData = {
      ...schedule,
      doctorName,
      createdAt: now,
      updatedAt: now
    };
    
    // Generate a new key and set the data
    const newScheduleRef = push(ref(database, SCHEDULES_COLLECTION));
    await set(newScheduleRef, scheduleData);
    
    return { ...scheduleData, id: newScheduleRef.key };
  },
  
  async updateSchedule(id: string, schedule: Partial<Omit<DoctorSchedule, 'id' | 'createdAt'>>) {
    const scheduleRef = ref(database, `${SCHEDULES_COLLECTION}/${id}`);
    
    // If doctor ID is changing, get new doctor name
    let doctorName;
    if (schedule.doctorId) {
      const doctorRef = ref(database, `${DOCTORS_COLLECTION}/${schedule.doctorId}`);
      const doctorSnapshot = await get(doctorRef);
      doctorName = doctorSnapshot.exists() 
        ? doctorSnapshot.val().name 
        : 'Unknown Doctor';
    }
    
    const updateData = {
      ...schedule,
      ...(doctorName && { doctorName }),
      updatedAt: Date.now()
    };
    
    await update(scheduleRef, updateData);
    return { ...schedule, id };
  },
  
  async deleteSchedule(id: string) {
    const scheduleRef = ref(database, `${SCHEDULES_COLLECTION}/${id}`);
    await remove(scheduleRef);
  },
  
  async getAllSchedules() {
    const schedulesRef = ref(database, SCHEDULES_COLLECTION);
    const snapshot = await get(schedulesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const schedules: DoctorSchedule[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      schedules.push({
        id: childSnapshot.key,
        doctorId: data.doctorId || '',
        doctorName: data.doctorName || '',
        dayOfWeek: data.dayOfWeek,
        timeSlots: data.timeSlots || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    return schedules;
  },
  
  async getSchedulesByDoctorId(doctorId: string) {
    const schedulesRef = ref(database, SCHEDULES_COLLECTION);
    const doctorScheduleQuery = query(schedulesRef, orderByChild('doctorId'), equalTo(doctorId));
    const snapshot = await get(doctorScheduleQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const schedules: DoctorSchedule[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      schedules.push({
        id: childSnapshot.key,
        doctorId: data.doctorId || '',
        doctorName: data.doctorName || '',
        dayOfWeek: data.dayOfWeek,
        timeSlots: data.timeSlots || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Sort by day of week
    const dayOrder = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7
    };
    
    return schedules.sort((a, b) => dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek]);
  },
  
  // Medical Procedures operations
  async createProcedure(procedure: Omit<MedicalProcedure, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now();
    
    // Build procedureData, excluding undefined values (Firebase doesn't allow undefined)
    const procedureData: any = {
      name: procedure.name,
      createdAt: now,
      updatedAt: now
    };
    
    // Only include description if it exists and is not empty
    if (procedure.description && procedure.description.trim()) {
      procedureData.description = procedure.description.trim();
    }
    
    // Only include category if it exists and is not empty
    if (procedure.category && procedure.category.trim()) {
      procedureData.category = procedure.category.trim();
    }
    
    // Generate a new key and set the data
    const newProcedureRef = push(ref(database, PROCEDURES_COLLECTION));
    await set(newProcedureRef, procedureData);
    
    return { ...procedureData, id: newProcedureRef.key };
  },
  
  async updateProcedure(id: string, procedure: Partial<Omit<MedicalProcedure, 'id' | 'createdAt'>>) {
    const procedureRef = ref(database, `${PROCEDURES_COLLECTION}/${id}`);
    
    const updateData = {
      ...procedure,
      updatedAt: Date.now()
    };
    
    await update(procedureRef, updateData);
    return { ...procedure, id };
  },
  
  async deleteProcedure(id: string) {
    // Check if any doctor procedures reference this procedure
    const doctorProcedureRef = ref(database, DOCTOR_PROCEDURES_COLLECTION);
    const doctorProcedureQuery = query(doctorProcedureRef, orderByChild('procedureId'), equalTo(id));
    const doctorProcedureSnapshot = await get(doctorProcedureQuery);
    
    if (doctorProcedureSnapshot.exists()) {
      throw new Error('Cannot delete this procedure because it is currently assigned to one or more doctors. Please remove all doctor assignments for this procedure first, then try deleting again.');
    }
    
    // Delete the procedure
    const procedureRef = ref(database, `${PROCEDURES_COLLECTION}/${id}`);
    await remove(procedureRef);
  },
  
  async getAllProcedures() {
    const proceduresRef = ref(database, PROCEDURES_COLLECTION);
    const snapshot = await get(proceduresRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const procedures: MedicalProcedure[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      procedures.push({
        id: childSnapshot.key,
        name: data.name || '',
        description: data.description || '',
        category: data.category || '',
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Sort by name for convenience
    return procedures.sort((a, b) => a.name.localeCompare(b.name));
  },
  
  async getProcedureById(id: string) {
    const procedureRef = ref(database, `${PROCEDURES_COLLECTION}/${id}`);
    const snapshot = await get(procedureRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    
    return {
      id: snapshot.key,
      name: data.name || '',
      description: data.description || '',
      category: data.category || '',
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
  },
  
  // Doctor Procedures operations
  async createDoctorProcedure(doctorProcedure: Omit<DoctorProcedure, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now();
    
    // Get doctor and procedure names for easy reference
    const doctorRef = ref(database, `${DOCTORS_COLLECTION}/${doctorProcedure.doctorId}`);
    const doctorSnapshot = await get(doctorRef);
    const doctorName = doctorSnapshot.exists() 
      ? doctorSnapshot.val().name 
      : 'Unknown Doctor';
    
    const procedureRef = ref(database, `${PROCEDURES_COLLECTION}/${doctorProcedure.procedureId}`);
    const procedureSnapshot = await get(procedureRef);
    const procedureName = procedureSnapshot.exists() 
      ? procedureSnapshot.val().name 
      : 'Unknown Procedure';
    
    // Build doctorProcedureData, excluding undefined values (Firebase doesn't allow undefined)
    const doctorProcedureData: any = {
      doctorId: doctorProcedure.doctorId,
      doctorName,
      procedureId: doctorProcedure.procedureId,
      procedureName,
      doctorCharge: doctorProcedure.doctorCharge,
      isActive: doctorProcedure.isActive !== undefined ? doctorProcedure.isActive : true,
      createdAt: now,
      updatedAt: now
    };
    
    // Only include description if it exists and is not empty
    if (doctorProcedure.description && doctorProcedure.description.trim()) {
      doctorProcedureData.description = doctorProcedure.description.trim();
    }
    
    // Generate a new key and set the data
    const newDoctorProcedureRef = push(ref(database, DOCTOR_PROCEDURES_COLLECTION));
    await set(newDoctorProcedureRef, doctorProcedureData);
    
    return { ...doctorProcedureData, id: newDoctorProcedureRef.key };
  },
  
  async updateDoctorProcedure(id: string, doctorProcedure: Partial<Omit<DoctorProcedure, 'id' | 'createdAt'>>) {
    const doctorProcedureRef = ref(database, `${DOCTOR_PROCEDURES_COLLECTION}/${id}`);
    
    // If doctor or procedure ID is changing, get new names
    let doctorName, procedureName;
    
    if (doctorProcedure.doctorId) {
      const doctorRef = ref(database, `${DOCTORS_COLLECTION}/${doctorProcedure.doctorId}`);
      const doctorSnapshot = await get(doctorRef);
      doctorName = doctorSnapshot.exists() 
        ? doctorSnapshot.val().name 
        : 'Unknown Doctor';
    }
    
    if (doctorProcedure.procedureId) {
      const procedureRef = ref(database, `${PROCEDURES_COLLECTION}/${doctorProcedure.procedureId}`);
      const procedureSnapshot = await get(procedureRef);
      procedureName = procedureSnapshot.exists() 
        ? procedureSnapshot.val().name 
        : 'Unknown Procedure';
    }
    
    const updateData = {
      ...doctorProcedure,
      ...(doctorName && { doctorName }),
      ...(procedureName && { procedureName }),
      updatedAt: Date.now()
    };
    
    await update(doctorProcedureRef, updateData);
    return { ...doctorProcedure, id };
  },
  
  async deleteDoctorProcedure(id: string) {
    const doctorProcedureRef = ref(database, `${DOCTOR_PROCEDURES_COLLECTION}/${id}`);
    await remove(doctorProcedureRef);
  },
  
  async getAllDoctorProcedures() {
    const doctorProceduresRef = ref(database, DOCTOR_PROCEDURES_COLLECTION);
    const snapshot = await get(doctorProceduresRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const doctorProcedures: DoctorProcedure[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      doctorProcedures.push({
        id: childSnapshot.key,
        doctorId: data.doctorId || '',
        doctorName: data.doctorName || '',
        procedureId: data.procedureId || '',
        procedureName: data.procedureName || '',
        doctorCharge: parseFloat(data.doctorCharge) || 0,
        description: data.description || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    return doctorProcedures;
  },
  
  async getDoctorProceduresByDoctorId(doctorId: string) {
    const doctorProceduresRef = ref(database, DOCTOR_PROCEDURES_COLLECTION);
    const doctorProcedureQuery = query(doctorProceduresRef, orderByChild('doctorId'), equalTo(doctorId));
    const snapshot = await get(doctorProcedureQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const doctorProcedures: DoctorProcedure[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      doctorProcedures.push({
        id: childSnapshot.key,
        doctorId: data.doctorId || '',
        doctorName: data.doctorName || '',
        procedureId: data.procedureId || '',
        procedureName: data.procedureName || '',
        doctorCharge: parseFloat(data.doctorCharge) || 0,
        description: data.description || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Sort by procedure name for convenience
    return doctorProcedures.sort((a, b) => a.procedureName.localeCompare(b.procedureName));
  }
};