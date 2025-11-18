// src/app/dashboard/returns/AddReturnModal.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { returnService } from '@/services/returnService';
import { inventoryService } from '@/services/inventoryService';
import { purchaseService } from '@/services/purchaseService';
import { InventoryItem } from '@/types/inventory';
import { ReturnItem } from '@/types/return';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, 
  X, 
  Loader2, 
  Search, 
  ChevronDown, 
  Check, 
  Calendar,
  Package,
  User
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AddReturnModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddReturnModal({ onClose, onSuccess }: AddReturnModalProps) {
  const { user, userRole } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // UI state for dropdowns
  const [itemOpen, setItemOpen] = useState(false);
  
  // For filtering inventory
  const [itemFilter, setItemFilter] = useState('');

  const [formData, setFormData] = useState({
    items: [] as ReturnItem[],
    returnDate: new Date().toISOString().split('T')[0],
    patientDetails: '',
    notes: '',
  });

  const [currentItem, setCurrentItem] = useState<{
    itemId: string;
    itemName: string;
  }>({
    itemId: '',
    itemName: '',
  });

  const [currentItemForm, setCurrentItemForm] = useState({
    quantity: 1,
    expiryDate: new Date().toISOString().split('T')[0],
    costPricePerUnit: 0,
    sellingPricePerUnit: 0,
  });

  // Load inventory data
  useEffect(() => {
    const loadData = async () => {
      try {
        const inventoryData = await inventoryService.getAll();
        setInventory(inventoryData);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    
    const filter = itemFilter.toLowerCase().trim();
    if (!filter) return inventory;
    
    return inventory.filter(item => 
      item.name.toLowerCase().includes(filter) ||
      item.code.toLowerCase().includes(filter) ||
      (item.genericName && item.genericName.toLowerCase().includes(filter)) ||
      item.type.toLowerCase().includes(filter)
    );
  }, [inventory, itemFilter]);

  // Reset filters when dropdown closes
  useEffect(() => {
    if (!itemOpen) {
      setItemFilter('');
    }
  }, [itemOpen]);

  // When item is selected, load pricing from latest batch
  useEffect(() => {
    const loadLatestBatchPricing = async () => {
      if (!currentItem.itemId) return;
      
      try {
        // Get all batches for this item
        const batches = await purchaseService.getBatchesByItem(currentItem.itemId);
        
        if (batches && batches.length > 0) {
          // Sort batches by createdAt (newest first) to get the latest batch
          const sortedBatches = [...batches].sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
            return dateB - dateA; // Newest first
          });
          
          const latestBatch = sortedBatches[0];
          
          // Get cost price and selling price from latest batch
          const costPrice = latestBatch.costPrice || 0;
          const sellingPrice = latestBatch.unitPrice || 0;
          
          setCurrentItemForm(prev => ({
            ...prev,
            costPricePerUnit: costPrice,
            sellingPricePerUnit: sellingPrice,
          }));
        } else {
          // No batches found, try to get from inventory item
          const selectedItem = inventory.find(i => i.id === currentItem.itemId);
          if (selectedItem) {
            setCurrentItemForm(prev => ({
              ...prev,
              costPricePerUnit: selectedItem.costPrice || 0,
              sellingPricePerUnit: selectedItem.sellingPrice || 0,
            }));
          }
        }
      } catch (error) {
        console.error('Error loading batch pricing:', error);
        // Fallback to inventory item pricing
        const selectedItem = inventory.find(i => i.id === currentItem.itemId);
        if (selectedItem) {
          setCurrentItemForm(prev => ({
            ...prev,
            costPricePerUnit: selectedItem.costPrice || 0,
            sellingPricePerUnit: selectedItem.sellingPrice || 0,
          }));
        }
      }
    };
    
    loadLatestBatchPricing();
  }, [currentItem.itemId, inventory]);

  const handleAddItem = async () => {
    if (!currentItem.itemId) {
      toast.error('Please select an item first');
      return;
    }
    
    const selectedItem = inventory.find(i => i.id === currentItem.itemId);
    if (!selectedItem) return;
    
    if (currentItemForm.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (!currentItemForm.expiryDate) {
      toast.error('Please select an expiry date');
      return;
    }

    if (currentItemForm.costPricePerUnit <= 0 || currentItemForm.sellingPricePerUnit <= 0) {
      toast.error('Please enter valid prices');
      return;
    }

    if (currentItemForm.sellingPricePerUnit < currentItemForm.costPricePerUnit) {
      toast.error('Selling price cannot be lower than cost price');
      return;
    }
    
    // Get batch number
    const batchNumber = await returnService.getNextBatchNumber(currentItem.itemId);
    
    // Calculate total quantity
    const totalQuantity = selectedItem.unitContains
      ? currentItemForm.quantity * selectedItem.unitContains.value
      : currentItemForm.quantity;
    
    // Create return item
    const returnItem: ReturnItem = {
      itemId: currentItem.itemId,
      batchNumber,
      quantity: currentItemForm.quantity,
      unitsPerPack: selectedItem.unitContains?.value,
      totalQuantity,
      expiryDate: new Date(currentItemForm.expiryDate),
      costPricePerUnit: currentItemForm.costPricePerUnit,
      sellingPricePerUnit: currentItemForm.sellingPricePerUnit,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, returnItem]
    }));

    // Reset the current item and form
    setCurrentItem({
      itemId: '',
      itemName: '',
    });
    setCurrentItemForm({
      quantity: 1,
      expiryDate: new Date().toISOString().split('T')[0],
      costPricePerUnit: 0,
      sellingPricePerUnit: 0,
    });
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (!formData.returnDate) {
      toast.error('Please select a return date');
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        items: formData.items,
        returnDate: new Date(formData.returnDate),
        patientDetails: formData.patientDetails.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        createdByUid: user?.uid,
        createdByName: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Unknown User'),
        createdByEmail: user?.email,
        createdByRole: userRole,
      };
      
      await returnService.create(submitData);
      toast.success(`Return created successfully! ${formData.items.length} item(s) added to inventory with new batches.`);
      onSuccess();
    } catch (error) {
      console.error('Error creating return:', error);
      toast.error('Error creating return. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Loading Data</DialogTitle>
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
          <DialogTitle>Add New Return</DialogTitle>
          <DialogDescription>
            Add returned items back to inventory with a new batch
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 px-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Return Date *</Label>
                <Input
                  type="date"
                  required
                  value={formData.returnDate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    returnDate: e.target.value 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Patient Details</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={formData.patientDetails}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      patientDetails: e.target.value 
                    }))}
                    placeholder="Enter patient name, contact, etc..."
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="pt-4">
                <h3 className="font-medium mb-4">Add Returned Items</h3>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Item *</Label>
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
                                placeholder="Search by name, generic name, or code..."
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
                                      <span className="font-medium">{item.name}</span>
                                      {item.genericName && item.genericName !== item.name && (
                                        <span className="text-xs text-blue-600">
                                          Generic: {item.genericName}
                                        </span>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        Code: {item.code} | Type: {item.type}
                                      </span>
                                    </div>
                                    <Check
                                      className={`ml-auto h-4 w-4 ${currentItem.itemId === item.id ? 
                                        "opacity-100" : "opacity-0"
                                      }`}
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
                      <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Return Quantity *</Label>
                            <Input
                              type="number"
                              min="1"
                              required
                              value={currentItemForm.quantity}
                              onChange={(e) => setCurrentItemForm(prev => ({
                                ...prev,
                                quantity: parseInt(e.target.value) || 1
                              }))}
                            />
                            {inventory.find(i => i.id === currentItem.itemId)?.unitContains && (
                              <p className="text-xs text-muted-foreground">
                                Units per pack: {inventory.find(i => i.id === currentItem.itemId)?.unitContains?.value}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Expiry Date *</Label>
                            <Input
                              type="date"
                              required
                              value={currentItemForm.expiryDate}
                              onChange={(e) => setCurrentItemForm(prev => ({
                                ...prev,
                                expiryDate: e.target.value
                              }))}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Cost Price per Unit *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              value={currentItemForm.costPricePerUnit}
                              onChange={(e) => setCurrentItemForm(prev => ({
                                ...prev,
                                costPricePerUnit: parseFloat(e.target.value) || 0
                              }))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Selling Price per Unit *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              value={currentItemForm.sellingPricePerUnit}
                              onChange={(e) => {
                                const newPrice = parseFloat(e.target.value) || 0;
                                setCurrentItemForm(prev => ({
                                  ...prev,
                                  sellingPricePerUnit: newPrice
                                }));
                              }}
                            />
                            {currentItemForm.sellingPricePerUnit < currentItemForm.costPricePerUnit && (
                              <p className="text-xs text-red-500">
                                Selling price cannot be lower than cost price
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={handleAddItem}
                          className="w-full gap-2"
                          disabled={
                            currentItemForm.quantity <= 0 ||
                            !currentItemForm.expiryDate ||
                            currentItemForm.costPricePerUnit <= 0 ||
                            currentItemForm.sellingPricePerUnit <= 0 ||
                            currentItemForm.sellingPricePerUnit < currentItemForm.costPricePerUnit
                          }
                        >
                          <Plus className="h-4 w-4" />
                          Add Item
                        </Button>
                      </div>
                    )}

                    {/* Added Items List */}
                    {formData.items.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Added Items</h4>
                        <div className="space-y-2">
                          {formData.items.map((item, index) => {
                            const inventoryItem = inventory.find(i => i.id === item.itemId);
                            return (
                              <div 
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                              >
                                <div>
                                  <div className="font-medium">{inventoryItem?.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Batch: {item.batchNumber} | Qty: {item.quantity} 
                                    {item.unitsPerPack 
                                      ? ` (Total: ${item.quantity * item.unitsPerPack} ${inventoryItem?.unitContains?.unit})` 
                                      : ' units'}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Cost: Rs{item.costPricePerUnit}/unit | Selling: Rs{item.sellingPricePerUnit}/unit
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Expires: {item.expiryDate instanceof Date ? item.expiryDate.toLocaleDateString() : new Date(item.expiryDate).toLocaleDateString()}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
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

            <Card>
              <CardContent className="pt-4">
                <h3 className="font-medium mb-4">Return Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span className="font-medium">{formData.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity:</span>
                    <span className="font-medium">
                      {formData.items.reduce((sum, item) => sum + item.totalQuantity, 0)} units
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Items will be added to inventory with new batch numbers
                </span>
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
              disabled={formData.items.length === 0 || saving}
              className="gap-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-1" />
                  Create Return
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

