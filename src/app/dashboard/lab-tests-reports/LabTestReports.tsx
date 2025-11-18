// src/components/reports/LabTestReports.tsx
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
import { CalendarIcon, Filter, Download, X, TestTube, DollarSign } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { saleService } from '@/services/saleService';
import { labService } from '@/services/labService';
import { labTestService } from '@/services/labTestService';
import { staffService } from '@/services/staffService';
import { Sale } from '@/types/sale';
import { Lab } from '@/types/lab';
import { LabTest } from '@/types/labTest';
import { StaffUser } from '@/types/staff';
import * as XLSX from 'xlsx';

interface LabTestReportItem {
  saleId: string;
  saleDate: Date;
  patientName: string;
  patientPhone: string;
  patientType: 'local';
  labName: string;
  testName: string;
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

interface LabTestReportsProps {
  onBack?: () => void;
}

export const LabTestReports: React.FC<LabTestReportsProps> = ({ onBack }) => {
  const { toast } = useToast();

  // Data states
  const [sales, setSales] = useState<Sale[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [patientNameFilter, setPatientNameFilter] = useState('');
  const [selectedLab, setSelectedLab] = useState<string>('all');
  const [selectedLabTest, setSelectedLabTest] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            console.log('Loading initial data...');
            
            const [salesData, labsData, labTestsData, staffData] = await Promise.all([
            saleService.getAll(),
            labService.getAll(),
            labTestService.getAll(),
            staffService.getAllStaff() // ✅ Correct method name
            ]);

            // Add detailed debugging
            console.log('Raw sales data:', salesData.length);
            console.log('Sales with lab tests:', salesData.filter(sale => sale.labTests && sale.labTests.length > 0).length);
            
            // Log a sample sale with lab tests to see the structure
            const sampleSaleWithTests = salesData.find(sale => sale.labTests && sale.labTests.length > 0);
            if (sampleSaleWithTests) {
            console.log('Sample sale with lab tests:', sampleSaleWithTests);
            console.log('Lab tests structure:', sampleSaleWithTests.labTests);
            } else {
            console.log('No sales with lab tests found!');
            }
            
            console.log('Labs data:', labsData.length);
            console.log('Lab tests data:', labTestsData.length);
            console.log('Staff data:', staffData.length);

            setSales(salesData);
            setLabs(labsData.filter(lab => lab.isActive));
            setLabTests(labTestsData.filter(test => test.isActive));
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

  // Process sales data into lab test report items
  const labTestReportItems = useMemo(() => {
    const items: LabTestReportItem[] = [];
    console.log('Processing sales for lab test reports...', sales.length);


      // Debug log for each sale
      sales.forEach(sale => {
        console.log('Processing sale:', sale.id, 'Lab tests:', sale.labTests?.length || 0);
        
        // Only process sales that have lab tests
        if (!sale.labTests || sale.labTests.length === 0) return;

        // Only process local patients
        const patientType = 'local';
        
        // Add comprehensive debugging
        console.log('Sale customer data:', {
            customer: sale.customer,
            customerInfo: sale.customerInfo,
            saleId: sale.id
        });
        
        // Try multiple ways to get patient data
        const patientName = sale.customer?.name || 
                            sale.customerInfo?.name || 
                            (sale as any).customer?.name ||
                            (sale as any).customerInfo?.name ||
                            'Walk-in Patient';
                            
        const patientPhone = sale.customer?.mobile || 
                            sale.customer?.phone || 
                            sale.customerInfo?.mobile || 
                            (sale as any).customer?.mobile ||
                            (sale as any).customer?.phone ||
                            (sale as any).customerInfo?.mobile ||
                            '';

        console.log('Extracted patient data:', { patientName, patientPhone });


      sale.labTests.forEach((labTest, index) => {
        console.log('Processing lab test:', labTest);
        
        // Find lab name from lab ID if needed
        const lab = labs.find(l => l.id === labTest.labId);
        const labName = lab?.name || labTest.labName || 'Unknown Lab';

        // Find test details
        const testDetails = labTests.find(t => t.id === labTest.id);
        const testName = testDetails?.name || labTest.name || 'Unknown Test';

        // Calculate amounts for local patients only
        const price = labTest.price || 0;
        const total = labTest.total || 0;

        const reportItem: LabTestReportItem = {
          saleId: sale.id || '',
          saleDate: sale.saleDate,
          patientName,
          patientPhone,
          patientType: 'local',
          labName,
          testName,
          invNo: labTest.invNo || '',
          price,
          quantity: labTest.quantity || 1,
          total,
          createdBy: sale.createdBy || { uid: null, name: 'Unknown', email: null },
          isInsurancePatient: sale.isInsurancePatient || false
        };

        console.log('Created report item:', reportItem);
        items.push(reportItem);
      });
    });

    console.log('Total lab test report items created:', items.length);
    return items.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());
  }, [sales, labs, labTests]);

  // Filter lab test report items
  const filteredLabTestItems = useMemo(() => {
    let filtered = [...labTestReportItems];

    // Filter by date range
    if (dateRange.from) {
      const startDate = new Date(dateRange.from);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(item => item.saleDate >= startDate);

      if (dateRange.to) {
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => item.saleDate <= endDate);
      }
    }

    // Filter by patient name
    if (patientNameFilter.trim()) {
      const query = patientNameFilter.toLowerCase();
      filtered = filtered.filter(item => 
        item.patientName.toLowerCase().includes(query) ||
        item.patientPhone.toLowerCase().includes(query)
      );
    }

    // Filter by lab
    if (selectedLab !== 'all') {
      filtered = filtered.filter(item => {
        const lab = labs.find(l => l.name === item.labName);
        return lab?.id === selectedLab;
      });
    }

    // Filter by lab test
    if (selectedLabTest !== 'all') {
      filtered = filtered.filter(item => {
        const test = labTests.find(t => t.name === item.testName);
        return test?.id === selectedLabTest;
      });
    }

    // Filter by staff member
    if (selectedStaff !== 'all') {
      filtered = filtered.filter(item => item.createdBy.uid === selectedStaff);
    }

    console.log('Filtered lab test items:', filtered.length);
    return filtered;
  }, [
    labTestReportItems, 
    dateRange, 
    patientNameFilter, 
    selectedLab, 
    selectedLabTest, 
    selectedStaff,
    labs,
    labTests
  ]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const stats = {
      totalTests: filteredLabTestItems.length,
      totalRevenueLKR: filteredLabTestItems.reduce((sum, item) => sum + item.total, 0)
    };

    return stats;
  }, [filteredLabTestItems]);

  // Clear filters
  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setPatientNameFilter('');
    setSelectedLab('all');
    setSelectedLabTest('all');
    setSelectedStaff('all');
  };

  // Export to Excel
  const handleExport = useCallback(() => {
    setExporting(true);

    try {
      // Prepare data for export
      const exportData = filteredLabTestItems.map(item => {
        return {
          'Date': format(item.saleDate, 'dd/MM/yyyy'),
          'Time': format(item.saleDate, 'HH:mm'),
          'Patient Name': item.patientName,
          'Patient Phone': item.patientPhone,
          'Lab Name': item.labName,
          'Test Name': item.testName,
          'Invoice No': item.invNo,
          'Price (LKR)': item.price,
          'Quantity': item.quantity,
          'Total (LKR)': item.total,
          'Created By': item.createdBy.name,
          'Insurance Patient': item.isInsurancePatient ? 'Yes' : 'No'
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 8 },  // Time
        { wch: 20 }, // Patient Name
        { wch: 15 }, // Patient Phone
        { wch: 20 }, // Lab Name
        { wch: 25 }, // Test Name
        { wch: 15 }, // Invoice No
        { wch: 15 }, // Price (LKR)
        { wch: 10 }, // Quantity
        { wch: 15 }, // Total (LKR)
        { wch: 15 }, // Created By
        { wch: 12 }  // Insurance Patient
      ];
      ws['!cols'] = colWidths;

      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lab Test Reports');

      // Generate filename
      const dateString = dateRange.from && dateRange.to 
        ? `${format(dateRange.from, 'yyyyMMdd')}_${format(dateRange.to, 'yyyyMMdd')}`
        : format(new Date(), 'yyyyMMdd');

      XLSX.writeFile(wb, `Lab_Test_Reports_Local_${dateString}.xlsx`);

      toast({
        title: "Export Successful",
        description: "Lab test report has been exported to Excel",
        variant: "default",
      });
    } catch (error) {
      console.error('Error exporting lab test report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export lab test report",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  }, [filteredLabTestItems, dateRange, toast]);

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
          <h1 className="text-3xl font-bold tracking-tight">Lab Test Reports</h1>
          <p className="text-muted-foreground">
            View and analyze lab test sales data for local patients
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleExport} 
            disabled={exporting || filteredLabTestItems.length === 0}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TestTube className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                <div className="text-2xl font-bold">{summaryStats.totalTests}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue (LKR)</p>
                <div className="text-2xl font-bold">Rs. {summaryStats.totalRevenueLKR.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>From Date</Label>
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
                <PopoverContent className="w-auto p-0">
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
              <Label>To Date</Label>
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
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Patient Name */}
            <div className="space-y-2">
              <Label>Patient Name/Phone</Label>
              <Input
                placeholder="Search patient..."
                value={patientNameFilter}
                onChange={(e) => setPatientNameFilter(e.target.value)}
              />
            </div>

            {/* Lab Filter */}
            <div className="space-y-2">
              <Label>Lab</Label>
              <Select value={selectedLab} onValueChange={setSelectedLab}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lab" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Labs</SelectItem>
                  {labs.map(lab => (
                    <SelectItem key={lab.id} value={lab.id!}>
                      {lab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lab Test Filter */}
            <div className="space-y-2">
              <Label>Lab Test</Label>
              <Select value={selectedLabTest} onValueChange={setSelectedLabTest}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tests</SelectItem>
                  {labTests.map(test => (
                    <SelectItem key={test.id} value={test.id!}>
                      {test.name}
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
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffMembers.map(staff => (
                    <SelectItem key={staff.uid} value={staff.uid}>
                      {staff.displayName || staff.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4">
            <Button 
              onClick={clearFilters} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lab Test Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lab Test Reports</CardTitle>
            <div className="text-sm text-muted-foreground">
              {filteredLabTestItems.length} record(s) found
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LabTestReportTable items={filteredLabTestItems} />
        </CardContent>
      </Card>
    </div>
  );
};

// Table component for lab test reports
interface LabTestReportTableProps {
  items: LabTestReportItem[];
}

const LabTestReportTable: React.FC<LabTestReportTableProps> = ({ 
  items
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No lab test records found. Try adjusting your filters or check if you have any sales with lab tests.
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
                <th className="text-left p-3 font-medium">Patient Name & Phone</th>
                <th className="text-left p-3 font-medium">Lab Name</th>
                <th className="text-left p-3 font-medium">Test Name</th>
                <th className="text-left p-3 font-medium">Invoice No</th>
                <th className="text-left p-3 font-medium">Price (LKR)</th>
                <th className="text-left p-3 font-medium">Qty</th>
                <th className="text-left p-3 font-medium">Total (LKR)</th>
                <th className="text-left p-3 font-medium">Created By</th>
            </tr>
            </thead>
            <tbody>
            {items.map((item, index) => (
                <tr key={`${item.saleId}-${index}`} className="border-b hover:bg-muted/50">
                <td className="p-3">
                    <div>
                    <div className="font-medium">{format(item.saleDate, 'dd/MM/yyyy')}</div>
                    <div className="text-sm text-muted-foreground">{format(item.saleDate, 'HH:mm')}</div>
                    </div>
                </td>
                <td className="p-3">
                    <div>
                    <div className="font-medium">{item.patientName}</div>
                    <div className="text-sm text-muted-foreground">
                        {item.patientPhone || 'No phone number'}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default" className="text-xs">
                        Local
                        </Badge>
                        {item.isInsurancePatient && (
                        <Badge variant="outline" className="text-xs">Insurance</Badge>
                        )}
                    </div>
                    </div>
                </td>
                <td className="p-3 font-medium">{item.labName}</td>
                <td className="p-3 font-medium">{item.testName}</td>
                <td className="p-3">{item.invNo || '-'}</td>
                <td className="p-3">Rs. {item.price.toLocaleString()}</td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3 font-medium">Rs. {item.total.toLocaleString()}</td>
                <td className="p-3">
                    <div className="text-sm font-medium">{item.createdBy.name}</div>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};