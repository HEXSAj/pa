// src/services/doctorSessionService.ts

import { database } from '@/lib/firebase';
import { ref, set, update, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { DoctorSession } from '@/types/appointment';
import { expenseService } from './expenseService';

const DOCTOR_SESSIONS_COLLECTION = 'doctor-sessions';

export const doctorSessionService = {
  async createOrUpdateSession(
    doctorId: string,
    doctorName: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<DoctorSession> {
    console.log('createOrUpdateSession called with:', { doctorId, doctorName, date, startTime, endTime });
    const sessionId = `${doctorId}_${date}_${startTime}_${endTime}`;
    console.log('Generated session ID:', sessionId);
    const sessionRef = ref(database, `${DOCTOR_SESSIONS_COLLECTION}/${sessionId}`);
    
    const snapshot = await get(sessionRef);
    const now = Date.now();
    
    if (snapshot.exists()) {
      console.log('Session already exists, returning existing session');
      return { id: sessionId, ...snapshot.val() };
    } else {
      console.log('Session does not exist, creating new session');
      const newSession: DoctorSession = {
        id: sessionId,
        doctorId,
        doctorName,
        date,
        startTime,
        endTime,
        isArrived: false,
        isDeparted: false,
        totalDoctorFees: 0,
        totalPatients: 0,
        arrivedPatients: 0,
        isPaid: false,
        createdAt: now,
        updatedAt: now
      };
      
      await set(sessionRef, newSession);
      console.log('New session created:', newSession);
      return newSession;
    }
  },

  async markDoctorArrival(sessionId: string): Promise<void> {
    const sessionRef = ref(database, `${DOCTOR_SESSIONS_COLLECTION}/${sessionId}`);
    const now = Date.now();
    
    await update(sessionRef, {
      isArrived: true,
      arrivedAt: now,
      updatedAt: now
    });
  },



async createPostDepartureExpense(sessionId: string): Promise<{ expenseId: string; amount: number }> {
  const sessionRef = ref(database, `${DOCTOR_SESSIONS_COLLECTION}/${sessionId}`);
  const snapshot = await get(sessionRef);
  
  if (!snapshot.exists()) {
    throw new Error('Session not found');
  }
  
  const session: DoctorSession = snapshot.val();
  
  if (!session.isDeparted) {
    throw new Error('Doctor has not departed yet');
  }
  
  // Get current post-departure info to check unpaid fees
  const postDepartureInfo = await this.getSessionWithPostDepartureInfo(sessionId);
  
  if (postDepartureInfo.unpaidPostDepartureFees <= 0) {
    throw new Error('No unpaid doctor fees available to create expense');
  }
  
  const expenseAmount = postDepartureInfo.unpaidPostDepartureFees;
  
  try {
    // Ensure Doctor Fees category exists
    const { expenseService } = await import('./expenseService');
    const categoryId = await expenseService.ensureDoctorFeesCategory();
    
    const now = Date.now();
    
    // Create expense for the unpaid amount only
    const expenseData = {
      date: new Date(),
      amount: expenseAmount,
      details: `Post-departure doctor fee - ${session.doctorName} | ${session.date} ${session.startTime}-${session.endTime} | ${postDepartureInfo.postDeparturePatients.length} patients | Unpaid amount: Rs. ${expenseAmount.toFixed(2)}`,
      categoryId: categoryId,
      categoryName: 'Doctor Fees',
      paidAt: now
    };
    
    const expenseRef = await expenseService.createExpense(expenseData);
    const expenseId = expenseRef.key!;
    
    // Update session to track the additional expense
    const updates: any = {
      updatedAt: now
    };
    
    // Track additional expenses in session
    if (!session.additionalExpenseIds) {
      updates.additionalExpenseIds = [expenseId];
    } else {
      updates.additionalExpenseIds = [...(session.additionalExpenseIds || []), expenseId];
    }
    
    // Update total additional fees paid
    updates.totalAdditionalDoctorFees = (session.totalAdditionalDoctorFees || 0) + expenseAmount;
    
    await update(sessionRef, updates);
    
    return { expenseId, amount: expenseAmount };
  } catch (error) {
    console.error('Error creating post-departure expense:', error);
    throw new Error('Failed to create expense for post-departure patients');
  }
},




async getSessionWithPostDepartureInfo(sessionId: string): Promise<{
  session: DoctorSession;
  postDeparturePatients: any[];
  postDepartureFees: number;
  unpaidPostDepartureFees: number;
  canCreateExpense: boolean;
}> {
  const session = await this.getSession(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (!session.isDeparted) {
    return {
      session,
      postDeparturePatients: [],
      postDepartureFees: 0,
      unpaidPostDepartureFees: 0,
      canCreateExpense: false
    };
  }
  
  // Helper function to safely get timestamp
  const getTimestamp = (dateValue: Date | any): number => {
    if (!dateValue) return 0;
    
    // If it's a Firebase Timestamp
    if (dateValue.toMillis && typeof dateValue.toMillis === 'function') {
      return dateValue.toMillis();
    }
    
    // If it's a Date object
    if (dateValue instanceof Date) {
      return dateValue.getTime();
    }
    
    // If it's already a number (timestamp)
    if (typeof dateValue === 'number') {
      return dateValue;
    }
    
    // Try to create a Date from it
    try {
      return new Date(dateValue).getTime();
    } catch {
      return 0;
    }
  };
  
  // Get all appointments for this session
  const { appointmentService } = await import('./appointmentService');
  
  try {
    // Try to get appointments by sessionId first
    let appointments = await appointmentService.getAppointmentsBySession(sessionId);
    
    // If no appointments found by sessionId, try by session details
    if (appointments.length === 0) {
      const allAppointments = await appointmentService.getAllAppointments();
      appointments = allAppointments.filter(apt => 
        apt.doctorId === session.doctorId &&
        apt.date === session.date &&
        apt.startTime === session.startTime &&
        apt.endTime === session.endTime
      );
    }
    
    // Calculate fees only for patients added AFTER doctor departure
    const postDeparturePatients = appointments.filter(appointment => {
      // Check if patient was added after doctor departure
      const appointmentCreatedAt = getTimestamp(appointment.createdAt);
      const doctorDepartedAt = session.departedAt || 0;
      
      return appointmentCreatedAt > doctorDepartedAt && 
             appointment.payment?.isPaid && 
             appointment.isPatientArrived &&
             !appointment.payment?.refunded;
    });
    
    // Calculate total post-departure fees
    const postDepartureFees = postDeparturePatients.reduce((total, appointment) => {
      return total + (appointment.manualAppointmentAmount || 0);
    }, 0);
    
    // Calculate unpaid fees (total post-departure fees minus already paid expenses)
    const totalPaidExpenses = session.totalAdditionalDoctorFees || 0;
    const unpaidPostDepartureFees = Math.max(0, postDepartureFees - totalPaidExpenses);
    
    return {
      session,
      postDeparturePatients,
      postDepartureFees,
      unpaidPostDepartureFees,
      canCreateExpense: unpaidPostDepartureFees > 0
    };
  } catch (error) {
    console.error('Error getting session appointments:', error);
    return {
      session,
      postDeparturePatients: [],
      postDepartureFees: 0,
      unpaidPostDepartureFees: 0,
      canCreateExpense: false
    };
  }
},



  async markDoctorDeparture(sessionId: string): Promise<{ session: DoctorSession; expenseId?: string }> {
  const sessionRef = ref(database, `${DOCTOR_SESSIONS_COLLECTION}/${sessionId}`);
  const snapshot = await get(sessionRef);
  
  if (!snapshot.exists()) {
      throw new Error('Session not found');
  }
  
  const session: DoctorSession = snapshot.val();
  const now = Date.now();
  
  // Calculate total doctor fees from paid and arrived patients
  const doctorFees = session.totalDoctorFees;
  
  if (doctorFees > 0 && !session.isPaid) {
      try {
      // Ensure Doctor Fees category exists
      const categoryId = await expenseService.ensureDoctorFeesCategory();
      
      // Create expense for doctor fee with current time as paidAt
      const expenseData = {
          date: new Date(session.date),
          amount: doctorFees,
          details: `Doctor fee - ${session.doctorName} | ${session.date} ${session.startTime}-${session.endTime} | ${session.arrivedPatients} patients`,
          categoryId: categoryId,
          categoryName: 'Doctor Fees',
          paidAt: now // Add the current time when the expense is being created
      };
      
      const expenseRef = await expenseService.createExpense(expenseData);
      const expenseId = expenseRef.key;
      
      // Update session with departure and payment info
      await update(sessionRef, {
         isDeparted: true,
         departedAt: now,
         isPaid: true,
         paidAt: now,
         expenseId: expenseId,
         updatedAt: now
      });
      
      return { 
         session: { ...session, isDeparted: true, departedAt: now, isPaid: true, paidAt: now }, 
         expenseId 
      };
      } catch (error) {
      console.error('Error creating expense:', error);
      throw new Error('Failed to create expense for doctor fee');
      }
  } else {
      // Just mark as departed without creating expense
      await update(sessionRef, {
      isDeparted: true,
      departedAt: now,
      updatedAt: now
      });
      
      return { session: { ...session, isDeparted: true, departedAt: now } };
  }
},




  async updateSessionStats(sessionId: string, appointments: any[]): Promise<void> {
    const sessionRef = ref(database, `${DOCTOR_SESSIONS_COLLECTION}/${sessionId}`);
    
    const totalPatients = appointments.length;
    const arrivedPatients = appointments.filter(a => a.isPatientArrived).length;
    
    // Calculate total doctor fees from paid and arrived patients
    const totalDoctorFees = appointments.reduce((total, appointment) => {
      if (appointment.payment?.isPaid && appointment.isPatientArrived && !appointment.payment?.refunded) {
        return total + (appointment.manualAppointmentAmount || 0);
      }
      return total;
    }, 0);
    
    await update(sessionRef, {
      totalPatients,
      arrivedPatients,
      totalDoctorFees,
      updatedAt: Date.now()
    });
  },

  async getSession(sessionId: string): Promise<DoctorSession | null> {
    const sessionRef = ref(database, `${DOCTOR_SESSIONS_COLLECTION}/${sessionId}`);
    const snapshot = await get(sessionRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return { id: sessionId, ...snapshot.val() };
  },

  async getSessionsByDate(date: string): Promise<DoctorSession[]> {
    console.log('getSessionsByDate called with date:', date);
    const sessionsRef = ref(database, DOCTOR_SESSIONS_COLLECTION);
    const snapshot = await get(sessionsRef);
    
    if (!snapshot.exists()) {
      console.log('No sessions found in database');
      return [];
    }
    
    const sessions: DoctorSession[] = [];
    console.log('All sessions in database:');
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      console.log('Session:', {
        key: childSnapshot.key,
        date: data.date,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        startTime: data.startTime,
        endTime: data.endTime
      });
      
      // Check if this session is for the requested date
      if (data.date === date) {
        console.log('Session matches date, adding to results');
        sessions.push({
          id: childSnapshot.key,
          ...data
        });
      }
    });
    
    console.log(`Found ${sessions.length} sessions for date ${date}`);
    return sessions;
  }
};