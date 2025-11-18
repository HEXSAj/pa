// src/app/dashboard/viewSales/EnhancedSalesSummary.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale } from '@/types/sale';
import { DollarSign, TrendingUp, BadgeDollarSign, Receipt, Users } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface EnhancedSalesSummaryProps {
  sales: Sale[];
}

const EnhancedSalesSummary = ({ sales }: EnhancedSalesSummaryProps) => {
  // Calculate sales totals
  const totals = sales.reduce((acc, sale) => {
    // For free bills, use 0 for selling price
    const saleTotal = sale.isFreeBill ? 0 : sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const costTotal = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
    
    return {
      sales: acc.sales + saleTotal,
      cost: acc.cost + costTotal,
      count: acc.count + 1,
      itemsCount: acc.itemsCount + sale.items.length
    };
  }, { sales: 0, cost: 0, count: 0, itemsCount: 0 });

  // Calculate profits
  const profit = totals.sales - totals.cost;
  
  // Calculate profit margin
  const profitMargin = totals.sales > 0 ? (profit / totals.sales) * 100 : 0;

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales (LKR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.sales)}</div>
            <p className="text-xs text-muted-foreground">
              {totals.count} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit (LKR)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(profit)}</div>
            <p className="text-xs text-muted-foreground">
              {profitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items Sold</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.itemsCount}</div>
            <p className="text-xs text-muted-foreground">
              Pharmacy items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost (LKR)</CardTitle>
            <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.cost)}</div>
            <p className="text-xs text-muted-foreground">
              Cost of goods sold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid gap-4 md:grid-cols-1">
        {/* Sales Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sales Summary
              <Badge variant="outline" className="ml-auto">
                {totals.count} sales
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Sales Total</p>
                <p className="text-lg font-semibold">{formatCurrency(totals.sales)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost Total</p>
                <p className="text-lg font-semibold text-red-600">{formatCurrency(totals.cost)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Profit</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(profit)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className="text-lg font-semibold">{profitMargin.toFixed(1)}%</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Items Sold</p>
              <p className="text-lg font-semibold">{totals.itemsCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedSalesSummary;