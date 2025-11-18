// // src/types/procedure.ts

// import { Timestamp } from 'firebase/firestore';

// export interface Procedure {
//   id?: string;
//   name: string;
//   localPatientCharge: number;
//   foreignPatientCharge: number;
//   description?: string;
//   category?: string;     // Optional category for grouping procedures
//   duration?: number;     // Optional duration in minutes
//   isActive?: boolean;
//   createdAt?: Date | Timestamp;
//   updatedAt?: Date | Timestamp;
// }

// src/types/procedure.ts

import { Timestamp } from 'firebase/firestore';

export interface Procedure {
  id?: string;
  name: string;
  charge: number; // Simplified from localPatientCharge and foreignPatientCharge
  description?: string;
  category?: string;     // Optional category for grouping procedures
  duration?: number;     // Optional duration in minutes
  isActive?: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}