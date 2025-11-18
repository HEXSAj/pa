// src/app/dashboard/viewSales/SaleEditDialog.tsx
import React, { useState, useEffect, useMemo } from 'react';
// import { Sale, SaleItem } from '@/types/sale';
import { InventoryItem } from '@/types/inventory';
import { BatchWithDetails } from '@/types/purchase';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { inventoryService } from '@/services/inventoryService';
import { purchaseService } from '@/services/purchaseService';
// import { saleService } from '@/services/saleService';
import { Loader2, Plus, Trash2, RotateCcw, Save, X, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";

interface SaleEditDialogProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
  onSaleUpdated: () => void;
}

export function SaleEditDialog({ sale, isOpen, onClose, onSaleUpdated }: SaleEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [editedItems, setEditedItems] = useState<SaleItem[]>([]);
  const [itemToAdd, setItemToAdd] = useState<InventoryItem | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<BatchWithDetails | null>(null);
  const [availableBatches, setAvailableBatches] = useState<BatchWithDetails[]>([]);
  const [unitQuantity, setUnitQuantity] = useState(0);
  const [subUnitQuantity, setSubUnitQuantity] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<number | null>(null);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // Load initial data - Split into smaller chunks to prevent browser freezing
  useEffect(() => {
    if (isOpen) {
      const initialLoad = async () => {
        setLoading(true);
        try {
          // Start by just setting edited items from the sale
          setEditedItems(JSON.parse(JSON.stringify(sale.items))); // Deep clone to avoid reference issues
          
          // Load inventory items in a separate operation
          setTimeout(async () => {
            try {
              const items = await inventoryService.getAll();
              setInventoryItems(items);
            } catch (error) {
              console.error('Error loading inventory items:', error);
              toast.error('Failed to load inventory items');
            } finally {
              setLoading(false);
            }
          }, 100);
        } catch (error) {
          console.error('Error in initial load:', error);
          toast.error('Failed to prepare sale for editing');
          setLoading(false);
        }
      };
      
      initialLoad();
      
      // Reset other states
      setItemToAdd(null);
      setSelectedBatch(null);
      setAvailableBatches([]);
      setUnitQuantity(0);
      setSubUnitQuantity(0);
    }
  }, [isOpen, sale]);

  // When selecting an item to add - Use debounce to prevent UI freezing
  const handleSelectItem = async (itemId: string) => {
    const item = inventoryItems.find(item => item.id === itemId);
    if (item) {
      setItemToAdd(item);
      setUnitQuantity(0);
      setSubUnitQuantity(0);
      setAvailableBatches([]);
      setSelectedBatch(null);
      
      // Load batches with a slight delay to prevent freezing
      setBatchesLoading(true);
      setTimeout(async () => {
        try {
          const batches = await purchaseService.getBatchesByItem(itemId);
          // Only show batches with available quantity
          const availableBatches = batches.filter(batch => batch.quantity > 0);
          setAvailableBatches(availableBatches);
          // Auto-select the first batch if available
          if (availableBatches.length > 0) {
            setSelectedBatch(availableBatches[0]);
          }
        } catch (error) {
          console.error('Error loading batches:', error);
          toast.error('Failed to load available batches');
        } finally {
          setBatchesLoading(false);
        }
      }, 100);
    }
  };

  // Function to update the quantity of an existing item
  const handleUpdateQuantity = (index: number, field: 'unitQuantity' | 'subUnitQuantity', value: number) => {
    const updatedItems = [...editedItems];
    const item = updatedItems[index];
    
    // Update the quantity
    item[field] = value;
    
    // Recalculate total price
    const unitTotal = item.unitQuantity * item.unitPrice;
    const subUnitTotal = item.subUnitQuantity * item.subUnitPrice;
    item.totalPrice = unitTotal + subUnitTotal;
    
    // Recalculate total cost
    let totalUnits = item.unitQuantity;
    if (item.item.hasUnitContains && item.item.unitContains) {
      totalUnits += item.subUnitQuantity / item.item.unitContains.value;
    }
    item.totalCost = (item.batch.costPrice || 0) * totalUnits;
    
    // Update the state
    setEditedItems(updatedItems);
  };

  // Function to confirm removing an item
  const handleConfirmRemoveItem = (index: number) => {
    setItemToRemove(index);
    setShowConfirmDialog(true);
  };

  // Function to remove an item
  const handleRemoveItem = () => {
    if (itemToRemove === null) return;
    
    const updatedItems = [...editedItems];
    updatedItems.splice(itemToRemove, 1);
    setEditedItems(updatedItems);
    
    setShowConfirmDialog(false);
    setItemToRemove(null);
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalAmount = editedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalCost = editedItems.reduce((sum, item) => sum + item.totalCost, 0);
    return { totalAmount, totalCost };
  };

  // Function to save the edited sale
  const handleSaveSale = async () => {
    if (editedItems.length === 0) {
      toast.error('Sale must have at least one item');
      return;
    }
    
    // Confirm if the user wants to save changes
    if (!window.confirm('Are you sure you want to save these changes? This will update inventory quantities.')) {
      return;
    }
    
    setSaving(true);
    try {
      // Implement the save logic here
      // This will involve:
      // 1. Calculating returned items (original sale vs current)
      // 2. Calculating new items to deduct from inventory
      // 3. Updating the sale record with new totals and items
      // 4. Updating batch quantities
      
      // First identify items that were removed or had quantities reduced
      const originalItems = [...sale.items];
      const itemsToReturn: { item: SaleItem, returnQuantity: number, returnSubQuantity: number }[] = [];
      
      originalItems.forEach(originalItem => {
        const matchingEditedItem = editedItems.find(item => 
          item.itemId === originalItem.itemId && item.batchId === originalItem.batchId
        );
        
        if (!matchingEditedItem) {
          // Item was completely removed
          itemsToReturn.push({
            item: originalItem,
            returnQuantity: originalItem.unitQuantity,
            returnSubQuantity: originalItem.subUnitQuantity
          });
        } else if (
          matchingEditedItem.unitQuantity < originalItem.unitQuantity ||
          matchingEditedItem.subUnitQuantity < originalItem.subUnitQuantity
        ) {
          // Item quantity was reduced
          itemsToReturn.push({
            item: originalItem,
            returnQuantity: Math.max(0, originalItem.unitQuantity - matchingEditedItem.unitQuantity),
            returnSubQuantity: Math.max(0, originalItem.subUnitQuantity - matchingEditedItem.subUnitQuantity)
          });
        }
      });
      
      // Identify items that were added or had quantities increased
      const itemsToDeduct: { item: SaleItem, deductQuantity: number, deductSubQuantity: number }[] = [];
      
      editedItems.forEach(editedItem => {
        const matchingOriginalItem = originalItems.find(item => 
          item.itemId === editedItem.itemId && item.batchId === editedItem.batchId
        );
        
        if (!matchingOriginalItem) {
          // Item was added
          itemsToDeduct.push({
            item: editedItem,
            deductQuantity: editedItem.unitQuantity,
            deductSubQuantity: editedItem.subUnitQuantity
          });
        } else if (
          editedItem.unitQuantity > matchingOriginalItem.unitQuantity ||
          editedItem.subUnitQuantity > matchingOriginalItem.subUnitQuantity
        ) {
          // Item quantity was increased
          itemsToDeduct.push({
            item: editedItem,
            deductQuantity: Math.max(0, editedItem.unitQuantity - matchingOriginalItem.unitQuantity),
            deductSubQuantity: Math.max(0, editedItem.subUnitQuantity - matchingOriginalItem.subUnitQuantity)
          });
        }
      });
      
      // Calculate the new totals
      const { totalAmount, totalCost } = calculateTotals();
      
      // Create the updated sale object
      const updatedSale = {
        ...sale,
        items: editedItems,
        totalAmount,
        totalCost
      };
      
      // Make API calls to update the sale and adjust inventory
      await saleService.updateSale(sale.id!, updatedSale, itemsToReturn, itemsToDeduct);
      
      toast.success('Sale updated successfully');
      onSaleUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving sale:', error);
      toast.error('Failed to update sale');
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals for display
  const { totalAmount, totalCost } = calculateTotals();
  const profit = totalAmount - totalCost;
  const profitMargin = totalAmount > 0 ? (profit / totalAmount) * 100 : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading sale data...</span>
      </div>
    );
  }

  return (
    <>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Sale #{sale.id?.slice(-6)}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-4">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                {(sale.customerInfo?.name || sale.customer?.name) ? (
                  <div>
                    <p className="font-medium">{sale.customerInfo?.name || sale.customer?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.customerInfo?.mobile || sale.customer?.mobile}
                    </p>
                    {(sale.customerInfo?.address || sale.customer?.address) && (
                      <p className="text-sm text-muted-foreground">
                        {sale.customerInfo?.address || sale.customer?.address}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Walk-in Customer</p>
                )}
              </CardContent>
            </Card>

            {/* Current Items */}
            <Card>
              <CardHeader>
                <CardTitle>Sale Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editedItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.item.code}
                              </p>
                              {item.isNew && (
                                <Badge className="mt-1" variant="outline">Newly Added</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              Batch #{item.batch.batchNumber}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.unitQuantity}
                                  onChange={(e) => handleUpdateQuantity(index, 'unitQuantity', parseInt(e.target.value) || 0)}
                                  className="w-20"
                                />
                                <span>units</span>
                              </div>
                              
                              {item.item.hasUnitContains && item.item.unitContains && (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={item.subUnitQuantity}
                                    onChange={(e) => handleUpdateQuantity(index, 'subUnitQuantity', parseInt(e.target.value) || 0)}
                                    className="w-20"
                                  />
                                  <span>{item.item.unitContains.unit}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            Rs{item.totalPrice.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleConfirmRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Add New Item */}
            <Card>
              <CardHeader>
                <CardTitle>Add Item</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Select Product</Label>
                      <Select
                        value={itemToAdd?.id}
                        onValueChange={handleSelectItem}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map(item => (
                            <SelectItem key={item.id} value={item.id!}>
                              {item.name} ({item.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {itemToAdd && (
                      <div className="space-y-2">
                        <Label>Select Batch</Label>
                        <Select
                          value={selectedBatch?.id}
                          onValueChange={(batchId) => {
                            const batch = availableBatches.find(b => b.id === batchId);
                            setSelectedBatch(batch || null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableBatches.map(batch => (
                              <SelectItem key={batch.id} value={batch.id!}>
                                Batch #{batch.batchNumber} - {batch.quantity} available
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {selectedBatch && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Units</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max={selectedBatch.quantity}
                              value={unitQuantity}
                              onChange={(e) => setUnitQuantity(parseInt(e.target.value) || 0)}
                            />
                            <span>units</span>
                          </div>
                        </div>

                        {itemToAdd.hasUnitContains && itemToAdd.unitContains && (
                          <div className="space-y-2">
                            <Label>{itemToAdd.unitContains.unit}</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={subUnitQuantity}
                                onChange={(e) => setSubUnitQuantity(parseInt(e.target.value) || 0)}
                              />
                              <span>{itemToAdd.unitContains.unit}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddItem}
                          disabled={!selectedBatch || (unitQuantity === 0 && subUnitQuantity === 0)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Updated Sale Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-medium">Rs{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Cost</span>
                    <span className="font-medium">Rs{totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Profit</span>
                    <span className="font-bold text-green-600">
                      Rs{profit.toFixed(2)} ({profitMargin.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center text-yellow-600">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">Saving will update inventory quantities</span>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSaveSale} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog for Removing Items */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from the sale? 
              This action can be reversed later by adding the item again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveItem}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}