// // import React from 'react';
// // import { Sale } from '@/types/sale';
// // import {
// //   Table,
// //   TableBody,
// //   TableCell,
// //   TableHead,
// //   TableHeader,
// //   TableRow,
// // } from "@/components/ui/table";
// // import { Button } from "@/components/ui/button";
// // import { Eye } from 'lucide-react';

// // interface SalesTableProps {
// //   sales: Sale[];
// //   onViewDetails: (sale: Sale) => void;
// // }

// // export function SalesTable({ sales, onViewDetails }: SalesTableProps) {
// //   const sortedSales = [...sales]
// //     .filter(sale => sale.items && sale.items.length > 0)
// //     .sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());

// //   // Calculate inventory totals
// //   const calculateInventoryTotals = (sale: Sale) => {
// //     const inventoryTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
// //     const inventoryCost = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
// //     return { total: inventoryTotal, cost: inventoryCost };
// //   };

// //   return (
// //     <div className="rounded-md border">
// //       {/* Fixed header */}
// //       <div className="border-b">
// //         <Table>
// //           <TableHeader>
// //             <TableRow>
// //               <TableHead className="w-[180px]">Date</TableHead>
// //               <TableHead className="w-[200px]">Customer</TableHead>
// //               <TableHead className="w-[100px]">Items</TableHead>
// //               <TableHead className="w-[120px]">Total Amount</TableHead>
// //               <TableHead className="w-[120px]">Profit</TableHead>
// //               <TableHead className="w-[60px]"></TableHead>
// //             </TableRow>
// //           </TableHeader>
// //         </Table>
// //       </div>

// //       {/* Scrollable body */}
// //       <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
// //         <Table>
// //           <TableBody>
// //             {sortedSales.map((sale) => {
// //               const { total, cost } = calculateInventoryTotals(sale);
// //               const profit = total - cost;

// //               return (
// //                 <TableRow key={sale.id}>
// //                   <TableCell className="w-[180px]">
// //                     {sale.saleDate.toLocaleDateString()}
// //                     <br />
// //                     <span className="text-sm text-muted-foreground">
// //                       {sale.saleDate.toLocaleTimeString()}
// //                     </span>
// //                   </TableCell>
// //                   <TableCell className="w-[200px]">
// //                     {sale.customer ? (
// //                       <div>
// //                         <p className="font-medium">{sale.customer.name}</p>
// //                         <p className="text-sm text-muted-foreground">
// //                           {sale.customer.mobile}
// //                         </p>
// //                       </div>
// //                     ) : (
// //                       <span className="text-muted-foreground">Walk-in Customer</span>
// //                     )}
// //                   </TableCell>
// //                   <TableCell className="w-[100px]">
// //                     <span className="font-medium">{sale.items.length} items</span>
// //                   </TableCell>
// //                   <TableCell className="w-[120px] font-medium">
// //                     Rs{total.toFixed(2)}
// //                   </TableCell>
// //                   <TableCell className="w-[120px]">
// //                     <span className="text-green-600 font-medium">
// //                       Rs{profit.toFixed(2)}
// //                     </span>
// //                   </TableCell>
// //                   <TableCell className="w-[60px]">
// //                     <Button
// //                       variant="ghost"
// //                       size="icon"
// //                       onClick={() => onViewDetails(sale)}
// //                     >
// //                       <Eye className="h-4 w-4" />
// //                     </Button>
// //                   </TableCell>
// //                 </TableRow>
// //               );
// //             })}
// //           </TableBody>
// //         </Table>
// //       </div>
// //     </div>
// //   );
// // }

// import React from 'react';
// import { Sale } from '@/types/sale';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { Eye, User } from 'lucide-react';
// import { Badge } from "@/components/ui/badge";

// interface SalesTableProps {
//   sales: Sale[];
//   onViewDetails: (sale: Sale) => void;
// }

// export function SalesTable({ sales, onViewDetails }: SalesTableProps) {
//   const sortedSales = [...sales]
//     .filter(sale => sale.items && sale.items.length > 0)
//     .sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());

//   // Calculate inventory totals
//   const calculateInventoryTotals = (sale: Sale) => {
//     const inventoryTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
//     const inventoryCost = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
//     return { total: inventoryTotal, cost: inventoryCost };
//   };

//   return (
//     <div className="rounded-md border">
//       {/* Fixed header */}
//       <div className="border-b">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead className="w-[180px]">Date</TableHead>
//               <TableHead className="w-[200px]">Customer</TableHead>
//               <TableHead className="w-[130px]">Created By</TableHead>
//               <TableHead className="w-[100px]">Items</TableHead>
//               <TableHead className="w-[120px]">Total Amount</TableHead>
//               <TableHead className="w-[120px]">Profit</TableHead>
//               <TableHead className="w-[60px]"></TableHead>
//             </TableRow>
//           </TableHeader>
//         </Table>
//       </div>

//       {/* Scrollable body */}
//       <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
//         <Table>
//           <TableBody>
//             {sortedSales.map((sale) => {
//               const { total, cost } = calculateInventoryTotals(sale);
//               const profit = total - cost;

//               return (
//                 <TableRow key={sale.id}>
//                   <TableCell className="w-[180px]">
//                     {sale.saleDate.toLocaleDateString()}
//                     <br />
//                     <span className="text-sm text-muted-foreground">
//                       {sale.saleDate.toLocaleTimeString()}
//                     </span>
//                   </TableCell>
//                   <TableCell className="w-[200px]">
//                     {sale.customer ? (
//                       <div>
//                         <p className="font-medium">{sale.customer.name}</p>
//                         <p className="text-sm text-muted-foreground">
//                           {sale.customer.mobile}
//                         </p>
//                       </div>
//                     ) : (
//                       <span className="text-muted-foreground">Walk-in Customer</span>
//                     )}
//                   </TableCell>
//                   <TableCell className="w-[130px]">
//                     {sale.createdBy ? (
//                       <div className="flex items-start gap-1">
//                         <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
//                           <User className="h-3.5 w-3.5 text-primary" />
//                         </div>
//                         <div>
//                           <p className="font-medium text-sm line-clamp-1">
//                             {sale.createdBy.displayName || 'Unknown'}
//                           </p>
//                           <Badge variant="outline" className="text-xs mt-1 font-normal">
//                             {sale.createdBy.role || 'staff'}
//                           </Badge>
//                         </div>
//                       </div>
//                     ) : (
//                       <span className="text-muted-foreground text-sm">Unknown</span>
//                     )}
//                   </TableCell>
//                   <TableCell className="w-[100px]">
//                     <span className="font-medium">{sale.items.length} items</span>
//                   </TableCell>
//                   <TableCell className="w-[120px] font-medium">
//                     Rs{total.toFixed(2)}
//                   </TableCell>
//                   <TableCell className="w-[120px]">
//                     <span className="text-green-600 font-medium">
//                       Rs{profit.toFixed(2)}
//                     </span>
//                   </TableCell>
//                   <TableCell className="w-[60px]">
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       onClick={() => onViewDetails(sale)}
//                     >
//                       <Eye className="h-4 w-4" />
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               );
//             })}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// }

// src/app/dashboard/viewSales/SalesTable.tsx
import React from 'react';
import { Sale } from '@/types/sale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, User, Plane } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface SalesTableProps {
  sales: Sale[];
  onViewDetails: (sale: Sale) => void;
}

export function SalesTable({ sales, onViewDetails }: SalesTableProps) {
  const sortedSales = [...sales]
    .filter(sale => sale.items && sale.items.length > 0)
    .sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());

  // Calculate inventory totals
  const calculateInventoryTotals = (sale: Sale) => {
    const inventoryTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const inventoryCost = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
    return { total: inventoryTotal, cost: inventoryCost, profit: inventoryTotal - inventoryCost };
  };

  return (
    <div className="rounded-md border">
      {/* Fixed header */}
      <div className="border-b">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Patient Type</TableHead>
              <TableHead className="w-[180px]">Date</TableHead>
              <TableHead className="w-[200px]">Customer</TableHead>
              <TableHead className="w-[130px]">Created By</TableHead>
              <TableHead className="w-[100px]">Items</TableHead>
              <TableHead className="w-[120px]">Total Amount</TableHead>
              <TableHead className="w-[120px]">Profit</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Scrollable body */}
      <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
        <Table>
          <TableBody>
            {sortedSales.map((sale) => {
              const { total, cost, profit } = calculateInventoryTotals(sale);
              const patientType = sale.patientType || 'local'; // Default to local if not specified
              
              // Calculate profit margin percentage
              const profitMargin = total > 0 ? (profit / total) * 100 : 0;

              return (
                <TableRow key={sale.id}>
                  <TableCell className="w-[100px]">
                    {patientType === 'local' ? (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        <User className="h-3 w-3 mr-1" />
                        Local
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        <Plane className="h-3 w-3 mr-1" />
                        Foreign
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="w-[180px]">
                    {sale.saleDate.toLocaleDateString()}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      {sale.saleDate.toLocaleTimeString()}
                    </span>
                  </TableCell>
                  <TableCell className="w-[200px]">
                    {sale.customer ? (
                      <div>
                        <p className="font-medium">{sale.customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.customer.mobile}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Walk-in Customer</span>
                    )}
                  </TableCell>
                  <TableCell className="w-[130px]">
                    {sale.createdBy ? (
                      <div className="flex items-start gap-1">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">
                            {sale.createdBy.displayName || 'Unknown'}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1 font-normal">
                            {sale.createdBy.role || 'staff'}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell className="w-[100px]">
                    <span className="font-medium">{sale.items.length} items</span>
                  </TableCell>
                  <TableCell className="w-[120px] font-medium">
                    Rs{total.toFixed(2)}
                  </TableCell>
                  <TableCell className="w-[120px]">
                    <div>
                      <span className="text-green-600 font-medium">
                        Rs{profit.toFixed(2)}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {profitMargin.toFixed(1)}% margin
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-[60px]">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewDetails(sale)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}