// src/app/dashboard/referral-doctors/DeleteReferralDoctorDialog.tsx
'use client';

import { useState } from 'react';
import { ReferralDoctor } from '@/types/referralDoctor';
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
import { Loader2 } from 'lucide-react';

interface DeleteReferralDoctorDialogProps {
  referralDoctor: ReferralDoctor;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteReferralDoctorDialog({ 
  referralDoctor, 
  onConfirm, 
  onCancel 
}: DeleteReferralDoctorDialogProps) {
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
          <AlertDialogTitle>Delete Referral Doctor</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{referralDoctor.name}</strong>?
            <br />
            <br />
            <strong>Specialty:</strong> {referralDoctor.specialty}
            <br />
            <strong>Qualifications:</strong> {referralDoctor.qualifications}
            <br />
            {referralDoctor.hospital && (
              <>
                <strong>Hospital:</strong> {referralDoctor.hospital}
                <br />
              </>
            )}
            <br />
            This action cannot be undone. This will permanently remove the referral doctor
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
