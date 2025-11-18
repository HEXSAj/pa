// src/app/dashboard/due-collect/DueCollectionPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { saleService } from '@/services/saleService';
import { Sale, PaymentRecord } from '@/types/sale';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { staffService } from '@/services/staffService';
import { 
  Search, 
  X, 
  Receipt, 
  DollarSign, 
  User, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Loader2,
  CheckCircle2,
  RefreshCw,
  History,
  CreditCard
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function DueCollectionPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [salesWithDue, setSalesWithDue] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentHistoryDialog, setShowPaymentHistoryDialog] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  
  // Load all sales with due amounts
  const loadSalesWithDue = async () => {
    try {
      setLoading(true);
      const sales = await saleService.getSalesWithDueAmounts();
      setSalesWithDue(sales);
      setFilteredSales(sales);
      
      // Load user names for payment history
      const uniqueUserIds = new Set<string>();
      sales.forEach(sale => {
        if (sale.paymentHistory) {
          sale.paymentHistory.forEach((payment: any) => {
            if (payment.recordedBy) {
              uniqueUserIds.add(payment.recordedBy);
            }
          });
        }
        if (sale.createdBy?.uid) {
          uniqueUserIds.add(sale.createdBy.uid);
        }
      });
      
      // Fetch user names
      const userNamesMap: Record<string, string> = {};
      for (const userId of Array.from(uniqueUserIds)) {
        try {
          const staff = await staffService.getStaffById(userId);
          if (staff) {
            userNamesMap[userId] = staff.displayName || staff.email.split('@')[0];
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
        }
      }
      setUserNames(userNamesMap);
    } catch (error) {
      console.error('Error loading sales with due amounts:', error);
      toast({
        title: "Error",
        description: "Failed to load sales with due amounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesWithDue();
  }, []);

  // Filter sales when search query changes
  useEffect(() => {
    let filtered = salesWithDue;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = salesWithDue.filter(sale => 
        sale.customerInfo?.name?.toLowerCase().includes(query) ||
        sale.customerInfo?.mobile?.toLowerCase().includes(query) ||
        sale.id?.toLowerCase().includes(query)
      );
    }

    // Sort by due amount (highest first)
    filtered = [...filtered].sort((a, b) => 
      (b.dueAmount || 0) - (a.dueAmount || 0)
    );

    setFilteredSales(filtered);
  }, [searchQuery, salesWithDue]);

  const clearSearch = () => {
    setSearchQuery('');
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

    // Get current user name
    let recordedByName = 'Unknown User';
    if (user?.uid) {
      try {
        const staffUser = await staffService.getStaffById(user.uid);
        if (staffUser) {
          recordedByName = staffUser.displayName || staffUser.email.split('@')[0];
        } else if (user.email) {
          recordedByName = user.email.split('@')[0];
        }
      } catch (error) {
        console.log('Could not fetch staff name, using email');
        if (user.email) {
          recordedByName = user.email.split('@')[0];
        }
      }
    }
    
    setProcessingPayment(true);
    
    try {
      // Record the payment
      const paymentRecord: Omit<PaymentRecord, 'id'> = {
        amount,
        date: new Date(),
        paymentMethod: paymentMethod as any,
        notes: paymentNotes || undefined,
        recordedBy: recordedByName
      };
      
      const result = await saleService.recordPayment(selectedSale.id!, paymentRecord);
      
      // Update UI
      await loadSalesWithDue();
      
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

  // Calculate total outstanding due
  const totalOutstandingDue = filteredSales.reduce((sum, sale) => sum + (sale.dueAmount || 0), 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-orange-600 to-red-600 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Due Collection</h1>
              <p className="text-orange-100 mt-1">Collect payments from patients with outstanding balances</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => loadSalesWithDue()}
                className="bg-white text-orange-600 hover:bg-orange-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Outstanding Due</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  Rs {totalOutstandingDue.toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {filteredSales.length} sale(s) with outstanding balances
            </p>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Sales</CardTitle>
            <CardDescription>Search and filter sales with due amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name, phone, or sale ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Sales Table */}
            {filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No sales with outstanding balances</p>
                <p className="text-gray-400 text-sm mt-2">All payments have been collected</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sale ID</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Sale Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Due Amount</TableHead>
                      <TableHead>Initial Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-xs">
                          {sale.id?.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="font-medium">
                          {sale.customerInfo?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {sale.customerInfo?.mobile || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            let saleDate: Date;
                            if (sale.saleDate instanceof Date) {
                              saleDate = sale.saleDate;
                            } else if (typeof sale.saleDate === 'number') {
                              saleDate = new Date(sale.saleDate);
                            } else {
                              saleDate = new Date(sale.saleDate || Date.now());
                            }
                            if (isNaN(saleDate.getTime())) {
                              saleDate = new Date();
                            }
                            return format(saleDate, 'MMM dd, yyyy');
                          })()}
                        </TableCell>
                        <TableCell>
                          Rs {sale.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="font-semibold">
                            Rs {sale.dueAmount?.toFixed(2) || '0.00'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          Rs {sale.initialPayment?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleOpenPaymentDialog(sale)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Collect Payment
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShowPaymentHistory(sale)}
                            >
                              <History className="h-4 w-4 mr-1" />
                              History
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-[500px] max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for sale {selectedSale?.id?.substring(0, 8)}...
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Patient:</p>
                    <p className="font-semibold">{selectedSale?.customerInfo?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Amount:</p>
                    <p className="font-semibold">Rs {selectedSale?.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Amount:</p>
                    <p className="font-semibold text-orange-600">Rs {selectedSale?.dueAmount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Initial Payment:</p>
                    <p className="font-semibold">Rs {selectedSale?.initialPayment?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentAmount">Payment Amount (Rs)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedSale?.dueAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: Rs {selectedSale?.dueAmount?.toFixed(2)}
                </p>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_deposit">Bank Deposit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                <Textarea
                  id="paymentNotes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add any notes about this payment..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
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
                className="bg-green-600 hover:bg-green-700"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Record Payment
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment History Dialog */}
        <Dialog open={showPaymentHistoryDialog} onOpenChange={setShowPaymentHistoryDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payment History</DialogTitle>
              <DialogDescription>
                Payment history for sale {selectedSale?.id?.substring(0, 8)}...
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Patient:</p>
                    <p className="font-semibold">{selectedSale?.customerInfo?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Amount:</p>
                    <p className="font-semibold">Rs {selectedSale?.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Due Amount:</p>
                    <p className="font-semibold text-orange-600">Rs {selectedSale?.dueAmount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status:</p>
                    <Badge variant={selectedSale?.isPaid ? "default" : "destructive"}>
                      {selectedSale?.isPaid ? "Paid" : "Due"}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedSale?.paymentHistory && selectedSale.paymentHistory.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Payment Records</h4>
                  <div className="rounded-md border">
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
                        {selectedSale.paymentHistory
                          .sort((a, b) => {
                            const dateA = a.date instanceof Date ? a.date.getTime() : (typeof a.date === 'number' ? a.date : new Date(a.date).getTime());
                            const dateB = b.date instanceof Date ? b.date.getTime() : (typeof b.date === 'number' ? b.date : new Date(b.date).getTime());
                            return dateB - dateA;
                          })
                          .map((payment: any, index: number) => {
                            // Convert payment date to Date object safely
                            let paymentDate: Date;
                            if (payment.date instanceof Date) {
                              paymentDate = payment.date;
                            } else if (typeof payment.date === 'number') {
                              paymentDate = new Date(payment.date);
                            } else if (payment.date) {
                              paymentDate = new Date(payment.date);
                            } else {
                              paymentDate = new Date(); // Fallback to current date
                            }
                            
                            // Validate date
                            if (isNaN(paymentDate.getTime())) {
                              paymentDate = new Date(); // Fallback if invalid
                            }
                            
                            return (
                            <TableRow key={payment.id || index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  {format(paymentDate, 'MMM dd, yyyy')}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {format(paymentDate, 'hh:mm a')}
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold">
                                Rs {payment.amount.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {payment.paymentMethod || 'cash'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  {userNames[payment.recordedBy] || payment.recordedBy || 'Unknown'}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {payment.notes || '-'}
                              </TableCell>
                            </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No payment history available</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowPaymentHistoryDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

