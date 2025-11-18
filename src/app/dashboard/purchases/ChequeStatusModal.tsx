// // src/app/dashboard/purchases/ChequeStatusModal.tsx
// 'use client';

// import React, { useState } from 'react';
// import { purchaseService } from '@/services/purchaseService';
// import { PurchaseWithDetails } from '@/types/purchase';
// import { FileCheck, FileX, Calendar, Loader2, FileText } from 'lucide-react';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { toast } from "sonner";

// interface ChequeStatusModalProps {
//   purchase: PurchaseWithDetails;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function ChequeStatusModal({ 
//   purchase, 
//   onClose, 
//   onSuccess 
// }: ChequeStatusModalProps) {
//   const [status, setStatus] = useState<'cleared' | 'bounced'>('cleared');
//   const [clearingDate, setClearingDate] = useState<string>(new Date().toISOString().split('T')[0]);
//   const [processing, setProcessing] = useState(false);
  
//   if (!purchase.chequeDetails) {
//     return (
//       <Dialog open={true} onOpenChange={onClose}>
//         <DialogContent className="sm:max-w-[500px]">
//           <DialogHeader>
//             <DialogTitle>Error</DialogTitle>
//             <DialogDescription>
//               This purchase does not have valid cheque details.
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button onClick={onClose}>Close</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     );
//   }
  
//   const handleSubmit = async () => {
//     try {
//       setProcessing(true);
      
//       await purchaseService.updateChequeStatus(
//         purchase.id!, 
//         status, 
//         new Date(clearingDate)
//       );
      
//       toast.success(`Cheque marked as ${status}`);
//       onSuccess();
//     } catch (error) {
//       console.error('Error updating cheque status:', error);
//       toast.error('Error updating cheque status');
//     } finally {
//       setProcessing(false);
//     }
//   };
  
//   // Format date for display
//   const formatDate = (date: Date) => {
//     return new Date(date).toLocaleDateString();
//   };
  
//   return (
//     <Dialog open={true} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>Update Cheque Status</DialogTitle>
//           <DialogDescription>
//             Change the status of the cheque for purchase #{purchase.invoiceNumber || purchase.id?.slice(0, 6)}
//           </DialogDescription>
//         </DialogHeader>
        
//         <div className="space-y-4 py-4">
//           {/* Cheque Details */}
//           <div className="bg-slate-50 p-4 rounded-md space-y-3">
//             <h3 className="font-medium text-sm flex items-center gap-2">
//               <FileText className="h-4 w-4" />
//               Cheque Information
//             </h3>
            
//             <div className="grid grid-cols-2 gap-3 text-sm">
//               <div>
//                 <span className="text-muted-foreground">Cheque Number:</span>
//                 <p className="font-medium">{purchase.chequeDetails.chequeNumber}</p>
//               </div>
//               <div>
//                 <span className="text-muted-foreground">Cheque Date:</span>
//                 <p className="font-medium">
//                   {formatDate(purchase.chequeDetails.chequeDate)}
//                 </p>
//               </div>
//               <div>
//                 <span className="text-muted-foreground">Bank:</span>
//                 <p className="font-medium">{purchase.chequeDetails.bankName}</p>
//               </div>
//               <div>
//                 <span className="text-muted-foreground">Status:</span>
//                 <Badge 
//                   className={purchase.chequeDetails.status === 'pending' 
//                     ? 'bg-yellow-500' 
//                     : purchase.chequeDetails.status === 'cleared' 
//                       ? 'bg-green-500' 
//                       : 'bg-red-500'
//                   }
//                 >
//                   {purchase.chequeDetails.status.charAt(0).toUpperCase() + purchase.chequeDetails.status.slice(1)}
//                 </Badge>
//               </div>
//               {purchase.chequeDetails.accountName && (
//                 <div>
//                   <span className="text-muted-foreground">Account Name:</span>
//                   <p className="font-medium">{purchase.chequeDetails.accountName}</p>
//                 </div>
//               )}
//               {purchase.chequeDetails.branchName && (
//                 <div>
//                   <span className="text-muted-foreground">Branch:</span>
//                   <p className="font-medium">{purchase.chequeDetails.branchName}</p>
//                 </div>
//               )}
//             </div>
            
//             <div className="pt-2 border-t">
//               <span className="text-muted-foreground">Purchase Amount:</span>
//               <p className="font-medium">Rs{purchase.totalAmount.toFixed(2)}</p>
//             </div>
//           </div>
          
//           {/* Update Status */}
//           <div className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div 
//                 className={`border rounded-md p-3 cursor-pointer ${
//                   status === 'cleared' ? 'bg-green-50 border-green-200' : 'hover:bg-slate-50'
//                 }`}
//                 onClick={() => setStatus('cleared')}
//               >
//                 <div className="flex items-center justify-center mb-2">
//                   <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
//                     status === 'cleared' ? 'bg-green-500 text-white' : 'bg-slate-100'
//                   }`}>
//                     <FileCheck className="h-5 w-5" />
//                   </div>
//                 </div>
//                 <p className="text-center font-medium">Mark as Cleared</p>
//                 <p className="text-center text-xs text-muted-foreground">
//                   Payment will be marked as paid
//                 </p>
//               </div>
              
//               <div 
//                 className={`border rounded-md p-3 cursor-pointer ${
//                   status === 'bounced' ? 'bg-red-50 border-red-200' : 'hover:bg-slate-50'
//                 }`}
//                 onClick={() => setStatus('bounced')}
//               >
//                 <div className="flex items-center justify-center mb-2">
//                   <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
//                     status === 'bounced' ? 'bg-red-500 text-white' : 'bg-slate-100'
//                   }`}>
//                     <FileX className="h-5 w-5" />
//                   </div>
//                 </div>
//                 <p className="text-center font-medium">Mark as Bounced</p>
//                 <p className="text-center text-xs text-muted-foreground">
//                   Payment will remain unpaid
//                 </p>
//               </div>
//             </div>
            
//             <div className="space-y-2">
//               <Label htmlFor="clearingDate">
//                 {status === 'cleared' ? 'Clearing Date' : 'Bounced Date'}
//               </Label>
//               <div className="flex items-center gap-2">
//                 <Calendar className="h-4 w-4 text-muted-foreground" />
//                 <Input
//                   id="clearingDate"
//                   type="date"
//                   value={clearingDate}
//                   onChange={(e) => setClearingDate(e.target.value)}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
        
//         <DialogFooter>
//           <Button
//             type="button"
//             variant="outline"
//             onClick={onClose}
//             disabled={processing}
//           >
//             Cancel
//           </Button>
//           <Button
//             type="button"
//             onClick={handleSubmit}
//             disabled={processing}
//             variant={status === 'cleared' ? 'default' : 'destructive'}
//           >
//             {processing ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Processing...
//               </>
//             ) : (
//               `Mark as ${status === 'cleared' ? 'Cleared' : 'Bounced'}`
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }