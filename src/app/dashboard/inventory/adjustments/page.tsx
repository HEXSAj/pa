
// src/app/dashboard/inventory/adjustments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { stockAdjustmentService } from '@/services/stockAdjustmentService';
import { StockAdjustmentWithDetails, AdjustmentSummary } from '@/types/stockAdjustment';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Search, 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw,
  Calendar,
  User,
  Package,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { toast } from "sonner";
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';

function StockAdjustmentsPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  const [adjustments, setAdjustments] = useState<StockAdjustmentWithDetails[]>([]);
  const [filteredAdjustments, setFilteredAdjustments] = useState<StockAdjustmentWithDetails[]>([]);
  const [summary, setSummary] = useState<AdjustmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'increase' | 'decrease'>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    loadAdjustments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [adjustments, searchQuery, typeFilter, reasonFilter, dateFilter]);

  const loadAdjustments = async () => {
    try {
      setLoading(true);
      const [adjustmentsData, summaryData] = await Promise.all([
        stockAdjustmentService.getAdjustments(),
        stockAdjustmentService.getAdjustmentSummary(30) // Last 30 days
      ]);
      
      setAdjustments(adjustmentsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading adjustments:', error);
      toast.error('Failed to load stock adjustments');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = adjustments;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(adj => 
        adj.itemName.toLowerCase().includes(query) ||
        adj.itemCode.toLowerCase().includes(query) ||
        adj.batchNumber?.toLowerCase().includes(query) ||
        adj.adjustedByName.toLowerCase().includes(query) ||
        adj.notes?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(adj => adj.adjustmentType === typeFilter);
    }

    // Reason filter
    if (reasonFilter !== 'all') {
      filtered = filtered.filter(adj => adj.reason === reasonFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(adj => new Date(adj.adjustmentDate) >= cutoffDate);
    }

    setFilteredAdjustments(filtered);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getReasonBadgeColor = (reason: string) => {
    switch (reason) {
      case 'damage': return 'destructive';
      case 'expiry': return 'destructive';
      case 'theft': return 'destructive';
      case 'return': return 'secondary';
      case 'correction': return 'default';
      case 'recount': return 'default';
      default: return 'outline';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setReasonFilter('all');
    setDateFilter('all');
  };

  const isFiltered = searchQuery || typeFilter !== 'all' || reasonFilter !== 'all' || dateFilter !== 'all';

  const uniqueReasons = Array.from(new Set(adjustments.map(adj => adj.reason)));

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/inventory">
                <Button variant="ghost" size="sm" className="gap-1 hover:bg-gray-100 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Inventory
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">Stock Adjustments</h1>
            </div>
            <p className="text-muted-foreground ml-28">
              View and manage stock adjustment history
            </p>
          </div>
          <Button onClick={loadAdjustments} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Total Adjustments (30 days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalAdjustments}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Stock Increases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summary.totalIncreases}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Stock Decreases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summary.totalDecreases}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Filter Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by item, batch, or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="increase">Increases Only</SelectItem>
                  <SelectItem value="decrease">Decreases Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  {uniqueReasons.map(reason => (
                    <SelectItem key={reason} value={reason}>
                      {reason.charAt(0).toUpperCase() + reason.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                </SelectContent>
              </Select>
              
              {isFiltered && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredAdjustments.length} of {adjustments.length} adjustments
            </div>
          </CardContent>
        </Card>

        {/* Adjustments Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Adjustment History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Before</TableHead>
                      <TableHead className="text-right">After</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Adjusted By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdjustments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                          No adjustments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAdjustments.map((adjustment) => (
                        <TableRow key={adjustment.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">
                                {formatDate(adjustment.adjustmentDate)}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div>
                              <div className="font-medium">{adjustment.item.name}</div>
                              <div className="text-sm text-gray-500">{adjustment.item.code}</div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {adjustment.batchNumber ? (
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span>{adjustment.batchNumber}</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-600">
                                New Batch
                              </Badge>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <Badge 
                              variant={adjustment.adjustmentType === 'increase' ? 'default' : 'destructive'}
                              className="gap-1"
                            >
                              {adjustment.adjustmentType === 'increase' ? (
                                <Plus className="h-3 w-3" />
                              ) : (
                                <Minus className="h-3 w-3" />
                              )}
                              {adjustment.adjustmentType}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-right font-medium">
                            {adjustment.adjustmentType === 'increase' ? '+' : '-'}{adjustment.quantity}
                          </TableCell>
                          
                          <TableCell className="text-right">
                            {adjustment.previousQuantity}
                          </TableCell>
                          
                          <TableCell className="text-right">
                            {adjustment.newQuantity}
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant={getReasonBadgeColor(adjustment.reason) as any}>
                              {adjustment.reason.charAt(0).toUpperCase() + adjustment.reason.slice(1)}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium">{adjustment.adjustedByName}</div>
                                <div className="text-xs text-gray-500">{adjustment.adjustedByRole}</div>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="max-w-[200px] truncate text-sm" title={adjustment.notes}>
                              {adjustment.notes || '-'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(StockAdjustmentsPage);