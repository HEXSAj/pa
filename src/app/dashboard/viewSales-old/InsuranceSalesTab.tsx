// src/app/dashboard/viewSales/InsuranceSalesTab.tsx
import React, { useState, useEffect } from 'react';
import { Sale } from '@/types/sale';
import { Customer } from '@/types/customer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileDown, 
  Calendar, 
  Loader2, 
  ShieldCheck, 
  User,
  FileText,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as XLSX from 'xlsx';

// Filter types
type DateFilterType = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';

interface InsuranceSalesTabProps {
  sales: Sale[];
  onViewDetails: (sale: Sale) => void;
}

const InsuranceSalesTab: React.FC<InsuranceSalesTabProps> = ({ 
  sales, 
  onViewDetails 
}) => {
  // Filter states
  const [dateFilter, setDateFilter] = useState<DateFilterType>('thisMonth');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [isExporting, setIsExporting] = useState(false);

  // Get only insurance sales
  const insuranceSales = sales.filter(sale => sale.isInsurancePatient === true);

  // Apply date filters
  const getFilteredSales = () => {
    let filteredSales = [...insuranceSales];
    
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Monday as first day
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    switch (dateFilter) {
      case 'today':
        filteredSales = filteredSales.filter(sale => 
          sale.saleDate >= startOfDay
        );
        break;
      case 'thisWeek':
        filteredSales = filteredSales.filter(sale => 
          sale.saleDate >= startOfWeek
        );
        break;
      case 'thisMonth':
        filteredSales = filteredSales.filter(sale => 
          sale.saleDate >= startOfMonth
        );
        break;
      case 'thisYear':
        filteredSales = filteredSales.filter(sale => 
          sale.saleDate >= startOfYear
        );
        break;
      case 'custom':
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          
          filteredSales = filteredSales.filter(sale => 
            sale.saleDate >= fromDate
          );
          
          if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            toDate.setHours(23, 59, 59, 999);
            
            filteredSales = filteredSales.filter(sale => 
              sale.saleDate <= toDate
            );
          }
        }
        break;
    }
    
    return filteredSales;
  };

  const filteredSales = getFilteredSales();
  
  // Generate summary data
//   const generateSummaryData = () => {
//     // Count unique patients
//     const uniquePatients = new Set();
    
//     // Calculate totals
//     let totalCost = 0;
//     let totalSales = 0;
//     let totalItems = 0;
//     let prescriptionCount = 0;
    
//     filteredSales.forEach(sale => {
//       // Add customer to unique set if there is one
//       if (sale.customerId) {
//         uniquePatients.add(sale.customerId);
//       }
      
//       // Add to totals
//       totalCost += sale.totalCost;
//       totalSales += sale.totalAmount;
//       totalItems += sale.items.length;
      
//       // Count prescriptions
//       if (sale.invoiceNumber) {
//         prescriptionCount++;
//       }
//     });
    
//     return {
//       uniquePatients: uniquePatients.size,
//       totalCost,
//       totalSales,
//       totalItems,
//       prescriptionCount,
//       saleCount: filteredSales.length
//     };
//   };

const generateSummaryData = () => {
    // Count unique patients with IDs
    const uniquePatients = new Set();
    // Count one-time (walk-in) customers by generating a unique identifier for each
    const walkInPatients = new Set();
    
    // Calculate totals
    let totalCost = 0;
    let totalSales = 0;
    let totalItems = 0;
    let prescriptionCount = 0;
    
    filteredSales.forEach(sale => {
      // Add customer to unique set if there is one with ID
      if (sale.customerId) {
        uniquePatients.add(sale.customerId);
      } 
      // For walk-in customers, we'll use the sale.id as a unique identifier
      // or the customer name if available
      else if (sale.customer?.name) {
        walkInPatients.add(`name-${sale.customer.name}-${sale.id}`);
      } else {
        walkInPatients.add(`walk-in-${sale.id}`);
      }
      
      // Add to totals
      totalCost += sale.totalCost;
      totalSales += sale.totalAmount;
      totalItems += sale.items.length;
      
      // Count prescriptions
      if (sale.invoiceNumber) {
        prescriptionCount++;
      }
    });
    
    // Total patient count is registered + walk-in
    const totalPatientCount = uniquePatients.size + walkInPatients.size;
    
    return {
      uniquePatients: totalPatientCount, // Combined count
      registeredPatients: uniquePatients.size, // Registered patients with IDs
      walkInPatients: walkInPatients.size, // Walk-in patients
      totalCost,
      totalSales,
      totalItems,
      prescriptionCount,
      saleCount: filteredSales.length
    };
  };
  
  const summaryData = generateSummaryData();
  
  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Format data for export
      const exportData = filteredSales.map(sale => ({
        'Invoice Number': sale.invoiceNumber || '-',
        'Date': format(sale.saleDate, 'dd/MM/yyyy'),
        'Time': format(sale.saleDate, 'hh:mm a'),
        'Customer': sale.customer?.name || 'Walk-in Customer',
        'Mobile': sale.customer?.mobile || '-',
        'Items Count': sale.items.length,
        'Total Amount (Rs)': parseFloat(sale.totalAmount.toFixed(2)),
        'Total Cost (Rs)': parseFloat(sale.totalCost.toFixed(2)),
        'Items': sale.items.map(item => `${item.item.name} (${item.unitQuantity} units)`).join(', '),
        'Created By': sale.createdBy?.displayName || 'Unknown'
      }));
      
      // Create summary sheet data
      const summarySheetData = [
        { 'Summary': 'Value' },
        { 'Summary': 'Date Range', 'Value': getDateRangeText() },
        { 'Summary': 'Total Insurance Sales', 'Value': summaryData.saleCount },
        { 'Summary': 'Total Unique Patients', 'Value': summaryData.uniquePatients },
        { 'Summary': 'Total Prescriptions', 'Value': summaryData.prescriptionCount },
        { 'Summary': 'Total Items Sold', 'Value': summaryData.totalItems },
        { 'Summary': 'Total Sales Amount (Rs)', 'Value': parseFloat(summaryData.totalSales.toFixed(2)) },
        { 'Summary': 'Total Cost Amount (Rs)', 'Value': parseFloat(summaryData.totalCost.toFixed(2)) },
      ];
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add sales data sheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Insurance Sales');
      
      // Add summary sheet
      const summaryWs = XLSX.utils.json_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Auto-size columns for both sheets
      const salesColWidths = [
        { wch: 15 }, // Invoice Number
        { wch: 12 }, // Date
        { wch: 10 }, // Time
        { wch: 25 }, // Customer
        { wch: 15 }, // Mobile
        { wch: 12 }, // Items Count
        { wch: 15 }, // Total Amount
        { wch: 15 }, // Total Cost
        { wch: 50 }, // Items
        { wch: 20 }  // Created By
      ];
      ws['!cols'] = salesColWidths;
      
      const summaryColWidths = [
        { wch: 25 }, // Summary
        { wch: 20 }  // Value
      ];
      summaryWs['!cols'] = summaryColWidths;
      
      // Generate date string for filename
      const dateStr = format(new Date(), 'yyyyMMdd');
      
      // Generate filename
      const filename = `Insurance_Sales_Report_${dateStr}.xlsx`;
      
      // Export file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting insurance sales data:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Helper to get date range text
  const getDateRangeText = () => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    switch (dateFilter) {
      case 'today':
        return `Today (${format(now, 'dd MMM yyyy')})`;
      case 'thisWeek':
        return `This Week (${format(startOfWeek, 'dd MMM yyyy')} - ${format(now, 'dd MMM yyyy')})`;
      case 'thisMonth':
        return `This Month (${format(startOfMonth, 'MMM yyyy')})`;
      case 'thisYear':
        return `This Year (${format(startOfYear, 'yyyy')})`;
      case 'custom':
        if (dateRange.from && dateRange.to) {
          return `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`;
        } else if (dateRange.from) {
          return `From ${format(dateRange.from, 'dd MMM yyyy')}`;
        }
        return 'Custom Range';
      default:
        return 'All Time';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Sales Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select
                value={dateFilter}
                onValueChange={(value: DateFilterType) => setDateFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateFilter === 'custom' && (
              <div className="space-y-2">
                <Label>Custom Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd MMM yyyy")} - {format(dateRange.to, "dd MMM yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd MMM yyyy")
                        )
                      ) : (
                        "Select date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to,
                      }}
                      onSelect={(range) => 
                        setDateRange({
                          from: range?.from,
                          to: range?.to,
                        })
                      }
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            <div className="flex items-end">
              <Button 
                onClick={handleExport} 
                disabled={isExporting || filteredSales.length === 0}
                className="w-full gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    Export Insurance Sales
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              {getDateRangeText()}: Showing {filteredSales.length} insurance sales
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Insurance Sales Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insurance Sales</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSales.length}</div>
            <p className="text-xs text-muted-foreground">
              {summaryData.prescriptionCount} with prescriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insurance Patients</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.uniquePatients}</div>
            <p className="text-xs text-muted-foreground">
              Unique patients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{summaryData.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {summaryData.totalItems} items dispensed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs{(summaryData.saleCount > 0 ? summaryData.totalCost / summaryData.saleCount : 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per insurance sale
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insurance Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            Insurance Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead className="w-[150px]">Prescription #</TableHead>
                  <TableHead className="w-[200px]">Patient</TableHead>
                  <TableHead className="w-[100px]">Items</TableHead>
                  <TableHead className="w-[150px]">Total Amount</TableHead>
                  <TableHead className="w-[150px]">Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No insurance sales found for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow 
                      key={sale.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onViewDetails(sale)}
                    >
                      <TableCell className="font-medium">
                        {format(sale.saleDate, 'dd MMM yyyy')}
                        <div className="text-xs text-muted-foreground">
                          {format(sale.saleDate, 'hh:mm a')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sale.invoiceNumber ? (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5 text-green-600" />
                            <span>{sale.invoiceNumber}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sale.customer ? (
                          <div>
                            <div className="font-medium">{sale.customer.name}</div>
                            <div className="text-xs text-muted-foreground">{sale.customer.mobile || '-'}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Walk-in Patient</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sale.items.length} items
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        Rs{sale.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {sale.createdBy ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                              <User className="h-3 w-3 text-green-700" />
                            </div>
                            <span className="text-sm">{sale.createdBy.displayName || sale.createdBy.email.split('@')[0]}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsuranceSalesTab;