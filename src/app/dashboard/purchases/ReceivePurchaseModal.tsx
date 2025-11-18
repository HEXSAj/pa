// src/app/dashboard/purchases/ReceivePurchaseModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { purchaseService } from '@/services/purchaseService';
import { inventoryService } from '@/services/inventoryService';
import { InventoryItem } from '@/types/inventory';
import { PurchaseItem, PurchaseWithDetails } from '@/types/purchase';
import { useAuth } from '@/context/AuthContext';
import { 
  Check, 
  X, 
  Loader2, 
  Package, 
  AlertTriangle, 
  Edit, 
  Save,
  Truck,
  ClipboardCheck,
  MinusCircle,
  PlusCircle,
  Gift
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from "@/components/ui/alert";
import { toast } from "sonner";

interface ReceivePurchaseModalProps {
  purchase: PurchaseWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReceivePurchaseModal({ 
  purchase, 
  onClose, 
  onSuccess 
}: ReceivePurchaseModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  // Track items and edits
  const [receivedItems, setReceivedItems] = useState<PurchaseItem[]>([]);
  const [itemsChanged, setItemsChanged] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  // Notes for receipt
  const [receivedNotes, setReceivedNotes] = useState('');
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load inventory for item details
        const inventoryData = await inventoryService.getAll();
        setInventory(inventoryData);
        
        // Initialize with purchase items
        setReceivedItems(purchase.items.map(item => ({
          ...item,
          // Ensure we create new objects so we don't modify the original
          expiryDate: new Date(item.expiryDate)
        })));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [purchase]);

  // Update an item property
  const updateItemProperty = (index: number, property: string, value: any) => {
    setReceivedItems(prev => {
      const updatedItems = [...prev];
      
      // Special handling for quantity and free items
      if (property === 'quantity' || property === 'freeItemCount') {
        const item = {...updatedItems[index]};
        
        // Parse as numbers
        const newValue = Number(value);
        item[property] = newValue;
        
        // Recalculate totalQuantity
        if (item.unitsPerPack) {
          item.totalQuantity = (item.quantity * item.unitsPerPack) + (item.freeItemCount || 0);
        } else {
          item.totalQuantity = item.quantity + (item.freeItemCount || 0);
        }
        
        updatedItems[index] = item;
      } 
      else {
        // For regular properties
        updatedItems[index] = {
          ...updatedItems[index],
          [property]: value
        };
      }
      
      return updatedItems;
    });
    
    // Mark that items were changed
    setItemsChanged(true);
  };

  // Remove an item
  const removeItem = (index: number) => {
    setReceivedItems(prev => prev.filter((_, i) => i !== index));
    setItemsChanged(true);
  };

  // Start editing an item
  const startEditItem = (index: number) => {
    setEditingItemIndex(index);
  };

  // Save edited item
  const saveItemChanges = () => {
    setEditingItemIndex(null);
  };

  // Calculate total cost based on current items
  const calculateTotalCost = () => {
    return receivedItems.reduce(
      (sum, item) => sum + (item.costPricePerUnit * item.quantity), 
      0
    );
  };
  
  // Check if quantities match the original order
  const hasQuantityChanges = () => {
    if (receivedItems.length !== purchase.items.length) return true;
    
    return receivedItems.some((item, index) => {
      const originalItem = purchase.items[index];
      return item.quantity !== originalItem.quantity || 
             (item.freeItemCount || 0) !== (originalItem.freeItemCount || 0);
    });
  };

  // Handle confirming receipt
  const handleConfirmReceipt = async () => {
    try {
      setSaving(true);
      
      const wasAdjusted = itemsChanged || hasQuantityChanges();
      
      await purchaseService.confirmReceipt(purchase.id!, {
        items: receivedItems,
        receivedNotes,
        receivedByUid: user?.uid || '',
        receivedByName: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Unknown User'),
        wasAdjusted,
        originalItems: wasAdjusted ? purchase.items : undefined
      });
      
      toast.success('Purchase received successfully and added to inventory');
      onSuccess();
    } catch (error) {
      console.error('Error confirming receipt:', error);
      toast.error('Error confirming receipt. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
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
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-500" />
            Receive Purchase Order
          </DialogTitle>
          <DialogDescription>
            Verify received items against the original order and adjust quantities if needed
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-6">
            {/* Purchase Order Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Purchase Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Supplier</Label>
                    <p className="font-medium">{purchase.supplier?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Order Date</Label>
                    <p className="font-medium">{purchase.purchaseDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Invoice</Label>
                    <p className="font-medium">{purchase.invoiceNumber || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items to Receive */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-base">Items to Receive</span>
                  {itemsChanged && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Adjusted
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md border m-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Batch #</TableHead>
                        <TableHead className="text-center">Ordered Qty</TableHead>
                        <TableHead className="text-center">Received Qty</TableHead>
                        <TableHead className="text-center">Free Items</TableHead>
                        <TableHead className="text-right">Cost/Unit</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receivedItems.map((item, index) => {
                        const inventoryItem = inventory.find(i => i.id === item.itemId);
                        const originalItem = purchase.items.find(i => i.itemId === item.itemId && i.batchNumber === item.batchNumber);
                        const isEditing = editingItemIndex === index;
                        
                        // Calculate if quantity changed
                        const qtyChanged = originalItem && (
                          item.quantity !== originalItem.quantity || 
                          (item.freeItemCount || 0) !== (originalItem.freeItemCount || 0)
                        );
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{inventoryItem?.name}</p>
                                <p className="text-sm text-muted-foreground">Code: {inventoryItem?.code}</p>
                              </div>
                            </TableCell>
                            <TableCell>{item.batchNumber}</TableCell>
                            <TableCell className="text-center">
                              {originalItem ? (
                                <div>
                                  <span>{originalItem.quantity}</span>
                                  {originalItem.unitsPerPack && (
                                    <p className="text-xs text-muted-foreground">
                                      ({originalItem.quantity * originalItem.unitsPerPack} {inventoryItem?.unitContains?.unit})
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  New Item
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.quantity}
                                  onChange={(e) => updateItemProperty(index, 'quantity', parseInt(e.target.value) || 0)}
                                  className="w-20 mx-auto"
                                />
                              ) : (
                                <div className={qtyChanged ? "font-bold text-amber-600" : ""}>
                                  <span>{item.quantity}</span>
                                  {item.unitsPerPack && (
                                    <p className="text-xs text-muted-foreground">
                                      ({item.quantity * item.unitsPerPack} {inventoryItem?.unitContains?.unit})
                                    </p>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.freeItemCount || 0}
                                  onChange={(e) => updateItemProperty(index, 'freeItemCount', parseInt(e.target.value) || 0)}
                                  className="w-20 mx-auto"
                                />
                              ) : (
                                <div>
                                  {item.freeItemCount && item.freeItemCount > 0 ? (
                                    <div className={`flex items-center justify-center ${qtyChanged ? "text-amber-600 font-bold" : ""}`}>
                                      <span>{item.freeItemCount}</span>
                                      <Badge variant="outline" className="ml-1 flex items-center bg-purple-50 text-purple-600 border-purple-200">
                                        <Gift className="h-3 w-3 mr-1" />
                                        Free
                                      </Badge>
                                    </div>
                                  ) : (
                                    '0'
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={item.costPricePerUnit}
                                  onChange={(e) => updateItemProperty(index, 'costPricePerUnit', parseFloat(e.target.value) || 0)}
                                  className="w-24 ml-auto"
                                />
                              ) : (
                                `Rs${item.costPricePerUnit.toFixed(2)}`
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              Rs{(item.quantity * item.costPricePerUnit).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center space-x-1">
                                {isEditing ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={saveItemChanges}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditItem(index)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeItem(index)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                >
                                  <MinusCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={6}>Total</TableCell>
                        <TableCell className="text-right">
                          Rs{calculateTotalCost().toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {itemsChanged || hasQuantityChanges() ? (
                    <span className="flex items-center text-amber-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Items have been adjusted from the original order
                    </span>
                  ) : (
                    <span className="flex items-center text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      Items match the original order
                    </span>
                  )}
                </div>
              </CardFooter>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Receipt Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add notes about receipt (e.g., missing items, damaged goods, etc.)"
                  value={receivedNotes}
                  onChange={(e) => setReceivedNotes(e.target.value)}
                  className="h-20"
                />
              </CardContent>
            </Card>

            {/* Warning about adjustments */}
            {(itemsChanged || hasQuantityChanges()) && (
              <Alert variant="warning" className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Adjustments Detected</AlertTitle>
                <AlertDescription className="text-amber-700">
                  You've adjusted items or quantities from the original order. 
                  These changes will be recorded and the purchase total will be recalculated.
                </AlertDescription>
              </Alert>
            )}
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
            type="button"
            onClick={handleConfirmReceipt}
            disabled={saving || editingItemIndex !== null || receivedItems.length === 0}
            className="min-w-[180px] gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ClipboardCheck className="h-4 w-4" />
                Confirm Receipt
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}