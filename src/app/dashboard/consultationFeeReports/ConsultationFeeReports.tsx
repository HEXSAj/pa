// src/app/dashboard/reports/consultation-fees/ConsultationFeeReports.tsx
'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, Download, X, Stethoscope, Users, DollarSign, Shield } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { saleService } from '@/services/saleService';
import { staffService } from '@/services/staffService';
import { Sale } from '@/types/sale';
import { StaffUser } from '@/types/staff';
import * as XLSX from 'xlsx';

interface ConsultationFeeReportItem {
  saleId: string;
  saleDate: Date;
  patientName: string;
  patientPhone: string;
  patientType: 'local' | 'foreign';
  invNo: string;
  consultationFee: number;
  usdAmount?: number;
  totalLKR: number;
  totalUSD?: number;
  createdBy: {
    uid: string | null;
    name: string;
    email: string | null;
  };
  isInsurancePatient: boolean;
}

interface ConsultationFeeReportsProps {
  onBack?: () => void;
}

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export const ConsultationFeeReports: React.FC<ConsultationFeeReportsProps> = ({ onBack }) => {
  const { toast } = useToast();

  // Data states
  const [sales, setSales] = useState<Sale[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [activeTab, setActiveTab] = useState<'all' | 'local' | 'foreign'>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [patientNameFilter, setPatientNameFilter] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('Loading initial data for consultation reports...');
      
      const [salesData, staffData] = await Promise.all([
        saleService.getAll(),
        staffService.getAllStaff()
      ]);

      // Filter sales that have consultations:
      // 1. Sales with OPD charges > 0 (regular consultations)
      // 2. Sales with isInsurancePatient = true (insurance consultations)
      const salesWithConsultations = salesData.filter(sale => {
        const hasOpdCharges = sale.opdCharges && sale.opdCharges > 0;
        const isInsuranceConsultation = sale.isInsurancePatient === true;
        
        // Include if either has OPD charges OR is an insurance patient
        return hasOpdCharges || isInsuranceConsultation;
      });

      console.log('Raw sales data:', salesData.length);
      console.log('Sales with OPD charges:', salesData.filter(s => s.opdCharges && s.opdCharges > 0).length);
      console.log('Insurance sales:', salesData.filter(s => s.isInsurancePatient === true).length);
      console.log('Total sales with consultations:', salesWithConsultations.length);
      
      setSales(salesWithConsultations);
      setStaffMembers(staffData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Process sales data into consultation report items
  const consultationReportItems = useMemo(() => {
    const items: ConsultationFeeReportItem[] = [];
    console.log('Processing sales for consultation reports...', sales.length);

    sales.forEach(sale => {
      const patientType = sale.patientType || 'local';
      const isInsurancePatient = sale.isInsurancePatient || false;
      
      // Get patient data
      const patientName = sale.customer?.name || 
                          sale.customerInfo?.name || 
                          'Walk-in Patient';
                          
      const patientPhone = sale.customer?.mobile || 
                          sale.customer?.phone || 
                          sale.customerInfo?.mobile || 
                          '';

      // Get created by info
      const createdBy = sale.createdBy || {
        uid: null,
        name: 'Unknown',
        email: null
      };

      // Calculate consultation fee amounts
      let consultationFee = 0;
      let totalLKR = 0;
      let usdAmount: number | undefined;
      let totalUSD: number | undefined;

      // For insurance patients, all amounts are 0
      if (isInsurancePatient) {
        consultationFee = 0;
        totalLKR = 0;
        usdAmount = 0;
        totalUSD = 0;
      } else {
        // For non-insurance patients
        const opdAmount = sale.opdCharges || 0;
        
        if (patientType === 'local') {
          consultationFee = opdAmount;
          totalLKR = opdAmount;
        } else {
          // Foreign patients
          consultationFee = opdAmount;
          totalLKR = opdAmount;
          
          // Try to extract USD amount from payment details if available
          if (sale.paymentDetails) {
            const paymentDetails = sale.paymentDetails as any;
            if (paymentDetails.usdCash || paymentDetails.cardAmount) {
              usdAmount = paymentDetails.usdCash || paymentDetails.cardAmount || 0;
              totalUSD = usdAmount;
            }
          }
          
          // If no USD amount found in payment details, try to estimate from LKR
          if (!usdAmount && opdAmount > 0) {
            // Estimate USD amount (you can adjust this based on your exchange rate logic)
            const estimatedUSD = opdAmount / 320; // Assuming 1 USD = 320 LKR
            usdAmount = Math.round(estimatedUSD * 100) / 100; // Round to 2 decimal places
            totalUSD = usdAmount;
          }
        }
      }

      const consultationItem: ConsultationFeeReportItem = {
        saleId: sale.id!,
        saleDate: sale.saleDate,
        patientName,
        patientPhone,
        patientType,
        invNo: sale.invoiceNumber || `INV-${sale.id?.slice(-6)}`,
        consultationFee,
        usdAmount,
        totalLKR,
        totalUSD,
        createdBy,
        isInsurancePatient
      };

      items.push(consultationItem);
    });

    console.log('Generated consultation report items:', items.length);
    console.log('Insurance consultations:', items.filter(i => i.isInsurancePatient).length);
    return items;
  }, [sales]);

  // Filter consultation report items
  const filteredConsultationItems = useMemo(() => {
    let filtered = [...consultationReportItems];

    // Filter by patient type
    if (activeTab !== 'all') {
      filtered = filtered.filter(item => item.patientType === activeTab);
    }

    // Filter by date range
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.saleDate);
        const fromDate = new Date(dateRange.from!);
        const toDate = new Date(dateRange.to!);
        
        // Set time to start/end of day for proper comparison
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        
        return itemDate >= fromDate && itemDate <= toDate;
      });
    }

    // Filter by patient name
    if (patientNameFilter.trim()) {
      const searchTerm = patientNameFilter.toLowerCase();
      filtered = filtered.filter(item => 
        item.patientName.toLowerCase().includes(searchTerm) ||
        item.patientPhone.includes(searchTerm)
      );
    }

    // Filter by staff member
    if (selectedStaff !== 'all') {
      filtered = filtered.filter(item => item.createdBy.uid === selectedStaff);
    }

    console.log('Filtered consultation items:', filtered.length);
    return filtered;
  }, [
    consultationReportItems, 
    activeTab, 
    dateRange, 
    patientNameFilter, 
    selectedStaff
  ]);

  // Calculate summary statistics - UPDATED to show appropriate currency based on tab
  const summaryStats = useMemo(() => {
    const baseStats = {
      totalConsultations: filteredConsultationItems.length,
      localConsultations: filteredConsultationItems.filter(item => item.patientType === 'local').length,
      foreignConsultations: filteredConsultationItems.filter(item => item.patientType === 'foreign').length,
      insuranceConsultations: filteredConsultationItems.filter(item => item.isInsurancePatient).length,
    };

    // Calculate revenue based on active tab
    if (activeTab === 'local') {
      // Local tab - only LKR revenue
      return {
        ...baseStats,
        totalRevenueLKR: filteredConsultationItems
          .filter(item => !item.isInsurancePatient && item.patientType === 'local')
          .reduce((sum, item) => sum + item.totalLKR, 0),
        totalRevenueUSD: 0,
        showLKR: true,
        showUSD: false
      };
    } else if (activeTab === 'foreign') {
      // Foreign tab - only USD revenue
      return {
        ...baseStats,
        totalRevenueLKR: 0,
        totalRevenueUSD: filteredConsultationItems
          .filter(item => !item.isInsurancePatient && item.patientType === 'foreign')
          .reduce((sum, item) => sum + (item.totalUSD || 0), 0),
        showLKR: false,
        showUSD: true
      };
    } else {
      // All tab - show both currencies
      return {
        ...baseStats,
        totalRevenueLKR: filteredConsultationItems
          .filter(item => !item.isInsurancePatient)
          .reduce((sum, item) => sum + item.totalLKR, 0),
        totalRevenueUSD: filteredConsultationItems
          .filter(item => !item.isInsurancePatient)
          .reduce((sum, item) => sum + (item.totalUSD || 0), 0),
        showLKR: true,
        showUSD: true
      };
    }
  }, [filteredConsultationItems, activeTab]);

  // Clear filters
  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setPatientNameFilter('');
    setSelectedStaff('all');
  };

  // Export to Excel
  const handleExport = useCallback(() => {
    setExporting(true);

    try {
      // Prepare data for export
      const exportData = filteredConsultationItems.map(item => {
        const baseData = {
          'Date': format(item.saleDate, 'dd/MM/yyyy'),
          'Time': format(item.saleDate, 'HH:mm'),
          'Patient Name': item.patientName,
          'Patient Phone': item.patientPhone,
          'Patient Type': item.patientType.charAt(0).toUpperCase() + item.patientType.slice(1),
          'Invoice No': item.invNo,
          'Created By': item.createdBy.name,
          'Insurance Patient': item.isInsurancePatient ? 'Yes' : 'No'
        };

        if (item.patientType === 'local') {
          return {
            ...baseData,
            'Consultation Fee (LKR)': item.isInsurancePatient ? 0 : item.consultationFee,
            'Total (LKR)': item.isInsurancePatient ? 0 : item.totalLKR
          };
        } else {
          // Foreign patients
          return {
            ...baseData,
            'USD Amount': item.isInsurancePatient ? 0 : (item.usdAmount || ''),
            'Total USD': item.isInsurancePatient ? 0 : (item.totalUSD || '')
          };
        }
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 8 },  // Time
        { wch: 20 }, // Patient Name
        { wch: 15 }, // Patient Phone
        { wch: 12 }, // Patient Type
        { wch: 15 }, // Invoice No
        { wch: 15 }, // Created By
        { wch: 12 }, // Insurance Patient
        { wch: 20 }, // Consultation Fee or USD Amount
        { wch: 15 }  // Total
      ];
      ws['!cols'] = colWidths;

      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Consultation Fee Reports');

      // Generate filename
      const dateString = dateRange.from && dateRange.to 
        ? `${format(dateRange.from, 'yyyyMMdd')}_${format(dateRange.to, 'yyyyMMdd')}`
        : format(new Date(), 'yyyyMMdd');

      const patientTypeString = activeTab === 'all' ? 'All' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      
      XLSX.writeFile(wb, `Consultation_Fee_Reports_${patientTypeString}_${dateString}.xlsx`);

      toast({
        title: "Export Successful",
        description: "Consultation fee report has been exported to Excel",
        variant: "default",
      });
    } catch (error) {
      console.error('Error exporting consultation fee report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export consultation fee report",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  }, [filteredConsultationItems, dateRange, activeTab, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultation Fee Reports</h1>
          <p className="text-muted-foreground">
            View and analyze consultation fee data for local and foreign patients
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleExport} 
            disabled={exporting || filteredConsultationItems.length === 0}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </Button>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Back
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalConsultations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Local Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.localConsultations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Foreign Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.foreignConsultations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insurance Patients</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.insuranceConsultations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Show appropriate currency based on active tab */}
            {activeTab === 'foreign' ? (
              // Foreign tab - only USD
              <div className="text-2xl font-bold">
                ${summaryStats.totalRevenueUSD.toLocaleString()} USD
              </div>
            ) : activeTab === 'local' ? (
              // Local tab - only LKR
              <div className="text-2xl font-bold">
                Rs {summaryStats.totalRevenueLKR.toLocaleString()}
              </div>
            ) : (
              // All tab - show both
              <>
                <div className="text-2xl font-bold">
                  Rs {summaryStats.totalRevenueLKR.toLocaleString()}
                </div>
                {summaryStats.totalRevenueUSD > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ${summaryStats.totalRevenueUSD.toLocaleString()} USD
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Patient Name Filter */}
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name/Phone</Label>
              <Input
                id="patientName"
                placeholder="Search patient..."
                value={patientNameFilter}
                onChange={(e) => setPatientNameFilter(e.target.value)}
              />
            </div>

            {/* Staff Filter */}
            <div className="space-y-2">
              <Label>Created By</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.uid} value={staff.uid}>
                      {staff.firstName} {staff.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All Consultations ({consultationReportItems.length})
              </TabsTrigger>
              <TabsTrigger value="local">
                Local Patients ({consultationReportItems.filter(item => item.patientType === 'local').length})
              </TabsTrigger>
              <TabsTrigger value="foreign">
                Foreign Patients ({consultationReportItems.filter(item => item.patientType === 'foreign').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <ConsultationReportTable items={filteredConsultationItems} />
            </TabsContent>

            <TabsContent value="local" className="mt-4">
              <ConsultationReportTable 
                items={filteredConsultationItems.filter(item => item.patientType === 'local')} 
                showLocalColumns 
              />
            </TabsContent>

            <TabsContent value="foreign" className="mt-4">
              <ConsultationReportTable 
                items={filteredConsultationItems.filter(item => item.patientType === 'foreign')} 
                showForeignColumns 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Table component for consultation reports
interface ConsultationReportTableProps {
  items: ConsultationFeeReportItem[];
  showLocalColumns?: boolean;
  showForeignColumns?: boolean;
}

const ConsultationReportTable: React.FC<ConsultationReportTableProps> = ({ 
  items, 
  showLocalColumns = false, 
  showForeignColumns = false 
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No consultation records found. Try adjusting your filters or check if you have any sales with consultation fees.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Patient</th>
              <th className="text-left p-3 font-medium">Phone</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Invoice No</th>
              
              {/* Local columns */}
              {showLocalColumns && (
                <>
                  <th className="text-left p-3 font-medium">Fee (LKR)</th>
                  <th className="text-left p-3 font-medium">Total (LKR)</th>
                </>
              )}
              
              {/* Foreign columns - only USD amounts */}
              {showForeignColumns && (
                <>
                  <th className="text-left p-3 font-medium">USD Amount</th>
                  <th className="text-left p-3 font-medium">Total (USD)</th>
                </>
              )}
              
              {/* All tab columns */}
              {!showLocalColumns && !showForeignColumns && (
                <>
                  <th className="text-left p-3 font-medium">Fee</th>
                  <th className="text-left p-3 font-medium">Total</th>
                </>
              )}
              
              <th className="text-left p-3 font-medium">Created By</th>
              <th className="text-left p-3 font-medium">Insurance</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div>
                    <div className="font-medium">
                      {format(item.saleDate, 'dd/MM/yyyy')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(item.saleDate, 'HH:mm')}
                    </div>
                  </div>
                </td>
                <td className="p-3 font-medium">{item.patientName}</td>
                <td className="p-3">{item.patientPhone || 'N/A'}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Badge variant={item.patientType === 'local' ? 'default' : 'secondary'}>
                      {item.patientType.charAt(0).toUpperCase() + item.patientType.slice(1)}
                    </Badge>
                    {item.isInsurancePatient && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        <Shield className="w-3 h-3 mr-1" />
                        Insurance
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-3 font-mono text-sm">{item.invNo}</td>
                
                {/* Local columns */}
                {showLocalColumns && (
                  <>
                    <td className="p-3 font-medium">
                      {item.isInsurancePatient ? (
                        <span className="text-red-600 font-bold">Rs 0</span>
                      ) : (
                        `Rs ${item.consultationFee.toLocaleString()}`
                      )}
                    </td>
                    <td className="p-3 font-medium">
                      {item.isInsurancePatient ? (
                        <span className="text-red-600 font-bold">Rs 0</span>
                      ) : (
                        `Rs ${item.totalLKR.toLocaleString()}`
                      )}
                    </td>
                  </>
                )}
                
                {/* Foreign columns - only USD */}
                {showForeignColumns && (
                  <>
                    <td className="p-3 font-medium">
                      {item.isInsurancePatient ? (
                        <span className="text-red-600 font-bold">$0</span>
                      ) : (
                        item.usdAmount ? `$${item.usdAmount.toLocaleString()}` : 'N/A'
                      )}
                    </td>
                    <td className="p-3 font-medium">
                      {item.isInsurancePatient ? (
                        <span className="text-red-600 font-bold">$0</span>
                      ) : (
                        item.totalUSD ? `$${item.totalUSD.toLocaleString()}` : 'N/A'
                      )}
                    </td>
                  </>
                )}
                
                {/* All tab columns */}
                {!showLocalColumns && !showForeignColumns && (
                  <>
                    <td className="p-3 font-medium">
                      {item.isInsurancePatient ? (
                        <span className="text-red-600 font-bold">
                          {item.patientType === 'foreign' ? '$0' : 'Rs 0'}
                        </span>
                      ) : (
                        item.patientType === 'foreign' ? 
                          (item.usdAmount ? `$${item.usdAmount.toLocaleString()}` : 'N/A') :
                          `Rs ${item.consultationFee.toLocaleString()}`
                      )}
                    </td>
                    <td className="p-3 font-medium">
                      {item.isInsurancePatient ? (
                        <span className="text-red-600 font-bold">
                          {item.patientType === 'foreign' ? '$0' : 'Rs 0'}
                        </span>
                      ) : (
                        item.patientType === 'foreign' ? 
                          (item.totalUSD ? `$${item.totalUSD.toLocaleString()}` : 'N/A') :
                          `Rs ${item.totalLKR.toLocaleString()}`
                      )}
                    </td>
                  </>
                )}
                
                <td className="p-3">{item.createdBy.name}</td>
                <td className="p-3">
                  <Badge variant={item.isInsurancePatient ? 'destructive' : 'outline'}>
                    {item.isInsurancePatient ? 'Yes' : 'No'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};