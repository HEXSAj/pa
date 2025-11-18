// src/types/expense.ts

export interface ExpenseCategory {
    id?: string;
    name: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export interface Expense {
    id?: string;
    date: Date;
    amount: number;
    details: string;
    categoryId: string;
    categoryName: string;
    paidAt?: number; 
    createdAt?: Date;
    updatedAt?: Date;
  }