// src/app/dashboard/reports/ReportsInstructions.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HelpCircle, X } from 'lucide-react';

export default function ReportsInstructions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        className="gap-1"
        onClick={() => setIsOpen(true)}
      >
        <HelpCircle className="h-4 w-4" />
        Help
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>How to Use Financial Reports</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Learn how to use the financial reports to gain insights into your business performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Overview</h3>
                <p className="text-muted-foreground">
                  The Financial Reports page combines your sales revenue, inventory costs, and expenses 
                  to calculate true business profitability. This helps you understand your business 
                  performance beyond simple revenue numbers.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Filtering Reports</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>
                    <strong>Time Period:</strong> Select from preset time periods or set a custom date range
                  </li>
                  <li>
                    <strong>Customer:</strong> Filter results for a specific customer to see their contribution
                  </li>
                  <li>
                    <strong>Reset Filters:</strong> Click the "Reset Filters" button to start over
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Report Sections</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>
                    <strong>Summary:</strong> Overall financial metrics, charts, and daily breakdowns
                  </li>
                  <li>
                    <strong>Sales:</strong> Detailed list of individual sales transactions
                  </li>
                  <li>
                    <strong>Expenses:</strong> Detailed list of all expenses by category
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Understanding Profit Calculations</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>
                    <strong>Total Revenue:</strong> Sum of all sales from inventory items
                  </li>
                  <li>
                    <strong>Inventory Cost:</strong> Cost of items sold (your purchase cost)
                  </li>
                  <li>
                    <strong>Gross Profit:</strong> Revenue - Inventory Cost
                  </li>
                  <li>
                    <strong>Total Expenses:</strong> All operational expenses recorded
                  </li>
                  <li>
                    <strong>Net Profit:</strong> Gross Profit - Expenses
                  </li>
                  <li>
                    <strong>Profit Margin:</strong> (Net Profit ÷ Revenue) × 100%
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Exporting Reports</h3>
                <p className="text-muted-foreground">
                  Click the "Export Report" button to download an Excel spreadsheet containing all the data 
                  from your current filtered view. This includes separate sheets for summary data, 
                  expenses by category, daily breakdowns, and individual transactions.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setIsOpen(false)}>Close</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}