// src/components/purchases/CreateInstallmentModal.tsx

import React, { useState } from 'react';
import { toast } from 'sonner';
import { installmentService } from '@/services/installmentService';
import { PurchaseWithDetails } from '@/types/purchase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Loader2 } from 'lucide-react';

interface CreateInstallmentModalProps {
  purchase: PurchaseWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateInstallmentModal = ({ purchase, onClose, onSuccess }: CreateInstallmentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    installmentCount: 3,
    frequency: 'monthly' as 'weekly' | 'monthly' | 'custom',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
  });

  const remainingAmount = purchase.dueAmount || 0;
  const installmentAmount = remainingAmount / formData.installmentCount;

  // Generate preview dates
  const generatePreviewDates = () => {
    const dates: Date[] = [];
    const startDate = new Date(formData.startDate);
    
    for (let i = 0; i < formData.installmentCount; i++) {
      const date = new Date(startDate);
      if (formData.frequency === 'weekly') {
        date.setDate(startDate.getDate() + (i * 7));
      } else if (formData.frequency === 'monthly') {
        date.setMonth(startDate.getMonth() + i);
      }
      dates.push(date);
    }
    
    return dates;
  };

  const previewDates = generatePreviewDates();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (remainingAmount <= 0) {
      toast.error('No remaining amount to create installment plan');
      return;
    }

    if (formData.installmentCount < 2) {
      toast.error('Installment count must be at least 2');
      return;
    }

    setLoading(true);
    try {
      await installmentService.createInstallmentPlan(
        purchase.id!,
        formData.installmentCount,
        formData.frequency,
        new Date(formData.startDate)
      );
      
      toast.success('Installment plan created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating installment plan:', error);
      toast.error('Error creating installment plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create Installment Plan
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-6 px-6">
            {/* Purchase Info */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-3">Purchase Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Supplier:</span>
                    <p className="font-medium">{purchase.supplier?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <p className="font-medium">Rs{purchase.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Already Paid:</span>
                    <p className="font-medium text-green-600">Rs{((purchase.totalAmount || 0) - (purchase.dueAmount || 0)).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Remaining Amount:</span>
                    <p className="font-medium text-orange-600">Rs{remainingAmount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan Configuration */}
            <div className="space-y-4">
              {/* Number of Installments */}
              <div className="space-y-2">
                <Label htmlFor="installmentCount">Number of Installments *</Label>
                <Input
                  id="installmentCount"
                  type="number"
                  min="2"
                  max="24"
                  value={formData.installmentCount}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    installmentCount: parseInt(e.target.value) || 2
                  }))}
                  required
                />
                <p className="text-xs text-gray-500">
                  Each installment: Rs{installmentAmount.toFixed(2)}
                </p>
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label>Payment Frequency *</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: 'weekly' | 'monthly' | 'custom') =>
                    setFormData(prev => ({ ...prev, frequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">First Payment Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }))}
                  required
                />
              </div>
            </div>

            {/* Preview */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-3">Installment Preview</h4>
                <div className="space-y-3">
                  {previewDates.map((date, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">Payment {index + 1}:</span>
                        <span className="text-gray-600">{date.toLocaleDateString()}</span>
                        <span className="text-xs text-gray-500">
                          ({date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})
                        </span>
                      </div>
                      <Badge variant="outline">
                        Rs{(index === formData.installmentCount - 1 
                          ? remainingAmount - (installmentAmount * (formData.installmentCount - 1))
                          : installmentAmount
                        ).toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-3 border-t bg-blue-50 p-3 rounded-md">
                  <div className="flex justify-between font-medium">
                    <span>Total Amount to be Paid:</span>
                    <span>Rs{remainingAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>Plan Duration:</span>
                    <span>
                      {formData.frequency === 'weekly' 
                        ? `${formData.installmentCount} weeks` 
                        : `${formData.installmentCount} months`
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <h4 className="font-medium text-orange-800 mb-2">Important Notes</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Installment plan will be created for the remaining due amount only</li>
                  <li>• Payment reminders will be sent before each due date</li>
                  <li>• Late payments may incur additional charges</li>
                  <li>• You can modify the plan before the first payment is made</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Form Actions - Fixed at bottom */}
          <div className="flex gap-3 p-6 border-t bg-white">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Installment Plan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInstallmentModal;