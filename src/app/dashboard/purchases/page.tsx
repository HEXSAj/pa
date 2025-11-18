
// src/app/dashboard/purchases/page.tsx - Without Payment Management

'use client';

import { useState, useEffect } from 'react';
import { purchaseService } from '@/services/purchaseService';
import { PurchaseWithDetails } from '@/types/purchase';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  Search, 
  X, 
  Loader2, 
  Edit, 
  Trash2,
  RefreshCw, 
  Filter,
  FileText, 
  History, 
  Save,
  AlertCircle,
  Package,
  Calendar,
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
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from
 "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

// Import components
import AddPurchaseModal from './AddPurchaseModal';
import CreatePurchaseOrderModal from './CreatePurchaseOrderModal';
import ReceivePurchaseOrderModal from './ReceivePurchaseOrderModal';
import EditPurchaseModal from './EditPurchaseModal';
import PurchaseDetails from './PurchaseDetails';
import DeletePendingDialog from './DeletePendingDialog';

// Import auth
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';

import AddPaymentModal from './AddPaymentModal';
import PaymentHistoryModal from './PaymentHistoryModal';

import CreateInstallmentModal from './CreateInstallmentModal';
import InstallmentPlanModal from './InstallmentPlanModal';

function PurchasesPage() {
  const { user, userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  // Purchase state
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<PurchaseWithDetails[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseWithDetails[]>([]);
  const [filteredPendingPurchases, setFilteredPendingPurchases] = useState<PurchaseWithDetails[]>([]);
  
  // Loading and refreshing state
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<'details' | 'edit' | null>(null);
  const [pendingToDelete, setPendingToDelete] = useState<PurchaseWithDetails | null>(null);
  const [showDeletePendingDialog, setShowDeletePendingDialog] = useState(false);
  
  // Filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');
  
  // Tab and draft state
  const [activeTab, setActiveTab] = useState<'completed' | 'pending'>('completed');
  const [pendingIdToContinue, setPendingIdToContinue] = useState<string | undefined>();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState<PurchaseWithDetails | null>(null);

  const [showCreateInstallmentModal, setShowCreateInstallmentModal] = useState(false);
  const [showInstallmentPlanModal, setShowInstallmentPlanModal] = useState(false);
  
  

  // Load completed purchases
  const loadPurchases = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Clear cache before fetching to ensure we get fresh data
      purchaseService.clearPurchaseCache();
      
      const data = await purchaseService.getAll();
      
      // Filter to only include completed purchases
      const completedPurchases = data.filter(p => !p.status || p.status === 'completed');
      setPurchases(completedPurchases);
      applyFilters(completedPurchases, searchQuery);
      
      if (showRefreshIndicator) {
        toast.success("Purchase data refreshed successfully");
      }
    } catch (error) {
      console.error("Error loading purchases:", error);
      if (showRefreshIndicator) {
        toast.error("Failed to refresh purchase data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateInstallmentPlan = (purchase: PurchaseWithDetails) => {
    setSelectedPurchaseForPayment(purchase);
    setShowCreateInstallmentModal(true);
  };
  
  const handleViewInstallmentPlan = (purchase: PurchaseWithDetails) => {
    setSelectedPurchaseForPayment(purchase);
    setShowInstallmentPlanModal(true);
  };
  
  
  // Load pending purchases
  const loadPendingPurchases = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setPendingLoading(true);
      }
      
      // Clear cache before fetching to ensure we get fresh data
      purchaseService.clearPurchaseCache();
      
      const data = await purchaseService.getAll();
      
      // Filter to only include pending purchases
      const pendingPurchases = data.filter(p => p.status === 'pending');
      setPendingPurchases(pendingPurchases);
      applyPendingFilters(pendingPurchases, pendingSearchQuery);
      
      if (showRefreshIndicator) {
        toast.success("Pending purchases refreshed successfully");
      }
    } catch (error) {
      console.error("Error loading pending purchases:", error);
      if (showRefreshIndicator) {
        toast.error("Failed to refresh pending purchases");
      }
    } finally {
      setPendingLoading(false);
      if (showRefreshIndicator) {
        setRefreshing(false);
      }
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadPurchases();
    loadPendingPurchases();
  }, []);

  // // Apply filters to completed purchases
  const applyFilters = (data: PurchaseWithDetails[], query: string) => {
    let filtered = data;
    
    // Apply search filter
    if (query.trim() !== '') {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(purchase =>
        purchase.supplier?.name?.toLowerCase().includes(lowercaseQuery) ||
        purchase.invoiceNumber?.toLowerCase().includes(lowercaseQuery) ||
        purchase.items.some(item => 
          item.item.name.toLowerCase().includes(lowercaseQuery) ||
          item.batchNumber.toLowerCase().includes(lowercaseQuery)
        )
      );
    }
    
    setFilteredPurchases(filtered);
  };


  
  // Apply filters to pending purchases
  const applyPendingFilters = (data: PurchaseWithDetails[], query: string) => {
    let filtered = data;
    
    // Apply search filter
    if (query.trim() !== '') {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(purchase =>
        purchase.supplier?.name?.toLowerCase().includes(lowercaseQuery) ||
        purchase.invoiceNumber?.toLowerCase().includes(lowercaseQuery) ||
        purchase.createdByName?.toLowerCase().includes(lowercaseQuery) ||
        purchase.createdByEmail?.toLowerCase().includes(lowercaseQuery) ||
        purchase.items.some(item => 
          item.item.name.toLowerCase().includes(lowercaseQuery)
        )
      );
    }
    
    setFilteredPendingPurchases(filtered);
  };



  // Update filters when search changes
  useEffect(() => {
    applyFilters(purchases, searchQuery);
  }, [searchQuery, purchases]);
  
  // Update pending filters when search changes
  useEffect(() => {
    applyPendingFilters(pendingPurchases, pendingSearchQuery);
  }, [pendingSearchQuery, pendingPurchases]);


  // Handle refresh button click
  const handleRefresh = () => {
    if (activeTab === 'completed') {
      loadPurchases(true);
    } else {
      loadPendingPurchases(true);
    }
  };


  // Handle continuing a pending purchase (legacy - now redirects to receive)
  const handleContinuePending = (purchase: PurchaseWithDetails) => {
    setSelectedPurchase(purchase);
    setShowReceiveModal(true);
  };

  // Handle receiving a purchase order
  const handleReceivePurchase = (purchase: PurchaseWithDetails) => {
    setSelectedPurchase(purchase);
    setShowReceiveModal(true);
  };
  
  // Handle deleting a pending purchase
  const handleDeletePending = (purchase: PurchaseWithDetails) => {
    setPendingToDelete(purchase);
    setShowDeletePendingDialog(true);
  };
  
  // Confirm deletion of pending purchase
  const confirmDeletePending = async () => {
    if (!pendingToDelete || !pendingToDelete.id) return;
    
    try {
      await purchaseService.delete(pendingToDelete.id);
      toast.success("Draft deleted successfully");
      loadPendingPurchases();
    } catch (error) {
      console.error("Error deleting pending purchase:", error);
      toast.error("Failed to delete draft");
    }
  };

  // Function to handle row click
  const handleRowClick = (purchase: PurchaseWithDetails) => {
    setSelectedPurchase(purchase);
    setViewMode('details');
  };

  const handleAddPayment = (purchase: PurchaseWithDetails) => {
    setSelectedPurchaseForPayment(purchase);
    setShowPaymentModal(true);
  };
  
  const handleViewPaymentHistory = (purchase: PurchaseWithDetails) => {
    setSelectedPurchaseForPayment(purchase);
    setShowPaymentHistory(true);
  };
  
  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setShowPaymentHistory(false);
    setSelectedPurchaseForPayment(null);
    loadPurchases(true);// Refresh the data
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
            {/* User role badge */}
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
              disabled={refreshing || (activeTab === 'completed' ? loading : pendingLoading)}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreateOrderModal(true)}
                className="gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Create Order
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Direct Purchase
              </Button>
            </div>
          </div>
        </div>

        {/* Staff permission notice */}
        {!isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <p className="text-sm text-yellow-700">
              In staff mode, you can add new purchases and view purchase information, but cannot edit or delete existing purchases.
            </p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold">{purchases.length}</div>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold">Rs{purchases.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for completed and pending purchases */}
        <Tabs 
          defaultValue="completed" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'completed' | 'pending')}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="completed" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              Completed Purchases
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              Pending Orders
              {pendingPurchases.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingPurchases.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Completed Purchases Tab */}
          <TabsContent value="completed">
            <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by supplier, invoice, item..."
                className="flex-1 outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
           

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-center">
                  <span>Purchase History</span>
                  {refreshing && <span className="text-sm font-normal text-muted-foreground">Refreshing data...</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="relative max-h-[600px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white z-10">
                          <TableRow>
                            <TableHead className="bg-white">Date</TableHead>
                            <TableHead className="bg-white">Supplier</TableHead>
                            <TableHead className="bg-white">Invoice #</TableHead>
                            <TableHead className="bg-white text-right">Total Amount</TableHead>
                            <TableHead className="bg-white">Created By</TableHead>
                            <TableHead className="bg-white">Items</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPurchases.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                {searchQuery ? "No purchases found matching your search" : "No purchases found"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredPurchases.map((purchase) => (
                              

                              <TableRow 
                              key={purchase.id}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleRowClick(purchase)}
                            >
                              <TableCell>
                                {purchase.purchaseDate.toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{purchase.supplier?.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {purchase.supplier?.phone}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{purchase.invoiceNumber || '-'}</TableCell>
                              <TableCell className="text-right">
                                Rs{purchase.totalAmount.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {purchase.createdByName ? (
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                      {purchase.createdByName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                      <div className="font-medium text-gray-900">{purchase.createdByName}</div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-500">{purchase.createdByEmail}</span>
                                        {purchase.createdByRole && (
                                          <Badge variant="outline" className="text-xs capitalize">
                                            {purchase.createdByRole}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Unknown</span>
                                )}
                              </TableCell>
                             
                              <TableCell className="text-right">
                                <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  {/* Payment Status Badge */}
                                  {purchase.paymentStatus && (
                                    <Badge variant={
                                      purchase.paymentStatus === 'paid' ? 'default' : 
                                      purchase.paymentStatus === 'partial' ? 'secondary' : 'destructive'
                                    }>
                                      {purchase.paymentStatus.toUpperCase()}
                                    </Badge>
                                  )}
                                  
                                  {/* Payment Actions */}
                                  {purchase.dueAmount && purchase.dueAmount > 0 && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddPayment(purchase)}
                                      >
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        Pay
                                      </Button>
                                      
                                      {!purchase.hasInstallmentPlan && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleCreateInstallmentPlan(purchase)}
                                        >
                                          <Calendar className="h-4 w-4 mr-1" />
                                          Installments
                                        </Button>
                                      )}
                                    </>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewPaymentHistory(purchase)}
                                  >
                                    <History className="h-4 w-4 mr-1" />
                                    History
                                  </Button>
                                  
                                  {purchase.hasInstallmentPlan && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewInstallmentPlan(purchase)}
                                    >
                                      <Calendar className="h-4 w-4 mr-1" />
                                      Plan
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Pending Purchases Tab */}
          <TabsContent value="pending">
            <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm mb-4">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search draft purchases..."
                className="flex-1 outline-none text-sm"
                value={pendingSearchQuery}
                onChange={(e) => setPendingSearchQuery(e.target.value)}
              />
            </div>


            
            {/* Purchase Order info alert */}
            <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>About Purchase Orders</AlertTitle>
              <AlertDescription>
                Purchase orders are created with items and quantities only. When you receive the order, 
                you'll enter actual quantities, expiry dates, and pricing information.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-center">
                  <span>Pending Purchase Orders</span>
                  {refreshing && <span className="text-sm font-normal text-muted-foreground">Refreshing data...</span>}
                </CardTitle>
                <CardDescription>
                  Purchase orders awaiting receipt. Click "Receive" to add actual quantities, expiry dates, and pricing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="relative max-h-[600px] overflow-auto">
                      <Table>
                      
                        <TableHeader className="sticky top-0 bg-white z-10">
                          <TableRow>
                            <TableHead className="bg-white">Date</TableHead>
                            <TableHead className="bg-white">Supplier</TableHead>
                            <TableHead className="bg-white">Invoice #</TableHead>
                            <TableHead className="bg-white text-right">Total Amount</TableHead>
                            <TableHead className="bg-white">Created By</TableHead>
                            <TableHead className="bg-white">Items & Status</TableHead>
                            <TableHead className="bg-white text-right">Payment Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPendingPurchases.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                <div className="flex flex-col items-center">
                                  <div className="rounded-full bg-gray-100 p-4 mb-3">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                  </div>
                                  <p className="text-lg text-gray-500">
                                    {pendingSearchQuery ? 'No purchase orders match your search' : 'No pending purchase orders found'}
                                  </p>
                                  <p className="text-sm text-gray-400 mt-1">
                                    {pendingSearchQuery ? 'Try adjusting your search terms' : 'Create purchase orders to track items before receiving them'}
                                  </p>
                                  {!pendingSearchQuery && (
                                    <Button 
                                      onClick={() => setShowCreateOrderModal(true)}
                                      className="mt-4"
                                      variant="outline"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Create Purchase Order
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredPendingPurchases.map((purchase) => (
                              <TableRow 
                                key={purchase.id}
                                className="hover:bg-gray-50"
                              >
                                <TableCell>
                                  {purchase.purchaseDate.toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{purchase.supplier?.name || 'Unknown Supplier'}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {purchase.invoiceNumber && `Invoice: ${purchase.invoiceNumber}`}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {purchase.items.length} {purchase.items.length === 1 ? 'item' : 'items'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {purchase.createdByName ? (
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                        {purchase.createdByName.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex flex-col">
                                        <div className="font-medium text-gray-900">{purchase.createdByName}</div>
                                        <div className="text-xs text-gray-500">{purchase.createdByEmail}</div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">Unknown</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span>{formatDate(purchase.updatedAt)}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimeAgo(purchase.updatedAt)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {purchase.totalAmount > 0 
                                    ? `Rs${purchase.totalAmount.toFixed(2)}` 
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleReceivePurchase(purchase)}
                                      className="gap-1"
                                    >
                                      <Package className="h-4 w-4" />
                                      Receive
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePending(purchase);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    {/* Payment Actions */}
                                    {purchase.dueAmount && purchase.dueAmount > 0 && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddPayment(purchase)}
                                      >
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        Pay
                                      </Button>
                                    )}
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewPaymentHistory(purchase)}
                                    >
                                      <History className="h-4 w-4 mr-1" />
                                      History
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddPurchaseModal
          onClose={() => {
            setShowAddModal(false);
            setPendingIdToContinue(undefined);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setPendingIdToContinue(undefined);
            loadPurchases();
            loadPendingPurchases();
          }}
          pendingId={pendingIdToContinue}
        />
      )}

      {showCreateOrderModal && (
        <CreatePurchaseOrderModal
          onClose={() => setShowCreateOrderModal(false)}
          onSuccess={() => {
            setShowCreateOrderModal(false);
            loadPurchases();
            loadPendingPurchases();
          }}
        />
      )}

      {showReceiveModal && selectedPurchase && (
        <ReceivePurchaseOrderModal
          purchase={selectedPurchase}
          onClose={() => {
            setShowReceiveModal(false);
            setSelectedPurchase(null);
          }}
          onSuccess={() => {
            setShowReceiveModal(false);
            setSelectedPurchase(null);
            loadPurchases();
            loadPendingPurchases();
          }}
        />
      )}

      {showCreateInstallmentModal && selectedPurchaseForPayment && (
        <CreateInstallmentModal
          purchase={selectedPurchaseForPayment}
          onClose={() => {
            setShowCreateInstallmentModal(false);
            setSelectedPurchaseForPayment(null);
          }}
          onSuccess={() => {
            setShowCreateInstallmentModal(false);
            setSelectedPurchaseForPayment(null);
            loadPurchases(true);
          }}
        />
      )}

      {showInstallmentPlanModal && selectedPurchaseForPayment && (
        <InstallmentPlanModal
          purchase={selectedPurchaseForPayment}
          onClose={() => {
            setShowInstallmentPlanModal(false);
            setSelectedPurchaseForPayment(null);
          }}
          onSuccess={() => {
            loadPurchases(true);
          }}
        />
      )}

      {/* Purchase details dialog */}
      {selectedPurchase && viewMode === 'details' && (
        <PurchaseDetails
          purchase={selectedPurchase}
          onClose={() => {
            setSelectedPurchase(null);
            setViewMode(null);
          }}
          onEdit={() => {
            // Only admin can access edit functionality
            if (isAdmin) {
              setViewMode('edit');
            } else {
              toast.error("Only admin users can edit purchases");
            }
          }}
          onDelete={() => {
            // Only admin can delete
            if (isAdmin) {
              setSelectedPurchase(null);
              setViewMode(null);
              loadPurchases();
              toast.success("Purchase and associated batches deleted successfully");
            } else {
              toast.error("Only admin users can delete purchases");
            }
          }}
          isReadOnly={!isAdmin} // Pass readonly flag based on user role
        />
      )}

      {/* Edit modal - only for admin */}
      {isAdmin && selectedPurchase && viewMode === 'edit' && (
        <EditPurchaseModal
          purchase={selectedPurchase}
          onClose={() => {
            setViewMode('details'); // Go back to details view
          }}
          onSuccess={() => {
            setSelectedPurchase(null);
            setViewMode(null);
            loadPurchases();
            toast.success("Purchase updated successfully");
          }}
        />
      )}

      {/* Delete pending purchase confirmation dialog */}
      {pendingToDelete && (
        <DeletePendingDialog
          purchase={pendingToDelete}
          open={showDeletePendingDialog}
          onClose={() => {
            setShowDeletePendingDialog(false);
            setPendingToDelete(null);
          }}
          onConfirm={confirmDeletePending}
        />
      )}

      {showPaymentModal && selectedPurchaseForPayment && (
        <AddPaymentModal
          purchase={selectedPurchaseForPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPurchaseForPayment(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {showPaymentHistory && selectedPurchaseForPayment && (
        <PaymentHistoryModal
          purchase={selectedPurchaseForPayment}
          onClose={() => {
            setShowPaymentHistory(false);
            setSelectedPurchaseForPayment(null);
          }}
          onAddPayment={() => {
            setShowPaymentHistory(false);
            setShowPaymentModal(true);
          }}
        />
      )}


    </DashboardLayout>
  );
}

// Helper function to format date
function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString();
}

// Helper function to display time ago
function formatTimeAgo(date: Date | string | number): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(date);
}

// Wrap with withAuth HOC to enforce access control
export default withAuth(PurchasesPage);