
// src/app/dashboard/reports/page.tsx
// 'use client';

// import ReportsPage from "./ReportsPage";

// export default function Page() {
//   return <ReportsPage />;
// }

'use client';

import ReportsPage from "./ReportsPage";
import withAuth from '@/components/withAuth';

// Apply the withAuth HOC to the page component
// This ensures only users with permission can access the Reports page
function Page() {
  return <ReportsPage />;
}

// Export the wrapped component
export default withAuth(Page);