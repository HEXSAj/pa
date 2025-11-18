// src/app/dashboard/pos/ReferralLetterPrintButton.tsx

'use client';

import { useState } from 'react';
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
import { ReferralLetter } from '@/types/referralLetter';
import { referralLetterPrintService } from '@/services/referralLetterPrintService';
import { toast } from 'sonner';

interface ReferralLetterPrintButtonProps {
  appointment: Appointment;
  referralLetter: ReferralLetter;
}

export function ReferralLetterPrintButton({ appointment, referralLetter }: ReferralLetterPrintButtonProps) {
  const [printing, setPrinting] = useState(false);

  const handlePrintReferralLetter = async () => {
    setPrinting(true);
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
      setPrinting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-700 border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300';
      case 'sent': return 'text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300';
      case 'received': return 'text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300';
      case 'completed': return 'text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300';
      case 'cancelled': return 'text-red-700 border-red-200 hover:bg-red-50 hover:border-red-300';
      default: return 'text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FileText className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'received': return <CheckCircle2 className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Button
      onClick={handlePrintReferralLetter}
      disabled={printing}
      variant="outline"
      size="sm"
      className={`w-full justify-start gap-2 ${getStatusColor(referralLetter.status)}`}
    >
      {printing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        getStatusIcon(referralLetter.status)
      )}
      <span className="flex-1 text-left">
        {printing ? 'Printing...' : 'Print Referral Letter'}
      </span>
      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
        {referralLetter.status}
      </span>
    </Button>
  );
}
