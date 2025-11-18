// src/app/dashboard/pos/CreditPayment.tsx
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, AlertCircle, DollarSign } from 'lucide-react';
import { motion } from "framer-motion";

interface CreditPaymentProps {
  totalAmount: number;
  onCreditDetailsChange: (initialPayment: number, dueAmount: number) => void;
}

export function CreditPayment({ totalAmount, onCreditDetailsChange }: CreditPaymentProps) {
  const [initialPayment, setInitialPayment] = useState<number>(0);
  const [dueAmount, setDueAmount] = useState<number>(totalAmount);
  const [error, setError] = useState<string>('');

  // Update due amount whenever initial payment or total amount changes
  useEffect(() => {
    const calculatedDue = Math.max(0, totalAmount - initialPayment);
    setDueAmount(calculatedDue);
    
    // Pass values back to parent component
    onCreditDetailsChange(initialPayment, calculatedDue);
  }, [initialPayment, totalAmount, onCreditDetailsChange]);

  const handleInitialPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    
    // Validate that initial payment cannot exceed total amount
    if (value > totalAmount) {
      setError(`Initial payment cannot exceed total amount (Rs${totalAmount.toFixed(2)})`);
      setInitialPayment(totalAmount);
      setDueAmount(0);
    } else {
      setError('');
      setInitialPayment(value);
      setDueAmount(totalAmount - value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800">Credit Payment Selected</h3>
            <p className="text-amber-700 text-sm mt-1">
              The customer will pay Rs{initialPayment.toFixed(2)} now and Rs{dueAmount.toFixed(2)} later.
              The remaining balance can be collected in installments.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="initialPayment" className="text-base">Initial Payment Amount</Label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-2.5 text-gray-500">Rs</span>
            <Input
              id="initialPayment"
              type="number"
              min="0"
              step="0.01"
              max={totalAmount}
              value={initialPayment || ''}
              onChange={handleInitialPaymentChange}
              className="pl-9"
              placeholder="Enter initial payment amount"
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
              {error}
            </p>
          )}
        </div>

        <motion.div 
          className="bg-gray-50 rounded-lg p-4 border space-y-2"
          initial={{ opacity: 0.8, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-medium">Rs{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-green-600">Initial Payment:</span>
            <span className="font-medium text-green-600">Rs{initialPayment.toFixed(2)}</span>
          </div>
          <div className="h-px bg-gray-200 my-2"></div>
          <div className="flex justify-between items-center font-bold">
            <span className="text-amber-700 flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Remaining Due:
            </span>
            <span className="text-amber-700">Rs{dueAmount.toFixed(2)}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}