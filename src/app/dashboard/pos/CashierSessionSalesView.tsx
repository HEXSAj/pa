
// src/components/CashierSessionSalesView.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Printer,  
  Receipt, 
  Clock, 
  User, 
  CreditCard,
  Calendar,
  TrendingUp,
  PieChart,
  FileText,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { cashierService } from '@/services/cashierService';
import { receiptService } from '@/services/receiptService';
import { useAuth } from '@/context/AuthContext';
import { posReceiptService } from '@/services/posReceiptService';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

// interface Sale {
//   id: string;
//   customerInfo?: {
//     name: string;
//     mobile?: string;
//   };
//   totalAmount: number;
//   paymentMethod: string;
//   patientType: 'local';
//   createdAt: Date;
//   opdCharges?: number;
//   proceduresTotal?: number;
//   labTestsTotal?: number;
//   pharmacyTotal?: number;
//   paymentDetails?: any;
// }

interface Sale {
  id: string;
  customerInfo?: {
    name: string;
    mobile?: string;
  };
  totalAmount: number;
  paymentMethod: string;
  patientType: 'local';
  createdAt: Date;
  opdCharges?: number;
  proceduresTotal?: number;
  labTestsTotal?: number;
  pharmacyTotal?: number;
  paymentDetails?: any;
  
  // Add missing required properties
  items: any[];
  totalCost: number;
  saleDate: Date;
  updatedAt: Date;
  
  // Add optional properties that might be needed
  procedures?: any[];
  labTests?: any[];
  isInsurancePatient?: boolean;
  createdBy?: any;
}

interface SessionSalesViewProps {
  sessionId: string;
  onClose: () => void;
}

export function CashierSessionSalesView({ sessionId, onClose }: SessionSalesViewProps) {
  const [sessionSales, setSessionSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<boolean>(false); 

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    setLoading(true);
    try {
      // Load session details
      const sessionData = await cashierService.getSessionById(sessionId);
      setSession(sessionData);

      // Load session sales - filter only local sales
      const sales = await cashierService.getSessionSales(sessionId);
      const localSales = sales.filter((sale: Sale) => sale.patientType === 'local');
      setSessionSales(localSales);
    } catch (error) {
      console.error('Error loading session data:', error);
      toast({
        title: "Error",
        description: "Failed to load session data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Currency calculations - only for local sales
  const calculateTotals = () => {
    const localSales = sessionSales.filter(sale => sale.patientType === 'local');

    // Local sales totals (LKR)
    const localTotalLKR = localSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const localOpdLKR = localSales.reduce((sum, sale) => sum + (sale.opdCharges || 0), 0);
    const localProceduresLKR = localSales.reduce((sum, sale) => sum + (sale.proceduresTotal || 0), 0);
    const localLabTestsLKR = localSales.reduce((sum, sale) => sum + (sale.labTestsTotal || 0), 0);
    const localPharmacyLKR = localSales.reduce((sum, sale) => sum + (sale.pharmacyTotal || 0), 0);

    return {
      local: {
        count: localSales.length,
        totalLKR: localTotalLKR,
        opdLKR: localOpdLKR,
        proceduresLKR: localProceduresLKR,
        labTestsLKR: localLabTestsLKR,
        pharmacyLKR: localPharmacyLKR,
      },
      grand: {
        totalSales: sessionSales.length,
        totalLKR: localTotalLKR,
      }
    };
  };

  const totals = calculateTotals();

  // Payment method breakdown - only for local sales
  const getPaymentBreakdown = () => {
    const breakdown = sessionSales.reduce((acc, sale) => {
      const method = sale.paymentMethod;
      
      if (!acc[method]) {
        acc[method] = { local: { count: 0, amount: 0 } };
      }
      
      acc[method].local.count++;
      acc[method].local.amount += sale.totalAmount;
      
      return acc;
    }, {} as any);

    return breakdown;
  };

  const paymentBreakdown = getPaymentBreakdown();

  // Format payment method
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'card': return 'Card';
      case 'bank_deposit': return 'Bank Transfer';
      case 'credit': return 'Credit';
      default: return method;
    }
  };

  // Print session summary
  const handlePrintSessionSummary = async () => {
    setPrinting(true);
    try {
      await receiptService.printCashierSessionSummary(session, sessionSales, totals);
      toast({
        title: "Success",
        description: "Session summary printed successfully",
      });
    } catch (error) {
      console.error('Error printing session summary:', error);
      toast({
        title: "Error",
        description: "Failed to print session summary",
        variant: "destructive",
      });
    } finally {
      setPrinting(false);
    }
  };


  const handlePrintReceipt = async (saleId: string) => {
    setPrinting(true);
    try {
      // Get the complete sale details from Firebase
      const saleRef = ref(database, `sales/${saleId}`);
      const snapshot = await get(saleRef);
      
      if (!snapshot.exists()) {
        toast({
          title: "Sale Not Found",
          description: "Could not find the sale to reprint",
          variant: "destructive",
        });
        return;
      }
      
      // Get the sale data and convert timestamps
      const saleData = snapshot.val();
      const completeSale = {
        id: saleId,
        ...saleData,
        saleDate: new Date(saleData.saleDate),
        createdAt: new Date(saleData.createdAt),
        updatedAt: new Date(saleData.updatedAt),
        items: saleData.items || [],
        totalCost: saleData.totalCost || 0,
        procedures: saleData.procedures || [],
        labTests: saleData.labTests || [],
      };
      
      await posReceiptService.printPOSReceipt(completeSale);
      
      toast({
        title: "Success",
        description: "Receipt printed successfully",
      });
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast({
        title: "Error",
        description: "Failed to print receipt",
        variant: "destructive",
      });
    } finally {
      setPrinting(false);
    }
  };

  const handleViewDetails = async (saleId: string) => {
    setProcessing(true);
    try {
      // Get the sale details from Firebase
      const saleRef = ref(database, `sales/${saleId}`);
      const snapshot = await get(saleRef);
      
      if (snapshot.exists()) {
        const saleData = snapshot.val();
        console.log('Sale Details:', saleData);
        
        // You can implement a modal or navigation to show details
        toast({
          title: "Sale Details",
          description: `Sale ID: ${saleId}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Sale not found",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching sale details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sale details",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading session data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Session Sales View</h1>
          <p className="text-gray-600">Session ID: {sessionId}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handlePrintSessionSummary}
            disabled={printing}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            {printing ? 'Printing...' : 'Print Summary'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Session Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Cashier</p>
              <p className="font-medium">{session?.userName || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Start Time</p>
              <p className="font-medium">{session?.startDate ? format(new Date(session.startDate), 'PPp') : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">End Time</p>
              <p className="font-medium">{session?.endDate ? format(new Date(session.endDate), 'PPp') : 'Active'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totals.grand.totalSales}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Sales transactions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2" />
              Local Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totals.local.count}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Patient transactions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rs. {totals.grand.totalLKR.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Total revenue (LKR)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Local Sales Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-blue-600 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Local Sales Summary (LKR)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">OPD Charges:</span>
            <span className="font-medium">Rs. {totals.local.opdLKR.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Procedures:</span>
            <span className="font-medium">Rs. {totals.local.proceduresLKR.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Lab Tests:</span>
            <span className="font-medium">Rs. {totals.local.labTestsLKR.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pharmacy:</span>
            <span className="font-medium">Rs. {totals.local.pharmacyLKR.toFixed(2)}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-bold text-blue-600">
              <span>Total:</span>
              <span>Rs. {totals.local.totalLKR.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Method Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(paymentBreakdown).map(([method, data]: [string, any]) => (
              <div key={method} className="p-4 border rounded-lg">
                <div className="font-medium text-gray-900 mb-2">
                  {formatPaymentMethod(method)}
                </div>
                <div className="text-sm text-blue-600">
                  {data.local.count} sales • Rs. {data.local.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Receipt className="h-5 w-5 mr-2" />
            All Sales ({sessionSales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount (LKR)</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      #{sale.id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {sale.customerInfo?.name || 'No Customer'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="default"
                        className="bg-blue-100 text-blue-800"
                      >
                        Local
                      </Badge>
                    </TableCell>
                    <TableCell className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                      {format(sale.createdAt, 'hh:mm a')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatPaymentMethod(sale.paymentMethod)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      Rs. {sale.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(sale.id)}
                          disabled={processing}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                      

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintReceipt(sale.id)}
                            disabled={printing}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}