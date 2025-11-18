// src/app/dashboard/users/AddStaffWithDoctorModal.tsx

'use client';

import { useState } from 'react';
import { staffService, StaffExistsError } from '@/services/staffService';
import { doctorService } from '@/services/doctorService';
import { X, User, Mail, Lock, Loader2, CheckCircle, ShieldCheck, AlertCircle, Stethoscope } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import DoctorModal from '../doctors/DoctorModal';
import { Doctor } from '@/types/doctor';

interface AddStaffWithDoctorModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type StaffFormData = {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  adminPassword: string;
};

export default function AddStaffWithDoctorModal({ onClose, onSuccess }: AddStaffWithDoctorModalProps) {
  const { user, reAuthenticateAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Doctor creation workflow states
  const [showDoctorPrompt, setShowDoctorPrompt] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [createdDoctorId, setCreatedDoctorId] = useState<string | null>(null);
  const [currentStaffData, setCurrentStaffData] = useState<StaffFormData | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('cashier');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StaffFormData>({
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'cashier',
      adminPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: StaffFormData) => {
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!data.adminPassword) {
      setError('Admin password is required to create new users');
      return;
    }

    // If role is doctor, ask about creating channeling doctor
    if (data.role === 'doctor') {
      setCurrentStaffData(data);
      setShowDoctorPrompt(true);
      return;
    }

    // For non-doctor roles, proceed with normal staff creation
    await createStaffUser(data);
  };

  const createStaffUser = async (data: StaffFormData, doctorId?: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Store admin email for re-authentication
      const adminEmail = user?.email;
      if (!adminEmail) {
        throw new Error('Admin user not found');
      }
      
      // Create the staff user
      await staffService.createStaff({
        displayName: data.displayName,
        email: data.email,
        password: data.password,
        role: data.role as 'admin' | 'pharmacy' | 'cashier' | 'doctor',
        doctorId: doctorId // Include doctorId if provided
      });
      
      // Re-authenticate the admin user to maintain session
      await reAuthenticateAdmin(adminEmail, data.adminPassword);
      
      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      if (error instanceof StaffExistsError) {
        setError(error.message);
      } else if (error instanceof Error) {
        if (error.message.includes('auth/wrong-password') || error.message.includes('auth/invalid-credential')) {
          setError('Incorrect admin password. Please try again.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Error creating staff user. Please try again.');
        console.error('Error creating staff user:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDoctorPromptYes = () => {
    setShowDoctorPrompt(false);
    setShowDoctorModal(true);
  };

  const handleDoctorPromptNo = async () => {
    setShowDoctorPrompt(false);
    if (currentStaffData) {
      await createStaffUser(currentStaffData);
    }
  };

  const handleDoctorModalSuccess = async (doctorId: string) => {
    setShowDoctorModal(false);
    setCreatedDoctorId(doctorId);
    
    if (currentStaffData) {
      await createStaffUser(currentStaffData, doctorId);
    }
  };

  const handleDoctorModalClose = async () => {
    setShowDoctorModal(false);
    
    // Ask if they want to proceed without creating channeling doctor
    if (currentStaffData) {
      await createStaffUser(currentStaffData);
    }
  };

  // Prepare initial doctor data from staff form
  const getInitialDoctorData = (): Partial<Doctor> => {
    if (!currentStaffData) return {};
    
    return {
      name: currentStaffData.displayName,
      speciality: '', // Will be filled in doctor modal
      email: currentStaffData.email,
      isActive: true
    };
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-xl p-0">
          {/* Fixed Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-6 px-6 flex-shrink-0">
            <DialogHeader className="text-left">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-white text-xl">Add New Staff User</DialogTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full text-white hover:bg-white/20">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <DialogDescription className="text-indigo-200 mt-1">
                Create a new user account with staff permissions
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {submitted ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="rounded-full bg-green-100 p-3 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">User Created Successfully!</h3>
                <div className="text-center mt-2">
                  <p className="text-gray-500">The staff account has been created and is ready to use.</p>
                  {createdDoctorId && (
                    <p className="text-green-600 text-sm mt-1">
                      ✓ Channeling doctor profile was also created and linked
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="px-6">
                <div className="grid gap-6 py-6">
                  {error && (
                    <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Full Name Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="displayName" className="text-sm font-medium flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      Full Name <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="displayName"
                      placeholder="Enter staff name"
                      {...register('displayName', { required: 'Name is required' })}
                      className={`rounded-lg ${errors.displayName ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500'}`}
                    />
                    {errors.displayName && (
                      <p className="text-xs text-red-500 mt-1 flex items-center">
                        <span className="bg-red-50 p-1 rounded-full mr-1">
                          <X className="h-3 w-3" />
                        </span>
                        {errors.displayName.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Email Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      Email Address <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Please enter a valid email address'
                        }
                      })}
                      className={`rounded-lg ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500'}`}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1 flex items-center">
                        <span className="bg-red-50 p-1 rounded-full mr-1">
                          <X className="h-3 w-3" />
                        </span>
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div className="grid gap-2">
                    <Label htmlFor="role" className="text-sm font-medium flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-2 text-gray-400" />
                      Role <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select 
                      value={selectedRole}
                      onValueChange={(value) => {
                        setSelectedRole(value);
                        setValue('role', value);
                      }}
                    >
                      <SelectTrigger className="rounded-lg border-gray-200 focus:ring-indigo-500">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="pharmacy">Pharmacy Staff</SelectItem>
                        <SelectItem value="cashier">Cashier</SelectItem>
                        <SelectItem value="doctor">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            Doctor
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {selectedRole === 'doctor' && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-blue-700">
                          <Stethoscope className="h-4 w-4" />
                          <span className="text-sm font-medium">Doctor Role Selected</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          After creating the staff account, you'll be asked if you want to create a channeling doctor profile for appointments and procedures.
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-1">
                      Administrators have full access to all system features.
                    </p>
                  </div>
                  
                  {/* Password Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-sm font-medium flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-gray-400" />
                      Password <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      {...register('password', { 
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                      className={`rounded-lg ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500'}`}
                    />
                    {errors.password && (
                      <p className="text-xs text-red-500 mt-1 flex items-center">
                        <span className="bg-red-50 p-1 rounded-full mr-1">
                          <X className="h-3 w-3" />
                        </span>
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Confirm Password Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-gray-400" />
                      Confirm Password <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      {...register('confirmPassword', { 
                        required: 'Please confirm password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                      className={`rounded-lg ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500'}`}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1 flex items-center">
                        <span className="bg-red-50 p-1 rounded-full mr-1">
                          <X className="h-3 w-3" />
                        </span>
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Admin Password Field */}
                  <div className="grid gap-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Label htmlFor="adminPassword" className="text-sm font-medium flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-2 text-yellow-600" />
                      Your Admin Password <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="Enter your current password"
                      {...register('adminPassword', { 
                        required: 'Admin password is required to create new users'
                      })}
                      className={`rounded-lg ${errors.adminPassword ? 'border-red-300 focus:ring-red-500' : 'border-yellow-300 focus:ring-yellow-500'}`}
                    />
                    {errors.adminPassword && (
                      <p className="text-xs text-red-500 mt-1 flex items-center">
                        <span className="bg-red-50 p-1 rounded-full mr-1">
                          <X className="h-3 w-3" />
                        </span>
                        {errors.adminPassword.message}
                      </p>
                    )}
                    <p className="text-xs text-yellow-700 mt-1">
                      Required to maintain your admin session after creating the new user.
                    </p>
                  </div>
                </div>
              </form>
            )}
          </div>
          
          {/* Fixed Footer */}
          {!submitted && (
            <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-white">
              <DialogFooter className="flex gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg border-gray-200"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting} 
                  className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Creating...
                    </>
                  ) : (
                    selectedRole === 'doctor' ? 'Continue' : 'Create User'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Doctor Creation Prompt */}
      <AlertDialog open={showDoctorPrompt} onOpenChange={setShowDoctorPrompt}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg">Create Channeling Doctor?</AlertDialogTitle>
              </div>
            </div>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              You've selected "Doctor" as the role. Would you like to create a channeling doctor profile for{' '}
              <span className="font-medium text-gray-900">{currentStaffData?.displayName}</span>?
            </p>
            
            <div className="text-gray-600">
              <p className="font-medium mb-2">This will allow them to:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Accept patient appointments</li>
                <li>Have procedures assigned to them</li>
                <li>Set their availability schedule</li>
                <li>Manage consultation fees</li>
              </ul>
            </div>
          </div>
          
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <AlertDialogCancel 
              onClick={handleDoctorPromptNo}
              className="w-full sm:w-auto"
            >
              Skip - Create Staff Only
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDoctorPromptYes}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              Yes, Create Doctor Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Doctor Modal */}
      {showDoctorModal && currentStaffData && (
        <DoctorModal
          doctor={getInitialDoctorData()}
          onClose={handleDoctorModalClose}
          onSuccess={(doctorId) => handleDoctorModalSuccess(doctorId)}
        />
      )}
    </>
  );
}