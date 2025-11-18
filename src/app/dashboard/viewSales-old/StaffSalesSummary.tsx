import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale } from '@/types/sale';
import { StaffUser } from '@/types/staff';
import { DollarSign, ShoppingCart, TrendingUp, BadgeDollarSign, User } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface StaffSalesSummaryProps {
  sales: Sale[];
  selectedStaff: StaffUser;
}

const StaffSalesSummary = ({ sales, selectedStaff }: StaffSalesSummaryProps) => {
  // Calculate totals from inventory items only for the selected staff
  const totals = sales.reduce((acc, sale) => {
    // Only include sales made by the selected staff
    if (sale.createdBy?.uid !== selectedStaff.uid) return acc;

    const saleTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const costTotal = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
    
    return {
      sales: acc.sales + saleTotal,
      cost: acc.cost + costTotal,
      count: acc.count + 1,
      items: acc.items + sale.items.length
    };
  }, { sales: 0, cost: 0, count: 0, items: 0 });

  const profit = totals.sales - totals.cost;
  const profitMargin = totals.sales > 0 ? (profit / totals.sales) * 100 : 0;
  const averageSaleValue = totals.count > 0 ? totals.sales / totals.count : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Staff Performance: {selectedStaff.displayName || 'Unknown'}</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="capitalize">{selectedStaff.role || 'staff'}</Badge>
              <span className="text-sm text-muted-foreground">{selectedStaff.email}</span>
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
          <ShoppingCart className="h-4 w-4 mr-1" />
          {totals.count} sales
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Rs{profit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Net profit from sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{averageSaleValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totals.items} items sold in total
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
    </div>
  );
};

export default StaffSalesSummary;