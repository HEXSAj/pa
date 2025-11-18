// src/app/dashboard/reports/ReportCharts.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { ReportsData } from '@/types/reports';

interface ReportChartsProps {
  reportsData: ReportsData;
}

export const ReportCharts: React.FC<ReportChartsProps> = ({ reportsData }) => {
  
  // Prepare data for service type chart
  const serviceTypeData = [
    { name: 'Appointments', lkr: reportsData.serviceTypes.appointments.lkr },
    { name: 'Procedures', lkr: reportsData.serviceTypes.procedures.lkr },
    { name: 'Lab Tests', lkr: reportsData.serviceTypes.lab.lkr },
    { name: 'Pharmacy', lkr: reportsData.serviceTypes.pharmacy.lkr }
  ];
  
  // Prepare data for patient type pie chart - only local patients
  const patientTypeData = [
    { name: 'Local Patients', value: reportsData.patientTypes.local.count, color: '#22c55e' }
  ];
  
  // Prepare data for payment method chart
  const paymentMethodData = [
    { name: 'Cash', lkr: reportsData.paymentMethods.cash.lkr },
    { name: 'Card', lkr: reportsData.paymentMethods.card.lkr }
  ];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Service Type Income Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Service Type Income Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={serviceTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [
                  `Rs. ${Number(value).toFixed(2)}`,
                  'LKR'
                ]}
              />
              <Bar dataKey="lkr" fill="#22c55e" name="LKR" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Patient Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Patient Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {reportsData.patientTypes.local.count}
            </div>
            <div className="text-lg text-gray-600 mb-4">Local Patients</div>
            <div className="text-sm text-gray-500">
              Insurance: {reportsData.patientTypes.local.insurance} | 
              Non-Insurance: {reportsData.patientTypes.local.nonInsurance}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Payment Method Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Payment Method Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentMethodData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [
                  `Rs. ${Number(value).toFixed(2)}`,
                  'LKR'
                ]}
              />
              <Bar dataKey="lkr" fill="#f59e0b" name="LKR" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Daily Income Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportsData.dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [
                  `Rs. ${Number(value).toFixed(2)}`,
                  'LKR'
                ]}
              />
              <Line type="monotone" dataKey="lkr" stroke="#22c55e" strokeWidth={2} name="LKR" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};