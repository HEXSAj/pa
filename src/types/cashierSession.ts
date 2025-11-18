// export interface CashierSession {
//     id?: string;
//     sessionNumber: string;
//     userId: string;
//     userName: string;
//     startDate: number; // timestamp
//     endDate?: number; // timestamp
//     startingAmount: number;
//     actualEndingAmount?: number;
//     expectedEndingAmount?: number;
//     variance?: number;
//     varianceReference?: string;
//     status: 'active' | 'ended';
//     totalSalesAmount: number;
//     salesCount: number;
//     appointmentsCount: number;
//     notes?: string;
//     createdAt: number;
//     updatedAt: number;
//   }
  
//   export interface CashierSessionSale {
//     id: string;
//     sessionId: string;
//     saleId: string;
//     saleNumber: string;
//     amount: number;
//     paymentMethod: string;
//     customerName?: string;
//     type: 'sale' | 'appointment' | 'service';
//     createdAt: number;
//   }

export interface CashierSession {
  id?: string;
  sessionNumber: string;
  userId: string;
  userName: string;
  startDate: number; // timestamp
  endDate?: number; // timestamp
  startingAmount?: number; // Legacy field for backwards compatibility
  startingAmounts?: {
    lkr: number;
  };
  actualEndingAmount?: number; // Legacy field
  endingAmounts?: {
    lkr: number;
  };
  expectedEndingAmount?: number;
  variance?: number;
  varianceReference?: string;
  status: 'active' | 'ended';
  isActive: boolean; // For backwards compatibility
  
  // POS Sales tracking
  totalSalesAmount: number;
  salesCount: number;
  salesIds: string[];
  
  // Expense tracking
  totalExpenses: number;
  expenseIds: string[];
  
  // NEW: Appointment tracking
  appointmentsCount: number;
  appointmentIds?: string[];
  appointmentCount?: number; // For backwards compatibility
  totalDoctorFees?: number;
  
  // NEW: Payment method totals for appointments
  appointmentCashPayments: number;
  appointmentCardPayments: number;
  totalPaidAppointments: number;
  
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CashierSessionSale {
  id: string;
  sessionId: string;
  saleId: string;
  saleNumber: string;
  amount: number;
  paymentMethod: string;
  customerName?: string;
  type: 'sale' | 'appointment' | 'service';
  createdAt: number;
}

// Updated interface for session start verification - only LKR
export interface CashAmountDiscrepancy {
  userId: string;
  userName: string;
  sessionId: string;
  expectedAmounts: {
    lkr: number;
  };
  actualAmounts: {
    lkr: number;
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
  };
  actualAmounts: {
    lkr: number;
  };
  reason: string;
  createdAt: number;
}