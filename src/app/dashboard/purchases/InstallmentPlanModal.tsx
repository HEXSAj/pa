// src/components/purchases/InstallmentPlanModal.tsx

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { installmentService } from '@/services/installmentService';
import { PurchaseWithDetails, InstallmentPlan, Installment } from '@/types/purchase';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface InstallmentPlanModalProps {
  purchase: PurchaseWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

const InstallmentPlanModal = ({ purchase, onClose, onSuccess }: InstallmentPlanModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [installmentPlan, setInstallmentPlan] = useState<InstallmentPlan | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<number | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'cheque',
    notes: ''
  });

  useEffect(() => {
    loadInstallmentPlan();
  }, [purchase.id]);

  const loadInstallmentPlan = async () => {
    if (!purchase.id) return;
    
    try {
      setLoading(true);
      const plan = await installmentService.getInstallmentPlan(purchase.id);
      setInstallmentPlan(plan);
    } catch (error) {
      console.error('Error loading installment plan:', error);
      toast.error('Error loading installment plan');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInstallment = (installment: Installment) => {
    setSelectedInstallment(installment.installmentNumber);
    setPaymentData({
      amount: installment.amount,
      paymentMethod: 'cash',
      notes: ''
    });
  };

  const confirmPayment = async () => {
    if (!selectedInstallment || !purchase.id) return;

    setPaying(true);
    try {
      await installmentService.payInstallment(
        purchase.id,
        selectedInstallment,
        paymentData.amount,
        paymentData.paymentMethod,
        paymentData.notes
      );
      
      toast.success('Payment recorded successfully');
      setSelectedInstallment(null);
      await loadInstallmentPlan();
      onSuccess();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Error recording payment. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Loading Installment Plan</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!installmentPlan) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No Installment Plan</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No installment plan found for this purchase.</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Installment Plan - {purchase.supplier?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-6">
          {/* Plan Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <p className="font-medium">Rs{installmentPlan.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Paid Amount:</span>
                  <p className="font-medium text-green-600">Rs{installmentPlan.paidAmount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Remaining:</span>
                  <p className="font-medium text-orange-600">Rs{installmentPlan.remainingAmount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(installmentPlan.status)}
                    {getStatusBadge(installmentPlan.status)}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Installments:</span>
                  <p className="font-medium">{installmentPlan.totalInstallments}</p>
                </div>
                <div>
                  <span className="text-gray-600">Frequency:</span>
                  <p className="font-medium capitalize">{installmentPlan.frequency}</p>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <p className="font-medium">{installmentPlan.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installments Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Installment</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installmentPlan.installments.map((installment) => (
                      <TableRow key={installment.installmentNumber}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(installment.status)}
                            <span className="font-medium">#{installment.installmentNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {installment.dueDate.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {installment.dueDate.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">Rs{installment.amount.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(installment.status)}
                        </TableCell>
                        <TableCell>
                          {installment.paidDate ? (
                            <div>
                              <div className="font-medium">
                                {installment.paidDate.toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {installment.paidDate.toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {installment.status !== 'paid' ? (
                            <Button
                              size="sm"
                              onClick={() => handlePayInstallment(installment)}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Pay
                            </Button>
                          ) : (
                            <span className="text-green-600 text-sm">✓ Paid</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Payment Modal */}
          {selectedInstallment !== null && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pay Installment #{selectedInstallment}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Payment Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={paymentData.amount}
                        onChange={(e) => setPaymentData(prev => ({
                          ...prev,
                          amount: parseFloat(e.target.value) || 0
                        }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Payment Method *</Label>
                      <Select 
                        value={paymentData.paymentMethod} 
                        onValueChange={(value: typeof paymentData.paymentMethod) => 
                          setPaymentData(prev => ({ ...prev, paymentMethod: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                      placeholder="Payment notes..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedInstallment(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmPayment}
                      disabled={paying || paymentData.amount <= 0}
                      className="flex-1"
                    >
                      {paying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Record Payment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="flex justify-end p-6 border-t bg-white">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallmentPlanModal;