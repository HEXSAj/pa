// // // // src/app/dashboard/lab-tests/LabTestModal.tsx
// // // 'use client';

// // // import { useState, useEffect } from 'react';
// // // import { labTestService } from '@/services/labTestService';
// // // import { labService } from '@/services/labService';
// // // import { LabTest } from '@/types/labTest';
// // // import { Lab } from '@/types/lab';
// // // import {
// // //   Dialog,
// // //   DialogContent,
// // //   DialogHeader,
// // //   DialogTitle,
// // // } from "@/components/ui/dialog";
// // // import {
// // //   Select,
// // //   SelectContent,
// // //   SelectGroup,
// // //   SelectItem,
// // //   SelectLabel,
// // //   SelectTrigger,
// // //   SelectValue,
// // // } from "@/components/ui/select";
// // // import { Input } from "@/components/ui/input";
// // // import { Label } from "@/components/ui/label";
// // // import { Button } from "@/components/ui/button";
// // // import { Card, CardContent } from "@/components/ui/card";
// // // import { Textarea } from "@/components/ui/textarea";
// // // import { Switch } from "@/components/ui/switch";
// // // import { Loader2, Save, CurrencyIcon } from 'lucide-react';
// // // import { toast } from "sonner";

// // // interface LabTestModalProps {
// // //   test?: LabTest; // If provided, we're editing an existing test
// // //   onClose: () => void;
// // //   onSuccess: () => void;
// // // }

// // // export default function LabTestModal({ test, onClose, onSuccess }: LabTestModalProps) {
// // //   const isEditing = !!test;
  
// // //   const [formData, setFormData] = useState({
// // //     name: '',
// // //     localPatientCharge: 0,       // New field for LKR
// // //     foreignPatientCharge: 0,     // New field for USD
// // //     labId: '',
// // //     labName: '',
// // //     description: '',
// // //     isActive: true
// // //   });

// // //   const [labs, setLabs] = useState<Lab[]>([]);
// // //   const [loadingLabs, setLoadingLabs] = useState(true);
// // //   const [isSaving, setIsSaving] = useState(false);

// // //   // Load labs for selection dropdown
// // //   useEffect(() => {
// // //     const loadLabs = async () => {
// // //       try {
// // //         setLoadingLabs(true);
// // //         const labsData = await labService.getAll();
// // //         // Only show active labs
// // //         const activeLabs = labsData.filter(lab => lab.isActive !== false);
// // //         setLabs(activeLabs);
        
// // //         // Set default lab if we have labs and we're creating a new test
// // //         if (activeLabs.length > 0 && !isEditing) {
// // //           setFormData(prev => ({
// // //             ...prev,
// // //             labId: activeLabs[0].id!,
// // //             labName: activeLabs[0].name
// // //           }));
// // //         }
// // //       } catch (error) {
// // //         console.error("Error loading labs:", error);
// // //         toast.error("Failed to load labs");
// // //       } finally {
// // //         setLoadingLabs(false);
// // //       }
// // //     };
    
// // //     loadLabs();
// // //   }, [isEditing]);

// // //   // Load existing test data if in edit mode
// // //   useEffect(() => {
// // //     if (test) {
// // //       setFormData({
// // //         name: test.name || '',
// // //         price: test.price || 0,
// // //         labId: test.labId || '',
// // //         labName: test.labName || '',
// // //         description: test.description || '',
// // //         isActive: test.isActive !== undefined ? test.isActive : true
// // //       });
// // //     }
// // //   }, [test]);

// // //   const handleLabChange = (labId: string) => {
// // //     const selectedLab = labs.find(lab => lab.id === labId);
// // //     if (selectedLab) {
// // //       setFormData(prev => ({
// // //         ...prev,
// // //         labId: labId,
// // //         labName: selectedLab.name
// // //       }));
// // //     }
// // //   };

// // //   const handleSubmit = async (e: React.FormEvent) => {
// // //     e.preventDefault();
    
// // //     if (!formData.name.trim()) {
// // //       toast.error("Test name is required");
// // //       return;
// // //     }

// // //     if (!formData.labId) {
// // //       toast.error("Lab selection is required");
// // //       return;
// // //     }

// // //     if (formData.price <= 0) {
// // //       toast.error("Price must be greater than zero");
// // //       return;
// // //     }

// // //     try {
// // //       setIsSaving(true);
      
// // //       if (isEditing && test?.id) {
// // //         // Update existing test
// // //         await labTestService.update(test.id, formData);
// // //         toast.success("Lab test updated successfully");
// // //       } else {
// // //         // Create new test
// // //         await labTestService.create(formData);
// // //         toast.success("Lab test added successfully");
// // //       }
      
// // //       onSuccess();
// // //     } catch (error) {
// // //       console.error("Error saving lab test:", error);
// // //       toast.error("Failed to save lab test");
// // //     } finally {
// // //       setIsSaving(false);
// // //     }
// // //   };

// // //   return (
// // //     <Dialog open={true} onOpenChange={onClose}>
// // //       <DialogContent className="sm:max-w-[500px]">
// // //         <DialogHeader>
// // //           <DialogTitle>{isEditing ? 'Edit Lab Test' : 'Add New Lab Test'}</DialogTitle>
// // //         </DialogHeader>
        
// // //         <form onSubmit={handleSubmit}>
// // //           <Card>
// // //             <CardContent className="space-y-4 pt-4">
// // //               <div className="grid gap-4">
// // //                 <div className="space-y-2">
// // //                   <Label htmlFor="labId">Lab *</Label>
// // //                   {loadingLabs ? (
// // //                     <div className="flex items-center space-x-2 p-2 border rounded">
// // //                       <Loader2 className="h-4 w-4 animate-spin" />
// // //                       <span>Loading labs...</span>
// // //                     </div>
// // //                   ) : (
// // //                     <>
// // //                       {labs.length === 0 ? (
// // //                         <div className="p-2 text-sm text-amber-600 bg-amber-50 rounded border border-amber-200">
// // //                           No active labs found. Please create a lab first.
// // //                         </div>
// // //                       ) : (
// // //                         <Select
// // //                           value={formData.labId}
// // //                           onValueChange={handleLabChange}
// // //                           disabled={isEditing} // Disable changing lab on edit
// // //                         >
// // //                           <SelectTrigger>
// // //                             <SelectValue placeholder="Select lab" />
// // //                           </SelectTrigger>
// // //                           <SelectContent>
// // //                             <SelectGroup>
// // //                               <SelectLabel>Labs</SelectLabel>
// // //                               {labs.map((lab) => (
// // //                                 <SelectItem key={lab.id} value={lab.id!}>
// // //                                   {lab.name}
// // //                                 </SelectItem>
// // //                               ))}
// // //                             </SelectGroup>
// // //                           </SelectContent>
// // //                         </Select>
// // //                       )}
// // //                     </>
// // //                   )}
// // //                 </div>

// // //                 <div className="space-y-2">
// // //                   <Label htmlFor="name">Test Name *</Label>
// // //                   <Input
// // //                     id="name"
// // //                     required
// // //                     value={formData.name}
// // //                     onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
// // //                     placeholder="Enter test name"
// // //                   />
// // //                 </div>

// // //                 {/* <div className="space-y-2">
// // //                   <Label htmlFor="price">Price *</Label>
// // //                   <div className="relative">
// // //                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
// // //                       Rs
// // //                     </span>
// // //                     <Input
// // //                       id="price"
// // //                       type="number"
// // //                       required
// // //                       min="0.01"
// // //                       step="0.01"
// // //                      value={formData.price === 0 ? '' : formData.price}
// // //                         onChange={(e) => setFormData(prev => ({ 
// // //                             ...prev, 
// // //                             price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
// // //                         }))}
// // //                         className="pl-12"
// // //                         placeholder="0.00"
// // //                     />
// // //                   </div>
// // //                 </div> */}


// // //                   <div className="space-y-2">
// // //                     <Label htmlFor="localPatientCharge">Local Patient Charge (LKR) *</Label>
// // //                     <div className="relative">
// // //                       <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
// // //                         Rs
// // //                       </span>
// // //                       <Input
// // //                         id="localPatientCharge"
// // //                         type="number"
// // //                         required
// // //                         min="0.01"
// // //                         step="0.01"
// // //                         value={formData.localPatientCharge === 0 ? '' : formData.localPatientCharge}
// // //                         onChange={(e) => setFormData(prev => ({ 
// // //                           ...prev, 
// // //                           localPatientCharge: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
// // //                         }))}
// // //                         className="pl-12"
// // //                         placeholder="0.00"
// // //                       />
// // //                     </div>
// // //                   </div>

// // //                   {/* Foreign Patient Charge (USD) */}
// // //                   <div className="space-y-2">
// // //                     <Label htmlFor="foreignPatientCharge">Foreign Patient Charge (USD) *</Label>
// // //                     <div className="relative">
// // //                       <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
// // //                         $
// // //                       </span>
// // //                       <Input
// // //                         id="foreignPatientCharge"
// // //                         type="number"
// // //                         required
// // //                         min="0.01"
// // //                         step="0.01"
// // //                         value={formData.foreignPatientCharge === 0 ? '' : formData.foreignPatientCharge}
// // //                         onChange={(e) => setFormData(prev => ({ 
// // //                           ...prev, 
// // //                           foreignPatientCharge: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
// // //                         }))}
// // //                         className="pl-12"
// // //                         placeholder="0.00"
// // //                       />
// // //                     </div>
// // //                   </div>



// // //                 <div className="space-y-2">
// // //                   <Label htmlFor="description">Description</Label>
// // //                   <Textarea
// // //                     id="description"
// // //                     value={formData.description}
// // //                     onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
// // //                     placeholder="Enter description (optional)"
// // //                     rows={3}
// // //                   />
// // //                 </div>

// // //                 <div className="flex items-center gap-2">
// // //                   <Switch
// // //                     id="isActive"
// // //                     checked={formData.isActive}
// // //                     onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
// // //                   />
// // //                   <Label htmlFor="isActive">Active</Label>
// // //                 </div>
// // //               </div>
// // //             </CardContent>
// // //           </Card>

// // //           <div className="flex justify-end gap-3 mt-6">
// // //             <Button
// // //               type="button"
// // //               variant="outline"
// // //               onClick={onClose}
// // //               disabled={isSaving}
// // //             >
// // //               Cancel
// // //             </Button>
// // //             <Button
// // //               type="submit"
// // //               disabled={isSaving || !formData.labId || labs.length === 0}
// // //               className="gap-2"
// // //             >
// // //               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
// // //               {isEditing ? 'Update Test' : 'Add Test'}
// // //             </Button>
// // //           </div>
// // //         </form>
// // //       </DialogContent>
// // //     </Dialog>
// // //   );
// // // }  


// // // src/app/dashboard/lab-tests/LabTestModal.tsx
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { labTestService } from '@/services/labTestService';
// // import { labService } from '@/services/labService';
// // import { LabTest } from '@/types/labTest';
// // import { Lab } from '@/types/lab';
// // import {
// //   Dialog,
// //   DialogContent,
// //   DialogHeader,
// //   DialogTitle,
// // } from "@/components/ui/dialog";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectGroup,
// //   SelectItem,
// //   SelectLabel,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent } from "@/components/ui/card";
// // import { Textarea } from "@/components/ui/textarea";
// // import { Switch } from "@/components/ui/switch";
// // import { Loader2, Save, CurrencyIcon } from 'lucide-react';
// // import { toast } from "sonner";

// // import { useAuth } from '@/context/AuthContext';

// // interface LabTestModalProps {
// //   test?: LabTest;
// //   onClose: () => void;
// //   onSuccess: () => void;
// // }

// // export default function LabTestModal({ test, onClose, onSuccess }: LabTestModalProps) {
// //   const isEditing = !!test;
// //   const { user } = useAuth(); // Get current user
// //   const [priceChangeReason, setPriceChangeReason] = useState('');

  
// //   const [formData, setFormData] = useState({
// //     name: '',
// //     price: 0,  // Changed from localPatientCharge to price
// //     labId: '',
// //     labName: '',
// //     description: '',
// //     isActive: true
// //   });

// //   const [labs, setLabs] = useState<Lab[]>([]);
// //   const [loadingLabs, setLoadingLabs] = useState(true);
// //   const [isSaving, setIsSaving] = useState(false);

// //   // Load labs for selection dropdown
// //   useEffect(() => {
// //     const loadLabs = async () => {
// //       try {
// //         setLoadingLabs(true);
// //         const labsData = await labService.getAll();
// //         const activeLabs = labsData.filter(lab => lab.isActive !== false);
// //         setLabs(activeLabs);
        
// //         if (activeLabs.length > 0 && !isEditing) {
// //           setFormData(prev => ({
// //             ...prev,
// //             labId: activeLabs[0].id!,
// //             labName: activeLabs[0].name
// //           }));
// //         }
// //       } catch (error) {
// //         console.error("Error loading labs:", error);
// //         toast.error("Failed to load labs");
// //       } finally {
// //         setLoadingLabs(false);
// //       }
// //     };
    
// //     loadLabs();
// //   }, [isEditing]);

// //   // Load existing test data if in edit mode
// //   useEffect(() => {
// //     if (test) {
// //       setFormData({
// //         name: test.name || '',
// //         price: test.price || test.localPatientCharge || 0, // Handle both old and new field names
// //         labId: test.labId || '',
// //         labName: test.labName || '',
// //         description: test.description || '',
// //         isActive: test.isActive !== undefined ? test.isActive : true
// //       });
// //     }
// //   }, [test]);

// //   const handleLabChange = (labId: string) => {
// //     const selectedLab = labs.find(lab => lab.id === labId);
// //     if (selectedLab) {
// //       setFormData(prev => ({
// //         ...prev,
// //         labId: labId,
// //         labName: selectedLab.name
// //       }));
// //     }
// //   };

// //   // const handleSubmit = async (e: React.FormEvent) => {
// //   //   e.preventDefault();
    
// //   //   if (!formData.name.trim()) {
// //   //     toast.error("Test name is required");
// //   //     return;
// //   //   }

// //   //   if (!formData.labId) {
// //   //     toast.error("Lab selection is required");
// //   //     return;
// //   //   }

// //   //   if (formData.price <= 0) {
// //   //     toast.error("Price must be greater than zero");
// //   //     return;
// //   //   }

// //   //   try {
// //   //     setIsSaving(true);
      
// //   //     if (isEditing && test?.id) {
// //   //       await labTestService.update(test.id, formData);
// //   //       toast.success("Lab test updated successfully");
// //   //     } else {
// //   //       await labTestService.create(formData);
// //   //       toast.success("Lab test added successfully");
// //   //     }
      
// //   //     onSuccess();
// //   //   } catch (error) {
// //   //     console.error("Error saving lab test:", error);
// //   //     toast.error("Failed to save lab test");
// //   //   } finally {
// //   //     setIsSaving(false);
// //   //   }
// //   // };

// //   const handleSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();
    
// //     if (!formData.name.trim()) {
// //       toast.error("Test name is required");
// //       return;
// //     }

// //     if (!formData.labId) {
// //       toast.error("Lab selection is required");
// //       return;
// //     }

// //     if (formData.price <= 0) {
// //       toast.error("Price must be greater than zero");
// //       return;
// //     }

// //     try {
// //       setIsSaving(true);
      
// //       if (isEditing && test?.id) {
// //         // Pass the current user ID to track who made the change
// //         await labTestService.update(test.id, formData, user?.uid);
// //         toast.success("Lab test updated successfully");
// //       } else {
// //         await labTestService.create(formData);
// //         toast.success("Lab test added successfully");
// //       }
      
// //       onSuccess();
// //     } catch (error) {
// //       console.error("Error saving lab test:", error);
// //       toast.error("Failed to save lab test");
// //     } finally {
// //       setIsSaving(false);
// //     }
// //   };

// //   return (
// //     <Dialog open={true} onOpenChange={onClose}>
// //       <DialogContent className="sm:max-w-[500px]">
// //         <DialogHeader>
// //           <DialogTitle>{isEditing ? 'Edit Lab Test' : 'Add New Lab Test'}</DialogTitle>
// //         </DialogHeader>
        
// //         <form onSubmit={handleSubmit}>
// //           <Card>
// //             <CardContent className="space-y-4 pt-4">
// //               <div className="grid gap-4">
// //                 <div className="space-y-2">
// //                   <Label htmlFor="labId">Lab *</Label>
// //                   {loadingLabs ? (
// //                     <div className="flex items-center space-x-2 p-2 border rounded">
// //                       <Loader2 className="h-4 w-4 animate-spin" />
// //                       <span>Loading labs...</span>
// //                     </div>
// //                   ) : (
// //                     <>
// //                       {labs.length === 0 ? (
// //                         <div className="p-2 text-sm text-amber-600 bg-amber-50 rounded border border-amber-200">
// //                           No active labs found. Please create a lab first.
// //                         </div>
// //                       ) : (
// //                         <Select
// //                           value={formData.labId}
// //                           onValueChange={handleLabChange}
// //                           disabled={isEditing}
// //                         >
// //                           <SelectTrigger>
// //                             <SelectValue placeholder="Select lab" />
// //                           </SelectTrigger>
// //                           <SelectContent>
// //                             <SelectGroup>
// //                               <SelectLabel>Labs</SelectLabel>
// //                               {labs.map((lab) => (
// //                                 <SelectItem key={lab.id} value={lab.id!}>
// //                                   {lab.name}
// //                                 </SelectItem>
// //                               ))}
// //                             </SelectGroup>
// //                           </SelectContent>
// //                         </Select>
// //                       )}
// //                     </>
// //                   )}
// //                 </div>

// //                 <div className="space-y-2">
// //                   <Label htmlFor="name">Test Name *</Label>
// //                   <Input
// //                     id="name"
// //                     required
// //                     value={formData.name}
// //                     onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
// //                     placeholder="Enter test name"
// //                   />
// //                 </div>

// //                 <div className="space-y-2">
// //                   <Label htmlFor="price">Price (LKR) *</Label>
// //                   <div className="relative">
// //                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
// //                       Rs
// //                     </span>
// //                     <Input
// //                       id="price"
// //                       type="number"
// //                       required
// //                       min="0.01"
// //                       step="0.01"
// //                       value={formData.price === 0 ? '' : formData.price}
// //                       onChange={(e) => setFormData(prev => ({ 
// //                         ...prev, 
// //                         price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
// //                       }))}
// //                       className="pl-12"
// //                       placeholder="0.00"
// //                     />
// //                   </div>
// //                 </div>

// //                 <div className="space-y-2">
// //                   <Label htmlFor="description">Description</Label>
// //                   <Textarea
// //                     id="description"
// //                     value={formData.description}
// //                     onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
// //                     placeholder="Enter description (optional)"
// //                     rows={3}
// //                   />
// //                 </div>

// //                 <div className="flex items-center gap-2">
// //                   <Switch
// //                     id="isActive"
// //                     checked={formData.isActive}
// //                     onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
// //                   />
// //                   <Label htmlFor="isActive">Active</Label>
// //                 </div>

// //                      {isEditing && formData.price !== test?.price && (
// //                       <div className="space-y-2">
// //                         <Label htmlFor="priceChangeReason">Reason for Price Change (Optional)</Label>
// //                         <Textarea
// //                           id="priceChangeReason"
// //                           value={priceChangeReason}
// //                           onChange={(e) => setPriceChangeReason(e.target.value)}
// //                           placeholder="Enter reason for price change..."
// //                           rows={2}
// //                         />
// //                       </div>
// //                     )}


// //               </div>
// //             </CardContent>
// //           </Card>

// //           <div className="flex justify-end gap-3 mt-6">
// //             <Button
// //               type="button"
// //               variant="outline"
// //               onClick={onClose}
// //               disabled={isSaving}
// //             >
// //               Cancel
// //             </Button>
// //             <Button
// //               type="submit"
// //               disabled={isSaving || !formData.labId || labs.length === 0}
// //               className="gap-2"
// //             >
// //               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
// //               {isEditing ? 'Update Test' : 'Add Test'}
// //             </Button>
// //           </div>
// //         </form>
// //       </DialogContent>
// //     </Dialog>
// //   );
// // }

// // src/app/dashboard/lab-tests/LabTestModal.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { labTestService } from '@/services/labTestService';
// import { labService } from '@/services/labService';
// import { LabTest } from '@/types/labTest';
// import { Lab } from '@/types/lab';
// import { useAuth } from '@/context/AuthContext'; // Add this import
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import { Loader2, Save, CurrencyIcon } from 'lucide-react';
// import { toast } from "sonner";

// interface LabTestModalProps {
//   test?: LabTest;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function LabTestModal({ test, onClose, onSuccess }: LabTestModalProps) {
//   const isEditing = !!test;
//   const { user } = useAuth(); // Get current user
  
//   const [formData, setFormData] = useState({
//     name: '',
//     price: 0,
//     labId: '',
//     labName: '',
//     description: '',
//     isActive: true
//   });

//   const [priceChangeReason, setPriceChangeReason] = useState(''); // Add this state
//   const [labs, setLabs] = useState<Lab[]>([]);
//   const [loadingLabs, setLoadingLabs] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);

//   // Check if price has changed
//   const priceHasChanged = isEditing && test && formData.price !== test.price;

//   // Load labs for selection dropdown
//   useEffect(() => {
//     const loadLabs = async () => {
//       try {
//         setLoadingLabs(true);
//         const labsData = await labService.getAll();
//         const activeLabs = labsData.filter(lab => lab.isActive !== false);
//         setLabs(activeLabs);
        
//         if (activeLabs.length > 0 && !isEditing) {
//           setFormData(prev => ({
//             ...prev,
//             labId: activeLabs[0].id!,
//             labName: activeLabs[0].name
//           }));
//         }
//       } catch (error) {
//         console.error("Error loading labs:", error);
//         toast.error("Failed to load labs");
//       } finally {
//         setLoadingLabs(false);
//       }
//     };
    
//     loadLabs();
//   }, [isEditing]);

//   // Load existing test data if in edit mode
//   useEffect(() => {
//     if (test) {
//       setFormData({
//         name: test.name || '',
//         price: test.price || test.localPatientCharge || 0,
//         labId: test.labId || '',
//         labName: test.labName || '',
//         description: test.description || '',
//         isActive: test.isActive !== undefined ? test.isActive : true
//       });
//     }
//   }, [test]);

//   const handleLabChange = (labId: string) => {
//     const selectedLab = labs.find(lab => lab.id === labId);
//     if (selectedLab) {
//       setFormData(prev => ({
//         ...prev,
//         labId: labId,
//         labName: selectedLab.name
//       }));
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!formData.name.trim()) {
//       toast.error("Test name is required");
//       return;
//     }

//     if (!formData.labId) {
//       toast.error("Lab selection is required");
//       return;
//     }

//     if (formData.price <= 0) {
//       toast.error("Price must be greater than zero");
//       return;
//     }

//     try {
//       setIsSaving(true);
      
//       if (isEditing && test?.id) {
//         console.log('Updating test with user:', user?.uid);
//         // Pass the current user ID and reason to track who made the change
//         await labTestService.update(test.id, formData, user?.uid, priceChangeReason);
//         toast.success("Lab test updated successfully");
//       } else {
//         await labTestService.create(formData);
//         toast.success("Lab test added successfully");
//       }
      
//       onSuccess();
//     } catch (error) {
//       console.error("Error saving lab test:", error);
//       toast.error("Failed to save lab test");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <Dialog open={true} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>{isEditing ? 'Edit Lab Test' : 'Add New Lab Test'}</DialogTitle>
//         </DialogHeader>
        
//         <form onSubmit={handleSubmit}>
//           <Card>
//             <CardContent className="space-y-4 pt-4">
//               <div className="grid gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="labId">Lab *</Label>
//                   {loadingLabs ? (
//                     <div className="flex items-center space-x-2 p-2 border rounded">
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                       <span>Loading labs...</span>
//                     </div>
//                   ) : (
//                     <>
//                       {labs.length === 0 ? (
//                         <div className="p-2 text-sm text-amber-600 bg-amber-50 rounded border border-amber-200">
//                           No active labs found. Please create a lab first.
//                         </div>
//                       ) : (
//                         <Select
//                           value={formData.labId}
//                           onValueChange={handleLabChange}
//                           disabled={isEditing}
//                         >
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select lab" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectGroup>
//                               <SelectLabel>Labs</SelectLabel>
//                               {labs.map((lab) => (
//                                 <SelectItem key={lab.id} value={lab.id!}>
//                                   {lab.name}
//                                 </SelectItem>
//                               ))}
//                             </SelectGroup>
//                           </SelectContent>
//                         </Select>
//                       )}
//                     </>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="name">Test Name *</Label>
//                   <Input
//                     id="name"
//                     required
//                     value={formData.name}
//                     onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
//                     placeholder="Enter test name"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="price">Price (LKR) *</Label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                       Rs
//                     </span>
//                     <Input
//                       id="price"
//                       type="number"
//                       required
//                       min="0.01"
//                       step="0.01"
//                       value={formData.price === 0 ? '' : formData.price}
//                       onChange={(e) => setFormData(prev => ({ 
//                         ...prev, 
//                         price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
//                       }))}
//                       className="pl-12"
//                       placeholder="0.00"
//                     />
//                   </div>
//                 </div>

//                 {/* Show reason field only when editing and price has changed */}
//                 {priceHasChanged && (
//                   <div className="space-y-2">
//                     <Label htmlFor="priceChangeReason">Reason for Price Change (Optional)</Label>
//                     <Textarea
//                       id="priceChangeReason"
//                       value={priceChangeReason}
//                       onChange={(e) => setPriceChangeReason(e.target.value)}
//                       placeholder="Enter reason for price change..."
//                       rows={2}
//                     />
//                   </div>
//                 )}

//                 <div className="space-y-2">
//                   <Label htmlFor="description">Description</Label>
//                   <Textarea
//                     id="description"
//                     value={formData.description}
//                     onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//                     placeholder="Enter description (optional)"
//                     rows={3}
//                   />
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <Switch
//                     id="isActive"
//                     checked={formData.isActive}
//                     onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
//                   />
//                   <Label htmlFor="isActive">Active</Label>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <div className="flex justify-end gap-3 mt-6">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={onClose}
//               disabled={isSaving}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               disabled={isSaving || !formData.labId || labs.length === 0}
//               className="gap-2"
//             >
//               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
//               {isEditing ? 'Update Test' : 'Add Test'}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

// src/app/dashboard/lab-tests/LabTestModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { labTestService } from '@/services/labTestService';
import { labService } from '@/services/labService';
import { LabTest } from '@/types/labTest';
import { Lab } from '@/types/lab';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, X } from 'lucide-react';
import { toast } from "sonner";

interface LabTestModalProps {
  test?: LabTest;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LabTestModal({ test, onClose, onSuccess }: LabTestModalProps) {
  const isEditing = !!test;
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    labId: '',
    labName: '',
    description: '',
    isActive: true
  });

  const [priceChangeReason, setPriceChangeReason] = useState('');
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Check if price has changed
  const priceHasChanged = isEditing && test && formData.price !== test.price;

  // Load labs for selection dropdown
  useEffect(() => {
    const loadLabs = async () => {
      try {
        setLoadingLabs(true);
        const labsData = await labService.getAll();
        const activeLabs = labsData.filter(lab => lab.isActive !== false);
        setLabs(activeLabs);
        
        if (activeLabs.length > 0 && !isEditing) {
          setFormData(prev => ({
            ...prev,
            labId: activeLabs[0].id!,
            labName: activeLabs[0].name
          }));
        }
      } catch (error) {
        console.error("Error loading labs:", error);
        toast.error("Failed to load labs");
      } finally {
        setLoadingLabs(false);
      }
    };
    
    loadLabs();
  }, [isEditing]);

  // Load existing test data if in edit mode
  useEffect(() => {
    if (test) {
      setFormData({
        name: test.name || '',
        price: test.price || 0,
        labId: test.labId || '',
        labName: test.labName || '',
        description: test.description || '',
        isActive: test.isActive !== undefined ? test.isActive : true
      });
    }
  }, [test]);

  const handleLabChange = (labId: string) => {
    const selectedLab = labs.find(lab => lab.id === labId);
    if (selectedLab) {
      setFormData(prev => ({
        ...prev,
        labId: labId,
        labName: selectedLab.name
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Test name is required");
      return;
    }

    if (!formData.labId) {
      toast.error("Lab selection is required");
      return;
    }

    if (formData.price <= 0) {
      toast.error("Price must be greater than zero");
      return;
    }

    try {
      setIsSaving(true);
      
      if (isEditing && test?.id) {
        console.log('Updating test with user:', user?.uid);
        await labTestService.update(test.id, formData, user?.uid, priceChangeReason);
        toast.success("Lab test updated successfully");
      } else {
        await labTestService.create(formData);
        toast.success("Lab test added successfully");
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving lab test:", error);
      toast.error("Failed to save lab test");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] rounded-xl overflow-hidden p-0 flex flex-col [&>button]:hidden">
        {/* Hidden DialogTitle for accessibility */}
        <VisuallyHidden>
          <DialogTitle>{isEditing ? 'Edit Lab Test' : 'Add New Lab Test'}</DialogTitle>
        </VisuallyHidden>

        {/* Custom Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6 flex-shrink-0 relative">
          <div className="pr-10">
            <h2 className="text-white text-xl font-semibold">
              {isEditing ? 'Edit Lab Test' : 'Add New Lab Test'}
            </h2>
            <p className="text-blue-200 mt-1 text-sm">
              {isEditing ? 'Update the lab test details below.' : 'Enter the lab test details below.'}
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
        
        <div className="flex flex-col flex-grow min-h-0">
          {/* Scrollable Content Area */}
          <div className="flex-grow overflow-y-auto px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Card>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="labId">Lab *</Label>
                      {loadingLabs ? (
                        <div className="flex items-center space-x-2 p-2 border rounded">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading labs...</span>
                        </div>
                      ) : (
                        <>
                          {labs.length === 0 ? (
                            <div className="p-2 text-sm text-amber-600 bg-amber-50 rounded border border-amber-200">
                              No active labs found. Please create a lab first.
                            </div>
                          ) : (
                            <Select
                              value={formData.labId}
                              onValueChange={handleLabChange}
                              disabled={isEditing}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select lab" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Labs</SelectLabel>
                                  {labs.map((lab) => (
                                    <SelectItem key={lab.id} value={lab.id!}>
                                      {lab.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Test Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter test name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price (LKR) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          Rs
                        </span>
                        <Input
                          id="price"
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          value={formData.price === 0 ? '' : formData.price}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                          }))}
                          className="pl-12"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Show reason field only when editing and price has changed */}
                    {priceHasChanged && (
                      <div className="space-y-2">
                        <Label htmlFor="priceChangeReason">Reason for Price Change (Optional)</Label>
                        <Textarea
                          id="priceChangeReason"
                          value={priceChangeReason}
                          onChange={(e) => setPriceChangeReason(e.target.value)}
                          placeholder="Enter reason for price change..."
                          rows={2}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter description (optional)"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Fixed Footer */}
          <div className="px-6 pb-6 pt-4 flex-shrink-0 border-t bg-gray-50/50">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving || !formData.labId || labs.length === 0}
                className="gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEditing ? 'Update Test' : 'Add Test'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}