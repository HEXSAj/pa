// src/app/dashboard/customers/DeleteCustomerDialog.tsx
'use client';

import { useState } from 'react';
import { Customer } from '@/types/customer';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
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

interface DeleteCustomerDialogProps {
  customer: Customer;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export default function DeleteCustomerDialog({
  customer,
  onDelete,
  onClose,
  isOpen,
}: DeleteCustomerDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!customer.id) return;
    
    try {
      setIsDeleting(true);
      await onDelete(customer.id);
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md rounded-xl overflow-hidden p-0">
        <div className="bg-red-50 p-6">
          <AlertDialogHeader className="text-left space-y-3">
            <div className="mx-auto rounded-full bg-red-100 w-14 h-14 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl text-center text-red-700">Delete Customer</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-red-600">
              Are you sure you want to delete <span className="font-semibold">{customer.name}</span>?
              <br />
              This action cannot be undone and will permanently remove the customer
              from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        
        <div className="p-6">
          <div className="rounded-lg bg-gray-50 p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white font-medium">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-medium">{customer.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{customer.mobile}</p>
              </div>
            </div>
            {customer.address && (
              <p className="text-xs text-gray-500 mt-3 border-t border-gray-200 pt-3">
                {customer.address}
              </p>
            )}
          </div>
          
          <AlertDialogFooter className="flex-col sm:flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 rounded-lg"
            >
              {isDeleting ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Deleting...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Customer
                </div>
              )}
            </AlertDialogAction>
            <AlertDialogCancel 
              disabled={isDeleting} 
              className="w-full sm:w-auto rounded-lg border-gray-200"
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}