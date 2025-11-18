// src/app/dashboard/inventory/low-stock/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { inventoryService } from '@/services/inventoryService';
import { purchaseService } from '@/services/purchaseService';
import { categoryService } from '@/services/categoryService';
import { InventoryItem, Category } from '@/types/inventory';
import { BatchWithDetails } from '@/types/purchase';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowLeft, Loader2, AlertTriangle, Download, FileSpreadsheet } from 'lucide-react';
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
import Link from 'next/link';
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';
import * as XLSX from 'xlsx';

function LowStockPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemBatches, setItemBatches] = useState<{ [key: string]: BatchWithDetails[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('stock-level');

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
      
      // Filter to get only low stock items
      filterLowStockItems(inventoryData, batchMap, categoryFilter);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setError("Failed to load inventory. Please try again.");
      setInventory([]);
      setLowStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filterLowStockItems = (items: InventoryItem[], batches: { [key: string]: BatchWithDetails[] }, categoryId: string) => {
    // First filter for low stock
    let filtered = items.filter(item => {
      if (!item.id) return false;
      const itemBatches = batches[item.id] || [];
      const totalQuantity = itemBatches.reduce((sum, batch) => sum + batch.quantity, 0);
      const availableUnits = item.unitContains 
        ? Math.floor(totalQuantity / item.unitContains.value)
        : totalQuantity;
      return availableUnits < item.minQuantity;
    });
    
    // Then apply category filter if selected
    if (categoryId && categoryId !== 'all') {
      filtered = filtered.filter(item => item.categoryId === categoryId);
    }

    // Sort items according to selected sort option
    sortItems(filtered, batches);
  };

  const sortItems = (items: InventoryItem[], batches: { [key: string]: BatchWithDetails[] }) => {
    let sorted = [...items];
    
    switch (sortBy) {
      case 'stock-level':
        // Sort by stock level percentage (lowest first)
        sorted.sort((a, b) => {
          const aStock = calculateStockLevel(a, batches[a.id || ''] || []);
          const bStock = calculateStockLevel(b, batches[b.id || ''] || []);
          return aStock - bStock;
        });
        break;
        
      case 'name':
        // Sort alphabetically by name
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
        
      case 'category':
        // Sort by category name
        sorted.sort((a, b) => (a.categoryName || '').localeCompare(b.categoryName || ''));
        break;
    }
    
    setLowStockItems(sorted);
  };

  const calculateStockLevel = (item: InventoryItem, itemBatches: BatchWithDetails[]) => {
    const totalQuantity = itemBatches.reduce((sum, batch) => sum + batch.quantity, 0);
    const availableUnits = item.unitContains 
      ? Math.floor(totalQuantity / item.unitContains.value)
      : totalQuantity;
    
    // Calculate as a percentage of minimum level (can be 0 to 100)
    return item.minQuantity > 0 ? (availableUnits / item.minQuantity) * 100 : 0;
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (inventory.length > 0 && Object.keys(itemBatches).length > 0) {
      filterLowStockItems(inventory, itemBatches, categoryFilter);
    }
  }, [categoryFilter, sortBy, inventory, itemBatches]);

  // Function to export low stock items to Excel
  const exportToExcel = () => {
    // Prepare data for export
    const data = [
      [
        'Item Code', 
        'Name', 
        'Type', 
        'Category', 
        'Contains Per Unit', 
        'Current Stock', 
        'Min Required', 
        'Stock Percentage'
      ]
    ];

    lowStockItems.forEach(item => {
      const itemBatchList = item.id ? itemBatches[item.id] || [] : [];
      const totalQuantity = itemBatchList.reduce((sum, batch) => sum + batch.quantity, 0);
      const availableUnits = item.unitContains 
        ? Math.floor(totalQuantity / item.unitContains.value)
        : totalQuantity;
      const stockPercentage = item.minQuantity > 0 
        ? ((availableUnits / item.minQuantity) * 100).toFixed(1) 
        : "0";

      data.push([
        item.code,
        item.name,
        item.type,
        item.categoryName || '-',
        item.unitContains ? `${item.unitContains.value} ${item.unitContains.unit}` : '-',
        `${availableUnits} units`,
        `${item.minQuantity} units`,
        `${stockPercentage}%`
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Low Stock');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `low_stock_report_${date}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  // Template to display stock level as a percentage
  const renderStockLevel = (item: InventoryItem) => {
    const itemBatchList = item.id ? itemBatches[item.id] || [] : [];
    const totalQuantity = itemBatchList.reduce((sum, batch) => sum + batch.quantity, 0);
    const availableUnits = item.unitContains 
      ? Math.floor(totalQuantity / item.unitContains.value)
      : totalQuantity;
    
    const percentage = item.minQuantity > 0 
      ? (availableUnits / item.minQuantity) * 100 
      : 0;
    
    // Determine color based on percentage
    let colorClass = '';
    if (percentage <= 25) {
      colorClass = 'text-red-600';
    } else if (percentage <= 50) {
      colorClass = 'text-amber-600';
    } else {
      colorClass = 'text-yellow-600';
    }
    
    return (
      <div className={`font-medium ${colorClass}`}>
        {percentage.toFixed(1)}%
      </div>
    );
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
              <h1 className="text-3xl font-bold tracking-tight">Low Stock Items</h1>
            </div>
            <p className="text-muted-foreground mt-1 ml-28">
              Items that are below minimum stock level.
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
            <CardTitle>Low Stock Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{lowStockItems.length} items below minimum level</div>
            <p className="text-muted-foreground">
              These items need to be restocked soon to maintain inventory levels.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filter and Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
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
                onValueChange={(value) => setSortBy(value)}
              >
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock-level">Stock Level (Lowest First)</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="ml-auto text-sm text-muted-foreground">
                Showing {lowStockItems.length} items below minimum stock level
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
                          <TableHead className="sticky top-0 bg-white text-right">Current Stock</TableHead>
                          <TableHead className="sticky top-0 bg-white text-right">Minimum Level</TableHead>
                          <TableHead className="sticky top-0 bg-white text-right">Stock Level</TableHead>
                          <TableHead className="sticky top-0 bg-white text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStockItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                              {categoryFilter !== 'all' 
                                ? "No low stock items found in this category." 
                                : "No low stock items found. All items are above minimum levels."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          lowStockItems.map(item => {
                            const itemBatchList = item.id ? itemBatches[item.id] || [] : [];
                            const totalQuantity = itemBatchList.reduce((sum, batch) => sum + batch.quantity, 0);
                            const availableUnits = item.unitContains 
                              ? Math.floor(totalQuantity / item.unitContains.value)
                              : totalQuantity;
                            
                            return (
                              <TableRow key={item.id}>
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
                                <TableCell className="text-right">
                                  <span className="font-medium">
                                    {availableUnits} {item.unitContains ? 'units' : ''}
                                  </span>
                                  {item.unitContains && (
                                    <div className="text-xs text-muted-foreground">
                                      {totalQuantity} {item.unitContains.unit}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-medium">
                                    {item.minQuantity} {item.unitContains ? 'units' : ''}
                                  </span>
                                  {item.unitContains && (
                                    <div className="text-xs text-muted-foreground">
                                      {item.minQuantity * item.unitContains.value} {item.unitContains.unit}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {renderStockLevel(item)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Link href={`/dashboard/inventory?id=${item.id}`}>
                                    <Button variant="outline" size="sm">View Details</Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            );
                          })
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

export default withAuth(LowStockPage);