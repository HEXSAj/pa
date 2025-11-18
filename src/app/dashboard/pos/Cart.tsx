// src/app/dashboard/pos/Cart.tsx

import React, { useEffect } from 'react';
import { SaleItem } from '@/types/sale';
import { Button } from "@/components/ui/button";
import { X, Clock, Package, AlertTriangle, Percent, ArrowUp, Gift } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

import { Layers,MapPin } from 'lucide-react';

interface CartProps {
  items: SaleItem[];
  onRemoveItem: (index: number) => void;
  onClearCart?: () => void;
  totalDiscount?: number;
  discountPercentage?: number;
}

export const Cart: React.FC<CartProps> = ({ 
  items, 
  onRemoveItem, 
  onClearCart,
  totalDiscount = 0,
  discountPercentage = 0
}) => {
  // Set up keyboard shortcuts for removing items
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + 1-9 to remove items 1-9
      if (e.altKey && !isNaN(parseInt(e.key)) && parseInt(e.key) > 0) {
        const index = parseInt(e.key) - 1;
        if (index < items.length) {
          e.preventDefault();
          onRemoveItem(index);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, onRemoveItem]);
  
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="bg-secondary/10 rounded-full p-6 mb-4">
          <Package className="w-10 h-10 text-secondary" />
        </div>
        <p className="text-xl font-medium mb-2">Cart is empty</p>
        <p className="text-sm text-gray-500 max-w-md">
          Search and add items to get started. Use F1 to quickly access the search.
        </p>
      </div>
    );
  }
  
  // Calculate total
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const finalAmount = subtotal - totalDiscount;
  
  // Function to check if a batch is expiring soon
  const isExpiringSoon = (expiryDate: Date): boolean => {
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 90; // 3 months
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Scrollable items list - flex-1 with overflow-y-auto */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          <ul className="px-4">
                {items.map((item, index) => {
        const keyboardShortcut = index < 9 ? `Alt+${index + 1}` : null;
        
        // Check if it's a secondary item
        const isSecondaryItem = item.isSecondaryItem === true;
        
        // For secondary items, there's no batch or expiry date to check
        const expiringSoon = !isSecondaryItem && item.batch && isExpiringSoon(item.batch.expiryDate);
        
        // Calculate item discount if any
        const hasItemDiscount = item.itemDiscountPercentage && item.itemDiscountPercentage > 0;
        const itemOriginalPrice = hasItemDiscount 
          ? item.totalPrice / (1 - item.itemDiscountPercentage / 100)
          : item.totalPrice;
        
        // Check if this is a free item from a free batch
        const isFreeItem = item.fromFreeItemBatch || (!isSecondaryItem && item.batch && item.batch.isFreeItem);
        
        return (
          <motion.li 
            key={index} 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="py-3 border-b last:border-b-0"
          >
            <div className="flex justify-between group">
              <div className="flex-1">
                <div className="font-medium flex items-center">
                  {isSecondaryItem ? (
                    <>
                      {/* For secondary item */}
                      {item.item.mainItemName || item.item.name}
                      <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200 flex items-center">
                        <Layers className="h-3 w-3 mr-1" />
                        Secondary
                      </Badge>
                    </>
                  ) : (
                    <>
                      {/* For main inventory item */}
                      {item.item.name}
                      {expiringSoon && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="ml-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">This batch will expire soon</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {isFreeItem && (
                        <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200 flex items-center">
                          <Gift className="h-3 w-3 mr-1" />
                          Free Item
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  {isSecondaryItem ? (
                    // For secondary items
                    <>
                      {item.item.mainItemCode ? (
                        <>
                          <span>{item.item.mainItemCode}</span>
                          {item.item.location && (
                            <>
                              <span className="mx-1 text-gray-400">•</span>
                              <MapPin className="h-3.5 w-3.5 mr-1" />
                              <span>Location: {item.item.location}</span>
                            </>
                          )}
                        </>
                      ) : item.item.location ? (
                        <>
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          <span>Location: {item.item.location}</span>
                        </>
                      ) : (
                        <span>Secondary Item</span>
                      )}
                    </>
                  ) : (
                    // For main inventory items
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Batch #{item.batch.batchNumber}</span>
                      <span className="mx-1 text-gray-400">•</span>
                      <span>Exp: {item.batch.expiryDate.toLocaleDateString()}</span>
                    </>
                  )}
                </div>
                
                <div className="text-sm mt-1 flex flex-wrap items-center gap-2">
                  {item.unitQuantity > 0 && (
                    <Badge variant="outline" className="font-normal">
                      {item.unitQuantity} units
                    </Badge>
                  )}
                  {item.unitQuantity > 0 && item.subUnitQuantity > 0 && (
                    <span className="text-gray-400">+</span>
                  )}
                  {item.subUnitQuantity > 0 && (
                    <Badge variant="outline" className="font-normal">
                      {item.subUnitQuantity} {isSecondaryItem 
                        ? "sub-units" 
                        : (item.item.unitContains ? item.item.unitContains.unit : "units")}
                    </Badge>
                  )}
                  
                  {/* Display price adjustment badge */}
                  {item.isPriceAdjusted && item.originalUnitPrice && (
                    <Badge variant="outline" className="font-normal bg-blue-50 text-blue-600 border-blue-200">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      Price +Rs{(item.unitPrice - item.originalUnitPrice).toFixed(2)}
                    </Badge>
                  )}
                  
                  {hasItemDiscount && (
                    <Badge variant="outline" className="font-normal bg-green-50 text-green-600 border-green-200">
                      <Percent className="h-3 w-3 mr-1" />
                      {item.itemDiscountPercentage}% off
                    </Badge>
                  )}
                  
                  {discountPercentage > 0 && !hasItemDiscount && (
                    <Badge variant="outline" className="font-normal bg-blue-50 text-blue-600 border-blue-200">
                      <Percent className="h-3 w-3 mr-1" />
                      Cart discount applies
                    </Badge>
                  )}

                  {isFreeItem && (
                    <Badge variant="outline" className="font-normal bg-purple-50 text-purple-700 border-purple-200">
                      <Gift className="h-3 w-3 mr-1" />
                      No cost
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                {hasItemDiscount || item.isPriceAdjusted ? (
                  <>
                    <div className="font-medium text-lg text-primary">
                      Rs{item.totalPrice.toFixed(2)}
                    </div>
                    {hasItemDiscount && (
                      <div className="text-xs text-gray-500 line-through">
                        Rs{itemOriginalPrice.toFixed(2)}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="font-medium text-lg text-primary">
                    Rs{item.totalPrice.toFixed(2)}
                  </div>
                )}
                <div className="mt-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                          onClick={() => onRemoveItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>{keyboardShortcut ? `Remove (${keyboardShortcut})` : "Remove"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </motion.li>
        );
      })}
            
                        
                </ul>
              </AnimatePresence>
            </div>
            
            {/* Fixed footer with cart summary - flex-shrink-0 */}
            <div className="border-t pt-4 mt-auto p-4 bg-white flex-shrink-0">
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-gray-600">
                  <span className="text-sm">Subtotal:</span>
                  <span className="font-medium">Rs{subtotal.toFixed(2)}</span>
                </div>
                
                {discountPercentage > 0 && (
                  <div className="flex justify-between items-baseline text-green-600">
                    <span className="text-sm flex items-center">
                      <Percent className="h-3 w-3 mr-1" />
                      Discount ({discountPercentage}%):
                    </span>
                    <span className="font-medium">-Rs{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-baseline text-gray-600">
                  <span className="text-sm">Items:</span>
                  <span>{items.length}</span>
                </div>
                
                {/* Display count of free items if any */}
                {items.some(item => item.fromFreeItemBatch || item.batch.isFreeItem) && (
                  <div className="flex justify-between items-baseline text-purple-600">
                    <span className="text-sm flex items-center">
                      <Gift className="h-3 w-3 mr-1" />
                      Free Items:
                    </span>
                    <span>{items.filter(item => item.fromFreeItemBatch || item.batch.isFreeItem).length}</span>
                  </div>
                )}
                
                <div className="h-px bg-gray-200 my-2"></div>
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">Rs{finalAmount.toFixed(2)}</span>
                </div>
                {items.length > 0 && onClearCart && (
                  <>
              <div className="h-px bg-gray-200 my-2"></div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 border-red-100 flex items-center justify-center gap-1"
                onClick={onClearCart}
              >
                <X className="h-4 w-4" />
                <span>Clear Cart</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}