// src/components/expenses/CategoryModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExpenseCategory } from '@/types/expense';
import { expenseService } from '@/services/expenseService';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryModal({ isOpen, onClose }: CategoryModalProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Loading categories...");
      const data = await expenseService.getAllCategories();
      console.log("Categories loaded:", data.length);
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      setError("Failed to load categories.");
      toast({
        variant: "destructive",
        title: "Error loading categories",
        description: "There was a problem loading categories.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newCategory.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Category name is required.",
      });
      return;
    }
    
    try {
      setSubmitLoading(true);
      setError(null);
      
      if (editingCategory?.id) {
        console.log("Updating category:", editingCategory.id, newCategory);
        await expenseService.updateCategory(editingCategory.id, newCategory);
        toast({
          title: "Category updated",
          description: `${newCategory.name} has been updated successfully.`,
        });
      } else {
        console.log("Creating new category:", newCategory);
        await expenseService.createCategory(newCategory);
        toast({
          title: "Category created",
          description: `${newCategory.name} has been created successfully.`,
        });
      }
      
      setNewCategory({ name: '', description: '' });
      setEditingCategory(null);
      await loadCategories();
    } catch (error: any) {
      console.error("Error saving category:", error);
      
      const errorMessage = error?.message || "Failed to save category. Please try again.";
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error saving category",
        description: errorMessage,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description || ''
    });
  };

  const confirmDelete = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log("Deleting category:", categoryToDelete);
      await expenseService.deleteCategory(categoryToDelete);
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully.",
      });
      await loadCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      
      const errorMessage = error?.message || "Failed to delete category. Please try again.";
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error deleting category",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', description: '' });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Manage Expense Categories</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-name">Name</Label>
                      <Input
                        id="category-name"
                        placeholder="Category name"
                        required
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category-description">Description</Label>
                      <Input
                        id="category-description"
                        placeholder="Category description (optional)"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    {editingCategory && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : editingCategory ? (
                        <Pencil className="h-4 w-4 mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      {editingCategory ? 'Update Category' : 'Add Category'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          <p className="text-sm text-muted-foreground mt-2">Loading categories...</p>
                        </TableCell>
                      </TableRow>
                    ) : categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No categories found. Add one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.description}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(category)}
                                title="Edit category"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => category.id && confirmDelete(category.id)}
                                title="Delete category"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}