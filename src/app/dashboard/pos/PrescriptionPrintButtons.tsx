// src/app/dashboard/pos/PrescriptionPrintButtons.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  FileText, 
  Loader2,
  CheckCircle2,
  XCircle,
  Send
} from 'lucide-react';
import { Appointment } from '@/types/appointment';
import { Prescription } from '@/types/prescription';
import { prescriptionPrintService } from '@/services/prescriptionPrintService';
import { referralLetterService } from '@/services/referralLetterService';
import { ReferralLetter } from '@/types/referralLetter';
import { ReferralLetterPrintButton } from './ReferralLetterPrintButton';
import { toast } from 'sonner';

interface PrescriptionPrintButtonsProps {
  appointment: Appointment;
  prescription: Prescription;
}

export function PrescriptionPrintButtons({ appointment, prescription }: PrescriptionPrintButtonsProps) {
  const [printingFull, setPrintingFull] = useState(false);
  const [printingWritten, setPrintingWritten] = useState(false);
  const [referralLetter, setReferralLetter] = useState<ReferralLetter | null>(null);
  const [loadingReferralLetter, setLoadingReferralLetter] = useState(false);

  // Load referral letter if prescription has one
  useEffect(() => {
    const loadReferralLetter = async () => {
      if (prescription.referralLetterId) {
        setLoadingReferralLetter(true);
        try {
          const letter = await referralLetterService.getById(prescription.referralLetterId);
          setReferralLetter(letter);
        } catch (error) {
          console.error('Error loading referral letter:', error);
          toast.error('Failed to load referral letter');
        } finally {
          setLoadingReferralLetter(false);
        }
      }
    };

    loadReferralLetter();
  }, [prescription.referralLetterId]);

  const handlePrintFullPrescription = async () => {
    setPrintingFull(true);
    try {
      const success = await prescriptionPrintService.printFullPrescription(appointment, prescription);
      
      if (success) {
        toast.success('Full prescription printed successfully!', {
          description: 'All medicines (inventory and written) have been printed.',
          duration: 3000,
        });
      } else {
        toast.error('Failed to print full prescription', {
          description: 'Please check your printer settings and try again.',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error printing full prescription:', error);
      toast.error('Error printing full prescription', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 4000,
      });
    } finally {
      setPrintingFull(false);
    }
  };

  const handlePrintWrittenMedicines = async () => {
    setPrintingWritten(true);
    try {
      const success = await prescriptionPrintService.printWrittenMedicinesOnly(appointment, prescription);
      
      if (success) {
        toast.success('Written medicines prescription printed successfully!', {
          description: 'Only written medicines have been printed.',
          duration: 3000,
        });
      } else {
        toast.error('Failed to print written medicines', {
          description: 'Please check your printer settings and try again.',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error printing written medicines:', error);
      toast.error('Error printing written medicines', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 4000,
      });
    } finally {
      setPrintingWritten(false);
    }
  };

  // Count medicines by type
  const inventoryMedicines = (prescription.medicines || []).filter(med => med.source === 'inventory');
  const writtenMedicines = (prescription.medicines || []).filter(med => med.source === 'written');

  return (
    <div className="flex flex-col gap-2">
      {/* Full Prescription Print Button */}
      <Button
        onClick={handlePrintFullPrescription}
        disabled={printingFull}
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
      >
        {printingFull ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        <span className="flex-1 text-left">
          {printingFull ? 'Printing...' : 'Print Full Prescription'}
        </span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          {prescription.medicines?.length || 0} medicines
        </span>
      </Button>

      {/* Written Medicines Only Print Button */}
      {writtenMedicines.length > 0 && (
        <Button
          onClick={handlePrintWrittenMedicines}
          disabled={printingWritten}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300"
        >
          {printingWritten ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          <span className="flex-1 text-left">
            {printingWritten ? 'Printing...' : 'Print Written Medicines Only'}
          </span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            {writtenMedicines.length} written
          </span>
        </Button>
      )}

      {/* Referral Letter Print Button */}
      {prescription.referralLetterId && (
        <div className="mt-2">
          {loadingReferralLetter ? (
            <Button
              disabled
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-gray-500"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="flex-1 text-left">Loading referral letter...</span>
            </Button>
          ) : referralLetter ? (
            <ReferralLetterPrintButton
              appointment={appointment}
              referralLetter={referralLetter}
            />
          ) : (
            <Button
              disabled
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-red-500"
            >
              <XCircle className="h-4 w-4" />
              <span className="flex-1 text-left">Referral letter not found</span>
            </Button>
          )}
        </div>
      )}

      {/* Medicine Summary */}
      <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <span>Inventory medicines:</span>
          <span className="font-medium text-blue-600">{inventoryMedicines.length}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Written medicines:</span>
          <span className="font-medium text-green-600">{writtenMedicines.length}</span>
        </div>
        {prescription.medicalTests && prescription.medicalTests.length > 0 && (
          <div className="flex justify-between items-center">
            <span>Medical tests:</span>
            <span className="font-medium text-orange-600">{prescription.medicalTests.length}</span>
          </div>
        )}
        {prescription.nextVisitDate && (
          <div className="flex justify-between items-center">
            <span>Next visit:</span>
            <span className="font-medium text-green-600">
              {new Date(prescription.nextVisitDate).toLocaleDateString()}
            </span>
          </div>
        )}
        {prescription.referralLetterId && (
          <div className="flex justify-between items-center">
            <span>Referral letter:</span>
            <span className="font-medium text-purple-600">
              {loadingReferralLetter ? 'Loading...' : referralLetter ? 'Available' : 'Not found'}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center font-medium border-t pt-1 mt-1">
          <span>Total medicines:</span>
          <span className="text-gray-800">{prescription.medicines?.length || 0}</span>
        </div>
      </div>
    </div>
  );
}
