// src/components/CashDrawerControl.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { receiptPrinterService } from '@/services/receiptPrinterService';

interface CashDrawerControlProps {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  className?: string;
}

const CashDrawerControl: React.FC<CashDrawerControlProps> = ({
  onSuccess,
  onError,
  className = ''
}) => {
  const [isOpening, setIsOpening] = useState(false);
  
  const handleOpenCashDrawer = async () => {
    setIsOpening(true);
    try {
      const success = await receiptPrinterService.openCashDrawer();
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error opening cash drawer:', error);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsOpening(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      onClick={handleOpenCashDrawer}
      disabled={isOpening}
      className={`gap-2 ${className}`}
    >
      {isOpening ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening...
        </>
      ) : (
        'Open Cash Drawer'
      )}
    </Button>
  );
};

export default CashDrawerControl;