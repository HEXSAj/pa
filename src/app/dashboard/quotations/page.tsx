// // src/app/dashboard/quotations/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { quotationService } from '@/services/quotationService';
// import { saleService } from '@/services/saleService';
// import { receiptService } from '@/services/receiptService';
// import { Quotation } from '@/types/quotation';
// import DashboardLayout from '@/components/DashboardLayout';
// import { 
//   Search, 
//   X, 
//   FileText, 
//   Printer, 
//   User, 
//   Calendar, 
//   Clock, 
//   ArrowUpRight, 
//   Filter,
//   Loader2,
//   RefreshCw,
//   Edit,
//   Trash2,
//   ShoppingCart
// } from 'lucide-react';
// import { 
//   Table, 
//   TableBody, 
//   TableCell, 
//   TableHead, 
//   TableHeader, 
//   TableRow 
// } from '@/components/ui/table';
// import { 
//   Card, 
//   CardContent, 
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardFooter
// } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
//   DropdownMenuSeparator,
//   DropdownMenuLabel
// } from '@/components/ui/dropdown-menu';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { useToast } from '@/hooks/use-toast';
// import { formatDistanceToNow } from 'date-fns';
// import { useRouter } from 'next/navigation';
// import { doc, getDoc, setDoc } from 'firebase/firestore';

// import { db } from '@/lib/firebase';

// export default function QuotationsPage() {
//   const { toast } = useToast();
//   const router = useRouter();
  
//   const [quotations, setQuotations] = useState<Quotation[]>([]);
//   const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
//   const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
//   const [processing, setProcessing] = useState(false);
//   const [showDetailDialog, setShowDetailDialog] = useState(false);
  
//   // Load all quotations
//   const loadQuotations = async () => {
//     try {
//       setLoading(true);
//       const data = await quotationService.getAll();
//       setQuotations(data);
//       setFilteredQuotations(data);
//     } catch (error) {
//       console.error('Error loading quotations:', error);
//       toast({
//         title: "Error",
//         description: "Failed to load quotations",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadQuotations();
//   }, []);

//   // Filter and sort quotations when search query or sort option changes
//   useEffect(() => {
//     let filtered = quotations;

//     // Apply search filter
//     if (searchQuery) {
//       const query = searchQuery.toLowerCase();
//       filtered = quotations.filter(quote => 
//         quote.customer?.name?.toLowerCase().includes(query) ||
//         quote.customer?.mobile?.toLowerCase().includes(query) ||
//         quote.quotationNumber.toLowerCase().includes(query)
//       );
//     }

//     // Apply sorting
//     if (sortBy === 'date') {
//       filtered = [...filtered].sort((a, b) => 
//         new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//       );
//     } else if (sortBy === 'amount') {
//       filtered = [...filtered].sort((a, b) => b.totalAmount - a.totalAmount);
//     }

//     setFilteredQuotations(filtered);
//   }, [searchQuery, quotations, sortBy]);

//   const clearSearch = () => {
//     setSearchQuery('');
//   };

//   // Handle convert to sale
// //   const handleConvertToSale = async (quotation: Quotation) => {
// //     try {
// //       setProcessing(true);
      
// //       // First we need to create a sale with the quotation data
// //       const saleData = {
// //         items: quotation.items,
// //         totalAmount: quotation.totalAmount,
// //         totalCost: quotation.totalCost,
// //         saleDate: new Date(),
// //         paymentMethod: 'cash', // Default to cash
// //         discountPercentage: quotation.discountPercentage,
// //         totalDiscount: quotation.totalDiscount
// //       };
      
// //       // Add customer if present
// //       if (quotation.customer && quotation.customerId) {
// //         saleData.customerId = quotation.customerId;
// //         saleData.customer = quotation.customer;
// //       }
      
// //       // Create the sale
// //       await saleService.create(saleData);
      
// //       // Get the latest sale for receipt printing
// //       const latestSale = await receiptService.getLatestSale();
      
// //       // Update the quotation to mark it as converted
// //       if (latestSale) {
// //         await quotationService.convertToSale(quotation.id!, latestSale.id!);
        
// //         // Print the receipt
// //         try {
// //           await receiptService.printReceipt(latestSale);
// //         } catch (printError) {
// //           console.error('Error printing receipt:', printError);
// //           toast({
// //             title: "Print Warning",
// //             description: "Sale created, but receipt printing failed",
// //             variant: "warning",
// //           });
// //         }
// //       }
      
// //       // Refresh quotations
// //       await loadQuotations();
      
// //       // Show success message
// //       toast({
// //         title: "Quotation Converted",
// //         description: "Quotation has been successfully converted to a sale",
// //         variant: "success",
// //       });
// //     } catch (error) {
// //       console.error('Error converting quotation to sale:', error);
// //       toast({
// //         title: "Error",
// //         description: "Failed to convert quotation to sale",
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setProcessing(false);
// //     }
// //   };


// const handleConvertToSale = async (quotation: Quotation) => {
//     try {
//       setProcessing(true);
      
//       // First, get the full quotation with complete item data
//       const fullQuotation = await quotationService.getById(quotation.id!);
      
//       // Ensure we have all the item details properly populated
//       const itemsWithFullDetails = await Promise.all(fullQuotation.items.map(async (item) => {
//         // If we already have full details, use them
//         if (item.item && item.item.unitContains) {
//           return item;
//         }
        
//         // Otherwise, fetch the complete item details
//         const itemDoc = await getDoc(doc(db, 'inventory', item.itemId));
//         const itemData = itemDoc.data();
        
//         // Fetch the complete batch details
//         const batchDoc = await getDoc(doc(db, 'batches', item.batchId));
//         const batchData = batchDoc.data();
        
//         // Return the item with complete data
//         return {
//           ...item,
//           item: {
//             id: item.itemId,
//             ...itemData
//           },
//           batch: {
//             id: item.batchId,
//             ...batchData,
//             expiryDate: batchData.expiryDate.toDate()
//           }
//         };
//       }));
      
//       // Create the sale data with fully populated items
//       const saleData = {
//         items: itemsWithFullDetails,
//         totalAmount: fullQuotation.totalAmount,
//         totalCost: fullQuotation.totalCost,
//         saleDate: new Date(),
//         paymentMethod: 'cash', // Default to cash
//         discountPercentage: fullQuotation.discountPercentage,
//         totalDiscount: fullQuotation.totalDiscount
//       };
      
//       // Add customer if present
//       if (fullQuotation.customer && fullQuotation.customerId) {
//         saleData.customerId = fullQuotation.customerId;
//         saleData.customer = fullQuotation.customer;
//       }
      
//       // Create the sale
//       await saleService.create(saleData);
      
//       // Get the latest sale for receipt printing
//       const latestSale = await receiptService.getLatestSale();
      
//       // Update the quotation to mark it as converted
//       if (latestSale) {
//         await quotationService.convertToSale(quotation.id!, latestSale.id!);
        
//         // Print the receipt
//         try {
//           await receiptService.printReceipt(latestSale);
//         } catch (printError) {
//           console.error('Error printing receipt:', printError);
//           toast({
//             title: "Print Warning",
//             description: "Sale created, but receipt printing failed",
//             variant: "warning",
//           });
//         }
//       }
      
//       // Refresh quotations
//       await loadQuotations();
      
//       // Show success message
//       toast({
//         title: "Quotation Converted",
//         description: "Quotation has been successfully converted to a sale",
//         variant: "success",
//       });
//     } catch (error) {
//       console.error('Error converting quotation to sale:', error);
//       toast({
//         title: "Error",
//         description: "Failed to convert quotation to sale",
//         variant: "destructive",
//       });
//     } finally {
//       setProcessing(false);
//     }
//   };
  
//   // Handle print quotation
//   const handlePrintQuotation = async (quotation: Quotation) => {
//     try {
//       setProcessing(true);
      
//       // Get full quotation details with items
//       const fullQuotation = await quotationService.getById(quotation.id!);
      
//       // Print the quotation
//       await receiptService.printQuotation(fullQuotation);
      
//       toast({
//         title: "Printing Quotation",
//         description: `Quotation #${quotation.quotationNumber} sent to printer`,
//         variant: "success",
//       });
//     } catch (error) {
//       console.error('Error printing quotation:', error);
//       toast({
//         title: "Print Error",
//         description: "Failed to print quotation",
//         variant: "destructive",
//       });
//     } finally {
//       setProcessing(false);
//     }
//   };
  
//   // Handle delete quotation
// //   const handleDeleteQuotation = async () => {
// //     if (!selectedQuotation) return;
    
// //     try {
// //       setProcessing(true);
// //       await quotationService.delete(selectedQuotation.id!);
      
// //       // Refresh quotations
// //       await loadQuotations();
      
// //       setShowDeleteDialog(false);
// //       setSelectedQuotation(null);
      
// //       toast({
// //         title: "Quotation Deleted",
// //         description: `Quotation #${selectedQuotation.quotationNumber} has been deleted`,
// //         variant: "success",
// //       });
// //     } catch (error) {
// //       console.error('Error deleting quotation:', error);
// //       toast({
// //         title: "Error",
// //         description: "Failed to delete quotation",
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setProcessing(false);
// //     }
// //   };

// const handleDeleteQuotation = async () => {
//     if (!selectedQuotation) {
//       toast({
//         title: "Error",
//         description: "No quotation selected for deletion",
//         variant: "destructive",
//       });
//       return;
//     }
    
//     if (!selectedQuotation.id) {
//       toast({
//         title: "Error",
//         description: "Invalid quotation ID",
//         variant: "destructive",
//       });
//       setShowDeleteDialog(false);
//       return;
//     }
  
//     // Store a copy of the quotation info for the success message
//     const quotationNumber = selectedQuotation.quotationNumber;
    
//     try {
//       setProcessing(true);
      
//       // Log the quotation ID being deleted for debugging
//       console.log("Attempting to delete quotation with ID:", selectedQuotation.id);
      
//       // Call the delete method with error handling
//       await quotationService.delete(selectedQuotation.id);
      
//       // Reset state first to avoid any reference issues
//       setSelectedQuotation(null);
//       setShowDeleteDialog(false);
      
//       // Then refresh the data
//       await loadQuotations();
      
//       // Show success message
//       toast({
//         title: "Quotation Deleted",
//         description: `Quotation #${quotationNumber} has been deleted`,
//         variant: "success",
//       });
//     } catch (error) {
//       console.error('Error deleting quotation:', error);
      
//       // Provide more detailed error information
//       let errorMessage = "Failed to delete quotation";
//       if (error instanceof Error) {
//         errorMessage += `: ${error.message}`;
//       }
      
//       toast({
//         title: "Error",
//         description: errorMessage,
//         variant: "destructive",
//       });
//     } finally {
//       setProcessing(false);
//     }
//   };
  
//   // Handle view quotation details
//   const handleViewDetails = async (quotation: Quotation) => {
//     try {
//       setProcessing(true);
      
//       // Get full quotation details with items
//       const fullQuotation = await quotationService.getById(quotation.id!);
      
//       setSelectedQuotation(fullQuotation);
//       setShowDetailDialog(true);
//     } catch (error) {
//       console.error('Error loading quotation details:', error);
//       toast({
//         title: "Error",
//         description: "Failed to load quotation details",
//         variant: "destructive",
//       });
//     } finally {
//       setProcessing(false);
//     }
//   };

//   return (
//     <DashboardLayout>
//       <div className="space-y-6 h-full">
//         {/* Header with gradient background */}
//         <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//             <div>
//               <h1 className="text-2xl md:text-3xl font-bold text-white">Quotation Management</h1>
//               <p className="text-blue-100 mt-1">Create and manage price quotes for your customers</p>
//             </div>
//             <div className="flex gap-3">
//               <Button 
//                 onClick={() => loadQuotations()}
//                 className="bg-white text-blue-600 hover:bg-blue-50"
//               >
//                 <RefreshCw className="h-4 w-4 mr-2" />
//                 Refresh Data
//               </Button>
//               <Button 
//                 onClick={() => router.push('/dashboard/pos')}
//                 className="bg-white text-blue-600 hover:bg-blue-50"
//               >
//                 <ArrowUpRight className="h-4 w-4 mr-2" />
//                 Create New Quotation
//               </Button>
//             </div>
//           </div>
//         </div>
        
//         {/* Main Quotations Table Card */}
//         <Card className="overflow-hidden border-0 shadow-xl">
//           <CardHeader className="bg-gray-50 border-b pb-3">
//             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//               <div>
//                 <CardTitle>Quotations</CardTitle>
//                 <CardDescription>Manage price quotes for your customers</CardDescription>
//               </div>
              
//               <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
//                 <div className="relative flex-1">
//                   <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                   <Input
//                     type="text"
//                     placeholder="Search quotations..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="pl-9 pr-9 py-2 border-gray-200 focus:ring-blue-500 w-full"
//                   />
//                   {searchQuery && (
//                     <button
//                       onClick={clearSearch}
//                       className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
//                     >
//                       <X className="h-4 w-4" />
//                     </button>
//                   )}
//                 </div>
                
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button variant="outline" className="w-full sm:w-auto">
//                       <Filter className="h-4 w-4 mr-1" />
//                       {sortBy === 'date' ? 'Sort by Date' : 'Sort by Amount'}
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align="end">
//                     <DropdownMenuItem onClick={() => setSortBy('date')}>
//                       Sort by Date
//                     </DropdownMenuItem>
//                     <DropdownMenuItem onClick={() => setSortBy('amount')}>
//                       Sort by Amount
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </div>
//             </div>
//           </CardHeader>
          
//           <CardContent className="p-0">
//             <div className="relative">
//               {loading ? (
//                 <div className="flex justify-center items-center h-48">
//                   <div className="text-center">
//                     <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
//                     <p className="mt-2 text-sm text-gray-500">Loading quotations...</p>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="overflow-auto max-h-[calc(100vh-20rem)]">
//                   <Table>
//                     <TableHeader className="sticky top-0 bg-white z-10">
//                       <TableRow className="bg-gray-50">
//                         <TableHead className="w-[160px]">Quotation #</TableHead>
//                         <TableHead className="w-[180px]">Customer</TableHead>
//                         <TableHead className="w-[140px]">Date</TableHead>
//                         <TableHead className="w-[120px]">Amount</TableHead>
//                         <TableHead className="w-[120px]">Status</TableHead>
//                         <TableHead className="text-right w-[200px]">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {filteredQuotations.length === 0 ? (
//                         <TableRow>
//                           <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
//                             <div className="flex flex-col items-center">
//                               <div className="rounded-full bg-gray-100 p-4 mb-3">
//                                 <FileText className="h-8 w-8 text-gray-400" />
//                               </div>
//                               <p className="text-lg text-gray-500">
//                                 {searchQuery ? 'No quotations match your search criteria' : 'No quotations found'}
//                               </p>
//                               <p className="text-sm text-gray-400 mt-1">
//                                 {searchQuery ? 'Try adjusting your search terms' : 'Create a new quotation to get started'}
//                               </p>
//                             </div>
//                           </TableCell>
//                         </TableRow>
//                       ) : (
//                         filteredQuotations.map((quotation) => (
//                           <TableRow 
//                             key={quotation.id} 
//                             className={`group hover:bg-blue-50/50 transition-colors ${
//                               quotation.convertedToSale ? 'bg-gray-50/50 text-gray-500' : ''
//                             }`}
//                           >
//                             <TableCell className="font-medium">
//                               {quotation.quotationNumber}
//                             </TableCell>
//                             <TableCell>
//                               {quotation.customer ? (
//                                 <div className="flex items-center gap-3">
//                                   <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
//                                     {quotation.customer.name.charAt(0).toUpperCase()}
//                                   </div>
//                                   <div>
//                                     <p className="font-medium">{quotation.customer.name}</p>
//                                     {quotation.customer.mobile && (
//                                       <p className="text-xs text-gray-500">{quotation.customer.mobile}</p>
//                                     )}
//                                   </div>
//                                 </div>
//                               ) : (
//                                 <span className="text-gray-500">No Customer</span>
//                               )}
//                             </TableCell>
//                             <TableCell>
//                               <div className="flex flex-col">
//                                 <div className="flex items-center text-sm">
//                                   <Calendar className="h-3 w-3 mr-1 text-gray-400" />
//                                   {new Date(quotation.createdAt).toLocaleDateString()}
//                                 </div>
//                                 <div className="flex items-center text-xs text-gray-500 mt-1">
//                                   <Clock className="h-3 w-3 mr-1" />
//                                   {formatDistanceToNow(new Date(quotation.createdAt), { addSuffix: true })}
//                                 </div>
//                               </div>
//                             </TableCell>
//                             <TableCell className="font-medium">
//                               Rs{quotation.totalAmount.toFixed(2)}
//                             </TableCell>
//                             <TableCell>
//                               {quotation.convertedToSale ? (
//                                 <Badge variant="outline" className="font-normal bg-green-50 text-green-700 border-green-200">
//                                   Converted
//                                 </Badge>
//                               ) : (
//                                 isQuotationExpired(quotation) ? (
//                                   <Badge variant="outline" className="font-normal bg-red-50 text-red-700 border-red-200">
//                                     Expired
//                                   </Badge>
//                                 ) : (
//                                   <Badge variant="outline" className="font-normal bg-blue-50 text-blue-700 border-blue-200">
//                                     Active
//                                   </Badge>
//                                 )
//                               )}
//                             </TableCell>
//                             <TableCell className="text-right">
//                               <div className="flex justify-end space-x-2">
//                                 <DropdownMenu>
//                                   <DropdownMenuTrigger asChild>
//                                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
//                                       <span className="sr-only">Open menu</span>
//                                       <svg
//                                         xmlns="http://www.w3.org/2000/svg"
//                                         viewBox="0 0 24 24"
//                                         fill="none"
//                                         stroke="currentColor"
//                                         strokeWidth="2"
//                                         strokeLinecap="round"
//                                         strokeLinejoin="round"
//                                         className="h-4 w-4"
//                                       >
//                                         <circle cx="12" cy="12" r="1" />
//                                         <circle cx="12" cy="5" r="1" />
//                                         <circle cx="12" cy="19" r="1" />
//                                       </svg>
//                                     </Button>
//                                   </DropdownMenuTrigger>
//                                   <DropdownMenuContent align="end">
//                                     <DropdownMenuItem
//                                       onClick={() => handleViewDetails(quotation)}
//                                     >
//                                       <FileText className="mr-2 h-4 w-4" />
//                                       View Details
//                                     </DropdownMenuItem>
//                                     <DropdownMenuItem
//                                       onClick={() => handlePrintQuotation(quotation)}
//                                     >
//                                       <Printer className="mr-2 h-4 w-4" />
//                                       Print Quotation
//                                     </DropdownMenuItem>
//                                     <DropdownMenuSeparator />
//                                     {!quotation.convertedToSale && !isQuotationExpired(quotation) && (
//                                       <DropdownMenuItem
//                                         onClick={() => handleConvertToSale(quotation)}
//                                       >
//                                         <ShoppingCart className="mr-2 h-4 w-4" />
//                                         Convert to Sale
//                                       </DropdownMenuItem>
//                                     )}
//                                     {/* <DropdownMenuItem
//                                       onClick={() => {
//                                         setSelectedQuotation(quotation);
//                                         setShowDeleteDialog(true);
//                                       }}
//                                       className="text-red-600"
//                                     >
//                                       <Trash2 className="mr-2 h-4 w-4" />
//                                       Delete
//                                     </DropdownMenuItem> */}
//                                   </DropdownMenuContent>
//                                 </DropdownMenu>

//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   onClick={() => handlePrintQuotation(quotation)}
//                                   className="h-8"
//                                 >
//                                   <Printer className="h-4 w-4" />
//                                 </Button>
                                
//                                 {!quotation.convertedToSale && !isQuotationExpired(quotation) && (
//                                   <Button
//                                     variant="default"
//                                     size="sm"
//                                     onClick={() => handleConvertToSale(quotation)}
//                                     className="h-8 bg-blue-600 hover:bg-blue-700"
//                                   >
//                                     Convert
//                                   </Button>
//                                 )}
//                               </div>
//                             </TableCell>
//                           </TableRow>
//                         ))
//                       )}
//                     </TableBody>
//                   </Table>
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Quotation Detail Dialog */}
//       <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
//         <DialogContent className="sm:max-w-lg rounded-xl overflow-hidden p-0 max-h-[90vh]">
//           <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
//             <DialogTitle className="text-xl">Quotation Details</DialogTitle>
//             <DialogDescription className="text-blue-200">
//               {selectedQuotation?.quotationNumber}
//             </DialogDescription>
//           </DialogHeader>
          
//           <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-11rem)]">
//             {selectedQuotation && (
//               <>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-1">
//                     <p className="text-sm text-gray-500">Created On</p>
//                     <p className="font-medium">{new Date(selectedQuotation.createdAt).toLocaleDateString()}</p>
//                   </div>
//                   <div className="space-y-1">
//                     <p className="text-sm text-gray-500">Status</p>
//                     <div>
//                       {selectedQuotation.convertedToSale ? (
//                         <Badge variant="outline" className="font-normal bg-green-50 text-green-700 border-green-200">
//                           Converted to Sale
//                         </Badge>
//                       ) : (
//                         isQuotationExpired(selectedQuotation) ? (
//                           <Badge variant="outline" className="font-normal bg-red-50 text-red-700 border-red-200">
//                             Expired
//                           </Badge>
//                         ) : (
//                           <Badge variant="outline" className="font-normal bg-blue-50 text-blue-700 border-blue-200">
//                             Active
//                           </Badge>
//                         )
//                       )}
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="space-y-1">
//                   <p className="text-sm text-gray-500">Customer</p>
//                   <p className="font-medium">
//                     {selectedQuotation.customer ? selectedQuotation.customer.name : 'No Customer'}
//                   </p>
//                   {selectedQuotation.customer?.mobile && (
//                     <p className="text-sm text-gray-500">{selectedQuotation.customer.mobile}</p>
//                   )}
//                   {selectedQuotation.customer?.address && (
//                     <p className="text-sm text-gray-500">{selectedQuotation.customer.address}</p>
//                   )}
//                 </div>
                
//                 <div className="border rounded-md overflow-hidden">
//                   <div className="bg-gray-50 p-3 font-medium">
//                     Items
//                   </div>
//                   <div className="p-3">
//                     <Table>
//                       <TableHeader>
//                         <TableRow>
//                           <TableHead>Item</TableHead>
//                           <TableHead className="text-right">Qty</TableHead>
//                           <TableHead className="text-right">Price</TableHead>
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {selectedQuotation.items.map((item, index) => (
//                           <TableRow key={index}>
//                             <TableCell>{item.item.name}</TableCell>
//                             <TableCell className="text-right">
//                               {formatQuantity(item)}
//                             </TableCell>
//                             <TableCell className="text-right">
//                               Rs{item.totalPrice.toFixed(2)}
//                             </TableCell>
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
                    
//                     <div className="mt-4 pt-4 border-t">
//                       <div className="flex justify-between items-center">
//                         <span className="text-sm text-gray-500">Subtotal:</span>
//                         <span>Rs{selectedQuotation.totalAmount.toFixed(2)}</span>
//                       </div>
                      
//                       {selectedQuotation.totalDiscount > 0 && (
//                         <div className="flex justify-between items-center text-green-600 mt-1">
//                           <span className="text-sm">Discount ({selectedQuotation.discountPercentage}%):</span>
//                           <span>-Rs{selectedQuotation.totalDiscount.toFixed(2)}</span>
//                         </div>
//                       )}
                      
//                       <div className="flex justify-between items-center font-bold mt-2 pt-2 border-t">
//                         <span>Total:</span>
//                         <span>Rs{selectedQuotation.totalAmount.toFixed(2)}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
                
//                 {selectedQuotation.expiryDate && (
//                   <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm">
//                     <span className="font-medium text-yellow-800">Valid Until: </span>
//                     <span className="text-yellow-700">
//                       {new Date(selectedQuotation.expiryDate).toLocaleDateString()}
//                     </span>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
          
//           <DialogFooter className=" border-t bg-gray-50">
//             <div className="flex gap-3 w-full">
//               <Button 
//                 variant="outline" 
//                 onClick={() => setShowDetailDialog(false)}
//                 className="flex-1"
//               >
//                 Close
//               </Button>
//               <Button 
//                 onClick={() => handlePrintQuotation(selectedQuotation!)}
//                 className="flex-1 bg-blue-600 hover:bg-blue-700"
//               >
//                 <Printer className="h-4 w-4 mr-2" />
//                 Print Quotation
//               </Button>
//             </div>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirmation Dialog */}
//       {/* <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Are you sure?</AlertDialogTitle>
//             <AlertDialogDescription>
//               This will permanently delete quotation #{selectedQuotation?.quotationNumber}.
//               This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={(e) => {
//                 e.preventDefault();
//                 handleDeleteQuotation();
//               }}
//               disabled={processing}
//               className="bg-red-600 text-white hover:bg-red-700"
//             >
//               {processing ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Deleting...
//                 </>
//               ) : (
//                 'Delete Quotation'
//               )}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog> */}

//     <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
//     <AlertDialogContent>
//         <AlertDialogHeader>
//         <AlertDialogTitle>Are you sure?</AlertDialogTitle>
//         <AlertDialogDescription>
//             {selectedQuotation ? (
//             <>This will permanently delete quotation #{selectedQuotation.quotationNumber}.</>
//             ) : (
//             <>This will permanently delete the selected quotation.</>
//             )}
//             This action cannot be undone.
//         </AlertDialogDescription>
//         </AlertDialogHeader>
//         <AlertDialogFooter>
//         <AlertDialogCancel 
//             disabled={processing}
//             onClick={() => {
//             // Ensure we clean up if the user cancels
//             if (!processing) {
//                 setShowDeleteDialog(false);
//             }
//             }}
//         >
//             Cancel
//         </AlertDialogCancel>
//         <AlertDialogAction
//             onClick={(e) => {
//             e.preventDefault();
//             handleDeleteQuotation();
//             }}
//             disabled={processing}
//             className="bg-red-600 text-white hover:bg-red-700"
//         >
//             {processing ? (
//             <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Deleting...
//             </>
//             ) : (
//             'Delete Quotation'
//             )}
//         </AlertDialogAction>
//         </AlertDialogFooter>
//     </AlertDialogContent>
//     </AlertDialog>



//     </DashboardLayout>
//   );
// }

// // Helper functions
// function isQuotationExpired(quotation: Quotation): boolean {
//   if (!quotation.expiryDate) return false;
//   return new Date(quotation.expiryDate) < new Date();
// }

// function formatQuantity(item: any): string {
//   let result = '';
  
//   if (item.unitQuantity > 0) {
//     result += `${item.unitQuantity} units`;
//   }
  
//   if (item.subUnitQuantity > 0) {
//     if (result) result += ' + ';
//     result += `${item.subUnitQuantity} ${item.item.unitContains?.unit || 'pcs'}`;
//   }
  
//   return result || '0';
// }

// src/app/dashboard/quotations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { quotationService } from '@/services/quotationService';
// import { saleService } from '@/services/saleService';
// import { receiptService } from '@/services/receiptService';
import { Quotation } from '@/types/quotation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Search, 
  X, 
  FileText, 
  Printer, 
  User, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  Filter,
  Loader2,
  RefreshCw,
  Edit,
  Trash2,
  ShoppingCart,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';

// Import the withAuth HOC and useAuth hook
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function QuotationsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { userRole } = useAuth(); // Get the user's role
  const isAdmin = userRole === 'admin'; // Check if user is admin
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Load all quotations
  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await quotationService.getAll();
      setQuotations(data);
      setFilteredQuotations(data);
    } catch (error) {
      console.error('Error loading quotations:', error);
      toast({
        title: "Error",
        description: "Failed to load quotations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  // Filter and sort quotations when search query or sort option changes
  useEffect(() => {
    let filtered = quotations;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = quotations.filter(quote => 
        quote.customer?.name?.toLowerCase().includes(query) ||
        quote.customer?.mobile?.toLowerCase().includes(query) ||
        quote.quotationNumber.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortBy === 'date') {
      filtered = [...filtered].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === 'amount') {
      filtered = [...filtered].sort((a, b) => b.totalAmount - a.totalAmount);
    }

    setFilteredQuotations(filtered);
  }, [searchQuery, quotations, sortBy]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleConvertToSale = async (quotation: Quotation) => {
    // Only admin can convert to sale
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can convert quotations to sales",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setProcessing(true);
      
      // First, get the full quotation with complete item data
      const fullQuotation = await quotationService.getById(quotation.id!);
      
      // Ensure we have all the item details properly populated
      const itemsWithFullDetails = await Promise.all(fullQuotation.items.map(async (item) => {
        // If we already have full details, use them
        if (item.item && item.item.unitContains) {
          return item;
        }
        
        // Otherwise, fetch the complete item details
        const itemDoc = await getDoc(doc(db, 'inventory', item.itemId));
        const itemData = itemDoc.data();
        
        // Fetch the complete batch details
        const batchDoc = await getDoc(doc(db, 'batches', item.batchId));
        const batchData = batchDoc.data();
        
        // Return the item with complete data
        return {
          ...item,
          item: {
            id: item.itemId,
            ...itemData
          },
          batch: {
            id: item.batchId,
            ...batchData,
            expiryDate: batchData.expiryDate.toDate()
          }
        };
      }));
      
      // Create the sale data with fully populated items
      const saleData = {
        items: itemsWithFullDetails,
        totalAmount: fullQuotation.totalAmount,
        totalCost: fullQuotation.totalCost,
        saleDate: new Date(),
        paymentMethod: 'cash', // Default to cash
        discountPercentage: fullQuotation.discountPercentage,
        totalDiscount: fullQuotation.totalDiscount
      };
      
      // Add customer if present
      if (fullQuotation.customer && fullQuotation.customerId) {
        saleData.customerId = fullQuotation.customerId;
        saleData.customer = fullQuotation.customer;
      }
      
      // Create the sale
      await saleService.create(saleData);
      
      // Get the latest sale for receipt printing
      const latestSale = await receiptService.getLatestSale();
      
      // Update the quotation to mark it as converted
      if (latestSale) {
        await quotationService.convertToSale(quotation.id!, latestSale.id!);
        
        // Print the receipt
        try {
          await receiptService.printReceipt(latestSale);
        } catch (printError) {
          console.error('Error printing receipt:', printError);
          toast({
            title: "Print Warning",
            description: "Sale created, but receipt printing failed",
            variant: "warning",
          });
        }
      }
      
      // Refresh quotations
      await loadQuotations();
      
      // Show success message
      toast({
        title: "Quotation Converted",
        description: "Quotation has been successfully converted to a sale",
        variant: "success",
      });
    } catch (error) {
      console.error('Error converting quotation to sale:', error);
      toast({
        title: "Error",
        description: "Failed to convert quotation to sale",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle print quotation - Both staff and admin can print
  const handlePrintQuotation = async (quotation: Quotation) => {
    try {
      setProcessing(true);
      
      // Get full quotation details with items
      const fullQuotation = await quotationService.getById(quotation.id!);
      
      // Print the quotation
      await receiptService.printQuotation(fullQuotation);
      
      toast({
        title: "Printing Quotation",
        description: `Quotation #${quotation.quotationNumber} sent to printer`,
        variant: "success",
      });
    } catch (error) {
      console.error('Error printing quotation:', error);
      toast({
        title: "Print Error",
        description: "Failed to print quotation",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };
  
  const handleDeleteQuotation = async () => {
    // Only admin can delete quotations
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can delete quotations",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedQuotation) {
      toast({
        title: "Error",
        description: "No quotation selected for deletion",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedQuotation.id) {
      toast({
        title: "Error",
        description: "Invalid quotation ID",
        variant: "destructive",
      });
      setShowDeleteDialog(false);
      return;
    }
  
    // Store a copy of the quotation info for the success message
    const quotationNumber = selectedQuotation.quotationNumber;
    
    try {
      setProcessing(true);
      
      // Log the quotation ID being deleted for debugging
      console.log("Attempting to delete quotation with ID:", selectedQuotation.id);
      
      // Call the delete method with error handling
      await quotationService.delete(selectedQuotation.id);
      
      // Reset state first to avoid any reference issues
      setSelectedQuotation(null);
      setShowDeleteDialog(false);
      
      // Then refresh the data
      await loadQuotations();
      
      // Show success message
      toast({
        title: "Quotation Deleted",
        description: `Quotation #${quotationNumber} has been deleted`,
        variant: "success",
      });
    } catch (error) {
      console.error('Error deleting quotation:', error);
      
      // Provide more detailed error information
      let errorMessage = "Failed to delete quotation";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle view quotation details - Both staff and admin can view details
  const handleViewDetails = async (quotation: Quotation) => {
    try {
      setProcessing(true);
      
      // Get full quotation details with items
      const fullQuotation = await quotationService.getById(quotation.id!);
      
      setSelectedQuotation(fullQuotation);
      setShowDetailDialog(true);
    } catch (error) {
      console.error('Error loading quotation details:', error);
      toast({
        title: "Error",
        description: "Failed to load quotation details",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full">
        {/* Header with gradient background */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Quotation Management</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-blue-100">Create and manage price quotes for your customers</p>
                {/* User role badge */}
                <Badge variant="outline" className="bg-white/20 text-white border-white/30 ml-2">
                  {userRole || 'User'} Mode
                </Badge>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => loadQuotations()}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              
              {isAdmin ? (
                <Button 
                  onClick={() => router.push('/dashboard/pos')}
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Create New Quotation
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        className="bg-white/80 text-blue-600 hover:bg-blue-50 cursor-not-allowed opacity-70"
                        disabled
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Create New Quotation
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Only admin can create quotations</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
        
        {!isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-yellow-500" />
            <p className="text-sm text-yellow-700">
              In staff mode, you can view and print quotations, but cannot create, convert to sales, or delete quotations.
            </p>
          </div>
        )}
        
        {/* Main Quotations Table Card */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="bg-gray-50 border-b pb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Quotations</CardTitle>
                <CardDescription>Manage price quotes for your customers</CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search quotations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 py-2 border-gray-200 focus:ring-blue-500 w-full"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Filter className="h-4 w-4 mr-1" />
                      {sortBy === 'date' ? 'Sort by Date' : 'Sort by Amount'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy('date')}>
                      Sort by Date
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('amount')}>
                      Sort by Amount
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="relative">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading quotations...</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-auto max-h-[calc(100vh-20rem)]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[160px]">Quotation #</TableHead>
                        <TableHead className="w-[180px]">Customer</TableHead>
                        <TableHead className="w-[140px]">Date</TableHead>
                        <TableHead className="w-[120px]">Amount</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="text-right w-[200px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuotations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            <div className="flex flex-col items-center">
                              <div className="rounded-full bg-gray-100 p-4 mb-3">
                                <FileText className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-lg text-gray-500">
                                {searchQuery ? 'No quotations match your search criteria' : 'No quotations found'}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {searchQuery ? 'Try adjusting your search terms' : 'Create a new quotation to get started'}
                              </p>
                              {!searchQuery && isAdmin && (
                                <Button 
                                  onClick={() => router.push('/dashboard/pos')}
                                  className="mt-4"
                                  variant="outline"
                                >
                                  <ArrowUpRight className="h-4 w-4 mr-2" />
                                  Create Quotation
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredQuotations.map((quotation) => (
                          <TableRow 
                            key={quotation.id} 
                            className={`group hover:bg-blue-50/50 transition-colors ${
                              quotation.convertedToSale ? 'bg-gray-50/50 text-gray-500' : ''
                            }`}
                          >
                            <TableCell className="font-medium">
                              {quotation.quotationNumber}
                            </TableCell>
                            <TableCell>
                              {quotation.customer ? (
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                                    {quotation.customer.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium">{quotation.customer.name}</p>
                                    {quotation.customer.mobile && (
                                      <p className="text-xs text-gray-500">{quotation.customer.mobile}</p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-500">No Customer</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center text-sm">
                                  <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                  {new Date(quotation.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDistanceToNow(new Date(quotation.createdAt), { addSuffix: true })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              Rs{quotation.totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {quotation.convertedToSale ? (
                                <Badge variant="outline" className="font-normal bg-green-50 text-green-700 border-green-200">
                                  Converted
                                </Badge>
                              ) : (
                                isQuotationExpired(quotation) ? (
                                  <Badge variant="outline" className="font-normal bg-red-50 text-red-700 border-red-200">
                                    Expired
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="font-normal bg-blue-50 text-blue-700 border-blue-200">
                                    Active
                                  </Badge>
                                )
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                      >
                                        <circle cx="12" cy="12" r="1" />
                                        <circle cx="12" cy="5" r="1" />
                                        <circle cx="12" cy="19" r="1" />
                                      </svg>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleViewDetails(quotation)}
                                    >
                                      <FileText className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handlePrintQuotation(quotation)}
                                    >
                                      <Printer className="mr-2 h-4 w-4" />
                                      Print Quotation
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {!quotation.convertedToSale && !isQuotationExpired(quotation) && isAdmin && (
                                      <DropdownMenuItem
                                        onClick={() => handleConvertToSale(quotation)}
                                      >
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        Convert to Sale
                                      </DropdownMenuItem>
                                    )}
                                    {!quotation.convertedToSale && !isQuotationExpired(quotation) && !isAdmin && (
                                      <DropdownMenuItem
                                        className="text-gray-400 cursor-not-allowed"
                                        disabled
                                      >
                                        <Lock className="mr-2 h-4 w-4" />
                                        Convert to Sale (Admin Only)
                                      </DropdownMenuItem>
                                    )}
                                    {/* {isAdmin && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedQuotation(quotation);
                                          setShowDeleteDialog(true);
                                        }}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    )} */}
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePrintQuotation(quotation)}
                                  className="h-8"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                
                                {!quotation.convertedToSale && !isQuotationExpired(quotation) && isAdmin && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleConvertToSale(quotation)}
                                    className="h-8 bg-blue-600 hover:bg-blue-700"
                                  >
                                    Convert
                                  </Button>
                                )}

                                {!quotation.convertedToSale && !isQuotationExpired(quotation) && !isAdmin && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="default"
                                          size="sm"
                                          disabled
                                          className="h-8 bg-blue-300 hover:bg-blue-300 cursor-not-allowed opacity-60"
                                        >
                                          <Lock className="h-4 w-4 mr-1" />
                                          Convert
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Only admin can convert to sale</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotation Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg rounded-xl overflow-hidden p-0 max-h-[90vh]">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <DialogTitle className="text-xl">Quotation Details</DialogTitle>
            <DialogDescription className="text-blue-200">
              {selectedQuotation?.quotationNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-11rem)]">
            {selectedQuotation && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Created On</p>
                    <p className="font-medium">{new Date(selectedQuotation.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Status</p>
                    <div>
                      {selectedQuotation.convertedToSale ? (
                        <Badge variant="outline" className="font-normal bg-green-50 text-green-700 border-green-200">
                          Converted to Sale
                        </Badge>
                      ) : (
                        isQuotationExpired(selectedQuotation) ? (
                          <Badge variant="outline" className="font-normal bg-red-50 text-red-700 border-red-200">
                            Expired
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-normal bg-blue-50 text-blue-700 border-blue-200">
                            Active
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">
                    {selectedQuotation.customer ? selectedQuotation.customer.name : 'No Customer'}
                  </p>
                  {selectedQuotation.customer?.mobile && (
                    <p className="text-sm text-gray-500">{selectedQuotation.customer.mobile}</p>
                  )}
                  {selectedQuotation.customer?.address && (
                    <p className="text-sm text-gray-500">{selectedQuotation.customer.address}</p>
                  )}
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-gray-50 p-3 font-medium">
                    Items
                  </div>
                  <div className="p-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedQuotation.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.item.name}</TableCell>
                            <TableCell className="text-right">
                              {formatQuantity(item)}
                            </TableCell>
                            <TableCell className="text-right">
                              Rs{item.totalPrice.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Subtotal:</span>
                        <span>Rs{selectedQuotation.totalAmount.toFixed(2)}</span>
                      </div>
                      
                      {selectedQuotation.totalDiscount > 0 && (
                        <div className="flex justify-between items-center text-green-600 mt-1">
                          <span className="text-sm">Discount ({selectedQuotation.discountPercentage}%):</span>
                          <span>-Rs{selectedQuotation.totalDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center font-bold mt-2 pt-2 border-t">
                        <span>Total:</span>
                        <span>Rs{selectedQuotation.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedQuotation.expiryDate && (
                  <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm">
                    <span className="font-medium text-yellow-800">Valid Until: </span>
                    <span className="text-yellow-700">
                      {new Date(selectedQuotation.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter className=" border-t bg-gray-50">
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={() => setShowDetailDialog(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                onClick={() => handlePrintQuotation(selectedQuotation!)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Quotation
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Only for admin */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                {selectedQuotation ? (
                <>This will permanently delete quotation #{selectedQuotation.quotationNumber}.</>
                ) : (
                <>This will permanently delete the selected quotation.</>
                )}
                This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel 
                disabled={processing}
                onClick={() => {
                // Ensure we clean up if the user cancels
                if (!processing) {
                    setShowDeleteDialog(false);
                }
                }}
            >
                Cancel
            </AlertDialogCancel>
            <AlertDialogAction
                onClick={(e) => {
                e.preventDefault();
                handleDeleteQuotation();
                }}
                disabled={processing}
                className="bg-red-600 text-white hover:bg-red-700"
            >
                {processing ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                </>
                ) : (
                'Delete Quotation'
                )}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

// Helper functions
function isQuotationExpired(quotation: Quotation): boolean {
  if (!quotation.expiryDate) return false;
  return new Date(quotation.expiryDate) < new Date();
}

function formatQuantity(item: any): string {
  let result = '';
  
  if (item.unitQuantity > 0) {
    result += `${item.unitQuantity} units`;
  }
  
  if (item.subUnitQuantity > 0) {
    if (result) result += ' + ';
    result += `${item.subUnitQuantity} ${item.item.unitContains?.unit || 'pcs'}`;
  }
  
  return result || '0';
}

// Wrap with withAuth HOC to enforce access control
export default withAuth(QuotationsPage);