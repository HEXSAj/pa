// src/app/dashboard/users/ResetPasswordModal.tsx
'use client';

import { useState } from 'react';
import { staffService } from '@/services/staffService';
import { StaffUser } from '@/types/staff';
import { X, Lock, Loader2, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';
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

interface ResetPasswordModalProps {
  user: StaffUser;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPasswordModal({ user, onClose, onSuccess }: ResetPasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  const newPassword = watch('newPassword');

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const onSubmit = async (data: FormData) => {
    if (data.newPassword !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      await staffService.resetPassword(user.uid, data.newPassword);
      
      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error resetting password. Please try again.');
        console.error('Error resetting password:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Set both fields to the generated password
    const passwordField = document.getElementById('newPassword') as HTMLInputElement;
    const confirmField = document.getElementById('confirmPassword') as HTMLInputElement;
    
    if (passwordField && confirmField) {
      passwordField.value = password;
      confirmField.value = password;
      
      // Update react-hook-form
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
      confirmField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Show the password
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl overflow-hidden p-0">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-6 px-6">
          <DialogHeader className="text-left">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white text-xl">Reset Password</DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-blue-200 mt-1">
              Reset password for {user.displayName || user.email}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        {submitted ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Password Reset Successfully!</h3>
            <p className="text-gray-500 mt-1">The user can now log in with their new password.</p>
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
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                  {user.displayName 
                    ? user.displayName.charAt(0).toUpperCase() 
                    : user.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{user.displayName || 'No Name'}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="newPassword" className="text-sm font-medium flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-gray-400" />
                  New Password <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    {...register('newPassword', { 
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    className={`rounded-lg pr-10 ${errors.newPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'}`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center">
                    <span className="bg-red-50 p-1 rounded-full mr-1">
                      <X className="h-3 w-3" />
                    </span>
                    {errors.newPassword.message}
                  </p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-gray-400" />
                  Confirm Password <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    {...register('confirmPassword', { 
                      required: 'Please confirm password',
                      validate: value => value === newPassword || 'Passwords do not match'
                    })}
                    className={`rounded-lg pr-10 ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'}`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center">
                    <span className="bg-red-50 p-1 rounded-full mr-1">
                      <X className="h-3 w-3" />
                    </span>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={generateRandomPassword}
                className="rounded-lg border-gray-200 text-sm h-9"
              >
                Generate Strong Password
              </Button>
              
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-600 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Make sure to share the new password with the user securely.</p>
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
                <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
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