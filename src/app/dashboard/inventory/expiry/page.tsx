// src/app/dashboard/inventory/expiry/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { inventoryService } from '@/services/inventoryService';
import { purchaseService } from '@/services/purchaseService';
import { categoryService } from '@/services/categoryService';
import { InventoryItem, Category } from '@/types/inventory';
import { BatchWithDetails } from '@/types/purchase';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowLeft, Loader2, AlertTriangle, Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from 'next/link';
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';
import * as XLSX from 'xlsx';

// Define type for expiry timeframe
type ExpiryTimeframe = '1-month' | '3-months' | '6-months';

// Define type for sort options
type SortOption = 'expiry-date' | 'name' | 'category';

// Define interface for batches with expiry info
interface ExpiryBatch {
  batch: BatchWithDetails;
  item: InventoryItem;
  daysUntilExpiry: number;
}

function ExpiryPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expiryBatches, setExpiryBatches] = useState<ExpiryBatch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemBatches, setItemBatches] = useState<{ [key: string]: BatchWithDetails[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<ExpiryTimeframe>('3-months');
  const [sortBy, setSortBy] = useState<SortOption>('expiry-date');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [inventoryData, categoryData] = await Promise.all([
        inventoryService.getAll(),
        categoryService.getAll()
      ]);
      
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      
      // Load batch details for each item
      const batchPromises = inventoryData.map(async (item) => {
        if (item.id) {
          try {
            const batches = await purchaseService.getBatchesByItem(item.id);
            return { itemId: item.id, batches };
          } catch (error) {
            console.error(`Error fetching batches for item ${item.id}:`, error);
            return { itemId: item.id, batches: [] };
          }
        }
        return null;
      });
      
      const batchResults = await Promise.all(batchPromises);
      const batchMap: { [key: string]: BatchWithDetails[] } = {};
      batchResults.forEach(result => {
        if (result && result.itemId) {
          batchMap[result.itemId] = result.batches;
        }
      });
      setItemBatches(batchMap);
      
      // Filter batches based on expiry date
      filterExpiryBatches(inventoryData, batchMap, timeframeFilter, categoryFilter);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setError("Failed to load inventory. Please try again.");
      setInventory([]);
      setExpiryBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const filterExpiryBatches = (
    items: InventoryItem[], 
    batches: { [key: string]: BatchWithDetails[] }, 
    timeframe: ExpiryTimeframe,
    categoryId: string
  ) => {
    const today = new Date();
    const expiryThreshold = new Date();
    
    // Set threshold date based on selected timeframe
    switch (timeframe) {
      case '1-month':
        expiryThreshold.setMonth(today.getMonth() + 1);
        break;
      case '3-months':
        expiryThreshold.setMonth(today.getMonth() + 3);
        break;
      case '6-months':
        expiryThreshold.setMonth(today.getMonth() + 6);
        break;
    }
    
    // Collect all batches that expire within the timeframe
    const expiring: ExpiryBatch[] = [];
    
    items.forEach(item => {
      if (!item.id) return;
      
      // Apply category filter if selected
      if (categoryId !== 'all' && item.categoryId !== categoryId) return;
      
      const itemBatchList = batches[item.id] || [];
      
      itemBatchList.forEach(batch => {
        // Skip if batch quantity is 0
        if (batch.quantity <= 0) return;
        
        // Skip if already expired
        if (batch.expiryDate < today) return;
        
        // Check if batch expires within the threshold
        if (batch.expiryDate <= expiryThreshold) {
          // Calculate days until expiry
          const daysUntilExpiry = Math.ceil(
            (batch.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          expiring.push({
            batch,
            item,
            daysUntilExpiry
          });
        }
      });
    });
    
    // Sort according to selected option
    sortBatches(expiring);
  };

  const sortBatches = (batches: ExpiryBatch[]) => {
    let sorted = [...batches];
    
    switch (sortBy) {
      case 'expiry-date':
        // Sort by expiry date (soonest first)
        sorted.sort((a, b) => a.batch.expiryDate.getTime() - b.batch.expiryDate.getTime());
        break;
        
      case 'name':
        // Sort alphabetically by item name
        sorted.sort((a, b) => (a.item.name || '').localeCompare(b.item.name || ''));
        break;
        
      case 'category':
        // Sort by category name
        sorted.sort((a, b) => (a.item.categoryName || '').localeCompare(b.item.categoryName || ''));
        break;
    }
    
    setExpiryBatches(sorted);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (inventory.length > 0 && Object.keys(itemBatches).length > 0) {
      filterExpiryBatches(inventory, itemBatches, timeframeFilter, categoryFilter);
    }
  }, [timeframeFilter, categoryFilter, sortBy, inventory, itemBatches]);

  // Format date to display in a user-friendly way
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Determine badge color based on days until expiry
  const getExpiryBadge = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 7) {
      return <Badge variant="destructive">Expires in {daysUntilExpiry} days</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge variant="warning" className="bg-amber-500">Expires in {daysUntilExpiry} days</Badge>;
    } else {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Expires in {daysUntilExpiry} days</Badge>;
    }
  };

  // Function to export expiring items to Excel
  const exportToExcel = () => {
    // Prepare data for export
    const data = [
      [
        'Item Code', 
        'Item Name',
        'Generic Name', 
        'Type', 
        'Category', 
        'Batch Number', 
        'Quantity', 
        'Expiry Date', 
        'Days Until Expiry'
      ]
    ];

    expiryBatches.forEach(({batch, item, daysUntilExpiry}) => {
      data.push([
        item.code,
        item.name,
        item.genericName || '-',
        item.type,
        item.categoryName || '-',
        batch.batchNumber,
        `${batch.quantity} ${item.unitContains ? item.unitContains.unit : 'units'}`,
        formatDate(batch.expiryDate),
        daysUntilExpiry.toString()
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expiry Report');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `expiry_report_${date}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  // Get timeframe display text
  const getTimeframeText = (timeframe: ExpiryTimeframe) => {
    switch (timeframe) {
      case '1-month': return 'Next Month';
      case '3-months': return 'Next 3 Months';
      case '6-months': return 'Next 6 Months';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-6 h-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/inventory">
                <Button variant="ghost" size="sm" className="gap-1 hover:bg-gray-100 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Inventory
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Expiring Soon</h1>
            </div>
            <p className="text-muted-foreground mt-1 ml-28">
              Items that will expire within the selected timeframe.
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <Button variant="outline" onClick={exportToExcel} className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Link href="/dashboard/inventory">
              <Button variant="outline" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                View All Inventory
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Expiry Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">
              {expiryBatches.length} batches expiring in the {getTimeframeText(timeframeFilter)}
            </div>
            <p className="text-muted-foreground">
              These items will expire soon and should be used or disposed of accordingly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Expiring Items</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filter and Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
              <Select
                value={timeframeFilter}
                onValueChange={(value: ExpiryTimeframe) => setTimeframeFilter(value)}
              >
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-month">Next Month</SelectItem>
                  <SelectItem value="3-months">Next 3 Months</SelectItem>
                  <SelectItem value="6-months">Next 6 Months</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id!}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: category.color || '#6b7280' }} 
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={sortBy}
                onValueChange={(value: SortOption) => setSortBy(value)}
              >
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expiry-date">Expiry Date (Soonest First)</SelectItem>
                  <SelectItem value="name">Item Name (A-Z)</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="ml-auto text-sm text-muted-foreground">
                Showing {expiryBatches.length} batches expiring soon
              </div>
            </div>

            <div className="relative">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-red-500 font-medium">{error}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={loadData}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="relative overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky top-0 bg-white">Code</TableHead>
                          <TableHead className="sticky top-0 bg-white">Name</TableHead>
                          <TableHead className="sticky top-0 bg-white">Type</TableHead>
                          <TableHead className="sticky top-0 bg-white">Category</TableHead>
                          <TableHead className="sticky top-0 bg-white">Batch #</TableHead>
                          <TableHead className="sticky top-0 bg-white text-right">Quantity</TableHead>
                          <TableHead className="sticky top-0 bg-white">Expiry Date</TableHead>
                          <TableHead className="sticky top-0 bg-white">Status</TableHead>
                          <TableHead className="sticky top-0 bg-white text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expiryBatches.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                              {categoryFilter !== 'all' 
                                ? "No expiring items found in this category." 
                                : `No items expiring within the ${getTimeframeText(timeframeFilter)}.`}
                            </TableCell>
                          </TableRow>
                        ) : (
                          expiryBatches.map(({batch, item, daysUntilExpiry}) => (
                            <TableRow key={`${item.id}-${batch.id}`}>
                              <TableCell className="font-medium">{item.code}</TableCell>
                              <TableCell>
                                <div>
                                  {item.name}
                                  {item.genericName && item.genericName !== item.name && (
                                    <div className="text-xs text-muted-foreground italic truncate max-w-[200px]">
                                      {item.genericName}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {item.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {item.categoryId && item.categoryName ? (
                                  <div className="flex items-center gap-1.5">
                                    {item.categoryColor && (
                                      <div
                                        className="w-2.5 h-2.5 rounded-full" 
                                        style={{ backgroundColor: item.categoryColor }}
                                      />
                                    )}
                                    <span>{item.categoryName}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>{batch.batchNumber}</TableCell>
                              <TableCell className="text-right">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help text-right">
                                        <span className="font-medium">
                                          {batch.quantity}
                                        </span>
                                        <span className="ml-1 text-muted-foreground">
                                          {item.unitContains ? item.unitContains.unit : 'units'}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {item.unitContains ? (
                                        <p>
                                          {Math.floor(batch.quantity / item.unitContains.value)} units 
                                          {batch.quantity % item.unitContains.value > 0 && (
                                            <span> + {batch.quantity % item.unitContains.value} {item.unitContains.unit}</span>
                                          )}
                                        </p>
                                      ) : (
                                        <p>{batch.quantity} units</p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{formatDate(batch.expiryDate)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getExpiryBadge(daysUntilExpiry)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Link href={`/dashboard/inventory?id=${item.id}`}>
                                  <Button variant="outline" size="sm">View Details</Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ExpiryPage);