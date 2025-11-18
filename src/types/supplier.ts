export interface Supplier {
    id?: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    contactPerson?: string;
    notes?: string;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
  }