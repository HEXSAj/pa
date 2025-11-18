// // src/app/dashboard/labs/LabModal.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { labService } from '@/services/labService';
// import { Lab } from '@/types/lab';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import { Loader2, Save } from 'lucide-react';
// import { toast } from "sonner";

// interface LabModalProps {
//   lab?: Lab; // If provided, we're editing an existing lab
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function LabModal({ lab, onClose, onSuccess }: LabModalProps) {
//   const isEditing = !!lab;
  
//   const [formData, setFormData] = useState({
//     name: '',
//     contactNo: '',
//     email: '',
//     address: '',
//     description: '',
//     isActive: true
//   });

//   const [isSaving, setIsSaving] = useState(false);

//   // Load existing lab data if in edit mode
//   useEffect(() => {
//     if (lab) {
//       setFormData({
//         name: lab.name || '',
//         contactNo: lab.contactNo || '',
//         email: lab.email || '',
//         address: lab.address || '',
//         description: lab.description || '',
//         isActive: lab.isActive !== undefined ? lab.isActive : true
//       });
//     }
//   }, [lab]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!formData.name.trim()) {
//       toast.error("Lab name is required");
//       return;
//     }

//     if (!formData.contactNo.trim()) {
//       toast.error("Contact number is required");
//       return;
//     }

//     try {
//       setIsSaving(true);
      
//       if (isEditing && lab?.id) {
//         // Update existing lab
//         await labService.update(lab.id, formData);
//         toast.success("Lab updated successfully");
//       } else {
//         // Create new lab
//         await labService.create(formData);
//         toast.success("Lab added successfully");
//       }
      
//       onSuccess();
//     } catch (error) {
//       console.error("Error saving lab:", error);
//       toast.error("Failed to save lab");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <Dialog open={true} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>{isEditing ? 'Edit Lab' : 'Add New Lab'}</DialogTitle>
//         </DialogHeader>
        
//         <form onSubmit={handleSubmit}>
//           <Card>
//             <CardContent className="space-y-4 pt-4">
//               <div className="grid gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="name">Lab Name *</Label>
//                   <Input
//                     id="name"
//                     required
//                     value={formData.name}
//                     onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
//                     placeholder="Enter lab name"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="contactNo">Contact Number *</Label>
//                   <Input
//                     id="contactNo"
//                     required
//                     value={formData.contactNo}
//                     onChange={(e) => setFormData(prev => ({ ...prev, contactNo: e.target.value }))}
//                     placeholder="Enter contact number"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="email">Email</Label>
//                   <Input
//                     id="email"
//                     type="email"
//                     value={formData.email}
//                     onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
//                     placeholder="Enter email address"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="address">Address</Label>
//                   <Textarea
//                     id="address"
//                     value={formData.address}
//                     onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
//                     placeholder="Enter address"
//                     rows={3}
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="description">Description</Label>
//                   <Textarea
//                     id="description"
//                     value={formData.description}
//                     onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//                     placeholder="Enter description"
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
//               disabled={isSaving}
//               className="gap-2"
//             >
//               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
//               {isEditing ? 'Update Lab' : 'Add Lab'}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

// src/app/dashboard/labs/LabModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { labService } from '@/services/labService';
import { Lab } from '@/types/lab';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, X, Building2, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { toast } from "sonner";

interface LabModalProps {
  lab?: Lab; // If provided, we're editing an existing lab
  onClose: () => void;
  onSuccess: () => void;
}

export default function LabModal({ lab, onClose, onSuccess }: LabModalProps) {
  const isEditing = !!lab;
  
  const [formData, setFormData] = useState({
    name: '',
    contactNo: '',
    email: '',
    address: '',
    description: '',
    isActive: true
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load existing lab data if in edit mode
  useEffect(() => {
    if (lab) {
      setFormData({
        name: lab.name || '',
        contactNo: lab.contactNo || '',
        email: lab.email || '',
        address: lab.address || '',
        description: lab.description || '',
        isActive: lab.isActive !== undefined ? lab.isActive : true
      });
    }
  }, [lab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Lab name is required");
      return;
    }

    if (!formData.contactNo.trim()) {
      toast.error("Contact number is required");
      return;
    }

    try {
      setIsSaving(true);
      
      if (isEditing && lab?.id) {
        // Update existing lab
        await labService.update(lab.id, formData);
        toast.success("Lab updated successfully");
      } else {
        // Create new lab
        await labService.create(formData);
        toast.success("Lab added successfully");
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving lab:", error);
      toast.error("Failed to save lab");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] rounded-xl overflow-hidden p-0 flex flex-col [&>button]:hidden">
        {/* Hidden DialogTitle for accessibility */}
        <VisuallyHidden>
          <DialogTitle>{isEditing ? 'Edit Lab' : 'Add New Lab'}</DialogTitle>
        </VisuallyHidden>

        {/* Custom Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6 flex-shrink-0 relative">
          <div className="pr-10">
            <h2 className="text-white text-xl font-semibold flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              {isEditing ? 'Edit Lab' : 'Add New Lab'}
            </h2>
            <p className="text-blue-200 mt-1 text-sm">
              {isEditing ? 'Update the lab details below.' : 'Enter the lab details for medical services.'}
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
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                    Lab Name <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter lab name"
                    className="rounded-lg border-gray-200 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNo" className="text-sm font-medium flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    Contact Number <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="contactNo"
                    required
                    value={formData.contactNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactNo: e.target.value }))}
                    placeholder="Enter contact number"
                    className="rounded-lg border-gray-200 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    className="rounded-lg border-gray-200 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address"
                    rows={3}
                    className="rounded-lg resize-none border-gray-200 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-400" />
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description"
                    rows={3}
                    className="rounded-lg resize-none border-gray-200 focus:ring-blue-500"
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
                disabled={isSaving}
                className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Lab' : 'Add Lab'}
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