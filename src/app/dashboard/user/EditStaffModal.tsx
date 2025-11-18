// src/app/dashboard/users/EditStaffModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { staffService } from '@/services/staffService';
import { StaffUser } from '@/types/staff';
import { X, User, Loader2, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface EditStaffModalProps {
  user: StaffUser;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  displayName: string;
  role: string;
};

export default function EditStaffModal({ user, onClose, onSuccess }: EditStaffModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      displayName: user.displayName || '',
      role: user.role || 'cashier',
    },
  });

  // Reset form when user changes
  useEffect(() => {
    reset({
      displayName: user.displayName || '',
      role: user.role || 'cashier',
    });
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await staffService.updateStaff(user.uid, {
        displayName: data.displayName,
        role: data.role as 'admin' | 'pharmacy' | 'cashier' | 'doctor'
      });
      
      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error updating user. Please try again.');
        console.error('Error updating user:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl overflow-hidden p-0">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-6 px-6">
          <DialogHeader className="text-left">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white text-xl">Edit Staff User</DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-indigo-200 mt-1">
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
        </div>
        
        {submitted ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">User Updated Successfully!</h3>
            <p className="text-gray-500 mt-1">The user information has been updated.</p>
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
              
              <div className="flex gap-3 items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {user.displayName 
                    ? user.displayName.charAt(0).toUpperCase() 
                    : user.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-gray-500">User ID: {user.uid.slice(0, 8)}...</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>
              
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
              
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-sm font-medium flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-2 text-gray-400" />
                  Role <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select 
                  defaultValue={user.role}
                  onValueChange={(value) => setValue('role', value)}
                >
                  <SelectTrigger className="rounded-lg border-gray-200 focus:ring-indigo-500">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="pharmacy">Pharmacy Staff</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Administrators have full access to all system features.
                </p>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-600 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Note:</p>
                  <p>To change the user's password, use the "Reset Password" option from the staff list.</p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="px-0 pb-6 mt-2">
              <div className="flex gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg border-gray-200"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Update User'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}