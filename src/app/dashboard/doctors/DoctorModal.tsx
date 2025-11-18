// src/app/dashboard/doctors/DoctorModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Doctor } from '@/types/doctor';
import { doctorService } from '@/services/doctorService';
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  User, 
  Stethoscope, 
  Phone, 
  Mail, 
  FileText,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DoctorModalProps {
  doctor?: Doctor;
  onClose: () => void;
  onSuccess: (doctorId?: string) => void;
}

// Common medical specialties for suggestions
const commonSpecialties = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Gynecology',
  'Psychiatry',
  'Radiology',
  'Anesthesiology',
  'Emergency Medicine',
  'Internal Medicine',
  'Surgery',
  'Oncology',
  'Ophthalmology',
  'ENT',
  'Urology',
  'Pathology'
];

export default function DoctorModal({ doctor, onClose, onSuccess }: DoctorModalProps) {
  const isEditMode = !!doctor;

  const [formData, setFormData] = useState<Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    speciality: '',
    description: '',
    contactNumber: '',
    email: '',
    isActive: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSpecialtySuggestions, setShowSpecialtySuggestions] = useState(false);
  const [filteredSpecialties, setFilteredSpecialties] = useState<string[]>([]);

  // Initialize form data if editing
  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name,
        speciality: doctor.speciality,
        description: doctor.description || '',
        contactNumber: doctor.contactNumber || '',
        email: doctor.email || '',
        isActive: doctor.isActive !== undefined ? doctor.isActive : true
      });
    }
  }, [doctor]);

  // Filter specialties based on input
  useEffect(() => {
    if (formData.speciality) {
      const filtered = commonSpecialties.filter(specialty =>
        specialty.toLowerCase().includes(formData.speciality.toLowerCase())
      );
      setFilteredSpecialties(filtered);
    } else {
      setFilteredSpecialties(commonSpecialties);
    }
  }, [formData.speciality]);

  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Doctor name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.speciality.trim()) {
      newErrors.speciality = 'Speciality is required';
    }

    // Email validation if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Contact number validation if provided
    if (formData.contactNumber && !/^\+?[0-9\s-()]{7,15}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Please enter a valid contact number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      if (isEditMode && doctor?.id) {
        await doctorService.updateDoctor(doctor.id, formData);
        toast.success("Doctor updated successfully");
        onSuccess(doctor.id);
      } else {
        const result = await doctorService.createDoctor(formData);
        toast.success("Doctor added successfully");
        onSuccess(result.id);
      }
    } catch (error: any) {
      console.error('Error saving doctor:', error);
      toast.error(error.message || "Failed to save doctor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSpecialtySelect = (specialty: string) => {
    setFormData(prev => ({ ...prev, speciality: specialty }));
    setShowSpecialtySuggestions(false);
  };

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'name': return <User className="h-4 w-4" />;
      case 'speciality': return <Stethoscope className="h-4 w-4" />;
      case 'contactNumber': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'description': return <FileText className="h-4 w-4" />;
      default: return null;
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] rounded-xl overflow-hidden p-0 flex flex-col [&>button]:hidden">
        {/* Hidden DialogTitle for accessibility */}
        <VisuallyHidden>
          <DialogTitle>{isEditMode ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
        </VisuallyHidden>

        {/* Custom Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-4 px-6 flex-shrink-0 relative">
          <div className="pr-10">
            <h2 className="text-white text-xl font-semibold flex items-center gap-2">
              {isEditMode ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Edit Doctor
                </>
              ) : (
                <>
                  <User className="h-5 w-5" />
                  Add New Doctor
                </>
              )}
            </h2>
            <p className="text-blue-200 mt-1 text-sm">
              {isEditMode ? 'Update doctor information' : 'Enter doctor details below'}
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
          <div className="flex-grow overflow-y-auto px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                </div>

                {/* Doctor Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                    {getFieldIcon('name')}
                    Doctor Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter doctor's full name"
                    className={`h-11 ${errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
                  />
                  {getFieldError('name')}
                </div>

                {/* Speciality with Suggestions */}
                <div className="space-y-2 relative">
                  <Label htmlFor="speciality" className="text-sm font-medium flex items-center gap-2">
                    {getFieldIcon('speciality')}
                    Speciality *
                  </Label>
                  <div className="relative">
                  <Input
                    id="speciality"
                    value={formData.speciality}
                    onChange={(e) => setFormData(prev => ({ ...prev, speciality: e.target.value }))}
                    onFocus={() => setShowSpecialtySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSpecialtySuggestions(false), 300)}
                    placeholder="E.g., Cardiology, Dermatology, General Medicine"
                    className={`h-11 ${errors.speciality ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
                  />

                  {/* Specialty Suggestions Dropdown */}
                  {showSpecialtySuggestions && filteredSpecialties.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {filteredSpecialties.slice(0, 8).map((specialty) => (
                        <button
                          key={specialty}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input blur
                            handleSpecialtySelect(specialty);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                        >
                          <Stethoscope className="h-3 w-3" />
                          {specialty}
                        </button>
                      ))}
                    </div>
                  )}
                  </div>
                  {getFieldError('speciality')}
                </div>
              </div>

              <Separator />

              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contact Number */}
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber" className="text-sm font-medium flex items-center gap-2">
                      {getFieldIcon('contactNumber')}
                      Contact Number
                    </Label>
                    <Input
                      id="contactNumber"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                      placeholder="+94 XX XXX XXXX"
                      className={`h-11 ${errors.contactNumber ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
                    />
                    {getFieldError('contactNumber')}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      {getFieldIcon('email')}
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="doctor@example.com"
                      className={`h-11 ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
                    />
                    {getFieldError('email')}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Additional Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                    {getFieldIcon('description')}
                    Description & Qualifications
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional information about the doctor (qualifications, experience, certifications, etc.)"
                    rows={4}
                    className="resize-none border-gray-200 focus:border-blue-500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include qualifications, years of experience, certifications, or any other relevant information.
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
                    <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                      Active Doctor
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.isActive 
                        ? "This doctor is currently available for scheduling and appointments" 
                        : "This doctor is currently inactive and unavailable for new appointments"
                      }
                    </p>
                  </div>
                  <Badge variant={formData.isActive ? "success" : "secondary"} className="ml-2">
                    {formData.isActive ? "Active" : "Inactive"}
                  </Badge>
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
                className="flex-1 rounded-lg border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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
                        <User className="h-4 w-4 mr-2" />
                        Add Doctor
                      </>
                    )}
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