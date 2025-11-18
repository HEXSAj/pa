// //src/app/dashboard/patients/EditPatientModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { Patient } from '@/types/appointment';
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

interface EditPatientModalProps {
  patient: Patient;
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

export default function EditPatientModal({ patient, onClose, onSuccess }: EditPatientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
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
    if (!dob) return { years: 0, months: 0 };
    
    const birthDate = new Date(dob);
    const today = new Date();
    
    // Check if the date is valid
    if (isNaN(birthDate.getTime())) {
      console.error('Invalid date of birth:', dob);
      return { years: 0, months: 0 };
    }
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // If the day hasn't occurred yet this month, subtract a month
    if (today.getDate() < birthDate.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }
    
    console.log('Age calculation:', { dob, years, months });
    return { years, months };
  };

  useEffect(() => {
    console.log('Patient data received:', patient);
    console.log('Patient dateOfBirth:', patient.dateOfBirth);
    
    // Reset form with patient data
    const formData = {
      name: patient.name || '',
      contactNumber: patient.contactNumber || '',
      email: patient.email || '',
      dateOfBirth: patient.dateOfBirth || '',
      gender: patient.gender || '',
      bodyWeight: patient.bodyWeight ? patient.bodyWeight.toString() : '',
      drugAllergies: patient.drugAllergies || '',
    };
    
    console.log('Form data being set:', formData);
    
    // Reset the form with new data
    reset(formData);
    
    // Increment form key to force re-render
    setFormKey(prev => prev + 1);
  }, [patient, reset]);

  // Additional effect to ensure form is updated when patient changes
  useEffect(() => {
    if (patient.id) {
      console.log('Setting individual form values for patient:', patient.id);
      console.log('Patient dateOfBirth for setValue:', patient.dateOfBirth);
      setValue('name', patient.name || '');
      setValue('contactNumber', patient.contactNumber || '');
      setValue('email', patient.email || '');
      setValue('dateOfBirth', patient.dateOfBirth || '');
      setValue('gender', patient.gender || '');
      setValue('bodyWeight', patient.bodyWeight ? patient.bodyWeight.toString() : '');
      setValue('drugAllergies', patient.drugAllergies || '');
    }
  }, [patient, setValue]);

  // Specific effect for date of birth
  useEffect(() => {
    if (patient.dateOfBirth) {
      console.log('Setting date of birth specifically:', patient.dateOfBirth);
      setValue('dateOfBirth', patient.dateOfBirth);
    }
  }, [patient.dateOfBirth, setValue]);

 


  const onSubmit = async (data: FormData) => {
    if (!patient.id) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
  
      // Check if contact number changed or if name/DOB changed
      const contactChanged = data.contactNumber !== patient.contactNumber;
      const nameChanged = data.name.trim() !== patient.name;
      const dobChanged = data.dateOfBirth !== patient.dateOfBirth;
  
      if (contactChanged || nameChanged || dobChanged) {
        // Check for duplicate name-DOB combination for this contact number
        const isDuplicate = await appointmentService.checkDuplicatePatientNameDOB(
          data.contactNumber,
          data.name,
          data.dateOfBirth || undefined,
          patient.id // Exclude current patient
        );
        
        if (isDuplicate) {
          setError('A patient with this contact number, name, and date of birth already exists.');
          return;
        }
      }
  
      // Prepare update data, converting empty strings to undefined
      const updateData = {
        name: data.name.trim(),
        contactNumber: data.contactNumber.trim(),
        email: data.email.trim() || undefined,
        dateOfBirth: data.dateOfBirth.trim() || undefined,
        age: data.dateOfBirth ? calculateAge(data.dateOfBirth).years : undefined, // Calculate age from DOB
        gender: data.gender || undefined,
        bodyWeight: data.bodyWeight ? parseFloat(data.bodyWeight) : undefined,
        drugAllergies: data.drugAllergies.trim() || undefined,
      };

      console.log('Form data received:', data);
      console.log('Update data being sent:', updateData);
      console.log('Date of birth from form:', data.dateOfBirth);
      console.log('Calculated age:', data.dateOfBirth ? calculateAge(data.dateOfBirth).years : 'No DOB');

      await appointmentService.updatePatient(patient.id, updateData);
  
      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error) {
      setError('Error updating patient. Please try again.');
      console.error('Error updating patient:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] rounded-xl overflow-hidden p-0 flex flex-col [&>button]:hidden">
        <VisuallyHidden>
          <DialogTitle>Edit Patient</DialogTitle>
        </VisuallyHidden>

        {/* Custom Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6 flex-shrink-0 relative">
          <div className="pr-10">
            <h2 className="text-white text-xl font-semibold">Edit Patient</h2>
            <p className="text-blue-200 mt-1 text-sm">
              Update patient information.
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
              <h3 className="text-lg font-semibold text-green-800 mb-2">Patient Updated Successfully!</h3>
              <p className="text-green-600">The patient information has been updated.</p>
            </div>
          ) : (
            <form key={`${patient.id}-${formKey}`} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  <div className="text-xs text-gray-500">
                    Current value: {dateOfBirthValue || 'No date selected'}
                  </div>
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
                      Updating...
                    </div>
                  ) : (
                    'Update Patient'
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