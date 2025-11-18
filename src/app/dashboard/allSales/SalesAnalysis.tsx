import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale } from '@/types/sale';
import { DollarSign, TrendingUp, BadgeDollarSign, Receipt, Stethoscope, TestTube, Package } from 'lucide-react';

interface SalesAnalysisProps {
  sales: Sale[];
}

const SalesAnalysis = ({ sales }: SalesAnalysisProps) => {
  // Calculate totals for inventory items
  const inventoryTotals = sales.reduce((acc, sale) => {
    const saleTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const costTotal = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
    
    return {
      sales: acc.sales + saleTotal,
      cost: acc.cost + costTotal,
      count: acc.count + 1
    };
  }, { sales: 0, cost: 0, count: 0 });

  // Calculate totals for laboratory tests
  const labTestTotals = sales.reduce((acc, sale) => {
    const testTotal = sale.laboratoryTests?.reduce((sum, test) => sum + test.price, 0) || 0;
    return acc + testTotal;
  }, 0);

  // Calculate totals for doctor fees
  const doctorFeeTotals = sales.reduce((acc, sale) => {
    const feeTotal = sale.doctorFees?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
    return acc + feeTotal;
  }, 0);

  const inventoryProfit = inventoryTotals.sales - inventoryTotals.cost;
  const inventoryProfitMargin = inventoryTotals.sales > 0 ? 
    (inventoryProfit / inventoryTotals.sales) * 100 : 0;

  const totalRevenue = inventoryTotals.sales + labTestTotals + doctorFeeTotals;

  return (
    <div className="space-y-8">
      {/* Overall Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All sales combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{inventoryTotals.cost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Inventory cost only
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rs{inventoryProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Net profit from inventory
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
              {inventoryProfitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Inventory profit margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Sales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{inventoryTotals.sales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {inventoryTotals.count} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laboratory Tests</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{labTestTotals.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {sales.filter(s => s.laboratoryTests?.length).length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctor Fees</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{doctorFeeTotals.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {sales.filter(s => s.doctorFees?.length).length} transactions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesAnalysis;