// src/app/dashboard/returns/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { returnService } from '@/services/returnService';
import { ReturnWithDetails } from '@/types/return';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  Search, 
  Loader2, 
  RefreshCw,
  Package,
  User,
  Calendar,
  FileText,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import AddReturnModal from './AddReturnModal';
import ReturnDetails from './ReturnDetails';
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';

function ReturnsPage() {
  const { userRole } = useAuth();
  
  // Return state
  const [returns, setReturns] = useState<ReturnWithDetails[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<ReturnWithDetails[]>([]);
  
  // Loading and refreshing state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<'details' | null>(null);
  
  // Filtering and search
  const [searchQuery, setSearchQuery] = useState('');

  // Load returns
  const loadReturns = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const data = await returnService.getAll();
      setReturns(data);
      applyFilters(data, searchQuery);
      
      if (showRefreshIndicator) {
        toast.success("Returns data refreshed successfully");
      }
    } catch (error) {
      console.error("Error loading returns:", error);
      if (showRefreshIndicator) {
        toast.error("Failed to refresh returns data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadReturns();
  }, []);

  // Apply filters to returns
  const applyFilters = (data: ReturnWithDetails[], query: string) => {
    let filtered = data;
    
    // Apply search filter
    if (query.trim() !== '') {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(returnItem =>
        returnItem.patientDetails?.toLowerCase().includes(lowercaseQuery) ||
        returnItem.items.some(item => 
          item.item.name.toLowerCase().includes(lowercaseQuery) ||
          item.batchNumber.toLowerCase().includes(lowercaseQuery)
        ) ||
        returnItem.createdByName?.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    setFilteredReturns(filtered);
  };

  // Update filters when search changes
  useEffect(() => {
    applyFilters(returns, searchQuery);
  }, [searchQuery, returns]);

  // Handle refresh button click
  const handleRefresh = () => {
    loadReturns(true);
  };

  // Function to handle row click
  const handleRowClick = (returnItem: ReturnWithDetails) => {
    setSelectedReturn(returnItem);
    setViewMode('details');
  };

  // Calculate statistics
  const totalItemsReturned = returns.reduce((sum, r) => sum + r.items.length, 0);
  const totalQuantityReturned = returns.reduce((sum, r) => 
    sum + r.items.reduce((itemSum, item) => itemSum + item.totalQuantity, 0), 0
  );
  const totalValue = returns.reduce((sum, r) => 
    sum + r.items.reduce((itemSum, item) => 
      itemSum + (item.costPricePerUnit * item.totalQuantity), 0
    ), 0
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
              <RotateCcw className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Returns</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage returned inventory items</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 capitalize">
              {userRole || 'User'} Access
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="icon"
              className={refreshing ? "animate-spin" : ""}
              disabled={refreshing || loading}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={() => setShowAddModal(true)}
              className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Plus className="h-4 w-4" />
              Add Return
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Returns</p>
                  <div className="text-2xl font-bold">{returns.length}</div>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Items Returned</p>
                  <div className="text-2xl font-bold">{totalItemsReturned}</div>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Quantity</p>
                  <div className="text-2xl font-bold">{totalQuantityReturned.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Value</p>
                  <div className="text-2xl font-bold">Rs{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by patient, item name, batch number, or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
            {searchQuery && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Search className="h-3 w-3" />
                  {filteredReturns.length} result{filteredReturns.length !== 1 ? 's' : ''} found
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="h-6 text-xs"
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                Return History
              </CardTitle>
              <div className="flex items-center gap-2">
                {refreshing && (
                  <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Refreshing...
                  </span>
                )}
                <Badge variant="secondary" className="text-xs">
                  {filteredReturns.length} of {returns.length} returns
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
                <p className="text-muted-foreground">Loading returns...</p>
              </div>
            ) : filteredReturns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="p-4 rounded-full bg-orange-100 mb-4">
                  <RotateCcw className="h-12 w-12 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? "No returns found" : "No returns yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  {searchQuery 
                    ? "Try adjusting your search terms to find returns"
                    : "Start by adding your first return to track returned inventory items"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Return
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-lg border">
                <div className="relative max-h-[650px] overflow-auto custom-scrollbar">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gradient-to-r from-slate-50 to-orange-50/30 z-10 border-b-2">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-slate-700">Return Date</TableHead>
                        <TableHead className="font-semibold text-slate-700">Patient Details</TableHead>
                        <TableHead className="font-semibold text-slate-700">Items</TableHead>
                        <TableHead className="font-semibold text-slate-700">Quantity</TableHead>
                        <TableHead className="font-semibold text-slate-700">Created By</TableHead>
                        <TableHead className="font-semibold text-slate-700">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReturns.map((returnItem) => {
                        const itemQuantity = returnItem.items.reduce((sum, item) => sum + item.totalQuantity, 0);
                        return (
                          <TableRow 
                            key={returnItem.id}
                            className="cursor-pointer hover:bg-orange-50/50 transition-colors group"
                            onClick={() => handleRowClick(returnItem)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-blue-100 group-hover:bg-blue-200 transition-colors">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {returnItem.returnDate.toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {returnItem.returnDate.toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {returnItem.patientDetails ? (
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-md bg-green-100 group-hover:bg-green-200 transition-colors">
                                    <User className="h-4 w-4 text-green-600" />
                                  </div>
                                  <span className="font-medium text-gray-900">{returnItem.patientDetails}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic">Not specified</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5">
                                {returnItem.items.slice(0, 2).map((item, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className="w-fit bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                                  >
                                    <Package className="h-3 w-3 mr-1" />
                                    {item.item.name}
                                    <span className="ml-1 text-xs opacity-75">(Batch: {item.batchNumber})</span>
                                  </Badge>
                                ))}
                                {returnItem.items.length > 2 && (
                                  <Badge variant="secondary" className="w-fit text-xs">
                                    +{returnItem.items.length - 2} more item{returnItem.items.length - 2 !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 font-semibold">
                                  {itemQuantity.toLocaleString()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">units</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {returnItem.createdByName ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
                                    {returnItem.createdByName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="font-medium text-gray-900 text-sm">{returnItem.createdByName}</div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500">{returnItem.createdByEmail}</span>
                                      {returnItem.createdByRole && (
                                        <Badge variant="outline" className="text-xs capitalize px-1 py-0">
                                          {returnItem.createdByRole}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm italic">Unknown</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {returnItem.notes ? (
                                <div className="flex items-start gap-2 max-w-xs">
                                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 line-clamp-2">{returnItem.notes}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-sm">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddReturnModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadReturns();
          }}
        />
      )}

      {/* Return details dialog */}
      {selectedReturn && viewMode === 'details' && (
        <ReturnDetails
          returnItem={selectedReturn}
          onClose={() => {
            setSelectedReturn(null);
            setViewMode(null);
          }}
        />
      )}
      
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #F97316 transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #F97316;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #EA580C;
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(ReturnsPage);

