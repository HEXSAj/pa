// Improved TotalQuantityDisplay.tsx
import React, { useState, useEffect } from 'react';
import { InventoryItem } from '@/types/inventory';
import { BatchWithDetails } from '@/types/purchase';
import { Badge } from "@/components/ui/badge";
import { Box, Loader2, AlertCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TotalQuantityDisplayProps {
  item: InventoryItem;
  allBatches: BatchWithDetails[];
  loading?: boolean;
}

const TotalQuantityDisplay: React.FC<TotalQuantityDisplayProps> = ({
  item,
  allBatches,
  loading = false
}) => {
  const [totalUnits, setTotalUnits] = useState<number>(0);
  const [totalSubUnits, setTotalSubUnits] = useState<number>(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState<number>(0);
  const [validBatchesCount, setValidBatchesCount] = useState<number>(0);

  useEffect(() => {
    if (allBatches.length === 0 || loading) return;

    const today = new Date();
    let totalUnitsCount = 0;
    let expiringSoon = 0;
    let validBatches = 0;

    // Filter for non-expired batches with stock
    const validBatchesList = allBatches.filter(batch => {
      const isExpired = new Date(batch.expiryDate) <= today;
      const hasStock = batch.quantity > 0;
      return !isExpired && hasStock;
    });

    validBatches = validBatchesList.length;

    // Count expiring soon batches (within 90 days)
    expiringSoon = validBatchesList.filter(batch => {
      const expiryDate = new Date(batch.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 90;
    }).length;

    // Calculate total units across all valid batches
    totalUnitsCount = validBatchesList.reduce((sum, batch) => sum + batch.quantity, 0);

    // Calculate total sub-units based on unit conversion
    let totalSubUnitsCount = 0;
    if (item.unitContains && item.unitContains.value > 0) {
      totalSubUnitsCount = totalUnitsCount * item.unitContains.value;
    }

    setTotalUnits(totalUnitsCount);
    setTotalSubUnits(totalSubUnitsCount);
    setExpiringSoonCount(expiringSoon);
    setValidBatchesCount(validBatches);
  }, [allBatches, item, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-3 bg-gray-50 rounded-md border">
        <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
        <span className="text-sm text-gray-500">Calculating total quantity...</span>
      </div>
    );
  }

  // Get the unit name from the item
  const unitName = item.type === 'Tablet' || item.type === 'Capsule' 
    ? 'tablets'
    : item.type === 'Syrup' || item.type === 'Injection'
      ? 'ml'
      : item.type === 'Cream' || item.type === 'Ointment'
        ? 'g'
        : 'units';

  const subUnitName = item.unitContains?.unit || unitName;

  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Box className="h-4 w-4 mr-1.5 text-blue-600" />
          <span className="font-medium text-blue-700">Total Available Stock</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-blue-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">Combined quantity across all valid batches</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border border-blue-200 rounded p-2 flex flex-col">
          <div className="text-sm text-gray-500">Units</div>
          <div className="font-bold text-primary text-xl">{totalUnits}</div>
          <div className="text-xs text-gray-500">
            {totalUnits === 1 ? 'unit' : 'units'} in stock
          </div>
        </div>
        
        {item.unitContains && (
          <div className="bg-white border border-blue-200 rounded p-2 flex flex-col">
            <div className="text-sm text-gray-500">{subUnitName}</div>
            <div className="font-bold text-primary text-xl">{totalSubUnits}</div>
            <div className="text-xs text-gray-500">
              total {subUnitName} ({totalUnits} × {item.unitContains.value})
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-2 flex justify-between items-center">
        <Badge variant="outline" className="bg-blue-50 text-blue-600">
          {validBatchesCount} valid batch{validBatchesCount !== 1 ? 'es' : ''}
        </Badge>
        
        {expiringSoonCount > 0 && (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {expiringSoonCount} expiring soon
          </Badge>
        )}
      </div>
    </div>
  );
};

export default TotalQuantityDisplay;