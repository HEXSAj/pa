// src/app/dashboard/pos/DiscountButton.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Percent, Tag, X, Badge as BadgeIcon, AlertCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

import { toast } from '@/hooks/use-toast';

interface DiscountButtonProps {
  totalAmount: number;
  currentDiscountPercentage?: number;
  onApplyDiscount: (percentage: number) => void;
  isCustomerDiscount?: boolean;
  customerName?: string;
}

export function DiscountButton({ 
  totalAmount, 
  currentDiscountPercentage = 0,
  onApplyDiscount,
  isCustomerDiscount = false,
  customerName = ''
}: DiscountButtonProps) {
  const [open, setOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [percentage, setPercentage] = useState<number>(currentDiscountPercentage || 0);
  const [amount, setAmount] = useState<number>(
    currentDiscountPercentage ? (totalAmount * currentDiscountPercentage / 100) : 0
  );
  // Add error state for validation
  const [error, setError] = useState<string>('');

  // Update local state when props change
  useEffect(() => {
    setPercentage(currentDiscountPercentage || 0);
    setAmount(currentDiscountPercentage ? (totalAmount * currentDiscountPercentage / 100) : 0);
  }, [currentDiscountPercentage, totalAmount]);

  // Quick discount options - Updated to max 5%
  const quickDiscounts = [1, 2, 3, 4, 5];

  const handleDiscountTypeChange = (value: 'percentage' | 'amount') => {
    setDiscountType(value);
    
    if (value === 'percentage') {
      // When switching to percentage, convert amount to percentage
      if (amount > 0 && totalAmount > 0) {
        const calculatedPercentage = Math.round((amount / totalAmount) * 100 * 100) / 100;
        // Cap at 5%
        setPercentage(Math.min(calculatedPercentage, 5));
        // Clear any previous errors
        setError('');
      }
    } else {
      // When switching to amount, convert percentage to amount
      // Cap at equivalent of 5%
      const maxAmount = totalAmount * 0.05;
      const calculatedAmount = Math.round((totalAmount * percentage / 100) * 100) / 100;
      setAmount(Math.min(calculatedAmount, maxAmount));
      // Clear any previous errors
      setError('');
    }
  };

  const handlePercentageChange = (value: number) => {
    // Clear any previous errors
    setError('');
    
    // Check if value exceeds 5%
    if (value > 5) {
      setError('Maximum discount allowed is 5%');
      // Cap at 5%
      value = 5;
    }
    
    // Limit to 0-5%
    const validValue = Math.min(Math.max(0, value), 5);
    setPercentage(validValue);
    
    // Update amount field for consistency
    setAmount(Math.round((totalAmount * validValue / 100) * 100) / 100);
  };

  const handleAmountChange = (value: number) => {
    // Clear any previous errors
    setError('');
    
    // Calculate what percentage this amount represents
    const percentageEquivalent = (value / totalAmount) * 100;
    
    // Check if equivalent percentage exceeds 5%
    if (percentageEquivalent > 5) {
      setError(`Maximum discount allowed is 5% (Rs${(totalAmount * 0.05).toFixed(2)})`);
      // Cap at amount equivalent to 5%
      value = totalAmount * 0.05;
    }
    
    // Limit to 0-totalAmount (additional 5% cap already handled above)
    const validValue = Math.min(Math.max(0, value), totalAmount);
    setAmount(validValue);
    
    // Update percentage field for consistency
    if (totalAmount > 0) {
      setPercentage(Math.round((validValue / totalAmount) * 100 * 100) / 100);
    }
  };

  const handleApply = () => {
    onApplyDiscount(percentage);
    setOpen(false);
  };



  const handleQuickDiscount = (discountPercentage: number) => {
    // If it's a customer discount, don't allow changes
    if (isCustomerDiscount) {
      toast({
        title: "Customer Discount",
        description: "This discount comes from the customer's profile and cannot be modified here.",
        variant: "warning",
      });
      return;
    }
    
    setPercentage(discountPercentage);
    setAmount(Math.round((totalAmount * discountPercentage / 100) * 100) / 100);
    setDiscountType('percentage');
    // Clear any errors
    setError('');
  };

  const handleRemoveDiscount = () => {
    setPercentage(0);
    setAmount(0);
    onApplyDiscount(0);
    setOpen(false);
    // Clear any errors
    setError('');
  };

  const discountAmount = (totalAmount * percentage / 100);
  const finalAmount = totalAmount - discountAmount;

  return (
    <>
      <Button 
        variant={currentDiscountPercentage > 0 ? "default" : "outline"} 
        onClick={() => setOpen(true)}
        className={`gap-2 ${currentDiscountPercentage > 0 ? "bg-green-600 hover:bg-green-700" : ""}`}
        disabled={isCustomerDiscount} // Disable if it's a customer discount
      >
        <Percent className="h-4 w-4" />
        {currentDiscountPercentage > 0 ? (
          <div className="flex items-center">
            <span>{currentDiscountPercentage}% Discount Applied</span>
            {isCustomerDiscount && customerName && (
              <Badge variant="outline" className="ml-2 bg-white/20 text-white border-white/30">
                <BadgeIcon className="h-3 w-3 mr-1" />
                {customerName}
              </Badge>
            )}
          </div>
        ) : (
          "Apply Discount"
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-lg p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">Apply Discount (Max 5%)</DialogTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setOpen(false)} 
                className="h-8 w-8 rounded-full text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {isCustomerDiscount ? (
              <div className="bg-blue-50 p-4 rounded-lg text-blue-700 flex items-start space-x-3">
                <BadgeIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Customer Discount Applied</p>
                  <p className="text-sm mt-1">
                    This {currentDiscountPercentage}% discount is automatically applied from {customerName}'s customer profile.
                    To modify it, please update the customer's discount percentage in the customer settings.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <Label>Quick Discount Options</Label>
                  <div className="flex flex-wrap gap-2">
                    {quickDiscounts.map(discount => (
                      <Button
                        key={discount}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickDiscount(discount)}
                        className={percentage === discount ? "bg-green-50 text-green-600 border-green-200" : ""}
                      >
                        {discount}%
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <RadioGroup
                    value={discountType}
                    onValueChange={(value: 'percentage' | 'amount') => handleDiscountTypeChange(value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="percentage" />
                      <Label htmlFor="percentage">Percentage (%)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="amount" id="amount" />
                      <Label htmlFor="amount">Amount (Rs)</Label>
                    </div>
                  </RadioGroup>
                  
                  {discountType === 'percentage' ? (
                    <div className="space-y-2">
                      <Label htmlFor="percentageInput">Discount Percentage (Max 5%)</Label>
                      <div className="relative">
                        <Input
                          id="percentageInput"
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={percentage || ''}
                          onChange={(e) => handlePercentageChange(parseFloat(e.target.value) || 0)}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="amountInput">Discount Amount (Max {(totalAmount * 0.05).toFixed(2)})</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">Rs</span>
                        <Input
                          id="amountInput"
                          type="number"
                          min="0"
                          max={totalAmount * 0.05}
                          step="0.01"
                          value={amount || ''}
                          onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Error message */}
                  {error && (
                    <div className="flex items-center text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {error}
                    </div>
                  )}
                </div>
              </>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Original Total:</span>
                <span>Rs{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({percentage}%):</span>
                <span>-Rs{discountAmount.toFixed(2)}</span>
              </div>
              <div className="h-px bg-gray-200 my-1"></div>
              <div className="flex justify-between font-bold">
                <span>Final Amount:</span>
                <span>Rs{finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-6 border-t bg-gray-50">
            <div className="flex gap-3 w-full">
              {!isCustomerDiscount && percentage > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleRemoveDiscount}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Discount
                </Button>
              )}
              {!isCustomerDiscount && (
                <Button onClick={handleApply} className="ml-auto bg-green-600 hover:bg-green-700">
                  <Tag className="h-4 w-4 mr-2" />
                  Apply Discount
                </Button>
              )}
              {isCustomerDiscount && (
                <Button onClick={() => setOpen(false)} className="ml-auto">
                  Close
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}