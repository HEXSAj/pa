// src/app/dashboard/purchases/CreatePurchaseOrderModal.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { purchaseService } from '@/services/purchaseService';
import { supplierService } from '@/services/supplierService';
import { inventoryService } from '@/services/inventoryService';
import { Supplier } from '@/types/supplier';
import { InventoryItem } from '@/types/inventory';
import { PurchaseItem } from '@/types/purchase';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, 
  X, 
  Loader2, 
  Search, 
  Package,
  Save,
  AlertCircle
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

interface CreatePurchaseOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  itemCode: string;
  quantity: number;
}

export default function CreatePurchaseOrderModal({ onClose, onSuccess }: CreatePurchaseOrderModalProps) {
  const { user, userRole } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // UI state for dropdowns
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  
  // For filtering suppliers and inventory
  const [supplierFilter, setSupplierFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');

  // Form data - simplified for purchase orders
  const [formData, setFormData] = useState({
    supplierId: '',
    items: [] as PurchaseOrderItem[],
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    notes: '',
  });

  const [currentItem, setCurrentItem] = useState<{
    itemId: string;
    itemName: string;
    itemCode: string;
  }>({
    itemId: '',
    itemName: '',
    itemCode: '',
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

  // Load suppliers and inventory data
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

  // Add item to purchase order
  const addItem = () => {
    if (!currentItem.itemId || !currentItem.itemName) {
      toast.error('Please select an item');
      return;
    }

    // Check if item already exists
    const existingItemIndex = formData.items.findIndex(item => item.itemId === currentItem.itemId);
    
    if (existingItemIndex >= 0) {
      toast.error('Item already added to purchase order');
      return;
    }

    const newItem: PurchaseOrderItem = {
      itemId: currentItem.itemId,
      itemName: currentItem.itemName,
      itemCode: currentItem.itemCode,
      quantity: 1, // Default quantity
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Reset current item
    setCurrentItem({
      itemId: '',
      itemName: '',
      itemCode: '',
    });
    setItemFilter('');
    setItemOpen(false);
  };

  // Remove item from purchase order
  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.itemId !== itemId)
    }));
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.itemId === itemId ? { ...item, quantity } : item
      )
    }));
  };

  // Create purchase order
  const handleSubmit = async () => {
    if (!formData.supplierId) {
      toast.error('Please select a supplier');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setSaving(true);
    try {
      // Convert to PurchaseItem format for the service
      const purchaseItems: PurchaseItem[] = formData.items.map(item => ({
        itemId: item.itemId,
        batchNumber: 'TBD', // Will be set when received
        quantity: item.quantity,
        totalQuantity: item.quantity,
        expiryDate: new Date(), // Placeholder, will be set when received
        costPricePerUnit: 0, // Will be set when received
        sellingPricePerUnit: 0, // Will be set when received
      }));

      const purchaseOrder = {
        supplierId: formData.supplierId,
        items: purchaseItems,
        totalAmount: 0, // Will be calculated when received
        purchaseDate: new Date(formData.purchaseDate),
        invoiceNumber: formData.invoiceNumber || undefined,
        notes: formData.notes || undefined,
        status: 'pending' as const,
        paymentMethod: 'credit' as const,
        paymentStatus: 'unpaid' as const,
        // Creator information
        createdByUid: user?.uid || '',
        createdByName: user?.displayName || user?.email || 'Unknown',
        createdByEmail: user?.email || '',
        createdByRole: userRole || 'cashier',
      };

      await purchaseService.savePending(purchaseOrder);
      
      toast.success('Purchase order created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error('Failed to create purchase order');
    } finally {
      setSaving(false);
    }
  };

  const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Create Purchase Order
            </DialogTitle>
            <DialogDescription>
              Loading purchase order form...
            </DialogDescription>
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create Purchase Order
          </DialogTitle>
          <DialogDescription>
            Create a purchase order with items and quantities. Actual pricing and expiry dates will be entered when the order is received.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Supplier Selection */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier *</Label>
            <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={supplierOpen}
                  className="w-full justify-between"
                >
                  {selectedSupplier ? selectedSupplier.name : "Select supplier..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <div className="p-2">
                  <Input
                    placeholder="Search suppliers..."
                    value={supplierFilter}
                    onChange={(e) => setSupplierFilter(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <div className="max-h-60 overflow-auto">
                  {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, supplierId: supplier.id }));
                        setSupplierOpen(false);
                        setSupplierFilter('');
                      }}
                    >
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.phone && (
                          <div className="text-sm text-gray-500">{supplier.phone}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Purchase Date and Invoice Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number (Optional)</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="Enter invoice number"
              />
            </div>
          </div>

          {/* Add Items Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Item Selection */}
              <div className="space-y-2">
                <Label>Select Item</Label>
                <div className="flex gap-2">
                  <Popover open={itemOpen} onOpenChange={setItemOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={itemOpen}
                        className="flex-1 justify-between"
                      >
                        {currentItem.itemName || "Select item..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <div className="p-2">
                        <Input
                          placeholder="Search items..."
                          value={itemFilter}
                          onChange={(e) => setItemFilter(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      <div className="max-h-60 overflow-auto">
                        {filteredInventory.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setCurrentItem({
                                itemId: item.id!,
                                itemName: item.name,
                                itemCode: item.code,
                              });
                              setItemOpen(false);
                              setItemFilter('');
                            }}
                          >
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-500">
                                Code: {item.code} | Type: {item.type}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button onClick={addItem} disabled={!currentItem.itemId}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Items List */}
              {formData.items.length > 0 && (
                <div className="space-y-2">
                  <Label>Items in Purchase Order</Label>
                  <div className="space-y-2">
                    {formData.items.map((item) => (
                      <div key={item.itemId} className="flex items-center gap-2 p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.itemName}</div>
                          <div className="text-sm text-gray-500">Code: {item.itemCode}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`qty-${item.itemId}`} className="text-sm">Qty:</Label>
                          <Input
                            id={`qty-${item.itemId}`}
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.itemId, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.itemId)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          {/* Summary */}
          {formData.items.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Purchase Order Summary</AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <p><strong>Supplier:</strong> {selectedSupplier?.name}</p>
                  <p><strong>Items:</strong> {formData.items.length} items</p>
                  <p><strong>Total Quantity:</strong> {formData.items.reduce((sum, item) => sum + item.quantity, 0)} units</p>
                  <p className="text-sm text-gray-600 mt-2">
                    This purchase order will be saved as pending. You can receive it later to add actual quantities, 
                    expiry dates, and pricing information.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !formData.supplierId || formData.items.length === 0}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Purchase Order
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
