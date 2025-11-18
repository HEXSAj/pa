// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/context/AuthContext';
// import { AlertTriangle } from 'lucide-react';

// export default function Unauthorized() {
//   const router = useRouter();
//   const { userRole } = useAuth();

//   useEffect(() => {
//     // Redirect after 3 seconds
//     const timer = setTimeout(() => {
//       // Redirect to POS for staff or dashboard for admin
//       router.push(userRole === 'admin' ? '/dashboard' : '/dashboard/pos');
//     }, 3000);

//     return () => clearTimeout(timer);
//   }, [router, userRole]);

//   return (
//     <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
//       <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
//         <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-100">
//           <AlertTriangle className="h-8 w-8 text-red-600" />
//         </div>
//         <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
//         <p className="text-gray-600 mb-6">
//           You don't have permission to access this page. 
//           You will be redirected to an authorized page shortly.
//         </p>
//         <div className="flex justify-center">
//           <button
//             onClick={() => router.push(userRole === 'admin' ? '/dashboard' : '/dashboard/pos')}
//             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
//           >
//             Go to {userRole === 'admin' ? 'Dashboard' : 'Point of Sale'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { staffService } from '@/services/staffService';
import { AlertTriangle } from 'lucide-react';

export default function Unauthorized() {
  const router = useRouter();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('cashier');

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const staffUser = await staffService.getStaffById(user.uid);
          setUserRole(staffUser?.role || 'cashier');
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('cashier');
        }
      }
    };

    fetchUserRole();
  }, [user]);

  const getRedirectPath = (role: string) => {
    switch (role) {
      case 'doctor':
        return '/dashboard/my-sessions';
      case 'admin':
        return '/dashboard';
      case 'pharmacy':
        return '/dashboard/pharmacyPOS';
      case 'cashier':
      default:
        return '/dashboard/pos';
    }
  };

  const getPageName = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'My Sessions';
      case 'admin':
        return 'Dashboard';
      case 'pharmacy':
        return 'Pharmacy POS';
      case 'cashier':
      default:
        return 'Point of Sale';
    }
  };

  useEffect(() => {
    // Redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push(getRedirectPath(userRole));
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, userRole]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. 
          You will be redirected to an authorized page shortly.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => router.push(getRedirectPath(userRole))}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to {getPageName(userRole)}
          </button>
        </div>
      </div>
    </div>
  );
}