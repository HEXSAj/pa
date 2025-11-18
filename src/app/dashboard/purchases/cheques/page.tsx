// src/app/dashboard/purchases/cheques/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { purchaseService } from '@/services/purchaseService';
import { PurchaseWithDetails } from '@/types/purchase';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  FileText, 
  Search, 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Filter,
  AlertCircle,
  FileCheck,
  FileX,
  Clock
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { toast } from "sonner";

// Import Components
import PurchaseDetails from '../PurchaseDetails';
import ChequeStatusModal from '../ChequeStatusModal';

// Import auth
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';

type ChequeFilterStatus = 'all' | 'pending' | 'cleared' | 'bounced';

function ChequesPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  // Purchase state
  const [chequePurchases, setChequePurchases] = useState<PurchaseWithDetails[]>([]);
  const [filteredCheques, setFilteredCheques] = useState<PurchaseWithDetails[]>([]);
  
  // Loading state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ChequeFilterStatus>('all');
  
  // Modal state
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<'details' | 'status' | null>(null);

  // Load cheque purchases
  const loadCheques = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Clear cache before fetching to ensure we get fresh data
      purchaseService.clearPurchaseCache();
      
      const data = await purchaseService.getChequePurchases();
      setChequePurchases(data);
      applyFilters(data, searchQuery, filterStatus);
      
      if (showRefreshIndicator) {
        toast.success("Cheque payments refreshed successfully");
      }
    } catch (error) {
      console.error("Error loading cheque payments:", error);
      if (showRefreshIndicator) {
        toast.error("Failed to refresh cheque data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadCheques();
  }, []);

  // Apply filters to cheques
  const applyFilters = (data: PurchaseWithDetails[], query: string, status: ChequeFilterStatus) => {
    let filtered = data;
    
    // Apply search filter
    if (query.trim() !== '') {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(purchase =>
        purchase.supplier?.name?.toLowerCase().includes(lowercaseQuery) ||
        purchase.invoiceNumber?.toLowerCase().includes(lowercaseQuery) ||
        purchase.chequeDetails?.chequeNumber?.toLowerCase().includes(lowercaseQuery) ||
        purchase.chequeDetails?.bankName?.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    // Apply status filter
    if (status !== 'all' && status !== undefined) {
      filtered = filtered.filter(purchase => 
        purchase.chequeDetails?.status === status
      );
    }
    
    setFilteredCheques(filtered);
  };

  // Update filters when search or status changes
  useEffect(() => {
    applyFilters(chequePurchases, searchQuery, filterStatus);
  }, [searchQuery, filterStatus, chequePurchases]);

  // Handle refresh button click
  const handleRefresh = () => {
    loadCheques(true);
  };

  // Functions to handle cheque actions
  const viewChequeDetails = (purchase: PurchaseWithDetails) => {
    setSelectedPurchase(purchase);
    setViewMode('details');
  };
  
  const updateChequeStatus = (purchase: PurchaseWithDetails) => {
    setSelectedPurchase(purchase);
    setViewMode('status');
  };

  // Calculate statistics
  const getTotalCheques = () => chequePurchases.length;
  const getPendingCheques = () => chequePurchases.filter(p => p.chequeDetails?.status === 'pending').length;
  const getClearedCheques = () => chequePurchases.filter(p => p.chequeDetails?.status === 'cleared').length;
  const getBouncedCheques = () => chequePurchases.filter(p => p.chequeDetails?.status === 'bounced').length;
  
  const getPendingAmount = () => {
    return chequePurchases
      .filter(p => p.chequeDetails?.status === 'pending')
      .reduce((total, purchase) => total + purchase.totalAmount, 0);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rs${amount.toFixed(2)}`;
  };
  
  // Format date
  const formatDate = (date: Date | undefined | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Cheque Payments</h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              {chequePurchases.length} Cheques
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="icon"
              className={refreshing ? "animate-spin" : ""}
              disabled={refreshing || loading}
              title="Refresh cheque data"
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

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold">{getTotalCheques()}</div>
                <p className="text-sm text-muted-foreground">Total Cheques</p>
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => setFilterStatus('pending')} className="cursor-pointer hover:bg-gray-50">
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{getPendingCheques()}</div>
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => setFilterStatus('cleared')} className="cursor-pointer hover:bg-gray-50">
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{getClearedCheques()}</div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">Cleared</p>
              </div>
            </CardContent>
          </Card>

          <Card onClick={() => setFilterStatus('bounced')} className="cursor-pointer hover:bg-gray-50">
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{getBouncedCheques()}</div>
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-sm text-muted-foreground">Bounced</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold">{formatCurrency(getPendingAmount())}</div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm">
          <Search className="h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by supplier, cheque number, bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <div className="flex items-center gap-2">
            <Select
              value={filterStatus}
              onValueChange={(value: ChequeFilterStatus) => setFilterStatus(value)}
            >
              <SelectTrigger className="h-8 w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Filter status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cheques</SelectItem>
                <SelectItem value="pending">Pending Only</SelectItem>
                <SelectItem value="cleared">Cleared Only</SelectItem>
                <SelectItem value="bounced">Bounced Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex justify-between items-center">
              <span>Cheque Payments</span>
              {refreshing && <span className="text-sm font-normal text-muted-foreground">Refreshing data...</span>}
            </CardTitle>
            <CardDescription>
              Manage cheque payments and update their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredCheques.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                {searchQuery || filterStatus !== 'all' ? 
                  "No cheque payments found matching your filters" : 
                  "No cheque payments found"
                }
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Cheque Number</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Cheque Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCheques.map((purchase) => (
                      <TableRow key={purchase.id} className="group">
                        <TableCell>
                          {formatDate(purchase.purchaseDate)}
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
                        <TableCell className="font-medium">
                          {purchase.chequeDetails?.chequeNumber}
                        </TableCell>
                        <TableCell>
                          {purchase.chequeDetails?.bankName}
                        </TableCell>
                        <TableCell>
                          {formatDate(purchase.chequeDetails?.chequeDate)}
                        </TableCell>
                        <TableCell>
                          {purchase.chequeDetails?.status === 'pending' && (
                            <Badge className="bg-yellow-500">Pending</Badge>
                          )}
                          {purchase.chequeDetails?.status === 'cleared' && (
                            <Badge className="bg-green-500">Cleared</Badge>
                          )}
                          {purchase.chequeDetails?.status === 'bounced' && (
                            <Badge className="bg-red-500">Bounced</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(purchase.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewChequeDetails(purchase)}
                              className="h-8 w-8 p-0"
                              title="View Details"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            
                            {purchase.chequeDetails?.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-green-600"
                                  onClick={() => {
                                    setSelectedPurchase(purchase);
                                    setViewMode('status');
                                  }}
                                  title="Mark as Cleared"
                                >
                                  <FileCheck className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600"
                                  onClick={() => {
                                    setSelectedPurchase(purchase);
                                    setViewMode('status');
                                  }}
                                  title="Mark as Bounced"
                                >
                                  <FileX className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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
      {selectedPurchase && viewMode === 'details' && (
        <PurchaseDetails
          purchase={selectedPurchase}
          onClose={() => {
            setSelectedPurchase(null);
            setViewMode(null);
          }}
          onPaymentAdded={() => {
            setSelectedPurchase(null);
            setViewMode(null);
            loadCheques();
          }}
          onEdit={() => {
            // Handle edit if needed
          }}
          onDelete={() => {
            // Handle delete if needed
            setSelectedPurchase(null);
            setViewMode(null);
            loadCheques();
          }}
          isReadOnly={!isAdmin} // Only admin can edit
        />
      )}

      {/* Update Cheque Status Modal */}
      {selectedPurchase && viewMode === 'status' && (
        <ChequeStatusModal
          purchase={selectedPurchase}
          onClose={() => {
            setSelectedPurchase(null);
            setViewMode(null);
          }}
          onSuccess={() => {
            setSelectedPurchase(null);
            setViewMode(null);
            loadCheques();
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default withAuth(ChequesPage);