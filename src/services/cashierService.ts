// Modified src/services/cashierService.ts


import { database } from '@/lib/firebase';
import { 
  ref, 
  set, 
  update, 
  get, 
  push, 
  query, 
  orderByChild, 
  equalTo,
  child
} from 'firebase/database';
import { CashierSession, CashAmountDiscrepancy, EndAmountDiscrepancy } from '@/types/cashierSession';

const COLLECTION = 'cashierSessions';
const SALES_COLLECTION = 'sales';
const APPOINTMENTS_COLLECTION = 'appointments';

// Updated migration function - handle legacy data and new appointment fields
const migrateSessionFormat = (sessionData: any, id: string): CashierSession => {
  // Handle legacy startingAmount and endingAmount fields
  let startingAmounts = sessionData.startingAmounts;
  if (!startingAmounts && sessionData.startingAmount !== undefined) {
    startingAmounts = {
      lkr: sessionData.startingAmount
    };
  } else if (!startingAmounts) {
    startingAmounts = {
      lkr: 0
    };
  } else {
    // Convert from old multi-currency format to LKR only
    startingAmounts = {
      lkr: startingAmounts.lkr || 0
    };
  }
  
  let endingAmounts = sessionData.endingAmounts;
  if (!endingAmounts && sessionData.endingAmount !== undefined) {
    endingAmounts = {
      lkr: sessionData.endingAmount
    };
  } else if (endingAmounts) {
    // Convert from old multi-currency format to LKR only
    endingAmounts = {
      lkr: endingAmounts.lkr || 0
    };
  }
  
  return {
    id,
    sessionNumber: sessionData.sessionNumber || `SESSION-${Date.now()}`,
    userId: sessionData.userId,
    userName: sessionData.userName,
    startDate: sessionData.startDate,
    endDate: sessionData.endDate,
    startingAmount: sessionData.startingAmount, // Legacy
    startingAmounts: startingAmounts,
    actualEndingAmount: sessionData.actualEndingAmount, // Legacy
    endingAmounts: endingAmounts,
    expectedEndingAmount: sessionData.expectedEndingAmount,
    variance: sessionData.variance,
    varianceReference: sessionData.varianceReference,
    status: sessionData.isActive ? 'active' : 'ended',
    isActive: sessionData.isActive || false,
    
    // POS Sales
    totalSalesAmount: sessionData.totalSalesAmount || 0,
    salesCount: sessionData.salesCount || 0,
    salesIds: sessionData.salesIds || [],
    
    // Expenses
    totalExpenses: sessionData.totalExpenses || 0,
    expenseIds: sessionData.expenseIds || [],
    
    // Appointments - handle both old and new fields
    appointmentsCount: sessionData.appointmentsCount || sessionData.appointmentCount || 0,
    appointmentIds: sessionData.appointmentIds || [],
    appointmentCount: sessionData.appointmentCount || 0, // Legacy
    totalDoctorFees: sessionData.totalDoctorFees || 0,
    
    // NEW: Payment method totals
    appointmentCashPayments: sessionData.appointmentCashPayments || 0,
    appointmentCardPayments: sessionData.appointmentCardPayments || 0,
    totalPaidAppointments: sessionData.totalPaidAppointments || 0,
    
    notes: sessionData.notes,
    createdAt: sessionData.createdAt || Date.now(),
    updatedAt: sessionData.updatedAt || Date.now()
  };
};

export const cashierService = {
  // Start a new session
  async startSession(sessionData: {
    userId: string;
    userName: string;
    startDate: Date;
    startingAmounts?: {
      lkr: number;
    };
  }): Promise<string> {
    try {
      // Check for existing active session
      const existingSession = await this.getActiveSession(sessionData.userId);
      if (existingSession) {
        throw new Error('User already has an active session');
      }
      
      const now = Date.now();
      
      // Default starting amounts to zero if not provided
      const startingAmounts = sessionData.startingAmounts || {
        lkr: 0
      };
      
      // Generate session number
      const sessionNumber = `SESSION-${now}`;
      
      // Prepare session data
      const session = {
        sessionNumber,
        userId: sessionData.userId,
        userName: sessionData.userName,
        startDate: sessionData.startDate.getTime(),
        startingAmounts: startingAmounts,
        isActive: true,
        status: 'active',
        
        // POS Sales
        salesIds: [],
        totalSalesAmount: 0,
        salesCount: 0,
        
        // Expenses
        expenseIds: [],
        totalExpenses: 0,
        
        // Appointments
        appointmentIds: [],
        appointmentsCount: 0,
        appointmentCount: 0, // Legacy
        totalDoctorFees: 0,
        
        // NEW: Payment totals
        appointmentCashPayments: 0,
        appointmentCardPayments: 0,
        totalPaidAppointments: 0,
        
        createdAt: now,
        updatedAt: now
      };
      
      // Create the session in the database
      const sessionsRef = ref(database, COLLECTION);
      const newSessionRef = push(sessionsRef);
      await set(newSessionRef, session);
      
      console.log(`Started new cashier session: ${newSessionRef.key}`);
      return newSessionRef.key as string;
    } catch (error) {
      console.error('Error starting cashier session:', error);
      throw error;
    }
  },

  // Get active session for a user
  async getActiveSession(userId: string): Promise<CashierSession | null> {
    try {
      const userSessionsQuery = query(
        ref(database, COLLECTION),
        orderByChild('userId'),
        equalTo(userId)
      );
      
      const snapshot = await get(userSessionsQuery);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      const sessionsData = snapshot.val();
      let activeSession: CashierSession | null = null;
      
      for (const id in sessionsData) {
        const sessionData = sessionsData[id];
        if (sessionData.isActive) {
          activeSession = migrateSessionFormat(sessionData, id);
          break;
        }
      }
      
      return activeSession;
    } catch (error) {
      console.error('Error getting active cashier session:', error);
      return null;
    }
  },

  // Get all active sessions across all users
  async getAllActiveSessions(): Promise<CashierSession[]> {
    try {
      const sessionsRef = ref(database, COLLECTION);
      const snapshot = await get(sessionsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const sessionsData = snapshot.val();
      const activeSessions: CashierSession[] = [];
      
      for (const id in sessionsData) {
        const sessionData = sessionsData[id];
        if (sessionData.isActive) {
          activeSessions.push(migrateSessionFormat(sessionData, id));
        }
      }
      
      return activeSessions;
    } catch (error) {
      console.error('Error getting all active cashier sessions:', error);
      return [];
    }
  },

  // Check if any user has an active cashier session
  async hasAnyActiveSession(): Promise<boolean> {
    try {
      const activeSessions = await this.getAllActiveSessions();
      return activeSessions.length > 0;
    } catch (error) {
      console.error('Error checking for any active cashier session:', error);
      return false;
    }
  },

  // Get session by ID
  async getSessionById(sessionId: string): Promise<CashierSession | null> {
    try {
      const sessionRef = ref(database, `${COLLECTION}/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      const sessionData = snapshot.val();
      return migrateSessionFormat(sessionData, sessionId);
    } catch (error) {
      console.error('Error getting session by ID:', error);
      return null;
    }
  },

  // Get latest session for a user
  async getLatestSession(userId: string): Promise<CashierSession | null> {
    try {
      const userSessionsQuery = query(
        ref(database, COLLECTION),
        orderByChild('userId'),
        equalTo(userId)
      );
      
      const snapshot = await get(userSessionsQuery);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      const sessionsData = snapshot.val();
      let latestSession: CashierSession | null = null;
      let latestTimestamp = 0;
      
      for (const id in sessionsData) {
        const sessionData = sessionsData[id];
        if (sessionData.startDate > latestTimestamp) {
          latestTimestamp = sessionData.startDate;
          latestSession = migrateSessionFormat(sessionData, id);
        }
      }
      
      return latestSession;
    } catch (error) {
      console.error('Error getting latest session:', error);
      return null;
    }
  },

  // Get appointments for a specific session
  async getSessionAppointments(sessionId: string) {
    try {
      console.log(`Fetching appointments for cashier session: ${sessionId}`);
      
      const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
      const sessionQuery = query(
        appointmentsRef, 
        orderByChild('cashierSessionId'), 
        equalTo(sessionId)
      );
      const snapshot = await get(sessionQuery);
      
      if (!snapshot.exists()) {
        console.log(`No appointments found for session ${sessionId}`);
        return [];
      }
      
      const appointments: any[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        appointments.push({
          id: childSnapshot.key,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
        });
      });
      
      console.log(`Found ${appointments.length} appointments for session ${sessionId}`);
      return appointments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error fetching session appointments:', error);
      return [];
    }
  },

  // NEW: Get appointment payment totals for a session
  async getSessionAppointmentPayments(sessionId: string): Promise<{
    cashPayments: number;
    cardPayments: number;
    totalAppointments: number;
    totalDoctorFees: number;
  }> {
    try {
      const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
      const sessionQuery = query(
        appointmentsRef, 
        orderByChild('cashierSessionId'), 
        equalTo(sessionId)
      );
      const snapshot = await get(sessionQuery);
      
      if (!snapshot.exists()) {
        return { cashPayments: 0, cardPayments: 0, totalAppointments: 0, totalDoctorFees: 0 };
      }
      
      let cashPayments = 0;
      let cardPayments = 0;
      let totalAppointments = 0;
      let totalDoctorFees = 0;
      
      snapshot.forEach((childSnapshot) => {
        const appointment = childSnapshot.val();
        
        // Only count paid appointments
        if (appointment.payment?.isPaid) {
          totalAppointments++;
          // Use manualAppointmentAmount instead of totalCharge (which no longer exists)
          const appointmentAmount = appointment.manualAppointmentAmount || 0;
          totalDoctorFees += appointmentAmount;
          
          // Check payment method
          if (appointment.payment.paidBy === 'cash') {
            cashPayments += appointmentAmount;
          } else if (appointment.payment.paidBy === 'card') {
            cardPayments += appointmentAmount;
          }
        }
      });
      
      console.log(`Session ${sessionId} payment totals:`, {
        cashPayments,
        cardPayments,
        totalAppointments,
        totalDoctorFees
      });
      
      return { cashPayments, cardPayments, totalAppointments, totalDoctorFees };
    } catch (error) {
      console.error('Error getting session appointment payments:', error);
      return { cashPayments: 0, cardPayments: 0, totalAppointments: 0, totalDoctorFees: 0 };
    }
  },

  // NEW: Update session with appointment count and payment totals
  async updateSessionAppointmentCount(sessionId: string): Promise<boolean> {
    try {
      console.log(`Updating appointment count and payment totals for session: ${sessionId}`);
      
      const sessionRef = ref(database, `${COLLECTION}/${sessionId}`);
      const sessionSnapshot = await get(sessionRef);
      
      if (!sessionSnapshot.exists()) {
        console.log('Session not found for appointment count update');
        return false;
      }
      
      // Get appointment data
      const appointments = await this.getSessionAppointments(sessionId);
      const paymentData = await this.getSessionAppointmentPayments(sessionId);
      
      const appointmentIds = appointments.map(apt => apt.id);
      const appointmentCount = appointments.length;
      // Use manualAppointmentAmount instead of totalCharge (which no longer exists)
      const totalDoctorFees = appointments.reduce((total, apt) => total + (apt.manualAppointmentAmount || 0), 0);
      
      // Update the session with all appointment data
      const updateData = {
        appointmentIds,
        appointmentsCount: appointmentCount,
        appointmentCount, // Legacy field
        totalDoctorFees,
        
        // NEW: Payment method totals
        appointmentCashPayments: paymentData.cashPayments,
        appointmentCardPayments: paymentData.cardPayments,
        totalPaidAppointments: paymentData.totalAppointments,
        
        updatedAt: Date.now()
      };
      
      await update(sessionRef, updateData);
      
      console.log(`Updated session ${sessionId} with appointment data:`, updateData);
      return true;
    } catch (error) {
      console.error('Error updating session appointment count:', error);
      return false;
    }
  },

  // Add appointment to session
  async addAppointmentToSession(sessionId: string, appointmentId: string, doctorFee: number = 0): Promise<boolean> {
    try {
      const sessionRef = ref(database, `${COLLECTION}/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (!snapshot.exists()) {
        throw new Error('Session not found');
      }
      
      const sessionData = snapshot.val();
      
      // Validate the session is active
      if (!sessionData.isActive) {
        throw new Error('Cannot add appointment to inactive session');
      }
      
      // Get existing appointment IDs array or create a new one
      const currentAppointmentIds = sessionData.appointmentIds || [];
      const newAppointmentIds = [...currentAppointmentIds, appointmentId];
      
      // Calculate the new total doctor fees
      const currentTotalFees = sessionData.totalDoctorFees || 0;
      const newTotalFees = currentTotalFees + doctorFee;
      
      // Update the session with the new appointment information
      await update(sessionRef, {
        appointmentIds: newAppointmentIds,
        appointmentsCount: newAppointmentIds.length,
        appointmentCount: newAppointmentIds.length, // Legacy
        totalDoctorFees: newTotalFees,
        updatedAt: Date.now()
      });
      
      console.log(`Added appointment ${appointmentId} to session ${sessionId}`);
      
      // Update payment totals
      await this.updateSessionAppointmentCount(sessionId);
      
      return true;
    } catch (error) {
      console.error('Error adding appointment to cashier session:', error);
      throw error;
    }
  },

  // Remove appointment from session
  async removeAppointmentFromSession(sessionId: string, appointmentId: string, doctorFee: number = 0): Promise<boolean> {
    try {
      const sessionRef = ref(database, `${COLLECTION}/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (!snapshot.exists()) {
        throw new Error('Session not found');
      }
      
      const sessionData = snapshot.val();
      
      // Get existing appointment IDs array
      const currentAppointmentIds = sessionData.appointmentIds || [];
      const newAppointmentIds = currentAppointmentIds.filter((id: string) => id !== appointmentId);
      
      // Calculate the new total doctor fees
      const currentTotalFees = sessionData.totalDoctorFees || 0;
      const newTotalFees = Math.max(0, currentTotalFees - doctorFee);
      
      // Update the session
      await update(sessionRef, {
        appointmentIds: newAppointmentIds,
        appointmentsCount: newAppointmentIds.length,
        appointmentCount: newAppointmentIds.length, // Legacy
        totalDoctorFees: newTotalFees,
        updatedAt: Date.now()
      });
      
      console.log(`Removed appointment ${appointmentId} from session ${sessionId}`);
      
      // Update payment totals
      await this.updateSessionAppointmentCount(sessionId);
      
      return true;
    } catch (error) {
      console.error('Error removing appointment from cashier session:', error);
      throw error;
    }
  },

  // Get session appointment count
  async getSessionAppointmentCount(sessionId: string): Promise<number> {
    try {
      const appointments = await this.getSessionAppointments(sessionId);
      return appointments.length;
    } catch (error) {
      console.error('Error getting session appointment count:', error);
      return 0;
    }
  },

  // End session
  async endSession(sessionId: string, endingAmounts?: {
    lkr: number;
  }): Promise<boolean> {
    try {
      const now = Date.now();
      const sessionRef = ref(database, `${COLLECTION}/${sessionId}`);
      
      // Get the current session data to validate it exists and is active
      const snapshot = await get(sessionRef);
      if (!snapshot.exists()) {
        throw new Error('Session not found');
      }
      
      const sessionData = snapshot.val();
      if (!sessionData.isActive) {
        throw new Error('Cannot end an inactive session');
      }
      
      // Update appointment counts and payment totals before ending
      await this.updateSessionAppointmentCount(sessionId);
      
      // Create the update data without undefined values
      const updateData: any = {
        endDate: now,
        isActive: false,
        status: 'ended',
        updatedAt: now
      };
      
      // Only include endingAmounts if it's defined and not null
      if (endingAmounts !== undefined && endingAmounts !== null) {
        updateData.endingAmounts = endingAmounts;
      }
      
      await update(sessionRef, updateData);
      
      console.log(`Ended cashier session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error ending cashier session:', error);
      throw error;
    }
  },

  // Additional methods for sales and expenses (keeping existing functionality)
  async getSessionSales(sessionId: string) {
    try {
      const sessionRef = ref(database, `${COLLECTION}/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const sessionData = snapshot.val();
      const salesIds = sessionData.salesIds || [];
      
      if (salesIds.length === 0) {
        return [];
      }
      
      const sales = [];
      for (const saleId of salesIds) {
        const saleRef = ref(database, `${SALES_COLLECTION}/${saleId}`);
        const saleSnapshot = await get(saleRef);
        
        if (saleSnapshot.exists()) {
          sales.push({
            id: saleId,
            ...saleSnapshot.val()
          });
        }
      }
      
      return sales;
    } catch (error) {
      console.error('Error getting session sales:', error);
      return [];
    }
  },

  async getSessionExpenses(sessionId: string) {
    try {
      const sessionRef = ref(database, `${COLLECTION}/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const sessionData = snapshot.val();
      const expenseIds = sessionData.expenseIds || [];
      
      if (expenseIds.length === 0) {
        return [];
      }
      
      const expenses = [];
      for (const expenseId of expenseIds) {
        const expenseRef = ref(database, `expenses/${expenseId}`);
        const expenseSnapshot = await get(expenseRef);
        
        if (expenseSnapshot.exists()) {
          expenses.push({
            id: expenseId,
            ...expenseSnapshot.val()
          });
        }
      }
      
      return expenses;
    } catch (error) {
      console.error('Error getting session expenses:', error);
      return [];
    }
  },

  // Record discrepancies
  async recordCashDiscrepancy(discrepancy: CashAmountDiscrepancy): Promise<string> {
    try {
      const discrepancyData = {
        ...discrepancy
      };
      
      const discrepanciesRef = ref(database, 'cashDiscrepancies');
      const newDiscrepancyRef = push(discrepanciesRef);
      await set(newDiscrepancyRef, discrepancyData);
      
      return newDiscrepancyRef.key as string;
    } catch (error) {
      console.error('Error recording cash discrepancy:', error);
      throw error;
    }
  },

  async addSaleToSession(sessionId: string, saleId: string, saleAmount: number): Promise<boolean> {
    try {
      const sessionRef = ref(database, `${COLLECTION}/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (!snapshot.exists()) {
        throw new Error('Session not found');
      }
      
      const sessionData = snapshot.val();
      
      // Validate the session is active
      if (!sessionData.isActive) {
        throw new Error('Cannot add sale to inactive session');
      }
      
      // Get existing sales IDs array or create a new one
      const currentSalesIds = sessionData.salesIds || [];
      const newSalesIds = [...currentSalesIds, saleId];
      
      // Calculate the new total sales amount
      const currentTotal = sessionData.totalSalesAmount || 0;
      const newTotal = currentTotal + saleAmount;
      
      // Update the session with the new sale information
      await update(sessionRef, {
        salesIds: newSalesIds,
        totalSalesAmount: newTotal,
        updatedAt: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error adding sale to cashier session:', error);
      throw error;
    }
  },

  async addExpenseToSession(sessionId: string, expenseId: string, expenseAmount: number): Promise<boolean> {
    try {
      const sessionRef = ref(database, `${COLLECTION}/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (!snapshot.exists()) {
        throw new Error('Session not found');
      }
      
      const sessionData = snapshot.val();
      
      // Validate the session is active
      if (!sessionData.isActive) {
        throw new Error('Cannot add expense to inactive session');
      }
      
      // Get existing expense IDs array or create a new one
      const currentExpenseIds = sessionData.expenseIds || [];
      const newExpenseIds = [...currentExpenseIds, expenseId];
      
      // Calculate the new total expenses amount
      const currentTotal = sessionData.totalExpenses || 0;
      const newTotal = currentTotal + expenseAmount;
      
      // Update the session with the new expense information
      await update(sessionRef, {
        expenseIds: newExpenseIds,
        totalExpenses: newTotal,
        updatedAt: Date.now()
      });
      
      console.log(`Added expense ${expenseId} (Rs ${expenseAmount}) to session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error adding expense to cashier session:', error);
      throw error;
    }
  },

  async recordEndAmountDiscrepancy(discrepancy: EndAmountDiscrepancy): Promise<string> {
    try {
      const discrepancyData = {
        ...discrepancy
      };
      
      const discrepanciesRef = ref(database, 'endAmountDiscrepancies');
      const newDiscrepancyRef = push(discrepanciesRef);
      await set(newDiscrepancyRef, discrepancyData);
      
      return newDiscrepancyRef.key as string;
    } catch (error) {
      console.error('Error recording end amount discrepancy:', error);
      throw error;
    }
  }
};