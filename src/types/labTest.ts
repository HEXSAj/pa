// src/types/labTest.ts

import { Timestamp } from 'firebase/firestore';

export interface LabTest {
  id?: string;
  name: string;
  price: number;
  labId: string;  // References the lab that performs this test
  labName?: string; // For easier display
  description?: string;
  isActive?: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}