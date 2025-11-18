// src/app/dashboard/pos/ForeignPatientPaymentMethodModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, CreditCard, Calculator, CheckCircle, DollarSign, Euro, Banknote ,Loader2} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ForeignPaymentDetails {
  method: 'cash' | 'card';
  // Cash payment details
  lkrCash?: number;
  usdCash?: number;
  euroCash?: number;
  receivedAmount?: number;
  balanceGiven?: number; // Always in LKR
  // Card payment details
  cardType?: 'usd' | 'euro';
  cardAmount?: number;
  totalAmount?: number;
  cardNumber?: string; // Formatted as ****-****-****-1234
}

interface ForeignPatientPaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmountUSD: number;
  onPaymentConfirm: (paymentDetails: ForeignPaymentDetails) => void;
  processing?: boolean;
  exchangeRates?: {
    usdToLkr: number;
    euroToLkr: number;
  };
}

export const ForeignPatientPaymentMethodModal: React.FC<ForeignPatientPaymentMethodModalProps> = ({
  open,
  onOpenChange,
  totalAmountUSD,
  onPaymentConfirm,
  processing = false,
  exchangeRates = { usdToLkr: 320, euroToLkr: 350 } // Default rates
}) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  
  // Cash payment states
  const [lkrCash, setLkrCash] = useState<string>('');
  const [usdCash, setUsdCash] = useState<string>('');
  const [euroCash, setEuroCash] = useState<string>('');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [balanceGiven, setBalanceGiven] = useState<string>('');
  
  // Card payment states
  const [cardType, setCardType] = useState<'usd' | 'euro'>('usd');
  const [cardAmount, setCardAmount] = useState<string>('');
  
  // Card number step-by-step entry
  const [cardStep, setCardStep] = useState<1 | 2 | 3 | 4>(1);
  const [cardPart1, setCardPart1] = useState<string>(''); // First 4 digits
  const [cardPart2, setCardPart2] = useState<string>(''); // Second 4 digits
  const [cardPart4, setCardPart4] = useState<string>(''); // Last 4 digits
  
  // Refs for card inputs
  const cardInput1Ref = useRef<HTMLInputElement>(null);
  const cardInput2Ref = useRef<HTMLInputElement>(null);
  const cardInput4Ref = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPaymentMethod('cash');
      setLkrCash('');
      setUsdCash('');
      setEuroCash('');
      setReceivedAmount('');
      setBalanceGiven('');
      setCardType('usd');
      setCardAmount(totalAmountUSD.toString());
      setCardStep(1);
      setCardPart1('');
      setCardPart2('');
      setCardPart4('');
    }
  }, [open, totalAmountUSD]);

  // Auto-focus card inputs when step changes
  useEffect(() => {
    if (paymentMethod === 'card') {
      setTimeout(() => {
        if (cardStep === 1 && cardInput1Ref.current) {
          cardInput1Ref.current.focus();
        } else if (cardStep === 2 && cardInput2Ref.current) {
          cardInput2Ref.current.focus();
        } else if (cardStep === 4 && cardInput4Ref.current) {
          cardInput4Ref.current.focus();
        }
      }, 100);
    }
  }, [cardStep, paymentMethod]);

  const handlePaymentMethodSelect = (method: 'cash' | 'card') => {
    setPaymentMethod(method);
    // Reset fields when switching methods
    setLkrCash('');
    setUsdCash('');
    setEuroCash('');
    setReceivedAmount('');
    setBalanceGiven('');
    setCardStep(1);
    setCardPart1('');
    setCardPart2('');
    setCardPart4('');
    if (method === 'card') {
      setCardAmount(totalAmountUSD.toString());
    }
  };

  const calculateTotalReceivedInLKR = (): number => {
    const lkr = parseFloat(lkrCash) || 0;
    const usd = (parseFloat(usdCash) || 0) * exchangeRates.usdToLkr;
    const euro = (parseFloat(euroCash) || 0) * exchangeRates.euroToLkr;
    return lkr + usd + euro;
  };

  const calculateBalanceInLKR = (): number => {
    const totalAmountInLKR = totalAmountUSD * exchangeRates.usdToLkr;
    const totalReceivedInLKR = calculateTotalReceivedInLKR();
    return Math.max(0, totalReceivedInLKR - totalAmountInLKR);
  };

  // Handle card number input for each step
  const handleCardInput = (value: string, step: 1 | 2 | 4) => {
    // Only allow digits and limit to 4 characters
    const digits = value.replace(/\D/g, '').slice(0, 4);
    
    if (step === 1) {
      setCardPart1(digits);
    } else if (step === 2) {
      setCardPart2(digits);
    } else if (step === 4) {
      setCardPart4(digits);
    }
  };

  // Handle Enter key press for card inputs
  const handleCardKeyPress = (e: React.KeyboardEvent, step: 1 | 2 | 4) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (step === 1 && cardPart1.length === 4) {
        setCardStep(2);
      } else if (step === 2 && cardPart2.length === 4) {
        setCardStep(3);
        // Auto-advance to step 4 after a short delay
        setTimeout(() => setCardStep(4), 500);
      } else if (step === 4 && cardPart4.length === 4) {
        // All steps completed, ready to confirm
        handleConfirmPayment();
      } else {
        toast({
          title: "Incomplete Entry",
          description: `Please enter all 4 digits for this section`,
          variant: "destructive",
        });
      }
    }
  };

  // Get formatted card number for storage (with masked third section)
  const getCardNumberForStorage = (): string => {
    return `${cardPart1}-${cardPart2}-****-${cardPart4}`;
  };

  // Get formatted card number display
  const getFormattedCardNumber = (): string => {
    const part1 = cardPart1.padEnd(4, ' ');
    const part2 = cardPart2.padEnd(4, ' ');
    const part4 = cardPart4.padEnd(4, ' ');
    return `${part1} - ${part2} - **** - ${part4}`;
  };

  const handleConfirmPayment = () => {
    if (paymentMethod === 'cash') {
      // Validate cash payment
      const totalReceivedInLKR = calculateTotalReceivedInLKR();
      const totalAmountInLKR = totalAmountUSD * exchangeRates.usdToLkr;
      
      if (totalReceivedInLKR < totalAmountInLKR) {
        toast({
          title: "Insufficient Amount",
          description: `Total received (Rs${totalReceivedInLKR.toFixed(2)}) is less than required (Rs${totalAmountInLKR.toFixed(2)})`,
          variant: "destructive",
        });
        return;
      }

      const paymentDetails: ForeignPaymentDetails = {
        method: 'cash',
        lkrCash: parseFloat(lkrCash) || 0,
        usdCash: parseFloat(usdCash) || 0,
        euroCash: parseFloat(euroCash) || 0,
        receivedAmount: totalReceivedInLKR,
        balanceGiven: parseFloat(balanceGiven) || calculateBalanceInLKR()
      };

      onPaymentConfirm(paymentDetails);
    } else {
      // Validate card payment
      if (cardPart1.length !== 4 || cardPart2.length !== 4 || cardPart4.length !== 4) {
        toast({
          title: "Incomplete Card Number",
          description: "Please enter all required card number sections",
          variant: "destructive",
        });
        return;
      }

      if (cardType === 'euro' && (!cardAmount || parseFloat(cardAmount) <= 0)) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid Euro amount",
          variant: "destructive",
        });
        return;
      }

      const paymentDetails: ForeignPaymentDetails = {
        method: 'card',
        cardType,
        cardAmount: parseFloat(cardAmount) || 0,
        totalAmount: cardType === 'usd' ? totalAmountUSD : parseFloat(cardAmount) || 0,
        cardNumber: getCardNumberForStorage()
      };

      onPaymentConfirm(paymentDetails);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-lg p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white">
          <DialogTitle className="text-xl font-bold flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Foreign Patient Payment
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Total Amount Display */}
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-3xl font-bold text-green-600">${totalAmountUSD.toFixed(2)} USD</p>
            <p className="text-sm text-gray-500">≈ Rs {(totalAmountUSD * exchangeRates.usdToLkr).toFixed(2)}</p>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Select Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <Card 
                className={`cursor-pointer transition-all ${
                  paymentMethod === 'cash' 
                    ? 'ring-2 ring-green-500 bg-green-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handlePaymentMethodSelect('cash')}
              >
                <CardContent className="p-4 text-center">
                  <Wallet className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">Cash</p>
                  {paymentMethod === 'cash' && (
                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
                  )}
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  paymentMethod === 'card' 
                    ? 'ring-2 ring-green-500 bg-green-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handlePaymentMethodSelect('card')}
              >
                <CardContent className="p-4 text-center">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium">Card</p>
                  {paymentMethod === 'card' && (
                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="lkrCash" className="text-sm font-medium flex items-center">
                    <Banknote className="h-4 w-4 mr-1" />
                    LKR Cash
                  </Label>
                  <Input
                    id="lkrCash"
                    type="number"
                    step="0.01"
                    min="0"
                    value={lkrCash}
                    onChange={(e) => setLkrCash(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="usdCash" className="text-sm font-medium flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    USD Cash
                  </Label>
                  <Input
                    id="usdCash"
                    type="number"
                    step="0.01"
                    min="0"
                    value={usdCash}
                    onChange={(e) => setUsdCash(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="euroCash" className="text-sm font-medium flex items-center">
                    <Euro className="h-4 w-4 mr-1" />
                    Euro Cash
                  </Label>
                  <Input
                    id="euroCash"
                    type="number"
                    step="0.01"
                    min="0"
                    value={euroCash}
                    onChange={(e) => setEuroCash(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Received (LKR):</span>
                  <span className="font-medium">Rs {calculateTotalReceivedInLKR().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Required (LKR):</span>
                  <span className="font-medium">Rs {(totalAmountUSD * exchangeRates.usdToLkr).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Balance to Give (LKR):</span>
                  <span className="text-orange-600">Rs {calculateBalanceInLKR().toFixed(2)}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="balanceGiven" className="text-sm font-medium">
                  Balance Given (LKR)
                </Label>
                <Input
                  id="balanceGiven"
                  type="number"
                  step="0.01"
                  min="0"
                  value={balanceGiven}
                  onChange={(e) => setBalanceGiven(e.target.value)}
                  placeholder={calculateBalanceInLKR().toFixed(2)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Card Payment Details */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              {/* Card Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Card Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Card 
                    className={`cursor-pointer transition-all ${
                      cardType === 'usd' 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => {
                      setCardType('usd');
                      setCardAmount(totalAmountUSD.toString());
                    }}
                  >
                    <CardContent className="p-3 text-center">
                      <DollarSign className="h-6 w-6 mx-auto mb-1 text-green-600" />
                      <p className="text-sm font-medium">USD Card</p>
                      {cardType === 'usd' && (
                        <CheckCircle className="h-4 w-4 text-blue-500 mx-auto mt-1" />
                      )}
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all ${
                      cardType === 'euro' 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => {
                      setCardType('euro');
                      setCardAmount('');
                    }}
                  >
                    {/* changed for LKR CARD */}
                    <CardContent className="p-3 text-center">
                      <Euro className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                      <p className="text-sm font-medium">LKR Card</p>
                      {cardType === 'euro' && (
                        <CheckCircle className="h-4 w-4 text-blue-500 mx-auto mt-1" />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Amount Input for Euro Card */}
              {cardType === 'euro' && (
                <div>
                  <Label htmlFor="cardAmount" className="text-sm font-medium">
                    LKR Amount
                  </Label>
                  <Input
                    id="cardAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    placeholder="Enter LKR amount"
                    className="mt-1"
                  />
                </div>
              )}

              {/* Card Amount Display for USD */}
              {cardType === 'usd' && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Charge Amount:</span>
                    <span className="text-lg font-bold text-blue-600">${totalAmountUSD.toFixed(2)} USD</span>
                  </div>
                </div>
              )}

              {/* Card Number Input */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Card Number</Label>
                
                {/* Progress indicator */}
                <div className="flex space-x-2 mb-4">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 h-2 rounded ${
                        step < cardStep ? 'bg-green-500' :
                        step === cardStep ? 'bg-blue-500' :
                        step === 3 ? 'bg-gray-300' : // Third section is always skipped
                        'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Card number display */}
                <div className="text-center mb-4">
                  <div className="font-mono text-lg tracking-wider bg-gray-100 p-3 rounded border">
                    {getFormattedCardNumber()}
                  </div>
                </div>

                {/* Input fields based on current step */}
                {cardStep === 1 && (
                  <div>
                    <Label htmlFor="cardPart1" className="text-sm">Enter first 4 digits</Label>
                    <Input
                      ref={cardInput1Ref}
                      id="cardPart1"
                      type="text"
                      maxLength={4}
                      value={cardPart1}
                      onChange={(e) => handleCardInput(e.target.value, 1)}
                      onKeyPress={(e) => handleCardKeyPress(e, 1)}
                      placeholder="1234"
                      className="text-center text-lg tracking-widest mt-1"
                      autoFocus
                    />
                  </div>
                )}

                {cardStep === 2 && (
                  <div>
                    <Label htmlFor="cardPart2" className="text-sm">Enter second 4 digits</Label>
                    <Input
                      ref={cardInput2Ref}
                      id="cardPart2"
                      type="text"
                      maxLength={4}
                      value={cardPart2}
                      onChange={(e) => handleCardInput(e.target.value, 2)}
                      onKeyPress={(e) => handleCardKeyPress(e, 2)}
                      placeholder="5678"
                      className="text-center text-lg tracking-widest mt-1"
                      autoFocus
                    />
                  </div>
                )}

                {cardStep === 3 && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Third section automatically masked for security</p>
                    <div className="font-mono text-lg bg-yellow-50 p-2 rounded">****</div>
                    <Button
                      variant="outline"
                      onClick={() => setCardStep(4)}
                      className="mt-2"
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {cardStep === 4 && (
                  <div>
                    <Label htmlFor="cardPart4" className="text-sm">Enter last 4 digits</Label>
                    <Input
                      ref={cardInput4Ref}
                      id="cardPart4"
                      type="text"
                      maxLength={4}
                      value={cardPart4}
                      onChange={(e) => handleCardInput(e.target.value, 4)}
                      onKeyPress={(e) => handleCardKeyPress(e, 4)}
                      placeholder="9012"
                      className="text-center text-lg tracking-widest mt-1"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-gray-50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmPayment} 
            disabled={processing}
            className="bg-green-600 hover:bg-green-700"
          >
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

