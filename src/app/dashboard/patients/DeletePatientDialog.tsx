//src/app/dashboard/patients/DeletePatientDialog.tsx

'use client';

import { Patient } from '@/types/appointment';
import { AlertTriangle } from 'lucide-react';
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

interface DeletePatientDialogProps {
  patient: Patient;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeletePatientDialog({ patient, onConfirm, onCancel }: DeletePatientDialogProps) {
  return (
    <AlertDialog open={true} onOpenChange={() => onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Patient
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-left">
              <p>
                Are you sure you want to delete <strong>{patient.name}</strong>?
              </p>
              <br />
              <p className="text-red-600 font-medium">
                Warning: This action cannot be undone and will permanently remove all patient data.
              </p>
              <br />
              <p>Patient details:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Contact: {patient.contactNumber}</li>
                {patient.email && <li>Email: {patient.email}</li>}
                {patient.age && <li>Age: {patient.age}</li>}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Delete Patient
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}