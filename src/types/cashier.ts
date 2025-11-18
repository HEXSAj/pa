export interface CashierSession {
    id?: string;
    userId: string;
    userName: string;
    startDate: Date;
    endDate?: Date;
    startingAmounts?: {
      lkr: number;
      usd: number;
      euro: number;
    };
    endingAmounts?: {
      lkr: number;
      usd: number;
      euro: number;
    };
    isActive: boolean;
    salesIds: string[];
    totalSalesAmount: number;
    expenseIds: string[];
    totalExpenses: number;
    // Appointment tracking fields
    appointmentIds?: string[];
    appointmentCount?: number;
    totalDoctorFees?: number;
    // Payment breakdown for appointments
    appointmentCashPayments?: number;
    appointmentCardPayments?: number;
    createdAt?: number;
    updatedAt?: number;
  }
  
  // New interface for session start verification
  export interface CashAmountDiscrepancy {
    userId: string;
    userName: string;
    sessionId: string;
    expectedAmounts: {
      lkr: number;
      usd: number;
      euro: number;
    };
    actualAmounts: {
      lkr: number;
      usd: number;
      euro: number;
    };
    reason: string;
    createdAt: number;
  }
  
  export interface EndAmountDiscrepancy {
    userId: string;
    userName: string;
    sessionId: string;
    expectedAmounts: {
      lkr: number;
      usd: number;
      euro: number;
    };
    actualAmounts: {
      lkr: number;
      usd: number;
      euro: number;
    };
    reason: string;
    createdAt: number;
  }