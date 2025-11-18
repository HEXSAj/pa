// src/app/dashboard/viewSales/PatientTypeSummary.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale } from '@/types/sale';
import { DollarSign, Users, BarChart3, TrendingUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface PatientTypeSummaryProps {
  sales: Sale[];
}

const PatientTypeSummary = ({ sales }: PatientTypeSummaryProps) => {
  // Calculate overall sales summary
  const salesSummary = sales.reduce((acc, sale) => {
    // Calculate totals from inventory items
    // For free bills, use 0 for selling price
    const saleTotal = sale.isFreeBill ? 0 : sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const costTotal = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
    const profitTotal = saleTotal - costTotal;
    
    acc.count += 1;
    acc.sales += saleTotal;
    acc.cost += costTotal;
    acc.profit += profitTotal;
    acc.itemsCount += sale.items.length;
    
    return acc;
  }, { count: 0, sales: 0, cost: 0, profit: 0, itemsCount: 0 });
  
  // Calculate profit margin
  const profitMargin = salesSummary.sales > 0 ? (salesSummary.profit / salesSummary.sales) * 100 : 0;
  const averageSaleValue = salesSummary.count > 0 ? salesSummary.sales / salesSummary.count : 0;

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sales Overview</h3>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Total Sales: {salesSummary.count}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salesSummary.sales)}</div>
            <p className="text-xs text-muted-foreground">
              {salesSummary.count} transactions
            </p>
          </CardContent>
        </Card>

        {/* Total Profit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(salesSummary.profit)}</div>
            <p className="text-xs text-muted-foreground">
              {profitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        {/* Average Sale Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageSaleValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>

        {/* Items Sold */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesSummary.itemsCount}</div>
            <p className="text-xs text-muted-foreground">
              Total items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{profitMargin.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Profit Margin</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(salesSummary.cost)}</div>
              <div className="text-sm text-muted-foreground">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{salesSummary.count > 0 ? (salesSummary.itemsCount / salesSummary.count).toFixed(1) : '0'}</div>
              <div className="text-sm text-muted-foreground">Avg Items/Sale</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{salesSummary.count > 0 ? (salesSummary.profit / salesSummary.count).toFixed(2) : '0'}</div>
              <div className="text-sm text-muted-foreground">Avg Profit/Sale</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientTypeSummary;