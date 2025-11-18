// src/app/dashboard/pos/BatchSelector.tsx

import React, { useState, useEffect } from 'react';
import { BatchWithDetails } from '@/types/purchase';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Box, AlertTriangle, CheckCircle2, Gift } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BatchSelectorProps {
  batches: BatchWithDetails[];
  onSelectBatch: (batch: BatchWithDetails) => void;
  defaultSelectedBatch?: BatchWithDetails;
}

export const BatchSelector: React.FC<BatchSelectorProps> = ({
  batches,
  onSelectBatch,
  defaultSelectedBatch
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [keyboardFocusIndex, setKeyboardFocusIndex] = useState<number>(0);
  
  // Set default selected batch if provided
  useEffect(() => {
    if (defaultSelectedBatch && defaultSelectedBatch.id) {
      setSelectedBatchId(defaultSelectedBatch.id);
    } else if (batches.length > 0) {
      // Otherwise select the first batch by default
      setSelectedBatchId(batches[0].id!);
      onSelectBatch(batches[0]);
    }
  }, [batches, defaultSelectedBatch, onSelectBatch]);
  
  // Set up keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when radio group is focused
      if (document.activeElement?.closest('[role="radiogroup"]')) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          const nextIndex = (keyboardFocusIndex + 1) % batches.length;
          setKeyboardFocusIndex(nextIndex);
          setSelectedBatchId(batches[nextIndex].id!);
          onSelectBatch(batches[nextIndex]);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevIndex = (keyboardFocusIndex - 1 + batches.length) % batches.length;
          setKeyboardFocusIndex(prevIndex);
          setSelectedBatchId(batches[prevIndex].id!);
          onSelectBatch(batches[prevIndex]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [batches, keyboardFocusIndex, onSelectBatch]);
  
  const handleChange = (value: string) => {
    setSelectedBatchId(value);
    const selectedBatch = batches.find(batch => batch.id === value);
    if (selectedBatch) {
      onSelectBatch(selectedBatch);
      // Update keyboard focus index
      const index = batches.findIndex(batch => batch.id === value);
      setKeyboardFocusIndex(index >= 0 ? index : 0);
    }
  };
  
  if (batches.length === 0) {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800 flex items-center space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <span className="font-medium">No valid batches available for this item.</span>
      </div>
    );
  }
  
  if (batches.length === 1) {
    // If only one batch, just display it and select it automatically
    const batch = batches[0];
    
    useEffect(() => {
      onSelectBatch(batch);
      setSelectedBatchId(batch.id!);
    }, [batch]);
    
    return (
      <div className="space-y-2">
        <div className="font-medium flex items-center">
          <Box className="h-4 w-4 mr-2 text-primary" />
          <span>Batch Information</span>
        </div>
        <div className="p-4 border rounded-md bg-blue-50/50 border-blue-200 hover:bg-blue-50 transition-colors">
          <div className="font-medium flex items-center">
            Batch #{batch.batchNumber}
            {batch.isFreeItem && (
              <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200 flex items-center">
                <Gift className="h-3 w-3 mr-1" />
                Free Item
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-600 space-y-1 mt-2">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              <span>Expires: {batch.expiryDate.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between mt-1">
              <Badge variant="outline" className="font-normal">
                Available: {batch.quantity}
              </Badge>
              <Badge variant="outline" className="font-normal">
                Price: Rs{batch.unitPrice?.toFixed(2)}
              </Badge>
              {batch.isFreeItem && (
                <Badge variant="outline" className="font-normal bg-green-50 text-green-700">
                  Cost: Rs0.00
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // For multiple batches, show radio group with enhanced styling
  return (
    <div className="space-y-3">
      <div className="font-medium flex items-center">
        <Box className="h-4 w-4 mr-2 text-primary" />
        <span>Select Batch</span>
        <Badge variant="outline" className="ml-2 text-xs font-normal">
          Use arrow keys to navigate
        </Badge>
      </div>
      <RadioGroup
        value={selectedBatchId}
        onValueChange={handleChange}
        className="space-y-2"
      >
        <AnimatePresence>
          {batches.map((batch, index) => {
            // Calculate days until expiry
            const today = new Date();
            const daysUntilExpiry = Math.ceil(
              (batch.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            // Determine styling based on expiry
            const isExpiringSoon = daysUntilExpiry <= 90; // 3 months
            
            return (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`flex items-start space-x-2 p-3 border rounded-md transition-all ${
                  selectedBatchId === batch.id 
                    ? 'bg-blue-50 border-blue-300 shadow-sm' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <RadioGroupItem 
                  value={batch.id!} 
                  id={`batch-${batch.id}`}
                  className="mt-1"
                />
                <Label 
                  htmlFor={`batch-${batch.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center">
                    <span className="font-medium">Batch #{batch.batchNumber}</span>
                    {batch.isFreeItem && (
                      <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200 flex items-center">
                        <Gift className="h-3 w-3 mr-1" />
                        Free Item
                      </Badge>
                    )}
                    {selectedBatchId === batch.id && (
                      <CheckCircle2 className="h-4 w-4 ml-1.5 text-blue-500" />
                    )}
                  </div>
                  <div className="text-sm space-y-2 mt-1">
                    <div className={isExpiringSoon ? 'text-amber-600 flex items-center' : 'text-gray-600 flex items-center'}>
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      <span>Expires: {batch.expiryDate.toLocaleDateString()}</span>
                      {isExpiringSoon && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="ml-1.5">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-xs">This batch will expire in {daysUntilExpiry} days</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="font-normal">
                        Available: {batch.quantity}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        Price: Rs{batch.unitPrice?.toFixed(2)}
                      </Badge>
                      {batch.isFreeItem && (
                        <Badge variant="outline" className="font-normal bg-green-50 text-green-700">
                          Cost: Rs0.00
                        </Badge>
                      )}
                    </div>
                  </div>
                </Label>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </RadioGroup>
    </div>
  );
};