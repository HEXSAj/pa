// src/app/dashboard/users/DeleteStaffDialog.tsx
'use client';

import { useState } from 'react';
import { StaffUser } from '@/types/staff';
import { Trash2, AlertTriangle, Loader2, Mail, User } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

interface DeleteStaffDialogProps {
  user: StaffUser;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export default function DeleteStaffDialog({
  user,
  onDelete,
  onClose,
  isOpen,
}: DeleteStaffDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(user.uid);
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
            <AlertDialogTitle className="text-xl text-center text-red-700">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-red-600">
              Are you sure you want to delete this user account?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        
        <div className="p-6">
          <div className="rounded-lg bg-gray-50 p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {user.displayName 
                  ? user.displayName.charAt(0).toUpperCase() 
                  : user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-medium">
                  {user.displayName || 'No Name'}
                </h3>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Mail className="h-3 w-3 mr-1" />
                  {user.email}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                User ID: {user.uid.slice(0, 10)}...
              </div>
              <Badge className={`
                ${user.role === 'admin' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'}
              `}>
                {user.role || 'staff'}
              </Badge>
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Deleting this user will immediately revoke their access to the system. They will need to be re-added to regain access.
            </p>
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
                  Delete User
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