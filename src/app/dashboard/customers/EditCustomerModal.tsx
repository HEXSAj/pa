// // src/app/dashboard/customers/EditCustomerModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { customerService, CustomerExistsError } from '@/services/customerService';
import { Customer } from '@/types/customer';
import { X, User, Phone, MapPin, Loader2, CheckCircle, Percent, AlertCircle, Star } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EditCustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  name: string;
  mobile: string;
  address: string;
  discountPercentage: string; // Use string for input, will convert to number
  loyaltyPoints: string; // Add loyalty points field
};

export default function EditCustomerModal({ customer, onClose, onSuccess }: EditCustomerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: customer.name || '',
      mobile: customer.mobile || '',
      address: customer.address || '',
      discountPercentage: (customer.discountPercentage || 0).toString(),
      loyaltyPoints: (customer.loyaltyPoints || 0).toString(), // Initialize with customer's loyalty points
    },
  });

  useEffect(() => {
    // Reset form when customer changes
    reset({
      name: customer.name || '',
      mobile: customer.mobile || '',
      address: customer.address || '',
      discountPercentage: (customer.discountPercentage || 0).toString(),
      loyaltyPoints: (customer.loyaltyPoints || 0).toString(), // Update with loyalty points
    });
  }, [customer, reset]);

  const onSubmit = async (data: FormData) => {
    if (!customer.id) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      // Convert discount percentage to number
      const discountPercentage = parseFloat(data.discountPercentage) || 0;
      // Convert loyalty points to number
      const loyaltyPoints = parseFloat(data.loyaltyPoints) || 0;
      
      await customerService.update(customer.id, {
        name: data.name,
        mobile: data.mobile,
        address: data.address,
        discountPercentage: discountPercentage,
        loyaltyPoints: loyaltyPoints // Include loyalty points in update
      });
      
      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error) {
      if (error instanceof CustomerExistsError) {
        setError(error.message);
      } else {
        setError('Error updating customer. Please try again.');
        console.error('Error updating customer:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl overflow-hidden p-0">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-6 px-6">
          <DialogHeader className="text-left">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white text-xl">Edit Customer</DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-blue-200 mt-1">
              Update the customer details below.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        {submitted ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Customer Updated Successfully!</h3>
            <p className="text-gray-500 mt-1">The customer information has been updated.</p>
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
              
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  Customer Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter customer name"
                  {...register('name', { required: 'Name is required' })}
                  className={`rounded-lg ${errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'}`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center">
                    <span className="bg-red-50 p-1 rounded-full mr-1">
                      <X className="h-3 w-3" />
                    </span>
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile" className="text-sm font-medium flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  Mobile Number <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter mobile number"
                  {...register('mobile', { 
                    required: 'Mobile number is required',
                    pattern: {
                      value: /^[0-9+\s-]{7,15}$/,
                      message: 'Please enter a valid mobile number'
                    }
                  })}
                  className={`rounded-lg ${errors.mobile ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'}`}
                />
                {errors.mobile && (
                  <p className="text-xs text-red-500 mt-1 flex items-center">
                    <span className="bg-red-50 p-1 rounded-full mr-1">
                      <X className="h-3 w-3" />
                    </span>
                    {errors.mobile.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discountPercentage" className="text-sm font-medium flex items-center">
                  <Percent className="h-4 w-4 mr-2 text-gray-400" />
                  Discount (%)
                </Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Enter discount percentage"
                  {...register('discountPercentage', {
                    min: {
                      value: 0,
                      message: 'Discount cannot be negative'
                    },
                    max: {
                      value: 100,
                      message: 'Discount cannot exceed 100%'
                    }
                  })}
                  className={`rounded-lg ${errors.discountPercentage ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'}`}
                />
                {errors.discountPercentage && (
                  <p className="text-xs text-red-500 mt-1 flex items-center">
                    <span className="bg-red-50 p-1 rounded-full mr-1">
                      <X className="h-3 w-3" />
                    </span>
                    {errors.discountPercentage.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loyaltyPoints" className="text-sm font-medium flex items-center">
                  <Star className="h-4 w-4 mr-2 text-gray-400" />
                  Loyalty Points
                </Label>
                <Input
                  id="loyaltyPoints"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter loyalty points"
                  {...register('loyaltyPoints', {
                    min: {
                      value: 0,
                      message: 'Loyalty points cannot be negative'
                    }
                  })}
                  className={`rounded-lg ${errors.loyaltyPoints ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'}`}
                />
                {errors.loyaltyPoints && (
                  <p className="text-xs text-red-500 mt-1 flex items-center">
                    <span className="bg-red-50 p-1 rounded-full mr-1">
                      <X className="h-3 w-3" />
                    </span>
                    {errors.loyaltyPoints.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address" className="text-sm font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  Address
                </Label>
                <Textarea
                  id="address"
                  placeholder="Enter customer address (optional)"
                  rows={3}
                  className="rounded-lg resize-none border-gray-200 focus:ring-blue-500"
                  {...register('address')}
                />
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
                      Saving...
                    </>
                  ) : (
                    'Update Customer'
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