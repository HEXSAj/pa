

// src/components/purchases/AddPaymentModal.tsx

import React, { useState } from 'react';
import { toast } from 'sonner';
import { purchaseService } from '@/services/purchaseService';
import { PurchaseWithDetails, PaymentRecord } from '@/types/purchase';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, CreditCard, Building2, FileText, Loader2, Calendar } from 'lucide-react';
import CreateInstallmentModal from './CreateInstallmentModal';

interface AddPaymentModalProps {
  purchase: PurchaseWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPaymentModal = ({ purchase, onClose, onSuccess }: AddPaymentModalProps) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: purchase.dueAmount || 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'cheque',
    notes: '',
    recordedBy: user?.displayName || user?.email?.split('@')[0] || 'Unknown User'
  });

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash', icon: DollarSign },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
    { value: 'cheque', label: 'Cheque', icon: FileText },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (formData.amount > (purchase.dueAmount || 0)) {
      toast.error(`Payment amount cannot exceed the due amount (Rs${purchase.dueAmount?.toFixed(2)})`);
      return;
    }

    setSaving(true);
    try {
      const paymentRecord: Omit<PaymentRecord, 'id' | 'createdAt'> = {
        amount: formData.amount,
        date: new Date(formData.date),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        recordedBy: user?.uid || '',
        recordedByName: formData.recordedBy
      };
      
      await purchaseService.recordPayment(purchase.id!, paymentRecord);
      toast.success('Payment recorded successfully');
      onSuccess();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Error recording payment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 px-6">
              {/* Purchase Info */}
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Supplier:</span>
                    <span className="font-medium">{purchase.supplier?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span>Rs{purchase.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>Due Amount:</span>
                    <span className="font-medium">Rs{purchase.dueAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  max={purchase.dueAmount || 0}
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0
                  }))}
                  required
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Payment Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    date: e.target.value
                  }))}
                  required
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: 'cash' | 'card' | 'bank_transfer' | 'cheque') =>
                    setFormData(prev => ({ ...prev, paymentMethod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Any additional notes about this payment..."
                  rows={3}
                />
              </div>

              {/* Recorded By */}
              <div className="space-y-2">
                <Label htmlFor="recordedBy">Recorded By</Label>
                <Input
                  id="recordedBy"
                  value={formData.recordedBy}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    recordedBy: e.target.value
                  }))}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              {/* Installment Option */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Payment Options</h4>
                    <p className="text-sm text-gray-600">Choose how to handle this payment</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInstallmentModal(true)}
                    className="gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Create Installment Plan
                  </Button>
                </div>
              </div>
            </div>

            {/* Form Actions - Fixed at bottom */}
            <div className="flex gap-3 p-6 border-t bg-white">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Installment Modal */}
      {showInstallmentModal && (
        <CreateInstallmentModal
          purchase={purchase}
          onClose={() => setShowInstallmentModal(false)}
          onSuccess={() => {
            setShowInstallmentModal(false);
            onSuccess();
          }}
        />
      )}
    </>
  );
};

export default AddPaymentModal;