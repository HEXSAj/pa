// // src/types/purchase.ts

// import { InventoryItem } from './inventory';
// import { Supplier } from './supplier';

// export interface Batch {
//   id?: string;
//   batchNumber: string;
//   itemId: string;
//   quantity: number;
//   expiryDate: Date;
//   createdAt: Date;
//   updatedAt: Date;
//   unitPrice?: number;
//   costPrice?: number;
//   supplierId?: string;
//   isFreeItem?: boolean;
// }

// export interface PurchaseItem {
//   itemId: string;
//   batchNumber: string;
//   quantity: number;
//   unitsPerPack?: number;
//   totalQuantity: number;
//   expiryDate: Date;
//   costPricePerUnit: number;  
//   sellingPricePerUnit: number;  
//   freeItemCount?: number; 
// }

// // Updated to only include 'cheque' and 'credit'
// // export type PaymentMethod = 'cheque' | 'credit';

// // New interface for cheque details
// // export interface ChequeDetails {
// //   chequeNumber: string;
// //   chequeDate: Date;
// //   bankName: string;
// //   accountName?: string;
// //   branchName?: string;
// //   clearingDate?: Date;  // When the cheque was cleared
// //   status: 'pending' | 'cleared' | 'bounced';
// // }

// // export interface PaymentRecord {
// //   id?: string;
// //   amount: number;
// //   date: Date;
// //   paymentMethod: PaymentMethod;
// //   notes?: string;
// //   recordedBy?: string;
// // }

// // Updated purchase status for the order workflow
// export type PurchaseStatus = 'pending' | 'ordered' | 'received' | 'completed';

// export interface Purchase {
//   id?: string;
//   supplierId: string;
//   supplier?: Supplier;
//   items: PurchaseItem[];
//   totalAmount: number;
//   purchaseDate: Date;
//   invoiceNumber?: string;
//   notes?: string;
//   createdAt: Date;
//   updatedAt: Date;

//   // Creator information
//   createdByUid?: string;
//   createdByName?: string;
//   createdByEmail?: string;
//   createdByRole?: string;

//   // Payment related fields
//   // paymentStatus: 'paid' | 'partial' | 'unpaid';
//   // paymentMethod: PaymentMethod;
//   // initialPayment?: number;
//   // dueAmount?: number;
//   // paymentDueDate?: Date;  // New field for payment due date
//   // isPaid?: boolean;
//   // paymentHistory?: PaymentRecord[];
//   // chequeDetails?: ChequeDetails;  // New field for cheque details

//   // Status for tracking in the purchase workflow
//   status?: PurchaseStatus;
  
//   // Fields for tracking receipt
//   orderedDate?: Date;
//   receivedDate?: Date;
//   receivedByUid?: string;
//   receivedByName?: string;
//   receivedNotes?: string;
  
//   // Track if quantities were adjusted during receiving
//   wasAdjusted?: boolean;
//   originalItems?: PurchaseItem[]; // Original ordered items if adjusted
// }

// export interface PurchaseWithDetails extends Purchase {
//   supplier: Supplier;
//   items: (PurchaseItem & {
//     item: InventoryItem;
//   })[];

//   // Creator information
//   createdByUid?: string;
//   createdByName?: string;
//   createdByEmail?: string;
//   createdByRole?: string;
// }

// export interface BatchWithDetails extends Batch {
//   item: InventoryItem;
//   purchase?: Purchase;
//   supplier?: Supplier;
//   sellingPricePerUnit?: number;
//   costPricePerUnit?: number;
// }

// src/types/purchase.ts

import { InventoryItem } from './inventory';
import { Supplier } from './supplier';

export interface Batch {
  id?: string;
  batchNumber: string;
  itemId: string;
  quantity: number;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
  unitPrice?: number;
  costPrice?: number;
  supplierId?: string;
  isFreeItem?: boolean;
}

export interface PurchaseItem {
  itemId: string;
  batchNumber: string;
  quantity: number;
  unitsPerPack?: number;
  totalQuantity: number;
  expiryDate: Date;
  costPricePerUnit: number;  
  sellingPricePerUnit: number;  
  freeItemCount?: number; 
}

// Payment method types for purchasing
export type PaymentMethod = 'credit' | 'full_payment';

// Payment record interface for tracking individual payments
export interface PaymentRecord {
  id?: string;
  amount: number;
  date: Date;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque';
  notes?: string;
  recordedBy?: string;
  recordedByName?: string;
  createdAt: Date;
}

// Updated purchase status for the order workflow
export type PurchaseStatus = 'pending' | 'ordered' | 'received' | 'completed';

export interface InstallmentPlan {
  id?: string;
  purchaseId: string;
  totalAmount: number;
  installmentCount: number;
  installmentAmount: number;
  frequency: 'weekly' | 'monthly' | 'custom'; // Payment frequency
  startDate: Date;
  installments: Installment[];
  createdAt: Date;
  updatedAt: Date;
}

// Individual installment interface
export interface Installment {
  id?: string;
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: Date;
  paidAmount?: number;
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'cheque';
  notes?: string;
  recordedBy?: string;
  recordedByName?: string;
}

export interface Purchase {
  id?: string;
  supplierId: string;
  supplier?: Supplier;
  items: PurchaseItem[];
  totalAmount: number;
  purchaseDate: Date;
  invoiceNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Creator information
  createdByUid?: string;
  createdByName?: string;
  createdByEmail?: string;
  createdByRole?: string;

  // Payment related fields
  paymentMethod: PaymentMethod; // credit or full_payment
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  initialPayment?: number; // for credit method
  dueAmount?: number;
  isPaid?: boolean;
  paymentHistory?: PaymentRecord[];

  installmentPlan?: InstallmentPlan;
  hasInstallmentPlan?: boolean;

  // Status for tracking in the purchase workflow
  status?: PurchaseStatus;
  
  // Fields for tracking receipt
  orderedDate?: Date;
  receivedDate?: Date;
  receivedByUid?: string;
  receivedByName?: string;
  receivedNotes?: string;
  
  // Track if quantities were adjusted during receiving
  wasAdjusted?: boolean;
  originalItems?: PurchaseItem[]; // Original ordered items if adjusted
}

export interface PurchaseWithDetails extends Purchase {
  supplier: Supplier;
  items: (PurchaseItem & {
    item: InventoryItem;
  })[];

  // Creator information
  createdByUid?: string;
  createdByName?: string;
  createdByEmail?: string;
  createdByRole?: string;
}

export interface BatchWithDetails extends Batch {
  item: InventoryItem;
  purchase?: Purchase;
  supplier?: Supplier;
}