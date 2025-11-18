// src/components/purchases/PaymentHistoryModal.tsx

import React, { useState, useEffect } from 'react';
import { purchaseService } from '@/services/purchaseService';
import { PurchaseWithDetails, PaymentRecord } from '@/types/purchase';
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, DollarSign, CreditCard, Building2, FileText } from 'lucide-react';

interface PaymentHistoryModalProps {
  purchase: PurchaseWithDetails;
  onClose: () => void;
  onAddPayment: () => void;
}

const PaymentHistoryModal = ({ purchase, onClose, onAddPayment }: PaymentHistoryModalProps) => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentHistory();
  }, [purchase.id]);

  const loadPaymentHistory = async () => {
    if (!purchase.id) return;
    
    try {
      setLoading(true);
      const history = await purchaseService.getPaymentHistory(purchase.id);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <DollarSign className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer': return <Building2 className="h-4 w-4" />;
      case 'cheque': return <FileText className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'card': return 'Card';
      case 'bank_transfer': return 'Bank Transfer';
      case 'cheque': return 'Cheque';
      default: return method;
    }
  };

  const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Payment History
          </DialogTitle>
        </DialogHeader>
 
        {/* Purchase Summary */}
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Supplier:</span>
              <p className="font-medium">{purchase.supplier?.name}</p>
            </div>
            <div>
              <span className="text-gray-600">Total Amount:</span>
              <p className="font-medium">Rs{purchase.totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-gray-600">Total Paid:</span>
              <p className="font-medium text-green-600">Rs{totalPaid.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-gray-600">Due Amount:</span>
              <p className={`font-medium ${purchase.dueAmount && purchase.dueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                Rs{(purchase.dueAmount || 0).toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">Payment Status:</span>
            <Badge variant={
              purchase.paymentStatus === 'paid' ? 'default' : 
              purchase.paymentStatus === 'partial' ? 'secondary' : 'destructive'
            }>
              {purchase.paymentStatus?.toUpperCase()}
            </Badge>
          </div>
        </div>
 
        {/* Payment History Table */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No payments recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {payment.date.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.date.toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        Rs{payment.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                        <span>{formatPaymentMethod(payment.paymentMethod)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {payment.recordedByName || payment.recordedBy || 'System'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {payment.notes || '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
 
        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          {purchase.dueAmount && purchase.dueAmount > 0 && (
            <Button onClick={onAddPayment} className="flex-1">
              <DollarSign className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
 };
 
 export default PaymentHistoryModal;