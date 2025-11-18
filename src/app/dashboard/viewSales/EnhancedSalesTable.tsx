// src/app/dashboard/viewSales/EnhancedSalesTable.tsx
import React from 'react';
import { Sale } from '@/types/sale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from 'lucide-react';

interface EnhancedSalesTableProps {
  sales: Sale[];
  onViewDetails: (sale: Sale) => void;
}

export function EnhancedSalesTable({ sales, onViewDetails }: EnhancedSalesTableProps) {
  const sortedSales = [...sales]
    .filter(sale => sale.items && sale.items.length > 0)
    .sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());

  // Calculate totals for each sale
  const calculateSaleTotals = (sale: Sale) => {
    // For free bills, use the totalAmount (which should be 0)
    // For regular sales, calculate from items
    const inventoryTotal = sale.isFreeBill ? 0 : sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const inventoryCost = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
    const profit = inventoryTotal - inventoryCost;
    
    // For free bills, profit margin should show the discount (negative)
    const originalAmount = sale.originalAmount || inventoryTotal;
    
    return { 
      totalLKR: inventoryTotal, 
      cost: inventoryCost, 
      profit, 
      profitMargin: originalAmount > 0 ? (profit / originalAmount) * 100 : 0
    };
  };

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="rounded-md border">
      {/* Fixed header */}
      <div className="border-b">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Date</TableHead>
              <TableHead className="w-[200px]">Customer</TableHead>
              <TableHead className="w-[130px]">Created By</TableHead>
              <TableHead className="w-[100px]">Items</TableHead>
              <TableHead className="w-[140px]">Total Amount</TableHead>
              <TableHead className="w-[120px]">Profit</TableHead>
              <TableHead className="w-[100px]">Margin %</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Scrollable body */}
      <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
        <Table>
          <TableBody>
            {sortedSales.map((sale) => {
              const { totalLKR, cost, profit, profitMargin } = calculateSaleTotals(sale);
              
              return (
                <TableRow key={sale.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {sale.saleDate.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sale.saleDate.toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {sale.customerInfo?.name || sale.customer?.name || 'Walk-in Customer'}
                      </div>
                      {(sale.customerInfo?.mobile || sale.customer?.phone) && (
                        <div className="text-xs text-muted-foreground">
                          {sale.customerInfo?.mobile || sale.customer?.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {sale.createdBy?.displayName || sale.createdBy?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sale.createdBy?.role || 'staff'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {formatCurrency(totalLKR)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cost: {formatCurrency(cost)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profit)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={profitMargin >= 20 ? 'default' : profitMargin >= 10 ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {profitMargin.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[60px]">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewDetails(sale)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}