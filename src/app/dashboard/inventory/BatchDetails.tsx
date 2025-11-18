// src/app/dashboard/inventory/BatchDetails.tsx
'use client';

import React from 'react';
import { BatchWithDetails } from '@/types/purchase';
import { InventoryItem } from '@/types/inventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import { purchaseService } from '@/services/purchaseService';

interface BatchDetailsProps {
  item: InventoryItem;
  onClose: () => void;
}

export default function BatchDetails({ item, onClose }: BatchDetailsProps) {
  const [batches, setBatches] = useState<BatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    mainUnits: 0,
    subUnits: 0,
    totalQuantity: 0
  });

  useEffect(() => {
    const loadBatches = async () => {
      try {
        if (item.id) {
          const data = await purchaseService.getBatchesByItem(item.id);
          setBatches(data);
          
          // Calculate totals
          const calculatedTotals = data.reduce((acc, batch) => {
            // Add to total raw quantity
            acc.totalQuantity += batch.quantity;
            
            // Calculate units based on unitContains if available
            if (item.hasUnitContains && item.unitContains && item.unitContains.value > 0) {
              // Calculate main units (e.g., bottles)
              const mainUnits = Math.floor(batch.quantity / item.unitContains.value);
              acc.mainUnits += mainUnits;
              
              // Calculate remaining sub-units (e.g., tablets)
              const subUnits = batch.quantity % item.unitContains.value;
              acc.subUnits += subUnits;
            } else {
              acc.mainUnits += batch.quantity;
            }
            
            return acc;
          }, { mainUnits: 0, subUnits: 0, totalQuantity: 0 });
          
          setTotals(calculatedTotals);
        }
      } finally {
        setLoading(false);
      }
    };
    loadBatches();
  }, [item.id, item.unitContains]);

  const getStatus = (expiryDate: Date) => {
    const today = new Date();
    const monthsUntilExpiry = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (expiryDate < today) {
      return { label: 'Expired', variant: 'destructive' as const };
    }
    if (monthsUntilExpiry <= 3) {
      return { label: 'Expiring Soon', variant: 'warning' as const };
    }
    return { label: 'Valid', variant: 'success' as const };
  };

  const calculateAvailableQuantities = (quantity: number) => {
    if (item.hasUnitContains && item.unitContains && item.unitContains.value > 0) {
      const mainUnits = Math.floor(quantity / item.unitContains.value);
      const subUnits = quantity % item.unitContains.value;
      return {
        mainUnits,
        subUnits,
        total: quantity
      };
    }
    return {
      mainUnits: quantity,
      subUnits: 0,
      total: quantity
    };
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Batch Details - {item.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">
                    Available Units
                    {item.hasUnitContains && item.unitContains && (
                      <span className="block text-xs">
                        ({item.unitContains.value} {item.unitContains.unit} each)
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold">{totals.mainUnits}</div>
                </CardContent>
              </Card>

              {item.hasUnitContains && item.unitContains && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">
                      Loose {item.unitContains.unit}
                    </div>
                    <div className="text-2xl font-bold">{totals.subUnits}</div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">
                    Total Quantity ({item.unitContains ? item.unitContains.unit : 'units'})
                  </div>
                  <div className="text-2xl font-bold">
                    {totals.totalQuantity}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Batches Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch #</TableHead>
                    <TableHead>Added Date</TableHead>
                    <TableHead className="text-right">Available Quantity</TableHead>
                    {item.hasUnitContains && item.unitContains && (
                      <>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">
                          Loose {item.unitContains.unit}
                        </TableHead>
                      </>
                    )}
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => {
                    const status = getStatus(batch.expiryDate);
                    const available = calculateAvailableQuantities(batch.quantity);
                    
                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">
                          {batch.batchNumber}
                        </TableCell>
                        <TableCell>
                          {batch.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {available.total} {item.unitContains ? item.unitContains.unit : 'units'}
                        </TableCell>
                        {item.hasUnitContains && item.unitContains && (
                          <>
                            <TableCell className="text-right">
                              {available.mainUnits}
                            </TableCell>
                            <TableCell className="text-right">
                              {available.subUnits}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          {batch.expiryDate.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">
                      {totals.totalQuantity} {item.unitContains ? item.unitContains.unit : 'units'}
                    </TableCell>
                    {item.hasUnitContains && item.unitContains && (
                      <>
                        <TableCell className="text-right">
                          {totals.mainUnits}
                        </TableCell>
                        <TableCell className="text-right">
                          {totals.subUnits}
                        </TableCell>
                      </>
                    )}
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
