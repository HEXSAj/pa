// src/app/dashboard/pos/CreditSales.tsx
'use client';

import { useState, useEffect } from 'react';
import { saleService } from '@/services/saleService';
import { Sale, PaymentRecord } from '@/types/sale';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Search, 
  X, 
  Receipt, 
  DollarSign, 
  User, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  Filter,
  Loader2,
  CheckCircle2,
  RefreshCw
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
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function CreditSalesPage() {
  const { toast } = useToast();
  const [creditSales, setCreditSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentHistoryDialog, setShowPaymentHistoryDialog] = useState(false);
  
  // Load all credit sales with unpaid balances
  const loadCreditSales = async () => {
    try {
      setLoading(true);
      const sales = await saleService.getCreditSales();
      setCreditSales(sales);
      setFilteredSales(sales);
    } catch (error) {
      console.error('Error loading credit sales:', error);
      toast({
        title: "Error",
        description: "Failed to load credit sales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreditSales();
  }, []);

  // Filter and sort sales when search query or sort option changes
  useEffect(() => {
    let filtered = creditSales;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = creditSales.filter(sale => 
        sale.customer?.name?.toLowerCase().includes(query) ||
        sale.customer?.mobile?.toLowerCase().includes(query) ||
        sale.id?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortBy === 'date') {
      filtered = [...filtered].sort((a, b) => 
        new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
      );
    } else if (sortBy === 'amount') {
      filtered = [...filtered].sort((a, b) => 
        (b.dueAmount || 0) - (a.dueAmount || 0)
      );
    }

    setFilteredSales(filtered);
  }, [searchQuery, creditSales, sortBy]);

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
      await loadCreditSales();
      
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

  // Calculate total outstanding credit
  const totalOutstandingCredit = filteredSales.reduce((sum, sale) => sum + (sale.dueAmount || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full">
        {/* Header with gradient background */}
        <div className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Credit Sales Management</h1>
              <p className="text-amber-100 mt-1">Track and manage outstanding customer payments</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => loadCreditSales()}
                className="bg-white text-amber-600 hover:bg-amber-50"
              >
                <RefreshButton />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Outstanding Credit</p>
                  <p className="text-3xl font-bold text-amber-600">Rs{totalOutstandingCredit.toFixed(2)}</p>
                </div>
                <div className="rounded-full bg-amber-100 p-3">
                  <DollarSign className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Credit Customers</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {new Set(filteredSales.map(sale => sale.customerId)).size}
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <User className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Overdue (>30 days)</p>
                  <p className="text-3xl font-bold text-red-600">
                    {filteredSales.filter(sale => {
                      const saleDate = new Date(sale.saleDate);
                      const now = new Date();
                      const diffTime = Math.abs(now.getTime() - saleDate.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays > 30;
                    }).length}
                  </p>
                </div>
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Credit Sales Table Card */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="bg-gray-50 border-b pb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Outstanding Credit</CardTitle>
                <CardDescription>Manage payments for credit sales</CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 py-2 border-gray-200 focus:ring-amber-500 w-full"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Filter className="h-4 w-4 mr-1" />
                      {sortBy === 'date' ? 'Sort by Date' : 'Sort by Amount'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy('date')}>
                      Sort by Date
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('amount')}>
                      Sort by Amount
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="relative">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading credit sales...</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-auto max-h-[calc(100vh-20rem)]">
                  <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[240px]">Customer</TableHead>
                      <TableHead className="w-[140px]">Date</TableHead>
                      <TableHead className="w-[160px]">Total Amount</TableHead>
                      <TableHead className="w-[140px]">Due Amount</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="text-right w-[180px]">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            <div className="flex flex-col items-center">
                              <div className="rounded-full bg-gray-100 p-4 mb-3">
                                <Receipt className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-lg text-gray-500">
                                {searchQuery ? 'No credit sales match your search criteria' : 'No outstanding credit sales'}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {searchQuery ? 'Try adjusting your search terms' : 'All credit sales have been paid'}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSales.map((sale) => (
                          <TableRow 
                            key={sale.id} 
                            className="group hover:bg-amber-50/50 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-medium">
                                  {sale.customer?.name.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                  <p className="font-medium">{sale.customer?.name || 'Unknown Customer'}</p>
                                  <p className="text-xs text-gray-500">{sale.customer?.mobile || 'No phone'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center text-sm">
                                  <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                  {new Date(sale.saleDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDistanceToNow(new Date(sale.saleDate), { addSuffix: true })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">Rs{sale.totalAmount.toFixed(2)}</span>
                              {sale.initialPayment && sale.initialPayment > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Initial: Rs{sale.initialPayment.toFixed(2)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-medium bg-red-50 text-red-700 border-red-200">
                                Rs{(sale.dueAmount || 0).toFixed(2)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {isDueDateOverdue(sale.saleDate) ? (
                                <Badge variant="destructive" className="font-normal">
                                  Overdue
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="font-normal bg-amber-50 text-amber-700 border-amber-200">
                                  Due
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleShowPaymentHistory(sale)}
                                  className="h-8 text-gray-600"
                                >
                                  History
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleOpenPaymentDialog(sale)}
                                  className="h-8 bg-amber-600 hover:bg-amber-700"
                                >
                                  Record Payment
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md rounded-xl overflow-hidden p-0">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 py-6 px-6">
            <DialogHeader className="text-left">
              <DialogTitle className="text-white text-xl">Record Payment</DialogTitle>
              <DialogDescription className="text-amber-200 mt-1">
                Customer: {selectedSale?.customer?.name || 'Unknown Customer'}
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
                Sale #{selectedSale?.id?.slice(-8) || ''} • {selectedSale?.customer?.name || 'Unknown Customer'}
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
                  <History className="h-4 w-4 mr-2" />
                  Payment History
                </h3>
                
                {(!selectedSale?.paymentHistory || selectedSale.paymentHistory.length === 0) ? (
                  <div className="text-center py-6 text-gray-500">
                    <ReceiptIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
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
                          {/* <div className="text-xs text-gray-500">
                            {new Date(selectedSale.saleDate).toLocaleDateString()} at {new Date(selectedSale.saleDate).toLocaleTimeString()}
                          </div> */}
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
                            {payment.date instanceof Date 
                              ? payment.date.toLocaleDateString() 
                              : new Date(payment.date).toLocaleDateString()
                            } at {
                              payment.date instanceof Date 
                                ? payment.date.toLocaleTimeString() 
                                : new Date(payment.date).toLocaleTimeString()
                            }

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
    </DashboardLayout>
  );
}

// Helper components
const RefreshButton = () => {
  const [isRotating, setIsRotating] = useState(false);
  
  const handleClick = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 1000);
  };
  
  return (
    <div className="inline-block" onClick={handleClick}>
      <RefreshCw className={`h-4 w-4 mr-2 ${isRotating ? 'animate-spin' : ''}`} />
    </div>
  );
};

const History = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const ReceiptIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
    <path d="M16 8h-6" />
    <path d="M16 12h-6" />
    <path d="M16 16h-6" />
  </svg>
);

// Helper functions
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