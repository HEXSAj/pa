// // src/app/dashboard/inventory/categories/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { categoryService } from '@/services/categoryService';
// import { Category } from '@/types/inventory';
// import DashboardLayout from '@/components/DashboardLayout';
// import { Plus, Loader2, Pencil, Trash2, Save, ArrowLeft, X, TagIcon } from 'lucide-react';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import Link from 'next/link';
// import { toast } from "sonner";
// import withAuth from '@/components/withAuth'; // Import the withAuth HOC for authentication
// import { useAuth } from '@/context/AuthContext'; // Import useAuth hook

// function CategoriesPage() {
//   const { userRole } = useAuth(); // Get the user's role
//   const isAdmin = userRole === 'admin'; // Check if user is admin
  
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [editingCategory, setEditingCategory] = useState<Category | null>(null);
//   const [isAddingNew, setIsAddingNew] = useState(false);
//   const [newCategory, setNewCategory] = useState({
//     name: '',
//     description: '',
//     color: '#6b7280'
//   });
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     loadCategories();
//   }, []);

//   const loadCategories = async () => {
//     try {
//       setLoading(true);
//       const data = await categoryService.getAll();
//       setCategories(data);
//     } catch (error) {
//       console.error("Error loading categories:", error);
//       toast.error("Failed to load categories");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAddCategory = async () => {
//     if (!newCategory.name.trim()) {
//       toast.error("Category name is required");
//       return;
//     }

//     try {
//       setSaving(true);
//       await categoryService.create(newCategory);
//       setNewCategory({
//         name: '',
//         description: '',
//         color: '#6b7280'
//       });
//       setIsAddingNew(false);
//       await loadCategories();
//       toast.success("Category added successfully");
//     } catch (error) {
//       console.error("Error adding category:", error);
//       toast.error("Failed to add category");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleUpdateCategory = async () => {
//     if (!editingCategory || !editingCategory.name.trim()) {
//       toast.error("Category name is required");
//       return;
//     }

//     try {
//       setSaving(true);
//       await categoryService.update(editingCategory.id!, {
//         name: editingCategory.name,
//         description: editingCategory.description,
//         color: editingCategory.color
//       });
//       setEditingCategory(null);
//       await loadCategories();
//       toast.success("Category updated successfully");
//     } catch (error) {
//       console.error("Error updating category:", error);
//       toast.error("Failed to update category");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const confirmDeleteCategory = (category: Category) => {
//     setCategoryToDelete(category);
//     setDeleteDialogOpen(true);
//   };

//   const handleDeleteCategory = async () => {
//     if (!categoryToDelete) return;

//     try {
//       setSaving(true);
//       await categoryService.delete(categoryToDelete.id!);
//       setDeleteDialogOpen(false);
//       setCategoryToDelete(null);
//       await loadCategories();
//       toast.success("Category deleted successfully");
//     } catch (error) {
//       console.error("Error deleting category:", error);
//       toast.error("Failed to delete category. Make sure it's not used by any inventory items.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const cancelAddOrEdit = () => {
//     if (isAddingNew) {
//       setIsAddingNew(false);
//       setNewCategory({
//         name: '',
//         description: '',
//         color: '#6b7280'
//       });
//     } else if (editingCategory) {
//       setEditingCategory(null);
//     }
//   };

//   return (
//     <DashboardLayout>
//       <div className="space-y-4 p-6">
//         <div className="flex justify-between items-center">
//           <div className="flex items-center gap-3">
//             <Link href="/dashboard/inventory">
//               <Button variant="ghost" size="sm" className="gap-1">
//                 <ArrowLeft className="h-4 w-4" />
//                 Back to Inventory
//               </Button>
//             </Link>
//             <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            
//             {/* User role badge */}
//             <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 capitalize">
//               {userRole || 'User'} Access
//             </Badge>
//           </div>

//           {isAdmin && (
//             <Button
//               onClick={() => setIsAddingNew(true)}
//               className="gap-2"
//               disabled={isAddingNew}
//             >
//               <Plus className="h-4 w-4" />
//               Add Category
//             </Button>
//           )}
//         </div>

//         <Card>
//           <CardHeader className="pb-3">
//             <div className="flex items-center justify-between">
//               <CardTitle className="flex items-center gap-2">
//                 <TagIcon className="h-5 w-5" />
//                 Manage Categories
//               </CardTitle>
//             </div>
//           </CardHeader>
//           <CardContent>
//             {!isAdmin && (
//               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-3">
//                 <div className="text-yellow-600">
//                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7.5"/><polyline points="12 19 12 12 19 12"/><line x1="18" x2="21" y1="9" y2="12"/><line x1="18" x2="21" y1="15" y2="12"/></svg>
//                 </div>
//                 <p className="text-sm text-yellow-700">
//                   You are in view-only mode. Only administrators can add, edit, or delete categories.
//                 </p>
//               </div>
//             )}

//             {/* Add new category form */}
//             {isAddingNew && (
//               <Card className="mb-6 border-blue-200 bg-blue-50">
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg">Add New Category</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="grid gap-4">
//                     <div className="space-y-2">
//                       <label className="text-sm font-medium">Name *</label>
//                       <Input
//                         value={newCategory.name}
//                         onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
//                         placeholder="Enter category name"
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <label className="text-sm font-medium">Description</label>
//                       <Textarea
//                         value={newCategory.description}
//                         onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
//                         placeholder="Enter category description (optional)"
//                         rows={3}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <label className="text-sm font-medium">Color</label>
//                       <div className="flex items-center gap-3">
//                         <Input
//                           type="color"
//                           value={newCategory.color}
//                           onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
//                           className="w-16 h-9 p-1"
//                         />
//                         <div className="flex-1 text-sm text-muted-foreground">
//                           This color will be used to identify the category in the inventory list.
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex justify-end gap-2 mt-2">
//                       <Button
//                         variant="outline"
//                         onClick={cancelAddOrEdit}
//                         disabled={saving}
//                       >
//                         Cancel
//                       </Button>
//                       <Button
//                         onClick={handleAddCategory}
//                         disabled={!newCategory.name.trim() || saving}
//                         className="gap-1"
//                       >
//                         {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
//                         Save Category
//                       </Button>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             )}

//             {loading ? (
//               <div className="flex justify-center items-center py-12">
//                 <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
//               </div>
//             ) : (
//               <div className="rounded-md border">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead className="w-12">Color</TableHead>
//                       <TableHead>Name</TableHead>
//                       <TableHead>Description</TableHead>
//                       <TableHead className="text-right">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {categories.length === 0 ? (
//                       <TableRow>
//                         <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
//                           No categories found. Add your first category to get started.
//                         </TableCell>
//                       </TableRow>
//                     ) : (
//                       categories.map((category) => (
//                         <TableRow key={category.id}>
//                           {editingCategory?.id === category.id ? (
//                             <>
//                               <TableCell>
//                                 <Input
//                                   type="color"
//                                   value={editingCategory.color || '#6b7280'}
//                                   onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
//                                   className="w-12 h-8 p-1"
//                                 />
//                               </TableCell>
//                               <TableCell>
//                                 <Input
//                                   value={editingCategory.name}
//                                   onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
//                                 />
//                               </TableCell>
//                               <TableCell>
//                                 <Textarea
//                                   value={editingCategory.description || ''}
//                                   onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
//                                   rows={2}
//                                 />
//                               </TableCell>
//                               <TableCell className="text-right">
//                                 <div className="flex justify-end space-x-2">
//                                   <Button
//                                     variant="ghost"
//                                     size="sm"
//                                     onClick={cancelAddOrEdit}
//                                     disabled={saving}
//                                   >
//                                     <X className="h-4 w-4" />
//                                   </Button>
//                                   <Button
//                                     size="sm"
//                                     onClick={handleUpdateCategory}
//                                     disabled={!editingCategory.name.trim() || saving}
//                                     className="gap-1"
//                                   >
//                                     {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
//                                     Save
//                                   </Button>
//                                 </div>
//                               </TableCell>
//                             </>
//                           ) : (
//                             <>
//                               <TableCell>
//                                 <div
//                                   className="w-6 h-6 rounded-full"
//                                   style={{ backgroundColor: category.color || '#6b7280' }}
//                                 ></div>
//                               </TableCell>
//                               <TableCell className="font-medium">{category.name}</TableCell>
//                               <TableCell className="max-w-md">
//                                 {category.description || <span className="text-muted-foreground text-sm italic">No description</span>}
//                               </TableCell>
//                               <TableCell className="text-right">
//                                 <div className="flex justify-end space-x-2">
//                                   {isAdmin && (
//                                     <>
//                                       <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         onClick={() => setEditingCategory(category)}
//                                         disabled={!!editingCategory}
//                                       >
//                                         <Pencil className="h-4 w-4" />
//                                       </Button>
//                                       <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         onClick={() => confirmDeleteCategory(category)}
//                                         className="text-red-600 hover:text-red-800 hover:bg-red-50"
//                                       >
//                                         <Trash2 className="h-4 w-4" />
//                                       </Button>
//                                     </>
//                                   )}
//                                   {!isAdmin && (
//                                     <span className="text-sm text-muted-foreground italic px-2">
//                                       View only
//                                     </span>
//                                   )}
//                                 </div>
//                               </TableCell>
//                             </>
//                           )}
//                         </TableRow>
//                       ))
//                     )}
//                   </TableBody>
//                 </Table>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Delete confirmation dialog */}
//       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Are you sure?</AlertDialogTitle>
//             <AlertDialogDescription>
//               This will permanently delete the category &quot;{categoryToDelete?.name}&quot;. 
//               This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleDeleteCategory}
//               disabled={saving}
//               className="bg-red-600 hover:bg-red-700 text-white"
//             >
//               {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
//               Delete
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </DashboardLayout>
//   );
// }

// export default withAuth(CategoriesPage); // Wrap with auth HOC for authentication


// src/app/dashboard/inventory/categories/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/inventory';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  Loader2, 
  Pencil, 
  Trash2, 
  Save, 
  ArrowLeft, 
  X, 
  TagIcon,
  Upload,
  Download
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import Link from 'next/link';
import { toast } from "sonner";
import withAuth from '@/components/withAuth'; // Import the withAuth HOC for authentication
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook
import CategoryImporter from '../CategoryImport'; // Import our new component

function CategoriesPage() {
  const { userRole } = useAuth(); // Get the user's role
  const canManageCategories = userRole === 'admin' || userRole === 'doctor'; // Check if user can manage categories
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#6b7280'
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

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
      setSaving(true);
      await categoryService.create(newCategory);
      setNewCategory({
        name: '',
        description: '',
        color: '#6b7280'
      });
      setIsAddingNew(false);
      await loadCategories();
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSaving(true);
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
      setSaving(false);
    }
  };

  const confirmDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setSaving(true);
      await categoryService.delete(categoryToDelete.id!);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      await loadCategories();
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category. Make sure it's not used by any inventory items.");
    } finally {
      setSaving(false);
    }
  };

  const cancelAddOrEdit = () => {
    if (isAddingNew) {
      setIsAddingNew(false);
      setNewCategory({
        name: '',
        description: '',
        color: '#6b7280'
      });
    } else if (editingCategory) {
      setEditingCategory(null);
    }
  };

  const handleImportComplete = () => {
    setShowImporter(false);
    loadCategories();
    toast.success("Categories imported successfully");
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/inventory">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Inventory
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            
            {/* User role badge */}
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 capitalize">
              {userRole || 'User'} Access
            </Badge>
          </div>

          {canManageCategories && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowImporter(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import from Excel
              </Button>
              <Button
                onClick={() => setIsAddingNew(true)}
                className="gap-2"
                disabled={isAddingNew}
              >
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TagIcon className="h-5 w-5" />
                Manage Categories
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!canManageCategories && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-3">
                <div className="text-yellow-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7.5"/><polyline points="12 19 12 12 19 12"/><line x1="18" x2="21" y1="9" y2="12"/><line x1="18" x2="21" y1="15" y2="12"/></svg>
                </div>
                <p className="text-sm text-yellow-700">
                  You are in view-only mode. Only administrators and doctors can add, edit, or delete categories.
                </p>
              </div>
            )}

            {/* Add new category form */}
            {isAddingNew && canManageCategories && (
              <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Add New Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name *</label>
                      <Input
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="Enter category name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        placeholder="Enter category description (optional)"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Color</label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={newCategory.color}
                          onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                          className="w-16 h-9 p-1"
                        />
                        <div className="flex-1 text-sm text-muted-foreground">
                          This color will be used to identify the category in the inventory list.
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="outline"
                        onClick={cancelAddOrEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddCategory}
                        disabled={!newCategory.name.trim() || saving}
                        className="gap-1"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Category
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Color</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          No categories found. Add your first category to get started.
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
                                  onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                                  className="w-12 h-8 p-1"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editingCategory.name}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                />
                              </TableCell>
                              <TableCell>
                                <Textarea
                                  value={editingCategory.description || ''}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                                  rows={2}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelAddOrEdit}
                                    disabled={saving}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleUpdateCategory}
                                    disabled={!editingCategory.name.trim() || saving}
                                    className="gap-1"
                                  >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>
                                <div
                                  className="w-6 h-6 rounded-full"
                                  style={{ backgroundColor: category.color || '#6b7280' }}
                                ></div>
                              </TableCell>
                              <TableCell className="font-medium">{category.name}</TableCell>
                              <TableCell className="max-w-md">
                                {category.description || <span className="text-muted-foreground text-sm italic">No description</span>}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  {canManageCategories && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingCategory(category)}
                                        disabled={!!editingCategory}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => confirmDeleteCategory(category)}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  {!canManageCategories && (
                                    <span className="text-sm text-muted-foreground italic px-2">
                                      View only
                                    </span>
                                  )}
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Import Categories Modal */}
      {showImporter && (
        <CategoryImporter
          onClose={() => setShowImporter(false)}
          onImportComplete={handleImportComplete}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category &quot;{categoryToDelete?.name}&quot;. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

export default withAuth(CategoriesPage); // Wrap with auth HOC for authentication