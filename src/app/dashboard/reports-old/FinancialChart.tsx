// src/app/dashboard/reports/FinancialChart.tsx
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DailyData {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  expenses: number;
  netProfit: number;
}

interface FinancialChartProps {
  data: DailyData[];
  title: string;
  type: 'line' | 'bar';
}

export default function FinancialChart({ data, title, type }: FinancialChartProps) {
  // Process data to make it more readable
  const chartData = useMemo(() => {
    return data.slice().reverse().map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));
  }, [data]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'line' ? (
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
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`Rs${value.toFixed(2)}`, undefined]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#8884d8" />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ff7300" />
                <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#82ca9d" />
              </LineChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`Rs${value.toFixed(2)}`, undefined]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" stackId="a" fill="#8884d8" />
                <Bar dataKey="cost" name="Inv. Cost" stackId="a" fill="#ff7300" />
                <Bar dataKey="expenses" name="Expenses" stackId="a" fill="#ffc658" />
                <Bar dataKey="netProfit" name="Net Profit" fill="#82ca9d" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}