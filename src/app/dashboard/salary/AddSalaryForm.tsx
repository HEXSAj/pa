// src/components/salary/AddSalaryForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
import { DatePicker } from '@/components/ui/date-picker';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardFooter, 
  CardTitle 
} from "@/components/ui/card";
import {
  PlusCircle,
  XCircle,
  Loader2,
  DollarSign,
  CalendarIcon,
  TrendingUp,
  CreditCard,
  BarChart
} from 'lucide-react';
import { SalaryPayment } from '@/types/salary';
import { StaffUser } from '@/types/staff';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { salaryService } from '@/services/salaryService';
import { saleService } from '@/services/saleService'; // Import saleService
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Import the StaffAttendanceSummary component
import { SimplifiedStaffAttendanceSummary } from './SimplifiedStaffAttendanceSummary';

interface AddSalaryFormProps {
  staffList: StaffUser[];
  onAddSalary: (salaryData: Omit<SalaryPayment, 'id'>) => void;
  selectedStaffId?: string;
  isDialog?: boolean;
}

export function AddSalaryForm({ 
  staffList, 
  onAddSalary,
  selectedStaffId = '',
  isDialog = false
}: AddSalaryFormProps) {
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    staffId: selectedStaffId,
    amount: '',
    paymentDate: new Date(),
    period: startOfMonth(new Date()),
    paymentMethod: 'bank_transfer',
    description: '',
    deductions: [] as { reason: string; amount: number }[],
    bonuses: [] as { reason: string; amount: number }[]
  });
  
  // Additional state
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [baseSalary, setBaseSalary] = useState<number | null>(null);
  const [newDeduction, setNewDeduction] = useState({ reason: '', amount: '' });
  const [newBonus, setNewBonus] = useState({ reason: '', amount: '' });
  const [commission, setCommission] = useState('');
  
  // Sales performance state
  const [salesPerformance, setSalesPerformance] = useState({
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
    salesCount: 0
  });
  
  // Update form when selectedStaffId changes
  useEffect(() => {
    if (selectedStaffId) {
      setFormData(prev => ({ ...prev, staffId: selectedStaffId }));
      fetchStaffSalary(selectedStaffId);
      fetchSalesPerformance(selectedStaffId, formData.period);
    }
  }, [selectedStaffId]);
  
  // Update sales data when period changes
  useEffect(() => {
    if (formData.staffId) {
      fetchSalesPerformance(formData.staffId, formData.period);
    }
  }, [formData.period]);
  
  // Fetch staff base salary when selected
  const fetchStaffSalary = async (staffId: string) => {
    if (!staffId) {
      setBaseSalary(null);
      return;
    }
    
    try {
      setIsLoading(true);
      const salaryInfo = await salaryService.getStaffSalary(staffId);
      
      if (salaryInfo && salaryInfo.baseSalary) {
        setBaseSalary(salaryInfo.baseSalary);
        setFormData(prev => ({ ...prev, amount: salaryInfo.baseSalary.toString() }));
      } else {
        setBaseSalary(null);
        setFormData(prev => ({ ...prev, amount: '' }));
      }
    } catch (error) {
      console.error('Error fetching staff salary:', error);
      setBaseSalary(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch sales performance for the selected staff member and period
  const fetchSalesPerformance = async (staffId: string, period: Date) => {
    if (!staffId) return;
    
    try {
      setIsLoadingSales(true);
      
      // Calculate date range for the selected month
      const startDate = startOfMonth(period);
      const endDate = endOfMonth(period);
      
      // Get all sales
      const allSales = await saleService.getAll();
      
      // Filter sales by staff member and date range
      const staffSales = allSales.filter(sale => {
        // Check if the sale was created by this staff member
        const isStaffSale = sale.createdBy && sale.createdBy.uid === staffId;
        
        // Check if the sale is within the date range
        const saleDate = new Date(sale.saleDate);
        const isInDateRange = saleDate >= startDate && saleDate <= endDate;
        
        return isStaffSale && isInDateRange;
      });
      
      // Calculate totals
      const totalSales = staffSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const totalCost = staffSales.reduce((sum, sale) => sum + sale.totalCost, 0);
      const totalProfit = totalSales - totalCost;
      const salesCount = staffSales.length;
      
      setSalesPerformance({
        totalSales,
        totalCost,
        totalProfit,
        salesCount
      });
      
    } catch (error) {
      console.error('Error fetching sales performance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sales performance data",
        variant: "destructive"
      });
      
      // Reset sales performance state
      setSalesPerformance({
        totalSales: 0,
        totalCost: 0,
        totalProfit: 0,
        salesCount: 0
      });
    } finally {
      setIsLoadingSales(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If period changes, update sales performance data
    if (field === 'period' && formData.staffId) {
      fetchSalesPerformance(formData.staffId, value);
    }
  };
  
  // Handle commission change
  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommission(value);
    
    // Calculate new total amount when commission changes
    if (value && !isNaN(parseFloat(value))) {
      const commissionAmount = parseFloat(value);
      const currentAmount = parseFloat(formData.amount) || 0;
      const totalWithDeductionsAndBonuses = 
        baseSalary || 0 + 
        calculateTotalBonuses() - 
        calculateTotalDeductions();
      
      // Set the amount to base salary + bonuses - deductions + commission
      setFormData(prev => ({
        ...prev,
        amount: (totalWithDeductionsAndBonuses + commissionAmount).toString()
      }));
    }
  };
  
  // Add commission as a bonus
  const addCommissionBonus = () => {
    if (!commission || isNaN(parseFloat(commission)) || parseFloat(commission) <= 0) {
      toast({
        title: "Invalid Commission",
        description: "Please enter a valid commission amount",
        variant: "destructive"
      });
      return;
    }
    
    const commissionAmount = parseFloat(commission);
    
    // Add as a bonus
    setFormData(prev => ({
      ...prev,
      bonuses: [...prev.bonuses, { 
        reason: `Sales Commission (${format(formData.period, 'MMMM yyyy')})`, 
        amount: commissionAmount 
      }]
    }));
    
    // Update amount after adding commission
    const currentAmount = parseFloat(formData.amount) || 0;
    
    // Reset commission input
    setCommission('');
  };
  
  // Add deduction
  const addDeduction = () => {
    if (!newDeduction.reason || !newDeduction.amount) {
      toast({
        title: "Invalid Input",
        description: "Please enter both reason and amount for the deduction",
        variant: "destructive"
      });
      return;
    }
    
    const amount = parseFloat(newDeduction.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Deduction amount must be a positive number",
        variant: "destructive"
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      deductions: [...prev.deductions, { reason: newDeduction.reason, amount }]
    }));
    
    // Update amount after deduction
    const currentAmount = parseFloat(formData.amount) || 0;
    setFormData(prev => ({
      ...prev,
      amount: (currentAmount - amount).toString()
    }));
    
    // Reset deduction fields
    setNewDeduction({ reason: '', amount: '' });
  };
  
  // Remove deduction
  const removeDeduction = (index: number) => {
    const deduction = formData.deductions[index];
    
    // Update amount after removing deduction
    const currentAmount = parseFloat(formData.amount) || 0;
    setFormData(prev => ({
      ...prev,
      amount: (currentAmount + deduction.amount).toString(),
      deductions: prev.deductions.filter((_, i) => i !== index)
    }));
  };
  
  // Add bonus
  const addBonus = () => {
    if (!newBonus.reason || !newBonus.amount) {
      toast({
        title: "Invalid Input",
        description: "Please enter both reason and amount for the bonus",
        variant: "destructive"
      });
      return;
    }
    
    const amount = parseFloat(newBonus.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Bonus amount must be a positive number",
        variant: "destructive"
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      bonuses: [...prev.bonuses, { reason: newBonus.reason, amount }]
    }));
    
    // Update amount after bonus
    const currentAmount = parseFloat(formData.amount) || 0;
    setFormData(prev => ({
      ...prev,
      amount: (currentAmount + amount).toString()
    }));
    
    // Reset bonus fields
    setNewBonus({ reason: '', amount: '' });
  };
  
  // Remove bonus
  const removeBonus = (index: number) => {
    const bonus = formData.bonuses[index];
    
    // Update amount after removing bonus
    const currentAmount = parseFloat(formData.amount) || 0;
    setFormData(prev => ({
      ...prev,
      amount: (currentAmount - bonus.amount).toString(),
      bonuses: prev.bonuses.filter((_, i) => i !== index)
    }));
  };
  
  // Validate form before submission
  const validateForm = () => {
    if (!formData.staffId) {
      toast({
        title: "Staff Required",
        description: "Please select a staff member",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.paymentDate) {
      toast({
        title: "Payment Date Required",
        description: "Please select a payment date",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const paymentData: Omit<SalaryPayment, 'id'> = {
      staffId: formData.staffId,
      amount: parseFloat(formData.amount),
      paymentDate: formData.paymentDate.toISOString(),
      period: formData.period.toISOString(),
      paymentMethod: formData.paymentMethod,
      description: formData.description,
      deductions: formData.deductions,
      bonuses: formData.bonuses,
      createdAt: new Date().toISOString()
    };
    
    onAddSalary(paymentData);
    
    // Reset form if not in dialog mode
    if (!isDialog) {
      setFormData({
        staffId: '',
        amount: '',
        paymentDate: new Date(),
        period: startOfMonth(new Date()),
        paymentMethod: 'bank_transfer',
        description: '',
        deductions: [],
        bonuses: []
      });
      setBaseSalary(null);
      setSalesPerformance({
        totalSales: 0,
        totalCost: 0,
        totalProfit: 0,
        salesCount: 0
      });
      setCommission('');
    }
  };
  
  const getStaffName = (staffId: string) => {
    const staff = staffList.find(s => s.uid === staffId);
    return staff?.displayName || staff?.email || 'Unknown Staff';
  };
  
  // Calculate totals
  const calculateTotalDeductions = () => {
    return formData.deductions.reduce((sum, item) => sum + item.amount, 0);
  };
  
  const calculateTotalBonuses = () => {
    return formData.bonuses.reduce((sum, item) => sum + item.amount, 0);
  };
  
  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", isDialog ? "max-h-[60vh] overflow-y-auto pr-1" : "")}>
      {/* Staff Selection */}
      <div className="space-y-2">
        <Label htmlFor="staffId">Staff Member</Label>
        <Select 
          value={formData.staffId} 
          onValueChange={(value) => {
            handleInputChange('staffId', value);
            fetchStaffSalary(value);
            fetchSalesPerformance(value, formData.period);
          }}
        >
          <SelectTrigger id="staffId">
            <SelectValue placeholder="Select staff member" />
          </SelectTrigger>
          <SelectContent>
            {staffList.map((staff) => (
              <SelectItem key={staff.uid} value={staff.uid}>
                {staff.displayName || staff.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Base Salary Info */}
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading salary information...</span>
        </div>
      ) : formData.staffId && baseSalary !== null ? (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex justify-between items-baseline">
              <p className="text-sm text-blue-700">Base Salary for {getStaffName(formData.staffId)}</p>
              <p className="text-lg font-bold text-blue-800">Rs{baseSalary.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      ) : formData.staffId ? (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-amber-700">No base salary information found for this staff member. You'll need to enter the payment amount manually.</p>
          </CardContent>
        </Card>
      ) : null}
      
      {/* Attendance Summary - Show only when a staff is selected */}
      {formData.staffId && (
        <SimplifiedStaffAttendanceSummary 
          staffId={formData.staffId} 
          period={formData.period}
          staffList={staffList}
        />
      )}
      
      {/* NEW: Sales Performance Section */}
      {formData.staffId && (
        <Card className="border-green-200">
          <CardHeader className="bg-green-50 border-b border-green-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">Sales Performance</CardTitle>
            </div>
            <CardDescription className="text-green-700">
              {format(formData.period, 'MMMM yyyy')} sales statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingSales ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading sales data...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="border rounded-md p-3 bg-green-50">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-sm font-medium">Sales Count</span>
                    </div>
                    <p className="text-xl font-bold mt-1 text-green-700">{salesPerformance.salesCount}</p>
                  </div>
                  
                  <div className="border rounded-md p-3 bg-blue-50">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm font-medium">Total Sales</span>
                    </div>
                    <p className="text-xl font-bold mt-1 text-blue-700">Rs{salesPerformance.totalSales.toLocaleString()}</p>
                  </div>
                  
                  <div className="border rounded-md p-3 bg-amber-50">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-amber-600" />
                      <span className="text-sm font-medium">Total Cost</span>
                    </div>
                    <p className="text-xl font-bold mt-1 text-amber-700">Rs{salesPerformance.totalCost.toLocaleString()}</p>
                  </div>
                  
                  <div className="border rounded-md p-3 bg-purple-50">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
                      <span className="text-sm font-medium">Total Profit</span>
                    </div>
                    <p className="text-xl font-bold mt-1 text-purple-700">Rs{salesPerformance.totalProfit.toLocaleString()}</p>
                  </div>
                </div>
                
                {/* Commission Entry */}
                <div className="pt-2">
                  <Label htmlFor="commission" className="text-sm font-medium">Add Sales Commission</Label>
                  <div className="flex space-x-2 mt-1">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <Input
                        id="commission"
                        type="number"
                        value={commission}
                        onChange={handleCommissionChange}
                        placeholder="Enter commission amount"
                        className="pl-10"
                      />
                    </div>
                    <Button 
                      type="button" 
                      onClick={addCommissionBonus} 
                      disabled={!commission || isNaN(parseFloat(commission)) || parseFloat(commission) <= 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Commission
                    </Button>
                  </div>
                  
                  {/* Commission Guidelines (optional) */}
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p>Suggested commission: {salesPerformance.totalProfit > 0 ? `Rs${(salesPerformance.totalProfit * 0.05).toLocaleString()} (5% of profit)` : 'N/A'}</p>
                    <p>Commission will be added as a bonus to the final salary payment.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Payment Amount</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="0.00"
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) => handleInputChange('paymentMethod', value)}
          >
            <SelectTrigger id="paymentMethod">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="check">Check</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="paymentDate">Payment Date</Label>
          <DatePicker 
            date={formData.paymentDate} 
            setDate={(date) => handleInputChange('paymentDate', date)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="period">Salary Period</Label>
          <div className="relative">
            <Input
              id="period"
              type="text"
              value={format(formData.period, 'MMMM yyyy')}
              readOnly
              className="pl-10"
            />
            <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-0 top-0 h-10 w-10"
              onClick={() => {
                // In a real implementation, we would show a month picker here
                // For now, we'll just use the current month
                handleInputChange('period', startOfMonth(new Date()));
                toast({
                  title: "Month Selection",
                  description: "A proper month selector would be implemented in production",
                  variant: "default"
                });
              }}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Deductions */}
      <div className="space-y-2">
        <Label>Deductions</Label>
        {formData.deductions.length > 0 && (
          <Card className="mb-3">
            <CardContent className="pt-4">
              <ul className="space-y-2">
                {formData.deductions.map((deduction, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{deduction.reason}</span>
                      <span className="ml-2 text-red-600">-Rs{deduction.amount.toLocaleString()}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeduction(index)}
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center pt-2 mt-2 border-t">
                <span className="font-medium">Total Deductions</span>
                <span className="font-bold text-red-600">-Rs{calculateTotalDeductions().toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex space-x-2">
          <Input
            placeholder="Reason (e.g., Tax, Advance)"
            value={newDeduction.reason}
            onChange={(e) => setNewDeduction(prev => ({ ...prev, reason: e.target.value }))}
          />
          <div className="relative min-w-[120px]">
            <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              type="number"
              placeholder="Amount"
              value={newDeduction.amount}
              onChange={(e) => setNewDeduction(prev => ({ ...prev, amount: e.target.value }))}
              className="pl-10"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addDeduction}
            disabled={!newDeduction.reason || !newDeduction.amount}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
      
      {/* Bonuses */}
      <div className="space-y-2">
        <Label>Bonuses</Label>
        {formData.bonuses.length > 0 && (
          <Card className="mb-3">
            <CardContent className="pt-4">
              <ul className="space-y-2">
                {formData.bonuses.map((bonus, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{bonus.reason}</span>
                      <span className="ml-2 text-green-600">+Rs{bonus.amount.toLocaleString()}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBonus(index)}
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center pt-2 mt-2 border-t">
                <span className="font-medium">Total Bonuses</span>
                <span className="font-bold text-green-600">+Rs{calculateTotalBonuses().toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex space-x-2">
          <Input
            placeholder="Reason (e.g., Performance, Overtime)"
            value={newBonus.reason}
            onChange={(e) => setNewBonus(prev => ({ ...prev, reason: e.target.value }))}
          />
          <div className="relative min-w-[120px]">
            <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              type="number"
              placeholder="Amount"
              value={newBonus.amount}
              onChange={(e) => setNewBonus(prev => ({ ...prev, amount: e.target.value }))}
              className="pl-10"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addBonus}
            disabled={!newBonus.reason || !newBonus.amount}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
      
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Additional notes about this payment"
          rows={3}
        />
      </div>
      
      {/* Summary */}
      <Card className="bg-gray-50">
        <CardHeader className="py-3">
          <CardTitle className="text-lg">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span>Base Amount</span>
              <span className="font-medium">
                Rs{(baseSalary || 0).toLocaleString()}
              </span>
            </div>
            {formData.deductions.length > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span>Total Deductions</span>
                <span className="font-medium">-Rs{calculateTotalDeductions().toLocaleString()}</span>
              </div>
            )}
            {formData.bonuses.length > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>Total Bonuses</span>
                <span className="font-medium">+Rs{calculateTotalBonuses().toLocaleString()}</span>
              </div>
            )}
            {/* Show sales commission (from bonuses) */}
            {formData.bonuses.some(bonus => bonus.reason.includes('Sales Commission')) && (
              <div className="flex justify-between items-center text-purple-600">
                <span>Included Sales Commission</span>
                <span className="font-medium">+Rs{formData.bonuses
                  .filter(bonus => bonus.reason.includes('Sales Commission'))
                  .reduce((sum, bonus) => sum + bonus.amount, 0)
                  .toLocaleString()}</span>
              </div>
            )}
            <div className="border-t pt-1 mt-1">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Final Amount</span>
                <span>Rs{(parseFloat(formData.amount) || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Submit Button */}
      <div className="pt-2">
        <Button 
          type="submit" 
          size="lg" 
          className="w-full"
          disabled={!formData.staffId || !formData.amount || isLoading}
        >
          Process Salary Payment
        </Button>
      </div>
    </form>
  );
}