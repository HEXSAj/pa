// 1. First, let's create a new type definition for Quotations
// src/types/quotation.ts

import { SaleItem } from './sale';
import { Customer } from './customer';

export interface Quotation {
  id?: string;
  quotationNumber: string;
  customerId?: string;
  customer?: Customer;
  customerInfo?: {
    id: string | null;
    name: string;
    mobile?: string | null;
    address?: string | null;
  };
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
  discountPercentage?: number;
  totalDiscount?: number;
  notes?: string;
  convertedToSale?: boolean;
  saleId?: string;
  expiryDate?: Date; // Optional expiry date for the quotation
}