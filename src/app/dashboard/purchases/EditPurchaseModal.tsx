// src/app/dashboard/purchases/EditPurchaseModal.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { purchaseService } from '@/services/purchaseService';
import { supplierService } from '@/services/supplierService';
import { inventoryService } from '@/services/inventoryService';
import { Supplier } from '@/types/supplier';
import { InventoryItem } from '@/types/inventory';
import { PurchaseItem, PurchaseWithDetails } from '@/types/purchase';
import { Plus, X, Loader2, Search, ChevronDown, Check, Edit, Save, Gift } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Import the PurchaseItemForm component
import { PurchaseItemForm } from './PurchaseItemForm';

interface EditPurchaseModalProps {
  purchase: PurchaseWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPurchaseModal({ purchase, onClose, onSuccess }: EditPurchaseModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UI state for dropdowns
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  
  // Track which item is being edited
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  // For filtering suppliers and inventory
  const [supplierFilter, setSupplierFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');

  // Convert the purchase object to a form-friendly format
  const [formData, setFormData] = useState({
    supplierId: purchase.supplierId,
    supplierName: purchase.supplier?.name || '',
    items: purchase.items.map(item => ({
      itemId: item.itemId,
      batchNumber: item.batchNumber,
      quantity: item.quantity,
      unitsPerPack: item.unitsPerPack,
      totalQuantity: item.totalQuantity,
      expiryDate: item.expiryDate.toISOString().split('T')[0],
      costPricePerUnit: item.costPricePerUnit,  
      sellingPricePerUnit: item.sellingPricePerUnit,
      freeItemCount: item.freeItemCount || 0, // Add free item count
      itemName: item.item.name
    })),
    totalAmount: purchase.totalAmount,
    purchaseDate: purchase.purchaseDate.toISOString().split('T')[0],
    invoiceNumber: purchase.invoiceNumber || '',
    notes: purchase.notes || '',
  });

  const [currentItem, setCurrentItem] = useState({
    itemId: '',
    itemName: '',
  });

  // Filtered lists
  const filteredSuppliers = useMemo(() => {
    if (!supplierFilter.trim()) return suppliers;
    const lowerFilter = supplierFilter.toLowerCase();
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(lowerFilter) || 
      (supplier.phone && supplier.phone.toLowerCase().includes(lowerFilter))
    );
  }, [suppliers, supplierFilter]);
  
  const filteredInventory = useMemo(() => {
    if (!itemFilter.trim()) return inventory;
    const lowerFilter = itemFilter.toLowerCase();
    return inventory.filter(item => 
      item.name.toLowerCase().includes(lowerFilter) || 
      (item.code && item.code.toLowerCase().includes(lowerFilter))
    );
  }, [inventory, itemFilter]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [suppliersData, inventoryData] = await Promise.all([
          supplierService.getActive(),
          inventoryService.getAll()
        ]);
        setSuppliers(suppliersData);
        setInventory(inventoryData);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Reset filters when dropdown closes
  useEffect(() => {
    if (!supplierOpen) {
      setSupplierFilter('');
    }
  }, [supplierOpen]);

  useEffect(() => {
    if (!itemOpen) {
      setItemFilter('');
    }
  }, [itemOpen]);

  // Recalculate total amount when items change
  useEffect(() => {
    const total = formData.items.reduce(
      (sum, item) => sum + (item.costPricePerUnit * item.quantity), 
      0
    );
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.items]);

  const handleAddItem = async (item: Partial<PurchaseItem>) => {
    if (!currentItem.itemId) {
      toast.error('Please select an item first');
      return;
    }
    
    const selectedItem = inventory.find(i => i.id === currentItem.itemId);
    if (!selectedItem) return;
    
    // Find the next batch number or a unique one
    let batchNumber;
    const existingBatchWithSameItem = formData.items.find(
      item => item.itemId === currentItem.itemId
    );
    
    if (existingBatchWithSameItem) {
      // Find the next available batch number for this item
      const existingBatchNumbers = formData.items
        .filter(item => item.itemId === currentItem.itemId)
        .map(item => parseInt(item.batchNumber));
      
      const maxBatchNumber = Math.max(...existingBatchNumbers, 0);
      batchNumber = (maxBatchNumber + 1).toString().padStart(3, '0');
    } else {
      batchNumber = await purchaseService.getNextBatchNumber(currentItem.itemId);
    }

    const unitsPerPack = selectedItem.unitContains?.value;
    
    // Calculate total quantity including free items
    const freeItemCount = item.freeItemCount || 0;
    const purchasedQuantity = item.quantity || 0;
    const totalQuantity = unitsPerPack 
      ? (purchasedQuantity * unitsPerPack) + freeItemCount
      : purchasedQuantity + freeItemCount;

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        itemId: currentItem.itemId,
        itemName: currentItem.itemName,
        batchNumber,
        quantity: purchasedQuantity,
        unitsPerPack,
        totalQuantity,
        expiryDate: item.expiryDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        costPricePerUnit: item.costPricePerUnit || 0,
        sellingPricePerUnit: item.sellingPricePerUnit || 0,
        freeItemCount: freeItemCount
      }]
    }));

    setCurrentItem({
      itemId: '',
      itemName: '',
    });
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Function to start editing an item
  const startEditItem = (index: number) => {
    setEditingItemIndex(index);
  };

  // Function to update a specific item property
  const updateItemProperty = (index: number, property: string, value: any) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      
      // Special handling for quantity and free items
      if (property === 'quantity' || property === 'freeItemCount') {
        const item = updatedItems[index];
        
        // Parse as numbers
        const newValue = Number(value);
        item[property] = newValue;
        
        // Recalculate totalQuantity
        if (item.unitsPerPack) {
          item.totalQuantity = (item.quantity * item.unitsPerPack) + (item.freeItemCount || 0);
        } else {
          item.totalQuantity = item.quantity + (item.freeItemCount || 0);
        }
      } 
      else {
        // For regular properties
        updatedItems[index] = {
          ...updatedItems[index],
          [property]: value
        };
      }
      
      return {
        ...prev,
        items: updatedItems
      };
    });
  };

  // Function to save edited item
  const saveItemChanges = () => {
    setEditingItemIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.supplierId) {
      toast.error('Please select a supplier');
      return;
    }

    if (!formData.purchaseDate) {
      toast.error('Please select a purchase date');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Make sure no item is still being edited
    if (editingItemIndex !== null) {
      toast.error('Please save your changes to the item being edited first');
      return;
    }

    // Check if there are actually any changes
    const hasChanges = 
      formData.invoiceNumber !== (purchase.invoiceNumber || '') ||
      formData.notes !== (purchase.notes || '') ||
      formData.purchaseDate !== purchase.purchaseDate.toISOString().split('T')[0] ||
      formData.supplierId !== purchase.supplierId ||
      formData.totalAmount !== purchase.totalAmount ||
      formData.items.length !== purchase.items.length;

    if (!hasChanges) {
      // Check if any items have changed
      const itemsChanged = formData.items.some((item, index) => {
        if (index >= purchase.items.length) return true; // New item
        
        const originalItem = purchase.items[index];
        return !originalItem ||
          item.itemId !== originalItem.itemId ||
          item.quantity !== originalItem.quantity ||
          item.costPricePerUnit !== originalItem.costPricePerUnit ||
          item.sellingPricePerUnit !== originalItem.sellingPricePerUnit ||
          (item.freeItemCount || 0) !== (originalItem.freeItemCount || 0) ||
          new Date(item.expiryDate).toDateString() !== originalItem.expiryDate.toDateString();
      });

      if (!itemsChanged) {
        toast.info('No changes detected');
        onClose();
        return;
      }
    }

    setSaving(true);
    try {
      // Convert expiryDate strings to Date objects
      const items = formData.items.map(item => ({
        ...item,
        expiryDate: new Date(item.expiryDate)
      }));
      
      const updateData = {
        ...formData,
        items,
        purchaseDate: new Date(formData.purchaseDate)
      };
      
      await purchaseService.update(purchase.id!, updateData);
      toast.success('Purchase updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating purchase:', error);
      toast.error('Error updating purchase. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Loading Purchase Data</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Edit Purchase</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 px-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full justify-between"
                    >
                      {formData.supplierId
                        ? formData.supplierName
                        : "Select supplier..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <div className="rounded-md border">
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Search supplier..."
                          value={supplierFilter}
                          onChange={(e) => setSupplierFilter(e.target.value)}
                        />
                      </div>
                      <div className="max-h-64 overflow-auto p-1">
                        {filteredSuppliers.length === 0 ? (
                          <div className="py-6 text-center text-sm">No supplier found.</div>
                        ) : (
                          filteredSuppliers.map((supplier) => (
                            <div
                              key={supplier.id}
                              className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${
                                formData.supplierId === supplier.id ? "bg-accent" : ""
                              }`}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  supplierId: supplier.id!,
                                  supplierName: supplier.name
                                });
                                setSupplierOpen(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{supplier.name}</span>
                                <span className="text-xs text-muted-foreground">{supplier.phone}</span>
                              </div>
                              <Check
                                className={`ml-auto h-4 w-4 ${formData.supplierId === supplier.id ? "opacity-100" : "opacity-0"}`}
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    invoiceNumber: e.target.value 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Purchase Date *</Label>
                <Input
                  type="date"
                  required
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    purchaseDate: e.target.value 
                  }))}
                />
              </div>
            </div>

            <Card>
              <CardContent className="pt-4">
                <h3 className="font-medium mb-4">Current Items</h3>
                <div className="rounded-md border mb-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Batch #</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Free Items</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Cost/Unit</TableHead>
                        <TableHead>Selling/Unit</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, index) => {
                        const isEditing = editingItemIndex === index;
                        const inventoryItem = inventory.find(i => i.id === item.itemId);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.itemName || inventoryItem?.name}
                            </TableCell>
                            <TableCell>
                              {item.batchNumber}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItemProperty(index, 'quantity', parseInt(e.target.value))}
                                  className="w-20"
                                />
                              ) : (
                                <div>
                                  {item.quantity}
                                  {item.unitsPerPack && (
                                    <div className="text-xs text-muted-foreground">
                                      {item.quantity * item.unitsPerPack} {inventoryItem?.unitContains?.unit}
                                    </div>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.freeItemCount || 0}
                                  onChange={(e) => updateItemProperty(index, 'freeItemCount', parseInt(e.target.value))}
                                  className="w-20"
                                />
                              ) : (
                                <div>
                                  {item.freeItemCount || 0}
                                  {item.freeItemCount > 0 && (
                                    <Badge variant="outline" className="ml-1 flex items-center bg-purple-50 text-purple-600 border-purple-200">
                                      <Gift className="h-3 w-3 mr-1" />
                                      Free
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="date"
                                  value={item.expiryDate}
                                  onChange={(e) => updateItemProperty(index, 'expiryDate', e.target.value)}
                                />
                              ) : (
                                new Date(item.expiryDate).toLocaleDateString()
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={item.costPricePerUnit}
                                  onChange={(e) => updateItemProperty(index, 'costPricePerUnit', parseFloat(e.target.value))}
                                  className="w-24"
                                />
                              ) : (
                                `Rs${item.costPricePerUnit.toFixed(2)}`
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={item.sellingPricePerUnit}
                                  onChange={(e) => updateItemProperty(index, 'sellingPricePerUnit', parseFloat(e.target.value))}
                                  className="w-24"
                                />
                              ) : (
                                `Rs${item.sellingPricePerUnit.toFixed(2)}`
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={saveItemChanges}
                                  className="w-20"
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditItem(index)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <h3 className="font-medium mb-4">Add New Item</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Select Item</Label>
                    <Popover open={itemOpen} onOpenChange={setItemOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          type="button"
                          className="w-full justify-between"
                        >
                          {currentItem.itemId
                            ? currentItem.itemName
                            : "Select item..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <div className="rounded-md border">
                          <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Search by name or code..."
                              value={itemFilter}
                              onChange={(e) => setItemFilter(e.target.value)}
                            />
                          </div>
                          <div className="max-h-64 overflow-auto p-1">
                            {filteredInventory.length === 0 ? (
                              <div className="py-6 text-center text-sm">No item found.</div>
                            ) : (
                              filteredInventory.map((item) => (
                                <div
                                  key={item.id}
                                  className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${
                                    currentItem.itemId === item.id ? "bg-accent" : ""
                                  }`}
                                  onClick={() => {
                                    setCurrentItem({
                                      itemId: item.id!,
                                      itemName: item.name
                                    });
                                    setItemOpen(false);
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span>{item.name}</span>
                                    <span className="text-xs text-muted-foreground">Code: {item.code} | Type: {item.type}</span>
                                  </div>
                                  <Check
                                    className={`ml-auto h-4 w-4 ${currentItem.itemId === item.id ? "opacity-100" : "opacity-0"}`}
                                  />
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {currentItem.itemId && (
                    <PurchaseItemForm
                      item={inventory.find(i => i.id === currentItem.itemId) || null}
                      batchNumber=""
                      onAddItem={handleAddItem}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                placeholder="Any additional notes..."
                className="h-20"
              />
            </div>

            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.totalAmount}
                readOnly
                className="bg-gray-50 font-medium text-lg"
              />
              <div className="text-sm text-muted-foreground">
                Total amount is calculated based on the items (free items not included in cost)
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formData.items.length === 0 || saving || editingItemIndex !== null}
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}