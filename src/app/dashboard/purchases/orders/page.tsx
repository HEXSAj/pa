// src/app/dashboard/purchases/orders/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { purchaseService } from '@/services/purchaseService';
import { PurchaseWithDetails } from '@/types/purchase';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Truck, 
  Search, 
  Loader2, 
  RefreshCw, 
  Package, 
  Calendar, 
  ClipboardCheck,
  Eye
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Import Components
import PurchaseDetails from '../PurchaseDetails';
import ReceivePurchaseModal from '../ReceivePurchaseModal';
import { Input } from '@/components/ui/input';

// Import auth
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';

function PurchaseOrdersPage() {
  const { userRole } = useAuth();
  
  // Purchase state
  const [orders, setOrders] = useState<PurchaseWithDetails[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseWithDetails[]>([]);
  
  // Loading state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<PurchaseWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<'details' | 'receive' | null>(null);

  // Load purchase orders
  const loadOrders = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Clear cache before fetching to ensure we get fresh data
      purchaseService.clearPurchaseCache();
      
      const data = await purchaseService.getOrderedPurchases();
      setOrders(data);
      applyFilters(data, searchQuery);
      
      if (showRefreshIndicator) {
        toast.success("Purchase orders refreshed successfully");
      }
    } catch (error) {
      console.error("Error loading purchase orders:", error);
      if (showRefreshIndicator) {
        toast.error("Failed to refresh orders");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadOrders();
  }, []);

  // Apply filters to orders
  const applyFilters = (data: PurchaseWithDetails[], query: string) => {
    if (!query.trim()) {
      setFilteredOrders(data);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase();
    const filtered = data.filter(order =>
      order.supplier?.name?.toLowerCase().includes(lowercaseQuery) ||
      order.invoiceNumber?.toLowerCase().includes(lowercaseQuery) ||
      order.items.some(item => 
        item.item.name.toLowerCase().includes(lowercaseQuery) ||
        item.batchNumber.toLowerCase().includes(lowercaseQuery)
      )
    );
    
    setFilteredOrders(filtered);
  };

  // Update filters when search changes
  useEffect(() => {
    applyFilters(orders, searchQuery);
  }, [searchQuery, orders]);

  // Handle refresh button click
  const handleRefresh = () => {
    loadOrders(true);
  };

  // Functions to handle order actions
  const viewOrderDetails = (order: PurchaseWithDetails) => {
    setSelectedOrder(order);
    setViewMode('details');
  };
  
  const receiveOrder = (order: PurchaseWithDetails) => {
    setSelectedOrder(order);
    setViewMode('receive');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rs${amount.toFixed(2)}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              {orders.length} Orders
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="icon"
              className={refreshing ? "animate-spin" : ""}
              disabled={refreshing || loading}
              title="Refresh orders"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={() => window.location.href = '/dashboard/purchases'}
              variant="outline"
              className="gap-2"
            >
              View All Purchases
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by supplier, invoice, item..."
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex justify-between items-center">
              <span>Purchase Orders Awaiting Receipt</span>
              {refreshing && <span className="text-sm font-normal text-muted-foreground">Refreshing data...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                {searchQuery ? 
                  "No purchase orders found matching your search" : 
                  "No pending purchase orders found"
                }
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          {order.purchaseDate.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.supplier?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.supplier?.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{order.invoiceNumber || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.items.length} items</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-500">Ordered</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewOrderDetails(order)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => receiveOrder(order)}
                              className="gap-1"
                            >
                              <Package className="h-4 w-4" />
                              Receive
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Purchase Details */}
      {selectedOrder && viewMode === 'details' && (
        <PurchaseDetails
          purchase={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            setViewMode(null);
          }}
          onPaymentAdded={() => {
            setSelectedOrder(null);
            setViewMode(null);
            loadOrders();
          }}
          onEdit={() => {
            // Handle edit if needed
          }}
          onDelete={() => {
            // Handle delete if needed
            setSelectedOrder(null);
            setViewMode(null);
            loadOrders();
          }}
          isReadOnly={false}
        />
      )}

      {/* Receive Purchase Modal */}
      {selectedOrder && viewMode === 'receive' && (
        <ReceivePurchaseModal
          purchase={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            setViewMode(null);
          }}
          onSuccess={() => {
            setSelectedOrder(null);
            setViewMode(null);
            loadOrders();
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default withAuth(PurchaseOrdersPage);