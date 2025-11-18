// src/app/dashboard/viewSales/InventoryItemSalesExport.tsx
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  FileDown, 
  Calendar, 
  Loader2, 
  FileSpreadsheet, 
  Package, 
  User, 
  Plane, 
  ShoppingCart 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Sale } from '@/types/sale';
import { InventoryItem } from '@/types/inventory';
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
import { 
  format, 
  startOfToday, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  subMonths,
  addDays
} from 'date-fns';
import { Badge } from "@/components/ui/badge";

type DateRangeType = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';

interface InventoryItemSalesExportProps {
  sales: Sale[];
  inventoryItems: InventoryItem[];
}

const InventoryItemSalesExport: React.FC<InventoryItemSalesExportProps> = ({ sales, inventoryItems }) => {
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('thisMonth');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subMonths(new Date(), 1),
    to: new Date()
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'full' | 'summary'>('full');

  // Get date range based on selected type
  const getDateRange = useCallback(() => {
    const today = new Date();
    
    switch (dateRangeType) {
      case 'today':
        const startOfTodayDate = startOfToday();
        return { from: startOfTodayDate, to: today };
      
      case 'thisWeek':
        const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday as start of week
        const endOfWeekDate = endOfWeek(today, { weekStartsOn: 1 });
        return { from: startOfWeekDate, to: endOfWeekDate };
      
      case 'thisMonth':
        const startOfMonthDate = startOfMonth(today);
        const endOfMonthDate = endOfMonth(today);
        return { from: startOfMonthDate, to: endOfMonthDate };
        
      case 'thisYear':
        const startOfYearDate = startOfYear(today);
        const endOfYearDate = endOfYear(today);
        return { from: startOfYearDate, to: endOfYearDate };
      
      case 'custom':
        return customDateRange;
      
      default:
        return { from: undefined, to: undefined };
    }
  }, [dateRangeType, customDateRange]);

  // Filter sales based on date range
  const filterSalesByDateRange = useCallback((salesData: Sale[]) => {
    const { from, to } = getDateRange();
    
    if (!from) return salesData;
    
    // Add one day to include the end date fully
    const endDate = to ? addDays(to, 1) : new Date();
    
    return salesData.filter(sale => {
      const saleDate = sale.saleDate;
      return saleDate >= from && saleDate < endDate;
    });
  }, [getDateRange]);

  // Generate item-wise sales report
  const generateItemSalesReport = useCallback(async () => {
    setIsExporting(true);
    
    try {
      // Get filtered sales based on date range
      const filteredSales = filterSalesByDateRange(sales);
      
      // Create a map to store item data
      const itemsMap = new Map<string, {
        id: string;
        code: string;
        name: string;
        genericName: string;
        localPatients: Set<string>; // unique customer IDs
        foreignPatients: Set<string>; // unique customer IDs
        totalQuantity: number;
        totalSubUnitQuantity: number;
        subUnitName: string;
        totalCost: number;
        totalSales: number;
        totalProfit: number;
      }>();
      
      // Initialize data for all inventory items (even ones with no sales)
      inventoryItems.forEach(item => {
        if (item.id) {
          itemsMap.set(item.id, {
            id: item.id,
            code: item.code || '',
            name: item.name,
            genericName: item.genericName || '',
            localPatients: new Set(),
            foreignPatients: new Set(),
            totalQuantity: 0,
            totalSubUnitQuantity: 0,
            subUnitName: item.unitContains?.unit || 'units',
            totalCost: 0,
            totalSales: 0,
            totalProfit: 0
          });
        }
      });
      
      // Process each sale
      filteredSales.forEach(sale => {
        const patientType = sale.patientType || 'local';
        const customerId = sale.customerId || `walk-in-${sale.id}`;
        
        // Process each item in the sale
        sale.items.forEach(saleItem => {
          const itemId = saleItem.itemId;
          
          // Skip if item doesn't exist in our inventory
          if (!itemsMap.has(itemId)) return;
          
          const itemData = itemsMap.get(itemId)!;
          
          // Add patient to appropriate set
          if (patientType === 'local') {
            itemData.localPatients.add(customerId);
          } else {
            itemData.foreignPatients.add(customerId);
          }
          
          // Update quantities
          itemData.totalQuantity += saleItem.unitQuantity || 0;
          itemData.totalSubUnitQuantity += saleItem.subUnitQuantity || 0;
          
          // Update sub-unit name if available
          if (saleItem.item?.unitContains?.unit) {
            itemData.subUnitName = saleItem.item.unitContains.unit;
          }
          
          // Update financial data
          itemData.totalCost += saleItem.totalCost || 0;
          itemData.totalSales += saleItem.totalPrice || 0;
        });
      });
      
      // Calculate profits and prepare export data
      const itemsData = Array.from(itemsMap.values())
        .map(item => {
          // Calculate profit
          item.totalProfit = item.totalSales - item.totalCost;
          
          return item;
        })
        .filter(item => item.totalQuantity > 0 || item.totalSubUnitQuantity > 0) // Only include items with sales
        .sort((a, b) => b.totalSales - a.totalSales); // Sort by total sales (highest first)
      
      // Get date range for report name and display
      const dateRange = getDateRange();
      const dateRangeText = dateRange.from && dateRange.to 
        ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}` 
        : 'All Time';
      
      // Prepare Excel data based on selected format
      const excelData = itemsData.map(item => {
        if (exportFormat === 'summary') {
          // Summary format with fewer columns
          return {
            'Item Code': item.code,
            'Trade Name': item.name,
            'Generic Name': item.genericName || '-',
            'Total Qty': item.totalQuantity,
            'Total Sales (Rs)': parseFloat(item.totalSales.toFixed(2)),
            'Total Profit (Rs)': parseFloat(item.totalProfit.toFixed(2)),
            'Profit %': parseFloat(((item.totalProfit / item.totalSales) * 100).toFixed(1)) + '%',
          };
        } else {
          // Full detailed format
          return {
            'Item Code': item.code,
            'Trade Name': item.name,
            'Generic Name': item.genericName || '-',
            'Date Range': dateRangeText,
            'Local Patients': item.localPatients.size,
            'Foreign Patients': item.foreignPatients.size,
            'Total Qty': item.totalQuantity,
            'Sub-Unit Qty': item.totalSubUnitQuantity > 0 ? `${item.totalSubUnitQuantity} ${item.subUnitName}` : '-',
            'Total Cost (Rs)': parseFloat(item.totalCost.toFixed(2)),
            'Total Profit (Rs)': parseFloat(item.totalProfit.toFixed(2)),
            'Total Sales (Rs)': parseFloat(item.totalSales.toFixed(2)),
            'Profit Margin (%)': parseFloat(((item.totalProfit / item.totalSales) * 100).toFixed(1)) + '%',
          };
        }
      });
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Auto-size columns
      const colWidths = exportFormat === 'summary' 
        ? [
            { wch: 12 }, // Item Code
            { wch: 30 }, // Trade Name
            { wch: 30 }, // Generic Name
            { wch: 15 }, // Total Qty
            { wch: 18 }, // Total Sales
            { wch: 18 }, // Total Profit
            { wch: 12 }  // Profit %
          ]
        : [
            { wch: 12 }, // Item Code
            { wch: 30 }, // Trade Name
            { wch: 30 }, // Generic Name
            { wch: 25 }, // Date Range
            { wch: 15 }, // Local Patients
            { wch: 15 }, // Foreign Patients
            { wch: 15 }, // Total Qty
            { wch: 20 }, // Sub-Unit Qty
            { wch: 18 }, // Total Cost
            { wch: 18 }, // Total Profit
            { wch: 18 }, // Total Sales
            { wch: 15 }  // Profit Margin
          ];
      
      ws['!cols'] = colWidths;
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Item Sales Report');
      
      // Generate filename
      const formattedDate = format(new Date(), 'yyyyMMdd');
      const dateRangePart = dateRange.from && dateRange.to 
        ? `${format(dateRange.from, 'yyyyMMdd')}_to_${format(dateRange.to, 'yyyyMMdd')}` 
        : formattedDate;
      
      const filename = `Inventory_Sales_${dateRangePart}_${exportFormat}.xlsx`;
      
      // Write file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting item sales data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [sales, inventoryItems, filterSalesByDateRange, getDateRange, exportFormat]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Item Sales Export</CardTitle>
        <CardDescription>
          Export detailed sales information for inventory items within a specific date range
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range Type Selection */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select 
                value={dateRangeType} 
                onValueChange={(value: DateRangeType) => setDateRangeType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
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
            
            {/* Custom Date Selection */}
            {dateRangeType === 'custom' && (
              <div className="space-y-2">
                <Label>Custom Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <Calendar className="mr-2 h-4 w-4" />
                      {customDateRange.from ? (
                        customDateRange.to ? (
                          <>
                            {format(customDateRange.from, 'dd MMM yyyy')} - {format(customDateRange.to, 'dd MMM yyyy')}
                          </>
                        ) : (
                          format(customDateRange.from, 'dd MMM yyyy')
                        )
                      ) : (
                        "Select dates..."
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={customDateRange.from}
                      selected={{
                        from: customDateRange.from,
                        to: customDateRange.to,
                      }}
                      onSelect={(range) => 
                        setCustomDateRange({
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
            
            {/* Export Format Selection */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select 
                value={exportFormat} 
                onValueChange={(value: 'full' | 'summary') => setExportFormat(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select export format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Details</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Current Date Range Info */}
          <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-md">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            {getDateRange().from && getDateRange().to ? (
              <span>
                Reporting period: <strong>{format(getDateRange().from, 'dd MMM yyyy')}</strong> to <strong>{format(getDateRange().to, 'dd MMM yyyy')}</strong>
              </span>
            ) : (
              <span>Please select a date range</span>
            )}
          </div>
          
          {/* Stats Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex gap-3 items-center p-3 border rounded-md">
              <div className="bg-blue-100 text-blue-700 p-2 rounded-md">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{inventoryItems.length}</p>
                <p className="text-xs text-muted-foreground">Inventory Items</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-center p-3 border rounded-md">
              <div className="bg-green-100 text-green-700 p-2 rounded-md">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{filterSalesByDateRange(sales).length}</p>
                <p className="text-xs text-muted-foreground">Sales in Period</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-center p-3 border rounded-md">
              <div className="bg-amber-100 text-amber-700 p-2 rounded-md">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {new Set(filterSalesByDateRange(sales)
                    .filter(s => s.customerId)
                    .map(s => s.customerId)).size}
                </p>
                <p className="text-xs text-muted-foreground">Unique Customers</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div>
          <Badge variant="outline" className="flex gap-1 items-center">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {exportFormat === 'full' ? 'Detailed Export' : 'Summary Export'}
          </Badge>
        </div>
        <Button 
          onClick={generateItemSalesReport} 
          disabled={isExporting || !getDateRange().from || !getDateRange().to}
          className="gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              Export Item Sales
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InventoryItemSalesExport;