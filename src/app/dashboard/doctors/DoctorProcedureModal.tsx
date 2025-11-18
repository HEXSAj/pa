// // src/app/dashboard/doctors/DoctorProcedureModal.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { Doctor, DoctorProcedure, MedicalProcedure, formatCurrency } from '@/types/doctor';
// import { doctorService } from '@/services/doctorService';
// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Textarea } from "@/components/ui/textarea";
// import { 
//   Loader2, 
//   DollarSign, 
//   User, 
//   Stethoscope, 
//   Calculator, 
//   FileText, 
//   CheckCircle2, 
//   X,
//   AlertCircle,
//   TrendingUp,
//   Building2,
//   UserCheck,
//   Zap
// } from 'lucide-react';
// import { toast } from "sonner";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";

// interface DoctorProcedureModalProps {
//   doctorProcedure?: DoctorProcedure;
//   doctorId?: string;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function DoctorProcedureModal({ 
//   doctorProcedure, 
//   doctorId, 
//   onClose, 
//   onSuccess 
// }: DoctorProcedureModalProps) {
//   const isEditMode = !!doctorProcedure;

//   const [doctors, setDoctors] = useState<Doctor[]>([]);
//   const [procedures, setProcedures] = useState<MedicalProcedure[]>([]);
//   const [loading, setLoading] = useState(false);
  
//   const [formData, setFormData] = useState<Omit<DoctorProcedure, 'id' | 'createdAt' | 'updatedAt'>>({
//     doctorId: doctorId || '',
//     procedureId: '',
//     doctorCharge: undefined,
//     // centerCharge: undefined,
//     centerCharge: 0, 
//     description: '',
//     isActive: true
//   });

//   const [totalCharge, setTotalCharge] = useState<string>('Rs. 0.00');
//   const [isSaving, setIsSaving] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
//   const [selectedProcedure, setSelectedProcedure] = useState<MedicalProcedure | null>(null);

//   useEffect(() => {
//     loadReferenceData();
//   }, []);

//   // Initialize form data if editing
//   useEffect(() => {
//     if (doctorProcedure) {
//       setFormData({
//         doctorId: doctorProcedure.doctorId,
//         procedureId: doctorProcedure.procedureId,
//         doctorCharge: doctorProcedure.doctorCharge || 0,
//         centerCharge: doctorProcedure.centerCharge || 0,
//         description: doctorProcedure.description || '',
//         isActive: doctorProcedure.isActive !== undefined ? doctorProcedure.isActive : true
//       });
//     } else if (doctorId) {
//       setFormData(prev => ({
//         ...prev,
//         doctorId
//       }));
//     }
//   }, [doctorProcedure, doctorId]);

//   // Calculate total charge with animation effect
//   useEffect(() => {
//     const docCharge = formData.doctorCharge ?? 0;
//     // const centerCharge = formData.centerCharge ?? 0;
//     // const total = docCharge + centerCharge;
//     const total = docCharge; 
//     setTotalCharge(formatCurrency(total));
//   }, [formData.doctorCharge]);

//   // Set selected doctor when doctorId changes
//   useEffect(() => {
//     if (formData.doctorId && doctors.length > 0) {
//       const doctor = doctors.find(d => d.id === formData.doctorId);
//       setSelectedDoctor(doctor || null);
//     }
//   }, [formData.doctorId, doctors]);

//   // Set selected procedure when procedureId changes
//   useEffect(() => {
//     if (formData.procedureId && procedures.length > 0) {
//       const procedure = procedures.find(p => p.id === formData.procedureId);
//       setSelectedProcedure(procedure || null);
//     }
//   }, [formData.procedureId, procedures]);

//   const loadReferenceData = async () => {
//     setLoading(true);
//     try {
//       const [doctorsData, proceduresData] = await Promise.all([
//         !doctorId ? doctorService.getAllDoctors() : [],
//         doctorService.getAllProcedures()
//       ]);
      
//       if (!doctorId) {
//         setDoctors(doctorsData.filter(doc => doc.isActive));
//       }
      
//       setProcedures(proceduresData);
//     } catch (error) {
//       console.error('Error loading reference data:', error);
//       toast.error("Failed to load reference data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const validateForm = () => {
//     const newErrors: Record<string, string> = {};

//     if (!formData.doctorId) {
//       newErrors.doctorId = 'Doctor selection is required';
//     }

//     if (!formData.procedureId) {
//       newErrors.procedureId = 'Procedure selection is required';
//     }

//     if (formData.doctorCharge === undefined || formData.doctorCharge === null || isNaN(Number(formData.doctorCharge))) {
//       newErrors.doctorCharge = 'Doctor charge must be a valid number';
//     } else if (formData.doctorCharge < 0) {
//       newErrors.doctorCharge = 'Doctor charge cannot be negative';
//     }

//     // if (formData.centerCharge === undefined || formData.centerCharge === null || isNaN(Number(formData.centerCharge))) {
//     //   newErrors.centerCharge = 'Center charge must be a valid number';  
//     // } else if (formData.centerCharge < 0) {
//     //   newErrors.centerCharge = 'Center charge cannot be negative';
//     // }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // const handleSubmit = async (e: React.FormEvent) => {
//   //   e.preventDefault();
    
//   //   if (!validateForm()) {
//   //     toast.error("Please correct the errors in the form");
//   //     return;
//   //   }

//   //   setIsSaving(true);

//   //   try {
//   //     if (isEditMode && doctorProcedure?.id) {
//   //       await doctorService.updateDoctorProcedure(doctorProcedure.id, formData);
//   //       toast.success("Doctor procedure updated successfully");
//   //     } else {
//   //       await doctorService.createDoctorProcedure(formData);
//   //       toast.success("Doctor procedure assigned successfully");
//   //     }
//   //     onSuccess();
//   //   } catch (error: any) {
//   //     console.error('Error saving doctor procedure:', error);
//   //     toast.error(error.message || "Failed to save doctor procedure");
//   //   } finally {
//   //     setIsSaving(false);
//   //   }
//   // };


//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       toast.error("Please correct the errors in the form");
//       return;
//     }
  
//     setIsSaving(true);
  
//     try {
//       // Ensure centerCharge is always 0
//       const submissionData = {
//         ...formData,
//         centerCharge: 0
//       };
  
//       if (isEditMode && doctorProcedure?.id) {
//         await doctorService.updateDoctorProcedure(doctorProcedure.id, submissionData);
//         toast.success("Doctor procedure updated successfully");
//       } else {
//         await doctorService.createDoctorProcedure(submissionData);
//         toast.success("Doctor procedure assigned successfully");
//       }
//       onSuccess();
//     } catch (error: any) {
//       console.error('Error saving doctor procedure:', error);
//       toast.error(error.message || "Failed to save doctor procedure");
//     } finally {
//       setIsSaving(false);
//     }
//   };


//   const getFieldError = (field: string) => {
//     return errors[field] ? (
//       <div className="flex items-center gap-1 mt-1">
//         <AlertCircle className="h-3 w-3 text-red-500" />
//         <p className="text-xs text-red-500">{errors[field]}</p>
//       </div>
//     ) : null;
//   };

//   const formatChargeDisplay = (amount: number) => {
//     if (amount === 0) return "Free";
//     return formatCurrency(amount);
//   };

//   return (
//     <Dialog open={true} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[700px] max-h-[95vh] rounded-xl overflow-hidden p-0 flex flex-col [&>button]:hidden">
//         {/* Hidden DialogTitle for accessibility */}
//         <VisuallyHidden>
//           <DialogTitle>
//             {isEditMode ? 'Edit Procedure Assignment' : 'Assign Procedure to Doctor'}
//           </DialogTitle>
//         </VisuallyHidden>

//         {/* Custom Header */}
//         <div className="bg-gradient-to-r from-green-600 to-green-700 py-4 px-6 flex-shrink-0 relative">
//           <div className="pr-10">
//             <h2 className="text-white text-xl font-semibold flex items-center gap-2">
//               {isEditMode ? (
//                 <>
//                   <CheckCircle2 className="h-5 w-5" />
//                   Edit Procedure Assignment
//                 </>
//               ) : (
//                 <>
//                   <Stethoscope className="h-5 w-5" />
//                   Assign Procedure to Doctor
//                 </>
//               )}
//             </h2>
//             <p className="text-green-200 mt-1 text-sm">
//               {isEditMode ? 'Update procedure assignment details' : 'Configure procedure charges and assignment'}
//             </p>
//           </div>
//           <Button 
//             variant="ghost" 
//             size="icon" 
//             onClick={onClose} 
//             className="absolute top-4 right-4 h-8 w-8 rounded-full text-white hover:bg-white/20"
//           >
//             <X className="h-4 w-4" />
//           </Button>
//         </div>
        
//         <div className="flex flex-col flex-grow min-h-0">
//           <div className="flex-grow overflow-y-auto px-6 py-4">
//             <form onSubmit={handleSubmit} className="space-y-5">
//               {loading ? (
//                 <div className="flex justify-center items-center py-12">
//                   <div className="text-center space-y-3">
//                     <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto" />
//                     <p className="text-sm text-muted-foreground">Loading doctors and procedures...</p>
//                   </div>
//                 </div>
//               ) : (
//                 <>
//                   {/* Selection Section */}
//                   <div className="space-y-4">
//                     <div className="flex items-center gap-2 mb-4">
//                       <UserCheck className="h-5 w-5 text-blue-600" />
//                       <h3 className="text-lg font-semibold text-gray-900">Assignment Details</h3>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       {/* Doctor Selection */}
//                       {!doctorId && (
//                         <div className="space-y-2">
//                           <Label htmlFor="doctorId" className="text-sm font-medium flex items-center gap-2">
//                             <User className="h-4 w-4" />
//                             Doctor *
//                           </Label>
//                           <Select
//                             value={formData.doctorId}
//                             onValueChange={(value) => setFormData(prev => ({ ...prev, doctorId: value }))}
//                           >
//                             <SelectTrigger className={`h-11 ${errors.doctorId ? 'border-red-300' : 'border-gray-200'}`}>
//                               <SelectValue placeholder="Select a doctor" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               {doctors.map(doctor => (
//                                 <SelectItem key={doctor.id} value={doctor.id!}>
//                                   <div className="flex items-center gap-2">
//                                     <User className="h-4 w-4" />
//                                     <span>{doctor.name}</span>
//                                     <Badge variant="secondary" className="text-xs">
//                                       {doctor.speciality}
//                                     </Badge>
//                                   </div>
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                           {getFieldError('doctorId')}
//                         </div>
//                       )}

//                       {/* Procedure Selection */}
//                       <div className={`space-y-2 ${!doctorId ? '' : 'md:col-span-2'}`}>
//                         <Label htmlFor="procedureId" className="text-sm font-medium flex items-center gap-2">
//                           <Stethoscope className="h-4 w-4" />
//                           Procedure *
//                         </Label>
//                         <Select
//                           value={formData.procedureId}
//                           onValueChange={(value) => setFormData(prev => ({ ...prev, procedureId: value }))}
//                         >
//                           <SelectTrigger className={`h-11 ${errors.procedureId ? 'border-red-300' : 'border-gray-200'}`}>
//                             <SelectValue placeholder="Select a procedure" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {procedures.map(procedure => (
//                               <SelectItem key={procedure.id} value={procedure.id!}>
//                                 <div className="flex items-center gap-2">
//                                   <Stethoscope className="h-4 w-4" />
//                                   <span>{procedure.name}</span>
//                                   {procedure.category && (
//                                     <Badge variant="outline" className="text-xs">
//                                       {procedure.category}
//                                     </Badge>
//                                   )}
//                                 </div>
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         {getFieldError('procedureId')}
                        
//                         {/* Show selected procedure description */}
//                         {selectedProcedure?.description && (
//                           <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-100">
//                             <p className="text-xs text-blue-700">
//                               <strong>About this procedure:</strong> {selectedProcedure.description}
//                             </p>
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     {/* Selected Doctor Info Card */}
//                     {selectedDoctor && (
//                       <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
//                         <div className="flex items-center gap-3">
//                           <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
//                             <User className="h-5 w-5 text-blue-600" />
//                           </div>
//                           <div>
//                             <h4 className="font-medium text-gray-900">{selectedDoctor.name}</h4>
//                             <p className="text-sm text-blue-600">{selectedDoctor.speciality}</p>
//                           </div>
//                           <Badge variant="success" className="ml-auto">
//                             Active
//                           </Badge>
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   <Separator />

//                   {/* Pricing Section */}
//                   <div className="space-y-4">
//                     <div className="flex items-center gap-2 mb-4">
//                       <Calculator className="h-5 w-5 text-green-600" />
//                       <h3 className="text-lg font-semibold text-gray-900">Pricing Structure</h3>
//                       <TooltipProvider>
//                         <Tooltip>
//                           <TooltipTrigger asChild>
//                             <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
//                               <AlertCircle className="h-4 w-4 text-muted-foreground" />
//                             </Button>
//                           </TooltipTrigger>
//                           <TooltipContent>
//                             <p className="text-xs">Set individual charges for doctor and center fees</p>
//                           </TooltipContent>
//                         </Tooltip>
//                       </TooltipProvider>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       {/* Doctor Charge */}
//                       <div className="space-y-3">
//                         <Label htmlFor="doctorCharge" className="text-sm font-medium flex items-center gap-2">
//                           <TrendingUp className="h-4 w-4 text-green-600" />
//                           Doctor Fee (Rs.)
//                         </Label>
//                         <div className="relative">
//                           <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                             Rs.
//                           </div>
//                           <Input
//                             id="doctorCharge"
//                             type="number"
//                             step="0.01"
//                             min="0"
//                             value={formData.doctorCharge ?? ''}
//                             onChange={(e) => setFormData(prev => ({ 
//                               ...prev, 
//                               doctorCharge: e.target.value === '' ? undefined : parseFloat(e.target.value)
//                             }))}
//                             placeholder="0.00"
//                             className={`h-12 pl-12 text-lg font-medium ${errors.doctorCharge ? 'border-red-300' : 'border-gray-200'}`}
//                           />
//                         </div>
//                         {getFieldError('doctorCharge')}
//                         <div className="text-xs text-muted-foreground">
//                           Professional fee charged by the doctor
//                         </div>
//                       </div>

//                       {/* Center Charge */}
//                       {/* <div className="space-y-3">
//                         <Label htmlFor="centerCharge" className="text-sm font-medium flex items-center gap-2">
//                           <Building2 className="h-4 w-4 text-blue-600" />
//                           Center Fee (Rs.)
//                         </Label>
//                         <div className="relative">
//                           <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                             Rs.
//                           </div>
//                           <Input
//                             id="centerCharge"
//                             type="number"
//                             step="0.01"
//                             min="0"
//                             value={formData.centerCharge ?? ''}
//                             onChange={(e) => setFormData(prev => ({ 
//                               ...prev, 
//                               centerCharge: e.target.value === '' ? undefined : parseFloat(e.target.value)
//                             }))}
//                             placeholder="0.00"
//                             className={`h-12 pl-12 text-lg font-medium ${errors.centerCharge ? 'border-red-300' : 'border-gray-200'}`}
//                           />
//                         </div>
//                         {getFieldError('centerCharge')}
//                         <div className="text-xs text-muted-foreground">
//                           Facility and administrative charges
//                         </div>
//                       </div> */}

                  

//                     {/* Total Charge Display */}
//                     {/* <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-3">
//                           <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
//                             <DollarSign className="h-6 w-6 text-green-600" />
//                           </div>
//                           <div>
//                             <h4 className="text-lg font-semibold text-gray-900">Total Procedure Cost</h4>
//                             <p className="text-sm text-muted-foreground">Combined doctor and center fees</p>
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <div className="text-3xl font-bold text-green-700">
//                             {totalCharge}
//                           </div>
//                           <div className="text-sm text-green-600 flex items-center gap-1">
//                             <TrendingUp className="h-3 w-3" />
//                             Patient Total
//                           </div>
//                         </div>
//                       </div> */}
//                       {/* Total Charge Display */}
//                       <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center gap-3">
//                             <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
//                               <DollarSign className="h-6 w-6 text-green-600" />
//                             </div>
//                             <div>
//                               <h4 className="text-lg font-semibold text-gray-900">Total Procedure Cost</h4>
//                               <p className="text-sm text-muted-foreground">Doctor fee only</p> {/* Update description */}
//                             </div>
//                           </div>
//                           <div className="text-right">
//                             <div className="text-3xl font-bold text-green-600">
//                               {totalCharge}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
                      
//                       {/* Breakdown */}
//                       <div className="mt-4 pt-4 border-t border-green-200">
//                         <div className="grid grid-cols-2 gap-4 text-sm">
//                           <div className="flex justify-between">
//                             <span className="text-gray-600">Doctor Fee:</span>
//                             <span className="font-medium">{formatChargeDisplay(formData.doctorCharge)}</span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span className="text-gray-600">Center Fee:</span>
//                             <span className="font-medium">{formatChargeDisplay(formData.centerCharge)}</span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   <Separator />

//                   {/* Additional Information Section */}
//                   <div className="space-y-4">
//                     <div className="flex items-center gap-2 mb-4">
//                       <FileText className="h-5 w-5 text-purple-600" />
//                       <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
//                     </div>

//                     {/* Notes */}
//                     <div className="space-y-2">
//                       <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
//                         <FileText className="h-4 w-4" />
//                         Notes & Special Instructions
//                       </Label>
//                       <Textarea
//                         id="description"
//                         value={formData.description}
//                         onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//                         placeholder="Any special instructions, notes, or requirements for this procedure assignment..."
//                         rows={3}
//                         className="resize-none border-gray-200 focus:border-blue-500"
//                       />
//                       <p className="text-xs text-muted-foreground">
//                         Include any special requirements, preparation instructions, or billing notes.
//                       </p>
//                     </div>

//                     {/* Active Status */}
//                     <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
//                       <Checkbox
//                         id="isActive"
//                         checked={formData.isActive}
//                         onCheckedChange={(checked) => 
//                           setFormData(prev => ({ 
//                             ...prev, 
//                             isActive: checked as boolean 
//                           }))
//                         }
//                         className="h-5 w-5"
//                       />
//                       <div className="flex-1">
//                         <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer flex items-center gap-2">
//                           <Zap className="h-4 w-4" />
//                           Active Assignment
//                         </Label>
//                         <p className="text-xs text-muted-foreground mt-1">
//                           {formData.isActive 
//                             ? "This procedure is currently available for booking with this doctor" 
//                             : "This procedure assignment is currently inactive and unavailable for booking"
//                           }
//                         </p>
//                       </div>
//                       <Badge variant={formData.isActive ? "success" : "secondary"} className="ml-2">
//                         {formData.isActive ? "Active" : "Inactive"}
//                       </Badge>
//                     </div>
//                   </div>
//                 </>
//               )}
//             </form>
//           </div>
          
//           {/* Fixed Footer */}
//           <div className="px-6 pb-6 pt-4 flex-shrink-0 border-t bg-gray-50/50">
//             <div className="flex gap-3 w-full">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={onClose}
//                 className="flex-1 rounded-lg border-gray-200"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleSubmit}
//                 disabled={isSaving || loading}
//                 className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
//               >
//                 {isSaving ? (
//                   <>
//                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                     Saving...
//                   </>
//                 ) : (
//                   <>
//                     {isEditMode ? (
//                       <>
//                         <CheckCircle2 className="h-4 w-4 mr-2" />
//                         Save Changes
//                       </>
//                     ) : (
//                       <>
//                         <Stethoscope className="h-4 w-4 mr-2" />
//                         Assign Procedure
//                       </>
//                     )}
//                   </>
//                 )}
//               </Button>
//             </div>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

// src/app/dashboard/doctors/DoctorProcedureModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Doctor, DoctorProcedure, MedicalProcedure, formatCurrency } from '@/types/doctor';
import { doctorService } from '@/services/doctorService';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  DollarSign, 
  User, 
  Stethoscope, 
  Calculator, 
  FileText, 
  CheckCircle2, 
  X,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Zap
} from 'lucide-react';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DoctorProcedureModalProps {
  doctorProcedure?: DoctorProcedure;
  doctorId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DoctorProcedureModal({ 
  doctorProcedure, 
  doctorId, 
  onClose, 
  onSuccess 
}: DoctorProcedureModalProps) {
  const isEditMode = !!doctorProcedure;

  // State declarations
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [procedures, setProcedures] = useState<MedicalProcedure[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<MedicalProcedure | null>(null);
  const [totalCharge, setTotalCharge] = useState<string>('Rs. 0.00');
  
  const [formData, setFormData] = useState<Omit<DoctorProcedure, 'id' | 'createdAt' | 'updatedAt'>>({
    doctorId: doctorId || '',
    procedureId: '',
    doctorCharge: undefined,
    centerCharge: 0, 
    description: '',
    isActive: true
  });

  // Effects
  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (doctorProcedure) {
      setFormData({
        doctorId: doctorProcedure.doctorId,
        procedureId: doctorProcedure.procedureId,
        doctorCharge: doctorProcedure.doctorCharge || 0,
        centerCharge: 0, // Always set to 0
        description: doctorProcedure.description || '',
        isActive: doctorProcedure.isActive !== undefined ? doctorProcedure.isActive : true
      });
    } else if (doctorId) {
      setFormData(prev => ({
        ...prev,
        doctorId
      }));
    }
  }, [doctorProcedure, doctorId]);

  useEffect(() => {
    const docCharge = formData.doctorCharge ?? 0;
    setTotalCharge(formatCurrency(docCharge));
  }, [formData.doctorCharge]);

  useEffect(() => {
    if (formData.doctorId && doctors.length > 0) {
      const doctor = doctors.find(d => d.id === formData.doctorId);
      setSelectedDoctor(doctor || null);
    }
  }, [formData.doctorId, doctors]);

  useEffect(() => {
    if (formData.procedureId && procedures.length > 0) {
      const procedure = procedures.find(p => p.id === formData.procedureId);
      setSelectedProcedure(procedure || null);
    }
  }, [formData.procedureId, procedures]);

  // Helper functions
  const loadReferenceData = async () => {
    setLoading(true);
    try {
      const [doctorsData, proceduresData] = await Promise.all([
        !doctorId ? doctorService.getAllDoctors() : [],
        doctorService.getAllProcedures()
      ]);
      
      if (!doctorId) {
        setDoctors(doctorsData.filter(doc => doc.isActive));
      }
      
      setProcedures(proceduresData);
    } catch (error) {
      console.error('Error loading reference data:', error);
      toast.error("Failed to load reference data");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.doctorId) {
      newErrors.doctorId = 'Doctor selection is required';
    }

    if (!formData.procedureId) {
      newErrors.procedureId = 'Procedure selection is required';
    }

    if (formData.doctorCharge === undefined || formData.doctorCharge === null || isNaN(Number(formData.doctorCharge))) {
      newErrors.doctorCharge = 'Doctor charge must be a valid number';
    } else if (formData.doctorCharge < 0) {
      newErrors.doctorCharge = 'Doctor charge cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return;
    }

    setIsSaving(true);

    try {
      const submissionData = {
        ...formData,
        centerCharge: 0 // Always ensure center charge is 0
      };

      if (isEditMode && doctorProcedure?.id) {
        await doctorService.updateDoctorProcedure(doctorProcedure.id, submissionData);
        toast.success("Doctor procedure updated successfully");
      } else {
        await doctorService.createDoctorProcedure(submissionData);
        toast.success("Doctor procedure assigned successfully");
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error saving doctor procedure:', error);
      toast.error(error.message || "Failed to save doctor procedure");
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldError = (field: string) => {
    return errors[field] ? (
      <div className="flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3 text-red-500" />
        <p className="text-xs text-red-500">{errors[field]}</p>
      </div>
    ) : null;
  };

  // Render components
  const renderHeader = () => (
    <div className="bg-gradient-to-r from-green-600 to-green-700 py-4 px-6 flex-shrink-0 relative">
      <div className="pr-10">
        <h2 className="text-white text-xl font-semibold flex items-center gap-2">
          {isEditMode ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Edit Procedure Assignment
            </>
          ) : (
            <>
              <Stethoscope className="h-5 w-5" />
              Assign Procedure to Doctor
            </>
          )}
        </h2>
        <p className="text-green-200 mt-1 text-sm">
          {isEditMode ? 'Update procedure assignment details' : 'Configure procedure charges and assignment'}
        </p>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClose} 
        className="absolute top-4 right-4 h-8 w-8 rounded-full text-white hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderSelectionSection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <UserCheck className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Assignment Details</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Doctor Selection */}
        {!doctorId && (
          <div className="space-y-2">
            <Label htmlFor="doctorId" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Doctor *
            </Label>
            <Select
              value={formData.doctorId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, doctorId: value }))}
            >
              <SelectTrigger className={`h-11 ${errors.doctorId ? 'border-red-300' : 'border-gray-200'}`}>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map(doctor => (
                  <SelectItem key={doctor.id} value={doctor.id!}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{doctor.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {doctor.speciality}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError('doctorId')}
          </div>
        )}

        {/* Procedure Selection */}
        <div className={`space-y-2 ${!doctorId ? '' : 'md:col-span-2'}`}>
          <Label htmlFor="procedureId" className="text-sm font-medium flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Procedure *
          </Label>
          <Select
            value={formData.procedureId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, procedureId: value }))}
          >
            <SelectTrigger className={`h-11 ${errors.procedureId ? 'border-red-300' : 'border-gray-200'}`}>
              <SelectValue placeholder="Select a procedure" />
            </SelectTrigger>
            <SelectContent>
              {procedures.map(procedure => (
                <SelectItem key={procedure.id} value={procedure.id!}>
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    <span>{procedure.name}</span>
                    {procedure.category && (
                      <Badge variant="outline" className="text-xs">
                        {procedure.category}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getFieldError('procedureId')}
          
          {/* Show selected procedure description */}
          {selectedProcedure?.description && (
            <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-100">
              <p className="text-xs text-blue-700">
                <strong>About this procedure:</strong> {selectedProcedure.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Doctor Info Card */}
      {selectedDoctor && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{selectedDoctor.name}</h4>
              <p className="text-sm text-blue-600">{selectedDoctor.speciality}</p>
            </div>
            <Badge variant="success" className="ml-auto">
              Active
            </Badge>
          </div>
        </div>
      )}
    </div>
  );

  const renderPricingSection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Pricing Structure</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Set doctor fee for this procedure</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Doctor Charge */}
      <div className="space-y-3">
        <Label htmlFor="doctorCharge" className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          Doctor Fee (Rs.) *
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            Rs.
          </div>
          <Input
            id="doctorCharge"
            type="number"
            step="0.01"
            min="0"
            value={formData.doctorCharge ?? ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              doctorCharge: e.target.value === '' ? undefined : parseFloat(e.target.value)
            }))}
            placeholder="0.00"
            className={`h-12 pl-12 text-lg font-medium ${errors.doctorCharge ? 'border-red-300' : 'border-gray-200'}`}
          />
        </div>
        {getFieldError('doctorCharge')}
        <div className="text-xs text-muted-foreground">
          Professional fee charged by the doctor for this procedure
        </div>
      </div>

      {/* Total Display */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">Total Procedure Cost</h4>
              <p className="text-sm text-muted-foreground">Doctor fee only</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {totalCharge}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdditionalInfo = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Notes & Special Instructions
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Any special instructions, notes, or requirements for this procedure assignment..."
          rows={3}
          className="resize-none border-gray-200 focus:border-blue-500"
        />
        <p className="text-xs text-muted-foreground">
          Include any special requirements, preparation instructions, or billing notes.
        </p>
      </div>

      {/* Active Status */}
      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <Checkbox
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ 
              ...prev, 
              isActive: checked as boolean 
            }))
          }
          className="h-5 w-5"
        />
        <div className="flex-1">
          <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Active Assignment
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            {formData.isActive 
              ? "This procedure is currently available for booking with this doctor" 
              : "This procedure assignment is currently inactive and unavailable for booking"
            }
          </p>
        </div>
        <Badge variant={formData.isActive ? "success" : "secondary"} className="ml-2">
          {formData.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="px-6 pb-6 pt-4 flex-shrink-0 border-t bg-gray-50/50">
      <div className="flex gap-3 w-full">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 rounded-lg border-gray-200"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSaving || loading}
          className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {isEditMode ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Assign Procedure
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <VisuallyHidden>
            <DialogTitle>Loading...</DialogTitle>
          </VisuallyHidden>
          <div className="flex justify-center items-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto" />
              <p className="text-sm text-muted-foreground">Loading doctors and procedures...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] rounded-xl overflow-hidden p-0 flex flex-col [&>button]:hidden">
        <VisuallyHidden>
          <DialogTitle>
            {isEditMode ? 'Edit Procedure Assignment' : 'Assign Procedure to Doctor'}
          </DialogTitle>
        </VisuallyHidden>

        {renderHeader()}
        
        <div className="flex flex-col flex-grow min-h-0">
          <div className="flex-grow overflow-y-auto px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {renderSelectionSection()}
              <Separator />
              {renderPricingSection()}
              <Separator />
              {renderAdditionalInfo()}
            </form>
          </div>
          
          {renderFooter()}
        </div>
      </DialogContent>
    </Dialog>
  );
}