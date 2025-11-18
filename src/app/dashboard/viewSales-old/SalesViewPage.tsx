// // import React, { useState, useEffect } from 'react';
// // import { saleService } from '@/services/saleService';
// // import { Sale } from '@/types/sale';
// // import { Customer } from '@/types/customer';
// // import DashboardLayout from '@/components/DashboardLayout';
// // import { SalesTable } from './SalesTable';
// // import { SaleDetails } from './SaleDetails';
// // import { CustomerSelector } from './CustomerSelector';
// // import SalesLineChart from './SalesLineChart'; // Import the new component
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// // import { Calendar as CalendarComponent } from "@/components/ui/calendar";
// // import { Label } from "@/components/ui/label";
// // import { Loader2, X, Calendar } from 'lucide-react';
// // import {
// //   Dialog,
// //   DialogTitle,
// //   DialogContent,
// // } from "@/components/ui/dialog";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import SalesSummary from './SalesSummary';
// // import { ItemSelector } from './ItemSelector';
// // import ItemSalesSummary from './ItemSalesSummary';
// // import { InventoryItem } from '@/types/inventory';
// // import { inventoryService } from '@/services/inventoryService';
// // import ExportSalesButton from './ExportSalesButton';

// // export default function SalesViewPage() {
// //   const [sales, setSales] = useState<Sale[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
// //   const [showDetailsDialog, setShowDetailsDialog] = useState(false);

// //   // Filter states
// //   const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
// //   const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
// //     from: undefined,
// //     to: undefined
// //   });
// //   const [filterType, setFilterType] = useState<'all' | 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom'>('all');
  
// //   const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>();
// //   const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
// //   const [loadingInventory, setLoadingInventory] = useState(true);

// //   useEffect(() => {
// //     loadSales();
// //     loadInventoryItems();
// //   }, []);

// //   const loadInventoryItems = async () => {
// //     try {
// //       const items = await inventoryService.getAll();
// //       setInventoryItems(items);
// //       setLoadingInventory(false);
// //     } catch (error) {
// //       console.error('Error loading inventory items:', error);
// //       setLoadingInventory(false);
// //     }
// //   };
  
// //   const loadSales = async () => {
// //     try {
// //       const data = await saleService.getAll();
// //       const salesWithInventory = data.filter(sale => sale.items && sale.items.length > 0);
// //       setSales(salesWithInventory);
// //     } catch (error) {
// //       console.error('Error loading sales:', error);
// //       alert('Error loading sales data');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleViewDetails = (sale: Sale) => {
// //     setSelectedSale(sale);
// //     setShowDetailsDialog(true);
// //   };

// //   const handleCloseDetails = () => {
// //     setShowDetailsDialog(false);
// //     setSelectedSale(null);
// //   };

// //   // Filter functions
// //   const filterSales = (sales: Sale[]) => {
// //     let filteredSales = [...sales];
    
// //     const now = new Date();
// //     const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
// //     const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
// //     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
// //     const startOfYear = new Date(now.getFullYear(), 0, 1);
  
// //     switch (filterType) {
// //       case 'today':
// //         filteredSales = filteredSales.filter(sale => 
// //           sale.saleDate >= startOfDay
// //         );
// //         break;
// //       case 'thisWeek':
// //         filteredSales = filteredSales.filter(sale => 
// //           sale.saleDate >= startOfWeek
// //         );
// //         break;
// //       case 'thisMonth':
// //         filteredSales = filteredSales.filter(sale => 
// //           sale.saleDate >= startOfMonth
// //         );
// //         break;
// //       case 'thisYear':
// //         filteredSales = filteredSales.filter(sale => 
// //           sale.saleDate >= startOfYear
// //         );
// //         break;
// //       case 'custom':
// //         if (dateRange.from && dateRange.to) {
// //           filteredSales = filteredSales.filter(sale => 
// //             sale.saleDate >= dateRange.from && sale.saleDate <= dateRange.to
// //           );
// //         }
// //         break;
// //     }
  
// //     // Filter by customer
// //     if (selectedCustomer) {
// //       filteredSales = filteredSales.filter(sale => 
// //         sale.customer?.id === selectedCustomer.id
// //       );
// //     }

// //     // Filter by item
// //     if (selectedItem) {
// //       filteredSales = filteredSales.filter(sale => 
// //         sale.items.some(item => item.itemId === selectedItem.id)
// //       );
// //     }
  
// //     return filteredSales;
// //   };

// //   const handleClearFilters = () => {
// //     setFilterType('all');
// //     setDateRange({ from: undefined, to: undefined });
// //     setSelectedCustomer(undefined);
// //     setSelectedItem(undefined);
// //   };

// //   // Get filtered sales
// //   const filteredSales = filterSales(sales);

// //   if (loading) {
// //     return (
// //       <DashboardLayout>
// //         <div className="flex justify-center items-center h-full">
// //           <Loader2 className="w-8 h-8 animate-spin" />
// //         </div>
// //       </DashboardLayout>
// //     );
// //   }

// //   return (
// //     <DashboardLayout>
// //       <div className="space-y-4 p-6">
// //         <div className="flex justify-between items-center">
// //           <h1 className="text-3xl font-bold tracking-tight">Inventory Items Sales History</h1>
// //           <ExportSalesButton 
// //             sales={filteredSales}
// //             isFiltered={filterType !== 'all' || !!selectedCustomer || !!selectedItem}
// //             allSales={sales}
// //           />
// //         </div>

// //         {/* Filters */}
// //         <Card>
// //           <CardHeader>
// //             <div className="flex justify-between items-center">
// //               <CardTitle>Filters</CardTitle>
// //               <Button
// //                 variant="ghost"
// //                 size="sm"
// //                 onClick={handleClearFilters}
// //                 className="h-8"
// //               >
// //                 <X className="h-4 w-4 mr-2" />
// //                 Clear Filters
// //               </Button>
// //             </div>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //               <div className="space-y-2">
// //                 <Label>Time Period</Label>
// //                 <Select
// //                   value={filterType}
// //                   onValueChange={(value: typeof filterType) => {
// //                     setFilterType(value);
// //                     if (value !== 'custom') {
// //                       setDateRange({ from: undefined, to: undefined });
// //                     }
// //                   }}
// //                 >
// //                   <SelectTrigger>
// //                     <SelectValue placeholder="Select time period" />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     <SelectItem value="all">All Time</SelectItem>
// //                     <SelectItem value="today">Today</SelectItem>
// //                     <SelectItem value="thisWeek">This Week</SelectItem>
// //                     <SelectItem value="thisMonth">This Month</SelectItem>
// //                     <SelectItem value="thisYear">This Year</SelectItem>
// //                     <SelectItem value="custom">Custom Range</SelectItem>
// //                   </SelectContent>
// //                 </Select>
// //               </div>

// //               {filterType === 'custom' && (
// //                 <div className="space-y-2">
// //                   <Label>Date Range</Label>
// //                   <div className="flex gap-2">
// //                     <Popover>
// //                       <PopoverTrigger asChild>
// //                         <Button variant="outline" className="w-full justify-start text-left">
// //                           <Calendar className="mr-2 h-4 w-4" />
// //                           {dateRange.from ? (
// //                             dateRange.to ? (
// //                               <>
// //                                 {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
// //                               </>
// //                             ) : (
// //                               dateRange.from.toLocaleDateString()
// //                             )
// //                           ) : (
// //                             "Select dates..."
// //                           )}
// //                         </Button>
// //                       </PopoverTrigger>
// //                       <PopoverContent align="start" className="w-auto p-0">
// //                         <CalendarComponent
// //                           initialFocus
// //                           selected={{
// //                             from: dateRange.from ?? undefined,
// //                             to: dateRange.to ?? undefined
// //                           }}
// //                           mode="range"
// //                           onSelect={(selectedRange) => {
// //                             setDateRange({
// //                               from: selectedRange?.from,
// //                               to: selectedRange?.to
// //                             });
// //                           }}
// //                           numberOfMonths={1}
// //                           defaultMonth={dateRange.from ?? new Date()}
// //                           className="rounded-md border"
// //                           classNames={{
// //                             day_range_start: "rounded-l-md",
// //                             day_range_end: "rounded-r-md",
// //                             day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
// //                             day_today: "bg-accent text-accent-foreground",
// //                             day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
// //                             day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
// //                             cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
// //                           }}
// //                         />
// //                       </PopoverContent>
// //                     </Popover>
// //                   </div>
// //                 </div>
// //               )}

// //               <div className="space-y-2">
// //                 <CustomerSelector
// //                   selectedCustomer={selectedCustomer}
// //                   onSelectCustomer={setSelectedCustomer}
// //                 />
// //               </div>

// //               <div className="space-y-2">
// //                 <ItemSelector
// //                   selectedItem={selectedItem}
// //                   onSelectItem={setSelectedItem}
// //                   items={inventoryItems}
// //                   loading={loadingInventory}
// //                 />
// //               </div>
// //             </div>
// //           </CardContent>
// //         </Card>

// //         {/* Add the Sales Line Chart component */}
// //         <SalesLineChart 
// //           sales={filteredSales}
// //           dateFilterType={filterType}
// //           dateRange={dateRange}
// //         />

// //         <SalesSummary sales={filteredSales} />
        
// //         {selectedItem && (
// //           <ItemSalesSummary 
// //             sales={filteredSales}
// //             selectedItem={selectedItem}
// //           />
// //         )}

// //         {/* Sales Table */}
// //         <Card>
// //           <CardHeader>
// //             <div className="flex justify-between items-center">
// //               <CardTitle>Sales</CardTitle>
// //               <span className="text-muted-foreground">
// //                 {filteredSales.length} sales found
// //               </span>
// //             </div>
// //           </CardHeader>
// //           <CardContent>
// //             <SalesTable 
// //               sales={filteredSales}
// //               onViewDetails={handleViewDetails}
// //             />
// //           </CardContent>
// //         </Card>

// //         {/* Sale Details Dialog */}
// //         <Dialog 
// //           open={showDetailsDialog} 
// //           onOpenChange={setShowDetailsDialog}
// //         >
// //           <DialogContent className="max-w-4xl max-h-[90vh] p-0">
// //             <DialogTitle></DialogTitle>
// //             {selectedSale && (
// //               <SaleDetails 
// //                 sale={selectedSale}
// //                 onClose={handleCloseDetails}
// //                 onUpdate={loadSales}
// //               />
// //             )}
// //           </DialogContent>
// //         </Dialog>
// //       </div>
// //     </DashboardLayout>
// //   );
// // }

// // import React, { useState, useEffect } from 'react';
// // import { saleService } from '@/services/saleService';
// // import { Sale } from '@/types/sale';
// // import { Customer } from '@/types/customer';
// // import { StaffUser } from '@/types/staff';
// // import DashboardLayout from '@/components/DashboardLayout';
// // import { SalesTable } from './SalesTable';
// // import { SaleDetails } from './SaleDetails';
// // import { CustomerSelector } from './CustomerSelector';
// // import { StaffSelector } from './StaffSelector'; // Import the new component
// // import SalesLineChart from './SalesLineChart';
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// // import { Calendar as CalendarComponent } from "@/components/ui/calendar";
// // import { Label } from "@/components/ui/label";
// // import { Loader2, X, Calendar, Users } from 'lucide-react';
// // import {
// //   Dialog,
// //   DialogTitle,
// //   DialogContent,
// // } from "@/components/ui/dialog";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import SalesSummary from './SalesSummary';
// // import StaffSalesSummary from './StaffSalesSummary'; // Import the new component
// // import { ItemSelector } from './ItemSelector';
// // import ItemSalesSummary from './ItemSalesSummary';
// // import { InventoryItem } from '@/types/inventory';
// // import { inventoryService } from '@/services/inventoryService';
// // import ExportSalesButton from './ExportSalesButton';


// // export default function SalesViewPage() {
// //   const [sales, setSales] = useState<Sale[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
// //   const [showDetailsDialog, setShowDetailsDialog] = useState(false);

// //   // Filter states
// //   const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
// //   const [selectedStaff, setSelectedStaff] = useState<StaffUser | undefined>();
// //   const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
// //     from: undefined,
// //     to: undefined
// //   });
// //   const [filterType, setFilterType] = useState<'all' | 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom'>('all');
  
// //   const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>();
// //   const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
// //   const [loadingInventory, setLoadingInventory] = useState(true);

// //   useEffect(() => {
// //     loadSales();
// //     loadInventoryItems();
// //   }, []);

// //   const loadInventoryItems = async () => {
// //     try {
// //       const items = await inventoryService.getAll();
// //       setInventoryItems(items);
// //       setLoadingInventory(false);
// //     } catch (error) {
// //       console.error('Error loading inventory items:', error);
// //       setLoadingInventory(false);
// //     }
// //   };
  
// //   const loadSales = async () => {
// //     try {
// //       const data = await saleService.getAll();
// //       const salesWithInventory = data.filter(sale => sale.items && sale.items.length > 0);
// //       setSales(salesWithInventory);
// //     } catch (error) {
// //       console.error('Error loading sales:', error);
// //       alert('Error loading sales data');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleViewDetails = (sale: Sale) => {
// //     setSelectedSale(sale);
// //     setShowDetailsDialog(true);
// //   };

// //   const handleCloseDetails = () => {
// //     setShowDetailsDialog(false);
// //     setSelectedSale(null);
// //   };

// //   // Filter functions
// //   const filterSales = (sales: Sale[]) => {
// //     let filteredSales = [...sales];
    
// //     const now = new Date();
// //     const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
// //     const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
// //     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
// //     const startOfYear = new Date(now.getFullYear(), 0, 1);
  
// //     switch (filterType) {
// //       case 'today':
// //         filteredSales = filteredSales.filter(sale => 
// //           sale.saleDate >= startOfDay
// //         );
// //         break;
// //       case 'thisWeek':
// //         filteredSales = filteredSales.filter(sale => 
// //           sale.saleDate >= startOfWeek
// //         );
// //         break;
// //       case 'thisMonth':
// //         filteredSales = filteredSales.filter(sale => 
// //           sale.saleDate >= startOfMonth
// //         );
// //         break;
// //       case 'thisYear':
// //         filteredSales = filteredSales.filter(sale => 
// //           sale.saleDate >= startOfYear
// //         );
// //         break;
// //       case 'custom':
// //         if (dateRange.from && dateRange.to) {
// //           filteredSales = filteredSales.filter(sale => 
// //             sale.saleDate >= dateRange.from && sale.saleDate <= dateRange.to
// //           );
// //         }
// //         break;
// //     }
  
// //     // Filter by customer
// //     if (selectedCustomer) {
// //       filteredSales = filteredSales.filter(sale => 
// //         sale.customer?.id === selectedCustomer.id
// //       );
// //     }

// //     // Filter by staff member
// //     if (selectedStaff) {
// //       filteredSales = filteredSales.filter(sale => 
// //         sale.createdBy?.uid === selectedStaff.uid
// //       );
// //     }

// //     // Filter by item
// //     if (selectedItem) {
// //       filteredSales = filteredSales.filter(sale => 
// //         sale.items.some(item => item.itemId === selectedItem.id)
// //       );
// //     }
  
// //     return filteredSales;
// //   };

// //   const handleClearFilters = () => {
// //     setFilterType('all');
// //     setDateRange({ from: undefined, to: undefined });
// //     setSelectedCustomer(undefined);
// //     setSelectedStaff(undefined);
// //     setSelectedItem(undefined);
// //   };

// //   // Get filtered sales
// //   const filteredSales = filterSales(sales);

// //   if (loading) {
// //     return (
// //       <DashboardLayout>
// //         <div className="flex justify-center items-center h-full">
// //           <Loader2 className="w-8 h-8 animate-spin" />
// //         </div>
// //       </DashboardLayout>
// //     );
// //   }

// //   return (
// //     <DashboardLayout>
// //       <div className="space-y-4 p-6">
// //         <div className="flex justify-between items-center">
// //           <h1 className="text-3xl font-bold tracking-tight">Inventory Items Sales History</h1>
// //           <ExportSalesButton 
// //             sales={filteredSales}
// //             isFiltered={filterType !== 'all' || !!selectedCustomer || !!selectedStaff || !!selectedItem}
// //             allSales={sales}
// //           />
// //         </div>

// //         {/* Filters */}
// //         <Card>
// //           <CardHeader>
// //             <div className="flex justify-between items-center">
// //               <CardTitle>Filters</CardTitle>
// //               <Button
// //                 variant="ghost"
// //                 size="sm"
// //                 onClick={handleClearFilters}
// //                 className="h-8"
// //               >
// //                 <X className="h-4 w-4 mr-2" />
// //                 Clear Filters
// //               </Button>
// //             </div>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
// //               <div className="space-y-2">
// //                 <Label>Time Period</Label>
// //                 <Select
// //                   value={filterType}
// //                   onValueChange={(value: typeof filterType) => {
// //                     setFilterType(value);
// //                     if (value !== 'custom') {
// //                       setDateRange({ from: undefined, to: undefined });
// //                     }
// //                   }}
// //                 >
// //                   <SelectTrigger>
// //                     <SelectValue placeholder="Select time period" />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     <SelectItem value="all">All Time</SelectItem>
// //                     <SelectItem value="today">Today</SelectItem>
// //                     <SelectItem value="thisWeek">This Week</SelectItem>
// //                     <SelectItem value="thisMonth">This Month</SelectItem>
// //                     <SelectItem value="thisYear">This Year</SelectItem>
// //                     <SelectItem value="custom">Custom Range</SelectItem>
// //                   </SelectContent>
// //                 </Select>
// //               </div>

// //               {filterType === 'custom' && (
// //                 <div className="space-y-2">
// //                   <Label>Date Range</Label>
// //                   <div className="flex gap-2">
// //                     <Popover>
// //                       <PopoverTrigger asChild>
// //                         <Button variant="outline" className="w-full justify-start text-left">
// //                           <Calendar className="mr-2 h-4 w-4" />
// //                           {dateRange.from ? (
// //                             dateRange.to ? (
// //                               <>
// //                                 {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
// //                               </>
// //                             ) : (
// //                               dateRange.from.toLocaleDateString()
// //                             )
// //                           ) : (
// //                             "Select dates..."
// //                           )}
// //                         </Button>
// //                       </PopoverTrigger>
// //                       <PopoverContent align="start" className="w-auto p-0">
// //                         <CalendarComponent
// //                           initialFocus
// //                           selected={{
// //                             from: dateRange.from ?? undefined,
// //                             to: dateRange.to ?? undefined
// //                           }}
// //                           mode="range"
// //                           onSelect={(selectedRange) => {
// //                             setDateRange({
// //                               from: selectedRange?.from,
// //                               to: selectedRange?.to
// //                             });
// //                           }}
// //                           numberOfMonths={1}
// //                           defaultMonth={dateRange.from ?? new Date()}
// //                           className="rounded-md border"
// //                           classNames={{
// //                             day_range_start: "rounded-l-md",
// //                             day_range_end: "rounded-r-md",
// //                             day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
// //                             day_today: "bg-accent text-accent-foreground",
// //                             day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
// //                             day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
// //                             cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20"
// //                           }}
// //                         />
// //                       </PopoverContent>
// //                     </Popover>
// //                   </div>
// //                 </div>
// //               )}

// //               <div className="space-y-2">
// //                 <CustomerSelector
// //                   selectedCustomer={selectedCustomer}
// //                   onSelectCustomer={setSelectedCustomer}
// //                 />
// //               </div>

// //               {/* Add Staff Selector */}
// //               <div className="space-y-2">
// //                 <StaffSelector
// //                   selectedStaff={selectedStaff}
// //                   onSelectStaff={setSelectedStaff}
// //                 />
// //               </div>

// //               <div className="space-y-2">
// //                 <ItemSelector
// //                   selectedItem={selectedItem}
// //                   onSelectItem={setSelectedItem}
// //                   items={inventoryItems}
// //                   loading={loadingInventory}
// //                 />
// //               </div>
// //             </div>
// //           </CardContent>
// //         </Card>

// //         {/* Sales Summary - Always shown */}
// //         <SalesSummary sales={filteredSales} />
        
// //         {/* Staff Sales Summary - Only shown when a staff member is selected */}
// //         {selectedStaff && (
// //           <StaffSalesSummary 
// //             sales={filteredSales}
// //             selectedStaff={selectedStaff}
// //           />
// //         )}
        
// //         {/* Add the Sales Line Chart component */}
// //         <SalesLineChart 
// //           sales={filteredSales}
// //           dateFilterType={filterType}
// //           dateRange={dateRange}
// //         />
        
// //         {/* Item Sales Summary - Only shown when an item is selected */}
// //         {selectedItem && (
// //           <ItemSalesSummary 
// //             sales={filteredSales}
// //             selectedItem={selectedItem}
// //           />
// //         )}

// //         {/* Sales Table */}
// //         <Card>
// //           <CardHeader>
// //             <div className="flex justify-between items-center">
// //               <CardTitle className="flex items-center gap-2">
// //                 <Users className="h-5 w-5 text-muted-foreground" />
// //                 Sales
// //                 {selectedStaff && (
// //                   <span className="text-base font-normal text-muted-foreground ml-2">
// //                     by {selectedStaff.displayName || selectedStaff.email}
// //                   </span>
// //                 )}
// //               </CardTitle>
// //               <span className="text-muted-foreground">
// //                 {filteredSales.length} sales found
// //               </span>
// //             </div>
// //           </CardHeader>
// //           <CardContent>
// //             <SalesTable 
// //               sales={filteredSales}
// //               onViewDetails={handleViewDetails}
// //             />
// //           </CardContent>
// //         </Card>

// //         {/* Sale Details Dialog */}
// //         <Dialog 
// //           open={showDetailsDialog} 
// //           onOpenChange={setShowDetailsDialog}
// //         >
// //           <DialogContent className="max-w-4xl max-h-[90vh] p-0">
// //             <DialogTitle></DialogTitle>
// //             {selectedSale && (
// //               <SaleDetails 
// //                 sale={selectedSale}
// //                 onClose={handleCloseDetails}
// //                 onUpdate={loadSales}
// //               />
// //             )}
// //           </DialogContent>
// //         </Dialog>
// //       </div>
// //     </DashboardLayout>
// //   );
// // }

// // src/app/dashboard/viewSales/SalesViewPage.tsx
// // 'use client';

// // import React, { useState, useEffect } from 'react';
// // import { saleService } from '@/services/saleService';
// // import { Sale, PatientType } from '@/types/sale';
// // import { Customer } from '@/types/customer';
// // import { StaffUser } from '@/types/staff';
// // import DashboardLayout from '@/components/DashboardLayout';
// // import { SalesTable } from './SalesTable';
// // import { SaleDetails } from './SaleDetails';
// // import { CustomerSelector } from './CustomerSelector';
// // import { StaffSelector } from './StaffSelector';
// // import SalesLineChart from './SalesLineChart';
// // import PatientTypeSummary from './PatientTypeSummary'; // Import the new component
// // import { Button } from "@/components/ui/button";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { Label } from "@/components/ui/label";
// // import { Loader2, User, Plane } from 'lucide-react';
// // import {
// //   Dialog,
// //   DialogContent,
// // } from "@/components/ui/dialog";
// // import {
// //   Tabs,
// //   TabsContent,
// //   TabsList,
// //   TabsTrigger,
// // } from "@/components/ui/tabs";
// // import SalesSummary from './SalesSummary';
// // import StaffSalesSummary from './StaffSalesSummary';
// // import { ItemSelector } from './ItemSelector';
// // import ItemSalesSummary from './ItemSalesSummary';
// // import { InventoryItem } from '@/types/inventory';
// // import { inventoryService } from '@/services/inventoryService';
// // import ExportSalesButton from './ExportSalesButton';
// // import SalesFilter, { DateFilterType } from './SalesFilter'; // Import the updated filter component

// // function SalesViewPage() {
// //   const [sales, setSales] = useState<Sale[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
// //   const [showDetailsDialog, setShowDetailsDialog] = useState(false);

// //   // Filter states
// //   const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
// //   const [selectedStaff, setSelectedStaff] = useState<StaffUser | undefined>();
// //   const [selectedPatientType, setSelectedPatientType] = useState<PatientType | 'all' | undefined>('all');
// //   const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
// //   const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
// //   const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);
// //   const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);
// //   const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
// //     from: undefined,
// //     to: undefined
// //   });
  
// //   const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>();
// //   const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
// //   const [loadingInventory, setLoadingInventory] = useState(true);
  
// //   // Current active tab
// //   const [activeTab, setActiveTab] = useState<string>('all');

// //   useEffect(() => {
// //     loadSales();
// //     loadInventoryItems();
// //   }, []);

// //   const loadInventoryItems = async () => {
// //     try {
// //       const items = await inventoryService.getAll();
// //       setInventoryItems(items);
// //     } catch (error) {
// //       console.error('Error loading inventory items:', error);
// //     } finally {
// //       setLoadingInventory(false);
// //     }
// //   };
  
// //   const loadSales = async () => {
// //     try {
// //       setLoading(true);
// //       const data = await saleService.getAll();
// //       const salesWithInventory = data.filter(sale => sale.items && sale.items.length > 0);
// //       setSales(salesWithInventory);
// //     } catch (error) {
// //       console.error('Error loading sales:', error);
// //       alert('Error loading sales data');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleViewDetails = (sale: Sale) => {
// //     setSelectedSale(sale);
// //     setShowDetailsDialog(true);
// //   };

// //   const handleCloseDetails = () => {
// //     setShowDetailsDialog(false);
// //     setSelectedSale(null);
// //   };

// //   // Filter functions
// //   const filterSales = (sales: Sale[]) => {
// //     let filteredSales = [...sales];
    
// //     // Apply date filters
// //     switch (dateFilter) {
// //       case 'date':
// //         if (selectedDate) {
// //           const startOfDay = new Date(selectedDate);
// //           startOfDay.setHours(0, 0, 0, 0);
          
// //           const endOfDay = new Date(selectedDate);
// //           endOfDay.setHours(23, 59, 59, 999);
          
// //           filteredSales = filteredSales.filter(sale => 
// //             sale.saleDate >= startOfDay && sale.saleDate <= endOfDay
// //           );
// //         }
// //         break;
// //       case 'month':
// //         if (selectedMonth) {
// //           const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// //           const monthIndex = months.indexOf(selectedMonth);
// //           if (monthIndex !== -1) {
// //             const year = new Date().getFullYear();
// //             const startOfMonth = new Date(year, monthIndex, 1);
// //             const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
            
// //             filteredSales = filteredSales.filter(sale => 
// //               sale.saleDate >= startOfMonth && sale.saleDate <= endOfMonth
// //             );
// //           }
// //         }
// //         break;
// //       case 'year':
// //         if (selectedYear) {
// //           const year = parseInt(selectedYear);
// //           const startOfYear = new Date(year, 0, 1);
// //           const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
          
// //           filteredSales = filteredSales.filter(sale => 
// //             sale.saleDate >= startOfYear && sale.saleDate <= endOfYear
// //           );
// //         }
// //         break;
// //       case 'range':
// //         if (dateRange.from) {
// //           const startDate = new Date(dateRange.from);
// //           startDate.setHours(0, 0, 0, 0);
          
// //           filteredSales = filteredSales.filter(sale => sale.saleDate >= startDate);
          
// //           if (dateRange.to) {
// //             const endDate = new Date(dateRange.to);
// //             endDate.setHours(23, 59, 59, 999);
            
// //             filteredSales = filteredSales.filter(sale => sale.saleDate <= endDate);
// //           }
// //         }
// //         break;
// //     }
  
// //     // Filter by customer
// //     if (selectedCustomer) {
// //       filteredSales = filteredSales.filter(sale => 
// //         sale.customer?.id === selectedCustomer.id
// //       );
// //     }

// //     // Filter by staff member
// //     if (selectedStaff) {
// //       filteredSales = filteredSales.filter(sale => 
// //         sale.createdBy?.uid === selectedStaff.uid
// //       );
// //     }

// //     // Filter by patient type
// //     if (selectedPatientType && selectedPatientType !== 'all') {
// //       filteredSales = filteredSales.filter(sale => {
// //         // Use the patientType property or default to 'local' if not specified
// //         const patientType = sale.patientType || 'local';
// //         return patientType === selectedPatientType;
// //       });
// //     }

// //     // Filter by item
// //     if (selectedItem) {
// //       filteredSales = filteredSales.filter(sale => 
// //         sale.items.some(item => item.itemId === selectedItem.id)
// //       );
// //     }
  
// //     return filteredSales;
// //   };

// //   // Get filtered sales
// //   const filteredSales = filterSales(sales);
  
// //   // Get local and foreign sales for tabs
// //   const localSales = sales.filter(sale => (sale.patientType || 'local') === 'local');
// //   const foreignSales = sales.filter(sale => sale.patientType === 'foreign');
  
// //   // Get currently displayed sales based on active tab
// //   const displayedSales = activeTab === 'all' 
// //     ? filteredSales 
// //     : activeTab === 'local' 
// //       ? filteredSales.filter(sale => (sale.patientType || 'local') === 'local')
// //       : filteredSales.filter(sale => sale.patientType === 'foreign');

// //   if (loading) {
// //     return (
// //       <DashboardLayout>
// //         <div className="flex justify-center items-center h-full">
// //           <Loader2 className="w-8 h-8 animate-spin" />
// //         </div>
// //       </DashboardLayout>
// //     );
// //   }

// //   return (
// //     <DashboardLayout>
// //       <div className="space-y-4 p-6">
// //         <div className="flex justify-between items-center">
// //           <h1 className="text-3xl font-bold tracking-tight">Sales Analysis</h1>
// //           <ExportSalesButton 
// //             sales={filteredSales}
// //             isFiltered={
// //               dateFilter !== 'all' || 
// //               !!selectedCustomer || 
// //               !!selectedStaff || 
// //               !!selectedItem || 
// //               (selectedPatientType && selectedPatientType !== 'all')
// //             }
// //             allSales={sales}
// //           />
// //         </div>

// //         {/* Filters */}
// //         <SalesFilter
// //           dateFilter={dateFilter}
// //           setDateFilter={setDateFilter}
// //           selectedDate={selectedDate}
// //           setSelectedDate={setSelectedDate}
// //           selectedMonth={selectedMonth}
// //           setSelectedMonth={setSelectedMonth}
// //           selectedYear={selectedYear}
// //           setSelectedYear={setSelectedYear}
// //           dateRange={dateRange}
// //           setDateRange={setDateRange}
// //           selectedCustomer={selectedCustomer}
// //           setSelectedCustomer={setSelectedCustomer}
// //           selectedPatientType={selectedPatientType}
// //           setSelectedPatientType={setSelectedPatientType}
// //         />

// //         {/* Sales Summary - Always shown */}
// //         <SalesSummary sales={filteredSales} />
        
// //         {/* Patient Type Summary - New component */}
// //         <PatientTypeSummary sales={filteredSales} />
        
// //         {/* Staff Sales Summary - Only shown when a staff member is selected */}
// //         {selectedStaff && (
// //           <StaffSalesSummary 
// //             sales={filteredSales}
// //             selectedStaff={selectedStaff}
// //           />
// //         )}
        
// //         {/* Add the Sales Line Chart component */}
// //         <SalesLineChart 
// //           sales={filteredSales}
// //           dateFilterType={dateFilter}
// //           dateRange={dateRange}
// //           selectedDate={selectedDate}
// //           selectedMonth={selectedMonth}
// //           selectedYear={selectedYear}
// //         />
        
// //         {/* Item Sales Summary - Only shown when an item is selected */}
// //         {selectedItem && (
// //           <ItemSalesSummary 
// //             sales={filteredSales}
// //             selectedItem={selectedItem}
// //           />
// //         )}

// //         {/* Sales Table with Tabs */}
// //         <Card>
// //           <CardHeader>
// //             <div className="flex justify-between items-center">
// //               <CardTitle>Sales List</CardTitle>
// //               <span className="text-muted-foreground">
// //                 {filteredSales.length} sales found
// //               </span>
// //             </div>
// //           </CardHeader>
// //           <CardContent>
// //             <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
// //               <TabsList className="mb-4">
// //                 <TabsTrigger value="all" className="flex items-center gap-2">
// //                   All Sales
// //                   <span className="bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs">
// //                     {filteredSales.length}
// //                   </span>
// //                 </TabsTrigger>
// //                 <TabsTrigger value="local" className="flex items-center gap-2">
// //                   <User className="h-4 w-4" />
// //                   Local Patients
// //                   <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs">
// //                     {filteredSales.filter(sale => (sale.patientType || 'local') === 'local').length}
// //                   </span>
// //                 </TabsTrigger>
// //                 <TabsTrigger value="foreign" className="flex items-center gap-2">
// //                   <Plane className="h-4 w-4" />
// //                   Foreign Patients
// //                   <span className="bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 text-xs">
// //                     {filteredSales.filter(sale => sale.patientType === 'foreign').length}
// //                   </span>
// //                 </TabsTrigger>
// //               </TabsList>
              
// //               <TabsContent value="all">
// //                 <SalesTable 
// //                   sales={displayedSales}
// //                   onViewDetails={handleViewDetails}
// //                 />
// //               </TabsContent>
              
// //               <TabsContent value="local">
// //                 <SalesTable 
// //                   sales={displayedSales}
// //                   onViewDetails={handleViewDetails}
// //                 />
// //               </TabsContent>
              
// //               <TabsContent value="foreign">
// //                 <SalesTable 
// //                   sales={displayedSales}
// //                   onViewDetails={handleViewDetails}
// //                 />
// //               </TabsContent>
// //             </Tabs>
// //           </CardContent>
// //         </Card>

// //         {/* Sale Details Dialog */}
// //         <Dialog 
// //           open={showDetailsDialog} 
// //           onOpenChange={setShowDetailsDialog}
// //         >
// //           <DialogContent className="max-w-4xl max-h-[90vh] p-0">
// //             {selectedSale && (
// //               <SaleDetails 
// //                 sale={selectedSale}
// //                 onClose={handleCloseDetails}
// //                 onUpdate={loadSales}
// //               />
// //             )}
// //           </DialogContent>
// //         </Dialog>
// //       </div>
// //     </DashboardLayout>
// //   );
// // }

// // // Export with access control applied
// // export default SalesViewPage;


// // src/app/dashboard/viewSales/SalesViewPage.tsx
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { saleService } from '@/services/saleService';
// import { Sale, PatientType } from '@/types/sale';
// import { Customer } from '@/types/customer';
// import { StaffUser } from '@/types/staff';
// import DashboardLayout from '@/components/DashboardLayout';
// import { SalesTable } from './SalesTable';
// import { SaleDetails } from './SaleDetails';
// import SalesLineChart from './SalesLineChart';
// import PatientTypeSummary from './PatientTypeSummary';
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Loader2, User, Plane, Package } from 'lucide-react';
// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "@/components/ui/tabs";
// import SalesSummary from './SalesSummary';
// import StaffSalesSummary from './StaffSalesSummary';
// import { ItemSelector } from './ItemSelector';
// import ItemSalesSummary from './ItemSalesSummary';
// import { InventoryItem } from '@/types/inventory';
// import { inventoryService } from '@/services/inventoryService';
// import ExportSalesButton from './ExportSalesButton';
// import SalesFilter, { DateFilterType } from './SalesFilter';
// import { Badge } from "@/components/ui/badge";

// function SalesViewPage() {
//   const [sales, setSales] = useState<Sale[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
//   const [showDetailsDialog, setShowDetailsDialog] = useState(false);

//   // Filter states
//   const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
//   const [selectedStaff, setSelectedStaff] = useState<StaffUser | undefined>();
//   const [selectedPatientType, setSelectedPatientType] = useState<PatientType | 'all' | undefined>('all');
//   const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
//   const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
//   const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);
//   const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);
//   const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
//     from: undefined,
//     to: undefined
//   });
  
//   // Item filter
//   const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>();
//   const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
//   const [loadingInventory, setLoadingInventory] = useState(true);
  
//   // Current active tab
//   const [activeTab, setActiveTab] = useState<string>('all');

//   useEffect(() => {
//     loadSales();
//     loadInventoryItems();
//   }, []);

//   const loadInventoryItems = async () => {
//     try {
//       const items = await inventoryService.getAll();
//       setInventoryItems(items);
//     } catch (error) {
//       console.error('Error loading inventory items:', error);
//     } finally {
//       setLoadingInventory(false);
//     }
//   };
  
//   const loadSales = async () => {
//     try {
//       setLoading(true);
//       const data = await saleService.getAll();
//       const salesWithInventory = data.filter(sale => sale.items && sale.items.length > 0);
//       setSales(salesWithInventory);
//     } catch (error) {
//       console.error('Error loading sales:', error);
//       alert('Error loading sales data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewDetails = (sale: Sale) => {
//     setSelectedSale(sale);
//     setShowDetailsDialog(true);
//   };

//   const handleCloseDetails = () => {
//     setShowDetailsDialog(false);
//     setSelectedSale(null);
//   };

//   // Filter functions
//   const filterSales = (sales: Sale[]) => {
//     let filteredSales = [...sales];
    
//     // Apply date filters
//     switch (dateFilter) {
//       case 'date':
//         if (selectedDate) {
//           const startOfDay = new Date(selectedDate);
//           startOfDay.setHours(0, 0, 0, 0);
          
//           const endOfDay = new Date(selectedDate);
//           endOfDay.setHours(23, 59, 59, 999);
          
//           filteredSales = filteredSales.filter(sale => 
//             sale.saleDate >= startOfDay && sale.saleDate <= endOfDay
//           );
//         }
//         break;
//       case 'month':
//         if (selectedMonth) {
//           const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
//           const monthIndex = months.indexOf(selectedMonth);
//           if (monthIndex !== -1) {
//             const year = new Date().getFullYear();
//             const startOfMonth = new Date(year, monthIndex, 1);
//             const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
            
//             filteredSales = filteredSales.filter(sale => 
//               sale.saleDate >= startOfMonth && sale.saleDate <= endOfMonth
//             );
//           }
//         }
//         break;
//       case 'year':
//         if (selectedYear) {
//           const year = parseInt(selectedYear);
//           const startOfYear = new Date(year, 0, 1);
//           const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
          
//           filteredSales = filteredSales.filter(sale => 
//             sale.saleDate >= startOfYear && sale.saleDate <= endOfYear
//           );
//         }
//         break;
//       case 'range':
//         if (dateRange.from) {
//           const startDate = new Date(dateRange.from);
//           startDate.setHours(0, 0, 0, 0);
          
//           filteredSales = filteredSales.filter(sale => sale.saleDate >= startDate);
          
//           if (dateRange.to) {
//             const endDate = new Date(dateRange.to);
//             endDate.setHours(23, 59, 59, 999);
            
//             filteredSales = filteredSales.filter(sale => sale.saleDate <= endDate);
//           }
//         }
//         break;
//     }
  
//     // Filter by customer
//     if (selectedCustomer) {
//       filteredSales = filteredSales.filter(sale => 
//         sale.customer?.id === selectedCustomer.id
//       );
//     }

//     // Filter by staff member
//     if (selectedStaff) {
//       filteredSales = filteredSales.filter(sale => 
//         sale.createdBy?.uid === selectedStaff.uid
//       );
//     }

//     // Filter by patient type
//     if (selectedPatientType && selectedPatientType !== 'all') {
//       filteredSales = filteredSales.filter(sale => {
//         // Use the patientType property or default to 'local' if not specified
//         const patientType = sale.patientType || 'local';
//         return patientType === selectedPatientType;
//       });
//     }

//     // Filter by item
//     if (selectedItem) {
//       filteredSales = filteredSales.filter(sale => 
//         sale.items.some(item => item.itemId === selectedItem.id)
//       );
//     }
  
//     return filteredSales;
//   };

//   // Get filtered sales
//   const filteredSales = filterSales(sales);
  
//   // Get currently displayed sales based on active tab
//   const displayedSales = activeTab === 'all' 
//     ? filteredSales 
//     : activeTab === 'local' 
//       ? filteredSales.filter(sale => (sale.patientType || 'local') === 'local')
//       : filteredSales.filter(sale => sale.patientType === 'foreign');

//   if (loading) {
//     return (
//       <DashboardLayout>
//         <div className="flex justify-center items-center h-full">
//           <Loader2 className="w-8 h-8 animate-spin" />
//         </div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout>
//       <div className="space-y-4 p-6">
//         <div className="flex justify-between items-center">
//           <h1 className="text-3xl font-bold tracking-tight">Sales Analysis</h1>
//           <ExportSalesButton 
//             sales={filteredSales}
//             isFiltered={
//               dateFilter !== 'all' || 
//               !!selectedCustomer || 
//               !!selectedStaff || 
//               !!selectedItem || 
//               (selectedPatientType && selectedPatientType !== 'all')
//             }
//             allSales={sales}
//           />
//         </div>

//         {/* Filters */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Filters</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {/* Date and Customer Filters */}
//               <SalesFilter
//                 dateFilter={dateFilter}
//                 setDateFilter={setDateFilter}
//                 selectedDate={selectedDate}
//                 setSelectedDate={setSelectedDate}
//                 selectedMonth={selectedMonth}
//                 setSelectedMonth={setSelectedMonth}
//                 selectedYear={selectedYear}
//                 setSelectedYear={setSelectedYear}
//                 dateRange={dateRange}
//                 setDateRange={setDateRange}
//                 selectedCustomer={selectedCustomer}
//                 setSelectedCustomer={setSelectedCustomer}
//                 selectedPatientType={selectedPatientType}
//                 setSelectedPatientType={setSelectedPatientType}
//               />

//               {/* Item Filter - Added Back */}
//               <div className="mt-4 border-t pt-4">
//                 <ItemSelector
//                   selectedItem={selectedItem}
//                   onSelectItem={setSelectedItem}
//                   items={inventoryItems}
//                   loading={loadingInventory}
//                 />
//                 {selectedItem && (
//                   <div className="mt-2">
//                     <Badge 
//                       className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
//                       variant="secondary"
//                     >
//                       <Package className="h-3 w-3 mr-1" /> {selectedItem.name}
//                       <button className="ml-1" onClick={() => setSelectedItem(undefined)}>×</button>
//                     </Badge>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Sales Summary - Always shown */}
//         <SalesSummary sales={filteredSales} />
        
//         {/* Patient Type Summary */}
//         <PatientTypeSummary sales={filteredSales} />
        
//         {/* Staff Sales Summary - Only shown when a staff member is selected */}
//         {selectedStaff && (
//           <StaffSalesSummary 
//             sales={filteredSales}
//             selectedStaff={selectedStaff}
//           />
//         )}
        
//         {/* Item Sales Summary - Only shown when an item is selected */}
//         {selectedItem && (
//           <ItemSalesSummary 
//             sales={filteredSales}
//             selectedItem={selectedItem}
//           />
//         )}
        
//         {/* Sales Line Chart */}
//         <SalesLineChart 
//           sales={filteredSales}
//           dateFilterType={dateFilter}
//           dateRange={dateRange}
//           selectedDate={selectedDate}
//           selectedMonth={selectedMonth}
//           selectedYear={selectedYear}
//         />

//         {/* Sales Table with Tabs */}
//         <Card>
//           <CardHeader>
//             <div className="flex justify-between items-center">
//               <CardTitle>Sales List</CardTitle>
//               <span className="text-muted-foreground">
//                 {filteredSales.length} sales found
//               </span>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
//               <TabsList className="mb-4">
//                 <TabsTrigger value="all" className="flex items-center gap-2">
//                   All Sales
//                   <span className="bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs">
//                     {filteredSales.length}
//                   </span>
//                 </TabsTrigger>
//                 <TabsTrigger value="local" className="flex items-center gap-2">
//                   <User className="h-4 w-4" />
//                   Local Patients
//                   <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs">
//                     {filteredSales.filter(sale => (sale.patientType || 'local') === 'local').length}
//                   </span>
//                 </TabsTrigger>
//                 <TabsTrigger value="foreign" className="flex items-center gap-2">
//                   <Plane className="h-4 w-4" />
//                   Foreign Patients
//                   <span className="bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 text-xs">
//                     {filteredSales.filter(sale => sale.patientType === 'foreign').length}
//                   </span>
//                 </TabsTrigger>
//               </TabsList>
              
//               <TabsContent value="all">
//                 <SalesTable 
//                   sales={displayedSales}
//                   onViewDetails={handleViewDetails}
//                 />
//               </TabsContent>
              
//               <TabsContent value="local">
//                 <SalesTable 
//                   sales={displayedSales}
//                   onViewDetails={handleViewDetails}
//                 />
//               </TabsContent>
              
//               <TabsContent value="foreign">
//                 <SalesTable 
//                   sales={displayedSales}
//                   onViewDetails={handleViewDetails}
//                 />
//               </TabsContent>
//             </Tabs>
//           </CardContent>
//         </Card>

//         {/* Sale Details Dialog */}
//         {/* <Dialog 
//           open={showDetailsDialog} 
//           onOpenChange={setShowDetailsDialog}
//         >
//           <DialogContent className="max-w-4xl max-h-[90vh] p-0">
//             {selectedSale && (
//               <SaleDetails 
//                 sale={selectedSale}
//                 onClose={handleCloseDetails}
//                 onUpdate={loadSales}
//               />
//             )}
//           </DialogContent>
//         </Dialog> */}

//         <Dialog 
//           open={showDetailsDialog} 
//           onOpenChange={setShowDetailsDialog}
//         >
//           <DialogContent className="max-w-4xl max-h-[90vh] p-0">
//             <DialogTitle className="sr-only">Sale Details</DialogTitle>
//             {selectedSale && (
//               <SaleDetails 
//                 sale={selectedSale}
//                 onClose={handleCloseDetails}
//                 onUpdate={loadSales}
//               />
//             )}
//           </DialogContent>
//         </Dialog>


//       </div>
//     </DashboardLayout>
//   );
// }

// export default SalesViewPage;

// src/app/dashboard/viewSales/SalesViewPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { saleService } from '@/services/saleService';
import { Sale, PatientType } from '@/types/sale';
import { Customer } from '@/types/customer';
import { StaffUser } from '@/types/staff';
import DashboardLayout from '@/components/DashboardLayout';
import { SalesTable } from './SalesTable';
import { SaleDetails } from './SaleDetails';
import SalesLineChart from './SalesLineChart';
import PatientTypeSummary from './PatientTypeSummary';
import ItemSalesReport from './ItemSalesReport'; // Import the new component
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Loader2, 
  User, 
  Plane, 
  Package, 
  FileSpreadsheet, 
  BarChart, 
  PieChart,
  Table as TableIcon,
  ShieldCheck
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import SalesSummary from './SalesSummary';
import StaffSalesSummary from './StaffSalesSummary';
import { ItemSelector } from './ItemSelector';
import ItemSalesSummary from './ItemSalesSummary';
import { InventoryItem } from '@/types/inventory';
import { inventoryService } from '@/services/inventoryService';
import ExportSalesButton from './ExportSalesButton';
import SalesFilter, { DateFilterType } from './SalesFilter';
import { Badge } from "@/components/ui/badge";

import InsuranceSalesTab from './InsuranceSalesTab';

function SalesViewPage() {
  const [activeView, setActiveView] = useState<'dashboard' | 'reports'>('dashboard');
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Filter states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | undefined>();
  const [selectedPatientType, setSelectedPatientType] = useState<PatientType | 'all' | undefined>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  
  // Item filter
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  
  // Current active tab
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    loadSales();
    loadInventoryItems();
  }, []);

  const loadInventoryItems = async () => {
    try {
      const items = await inventoryService.getAll();
      setInventoryItems(items);
    } catch (error) {
      console.error('Error loading inventory items:', error);
    } finally {
      setLoadingInventory(false);
    }
  };
  
  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await saleService.getAll();
      const salesWithInventory = data.filter(sale => sale.items && sale.items.length > 0);
      setSales(salesWithInventory);
    } catch (error) {
      console.error('Error loading sales:', error);
      alert('Error loading sales data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsDialog(false);
    setSelectedSale(null);
  };

  // Filter functions
  const filterSales = (sales: Sale[]) => {
    let filteredSales = [...sales];
    
    // Apply date filters
    switch (dateFilter) {
      case 'date':
        if (selectedDate) {
          const startOfDay = new Date(selectedDate);
          startOfDay.setHours(0, 0, 0, 0);
          
          const endOfDay = new Date(selectedDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          filteredSales = filteredSales.filter(sale => 
            sale.saleDate >= startOfDay && sale.saleDate <= endOfDay
          );
        }
        break;
      case 'month':
        if (selectedMonth) {
          const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const monthIndex = months.indexOf(selectedMonth);
          if (monthIndex !== -1) {
            const year = new Date().getFullYear();
            const startOfMonth = new Date(year, monthIndex, 1);
            const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
            
            filteredSales = filteredSales.filter(sale => 
              sale.saleDate >= startOfMonth && sale.saleDate <= endOfMonth
            );
          }
        }
        break;
      case 'year':
        if (selectedYear) {
          const year = parseInt(selectedYear);
          const startOfYear = new Date(year, 0, 1);
          const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
          
          filteredSales = filteredSales.filter(sale => 
            sale.saleDate >= startOfYear && sale.saleDate <= endOfYear
          );
        }
        break;
      case 'range':
        if (dateRange.from) {
          const startDate = new Date(dateRange.from);
          startDate.setHours(0, 0, 0, 0);
          
          filteredSales = filteredSales.filter(sale => sale.saleDate >= startDate);
          
          if (dateRange.to) {
            const endDate = new Date(dateRange.to);
            endDate.setHours(23, 59, 59, 999);
            
            filteredSales = filteredSales.filter(sale => sale.saleDate <= endDate);
          }
        }
        break;
    }
  
    // Filter by customer
    if (selectedCustomer) {
      filteredSales = filteredSales.filter(sale => 
        sale.customer?.id === selectedCustomer.id
      );
    }

    // Filter by staff member
    if (selectedStaff) {
      filteredSales = filteredSales.filter(sale => 
        sale.createdBy?.uid === selectedStaff.uid
      );
    }

    // Filter by patient type
    if (selectedPatientType && selectedPatientType !== 'all') {
      filteredSales = filteredSales.filter(sale => {
        // Use the patientType property or default to 'local' if not specified
        const patientType = sale.patientType || 'local';
        return patientType === selectedPatientType;
      });
    }

    // Filter by item
    if (selectedItem) {
      filteredSales = filteredSales.filter(sale => 
        sale.items.some(item => item.itemId === selectedItem.id)
      );
    }
  
    return filteredSales;
  };

  // Get filtered sales
  const filteredSales = filterSales(sales);
  
  // Get currently displayed sales based on active tab
  const displayedSales = activeTab === 'all' 
    ? filteredSales 
    : activeTab === 'local' 
      ? filteredSales.filter(sale => (sale.patientType || 'local') === 'local')
      : filteredSales.filter(sale => sale.patientType === 'foreign');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Sales Analysis</h1>
          <div className="flex gap-2">
            {/* View toggle buttons */}
            <Tabs value={activeView} onValueChange={(view) => setActiveView(view)} className="w-[400px]">
              <TabsList className="grid w-full grid-cols-3"> {/* Change from grid-cols-2 to grid-cols-3 */}
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  <span>Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Item Reports</span>
                </TabsTrigger>
                <TabsTrigger value="insurance" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Insurance</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {activeView === 'dashboard' && (
              <ExportSalesButton 
                sales={filteredSales}
                isFiltered={
                  dateFilter !== 'all' || 
                  !!selectedCustomer || 
                  !!selectedStaff || 
                  !!selectedItem || 
                  (selectedPatientType && selectedPatientType !== 'all')
                }
                allSales={sales}
              />
            )}
          </div>
        </div>

        {activeView === 'dashboard' ? (
          // Dashboard View
          <>
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Date and Customer Filters */}
                  <SalesFilter
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    selectedCustomer={selectedCustomer}
                    setSelectedCustomer={setSelectedCustomer}
                    selectedPatientType={selectedPatientType}
                    setSelectedPatientType={setSelectedPatientType}
                  />

                  {/* Item Filter */}
                  <div className="mt-4 border-t pt-4">
                    <ItemSelector
                      selectedItem={selectedItem}
                      onSelectItem={setSelectedItem}
                      items={inventoryItems}
                      loading={loadingInventory}
                    />
                    {selectedItem && (
                      <div className="mt-2">
                        <Badge 
                          className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                          variant="secondary"
                        >
                          <Package className="h-3 w-3 mr-1" /> {selectedItem.name}
                          <button className="ml-1" onClick={() => setSelectedItem(undefined)}>×</button>
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales Summary */}
            <SalesSummary sales={filteredSales} />
            
            {/* Patient Type Summary */}
            <PatientTypeSummary sales={filteredSales} />
            
            {/* Staff Sales Summary - Only shown when a staff member is selected */}
            {selectedStaff && (
              <StaffSalesSummary 
                sales={filteredSales}
                selectedStaff={selectedStaff}
              />
            )}
            
            {/* Item Sales Summary - Only shown when an item is selected */}
            {selectedItem && (
              <ItemSalesSummary 
                sales={filteredSales}
                selectedItem={selectedItem}
              />
            )}
            
            {/* Sales Line Chart */}
            <SalesLineChart 
              sales={filteredSales}
              dateFilterType={dateFilter}
              dateRange={dateRange}
              selectedDate={selectedDate}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />

            {/* Sales Table with Tabs */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Sales List</CardTitle>
                  <span className="text-muted-foreground">
                    {filteredSales.length} sales found
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                      All Sales
                      <span className="bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                        {filteredSales.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="local" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Local Patients
                      <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs">
                        {filteredSales.filter(sale => (sale.patientType || 'local') === 'local').length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="foreign" className="flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      Foreign Patients
                      <span className="bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 text-xs">
                        {filteredSales.filter(sale => sale.patientType === 'foreign').length}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all">
                    <SalesTable 
                      sales={displayedSales}
                      onViewDetails={handleViewDetails}
                    />
                  </TabsContent>
                  
                  <TabsContent value="local">
                    <SalesTable 
                      sales={displayedSales}
                      onViewDetails={handleViewDetails}
                    />
                  </TabsContent>
                  
                  <TabsContent value="foreign">
                    <SalesTable 
                      sales={displayedSales}
                      onViewDetails={handleViewDetails}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        ) : activeView === 'reports' ? (
          // Reports View
          <>
            <div className="grid grid-cols-1 gap-6">
              {/* Item Sales Report */}
              <ItemSalesReport 
                sales={sales}
                inventoryItems={inventoryItems}
              />
              
              {/* You can add more report types here */}
            </div>
          </>
        ) : (
          // Insurance View
          <InsuranceSalesTab 
            sales={sales} 
            onViewDetails={handleViewDetails}
          />
        )}

        {/* Sale Details Dialog */}
        <Dialog 
          open={showDetailsDialog} 
          onOpenChange={setShowDetailsDialog}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogTitle className="sr-only">Sale Details</DialogTitle>
            {selectedSale && (
              <SaleDetails 
                sale={selectedSale}
                onClose={handleCloseDetails}
                onUpdate={loadSales}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default SalesViewPage;