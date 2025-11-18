// // src/types/sale.ts
// import { InventoryItem } from './inventory';
// import { BatchWithDetails } from './purchase';
// import { Customer } from './customer';




// export interface SaleItem {
//   itemId: string;
//   // item: InventoryItem;
//   item: InventoryItem & Partial<SecondaryInventoryItem>;
//   batchId: string;
//   batch: BatchWithDetails;
//   unitQuantity: number;
//   subUnitQuantity: number;
//   unitPrice: number;
//   subUnitPrice: number;
//   totalPrice: number;
//   totalCost: number;

//   itemDiscount?: number;  // Discount amount for this item
//   itemDiscountPercentage?: number; // Discount percentage for this item

//   isSecondaryItem?: boolean;       // Flag to identify secondary inventory items
//   secondaryItemId?: string;        // ID of the secondary inventory item

//    // New fields for price adjustments
//    isPriceAdjusted?: boolean; // Flag to indicate if price was manually adjusted
//    originalUnitPrice?: number; // The original unit price from the batch

//    isSubUnitPriceAdjusted?: boolean; // Flag to indicate if sub-unit price was manually adjusted
//    originalSubUnitPrice?: number; // The original sub-unit price calculated from batch
//    fromFreeItemBatch?: boolean;
// }

// export type PaymentMethod = 'cash' | 'card' | 'bank_deposit' | 'credit';

// // Add this type for patient types
// export type PatientType = 'local' | 'foreign';

// // export interface Sale {
// //   id?: string;
// //   customerId?: string;
// //   customer?: Customer;
// //   customerInfo?: {
// //     id: string | null;
// //     name: string;
// //     mobile?: string | null;
// //     address?: string | null;
// //   };
// //   items: SaleItem[];
// //   totalAmount: number;
// //   totalCost: number;
// //   saleDate: Date;
// //   createdAt: Date;
// //   updatedAt: Date;
// //   paymentMethod: PaymentMethod;
// //   bankAccountId?: string; // Optional since it's only required for bank_deposit

// //   patientType: PatientType;

// //   invoiceNumber?: string; 

// //   isInsurancePatient?: boolean;

// //   // Credit payment related fields
// //   initialPayment?: number; // Amount paid at time of sale
// //   dueAmount?: number; // Amount that remains to be paid
// //   isPaid?: boolean; // Whether the sale has been fully paid
// //   paymentHistory?: PaymentRecord[]; // Track payment history

// //   totalDiscount?: number; // Total discount amount
// //   discountPercentage?: number; // Overall discount percentage
// //   discountNote?: string; // Optional note about the discount

// //    // Track free items statistics
// //    freeItemsCount?: number; // Number of items from free batches
// //    freeItemsValue?: number; // Total value of items from free batches

// //    createdBy?: CreatedBy;

// //    loyaltyPointsUsed?: number; // Points used for discount
// //    loyaltyPointsEarned?: number;

// //    opdCharges?: number;
// //     procedures?: Array<{
// //       id: string;
// //       name: string;
// //       localPatientCharge: number;
// //       quantity: number;
// //       total: number;
// //     }>;
// //     labTests?: Array<{
// //       id: string;
// //       name: string;
// //       price: number;
// //       labName: string;
// //       quantity: number;
// //       total: number;
// //     }>;
// //     proceduresTotal?: number;
// //     labTestsTotal?: number;
// //     pharmacyTotal?: number;

// //     paymentDetails?: {
// //     method: 'cash' | 'card';
// //     receivedAmount?: number;
// //     changeAmount?: number;
// //     cardNumber?: string; // Store only last 4 digits for security
// //   };

// //   proceduresTotalLKR?: number;
// //   labTestsTotalLKR?: number;
// //   pharmacyTotalLKR?: number;
// //   grandTotalLKR?: number;
// //   pharmacyItemsUSD?: Array<{
// //     itemId: string;
// //     usdAmount: number;
// //     totalUSD: number;
// //   }>;
    
// // }

// export interface Sale {
//   id?: string;
//   customerId?: string;
//   customer?: Customer;
//   customerInfo?: {
//     id: string | null;
//     name: string;
//     mobile?: string | null;
//     address?: string | null;
//   };
//   items: SaleItem[];
//   totalAmount: number;
//   totalCost: number;
//   saleDate: Date;
//   createdAt: Date;
//   updatedAt: Date;
//   paymentMethod: PaymentMethod;
//   bankAccountId?: string;

//   patientType: PatientType;
//   invoiceNumber?: string; 
//   isInsurancePatient?: boolean;

//   // Credit payment related fields
//   initialPayment?: number;
//   dueAmount?: number;
//   isPaid?: boolean;
//   paymentHistory?: PaymentRecord[];

//   totalDiscount?: number;
//   discountPercentage?: number;
//   discountNote?: string;

//   // Track free items statistics
//   freeItemsCount?: number;
//   freeItemsValue?: number;

//   createdBy?: CreatedBy;
//   loyaltyPointsUsed?: number;
//   loyaltyPointsEarned?: number;

//   opdCharges?: number;

//   // UPDATED: Enhanced procedures array for foreign patients
//   procedures?: Array<{
//     id: string;
//     name: string;
//     localPatientCharge?: number;      // Made optional
//     foreignPatientCharge?: number;    // Add foreign patient charge
//     quantity: number;
//     total: number;
//     // New foreign patient fields
//     totalLKR?: number;
//     totalUSD?: number;
//     usdAmount?: number;
//   }>;

//   // UPDATED: Enhanced labTests array for foreign patients
//   labTests?: Array<{
//     id: string;
//     name: string;
//     price: number;
//     labName?: string;                 // Made optional
//     quantity: number;
//     total: number;
//     // New foreign patient fields
//     totalLKR?: number;
//     totalUSD?: number;
//     usdAmount?: number;
//     invNo?: string;
//   }>;
  

//   proceduresTotal?: number;
//   labTestsTotal?: number;
//   pharmacyTotal?: number;

//   // NEW: Additional foreign patient totals
//   proceduresTotalLKR?: number;
//   labTestsTotalLKR?: number;
//   pharmacyTotalLKR?: number;
//   grandTotalLKR?: number;

//   // NEW: Foreign patient pharmacy USD tracking
//   pharmacyItemsUSD?: Array<{
//     itemId: string;
//     usdAmount: number;
//     totalUSD: number;
//   }>;

//   paymentDetails?: {
//     method: 'cash' | 'card';
//     receivedAmount?: number;
//     changeAmount?: number;
//     cardNumber?: string;
//   };
// }

// export interface CreatedBy {
//   uid: string;
//   email: string;
//   role: string;
//   displayName: string;
// }

// export interface PaymentRecord {
//   id?: string;
//   amount: number;
//   date: Date;
//   paymentMethod: PaymentMethod;
//   notes?: string;
//   recordedBy?: string;
// }

// src/types/sale.ts
import { InventoryItem } from './inventory';
import { BatchWithDetails } from './purchase';
import { Customer } from './customer';

export interface SaleItem {
  itemId: string;
  item: InventoryItem & Partial<SecondaryInventoryItem>;
  batchId: string;
  batch: BatchWithDetails;
  unitQuantity: number;
  subUnitQuantity: number;
  unitPrice: number;
  subUnitPrice: number;
  totalPrice: number;
  totalCost: number;

  itemDiscount?: number;  // Discount amount for this item
  itemDiscountPercentage?: number; // Discount percentage for this item

  isSecondaryItem?: boolean;       // Flag to identify secondary inventory items
  secondaryItemId?: string;        // ID of the secondary inventory item

  // New fields for price adjustments
  isPriceAdjusted?: boolean; // Flag to indicate if price was manually adjusted
  originalUnitPrice?: number; // The original unit price from the batch

  isSubUnitPriceAdjusted?: boolean; // Flag to indicate if sub-unit price was manually adjusted
  originalSubUnitPrice?: number; // The original sub-unit price calculated from batch
  fromFreeItemBatch?: boolean;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_deposit' | 'credit' | 'free';

// Updated patient type - only local patients
export type PatientType = 'local';

export interface Sale {
  id?: string;
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
  originalAmount?: number; // Store original amount before discount (for free bills)
  totalCost: number;
  saleDate: Date;
  createdAt: Date;
  updatedAt: Date;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;

  patientType: PatientType;
  invoiceNumber?: string; 
  isInsurancePatient?: boolean;

  // Credit payment related fields
  initialPayment?: number;
  dueAmount?: number;
  isPaid?: boolean;
  paymentHistory?: PaymentRecord[];

  totalDiscount?: number;
  discountPercentage?: number;
  discountNote?: string;
  discountAmount?: number; // Total discount amount applied

  // Free bill tracking
  isFreeBill?: boolean; // Flag to identify free bills (100% discount)

  // Track free items statistics
  freeItemsCount?: number;
  freeItemsValue?: number;

  createdBy?: CreatedBy;
  loyaltyPointsUsed?: number;
  loyaltyPointsEarned?: number;

  opdCharges?: number;

  // Local patient procedures - simplified structure
  procedures?: Array<{
    id: string;
    name: string;
    localPatientCharge: number;
    quantity: number;
    total: number;
  }>;

  // Local patient lab tests - simplified structure
  labTests?: Array<{
    id: string;
    name: string;
    price: number;
    labName: string;
    quantity: number;
    total: number;
    invNo?: string;
  }>;

  proceduresTotal?: number;
  labTestsTotal?: number;
  pharmacyTotal?: number;

  paymentDetails?: {
    method: 'cash' | 'card' | 'free';
    receivedAmount?: number;
    changeAmount?: number;
    cardNumber?: string;
    isFreeBill?: boolean;
    discountPercentage?: number;
    originalAmount?: number;
    discountAmount?: number;
  };

  // Manual appointment amount for appointments loaded to POS
  manualAppointmentAmount?: number;
  
  // Rounding adjustment amount added to total (e.g., rounding 1230 to 1250 adds 20)
  roundingAdjustmentAmount?: number;
  
  // Store the selected rounding option
  selectedRounding?: '20' | '10' | '50' | 'none';
}

export interface CreatedBy {
  uid: string;
  email: string;
  role: string;
  displayName: string;
}

export interface PaymentRecord {
  id?: string;
  amount: number;
  date: Date;
  paymentMethod: PaymentMethod;
  notes?: string;
  recordedBy?: string;
}

// Secondary inventory item interface (if needed)
interface SecondaryInventoryItem {
  id: string;
  name: string;
  // Add other secondary inventory properties as needed
}