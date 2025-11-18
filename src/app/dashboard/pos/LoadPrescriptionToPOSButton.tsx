// // // src/app/dashboard/pos/LoadPrescriptionToPOSButton.tsx

// 'use client';

// import React, { useState } from 'react';
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Checkbox } from "@/components/ui/checkbox";
// import { 
//   ShoppingCart, 
//   User, 
//   Phone, 
//   Pill, 
//   AlertCircle,
//   Loader2,
//   Plus,
//   CheckCircle,
//   Minus
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { Appointment } from '@/types/appointment';
// import { Prescription } from '@/types/prescription';
// import { inventoryService } from '@/services/inventoryService';
// import { purchaseService } from '@/services/purchaseService';
// import { appointmentService } from '@/services/appointmentService';
// import { useAuth } from '@/context/AuthContext';

// interface LoadPrescriptionToPOSButtonProps {
//   appointment: Appointment;
//   prescription: Prescription;
//   onLoadToPOS: (appointmentData: {
//     patientName: string;
//     patientPhone: string;
//     prescriptionItems: any[];
//     appointment: Appointment;
//     prescription: Prescription;
//     manualAppointmentAmount?: number;
//   }) => void;
// }

// interface PrescriptionItemWithInventory {
//   medicine: any;
//   inventoryItem: any | null;
//   availableBatches: any[];
//   isAvailable: boolean;
//   stockQuantity: number;
//   isSelected: boolean;
//   unitQuantity: number; // Quantity to add to cart
//   subUnitQuantity: number; // Sub-unit quantity to add to cart
// }

// export function LoadPrescriptionToPOSButton({ 
//   appointment, 
//   prescription, 
//   onLoadToPOS 
// }: LoadPrescriptionToPOSButtonProps) {
//   const { user } = useAuth();
//   const [loading, setLoading] = useState(false);
//   const [showPreview, setShowPreview] = useState(false);
//   const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItemWithInventory[]>([]);
//   const [manualAppointmentAmount, setManualAppointmentAmount] = useState<number>(0);
  
//   // Initialize manualAppointmentAmount with prescription's appointment amount
//   React.useEffect(() => {
//     if (prescription.appointmentAmount !== undefined) {
//       setManualAppointmentAmount(prescription.appointmentAmount);
//     }
//   }, [prescription.appointmentAmount]);
  
//   // Check if appointment has already been completed (paid through POS)
//   const isAlreadyCompleted = appointment.payment?.isPaid && appointment.payment?.paidThroughPOS;

//   const handleLoadPrescription = async () => {
//     setLoading(true);
//     try {
//       // Filter to only include inventory medicines (exclude written medicines)
//       const inventoryMedicines = prescription.medicines.filter(medicine => medicine.source === 'inventory');
      
//       if (inventoryMedicines.length === 0) {
//         toast.error('No inventory medicines found in this prescription. Only written medicines are available.');
//         setLoading(false);
//         return;
//       }

//       // Load inventory data for each inventory medicine only
//       const itemsWithInventory: PrescriptionItemWithInventory[] = [];
      
//       for (const medicine of inventoryMedicines) {
//         try {
//           // Search for inventory item by medicine name
//           const allInventory = await inventoryService.getAll();
//           const inventoryItem = allInventory.find(item => 
//             item.name.toLowerCase().includes(medicine.medicineName.toLowerCase()) ||
//             medicine.medicineName.toLowerCase().includes(item.name.toLowerCase()) ||
//             (item.genericName && item.genericName.toLowerCase().includes(medicine.medicineName.toLowerCase()))
//           );

//           let availableBatches: any[] = [];
//           let stockQuantity = 0;

//           if (inventoryItem) {
//             // Get available batches
//             const batches = await purchaseService.getBatchesByItem(inventoryItem.id!);
//             const today = new Date();
            
//             availableBatches = batches.filter(batch => 
//               batch.quantity > 0 && new Date(batch.expiryDate) > today
//             );
            
//             stockQuantity = availableBatches.reduce((sum, batch) => sum + batch.quantity, 0);
//           }

//           itemsWithInventory.push({
//             medicine,
//             inventoryItem,
//             availableBatches,
//             isAvailable: inventoryItem !== null && stockQuantity > 0,
//             stockQuantity,
//           //  isSelected: inventoryItem !== null && stockQuantity > 0, // Default to selected if available
//           isSelected: false, 
//           unitQuantity: 1, // Default quantity
//             subUnitQuantity: 0 // Default sub-unit quantity
//           });
//         } catch (error) {
//           console.error(`Error loading inventory for medicine ${medicine.medicineName}:`, error);
//           itemsWithInventory.push({
//             medicine,
//             inventoryItem: null,
//             availableBatches: [],
//             isAvailable: false,
//             stockQuantity: 0,
//             isSelected: false,
//             unitQuantity: 1,
//             subUnitQuantity: 0
//           });
//         }
//       }

//       setPrescriptionItems(itemsWithInventory);
//       setShowPreview(true);
//     } catch (error) {
//       console.error('Error loading prescription inventory:', error);
//       toast.error('Failed to load prescription inventory data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCheckboxChange = (index: number, checked: boolean) => {
//     setPrescriptionItems(prev => 
//       prev.map((item, i) => {
//         if (i === index) {
//           // When selecting, auto-fill quantity with prescription's drug count
//           if (checked && item.medicine.drugCount) {
//             return { 
//               ...item, 
//               isSelected: checked,
//               unitQuantity: item.medicine.drugCount,
//               subUnitQuantity: 0
//             };
//           }
//           return { ...item, isSelected: checked };
//         }
//         return item;
//       })
//     );
//   };

//   const handleQuantityChange = (index: number, field: 'unitQuantity' | 'subUnitQuantity', value: number) => {
//     setPrescriptionItems(prev => 
//       prev.map((item, i) => 
//         i === index ? { ...item, [field]: Math.max(0, value) } : item
//       )
//     );
//   };

//   const handleQuantityIncrement = (index: number, field: 'unitQuantity' | 'subUnitQuantity') => {
//     setPrescriptionItems(prev => 
//       prev.map((item, i) => 
//         i === index ? { ...item, [field]: item[field] + 1 } : item
//       )
//     );
//   };

//   const handleQuantityDecrement = (index: number, field: 'unitQuantity' | 'subUnitQuantity') => {
//     setPrescriptionItems(prev => 
//       prev.map((item, i) => 
//         i === index ? { ...item, [field]: Math.max(0, item[field] - 1) } : item
//       )
//     );
//   };


//   const handleConfirmLoadToPOS = async () => {
//     const selectedItems = prescriptionItems.filter(item => item.isSelected && item.isAvailable);
    
//     if (selectedItems.length === 0) {
//       toast.error('Please select at least one available medicine');
//       return;
//     }

//     // Validate quantities
//     const invalidItems = selectedItems.filter(item => item.unitQuantity === 0 && item.subUnitQuantity === 0);
//     if (invalidItems.length > 0) {
//       toast.error('Please set valid quantities for selected medicines');
//       return;
//     }

//     // Prepare prescription items for POS with quantities
//     const prescriptionItemsForPOS = selectedItems.map(item => ({
//       medicine: item.medicine,
//       inventoryItem: item.inventoryItem,
//       availableBatches: item.availableBatches,
//       stockQuantity: item.stockQuantity,
//       requestedUnitQuantity: item.unitQuantity,
//       requestedSubUnitQuantity: item.subUnitQuantity
//     }));

//     console.log('LoadPrescriptionToPOSButton - Full appointment object:', appointment);
//     console.log('LoadPrescriptionToPOSButton - Manual appointment amount:', manualAppointmentAmount);

//     // Load to POS with correct patient phone and manual appointment amount
//     onLoadToPOS({
//       patientName: appointment.patientName,
//       patientPhone: appointment.patientContact || 'No phone number',
//       prescriptionItems: prescriptionItemsForPOS,
//       appointment,
//       prescription,
//       manualAppointmentAmount: manualAppointmentAmount > 0 ? manualAppointmentAmount : undefined
//     });

//     // Note: We don't mark as loaded here - only when sale is completed
//     // This allows users to load the same appointment multiple times until sale is completed

//     toast.success(`${selectedItems.length} inventory medicines loaded to POS with custom quantities`);
//     setShowPreview(false);
//   };

//   const availableCount = prescriptionItems.filter(item => item.isAvailable).length;
//   const selectedCount = prescriptionItems.filter(item => item.isSelected && item.isAvailable).length;
//   const unavailableCount = prescriptionItems.filter(item => !item.isAvailable).length;

//   return (
//     <>
//       <Button
//         variant="default"
//         size="sm"
//         onClick={handleLoadPrescription}
//         disabled={loading || isAlreadyCompleted}
//         className={isAlreadyCompleted ? "bg-gray-400 hover:bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}
//       >
//         {loading ? (
//           <>
//             <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//             Loading...
//           </>
//         ) : isAlreadyCompleted ? (
//           <>
//             <CheckCircle className="h-4 w-4 mr-2" />
//             Already Completed
//           </>
//         ) : (
//           <>
//             <ShoppingCart className="h-4 w-4 mr-2" />
//             Load Inventory Medicines to POS
//           </>
//         )}
//       </Button>

//       <Dialog open={showPreview} onOpenChange={setShowPreview}>
//         <DialogContent className="max-w-7xl w-[95vw] h-[95vh] bg-white/95 backdrop-blur-xl border-0 shadow-2xl p-0 overflow-hidden">
//           <div className="flex flex-col h-full">
//             {/* Fixed Header */}
//             <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
//                     <ShoppingCart className="h-5 w-5 text-white" />
//                   </div>
//                   <div>
//                     <DialogTitle className="text-xl font-bold text-slate-800">
//                       Load Inventory Medicines to POS
//                     </DialogTitle>
//                     <p className="text-slate-600 mt-1">Set quantities for prescribed medicines</p>
//                   </div>
//                 </div>
//               </div>
//             </DialogHeader>
            
//             {/* Scrollable Content with improved scrolling */}
//             <div className="flex-1 overflow-y-auto overflow-x-hidden p-6" style={{ 
//               maxHeight: 'calc(95vh - 200px)',
//               scrollBehavior: 'smooth'
//             }}>
//               <div className="space-y-6 pb-8">
//             {/* Patient Info Preview */}
//             <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
//               <h3 className="font-bold text-blue-800 mb-3 text-lg">Patient Information</h3>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-100">
//                   <User className="h-5 w-5 text-blue-600 flex-shrink-0" />
//                   <div>
//                     <span className="text-xs text-gray-600 block">Patient Name</span>
//                     <span className="font-bold text-gray-900">{appointment.patientName}</span>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-100">
//                   <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
//                   <div>
//                     <span className="text-xs text-gray-600 block">Contact</span>
//                     <span className="font-bold text-gray-900">{appointment.patientContact || 'No phone number'}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Manual Appointment Amount Entry */}
//             <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
//               <h3 className="font-bold text-purple-800 mb-3 text-lg">Appointment Amount</h3>
//               <div className="flex flex-col lg:flex-row lg:items-center gap-4">
//                 <div className="flex-1">
//                   <label htmlFor="appointmentAmount" className="block text-sm font-bold text-purple-700 mb-2">
//                     {prescription.appointmentAmount !== undefined ? 'Appointment Amount from Prescription (Rs.)' : 'Enter Appointment Amount (Rs.)'}
//                   </label>
//                   <Input
//                     id="appointmentAmount"
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     value={manualAppointmentAmount || ''}
//                     onChange={(e) => setManualAppointmentAmount(parseFloat(e.target.value) || 0)}
//                     placeholder="Enter appointment amount"
//                     className="border-2 border-purple-200 focus:border-purple-400 h-12 text-lg font-semibold"
//                   />
//                 </div>
//                 <div className="text-sm text-purple-600 bg-white rounded-lg p-3 border border-purple-100">
//                   <p className="font-medium">
//                     {prescription.appointmentAmount !== undefined 
//                       ? 'Amount set by doctor in prescription. You can modify if needed.'
//                       : 'This amount will be added to the POS bill'
//                     }
//                   </p>
//                   <p className="font-medium">along with pharmacy items</p>
//                 </div>
//               </div>
//             </div>

//             {/* Information Notice */}
//             <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
//               <div className="flex items-center gap-2">
//                 <AlertCircle className="h-5 w-5 text-amber-600" />
//                 <div>
//                   <h4 className="font-medium text-amber-800">Inventory Medicines Only</h4>
//                   <p className="text-sm text-amber-700 mt-1">
//                     Only medicines available in your clinic's inventory are shown below. 
//                     Written medicines (to be purchased externally) are not included in POS loading.
//                   </p>
//                 </div>
//               </div>
//             </div>


//             {/* Inventory Status Summary */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
//                 <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
//                 <div className="text-2xl font-bold text-green-700">{availableCount}</div>
//                 <div className="text-sm text-green-600">Available in Stock</div>
//               </div>
//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
//                 <ShoppingCart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
//                 <div className="text-2xl font-bold text-blue-700">{selectedCount}</div>
//                 <div className="text-sm text-blue-600">Selected to Load</div>
//               </div>
//               <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
//                 <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
//                 <div className="text-2xl font-bold text-red-700">{unavailableCount}</div>
//                 <div className="text-sm text-red-600">Out of Stock</div>
//               </div>
//             </div>

//             {/* Medicines List with Quantity Controls */}
//             <div className="space-y-6">
//               <h3 className="font-medium text-gray-800 text-lg">Inventory Medicines from Prescription</h3>
//             <div className="space-y-4">
//                 {prescriptionItems.map((item, index) => (
//                   <div 
//                     key={index}
//                     className={`border-2 rounded-xl p-6 shadow-sm transition-all duration-200 hover:shadow-md ${
//                       item.isAvailable ? 'border-green-200 bg-green-50 hover:bg-green-100' : 'border-red-200 bg-red-50 hover:bg-red-100'
//                     }`}
//                   >
//                     <div className="flex items-start justify-between">
//                       <div className="flex items-start gap-3">
//                         {item.isAvailable && (
//                           <Checkbox
//                             checked={item.isSelected}
//                             onCheckedChange={(checked) => handleCheckboxChange(index, !!checked)}
//                             className="mt-1"
//                           />
//                         )}
//                         <div className="flex-1">
//                           <div className="flex items-center gap-2 mb-3">
//                             <Pill className="h-4 w-4 text-blue-600" />
//                             <h4 className="font-medium text-lg text-gray-900">{item.medicine.medicineName}</h4>
//                             {item.isAvailable ? (
//                               <Badge className="bg-green-100 text-green-800 border-green-300">
//                                 In Stock ({item.stockQuantity} units)
//                               </Badge>
//                             ) : (
//                               <Badge variant="destructive">
//                                 Out of Stock
//                               </Badge>
//                             )}
//                           </div>
                          
//                           {/* Prescription Details Box */}
//                           <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
//                             <h5 className="text-sm font-bold text-blue-800 mb-3 uppercase tracking-wide">Doctor's Prescription</h5>
//                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
//                               {/* Dose */}
//                               <div className="bg-white rounded-lg p-3 border border-blue-100">
//                                 <span className="text-gray-600 block text-xs font-medium mb-1">Dose</span>
//                                 <span className="font-bold text-gray-900 text-base">
//                                   {item.medicine.dose || item.medicine.dosage || 'N/A'}
//                                 </span>
//                               </div>
                              
//                               {/* Frequency */}
//                               <div className="bg-white rounded-lg p-3 border border-blue-100">
//                                 <span className="text-gray-600 block text-xs font-medium mb-1">Frequency</span>
//                                 <span className="font-bold text-gray-900 text-base">{item.medicine.frequency || 'N/A'}</span>
//                               </div>
                              
//                               {/* Days/Duration */}
//                               <div className="bg-white rounded-lg p-3 border border-blue-100">
//                                 <span className="text-gray-600 block text-xs font-medium mb-1">Duration</span>
//                                 <span className="font-bold text-gray-900 text-base">
//                                   {item.medicine.days ? `${item.medicine.days} days` : (item.medicine.duration || 'N/A')}
//                                 </span>
//                               </div>
                              
//                               {/* Drug Count - HIGHLIGHTED */}
//                               <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-3 shadow-sm">
//                                 <span className="text-orange-700 block text-xs font-bold mb-1 uppercase">To Dispense</span>
//                                 <span className="font-bold text-orange-900 text-xl">
//                                   {item.medicine.drugCount || 'N/A'}
//                                   {item.medicine.calculatedMl && item.medicine.drugCount > 10 ? ' ml' : ''}
//                                 </span>
//                               </div>
//                             </div>
                            
//                             {/* Special Instructions */}
//                             {(item.medicine.instructions || item.medicine.specialNote) && (
//                               <div className="mt-4 pt-3 border-t border-blue-200 bg-white rounded-lg p-3">
//                                 <span className="text-xs text-gray-600 font-bold uppercase tracking-wide">Instructions: </span>
//                                 <span className="text-sm text-gray-700 block mt-1">
//                                   {item.medicine.specialNote || item.medicine.instructions}
//                                 </span>
//                               </div>
//                             )}
//                           </div>


//                           {/* Quantity Controls */}
//                           {item.isAvailable && item.isSelected && (
//                             <div className="mt-6 p-4 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
//                               <h5 className="font-bold text-gray-800 mb-4 text-lg">Set Quantity to Add to Cart</h5>
//                               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                                 {/* Unit Quantity */}
//                                 <div className="bg-gray-50 rounded-lg p-4">
//                                   <label className="text-sm font-bold text-gray-700 mb-3 block">
//                                     Main Units ({item.inventoryItem?.unitContains ? item.inventoryItem.unitContains.name : 'Units'})
//                                   </label>
//                                   <div className="flex items-center gap-3">
//                                     <Button
//                                       size="sm"
//                                       variant="outline"
//                                       onClick={() => handleQuantityDecrement(index, 'unitQuantity')}
//                                       disabled={item.unitQuantity <= 0}
//                                       className="h-10 w-10 border-2 hover:bg-gray-100"
//                                     >
//                                       <Minus className="h-4 w-4" />
//                                     </Button>
//                                     <Input
//                                       type="number"
//                                       min="0"
//                                       value={item.unitQuantity}
//                                       onChange={(e) => handleQuantityChange(index, 'unitQuantity', parseInt(e.target.value) || 0)}
//                                       className="w-24 text-center h-10 text-lg font-bold border-2"
//                                     />
//                                     <Button
//                                       size="sm"
//                                       variant="outline"
//                                       onClick={() => handleQuantityIncrement(index, 'unitQuantity')}
//                                       className="h-10 w-10 border-2 hover:bg-gray-100"
//                                     >
//                                       <Plus className="h-4 w-4" />
//                                     </Button>
//                                   </div>
//                                 </div>

//                                 {/* Sub-Unit Quantity (only if item has unit contains) */}
//                                 {item.inventoryItem?.hasUnitContains && item.inventoryItem.unitContains && (
//                                   <div className="bg-gray-50 rounded-lg p-4">
//                                     <label className="text-sm font-bold text-gray-700 mb-3 block">
//                                       Sub Units ({item.inventoryItem.unitContains.unit})
//                                     </label>
//                                     <div className="flex items-center gap-3">
//                                       <Button
//                                         size="sm"
//                                         variant="outline"
//                                         onClick={() => handleQuantityDecrement(index, 'subUnitQuantity')}
//                                         disabled={item.subUnitQuantity <= 0}
//                                         className="h-10 w-10 border-2 hover:bg-gray-100"
//                                       >
//                                         <Minus className="h-4 w-4" />
//                                       </Button>
//                                       <Input
//                                         type="number"
//                                         min="0"
//                                         value={item.subUnitQuantity}
//                                         onChange={(e) => handleQuantityChange(index, 'subUnitQuantity', parseInt(e.target.value) || 0)}
//                                         className="w-24 text-center h-10 text-lg font-bold border-2"
//                                       />
//                                       <Button
//                                         size="sm"
//                                         variant="outline"
//                                         onClick={() => handleQuantityIncrement(index, 'subUnitQuantity')}
//                                         className="h-10 w-10 border-2 hover:bg-gray-100"
//                                       >
//                                         <Plus className="h-4 w-4" />
//                                       </Button>
//                                     </div>
//                                   </div>
//                                 )}
//                               </div>
                              
//                               {/* Total quantity display with prescription match indicator */}
//                               <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
//                                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//                                   <div className="text-gray-700">
//                                     <span className="font-bold text-sm">Total to add: </span>
//                                     <div className="text-base font-semibold">
//                                     {item.unitQuantity > 0 && `${item.unitQuantity} ${item.inventoryItem?.unitContains?.name || 'units'}`}
//                                     {item.unitQuantity > 0 && item.subUnitQuantity > 0 && ' + '}
//                                     {item.subUnitQuantity > 0 && `${item.subUnitQuantity} ${item.inventoryItem?.unitContains?.unit || 'sub-units'}`}
//                                     {item.unitQuantity === 0 && item.subUnitQuantity === 0 && (
//                                         <span className="text-red-500 font-bold">Please set quantity</span>
//                                     )}
//                                     </div>
//                                   </div>
                                  
//                                   {/* Prescription Match Indicator */}
//                                   {item.medicine.drugCount && (
//                                     <div className="flex items-center gap-2">
//                                       {item.unitQuantity === item.medicine.drugCount ? (
//                                         <Badge className="bg-green-100 text-green-800 border-green-300 text-sm px-3 py-1">
//                                           <CheckCircle className="h-4 w-4 mr-1" />
//                                           Matches Prescription
//                                         </Badge>
//                                       ) : (
//                                         <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-sm px-3 py-1">
//                                           <AlertCircle className="h-4 w-4 mr-1" />
//                                           Prescribed: {item.medicine.drugCount}
//                                         </Badge>
//                                       )}
//                                     </div>
//                                   )}
//                                 </div>
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>

//                     {!item.isAvailable && (
//                       <div className="mt-4 p-4 bg-red-100 rounded-xl border-2 border-red-200">
//                         <div className="flex items-center gap-3 text-red-700">
//                           <AlertCircle className="h-5 w-5 flex-shrink-0" />
//                           <div>
//                             <span className="text-sm font-bold block">
//                             {item.inventoryItem ? 
//                               'Item found but out of stock or expired' : 
//                               'No matching inventory item found'
//                             }
//                           </span>
//                             <span className="text-xs text-red-600 mt-1 block">
//                               This medicine will need to be added manually to the POS or purchased externally
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Action Buttons - Fixed at bottom */}
//             <div className="flex-shrink-0 border-t-2 border-gray-200 bg-gray-50 p-6">
//               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//                 <div className="text-sm text-gray-700">
//                   {selectedCount > 0 ? (
//                     <div className="flex items-center gap-2">
//                       <CheckCircle className="h-4 w-4 text-green-600" />
//                       <span className="text-green-700 font-semibold">
//                         {selectedCount} medicines will be loaded to POS with custom quantities
//                       </span>
//                     </div>
//                   ) : (
//                     <div className="flex items-center gap-2">
//                       <AlertCircle className="h-4 w-4 text-red-600" />
//                       <span className="text-red-700 font-semibold">
//                         No medicines selected to load
//                       </span>
//                     </div>
//                   )}
//                   {unavailableCount > 0 && (
//                     <div className="mt-2 flex items-center gap-2">
//                       <AlertCircle className="h-4 w-4 text-amber-600" />
//                       <span className="text-amber-700 font-medium">
//                         {unavailableCount} medicines need manual addition
//                       </span>
//                     </div>
//                   )}
//                 </div>
                
//                 <div className="flex gap-3">
//                   <Button
//                     variant="outline"
//                     onClick={() => setShowPreview(false)}
//                     className="border-2 border-gray-300 hover:bg-gray-50 px-6 py-2"
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     onClick={handleConfirmLoadToPOS}
//                     disabled={selectedCount === 0}
//                     className="bg-blue-600 hover:bg-blue-700 px-6 py-2 text-white font-semibold"
//                   >
//                     <Plus className="h-4 w-4 mr-2" />
//                     Load to POS ({selectedCount} items)
//                   </Button>
//                 </div>
//               </div>
//             </div>
//               </div>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }


// src/app/dashboard/pos/LoadPrescriptionToPOSButton.tsx

'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ShoppingCart, 
  User, 
  Users,
  Phone, 
  Pill, 
  AlertCircle,
  Loader2,
  Plus,
  CheckCircle,
  Minus,
  RefreshCw,
  PackageX
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Appointment } from '@/types/appointment';
import { Prescription } from '@/types/prescription';
import { inventoryService } from '@/services/inventoryService';
import { purchaseService } from '@/services/purchaseService';
import { prescriptionService } from '@/services/prescriptionService';
import { useAuth } from '@/context/AuthContext';

interface LoadPrescriptionToPOSButtonProps {
  appointment: Appointment;
  prescription: Prescription;
  initialPrescriptionId?: string | null;
  hidePatientSelector?: boolean;
  onLoadToPOS: (appointmentData: {
    patientName: string;
    patientPhone: string;
    prescriptionItems: any[];
    appointment: Appointment;
    prescription: Prescription;
    manualAppointmentAmount?: number;
    appointmentProcedures?: AppointmentProcedure[];
  }) => void;
}

interface PrescriptionItemWithInventory {
  medicine: any;
  inventoryItem: any | null;
  availableBatches: any[];
  isAvailable: boolean;
  stockQuantity: number;
  isSelected: boolean;
  unitQuantity: number;
  subUnitQuantity: number;
}

export function LoadPrescriptionToPOSButton({ 
  appointment, 
  prescription, 
  initialPrescriptionId,
  hidePatientSelector,
  onLoadToPOS 
}: LoadPrescriptionToPOSButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItemWithInventory[]>([]);
  const [manualAppointmentAmount, setManualAppointmentAmount] = useState<number>(0);
  const [currentPrescription, setCurrentPrescription] = useState<Prescription>(prescription);
  
  // Multi-patient support
  const [allPrescriptions, setAllPrescriptions] = useState<Prescription[]>([prescription]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(prescription.id || null);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  
  // Load all prescriptions for this appointment
  React.useEffect(() => {
    const loadAllPrescriptions = async () => {
      if (!appointment.id) return;
      setLoadingPrescriptions(true);
      try {
        const prescriptions = await prescriptionService.getAllPrescriptionsByAppointmentId(appointment.id);
        setAllPrescriptions(prescriptions);
        // If current prescription is not in the list, use the first one
        if (prescriptions.length > 0 && !prescriptions.find(p => p.id === prescription.id)) {
          setSelectedPrescriptionId(prescriptions[0].id || null);
          setCurrentPrescription(prescriptions[0]);
        }
      } catch (error) {
        console.error('Error loading all prescriptions:', error);
      } finally {
        setLoadingPrescriptions(false);
      }
    };
    loadAllPrescriptions();
  }, [appointment.id, prescription.id]);
  
  React.useEffect(() => {
    if (currentPrescription.appointmentAmount !== undefined) {
      setManualAppointmentAmount(currentPrescription.appointmentAmount);
    }
  }, [currentPrescription.appointmentAmount]);
  
  // Allow parent components to drive the selected prescription (e.g., from appointment table)
  React.useEffect(() => {
    if (initialPrescriptionId && initialPrescriptionId !== selectedPrescriptionId) {
      setSelectedPrescriptionId(initialPrescriptionId);
    }
  }, [initialPrescriptionId, selectedPrescriptionId]);

  // Update current prescription when selected prescription changes
  React.useEffect(() => {
    if (selectedPrescriptionId) {
      const selectedPrescription = allPrescriptions.find(p => p.id === selectedPrescriptionId);
      if (selectedPrescription) {
        setCurrentPrescription(selectedPrescription);
      }
    }
  }, [selectedPrescriptionId, allPrescriptions]);

  // Function to refresh prescription data from database
  const refreshPrescriptionData = async () => {
    try {
      // Refresh all prescriptions
      const allPrescriptions = await prescriptionService.getAllPrescriptionsByAppointmentId(appointment.id!);
      setAllPrescriptions(allPrescriptions);
      
      // Get the selected prescription
      if (selectedPrescriptionId) {
        const updatedPrescription = allPrescriptions.find(p => p.id === selectedPrescriptionId);
        if (updatedPrescription) {
          setCurrentPrescription(updatedPrescription);
          return updatedPrescription;
        }
      }
      
      // Fallback to first prescription
      if (allPrescriptions.length > 0) {
        setCurrentPrescription(allPrescriptions[0]);
        setSelectedPrescriptionId(allPrescriptions[0].id || null);
        return allPrescriptions[0];
      }
    } catch (error) {
      console.error('Error refreshing prescription data:', error);
    }
    return currentPrescription;
  };
  
  // Check if the CURRENT SELECTED prescription is already paid (not the whole appointment)
  // For multi-patient appointments, each prescription can be paid separately
  const isAlreadyCompleted = React.useMemo(() => {
    if (!currentPrescription?.id) return false;
    // Check if this specific prescription is paid
    return currentPrescription.isPaid === true && currentPrescription.paidThroughPOS === true;
  }, [currentPrescription]);

  const handleLoadPrescription = async () => {
    setLoading(true);
    try {
      // First, refresh prescription data to get latest changes from pharmacy
      const latestPrescription = await refreshPrescriptionData();
      const inventoryMedicines = (latestPrescription.medicines || []).filter(medicine => medicine.source === 'inventory');
      
      // Allow loading to POS even without medicines (just appointment amount)
      // Only show error if there's no appointment amount either
      if (inventoryMedicines.length === 0 && (!latestPrescription.appointmentAmount || latestPrescription.appointmentAmount === 0)) {
        toast.error('No inventory medicines found in this prescription and no appointment amount set.');
        setLoading(false);
        return;
      }

      let itemsWithInventory: PrescriptionItemWithInventory[] = [];

      // Only process medicines if they exist
      if (inventoryMedicines.length > 0) {
        // Fetch all inventory items at once for efficiency
        const allInventory = await inventoryService.getAll();

        itemsWithInventory = await Promise.all(
        inventoryMedicines.map(async (medicine) => {
          try {
            const inventoryItem = allInventory.find(item => 
              item.name.toLowerCase().includes(medicine.medicineName.toLowerCase()) ||
              medicine.medicineName.toLowerCase().includes(item.name.toLowerCase()) ||
              (item.genericName && item.genericName.toLowerCase().includes(medicine.medicineName.toLowerCase()))
            );

            let stockQuantity = 0;
            let availableBatches: any[] = [];

            if (inventoryItem) {
              const batches = await purchaseService.getBatchesByItem(inventoryItem.id!);
              const today = new Date();
              availableBatches = batches.filter(batch => 
                batch.quantity > 0 && new Date(batch.expiryDate) > today
              );
              stockQuantity = availableBatches.reduce((sum, batch) => sum + batch.quantity, 0);
            }

            const isAvailable = inventoryItem !== null && stockQuantity > 0;

            return {
              medicine,
              inventoryItem,
              availableBatches, // Fix: Ensure availableBatches is passed
              isAvailable,
              stockQuantity,
              isSelected: false,
              unitQuantity: medicine.drugCount || 1,
              subUnitQuantity: 0,
            };
          } catch (error) {
            console.error(`Error loading inventory for medicine ${medicine.medicineName}:`, error);
            return {
              medicine,
              inventoryItem: null,
              availableBatches: [],
              isAvailable: false,
              stockQuantity: 0,
              isSelected: false,
              unitQuantity: 1,
              subUnitQuantity: 0,
            };
          }
        })
        );
      }

      setPrescriptionItems(itemsWithInventory);
      setShowPreview(true);
    } catch (error) {
      console.error('Error loading prescription inventory:', error);
      toast.error('Failed to load prescription inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (index: number, checked: boolean) => {
    setPrescriptionItems(prev => 
      prev.map((item, i) => i === index ? { ...item, isSelected: checked } : item)
    );
  };

  const handleQuantityChange = (index: number, value: number) => {
    setPrescriptionItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, unitQuantity: Math.max(0, value) } : item
      )
    );
  };

  const handleConfirmLoadToPOS = async () => {
    const selectedItems = prescriptionItems.filter(item => item.isSelected && item.isAvailable);
    
    // Allow loading to POS with just appointment amount (no medicines required)
    if (selectedItems.length === 0 && (!manualAppointmentAmount || manualAppointmentAmount === 0)) {
      toast.error('Please select at least one available medicine or set an appointment amount');
      return;
    }

    // Only validate quantities if medicines are selected
    if (selectedItems.length > 0) {
      const invalidItems = selectedItems.filter(item => item.unitQuantity === 0 && item.subUnitQuantity === 0);
      if (invalidItems.length > 0) {
        toast.error('Please set valid quantities for selected medicines');
        return;
      }
    }

    const prescriptionItemsForPOS = selectedItems.map(item => ({
      ...item,
      requestedUnitQuantity: item.unitQuantity,
      requestedSubUnitQuantity: item.subUnitQuantity,
    }));

    onLoadToPOS({
      patientName: currentPrescription.patientName || appointment.patientName,
      patientPhone: appointment.patientContact || 'No phone number',
      prescriptionItems: prescriptionItemsForPOS,
      appointment,
      prescription: currentPrescription, // Use selected prescription
      manualAppointmentAmount: manualAppointmentAmount > 0 ? manualAppointmentAmount : undefined,
      appointmentProcedures: appointment.procedures || [] // Pass appointment procedures
    });

    const message = selectedItems.length > 0 
      ? `${selectedItems.length} inventory medicine(s) loaded to POS`
      : 'Appointment amount loaded to POS';
    if (manualAppointmentAmount > 0) {
      toast.success(`${message}${selectedItems.length > 0 ? ' with appointment amount' : ''}`);
    } else {
      toast.success(message);
    }
    setShowPreview(false);
  };

  const availableCount = prescriptionItems.filter(item => item.isAvailable).length;
  const selectedCount = prescriptionItems.filter(item => item.isSelected && item.isAvailable).length;
  const unavailableCount = prescriptionItems.filter(item => !item.isAvailable).length;

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Optional inline patient selector (hidden on today-appointments page) */}
        {!hidePatientSelector && allPrescriptions.length > 1 && (
          <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Patient ({allPrescriptions.length} patients)
              </Label>
              {loadingPrescriptions && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
            </div>
            {/* Summary of paid/unpaid patients */}
            {(() => {
              const paidCount = allPrescriptions.filter(p => p.isPaid).length;
              const unpaidCount = allPrescriptions.length - paidCount;
              return (
                <div className="mb-3 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-green-700 font-medium">{paidCount} paid</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-orange-600" />
                    <span className="text-orange-700 font-medium">{unpaidCount} remaining</span>
                  </div>
                </div>
              );
            })()}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {allPrescriptions.map((prescription) => {
                const isPaid = prescription.isPaid || false;
                const isSelected = selectedPrescriptionId === prescription.id;
                return (
                  <button
                    key={prescription.id}
                    onClick={() => {
                      if (!isPaid) {
                        setSelectedPrescriptionId(prescription.id || null);
                        setPrescriptionItems([]);
                        setShowPreview(false);
                      }
                    }}
                    disabled={isPaid}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-100 shadow-md'
                        : isPaid
                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {prescription.patientName}
                        </div>
                        {prescription.patientAge && (
                          <div className="text-xs text-gray-600 mt-1">
                            Age: {prescription.patientAge}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {isPaid && (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            Paid ✓
                          </Badge>
                        )}
                        {isSelected && !isPaid && (
                          <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleLoadPrescription}
            disabled={loading || isAlreadyCompleted || loadingPrescriptions}
            className={isAlreadyCompleted ? "bg-gray-400 hover:bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
            {isAlreadyCompleted ? "Already Completed" : 
             (() => {
               const hasPharmacyChanges = currentPrescription.medicines?.some(med => med.pharmacyAdded || med.pharmacyEdited);
               const hasMedicines = currentPrescription.medicines && currentPrescription.medicines.length > 0;
               if (hasPharmacyChanges) {
                 return "Load Pharmacy-Reviewed Prescription to POS";
               } else if (hasMedicines) {
                 return "Load Inventory Medicines to POS";
               } else {
                 return "Load Appointment to POS";
               }
             })()}
          </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await refreshPrescriptionData();
            toast.success("Prescription data refreshed");
          }}
          disabled={loading}
          className="border-blue-200 hover:bg-blue-50"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] bg-white/95 backdrop-blur-xl p-0 flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-xl font-bold text-slate-800">
              Load Inventory Medicines to POS
            </DialogTitle>
             <p className="text-slate-600">Review prescribed medicines and set quantities to add to the cart.</p>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Patient & Appointment Amount Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h3 className="font-bold text-blue-800 mb-3 text-lg flex items-center gap-2">
                        <User className="h-5 w-5" /> Patient Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="font-semibold text-gray-600">Name:</div>
                        <div className="font-bold text-gray-900">{currentPrescription.patientName || appointment.patientName}</div>
                        {currentPrescription.patientAge && (
                            <>
                                <div className="font-semibold text-gray-600">Age:</div>
                                <div className="font-bold text-gray-900">{currentPrescription.patientAge}</div>
                            </>
                        )}
                        <div className="font-semibold text-gray-600">Contact:</div>
                        <div className="font-bold text-gray-900">{appointment.patientContact || 'N/A'}</div>
                        {allPrescriptions.length > 1 && (
                            <>
                                <div className="font-semibold text-gray-600">Total Patients:</div>
                                <div className="font-bold text-gray-900">{allPrescriptions.length} patients</div>
                            </>
                        )}
                    </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                     <h3 className="font-bold text-purple-800 mb-3 text-lg">Appointment Amount</h3>
                    <div className="flex items-center gap-4">
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={manualAppointmentAmount || ''}
                            onChange={(e) => setManualAppointmentAmount(parseFloat(e.target.value) || 0)}
                            placeholder="Enter amount"
                            className="border-purple-200 focus:border-purple-400 h-12 text-lg font-semibold flex-1"
                        />
                        <p className="text-sm text-purple-700">
                            {prescription.appointmentAmount !== undefined 
                                ? 'Amount from prescription. You can modify.'
                                : 'This amount will be added to the bill.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Pharmacy Modifications Summary */}
            {(() => {
              const pharmacyAddedCount = prescriptionItems.filter(item => item.medicine.pharmacyAdded).length;
              const pharmacyEditedCount = prescriptionItems.filter(item => item.medicine.pharmacyEdited).length;
              const outOfStockCount = prescriptionItems.filter(item => item.medicine.outOfStock).length;
              
              if (pharmacyAddedCount > 0 || pharmacyEditedCount > 0 || outOfStockCount > 0) {
                return (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                    <h3 className="font-bold text-blue-800 mb-3 text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Pharmacy Review Completed
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {pharmacyAddedCount > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <div className="text-sm text-blue-600 font-medium">Medicines Added by Pharmacy</div>
                          <div className="text-2xl font-bold text-blue-700">{pharmacyAddedCount}</div>
                        </div>
                      )}
                      {pharmacyEditedCount > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <div className="text-sm text-blue-600 font-medium">Quantities Modified</div>
                          <div className="text-2xl font-bold text-blue-700">{pharmacyEditedCount}</div>
                        </div>
                      )}
                      {outOfStockCount > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-red-100">
                          <div className="text-sm text-red-600 font-medium flex items-center gap-1">
                            <PackageX className="h-4 w-4" />
                            Marked Out of Stock
                          </div>
                          <div className="text-2xl font-bold text-red-700">{outOfStockCount}</div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-blue-700 mt-3">
                      The pharmacy has reviewed and modified this prescription. Changes are reflected below.
                    </p>
                    {outOfStockCount > 0 && (
                      <p className="text-sm text-red-700 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {outOfStockCount} medicine(s) marked as out of stock by pharmacy and cannot be loaded.
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{availableCount}</div>
                <div className="text-sm text-green-600">Available in Stock</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{selectedCount}</div>
                <div className="text-sm text-blue-600">Selected to Load</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-700">{unavailableCount}</div>
                <div className="text-sm text-red-600">Out of Stock</div>
              </div>
            </div>

            {/* Medicines Table - Only show if there are medicines */}
            {prescriptionItems.length > 0 ? (
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-12 text-center">Load</TableHead>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Stock Status</TableHead>
                    <TableHead>Prescription</TableHead>
                    <TableHead className="w-48 text-center">Quantity to Add</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptionItems.map((item, index) => (
                    <TableRow 
                        key={index}
                        className={!item.isAvailable ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}
                    >
                      <TableCell className="p-2 text-center">
                        {item.isAvailable && (
                          <Checkbox
                            checked={item.isSelected}
                            onCheckedChange={(checked) => handleCheckboxChange(index, !!checked)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-gray-800">
                        <div className="flex flex-col gap-2">
                          <div className="text-lg font-bold text-gray-900">
                            {item.medicine.medicineName}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.medicine.outOfStock && (
                              <Badge className="bg-red-500 text-white text-xs">
                                <PackageX className="h-3 w-3 mr-1" />
                                Pharmacy: Out of Stock
                              </Badge>
                            )}
                            {item.medicine.pharmacyAdded && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                Added by Pharmacy
                              </Badge>
                            )}
                            {item.medicine.pharmacyEdited && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                Quantity Modified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.isAvailable ? (
                          <Badge className="bg-green-100 text-green-800">In Stock ({item.stockQuantity})</Badge>
                        ) : (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          <div className="whitespace-nowrap">
                            <span className="font-semibold">Dose:</span> {item.medicine.dose || 'N/A'}
                          </div>
                          <div className="whitespace-nowrap">
                            <span className="font-semibold">Freq:</span> {item.medicine.frequency || 'N/A'}
                          </div>
                          <div className="whitespace-nowrap">
                            <span className="font-semibold">Days:</span> {item.medicine.days || 'N/A'}
                          </div>
                          <div className="font-bold text-orange-600 whitespace-nowrap">
                            <span className="font-semibold">Dispense:</span> {item.medicine.drugCount || 'N/A'}
                            {item.medicine.originalDrugCount && item.medicine.originalDrugCount !== item.medicine.drugCount && (
                              <span className="text-xs text-yellow-600 ml-2">
                                (was: {item.medicine.originalDrugCount})
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center p-2">
                        {item.isAvailable ? (
                          <div className="flex items-center justify-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={item.unitQuantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                              className="w-20 text-center font-bold text-lg h-10"
                            />
                            <div className="flex flex-col">
                               <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleQuantityChange(index, item.unitQuantity + 1)}><Plus className="h-3 w-3"/></Button>
                               <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleQuantityChange(index, item.unitQuantity - 1)} disabled={item.unitQuantity <= 0}><Minus className="h-3 w-3"/></Button>
                            </div>
                          </div>
                        ) : (
                           <span className="text-red-500 text-xs">Not available</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center bg-blue-50">
                <Pill className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Inventory Medicines</h3>
                <p className="text-gray-600 mb-4">This prescription doesn't contain any inventory medicines.</p>
                <p className="text-sm text-blue-700 font-medium">
                  {manualAppointmentAmount > 0 
                    ? `Appointment amount of ${manualAppointmentAmount.toFixed(2)} Rs. will be added to POS.`
                    : 'You can still load the appointment amount to POS if set.'}
                </p>
              </div>
            )}
             {unavailableCount > 0 && (
                 <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    {unavailableCount} medicine(s) are out of stock and cannot be loaded.
                 </div>
             )}
          </div>

          {/* Fixed Footer */}
          <div className="border-t bg-gray-50 p-6 flex justify-between items-center">
            <div>
              {prescriptionItems.length > 0 ? (
                <span className="font-semibold text-gray-700">{selectedCount} / {availableCount} available items selected.</span>
              ) : (
                <span className="font-semibold text-gray-700">
                  {manualAppointmentAmount > 0 
                    ? `Appointment amount: ${manualAppointmentAmount.toFixed(2)} Rs.`
                    : 'No medicines. Set appointment amount to load to POS.'}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
              <Button
                onClick={handleConfirmLoadToPOS}
                disabled={selectedCount === 0 && (!manualAppointmentAmount || manualAppointmentAmount === 0)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {prescriptionItems.length > 0 
                  ? `Load to POS (${selectedCount} items${manualAppointmentAmount > 0 ? ' + appointment' : ''})`
                  : 'Load Appointment Amount to POS'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}  
