// src/app/dashboard/reports/ReportsPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart, 
  PieChart,
  TrendingUp, 
  Calendar,
  DollarSign,
  Users,
  CreditCard,
  Stethoscope,
  TestTube,
  Pill,
  User,
  Download,
  Printer,
  RefreshCw,
  Banknote,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  Loader2
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { reportsService } from '@/services/reportsService';
import { staffService } from '@/services/staffService';
import { ReportsFilter, ReportsData, CashOutRecord } from '@/types/reports';
import { ReportCharts } from './ReportCharts';
import { CashOutModal } from './CashOutModal';
import DashboardLayout from '@/components/DashboardLayout';

const ReportsPage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State for filters
  const [filter, setFilter] = useState<ReportsFilter>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    endDate: new Date(), // Today
    patientType: 'local', // Only local patients
    paymentMethod: 'all',
    serviceType: 'all'
  });
  
  // State for data
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [cashOutRecords, setCashOutRecords] = useState<CashOutRecord[]>([]);
  const [showCashOutHistory, setShowCashOutHistory] = useState(false);
  
  // Load reports data
  const loadReportsData = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getReportsData(filter);
      setReportsData(data);
    } catch (error) {
      console.error('Error loading reports data:', error);
      toast({
        title: "Error",
        description: "Failed to load reports data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load cash out records
  const loadCashOutRecords = async () => {
    try {
      const records = await reportsService.getCashOutRecords(filter.startDate, filter.endDate);
      setCashOutRecords(records);
    } catch (error) {
      console.error('Error loading cash out records:', error);
    }
  };
  
  useEffect(() => {
    loadReportsData();
    loadCashOutRecords();
  }, [filter]);
  
  // Handle filter changes
  const handleFilterChange = (key: keyof ReportsFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };
  
  // Format currency - only LKR for local patients
  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };
  
  // Handle cash out - only LKR for local patients
  const handleCashOut = async (cashOutData: {amount: number, notes?: string}) => {
    if (!user) return;
    
    try {
      // Get user display name
      let userName = 'Unknown User';
      if (user.uid) {
        try {
          const staffUser = await staffService.getStaffById(user.uid);
          if (staffUser) {
            userName = staffUser.displayName || staffUser.email || 'Unknown';
          } else if (user.email) {
            userName = user.email.split('@')[0];
          }
        } catch (error) {
          if (user.email) {
            userName = user.email.split('@')[0];
          }
        }
      }
      
      await reportsService.recordCashOut({
        currency: 'LKR',
        amount: cashOutData.amount,
        cashOutDate: new Date(),
        performedBy: {
          uid: user.uid || '',
          name: userName,
          email: user.email || ''
        },
        notes: cashOutData.notes || undefined
      });
      
      toast({
        title: "Cash Out Recorded",
        description: `${formatCurrency(cashOutData.amount)} has been recorded as cashed out`,
        variant: "success",
      });
      
      // Reload data
      loadCashOutRecords();
      setShowCashOutModal(false);
    } catch (error) {
      console.error('Error recording cash out:', error);
      toast({
        title: "Error",
        description: "Failed to record cash out",
        variant: "destructive",
      });
    }
  };
  
  if (!reportsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }
  
  return (
     <DashboardLayout>
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Financial Reports</h1>
            <p className="text-blue-100 mt-1">Comprehensive income analysis and cash management</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={loadReportsData}
              disabled={loading}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowCashOutHistory(true)}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Cash Out History
            </Button>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filter.startDate.toISOString().split('T')[0]}
                onChange={(e) => handleFilterChange('startDate', new Date(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filter.endDate.toISOString().split('T')[0]}
                onChange={(e) => handleFilterChange('endDate', new Date(e.target.value))}
              />
            </div>
            
            <div>
              <Label>Payment Method</Label>
              <Select 
                value={filter.paymentMethod} 
                onValueChange={(value) => handleFilterChange('paymentMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Service Type</Label>
              <Select 
                value={filter.serviceType} 
                onValueChange={(value) => handleFilterChange('serviceType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="appointments">Appointments</SelectItem>
                  <SelectItem value="procedures">Procedures</SelectItem>
                  <SelectItem value="lab">Lab Tests</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Income (LKR)</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(reportsData.totalIncome.lkr)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Total Transactions</p>
                <p className="text-2xl font-bold text-orange-700">
                  {reportsData.totalTransactions}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Average Transaction</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(reportsData.averageTransactionValue.lkr)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Service Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="h-5 w-5 mr-2" />
              Income by Service Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="font-medium">Appointments</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-700">
                    {formatCurrency(reportsData.serviceTypes.appointments.lkr)}
                  </div>
                  <div className="text-sm text-gray-600">{reportsData.serviceTypes.appointments.count} appointments</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Stethoscope className="h-4 w-4 mr-2 text-green-600" />
                  <span className="font-medium">Procedures</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-700">
                    {formatCurrency(reportsData.serviceTypes.procedures.lkr)}
                  </div>
                  <div className="text-sm text-gray-600">{reportsData.serviceTypes.procedures.count} procedures</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <TestTube className="h-4 w-4 mr-2 text-purple-600" />
                  <span className="font-medium">Lab Tests</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-700">
                    {formatCurrency(reportsData.serviceTypes.lab.lkr)}
                  </div>
                  <div className="text-sm text-gray-600">{reportsData.serviceTypes.lab.count} tests</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center">
                  <Pill className="h-4 w-4 mr-2 text-orange-600" />
                  <span className="font-medium">Pharmacy</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-700">
                    {formatCurrency(reportsData.serviceTypes.pharmacy.lkr)}
                  </div>
                  <div className="text-sm text-gray-600">{reportsData.serviceTypes.pharmacy.count} items</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Payment Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Income by Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Banknote className="h-4 w-4 mr-2 text-green-600" />
                  <span className="font-medium">Cash Payments</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-700">
                    {formatCurrency(reportsData.paymentMethods.cash.lkr)}
                  </div>
                  <div className="text-sm text-gray-600">{reportsData.paymentMethods.cash.count} transactions</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="font-medium">Card Payments</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-700">
                    {formatCurrency(reportsData.paymentMethods.card.lkr)}
                  </div>
                  <div className="text-sm text-gray-600">{reportsData.paymentMethods.card.count} transactions</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Cash Out Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowUpCircle className="h-5 w-5 mr-2" />
            Cash Out Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Button 
              onClick={() => setShowCashOutModal(true)}
              className="bg-green-600 hover:bg-green-700 h-16 w-64"
            >
              <div className="text-center">
                <ArrowUpCircle className="h-6 w-6 mx-auto mb-1" />
                <div className="font-bold">Cash Out LKR</div>
                <div className="text-sm opacity-80">
                  Available: {formatCurrency(reportsData.paymentMethods.cash.lkr)}
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Patient Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Patient Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="space-y-4 w-full max-w-md">
              <h3 className="font-semibold text-gray-800 text-center">Local Patients</h3>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Total Revenue:</span>
                  <span className="font-bold">{formatCurrency(reportsData.patientTypes.local.lkr)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Total Patients:</span>
                  <span className="font-bold">{reportsData.patientTypes.local.count}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Insurance Patients:</span>
                  <span className="font-bold">{reportsData.patientTypes.local.insurance}</span>
                </div>
                <div className="flex justify-between">
                  <span>Non-Insurance:</span>
                  <span className="font-bold">{reportsData.patientTypes.local.nonInsurance}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Charts Component */}
      <ReportCharts reportsData={reportsData} />
      
      {/* Cash Out Modal */}
      <CashOutModal
        open={showCashOutModal}
        onOpenChange={setShowCashOutModal}
        currency="LKR"
        availableAmount={reportsData.paymentMethods.cash.lkr}
        onCashOut={handleCashOut}
      />
      
      {/* Cash Out History Modal */}
      <Dialog open={showCashOutHistory} onOpenChange={setShowCashOutHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cash Out History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cashOutRecords.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No cash out records found for this period</p>
            ) : (
              <div className="space-y-2">
                {cashOutRecords.map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">
                        {formatCurrency(record.amount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {record.cashOutDate.toLocaleDateString()} at {record.cashOutDate.toLocaleTimeString()}
                      </div>
                      {record.notes && (
                        <div className="text-sm text-gray-500 italic">{record.notes}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{record.performedBy.name}</div>
                      <Badge variant="outline" className="text-xs">
                        LKR
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
};

export default ReportsPage;