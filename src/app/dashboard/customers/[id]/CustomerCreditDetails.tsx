// src/app/dashboard/customers/[id]/CustomerCreditDetails.tsx
import React, { useState, useEffect } from 'react';
import { saleService } from '@/services/saleService';
import { Sale, PaymentRecord } from '@/types/sale';
import { Customer } from '@/types/customer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  DollarSign, 
  Receipt, 
  ChevronRight, 
  Wallet, 
  CreditCard, 
  Clock, 
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CustomerCreditDetailsProps {
  customer: Customer;
}

export function CustomerCreditDetails({ customer }: CustomerCreditDetailsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creditSales, setCreditSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPaymentHistoryDialog, setShowPaymentHistoryDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (customer?.id) {
      loadCustomerCreditSales();
    }
  }, [customer]);

  const loadCustomerCreditSales = async () => {
    if (!customer?.id) return;
    
    try {
      setLoading(true);
      const sales = await saleService.getCustomerCreditSales(customer.id);
      setCreditSales(sales);
    } catch (error) {
      console.error('Error loading customer credit sales:', error);
      toast({
        title: "Error",
        description: "Failed to load credit sales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentDialog = (sale: Sale) => {
    setSelectedSale(sale);
    setPaymentAmount((sale.dueAmount || 0).toString());
    setPaymentMethod('cash');
    setPaymentNotes('');
    setShowPaymentDialog(true);
  };

  const handleShowPaymentHistory = (sale: Sale) => {
    setSelectedSale(sale);
    setShowPaymentHistoryDialog(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedSale || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > (selectedSale.dueAmount || 0)) {
      toast({
        title: "Payment Too Large",
        description: `Payment cannot exceed due amount of Rs${selectedSale.dueAmount?.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      // Record the payment
      const paymentRecord: Omit<PaymentRecord, 'id'> = {
        amount,
        date: new Date(),
        paymentMethod: paymentMethod as any,
        notes: paymentNotes || undefined
      };
      
      const result = await saleService.recordPayment(selectedSale.id!, paymentRecord);
      
      // Update UI
      await loadCustomerCreditSales();
      
      // Close dialog
      setShowPaymentDialog(false);
      
      // Show success notification
      toast({
        title: result.isPaid ? "Payment Complete" : "Payment Recorded",
        description: result.isPaid 
          ? "This sale has been fully paid off!" 
          : `Remaining balance: Rs${result.newDueAmount.toFixed(2)}`,
        variant: "success",
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  // Calculate total credit amount
  const totalCreditAmount = creditSales.reduce((total, sale) => total + (sale.dueAmount || 0), 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <span className="ml-2 text-gray-500">Loading credit details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (creditSales.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Receipt className="h-5 w-5 mr-2 text-amber-500" />
            Credit History
          </CardTitle>
          <CardDescription>No outstanding credit for this customer</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">This customer doesn't have any unpaid credit sales</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Receipt className="h-5 w-5 mr-2 text-amber-500" />
            Credit History
          </CardTitle>
          <CardDescription>
            Total outstanding: <span className="font-medium text-amber-600">Rs{totalCreditAmount.toFixed(2)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {creditSales.map((sale) => (
              <div 
                key={sale.id} 
                className="border rounded-lg overflow-hidden hover:border-amber-300 transition-colors"
              >
                <div className="flex justify-between items-center p-4 bg-amber-50/50">
                  <div>
                    <div className="font-medium flex items-center">
                      Sale #{sale.id?.slice(-8)}
                      {isDueDateOverdue(sale.saleDate) && (
                        <Badge variant="destructive" className="ml-2 text-xs">Overdue</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      {new Date(sale.saleDate).toLocaleDateString()}
                      <span className="mx-1">•</span>
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      {formatDistanceToNow(new Date(sale.saleDate), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-700 font-bold">
                      Rs{(sale.dueAmount || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      of Rs{sale.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-t border-amber-100 bg-white flex justify-between items-center">
                  <div className="flex gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShowPaymentHistory(sale)}
                      className="h-8 text-gray-600"
                    >
                      View History
                    </Button>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenPaymentDialog(sale)}
                    className="h-8 bg-amber-600 hover:bg-amber-700"
                  >
                    <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                    Record Payment
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md rounded-xl overflow-hidden p-0">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 py-6 px-6">
            <DialogHeader className="text-left">
              <DialogTitle className="text-white text-xl">Record Payment</DialogTitle>
              <DialogDescription className="text-amber-200 mt-1">
                Sale #{selectedSale?.id?.slice(-8) || ''}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Due Amount:</p>
                <p className="text-xl font-bold text-amber-800">Rs{selectedSale?.dueAmount?.toFixed(2) || '0.00'}</p>
              </div>
              <Receipt className="h-10 w-10 text-amber-500" />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="paymentAmount" className="text-base">Payment Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">Rs</span>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="paymentMethod" className="text-base">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_deposit">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="paymentNotes" className="text-base">Notes (Optional)</Label>
              <Input
                id="paymentNotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any notes about this payment"
              />
            </div>
          </div>
          
          <DialogFooter className="px-6 pb-6">
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentDialog(false)}
              disabled={processingPayment}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRecordPayment}
              disabled={processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={showPaymentHistoryDialog} onOpenChange={setShowPaymentHistoryDialog}>
        <DialogContent className="sm:max-w-md rounded-xl overflow-hidden p-0">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 py-6 px-6">
            <DialogHeader className="text-left">
              <DialogTitle className="text-white text-xl">Payment History</DialogTitle>
              <DialogDescription className="text-gray-300 mt-1">
                Sale #{selectedSale?.id?.slice(-8) || ''}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-lg font-semibold">Rs{selectedSale?.totalAmount.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <p className="text-sm text-gray-500">Remaining</p>
                  <p className="text-lg font-semibold text-amber-600">Rs{selectedSale?.dueAmount?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-medium mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Payment History
                </h3>
                
                {(!selectedSale?.paymentHistory || selectedSale.paymentHistory.length === 0) ? (
                  <div className="text-center py-6 text-gray-500">
                    <Receipt className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p>No payment records yet</p>
                    {selectedSale?.initialPayment && selectedSale.initialPayment > 0 ? (
                      <p className="text-sm mt-1">Only initial payment recorded</p>
                    ) : (
                      <p className="text-sm mt-1">No payments have been made</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Initial payment (if any) */}
                    {selectedSale?.initialPayment && selectedSale.initialPayment > 0 && (
                      <div className="flex justify-between items-start bg-green-50 p-3 rounded-md border border-green-200">
                        <div>
                          <div className="font-medium text-green-700">Initial Payment</div>
                          <div className="text-xs text-gray-500">
                            {(() => {
                                try {
                                const dateObj = selectedSale.saleDate instanceof Date 
                                    ? selectedSale.saleDate 
                                    : new Date(selectedSale.saleDate);
                                
                                return isNaN(dateObj.getTime())
                                    ? "Date not available"
                                    : `${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString()}`;
                                } catch (e) {
                                return "Date format error";
                                }
                            })()}
                            </div>
                        </div>
                        <div className="text-green-700 font-semibold">Rs{selectedSale.initialPayment.toFixed(2)}</div>
                      </div>
                    )}
                    
                    {/* Subsequent payments */}
                    {selectedSale?.paymentHistory?.map((payment, index) => (
                      <div 
                        key={index} 
                        className="flex justify-between items-start p-3 rounded-md border bg-white hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-medium">Payment #{index + 1}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {/* {new Date(payment.date).toLocaleDateString()} at {new Date(payment.date).toLocaleTimeString()} */}
                            <div className="text-xs text-gray-500 mt-1">
                                {(() => {
                                    try {
                                    // Handle both Date objects and Firestore Timestamps
                                    let dateObj;
                                    if (payment.date && typeof payment.date === 'object' && 'toDate' in payment.date) {
                                        // It's a Firestore Timestamp
                                        dateObj = payment.date.toDate();
                                    } else if (payment.date instanceof Date) {
                                        // It's already a Date object
                                        dateObj = payment.date;
                                    } else if (payment.date) {
                                        // It's some other format, try to convert
                                        dateObj = new Date(payment.date);
                                    } else {
                                        // No date available
                                        return "Date not available";
                                    }
                                    
                                    // Check if the date is valid
                                    if (isNaN(dateObj.getTime())) {
                                        return "Invalid date";
                                    }
                                    
                                    // Format the date
                                    return `${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString()}`;
                                    } catch (e) {
                                    console.error("Error formatting payment date:", e);
                                    return "Date format error";
                                    }
                                })()}
                                </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Method: {formatPaymentMethod(payment.paymentMethod)}
                          </div>
                          {payment.notes && (
                            <div className="text-xs text-gray-500 mt-1 italic">
                              "{payment.notes}"
                            </div>
                          )}
                        </div>
                        <div className="font-semibold">Rs{payment.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-6 border-t bg-gray-50">
            <Button 
              onClick={() => setShowPaymentHistoryDialog(false)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function
const isDueDateOverdue = (saleDate: Date): boolean => {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return new Date(saleDate) < thirtyDaysAgo;
};

const formatPaymentMethod = (method: string): string => {
  switch (method) {
    case 'cash': return 'Cash';
    case 'card': return 'Card';
    case 'bank_deposit': return 'Bank Transfer';
    case 'credit_initial': return 'Initial Credit Payment';
    default: return method;
  }
};