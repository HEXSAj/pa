// src/app/dashboard/viewSales/page.tsx
// 'use client';

// import SalesViewPage from "./SalesViewPage";

// export default function SalesPage() {
//   return <SalesViewPage />;
// }

'use client';

import SalesViewPage from "./SalesViewPage";
import withAuth from '@/components/withAuth'; // Import the withAuth HOC

// Apply the withAuth HOC to the page component
function SalesPage() {
  return <SalesViewPage />;
}

// Export with access control applied
export default withAuth(SalesPage);