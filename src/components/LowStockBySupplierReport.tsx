// 'use client';

// import React, { useState, useEffect } from 'react';
// import { inventoryService } from '@/services/inventoryService';
// import { purchaseService } from '@/services/purchaseService';
// import { supplierService } from '@/services/supplierService';
// import { InventoryItem } from '@/types/inventory';
// import { Supplier } from '@/types/supplier';
// import { useRouter } from 'next/navigation';
// import { Purchase } from '@/types/purchase';
// import { 
//   Card, 
//   CardContent, 
//   CardDescription, 
//   CardFooter, 
//   CardHeader, 
//   CardTitle 
// } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { 
//   Table, 
//   TableBody, 
//   TableCell, 
//   TableHead, 
//   TableHeader, 
//   TableRow 
// } from '@/components/ui/table';
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion";
// import { 
//   AlertOctagon, 
//   ShoppingCart, 
//   Loader2, 
//   Phone, 
//   Mail, 
//   Search, 
//   X, 
//   FileText,
//   ArrowDown,
//   Filter
// } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
// import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// import { 
//   Select, 
//   SelectContent, 
//   SelectItem, 
//   SelectTrigger, 
//   SelectValue 
// } from '@/components/ui/select';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// // Interface for grouped supplier data
// interface SupplierWithLowStockItems {
//   supplier: Supplier;
//   lowStockItems: {
//     item: InventoryItem;
//     currentStock: number;
//     lastPurchaseDate: Date | null;
//   }[];
//   totalItems: number;
// }

// export default function LowStockBySupplierReport() {
//   // State variables
//   const [loading, setLoading] = useState(true);
//   const [suppliers, setSuppliers] = useState<Supplier[]>([]);
//   const [inventory, setInventory] = useState<InventoryItem[]>([]);
//   const [purchases, setPurchases] = useState<Purchase[]>([]);
//   const [supplierStockData, setSupplierStockData] = useState<SupplierWithLowStockItems[]>([]);
//   const [filteredData, setFilteredData] = useState<SupplierWithLowStockItems[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [priorityFilter, setPriorityFilter] = useState<string>('all');
//   const [activeTab, setActiveTab] = useState('bySupplier');

//   const router = useRouter();


//   // Load all necessary data
//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       try {
//         // Load all suppliers, inventory items, and purchases
//         const [allSuppliers, allInventory, allPurchases] = await Promise.all([
//           supplierService.getAll(),
//           inventoryService.getAll(),
//           purchaseService.getAll()
//         ]);
        
//         setSuppliers(allSuppliers);
//         setInventory(allInventory);
//         setPurchases(allPurchases);
        
//         // Process the data
//         processLowStockData(allSuppliers, allInventory, allPurchases);
//       } catch (error) {
//         console.error('Error loading data:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     loadData();
//   }, []);
  
//   // Apply filters when search query or priority filter changes
//   useEffect(() => {
//     filterData();
//   }, [searchQuery, priorityFilter, supplierStockData]);
  
//   // Process the raw data to identify low stock items by supplier
//   const processLowStockData = (
//     allSuppliers: Supplier[], 
//     allInventory: InventoryItem[], 
//     allPurchases: Purchase[]
//   ) => {
//     // Identify low stock items first
//     const lowStockItems = allInventory.filter(item => 
//       // You'd normally check actual stock here - for now using minQuantity as a placeholder
//       // This should be replaced with actual stock calculation logic
//       item.minQuantity > 0
//     );
    
//     if (lowStockItems.length === 0) {
//       setSupplierStockData([]);
//       return;
//     }
    
//     // Build a mapping of items to their most recent supplier
//     const itemToSupplierMap = new Map();
    
//     // Process all purchases to find the most recent supplier for each item
//     allPurchases.forEach(purchase => {
//       const supplier = allSuppliers.find(s => s.id === purchase.supplierId);
//       if (!supplier) return;
      
//       purchase.items.forEach(purchaseItem => {
//         const currentMapping = itemToSupplierMap.get(purchaseItem.itemId);
        
//         // If we haven't seen this item yet, or this purchase is more recent
//         if (!currentMapping || purchase.purchaseDate > currentMapping.lastPurchaseDate) {
//           itemToSupplierMap.set(purchaseItem.itemId, {
//             supplier,
//             lastPurchaseDate: purchase.purchaseDate
//           });
//         }
//       });
//     });
    
//     // Group low stock items by supplier
//     const supplierMap = new Map<string, SupplierWithLowStockItems>();
    
//     lowStockItems.forEach(item => {
//       const supplierInfo = itemToSupplierMap.get(item.id);
      
//       if (!supplierInfo) {
//         // If no supplier found for this item, we could handle it differently
//         // For now, we'll skip it
//         return;
//       }
      
//       const { supplier, lastPurchaseDate } = supplierInfo;
      
//       if (!supplier.id) return;
      
//       // Get or create entry for this supplier
//       if (!supplierMap.has(supplier.id)) {
//         supplierMap.set(supplier.id, {
//           supplier,
//           lowStockItems: [],
//           totalItems: 0
//         });
//       }
      
//       // Calculate current stock (placeholder - replace with actual calculation)
//       // This is where you'd implement your actual stock calculation logic
//       const currentStock = Math.floor(Math.random() * item.minQuantity); // Just a placeholder
      
//       // Add this item to the supplier's list
//       const supplierData = supplierMap.get(supplier.id);
//       if (supplierData) {
//         supplierData.lowStockItems.push({
//           item,
//           currentStock,
//           lastPurchaseDate
//         });
//         supplierData.totalItems += 1;
//       }
//     });
    
//     // Convert map to array and sort by number of low stock items (descending)
//     const result = Array.from(supplierMap.values())
//       .filter(data => data.lowStockItems.length > 0)
//       .sort((a, b) => b.totalItems - a.totalItems);
    
//     setSupplierStockData(result);
//   };
  
//   // Filter data based on search query and priority filter
//   const filterData = () => {
//     const query = searchQuery.toLowerCase().trim();
    
//     let filtered = supplierStockData;
    
//     // Apply search filter
//     if (query) {
//       filtered = filtered.map(supplierData => {
//         // Filter items within each supplier
//         const filteredItems = supplierData.lowStockItems.filter(itemData => 
//           itemData.item.name.toLowerCase().includes(query) ||
//           itemData.item.code.toLowerCase().includes(query) ||
//           itemData.item.type.toLowerCase().includes(query)
//         );
        
//         // Only include this supplier if they have matching items
//         if (filteredItems.length === 0) {
//           return null;
//         }
        
//         // Return a new object with filtered items
//         return {
//           ...supplierData,
//           lowStockItems: filteredItems,
//           totalItems: filteredItems.length
//         };
//       }).filter(Boolean) as SupplierWithLowStockItems[];
//     }
    
//     // Apply priority filter
//     if (priorityFilter !== 'all') {
//       filtered = filtered.map(supplierData => {
//         let filteredItems;
        
//         if (priorityFilter === 'critical') {
//           // Critical: Stock is 0 or less than 25% of minimum
//           filteredItems = supplierData.lowStockItems.filter(itemData => 
//             itemData.currentStock === 0 || 
//             itemData.currentStock < (itemData.item.minQuantity * 0.25)
//           );
//         } else if (priorityFilter === 'low') {
//           // Low: Stock is between 25% and 75% of minimum
//           filteredItems = supplierData.lowStockItems.filter(itemData => 
//             itemData.currentStock >= (itemData.item.minQuantity * 0.25) && 
//             itemData.currentStock <= (itemData.item.minQuantity * 0.75)
//           );
//         } else if (priorityFilter === 'normal') {
//           // Normal: Stock is above 75% of minimum
//           filteredItems = supplierData.lowStockItems.filter(itemData => 
//             itemData.currentStock > (itemData.item.minQuantity * 0.75)
//           );
//         }
        
//         // Only include this supplier if they have matching items
//         if (!filteredItems || filteredItems.length === 0) {
//           return null;
//         }
        
//         // Return a new object with filtered items
//         return {
//           ...supplierData,
//           lowStockItems: filteredItems,
//           totalItems: filteredItems.length
//         };
//       }).filter(Boolean) as SupplierWithLowStockItems[];
//     }
    
//     // Sort by priority level (most critical first) within each supplier
//     filtered = filtered.map(supplierData => {
//       const sortedItems = [...supplierData.lowStockItems].sort((a, b) => {
//         const aRatio = a.currentStock / a.item.minQuantity;
//         const bRatio = b.currentStock / b.item.minQuantity;
//         return aRatio - bRatio; // Lower ratio (more critical) comes first
//       });
      
//       return {
//         ...supplierData,
//         lowStockItems: sortedItems
//       };
//     });
    
//     setFilteredData(filtered);
//   };
  
//   // Clear search input
//   const clearSearch = () => {
//     setSearchQuery('');
//   };
  
//   // Get color based on stock level
//   const getStockStatusColor = (current: number, minimum: number) => {
//     const ratio = current / minimum;
    
//     if (ratio === 0) return 'bg-red-500'; // Out of stock
//     if (ratio < 0.25) return 'bg-red-400'; // Critical
//     if (ratio < 0.5) return 'bg-orange-400'; // Very Low
//     if (ratio < 0.75) return 'bg-amber-300'; // Low
//     return 'bg-emerald-400'; // OK
//   };
  
//   // Get text label based on stock level
//   const getStockStatusText = (current: number, minimum: number) => {
//     const ratio = current / minimum;
    
//     if (ratio === 0) return 'Out of Stock';
//     if (ratio < 0.25) return 'Critical';
//     if (ratio < 0.5) return 'Very Low';
//     if (ratio < 0.75) return 'Low';
//     return 'OK';
//   };
  
//   // Generate initials for avatar
//   const generateInitials = (name: string) => {
//     return name
//       .split(' ')
//       .map(part => part[0])
//       .join('')
//       .toUpperCase()
//       .substring(0, 2);
//   };

//   // Get random color for avatar based on supplier name
//   const getSupplierColor = (name: string) => {
//     const colors = [
//       'bg-blue-500',
//       'bg-emerald-500',
//       'bg-violet-500',
//       'bg-amber-500',
//       'bg-rose-500',
//       'bg-indigo-500',
//       'bg-cyan-500',
//       'bg-fuchsia-500',
//       'bg-teal-500',
//     ];
    
//     // Simple hash to get a consistent color for a supplier name
//     const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
//     return colors[hash % colors.length];
//   };
  
//   // Format date
//   const formatDate = (date: Date | null) => {
//     if (!date) return 'N/A';
//     return new Intl.DateTimeFormat('en-US', { 
//       year: 'numeric', 
//       month: 'short', 
//       day: 'numeric' 
//     }).format(date);
//   };
  
//   // Render by supplier view
//   const renderBySupplierView = () => {
//     if (filteredData.length === 0) {
//       return (
//         <div className="flex items-center justify-center p-8 bg-white rounded-xl border" style={{ minHeight: "400px" }}>
//           <div className="text-center">
//             <div className="bg-slate-100 p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
//               <ShoppingCart className="w-8 h-8 text-slate-400" />
//             </div>
//             <h3 className="text-xl font-medium text-slate-800 mb-2">No low stock items found</h3>
//             <p className="text-slate-500">
//               {searchQuery || priorityFilter !== 'all' 
//                 ? 'Try adjusting your search or filter criteria' 
//                 : 'All your inventory items appear to be well-stocked'}
//             </p>
//             {(searchQuery || priorityFilter !== 'all') && (
//               <Button 
//                 onClick={() => {
//                   setSearchQuery('');
//                   setPriorityFilter('all');
//                 }}
//                 variant="link" 
//                 className="mt-2 text-blue-600"
//               >
//                 Clear filters
//               </Button>
//             )}
//           </div>
//         </div>
//       );
//     }
    
//     return (
//       <div className="space-y-6">
//         <Accordion type="multiple" defaultValue={[filteredData[0]?.supplier.id || '']}>
//           {filteredData.map((supplierData) => (
//             <AccordionItem 
//               key={supplierData.supplier.id} 
//               value={supplierData.supplier.id || ''} 
//               className="border bg-white rounded-xl mb-4 overflow-hidden shadow-sm"
//             >
//               <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 hover:no-underline">
//                 <div className="flex items-center justify-between w-full">
//                   <div className="flex items-center gap-3">
//                     <Avatar className={`h-10 w-10 ${getSupplierColor(supplierData.supplier.name)}`}>
//                       <AvatarFallback className="text-white text-sm font-medium">
//                         {generateInitials(supplierData.supplier.name)}
//                       </AvatarFallback>
//                     </Avatar>
//                     <div className="text-left">
//                       <h3 className="text-lg font-semibold">{supplierData.supplier.name}</h3>
//                       <div className="flex items-center gap-2 text-sm text-slate-500">
//                         <Phone className="h-3.5 w-3.5" />
//                         <span>{supplierData.supplier.phone}</span>
//                         {supplierData.supplier.status === 'active' ? (
//                           <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
//                             Active
//                           </Badge>
//                         ) : (
//                           <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
//                             Inactive
//                           </Badge>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
//                       <AlertOctagon className="h-3.5 w-3.5 mr-1" />
//                       {supplierData.totalItems} Low Stock Items
//                     </Badge>
//                     <ArrowDown className="h-4 w-4 text-slate-400 shrink-0" />
//                   </div>
//                 </div>
//               </AccordionTrigger>
//               <AccordionContent className="px-0 pt-2 pb-0">
//                 <div className="border-t">
//                   <Table>
//                     <TableHeader className="bg-slate-50">
//                       <TableRow>
//                         <TableHead className="w-[40%]">Item</TableHead>
//                         <TableHead>Type</TableHead>
//                         <TableHead className="text-right">Min. Qty</TableHead>
//                         <TableHead className="text-right">Current Stock</TableHead>
//                         <TableHead className="text-right">Status</TableHead>
//                         <TableHead className="text-right">Last Ordered</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {supplierData.lowStockItems.map((itemData) => (
//                         <TableRow key={itemData.item.id} className="hover:bg-slate-50">
//                           <TableCell className="font-medium">
//                             <div className="flex items-center gap-2">
//                               <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
//                                 {itemData.item.code.substring(0, 2)}
//                               </span>
//                               <div>
//                                 <div>{itemData.item.name}</div>
//                                 <div className="text-xs text-slate-500">Code: {itemData.item.code}</div>
//                               </div>
//                             </div>
//                           </TableCell>
//                           <TableCell>{itemData.item.type}</TableCell>
//                           <TableCell className="text-right">{itemData.item.minQuantity}</TableCell>
//                           <TableCell className="text-right font-semibold">
//                             {itemData.currentStock}
//                           </TableCell>
//                           <TableCell className="text-right">
//                             <div className="flex items-center justify-end">
//                               <Badge 
//                                 variant="outline"
//                                 className={`${getStockStatusColor(itemData.currentStock, itemData.item.minQuantity)} text-white border-0`}
//                               >
//                                 {getStockStatusText(itemData.currentStock, itemData.item.minQuantity)}
//                               </Badge>
//                             </div>
//                           </TableCell>
//                           <TableCell className="text-right text-slate-600">
//                             {formatDate(itemData.lastPurchaseDate)}
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
                
//                 <div className="bg-slate-50 p-4 border-t flex justify-between items-center">
//                   <div className="text-sm text-slate-500">
//                     {supplierData.supplier.contactPerson ? (
//                       <span>Contact person: <span className="font-medium">{supplierData.supplier.contactPerson}</span></span>
//                     ) : (
//                       <span>No contact person specified</span>
//                     )}
//                   </div>
//                   <div className="flex gap-2">
//                     <Button size="sm" variant="outline" className="gap-1.5">
//                       <FileText className="h-4 w-4" />
//                       Save Report
//                     </Button>
//                     <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
//                     onClick={() => router.push('/dashboard/purchases')} >
//                       <ShoppingCart className="h-4 w-4" />
//                       Order Items
//                     </Button>
//                   </div>
//                 </div>
//               </AccordionContent>
//             </AccordionItem>
//           ))}
//         </Accordion>
//       </div>
//     );
//   };
  
//   // Render all items view
//   const renderAllItemsView = () => {
//     // Flatten all items into a single list
//     const allLowStockItems = filteredData.flatMap(supplierData => 
//       supplierData.lowStockItems.map(item => ({
//         ...item,
//         supplier: supplierData.supplier
//       }))
//     );
    
//     if (allLowStockItems.length === 0) {
//       return (
//         <div className="flex items-center justify-center p-8 bg-white rounded-xl border" style={{ minHeight: "400px" }}>
//           <div className="text-center">
//             <div className="bg-slate-100 p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
//               <ShoppingCart className="w-8 h-8 text-slate-400" />
//             </div>
//             <h3 className="text-xl font-medium text-slate-800 mb-2">No low stock items found</h3>
//             <p className="text-slate-500">
//               {searchQuery || priorityFilter !== 'all' 
//                 ? 'Try adjusting your search or filter criteria' 
//                 : 'All your inventory items appear to be well-stocked'}
//             </p>
//             {(searchQuery || priorityFilter !== 'all') && (
//               <Button 
//                 onClick={() => {
//                   setSearchQuery('');
//                   setPriorityFilter('all');
//                 }}
//                 variant="link" 
//                 className="mt-2 text-blue-600"
//               >
//                 Clear filters
//               </Button>
//             )}
//           </div>
//         </div>
//       );
//     }
    
//     // Sort all items by stock status (most critical first)
//     const sortedItems = [...allLowStockItems].sort((a, b) => {
//       const aRatio = a.currentStock / a.item.minQuantity;
//       const bRatio = b.currentStock / b.item.minQuantity;
//       return aRatio - bRatio; // Lower ratio (more critical) comes first
//     });
    
//     return (
//       <div className="bg-white rounded-xl overflow-hidden border shadow-sm">
//         <Table>
//           <TableHeader>
//             <TableRow className="bg-slate-50">
//               <TableHead>Item</TableHead>
//               <TableHead>Type</TableHead>
//               <TableHead className="text-right">Min. Qty</TableHead>
//               <TableHead className="text-right">Current Stock</TableHead>
//               <TableHead className="text-right">Status</TableHead>
//               <TableHead>Supplier</TableHead>
//               <TableHead className="text-right">Last Ordered</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {sortedItems.map((item, index) => (
//               <TableRow key={`${item.item.id}-${index}`} className="hover:bg-slate-50">
//                 <TableCell className="font-medium">
//                   <div className="flex items-center gap-2">
//                     <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
//                       {item.item.code.substring(0, 2)}
//                     </span>
//                     <div>
//                       <div>{item.item.name}</div>
//                       <div className="text-xs text-slate-500">Code: {item.item.code}</div>
//                     </div>
//                   </div>
//                 </TableCell>
//                 <TableCell>{item.item.type}</TableCell>
//                 <TableCell className="text-right">{item.item.minQuantity}</TableCell>
//                 <TableCell className="text-right font-semibold">
//                   {item.currentStock}
//                 </TableCell>
//                 <TableCell className="text-right">
//                   <div className="flex items-center justify-end">
//                     <Badge 
//                       variant="outline"
//                       className={`${getStockStatusColor(item.currentStock, item.item.minQuantity)} text-white border-0`}
//                     >
//                       {getStockStatusText(item.currentStock, item.item.minQuantity)}
//                     </Badge>
//                   </div>
//                 </TableCell>
//                 <TableCell>
//                   <div className="flex items-center gap-2">
//                     <Avatar className={`h-7 w-7 ${getSupplierColor(item.supplier.name)}`}>
//                       <AvatarFallback className="text-white text-xs font-medium">
//                         {generateInitials(item.supplier.name)}
//                       </AvatarFallback>
//                     </Avatar>
//                     <span>{item.supplier.name}</span>
//                   </div>
//                 </TableCell>
//                 <TableCell className="text-right text-slate-600">
//                   {formatDate(item.lastPurchaseDate)}
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-8 shadow-lg">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-white flex items-center gap-2">
//               <AlertOctagon className="h-8 w-8" />
//               Low Stock by Supplier
//             </h1>
//             <p className="text-red-100 mt-2 text-lg max-w-xl">
//               View low stock items grouped by their respective suppliers for efficient reordering
//             </p>
//           </div>
//           <Button
//             onClick={() => {/* Implement export/print functionality */}}
//             className="bg-white text-red-600 hover:bg-red-50 gap-2 font-medium shadow-md rounded-full px-5 transition-all duration-200 transform hover:scale-105"
//             size="lg"
//           >
//             <FileText className="h-5 w-5" />
//             Export Report
//           </Button>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="bg-white p-5 rounded-xl shadow-sm border">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
//             <Input
//               type="text"
//               placeholder="Search items by name, code or type..."
//               className="pl-10 pr-10 bg-white border-slate-200 rounded-lg"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//             {searchQuery && (
//               <button
//                 onClick={clearSearch}
//                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
//               >
//                 <X className="h-4 w-4" />
//               </button>
//             )}
//           </div>
          
//           <div>
//             <Select 
//               value={priorityFilter} 
//               onValueChange={setPriorityFilter}
//             >
//               <SelectTrigger className="bg-white border-slate-200 w-full">
//                 <div className="flex items-center gap-2">
//                   <Filter className="h-4 w-4 text-slate-400" />
//                   <SelectValue placeholder="Filter by priority" />
//                 </div>
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Priorities</SelectItem>
//                 <SelectItem value="critical">Critical Only (25%)</SelectItem>
//                 <SelectItem value="low">Low Stock (25% - 75%)</SelectItem>
//                 <SelectItem value="normal">Normal Stock ( 75%)</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
          
//           <div>
//             <Tabs defaultValue="bySupplier" className="w-full" onValueChange={setActiveTab} value={activeTab}>
//               <TabsList className="grid w-full grid-cols-2 h-10">
//                 <TabsTrigger value="bySupplier">By Supplier</TabsTrigger>
//                 <TabsTrigger value="allItems">All Items</TabsTrigger>
//               </TabsList>
//             </Tabs>
//           </div>
//         </div>
//       </div>

//       {/* Content */}
//       {loading ? (
//         <div className="flex justify-center items-center bg-white rounded-xl border p-8" style={{ minHeight: "400px" }}>
//           <div className="text-center">
//             <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto" />
//             <p className="mt-4 text-slate-600">Loading low stock data...</p>
//           </div>
//         </div>
//       ) : (
//         <div>
//           <Tabs defaultValue="bySupplier" value={activeTab} className="w-full">
//             <TabsContent value="bySupplier">
//               {renderBySupplierView()}
//             </TabsContent>
//             <TabsContent value="allItems">
//               {renderAllItemsView()}
//             </TabsContent>
//           </Tabs>
//         </div>
        
//       )}
//     </div>
//   );
// }
'use client';

import React, { useState, useEffect } from 'react';
import { lowStockService } from '@/services/lowStockService';
import { SupplierWithLowStockItems, ItemStockInfo } from '@/services/lowStockService';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  AlertOctagon, 
  ShoppingCart, 
  Loader2, 
  Phone, 
  Mail, 
  Search, 
  X, 
  FileText,
  ArrowDown,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LowStockBySupplierReport() {
  // State variables
  const [loading, setLoading] = useState(true);
  const [supplierStockData, setSupplierStockData] = useState<SupplierWithLowStockItems[]>([]);
  const [filteredData, setFilteredData] = useState<SupplierWithLowStockItems[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('bySupplier');

  const router = useRouter();

  // Load all necessary data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get low stock items grouped by supplier using our new service
        const data = await lowStockService.getAllLowStockItemsBySupplier();
        setSupplierStockData(data);
      } catch (error) {
        console.error('Error loading low stock data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Apply filters when search query or priority filter changes
  useEffect(() => {
    filterData();
  }, [searchQuery, priorityFilter, supplierStockData]);
  
  // Filter data based on search query and priority filter
  const filterData = () => {
    const query = searchQuery.toLowerCase().trim();
    
    let filtered = supplierStockData;
    
    // Apply search filter
    if (query) {
      filtered = filtered.map(supplierData => {
        // Filter items within each supplier
        const filteredItems = supplierData.lowStockItems.filter(itemData => 
          itemData.item.name.toLowerCase().includes(query) ||
          itemData.item.code?.toLowerCase().includes(query) ||
          itemData.item.type?.toLowerCase().includes(query)
        );
        
        // Only include this supplier if they have matching items
        if (filteredItems.length === 0) {
          return null;
        }
        
        // Return a new object with filtered items
        return {
          ...supplierData,
          lowStockItems: filteredItems,
          totalItems: filteredItems.length
        };
      }).filter(Boolean) as SupplierWithLowStockItems[];
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.map(supplierData => {
        let filteredItems;
        
        if (priorityFilter === 'critical') {
          // Critical: Stock is 0 or less than 25% of minimum
          filteredItems = supplierData.lowStockItems.filter(itemData => 
            itemData.stockLevel === 'out_of_stock' || itemData.stockLevel === 'critical'
          );
        } else if (priorityFilter === 'low') {
          // Low: Stock is between 25% and 75% of minimum
          filteredItems = supplierData.lowStockItems.filter(itemData => 
            itemData.stockLevel === 'low'
          );
        } else if (priorityFilter === 'normal') {
          // Normal: Stock is above 75% of minimum
          filteredItems = supplierData.lowStockItems.filter(itemData => 
            itemData.stockLevel === 'normal'
          );
        }
        
        // Only include this supplier if they have matching items
        if (!filteredItems || filteredItems.length === 0) {
          return null;
        }
        
        // Return a new object with filtered items
        return {
          ...supplierData,
          lowStockItems: filteredItems,
          totalItems: filteredItems.length
        };
      }).filter(Boolean) as SupplierWithLowStockItems[];
    }
    
    // Sort by priority level (most critical first) within each supplier
    filtered = filtered.map(supplierData => {
      const sortedItems = [...supplierData.lowStockItems].sort((a, b) => {
        const levelOrder = { 'out_of_stock': 0, 'critical': 1, 'low': 2, 'normal': 3 };
        return levelOrder[a.stockLevel] - levelOrder[b.stockLevel]; 
      });
      
      return {
        ...supplierData,
        lowStockItems: sortedItems
      };
    });
    
    setFilteredData(filtered);
  };
  
  // Clear search input
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  // Get color based on stock level
  const getStockStatusColor = (stockLevel: string) => {
    switch (stockLevel) {
      case 'out_of_stock': return 'bg-red-500';
      case 'critical': return 'bg-red-400';
      case 'low': return 'bg-amber-300';
      case 'normal': return 'bg-emerald-400';
      default: return 'bg-slate-300';
    }
  };
  
  // Get text label based on stock level
  const getStockStatusText = (stockLevel: string) => {
    switch (stockLevel) {
      case 'out_of_stock': return 'Out of Stock';
      case 'critical': return 'Critical';
      case 'low': return 'Low';
      case 'normal': return 'OK';
      default: return 'Unknown';
    }
  };
  
  // Generate initials for avatar
  const generateInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get random color for avatar based on supplier name
  const getSupplierColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-violet-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-indigo-500',
      'bg-cyan-500',
      'bg-fuchsia-500',
      'bg-teal-500',
    ];
    
    // Simple hash to get a consistent color for a supplier name
    const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };
  
  // Render by supplier view
  const renderBySupplierView = () => {
    if (filteredData.length === 0) {
      return (
        <div className="flex items-center justify-center p-8 bg-white rounded-xl border" style={{ minHeight: "400px" }}>
          <div className="text-center">
            <div className="bg-slate-100 p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-800 mb-2">No low stock items found</h3>
            <p className="text-slate-500">
              {searchQuery || priorityFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'All your inventory items appear to be well-stocked'}
            </p>
            {(searchQuery || priorityFilter !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setPriorityFilter('all');
                }}
                variant="link" 
                className="mt-2 text-blue-600"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <Accordion type="multiple" defaultValue={[filteredData[0]?.supplier.id || '']}>
          {filteredData.map((supplierData) => (
            <AccordionItem 
              key={supplierData.supplier.id} 
              value={supplierData.supplier.id || ''} 
              className="border bg-white rounded-xl mb-4 overflow-hidden shadow-sm"
            >
              <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 hover:no-underline">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Avatar className={`h-10 w-10 ${getSupplierColor(supplierData.supplier.name)}`}>
                      <AvatarFallback className="text-white text-sm font-medium">
                        {generateInitials(supplierData.supplier.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold">{supplierData.supplier.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{supplierData.supplier.phone}</span>
                        {supplierData.supplier.status === 'active' ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <AlertOctagon className="h-3.5 w-3.5 mr-1" />
                      {supplierData.totalItems} Low Stock Items
                    </Badge>
                    <ArrowDown className="h-4 w-4 text-slate-400 shrink-0" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2 pb-0">
                <div className="border-t">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-[40%]">Item</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Min. Qty</TableHead>
                        <TableHead className="text-right">Current Stock</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                        <TableHead className="text-right">Last Ordered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierData.lowStockItems.map((itemData) => (
                        <TableRow key={itemData.item.id} className="hover:bg-slate-50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                                {itemData.item.code?.substring(0, 2) || 'NA'}
                              </span>
                              <div>
                                <div>{itemData.item.name}</div>
                                <div className="text-xs text-slate-500">Code: {itemData.item.code || 'N/A'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{itemData.item.type || 'N/A'}</TableCell>
                          <TableCell className="text-right">{itemData.item.minQuantity}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {itemData.currentStock}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                              <Badge 
                                variant="outline"
                                className={`${getStockStatusColor(itemData.stockLevel)} text-white border-0`}
                              >
                                {getStockStatusText(itemData.stockLevel)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {formatDate(itemData.lastPurchaseDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="bg-slate-50 p-4 border-t flex justify-between items-center">
                  <div className="text-sm text-slate-500">
                    {supplierData.supplier.contactPerson ? (
                      <span>Contact person: <span className="font-medium">{supplierData.supplier.contactPerson}</span></span>
                    ) : (
                      <span>No contact person specified</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <FileText className="h-4 w-4" />
                      Save Report
                    </Button>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
                    onClick={() => router.push('/dashboard/purchases')} >
                      <ShoppingCart className="h-4 w-4" />
                      Order Items
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  };
  
  // Render all items view
  const renderAllItemsView = () => {
    // Flatten all items into a single list
    const allLowStockItems = filteredData.flatMap(supplierData => 
      supplierData.lowStockItems.map(item => ({
        ...item,
        supplier: supplierData.supplier
      }))
    );
    
    if (allLowStockItems.length === 0) {
      return (
        <div className="flex items-center justify-center p-8 bg-white rounded-xl border" style={{ minHeight: "400px" }}>
          <div className="text-center">
            <div className="bg-slate-100 p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-800 mb-2">No low stock items found</h3>
            <p className="text-slate-500">
              {searchQuery || priorityFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'All your inventory items appear to be well-stocked'}
            </p>
            {(searchQuery || priorityFilter !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setPriorityFilter('all');
                }}
                variant="link" 
                className="mt-2 text-blue-600"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      );
    }
    
    // Sort all items by stock status (most critical first)
    const sortedItems = [...allLowStockItems].sort((a, b) => {
      const levelOrder = { 'out_of_stock': 0, 'critical': 1, 'low': 2, 'normal': 3 };
      return levelOrder[a.stockLevel] - levelOrder[b.stockLevel]; // Lower value (more critical) comes first
    });
    
    return (
      <div className="bg-white rounded-xl overflow-hidden border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Min. Qty</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Last Ordered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item, index) => (
              <TableRow key={`${item.item.id}-${index}`} className="hover:bg-slate-50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                      {item.item.code?.substring(0, 2) || 'NA'}
                    </span>
                    <div>
                      <div>{item.item.name}</div>
                      <div className="text-xs text-slate-500">Code: {item.item.code || 'N/A'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{item.item.type || 'N/A'}</TableCell>
                <TableCell className="text-right">{item.item.minQuantity}</TableCell>
                <TableCell className="text-right font-semibold">
                  {item.currentStock}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <Badge 
                      variant="outline"
                      className={`${getStockStatusColor(item.stockLevel)} text-white border-0`}
                    >
                      {getStockStatusText(item.stockLevel)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className={`h-7 w-7 ${getSupplierColor(item.supplier.name)}`}>
                      <AvatarFallback className="text-white text-xs font-medium">
                        {generateInitials(item.supplier.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{item.supplier.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-slate-600">
                  {formatDate(item.lastPurchaseDate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-8 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <AlertOctagon className="h-8 w-8" />
              Low Stock by Supplier
            </h1>
            <p className="text-red-100 mt-2 text-lg max-w-xl">
              View low stock items grouped by their respective suppliers for efficient reordering
            </p>
          </div>
          <Button
            onClick={() => {/* Implement export/print functionality */}}
            className="bg-white text-red-600 hover:bg-red-50 gap-2 font-medium shadow-md rounded-full px-5 transition-all duration-200 transform hover:scale-105"
            size="lg"
          >
            <FileText className="h-5 w-5" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search items by name, code or type..."
              className="pl-10 pr-10 bg-white border-slate-200 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div>
            <Select 
              value={priorityFilter} 
              onValueChange={setPriorityFilter}
            >
              <SelectTrigger className="bg-white border-slate-200 w-full">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Filter by priority" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical Only ({"< 25%"})</SelectItem>
                <SelectItem value="low">Low Stock (25% - 75%)</SelectItem>
                <SelectItem value="normal">Normal Stock ({"> 75%"})</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Tabs defaultValue="bySupplier" className="w-full" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="grid w-full grid-cols-2 h-10">
                <TabsTrigger value="bySupplier">By Supplier</TabsTrigger>
                <TabsTrigger value="allItems">All Items</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center bg-white rounded-xl border p-8" style={{ minHeight: "400px" }}>
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto" />
            <p className="mt-4 text-slate-600">Loading low stock data...</p>
          </div>
        </div>
      ) : (
        <div>
          <Tabs defaultValue="bySupplier" value={activeTab} className="w-full">
            <TabsContent value="bySupplier">
              {renderBySupplierView()}
            </TabsContent>
            <TabsContent value="allItems">
              {renderAllItemsView()}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}