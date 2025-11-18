// src/app/dashboard/pos/PaymentMethod.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Label } from "@/components/ui/label";
import { Wallet, CreditCard, CheckCircle, Receipt } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { CreditPayment } from './CreditPayment';



interface PaymentMethodProps {
  totalAmount: number;
  onPaymentMethodChange: (method: string, bankAccountId?: string) => void;
  onCreditDetailsChange?: (initialPayment: number, dueAmount: number) => void;
  onPressEnter?: () => void; // Add callback for Enter key
}

export default function PaymentMethod({ 
  totalAmount, 
  onPaymentMethodChange,
  onCreditDetailsChange, 
  onPressEnter 
}: PaymentMethodProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  
  // Refs for focusing elements
  const cashRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const creditRef = useRef<HTMLButtonElement>(null);

  const disabledMethods = ['card', 'credit'];

  // Auto-focus on the first payment method option when the component mounts
  useEffect(() => {
    if (cashRef.current) {
      cashRef.current.focus();
    }
  }, []);

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    onPaymentMethodChange(method);
  };

  // Handle credit payment details change
  const handleCreditDetailsChange = (initialPayment: number, dueAmount: number) => {
    if (onCreditDetailsChange) {
      onCreditDetailsChange(initialPayment, dueAmount);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        if (paymentMethod === 'cash') {
          handlePaymentMethodChange('card');
          cardRef.current?.focus();
        } else if (paymentMethod === 'card') {
          handlePaymentMethodChange('credit');
          creditRef.current?.focus();
        }
        break;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        if (paymentMethod === 'credit') {
          handlePaymentMethodChange('card');
          cardRef.current?.focus();
        } else if (paymentMethod === 'card') {
          handlePaymentMethodChange('cash');
          cashRef.current?.focus();
        }
        break;
        
      case 'Enter':
        if (onPressEnter) {
          e.preventDefault();
          onPressEnter();
        }
        break;
    }
  };

  // Icons for payment methods
  const PaymentMethodIcon = {
    cash: Wallet,
    card: CreditCard,
    credit: Receipt
  };

  return (
    // Limit the height and make content scrollable
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1" onKeyDown={handleKeyDown}>
      <Label className="flex items-center text-lg font-medium sticky top-0 bg-white pb-2 z-10">
        <span>Payment Method</span>
        <Badge variant="outline" className="ml-2 text-xs font-normal">Use arrow keys to navigate</Badge>
      </Label>
      
   
    <div className="grid grid-cols-3 gap-3">
      {Object.entries(PaymentMethodIcon).map(([method, Icon]) => {
        const isSelected = paymentMethod === method;
        const isDisabled = disabledMethods.includes(method);
        let ref;
        if (method === 'cash') ref = cashRef;
        else if (method === 'card') ref = cardRef;
        else if (method === 'credit') ref = creditRef;
        
        return (
          <div 
            key={method}
            className={`
              relative p-4 border rounded-lg transition-all
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isSelected && !isDisabled 
                ? 'bg-primary/10 border-primary ring-1 ring-primary/50 shadow-sm' 
                : 'bg-white border-gray-200'}
              ${!isDisabled && 'hover:bg-gray-50'}
            `}
            onClick={() => !isDisabled && handlePaymentMethodChange(method)}
            ref={ref as React.RefObject<HTMLDivElement>}
            tabIndex={isDisabled ? -1 : 0}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className={`p-3 rounded-full ${
                isSelected && !isDisabled ? 'bg-primary/20' : 'bg-gray-100'
              }`}>
                <Icon className={`h-6 w-6 ${
                  isSelected && !isDisabled ? 'text-primary' : 'text-gray-600'
                }`} />
              </div>
              <span className={`font-medium ${
                isSelected && !isDisabled ? 'text-primary' : 'text-gray-700'
              }`}>
                {method === 'cash' ? 'Cash' : 
                method === 'card' ? 'Card (Disabled)' : 
                'Credit (Disabled)'}
              </span>
              {isSelected && !isDisabled && (
                <Badge variant="secondary" className="absolute -top-2 -right-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              )}
            </div>
            <input 
              type="radio" 
              name="payment-method" 
              value={method}
              className="sr-only"
              checked={isSelected}
              onChange={() => !isDisabled && handlePaymentMethodChange(method)}
              disabled={isDisabled}
            />
          </div>
        );
      })}
      </div>
      
      {/* Show additional options based on selected payment method */}
      <AnimatePresence mode="wait">
        {paymentMethod === 'credit' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CreditPayment 
              totalAmount={totalAmount} 
              onCreditDetailsChange={handleCreditDetailsChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Display the total amount prominently */}
      {paymentMethod !== 'credit' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <div className="text-sm text-gray-500 mb-1">Payment Total:</div>
          <div className="text-2xl font-bold text-primary">Rs{totalAmount.toFixed(2)}</div>
        </div>
      )}
      
     
    </div>
  );
}