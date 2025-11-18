// export interface Customer {
//   id?: string;
//   name: string;
//   mobile: string;
//   address: string;
//   createdAt: Date;
//   updatedAt: Date;
// }


// export interface Customer {
//   id?: string;
//   name: string;
//   mobile: string;
//   address: string;
//   discountPercentage?: number; 
//   createdAt: Date;
//   updatedAt: Date;
//   documentText?: string;
//   documentName?: string;
//   documentUploadedAt?: Date;
// }

export interface Customer {
  id?: string;
  name: string;
  mobile: string;
  address: string;
  discountPercentage?: number; 
  loyaltyPoints?: number; // Add loyalty points tracking
  createdAt: Date;
  updatedAt: Date;
  documentText?: string;
  documentName?: string;
  documentUploadedAt?: Date;
}