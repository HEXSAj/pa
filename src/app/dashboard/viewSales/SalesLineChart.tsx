// src/app/dashboard/viewSales/SalesLineChart.tsx
import React, { useMemo } from 'react';
import { Sale } from '@/types/sale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { addDays, format, isAfter, isBefore, isSameDay, startOfDay, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';

interface SalesLineChartProps {
  sales: Sale[];
  dateFilterType: 'all' | 'date' | 'month' | 'year' | 'range' | 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';
  selectedDate?: Date;
  dateRange?: { from?: Date; to?: Date };
  selectedMonth?: string;
  selectedYear?: string;
}

const SalesLineChart = ({ 
  sales, 
  dateFilterType, 
  selectedDate, 
  dateRange,
  selectedMonth,
  selectedYear 
}: SalesLineChartProps) => {

  // Generate chart data based on the selected date filter
  const chartData = useMemo(() => {
    if (!sales || sales.length === 0) return [];

    // Sort sales by date
    const sortedSales = [...sales].sort((a, b) => a.saleDate.getTime() - b.saleDate.getTime());
    
    let startDate: Date;
    let endDate: Date;
    let interval: 'day' | 'week' | 'month';
    
    // Define date range and interval based on filter type
    switch (dateFilterType) {
      case 'date':
        if (selectedDate) {
          startDate = startOfDay(selectedDate);
          endDate = startOfDay(addDays(selectedDate, 1));
          interval = 'day';
        } else {
          // Fallback to last 7 days if no date selected
          endDate = new Date();
          startDate = subMonths(endDate, 1);
          interval = 'day';
        }
        break;
        
      case 'month':
        if (selectedMonth) {
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const monthIndex = monthNames.indexOf(selectedMonth);
          const year = new Date().getFullYear();
          startDate = startOfMonth(new Date(year, monthIndex));
          endDate = endOfMonth(new Date(year, monthIndex));
        } else {
          endDate = new Date();
          startDate = subMonths(endDate, 1);
        }
        interval = 'day';
        break;
        
      case 'year':
        if (selectedYear) {
          startDate = startOfYear(new Date(parseInt(selectedYear), 0));
          endDate = endOfYear(new Date(parseInt(selectedYear), 0));
        } else {
          endDate = new Date();
          startDate = subYears(endDate, 1);
        }
        interval = 'month';
        break;
        
      case 'range':
        if (dateRange && dateRange.from && dateRange.to) {
          startDate = startOfDay(dateRange.from);
          endDate = startOfDay(addDays(dateRange.to, 1));
          
          // Calculate interval based on range duration
          const diffDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
          interval = diffDays > 60 ? 'month' : 'day';
        } else {
          endDate = new Date();
          startDate = subMonths(endDate, 1);
          interval = 'day';
        }
        break;
        
      case 'today':
        startDate = startOfDay(new Date());
        endDate = addDays(startDate, 1);
        interval = 'day';
        break;
        
      case 'thisWeek':
        const today = new Date();
        startDate = new Date(today.setDate(today.getDate() - today.getDay()));
        endDate = addDays(new Date(), 1);
        interval = 'day';
        break;
        
      case 'thisMonth':
        startDate = startOfMonth(new Date());
        endDate = new Date();
        interval = 'day';
        break;
        
      case 'thisYear':
        startDate = startOfYear(new Date());
        endDate = new Date();
        interval = 'month';
        break;
      
      case 'custom':
        if (dateRange && dateRange.from && dateRange.to) {
          startDate = startOfDay(dateRange.from);
          endDate = startOfDay(addDays(dateRange.to, 1));
          
          // Calculate interval based on range duration
          const diffDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
          interval = diffDays > 60 ? 'month' : 'day';
        } else {
          endDate = new Date();
          startDate = subMonths(endDate, 1);
          interval = 'day';
        }
        break;
        
      case 'all':
      default:
        if (sortedSales.length > 0) {
          startDate = sortedSales[0].saleDate;
          endDate = new Date();
          
          // Calculate interval based on total duration
          const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          interval = diffDays > 60 ? 'month' : 'day';
        } else {
          endDate = new Date();
          startDate = subMonths(endDate, 1);
          interval = 'day';
        }
    }
    
    // Filter sales within the selected date range
    const filteredSales = sortedSales.filter(
      sale => (isAfter(sale.saleDate, startDate) || isSameDay(sale.saleDate, startDate)) && 
              (isBefore(sale.saleDate, endDate) || isSameDay(sale.saleDate, endDate))
    );
    
    // Generate data points based on interval
    if (interval === 'day') {
      // Group sales by day
      const dailyData = new Map();
      
      // Initialize days
      let currentDate = new Date(startDate);
      while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        dailyData.set(dateKey, {
          date: new Date(currentDate),
          sales: 0,
          cost: 0,
          profit: 0
        });
        currentDate = addDays(currentDate, 1);
      }
      
      // Add sales data
      filteredSales.forEach(sale => {
        const dateKey = format(sale.saleDate, 'yyyy-MM-dd');
        if (dailyData.has(dateKey)) {
          const data = dailyData.get(dateKey);
          
          // Calculate totals from inventory items only
          // For free bills, use 0 for selling price
          const salesTotal = sale.isFreeBill ? 0 : sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
          const costTotal = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
          const profitTotal = salesTotal - costTotal;
          
          dailyData.set(dateKey, {
            ...data,
            sales: data.sales + salesTotal,
            cost: data.cost + costTotal,
            profit: data.profit + profitTotal
          });
        }
      });
      
      // Convert to array and format for chart
      return Array.from(dailyData.values()).map(data => ({
        name: format(data.date, 'dd MMM'),
        Sales: parseFloat(data.sales.toFixed(2)),
        Cost: parseFloat(data.cost.toFixed(2)),
        Profit: parseFloat(data.profit.toFixed(2))
      }));
    } else {
      // Group sales by month
      const monthlyData = new Map();
      
      // Initialize months
      let currentMonth = startOfMonth(startDate);
      while (isBefore(currentMonth, endDate)) {
        const monthKey = format(currentMonth, 'yyyy-MM');
        monthlyData.set(monthKey, {
          date: new Date(currentMonth),
          sales: 0,
          cost: 0,
          profit: 0
        });
        currentMonth = startOfMonth(addDays(endOfMonth(currentMonth), 1));
      }
      
      // Add sales data
      filteredSales.forEach(sale => {
        const monthKey = format(sale.saleDate, 'yyyy-MM');
        if (monthlyData.has(monthKey)) {
          const data = monthlyData.get(monthKey);
          
          // Calculate totals from inventory items only
          // For free bills, use 0 for selling price
          const salesTotal = sale.isFreeBill ? 0 : sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
          const costTotal = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
          const profitTotal = salesTotal - costTotal;
          
          monthlyData.set(monthKey, {
            ...data,
            sales: data.sales + salesTotal,
            cost: data.cost + costTotal,
            profit: data.profit + profitTotal
          });
        }
      });
      
      // Convert to array and format for chart
      return Array.from(monthlyData.values()).map(data => ({
        name: format(data.date, 'MMM yyyy'),
        Sales: parseFloat(data.sales.toFixed(2)),
        Cost: parseFloat(data.cost.toFixed(2)),
        Profit: parseFloat(data.profit.toFixed(2))
      }));
    }
  }, [sales, dateFilterType, selectedDate, dateRange, selectedMonth, selectedYear]);

  // Get chart title based on filter type
  const getChartTitle = () => {
    switch (dateFilterType) {
      case 'date':
        return selectedDate ? `Sales for ${format(selectedDate, 'dd MMM yyyy')}` : 'Daily Sales';
      case 'month':
        return selectedMonth ? `Sales for ${selectedMonth}` : 'Monthly Sales';
      case 'year':
        return selectedYear ? `Sales for ${selectedYear}` : 'Yearly Sales';
      case 'range':
        return dateRange?.from && dateRange?.to 
          ? `Sales from ${format(dateRange.from, 'dd MMM yyyy')} to ${format(dateRange.to, 'dd MMM yyyy')}`
          : 'Sales Data';
      case 'today':
        return 'Today\'s Sales';
      case 'thisWeek':
        return 'This Week\'s Sales';
      case 'thisMonth':
        return 'This Month\'s Sales';
      case 'thisYear':
        return 'This Year\'s Sales';
      case 'all':
      default:
        return 'All Time Sales Data';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `Rs${value.toFixed(2)}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Sales"
                stroke="#8884d8"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="Cost"
                stroke="#f87171"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Profit"
                stroke="#4ade80"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesLineChart;