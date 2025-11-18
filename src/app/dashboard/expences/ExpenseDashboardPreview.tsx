// src/app/dashboard/expences/ExpenseDashboardPreview.tsx
import React, { useState } from 'react';
import { 
  ArrowUpDown, 
  CalendarIcon, 
  ChevronDown, 
  MoreHorizontal, 
  Pencil, 
  Plus, 
  Search, 
  Settings, 
  Trash2 
} from 'lucide-react';

// Mock data
const mockExpenses = [
  { 
    id: '1', 
    date: new Date('2025-02-25'), 
    categoryName: 'Groceries', 
    details: 'Weekly grocery shopping at SuperMart', 
    amount: 2450.75 
  },
  { 
    id: '2', 
    date: new Date('2025-02-22'), 
    categoryName: 'Utilities', 
    details: 'Electricity bill for February', 
    amount: 1800.00 
  },
  { 
    id: '3', 
    date: new Date('2025-02-20'), 
    categoryName: 'Transportation', 
    details: 'Uber rides for work', 
    amount: 750.50 
  },
  { 
    id: '4', 
    date: new Date('2025-02-18'), 
    categoryName: 'Dining', 
    details: 'Dinner with friends at Italian Restaurant', 
    amount: 3200.25 
  },
  { 
    id: '5', 
    date: new Date('2025-02-15'), 
    categoryName: 'Healthcare', 
    details: 'Monthly medication', 
    amount: 1250.00 
  }
];

// Calculate category totals
const categoryTotals = mockExpenses.reduce((acc, expense) => {
  acc[expense.categoryName] = (acc[expense.categoryName] || 0) + expense.amount;
  return acc;
}, {});

const totalAmount = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0);

const ExpenseDashboardPreview = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('This Month');

  const formatCurrency = (amount) => {
    return amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-md flex items-center gap-2 bg-white shadow-sm">
            <Settings className="h-4 w-4" />
            <span>Categories</span>
          </button>
          <button className="px-4 py-2 rounded-md flex items-center gap-2 bg-blue-600 text-white shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-10 py-2 pr-3 border rounded-md shadow-sm bg-white"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <button className="w-full px-4 py-2 border rounded-md flex items-center justify-between bg-white shadow-sm">
            <span>All Categories</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <div className="col-span-2">
          <button className="w-full px-4 py-2 border rounded-md flex items-center justify-between bg-white shadow-sm">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>{dateRange}</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold">Rs{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-gray-500 mt-1">{mockExpenses.length} expenses</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Category Breakdown</h3>
          <div className="mt-2 space-y-3">
            {Object.entries(categoryTotals).map(([category, total]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm">{category}</span>
                <span className="font-medium">Rs{formatCurrency(total)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Activity</h3>
          <div className="space-y-4">
            {mockExpenses.slice(0, 3).map((expense) => (
              <div key={expense.id} className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{expense.categoryName}</p>
                  <p className="text-xs text-gray-500">{formatDate(expense.date)}</p>
                </div>
                <p className="text-sm font-medium">Rs{formatCurrency(expense.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">All Expenses</h2>
          <p className="text-sm text-gray-500">Manage and review your expense records</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left">
                  <button className="flex items-center text-xs font-medium text-gray-500 uppercase">
                    Date
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button className="flex items-center text-xs font-medium text-gray-500 uppercase">
                    Category
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
                <th className="px-6 py-3 text-right">
                  <button className="flex items-center text-xs font-medium text-gray-500 uppercase ml-auto">
                    Amount
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {mockExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50 border-b">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full border">
                      {expense.categoryName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm max-w-xs truncate">
                    {expense.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    Rs{formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="px-2 py-1 text-gray-500 hover:text-gray-700">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {mockExpenses.length} expenses
          </div>
          <div className="font-medium">
            Total: Rs{formatCurrency(totalAmount)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDashboardPreview;