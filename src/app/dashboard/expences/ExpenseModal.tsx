// src/components/expenses/ExpenseModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Expense, ExpenseCategory } from '@/types/expense';
import { expenseService } from '@/services/expenseService';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense;
  onSuccess: () => void;
}

export default function ExpenseModal({ isOpen, onClose, expense, onSuccess }: ExpenseModalProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    details: ''
  });

  useEffect(() => {
    loadCategories();
    if (expense) {
      setDate(new Date(expense.date));
      setFormData({
        categoryId: expense.categoryId,
        amount: expense.amount.toString(),
        details: expense.details || ''
      });
    } else {
      setDate(new Date());
      setFormData({
        categoryId: '',
        amount: '',
        details: ''
      });
    }
  }, [expense, isOpen]);

  const loadCategories = async () => {
    try {
      const data = await expenseService.getAllCategories();
      setCategories(data);
      if (data.length > 0 && !expense) {
        setFormData(prev => ({ ...prev, categoryId: data[0].id! }));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading categories",
        description: "There was a problem loading expense categories.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId) {
      toast({
        variant: "destructive",
        title: "Missing category",
        description: "Please select a category for this expense.",
      });
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount greater than zero.",
      });
      return;
    }

    try {
      setLoading(true);
      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      if (!selectedCategory) return;

      const expenseData = {
        date: date,
        categoryId: formData.categoryId,
        categoryName: selectedCategory.name,
        amount: parseFloat(formData.amount),
        details: formData.details
      };

      if (expense?.id) {
        await expenseService.updateExpense(expense.id, expenseData);
        toast({
          title: "Expense updated",
          description: "Your expense has been updated successfully.",
        });
      } else {
        await expenseService.createExpense(expenseData);
        toast({
          title: "Expense added",
          description: "Your expense has been added successfully.",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving expense",
        description: "There was a problem saving your expense.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </DialogTitle>
          <DialogDescription>
            {expense 
              ? 'Update the details of your expense.' 
              : 'Fill in the details to add a new expense.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="expense-date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select 
                value={formData.categoryId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger id="expense-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <SelectItem value="loading" disabled>
                      No categories available
                    </SelectItem>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id || ''}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  Rs
                </span>
                <Input
                  id="expense-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-10"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-details">Details</Label>
              <Textarea
                id="expense-details"
                placeholder="Enter additional details about this expense"
                className="min-h-[100px]"
                value={formData.details}
                onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {expense ? 'Update' : 'Add'} Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}