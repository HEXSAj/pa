//src/app/dashboard/patients/AddPatientModal.tsx


'use client';

import { useState } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { X, User, Phone, Mail, Calendar, Loader2, CheckCircle, AlertCircle, Weight, Pill } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddPatientModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  name: string;
  contactNumber: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  bodyWeight: string;
  drugAllergies: string;
};

export default function AddPatientModal({ onClose, onSuccess }: AddPatientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      contactNumber: '',
      email: '',
      dateOfBirth: '',
      gender: '',
      bodyWeight: '',
      drugAllergies: '',
    },
  });

  const genderValue = watch('gender');
  const dateOfBirthValue = watch('dateOfBirth');

  // Helper function to calculate age from DOB
  const calculateAge = (dob: string): { years: number; months: number } => {
    const birthDate = new Date(dob);
    const today = new Date();
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { years, months };
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
  
      // Check if patient with same contact, name, and DOB already exists
      const isDuplicate = await appointmentService.checkDuplicatePatientNameDOB(
        data.contactNumber, 
        data.name, 
        data.dateOfBirth || undefined
      );
      
      if (isDuplicate) {
        setError('A patient with this contact number, name, and date of birth already exists.');
        return;
      }
  
      // Prepare patient data, converting empty strings to undefined
      const patientData = {
        name: data.name.trim(),
        contactNumber: data.contactNumber.trim(),
        email: data.email.trim() || undefined,
        dateOfBirth: data.dateOfBirth.trim() || undefined,
        gender: data.gender || undefined,
        bodyWeight: data.bodyWeight ? parseFloat(data.bodyWeight) : undefined,
        drugAllergies: data.drugAllergies.trim() || undefined,
      };
  
      await appointmentService.createPatient(patientData);
  
      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error) {
      setError('Error creating patient. Please try again.');
      console.error('Error creating patient:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] rounded-xl overflow-hidden p-0 flex flex-col [&>button]:hidden">
        <VisuallyHidden>
          <DialogTitle>Add New Patient</DialogTitle>
        </VisuallyHidden>

        {/* Custom Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6 flex-shrink-0 relative">
          <div className="pr-10">
            <h2 className="text-white text-xl font-semibold">Add New Patient</h2>
            <p className="text-blue-200 mt-1 text-sm">
              Register a new patient in the system.
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Patient Added Successfully!</h3>
              <p className="text-green-600">The patient has been registered in the system.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {/* Required Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Required Information
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Patient name is required' })}
                    placeholder="Enter patient's full name"
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    {...register('contactNumber', { required: 'Contact number is required' })}
                    placeholder="Enter contact number"
                    disabled={isSubmitting}
                  />
                  {errors.contactNumber && <p className="text-sm text-red-500">{errors.contactNumber.message}</p>}
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-900">
                  Optional Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter email address"
                    disabled={isSubmitting}
                  />
                </div>

             

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                    placeholder="Select date of birth"
                    disabled={isSubmitting}
                  />
                  {dateOfBirthValue && (
                    <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                      Age: {calculateAge(dateOfBirthValue).years} years, {calculateAge(dateOfBirthValue).months} months
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">

                    <Label htmlFor="gender">Gender</Label>
                    <Select value={genderValue} onValueChange={(value) => setValue('gender', value)}>
                      <SelectTrigger disabled={isSubmitting} className="h-10">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bodyWeight" className="flex items-center">
                    <Weight className="h-4 w-4 mr-2" />
                    Body Weight (kg)
                  </Label>
                  <Input
                    id="bodyWeight"
                    type="number"
                    min="0"
                    step="0.1"
                    {...register('bodyWeight')}
                    placeholder="Enter weight in kg"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drugAllergies" className="flex items-center">
                    <Pill className="h-4 w-4 mr-2" />
                    Drug Allergies
                  </Label>
                  <Textarea
                    id="drugAllergies"
                    {...register('drugAllergies')}
                    placeholder="List any known drug allergies or type 'None' if no allergies"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </div>
                  ) : (
                    'Add Patient'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}