// src/app/dashboard/proceduresReports/ProcedureReports.tsx
'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, Download, X, Stethoscope, Users, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { saleService } from '@/services/saleService';
import { procedureService } from '@/services/procedureService';
import { staffService } from '@/services/staffService';
import { Sale } from '@/types/sale';
import { Procedure } from '@/types/procedure';
import { StaffUser } from '@/types/staff';
import * as XLSX from 'xlsx';

interface ProcedureReportItem {
  saleId: string;
  saleDate: Date;
  patientName: string;
  patientPhone: string;
  procedureName: string;
  invNo: string;
  price: number; // LKR price for local patients
  quantity: number;
  total: number;
  createdBy: {
    uid: string | null;
    name: string;
    email: string | null;
  };
  isInsurancePatient?: boolean;
}

interface ProcedureReportsProps {
  onBack?: () => void;
}

export const ProcedureReports: React.FC<ProcedureReportsProps> = ({ onBack }) => {
  const { toast } = useToast();

  // Data states
  const [sales, setSales] = useState<Sale[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [patientNameFilter, setPatientNameFilter] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('Loading initial data...');
      
      const [salesData, proceduresData, staffData] = await Promise.all([
        saleService.getAll(),
        procedureService.getAll(),
        staffService.getAllStaff()
      ]);

      // Add detailed debugging
      console.log('Raw sales data:', salesData.length);
      console.log('Sales with procedures:', salesData.filter(sale => sale.procedures && sale.procedures.length > 0).length);
      
      // Log a sample sale with procedures to see the structure
      const sampleSaleWithProcedures = salesData.find(sale => sale.procedures && sale.procedures.length > 0);
      if (sampleSaleWithProcedures) {
        console.log('Sample sale with procedures:', sampleSaleWithProcedures);
        console.log('Procedures structure:', sampleSaleWithProcedures.procedures);
      } else {
        console.log('No sales with procedures found!');
      }
      
      console.log('Procedures data:', proceduresData.length);
      console.log('Staff data:', staffData.length);

      setSales(salesData);
      setProcedures(proceduresData.filter(procedure => procedure.isActive));
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

  // Process sales data into procedure report items
  const procedureReportItems = useMemo(() => {
    const items: ProcedureReportItem[] = [];
    console.log('Processing sales for procedure reports...', sales.length);

    sales.forEach(sale => {
      console.log('Processing sale:', sale.id, 'Procedures:', sale.procedures?.length || 0);
      
      // Only process sales that have procedures
      if (!sale.procedures || sale.procedures.length === 0) return;

      const patientName = sale.customer?.name || sale.customerInfo?.name || 'Walk-in Patient';
      const patientPhone = sale.customer?.mobile || sale.customer?.phone || sale.customerInfo?.mobile || '';

      sale.procedures.forEach(procedure => {
        // For local patients only - use the simplified charge structure
        const procedurePrice = procedure.localPatientCharge || 0;
        const procedureTotal = procedure.total || (procedurePrice * procedure.quantity);

        items.push({
          saleId: sale.id!,
          saleDate: sale.saleDate,
          patientName,
          patientPhone,
          procedureName: procedure.name,
          invNo: sale.invoiceNumber || `INV-${sale.id?.slice(-6)}`,
          price: procedurePrice,
          quantity: procedure.quantity,
          total: procedureTotal,
          createdBy: {
            uid: sale.createdBy?.uid || null,
            name: sale.createdBy?.displayName || sale.createdBy?.email || 'Unknown',
            email: sale.createdBy?.email || null
          },
          isInsurancePatient: sale.isInsurancePatient || false
        });
      });
    });

    console.log('Total procedure report items:', items.length);
    return items;
  }, [sales]);

  // Filter procedures data
  const filteredProcedureItems = useMemo(() => {
    let filtered = procedureReportItems;

    // Filter by date range
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.saleDate);
        return itemDate >= dateRange.from! && itemDate <= dateRange.to!;
      });
    }

    // Filter by patient name
    if (patientNameFilter) {
      filtered = filtered.filter(item =>
        item.patientName.toLowerCase().includes(patientNameFilter.toLowerCase()) ||
        item.patientPhone.includes(patientNameFilter)
      );
    }

    // Filter by procedure
    if (selectedProcedure !== 'all') {
      filtered = filtered.filter(item => item.procedureName === selectedProcedure);
    }

    // Filter by staff
    if (selectedStaff !== 'all') {
      filtered = filtered.filter(item => item.createdBy.uid === selectedStaff);
    }

    return filtered.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }, [procedureReportItems, dateRange, patientNameFilter, selectedProcedure, selectedStaff]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const stats = {
      totalItems: filteredProcedureItems.length,
      totalRevenue: 0,
      uniqueProcedures: new Set<string>(),
      procedureCount: {} as Record<string, number>,
      insurancePatients: 0,
      regularPatients: 0
    };

    filteredProcedureItems.forEach(item => {
      stats.totalRevenue += item.total;
      
      if (item.isInsurancePatient) {
        stats.insurancePatients++;
      } else {
        stats.regularPatients++;
      }

      stats.uniqueProcedures.add(item.procedureName);
      stats.procedureCount[item.procedureName] = (stats.procedureCount[item.procedureName] || 0) + item.quantity;
    });

    return stats;
  }, [filteredProcedureItems]);

  // Export to Excel
  const handleExport = useCallback(async () => {
    if (filteredProcedureItems.length === 0) {
      toast({
        title: "No Data",
        description: "No procedure data to export",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    try {
      // Prepare data for export
      const exportData = filteredProcedureItems.map(item => ({
        'Sale Date': format(item.saleDate, 'yyyy-MM-dd'),
        'Invoice Number': item.invNo,
        'Patient Name': item.patientName,
        'Patient Phone': item.patientPhone,
        'Insurance Patient': item.isInsurancePatient ? 'Yes' : 'No',
        'Procedure Name': item.procedureName,
        'Quantity': item.quantity,
        'Price (LKR)': item.price,
        'Total (LKR)': item.total,
        'Created By': item.createdBy.name
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Procedure Reports");

      // Auto-size columns
      const cols = Object.keys(exportData[0] || {}).map(() => ({ wch: 15 }));
      ws['!cols'] = cols;

      // Generate filename
      const dateString = dateRange.from && dateRange.to 
        ? `${format(dateRange.from, 'yyyyMMdd')}_${format(dateRange.to, 'yyyyMMdd')}`
        : format(new Date(), 'yyyyMMdd');
      
      XLSX.writeFile(wb, `Procedure_Reports_Local_${dateString}.xlsx`);

      toast({
        title: "Export Successful",
        description: "Procedure report has been exported to Excel",
        variant: "default",
      });
    } catch (error) {
      console.error('Error exporting procedure report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export procedure report",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  }, [filteredProcedureItems, dateRange, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-all duration-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Procedure Reports</h1>
                  <p className="text-sm text-gray-600">View and analyze procedure sales data for local patients</p>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button 
                onClick={handleExport} 
                disabled={exporting || filteredProcedureItems.length === 0}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export Excel'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Procedures</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Stethoscope className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{summaryStats.totalItems}</div>
              <p className="text-xs text-gray-600">
                {summaryStats.uniqueProcedures.size} unique procedures
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                Rs. {summaryStats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">
                Local patients only
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Insurance Patients</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {summaryStats.insurancePatients}
              </div>
              <p className="text-xs text-gray-600">
                {summaryStats.regularPatients} regular patients
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Revenue</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                Rs. {summaryStats.totalItems > 0 ? (summaryStats.totalRevenue / summaryStats.totalItems).toLocaleString() : '0'}
              </div>
              <p className="text-xs text-gray-600">
                Per procedure
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Filter className="w-4 h-4 text-indigo-600" />
              </div>
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP") : "Select date"}
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
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP") : "Select date"}
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

            {/* Patient Name Filter */}
            <div className="space-y-2">
              <Label>Patient Name/Phone</Label>
              <Input
                placeholder="Search patient..."
                value={patientNameFilter}
                onChange={(e) => setPatientNameFilter(e.target.value)}
              />
            </div>

            {/* Procedure Filter */}
            <div className="space-y-2">
              <Label>Procedure</Label>
              <Select value={selectedProcedure} onValueChange={setSelectedProcedure}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Procedures</SelectItem>
                  {Array.from(summaryStats.uniqueProcedures).map((procedureName) => (
                    <SelectItem key={procedureName} value={procedureName}>
                      {procedureName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Staff Filter */}
            <div className="space-y-2">
              <Label>Created By</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.uid} value={staff.uid}>
                      {staff.displayName || staff.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

            {/* Clear Filters */}
            {(dateRange.from || dateRange.to || patientNameFilter || selectedProcedure !== 'all' || selectedStaff !== 'all') && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateRange({ from: undefined, to: undefined });
                    setPatientNameFilter('');
                    setSelectedProcedure('all');
                    setSelectedStaff('all');
                  }}
                  className="bg-white/80 hover:bg-white border-gray-200 text-gray-700 hover:border-gray-300 transition-all duration-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Procedure Reports Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              Procedure Reports ({filteredProcedureItems.length} procedures)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProcedureReportsTable items={filteredProcedureItems} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Procedure Reports Table Component
interface ProcedureReportsTableProps {
  items: ProcedureReportItem[];
}

const ProcedureReportsTable: React.FC<ProcedureReportsTableProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Stethoscope className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No procedure reports found</h3>
        <p className="text-gray-500">No procedure data matches your current filter criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Invoice</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Patient</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Procedure</th>
            <th className="text-center py-3 px-4 font-medium text-gray-700">Qty</th>
            <th className="text-right py-3 px-4 font-medium text-gray-700">Price (LKR)</th>
            <th className="text-right py-3 px-4 font-medium text-gray-700">Total (LKR)</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Created By</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200">
              <td className="py-3 px-4 text-sm text-gray-900">
                {format(item.saleDate, 'yyyy-MM-dd')}
              </td>
              <td className="py-3 px-4 text-sm text-gray-900 font-mono">{item.invNo}</td>
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium text-gray-900">{item.patientName}</div>
                  {item.patientPhone && (
                    <div className="text-sm text-gray-500">{item.patientPhone}</div>
                  )}
                  {item.isInsurancePatient && (
                    <Badge variant="secondary" className="text-xs mt-1 bg-blue-100 text-blue-700">
                      Insurance
                    </Badge>
                  )}
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-gray-900">{item.procedureName}</td>
              <td className="py-3 px-4 text-center text-sm text-gray-900">{item.quantity}</td>
              <td className="py-3 px-4 text-right text-sm text-gray-900">
                Rs. {item.price.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                Rs. {item.total.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">{item.createdBy.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};