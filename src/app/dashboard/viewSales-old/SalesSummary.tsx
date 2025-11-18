import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale } from '@/types/sale';
import { DollarSign, TrendingUp, BadgeDollarSign, Receipt } from 'lucide-react';

interface SalesSummaryProps {
  sales: Sale[];
}

const SalesSummary = ({ sales }: SalesSummaryProps) => {
  // Calculate totals from inventory items only
  const totals = sales.reduce((acc, sale) => {
    const saleTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const costTotal = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
    
    return {
      sales: acc.sales + saleTotal,
      cost: acc.cost + costTotal,
      count: acc.count + 1
    };
  }, { sales: 0, cost: 0, count: 0 });

  const profit = totals.sales - totals.cost;
  const profitMargin = totals.sales > 0 ? (profit / totals.sales) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rs{totals.sales.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            From {totals.count} transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rs{totals.cost.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Inventory cost
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            Rs{profit.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Net profit from sales
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {profitMargin.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Average profit margin
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesSummary;