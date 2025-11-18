// src/types/lab.ts

import { Timestamp } from 'firebase/firestore';

export interface Lab {
  id?: string;
  name: string;
  contactNo: string;
  email?: string;
  address?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}