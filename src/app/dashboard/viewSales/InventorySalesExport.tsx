// src/app/dashboard/viewSales/InventorySalesExport.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Calendar, Loader2 } from 'lucide-react';
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
import { Label } from "@/components/ui/label";
import { format, startOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

type DateRangeType = 'today' | 'thisWeek' | 'thisMonth' | 'custom';

interface InventorySalesExportProps {
  sales: Sale[];
  inventoryItems: InventoryItem[];
}

interface ItemSaleSummary {
  itemId: string;
  name: string;
  genericName: string;
  code: string;
  localPatientCount: number;
  foreignPatientCount: number;
  totalSoldQty: number;
  totalSoldSubUnitQty: number;
  totalCost: number;
  totalProfit: number;
  totalSale: number;
}

const InventorySalesExport: React.FC<InventorySalesExportProps> = ({ sales, inventoryItems }) => {
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('thisMonth');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [exporting, setExporting] = useState(false);

  // Get date range based on selected type
  const getDateRange = () => {
    const today = new Date();
    
    switch (dateRangeType) {
      case 'today':
        const startOfTodayDate = startOfToday();
        return { from: startOfTodayDate, to: today };
      
      case 'thisWeek':
        const startOfWeekDate = startOfWeek(today);
        const endOfWeekDate = endOfWeek(today);
        return { from: startOfWeekDate, to: endOfWeekDate };
      
      case 'thisMonth':
        const startOfMonthDate = startOfMonth(today);
        const endOfMonthDate = endOfMonth(today);
        return { from: startOfMonthDate, to: endOfMonthDate };
      
      case 'custom':
        return customDateRange;
      
      default:
        return { from: undefined, to: undefined };
    }
  };

  // Filter sales based on date range
  const filterSalesByDateRange = (salesData: Sale[]) => {
    const { from, to } = getDateRange();
    
    if (!from) return salesData;
    
    return salesData.filter(sale => {
      const saleDate = sale.saleDate;
      return saleDate >= from && saleDate <= (to || new Date());
    });
  };

  // Calculate item-wise sales summary
  const calculateItemSalesSummary = (filteredSales: Sale[]): ItemSaleSummary[] => {
    // Create a map to store item summaries
    const itemSummaryMap = new Map<string, ItemSaleSummary>();
    
    // Prepare empty summaries for all inventory items
    inventoryItems.forEach(item => {
      if (item.id) {
        itemSummaryMap.set(item.id, {
          itemId: item.id,
          name: item.name,
          genericName: item.genericName || '',
          code: item.code,
          localPatientCount: 0,
          foreignPatientCount: 0,
          totalSoldQty: 0,
          totalSoldSubUnitQty: 0,
          totalCost: 0,
          totalProfit: 0,
          totalSale: 0
        });
      }
    });
    
    // Process each sale
    filteredSales.forEach(sale => {
      const patientType = sale.patientType || 'local';
      
      // Process each item in the sale
      sale.items.forEach(saleItem => {
        const itemId = saleItem.itemId;
        
        // Get existing summary or create new one
        let summary = itemSummaryMap.get(itemId);
        if (!summary) {
          // This shouldn't happen since we pre-populated the map, but just in case
          summary = {
            itemId,
            name: saleItem.item?.name || 'Unknown Item',
            genericName: saleItem.item?.genericName || '',
            code: saleItem.item?.code || '',
            localPatientCount: 0,
            foreignPatientCount: 0,
            totalSoldQty: 0,
            totalSoldSubUnitQty: 0,
            totalCost: 0,
            totalProfit: 0,
            totalSale: 0
          };
          itemSummaryMap.set(itemId, summary);
        }
        
        // Update counts
        if (patientType === 'local') {
          summary.localPatientCount++;
        } else {
          summary.foreignPatientCount++;
        }
        
        // Update quantities
        summary.totalSoldQty += saleItem.unitQuantity || 0;
        summary.totalSoldSubUnitQty += saleItem.subUnitQuantity || 0;
        
        // Update financials
        summary.totalCost += saleItem.totalCost || 0;
        summary.totalSale += saleItem.totalPrice || 0;
        summary.totalProfit = summary.totalSale - summary.totalCost;
      });
    });
    
    // Convert map to array and filter out items with no sales
    return Array.from(itemSummaryMap.values())
      .filter(summary => summary.totalSoldQty > 0 || summary.totalSoldSubUnitQty > 0)
      .sort((a, b) => b.totalSale - a.totalSale);
  };

  // Handle export
  const handleExport = () => {
    setExporting(true);
    
    try {
      // Get date range for filtering
      const dateRange = getDateRange();
      const filteredSales = filterSalesByDateRange(sales);
      
      // Calculate item-wise summary
      const itemSummaries = calculateItemSalesSummary(filteredSales);
      
      // Format data for Excel
      const excelData = itemSummaries.map(item => ({
        'Trade Name': item.name,
        'Generic Name': item.genericName,
        'Item Code': item.code,
        'Date Range': dateRange.from && dateRange.to 
          ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}` 
          : 'All Time',
        'Local Patient Count': item.localPatientCount,
        'Foreign Patient Count': item.foreignPatientCount,
        'Total Sold Qty': item.totalSoldQty,
        'Total Sold Sub-Unit Qty': item.totalSoldSubUnitQty,
        'Total Cost (Rs)': parseFloat(item.totalCost.toFixed(2)),
        'Total Profit (Rs)': parseFloat(item.totalProfit.toFixed(2)),
        'Total Sale (Rs)': parseFloat(item.totalSale.toFixed(2))
      }));
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Auto-size columns
      const colWidths = [
        { wch: 25 }, // Trade Name
        { wch: 25 }, // Generic Name
        { wch: 12 }, // Item Code
        { wch: 25 }, // Date Range
        { wch: 15 }, // Local Patient Count
        { wch: 15 }, // Foreign Patient Count
        { wch: 15 }, // Total Sold Qty
        { wch: 20 }, // Total Sold Sub-Unit Qty
        { wch: 15 }, // Total Cost
        { wch: 15 }, // Total Profit
        { wch: 15 }  // Total Sale
      ];
      ws['!cols'] = colWidths;
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Item Sales Report');
      
      // Generate file name
      const dateString = dateRange.from && dateRange.to 
        ? `${format(dateRange.from, 'yyyyMMdd')}_${format(dateRange.to, 'yyyyMMdd')}`
        : format(new Date(), 'yyyyMMdd');
      
      // Export to file
      XLSX.writeFile(wb, `Inventory_Sales_Report_${dateString}.xlsx`);
    } catch (error) {
      console.error('Error exporting inventory sales data:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Inventory Sales Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Date Range</Label>
              <Select value={dateRangeType} onValueChange={(value: DateRangeType) => setDateRangeType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                        "Select date range"
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
          </div>

          <div className="flex justify-between items-center pt-4">
            <div>
              {getDateRange().from && getDateRange().to && (
                <p className="text-sm text-muted-foreground">
                  Exporting data from {format(getDateRange().from!, 'dd MMM yyyy')} to {format(getDateRange().to!, 'dd MMM yyyy')}
                </p>
              )}
            </div>
            <Button onClick={handleExport} disabled={exporting} className="gap-2">
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  Export Item Sales Report
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventorySalesExport;