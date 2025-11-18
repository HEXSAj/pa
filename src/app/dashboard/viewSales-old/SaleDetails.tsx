

// // // Updated SaleDetails component with creator information
// // import React, { useState } from 'react';
// // import { Sale } from '@/types/sale';
// // import { CustomerSelector } from './CustomerSelector';
// // import { Customer } from '@/types/customer';
// // import { saleService } from '@/services/saleService';
// // import { format } from 'date-fns';
// // import { Calendar, User, Package, DollarSign, Loader2 } from 'lucide-react';
// // import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Badge } from "@/components/ui/badge";

// // interface SaleDetailsProps {
// //   sale: Sale;
// //   onClose: () => void;
// //   onUpdate: () => void;
// // }

// // export function SaleDetails({ sale, onClose, onUpdate }: SaleDetailsProps) {
// //   if (!sale.items || sale.items.length === 0) {
// //     return null;
// //   }

// //   const [editing, setEditing] = useState(false);
// //   const [loading, setLoading] = useState(false);
// //   const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(
// //     sale.customer
// //   );

// //   const handleUpdateCustomer = async () => {
// //     if (!selectedCustomer) return;
    
// //     setLoading(true);
// //     try {
// //       await saleService.updateSaleCustomer(sale.id!, selectedCustomer);
// //       onUpdate();
// //       setEditing(false);
// //     } catch (error) {
// //       console.error('Error updating sale:', error);
// //       alert('Error updating sale customer');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Calculate totals from inventory items only
// //   const inventoryTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
// //   const inventoryCost = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
// //   const profit = inventoryTotal - inventoryCost;

// //   return (
// //     <div className="flex flex-col h-[85vh]">
// //       {/* Header */}
// //       <div className="shrink-0 flex justify-between items-start border-b p-4 bg-background">
// //         <div className="space-y-1">
// //           <h2 className="text-xl font-semibold">Sale #{sale.id?.slice(-6)}</h2>
// //           <div className="flex items-center text-muted-foreground gap-2">
// //             <Calendar className="h-4 w-4" />
// //             <span>{format(sale.saleDate, 'PPpp')}</span>
// //           </div>
// //         </div>
// //         <div className="text-right">
// //           <p className="text-2xl font-bold">Rs{inventoryTotal.toFixed(2)}</p>
// //           <p className="text-sm text-muted-foreground">
// //             Profit: Rs{profit.toFixed(2)}
// //           </p>
// //         </div>
// //       </div>

// //       {/* Scrollable Content */}
// //       <div className="flex-1 overflow-y-auto">
// //         <div className="space-y-6 p-4">
// //           {/* Creator Information */}
// //           {sale.createdBy && (
// //             <Card>
// //               <CardHeader>
// //                 <div className="flex items-center gap-2">
// //                   <User className="h-5 w-5" />
// //                   <CardTitle>Sale Created By</CardTitle>
// //                 </div>
// //               </CardHeader>
// //               <CardContent>
// //                 <div className="flex items-center space-x-3">
// //                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
// //                     <span className="text-lg font-bold text-primary">
// //                       {sale.createdBy.displayName?.charAt(0).toUpperCase() || 
// //                        sale.createdBy.email?.charAt(0).toUpperCase() || 'U'}
// //                     </span>
// //                   </div>
// //                   <div>
// //                     <p className="font-medium text-lg">{sale.createdBy.displayName || 'Unknown'}</p>
// //                     <div className="flex items-center space-x-2 mt-1">
// //                       <Badge variant="outline" className="capitalize">{sale.createdBy.role || 'staff'}</Badge>
// //                       <span className="text-sm text-muted-foreground">{sale.createdBy.email}</span>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           )}

// //           {/* Customer Information */}
// //           <Card>
// //             <CardHeader>
// //               <div className="flex items-center gap-2">
// //                 <User className="h-5 w-5" />
// //                 <CardTitle>Customer Information</CardTitle>
// //               </div>
// //             </CardHeader>
// //             <CardContent>
// //               {editing ? (
// //                 <div className="space-y-4">
// //                   <CustomerSelector
// //                     selectedCustomer={selectedCustomer}
// //                     onSelectCustomer={setSelectedCustomer}
// //                   />
// //                   <div className="flex justify-end gap-2">
// //                     <Button
// //                       variant="outline"
// //                       onClick={() => {
// //                         setEditing(false);
// //                         setSelectedCustomer(sale.customer);
// //                       }}
// //                       disabled={loading}
// //                     >
// //                       Cancel
// //                     </Button>
// //                     <Button
// //                       onClick={handleUpdateCustomer}
// //                       disabled={loading || !selectedCustomer}
// //                     >
// //                       {loading ? (
// //                         <>
// //                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
// //                           Updating...
// //                         </>
// //                       ) : (
// //                         'Update Customer'
// //                       )}
// //                     </Button>
// //                   </div>
// //                 </div>
// //               ) : (
// //                 <div className="flex justify-between items-start">
// //                   <div>
// //                     {sale.customer ? (
// //                       <>
// //                         <p className="font-medium">{sale.customer.name}</p>
// //                         <p className="text-sm text-muted-foreground">
// //                           {sale.customer.mobile}
// //                         </p>
// //                         {sale.customer.address && (
// //                           <p className="text-sm text-muted-foreground">
// //                             {sale.customer.address}
// //                           </p>
// //                         )}
// //                       </>
// //                     ) : (
// //                       <p className="text-muted-foreground">Walk-in Customer</p>
// //                     )}
// //                   </div>
// //                   <Button
// //                     variant="outline"
// //                     onClick={() => setEditing(true)}
// //                   >
// //                     Edit Customer
// //                   </Button>
// //                 </div>
// //               )}
// //             </CardContent>
// //           </Card>

// //           {/* Inventory Items */}
// //           <Card>
// //             <CardHeader>
// //               <div className="flex items-center gap-2">
// //                 <Package className="h-5 w-5" />
// //                 <CardTitle>Inventory Items</CardTitle>
// //               </div>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="space-y-4">
// //                 {sale.items.map((item, index) => (
// //                   <div
// //                     key={index}
// //                     className="flex justify-between items-start p-4 rounded-lg border"
// //                   >
// //                     <div>
// //                       <p className="font-medium">{item.item.name}</p>
// //                       <p className="text-sm text-muted-foreground">
// //                         {item.item.code}
// //                       </p>
// //                       <div className="mt-2">
// //                         <Badge variant="secondary">
// //                           Batch #{item.batch.batchNumber}
// //                         </Badge>
// //                       </div>
// //                     </div>
// //                     <div className="text-right">
// //                       <p className="font-medium">Rs{item.totalPrice.toFixed(2)}</p>
// //                       <div className="space-y-1 mt-2 text-sm text-muted-foreground">
// //                         {item.unitQuantity > 0 && (
// //                           <p>{item.unitQuantity} units</p>
// //                         )}
// //                         {item.subUnitQuantity > 0 && item.item.unitContains && (
// //                           <p>
// //                             {item.subUnitQuantity} {item.item.unitContains.unit}
// //                           </p>
// //                         )}
// //                       </div>
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             </CardContent>
// //           </Card>

// //           {/* Summary */}
// //           <Card>
// //             <CardHeader>
// //               <div className="flex items-center gap-2">
// //                 <DollarSign className="h-5 w-5" />
// //                 <CardTitle>Summary</CardTitle>
// //               </div>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="space-y-2">
// //                 <div className="flex justify-between">
// //                   <span className="text-muted-foreground">Total Amount</span>
// //                   <span className="font-medium">Rs{inventoryTotal.toFixed(2)}</span>
// //                 </div>
// //                 <div className="flex justify-between">
// //                   <span className="text-muted-foreground">Total Cost</span>
// //                   <span className="font-medium">Rs{inventoryCost.toFixed(2)}</span>
// //                 </div>
// //                 <div className="flex justify-between pt-2 border-t">
// //                   <span className="font-medium">Profit</span>
// //                   <span className="font-bold text-green-600">
// //                     Rs{profit.toFixed(2)}
// //                   </span>
// //                 </div>
// //               </div>
// //             </CardContent>
// //           </Card>
// //         </div>
// //       </div>

// //       {/* Footer */}
// //       <div className="shrink-0 border-t p-4 bg-background">
// //         <div className="flex justify-end">
// //           <Button variant="outline" onClick={onClose}>
// //             Close
// //           </Button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // Updated SaleDetails component with edit functionality
// // import React, { useState } from 'react';
// // import { Sale } from '@/types/sale';
// // import { CustomerSelector } from './CustomerSelector';
// // import { Customer } from '@/types/customer';
// // import { saleService } from '@/services/saleService';
// // import { format } from 'date-fns';
// // import { Calendar, User, Package, DollarSign, Loader2, Edit } from 'lucide-react';
// // import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Badge } from "@/components/ui/badge";
// // import { SaleEditDialog } from './SaleEditDialog';

// // interface SaleDetailsProps {
// //   sale: Sale;
// //   onClose: () => void;
// //   onUpdate: () => void;
// // }

// // export function SaleDetails({ sale, onClose, onUpdate }: SaleDetailsProps) {
// //   if (!sale.items || sale.items.length === 0) {
// //     return null;
// //   }

// //   const [editing, setEditing] = useState(false);
// //   const [loading, setLoading] = useState(false);
// //   const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(
// //     sale.customer
// //   );
// //   const [showEditDialog, setShowEditDialog] = useState(false);

// //   const handleUpdateCustomer = async () => {
// //     if (!selectedCustomer) return;
    
// //     setLoading(true);
// //     try {
// //       await saleService.updateSaleCustomer(sale.id!, selectedCustomer);
// //       onUpdate();
// //       setEditing(false);
// //     } catch (error) {
// //       console.error('Error updating sale:', error);
// //       alert('Error updating sale customer');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Calculate totals from inventory items only
// //   const inventoryTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
// //   const inventoryCost = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
// //   const profit = inventoryTotal - inventoryCost;

// //   const handleEditSale = () => {
// //     setShowEditDialog(true);
// //   };

// //   const handleSaleEdited = () => {
// //     setShowEditDialog(false);
// //     onUpdate();
// //   };

// //   return (
// //     <div className="flex flex-col h-[85vh]">
// //       {/* Header */}
// //       <div className="shrink-0 flex justify-between items-start border-b p-4 bg-background">
// //         <div className="space-y-1">
// //           <h2 className="text-xl font-semibold">Sale #{sale.id?.slice(-6)}</h2>
// //           <div className="flex items-center text-muted-foreground gap-2">
// //             <Calendar className="h-4 w-4" />
// //             <span>{format(sale.saleDate, 'PPpp')}</span>
// //           </div>
// //         </div>
// //         <div className="text-right">
// //           <p className="text-2xl font-bold">Rs{inventoryTotal.toFixed(2)}</p>
// //           <p className="text-sm text-muted-foreground">
// //             Profit: Rs{profit.toFixed(2)}
// //           </p>
// //         </div>
// //       </div>

// //       {/* Scrollable Content */}
// //       <div className="flex-1 overflow-y-auto">
// //         <div className="space-y-6 p-4">
// //           {/* Creator Information */}
// //           {sale.createdBy && (
// //             <Card>
// //               <CardHeader>
// //                 <div className="flex items-center gap-2">
// //                   <User className="h-5 w-5" />
// //                   <CardTitle>Sale Created By</CardTitle>
// //                 </div>
// //               </CardHeader>
// //               <CardContent>
// //                 <div className="flex items-center space-x-3">
// //                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
// //                     <span className="text-lg font-bold text-primary">
// //                       {sale.createdBy.displayName?.charAt(0).toUpperCase() || 
// //                        sale.createdBy.email?.charAt(0).toUpperCase() || 'U'}
// //                     </span>
// //                   </div>
// //                   <div>
// //                     <p className="font-medium text-lg">{sale.createdBy.displayName || 'Unknown'}</p>
// //                     <div className="flex items-center space-x-2 mt-1">
// //                       <Badge variant="outline" className="capitalize">{sale.createdBy.role || 'staff'}</Badge>
// //                       <span className="text-sm text-muted-foreground">{sale.createdBy.email}</span>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           )}

// //           {/* Customer Information */}
// //           <Card>
// //             <CardHeader>
// //               <div className="flex items-center gap-2">
// //                 <User className="h-5 w-5" />
// //                 <CardTitle>Customer Information</CardTitle>
// //               </div>
// //             </CardHeader>
// //             <CardContent>
// //               {editing ? (
// //                 <div className="space-y-4">
// //                   <CustomerSelector
// //                     selectedCustomer={selectedCustomer}
// //                     onSelectCustomer={setSelectedCustomer}
// //                   />
// //                   <div className="flex justify-end gap-2">
// //                     <Button
// //                       variant="outline"
// //                       onClick={() => {
// //                         setEditing(false);
// //                         setSelectedCustomer(sale.customer);
// //                       }}
// //                       disabled={loading}
// //                     >
// //                       Cancel
// //                     </Button>
// //                     <Button
// //                       onClick={handleUpdateCustomer}
// //                       disabled={loading || !selectedCustomer}
// //                     >
// //                       {loading ? (
// //                         <>
// //                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
// //                           Updating...
// //                         </>
// //                       ) : (
// //                         'Update Customer'
// //                       )}
// //                     </Button>
// //                   </div>
// //                 </div>
// //               ) : (
// //                 <div className="flex justify-between items-start">
// //                   <div>
// //                     {sale.customer ? (
// //                       <>
// //                         <p className="font-medium">{sale.customer.name}</p>
// //                         <p className="text-sm text-muted-foreground">
// //                           {sale.customer.mobile}
// //                         </p>
// //                         {sale.customer.address && (
// //                           <p className="text-sm text-muted-foreground">
// //                             {sale.customer.address}
// //                           </p>
// //                         )}
// //                       </>
// //                     ) : (
// //                       <p className="text-muted-foreground">Walk-in Customer</p>
// //                     )}
// //                   </div>
// //                   <Button
// //                     variant="outline"
// //                     onClick={() => setEditing(true)}
// //                   >
// //                     Edit Customer
// //                   </Button>
// //                 </div>
// //               )}
// //             </CardContent>
// //           </Card>

// //           {/* Inventory Items */}
// //           <Card>
// //             <CardHeader>
// //               <div className="flex items-center justify-between">
// //                 <div className="flex items-center gap-2">
// //                   <Package className="h-5 w-5" />
// //                   <CardTitle>Inventory Items</CardTitle>
// //                 </div>
// //                 <Button 
// //                   variant="outline" 
// //                   size="sm"
// //                   onClick={handleEditSale}
// //                 >
// //                   <Edit className="h-4 w-4 mr-2" />
// //                   Edit Items
// //                 </Button>
// //               </div>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="space-y-4">
// //                 {sale.items.map((item, index) => (
// //                   <div
// //                     key={index}
// //                     className="flex justify-between items-start p-4 rounded-lg border"
// //                   >
// //                     <div>
// //                       <p className="font-medium">{item.item.name}</p>
// //                       <p className="text-sm text-muted-foreground">
// //                         {item.item.code}
// //                       </p>
// //                       <div className="mt-2">
// //                         <Badge variant="secondary">
// //                           Batch #{item.batch.batchNumber}
// //                         </Badge>
// //                       </div>
// //                     </div>
// //                     <div className="text-right">
// //                       <p className="font-medium">Rs{item.totalPrice.toFixed(2)}</p>
// //                       <div className="space-y-1 mt-2 text-sm text-muted-foreground">
// //                         {item.unitQuantity > 0 && (
// //                           <p>{item.unitQuantity} units</p>
// //                         )}
// //                         {item.subUnitQuantity > 0 && item.item.unitContains && (
// //                           <p>
// //                             {item.subUnitQuantity} {item.item.unitContains.unit}
// //                           </p>
// //                         )}
// //                       </div>
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             </CardContent>
// //           </Card>

// //           {/* Summary */}
// //           <Card>
// //             <CardHeader>
// //               <div className="flex items-center gap-2">
// //                 <DollarSign className="h-5 w-5" />
// //                 <CardTitle>Summary</CardTitle>
// //               </div>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="space-y-2">
// //                 <div className="flex justify-between">
// //                   <span className="text-muted-foreground">Total Amount</span>
// //                   <span className="font-medium">Rs{inventoryTotal.toFixed(2)}</span>
// //                 </div>
// //                 <div className="flex justify-between">
// //                   <span className="text-muted-foreground">Total Cost</span>
// //                   <span className="font-medium">Rs{inventoryCost.toFixed(2)}</span>
// //                 </div>
// //                 <div className="flex justify-between pt-2 border-t">
// //                   <span className="font-medium">Profit</span>
// //                   <span className="font-bold text-green-600">
// //                     Rs{profit.toFixed(2)}
// //                   </span>
// //                 </div>
// //               </div>
// //             </CardContent>
// //           </Card>
// //         </div>
// //       </div>

// //       {/* Footer */}
// //       <div className="shrink-0 border-t p-4 bg-background">
// //         <div className="flex justify-end">
// //           <Button variant="outline" onClick={onClose}>
// //             Close
// //           </Button>
// //         </div>
// //       </div>

// //       {/* Sale Edit Dialog */}
// //       {showEditDialog && (
// //         <SaleEditDialog
// //           sale={sale}
// //           isOpen={showEditDialog}
// //           onClose={() => setShowEditDialog(false)}
// //           onSaleUpdated={handleSaleEdited}
// //         />
// //       )}
// //     </div>
// //   );
// // }

// // // Updated SaleDetails component with edit functionality
// // import React, { useState } from 'react';
// // import { Sale } from '@/types/sale';
// // import { CustomerSelector } from './CustomerSelector';
// // import { Customer } from '@/types/customer';
// // import { saleService } from '@/services/saleService';
// // import { format } from 'date-fns';
// // import { Calendar, User, Package, DollarSign, Loader2, Edit } from 'lucide-react';
// // import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Badge } from "@/components/ui/badge";
// // import { SaleEditDialog } from './SaleEditDialog';

// // interface SaleDetailsProps {
// //   sale: Sale;
// //   onClose: () => void;
// //   onUpdate: () => void;
// // }

// // export function SaleDetails({ sale, onClose, onUpdate }: SaleDetailsProps) {
// //   if (!sale.items || sale.items.length === 0) {
// //     return null;
// //   }

// //   const [editing, setEditing] = useState(false);
// //   const [loading, setLoading] = useState(false);
// //   const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(
// //     sale.customer
// //   );
// //   const [showEditDialog, setShowEditDialog] = useState(false);

// //   const handleUpdateCustomer = async () => {
// //     if (!selectedCustomer) return;
    
// //     setLoading(true);
// //     try {
// //       await saleService.updateSaleCustomer(sale.id!, selectedCustomer);
// //       onUpdate();
// //       setEditing(false);
// //     } catch (error) {
// //       console.error('Error updating sale:', error);
// //       alert('Error updating sale customer');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Calculate totals from inventory items only
// //   const inventoryTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
// //   const inventoryCost = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
// //   const profit = inventoryTotal - inventoryCost;

// //   const handleEditSale = () => {
// //     setShowEditDialog(true);
// //   };

// //   const handleSaleEdited = () => {
// //     setShowEditDialog(false);
// //     onUpdate();
// //   };

// //   return (
// //     <div className="flex flex-col h-[85vh]">
// //       {/* Header */}
// //       <div className="shrink-0 flex justify-between items-start border-b p-4 bg-background">
// //         <div className="space-y-1">
// //           <h2 className="text-xl font-semibold">Sale #{sale.id?.slice(-6)}</h2>
// //           <div className="flex items-center text-muted-foreground gap-2">
// //             <Calendar className="h-4 w-4" />
// //             <span>{format(sale.saleDate, 'PPpp')}</span>
// //           </div>
// //         </div>
// //         <div className="text-right">
// //           <p className="text-2xl font-bold">Rs{inventoryTotal.toFixed(2)}</p>
// //           <p className="text-sm text-muted-foreground">
// //             Profit: Rs{profit.toFixed(2)}
// //           </p>
// //         </div>
// //       </div>

// //       {/* Scrollable Content */}
// //       <div className="flex-1 overflow-y-auto">
// //         <div className="space-y-6 p-4">
// //           {/* Creator Information */}
// //           {sale.createdBy && (
// //             <Card>
// //               <CardHeader>
// //                 <div className="flex items-center gap-2">
// //                   <User className="h-5 w-5" />
// //                   <CardTitle>Sale Created By</CardTitle>
// //                 </div>
// //               </CardHeader>
// //               <CardContent>
// //                 <div className="flex items-center space-x-3">
// //                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
// //                     <span className="text-lg font-bold text-primary">
// //                       {sale.createdBy.displayName?.charAt(0).toUpperCase() || 
// //                        sale.createdBy.email?.charAt(0).toUpperCase() || 'U'}
// //                     </span>
// //                   </div>
// //                   <div>
// //                     <p className="font-medium text-lg">{sale.createdBy.displayName || 'Unknown'}</p>
// //                     <div className="flex items-center space-x-2 mt-1">
// //                       <Badge variant="outline" className="capitalize">{sale.createdBy.role || 'staff'}</Badge>
// //                       <span className="text-sm text-muted-foreground">{sale.createdBy.email}</span>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           )}

// //           {/* Customer Information */}
// //           <Card>
// //             <CardHeader>
// //               <div className="flex items-center gap-2">
// //                 <User className="h-5 w-5" />
// //                 <CardTitle>Customer Information</CardTitle>
// //               </div>
// //             </CardHeader>
// //             <CardContent>
// //               {editing ? (
// //                 <div className="space-y-4">
// //                   <CustomerSelector
// //                     selectedCustomer={selectedCustomer}
// //                     onSelectCustomer={setSelectedCustomer}
// //                   />
// //                   <div className="flex justify-end gap-2">
// //                     <Button
// //                       variant="outline"
// //                       onClick={() => {
// //                         setEditing(false);
// //                         setSelectedCustomer(sale.customer);
// //                       }}
// //                       disabled={loading}
// //                     >
// //                       Cancel
// //                     </Button>
// //                     <Button
// //                       onClick={handleUpdateCustomer}
// //                       disabled={loading || !selectedCustomer}
// //                     >
// //                       {loading ? (
// //                         <>
// //                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
// //                           Updating...
// //                         </>
// //                       ) : (
// //                         'Update Customer'
// //                       )}
// //                     </Button>
// //                   </div>
// //                 </div>
// //               ) : (
// //                 <div className="flex justify-between items-start">
// //                   <div>
// //                     {sale.customer ? (
// //                       <>
// //                         <p className="font-medium">{sale.customer.name}</p>
// //                         <p className="text-sm text-muted-foreground">
// //                           {sale.customer.mobile}
// //                         </p>
// //                         {sale.customer.address && (
// //                           <p className="text-sm text-muted-foreground">
// //                             {sale.customer.address}
// //                           </p>
// //                         )}
// //                       </>
// //                     ) : (
// //                       <p className="text-muted-foreground">Walk-in Customer</p>
// //                     )}
// //                   </div>
// //                   <Button
// //                     variant="outline"
// //                     onClick={() => setEditing(true)}
// //                   >
// //                     Edit Customer
// //                   </Button>
// //                 </div>
// //               )}
// //             </CardContent>
// //           </Card>

// //           {/* Inventory Items */}
// //           <Card>
// //             <CardHeader>
// //               <div className="flex items-center justify-between">
// //                 <div className="flex items-center gap-2">
// //                   <Package className="h-5 w-5" />
// //                   <CardTitle>Inventory Items</CardTitle>
// //                 </div>
// //                 <Button 
// //                   variant="outline" 
// //                   size="sm"
// //                   onClick={handleEditSale}
// //                 >
// //                   <Edit className="h-4 w-4 mr-2" />
// //                   Edit Items
// //                 </Button>
// //               </div>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="space-y-4">
// //                 {sale.items.map((item, index) => (
// //                   <div
// //                     key={index}
// //                     className="flex justify-between items-start p-4 rounded-lg border"
// //                   >
// //                     <div>
// //                       <p className="font-medium">{item.item.name}</p>
// //                       <p className="text-sm text-muted-foreground">
// //                         {item.item.code}
// //                       </p>
// //                       <div className="mt-2">
// //                         <Badge variant="secondary">
// //                           Batch #{item.batch.batchNumber}
// //                         </Badge>
// //                       </div>
// //                     </div>
// //                     <div className="text-right">
// //                       <p className="font-medium">Rs{item.totalPrice.toFixed(2)}</p>
// //                       <div className="space-y-1 mt-2 text-sm text-muted-foreground">
// //                         {item.unitQuantity > 0 && (
// //                           <p>{item.unitQuantity} units</p>
// //                         )}
// //                         {item.subUnitQuantity > 0 && item.item.unitContains && (
// //                           <p>
// //                             {item.subUnitQuantity} {item.item.unitContains.unit}
// //                           </p>
// //                         )}
// //                       </div>
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             </CardContent>
// //           </Card>

// //           {/* Summary */}
// //           <Card>
// //             <CardHeader>
// //               <div className="flex items-center gap-2">
// //                 <DollarSign className="h-5 w-5" />
// //                 <CardTitle>Summary</CardTitle>
// //               </div>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="space-y-2">
// //                 <div className="flex justify-between">
// //                   <span className="text-muted-foreground">Total Amount</span>
// //                   <span className="font-medium">Rs{inventoryTotal.toFixed(2)}</span>
// //                 </div>
// //                 <div className="flex justify-between">
// //                   <span className="text-muted-foreground">Total Cost</span>
// //                   <span className="font-medium">Rs{inventoryCost.toFixed(2)}</span>
// //                 </div>
// //                 <div className="flex justify-between pt-2 border-t">
// //                   <span className="font-medium">Profit</span>
// //                   <span className="font-bold text-green-600">
// //                     Rs{profit.toFixed(2)}
// //                   </span>
// //                 </div>
// //               </div>
// //             </CardContent>
// //           </Card>
// //         </div>
// //       </div>

// //       {/* Footer */}
// //       <div className="shrink-0 border-t p-4 bg-background">
// //         <div className="flex justify-end">
// //           <Button variant="outline" onClick={onClose}>
// //             Close
// //           </Button>
// //         </div>
// //       </div>

// //       {/* Sale Edit Dialog */}
// //       {showEditDialog && (
// //         <SaleEditDialog
// //           sale={sale}
// //           isOpen={showEditDialog}
// //           onClose={() => setShowEditDialog(false)}
// //           onSaleUpdated={handleSaleEdited}
// //         />
// //       )}
// //     </div>
// //   );
// // }

// // // Updated SaleDetails component with edit functionality
// // import React, { useState } from 'react';
// // import { Sale } from '@/types/sale';
// // import { CustomerSelector } from './CustomerSelector';
// // import { Customer } from '@/types/customer';
// // import { saleService } from '@/services/saleService';
// // import { format } from 'date-fns';
// // import { Calendar, User, Package, DollarSign, Loader2, Edit } from 'lucide-react';
// // import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Button } from "@/components/ui/button";
// // import { Badge } from "@/components/ui/badge";
// // import { SaleEditDialog } from './SaleEditDialog';
// // import { toast } from "sonner";

// // interface SaleDetailsProps {
// //   sale: Sale;
// //   onClose: () => void;
// //   onUpdate: () => void;
// // }

// // export function SaleDetails({ sale, onClose, onUpdate }: SaleDetailsProps) {
// //   // Ensure the sale has items before rendering
// //   if (!sale.items || sale.items.length === 0) {
// //     return null;
// //   }

// //   const [editing, setEditing] = useState(false);
// //   const [loading, setLoading] = useState(false);
// //   const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(
// //     sale.customer
// //   );
// //   const [showEditDialog, setShowEditDialog] = useState(false);

// //   const handleUpdateCustomer = async () => {
// //     if (!selectedCustomer) return;
    
// //     setLoading(true);
// //     try {
// //       await saleService.updateSaleCustomer(sale.id!, selectedCustomer);
// //       onUpdate();
// //       setEditing(false);
// //     } catch (error) {
// //       console.error('Error updating sale:', error);
// //       alert('Error updating sale customer');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Calculate totals from inventory items only
// //   const inventoryTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
// //   const inventoryCost = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
// //   const profit = inventoryTotal - inventoryCost;

// //   const handleEditSale = () => {
// //     // Validate that the sale has items before attempting to edit
// //     if (!sale.items || sale.items.length === 0) {
// //       toast.error('Cannot edit a sale with no items');
// //       return;
// //     }
    
// //     // Check if we have all the required data
// //     const missingData = sale.items.some(item => 
// //       !item.item || !item.item.id || !item.batch || !item.batch.id
// //     );
    
// //     if (missingData) {
// //       toast.error('Some sale item data is incomplete. Please refresh the page and try again.');
// //       return;
// //     }
    
// //     setShowEditDialog(true);
// //   };

// //   const handleSaleEdited = () => {
// //     setShowEditDialog(false);
// //     onUpdate();
// //   };

// //   return (
// //     <div className="flex flex-col h-[85vh]">
// //       {/* Header */}
// //       <div className="shrink-0 flex justify-between items-start border-b p-4 bg-background">
// //         <div className="space-y-1">
// //           <h2 className="text-xl font-semibold">Sale #{sale.id?.slice(-6)}</h2>
// //           <div className="flex items-center text-muted-foreground gap-2">
// //             <Calendar className="h-4 w-4" />
// //             <span>{format(sale.saleDate, 'PPpp')}</span>
// //           </div>
// //         </div>
// //         <div className="text-right">
// //           <p className="text-2xl font-bold">Rs{inventoryTotal.toFixed(2)}</p>
// //           <p className="text-sm text-muted-foreground">
// //             Profit: Rs{profit.toFixed(2)}
// //           </p>
// //         </div>
// //       </div>

// //       {/* Scrollable Content */}
// //       <div className="flex-1 overflow-y-auto">
// //         <div className="space-y-6 p-4">
// //           {/* Creator Information */}
// //           {sale.createdBy && (
// //             <Card>
// //               <CardHeader>
// //                 <div className="flex items-center gap-2">
// //                   <User className="h-5 w-5" />
// //                   <CardTitle>Sale Created By</CardTitle>
// //                 </div>
// //               </CardHeader>
// //               <CardContent>
// //                 <div className="flex items-center space-x-3">
// //                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
// //                     <span className="text-lg font-bold text-primary">
// //                       {sale.createdBy.displayName?.charAt(0).toUpperCase() || 
// //                        sale.createdBy.email?.charAt(0).toUpperCase() || 'U'}
// //                     </span>
// //                   </div>
// //                   <div>
// //                     <p className="font-medium text-lg">{sale.createdBy.displayName || 'Unknown'}</p>
// //                     <div className="flex items-center space-x-2 mt-1">
// //                       <Badge variant="outline" className="capitalize">{sale.createdBy.role || 'staff'}</Badge>
// //                       <span className="text-sm text-muted-foreground">{sale.createdBy.email}</span>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           )}

// //           {/* Customer Information */}
// //           <Card>
// //             <CardHeader>
// //               <div className="flex items-center gap-2">
// //                 <User className="h-5 w-5" />
// //                 <CardTitle>Customer Information</CardTitle>
// //               </div>
// //             </CardHeader>
// //             <CardContent>
// //               {editing ? (
// //                 <div className="space-y-4">
// //                   <CustomerSelector
// //                     selectedCustomer={selectedCustomer}
// //                     onSelectCustomer={setSelectedCustomer}
// //                   />
// //                   <div className="flex justify-end gap-2">
// //                     <Button
// //                       variant="outline"
// //                       onClick={() => {
// //                         setEditing(false);
// //                         setSelectedCustomer(sale.customer);
// //                       }}
// //                       disabled={loading}
// //                     >
// //                       Cancel
// //                     </Button>
// //                     <Button
// //                       onClick={handleUpdateCustomer}
// //                       disabled={loading || !selectedCustomer}
// //                     >
// //                       {loading ? (
// //                         <>
// //                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
// //                           Updating...
// //                         </>
// //                       ) : (
// //                         'Update Customer'
// //                       )}
// //                     </Button>
// //                   </div>
// //                 </div>
// //               ) : (
// //                 <div className="flex justify-between items-start">
// //                   <div>
// //                     {sale.customer ? (
// //                       <>
// //                         <p className="font-medium">{sale.customer.name}</p>
// //                         <p className="text-sm text-muted-foreground">
// //                           {sale.customer.mobile}
// //                         </p>
// //                         {sale.customer.address && (
// //                           <p className="text-sm text-muted-foreground">
// //                             {sale.customer.address}
// //                           </p>
// //                         )}
// //                       </>
// //                     ) : (
// //                       <p className="text-muted-foreground">Walk-in Customer</p>
// //                     )}
// //                   </div>
// //                   <Button
// //                     variant="outline"
// //                     onClick={() => setEditing(true)}
// //                   >
// //                     Edit Customer
// //                   </Button>
// //                 </div>
// //               )}
// //             </CardContent>
// //           </Card>

// //           {/* Inventory Items */}
// //           <Card>
// //             <CardHeader>
// //               <div className="flex items-center justify-between">
// //                 <div className="flex items-center gap-2">
// //                   <Package className="h-5 w-5" />
// //                   <CardTitle>Inventory Items</CardTitle>
// //                 </div>
// //                 <Button 
// //                   variant="outline" 
// //                   size="sm"
// //                   onClick={handleEditSale}
// //                 >
// //                   <Edit className="h-4 w-4 mr-2" />
// //                   Edit Items
// //                 </Button>
// //               </div>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="space-y-4">
// //                 {sale.items.map((item, index) => (
// //                   <div
// //                     key={index}
// //                     className="flex justify-between items-start p-4 rounded-lg border"
// //                   >
// //                     <div>
// //                       <p className="font-medium">{item.item.name}</p>
// //                       <p className="text-sm text-muted-foreground">
// //                         {item.item.code}
// //                       </p>
// //                       <div className="mt-2">
// //                         <Badge variant="secondary">
// //                           Batch #{item.batch.batchNumber}
// //                         </Badge>
// //                       </div>
// //                     </div>
// //                     <div className="text-right">
// //                       <p className="font-medium">Rs{item.totalPrice.toFixed(2)}</p>
// //                       <div className="space-y-1 mt-2 text-sm text-muted-foreground">
// //                         {item.unitQuantity > 0 && (
// //                           <p>{item.unitQuantity} units</p>
// //                         )}
// //                         {item.subUnitQuantity > 0 && item.item.unitContains && (
// //                           <p>
// //                             {item.subUnitQuantity} {item.item.unitContains.unit}
// //                           </p>
// //                         )}
// //                       </div>
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             </CardContent>
// //           </Card>

// //           {/* Summary */}
// //           <Card>
// //             <CardHeader>
// //               <div className="flex items-center gap-2">
// //                 <DollarSign className="h-5 w-5" />
// //                 <CardTitle>Summary</CardTitle>
// //               </div>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="space-y-2">
// //                 <div className="flex justify-between">
// //                   <span className="text-muted-foreground">Total Amount</span>
// //                   <span className="font-medium">Rs{inventoryTotal.toFixed(2)}</span>
// //                 </div>
// //                 <div className="flex justify-between">
// //                   <span className="text-muted-foreground">Total Cost</span>
// //                   <span className="font-medium">Rs{inventoryCost.toFixed(2)}</span>
// //                 </div>
// //                 <div className="flex justify-between pt-2 border-t">
// //                   <span className="font-medium">Profit</span>
// //                   <span className="font-bold text-green-600">
// //                     Rs{profit.toFixed(2)}
// //                   </span>
// //                 </div>
// //               </div>
// //             </CardContent>
// //           </Card>
// //         </div>
// //       </div>

// //       {/* Footer */}
// //       <div className="shrink-0 border-t p-4 bg-background">
// //         <div className="flex justify-end">
// //           <Button variant="outline" onClick={onClose}>
// //             Close
// //           </Button>
// //         </div>
// //       </div>

// //       {/* Sale Edit Dialog */}
// //       {showEditDialog && (
// //         <SaleEditDialog
// //           sale={sale}
// //           isOpen={showEditDialog}
// //           onClose={() => setShowEditDialog(false)}
// //           onSaleUpdated={handleSaleEdited}
// //         />
// //       )}
// //     </div>
// //   );
// // }

// // Update SaleDetails to display patient type information
// import React, { useState } from 'react';
// import { Sale } from '@/types/sale';
// import { CustomerSelector } from './CustomerSelector';
// import { Customer } from '@/types/customer';
// import { saleService } from '@/services/saleService';
// import { format } from 'date-fns';
// import { Calendar, User, Package, DollarSign, Loader2, Edit, Plane } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { SaleEditDialog } from './SaleEditDialog';
// import { toast } from "sonner";

// interface SaleDetailsProps {
//   sale: Sale;
//   onClose: () => void;
//   onUpdate: () => void;
// }

// export function SaleDetails({ sale, onClose, onUpdate }: SaleDetailsProps) {
//   // Ensure the sale has items before rendering
//   if (!sale.items || sale.items.length === 0) {
//     return null;
//   }

//   const [editing, setEditing] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(
//     sale.customer
//   );
//   const [showEditDialog, setShowEditDialog] = useState(false);

//   const handleUpdateCustomer = async () => {
//     if (!selectedCustomer) return;
    
//     setLoading(true);
//     try {
//       await saleService.updateSaleCustomer(sale.id!, selectedCustomer);
//       onUpdate();
//       setEditing(false);
//     } catch (error) {
//       console.error('Error updating sale:', error);
//       alert('Error updating sale customer');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Calculate totals from inventory items only
//   const inventoryTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
//   const inventoryCost = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
//   const profit = inventoryTotal - inventoryCost;
//   const profitMargin = inventoryTotal > 0 ? (profit / inventoryTotal) * 100 : 0;

//   const handleEditSale = () => {
//     // Validate that the sale has items before attempting to edit
//     if (!sale.items || sale.items.length === 0) {
//       toast.error('Cannot edit a sale with no items');
//       return;
//     }
    
//     // Check if we have all the required data
//     const missingData = sale.items.some(item => 
//       !item.item || !item.item.id || !item.batch || !item.batch.id
//     );
    
//     if (missingData) {
//       toast.error('Some sale item data is incomplete. Please refresh the page and try again.');
//       return;
//     }
    
//     setShowEditDialog(true);
//   };

//   const handleSaleEdited = () => {
//     setShowEditDialog(false);
//     onUpdate();
//   };

//   // Get patient type - default to local if not set
//   const patientType = sale.patientType || 'local';

//   return (
//     <div className="flex flex-col h-[85vh]">
//       {/* Header */}
//       <div className="shrink-0 flex justify-between items-start border-b p-4 bg-background">
//         <div className="space-y-1">
//           <h2 className="text-xl font-semibold">Sale #{sale.id?.slice(-6)}</h2>
//           <div className="flex items-center text-muted-foreground gap-2">
//             <Calendar className="h-4 w-4" />
//             <span>{format(sale.saleDate, 'PPpp')}</span>
//           </div>
//         </div>
//         <div className="text-right">
//           <p className="text-2xl font-bold">Rs{inventoryTotal.toFixed(2)}</p>
//           <div className="flex items-center justify-end mt-1">
//             <Badge 
//               className={patientType === 'local' 
//                 ? "bg-blue-100 text-blue-700 border-blue-200" 
//                 : "bg-amber-100 text-amber-700 border-amber-200"}
//             >
//               {patientType === 'local' ? (
//                 <><User className="h-3 w-3 mr-1" /> Local Patient</>
//               ) : (
//                 <><Plane className="h-3 w-3 mr-1" /> Foreign Patient</>
//               )}
//             </Badge>
//           </div>
//         </div>
//       </div>

//       {/* Scrollable Content */}
//       <div className="flex-1 overflow-y-auto">
//         <div className="space-y-6 p-4">
//           {/* Patient Type Information Card */}
//           <Card className={patientType === 'local' 
//             ? "border-blue-200 bg-blue-50/50" 
//             : "border-amber-200 bg-amber-50/50"}>
//             <CardHeader>
//               <div className="flex items-center gap-2">
//                 {patientType === 'local' ? (
//                   <User className="h-5 w-5 text-blue-600" />
//                 ) : (
//                   <Plane className="h-5 w-5 text-amber-600" />
//                 )}
//                 <CardTitle>
//                   {patientType === 'local' ? 'Local Patient Sale' : 'Foreign Patient Sale'}
//                 </CardTitle>
//               </div>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm">Patient Type:</span>
//                   <Badge variant="outline" className={patientType === 'local' 
//                     ? "bg-blue-50 text-blue-700" 
//                     : "bg-amber-50 text-amber-700"}>
//                     {patientType === 'local' ? 'Local Patient' : 'Foreign Patient'}
//                   </Badge>
//                 </div>
                
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm">Pricing Mode:</span>
//                   <span className="text-sm font-medium">
//                     {patientType === 'local' ? 'Fixed Pricing' : 'Adjustable Pricing'}
//                   </span>
//                 </div>
                
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm">Receipt Printed:</span>
//                   <span className="text-sm font-medium">
//                     {patientType === 'local' ? 'Yes' : 'No (Foreign Patient)'}
//                   </span>
//                 </div>
                
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm">Profit Margin:</span>
//                   <Badge className={profitMargin >= 20 
//                     ? "bg-green-100 text-green-700" 
//                     : "bg-amber-100 text-amber-700"}>
//                     {profitMargin.toFixed(1)}%
//                   </Badge>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Creator Information */}
//           {sale.createdBy && (
//             <Card>
//               <CardHeader>
//                 <div className="flex items-center gap-2">
//                   <User className="h-5 w-5" />
//                   <CardTitle>Sale Created By</CardTitle>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-center space-x-3">
//                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
//                     <span className="text-lg font-bold text-primary">
//                       {sale.createdBy.displayName?.charAt(0).toUpperCase() || 
//                        sale.createdBy.email?.charAt(0).toUpperCase() || 'U'}
//                     </span>
//                   </div>
//                   <div>
//                     <p className="font-medium text-lg">{sale.createdBy.displayName || 'Unknown'}</p>
//                     <div className="flex items-center space-x-2 mt-1">
//                       <Badge variant="outline" className="capitalize">{sale.createdBy.role || 'staff'}</Badge>
//                       <span className="text-sm text-muted-foreground">{sale.createdBy.email}</span>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           )}

//           {/* Customer Information */}
//           <Card>
//             <CardHeader>
//               <div className="flex items-center gap-2">
//                 <User className="h-5 w-5" />
//                 <CardTitle>Customer Information</CardTitle>
//               </div>
//             </CardHeader>
//             <CardContent>
//               {editing ? (
//                 <div className="space-y-4">
//                   <CustomerSelector
//                     selectedCustomer={selectedCustomer}
//                     onSelectCustomer={setSelectedCustomer}
//                   />
//                   <div className="flex justify-end gap-2">
//                     <Button
//                       variant="outline"
//                       onClick={() => {
//                         setEditing(false);
//                         setSelectedCustomer(sale.customer);
//                       }}
//                       disabled={loading}
//                     >
//                       Cancel
//                     </Button>
//                     <Button
//                       onClick={handleUpdateCustomer}
//                       disabled={loading || !selectedCustomer}
//                     >
//                       {loading ? (
//                         <>
//                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                           Updating...
//                         </>
//                       ) : (
//                         'Update Customer'
//                       )}
//                     </Button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="flex justify-between items-start">
//                   <div>
//                     {sale.customer ? (
//                       <>
//                         <p className="font-medium">{sale.customer.name}</p>
//                         <p className="text-sm text-muted-foreground">
//                           {sale.customer.mobile}
//                         </p>
//                         {sale.customer.address && (
//                           <p className="text-sm text-muted-foreground">
//                             {sale.customer.address}
//                           </p>
//                         )}
//                       </>
//                     ) : (
//                       <p className="text-muted-foreground">Walk-in Customer</p>
//                     )}
//                   </div>
//                   <Button
//                     variant="outline"
//                     onClick={() => setEditing(true)}
//                   >
//                     Edit Customer
//                   </Button>
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Inventory Items */}
//           <Card>
//             <CardHeader>
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <Package className="h-5 w-5" />
//                   <CardTitle>Inventory Items</CardTitle>
//                 </div>
//                 <Button 
//                   variant="outline" 
//                   size="sm"
//                   onClick={handleEditSale}
//                 >
//                   <Edit className="h-4 w-4 mr-2" />
//                   Edit Items
//                 </Button>
//               </div>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {sale.items.map((item, index) => (
//                   <div
//                     key={index}
//                     className="flex justify-between items-start p-4 rounded-lg border"
//                   >
//                     <div>
//                       <p className="font-medium">{item.item.name}</p>
//                       <p className="text-sm text-muted-foreground">
//                         {item.item.code}
//                       </p>
//                       <div className="mt-2">
//                         <Badge variant="secondary">
//                           Batch #{item.batch.batchNumber}
//                         </Badge>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <p className="font-medium">Rs{item.totalPrice.toFixed(2)}</p>
//                       <div className="space-y-1 mt-2 text-sm text-muted-foreground">
//                         {item.unitQuantity > 0 && (
//                           <p>{item.unitQuantity} units</p>
//                         )}
//                         {item.subUnitQuantity > 0 && item.item.unitContains && (
//                           <p>
//                             {item.subUnitQuantity} {item.item.unitContains.unit}
//                           </p>
//                         )}
//                       </div>
//                       {/* Show if price was adjusted - relevant for foreign patients */}
//                       {patientType === 'foreign' && item.isPriceAdjusted && (
//                         <Badge className="mt-2 bg-amber-100 text-amber-800 border-amber-200">
//                           Price Adjusted
//                         </Badge>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Summary */}
//           <Card>
//             <CardHeader>
//               <div className="flex items-center gap-2">
//                 <DollarSign className="h-5 w-5" />
//                 <CardTitle>Summary</CardTitle>
//               </div>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-2">
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Total Amount</span>
//                   <span className="font-medium">Rs{inventoryTotal.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Total Cost</span>
//                   <span className="font-medium">Rs{inventoryCost.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between pt-2 border-t">
//                   <span className="font-medium">Profit</span>
//                   <span className="font-bold text-green-600">
//                     Rs{profit.toFixed(2)}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Profit Margin</span>
//                   <span className={`font-medium ${
//                     profitMargin >= 20 ? 'text-green-600' : 'text-amber-600'
//                   }`}>
//                     {profitMargin.toFixed(1)}%
//                   </span>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="shrink-0 border-t p-4 bg-background">
//         <div className="flex justify-end">
//           <Button variant="outline" onClick={onClose}>
//             Close
//           </Button>
//         </div>
//       </div>

//       {/* Sale Edit Dialog */}
//       {showEditDialog && (
//         <SaleEditDialog
//           sale={sale}
//           isOpen={showEditDialog}
//           onClose={() => setShowEditDialog(false)}
//           onSaleUpdated={handleSaleEdited}
//         />
//       )}
//     </div>
//   );
// }

// Updated SaleDetails component with prescription number and insurance information
import React, { useState } from 'react';
import { Sale } from '@/types/sale';
import { CustomerSelector } from './CustomerSelector';
import { Customer } from '@/types/customer';
import { saleService } from '@/services/saleService';
import { format } from 'date-fns';
import { Calendar, User, Package, DollarSign, Loader2, Edit, Plane, FileText, ShieldCheck, ShieldX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SaleEditDialog } from './SaleEditDialog';
import { toast } from "sonner";

interface SaleDetailsProps {
  sale: Sale;
  onClose: () => void;
  onUpdate: () => void;
}

export function SaleDetails({ sale, onClose, onUpdate }: SaleDetailsProps) {
  // Ensure the sale has items before rendering
  if (!sale.items || sale.items.length === 0) {
    return null;
  }

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(
    sale.customer
  );
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;
    
    setLoading(true);
    try {
      await saleService.updateSaleCustomer(sale.id!, selectedCustomer);
      onUpdate();
      setEditing(false);
    } catch (error) {
      console.error('Error updating sale:', error);
      alert('Error updating sale customer');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals from inventory items only
  const inventoryTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const inventoryCost = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
  const profit = inventoryTotal - inventoryCost;
  const profitMargin = inventoryTotal > 0 ? (profit / inventoryTotal) * 100 : 0;

  const handleEditSale = () => {
    // Validate that the sale has items before attempting to edit
    if (!sale.items || sale.items.length === 0) {
      toast.error('Cannot edit a sale with no items');
      return;
    }
    
    // Check if we have all the required data
    const missingData = sale.items.some(item => 
      !item.item || !item.item.id || !item.batch || !item.batch.id
    );
    
    if (missingData) {
      toast.error('Some sale item data is incomplete. Please refresh the page and try again.');
      return;
    }
    
    setShowEditDialog(true);
  };

  const handleSaleEdited = () => {
    setShowEditDialog(false);
    onUpdate();
  };

  // Get patient type - default to local if not set
  const patientType = sale.patientType || 'local';
  // Get insurance status
  const isInsurancePatient = sale.isInsurancePatient || false;

  return (
    <div className="flex flex-col h-[85vh]">
      {/* Header */}
      <div className="shrink-0 flex justify-between items-start border-b p-4 bg-background">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Sale #{sale.id?.slice(-6)}</h2>
          <div className="flex items-center text-muted-foreground gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(sale.saleDate, 'PPpp')}</span>
          </div>
          {sale.invoiceNumber && (
            <div className="flex items-center text-indigo-600 gap-2 mt-1">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Prescription #: {sale.invoiceNumber}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">Rs{inventoryTotal.toFixed(2)}</p>
          <div className="flex items-center justify-end mt-1 gap-2">
            <Badge 
              className={patientType === 'local' 
                ? "bg-blue-100 text-blue-700 border-blue-200" 
                : "bg-amber-100 text-amber-700 border-amber-200"}
            >
              {patientType === 'local' ? (
                <><User className="h-3 w-3 mr-1" /> Local Patient</>
              ) : (
                <><Plane className="h-3 w-3 mr-1" /> Foreign Patient</>
              )}
            </Badge>
            
            <Badge 
              className={isInsurancePatient 
                ? "bg-green-100 text-green-700 border-green-200" 
                : "bg-gray-100 text-gray-700 border-gray-200"}
            >
              {isInsurancePatient ? (
                <><ShieldCheck className="h-3 w-3 mr-1" /> Insurance</>
              ) : (
                <><ShieldX className="h-3 w-3 mr-1" /> Non-Insurance</>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-4">
          {/* Patient Type and Insurance Information Card */}
          <Card className={patientType === 'local' 
            ? (isInsurancePatient ? "border-green-200 bg-green-50/50" : "border-blue-200 bg-blue-50/50")
            : "border-amber-200 bg-amber-50/50"}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {patientType === 'local' ? (
                  isInsurancePatient ? (
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  ) : (
                    <User className="h-5 w-5 text-blue-600" />
                  )
                ) : (
                  <Plane className="h-5 w-5 text-amber-600" />
                )}
                <CardTitle>
                  {patientType === 'local' 
                    ? (isInsurancePatient ? 'Insurance Patient' : 'Local Patient Sale')
                    : 'Foreign Patient Sale'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Patient Type:</span>
                  <Badge variant="outline" className={patientType === 'local' 
                    ? "bg-blue-50 text-blue-700" 
                    : "bg-amber-50 text-amber-700"}>
                    {patientType === 'local' ? 'Local Patient' : 'Foreign Patient'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Insurance Status:</span>
                  <Badge 
                    variant="outline" 
                    className={isInsurancePatient
                      ? "bg-green-50 text-green-700" 
                      : "bg-gray-50 text-gray-700"}>
                    {isInsurancePatient ? 'Insurance Patient' : 'Non-Insurance'}
                  </Badge>
                </div>
                
                {sale.invoiceNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Prescription Number:</span>
                    <span className="text-sm font-medium">
                      {sale.invoiceNumber}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pricing Mode:</span>
                  <span className="text-sm font-medium">
                    {isInsurancePatient 
                      ? 'Insurance Pricing' 
                      : (patientType === 'local' ? 'Fixed Pricing' : 'Adjustable Pricing')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Receipt Printed:</span>
                  <span className="text-sm font-medium">
                    {patientType === 'local' ? 'Yes' : 'No (Foreign Patient)'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Profit Margin:</span>
                  <Badge className={profitMargin >= 20 
                    ? "bg-green-100 text-green-700" 
                    : "bg-amber-100 text-amber-700"}>
                    {isInsurancePatient ? '0.0%' : profitMargin.toFixed(1) + '%'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creator Information */}
          {sale.createdBy && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle>Sale Created By</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-primary">
                      {sale.createdBy.displayName?.charAt(0).toUpperCase() || 
                       sale.createdBy.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-lg">{sale.createdBy.displayName || 'Unknown'}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="capitalize">{sale.createdBy.role || 'staff'}</Badge>
                      <span className="text-sm text-muted-foreground">{sale.createdBy.email}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Customer Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <CustomerSelector
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={setSelectedCustomer}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        setSelectedCustomer(sale.customer);
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateCustomer}
                      disabled={loading || !selectedCustomer}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Customer'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    {sale.customer ? (
                      <>
                        <p className="font-medium">{sale.customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.customer.mobile}
                        </p>
                        {sale.customer.address && (
                          <p className="text-sm text-muted-foreground">
                            {sale.customer.address}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">Walk-in Customer</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    Edit Customer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <CardTitle>Inventory Items</CardTitle>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEditSale}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Items
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sale.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-4 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{item.item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.item.code}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          Batch #{item.batch.batchNumber}
                        </Badge>
                        {item.fromFreeItemBatch && (
                          <Badge className="bg-purple-100 text-purple-700">
                            Free Item
                          </Badge>
                        )}
                        {isInsurancePatient && (
                          <Badge className="bg-green-100 text-green-700">
                            Insurance Priced
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rs{item.totalPrice.toFixed(2)}</p>
                      <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                        {item.unitQuantity > 0 && (
                          <p>{item.unitQuantity} units</p>
                        )}
                        {item.subUnitQuantity > 0 && item.item.unitContains && (
                          <p>
                            {item.subUnitQuantity} {item.item.unitContains.unit}
                          </p>
                        )}
                      </div>
                      {/* Show if price was adjusted - relevant for foreign patients */}
                      {patientType === 'foreign' && item.isPriceAdjusted && (
                        <Badge className="mt-2 bg-amber-100 text-amber-800 border-amber-200">
                          Price Adjusted
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <CardTitle>Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">Rs{inventoryTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Cost</span>
                  <span className="font-medium">Rs{inventoryCost.toFixed(2)}</span>
                </div>
                
                {sale.totalDiscount && sale.totalDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount Applied</span>
                    <span className="font-medium text-amber-600">Rs{sale.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                {sale.loyaltyPointsUsed && sale.loyaltyPointsUsed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loyalty Points Used</span>
                    <span className="font-medium text-purple-600">{sale.loyaltyPointsUsed} points</span>
                  </div>
                )}
                
                {sale.loyaltyPointsEarned && sale.loyaltyPointsEarned > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loyalty Points Earned</span>
                    <span className="font-medium text-green-600">{sale.loyaltyPointsEarned} points</span>
                  </div>
                )}
                
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Profit</span>
                  <span className="font-bold text-green-600">
                    Rs{profit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profit Margin</span>
                  <span className={`font-medium ${
                    isInsurancePatient ? 'text-gray-600' : 
                    (profitMargin >= 20 ? 'text-green-600' : 'text-amber-600')
                  }`}>
                    {isInsurancePatient ? '0.0%' : profitMargin.toFixed(1) + '%'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t p-4 bg-background">
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Sale Edit Dialog */}
      {showEditDialog && (
        <SaleEditDialog
          sale={sale}
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSaleUpdated={handleSaleEdited}
        />
      )}
    </div>
  );
}