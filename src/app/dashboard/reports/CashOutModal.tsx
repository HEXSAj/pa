// src/app/dashboard/reports/CashOutModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, DollarSign, Euro, Banknote } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface CashOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: 'LKR';
  availableAmount: number;
  onCashOut: (data: {amount: number, notes?: string}) => void;
}

export const CashOutModal: React.FC<CashOutModalProps> = ({
  open,
  onOpenChange,
  currency,
  availableAmount,
  onCashOut
}) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  
  const currencySymbol = 'Rs';
  const Icon = Banknote;
  
  const handleSubmit = async () => {
    const cashOutAmount = parseFloat(amount);
    
    if (isNaN(cashOutAmount) || cashOutAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    if (cashOutAmount > availableAmount) {
      toast({
        title: "Insufficient Funds",
        description: `Cannot cash out more than available amount (${currencySymbol}${availableAmount.toFixed(2)})`,
        variant: "destructive",
      });
      return;
    }
    
    setProcessing(true);
    
    try {
      await onCashOut({
        amount: cashOutAmount,
        notes: notes.trim() || undefined
      });
      
      // Reset form
      setAmount('');
      setNotes('');
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setProcessing(false);
    }
  };
  
  const handleMaxAmount = () => {
    setAmount(availableAmount.toString());
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Icon className="h-5 w-5 mr-2" />
            Cash Out {currency}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Available Amount Display */}
          <Card className="bg-blue-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-blue-600 font-medium">Available Cash Amount</p>
                <p className="text-2xl font-bold text-blue-700">
                  {currencySymbol}{availableAmount.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Cash Out Amount Input */}
          <div>
            <Label htmlFor="cashOutAmount">Cash Out Amount</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="cashOutAmount"
                type="number"
                step="0.01"
                min="0"
                max={availableAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleMaxAmount}
                disabled={availableAmount <= 0}
              >
                Max
              </Button>
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <Label htmlFor="cashOutNotes">Notes (Optional)</Label>
            <Textarea
              id="cashOutNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this cash out..."
              rows={3}
              className="mt-1"
            />
          </div>
          
          {/* Warning */}
          {availableAmount <= 0 && (
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-700">
                No cash available for LKR to cash out.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={processing || availableAmount <= 0 || !amount}
            className="bg-red-600 hover:bg-red-700"
          >
            {processing ? "Processing..." : `Cash Out ${currencySymbol}${amount || '0.00'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};