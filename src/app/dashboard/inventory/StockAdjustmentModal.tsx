// src/app/dashboard/inventory/StockAdjustmentModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { inventoryService } from '@/services/inventoryService';
import { purchaseService } from '@/services/purchaseService';
import { stockAdjustmentService } from '@/services/stockAdjustmentService';
import { InventoryItem } from '@/types/inventory';
import { BatchWithDetails } from '@/types/purchase';
import { AdjustmentType, AdjustmentReason } from '@/types/stockAdjustment';
import { useAuth } from '@/context/AuthContext';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Plus, Minus, Calendar, Package } from 'lucide-react';
import { toast } from "sonner";

interface StockAdjustmentModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}

interface BatchOption {
  id: string;
  batchNumber: string;
  currentQuantity: number;
  expiryDate: Date;
  costPrice: number;
  unitPrice: number;
  supplierId?: string;
}

export default function StockAdjustmentModal({ item, onClose, onSuccess }: StockAdjustmentModalProps) {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  
  const [formData, setFormData] = useState({
    selectedBatchId: '',
    adjustmentType: 'increase' as AdjustmentType,
    quantity: '',
    reason: 'correction' as AdjustmentReason,
    notes: '',
    expiryDate: '',
    costPrice: '',
    unitPrice: ''
  });
  
  useEffect(() => {
    loadBatches();
  }, [item.id]);
  
  const loadBatches = async () => {
    try {
      setLoading(true);
      if (item.id) {
        const batchesData = await purchaseService.getBatchesByItem(item.id);
        
        // Filter out batches with 0 quantity and map to our interface
        const availableBatches: BatchOption[] = batchesData
          .filter(batch => batch.quantity > 0)
          .map(batch => ({
            id: batch.id!,
            batchNumber: batch.batchNumber,
            currentQuantity: batch.quantity,
            expiryDate: batch.expiryDate,
            costPrice: batch.costPrice || 0,
            unitPrice: batch.unitPrice || 0,
            supplierId: batch.supplierId
          }));
        
        setBatches(availableBatches);
        
        // Auto-select first batch if available
        if (availableBatches.length > 0) {
          setFormData(prev => ({
            ...prev,
            selectedBatchId: availableBatches[0].id
          }));
        }
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      toast.error('Failed to load batch information');
    } finally {
      setLoading(false);
    }
  };
  
  const selectedBatch = batches.find(b => b.id === formData.selectedBatchId);
  
  const calculateNewQuantity = (): number => {
    const adjustmentQty = parseInt(formData.quantity) || 0;
    
    if (formData.selectedBatchId && selectedBatch) {
      // Existing batch adjustment
      if (formData.adjustmentType === 'increase') {
        return selectedBatch.currentQuantity + adjustmentQty;
      } else {
        return Math.max(0, selectedBatch.currentQuantity - adjustmentQty);
      }
    } else {
      // New batch creation (only for increase)
      return formData.adjustmentType === 'increase' ? adjustmentQty : 0;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    
    const adjustmentQty = parseInt(formData.quantity);
    if (!adjustmentQty || adjustmentQty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    // Validate decrease doesn't exceed current quantity
    if (formData.adjustmentType === 'decrease' && selectedBatch && adjustmentQty > selectedBatch.currentQuantity) {
      toast.error(`Cannot decrease more than current quantity (${selectedBatch.currentQuantity})`);
      return;
    }
    
    // Validate new batch creation requirements
    if (!formData.selectedBatchId && formData.adjustmentType === 'increase') {
      if (!formData.expiryDate) {
        toast.error('Expiry date is required for new batch');
        return;
      }
      if (!formData.costPrice || !formData.unitPrice) {
        toast.error('Cost price and unit price are required for new batch');
        return;
      }
    }
    
    try {
      setSaving(true);
      
      const adjustmentData = {
        itemId: item.id!,
        itemName: item.name,
        itemCode: item.code,
        batchId: formData.selectedBatchId || undefined,
        batchNumber: selectedBatch?.batchNumber || undefined,
        adjustmentType: formData.adjustmentType,
        quantity: adjustmentQty,
        reason: formData.reason,
        notes: formData.notes || undefined,
        
        // Before and after quantities
        previousQuantity: selectedBatch?.currentQuantity || 0,
        newQuantity: calculateNewQuantity(),
        
        // Batch details (for new batch or reference)
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : selectedBatch?.expiryDate,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : selectedBatch?.costPrice,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : selectedBatch?.unitPrice,
        supplierId: selectedBatch?.supplierId,
        
        // User information
        adjustedByUid: user.uid,
        adjustedByName: user.displayName || user.email || 'Unknown',
        adjustedByEmail: user.email,
        adjustedByRole: user.role || 'user',
        
        // Timestamp
        adjustmentDate: new Date()
      };
      
      await stockAdjustmentService.createAdjustment(adjustmentData);
      
      toast.success(`Stock adjustment completed successfully`);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating stock adjustment:', error);
      toast.error(error.message || 'Failed to create stock adjustment');
    } finally {
      setSaving(false);
    }
  };
  
  const renderCurrentStock = () => {
    const totalQuantity = batches.reduce((sum, batch) => sum + batch.currentQuantity, 0);
    const availableUnits = item.unitContains 
      ? Math.floor(totalQuantity / item.unitContains.value)
      : totalQuantity;
    
    return (
      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
        <div>
          <div className="text-sm text-gray-500">Total Quantity</div>
          <div className="font-medium">
            {totalQuantity} {item.unitContains ? item.unitContains.unit : 'units'}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Available Units</div>
          <div className="font-medium">
            {availableUnits} {item.unitContains ? 'units' : ''}
          </div>
        </div>
      </div>
    );
  };
  
  const renderBatchSelection = () => {
    if (batches.length === 0) {
      return (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-amber-600" />
            <span className="font-medium text-amber-700">No Stock Available</span>
          </div>
          <p className="text-sm text-amber-600">
            This item has no available stock. You can only increase quantity to create new stock.
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        <Label htmlFor="batch">Select Batch</Label>
        <Select 
          value={formData.selectedBatchId} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, selectedBatchId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a batch" />
          </SelectTrigger>
          <SelectContent>
            {batches.map((batch) => (
              <SelectItem key={batch.id} value={batch.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{batch.batchNumber}</span>
                  <div className="ml-4 text-right">
                    <div className="text-sm font-medium">Qty: {batch.currentQuantity}</div>
                    <div className="text-xs text-gray-500">
                      Exp: {batch.expiryDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedBatch && (
          <div className="p-3 bg-blue-50 rounded-md">
            <div className="text-sm font-medium text-blue-700 mb-1">Selected Batch Details</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Current Qty:</span>
                <span className="ml-1 font-medium">{selectedBatch.currentQuantity}</span>
              </div>
              <div>
                <span className="text-gray-600">Expiry:</span>
                <span className="ml-1 font-medium">{selectedBatch.expiryDate.toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Cost:</span>
                <span className="ml-1 font-medium">Rs. {selectedBatch.costPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Price:</span>
                <span className="ml-1 font-medium">Rs. {selectedBatch.unitPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderNewBatchFields = () => {
    if (formData.selectedBatchId || formData.adjustmentType === 'decrease') {
      return null;
    }
    
    return (
      <Card className="border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-green-700">New Batch Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price *</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitPrice">Unit Price *</Label>
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.unitPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Stock Adjustment - {item.name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1 pb-4">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Stock Summary */}
            <div className="space-y-2">
              <Label>Current Stock</Label>
              {renderCurrentStock()}
            </div>
            
            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <RadioGroup 
                value={formData.adjustmentType} 
                onValueChange={(value: AdjustmentType) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    adjustmentType: value,
                    selectedBatchId: value === 'decrease' && batches.length > 0 ? batches[0].id : prev.selectedBatchId
                  }));
                }}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="increase" id="increase" />
                  <Label htmlFor="increase" className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600" />
                    Increase Stock
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="decrease" 
                    id="decrease" 
                    disabled={batches.length === 0}
                  />
                  <Label htmlFor="decrease" className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-600" />
                    Decrease Stock
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Batch Selection */}
            {(formData.adjustmentType === 'decrease' || batches.length > 0) && (
              <div className="space-y-2">
                {renderBatchSelection()}
              </div>
            )}
            
            {/* Option to create new batch when increasing */}
            {formData.adjustmentType === 'increase' && batches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createNewBatch"
                    checked={!formData.selectedBatchId}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      selectedBatchId: e.target.checked ? '' : batches[0]?.id || ''
                    }))}
                  />
                  <Label htmlFor="createNewBatch">Create new batch instead</Label>
                </div>
              </div>
            )}
            
            {/* New Batch Fields */}
            {renderNewBatchFields()}
            
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                {formData.adjustmentType === 'increase' ? 'Quantity to Add' : 'Quantity to Remove'} *
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={formData.adjustmentType === 'decrease' ? selectedBatch?.currentQuantity : undefined}
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="Enter quantity"
                required
              />
              {formData.quantity && (
                <div className="text-sm text-gray-600">
                 New quantity will be: <span className="font-medium">{calculateNewQuantity()}</span>
               </div>
             )}
           </div>
           
           {/* Reason */}
           <div className="space-y-2">
             <Label htmlFor="reason">Reason *</Label>
             <Select 
               value={formData.reason} 
               onValueChange={(value: AdjustmentReason) => setFormData(prev => ({ ...prev, reason: value }))}
             >
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="correction">Stock Count Correction</SelectItem>
                 <SelectItem value="damage">Damaged Items</SelectItem>
                 <SelectItem value="expiry">Expired Items</SelectItem>
                 <SelectItem value="theft">Theft/Loss</SelectItem>
                 <SelectItem value="return">Customer Return</SelectItem>
                 <SelectItem value="recount">Physical Recount</SelectItem>
                 <SelectItem value="other">Other</SelectItem>
               </SelectContent>
             </Select>
           </div>
           
           {/* Notes */}
           <div className="space-y-2">
             <Label htmlFor="notes">Notes</Label>
             <Textarea
               id="notes"
               value={formData.notes}
               onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
               placeholder="Enter additional notes about this adjustment..."
               rows={3}
             />
           </div>
           
           {/* Submit Buttons */}
           <div className="flex justify-end gap-3 pt-4">
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
               disabled={saving || !formData.quantity}
               className="gap-2"
             >
               {saving ? (
                 <>
                   <Loader2 className="h-4 w-4 animate-spin" />
                   Saving...
                 </>
               ) : (
                 <>
                   {formData.adjustmentType === 'increase' ? (
                     <Plus className="h-4 w-4" />
                   ) : (
                     <Minus className="h-4 w-4" />
                   )}
                   {formData.adjustmentType === 'increase' ? 'Add Stock' : 'Remove Stock'}
                 </>
               )}
             </Button>
           </div>
         </form>
       )}
        </div>
     </DialogContent>
   </Dialog>
 );
}