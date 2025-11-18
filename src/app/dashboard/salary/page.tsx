// src/app/dashboard/salary/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  DollarSign,
  Users,
  Calendar,
  Download,
  FilePlus,
  FileText,
  Clock,
  MoreHorizontal,
  RefreshCw,
  Loader2,
  Search,
  X,
  Printer,
  Filter,
  ArrowUpDown,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { staffService } from '@/services/staffService';
import { attendanceService } from '@/services/attendanceService';
import { salaryService } from '@/services/salaryService';
import { StaffUser } from '@/types/staff';
import { Salary, SalaryPayment } from '@/types/salary';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { DatePicker } from '@/components/ui/date-picker';
import { format, addMonths, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import withAuth from '@/components/withAuth';
import { AddSalaryForm } from './AddSalaryForm';
import { SalaryHistoryTable } from './SalaryHistoryTable';
import { StaffSalaryCard } from './StaffSalaryCard';
import { Skeleton } from '@/components/ui/skeleton';

function SalaryPage() {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  
  // State variables
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<SalaryPayment[]>([]);
  const [filteredSalaryHistory, setFilteredSalaryHistory] = useState<SalaryPayment[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('paymentDate');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Dialog states
  const [showAddSalaryDialog, setShowAddSalaryDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SalaryPayment | null>(null);
  
  // Stats
  const [salaryStats, setSalaryStats] = useState({
    totalStaff: 0,
    totalSalaryPaid: 0,
    totalPending: 0,
    averageSalary: 0,
    paidThisMonth: 0,
    pendingThisMonth: 0
  });
  
  // Load staff list and salary data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load staff list
        const staff = await staffService.getAllStaff();
        setStaffList(staff);
        
        // Load salary history
        const history = await salaryService.getAllSalaryPayments();
        setSalaryHistory(history);
        setFilteredSalaryHistory(history);
        
        // Calculate stats
        const currentMonth = startOfMonth(new Date());
        const nextMonth = endOfMonth(new Date());
        
        const totalPaid = history.reduce((sum, payment) => sum + payment.amount, 0);
        const paidThisMonth = history.filter(payment => 
          new Date(payment.paymentDate) >= currentMonth && 
          new Date(payment.paymentDate) <= nextMonth
        ).reduce((sum, payment) => sum + payment.amount, 0);
        
        // Get all staff salaries
        const staffSalaries = await Promise.all(
          staff.map(async (s) => {
            try {
              const salaryInfo = await salaryService.getStaffSalary(s.uid);
              return salaryInfo?.baseSalary || 0;
            } catch (error) {
              console.error(`Error fetching salary for staff ${s.uid}:`, error);
              return 0;
            }
          })
        );
        
        const totalSalaries = staffSalaries.reduce((sum, salary) => sum + salary, 0);
        const averageSalary = staff.length > 0 ? totalSalaries / staff.length : 0;
        
        // Estimate pending (this is simplified - in a real app we'd check which staff haven't been paid)
        const pendingThisMonth = totalSalaries - paidThisMonth;
        
        setSalaryStats({
          totalStaff: staff.length,
          totalSalaryPaid: totalPaid,
          totalPending: pendingThisMonth > 0 ? pendingThisMonth : 0,
          averageSalary,
          paidThisMonth,
          pendingThisMonth: pendingThisMonth > 0 ? pendingThisMonth : 0
        });
      } catch (error) {
        console.error('Error loading salary data:', error);
        toast({
          title: "Error",
          description: "Failed to load salary data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Filter salary history based on search term and selected staff
  useEffect(() => {
    let filtered = [...salaryHistory];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => {
        const staffName = staffList.find(s => s.uid === payment.staffId)?.displayName || '';
        return (
          staffName.toLowerCase().includes(term) ||
          payment.description?.toLowerCase().includes(term) ||
          payment.paymentMethod?.toLowerCase().includes(term)
        );
      });
    }
    
    // Filter by selected staff
    if (selectedStaffId && selectedStaffId !== 'all') { // Add check for 'all'
      filtered = filtered.filter(payment => payment.staffId === selectedStaffId);
    }
    
    // Sort results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortColumn) {
        case 'paymentDate':
          aValue = new Date(a.paymentDate).getTime();
          bValue = new Date(b.paymentDate).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'staffName':
          const aName = staffList.find(s => s.uid === a.staffId)?.displayName || '';
          const bName = staffList.find(s => s.uid === b.staffId)?.displayName || '';
          aValue = aName.toLowerCase();
          bValue = bName.toLowerCase();
          break;
        default:
          aValue = new Date(a.paymentDate).getTime();
          bValue = new Date(b.paymentDate).getTime();
      }
      
      return sortDirection === 'asc' 
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });
    
    setFilteredSalaryHistory(filtered);
  }, [searchTerm, selectedStaffId, sortColumn, sortDirection, salaryHistory, staffList]);
  
  // Handle sort change
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Change column and reset direction
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  // Handle adding a new salary payment
  const handleAddSalary = async (salaryData: Omit<SalaryPayment, 'id'>) => {
    try {
      const newPayment = await salaryService.addSalaryPayment(salaryData);
      
      // Update salary history
      setSalaryHistory(prev => [newPayment, ...prev]);
      
      // Update stats
      setSalaryStats(prev => ({
        ...prev,
        totalSalaryPaid: prev.totalSalaryPaid + newPayment.amount,
        paidThisMonth: new Date(newPayment.paymentDate).getMonth() === new Date().getMonth() 
          ? prev.paidThisMonth + newPayment.amount 
          : prev.paidThisMonth,
        pendingThisMonth: new Date(newPayment.paymentDate).getMonth() === new Date().getMonth() 
          ? prev.pendingThisMonth - newPayment.amount 
          : prev.pendingThisMonth
      }));
      
      // Close dialog
      setShowAddSalaryDialog(false);
      
      // Show success message
      toast({
        title: "Success",
        description: "Salary payment has been added successfully",
        variant: "success"
      });
    } catch (error) {
      console.error('Error adding salary payment:', error);
      toast({
        title: "Error",
        description: "Failed to add salary payment",
        variant: "destructive"
      });
    }
  };
  
  // Get staff name by ID
  const getStaffName = (staffId: string) => {
    const staff = staffList.find(s => s.uid === staffId);
    return staff?.displayName || staff?.email || 'Unknown Staff';
  };
  
  // Format payment method
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'check':
        return 'Check';
      default:
        return method;
    }
  };
  
  // Handle refresh data
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      
      // Reload salary history
      const history = await salaryService.getAllSalaryPayments();
      setSalaryHistory(history);
      
      toast({
        title: "Data Refreshed",
        description: "Salary data has been refreshed",
        variant: "success"
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // View payment details
  const handleViewDetails = (payment: SalaryPayment) => {
    setSelectedPayment(payment);
    setShowDetailDialog(true);
  };
  
  // Print payment receipt
  const handlePrintReceipt = (payment: SalaryPayment) => {
    try {
      // In a real app, we would call a service to print
      toast({
        title: "Printing Receipt",
        description: "Salary payment receipt is being printed",
        variant: "success"
      });
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast({
        title: "Error",
        description: "Failed to print receipt",
        variant: "destructive"
      });
    }
  };
  
  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-0">
          <h1 className="text-3xl font-bold tracking-tight">Staff Salary Management</h1>
          <p className="text-muted-foreground">Manage staff salaries, process payments, and view salary history</p>
        </div>
        
        <div className="p-6 flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                    <span className="sm:hidden">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="add-salary" className="flex items-center gap-2">
                    <FilePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Salary</span>
                    <span className="sm:hidden">Add</span>
                  </TabsTrigger>
                  <TabsTrigger value="salary-history" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Salary History</span>
                    <span className="sm:hidden">History</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className="hidden lg:flex items-center gap-2">
                  {activeTab === 'salary-history' && (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search payments..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 w-[250px]"
                        />
                        {searchTerm && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="All Staff" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Staff</SelectItem> {/* Changed from "" to "all" */}
                          {staffList.map((staff) => (
                            <SelectItem key={staff.uid} value={staff.uid}>
                              {staff.displayName || staff.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  
                  <Button onClick={() => setShowAddSalaryDialog(true)}>
                    <FilePlus className="h-4 w-4 mr-2" />
                    Add Salary Payment
                  </Button>
                </div>
              </div>
              
              {/* Mobile filters row */}
              {activeTab === 'salary-history' && (
                <div className="lg:hidden flex flex-wrap items-center gap-2 my-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                    <SelectTrigger className="flex-1 min-w-[200px]">
                      <SelectValue placeholder="All Staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff</SelectItem>
                      {staffList.map((staff) => (
                        <SelectItem key={staff.uid} value={staff.uid}>
                          {staff.displayName || staff.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-auto">
              {/* Overview Tab */}
              <TabsContent value="overview" className="h-full">
                <div className="h-full flex flex-col gap-6 overflow-auto pb-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Total Staff</p>
                            {isLoading ? (
                                <Skeleton className="h-8 w-16" />
                              ) : (
                                <p className="text-2xl font-bold">
                                  {salaryStats.totalStaff}
                                </p>
                              )}
                          </div>
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Total Salary Paid</p>
                              {isLoading ? (
                                <Skeleton className="h-8 w-24" />
                              ) : (
                                <p className='text-2xl font-bold'>
                                `Rs${salaryStats.totalSalaryPaid.toLocaleString()}`
                                </p>
                              )}
                          </div>
                          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Pending Payments</p>
                              {isLoading ? (
                                <Skeleton className="h-8 w-24" />
                              ) : (
                                <p className='text-2xl font-bold'>
                                `Rs${salaryStats.pendingThisMonth.toLocaleString()}`
                                </p>
                              )}
                          </div>
                          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-amber-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Paid This Month</p>
                              {isLoading ? (
                                <Skeleton className="h-8 w-24" />
                              ) : (
                                <p className='text-2xl font-bold'>
                                `Rs${salaryStats.paidThisMonth.toLocaleString()}`
                              </p>
                              )}
                          </div>
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Average Salary</p>
                              {isLoading ? (
                                <Skeleton className="h-8 w-24" />
                              ) : (
                                <p className='text-2xl font-bold'>
                                `Rs${salaryStats.averageSalary.toLocaleString()}`
                                </p>
                              )}
                          </div>
                          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="flex items-center justify-center p-6">
                      <Button 
                        onClick={() => setShowAddSalaryDialog(true)}
                        className="w-full h-12"
                      >
                        <FilePlus className="h-5 w-5 mr-2" />
                        Add New Salary Payment
                      </Button>
                    </Card>
                  </div>
                  
                  {/* Staff Salary Overview */}
                  <Card className="flex-1">
                    <CardHeader className="pb-0">
                      <CardTitle>Staff Salary Overview</CardTitle>
                      <CardDescription>Current salary details for all staff members</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 overflow-auto">
                      {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[1, 2, 3, 4, 5, 6].map(i => (
                            <Skeleton key={i} className="h-48 w-full" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                          {staffList.map(staff => (
                            <StaffSalaryCard 
                              key={staff.uid} 
                              staffId={staff.uid} 
                              staffName={staff.displayName || staff.email}
                              onPaySalary={() => {
                                setSelectedStaffId(staff.uid);
                                setShowAddSalaryDialog(true);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Add Salary Tab */}
              <TabsContent value="add-salary" className="h-full">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle>Add Salary Payment</CardTitle>
                    <CardDescription>Process a new salary payment for staff</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto">
                    <AddSalaryForm 
                      staffList={staffList} 
                      onAddSalary={handleAddSalary}
                      selectedStaffId={selectedStaffId}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

                

              {/* Salary History Tab */}
              <TabsContent value="salary-history" className="h-full">
                <div className="h-full flex flex-col">
                  <Card className="flex-1 overflow-hidden">
                    <CardHeader className="pb-0">
                      <CardTitle>Salary Payment History</CardTitle>
                      <CardDescription>Record of all salary payments</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 overflow-auto">
                      {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : filteredSalaryHistory.length > 0 ? (
                        <Table>
                          <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                              <TableHead 
                                className="cursor-pointer"
                                onClick={() => handleSort('paymentDate')}
                              >
                                <div className="flex items-center">
                                  Payment Date
                                  {sortColumn === 'paymentDate' && (
                                    <ArrowUpDown className="ml-1 h-4 w-4" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead
                                className="cursor-pointer"
                                onClick={() => handleSort('staffName')}
                              >
                                <div className="flex items-center">
                                  Staff
                                  {sortColumn === 'staffName' && (
                                    <ArrowUpDown className="ml-1 h-4 w-4" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead
                                className="cursor-pointer"
                                onClick={() => handleSort('amount')}
                              >
                                <div className="flex items-center">
                                  Amount
                                  {sortColumn === 'amount' && (
                                    <ArrowUpDown className="ml-1 h-4 w-4" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead>Payment Method</TableHead>
                              <TableHead>Period</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredSalaryHistory.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>
                                  {format(new Date(payment.paymentDate), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{getStaffName(payment.staffId)}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">Rs{payment.amount.toLocaleString()}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {formatPaymentMethod(payment.paymentMethod)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {payment.period && (
                                    <span>{format(new Date(payment.period), 'MMMM yyyy')}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-green-100 text-green-800 flex items-center w-fit">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Paid
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => handleViewDetails(payment)}>
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handlePrintReceipt(payment)}>
                                        Print Receipt
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 px-4">
                          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                            <FileText className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <h3 className="font-medium text-lg mb-1">No salary payments found</h3>
                          <p className="text-center text-muted-foreground">
                            {searchTerm || selectedStaffId 
                              ? "No payments match your search criteria" 
                              : "No salary payments have been recorded yet"}
                          </p>
                          </div>
                      )}
                    </CardContent>
                    <CardFooter className="border-t p-4">
                      <div className="flex flex-wrap gap-4 w-full">
                        <Button
                          variant="outline"
                          onClick={handleRefresh}
                          disabled={isLoading}
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Refresh Data
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Export to CSV functionality would go here
                            toast({
                              title: "Export Initiated",
                              description: "Your report is being prepared for download",
                              variant: "success"
                            });
                          }}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export to CSV
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
              
            </div>
          </Tabs>
        </div>
      </div>
      
      {/* Add Salary Dialog */}
      <Dialog open={showAddSalaryDialog} onOpenChange={setShowAddSalaryDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Salary Payment</DialogTitle>
            <DialogDescription>
              Record a new salary payment for a staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <AddSalaryForm 
              staffList={staffList} 
              onAddSalary={(salaryData) => {
                handleAddSalary(salaryData);
                setShowAddSalaryDialog(false);
              }}
              selectedStaffId={selectedStaffId}
              isDialog={true}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Payment Details Dialog */}
      {selectedPayment && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Salary Payment Details</DialogTitle>
              <DialogDescription>
                Complete details of the selected salary payment.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Staff</Label>
                  <p className="font-medium">{getStaffName(selectedPayment.staffId)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Payment Date</Label>
                  <p className="font-medium">{format(new Date(selectedPayment.paymentDate), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Amount</Label>
                  <p className="font-medium text-green-600">Rs{selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Payment Method</Label>
                  <p className="font-medium">{formatPaymentMethod(selectedPayment.paymentMethod)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Period</Label>
                  <p className="font-medium">
                    {selectedPayment.period 
                      ? format(new Date(selectedPayment.period), 'MMMM yyyy')
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge className="bg-green-100 text-green-800 flex items-center w-fit mt-1">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Paid
                  </Badge>
                </div>
              </div>
              
              {selectedPayment.description && (
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="mt-1">{selectedPayment.description}</p>
                </div>
              )}
              
              {selectedPayment.deductions && selectedPayment.deductions.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Deductions</Label>
                  <ul className="mt-1 space-y-1">
                    {selectedPayment.deductions.map((deduction, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{deduction.reason}</span>
                        <span className="font-medium text-red-600">-Rs{deduction.amount.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedPayment.bonuses && selectedPayment.bonuses.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Bonuses</Label>
                  <ul className="mt-1 space-y-1">
                    {selectedPayment.bonuses.map((bonus, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{bonus.reason}</span>
                        <span className="font-medium text-green-600">+Rs{bonus.amount.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handlePrintReceipt(selectedPayment)}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>
              <Button onClick={() => setShowDetailDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
    </DashboardLayout>
  );
}

export default withAuth(SalaryPage);