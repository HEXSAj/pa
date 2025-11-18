// // src/app/dashboard/procedures/ProcedureModal.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { procedureService } from '@/services/procedureService';
// import { Procedure } from '@/types/procedure';
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
// import { Loader2, Save, Clock } from 'lucide-react';
// import { toast } from "sonner";

// interface ProcedureModalProps {
//   procedure?: Procedure; // If provided, we're editing an existing procedure
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function ProcedureModal({ procedure, onClose, onSuccess }: ProcedureModalProps) {
//   const isEditing = !!procedure;
  
//   const [formData, setFormData] = useState({
//     name: '',
//     localPatientCharge: 0,
//     foreignPatientCharge: 0,
//     description: '',
//     category: '',
//     duration: 0,
//     isActive: true
//   });

//   const [categories, setCategories] = useState<string[]>([]);
//   const [customCategory, setCustomCategory] = useState('');
//   const [showCustomCategory, setShowCustomCategory] = useState(false);
//   const [loadingCategories, setLoadingCategories] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);

//   // Load categories for selection dropdown
//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         setLoadingCategories(true);
//         const categoriesData = await procedureService.getCategories();
//         setCategories(categoriesData);
//       } catch (error) {
//         console.error("Error loading categories:", error);
//         toast.error("Failed to load categories");
//       } finally {
//         setLoadingCategories(false);
//       }
//     };
    
//     loadCategories();
//   }, []);

//   // Load existing procedure data if in edit mode
//  useEffect(() => {
//   if (procedure) {
//     setFormData({
//       name: procedure.name || '',
//       localPatientCharge: procedure.localPatientCharge || 0,
//       foreignPatientCharge: procedure.foreignPatientCharge || 0,
//       description: procedure.description || '',
//       category: procedure.category || '', // This is fine as is, 
//       duration: procedure.duration || 0,
//       isActive: procedure.isActive !== undefined ? procedure.isActive : true
//     });
//   }
// }, [procedure]);    

//   const handleCategoryChange = (value: string) => {
//   if (value === 'custom') {
//     setShowCustomCategory(true);
//     setFormData(prev => ({ ...prev, category: '' }));
//   } else if (value === 'none') {
//     // Handle the 'none' value by setting category to empty string
//     setShowCustomCategory(false);
//     setFormData(prev => ({ ...prev, category: '' }));
//   } else {
//     setShowCustomCategory(false);
//     setFormData(prev => ({ ...prev, category: value }));
//   }
// };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!formData.name.trim()) {
//       toast.error("Procedure name is required");
//       return;
//     }

//     if (formData.localPatientCharge <= 0) {
//       toast.error("Local patient charge must be greater than zero");
//       return;
//     }
    
//     if (formData.foreignPatientCharge <= 0) {
//       toast.error("Foreign patient charge (USD) must be greater than zero");
//       return;
//     }

//     // Use custom category if selected
//     const finalFormData = { 
//       ...formData,
//       category: showCustomCategory ? customCategory : formData.category
//     };

//     try {
//       setIsSaving(true);
      
//       if (isEditing && procedure?.id) {
//         // Update existing procedure
//         await procedureService.update(procedure.id, finalFormData);
//         toast.success("Procedure updated successfully");
//       } else {
//         // Create new procedure
//         await procedureService.create(finalFormData);
//         toast.success("Procedure added successfully");
//       }
      
//       onSuccess();
//     } catch (error) {
//       console.error("Error saving procedure:", error);
//       toast.error("Failed to save procedure");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <Dialog open={true} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>{isEditing ? 'Edit Procedure' : 'Add New Procedure'}</DialogTitle>
//         </DialogHeader>
        
//         <form onSubmit={handleSubmit}>
//           <Card>
//             <CardContent className="space-y-4 pt-4">
//               <div className="grid gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="name">Procedure Name *</Label>
//                   <Input
//                     id="name"
//                     required
//                     value={formData.name}
//                     onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
//                     placeholder="Enter procedure name"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="localPatientCharge">Local Patient Charge (Rs.) *</Label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                       Rs.
//                     </span>
//                     <Input
//                       id="localPatientCharge"
//                       type="number"
//                       required
//                       min="0.01"
//                       step="0.01"
//                        value={formData.localPatientCharge === 0 ? '' : formData.localPatientCharge}
//                         onChange={(e) => setFormData(prev => ({ 
//                             ...prev, 
//                             localPatientCharge: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
//                         }))}
//                         className="pl-12"
//                         placeholder="0.00"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                 <Label htmlFor="foreignPatientCharge">Foreign Patient Charge (USD) *</Label>
//                 <div className="relative">
//                   <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                     $
//                   </span>
//                   <Input
//                     id="foreignPatientCharge"
//                     type="number"
//                     required
//                     min="0.01"
//                     step="0.01"
//                     value={formData.foreignPatientCharge === 0 ? '' : formData.foreignPatientCharge}
//                     onChange={(e) => setFormData(prev => ({ 
//                       ...prev, 
//                       foreignPatientCharge: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
//                     }))}
//                     className="pl-8"
//                     placeholder="0.00"
//                   />
//                 </div>
//               </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="category">Category</Label>
//                   {loadingCategories ? (
//                     <div className="flex items-center space-x-2 p-2 border rounded">
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                       <span>Loading categories...</span>
//                     </div>
//                   ) : (
//                     <>
//                      <Select
//                         value={showCustomCategory ? 'custom' : formData.category || 'none'} // Changed empty string to 'none'
//                         onValueChange={handleCategoryChange}
//                         >
//                         <SelectTrigger>
//                             <SelectValue placeholder="Select category" />
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectGroup>
//                             <SelectItem value="none">No Category</SelectItem> {/* Changed from empty string to 'none' */}
//                             {categories.map((category) => (
//                                 <SelectItem key={category} value={category}>
//                                 {category}
//                                 </SelectItem>
//                             ))}
//                             <SelectItem value="custom">Add New Category</SelectItem>
//                             </SelectGroup>
//                         </SelectContent>
//                         </Select>

//                       {showCustomCategory && (
//                         <div className="mt-2">
//                           <Input
//                             placeholder="Enter new category name"
//                             value={customCategory}
//                             onChange={(e) => setCustomCategory(e.target.value)}
//                           />
//                         </div>
//                       )}
//                     </>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="duration">Duration (minutes)</Label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
//                       <Clock className="h-4 w-4" />
//                     </span>
//                     <Input
//                       id="duration"
//                       type="number"
//                       min="0"
//                       value={formData.duration === 0 ? '' : formData.duration}
//                         onChange={(e) => setFormData(prev => ({ 
//                             ...prev, 
//                             duration: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
//                         }))}
//                         className="pl-10"
//                     placeholder="0"
//                     />
//                   </div>
//                 </div>

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
//               disabled={isSaving || 
//                 !formData.name.trim() || 
//                 formData.localPatientCharge <= 0 ||
//                 formData.foreignPatientCharge <= 0 ||
//                 (showCustomCategory && !customCategory.trim())
//               }
//               className="gap-2"
//             >
//               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
//               {isEditing ? 'Update Procedure' : 'Add Procedure'}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

'use client';

import { useState, useEffect } from 'react';
import { procedureService } from '@/services/procedureService';
import { Procedure } from '@/types/procedure';
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Clock, X, DollarSign, FileText, Tag, Activity } from 'lucide-react';
import { toast } from "sonner";

interface ProcedureModalProps {
  procedure?: Procedure;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProcedureModal({ procedure, onClose, onSuccess }: ProcedureModalProps) {
  const isEditing = !!procedure;
  
  const [formData, setFormData] = useState({
    name: '',
    charge: 0,
    description: '',
    category: '',
    duration: 0,
    isActive: true
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load categories for selection dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const categoriesData = await procedureService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };
    
    loadCategories();
  }, []);

  // Load existing procedure data if in edit mode
  useEffect(() => {
    if (procedure) {
      setFormData({
        name: procedure.name || '',
        charge: procedure.charge || 0,
        description: procedure.description || '',
        category: procedure.category || '',
        duration: procedure.duration || 0,
        isActive: procedure.isActive !== undefined ? procedure.isActive : true
      });
    }
  }, [procedure]);    

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomCategory(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else if (value === 'none') {
      setShowCustomCategory(false);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setShowCustomCategory(false);
      setFormData(prev => ({ ...prev, category: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Procedure name is required");
      return;
    }

    if (formData.charge <= 0) {
      toast.error("Charge must be greater than zero");
      return;
    }

    // Use custom category if selected
    const finalFormData = { 
      ...formData,
      category: showCustomCategory ? customCategory : formData.category
    };

    try {
      setIsSaving(true);
      
      if (isEditing && procedure?.id) {
        await procedureService.update(procedure.id, finalFormData);
        toast.success("Procedure updated successfully");
      } else {
        await procedureService.create(finalFormData);
        toast.success("Procedure added successfully");
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving procedure:", error);
      toast.error("Failed to save procedure");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] rounded-xl overflow-hidden p-0 flex flex-col [&>button]:hidden">
        {/* Hidden DialogTitle for accessibility */}
        <VisuallyHidden>
          <DialogTitle>{isEditing ? 'Edit Procedure' : 'Add New Procedure'}</DialogTitle>
        </VisuallyHidden>

        {/* Custom Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6 flex-shrink-0 relative">
          <div className="pr-10">
            <h2 className="text-white text-xl font-semibold">
              {isEditing ? 'Edit Procedure' : 'Add New Procedure'}
            </h2>
            <p className="text-blue-200 mt-1 text-sm">
              {isEditing ? 'Update procedure details below.' : 'Enter the procedure details below.'}
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
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  Procedure Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter procedure name"
                  className="rounded-lg border-gray-200 focus:ring-blue-500"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="charge" className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                  Charge (Rs.) <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    Rs.
                  </span>
                  <Input
                    id="charge"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.charge === 0 ? '' : formData.charge}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      charge: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    }))}
                    className="pl-12 rounded-lg border-gray-200 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category" className="text-sm font-medium flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-gray-400" />
                  Category
                </Label>
                {loadingCategories ? (
                  <div className="flex items-center space-x-2 p-2 border rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading categories...</span>
                  </div>
                ) : (
                  <>
                    <Select
                      value={showCustomCategory ? 'custom' : formData.category || 'none'}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="rounded-lg border-gray-200 focus:ring-blue-500">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="none">No Category</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Add New Category</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    {showCustomCategory && (
                      <div className="mt-2">
                        <Input
                          placeholder="Enter new category name"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="rounded-lg border-gray-200 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration" className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  Duration (minutes)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <Clock className="h-4 w-4" />
                  </span>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={formData.duration === 0 ? '' : formData.duration}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      duration: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                    }))}
                    className="pl-10 rounded-lg border-gray-200 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description" className="text-sm font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)"
                  rows={3}
                  className="rounded-lg resize-none border-gray-200 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Activity className="h-4 w-4 text-gray-400" />
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive" className="text-sm font-medium">
                    Active Procedure
                  </Label>
                </div>
              </div>
            </form>
          </div>

          {/* Fixed Footer */}
          <div className="px-6 pb-6 pt-4 flex-shrink-0 border-t bg-gray-50/50">
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 rounded-lg border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving || 
                  !formData.name.trim() || 
                  formData.charge <= 0 ||
                  (showCustomCategory && !customCategory.trim())
                }
                className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Procedure' : 'Add Procedure'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}