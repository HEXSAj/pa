// src/components/SessionExpenseModal.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { expenseService } from '@/services/expenseService';
import { cashierService } from '@/services/cashierService';
import { ExpenseCategory } from '@/types/expense';
import { format } from 'date-fns';
import { Trash2, Plus, DollarSign } from 'lucide-react';

interface SessionExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onExpenseAdded?: () => void;
}

export function SessionExpenseModal({ 
  open, 
  onOpenChange, 
  sessionId, 
  onExpenseAdded 
}: SessionExpenseModalProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [sessionExpenses, setSessionExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    details: '',
    categoryId: '',
    categoryName: ''
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, sessionId]);



  const loadData = async () => {
  setLoading(true);
  try {
    // Load categories and ALL session expenses (including doctor fees)
    const [categoriesData, expensesData] = await Promise.all([
      expenseService.getAllCategories(),
      // UPDATED: Use getAllSessionExpenses instead of getSessionExpenses
      // cashierService.getAllSessionExpenses(sessionId)
      cashierService.getSessionExpenses(sessionId)
    
    ]);
    
    setCategories(categoriesData);
    setSessionExpenses(expensesData);
  } catch (error) {
    console.error('Error loading data:', error);
    toast({
      title: "Error",
      description: "Failed to load expense data",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


  const handleCategoryChange = (categoryId: string) => {
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    setFormData(prev => ({
      ...prev,
      categoryId,
      categoryName: selectedCategory?.name || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.details || !formData.categoryId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
  
    setSubmitting(true);
    try {
      // Create the expense data
      const expenseData = {
        date: new Date(),
        amount: parseFloat(formData.amount),
        details: formData.details,
        categoryId: formData.categoryId,
        categoryName: formData.categoryName,
        // Add sessionId to the expense data so it's properly linked
        sessionId: sessionId
      };
  
      // Create the expense - the expenseService should handle linking to session automatically
      await expenseService.createExpense(expenseData);
  
      toast({
        title: "Expense Added",
        description: "Session expense has been recorded successfully",
        variant: "default",
      });
  
      // Reset form
      setFormData({
        amount: '',
        details: '',
        categoryId: '',
        categoryName: ''
      });
  
      // Reload data
      await loadData();
      
      // Notify parent
      if (onExpenseAdded) {
        onExpenseAdded();
      }
  
    } catch (error) {
      console.error('Error creating session expense:', error);
      toast({
        title: "Error",
        description: "Failed to record expense",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };



  const totalExpenses = sessionExpenses.reduce((sum, expense) => {
    const amount = parseFloat(expense.amount) || 0;
    return sum + amount;
  }, 0);

  console.log('SessionExpenseModal - Total expenses:', totalExpenses);
  console.log('SessionExpenseModal - Expenses array:', sessionExpenses);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Session Expenses
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Expense Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount (LKR)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.categoryId} 
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id!}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="details">Details</Label>
                  <Textarea
                    id="details"
                    placeholder="Enter expense details..."
                    value={formData.details}
                    onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Adding...' : 'Add Expense'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Session Expenses List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Session Expenses</CardTitle>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Total: LKR {totalExpenses.toFixed(2)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading expenses...</div>
              ) : sessionExpenses.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No expenses recorded for this session
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sessionExpenses.map((expense) => (
                    <div key={expense.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-lg">
                          LKR {expense.amount.toFixed(2)}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {expense.categoryName}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {expense.details}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(expense.date, 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}