// src/types/employee.ts
export interface Employee {
  id?: string;
  name: string;
  mobile: string;
  role: string;
  commission: number; // Percentage commission
  createdAt: Date;
  updatedAt: Date;
}