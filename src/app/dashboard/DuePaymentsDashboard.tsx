// // src/app/dashboard/DuePaymentsDashboard.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { purchaseService } from '@/services/purchaseService';
// import { PurchaseWithDetails } from '@/types/purchase';
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { CreditCard, Calendar, AlertTriangle, Clock, Info, ChevronRight } from 'lucide-react';
// import Link from 'next/link';

// export default function DuePaymentsDashboard() {
//   const [loading, setLoading] = useState(true);
//   const [unpaidPurchases, setUnpaidPurchases] = useState<PurchaseWithDetails[]>([]);

//   useEffect(() => {
//     const loadUnpaidPurchases = async () => {
//       try {
//         const purchases = await purchaseService.getUnpaidPurchases();
//         setUnpaidPurchases(purchases);
//       } catch (error) {
//         console.error('Error loading unpaid purchases:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadUnpaidPurchases();
//   }, []);

//   const getTotalDueAmount = () => {
//     return unpaidPurchases.reduce((total, purchase) => total + (purchase.dueAmount || 0), 0);
//   };

//   const sortedPurchases = [...unpaidPurchases].sort((a, b) => {
//     // Sort by urgency - first unpaid, then partial
//     if (a.paymentStatus !== b.paymentStatus) {
//       return a.paymentStatus === 'unpaid' ? -1 : 1;
//     }
//     // Then by date (oldest first)
//     return a.purchaseDate.getTime() - b.purchaseDate.getTime();
//   });

//   const getDaysOverdue = (date: Date) => {
//     const today = new Date();
//     const purchaseDate = new Date(date);
//     const diffTime = Math.abs(today.getTime() - purchaseDate.getTime());
//     return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//   };

//   const getStatusBadge = (status: string, days: number) => {
//     if (status === 'unpaid') {
//       if (days > 30) {
//         return <Badge className="bg-red-500">Overdue {days} days</Badge>;
//       }
//       return <Badge className="bg-red-500">Unpaid</Badge>;
//     }
//     return <Badge className="bg-amber-500">Partially Paid</Badge>;
//   };

//   return (
//     <Card className="col-span-12 md:col-span-6">
//       <CardHeader className="pb-2">
//         <CardTitle className="text-lg flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <CreditCard className="h-5 w-5 text-blue-500" />
//             Due Payments
//           </div>
//           <Badge variant="outline" className="font-normal">
//             {unpaidPurchases.length} suppliers
//           </Badge>
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         {loading ? (
//           <div className="flex justify-center items-center h-48">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//           </div>
//         ) : unpaidPurchases.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-8 text-center">
//             <Info className="h-12 w-12 text-blue-500 mb-2 opacity-50" />
//             <p className="text-muted-foreground">All suppliers have been paid.</p>
//             <p className="text-xs text-muted-foreground">No outstanding payments found.</p>
//           </div>
//         ) : (
//           <>
//             <div className="grid grid-cols-2 gap-4 mb-4">
//               <div className="rounded-lg bg-blue-50 p-4 flex flex-col">
//                 <span className="text-sm text-blue-600">Total Due</span>
//                 <span className="text-2xl font-bold text-blue-700">Rs{getTotalDueAmount().toLocaleString()}</span>
//               </div>
//               <div className="rounded-lg bg-amber-50 p-4 flex flex-col">
//                 <span className="text-sm text-amber-600">Pending Invoices</span>
//                 <span className="text-2xl font-bold text-amber-700">{unpaidPurchases.length}</span>
//               </div>
//             </div>

//             <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
//               {sortedPurchases.slice(0, 5).map((purchase) => {
//                 const daysOverdue = getDaysOverdue(purchase.purchaseDate);
//                 return (
//                   <div key={purchase.id} className="group relative">
//                     <div className="rounded-lg border p-3 hover:bg-gray-50 transition-colors">
//                       <div className="flex justify-between items-start">
//                         <div className="space-y-1">
//                           <div className="font-medium">{purchase.supplier.name}</div>
//                           <div className="text-sm text-muted-foreground flex items-center gap-2">
//                             <Calendar className="h-3 w-3" />
//                             {purchase.purchaseDate.toLocaleDateString()}
//                             {purchase.invoiceNumber && (
//                               <>
//                                 <span className="mx-1">•</span>
//                                 <span>Invoice #{purchase.invoiceNumber}</span>
//                               </>
//                             )}
//                           </div>
//                         </div>
//                         {getStatusBadge(purchase.paymentStatus, daysOverdue)}
//                       </div>
//                       <div className="flex justify-between items-center mt-2">
//                         <div className="flex items-center gap-2">
//                           <AlertTriangle className={`h-4 w-4 ${daysOverdue > 30 ? 'text-red-500' : daysOverdue > 14 ? 'text-amber-500' : 'text-blue-500'}`} />
//                           <span className="text-sm text-muted-foreground">
//                             {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} since purchase
//                           </span>
//                         </div>
//                         <div className="font-semibold">
//                           Rs{(purchase.dueAmount || 0).toLocaleString()}
//                         </div>
//                       </div>
//                     </div>
//                     <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
//                   </div>
//                 );
//               })}
//             </div>

//             {unpaidPurchases.length > 5 && (
//               <>
//                 <Separator className="my-3" />
//                 <div className="text-sm text-muted-foreground text-center">
//                   {unpaidPurchases.length - 5} more payments due
//                 </div>
//               </>
//             )}

//             <div className="mt-4">
//               <Link href="/dashboard/purchases?filter=unpaid">
//                 <Button variant="outline" className="w-full">View All Due Payments</Button>
//               </Link>
//             </div>
//           </>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// src/app/dashboard/DuePaymentsDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { purchaseService } from '@/services/purchaseService';
import { PurchaseWithDetails } from '@/types/purchase';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Calendar, AlertTriangle, Clock, Info, ChevronRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

// Import the withAuth HOC and useAuth hook
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';

function DuePaymentsDashboard() {
  const { userRole } = useAuth(); // Get the user's role
  const isAdmin = userRole === 'admin'; // Check if user is admin
  
  const [loading, setLoading] = useState(true);
  const [unpaidPurchases, setUnpaidPurchases] = useState<PurchaseWithDetails[]>([]);

  useEffect(() => {
    const loadUnpaidPurchases = async () => {
      try {
        const purchases = await purchaseService.getUnpaidPurchases();
        setUnpaidPurchases(purchases);
      } catch (error) {
        console.error('Error loading unpaid purchases:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUnpaidPurchases();
  }, []);

  const getTotalDueAmount = () => {
    return unpaidPurchases.reduce((total, purchase) => total + (purchase.dueAmount || 0), 0);
  };

  const sortedPurchases = [...unpaidPurchases].sort((a, b) => {
    // Sort by urgency - first unpaid, then partial
    if (a.paymentStatus !== b.paymentStatus) {
      return a.paymentStatus === 'unpaid' ? -1 : 1;
    }
    // Then by date (oldest first)
    return a.purchaseDate.getTime() - b.purchaseDate.getTime();
  });

  const getDaysOverdue = (date: Date) => {
    const today = new Date();
    const purchaseDate = new Date(date);
    const diffTime = Math.abs(today.getTime() - purchaseDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (status: string, days: number) => {
    if (status === 'unpaid') {
      if (days > 30) {
        return <Badge className="bg-red-500">Overdue {days} days</Badge>;
      }
      return <Badge className="bg-red-500">Unpaid</Badge>;
    }
    return <Badge className="bg-amber-500">Partially Paid</Badge>;
  };

  return (
    <Card className="col-span-12 md:col-span-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Due Payments
            {/* User role badge - small and discreet */}
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 ml-2">
              {userRole || 'User'}
            </Badge>
          </div>
          <Badge variant="outline" className="font-normal">
            {unpaidPurchases.length} suppliers
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : unpaidPurchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Info className="h-12 w-12 text-blue-500 mb-2 opacity-50" />
            <p className="text-muted-foreground">All suppliers have been paid.</p>
            <p className="text-xs text-muted-foreground">No outstanding payments found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg bg-blue-50 p-4 flex flex-col">
                <span className="text-sm text-blue-600">Total Due</span>
                <span className="text-2xl font-bold text-blue-700">Rs{getTotalDueAmount().toLocaleString()}</span>
              </div>
              <div className="rounded-lg bg-amber-50 p-4 flex flex-col">
                <span className="text-sm text-amber-600">Pending Invoices</span>
                <span className="text-2xl font-bold text-amber-700">{unpaidPurchases.length}</span>
              </div>
            </div>

            {!isAdmin && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-blue-700">
                  As staff, you can view payment information but payments can only be processed by an administrator.
                </span>
              </div>
            )}

            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
              {sortedPurchases.slice(0, 5).map((purchase) => {
                const daysOverdue = getDaysOverdue(purchase.purchaseDate);
                return (
                  <div key={purchase.id} className="group relative">
                    <div className={`rounded-lg border p-3 transition-colors ${isAdmin ? 'hover:bg-gray-50 cursor-pointer' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium">{purchase.supplier.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {purchase.purchaseDate.toLocaleDateString()}
                            {purchase.invoiceNumber && (
                              <>
                                <span className="mx-1">•</span>
                                <span>Invoice #{purchase.invoiceNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(purchase.paymentStatus, daysOverdue)}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`h-4 w-4 ${daysOverdue > 30 ? 'text-red-500' : daysOverdue > 14 ? 'text-amber-500' : 'text-blue-500'}`} />
                          <span className="text-sm text-muted-foreground">
                            {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} since purchase
                          </span>
                        </div>
                        <div className="font-semibold">
                          Rs{(purchase.dueAmount || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                );
              })}
            </div>

            {unpaidPurchases.length > 5 && (
              <>
                <Separator className="my-3" />
                <div className="text-sm text-muted-foreground text-center">
                  {unpaidPurchases.length - 5} more payments due
                </div>
              </>
            )}

            <div className="mt-4">
              <Link href="/dashboard/purchases?filter=unpaid">
                <Button variant="outline" className="w-full">
                  {isAdmin ? "View All Due Payments" : "View All Due Payments (Read Only)"}
                </Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Wrap with withAuth HOC to enforce access control
export default withAuth(DuePaymentsDashboard);