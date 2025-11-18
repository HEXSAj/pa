// export type UserRole = 'admin' | 'staff';

// export interface AuthUser {
//   uid: string;
//   email: string | null;
//   role: UserRole;
// }

// export interface UserData {
//   email: string;
//   role: UserRole;
//   createdAt: Date;
//   updatedAt: Date;
// }

export type UserRole = 'admin' | 'pharmacy' | 'cashier' | 'doctor';

export interface AuthUser {
  uid: string;
  email: string | null;
  role: UserRole;
}

export interface UserData {
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}