// src/app/dashboard/referral-letters/DeleteReferralLetterDialog.tsx
'use client';

import { useState } from 'react';
import { ReferralLetter } from '@/types/referralLetter';
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
import { Loader2, User, Stethoscope } from 'lucide-react';

interface DeleteReferralLetterDialogProps {
  referralLetter: ReferralLetter;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteReferralLetterDialog({ 
  referralLetter, 
  onConfirm, 
  onCancel 
}: DeleteReferralLetterDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={true} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Referral Letter</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this referral letter?
            <br />
            <br />
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Patient:</span>
                <span>{referralLetter.patientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Referral Doctor:</span>
                <span>{referralLetter.referralDoctorName}</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Specialty:</span> {referralLetter.referralDoctorSpecialty}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Date:</span> {referralLetter.referralDate}
              </div>
            </div>
            <br />
            This action cannot be undone. This will permanently remove the referral letter
            from your system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
