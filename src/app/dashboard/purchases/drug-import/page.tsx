// src/app/dashboard/purchases/drug-import/page.tsx
'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DrugExcelImporter from '../DrugExcelImporter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import withAuth from '@/components/withAuth';

function DrugImportPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-blue-500" />
          <h1 className="text-3xl font-bold tracking-tight">Drug Import Tool</h1>
        </div>
        
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-800">About This Tool</AlertTitle>
          <AlertDescription className="text-blue-700">
            This tool allows you to quickly import drugs from an Excel file into your inventory system. 
            Each drug will be added as an inventory item with a batch of the specified quantity.
            Make sure your Excel file has columns for Generic Name (A), Trade Name (B), Cost per unit (C), and Selling per unit (D).
          </AlertDescription>
        </Alert>
        
        <DrugExcelImporter />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Excel File Format</CardTitle>
            <CardDescription>
              Your Excel file should follow this structure for successful import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 border border-gray-200 font-medium text-left">Column A</th>
                    <th className="p-2 border border-gray-200 font-medium text-left">Column B</th>
                    <th className="p-2 border border-gray-200 font-medium text-left">Column C</th>
                    <th className="p-2 border border-gray-200 font-medium text-left">Column D</th>
                    <th className="p-2 border border-gray-200 font-medium text-left">Column E</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-gray-200">Item Code</td>
                    <td className="p-2 border border-gray-200">Generic Name</td>
                    <td className="p-2 border border-gray-200">Trade Name</td>
                    <td className="p-2 border border-gray-200">Cost per unit</td>
                    <td className="p-2 border border-gray-200">Selling per unit</td>
                  </tr>
                   <tr className="bg-gray-50">
                    <td className="p-2 border border-gray-200">PAR001</td>
                    <td className="p-2 border border-gray-200">Paracetamol</td>
                    <td className="p-2 border border-gray-200">Panadol</td>
                    <td className="p-2 border border-gray-200">5.50</td>
                    <td className="p-2 border border-gray-200">8.00</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200">PAR002</td>
                    <td className="p-2 border border-gray-200">Amoxicillin</td>
                    <td className="p-2 border border-gray-200">Amoxil</td>
                    <td className="p-2 border border-gray-200">10.00</td>
                    <td className="p-2 border border-gray-200">15.00</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-2 border border-gray-200">PAR003</td>
                    <td className="p-2 border border-gray-200">Cetirizine</td>
                    <td className="p-2 border border-gray-200">Zyrtec</td>
                    <td className="p-2 border border-gray-200">7.50</td>
                    <td className="p-2 border border-gray-200">12.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground space-y-2">
              <p><strong>Notes:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>The Item Code (Column A) and Trade Name (Column C) are required</li>
                <li>The Trade Name (Column B) is required and must be unique for each drug</li>
                <li>Generic Name (Column A) is optional but recommended</li>
                <li>Cost per unit (Column C) and Selling per unit (Column D) must be valid numbers</li>
                <li>If a drug with the same Trade Name already exists, the existing item will be used</li>
                <li>Each drug will be created with the batch quantity you specify (default 1000)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DrugImportPage);