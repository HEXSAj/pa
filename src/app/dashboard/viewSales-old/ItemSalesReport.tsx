// // src/app/dashboard/viewSales/ItemSalesReport.tsx
// import React, { useState, useCallback } from 'react';
// import { Button } from "@/components/ui/button";
// import { 
//   Card, 
//   CardContent, 
//   CardHeader, 
//   CardTitle, 
//   CardDescription 
// } from "@/components/ui/card";
// import { 
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Label } from "@/components/ui/label";
// import { FileDown, Calendar, Loader2, FileSpreadsheet, ChevronDown, ChevronUp, Filter } from 'lucide-react';
// import * as XLSX from 'xlsx';
// import { Sale } from '@/types/sale';
// import { InventoryItem } from '@/types/inventory';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Calendar as CalendarComponent } from "@/components/ui/calendar";
// import { 
//   format, 
//   startOfToday, 
//   startOfWeek, 
//   endOfWeek, 
//   startOfMonth, 
//   endOfMonth, 
//   startOfYear, 
//   endOfYear,
//   subMonths
// } from 'date-fns';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// type DateRangeType = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';

// interface ItemSalesReportProps {
//   sales: Sale[];
//   inventoryItems: InventoryItem[];
// }

// interface ItemSaleSummary {
//   itemId: string;
//   name: string;
//   genericName: string;
//   code: string;
//   localPatientCount: number;
//   foreignPatientCount: number;
//   totalSoldQty: number;
//   totalSoldSubUnitQty: number;
//   subUnitName: string;
//   totalCost: number;
//   totalProfit: number;
//   totalSale: number;
// }

// const ItemSalesReport: React.FC<ItemSalesReportProps> = ({ sales, inventoryItems }) => {
//   const [dateRangeType, setDateRangeType] = useState<DateRangeType>('thisMonth');
//   const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
//     from: subMonths(new Date(), 1),
//     to: new Date()
//   });
//   const [exporting, setExporting] = useState(false);
//   const [showPreview, setShowPreview] = useState(false);
//   const [isPreviewLoading, setIsPreviewLoading] = useState(false);
//   const [previewData, setPreviewData] = useState<ItemSaleSummary[]>([]);
//   const [sortColumn, setSortColumn] = useState<keyof ItemSaleSummary>('totalSale');
//   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

//   // Get date range based on selected type
//   const getDateRange = useCallback(() => {
//     const today = new Date();
    
//     switch (dateRangeType) {
//       case 'today':
//         const startOfTodayDate = startOfToday();
//         return { from: startOfTodayDate, to: today };
      
//       case 'thisWeek':
//         const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday as start of week
//         const endOfWeekDate = endOfWeek(today, { weekStartsOn: 1 });
//         return { from: startOfWeekDate, to: endOfWeekDate };
      
//       case 'thisMonth':
//         const startOfMonthDate = startOfMonth(today);
//         const endOfMonthDate = endOfMonth(today);
//         return { from: startOfMonthDate, to: endOfMonthDate };
        
//       case 'thisYear':
//         const startOfYearDate = startOfYear(today);
//         const endOfYearDate = endOfYear(today);
//         return { from: startOfYearDate, to: endOfYearDate };
      
//       case 'custom':
//         return customDateRange;
      
//       default:
//         return { from: undefined, to: undefined };
//     }
//   }, [dateRangeType, customDateRange]);

//   // Filter sales based on date range
//   const filterSalesByDateRange = useCallback((salesData: Sale[]) => {
//     const { from, to } = getDateRange();
    
//     if (!from) return salesData;
    
//     return salesData.filter(sale => {
//       const saleDate = sale.saleDate;
//       return saleDate >= from && saleDate <= (to || new Date());
//     });
//   }, [getDateRange]);

//   // Calculate item-wise sales summary
//   const calculateItemSalesSummary = useCallback((filteredSales: Sale[]): ItemSaleSummary[] => {
//     // Create a map to store item summaries
//     const itemSummaryMap = new Map<string, ItemSaleSummary>();
    
//     // Prepare empty summaries for all inventory items
//     inventoryItems.forEach(item => {
//       if (item.id) {
//         itemSummaryMap.set(item.id, {
//           itemId: item.id,
//           name: item.name,
//           genericName: item.genericName || '',
//           code: item.code,
//           localPatientCount: 0,
//           foreignPatientCount: 0,
//           totalSoldQty: 0,
//           totalSoldSubUnitQty: 0,
//           subUnitName: item.unitContains?.unit || 'units',
//           totalCost: 0,
//           totalProfit: 0,
//           totalSale: 0
//         });
//       }
//     });
    
//     // Helper to track unique patients per item
//     const localPatientsByItem = new Map<string, Set<string>>();
//     const foreignPatientsByItem = new Map<string, Set<string>>();
    
//     // Process each sale
//     filteredSales.forEach(sale => {
//       const patientType = sale.patientType || 'local';
//       const customerId = sale.customerId || `walk-in-${sale.id}`;
      
//       // Process each item in the sale
//       sale.items.forEach(saleItem => {
//         const itemId = saleItem.itemId;
        
//         // Get existing summary or create new one
//         let summary = itemSummaryMap.get(itemId);
//         if (!summary) {
//           // This shouldn't happen since we pre-populated the map, but just in case
//           return; // Skip items not in our inventory list
//         }
        
//         // Track unique patients
//         if (patientType === 'local') {
//           if (!localPatientsByItem.has(itemId)) {
//             localPatientsByItem.set(itemId, new Set());
//           }
//           localPatientsByItem.get(itemId)?.add(customerId);
//         } else {
//           if (!foreignPatientsByItem.has(itemId)) {
//             foreignPatientsByItem.set(itemId, new Set());
//           }
//           foreignPatientsByItem.get(itemId)?.add(customerId);
//         }
        
//         // Update quantities
//         summary.totalSoldQty += saleItem.unitQuantity || 0;
//         summary.totalSoldSubUnitQty += saleItem.subUnitQuantity || 0;
        
//         // Ensure subUnitName is captured if available
//         if (saleItem.item?.unitContains?.unit) {
//           summary.subUnitName = saleItem.item.unitContains.unit;
//         }
        
//         // Update financials
//         summary.totalCost += saleItem.totalCost || 0;
//         summary.totalSale += saleItem.totalPrice || 0;
//         summary.totalProfit = summary.totalSale - summary.totalCost;
//       });
//     });
    
//     // Update patient counts from our tracking sets
//     for (const [itemId, summary] of itemSummaryMap.entries()) {
//       summary.localPatientCount = localPatientsByItem.get(itemId)?.size || 0;
//       summary.foreignPatientCount = foreignPatientsByItem.get(itemId)?.size || 0;
//     }
    
//     // Convert map to array and filter out items with no sales
//     return Array.from(itemSummaryMap.values())
//       .filter(summary => summary.totalSoldQty > 0 || summary.totalSoldSubUnitQty > 0);
//   }, [inventoryItems]);

//   // Sort data
//   const sortData = useCallback((data: ItemSaleSummary[]) => {
//     return [...data].sort((a, b) => {
//       const valueA = a[sortColumn];
//       const valueB = b[sortColumn];
      
//       // Handle string values
//       if (typeof valueA === 'string' && typeof valueB === 'string') {
//         return sortDirection === 'asc' 
//           ? valueA.localeCompare(valueB) 
//           : valueB.localeCompare(valueA);
//       }
      
//       // Handle numeric values
//       return sortDirection === 'asc' 
//         ? Number(valueA) - Number(valueB) 
//         : Number(valueB) - Number(valueA);
//     });
//   }, [sortColumn, sortDirection]);

//   // Handle column sort
//   const handleSort = (column: keyof ItemSaleSummary) => {
//     if (column === sortColumn) {
//       setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
//     } else {
//       setSortColumn(column);
//       setSortDirection('desc'); // Default to descending for new column
//     }
//   };

//   // Generate preview data
//   const generatePreview = useCallback(async () => {
//     try {
//       setIsPreviewLoading(true);
      
//       // Filter sales based on date range
//       const filteredSales = filterSalesByDateRange(sales);
      
//       // Calculate item-wise summary
//       const itemSummaries = calculateItemSalesSummary(filteredSales);
      
//       // Sort data
//       const sortedData = sortData(itemSummaries);
      
//       // Update state
//       setPreviewData(sortedData);
//       setShowPreview(true);
//     } catch (error) {
//       console.error('Error generating preview:', error);
//       alert('Error generating preview. Please try again.');
//     } finally {
//       setIsPreviewLoading(false);
//     }
//   }, [filterSalesByDateRange, calculateItemSalesSummary, sales, sortData]);

//   // Handle export
//   const handleExport = useCallback(async () => {
//     setExporting(true);
    
//     try {
//       // Get date range for filtering
//       const dateRange = getDateRange();
//       const filteredSales = filterSalesByDateRange(sales);
      
//       // Calculate item-wise summary
//       const itemSummaries = calculateItemSalesSummary(filteredSales);
      
//       // Sort data according to current sorting
//       const sortedData = sortData(itemSummaries);
      
//       // Format data for Excel
//       const excelData = sortedData.map(item => ({
//         'Trade Name': item.name,
//         'Generic Name': item.genericName,
//         'Item Code': item.code,
//         'Date Range': dateRange.from && dateRange.to 
//           ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}` 
//           : 'All Time',
//         'Local Patient Count': item.localPatientCount,
//         'Foreign Patient Count': item.foreignPatientCount,
//         'Total Sold Qty': item.totalSoldQty,
//         'Total Sold Sub-Unit Qty': item.totalSoldSubUnitQty > 0 ? `${item.totalSoldSubUnitQty} ${item.subUnitName}` : '-',
//         'Total Cost (Rs)': parseFloat(item.totalCost.toFixed(2)),
//         'Total Profit (Rs)': parseFloat(item.totalProfit.toFixed(2)),
//         'Total Sale (Rs)': parseFloat(item.totalSale.toFixed(2))
//       }));
      
//       // Create worksheet
//       const ws = XLSX.utils.json_to_sheet(excelData);
      
//       // Auto-size columns
//       const colWidths = [
//         { wch: 30 }, // Trade Name
//         { wch: 30 }, // Generic Name
//         { wch: 15 }, // Item Code
//         { wch: 25 }, // Date Range
//         { wch: 18 }, // Local Patient Count
//         { wch: 20 }, // Foreign Patient Count
//         { wch: 15 }, // Total Sold Qty
//         { wch: 20 }, // Total Sold Sub-Unit Qty
//         { wch: 18 }, // Total Cost
//         { wch: 18 }, // Total Profit
//         { wch: 18 }  // Total Sale
//       ];
//       ws['!cols'] = colWidths;
      
//       // Create workbook
//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(wb, ws, 'Item Sales Report');
      
//       // Generate file name
//       const dateString = dateRange.from && dateRange.to 
//         ? `${format(dateRange.from, 'yyyyMMdd')}_${format(dateRange.to, 'yyyyMMdd')}`
//         : format(new Date(), 'yyyyMMdd');
      
//       // Export to file
//       XLSX.writeFile(wb, `Inventory_Sales_Report_${dateString}.xlsx`);
//     } catch (error) {
//       console.error('Error exporting inventory sales data:', error);
//       alert('Error exporting data. Please try again.');
//     } finally {
//       setExporting(false);
//     }
//   }, [getDateRange, filterSalesByDateRange, calculateItemSalesSummary, sales, sortData]);

//   const renderSortIcon = (column: keyof ItemSaleSummary) => {
//     if (column !== sortColumn) return null;
    
//     return sortDirection === 'asc' 
//       ? <ChevronUp className="h-4 w-4 ml-1" /> 
//       : <ChevronDown className="h-4 w-4 ml-1" />;
//   };

//   return (
//     <>
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center justify-between">
//             <span>Item Sales Report</span>
//             <Badge variant="outline" className="text-xs font-normal">
//               {inventoryItems.length} items available
//             </Badge>
//           </CardTitle>
//           <CardDescription>
//             Generate a detailed report of item-wise sales for specific date ranges
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label>Select Date Range</Label>
//                 <Select value={dateRangeType} onValueChange={(value: DateRangeType) => setDateRangeType(value)}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select date range" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="today">Today</SelectItem>
//                     <SelectItem value="thisWeek">This Week</SelectItem>
//                     <SelectItem value="thisMonth">This Month</SelectItem>
//                     <SelectItem value="thisYear">This Year</SelectItem>
//                     <SelectItem value="custom">Custom Range</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               {dateRangeType === 'custom' && (
//                 <div className="space-y-2">
//                   <Label>Custom Date Range</Label>
//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button variant="outline" className="w-full justify-start text-left">
//                         <Calendar className="mr-2 h-4 w-4" />
//                         {customDateRange.from ? (
//                           customDateRange.to ? (
//                             <>
//                               {format(customDateRange.from, 'dd MMM yyyy')} - {format(customDateRange.to, 'dd MMM yyyy')}
//                             </>
//                           ) : (
//                             format(customDateRange.from, 'dd MMM yyyy')
//                           )
//                         ) : (
//                           "Select date range"
//                         )}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0" align="start">
//                       <CalendarComponent
//                         initialFocus
//                         mode="range"
//                         defaultMonth={customDateRange.from}
//                         selected={{
//                           from: customDateRange.from,
//                           to: customDateRange.to,
//                         }}
//                         onSelect={(range) => 
//                           setCustomDateRange({
//                             from: range?.from,
//                             to: range?.to,
//                           })}
//                         numberOfMonths={2}
//                       />
//                     </PopoverContent>
//                   </Popover>
//                 </div>
//               )}
//             </div>

//             <div className="flex justify-between items-center pt-4">
//               <div>
//                 {getDateRange().from && getDateRange().to && (
//                   <span className="text-sm text-muted-foreground">
//                     Reporting data from {format(getDateRange().from!, 'dd MMM yyyy')} to {format(getDateRange().to!, 'dd MMM yyyy')}
//                   </span>
//                 )}
//               </div>
//               <div className="flex gap-2">
//                 <Button
//                   variant="outline"
//                   onClick={generatePreview}
//                   disabled={isPreviewLoading}
//                   className="gap-2"
//                 >
//                   {isPreviewLoading ? (
//                     <>
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                       Loading...
//                     </>
//                   ) : (
//                     <>
//                       <Filter className="h-4 w-4" />
//                       Preview Data
//                     </>
//                   )}
//                 </Button>
//                 <Button onClick={handleExport} disabled={exporting} className="gap-2">
//                   {exporting ? (
//                     <>
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                       Exporting...
//                     </>
//                   ) : (
//                     <>
//                       <FileSpreadsheet className="h-4 w-4" />
//                       Export to Excel
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <Dialog open={showPreview} onOpenChange={setShowPreview}>
//         <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
//           <DialogHeader>
//             <DialogTitle>Item Sales Preview</DialogTitle>
//           </DialogHeader>
          
//           <div className="overflow-y-auto flex-1">
//             <Table>
//               <TableHeader className="sticky top-0 bg-background">
//                 <TableRow>
//                   <TableHead onClick={() => handleSort('name')} className="cursor-pointer whitespace-nowrap">
//                     <div className="flex items-center">
//                       Trade Name {renderSortIcon('name')}
//                     </div>
//                   </TableHead>
//                   <TableHead onClick={() => handleSort('genericName')} className="cursor-pointer whitespace-nowrap">
//                     <div className="flex items-center">
//                       Generic Name {renderSortIcon('genericName')}
//                     </div>
//                   </TableHead>
//                   <TableHead onClick={() => handleSort('code')} className="cursor-pointer whitespace-nowrap">
//                     <div className="flex items-center">
//                       Code {renderSortIcon('code')}
//                     </div>
//                   </TableHead>
//                   <TableHead onClick={() => handleSort('localPatientCount')} className="cursor-pointer whitespace-nowrap">
//                     <div className="flex items-center">
//                       Local Patients {renderSortIcon('localPatientCount')}
//                     </div>
//                   </TableHead>
//                   <TableHead onClick={() => handleSort('foreignPatientCount')} className="cursor-pointer whitespace-nowrap">
//                     <div className="flex items-center">
//                       Foreign Patients {renderSortIcon('foreignPatientCount')}
//                     </div>
//                   </TableHead>
//                   <TableHead onClick={() => handleSort('totalSoldQty')} className="cursor-pointer whitespace-nowrap">
//                     <div className="flex items-center">
//                       Sold Qty {renderSortIcon('totalSoldQty')}
//                     </div>
//                   </TableHead>
//                   <TableHead className="whitespace-nowrap">
//                     <div className="flex items-center">
//                       Sub-Unit Qty
//                     </div>
//                   </TableHead>
//                   <TableHead onClick={() => handleSort('totalCost')} className="cursor-pointer whitespace-nowrap text-right">
//                     <div className="flex items-center justify-end">
//                       Total Cost {renderSortIcon('totalCost')}
//                     </div>
//                   </TableHead>
//                   <TableHead onClick={() => handleSort('totalProfit')} className="cursor-pointer whitespace-nowrap text-right">
//                     <div className="flex items-center justify-end">
//                       Profit {renderSortIcon('totalProfit')}
//                     </div>
//                   </TableHead>
//                   <TableHead onClick={() => handleSort('totalSale')} className="cursor-pointer whitespace-nowrap text-right">
//                     <div className="flex items-center justify-end">
//                       Total Sale {renderSortIcon('totalSale')}
//                     </div>
//                   </TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {previewData.length === 0 ? (
//                   <TableRow>
//                     <TableCell colSpan={10} className="text-center py-8">
//                       No data found in the selected date range
//                     </TableCell>
//                   </TableRow>
//                 ) : (
//                   previewData.map((item) => (
//                     <TableRow key={item.itemId}>
//                       <TableCell className="font-medium">{item.name}</TableCell>
//                       <TableCell>{item.genericName || '-'}</TableCell>
//                       <TableCell>{item.code}</TableCell>
//                       <TableCell>{item.localPatientCount}</TableCell>
//                       <TableCell>{item.foreignPatientCount}</TableCell>
//                       <TableCell>{item.totalSoldQty}</TableCell>
//                       <TableCell>
//                         {item.totalSoldSubUnitQty > 0 
//                           ? `${item.totalSoldSubUnitQty} ${item.subUnitName}`
//                           : '-'}
//                       </TableCell>
//                       <TableCell className="text-right">Rs{item.totalCost.toFixed(2)}</TableCell>
//                       <TableCell className="text-right font-medium text-green-600">
//                         Rs{item.totalProfit.toFixed(2)}
//                       </TableCell>
//                       <TableCell className="text-right font-bold">
//                         Rs{item.totalSale.toFixed(2)}
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 )}
//               </TableBody>
//             </Table>
//           </div>
          
//           <DialogFooter>
//             <div className="flex justify-between w-full items-center">
//               <span className="text-sm text-muted-foreground">
//                 {previewData.length} items found
//               </span>
//               <Button onClick={handleExport} disabled={exporting} className="gap-2">
//                 {exporting ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     Exporting...
//                   </>
//                 ) : (
//                   <>
//                     <FileDown className="h-4 w-4" />
//                     Export to Excel
//                   </>
//                 )}
//               </Button>
//             </div>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };

// export default ItemSalesReport;


// src/app/dashboard/viewSales/ItemSalesReport.tsx
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
  } from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  FileDown, 
  Calendar, 
  Loader2, 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronUp, 
  Filter 
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
  subMonths
} from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

type DateRangeType = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';

interface ItemSalesReportProps {
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
  subUnitName: string;
  totalCost: number;
  totalProfit: number;
  totalSale: number;
}

const ItemSalesReport: React.FC<ItemSalesReportProps> = ({ sales, inventoryItems }) => {
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('thisMonth');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subMonths(new Date(), 1),
    to: new Date()
  });
  const [exporting, setExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ItemSaleSummary[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof ItemSaleSummary>('totalSale');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
    
    return salesData.filter(sale => {
      const saleDate = sale.saleDate;
      return saleDate >= from && saleDate <= (to || new Date());
    });
  }, [getDateRange]);

  // Calculate item-wise sales summary
  const calculateItemSalesSummary = useCallback((filteredSales: Sale[]): ItemSaleSummary[] => {
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
          subUnitName: item.unitContains?.unit || 'units',
          totalCost: 0,
          totalProfit: 0,
          totalSale: 0
        });
      }
    });
    
    // Helper to track unique patients per item
    const localPatientsByItem = new Map<string, Set<string>>();
    const foreignPatientsByItem = new Map<string, Set<string>>();
    
    // Process each sale
    filteredSales.forEach(sale => {
      const patientType = sale.patientType || 'local';
      const customerId = sale.customerId || `walk-in-${sale.id}`;
      
      // Process each item in the sale
      sale.items.forEach(saleItem => {
        const itemId = saleItem.itemId;
        
        // Get existing summary or create new one
        let summary = itemSummaryMap.get(itemId);
        if (!summary) {
          // This shouldn't happen since we pre-populated the map, but just in case
          return; // Skip items not in our inventory list
        }
        
        // Track unique patients
        if (patientType === 'local') {
          if (!localPatientsByItem.has(itemId)) {
            localPatientsByItem.set(itemId, new Set());
          }
          localPatientsByItem.get(itemId)?.add(customerId);
        } else {
          if (!foreignPatientsByItem.has(itemId)) {
            foreignPatientsByItem.set(itemId, new Set());
          }
          foreignPatientsByItem.get(itemId)?.add(customerId);
        }
        
        // Update quantities
        summary.totalSoldQty += saleItem.unitQuantity || 0;
        summary.totalSoldSubUnitQty += saleItem.subUnitQuantity || 0;
        
        // Ensure subUnitName is captured if available
        if (saleItem.item?.unitContains?.unit) {
          summary.subUnitName = saleItem.item.unitContains.unit;
        }
        
        // Update financials
        summary.totalCost += saleItem.totalCost || 0;
        summary.totalSale += saleItem.totalPrice || 0;
        summary.totalProfit = summary.totalSale - summary.totalCost;
      });
    });
    
    // Update patient counts from our tracking sets
    for (const [itemId, summary] of itemSummaryMap.entries()) {
      summary.localPatientCount = localPatientsByItem.get(itemId)?.size || 0;
      summary.foreignPatientCount = foreignPatientsByItem.get(itemId)?.size || 0;
    }
    
    // Convert map to array and filter out items with no sales
    return Array.from(itemSummaryMap.values())
      .filter(summary => summary.totalSoldQty > 0 || summary.totalSoldSubUnitQty > 0);
  }, [inventoryItems]);

  // Sort data
  const sortData = useCallback((data: ItemSaleSummary[]) => {
    return [...data].sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];
      
      // Handle string values
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      // Handle numeric values
      return sortDirection === 'asc' 
        ? Number(valueA) - Number(valueB) 
        : Number(valueB) - Number(valueA);
    });
  }, [sortColumn, sortDirection]);

  // Handle column sort
  const handleSort = (column: keyof ItemSaleSummary) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc'); // Default to descending for new column
    }
  };

  // Calculate totals for the footer
  const calculateTotals = useCallback((data: ItemSaleSummary[]) => {
    return data.reduce((totals, item) => {
      return {
        totalCost: totals.totalCost + item.totalCost,
        totalProfit: totals.totalProfit + item.totalProfit,
        totalSale: totals.totalSale + item.totalSale,
      };
    }, {
      totalCost: 0,
      totalProfit: 0,
      totalSale: 0,
    });
  }, []);

  // Generate preview data
  const generatePreview = useCallback(async () => {
    try {
      setIsPreviewLoading(true);
      
      // Filter sales based on date range
      const filteredSales = filterSalesByDateRange(sales);
      
      // Calculate item-wise summary
      const itemSummaries = calculateItemSalesSummary(filteredSales);
      
      // Sort data
      const sortedData = sortData(itemSummaries);
      
      // Update state
      setPreviewData(sortedData);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Error generating preview. Please try again.');
    } finally {
      setIsPreviewLoading(false);
    }
  }, [filterSalesByDateRange, calculateItemSalesSummary, sales, sortData]);

  // Handle export
  const handleExport = useCallback(async () => {
    setExporting(true);
    
    try {
      // Get date range for filtering
      const dateRange = getDateRange();
      const filteredSales = filterSalesByDateRange(sales);
      
      // Calculate item-wise summary
      const itemSummaries = calculateItemSalesSummary(filteredSales);
      
      // Sort data according to current sorting
      const sortedData = sortData(itemSummaries);
      
      // Format data for Excel
      const excelData = sortedData.map(item => ({
        'Trade Name': item.name,
        'Generic Name': item.genericName,
        'Item Code': item.code,
        'Date Range': dateRange.from && dateRange.to 
          ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}` 
          : 'All Time',
        'Local Patient Count': item.localPatientCount,
        'Foreign Patient Count': item.foreignPatientCount,
        'Total Sold Qty': item.totalSoldQty,
        'Total Sold Sub-Unit Qty': item.totalSoldSubUnitQty > 0 ? `${item.totalSoldSubUnitQty} ${item.subUnitName}` : '-',
        'Total Cost (Rs)': parseFloat(item.totalCost.toFixed(2)),
        'Total Profit (Rs)': parseFloat(item.totalProfit.toFixed(2)),
        'Total Sale (Rs)': parseFloat(item.totalSale.toFixed(2))
      }));
      
      // Calculate totals
      const totals = calculateTotals(sortedData);
      
      // Add a totals row to the Excel data
      excelData.push({
        'Trade Name': 'TOTALS',
        'Generic Name': '',
        'Item Code': '',
        'Date Range': '',
        'Local Patient Count': '',
        'Foreign Patient Count': '',
        'Total Sold Qty': '',
        'Total Sold Sub-Unit Qty': '',
        'Total Cost (Rs)': parseFloat(totals.totalCost.toFixed(2)),
        'Total Profit (Rs)': parseFloat(totals.totalProfit.toFixed(2)),
        'Total Sale (Rs)': parseFloat(totals.totalSale.toFixed(2))
      });
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Auto-size columns
      const colWidths = [
        { wch: 30 }, // Trade Name
        { wch: 30 }, // Generic Name
        { wch: 15 }, // Item Code
        { wch: 25 }, // Date Range
        { wch: 18 }, // Local Patient Count
        { wch: 20 }, // Foreign Patient Count
        { wch: 15 }, // Total Sold Qty
        { wch: 20 }, // Total Sold Sub-Unit Qty
        { wch: 18 }, // Total Cost
        { wch: 18 }, // Total Profit
        { wch: 18 }  // Total Sale
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
  }, [getDateRange, filterSalesByDateRange, calculateItemSalesSummary, calculateTotals, sales, sortData]);

  const renderSortIcon = (column: keyof ItemSaleSummary) => {
    if (column !== sortColumn) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 ml-1" /> 
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  // Calculate totals for the currently displayed data
  const totals = calculateTotals(previewData);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Item Sales Report</span>
            <span className="text-xs font-normal text-muted-foreground">
              {inventoryItems.length} items available
            </span>
          </CardTitle>
          <CardDescription>
            Generate a detailed report of item-wise sales for specific date ranges
          </CardDescription>
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
                    <SelectItem value="thisYear">This Year</SelectItem>
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
                          })}
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
                  <span className="text-sm text-muted-foreground">
                    Reporting data from {format(getDateRange().from!, 'dd MMM yyyy')} to {format(getDateRange().to!, 'dd MMM yyyy')}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={generatePreview}
                  disabled={isPreviewLoading}
                  className="gap-2"
                >
                  {isPreviewLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Filter className="h-4 w-4" />
                      Preview Data
                    </>
                  )}
                </Button>
                <Button onClick={handleExport} disabled={exporting} className="gap-2">
                  {exporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      Export to Excel
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogTitle>Sales Reports</DialogTitle>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle>Item Sales Preview</CardTitle>
          </CardHeader>
          
          <div className="overflow-y-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer whitespace-nowrap">
                    <div className="flex items-center">
                      Trade Name {renderSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('genericName')} className="cursor-pointer whitespace-nowrap">
                    <div className="flex items-center">
                      Generic Name {renderSortIcon('genericName')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('code')} className="cursor-pointer whitespace-nowrap">
                    <div className="flex items-center">
                      Code {renderSortIcon('code')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('localPatientCount')} className="cursor-pointer whitespace-nowrap">
                    <div className="flex items-center">
                      Local Patients {renderSortIcon('localPatientCount')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('foreignPatientCount')} className="cursor-pointer whitespace-nowrap">
                    <div className="flex items-center">
                      Foreign Patients {renderSortIcon('foreignPatientCount')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('totalSoldQty')} className="cursor-pointer whitespace-nowrap">
                    <div className="flex items-center">
                      Sold Qty {renderSortIcon('totalSoldQty')}
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <div className="flex items-center">
                      Sub-Unit Qty
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('totalCost')} className="cursor-pointer whitespace-nowrap text-right">
                    <div className="flex items-center justify-end">
                      Total Cost {renderSortIcon('totalCost')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('totalProfit')} className="cursor-pointer whitespace-nowrap text-right">
                    <div className="flex items-center justify-end">
                      Profit {renderSortIcon('totalProfit')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('totalSale')} className="cursor-pointer whitespace-nowrap text-right">
                    <div className="flex items-center justify-end">
                      Total Sale {renderSortIcon('totalSale')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      No data found in the selected date range
                    </TableCell>
                  </TableRow>
                ) : (
                  previewData.map((item) => (
                    <TableRow key={item.itemId}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.genericName || '-'}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.localPatientCount}</TableCell>
                      <TableCell>{item.foreignPatientCount}</TableCell>
                      <TableCell>{item.totalSoldQty}</TableCell>
                      <TableCell>
                        {item.totalSoldSubUnitQty > 0 
                          ? `${item.totalSoldSubUnitQty} ${item.subUnitName}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">Rs{item.totalCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        Rs{item.totalProfit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        Rs{item.totalSale.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {previewData.length > 0 && (
                <TableFooter className="bg-muted/60">
                  <TableRow className="hover:bg-muted/70">
                    <TableCell colSpan={7} className="text-right font-bold">TOTALS:</TableCell>
                    <TableCell className="text-right font-bold">Rs{totals.totalCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">Rs{totals.totalProfit.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold">Rs{totals.totalSale.toFixed(2)}</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
          
          <CardContent className="border-t pt-4 mt-auto">
            <div className="flex justify-between w-full items-center">
              <span className="text-sm text-muted-foreground">
                {previewData.length} items found
              </span>
              <Button onClick={handleExport} disabled={exporting} className="gap-2">
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    Export to Excel
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ItemSalesReport;