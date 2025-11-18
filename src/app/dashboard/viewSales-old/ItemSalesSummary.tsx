import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale } from '@/types/sale';
import { InventoryItem } from '@/types/inventory';
import { DollarSign, TrendingUp, BadgeDollarSign, Package } from 'lucide-react';

interface ItemSalesSummaryProps {
  sales: Sale[];
  selectedItem: InventoryItem;
}

const ItemSalesSummary = ({ sales, selectedItem }: ItemSalesSummaryProps) => {
  // Calculate totals for the selected item
  const totals = sales.reduce((acc, sale) => {
    const itemSales = sale.items.filter(item => item.itemId === selectedItem.id);
    const saleTotal = itemSales.reduce((sum, item) => sum + item.totalPrice, 0);
    const costTotal = itemSales.reduce((sum, item) => sum + item.totalCost, 0);
    const quantity = itemSales.reduce((sum, item) => {
      if (item.item.unitContains) {
        return sum + (item.unitQuantity * item.item.unitContains.value) + item.subUnitQuantity;
      }
      return sum + item.unitQuantity;
    }, 0);
    
    return {
      sales: acc.sales + saleTotal,
      cost: acc.cost + costTotal,
      quantity: acc.quantity + quantity,
      transactions: acc.transactions + (itemSales.length > 0 ? 1 : 0)
    };
  }, { sales: 0, cost: 0, quantity: 0, transactions: 0 });

  const profit = totals.sales - totals.cost;
  const profitMargin = totals.sales > 0 ? (profit / totals.sales) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rs{totals.sales.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {totals.quantity} units in {totals.transactions} transactions
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
            Product cost
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
            Net profit from product
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
            Product profit margin
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ItemSalesSummary;