// src/app/dashboard/pos/CombinedPrintButton.tsx

'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  FileText, 
  Loader2,
  CheckCircle2,
  XCircle,
  Send,
  Package
} from 'lucide-react';
import { Appointment } from '@/types/appointment';
import { Prescription } from '@/types/prescription';
import { ReferralLetter } from '@/types/referralLetter';
import { prescriptionPrintService } from '@/services/prescriptionPrintService';
import { referralLetterPrintService } from '@/services/referralLetterPrintService';
import { toast } from 'sonner';

interface CombinedPrintButtonProps {
  appointment: Appointment;
  prescription: Prescription;
  referralLetter?: ReferralLetter | null;
}

export function CombinedPrintButton({ appointment, prescription, referralLetter }: CombinedPrintButtonProps) {
  const [printingAll, setPrintingAll] = useState(false);
  const [printingPrescription, setPrintingPrescription] = useState(false);
  const [printingReferral, setPrintingReferral] = useState(false);

  const handlePrintAll = async () => {
    setPrintingAll(true);
    try {
      // Print prescription first
      const prescriptionSuccess = await prescriptionPrintService.printFullPrescription(appointment, prescription);
      
      if (prescriptionSuccess) {
        toast.success('Prescription printed successfully!', {
          description: 'Full prescription has been printed.',
          duration: 2000,
        });
      } else {
        toast.error('Failed to print prescription', {
          description: 'Please check your printer settings.',
          duration: 3000,
        });
      }

      // Wait a moment before printing referral letter
      if (referralLetter) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const referralSuccess = await referralLetterPrintService.printReferralLetter(appointment, referralLetter);
        
        if (referralSuccess) {
          toast.success('Referral letter printed successfully!', {
            description: 'All documents have been printed.',
            duration: 3000,
          });
        } else {
          toast.error('Failed to print referral letter', {
            description: 'Prescription was printed but referral letter failed.',
            duration: 3000,
          });
        }
      } else {
        toast.success('All documents printed successfully!', {
          description: 'Prescription has been printed.',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error printing all documents:', error);
      toast.error('Error printing documents', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 4000,
      });
    } finally {
      setPrintingAll(false);
    }
  };

  const handlePrintPrescriptionOnly = async () => {
    setPrintingPrescription(true);
    try {
      const success = await prescriptionPrintService.printFullPrescription(appointment, prescription);
      
      if (success) {
        toast.success('Prescription printed successfully!', {
          description: 'Full prescription has been printed.',
          duration: 3000,
        });
      } else {
        toast.error('Failed to print prescription', {
          description: 'Please check your printer settings and try again.',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error printing prescription:', error);
      toast.error('Error printing prescription', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 4000,
      });
    } finally {
      setPrintingPrescription(false);
    }
  };

  const handlePrintReferralOnly = async () => {
    if (!referralLetter) {
      toast.error('No referral letter available', {
        description: 'This appointment does not have a referral letter.',
        duration: 3000,
      });
      return;
    }

    setPrintingReferral(true);
    try {
      const success = await referralLetterPrintService.printReferralLetter(appointment, referralLetter);
      
      if (success) {
        toast.success('Referral letter printed successfully!', {
          description: `Referral letter for ${appointment.patientName} has been printed.`,
          duration: 3000,
        });
      } else {
        toast.error('Failed to print referral letter', {
          description: 'Please check your printer settings and try again.',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error printing referral letter:', error);
      toast.error('Error printing referral letter', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 4000,
      });
    } finally {
      setPrintingReferral(false);
    }
  };

  // Count medicines by type
  const inventoryMedicines = (prescription.medicines || []).filter(med => med.source === 'inventory');
  const writtenMedicines = (prescription.medicines || []).filter(med => med.source === 'written');

  return (
    <div className="flex flex-col gap-2">
      {/* Print All Documents Button */}
      <Button
        onClick={handlePrintAll}
        disabled={printingAll || printingPrescription || printingReferral}
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 text-purple-700 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
      >
        {printingAll ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Package className="h-4 w-4" />
        )}
        <span className="flex-1 text-left">
          {printingAll ? 'Printing All...' : 'Print All Documents'}
        </span>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
          {prescription.medicines?.length || 0} meds{referralLetter ? ' + Letter' : ''}
        </span>
      </Button>

      {/* Print Prescription Only Button */}
      <Button
        onClick={handlePrintPrescriptionOnly}
        disabled={printingAll || printingPrescription || printingReferral}
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
      >
        {printingPrescription ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
        <span className="flex-1 text-left">
          {printingPrescription ? 'Printing...' : 'Print Prescription Only'}
        </span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          {prescription.medicines?.length || 0} medicines
        </span>
      </Button>

      {/* Print Referral Letter Only Button */}
      {referralLetter && (
        <Button
          onClick={handlePrintReferralOnly}
          disabled={printingAll || printingPrescription || printingReferral}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300"
        >
          {printingReferral ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          <span className="flex-1 text-left">
            {printingReferral ? 'Printing...' : 'Print Referral Letter Only'}
          </span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            {referralLetter.status}
          </span>
        </Button>
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
        {referralLetter && (
          <div className="flex justify-between items-center">
            <span>Referral letter:</span>
            <span className="font-medium text-purple-600">Available</span>
          </div>
        )}
        <div className="flex justify-between items-center font-medium border-t pt-1 mt-1">
          <span>Total documents:</span>
          <span className="text-gray-800">{referralLetter ? '2' : '1'}</span>
        </div>
      </div>
    </div>
  );
}
