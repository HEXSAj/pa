// src/app/dashboard/inventory/EditInventoryModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { inventoryService } from '@/services/inventoryService';
import { medicineTypeService } from '@/services/medicineTypeService';
import { categoryService } from '@/services/categoryService';
import { purchaseService } from '@/services/purchaseService';
import { 
  InventoryItem, 
  MedicineTypeModel, 
  getMedicineTypeUnit,
  Category 
} from '@/types/inventory';
import { BatchWithDetails } from '@/types/purchase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, Info, TagIcon } from 'lucide-react';
import { toast } from "sonner";
import Link from 'next/link';

interface EditInventoryModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditInventoryModal({ item, onClose, onSuccess }: EditInventoryModalProps) {
  const [medicineTypes, setMedicineTypes] = useState<MedicineTypeModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingBatches, setExistingBatches] = useState<BatchWithDetails[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  
  // Initialize form data with provided item values
  const [formData, setFormData] = useState({
    code: item.code,
    name: item.name,
    genericName: item.genericName || item.name, // Default to name if generic name is missing
    type: item.type || '',
    categoryId: item.categoryId || '',
    categoryName: item.categoryName || '',
    hasUnitContains: !!item.unitContains,
    unitContains: item.unitContains || {
      value: 0,
      unit: ''
    },
    minQuantity: item.minQuantity,
    brand: item.brand || '',
    supplier: item.supplier || '',
    costPrice: item.costPrice?.toString() || '',
    sellingPrice: item.sellingPrice?.toString() || '',
    currentStock: item.currentStock?.toString() || ''
  });

  const [totalQuantity, setTotalQuantity] = useState('0');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingTypes(true);
        setLoadingCategories(true);
        setLoadingBatches(true);
        
        const [types, categoryData] = await Promise.all([
          medicineTypeService.getAll(),
          categoryService.getAll()
        ]);
        
        setMedicineTypes(types);
        setCategories(categoryData);
        
        // Load existing batches for this item
        if (item.id) {
          try {
            const batches = await purchaseService.getBatchesByItem(item.id);
            setExistingBatches(batches);
            
            // If there's a batch and currentStock matches, we can show it's editable
            // The batch will be updated when currentStock, costPrice, and sellingPrice are provided
          } catch (error) {
            console.error("Error loading batches:", error);
          }
        }
        
        // If the current type doesn't exist in our types list, handle that
        const typeExists = types.some(t => t.name === item.type);
        if (!typeExists && types.length > 0 && !item.type) {
          // Only set default if type is empty
          setFormData(prev => ({
            ...prev,
            type: types[0].name,
            unitContains: {
              ...prev.unitContains,
              unit: types[0].defaultUnit
            }
          }));
        }
        
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load form data");
      } finally {
        setLoadingTypes(false);
        setLoadingCategories(false);
        setLoadingBatches(false);
      }
    };
    
    loadData();
  }, [item.id, item.type, item.categoryId]);

  useEffect(() => {
    if (formData.hasUnitContains) {
      const total = formData.minQuantity * formData.unitContains.value;
      setTotalQuantity(`${total} ${formData.unitContains.unit}`);
    } else {
      setTotalQuantity(`${formData.minQuantity} units`);
    }
  }, [formData.minQuantity, formData.unitContains.value, formData.unitContains.unit, formData.hasUnitContains]);

  useEffect(() => {
    if (formData.type) {
      const unit = getMedicineTypeUnit(formData.type, medicineTypes);
      setFormData(prev => ({
        ...prev,
        unitContains: {
          ...prev.unitContains,
          unit: unit
        }
      }));
    }
  }, [formData.type, medicineTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item.id) {
      toast.error("Item ID is missing");
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error("Please fill in the medicine name");
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Make sure generic name is not empty
      const finalGenericName = formData.genericName.trim() || formData.name.trim();
      
      const submitData = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        genericName: finalGenericName,
        type: formData.type || undefined,
        categoryId: formData.categoryId || undefined,
        categoryName: formData.categoryName || undefined,
        hasUnitContains: formData.hasUnitContains,
        unitContains: formData.hasUnitContains ? formData.unitContains : undefined,
        minQuantity: formData.minQuantity,
        brand: formData.brand.trim() || undefined,
        supplier: formData.supplier.trim() || undefined,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : undefined,
        currentStock: formData.currentStock ? parseFloat(formData.currentStock) : undefined
      };
      
      // The inventoryService.update will handle batch creation/deletion if currentStock, costPrice, and sellingPrice are provided
      await inventoryService.update(item.id, submitData);
      toast.success("Item updated successfully");
      onSuccess();
    } catch (error: any) {
      console.error("Error updating item:", error);
      toast.error(error.message || "Failed to update item");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Item Code *</Label>
                    <Input
                      id="code"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Medicine Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter medicine name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genericName">Generic Name</Label>
                    <Input
                      id="genericName"
                      value={formData.genericName}
                      onChange={(e) => setFormData(prev => ({ ...prev, genericName: e.target.value }))}
                      placeholder="Enter generic name (defaults to medicine name)"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="type">Medicine Type</Label>
                      {medicineTypes.length === 0 && (
                        <Link 
                          href="/dashboard/inventory/types" 
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-3 w-3" />
                          Add Type
                        </Link>
                      )}
                    </div>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                      disabled={loadingTypes}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingTypes ? "Loading types..." : "Select medicine type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {medicineTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name} ({type.defaultUnit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {medicineTypes.length === 0 && !loadingTypes && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-md">
                        <Info className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-orange-700">
                          No medicine types found. Please add types in Settings.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="category">Category</Label>
                      {categories.length === 0 && (
                        <Link 
                          href="/dashboard/inventory/categories" 
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <TagIcon className="h-3 w-3" />
                          Add Category
                        </Link>
                      )}
                    </div>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => {
                        const selectedCategory = categories.find(c => c.id === value);
                        setFormData(prev => ({ 
                          ...prev, 
                          categoryId: value,
                          categoryName: selectedCategory?.name || ''
                        }));
                      }}
                      disabled={loadingCategories}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id!}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {categories.length === 0 && !loadingCategories && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-md">
                        <Info className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-orange-700">
                          No categories found. Please add categories in Settings.
                        </span>
                      </div>
                    )}
                  </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasUnitContains"
                    checked={formData.hasUnitContains}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ 
                        ...prev, 
                        hasUnitContains: checked as boolean 
                      }))
                    }
                  />
                  <Label htmlFor="hasUnitContains">Specify contents per unit</Label>
                </div>

                {formData.hasUnitContains && (
                  <div className="space-y-2">
                    <Label htmlFor="unitContains">
                      Contains per Unit * ({formData.unitContains.unit})
                    </Label>
                    <Input
                      id="unitContains"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.unitContains.value}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        unitContains: {
                          ...prev.unitContains,
                          value: parseFloat(e.target.value)
                        }
                      }))}
                    />
                  </div>
                )}

                  <div className="space-y-2">
                    <Label htmlFor="minQuantity">Minimum Stock Level (Units/Bottles) *</Label>
                    <Input
                      id="minQuantity"
                      type="number"
                      required
                      min="0"
                      value={formData.minQuantity}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        minQuantity: parseInt(e.target.value) 
                      }))}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Total minimum quantity: {totalQuantity}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Enter brand name (optional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Enter supplier name (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="costPrice">Cost Price</Label>
                      <Input
                        id="costPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.costPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sellingPrice">Selling Price</Label>
                      <Input
                        id="sellingPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentStock">Current Stock</Label>
                    <Input
                      id="currentStock"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.currentStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                      placeholder="Enter current stock quantity (optional)"
                    />
                    {existingBatches.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {existingBatches.length} batch(es) exist. Updating stock will replace existing batches.
                      </p>
                    )}
                    {formData.currentStock && formData.costPrice && formData.sellingPrice && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        A batch will be created/updated with this stock and prices.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t bg-background sticky bottom-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}