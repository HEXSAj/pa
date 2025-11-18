// src/app/dashboard/pos/LocalPatientPaymentMethodModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, CreditCard, Calculator, CheckCircle, Gift, CreditCard as CreditCardIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface PaymentDetails {
  method: 'cash' | 'card' | 'free' | 'partial' | 'credit';
  receivedAmount?: number;
  changeAmount?: number;
  cardNumber?: string;
  initialPayment?: number;
  isPartialPayment?: boolean;
  isCredit?: boolean;
}

interface LocalPatientPaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onPaymentConfirm: (paymentDetails: PaymentDetails) => void;
  processing?: boolean;
}

export const LocalPatientPaymentMethodModal: React.FC<LocalPatientPaymentMethodModalProps> = ({
  open,
  onOpenChange,
  totalAmount,
  onPaymentConfirm,
  processing = false
}) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'free' | 'partial' | 'credit'>('cash');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [initialPayment, setInitialPayment] = useState<string>('');
  
  // Card number - only last 4 digits, optional
  const [cardLastDigits, setCardLastDigits] = useState<string>(''); // Last 4 digits only
  
  // Ref for card input
  const cardInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPaymentMethod('cash');
      setReceivedAmount('');
      setCardLastDigits('');
      setIsPartialPayment(false);
      setInitialPayment('');
    }
  }, [open]);

  // Auto-focus card input when card method is selected
  useEffect(() => {
    if (paymentMethod === 'card' && cardInputRef.current) {
      setTimeout(() => {
        cardInputRef.current?.focus();
      }, 100);
    }
  }, [paymentMethod]);

  const handlePaymentMethodSelect = (method: 'cash' | 'card' | 'free' | 'partial' | 'credit') => {
    setPaymentMethod(method);
    // Reset fields when switching methods
    setReceivedAmount('');
    setCardLastDigits('');
    setIsPartialPayment(method === 'partial');
    setInitialPayment('');
  };

  const calculateChange = (): number => {
    if (paymentMethod === 'cash' && receivedAmount) {
      const received = parseFloat(receivedAmount);
      return Math.max(0, received - totalAmount);
    }
    return 0;
  };

  const calculateDueAmount = (): number => {
    if (isPartialPayment && initialPayment) {
      const initial = parseFloat(initialPayment);
      if (!isNaN(initial) && initial >= 0) {
        return Math.max(0, totalAmount - initial);
      }
    }
    return totalAmount;
  };

  // Handle card number input (only last 4 digits)
  const handleCardInput = (value: string) => {
    // Only allow digits and limit to 4 characters
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setCardLastDigits(digits);
  };

  // Get formatted card number display for receipt
  const getCardNumberForStorage = (): string | undefined => {
    if (cardLastDigits && cardLastDigits.length === 4) {
      return `****-****-****-${cardLastDigits}`;
    }
    return undefined;
  };

  const handleConfirmPayment = () => {
    if (paymentMethod === 'free') {
      const paymentDetails: PaymentDetails = {
        method: 'free'
      };
      onPaymentConfirm(paymentDetails);
      return;
    }

    if (paymentMethod === 'credit') {
      // Credit payment - whole amount as credit, no initial payment
      const paymentDetails: PaymentDetails = {
        method: 'credit',
        initialPayment: 0,
        isCredit: true,
        isPartialPayment: true
      };

      onPaymentConfirm(paymentDetails);
      return;
    }
    
    if (paymentMethod === 'partial') {
      const initial = parseFloat(initialPayment);
      
      if (!initialPayment || isNaN(initial)) {
        toast({
          title: "Invalid Amount",
          description: "Please enter the initial payment amount",
          variant: "destructive",
        });
        return;
      }

      if (initial <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Initial payment must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      if (initial >= totalAmount) {
        toast({
          title: "Invalid Amount",
          description: "Initial payment should be less than total amount for partial payment",
          variant: "destructive",
        });
        return;
      }

      const paymentDetails: PaymentDetails = {
        method: 'partial',
        initialPayment: initial,
        isPartialPayment: true
      };

      onPaymentConfirm(paymentDetails);
      return;
    }
    
    if (paymentMethod === 'cash') {
      const received = parseFloat(receivedAmount);
      
      if (!receivedAmount || isNaN(received)) {
        toast({
          title: "Invalid Amount",
          description: "Please enter the received amount",
          variant: "destructive",
        });
        return;
      }

      if (received < totalAmount) {
        toast({
          title: "Insufficient Amount",
          description: `Received amount (Rs${received.toFixed(2)}) is less than total (Rs${totalAmount.toFixed(2)})`,
          variant: "destructive",
        });
        return;
      }

      const paymentDetails: PaymentDetails = {
        method: 'cash',
        receivedAmount: received,
        changeAmount: calculateChange()
      };

      onPaymentConfirm(paymentDetails);
    } else {
      // Card payment - card number is optional, but if entered must be 4 digits
      if (cardLastDigits && cardLastDigits.length !== 4) {
        toast({
          title: "Invalid Card Number",
          description: "Please enter all 4 digits of the last digits or leave it empty",
          variant: "destructive",
        });
        return;
      }

      const paymentDetails: PaymentDetails = {
        method: 'card',
        cardNumber: getCardNumberForStorage() // Will be undefined if not entered
      };

      onPaymentConfirm(paymentDetails);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] rounded-lg p-0 overflow-hidden flex flex-col">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
          <DialogTitle className="text-xl font-bold flex items-center">
            <Wallet className="h-5 w-5 mr-2" />
            Payment Method
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Total Amount Display */}
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-3xl font-bold text-green-600">Rs {totalAmount.toFixed(2)}</p>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Select Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <Card 
                className={`cursor-pointer transition-all ${
                  paymentMethod === 'cash' 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handlePaymentMethodSelect('cash')}
              >
                <CardContent className="p-4 text-center">
                  <Wallet className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">Cash</p>
                  {paymentMethod === 'cash' && (
                    <CheckCircle className="h-4 w-4 text-blue-500 mx-auto mt-1" />
                  )}
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  paymentMethod === 'card' 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handlePaymentMethodSelect('card')}
              >
                <CardContent className="p-4 text-center">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium">Card</p>
                  {paymentMethod === 'card' && (
                    <CheckCircle className="h-4 w-4 text-blue-500 mx-auto mt-1" />
                  )}
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  paymentMethod === 'partial' 
                    ? 'ring-2 ring-orange-500 bg-orange-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handlePaymentMethodSelect('partial')}
              >
                <CardContent className="p-4 text-center">
                  <CreditCardIcon className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="font-medium">Partial</p>
                  {paymentMethod === 'partial' && (
                    <CheckCircle className="h-4 w-4 text-orange-500 mx-auto mt-1" />
                  )}
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  paymentMethod === 'credit' 
                    ? 'ring-2 ring-purple-500 bg-purple-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handlePaymentMethodSelect('credit')}
              >
                <CardContent className="p-4 text-center">
                  <CreditCardIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-medium">Credit</p>
                  {paymentMethod === 'credit' && (
                    <CheckCircle className="h-4 w-4 text-purple-500 mx-auto mt-1" />
                  )}
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  paymentMethod === 'free' 
                    ? 'ring-2 ring-green-500 bg-green-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handlePaymentMethodSelect('free')}
              >
                <CardContent className="p-4 text-center">
                  <Gift className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">Free Bill</p>
                  {paymentMethod === 'free' && (
                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Free Bill Details */}
          {paymentMethod === 'free' && (
            <div className="space-y-4">
              <div className="bg-green-50 border-2 border-green-200 p-6 rounded-lg text-center">
                <Gift className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <h3 className="text-lg font-bold text-green-800 mb-2">Free Bill Selected</h3>
                <p className="text-green-700 mb-4">
                  This will create a free bill with 100% discount
                </p>
                <div className="bg-white p-4 rounded-lg border border-green-300">
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-gray-600">Original Amount:</span>
                    <span className="text-gray-800 font-semibold">Rs {totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg mt-2">
                    <span className="text-green-600 font-semibold">Discount (100%):</span>
                    <span className="text-green-600 font-bold">-Rs {totalAmount.toFixed(2)}</span>
                  </div>
                  <hr className="my-3 border-green-200" />
                  <div className="flex justify-between items-center text-xl">
                    <span className="text-green-800 font-bold">Grand Total:</span>
                    <span className="text-green-800 font-bold text-2xl">Rs 0.00</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="receivedAmount" className="text-base font-medium">
                  Received Amount (Rs)
                </Label>
                <Input
                  id="receivedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder={`Enter amount (minimum Rs${totalAmount.toFixed(2)})`}
                  className="text-lg h-12 mt-2"
                  autoFocus
                />
              </div>

              {receivedAmount && !isNaN(parseFloat(receivedAmount)) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Change to give:</span>
                    <div className="flex items-center">
                      <Calculator className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-xl font-bold text-orange-600">
                        Rs {calculateChange().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Credit Payment Details */}
          {paymentMethod === 'credit' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border-2 border-purple-200 p-6 rounded-lg text-center">
                <CreditCardIcon className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                <h3 className="text-lg font-bold text-purple-800 mb-2">Credit Payment Selected</h3>
                <p className="text-purple-700 mb-4">
                  The entire amount will be recorded as credit. No initial payment required.
                </p>
                <div className="bg-white p-4 rounded-lg border border-purple-300">
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="text-gray-800 font-semibold">Rs {totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg mt-2">
                    <span className="text-purple-600 font-semibold">Initial Payment:</span>
                    <span className="text-purple-600 font-semibold">Rs 0.00</span>
                  </div>
                  <hr className="my-3 border-purple-200" />
                  <div className="flex justify-between items-center text-xl">
                    <span className="text-purple-800 font-bold">Due Amount:</span>
                    <span className="text-purple-800 font-bold text-2xl">Rs {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Partial Payment Details */}
          {paymentMethod === 'partial' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="initialPayment" className="text-base font-medium">
                  Initial Payment Amount (Rs)
                </Label>
                <Input
                  id="initialPayment"
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalAmount}
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                  placeholder={`Enter initial payment (max Rs${totalAmount.toFixed(2)})`}
                  className="text-lg h-12 mt-2"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the amount the patient is paying now. The remaining amount will be due.
                </p>
              </div>

              {initialPayment && !isNaN(parseFloat(initialPayment)) && (
                <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">Total Amount:</span>
                      <span className="text-gray-800 font-semibold">Rs {totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-700 font-medium">Initial Payment:</span>
                      <span className="text-orange-700 font-semibold">Rs {parseFloat(initialPayment || '0').toFixed(2)}</span>
                    </div>
                    <hr className="border-orange-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-orange-800 font-bold">Due Amount:</span>
                      <span className="text-orange-800 font-bold text-xl">Rs {calculateDueAmount().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="space-y-4">
              {/* Card Number Input - Optional, only last 4 digits */}
              <div>
                <Label htmlFor="cardLastDigits" className="text-base font-medium">
                  Card Last 4 Digits (Optional)
                </Label>
                <Input
                  id="cardLastDigits"
                  ref={cardInputRef}
                  type="text"
                  value={cardLastDigits}
                  onChange={(e) => handleCardInput(e.target.value)}
                  placeholder="Enter last 4 digits (optional)"
                  maxLength={4}
                  className="text-lg h-12 mt-2 text-center font-mono tracking-widest"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the last 4 digits of the card number for reference (optional)
                </p>
                
                {/* Display formatted card number if entered */}
                {cardLastDigits && cardLastDigits.length === 4 && (
                  <div className="bg-gray-50 p-3 rounded-lg mt-3">
                    <Label className="text-sm font-medium text-gray-600">Card Number (for receipt)</Label>
                    <div className="text-xl font-mono tracking-widest mt-1 text-center">
                      ****-****-****-{cardLastDigits}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Amount to charge:</span>
                  <span className="text-xl font-bold text-green-600">
                    Rs {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t bg-gray-50">
          <div className="flex space-x-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={
                processing || 
                (paymentMethod === 'card' && cardLastDigits && cardLastDigits.length !== 4) ||
                (paymentMethod === 'partial' && (!initialPayment || isNaN(parseFloat(initialPayment)) || parseFloat(initialPayment) <= 0 || parseFloat(initialPayment) >= totalAmount))
              }
              className={`flex-1 ${
                paymentMethod === 'free' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : paymentMethod === 'partial'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : paymentMethod === 'credit'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {processing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  {paymentMethod === 'free' ? (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Create Free Bill
                    </>
                  ) : paymentMethod === 'partial' ? (
                    <>
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      Create Partial Payment
                    </>
                  ) : paymentMethod === 'credit' ? (
                    <>
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      Create Credit Sale
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Payment
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};