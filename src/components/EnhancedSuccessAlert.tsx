import React from 'react';
import { CheckCircle2, X, Printer, MessageSquare } from 'lucide-react';

interface EnhancedAlertProps {
  message: string;
  onClose: () => void;
}

const EnhancedSuccessAlert = ({ message, onClose }: EnhancedAlertProps) => (
  <div className="fixed top-4 right-4 z-50 animate-in fade-in zoom-in duration-300">
    <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[320px]">
      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">Success</h3>
        <p className="text-gray-600">{message}</p>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MessageSquare className="h-4 w-4" />
            SMS Sent
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Printer className="h-4 w-4" />
            Receipt Printed
          </div>
        </div>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
);

export default EnhancedSuccessAlert;