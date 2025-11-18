// src/app/dashboard/inventory/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { inventoryService } from '@/services/inventoryService';
import { purchaseService } from '@/services/purchaseService';
import { categoryService } from '@/services/categoryService';
import { InventoryItem, Category } from '@/types/inventory';
import { BatchWithDetails } from '@/types/purchase';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Loader2, Search, FilterX, Tags, TagIcon, ShieldAlert, AlertTriangle } from 'lucide-react';
import AddInventoryModal from './AddInventoryModal';
import EditInventoryModal from './EditInventoryModal';
import BatchDetails from './BatchDetails';
import CategoryModal from './CategoryModal';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import InventoryTable from './InventoryTable';
import ExcelExport from './ExcelExport';
import Link from 'next/link';
import withAuth from '@/components/withAuth'; // Import the withAuth HOC
import { useAuth } from '@/context/AuthContext'; // Import useAuth

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import ExcelDirectImport from './ExcelDirectImport';
import { FileSpreadsheet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import CategoryImport from './CategoryImport';
import  ExcelTypesCategoriesImport  from './ExcelTypesCategoriesImport';

import ExcelInventoryImport from './ExcelInventoryImport';

import StockAdjustmentModal from './StockAdjustmentModal';


type FilterType = 'all' | 'low-stock' | 'expiring-3m' | 'expiring-6m' | 'has-batches' | 'no-batches';

function InventoryPage() {
  const { userRole } = useAuth(); // Access user role from auth context
  const isAdmin = userRole === 'admin'; // Check if user is admin
  
  // Initialize states with proper defaults
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemBatches, setItemBatches] = useState<{ [key: string]: BatchWithDetails[] }>({});
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all'); // Changed from '' to 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [showDirectImportModal, setShowDirectImportModal] = useState(false);

  const [showCategoryImportModal, setShowCategoryImportModal] = useState(false);

  const [showTypesCategoryImporter, setShowTypesCategoryImporter] = useState(false);

  const [showInventoryImporter, setShowInventoryImporter] = useState(false);

  const [showStockAdjustmentModal, setShowStockAdjustmentModal] = useState(false);


  const applyFilters = (items: InventoryItem[], batches: { [key: string]: BatchWithDetails[] }, filter: FilterType, search: string, categoryId: string) => {
    // Safely handle empty or undefined items
    if (!items || items.length === 0) {
      setFilteredInventory([]);
      return;
    }
    
    // First apply search filter
    let filtered = items;
    
    // if (search.trim() !== '') {
    //   const query = search.toLowerCase().trim();
    //   filtered = items.filter(item => 
    //     (item.name?.toLowerCase().includes(query) || false) || 
    //     (item.code?.toLowerCase().includes(query) || false) || 
    //     (item.type?.toLowerCase().includes(query) || false) ||
    //     (item.categoryName?.toLowerCase().includes(query) || false)
    //   );
    // }

    if (search.trim() !== '') {
      filtered = searchInventory(filtered, search);
    }
    
    // Apply category filter if selected
    if (categoryId && categoryId !== 'all') { // Changed from checking empty string to checking 'all'
      filtered = filtered.filter(item => item.categoryId === categoryId);
    }
    
    // Then apply status filter
    switch (filter) {
      case 'low-stock':
        filtered = filtered.filter(item => {
          if (!item.id) return false;
          const itemBatches = batches[item.id] || [];
          const totalQuantity = itemBatches.reduce((sum, batch) => sum + batch.quantity, 0);
          const availableUnits = item.unitContains 
            ? Math.floor(totalQuantity / item.unitContains.value)
            : totalQuantity;
          return availableUnits < item.minQuantity;
        });
        break;
        
      case 'expiring-3m':
      case 'expiring-6m':
        const months = filter === 'expiring-3m' ? 3 : 6;
        const thresholdDate = new Date();
        thresholdDate.setMonth(thresholdDate.getMonth() + months);
        
        filtered = filtered.filter(item => {
          if (!item.id) return false;
          const itemBatches = batches[item.id] || [];
          return itemBatches.some(batch => {
            const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : null;
            return expiryDate && expiryDate <= thresholdDate && expiryDate > new Date();
          });
        });
        break;

      case 'has-batches':
        filtered = filtered.filter(item => {
          if (!item.id) return false;
          const itemBatches = batches[item.id] || [];
          return itemBatches.length > 0;
        });
        break;

      case 'no-batches':
        filtered = filtered.filter(item => {
          if (!item.id) return false;
          const itemBatches = batches[item.id] || [];
          return itemBatches.length === 0;
        });
        break;
    }
    
    setFilteredInventory(filtered);
  };

  const handleStockAdjustment = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowStockAdjustmentModal(true);
  };


  // Enhanced search function to search through all relevant fields including generic name
const searchInventory = (items: InventoryItem[], query: string): InventoryItem[] => {
  if (!items || items.length === 0 || !query || query.trim() === '') {
    return items;
  }

  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  
  return items.filter(item => {
    // Create a combined text from all searchable fields
    const searchableText = [
      item.code,
      item.name,
      item.genericName,
      item.type,
      item.categoryName
    ]
      .filter(Boolean)  // Remove undefined/null values
      .join(' ')
      .toLowerCase();
    
    // Item matches if ALL search terms are found in any of the fields
    return searchTerms.every(term => searchableText.includes(term));
  });
};


  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [data, categoryData] = await Promise.all([
        inventoryService.getAll(),
        categoryService.getAll()
      ]);
      
      setInventory(Array.isArray(data) ? data : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      
      // Load batch details for each item
      const batchPromises = data.map(async (item) => {
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
      
      // Apply initial filter
      applyFilters(data, batchMap, 'all', '', 'all'); // Changed from '' to 'all'
    } catch (error) {
      console.error('Error loading inventory:', error);
      setError("Failed to load inventory. Please try again.");
      setInventory([]);
      setFilteredInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    applyFilters(inventory, itemBatches, filterType, searchQuery, categoryFilter);
  }, [filterType, inventory, itemBatches, searchQuery, categoryFilter]);

  const handleDelete = async (id: string) => {
    try {
      await inventoryService.delete(id);
      setShowDeleteDialog(false);
      await loadInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const clearFilters = () => {
    setFilterType('all');
    setSearchQuery('');
    setCategoryFilter('all'); // Changed from '' to 'all'
  };

  // Calculate summary counts with defensive coding
  const getLowStockCount = () => {
    if (!inventory || !itemBatches) return 0;
    
    return inventory.filter(item => {
      if (!item || !item.id) return false;
      const batches = itemBatches[item.id] || [];
      const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const availableUnits = item.unitContains 
        ? Math.floor(totalQuantity / item.unitContains.value)
        : totalQuantity;
      return availableUnits < item.minQuantity;
    }).length;
  };

  const getExpiringCount = (months: number) => {
    if (!inventory || !itemBatches) return 0;
    
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() + months);
    
    return inventory.filter(item => {
      if (!item || !item.id) return false;
      const batches = itemBatches[item.id] || [];
      return batches.some(batch => {
        const expiryDate = batch.expiryDate ? new Date(batch.expiryDate) : null;
        return expiryDate && expiryDate <= thresholdDate && expiryDate > new Date();
      });
    }).length;
  };

  const getNoBatchesCount = () => {
    if (!inventory || !itemBatches) return 0;
    
    return inventory.filter(item => {
      if (!item || !item.id) return false;
      const batches = itemBatches[item.id] || [];
      return batches.length === 0;
    }).length;
  };

  const isFiltered = filterType !== 'all' || searchQuery.trim() !== '' || categoryFilter !== 'all'; // Changed check

  return (
    <DashboardLayout>
      <div className="space-y-4 p-6 h-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="capitalize bg-blue-50 text-blue-600">
                {userRole} Access
              </Badge>
              
              {!isAdmin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="ml-2 text-yellow-500 flex items-center">
                        <ShieldAlert className="h-4 w-4 mr-1" />
                        <span className="text-xs">Some actions limited</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Staff users have limited permissions. Cannot delete items.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          {/*<Button
              variant="outline"
              onClick={() => setShowDirectImportModal(true)}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Import Excel
            </Button>*/}

            {/* <Button
              variant="outline"
              onClick={() => setShowCategoryImportModal(true)}
              className="gap-2"
            >
              <TagIcon className="h-4 w-4" />
              Import Categories
            </Button> */}

            {/* <Button
              variant="outline"
              onClick={() => setShowTypesCategoryImporter(true)}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Import Types & Categories
            </Button> */}
                    

              {/* <Button
                variant="outline"
                onClick={() => setShowInventoryImporter(true)}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Import Inventory Items
              </Button> */}


          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <Link href="/dashboard/inventory/types">
              <Button variant="outline" className="gap-2">
                <Tags className="h-4 w-4" />
                Manage Types
              </Button>
            </Link>
            
            <Link href="/dashboard/inventory/categories">
              <Button variant="outline" className="gap-2">
                <TagIcon className="h-4 w-4" />
                Manage Categories
              </Button>
            </Link>
            
            <ExcelExport inventory={inventory} batches={itemBatches} />
            <Button
              onClick={() => setShowAddModal(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setFilterType('low-stock')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getLowStockCount()}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setFilterType('expiring-3m')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expiring in 3 Months</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getExpiringCount(3)}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setFilterType('expiring-6m')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expiring in 6 Months</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getExpiringCount(6)}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setFilterType('no-batches')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Items Without Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getNoBatchesCount()}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Inventory Items</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by name, code, type or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={filterType}
                  onValueChange={(value: FilterType) => setFilterType(value)}
                >
                  <SelectTrigger className="min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <FilterX className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Filter status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status</SelectLabel>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="low-stock">Low Stock Items</SelectItem>
                      <SelectItem value="expiring-3m">Expiring in 3 Months</SelectItem>
                      <SelectItem value="expiring-6m">Expiring in 6 Months</SelectItem>
                      <SelectItem value="has-batches">Has Stock</SelectItem>
                      <SelectItem value="no-batches">No Stock</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                
                {/* Category filter - Updated with 'all' value */}
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => setCategoryFilter(value)}
                >
                  <SelectTrigger className="min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <TagIcon className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Filter by category" />
                    </div>
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
                
                {isFiltered && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearFilters}
                    title="Clear filters"
                  >
                    <FilterX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              {isFiltered && (
                <div className="flex items-center gap-2 flex-wrap">
                  {filterType !== 'all' && (
                    <Badge variant="secondary" className="px-2 py-1">
                      {filterType === 'low-stock' ? 'Low Stock Items' :
                       filterType === 'expiring-3m' ? 'Expiring in 3 Months' :
                       filterType === 'expiring-6m' ? 'Expiring in 6 Months' :
                       filterType === 'has-batches' ? 'Items with Stock' :
                       filterType === 'no-batches' ? 'Items without Stock' : ''}
                    </Badge>
                  )}
                  
                  {categoryFilter !== 'all' && ( // Changed from empty string check
                    <Badge variant="secondary" className="px-2 py-1 flex items-center gap-1">
                      <TagIcon className="h-3 w-3" />
                      {categories.find(c => c.id === categoryFilter)?.name || 'Category'}
                    </Badge>
                  )}
                  
                  {searchQuery && (
                    <Badge variant="secondary" className="px-2 py-1">
                      Search: "{searchQuery}"
                    </Badge>
                  )}
                </div>
              )}
              
              <span className="text-sm text-muted-foreground ml-auto">
                Showing {filteredInventory.length} of {inventory.length} items
              </span>
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
                    onClick={loadInventory}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <InventoryTable 
                  inventory={filteredInventory}
                  batches={itemBatches}
                  onEdit={(item) => {
                    setSelectedItem(item);
                    setShowEditModal(true);
                  }}
                  onDelete={(item) => {
                    // Only allow admins to delete items
                    if (isAdmin) {
                      setSelectedItem(item);
                      setShowDeleteDialog(true);
                    } else {
                      // Could display a message that staff can't delete items
                      alert("Staff users do not have permission to delete inventory items.");
                    }
                  }}
                  onViewBatches={(item) => {
                    setSelectedItem(item);
                    setShowBatchDetails(true);
                  }}
                   onStockAdjustment={handleStockAdjustment} 
                  isAdmin={isAdmin} // Pass isAdmin flag to control UI elements in the table
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <span className="font-medium">{selectedItem?.name}</span> from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedItem?.id && handleDelete(selectedItem.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showAddModal && (
        <AddInventoryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadInventory();
          }}
        />
      )}

      {/* {showCategoryImportModal && (
        <CategoryImport
          onClose={() => setShowCategoryImportModal(false)}
          onImportComplete={() => {
            setShowCategoryImportModal(false);
            loadInventory(); // Reload the inventory data to update categories
            toast.success("Categories imported successfully!");
          }}
        />
      )} */}

      {showEditModal && selectedItem && (
        <EditInventoryModal
          item={selectedItem}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedItem(null);
            loadInventory();
          }}
        />
      )}

      {showBatchDetails && selectedItem && (
        <BatchDetails
          item={selectedItem}
          onClose={() => {
            setShowBatchDetails(false);
            setSelectedItem(null);
          }}
        />
      )}

      {showInventoryImporter && (
        <ExcelInventoryImport
          onClose={() => setShowInventoryImporter(false)}
          onImportComplete={() => {
            setShowInventoryImporter(false);
            loadInventory(); // Reload your inventory data to reflect the changes
            toast({ title: "Success", description: "imported successfully", type: "success" });
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal 
          onClose={() => {
            setShowCategoryModal(false);
            loadInventory(); // Reload to get fresh category data
          }}
        />
      )}

      {showTypesCategoryImporter && (
          <ExcelTypesCategoriesImport
            onClose={() => setShowTypesCategoryImporter(false)}
            onImportComplete={() => {
              setShowTypesCategoryImporter(false);
              loadInventory(); // Reload your inventory data to reflect the changes
              // With this:
              toast({ title: "Success", description: "Categories imported successfully", type: "success" });
            }}
          />
        )}

        {showDirectImportModal && (
          <ExcelDirectImport
            onClose={() => setShowDirectImportModal(false)}
            onImportComplete={() => {
              setShowDirectImportModal(false);
              loadInventory(); // Reload the inventory data
              toast.success("Import complete! Inventory has been updated.");
            }}
          />
        )}

        {showStockAdjustmentModal && selectedItem && (
          <StockAdjustmentModal
            item={selectedItem}
            onClose={() => {
              setShowStockAdjustmentModal(false);
              setSelectedItem(null);
            }}
            onSuccess={() => {
              setShowStockAdjustmentModal(false);
              setSelectedItem(null);
              loadInventory();
            }}
          />
        )}


      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }
      `}</style>
    </DashboardLayout>
  );
}

// Wrap the component with the withAuth HOC
export default withAuth(InventoryPage);