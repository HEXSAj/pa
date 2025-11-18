// src/app/dashboard/purchases/DeletePendingDialog.tsx
'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { PurchaseWithDetails } from '@/types/purchase';

interface DeletePendingDialogProps {
  purchase: PurchaseWithDetails;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeletePendingDialog({ 
  purchase, 
  open, 
  onClose, 
  onConfirm 
}: DeletePendingDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto rounded-full bg-amber-100 w-12 h-12 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <AlertDialogTitle className="text-center">Delete Purchase Draft</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Are you sure you want to delete this draft purchase? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-gray-50 rounded-lg p-4 my-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-500">Supplier</p>
              <p className="font-medium">{purchase.supplier?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Items</p>
              <p className="font-medium">{purchase.items?.length || 0} items</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created by</p>
              <p className="font-medium">{purchase.createdByName || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="font-medium">{purchase.updatedAt?.toLocaleDateString() || 'Unknown'}</p>
            </div>
            {purchase.totalAmount > 0 && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Total amount</p>
                <p className="font-medium">Rs{purchase.totalAmount.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Draft'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}