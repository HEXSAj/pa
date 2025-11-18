// Updated src/services/appointmentService.ts - add payment and patient arrival methods

import { database } from '@/lib/firebase';
import { ref, set, update, remove, get, push, query, orderByChild, equalTo, startAt, endAt } from 'firebase/database';
import { Appointment, AppointmentStatus, Patient, calculateTotalCharge, AppointmentPayment, AppointmentDocument } from '@/types/appointment';

import { cashierService } from './cashierService';
import { attendanceService } from './attendanceService';
import { attendanceValidationService } from './attendanceValidationService';

import { staffService } from './staffService';
import { getAuth } from 'firebase/auth';

import { onValue, off } from 'firebase/database';



const APPOINTMENTS_COLLECTION = 'appointments';
const PATIENTS_COLLECTION = 'patients';

export const appointmentService = {

  // Helper function to calculate duration from start and end times
  calculateDurationFromTimes(startTime: string | undefined, endTime: string | undefined): number {
    // Return 0 if either time is undefined (for session-based appointments)
    if (!startTime || !endTime) {
      return 0;
    }
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return endTotalMinutes - startTotalMinutes;
  },

  subscribeToSessionAppointments(
    doctorId: string, 
    date: string, 
    startTime: string, 
    endTime: string, 
    callback: (appointments: Appointment[]) => void
  ) {
    const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
    
    const unsubscribe = onValue(appointmentsRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const appointments: Appointment[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
          const appointment = {
            id: childSnapshot.key,
            patientId: data.patientId,
            patientName: data.patientName,
            patientContact: data.patientContact,
            doctorId: data.doctorId,
            doctorName: data.doctorName,
            date: data.date,
            dayOfWeek: data.dayOfWeek,
            procedures: data.procedures || [],
            status: data.status,
            notes: data.notes || '',
            totalCharge: parseFloat(data.totalCharge) || 0,
            manualAppointmentAmount: data.manualAppointmentAmount !== undefined && data.manualAppointmentAmount !== null
              ? Number(data.manualAppointmentAmount)
              : undefined,
            isPatientArrived: data.isPatientArrived || false,
            patientArrivedAt: data.patientArrivedAt,
            payment: data.payment,
            sessionId: data.sessionId,
            sessionAppointmentNumber: data.sessionAppointmentNumber,
            cashierSessionId: data.cashierSessionId,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
          };
        
        // Filter for this specific session using sessionId
        const expectedSessionId = `${doctorId}_${date}_${startTime}_${endTime}`;
        if (appointment.doctorId === doctorId &&
            appointment.date === date &&
            appointment.sessionId === expectedSessionId &&
            appointment.status !== 'cancelled') {
          appointments.push(appointment);
        }
      });
      
      // Sort by session appointment number
      appointments.sort((a, b) => (a.sessionAppointmentNumber || 0) - (b.sessionAppointmentNumber || 0));
      
      callback(appointments);
    });
    
    return unsubscribe;
  },

  subscribeToAppointmentsByDateRange(
    startDate: string,
    endDate: string,
    callback: (appointments: Appointment[]) => void
  ) {
    const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
    
    const unsubscribe = onValue(appointmentsRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
        const appointments: Appointment[] = [];
        
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          const appointment = {
            id: childSnapshot.key,
            patientId: data.patientId,
            patientName: data.patientName,
            patientContact: data.patientContact,
            doctorId: data.doctorId,
            doctorName: data.doctorName,
            date: data.date,
            dayOfWeek: data.dayOfWeek,
            procedures: data.procedures || [],
            status: data.status,
            notes: data.notes || '',
            totalCharge: parseFloat(data.totalCharge) || 0,
            manualAppointmentAmount: data.manualAppointmentAmount !== undefined && data.manualAppointmentAmount !== null
              ? Number(data.manualAppointmentAmount)
              : undefined,
            isPatientArrived: data.isPatientArrived || false,
            patientArrivedAt: data.patientArrivedAt,
            payment: data.payment,
            sessionId: data.sessionId,
            sessionAppointmentNumber: data.sessionAppointmentNumber,
            cashierSessionId: data.cashierSessionId,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
          };
          
          // Filter by date range
          if (appointment.date >= startDate && appointment.date <= endDate) {
            appointments.push(appointment);
          }
        });
      
        callback(appointments);
    });
    
    return unsubscribe;
  },

  // Unsubscribe from listeners
  unsubscribe(unsubscribeFunction: () => void) {
    unsubscribeFunction();
  },
  
  async createPatient(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now();
    
    // Filter out undefined values - Firebase doesn't accept undefined
    const patientData: any = {
      name: patient.name,
      contactNumber: patient.contactNumber,
      createdAt: now,
      updatedAt: now
    };
  
    // Only add optional fields if they have values
    if (patient.email !== undefined && patient.email !== '') {
      patientData.email = patient.email;
    }
    
    if (patient.dateOfBirth !== undefined && patient.dateOfBirth !== '') {
      patientData.dateOfBirth = patient.dateOfBirth;
    }
    
    if (patient.gender !== undefined && patient.gender !== '') {
      patientData.gender = patient.gender;
    }
    
    if (patient.bodyWeight !== undefined && patient.bodyWeight !== null) {
      patientData.bodyWeight = patient.bodyWeight;
    }
    
    if (patient.drugAllergies !== undefined && patient.drugAllergies !== '') {
      patientData.drugAllergies = patient.drugAllergies;
    }
    
    // Generate a new key and set the data
    const newPatientRef = push(ref(database, PATIENTS_COLLECTION));
    await set(newPatientRef, patientData);
    
    return { ...patientData, id: newPatientRef.key };
  },


  // Add this new function to get ALL patients with the same contact number



  async getPatientsByContact(contactNumber: string) {
  const patientsRef = ref(database, PATIENTS_COLLECTION);
  const patientQuery = query(patientsRef, orderByChild('contactNumber'), equalTo(contactNumber));
  const snapshot = await get(patientQuery);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const patients: Patient[] = [];
  snapshot.forEach((childSnapshot) => {
    const data = childSnapshot.val();
    patients.push({
      id: childSnapshot.key,
      name: data.name,
      contactNumber: data.contactNumber,
      email: data.email || '',
      age: data.age || undefined,
      dateOfBirth: data.dateOfBirth || undefined, // Add dateOfBirth field
      gender: data.gender || undefined,
      bodyWeight: data.bodyWeight || undefined,
      drugAllergies: data.drugAllergies || '',  // ADD THIS LINE
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    });
  });
  
  return patients;
},

  // Search patients by name (partial match)
  async searchPatientsByName(nameQuery: string) {
    if (!nameQuery || nameQuery.trim().length < 2) {
      return [];
    }
    
    const patientsRef = ref(database, PATIENTS_COLLECTION);
    const snapshot = await get(patientsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const patients: Patient[] = [];
    const searchTerm = nameQuery.toLowerCase().trim();
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      const patientName = (data.name || '').toLowerCase();
      
      // Check if the name contains the search term
      if (patientName.includes(searchTerm)) {
        patients.push({
          id: childSnapshot.key,
          name: data.name,
          contactNumber: data.contactNumber,
          email: data.email || '',
          age: data.age || undefined,
          dateOfBirth: data.dateOfBirth || undefined, // Add missing dateOfBirth field
          gender: data.gender || undefined,
          bodyWeight: data.bodyWeight || undefined,
          drugAllergies: data.drugAllergies || '',
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
        });
      }
    });
    
    // Sort by name for better user experience
    patients.sort((a, b) => a.name.localeCompare(b.name));
    
    return patients;
  },

  // Combined search method that searches both by name and contact number
  async searchPatients(query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const trimmedQuery = query.trim();
    
    // Check if query is a phone number (contains only digits, spaces, hyphens, plus)
    const isPhoneNumber = /^[\d\s\-\+]+$/.test(trimmedQuery);
    
    if (isPhoneNumber) {
      // Search by contact number
      return await this.getPatientsByContact(trimmedQuery);
    } else {
      // Search by name
      return await this.searchPatientsByName(trimmedQuery);
    }
  },



  // async checkCashierSessionRequirement(userId: string): Promise<{ hasAttendance: boolean; hasActiveSession: boolean; sessionId?: string; userRole?: string }> {
  //   try {
  //     // Check attendance first
  //     const todayAttendance = await attendanceService.getTodayAttendance(userId);
  //     const hasAttendance = todayAttendance !== null && todayAttendance.timeIn && !todayAttendance.timeOut;
      
  //     if (!hasAttendance) {
  //       return { hasAttendance: false, hasActiveSession: false };
  //     }
      
  //     // Get user role from staff service
  //     const staffUser = await staffService.getStaffById(userId);
  //     const userRole = staffUser?.role || 'staff';
      
  //     // For doctor role, only attendance is required - no cashier session needed
  //     if (userRole === 'doctor') {
  //       return { 
  //         hasAttendance, 
  //         hasActiveSession: true, // Set to true to bypass cashier session check
  //         userRole 
  //       };
  //     }
      
  //     // For admin and staff roles, check for active cashier session
  //     const activeSession = await cashierService.getActiveSession(userId);
  //     const hasActiveSession = activeSession !== null;
      
  //     return { 
  //       hasAttendance, 
  //       hasActiveSession, 
  //       sessionId: activeSession?.id,
  //       userRole 
  //     };
  //   } catch (error) {
  //     console.error('Error checking cashier session requirement:', error);
  //     return { hasAttendance: false, hasActiveSession: false };
  //   }
  // },



  async checkCashierSessionRequirement(userId: string, isEdit: boolean = false): Promise<{ hasAttendance: boolean; hasActiveSession: boolean; sessionId?: string; userRole?: string; hasAnyActiveSession?: boolean }> {
    try {
      console.log('🔍 Checking cashier session requirement for user:', userId);
      
      // Use our new attendance validation system
      const attendanceValidation = await attendanceValidationService.validateAttendanceForAppointments(userId);
      console.log('📊 Attendance validation result:', attendanceValidation);
      
      const hasAttendance = attendanceValidation.isValid && attendanceValidation.isClockedIn;
      
      if (!hasAttendance) {
        console.log('❌ No valid attendance found');
        return { hasAttendance: false, hasActiveSession: false };
      }
      
      // Get user role from staff service
      const staffUser = await staffService.getStaffById(userId);
      const userRole = staffUser?.role || 'cashier';
      console.log('👤 User role:', userRole);
      
      // For doctor role, only attendance is required - no cashier session needed
      if (userRole === 'doctor') {
        console.log('✅ Doctor role - bypassing cashier session check');
        return { 
          hasAttendance, 
          hasActiveSession: true, // Set to true to bypass cashier session check
          userRole 
        };
      }
      
      // Check if any user has an active cashier session
      const hasAnyActiveSession = await cashierService.hasAnyActiveSession();
      console.log('🔍 Any active session check result:', hasAnyActiveSession);
      
      // For admin and staff roles, check for active cashier session
      console.log('🔍 Checking for active cashier session...');
      const activeSession = await cashierService.getActiveSession(userId);
      const hasActiveSession = activeSession !== null;
      console.log('💰 Cashier session check result:', { hasActiveSession, sessionId: activeSession?.id });
      
      return { 
        hasAttendance, 
        hasActiveSession, 
        sessionId: activeSession?.id,
        userRole,
        hasAnyActiveSession
      };
    } catch (error) {
      console.error('❌ Error checking cashier session requirement:', error);
      return { hasAttendance: false, hasActiveSession: false };
    }
  },





 
  
  async updatePatient(id: string, updates: Partial<Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>>) {
    const patientRef = ref(database, `${PATIENTS_COLLECTION}/${id}`);
    
    // Filter out undefined values - Firebase doesn't accept undefined
    const updateData: any = {
      updatedAt: Date.now()
    };
  
    // Only update fields that have actual values
    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    
    if (updates.contactNumber !== undefined) {
      updateData.contactNumber = updates.contactNumber;
    }
    
    // For email, explicitly handle empty string as removal
    if (updates.email !== undefined) {
      if (updates.email === '' || updates.email === null) {
        updateData.email = null; // This will remove the field in Firebase
      } else {
        updateData.email = updates.email;
      }
    }
    
    if (updates.age !== undefined) {
      updateData.age = updates.age === null ? null : updates.age;
    }
    
    if (updates.dateOfBirth !== undefined) {
      updateData.dateOfBirth = updates.dateOfBirth === '' ? null : updates.dateOfBirth;
    }
    
    if (updates.gender !== undefined) {
      updateData.gender = updates.gender === '' ? null : updates.gender;
    }
    
    if (updates.bodyWeight !== undefined) {
      updateData.bodyWeight = updates.bodyWeight === null ? null : updates.bodyWeight;
    }
    
    if (updates.drugAllergies !== undefined) {
      updateData.drugAllergies = updates.drugAllergies === '' ? null : updates.drugAllergies;
    }
  
    await update(patientRef, updateData);
  },
  
  async checkDuplicatePatientNameDOB(contactNumber: string, name: string, dateOfBirth?: string, excludeId?: string) {
      const patients = await this.getPatientsByContact(contactNumber);
      
      return patients.some(patient => 
        patient.name.toLowerCase().trim() === name.toLowerCase().trim() && 
        patient.dateOfBirth === dateOfBirth &&
        patient.id !== excludeId // Exclude current patient when editing
      );
    },

  async deletePatient(id: string) {
    try {
      // Check if patient has any appointments
      const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
      const appointmentsQuery = query(appointmentsRef, orderByChild('patientId'), equalTo(id));
      const appointmentsSnapshot = await get(appointmentsQuery);
      
      if (appointmentsSnapshot.exists()) {
        throw new Error('Cannot delete patient with existing appointments. Please cancel all appointments first.');
      }
      
      // Delete the patient
      const patientRef = ref(database, `${PATIENTS_COLLECTION}/${id}`);
      await remove(patientRef);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  },


  async getPatientById(id: string) {
    const patientRef = ref(database, `${PATIENTS_COLLECTION}/${id}`);
    const snapshot = await get(patientRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    
    return {
      id: snapshot.key,
      name: data.name,
      contactNumber: data.contactNumber,
      email: data.email || '',
      age: data.age || undefined,
      dateOfBirth: data.dateOfBirth || undefined, // Add dateOfBirth field
      gender: data.gender || undefined,
      bodyWeight: data.bodyWeight || undefined,
      drugAllergies: data.drugAllergies || '',// ADD THIS LINE
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
  },

  async getPatientByContact(contactNumber: string) {
    const patientsRef = ref(database, PATIENTS_COLLECTION);
    const patientQuery = query(patientsRef, orderByChild('contactNumber'), equalTo(contactNumber));
    const snapshot = await get(patientQuery);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    let patient = null;
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      patient = {
        id: childSnapshot.key,
        name: data.name,
        contactNumber: data.contactNumber,
        email: data.email || '',
        age: data.age || undefined,
        dateOfBirth: data.dateOfBirth || undefined, // Add dateOfBirth field
        gender: data.gender || undefined,
        bodyWeight: data.bodyWeight || undefined,
        drugAllergies: data.drugAllergies || '', // ADD THIS LINE
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      };
      return true;
    });
    
    return patient;
  },



    // async getAllPatients() {
    //   const patientsRef = ref(database, PATIENTS_COLLECTION);
    //   const snapshot = await get(patientsRef);
      
    //   if (!snapshot.exists()) {
    //     return [];
    //   }
      
    //   const patients: Patient[] = [];
      
    //   snapshot.forEach((childSnapshot) => {
    //     const data = childSnapshot.val();
    //     patients.push({
    //       id: childSnapshot.key,
    //       name: data.name,
    //       contactNumber: data.contactNumber,
    //       email: data.email || '',
    //       age: data.age || undefined, 
    //       gender: data.gender || undefined,        // Add this
    //       bodyWeight: data.bodyWeight || undefined, // Add this
    //       createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    //       updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    //     });
    //   });
      
    //   // Sort by name
    //   return patients.sort((a, b) => a.name.localeCompare(b.name));
    // },


    async getAllPatients() {
      const patientsRef = ref(database, PATIENTS_COLLECTION);
      const snapshot = await get(patientsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const patients: Patient[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        patients.push({
          id: childSnapshot.key,
          name: data.name,
          contactNumber: data.contactNumber,
          email: data.email || '',
          age: data.age || undefined, 
          dateOfBirth: data.dateOfBirth || undefined, // Add dateOfBirth field
          gender: data.gender || undefined,
          bodyWeight: data.bodyWeight || undefined,
          drugAllergies: data.drugAllergies || '', // ADD THIS LINE
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
        });
      });
      
      // Sort by name
      return patients.sort((a, b) => a.name.localeCompare(b.name));
    },
    


  async createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>, userId?: string) {
    // If userId is provided, check cashier session requirement
    if (userId) {
      const sessionCheck = await this.checkCashierSessionRequirement(userId);
      
      if (!sessionCheck.hasAttendance) {
        throw new Error('You must mark attendance before creating appointments');
      }
      
      // Only check for cashier session if user is not a doctor
      if (sessionCheck.userRole !== 'doctor' && !sessionCheck.hasActiveSession) {
        throw new Error('You must start a cashier session before creating appointments');
      }
    }

    const now = Date.now();

    // Calculate total charge if not already set
    const totalCharge = appointment.totalCharge || calculateTotalCharge(appointment.procedures);

    // Generate sessionId based on doctor, date, and time slot from sessionId
    const sessionId = appointment.sessionId;
    if (!sessionId) {
      throw new Error('Session ID is required for appointment creation');
    }

    // Generate session appointment number BEFORE creating the appointment
    const sessionAppointmentNumber = await this.generateSessionAppointmentNumber(
      appointment.doctorId,
      appointment.date,
      sessionId
    );

    // Get the active session ID if user is provided and not a doctor
    let cashierSessionId: string | null = null;
    if (userId) {
      try {
        const sessionCheck = await this.checkCashierSessionRequirement(userId);
        
        // Only link to cashier session if user is not a doctor and has an active session
        if (sessionCheck.userRole !== 'doctor') {
          const activeSession = await cashierService.getActiveSession(userId);
          cashierSessionId = activeSession?.id || null;
          console.log(`Active session found for user ${userId}: ${cashierSessionId}`);
        } else {
          console.log(`User ${userId} is a doctor - no cashier session linking required`);
        }
      } catch (error) {
        console.error('Error getting active session:', error);
      }
    }

    // Get current user info for createdBy field
    let createdByInfo = null;
    if (userId) {
      try {
        let staffUser = await staffService.getStaffById(userId);
        
        // If user not found in staff collection, try to sync from auth
        if (!staffUser) {
          const auth = getAuth();
          const authUser = auth.currentUser;
          if (authUser && authUser.uid === userId) {
            staffUser = await staffService.syncAuthUserToStaff(
              userId, 
              authUser.email || 'unknown@email.com',
              authUser.displayName || undefined
            );
          }
        }
        
        if (staffUser) {
          createdByInfo = {
            uid: userId,
            email: staffUser.email,
            role: staffUser.role,
            displayName: staffUser.displayName
          };
        }
      } catch (error) {
        console.error('Error getting staff user info:', error);
      }
    }

    // Build appointment data - only include cashierSessionId if it's not null
    const appointmentData: any = {
      ...appointment,
      totalCharge,
      sessionId,
      sessionAppointmentNumber, // Add the session appointment number
      createdAt: now,
      updatedAt: now,
      createdBy: createdByInfo
    };

    // Only add cashierSessionId if it's not null (avoid undefined in Firebase)
    if (cashierSessionId !== null) {
      appointmentData.cashierSessionId = cashierSessionId;
    }

    console.log(`Creating appointment #${sessionAppointmentNumber} for session ${sessionId} with data:`, appointmentData);

    // Generate a new key and set the data
    const newAppointmentRef = push(ref(database, APPOINTMENTS_COLLECTION));
    await set(newAppointmentRef, appointmentData);

    console.log(`Appointment created with ID: ${newAppointmentRef.key}, Session Appointment #${sessionAppointmentNumber}`);

    // If appointment is linked to a cashier session, update the session count
    if (cashierSessionId) {
      try {
        console.log(`Updating appointment count for session: ${cashierSessionId}`);
        await cashierService.updateSessionAppointmentCount(cashierSessionId);
        console.log(`Successfully updated appointment count for session ${cashierSessionId}`);
      } catch (error) {
        console.error('Error updating session appointment count:', error);
        // Don't throw error - appointment was created successfully
      }
    } else {
      console.log('No cashier session ID found, skipping count update');
    }

    return { ...appointmentData, id: newAppointmentRef.key };
  },



  // async backfillSessionIds() {
  // This function is no longer needed since we're using session-based appointments
  // and appointments are created with sessionId from the start
  // },
  
  async updateAppointment(id: string, appointment: Partial<Omit<Appointment, 'id' | 'createdAt'>>) {
    const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${id}`);
    
    // Calculate total charge if procedures are being updated
    let totalCharge = appointment.totalCharge;
    if (appointment.procedures && !totalCharge) {
      totalCharge = calculateTotalCharge(appointment.procedures);
    }
    
    const updateData = {
      ...appointment,
      ...(totalCharge !== undefined && { totalCharge }),
      updatedAt: Date.now()
    };
    
    await update(appointmentRef, updateData);
    return { ...appointment, id };
  },

  // Helper function to update legacy appointments with creator information
  async updateAppointmentCreator(appointmentId: string, userId: string) {
    try {
      // Get current user info
      let staffUser = await staffService.getStaffById(userId);
      
      // If user not found in staff collection, try to sync from auth
      if (!staffUser) {
        const auth = getAuth();
        const authUser = auth.currentUser;
        if (authUser && authUser.uid === userId) {
          staffUser = await staffService.syncAuthUserToStaff(
            userId, 
            authUser.email || 'unknown@email.com',
            authUser.displayName || undefined
          );
        }
      }
      
      if (!staffUser) {
        throw new Error('User information not found');
      }

      const createdByInfo = {
        uid: userId,
        email: staffUser.email,
        role: staffUser.role,
        displayName: staffUser.displayName
      };

      // Update the appointment with creator information
      await this.updateAppointment(appointmentId, { createdBy: createdByInfo });
      
      return { success: true, createdBy: createdByInfo };
    } catch (error) {
      console.error('Error updating appointment creator:', error);
      throw error;
    }
  },
  
  async deleteAppointment(id: string) {
    const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${id}`);
    await remove(appointmentRef);
  },
  
 
  


  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${appointmentId}`);
    const snapshot = await get(appointmentRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    // Handle documents array - convert timestamps to Date objects
    const documents = data.documents ? data.documents.map((doc: any) => ({
      ...doc,
      uploadedAt: doc.uploadedAt ? (doc.uploadedAt instanceof Date ? doc.uploadedAt : new Date(doc.uploadedAt)) : new Date()
    })) : undefined;
    
    return {
      ...data,
      manualAppointmentAmount: data.manualAppointmentAmount !== undefined && data.manualAppointmentAmount !== null
        ? Number(data.manualAppointmentAmount)
        : undefined,
      documents,
      id: appointmentId,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    };
  },


  async generateSessionAppointmentNumber(
    doctorId: string, 
    date: string, 
    sessionId: string
  ): Promise<number> {
    try {
      console.log('generateSessionAppointmentNumber called with:', { doctorId, date, sessionId });
      
      // Get all existing appointments for this exact doctor session
      const allAppointments = await this.getAllAppointments();
      
      const sessionAppointments = allAppointments.filter(apt => 
        apt.doctorId === doctorId &&
        apt.date === date &&
        apt.sessionId === sessionId &&
        apt.status !== 'cancelled'
      );
      
      console.log('Session appointments found:', sessionAppointments);
      console.log('Session appointment numbers:', sessionAppointments.map(apt => apt.sessionAppointmentNumber));
      
      // Find the highest existing session appointment number (only valid numbers)
      const maxNumber = sessionAppointments.reduce((max, apt) => {
        const currentNumber = apt.sessionAppointmentNumber;
        // Only consider valid numbers (not strings or invalid values)
        if (typeof currentNumber === 'number' && currentNumber > 0) {
          return Math.max(max, currentNumber);
        }
        return max;
      }, 0);
      
      console.log('Max session appointment number:', maxNumber);
      
      // Return the next sequential number
      const nextNumber = maxNumber + 1;
      console.log('Next session appointment number:', nextNumber);
      return nextNumber;
    } catch (error) {
      console.error('Error generating session appointment number:', error);
      return 1; // Default to 1 if there's an error
    }
  },

  // Fix appointments with invalid sessionAppointmentNumber values
  async fixInvalidSessionAppointmentNumbers(): Promise<void> {
    try {
      console.log('Starting to fix invalid session appointment numbers...');
      const allAppointments = await this.getAllAppointments();
      
      // Group appointments by doctor, date, and session
      const sessionGroups: { [key: string]: Appointment[] } = {};
      
      allAppointments.forEach(apt => {
        if (apt.doctorId && apt.date && apt.sessionId) {
          const key = `${apt.doctorId}_${apt.date}_${apt.sessionId}`;
          if (!sessionGroups[key]) {
            sessionGroups[key] = [];
          }
          sessionGroups[key].push(apt);
        }
      });
      
      // Fix each session group
      for (const [sessionKey, appointments] of Object.entries(sessionGroups)) {
        // Filter out cancelled appointments
        const validAppointments = appointments.filter(apt => apt.status !== 'cancelled');
        
        // Check if any appointments have invalid sessionAppointmentNumber
        const needsFixing = validAppointments.some(apt => 
          !apt.sessionAppointmentNumber || 
          typeof apt.sessionAppointmentNumber !== 'number' || 
          apt.sessionAppointmentNumber <= 0
        );
        
        if (needsFixing) {
          console.log(`Fixing session group: ${sessionKey}`);
          
          // Sort by creation time to maintain order
          validAppointments.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
          
          // Assign sequential numbers
          for (let i = 0; i < validAppointments.length; i++) {
            const appointment = validAppointments[i];
            const newNumber = i + 1;
            
            // Only update if the number is invalid
            if (!appointment.sessionAppointmentNumber || 
                typeof appointment.sessionAppointmentNumber !== 'number' || 
                appointment.sessionAppointmentNumber <= 0) {
              
              console.log(`Updating appointment ${appointment.id} to session number ${newNumber}`);
              
              await this.updateAppointment(appointment.id!, {
                sessionAppointmentNumber: newNumber
              });
            }
          }
        }
      }
      
      console.log('Finished fixing invalid session appointment numbers');
    } catch (error) {
      console.error('Error fixing invalid session appointment numbers:', error);
    }
  },

  async getAllAppointments() {
    const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
    const snapshot = await get(appointmentsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const appointments: Appointment[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      // Handle documents array - convert timestamps to Date objects
      const documents = data.documents ? data.documents.map((doc: any) => ({
        ...doc,
        uploadedAt: doc.uploadedAt ? (doc.uploadedAt instanceof Date ? doc.uploadedAt : new Date(doc.uploadedAt)) : new Date()
      })) : undefined;
      
      appointments.push({
        id: childSnapshot.key,
        patientId: data.patientId,
        patientName: data.patientName,
        patientContact: data.patientContact,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        date: data.date,
        dayOfWeek: data.dayOfWeek,
        procedures: data.procedures || [],
        status: data.status,
        notes: data.notes || '',
        totalCharge: parseFloat(data.totalCharge) || 0,
        manualAppointmentAmount: data.manualAppointmentAmount !== undefined && data.manualAppointmentAmount !== null
          ? Number(data.manualAppointmentAmount)
          : undefined,
        isPatientArrived: data.isPatientArrived || false,
        patientArrivedAt: data.patientArrivedAt,
        payment: data.payment,
        sessionId: data.sessionId,
        sessionAppointmentNumber: data.sessionAppointmentNumber,
        cashierSessionId: data.cashierSessionId,
        loadedToPOS: data.loadedToPOS || false,
        loadedToPOSAt: data.loadedToPOSAt,
        loadedToPOSBy: data.loadedToPOSBy,
        posSaleId: data.posSaleId,
        isArchived: data.isArchived || false,
        archivedAt: data.archivedAt,
        documents,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Sort by date and session appointment number
    return appointments.sort((a, b) => {
      // First sort by date
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      
      // If dates are equal, sort by session appointment number
      const aNumber = a.sessionAppointmentNumber || 0;
      const bNumber = b.sessionAppointmentNumber || 0;
      return aNumber - bNumber;
    });
  },
  
  async getAppointmentsByDoctor(doctorId: string) {
    const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
    const doctorAppointmentsQuery = query(appointmentsRef, orderByChild('doctorId'), equalTo(doctorId));
    const snapshot = await get(doctorAppointmentsQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const appointments: Appointment[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      appointments.push({
        id: childSnapshot.key,
        patientId: data.patientId,
        patientName: data.patientName,
        patientContact: data.patientContact,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        date: data.date,
        dayOfWeek: data.dayOfWeek,
        procedures: data.procedures || [],
        status: data.status,
        notes: data.notes || '',
        totalCharge: parseFloat(data.totalCharge) || 0,
        manualAppointmentAmount: data.manualAppointmentAmount !== undefined && data.manualAppointmentAmount !== null
          ? Number(data.manualAppointmentAmount)
          : undefined,
        isPatientArrived: data.isPatientArrived || false,
        patientArrivedAt: data.patientArrivedAt,
        payment: data.payment,
        sessionId: data.sessionId,
        sessionAppointmentNumber: data.sessionAppointmentNumber,
        cashierSessionId: data.cashierSessionId,
        loadedToPOS: data.loadedToPOS || false,
        loadedToPOSAt: data.loadedToPOSAt,
        loadedToPOSBy: data.loadedToPOSBy,
        posSaleId: data.posSaleId,
        isArchived: data.isArchived || false,
        archivedAt: data.archivedAt,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Sort by date and session appointment number
    return appointments.sort((a, b) => {
      // First sort by date
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      
      // If dates are equal, sort by session appointment number
      const aNumber = a.sessionAppointmentNumber || 0;
      const bNumber = b.sessionAppointmentNumber || 0;
      return aNumber - bNumber;
    });
  },
  
  async getAppointmentsByDateRange(startDate: string, endDate: string) {
    const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
    const dateRangeQuery = query(
      appointmentsRef, 
      orderByChild('date'), 
      startAt(startDate), 
      endAt(endDate)
    );
    const snapshot = await get(dateRangeQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const appointments: Appointment[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      appointments.push({
        id: childSnapshot.key,
        patientId: data.patientId,
        patientName: data.patientName,
        patientContact: data.patientContact,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        date: data.date,
          dayOfWeek: data.dayOfWeek,
          procedures: data.procedures || [],
        status: data.status,
        notes: data.notes || '',
        totalCharge: parseFloat(data.totalCharge) || 0,
        manualAppointmentAmount: data.manualAppointmentAmount !== undefined && data.manualAppointmentAmount !== null
          ? Number(data.manualAppointmentAmount)
          : undefined,
        isPatientArrived: data.isPatientArrived || false,
        patientArrivedAt: data.patientArrivedAt,
        payment: data.payment,
        sessionId: data.sessionId,
        cashierSessionId: data.cashierSessionId,
        sessionAppointmentNumber: data.sessionAppointmentNumber,
        // Pharmacy review fields
        pharmacyReviewStatus: data.pharmacyReviewStatus,
        pharmacyReviewedAt: data.pharmacyReviewedAt,
        pharmacyReviewedBy: data.pharmacyReviewedBy,
        pharmacyReviewNotes: data.pharmacyReviewNotes,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Sort by doctor, date and time
    return appointments.sort((a, b) => {
      // First sort by doctor
      const doctorComparison = a.doctorName.localeCompare(b.doctorName);
      if (doctorComparison !== 0) return doctorComparison;
      
      // Then by date
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      
      // Finally by start time
      return (a.sessionAppointmentNumber || 0) - (b.sessionAppointmentNumber || 0);
    });
  },
  
  async getAppointmentsByPatient(patientId: string) {
    const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
    const patientAppointmentsQuery = query(appointmentsRef, orderByChild('patientId'), equalTo(patientId));
    const snapshot = await get(patientAppointmentsQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const appointments: Appointment[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      appointments.push({
        id: childSnapshot.key,
        patientId: data.patientId,
        patientName: data.patientName,
        patientContact: data.patientContact,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        date: data.date,
          dayOfWeek: data.dayOfWeek,
          procedures: data.procedures || [],
        status: data.status,
        notes: data.notes || '',
        totalCharge: parseFloat(data.totalCharge) || 0,
        manualAppointmentAmount: data.manualAppointmentAmount !== undefined && data.manualAppointmentAmount !== null
          ? Number(data.manualAppointmentAmount)
          : undefined,
        isPatientArrived: data.isPatientArrived || false,
        patientArrivedAt: data.patientArrivedAt,
        payment: data.payment,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Sort by date (newest first) and time
    return appointments.sort((a, b) => {
      // First sort by date in descending order
      const dateComparison = b.date.localeCompare(a.date);
      if (dateComparison !== 0) return dateComparison;
      
      // If dates are equal, sort by start time
      return (a.sessionAppointmentNumber || 0) - (b.sessionAppointmentNumber || 0);
    });
  },
  
  // Helper method to update appointment status
  async updateAppointmentStatus(id: string, status: AppointmentStatus) {
    const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${id}`);
    
    const updateData = {
      status,
      updatedAt: Date.now()
    };
    
    await update(appointmentRef, updateData);
    return { id, status };
  },

  // NEW METHODS FOR PAYMENT AND PATIENT ARRIVAL



  async updatePatientArrival(id: string, isArrived: boolean) {
  const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${id}`);
  
  // Get current appointment data to check conditions
  const snapshot = await get(appointmentRef);
  if (!snapshot.exists()) {
    throw new Error('Appointment not found');
  }
  
  const appointment = snapshot.val();
  
  // Check if appointment is refunded
  if (appointment.payment?.refunded) {
    throw new Error('Cannot change arrival status - appointment has been refunded');
  }
  
  // If trying to unmark arrival (isArrived = false) and appointment is paid and arrived
  if (!isArrived && appointment.isPatientArrived && appointment.payment?.isPaid && !appointment.payment?.refunded) {
    // Check if doctor session is departed and paid
    if (appointment.sessionId) {
      const { doctorSessionService } = await import('./doctorSessionService');
      const session = await doctorSessionService.getSession(appointment.sessionId);
      
      if (session?.isDeparted && session?.isPaid) {
        throw new Error('Cannot change arrival status - doctor has departed and payment is completed');
      }
    }
  }
  
  const now = Date.now();
  const updateData = {
    isPatientArrived: isArrived,
    patientArrivedAt: isArrived ? now : null,
    updatedAt: now
  };
  
  await update(appointmentRef, updateData);
  return { id, isPatientArrived: isArrived, patientArrivedAt: isArrived ? now : null };
},





  async processPayment(id: string, paymentMethod: string = 'cash', cardDetails?: any, paidInAppointments: boolean = true) {
      const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${id}`);
      const now = Date.now();
      
      const payment: AppointmentPayment = {
        isPaid: true,
        paidAt: now,
        paidBy: paymentMethod,
        refunded: false,
        transactionId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        paidInAppointments: paidInAppointments,
        paidThroughPOS: !paidInAppointments,
        ...(cardDetails && { cardDetails })
      };
      
      const updateData = {
        payment,
        status: 'completed' as AppointmentStatus,
        updatedAt: now
      };
      
      await update(appointmentRef, updateData);
      return { id, payment };
    },

    // New method to process payment through POS
    async processPOSPayment(id: string, posSaleId: string, paymentMethod: string = 'cash', cardDetails?: any) {
      const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${id}`);
      const now = Date.now();
      
      const payment: AppointmentPayment = {
        isPaid: true,
        paidAt: now,
        paidBy: paymentMethod,
        refunded: false,
        transactionId: `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        paidInAppointments: false,
        paidThroughPOS: true,
        posSaleId: posSaleId,
        ...(cardDetails && { cardDetails })
      };
      
      const updateData = {
        payment,
        status: 'completed' as AppointmentStatus,
        posSaleId: posSaleId, // Also store at appointment level for easy reference
        updatedAt: now
      };
      
      await update(appointmentRef, updateData);
      return { id, payment };
    },

    async getAppointmentsBySession(sessionId: string): Promise<Appointment[]> {
      const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
      const sessionQuery = query(appointmentsRef, orderByChild('sessionId'), equalTo(sessionId));
      const snapshot = await get(sessionQuery);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const appointments: Appointment[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        appointments.push({
          id: childSnapshot.key,
          patientId: data.patientId,
          patientName: data.patientName,
          patientContact: data.patientContact,
          doctorId: data.doctorId,
          doctorName: data.doctorName,
          date: data.date,
          dayOfWeek: data.dayOfWeek,
          procedures: data.procedures || [],
          status: data.status,
          notes: data.notes || '',
          totalCharge: parseFloat(data.totalCharge) || 0,
          manualAppointmentAmount: data.manualAppointmentAmount !== undefined && data.manualAppointmentAmount !== null
            ? Number(data.manualAppointmentAmount)
            : undefined,
          isPatientArrived: data.isPatientArrived || false,
          patientArrivedAt: data.patientArrivedAt,
          payment: data.payment,
          sessionId: data.sessionId,
          cashierSessionId: data.cashierSessionId,
          sessionAppointmentNumber: data.sessionAppointmentNumber,
          // Pharmacy review fields
          pharmacyReviewStatus: data.pharmacyReviewStatus,
          pharmacyReviewedAt: data.pharmacyReviewedAt,
          pharmacyReviewedBy: data.pharmacyReviewedBy,
          pharmacyReviewNotes: data.pharmacyReviewNotes,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
        });
      });
      
      return appointments.sort((a, b) => (a.sessionAppointmentNumber || 0) - (b.sessionAppointmentNumber || 0));
    },


async processRefund(id: string) {
  const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${id}`);
  const appointmentSnapshot = await get(appointmentRef);
  
  if (!appointmentSnapshot.exists()) {
    throw new Error('Appointment not found');
  }
  
  const appointmentData = appointmentSnapshot.val();
  const existingPayment = appointmentData.payment;
  
  if (!existingPayment || !existingPayment.isPaid) {
    throw new Error('Cannot refund an unpaid appointment');
  }
  
  // Get current user info
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  // Get current user details from staff service
  const { staffService } = await import('./staffService');
  const staffUser = await staffService.getStaffById(currentUser.uid);
  const currentUserName = staffUser?.displayName || currentUser.email || 'Unknown User';

  // Get doctor session info if available
  let doctorSessionInfo = '';
  if (appointmentData.sessionId) {
    try {
      const { doctorSessionService } = await import('./doctorSessionService');
      const session = await doctorSessionService.getSession(appointmentData.sessionId);
      if (session) {
        doctorSessionInfo = ` | Doctor Session: ${session.doctorName} on ${session.date} (${session.startTime}-${session.endTime})`;
      }
    } catch (error) {
      console.error('Error getting doctor session info:', error);
    }
  }

  const now = Date.now();
  const updatedPayment: AppointmentPayment = {
    ...existingPayment,
    refunded: true,
    refundedAt: now
  };
  
  const updateData = {
    payment: updatedPayment,
    // Optionally reset arrival status when refunded
    isPatientArrived: false,
    patientArrivedAt: null,
    updatedAt: now
  };
  
  await update(appointmentRef, updateData);

  // Create refund expense
  try {
    const { expenseService } = await import('./expenseService');
    
    // Ensure "Refunds" category exists or create it
    let refundCategoryId;
    try {
      const categories = await expenseService.getAllCategories();
      const refundCategory = categories.find(cat => cat.name === 'Refunds');
      
      if (refundCategory?.id) {
        refundCategoryId = refundCategory.id;
      } else {
        // Create Refunds category if it doesn't exist
        const newCategory = await expenseService.createCategory({
          name: 'Refunds',
          description: 'Patient refunds and reimbursements'
        });
        refundCategoryId = newCategory.key;
      }
    } catch (categoryError) {
      console.error('Error with refund category:', categoryError);
      // Use a default category ID or continue without category
      refundCategoryId = null;
    }

    // Create the refund expense
    const refundExpense = {
      amount: appointmentData.totalCharge,
      details: `Refund for Patient: ${appointmentData.patientName} (Contact: ${appointmentData.patientContact}) | Appointment: ${appointmentData.date} ${appointmentData.startTime}-${appointmentData.endTime}${doctorSessionInfo} | Refunded by: ${currentUserName}`,
      date: new Date(),
      categoryId: refundCategoryId,
      categoryName: 'Refunds'
    };

    await expenseService.createExpense(refundExpense);
    console.log('Refund expense created successfully');
    
  } catch (expenseError) {
    console.error('Error creating refund expense:', expenseError);
    // Don't throw error here - refund was processed successfully
    // Just log the error for debugging
  }
  
  return { id, payment: updatedPayment };
},

// Get appointments paid through POS
async getAppointmentsPaidThroughPOS(): Promise<Appointment[]> {
  const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
  const snapshot = await get(appointmentsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const appointments: Appointment[] = [];
  
  snapshot.forEach((childSnapshot) => {
    const data = childSnapshot.val();
    
    // Check if appointment was paid through POS
    if (data.payment?.isPaid && data.payment?.paidThroughPOS) {
      appointments.push({
        id: childSnapshot.key,
        patientId: data.patientId,
        patientName: data.patientName,
        patientContact: data.patientContact,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        date: data.date,
          dayOfWeek: data.dayOfWeek,
          procedures: data.procedures || [],
        status: data.status,
        notes: data.notes || '',
        totalCharge: parseFloat(data.totalCharge) || 0,
        manualAppointmentAmount: data.manualAppointmentAmount !== undefined && data.manualAppointmentAmount !== null
          ? Number(data.manualAppointmentAmount)
          : undefined,
        isPatientArrived: data.isPatientArrived || false,
        patientArrivedAt: data.patientArrivedAt,
        payment: data.payment,
        sessionId: data.sessionId,
        sessionAppointmentNumber: data.sessionAppointmentNumber,
        cashierSessionId: data.cashierSessionId,
        createdBy: data.createdBy, // Add the createdBy field
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    }
  });
  
  // Sort by payment date (newest first)
  return appointments.sort((a, b) => {
    const aPaidAt = a.payment?.paidAt || 0;
    const bPaidAt = b.payment?.paidAt || 0;
    return bPaidAt - aPaidAt;
  });
},

// Get appointments paid in appointments section
async getAppointmentsPaidInAppointments(): Promise<Appointment[]> {
  const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
  const snapshot = await get(appointmentsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const appointments: Appointment[] = [];
  
  snapshot.forEach((childSnapshot) => {
    const data = childSnapshot.val();
    
    // Check if appointment was paid in appointments section
    if (data.payment?.isPaid && data.payment?.paidInAppointments) {
      appointments.push({
        id: childSnapshot.key,
        patientId: data.patientId,
        patientName: data.patientName,
        patientContact: data.patientContact,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        date: data.date,
          dayOfWeek: data.dayOfWeek,
          procedures: data.procedures || [],
        status: data.status,
        notes: data.notes || '',
        totalCharge: parseFloat(data.totalCharge) || 0,
        manualAppointmentAmount: data.manualAppointmentAmount !== undefined && data.manualAppointmentAmount !== null
          ? Number(data.manualAppointmentAmount)
          : undefined,
        isPatientArrived: data.isPatientArrived || false,
        patientArrivedAt: data.patientArrivedAt,
        payment: data.payment,
        sessionId: data.sessionId,
        sessionAppointmentNumber: data.sessionAppointmentNumber,
        cashierSessionId: data.cashierSessionId,
        createdBy: data.createdBy, // Add the createdBy field
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    }
  });
  
  // Sort by payment date (newest first)
  return appointments.sort((a, b) => {
    const aPaidAt = a.payment?.paidAt || 0;
    const bPaidAt = b.payment?.paidAt || 0;
    return bPaidAt - aPaidAt;
  });
},

// Mark appointment as loaded to POS
async markAppointmentLoadedToPOS(appointmentId: string, userId: string, posSaleId?: string): Promise<void> {
  const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${appointmentId}`);
  const now = Date.now();
  
  const updateData: any = {
    loadedToPOS: true,
    loadedToPOSAt: now,
    loadedToPOSBy: userId,
    updatedAt: now
  };
  
  if (posSaleId) {
    updateData.posSaleId = posSaleId;
  }
  
  await update(appointmentRef, updateData);
},

// Reset appointment loading status (if user cancels POS without completing sale)
async resetAppointmentLoadingStatus(appointmentId: string): Promise<void> {
  const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${appointmentId}`);
  
  const updateData = {
    loadedToPOS: false,
    loadedToPOSAt: null,
    loadedToPOSBy: null,
    posSaleId: null,
    updatedAt: Date.now()
  };
  
  await update(appointmentRef, updateData);
},

// Archive paid appointment
async archivePaidAppointment(appointmentId: string): Promise<void> {
  const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${appointmentId}`);
  const now = Date.now();
  
  await update(appointmentRef, {
    isArchived: true,
    archivedAt: now,
    updatedAt: now
  });
},

// Get non-archived appointments (for display in POS)
async getNonArchivedAppointments(): Promise<Appointment[]> {
  const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
  const snapshot = await get(appointmentsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const appointments: Appointment[] = [];
  
  snapshot.forEach((childSnapshot) => {
    const data = childSnapshot.val();
    
    // Only include non-archived appointments
    if (!data.isArchived) {
      appointments.push({
        id: childSnapshot.key,
        patientId: data.patientId,
        patientName: data.patientName,
        patientContact: data.patientContact,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        date: data.date,
          dayOfWeek: data.dayOfWeek,
          procedures: data.procedures || [],
        status: data.status,
        notes: data.notes || '',
        totalCharge: parseFloat(data.totalCharge) || 0,
        manualAppointmentAmount: data.manualAppointmentAmount !== undefined && data.manualAppointmentAmount !== null
          ? Number(data.manualAppointmentAmount)
          : undefined,
        isPatientArrived: data.isPatientArrived || false,
        patientArrivedAt: data.patientArrivedAt,
        payment: data.payment,
        sessionId: data.sessionId,
        sessionAppointmentNumber: data.sessionAppointmentNumber,
        cashierSessionId: data.cashierSessionId,
        loadedToPOS: data.loadedToPOS || false,
        loadedToPOSAt: data.loadedToPOSAt,
        loadedToPOSBy: data.loadedToPOSBy,
        posSaleId: data.posSaleId,
        isArchived: data.isArchived || false,
        archivedAt: data.archivedAt,
        createdBy: data.createdBy, // Add the createdBy field
        // Pharmacy review fields
        pharmacyReviewStatus: data.pharmacyReviewStatus,
        pharmacyReviewedAt: data.pharmacyReviewedAt,
        pharmacyReviewedBy: data.pharmacyReviewedBy,
        pharmacyReviewNotes: data.pharmacyReviewNotes,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    }
  });
  
    return appointments.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return (a.sessionAppointmentNumber || 0) - (b.sessionAppointmentNumber || 0);
    });
},

// Get archived appointments (for viewing history)
async getArchivedAppointments(): Promise<Appointment[]> {
  const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
  const snapshot = await get(appointmentsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const appointments: Appointment[] = [];
  
  snapshot.forEach((childSnapshot) => {
    const data = childSnapshot.val();
    
    // Only include archived appointments
    if (data.isArchived) {
      appointments.push({
        id: childSnapshot.key,
        patientId: data.patientId,
        patientName: data.patientName,
        patientContact: data.patientContact,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        date: data.date,
          dayOfWeek: data.dayOfWeek,
          procedures: data.procedures || [],
        status: data.status,
        notes: data.notes || '',
        totalCharge: parseFloat(data.totalCharge) || 0,
        manualAppointmentAmount: data.manualAppointmentAmount !== undefined && data.manualAppointmentAmount !== null
          ? Number(data.manualAppointmentAmount)
          : undefined,
        isPatientArrived: data.isPatientArrived || false,
        patientArrivedAt: data.patientArrivedAt,
        payment: data.payment,
        sessionId: data.sessionId,
        sessionAppointmentNumber: data.sessionAppointmentNumber,
        cashierSessionId: data.cashierSessionId,
        loadedToPOS: data.loadedToPOS || false,
        loadedToPOSAt: data.loadedToPOSAt,
        loadedToPOSBy: data.loadedToPOSBy,
        posSaleId: data.posSaleId,
        isArchived: data.isArchived || false,
        archivedAt: data.archivedAt,
        createdBy: data.createdBy, // Add the createdBy field
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    }
  });
  
  return appointments.sort((a, b) => {
    const aArchivedAt = a.archivedAt || 0;
    const bArchivedAt = b.archivedAt || 0;
    return bArchivedAt - aArchivedAt; // Newest archived first
  });
},

// Get past unpaid appointments (for importing to today's sessions)
async getPastUnpaidAppointments(): Promise<Appointment[]> {
  const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
  const snapshot = await get(appointmentsRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  const appointments: Appointment[] = [];
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  
  snapshot.forEach((childSnapshot) => {
    const data = childSnapshot.val();
    
    // Only include appointments that are:
    // 1. Not paid (no payment or payment.isPaid is false)
    // 2. Not archived
    // 3. Date is before today
    // 4. Status is not cancelled
    const isUnpaid = !data.payment || !data.payment.isPaid;
    const isNotArchived = !data.isArchived;
    const isPastDate = data.date < today;
    const isNotCancelled = data.status !== 'cancelled';
    
    if (isUnpaid && isNotArchived && isPastDate && isNotCancelled) {
      appointments.push({
        id: childSnapshot.key,
        patientId: data.patientId,
        patientName: data.patientName,
        patientContact: data.patientContact,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        date: data.date,
        dayOfWeek: data.dayOfWeek,
        procedures: data.procedures || [],
        status: data.status,
        notes: data.notes || '',
        totalCharge: parseFloat(data.totalCharge) || 0,
        manualAppointmentAmount: data.manualAppointmentAmount !== undefined && data.manualAppointmentAmount !== null
          ? Number(data.manualAppointmentAmount)
          : undefined,
        isPatientArrived: data.isPatientArrived || false,
        patientArrivedAt: data.patientArrivedAt,
        payment: data.payment,
        sessionId: data.sessionId,
        sessionAppointmentNumber: data.sessionAppointmentNumber,
        cashierSessionId: data.cashierSessionId,
        loadedToPOS: data.loadedToPOS || false,
        loadedToPOSAt: data.loadedToPOSAt,
        loadedToPOSBy: data.loadedToPOSBy,
        posSaleId: data.posSaleId,
        isArchived: data.isArchived || false,
        archivedAt: data.archivedAt,
        createdBy: data.createdBy,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    }
  });
  
  // Sort by date (newest first) and then by doctor name
  return appointments.sort((a, b) => {
    const dateComparison = b.date.localeCompare(a.date);
    if (dateComparison !== 0) return dateComparison;
    return a.doctorName.localeCompare(b.doctorName);
  });
},

// Import appointment to today's session
async importAppointmentToToday(appointmentId: string, todaySessionId: string, userId: string): Promise<Appointment> {
  console.log('importAppointmentToToday called with:', { appointmentId, todaySessionId, userId });
  const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${appointmentId}`);
  const snapshot = await get(appointmentRef);
  
  if (!snapshot.exists()) {
    throw new Error('Appointment not found');
  }
  
  const appointmentData = snapshot.val();
  const today = new Date().toISOString().split('T')[0];
  
  console.log('Appointment data:', appointmentData);
  console.log('Today session ID:', todaySessionId);
  
  // Generate new session appointment number for today's session
  const sessionAppointmentNumber = await this.generateSessionAppointmentNumber(
    appointmentData.doctorId,
    today,
    todaySessionId
  );
  
  console.log('Generated session appointment number:', sessionAppointmentNumber);
  
  // Get current user info for createdBy field
  let createdByInfo = null;
  try {
    const staffUser = await staffService.getStaffById(userId);
    if (staffUser) {
      createdByInfo = {
        uid: userId,
        email: staffUser.email,
        role: staffUser.role,
        displayName: staffUser.displayName
      };
    }
  } catch (error) {
    console.error('Error getting staff user info:', error);
  }
  
  // Update appointment with today's session info
  const updateData = {
    date: today,
    sessionId: todaySessionId,
    sessionAppointmentNumber,
    status: 'scheduled' as AppointmentStatus,
    isPatientArrived: false,
    patientArrivedAt: null,
    payment: null, // Reset payment status
    loadedToPOS: false,
    loadedToPOSAt: null,
    loadedToPOSBy: null,
    posSaleId: null,
    isArchived: false,
    archivedAt: null,
    createdBy: createdByInfo,
    updatedAt: Date.now()
  };
  
  await update(appointmentRef, updateData);
  
  // Return updated appointment
  return {
    ...appointmentData,
    ...updateData,
    id: appointmentId,
    createdAt: appointmentData.createdAt ? new Date(appointmentData.createdAt) : new Date(),
    updatedAt: new Date(updateData.updatedAt)
  };
},

  // Add document to appointment
  async addDocumentToAppointment(appointmentId: string, document: AppointmentDocument): Promise<void> {
    const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${appointmentId}`);
    const snapshot = await get(appointmentRef);
    
    if (!snapshot.exists()) {
      throw new Error('Appointment not found');
    }
    
    const data = snapshot.val();
    const currentDocuments = data.documents || [];
    const updatedDocuments = [...currentDocuments, {
      ...document,
      uploadedAt: document.uploadedAt instanceof Date ? document.uploadedAt.getTime() : document.uploadedAt
    }];
    
    await update(appointmentRef, {
      documents: updatedDocuments,
      updatedAt: Date.now()
    });
  },

  // Remove document from appointment
  async removeDocumentFromAppointment(appointmentId: string, documentId: string): Promise<void> {
    const appointmentRef = ref(database, `${APPOINTMENTS_COLLECTION}/${appointmentId}`);
    const snapshot = await get(appointmentRef);
    
    if (!snapshot.exists()) {
      throw new Error('Appointment not found');
    }
    
    const data = snapshot.val();
    const currentDocuments = data.documents || [];
    const updatedDocuments = currentDocuments.filter((doc: any) => doc.id !== documentId);
    
    await update(appointmentRef, {
      documents: updatedDocuments,
      updatedAt: Date.now()
    });
  }
};