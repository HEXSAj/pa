// src/types/salary.ts

export interface Salary {
    id?: string;
    staffId: string;
    baseSalary: number;
    role?: string;
    department?: string;
    joiningDate?: string; // ISO date string
    contractType?: 'permanent' | 'temporary' | 'contract';
    paymentFrequency?: 'monthly' | 'bi-weekly' | 'weekly';
    bankDetails?: {
      accountNumber: string;
      accountName: string;
      bankName: string;
      branch?: string;
    };
    taxInformation?: {
      taxId: string;
      taxPercentage: number;
    };
    allowances?: {
      type: string;
      amount: number;
    }[];
    updatedAt: string; // ISO date string
    createdAt: string; // ISO date string
  }
  
  export interface Deduction {
    reason: string;
    amount: number;
  }
  
  export interface Bonus {
    reason: string;
    amount: number;
  }
  
  export interface SalaryPayment {
    id: string;
    staffId: string;
    amount: number;
    paymentDate: string; // ISO date string
    period?: string; // ISO date string (typically month start)
    paymentMethod: 'cash' | 'bank_transfer' | 'check' | string;
    description?: string;
    deductions?: Deduction[];
    bonuses?: Bonus[];
    status?: 'paid' | 'pending' | 'cancelled';
    receiptNumber?: string;
    createdAt: string; // ISO date string
    createdBy?: string; // User ID of who created this payment
  }