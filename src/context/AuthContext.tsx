//src/context/AuthContext.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

// Define user roles - pharmacy, cashier, admin, and doctor
export type UserRole = 'admin' | 'pharmacy' | 'cashier' | 'doctor';

// Define which pages each role can access
export const rolePermissions: Record<UserRole, string[]> = {
  admin: ['all'], // Admin can access everything
  doctor: ['all'], // Doctor can access everything like admin
  pharmacy: [
    '/dashboard/pharmacyPOS',
    '/dashboard/inventory',
    '/dashboard/prescriptions',
    '/dashboard/patients',
    '/dashboard/doctors',
    '/dashboard/appointments',
    '/dashboard/lab-tests',
    '/dashboard/labs',
    '/dashboard/procedures',
    '/dashboard/attendance',
    '/dashboard/returns',
  ],
  cashier: [
    '/dashboard/pos',
    '/dashboard/payments',
    '/dashboard/customers',
    '/dashboard/viewSales',
    '/dashboard/allSales',
    '/dashboard/appointments',
    '/dashboard/appointmentsReport',
    '/dashboard/consultationFeeReports',
    '/dashboard/attendance',
    '/dashboard/inventory',
    '/dashboard/inventory/low-stock',
    '/dashboard/inventory/expiry',
    '/dashboard/inventory/adjustments',
    '/dashboard/suppliers',
    '/dashboard/suppliers/low-stock-report',
    '/dashboard/purchases',
    '/dashboard/returns',
    '/dashboard/doctors',
    '/dashboard/due-collect',
    '/dashboard/procedures',
    '/dashboard/labs',
    '/dashboard/lab-tests',
  ],
};

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  hasAccess: (path: string) => boolean;
  reAuthenticateAdmin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  hasAccess: () => false,
  reAuthenticateAdmin: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Try to fetch role from Realtime Database
          const userRef = ref(database, `staff/${currentUser.uid}`);
          const snapshot = await get(userRef);
          
          let role: UserRole = 'cashier'; // Default role
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            role = userData.role as UserRole || 'cashier';
          } else {
            // Default roles based on email for our specific test accounts
            if (currentUser.email === 'admin@admin.com') {
              role = 'admin';
            } else if (currentUser.email === 'pharmacy@pharmacy.com') {
              role = 'pharmacy';
            } else if (currentUser.email === 'cashier@cashier.com') {
              role = 'cashier';
            } else if (currentUser.email === 'doctor@doctor.com') {
              role = 'doctor';
            } else {
              role = 'cashier'; // Default for any other user
            }
          }
          
          setUserRole(role);
          
        } catch (error) {
          console.error('Error fetching user role:', error);
          // Fallback to default roles for our specific accounts
          let role: UserRole = 'cashier';
          if (currentUser.email === 'admin@admin.com') {
            role = 'admin';
          } else if (currentUser.email === 'pharmacy@pharmacy.com') {
            role = 'pharmacy';
          } else if (currentUser.email === 'cashier@cashier.com') {
            role = 'cashier';
          } else if (currentUser.email === 'doctor@doctor.com') {
            role = 'doctor';
          } else {
            role = 'cashier';
          }
          setUserRole(role);
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to re-authenticate admin after creating a new user
  const reAuthenticateAdmin = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Failed to re-authenticate admin:', error);
      throw error;
    }
  };

  // Function to logout
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  };

  // Function to check if user has access to a specific path
  const hasAccess = (path: string): boolean => {
    if (!userRole) return false;
    
    // Admin and Doctor can access everything
    if (userRole === 'admin' || userRole === 'doctor' || rolePermissions[userRole].includes('all')) {
      return true;
    }
    
    // For pharmacy and cashier, check if the path or its parent path is in their permissions
    return rolePermissions[userRole].some(allowedPath => {
      // Check if path starts with allowed path
      return path === allowedPath || 
             path.startsWith(`${allowedPath}/`) || 
             // Special case for purchases, suppliers, and inventory which might have subpaths
             (allowedPath.includes('purchases') && path.includes('purchases')) ||
             (allowedPath.includes('suppliers') && path.includes('suppliers')) ||
             (allowedPath.includes('inventory') && path.includes('inventory')) ||
             (allowedPath.includes('prescriptions') && path.includes('prescriptions')) ||
             (allowedPath.includes('payments') && path.includes('payments'));
    });
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, hasAccess, reAuthenticateAdmin, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);