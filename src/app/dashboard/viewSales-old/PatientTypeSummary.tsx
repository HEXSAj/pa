// src/app/dashboard/viewSales/PatientTypeSummary.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale } from '@/types/sale';
import { DollarSign, Plane, Users, BarChart3 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface PatientTypeSummaryProps {
  sales: Sale[];
}

const PatientTypeSummary = ({ sales }: PatientTypeSummaryProps) => {
  // Group sales by patient type
  const patientTypeSummary = sales.reduce((acc, sale) => {
    const patientType = sale.patientType || 'local'; // Default to local if not specified
    
    // Calculate totals from inventory items
    const saleTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const costTotal = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
    const profitTotal = saleTotal - costTotal;
    
    if (!acc[patientType]) {
      acc[patientType] = {
        count: 0,
        sales: 0,
        cost: 0,
        profit: 0,
        itemsCount: 0
      };
    }
    
    acc[patientType].count += 1;
    acc[patientType].sales += saleTotal;
    acc[patientType].cost += costTotal;
    acc[patientType].profit += profitTotal;
    acc[patientType].itemsCount += sale.items.length;
    
    return acc;
  }, {} as Record<string, { count: number; sales: number; cost: number; profit: number; itemsCount: number }>);
  
  // Calculate totals and percentages
  const localData = patientTypeSummary.local || { count: 0, sales: 0, cost: 0, profit: 0, itemsCount: 0 };
  const foreignData = patientTypeSummary.foreign || { count: 0, sales: 0, cost: 0, profit: 0, itemsCount: 0 };
  
  const totalSales = localData.sales + foreignData.sales;
  const totalProfit = localData.profit + foreignData.profit;
  
  const localSalesPercentage = totalSales > 0 ? (localData.sales / totalSales) * 100 : 0;
  const foreignSalesPercentage = totalSales > 0 ? (foreignData.sales / totalSales) * 100 : 0;
  
  const localProfitPercentage = totalProfit > 0 ? (localData.profit / totalProfit) * 100 : 0;
  const foreignProfitPercentage = totalProfit > 0 ? (foreignData.profit / totalProfit) * 100 : 0;
  
  const localProfitMargin = localData.sales > 0 ? (localData.profit / localData.sales) * 100 : 0;
  const foreignProfitMargin = foreignData.sales > 0 ? (foreignData.profit / foreignData.sales) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Patient Type Analysis</h3>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Local Patients: {localData.count}
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Foreign Patients: {foreignData.count}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Sales by Patient Type */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Distribution</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-blue-500 mr-2"></span>
                  <span className="text-sm">Local:</span>
                </div>
                <div className="text-sm font-medium">
                  {localSalesPercentage.toFixed(1)}% (Rs{localData.sales.toFixed(2)})
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-amber-500 mr-2"></span>
                  <span className="text-sm">Foreign:</span>
                </div>
                <div className="text-sm font-medium">
                  {foreignSalesPercentage.toFixed(1)}% (Rs{foreignData.sales.toFixed(2)})
                </div>
              </div>
              
              {/* Progress bar visualization */}
              <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${localSalesPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit by Patient Type */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Distribution</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                  <span className="text-sm">Local:</span>
                </div>
                <div className="text-sm font-medium">
                  {localProfitPercentage.toFixed(1)}% (Rs{localData.profit.toFixed(2)})
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-purple-500 mr-2"></span>
                  <span className="text-sm">Foreign:</span>
                </div>
                <div className="text-sm font-medium">
                  {foreignProfitPercentage.toFixed(1)}% (Rs{foreignData.profit.toFixed(2)})
                </div>
              </div>
              
              {/* Progress bar visualization */}
              <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${localProfitPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Local Patient Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Local Patient Metrics</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              Rs{localData.profit.toFixed(2)}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">Profit Margin:</span>
              <Badge className={`${localProfitMargin >= 20 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {localProfitMargin.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">Avg Sale:</span>
              <span className="text-sm font-medium">
                Rs{localData.count > 0 ? (localData.sales / localData.count).toFixed(2) : '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Foreign Patient Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Foreign Patient Metrics</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              Rs{foreignData.profit.toFixed(2)}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">Profit Margin:</span>
              <Badge className={`${foreignProfitMargin >= 20 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {foreignProfitMargin.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">Avg Sale:</span>
              <span className="text-sm font-medium">
                Rs{foreignData.count > 0 ? (foreignData.sales / foreignData.count).toFixed(2) : '0.00'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientTypeSummary;