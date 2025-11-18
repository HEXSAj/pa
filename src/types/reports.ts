// src/types/reports.ts
export interface ReportsFilter {
  startDate: Date;
  endDate: Date;
  patientType?: 'local' | 'all'; // Only local patients supported
  paymentMethod?: 'cash' | 'card' | 'all';
  serviceType?: 'appointments' | 'procedures' | 'lab' | 'pharmacy' | 'all';
}

export interface ServiceTypeIncome {
  appointments: {
    lkr: number;
    count: number;
  };
  procedures: {
    lkr: number;
    count: number;
  };
  lab: {
    lkr: number;
    count: number;
  };
  pharmacy: {
    lkr: number;
    count: number;
  };
}

export interface PaymentMethodBreakdown {
  cash: {
    lkr: number;
    count: number;
  };
  card: {
    lkr: number;
    count: number;
  };
}

export interface PatientTypeBreakdown {
  local: {
    lkr: number;
    count: number;
    insurance: number;
    nonInsurance: number;
  };
}

export interface ReportsData {
  totalIncome: {
    lkr: number;
  };
  serviceTypes: ServiceTypeIncome;
  paymentMethods: PaymentMethodBreakdown;
  patientTypes: PatientTypeBreakdown;
  totalTransactions: number;
  averageTransactionValue: {
    lkr: number;
  };
  dailyBreakdown: Array<{
    date: string;
    lkr: number;
    transactions: number;
  }>;
}

export interface CashOutRecord {
  id?: string;
  currency: 'LKR'; // Only LKR supported for local patients
  amount: number;
  cashOutDate: Date;
  performedBy: {
    uid: string;
    name: string;
    email: string;
  };
  notes?: string;
  createdAt: Date;
}