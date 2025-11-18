// src/app/dashboard/payments/page.tsx
// 'use client';
// import DashboardLayout from '@/components/DashboardLayout';
// import DuePaymentsDashboard from '@/app/dashboard/DuePaymentsDashboard';

// export default function PaymentsOverviewPage() {
//   return (
//     <DashboardLayout>
//       <div className="p-6">
//         <h1 className="text-3xl font-bold mb-6">Payments Overview</h1>
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <DuePaymentsDashboard />
//           {/* Add other payment-related widgets here */}
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }

// src/app/dashboard/payments/page.tsx
'use client';
import DashboardLayout from '@/components/DashboardLayout';
import DuePaymentsDashboard from '@/app/dashboard/DuePaymentsDashboard';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import withAuth from '@/components/withAuth';

function PaymentsOverviewPage() {
  const { userRole } = useAuth(); // Get the user's role
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Payments Overview</h1>
          {/* User role badge */}
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 capitalize">
            {userRole || 'User'} Access
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DuePaymentsDashboard />
          {/* Add other payment-related widgets here */}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Wrap with withAuth HOC to enforce access control
export default withAuth(PaymentsOverviewPage);