// src/app/dashboard/inventory/CategoryModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/inventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { toast } from "sonner";

interface CategoryModalProps {
  onClose: () => void;
}

export default function CategoryModal({ onClose }: CategoryModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#6b7280'
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsSaving(true);
      await categoryService.create(newCategory);
      setNewCategory({
        name: '',
        description: '',
        color: '#6b7280'
      });
      setIsAdding(false);
      await loadCategories();
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setIsSaving(true);
      await categoryService.update(editingCategory.id!, {
        name: editingCategory.name,
        description: editingCategory.description,
        color: editingCategory.color
      });
      setEditingCategory(null);
      await loadCategories();
      toast.success("Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      return;
    }

    try {
      setIsSaving(true);
      await categoryService.delete(id);
      await loadCategories();
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category. Make sure it's not used by any inventory items.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderColorCircle = (color: string) => (
    <div 
      className="w-6 h-6 rounded-full" 
      style={{ backgroundColor: color }} 
    />
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add New Category */}
            {isAdding ? (
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newCategoryName">Category Name *</Label>
                      <Input
                        id="newCategoryName"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter category name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newCategoryDescription">Description</Label>
                      <Input
                        id="newCategoryDescription"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter description (optional)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newCategoryColor">Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="newCategoryColor"
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                          className="w-12 h-10 p-1"
                        />
                        <div className="text-sm text-muted-foreground">
                          This color will be used to identify the category in the UI
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAdding(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={isSaving || !newCategory.name.trim()}
                        className="gap-1"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button 
                onClick={() => setIsAdding(true)}
                className="gap-1 w-full"
              >
                <Plus className="h-4 w-4" />
                Add New Category
              </Button>
            )}

            {/* Categories List */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Color</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                        No categories found. Add your first category above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        {editingCategory?.id === category.id ? (
                          <>
                            <TableCell>
                              <Input
                                type="color"
                                value={editingCategory.color || '#6b7280'}
                                onChange={(e) => setEditingCategory(prev => ({ ...prev!, color: e.target.value }))}
                                className="w-12 h-8 p-1"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editingCategory.name}
                                onChange={(e) => setEditingCategory(prev => ({ ...prev!, name: e.target.value }))}
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editingCategory.description || ''}
                                onChange={(e) => setEditingCategory(prev => ({ ...prev!, description: e.target.value }))}
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingCategory(null)}
                                  disabled={isSaving}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleUpdateCategory}
                                  disabled={isSaving || !editingCategory.name.trim()}
                                  className="gap-1"
                                >
                                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                  Save
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{renderColorCircle(category.color || '#6b7280')}</TableCell>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell>{category.description || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingCategory(category)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteCategory(category.id!)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}