// // src/app/dashboard/pos/PharmacyPOS.tsx

// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { 
//   ArrowLeft,
//   Search,
//   Pill,
//   ShoppingCart,
//   Plus,
//   Minus,
//   CheckCircle,
//   XCircle,
//   Package,
//   User,
//   Phone,
//   Calendar,
//   Clock,
//   Stethoscope,
//   Loader2,
//   AlertCircle,
//   Eye,
//   Trash2,
//   X
// } from 'lucide-react';
// import { toast } from 'sonner';
// import { Appointment } from '@/types/appointment';
// import { Prescription } from '@/types/prescription';
// import { InventoryItem } from '@/types/inventory';
// import { inventoryService } from '@/services/inventoryService';
// import { purchaseService } from '@/services/purchaseService';
// import { format } from 'date-fns';

// interface PharmacyPOSProps {
//   appointment: Appointment;
//   prescription: Prescription;
//   onBack: () => void;
//   onLoadToMainPOS: (pharmacyData: {
//     patientName: string;
//     patientPhone: string;
//     prescriptionItems: any[];
//     appointment: Appointment;
//     prescription: Prescription;
//     pharmacyReviewedItems: PharmacyItem[];
//     pharmacyReviewStatus: 'reviewed' | 'pending';
//   }) => void;
// }

// interface PharmacyItem {
//   id: string;
//   medicineName: string;
//   dosage: string;
//   frequency: string;
//   duration: string;
//   instructions?: string;
//   source: 'prescription' | 'manual';
//   isSelected: boolean;
//   quantity: number;
//   unitPrice: number;
//   totalPrice: number;
//   inventoryItem?: any;
//   batch?: any;
//   isAvailable: boolean;
//   isQuantityAdjusted: boolean;
//   originalQuantity?: number;
// }

// interface LocalInventoryItem {
//   id: string;
//   name: string;
//   unitContains?: { value: number; unit: string };
//   batches?: any[];
// }

// export function PharmacyPOS({ 
//   appointment, 
//   prescription, 
//   onBack, 
//   onLoadToMainPOS 
// }: PharmacyPOSProps) {
//   const [loading, setLoading] = useState(false);
//   const [pharmacyItems, setPharmacyItems] = useState<PharmacyItem[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
//   const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
//   const [selectedBatch, setSelectedBatch] = useState<any>(null);
//   const [showAddItemDialog, setShowAddItemDialog] = useState(false);
//   const [manualQuantity, setManualQuantity] = useState(1);
//   const [manualUnitPrice, setManualUnitPrice] = useState(0);
//   const [isLoadingInventory, setIsLoadingInventory] = useState(false);
//   const [pharmacyReviewStatus, setPharmacyReviewStatus] = useState<'pending' | 'reviewed'>('pending');
  
//   const searchInputRef = useRef<HTMLInputElement>(null);

//   // Initialize pharmacy items from prescription
//   useEffect(() => {
//     initializePharmacyItems();
//   }, [prescription]);

//   const initializePharmacyItems = async () => {
//     setLoading(true);
//     try {
//       const items: PharmacyItem[] = [];
      
//       // Process prescription medicines
//       for (const medicine of prescription.medicines) {
//         if (medicine.source === 'inventory') {
//           // Load inventory data for this medicine
//           try {
//             // Search for inventory item by medicine name
//             const allInventory = await inventoryService.getAll();
//             const inventoryItem = allInventory.find(item => 
//               item.name.toLowerCase().includes(medicine.medicineName.toLowerCase()) ||
//               medicine.medicineName.toLowerCase().includes(item.name.toLowerCase()) ||
//               (item.genericName && item.genericName.toLowerCase().includes(medicine.medicineName.toLowerCase()))
//             );
//             if (inventoryItem) {
//               // Get available batches
//               const batches = await purchaseService.getBatchesByItem(inventoryItem.id!);
//               const availableBatch = batches.find(batch => 
//                 batch.quantity > 0
//               );
              
//               if (availableBatch) {
//                 const unitPrice = availableBatch.unitPrice || 0;
//                 const quantity = medicine.drugCount || 1; // Use prescribed drug count
                
//                 items.push({
//                   id: `prescription-${medicine.id}`,
//                   medicineName: medicine.medicineName,
//                   dosage: medicine.dosage,
//                   frequency: medicine.frequency,
//                   duration: medicine.duration,
//                   instructions: medicine.instructions,
//                   source: 'prescription',
//                   isSelected: true, // Prescription items are selected by default
//                   quantity,
//                   unitPrice,
//                   totalPrice: quantity * unitPrice,
//                   inventoryItem,
//                   batch: availableBatch,
//                   isAvailable: true,
//                   isQuantityAdjusted: false,
//                   originalQuantity: quantity
//                 });
//               } else {
//                 // Medicine not available in inventory
//                 items.push({
//                   id: `prescription-${medicine.id}`,
//                   medicineName: medicine.medicineName,
//                   dosage: medicine.dosage,
//                   frequency: medicine.frequency,
//                   duration: medicine.duration,
//                   instructions: medicine.instructions,
//                   source: 'prescription',
//                   isSelected: false,
//                   quantity: 0,
//                   unitPrice: 0,
//                   totalPrice: 0,
//                   inventoryItem,
//                   isAvailable: false,
//                   isQuantityAdjusted: false
//                 });
//               }
//             } else {
//               // Medicine not found in inventory
//               items.push({
//                 id: `prescription-${medicine.id}`,
//                 medicineName: medicine.medicineName,
//                 dosage: medicine.dosage,
//                 frequency: medicine.frequency,
//                 duration: medicine.duration,
//                 instructions: medicine.instructions,
//                 source: 'prescription',
//                 isSelected: false,
//                 quantity: 0,
//                 unitPrice: 0,
//                 totalPrice: 0,
//                 isAvailable: false,
//                 isQuantityAdjusted: false
//               });
//             }
//           } catch (error) {
//             console.error(`Error loading inventory for ${medicine.medicineName}:`, error);
//             // Add as unavailable
//             items.push({
//               id: `prescription-${medicine.id}`,
//               medicineName: medicine.medicineName,
//               dosage: medicine.dosage,
//               frequency: medicine.frequency,
//               duration: medicine.duration,
//               instructions: medicine.instructions,
//               source: 'prescription',
//               isSelected: false,
//               quantity: 0,
//               unitPrice: 0,
//               totalPrice: 0,
//               isAvailable: false,
//               isQuantityAdjusted: false
//             });
//           }
//         }
//       }
      
//       setPharmacyItems(items);
//     } catch (error) {
//       console.error('Error initializing pharmacy items:', error);
//       toast.error('Failed to load prescription medicines');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearchInventory = async (searchTerm: string) => {
//     if (!searchTerm.trim()) {
//       setInventoryItems([]);
//       return;
//     }

//     setIsLoadingInventory(true);
//     try {
//       // Search inventory items by name
//       const allInventory = await inventoryService.getAll();
//       const items = allInventory.filter(item => 
//         item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (item.genericName && item.genericName.toLowerCase().includes(searchTerm.toLowerCase()))
//       );
//       setInventoryItems(items);
//     } catch (error) {
//       console.error('Error searching inventory:', error);
//       toast.error('Failed to search inventory');
//     } finally {
//       setIsLoadingInventory(false);
//     }
//   };

//   const handleInventoryItemSelect = async (item: InventoryItem) => {
//     setSelectedInventoryItem(item);
//     try {
//       // Get batches for the selected item
//       const batches = await purchaseService.getBatchesByItem(item.id!);
//       if (batches && batches.length > 0) {
//         const availableBatch = batches.find(batch => 
//           batch.quantity > 0
//         );
//         if (availableBatch) {
//           setSelectedBatch(availableBatch);
//           setManualUnitPrice(availableBatch.unitPrice || 0);
//         }
//       }
//     } catch (error) {
//       console.error('Error loading batches for item:', error);
//       toast.error('Failed to load batches for selected item');
//     }
//   };

//   const handleAddManualItem = () => {
//     if (!selectedInventoryItem || !selectedBatch) {
//       toast.error('Please select an item and batch');
//       return;
//     }

//     const newItem: PharmacyItem = {
//       id: `manual-${Date.now()}`,
//       medicineName: selectedInventoryItem.name,
//       dosage: 'As needed',
//       frequency: 'As needed',
//       duration: 'As needed',
//       source: 'manual',
//       isSelected: true,
//       quantity: manualQuantity,
//       unitPrice: manualUnitPrice,
//       totalPrice: manualQuantity * manualUnitPrice,
//       inventoryItem: selectedInventoryItem,
//       batch: selectedBatch,
//       isAvailable: true,
//       isQuantityAdjusted: false
//     };

//     setPharmacyItems([...pharmacyItems, newItem]);
//     setShowAddItemDialog(false);
//     setSelectedInventoryItem(null);
//     setSelectedBatch(null);
//     setManualQuantity(1);
//     setManualUnitPrice(0);
//     setSearchTerm('');
//     setInventoryItems([]);
    
//     toast.success(`${selectedInventoryItem.name} added to pharmacy review`);
//   };

//   const handleToggleItemSelection = (itemId: string) => {
//     setPharmacyItems(items => 
//       items.map(item => 
//         item.id === itemId 
//           ? { ...item, isSelected: !item.isSelected }
//           : item
//       )
//     );
//   };

//   const handleQuantityChange = (itemId: string, newQuantity: number) => {
//     if (newQuantity < 0) return;
    
//     setPharmacyItems(items => 
//       items.map(item => {
//         if (item.id === itemId) {
//           const totalPrice = newQuantity * item.unitPrice;
//           const isQuantityAdjusted = item.originalQuantity !== undefined && newQuantity !== item.originalQuantity;
//           return {
//             ...item,
//             quantity: newQuantity,
//             totalPrice,
//             isQuantityAdjusted
//           };
//         }
//         return item;
//       })
//     );
//   };

//   const handleRemoveItem = (itemId: string) => {
//     setPharmacyItems(items => items.filter(item => item.id !== itemId));
//   };

//   const handleLoadToMainPOS = () => {
//     const selectedItems = pharmacyItems.filter(item => item.isSelected && item.isAvailable);
    
//     if (selectedItems.length === 0) {
//       toast.error('Please select at least one medicine to load to POS');
//       return;
//     }

//     // Convert pharmacy items to POS format
//     const prescriptionItems = selectedItems.map(item => ({
//       itemId: item.inventoryItem?.id || item.id,
//       item: item.inventoryItem,
//       batchId: item.batch?.id,
//       batch: item.batch,
//       unitQuantity: item.quantity,
//       subUnitQuantity: 0,
//       unitPrice: item.unitPrice,
//       subUnitPrice: 0,
//       totalPrice: item.totalPrice,
//       totalCost: item.batch?.costPerUnit ? item.quantity * item.batch.costPerUnit : 0,
//       itemDiscountPercentage: 0,
//       itemDiscount: 0,
//       isPriceAdjusted: false,
//       originalUnitPrice: item.unitPrice,
//       isSubUnitPriceAdjusted: false,
//       originalSubUnitPrice: 0,
//       fromFreeItemBatch: false,
//       pharmacyReviewed: true,
//       pharmacyReviewNotes: item.isQuantityAdjusted ? `Quantity adjusted from ${item.originalQuantity} to ${item.quantity}` : undefined
//     }));

//     setPharmacyReviewStatus('reviewed');
    
//     console.log('PharmacyPOS: Calling onLoadToMainPOS with data:', {
//       appointmentId: appointment.id,
//       patientName: appointment.patientName,
//       selectedItemsCount: selectedItems.length,
//       prescriptionItemsCount: prescriptionItems.length
//     });

//     onLoadToMainPOS({
//       patientName: appointment.patientName,
//       patientPhone: appointment.patientContact || '',
//       prescriptionItems,
//       appointment,
//       prescription,
//       pharmacyReviewedItems: selectedItems,
//       pharmacyReviewStatus: 'reviewed'
//     });

//     toast.success('Pharmacy review completed and loaded to main POS');
//   };

//   const selectedCount = pharmacyItems.filter(item => item.isSelected && item.isAvailable).length;
//   const totalValue = pharmacyItems
//     .filter(item => item.isSelected && item.isAvailable)
//     .reduce((sum, item) => sum + item.totalPrice, 0);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//         <span className="ml-2">Loading prescription medicines...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Status Badge */}
//       <div className="flex justify-end">
//         <Badge 
//           variant={pharmacyReviewStatus === 'reviewed' ? 'default' : 'secondary'} 
//           className={`px-4 py-2 text-sm ${
//             pharmacyReviewStatus === 'reviewed' 
//               ? 'bg-green-100 text-green-800 border-green-200' 
//               : 'bg-amber-100 text-amber-800 border-amber-200'
//           }`}
//         >
//           {pharmacyReviewStatus === 'reviewed' ? (
//             <>
//               <CheckCircle className="h-4 w-4 mr-2" />
//               Review Completed
//             </>
//           ) : (
//             <>
//               <Clock className="h-4 w-4 mr-2" />
//               Pending Review
//             </>
//           )}
//         </Badge>
//       </div>

//       {/* Patient Information */}
//       <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
//         <CardHeader className="pb-4">
//           <CardTitle className="flex items-center gap-3">
//             <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
//               <User className="h-5 w-5 text-white" />
//             </div>
//             <span className="text-slate-800">Patient Information</span>
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-blue-100">
//               <div className="p-2 bg-blue-100 rounded-lg">
//                 <User className="h-4 w-4 text-blue-600" />
//               </div>
//               <div>
//                 <p className="text-xs text-slate-500">Patient Name</p>
//                 <p className="font-semibold text-slate-800">{appointment.patientName}</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-green-100">
//               <div className="p-2 bg-green-100 rounded-lg">
//                 <Phone className="h-4 w-4 text-green-600" />
//               </div>
//               <div>
//                 <p className="text-xs text-slate-500">Contact</p>
//                 <p className="font-semibold text-slate-800">{appointment.patientContact}</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-purple-100">
//               <div className="p-2 bg-purple-100 rounded-lg">
//                 <Stethoscope className="h-4 w-4 text-purple-600" />
//               </div>
//               <div>
//                 <p className="text-xs text-slate-500">Doctor</p>
//                 <p className="font-semibold text-slate-800">{appointment.doctorName}</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-orange-100">
//               <div className="p-2 bg-orange-100 rounded-lg">
//                 <Calendar className="h-4 w-4 text-orange-600" />
//               </div>
//               <div>
//                 <p className="text-xs text-slate-500">Date</p>
//                 <p className="font-semibold text-slate-800">{format(new Date(appointment.date), 'MMM dd, yyyy')}</p>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Prescription Medicines */}
//       <Card className="border-0 shadow-lg">
//         <CardHeader className="pb-4">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//             <CardTitle className="flex items-center gap-3">
//               <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
//                 <Pill className="h-5 w-5 text-white" />
//               </div>
//               <div>
//                 <span className="text-slate-800">Prescribed Medicines</span>
//                 <p className="text-sm text-slate-600 font-normal">
//                   {pharmacyItems.filter(item => item.source === 'prescription').length} medicines prescribed
//                 </p>
//               </div>
//             </CardTitle>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setShowAddItemDialog(true)}
//               className="flex items-center gap-2 border-2 border-green-200 hover:border-green-300 hover:bg-green-50 text-green-700 hover:text-green-800 transition-all duration-200"
//             >
//               <Plus className="h-4 w-4" />
//               Add Medicine
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {pharmacyItems.map((item) => (
//               <div
//                 key={item.id}
//                 className={`p-6 border-0 rounded-xl shadow-lg transition-all duration-300 ${
//                   item.isSelected && item.isAvailable
//                     ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500'
//                     : item.isAvailable
//                     ? 'bg-white hover:bg-blue-50/50 border-l-4 border-l-slate-200'
//                     : 'bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-l-red-500'
//                 }`}
//               >
//                 <div className="flex items-start justify-between">
//                   <div className="flex items-start gap-3 flex-1">
//                     <Checkbox
//                       checked={item.isSelected}
//                       onCheckedChange={() => handleToggleItemSelection(item.id)}
//                       disabled={!item.isAvailable}
//                       className="mt-1"
//                     />
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3 mb-4">
//                         <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg">
//                           <Pill className="h-5 w-5 text-slate-600" />
//                         </div>
//                         <div className="flex-1">
//                           <h4 className="text-lg font-bold text-slate-800">{item.medicineName}</h4>
//                           <div className="flex items-center gap-2 mt-1">
//                             <Badge 
//                               variant={item.source === 'prescription' ? 'default' : 'secondary'} 
//                               className={`text-xs ${
//                                 item.source === 'prescription' 
//                                   ? 'bg-blue-100 text-blue-800 border-blue-200' 
//                                   : 'bg-slate-100 text-slate-800 border-slate-200'
//                               }`}
//                             >
//                               {item.source === 'prescription' ? 'Prescribed' : 'Manual'}
//                             </Badge>
//                             {!item.isAvailable && (
//                               <Badge variant="destructive" className="text-xs bg-red-100 text-red-800 border-red-200">
//                                 <XCircle className="h-3 w-3 mr-1" />
//                                 Not Available
//                               </Badge>
//                             )}
//                             {item.isQuantityAdjusted && (
//                               <Badge variant="outline" className="text-xs text-orange-600 bg-orange-100 border-orange-200">
//                                 Quantity Adjusted
//                               </Badge>
//                             )}
//                           </div>
//                         </div>
//                       </div>
                      
//                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//                         <div className="p-3 bg-white/60 rounded-lg border border-slate-100">
//                           <p className="text-xs text-slate-500 mb-1">Dosage</p>
//                           <p className="font-semibold text-slate-800">{item.dosage}</p>
//                         </div>
//                         <div className="p-3 bg-white/60 rounded-lg border border-slate-100">
//                           <p className="text-xs text-slate-500 mb-1">Frequency</p>
//                           <p className="font-semibold text-slate-800">{item.frequency}</p>
//                         </div>
//                         <div className="p-3 bg-white/60 rounded-lg border border-slate-100">
//                           <p className="text-xs text-slate-500 mb-1">Duration</p>
//                           <p className="font-semibold text-slate-800">{item.duration}</p>
//                         </div>
//                       </div>
                      
//                       {item.originalQuantity && (
//                         <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
//                           <p className="text-sm text-blue-800">
//                             <strong>Prescribed Quantity:</strong> {item.originalQuantity} units
//                           </p>
//                         </div>
//                       )}
                      
//                       {item.instructions && (
//                         <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 mb-4">
//                           <p className="text-sm text-blue-800">
//                             <strong>Instructions:</strong> {item.instructions}
//                           </p>
//                         </div>
//                       )}

//                       {item.isAvailable && (
//                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-white/60 rounded-lg border border-slate-100">
//                           <div className="flex flex-col gap-2">
//                             <label className="text-sm font-medium text-slate-700">Quantity</label>
//                             {item.originalQuantity && item.quantity !== item.originalQuantity && (
//                               <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full w-fit">
//                                 Was: {item.originalQuantity}
//                               </span>
//                             )}
//                             <div className="flex items-center gap-2">
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
//                                 disabled={item.quantity <= 0}
//                                 className="h-9 w-9 p-0 border-2 hover:bg-slate-50"
//                               >
//                                 <Minus className="h-4 w-4" />
//                               </Button>
//                               <Input
//                                 type="number"
//                                 value={item.quantity}
//                                 onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
//                                 className="w-20 h-9 text-center border-2"
//                                 min="0"
//                               />
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
//                                 className="h-9 w-9 p-0 border-2 hover:bg-slate-50"
//                               >
//                                 <Plus className="h-4 w-4" />
//                               </Button>
//                             </div>
//                           </div>
//                           <div className="flex flex-col gap-2">
//                             <label className="text-sm font-medium text-slate-700">Unit Price</label>
//                             <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
//                               <p className="text-lg font-bold text-slate-800">Rs. {item.unitPrice.toFixed(2)}</p>
//                             </div>
//                           </div>
//                           <div className="flex flex-col gap-2">
//                             <label className="text-sm font-medium text-slate-700">Total Price</label>
//                             <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
//                               <p className="text-lg font-bold text-green-700">Rs. {item.totalPrice.toFixed(2)}</p>
//                             </div>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
                  
//                   {item.source === 'manual' && (
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleRemoveItem(item.id)}
//                       className="text-red-600 hover:text-red-700 hover:bg-red-50"
//                     >
//                       <Trash2 className="h-4 w-4" />
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Summary */}
//       <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-blue-50">
//         <CardHeader className="pb-4">
//           <CardTitle className="flex items-center gap-3">
//             <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
//               <ShoppingCart className="h-5 w-5 text-white" />
//             </div>
//             <span className="text-slate-800">Pharmacy Review Summary</span>
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="text-center p-6 bg-white/80 rounded-xl shadow-lg border border-blue-100">
//               <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
//                 <Pill className="h-8 w-8 text-blue-600" />
//               </div>
//               <div className="text-3xl font-bold text-blue-600 mb-1">{selectedCount}</div>
//               <div className="text-sm text-slate-600 font-medium">Selected Medicines</div>
//             </div>
//             <div className="text-center p-6 bg-white/80 rounded-xl shadow-lg border border-green-100">
//               <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
//                 <CheckCircle className="h-8 w-8 text-green-600" />
//               </div>
//               <div className="text-3xl font-bold text-green-600 mb-1">Rs. {totalValue.toFixed(2)}</div>
//               <div className="text-sm text-slate-600 font-medium">Total Value</div>
//             </div>
//             <div className="text-center p-6 bg-white/80 rounded-xl shadow-lg border border-orange-100">
//               <div className="p-3 bg-orange-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
//                 <Package className="h-8 w-8 text-orange-600" />
//               </div>
//               <div className="text-3xl font-bold text-orange-600 mb-1">
//                 {pharmacyItems.reduce((sum, item) => sum + (item.originalQuantity || 0), 0)}
//               </div>
//               <div className="text-sm text-slate-600 font-medium">Total Prescribed</div>
//             </div>
//             <div className="text-center p-6 bg-white/80 rounded-xl shadow-lg border border-purple-100">
//               <div className="p-3 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
//                 <AlertCircle className="h-8 w-8 text-purple-600" />
//               </div>
//               <div className="text-3xl font-bold text-purple-600 mb-1">
//                 {pharmacyItems.filter(item => item.isQuantityAdjusted).length}
//               </div>
//               <div className="text-sm text-slate-600 font-medium">Quantity Adjusted</div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Action Buttons */}
//       <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200">
//         <Button 
//           variant="outline" 
//           onClick={onBack}
//           className="border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-800 transition-all duration-200"
//         >
//           Cancel
//         </Button>
//         <Button
//           onClick={handleLoadToMainPOS}
//           disabled={selectedCount === 0}
//           className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           <CheckCircle className="h-4 w-4 mr-2" />
//           Complete Review & Load to POS
//         </Button>
//       </div>

//       {/* Add Item Dialog */}
//       <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
//         <DialogContent className="max-w-4xl max-h-[90vh] bg-white/95 backdrop-blur-xl border-0 shadow-2xl p-0 overflow-hidden">
//           <div className="flex flex-col h-full">
//             {/* Fixed Header */}
//             <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-green-50">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
//                     <Plus className="h-5 w-5 text-white" />
//                   </div>
//                   <div>
//                     <DialogTitle className="text-xl font-bold text-slate-800">Add Medicine to Review</DialogTitle>
//                     <p className="text-slate-600 mt-1">Search and add additional medicines to the prescription review</p>
//                   </div>
//                 </div>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setShowAddItemDialog(false)}
//                   className="border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
//                 >
//                   <X className="h-4 w-4" />
//                 </Button>
//               </div>
//             </DialogHeader>
            
//             {/* Scrollable Content */}
//             <div className="flex-1 overflow-y-auto p-6">
//               <div className="space-y-4">
//             {/* Search */}
//             <div className="relative">
//               <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
//               <Input
//                 ref={searchInputRef}
//                 placeholder="Search for medicine by name or generic name..."
//                 value={searchTerm}
//                 onChange={(e) => {
//                   setSearchTerm(e.target.value);
//                   handleSearchInventory(e.target.value);
//                 }}
//                 className="pl-12 h-12 text-lg border-2 border-slate-200 focus:border-blue-500 rounded-xl"
//               />
//             </div>

//             {/* Search Results */}
//             {isLoadingInventory && (
//               <div className="flex items-center justify-center py-4">
//                 <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
//                 <span className="ml-2">Searching inventory...</span>
//               </div>
//             )}

//             {inventoryItems.length > 0 && (
//               <div className="max-h-80 overflow-y-auto space-y-3">
//                 <h4 className="text-sm font-semibold text-slate-700 mb-2">Search Results ({inventoryItems.length})</h4>
//                 {inventoryItems.map((item) => (
//                   <div
//                     key={item.id}
//                     className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
//                       selectedInventoryItem?.id === item.id
//                         ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg'
//                         : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md'
//                     }`}
//                     onClick={() => handleInventoryItemSelect(item)}
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg">
//                         <Package className="h-5 w-5 text-slate-600" />
//                       </div>
//                       <div className="flex-1">
//                         <div className="font-semibold text-slate-800">{item.name}</div>
//                         {item.unitContains && (
//                           <div className="text-sm text-slate-600 mt-1">
//                             Unit contains: {item.unitContains.value} {item.unitContains.unit}
//                           </div>
//                         )}
//                       </div>
//                       {selectedInventoryItem?.id === item.id && (
//                         <CheckCircle className="h-5 w-5 text-blue-600" />
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Selected Item Details */}
//             {selectedInventoryItem && selectedBatch && (
//               <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-lg">
//                 <div className="flex items-center gap-3 mb-4">
//                   <div className="p-2 bg-green-100 rounded-lg">
//                     <CheckCircle className="h-5 w-5 text-green-600" />
//                   </div>
//                   <h4 className="text-lg font-bold text-green-800">Selected Item Details</h4>
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="p-4 bg-white/60 rounded-lg border border-green-100">
//                     <p className="text-sm text-slate-500 mb-1">Medicine Name</p>
//                     <p className="font-semibold text-slate-800">{selectedInventoryItem.name}</p>
//                   </div>
//                   <div className="p-4 bg-white/60 rounded-lg border border-green-100">
//                     <p className="text-sm text-slate-500 mb-1">Unit Price</p>
//                     <p className="font-semibold text-green-700">Rs. {selectedBatch.unitPrice?.toFixed(2) || '0.00'}</p>
//                   </div>
//                   <div className="p-4 bg-white/60 rounded-lg border border-green-100">
//                     <p className="text-sm text-slate-500 mb-1">Available Quantity</p>
//                     <p className="font-semibold text-slate-800">{selectedBatch.quantity} units</p>
//                   </div>
//                   <div className="p-4 bg-white/60 rounded-lg border border-green-100">
//                     <p className="text-sm text-slate-500 mb-2">Quantity to Add</p>
//                     <Input
//                       type="number"
//                       value={manualQuantity}
//                       onChange={(e) => setManualQuantity(parseInt(e.target.value) || 1)}
//                       min="1"
//                       max={selectedBatch.quantity}
//                       className="w-24 h-10 text-center border-2 border-green-200 focus:border-green-400"
//                     />
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Dialog Actions */}
//             <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200">
//               <Button 
//                 variant="outline" 
//                 onClick={() => setShowAddItemDialog(false)}
//                 className="border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-800 transition-all duration-200"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleAddManualItem}
//                 disabled={!selectedInventoryItem || !selectedBatch}
//                 className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add to Review
//               </Button>
//             </div>
//               </div>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }


// src/app/dashboard/pos/PharmacyPOS.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pill, Plus, Minus, Trash2, AlertCircle, CheckCircle, ArrowLeft, Loader2, XCircle, PackageX } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { Appointment } from '@/types/appointment';
import { Prescription, Medicine } from '@/types/prescription';
import { InventoryItem } from '@/types/inventory';
import { inventoryService } from '@/services/inventoryService';
import { prescriptionService } from '@/services/prescriptionService';
import { EnhancedPOSItemSearch } from './EnhancedPOSItemSearch';

interface PharmacyPOSProps {
  appointment: Appointment;
  prescription: Prescription;
  onBack: () => void;
  onLoadToMainPOS: (data: any) => void;
}

export function PharmacyPOS({ appointment, prescription, onBack, onLoadToMainPOS }: PharmacyPOSProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedMedicineIds, setSelectedMedicineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initialMedicines = prescription.medicines.map(med => ({
      ...med,
      originalDrugCount: med.originalDrugCount ?? med.drugCount,
    }));
    setMedicines(initialMedicines);
    
    // Pre-select all inventory medicines
    const inventoryMedicineIds = new Set(
      initialMedicines.filter(med => med.source === 'inventory').map(med => med.id)
    );
    setSelectedMedicineIds(inventoryMedicineIds);
  }, [prescription]);

  // Load inventory data
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const inventoryData = await inventoryService.getAll();
        setInventory(inventoryData);
      } catch (error) {
        console.error('Error loading inventory:', error);
        toast.error('Failed to load inventory data');
      }
    };
    loadInventory();
  }, []);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    setMedicines(prev => prev.map(med => {
      if (med.id === id) {
        return {
          ...med,
          drugCount: newQuantity,
          pharmacyEdited: newQuantity !== med.originalDrugCount,
        };
      }
      return med;
    }));
  };

  const handleAddItem = (item: any) => {
    if (medicines.some(med => med.inventoryId === item.id)) {
      toast.warning(`${item.name} is already in the prescription.`);
      return;
    }
    
    const newMedicineId = prescriptionService.generateMedicineId();
    const newMedicine: Medicine = {
      id: newMedicineId,
      medicineName: item.name,
      inventoryId: item.id,
      source: 'inventory',
      dose: 'N/A',
      frequency: 'N/A',
      days: 0,
      drugCount: 1,
      originalDrugCount: 0,
      pharmacyAdded: true,
      pharmacyEdited: false,
    };
    setMedicines(prev => [...prev, newMedicine]);
    // Auto-select the newly added medicine
    setSelectedMedicineIds(prev => new Set(prev).add(newMedicineId));
    toast.success(`${item.name} added to prescription.`);
  };

  const handleToggleMedicine = (medicineId: string) => {
    setSelectedMedicineIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(medicineId)) {
        newSet.delete(medicineId);
      } else {
        newSet.add(medicineId);
      }
      return newSet;
    });
  };

  const handleToggleAllMedicines = () => {
    const inventoryMedicines = medicines.filter(med => med.source === 'inventory');
    if (selectedMedicineIds.size === inventoryMedicines.length) {
      // Deselect all
      setSelectedMedicineIds(new Set());
    } else {
      // Select all
      setSelectedMedicineIds(new Set(inventoryMedicines.map(med => med.id)));
    }
  };

  const handleToggleOutOfStock = (medicineId: string) => {
    setMedicines(prev => prev.map(med => {
      if (med.id === medicineId) {
        const newOutOfStock = !med.outOfStock;
        // If marking as out of stock, also unselect the medicine
        if (newOutOfStock) {
          setSelectedMedicineIds(prevSelected => {
            const newSet = new Set(prevSelected);
            newSet.delete(medicineId);
            return newSet;
          });
        }
        return {
          ...med,
          outOfStock: newOutOfStock,
        };
      }
      return med;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setMedicines(prev => prev.filter(med => med.id !== id));
    // Also remove from selected medicines
    setSelectedMedicineIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Save the updated prescription to the database
      const updatedPrescription = { ...prescription, medicines };
      await prescriptionService.updatePrescription(prescription.id!, updatedPrescription);
      
      const pharmacyReviewedItems = medicines.filter(med => med.source === 'inventory');
      
      onLoadToMainPOS({
        appointment,
        prescription: updatedPrescription,
        pharmacyReviewedItems,
      });

      toast.success("Prescription updated and pharmacy review completed");
    } catch (error) {
      console.error("Error during pharmacy POS confirmation:", error);
      toast.error("Failed to process pharmacy review.");
    } finally {
      setLoading(false);
    }
  };

  const inventoryMedicines = medicines.filter(med => med.source === 'inventory');

  return (
    <div className="space-y-6">
      {/* Helper Text */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Review & Select Medicines</p>
            <p className="text-xs text-blue-700 mt-1">
              Select the medicines you want to confirm and mark as reviewed. All inventory medicines are pre-selected by default.
            </p>
            <p className="text-xs text-orange-700 mt-2 flex items-center gap-1">
              <PackageX className="h-3 w-3" />
              Mark medicines as "Out of Stock" if they're not available. They will be excluded from confirmation.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-bold text-lg mb-2">Add More Items</h3>
        <EnhancedPOSItemSearch inventory={inventory} onSelectItem={handleAddItem} />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold w-[5%] text-center">
                <div className="flex flex-col items-center gap-1">
                  <Checkbox
                    checked={
                      inventoryMedicines.length > 0 &&
                      selectedMedicineIds.size === inventoryMedicines.length
                    }
                    onCheckedChange={handleToggleAllMedicines}
                    className="mx-auto"
                    title="Select/Deselect All"
                  />
                  <span className="text-[10px] text-slate-500">Select</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold w-[20%]">Medicine</TableHead>
              <TableHead className="font-semibold w-[11%]">Dosage</TableHead>
              <TableHead className="font-semibold w-[11%]">Frequency</TableHead>
              <TableHead className="font-semibold w-[9%]">Duration</TableHead>
              <TableHead className="font-semibold text-center w-[12%]">Quantity</TableHead>
              <TableHead className="font-semibold text-center w-[12%]">Stock Status</TableHead>
              <TableHead className="font-semibold text-center w-[15%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryMedicines.length > 0 ? (
              inventoryMedicines.map((med) => (
                <TableRow 
                  key={med.id} 
                  className={`hover:bg-slate-50 transition-colors ${
                    med.outOfStock ? 'bg-red-50' : 
                    med.pharmacyAdded ? 'bg-blue-50' : 
                    med.pharmacyEdited ? 'bg-yellow-50' : ''
                  }`}
                >
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedMedicineIds.has(med.id)}
                      onCheckedChange={() => handleToggleMedicine(med.id)}
                      className="mx-auto"
                      disabled={med.outOfStock}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="text-base font-semibold flex items-center gap-2">
                      {med.medicineName}
                      {med.outOfStock && (
                        <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">
                          <PackageX className="h-3 w-3 mr-0.5" />
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {med.pharmacyAdded ? '(Added by Pharmacy)' : `(Prescribed: ${med.originalDrugCount})`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={med.outOfStock ? 'text-gray-400' : ''}>{med.dose || 'N/A'}</span>
                  </TableCell>
                  <TableCell>
                    <span className={med.outOfStock ? 'text-gray-400' : ''}>{med.frequency || 'N/A'}</span>
                  </TableCell>
                  <TableCell>
                    <span className={med.outOfStock ? 'text-gray-400' : ''}>{med.days ? `${med.days} days` : 'N/A'}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(med.id, Math.max(0, med.drugCount - 1))}
                        disabled={med.outOfStock || med.drugCount <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={med.drugCount}
                        onChange={(e) => handleQuantityChange(med.id, parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                        min="0"
                        disabled={med.outOfStock}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(med.id, med.drugCount + 1)}
                        disabled={med.outOfStock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant={med.outOfStock ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => handleToggleOutOfStock(med.id)}
                      className={med.outOfStock 
                        ? "bg-red-500 hover:bg-red-600 text-white h-8 px-2 text-xs" 
                        : "border-orange-200 hover:bg-orange-50 text-orange-700 hover:text-orange-800 h-8 px-2 text-xs"
                      }
                    >
                      <PackageX className="h-3 w-3 mr-1" />
                      {med.outOfStock ? 'In Stock' : 'Out of Stock'}
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveItem(med.id)} 
                      disabled={!med.pharmacyAdded}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500">
                  No inventory medicines. Add items using the search bar above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-6 border-t">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {selectedMedicineIds.size} of {inventoryMedicines.length} selected
          </Badge>
          {inventoryMedicines.filter(med => med.outOfStock).length > 0 && (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              <PackageX className="h-3 w-3 mr-1" />
              {inventoryMedicines.filter(med => med.outOfStock).length} out of stock
            </Badge>
          )}
        </div>
        <Button 
          onClick={handleConfirm} 
          disabled={loading || selectedMedicineIds.size === 0}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title={selectedMedicineIds.size === 0 ? "Please select at least one medicine" : ""}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
          Confirm & Mark as Reviewed ({selectedMedicineIds.size})
        </Button>
      </div>
    </div>
  );
}