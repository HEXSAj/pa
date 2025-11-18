// src/app/dashboard/purchases/PurchaseItemForm.tsx
import React, { useState, useEffect } from 'react';
import { PurchaseItem } from '@/types/purchase';
import { InventoryItem } from '@/types/inventory';
import { purchaseService } from '@/services/purchaseService';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Gift, ArrowRight, AlertTriangle, Info, Package, Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PurchaseItemFormProps {
  item: InventoryItem | null;
  batchNumber: string;
  onAddItem: (item: Partial<PurchaseItem>) => void;
  onCancel?: () => void;
}

export function PurchaseItemForm({
  item,
  batchNumber,
  onAddItem,
  onCancel
}: PurchaseItemFormProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [costPricePerUnit, setCostPricePerUnit] = useState<number>(0);
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState<number>(0);
  const [freeItemCount, setFreeItemCount] = useState<number>(0);
  const [hasFreeItems, setHasFreeItems] = useState<boolean>(false);
  const [priceError, setPriceError] = useState<string>('');
  
  // For displaying available quantity
  const [availableQuantity, setAvailableQuantity] = useState<{
    units: number;
    subUnits?: number;
  }>({ units: 0 });
  const [loadingQuantity, setLoadingQuantity] = useState<boolean>(false);
  
  // Set default expiry date to today's date
  useEffect(() => {
    const today = new Date();
    setExpiryDate(today.toISOString().split('T')[0]);
  }, []);
  
  // Check if expiry date is valid (not too close to current date)
  const [expiryWarning, setExpiryWarning] = useState<string>('');
  
  useEffect(() => {
    if (!expiryDate) return;
    
    const selectedDate = new Date(expiryDate);
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);
    
    if (selectedDate <= today) {
      setExpiryWarning('Warning: Expiry date cannot be today or in the past');
    } else if (selectedDate < threeMonthsFromNow) {
      setExpiryWarning('Warning: Expiry date is less than 3 months from today');
    } else {
      setExpiryWarning('');
    }
  }, [expiryDate]);
  
  // Load available quantity when item changes
  useEffect(() => {
    const fetchAvailableQuantity = async () => {
      if (!item?.id) return;
      
      try {
        setLoadingQuantity(true);
        const batches = await purchaseService.getBatchesByItem(item.id);
        
        // Calculate total units
        const totalUnits = batches.reduce((sum, batch) => sum + batch.quantity, 0);
        
        // Calculate total sub-units if applicable
        const totalSubUnits = item.unitContains?.value 
          ? totalUnits * item.unitContains.value
          : undefined;
          
        setAvailableQuantity({
          units: totalUnits,
          subUnits: totalSubUnits
        });
      } catch (error) {
        console.error('Error fetching batches:', error);
      } finally {
        setLoadingQuantity(false);
      }
    };
    
    fetchAvailableQuantity();
  }, [item?.id]);
  
  // Validate selling price when cost price changes
  useEffect(() => {
    if (costPricePerUnit > 0 && sellingPricePerUnit > 0) {
      if (sellingPricePerUnit < costPricePerUnit) {
        setPriceError('Selling price cannot be lower than cost price');
      } else {
        setPriceError('');
      }
    }
  }, [costPricePerUnit, sellingPricePerUnit]);
  
  const handleSubmit = () => {
    if (!item) return;
    
    // Don't allow submission if selling price is lower than cost price
    if (sellingPricePerUnit < costPricePerUnit) {
      setPriceError('Selling price cannot be lower than cost price');
      return;
    }
    
    // Calculate total quantity including free items
    const totalQuantity = item.unitContains
      ? (quantity * item.unitContains.value) + freeItemCount
      : quantity + freeItemCount;
      
    onAddItem({
      itemId: item.id!,
      batchNumber,
      quantity,
      unitsPerPack: item.unitContains?.value,
      totalQuantity,
      expiryDate: new Date(expiryDate),
      costPricePerUnit,
      sellingPricePerUnit,
      freeItemCount: hasFreeItems ? freeItemCount : 0 // Only include if has free items
    });
  };
  
  // Update selling price handler with validation
  const handleSellingPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    setSellingPricePerUnit(newPrice);
    
    if (costPricePerUnit > 0 && newPrice > 0) {
      if (newPrice < costPricePerUnit) {
        setPriceError('Selling price cannot be lower than cost price');
      } else {
        setPriceError('');
      }
    }
  };

  const calculateItemTotal = () => {
    return quantity * costPricePerUnit;
  };
  
  // Handle cost price change with validation
  const handleCostPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = parseFloat(e.target.value) || 0;
    setCostPricePerUnit(newCost);
    
    // If a selling price is already set, validate it against the new cost
    if (sellingPricePerUnit > 0 && newCost > 0) {
      if (sellingPricePerUnit < newCost) {
        // Auto-adjust selling price to match cost price
        setSellingPricePerUnit(newCost);
        setPriceError('');
      } else {
        setPriceError('');
      }
    }
  };
  
  // Check if validation passes
  const isValid = quantity > 0 && 
                  expiryDate && 
                  costPricePerUnit > 0 && 
                  sellingPricePerUnit >= costPricePerUnit &&
                  new Date(expiryDate) > new Date(); // Ensure expiry date is in the future
  
  // Check for margin warning
  const margin = costPricePerUnit > 0 && sellingPricePerUnit > 0
    ? ((sellingPricePerUnit - costPricePerUnit) / costPricePerUnit) * 100
    : 0;
  const showMarginWarning = costPricePerUnit > 0 && sellingPricePerUnit > 0 && margin < 20;
  
  // Calculate subtotal with proper formatting
  const subtotal = quantity * costPricePerUnit;
  
  // Calculate selling price per sub-unit if applicable
  const sellingPricePerSubUnit = item?.unitContains?.value && sellingPricePerUnit > 0
    ? sellingPricePerUnit / item.unitContains.value
    : null;
  
  return (
    <div className="space-y-4">
      {/* Available Quantity Info Box */}
      {item && (
        <div className="bg-blue-50 p-3 rounded-md border border-blue-200 flex items-center">
          <Package className="h-5 w-5 text-blue-600 mr-2" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-800">Available Inventory</h4>
            {loadingQuantity ? (
              <div className="flex items-center text-blue-700 text-sm">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                <span>Loading quantities...</span>
              </div>
            ) : (
              <div className="text-sm text-blue-700">
                <span className="font-medium">{availableQuantity.units}</span> units in stock
                {availableQuantity.subUnits !== undefined && (
                  <>
                    {" ("}
                    <span className="font-medium">{availableQuantity.subUnits}</span>
                    {" "}{item.unitContains?.unit || 'sub-units'})
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Quantity (Units) *</Label>
          <Input
            type="number"
            min="1"
            value={quantity || ''}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          />
          {item?.unitContains && (
            <div className="text-sm text-muted-foreground mt-1">
              {`Total: ${quantity * item.unitContains.value} ${item.unitContains.unit}`}
            </div>
          )}
        </div>

        <div>
          <Label>Expiry Date * (Please change from default)</Label>
          <Input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className={`${expiryWarning ? 'border-red-300 focus:border-red-500' : 'border-yellow-200 focus:border-yellow-500'}`}
          />
          <div className="text-xs text-amber-600 mt-1 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Default is today's date. Please update to the actual expiry date.
          </div>
          {expiryWarning && (
            <div className="text-xs text-red-600 mt-1 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {expiryWarning}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cost Price per Unit *</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={costPricePerUnit || ''}
            onChange={handleCostPriceChange}
          />
        </div>

        <div>
          <Label>Selling Price per Unit *</Label>
          <Input
            type="number"
            min={costPricePerUnit > 0 ? costPricePerUnit : "0.01"}
            step="0.01"
            value={sellingPricePerUnit || ''}
            onChange={handleSellingPriceChange}
            className={priceError ? "border-red-500" : ""}
          />
          {priceError && (
            <div className="text-xs text-red-600 mt-1 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {priceError}
            </div>
          )}
          {showMarginWarning && !priceError && (
            <div className="text-xs text-amber-600 mt-1 flex items-center">
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                Low margin: {margin.toFixed(1)}%
              </Badge>
            </div>
          )}
          {sellingPricePerSubUnit && item?.unitContains && (
            <div className="text-xs text-blue-600 mt-1">
              Each {item.unitContains.unit} will sell for Rs{sellingPricePerSubUnit.toFixed(2)}
            </div>
          )}
        </div>
      </div>
      
      {/* Free Items Section */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Gift className="h-4 w-4 mr-2 text-purple-500" />
            <Label className="cursor-pointer">Free Items</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-600 border-purple-200">
                    Info
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Free items are added to the same batch but tracked separately.
                    They don't affect the purchase cost but are included in inventory.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center space-x-2">
            <Label htmlFor="free-items-toggle" className="text-sm text-muted-foreground">
              {hasFreeItems ? 'Enabled' : 'Disabled'}
            </Label>
            <Switch 
              id="free-items-toggle" 
              checked={hasFreeItems} 
              onCheckedChange={setHasFreeItems}
            />
          </div>
        </div>
        
        {hasFreeItems && (
          <div className="mt-2 bg-purple-50 border border-purple-200 rounded-md p-3">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <Label htmlFor="free-quantity" className="text-sm flex items-center">
                  <Gift className="h-3 w-3 mr-1 text-purple-500" />
                  Free {item?.unitContains ? item.unitContains.unit : 'units'} Count
                </Label>
                <Input
                  id="free-quantity"
                  type="number"
                  min="0"
                  value={freeItemCount || ''}
                  onChange={(e) => setFreeItemCount(parseInt(e.target.value) || 0)}
                  className="mt-1 border-purple-200 focus:border-purple-400"
                />
              </div>
              
              {item?.unitContains && freeItemCount > 0 && (
                <div className="text-sm text-purple-600 flex items-center justify-between mt-1">
                  <span>Purchased: {quantity * item.unitContains.value} {item.unitContains.unit}</span>
                  <ArrowRight className="h-3 w-3 mx-1" />
                  <span className="font-medium">Total: {(quantity * item.unitContains.value) + freeItemCount} {item.unitContains.unit}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Summary Section */}
      

      {isValid && (
        <div className="bg-gray-50 p-3 rounded-md border mt-4">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Item Total Cost:</span>
              <span className="font-medium text-blue-600">Rs{calculateItemTotal().toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal (without free items):</span>
              <span className="font-medium">Rs{subtotal.toFixed(2)}</span>
            </div>
            
            {hasFreeItems && freeItemCount > 0 && (
              <div className="flex justify-between text-sm text-purple-600">
                <span>Free items value (not charged):</span>
                <span>Rs{(freeItemCount * (costPricePerUnit / (item?.unitContains?.value || 1))).toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Profit margin:</span>
              <Badge className={margin >= 30 ? "bg-green-500" : margin >= 20 ? "bg-blue-500" : "bg-amber-500"}>
                {margin.toFixed(1)}%
              </Badge>
            </div>
            
            {sellingPricePerSubUnit && item?.unitContains && (
              <div className="flex justify-between text-sm pt-2 border-t mt-2">
                <span className="text-gray-600">Selling price per {item.unitContains.unit}:</span>
                <span className="font-medium">Rs{sellingPricePerSubUnit.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Error alert when selling price is lower than cost price */}
      {priceError && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {priceError}. To ensure profitability, the selling price must be equal to or greater than the cost price.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSubmit}
          className="gap-2"
          disabled={!isValid || !!priceError}
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>
    </div>
  );
}