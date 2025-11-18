// src/app/dashboard/doctors/ProcedureModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { MedicalProcedure } from '@/types/doctor';
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
import { 
  Loader2, 
  FileText, 
  Stethoscope, 
  Tag, 
  CheckCircle2, 
  X,
  AlertCircle,
  Sparkles,
  BookOpen,
  Zap
} from 'lucide-react';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProcedureModalProps {
  procedure?: MedicalProcedure;
  onClose: () => void;
  onSuccess: () => void;
}

const procedureCategories = [
  { value: 'diagnostic_services', label: 'Diagnostic Services', icon: '🔍', color: 'blue' },
  { value: 'Surgical_services', label: 'Surgical Services', icon: '⚕️', color: 'red' },
  { value: 'pediatrics', label: 'Pediatrics', icon: '🩺', color: 'green' },
  { value: 'obstetrics', label: 'Obstetrics & Gynecology (VOG)', icon: '🐣', color: 'purple' },
  { value: 'Eye Care', label: 'Eye Care (Ophthalmology)', icon: '👀', color: 'orange' },
  { value: 'cardiology', label: 'Cardiology', icon: '🫀', color: 'pink' },
  { value: 'ent', label: 'ENT (Ear, Nose & Throat)', icon: '👂🏻👃🏻👅', color: 'teal' },
  { value: 'dermatology', label: 'Dermatology', icon: '💆🏻‍♀️🧴✨', color: 'teal' },
  { value: 'psychiatry', label: 'Psychiatry & Mental Health', icon: '👩🏻‍⚕️', color: 'teal' },
  { value: 'urology', label: 'Urology', icon: '⚕️', color: 'teal' },
  { value: 'endocrinology', label: 'Endocrinology (Diabetes & Hormonal Disorders)', icon: '🩺', color: 'teal' },
  { value: 'gastroenterology', label: 'Gastroenterology', icon: '🍤', color: 'teal' },
  { value: 'hematology', label: 'Hematology / Sickle Cell Clinic (SCA)', icon: '🩸', color: 'teal' },
  { value: 'cosmetic', label: 'Cosmetic', icon: '💄', color: 'teal' },
  { value: 'consultation', label: 'Consultation', icon: '💬', color: 'teal' },
  { value: 'other', label: 'Other', icon: '➕', color: 'indigo' },
];

export default function ProcedureModal({ procedure, onClose, onSuccess }: ProcedureModalProps) {
  const isEditMode = !!procedure;

  const [formData, setFormData] = useState<Omit<MedicalProcedure, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    category: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Initialize form data if editing
  useEffect(() => {
    if (procedure) {
      setFormData({
        name: procedure.name,
        description: procedure.description || '',
        category: procedure.category || ''
      });
    }
  }, [procedure]);

  // Update selected category when category changes
  useEffect(() => {
    if (formData.category) {
      const category = procedureCategories.find(cat => 
        cat.value.toLowerCase() === formData.category.toLowerCase()
      );
      setSelectedCategory(category);
    } else {
      setSelectedCategory(null);
    }
  }, [formData.category]);

  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Procedure name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Procedure name must be at least 2 characters';
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
      if (isEditMode && procedure?.id) {
        await doctorService.updateProcedure(procedure.id, formData);
        toast.success("Procedure updated successfully");
      } else {
        await doctorService.createProcedure(formData);
        toast.success("Procedure added successfully");
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error saving procedure:', error);
      toast.error(error.message || "Failed to save procedure");
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

  const handleCategorySelect = (categoryValue: string) => {
    setFormData(prev => ({ ...prev, category: categoryValue }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] rounded-xl overflow-hidden p-0 flex flex-col [&>button]:hidden">
        {/* Hidden DialogTitle for accessibility */}
        <VisuallyHidden>
          <DialogTitle>{isEditMode ? 'Edit Medical Procedure' : 'Add New Procedure'}</DialogTitle>
        </VisuallyHidden>

        {/* Custom Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 py-4 px-6 flex-shrink-0 relative">
          <div className="pr-10">
            <h2 className="text-white text-xl font-semibold flex items-center gap-2">
              {isEditMode ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Edit Medical Procedure
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Add New Procedure
                </>
              )}
            </h2>
            <p className="text-green-200 mt-1 text-sm">
              {isEditMode ? 'Update procedure information' : 'Create a new medical procedure'}
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
              
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Procedure Information</h3>
                </div>

                {/* Procedure Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Procedure Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter procedure name (e.g., Blood Test, X-Ray, Surgery)"
                    className={`h-11 ${errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
                  />
                  {getFieldError('name')}
                </div>

                {/* Category Selection */}
                <div className="space-y-3">
                  <Label htmlFor="category" className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Category
                  </Label>
                  
                  <Select
                    value={formData.category}
                    onValueChange={handleCategorySelect}
                  >
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select procedure category" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <p className="text-xs text-muted-foreground mb-2 px-2">Choose the most appropriate category</p>
                      </div>
                      {procedureCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{category.icon}</span>
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Selected Category Display */}
                  {selectedCategory && (
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{selectedCategory.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{selectedCategory.label} Procedure</p>
                          <p className="text-xs text-blue-600">
                            This procedure will be categorized under {selectedCategory.label.toLowerCase()} services
                          </p>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`ml-auto bg-${selectedCategory.color}-100 text-${selectedCategory.color}-700`}
                        >
                          {selectedCategory.label}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Description Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Detailed Description</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description & Details
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the procedure, what it involves, preparation requirements, duration, etc..."
                    rows={4}
                    className="resize-none border-gray-200 focus:border-blue-500"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>Include preparation steps</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>Mention duration</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>Add special requirements</span>
                    </div>
                  </div>
                </div>

                {/* Preview Card */}
                {(formData.name || formData.description) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      Preview
                    </h4>
                    <div className="space-y-2">
                      {formData.name && (
                        <p className="font-medium text-gray-900">{formData.name}</p>
                      )}
                      {selectedCategory && (
                        <Badge variant="outline" className="text-xs">
                          {selectedCategory.icon} {selectedCategory.label}
                        </Badge>
                      )}
                      {formData.description && (
                        <p className="text-sm text-gray-600 line-clamp-3">{formData.description}</p>
                      )}
                    </div>
                  </div>
                )}
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
                        <Sparkles className="h-4 w-4 mr-2" />
                        Add Procedure
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