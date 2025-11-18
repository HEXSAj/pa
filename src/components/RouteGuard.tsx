// // src/components/RouteGuard.tsx
// 'use client';

// import { useEffect } from 'react';
// import { useRouter, usePathname } from 'next/navigation';
// import { useAuth } from '@/context/AuthContext';

// // Define which routes are accessible to which roles
// const roleRoutes = {
//   staff: ['/dashboard', '/dashboard/inventory', '/dashboard/pos', '/dashboard/secondary-inventory', '/dashboard/secondary-pos'],
//   admin: [
//     '/dashboard',
//     '/dashboard/inventory',
//     '/dashboard/pos',
//     '/dashboard/customers',
//     '/dashboard/doctor-fees',
//     '/dashboard/laboratory-tests',
//     '/dashboard/bank-accounts',
//     '/dashboard/suppliers',
//     '/dashboard/purchases',
//     '/dashboard/reports',
//     '/dashboard/doctorFeeViewSales',
//     '/dashboard/labTestViewSales',
//     '/dashboard/viewSales',
//     '/dashboard/allSales',
//     '/dashboard/salary',
//     '/dashboard/secondary-inventory',
//     '/dashboard/secondary-pos',
//     '/dashboard/secondary-sales',
    
    
//   ]
// };

// export function RouteGuard({ children }: { children: React.ReactNode }) {
//   const { user, loading } = useAuth();
//   const router = useRouter();
//   const pathname = usePathname();

//   useEffect(() => {
//     if (!loading) {
//       if (!user) {
//         // Redirect to login if not authenticated
//         router.push('/');
//       } else {
//         // Check if user has access to current route
//         const allowedRoutes = roleRoutes[user.role] || [];
//         const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));
        
//         if (!hasAccess) {
//           // Redirect to dashboard if user doesn't have access
//           router.push('/dashboard');
//         }
//       }
//     }
//   }, [user, loading, pathname, router]);

//   // Show nothing while checking auth
//   if (loading) {
//     return null;
//   }

//   // Show children only if user has access
//   if (!user) {
//     return null;
//   }

//   const allowedRoutes = roleRoutes[user.role] || [];
//   const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));

//   return hasAccess ? <>{children}</> : null;
// }

// src/components/RouteGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { staffService } from '@/services/staffService';

// Define which routes are accessible to which roles
const roleRoutes = {
  pharmacy: [
    '/dashboard',
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
    '/dashboard',
    '/dashboard/pos',
    '/dashboard/payments',
    '/dashboard/customers',
    '/dashboard/viewSales',
    '/dashboard/allSales',
    '/dashboard/appointments',
    '/dashboard/appointmentsReport',
    '/dashboard/consultationFeeReports',
    '/dashboard/attendance',
    '/dashboard/returns',
  ],
  admin: [
    '/dashboard',
    '/dashboard/inventory',
    '/dashboard/pos',
    '/dashboard/customers',
    '/dashboard/doctor-fees',
    '/dashboard/laboratory-tests',
    '/dashboard/bank-accounts',
    '/dashboard/suppliers',
    '/dashboard/purchases',
    '/dashboard/returns',
    '/dashboard/reports',
    '/dashboard/doctorFeeViewSales',
    '/dashboard/labTestViewSales',
    '/dashboard/viewSales',
    '/dashboard/allSales',
    '/dashboard/salary',
    '/dashboard/pharmacyPOS',
    '/dashboard/prescriptions',
    '/dashboard/patients',
    '/dashboard/doctors',
    '/dashboard/appointments',
    '/dashboard/appointmentsReport',
    '/dashboard/consultationFeeReports',
    '/dashboard/lab-tests',
    '/dashboard/labs',
    '/dashboard/procedures',
    '/dashboard/attendance',
    '/dashboard/payments',
  ],
  doctor: [
    '/dashboard',
    '/dashboard/my-sessions',
    '/dashboard/appointments'
  ]
};

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Fetch user role when user is available
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        const staffUser = await staffService.getStaffById(user.uid);
        setUserRole(staffUser?.role || 'cashier');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('cashier'); // Default to cashier
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/');
      } else if (userRole) {
        // Check if user has access to current route
        const allowedRoutes = roleRoutes[userRole as keyof typeof roleRoutes] || [];
        const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));
        
        if (!hasAccess) {
          // Redirect based on role if user doesn't have access
          if (userRole === 'doctor') {
            router.push('/dashboard/my-sessions');
          } else if (userRole === 'admin') {
            router.push('/dashboard');
          } else if (userRole === 'pharmacy') {
            router.push('/dashboard/pharmacyPOS');
          } else if (userRole === 'cashier') {
            router.push('/dashboard/pos');
          } else {
            router.push('/dashboard');
          }
        }
      }
    }
  }, [user, userRole, loading, roleLoading, pathname, router]);

  // Show nothing while checking auth or role
  if (loading || roleLoading) {
    return null;
  }

  // Show children only if user has access
  if (!user) {
    return null;
  }

  const allowedRoutes = roleRoutes[userRole as keyof typeof roleRoutes] || [];
  const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));

  return hasAccess ? <>{children}</> : null;
}