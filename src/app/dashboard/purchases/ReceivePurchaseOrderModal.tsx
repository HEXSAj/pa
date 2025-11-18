// src/app/dashboard/purchases/ReceivePurchaseOrderModal.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { purchaseService } from '@/services/purchaseService';
import { PurchaseWithDetails, PurchaseItem, PaymentMethod } from '@/types/purchase';
import { useAuth } from '@/context/AuthContext';
import { 
  Package, 
  X, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Save,
  Calculator,
  Plus,
  Trash2
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from "@/components/ui/alert";
import { toast } from "sonner";

interface ReceivePurchaseOrderModalProps {
  purchase: PurchaseWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExpiryBatch {
  id: string;
  quantity: number;
  expiryDate: Date;
  costPrice: number;
  sellingPrice: number;
  freeItems?: number;
}

interface ReceivedItem extends PurchaseItem {
  batches: ExpiryBatch[];
  totalReceivedQuantity: number;
  actualCostPrice: number; // Average cost price
  actualSellingPrice: number; // Average selling price
}

export default function ReceivePurchaseOrderModal({ purchase, onClose, onSuccess }: ReceivePurchaseOrderModalProps) {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form data for receiving
  const [formData, setFormData] = useState({
    receivedDate: new Date().toISOString().split('T')[0],
    receivedNotes: '',
    paymentMethod: 'credit' as PaymentMethod,
    initialPayment: 0,
  });

  // Items with received details
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([]);

  // Initialize received items from purchase order
  useEffect(() => {
    const initialItems: ReceivedItem[] = purchase.items.map(item => ({
      ...item,
      batches: [{
        id: `batch-${item.itemId}-1`,
        quantity: item.quantity, // Default to ordered quantity
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
        costPrice: 0,
        sellingPrice: 0,
        freeItems: 0,
      }],
      totalReceivedQuantity: item.quantity,
      actualCostPrice: 0,
      actualSellingPrice: 0,
    }));
    setReceivedItems(initialItems);
  }, [purchase]);

  // Calculate totals
  const calculateTotals = () => {
    const totalCost = receivedItems.reduce((sum, item) => 
      sum + item.batches.reduce((itemSum, batch) => 
        itemSum + (batch.quantity * batch.costPrice), 0
      ), 0
    );
    const totalSelling = receivedItems.reduce((sum, item) => 
      sum + item.batches.reduce((itemSum, batch) => 
        itemSum + ((batch.quantity + (batch.freeItems || 0)) * batch.sellingPrice), 0
      ), 0
    );
    const totalFreeItems = receivedItems.reduce((sum, item) => 
      sum + item.batches.reduce((itemSum, batch) => 
        itemSum + (batch.freeItems || 0), 0
      ), 0
    );

    return {
      totalCost,
      totalSelling,
      totalFreeItems,
      totalItems: receivedItems.reduce((sum, item) => sum + item.totalReceivedQuantity, 0),
    };
  };

  const totals = calculateTotals();

  // Add new batch to an item
  const addBatchToItem = (itemId: string) => {
    setReceivedItems(prev => prev.map(item => {
      if (item.itemId === itemId) {
        const newBatchId = `batch-${itemId}-${Date.now()}`;
        const newBatch: ExpiryBatch = {
          id: newBatchId,
          quantity: 0,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          costPrice: 0,
          sellingPrice: 0,
          freeItems: 0,
        };
        return {
          ...item,
          batches: [...item.batches, newBatch]
        };
      }
      return item;
    }));
  };

  // Remove batch from an item
  const removeBatchFromItem = (itemId: string, batchId: string) => {
    setReceivedItems(prev => prev.map(item => {
      if (item.itemId === itemId) {
        const updatedBatches = item.batches.filter(batch => batch.id !== batchId);
        // Recalculate total quantity
        const totalQuantity = updatedBatches.reduce((sum, batch) => sum + batch.quantity, 0);
        return {
          ...item,
          batches: updatedBatches,
          totalReceivedQuantity: totalQuantity
        };
      }
      return item;
    }));
  };

  // Update batch details
  const updateBatch = (itemId: string, batchId: string, field: keyof ExpiryBatch, value: any) => {
    setReceivedItems(prev => prev.map(item => {
      if (item.itemId === itemId) {
        const updatedBatches = item.batches.map(batch => 
          batch.id === batchId ? { ...batch, [field]: value } : batch
        );
        // Recalculate total quantity
        const totalQuantity = updatedBatches.reduce((sum, batch) => sum + batch.quantity, 0);
        return {
          ...item,
          batches: updatedBatches,
          totalReceivedQuantity: totalQuantity
        };
      }
      return item;
    }));
  };

  // Validate form
  const validateForm = () => {
    for (const item of receivedItems) {
      if (item.batches.length === 0) {
        toast.error(`Please add at least one batch for ${item.item.name}`);
        return false;
      }
      
      for (const batch of item.batches) {
        if (batch.quantity <= 0) {
          toast.error(`Please enter a valid quantity for ${item.item.name} batch`);
          return false;
        }
        if (batch.costPrice <= 0) {
          toast.error(`Please enter a valid cost price for ${item.item.name} batch`);
          return false;
        }
        if (batch.sellingPrice <= 0) {
          toast.error(`Please enter a valid selling price for ${item.item.name} batch`);
          return false;
        }
      }
    }
    return true;
  };

  // Receive purchase order
  const handleReceive = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Convert received items to PurchaseItem format - create separate items for each batch
      const finalItems: PurchaseItem[] = [];
      
      receivedItems.forEach(item => {
        item.batches.forEach((batch, index) => {
          finalItems.push({
            itemId: item.itemId,
            batchNumber: `${item.batchNumber}-${index + 1}`, // Create unique batch numbers
            quantity: batch.quantity,
            totalQuantity: batch.quantity + (batch.freeItems || 0),
            expiryDate: batch.expiryDate,
            costPricePerUnit: batch.costPrice,
            sellingPricePerUnit: batch.sellingPrice,
            freeItemCount: batch.freeItems || 0,
          });
        });
      });

      // Use the new receivePurchaseOrder service method
      await purchaseService.receivePurchaseOrder(purchase.id!, {
        items: finalItems,
        totalAmount: totals.totalCost,
        receivedDate: new Date(formData.receivedDate),
        receivedByUid: user?.uid || '',
        receivedByName: user?.displayName || user?.email || 'Unknown',
        receivedNotes: formData.receivedNotes,
        paymentMethod: formData.paymentMethod,
        initialPayment: formData.initialPayment,
      });
      
      toast.success('Purchase order received successfully');
      onSuccess();
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      toast.error('Failed to receive purchase order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Receive Purchase Order
          </DialogTitle>
          <DialogDescription>
            Enter the actual received quantities, expiry dates, and pricing for each item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Purchase Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Purchase Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Supplier</Label>
                  <p className="text-sm text-gray-600">{purchase.supplier?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Order Date</Label>
                  <p className="text-sm text-gray-600">{purchase.purchaseDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Invoice Number</Label>
                  <p className="text-sm text-gray-600">{purchase.invoiceNumber || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created By</Label>
                  <p className="text-sm text-gray-600">{purchase.createdByName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receiving Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receivedDate">Received Date</Label>
              <Input
                id="receivedDate"
                type="date"
                value={formData.receivedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, receivedDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivedNotes">Receiving Notes</Label>
              <Input
                id="receivedNotes"
                value={formData.receivedNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, receivedNotes: e.target.value }))}
                placeholder="Any notes about the receiving process"
              />
            </div>
          </div>

          {/* Items to Receive */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Items to Receive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {receivedItems.map((item, index) => (
                  <div key={item.itemId} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{item.item.name}</h4>
                        <p className="text-sm text-gray-500">
                          Code: {item.item.code} | Ordered: {item.quantity} units | Total Received: {item.totalReceivedQuantity} units
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Item {index + 1} of {receivedItems.length}
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addBatchToItem(item.itemId)}
                          className="gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Batch
                        </Button>
                      </div>
                    </div>

                    {/* Batches for this item */}
                    <div className="space-y-3">
                      {item.batches.map((batch, batchIndex) => (
                        <div key={batch.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-sm">Batch {batchIndex + 1}</h5>
                            {item.batches.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBatchFromItem(item.itemId, batch.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {/* Quantity */}
                            <div className="space-y-1">
                              <Label htmlFor={`qty-${batch.id}`} className="text-xs">Quantity *</Label>
                              <Input
                                id={`qty-${batch.id}`}
                                type="number"
                                min="0"
                                value={batch.quantity}
                                onChange={(e) => updateBatch(item.itemId, batch.id, 'quantity', parseInt(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>

                            {/* Expiry Date */}
                            <div className="space-y-1">
                              <Label htmlFor={`expiry-${batch.id}`} className="text-xs">Expiry Date *</Label>
                              <Input
                                id={`expiry-${batch.id}`}
                                type="date"
                                value={batch.expiryDate.toISOString().split('T')[0]}
                                onChange={(e) => updateBatch(item.itemId, batch.id, 'expiryDate', new Date(e.target.value))}
                                className="text-sm"
                              />
                            </div>

                            {/* Cost Price */}
                            <div className="space-y-1">
                              <Label htmlFor={`cost-${batch.id}`} className="text-xs">Cost Price *</Label>
                              <Input
                                id={`cost-${batch.id}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={batch.costPrice}
                                onChange={(e) => updateBatch(item.itemId, batch.id, 'costPrice', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>

                            {/* Selling Price */}
                            <div className="space-y-1">
                              <Label htmlFor={`selling-${batch.id}`} className="text-xs">Selling Price *</Label>
                              <Input
                                id={`selling-${batch.id}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={batch.sellingPrice}
                                onChange={(e) => updateBatch(item.itemId, batch.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>

                            {/* Free Items */}
                            <div className="space-y-1">
                              <Label htmlFor={`free-${batch.id}`} className="text-xs">Free Items</Label>
                              <Input
                                id={`free-${batch.id}`}
                                type="number"
                                min="0"
                                value={batch.freeItems || 0}
                                onChange={(e) => updateBatch(item.itemId, batch.id, 'freeItems', parseInt(e.target.value) || 0)}
                                className="text-sm"
                                placeholder="0"
                              />
                            </div>
                          </div>

                          {/* Batch Total */}
                          <div className="bg-white p-2 rounded border text-xs">
                            <div className="flex justify-between">
                              <span>Batch Total Cost:</span>
                              <span className="font-medium">
                                Rs{(batch.quantity * batch.costPrice).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Batch Total Value:</span>
                              <span className="font-medium">
                                Rs{((batch.quantity + (batch.freeItems || 0)) * batch.sellingPrice).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Item Summary */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Item Total Cost:</span>
                        <span className="text-blue-600">
                          Rs{item.batches.reduce((sum, batch) => sum + (batch.quantity * batch.costPrice), 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Item Total Value:</span>
                        <span className="text-green-600">
                          Rs{item.batches.reduce((sum, batch) => sum + ((batch.quantity + (batch.freeItems || 0)) * batch.sellingPrice), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value: PaymentMethod) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="full_payment">Full Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialPayment">Initial Payment (Rs)</Label>
                  <Input
                    id="initialPayment"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.initialPayment}
                    onChange={(e) => setFormData(prev => ({ ...prev, initialPayment: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Receiving Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Items Received:</span>
                    <span className="font-medium">{totals.totalItems} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Free Items:</span>
                    <span className="font-medium">{totals.totalFreeItems} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span className="font-medium text-red-600">Rs{totals.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Selling Value:</span>
                    <span className="font-medium text-green-600">Rs{totals.totalSelling.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Initial Payment:</span>
                    <span className="font-medium">Rs{formData.initialPayment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Due:</span>
                    <span className="font-medium text-orange-600">
                      Rs{(totals.totalCost - formData.initialPayment).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <Badge variant={
                      formData.initialPayment >= totals.totalCost ? 'default' : 
                      formData.initialPayment > 0 ? 'secondary' : 'destructive'
                    }>
                      {formData.initialPayment >= totals.totalCost ? 'PAID' : 
                       formData.initialPayment > 0 ? 'PARTIAL' : 'UNPAID'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleReceive} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Receiving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Receive Purchase Order
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
