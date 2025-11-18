// src/app/dashboard/pos/QuantityInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryItem } from '@/types/inventory';
import { BatchWithDetails } from '@/types/purchase';
import { ShoppingCart, Plus, Minus, AlertCircle, Package2, Percent, DollarSign, Gift, Link, Link2Off, Info } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import TotalQuantityDisplay from './TotalQuantityDisplay'; // Import our new component

interface QuantityInputProps {
  item: InventoryItem;
  batch: BatchWithDetails;
  allBatches?: BatchWithDetails[]; // Add this prop to access all batches
  onQuantityChange: (unitQty: number, subUnitQty: number, discountPercentage?: number, adjustedUnitPrice?: number, adjustedSubUnitPrice?: number) => void;
  unitQtyInputRef?: React.RefObject<HTMLInputElement>;
  subUnitQtyInputRef?: React.RefObject<HTMLInputElement>;
  onEnterKeyPress?: (unitQty: number, subUnitQty: number, discountPercentage?: number, adjustedUnitPrice?: number, adjustedSubUnitPrice?: number) => void;
  customerDiscountPercentage?: number;
  patientType: 'local' | 'foreign'; // Add patientType prop
}


export const QuantityInput: React.FC<QuantityInputProps> = ({
  item,
  batch,
  allBatches = [], // Default to empty array if not provided
  onQuantityChange,
  unitQtyInputRef,
  subUnitQtyInputRef,
  onEnterKeyPress,
  customerDiscountPercentage = 0,
  patientType // Destructure the new prop
}) => {
  const [unitQty, setUnitQty] = useState<number>(0); // Default to 0 instead of 1
  const [subUnitQty, setSubUnitQty] = useState<number>(0);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(customerDiscountPercentage);
  const [showDiscountDialog, setShowDiscountDialog] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [focusApplied, setFocusApplied] = useState<boolean>(false);

  // Find the highest unit price across all batches for the current item
  const [highestUnitPrice, setHighestUnitPrice] = useState<number>(batch.unitPrice || 0);
  const [isPriceAdjusted, setIsPriceAdjusted] = useState<boolean>(false);
  // Reference to track previous batches length to prevent unnecessary updates
  const prevBatchesLength = useRef<number>(0);
  
  // Add error state for discount validation
  const [discountError, setDiscountError] = useState<string>('');
  
  // New state for sub-unit price management
  const [adjustedSubUnitPrice, setAdjustedSubUnitPrice] = useState<number>(0);
  const [subUnitPriceInputValue, setSubUnitPriceInputValue] = useState<string>('');
  const [isSubUnitPriceAdjusted, setIsSubUnitPriceAdjusted] = useState<boolean>(false);
  // State to track if prices are linked (changing unit price updates sub-unit price)
  const [pricesLinked, setPricesLinked] = useState<boolean>(true);
  
  // State to track if we're loading batch data
  const [loadingBatchData, setLoadingBatchData] = useState<boolean>(allBatches.length === 0);
  
  // Local refs if none are provided from parent
  const localUnitQtyRef = useRef<HTMLInputElement>(null);
  const localSubUnitQtyRef = useRef<HTMLInputElement>(null);
  
  // Use provided refs or local refs
  const unitQtyRef = unitQtyInputRef || localUnitQtyRef;
  const subUnitQtyRef = subUnitQtyInputRef || localSubUnitQtyRef;

  // Determine if price is editable based on patient type
  const isPriceEditable = patientType === 'foreign';


  
  
  
  // Calculate highest unit price when component loads or batches change
  useEffect(() => {
    if (allBatches && allBatches.length > 0) {
      setLoadingBatchData(false);
      
      // Filter valid non-expired batches with stock
      const validBatches = allBatches.filter(b => 
        b.quantity > 0 && 
        new Date(b.expiryDate) > new Date()
      );
      
      if (validBatches.length > 0) {
        // Find the highest unit price
        const highest = validBatches.reduce((max, current) => {
          const currentPrice = current.unitPrice || 0;
          return currentPrice > max ? currentPrice : max;
        }, 0);
        
        // Only update if the highest price is actually higher than current value
        // or if we're initializing for the first time
        if (highest > highestUnitPrice || allBatches.length !== prevBatchesLength.current) {
          setHighestUnitPrice(highest);
          
          // Automatically adjust price to highest found
          setAdjustedUnitPrice(highest);
          setPriceInputValue(highest.toString());
          setIsPriceAdjusted(highest > (batch.unitPrice || 0));
          
          // Also update sub-unit price if prices are linked
          if (pricesLinked && item.unitContains) {
            const calculatedSubUnitPrice = highest / item.unitContains.value;
            setAdjustedSubUnitPrice(calculatedSubUnitPrice);
            setSubUnitPriceInputValue(calculatedSubUnitPrice.toFixed(2));
          }
        }
      }
      
      // Store batch length to detect actual changes
      prevBatchesLength.current = allBatches.length;
    }
  }, [allBatches, batch.id]);
  
  // Handle price adjustment with better input experience
  const [adjustedUnitPrice, setAdjustedUnitPrice] = useState<number>(highestUnitPrice);
  const [priceInputValue, setPriceInputValue] = useState<string>(highestUnitPrice.toString());
  
  // Initialize sub-unit price based on item
  useEffect(() => {
    if (item.unitContains) {
      const defaultSubUnitPrice = adjustedUnitPrice / item.unitContains.value;
      setAdjustedSubUnitPrice(defaultSubUnitPrice);
      setSubUnitPriceInputValue(defaultSubUnitPrice.toFixed(2));
    }
  }, [item.unitContains, adjustedUnitPrice]);
  
  // Get the unit name from the item
  const unitName = item.type === 'Tablet' || item.type === 'Capsule' 
    ? 'tablets'
    : item.type === 'Syrup' || item.type === 'Injection'
      ? 'ml'
      : item.type === 'Cream' || item.type === 'Ointment'
        ? 'g'
        : 'units';
  
  // Max available quantity based on batch
  const maxAvailable = batch.quantity;
  
  // Update adjusted price when batch changes or highest price changes
  useEffect(() => {
    // Always use the highest price automatically
    setAdjustedUnitPrice(highestUnitPrice);
    setPriceInputValue(highestUnitPrice.toString());
    setIsPriceAdjusted(highestUnitPrice > (batch.unitPrice || 0));
    
    // Update sub-unit price if prices are linked
    if (pricesLinked && item.unitContains) {
      const calculatedSubUnitPrice = highestUnitPrice / item.unitContains.value;
      setAdjustedSubUnitPrice(calculatedSubUnitPrice);
      setSubUnitPriceInputValue(calculatedSubUnitPrice.toFixed(2));
    }
  }, [batch, highestUnitPrice, pricesLinked]);
  
  // Calculate totals with potential discount and adjusted prices
  const baseUnitPrice = batch.unitPrice || 0;
  // Calculate the actual sub-unit price - use adjusted price if available, otherwise calculate from unit price
  const subUnitPrice = isSubUnitPriceAdjusted 
    ? adjustedSubUnitPrice 
    : (item.unitContains ? adjustedUnitPrice / item.unitContains.value : 0);
    
  // Calculate total using the appropriate prices
  const totalBeforeDiscount = (unitQty * adjustedUnitPrice) + (subUnitQty * subUnitPrice);
  const discountAmount = totalBeforeDiscount * (discountPercentage / 100);
  const finalPrice = totalBeforeDiscount - discountAmount;
  

  
  useEffect(() => {
    // If there's a customer discount, set item discount to 0 and show info message
    if (customerDiscountPercentage > 0) {
      setDiscountPercentage(0);
      setDiscountError('Customer discount will be applied at cart level instead of item level.');
    } else {
      setDiscountError('');
    }
  }, [customerDiscountPercentage]);


  // Single handler for keyboard events on both inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValid && onEnterKeyPress && !isSubmitting) {
      e.preventDefault();
      
      // Set lock to prevent double submission
      setIsSubmitting(true);
      
      // Call the handler with adjusted prices
      onEnterKeyPress(
        unitQty || 0, // Pass 0 if unitQty is empty or falsy
        subUnitQty, 
        discountPercentage, 
        adjustedUnitPrice, 
        isSubUnitPriceAdjusted ? adjustedSubUnitPrice : undefined
      );
      
      // Reset the lock after a delay
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };
  
  // Validate input whenever quantities change
  useEffect(() => {
    validateQuantities();
  }, [unitQty, subUnitQty, maxAvailable]);
  
  const validateQuantities = () => {
    // Check that at least one quantity is positive
    if (unitQty <= 0 && subUnitQty <= 0) {
      setIsValid(false);
      setValidationMessage('Please enter a valid quantity');
      return;
    }
    
    // Calculate total units for comparison
    let totalUnits = unitQty;
    if (item.unitContains && subUnitQty > 0) {
      totalUnits += subUnitQty / item.unitContains.value;
    }
    
    // Check if we have enough in stock
    if (totalUnits > maxAvailable) {
      setIsValid(false);
      setValidationMessage(`Not enough in stock. Max available: ${maxAvailable}`);
      return;
    }
    
    // If we have subunits, check that they're less than the unit contains
    if (item.unitContains && subUnitQty >= item.unitContains.value) {
      setIsValid(false);
      setValidationMessage(`Sub-unit quantity should be less than ${item.unitContains.value}`);
      return;
    }
    
    // All checks passed
    setIsValid(true);
    setValidationMessage('');
  };
  
  const handleUnitQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setUnitQty(value >= 0 ? value : 0);
  };
  
  const handleSubUnitQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setSubUnitQty(value >= 0 ? value : 0);
  };
  
  // Handle initial change allowing empty input for better UX
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty field for better editing experience
    setPriceInputValue(inputValue);
    
    // Only if there's a valid number, update the actual price
    if (inputValue !== '') {
      const numericValue = parseFloat(inputValue);
      
      // Validate the final value is not below original
      if (!isNaN(numericValue)) {
        if (numericValue >= baseUnitPrice) {
          setAdjustedUnitPrice(numericValue);
          setIsPriceAdjusted(numericValue > baseUnitPrice);
          
          // If prices are linked, update sub-unit price
          if (pricesLinked && item.unitContains) {
            const newSubUnitPrice = numericValue / item.unitContains.value;
            setAdjustedSubUnitPrice(newSubUnitPrice);
            setSubUnitPriceInputValue(newSubUnitPrice.toFixed(2));
            setIsSubUnitPriceAdjusted(false); // Reset since it's now calculated
          }
        } else {
          // Don't update adjusted price if below base price
          // But keep the input value as is for better editing experience
        }
      }
    }
  };

  // Handle blur event to enforce minimum price when user leaves field
  const handlePriceBlur = () => {
    // If empty or below base price, reset to base price
    const numericValue = parseFloat(priceInputValue);
    if (priceInputValue === '' || isNaN(numericValue) || numericValue < baseUnitPrice) {
      setAdjustedUnitPrice(baseUnitPrice);
      setPriceInputValue(baseUnitPrice.toString());
      setIsPriceAdjusted(false);
      
      // If prices are linked, reset sub-unit price
      if (pricesLinked && item.unitContains) {
        const newSubUnitPrice = baseUnitPrice / item.unitContains.value;
        setAdjustedSubUnitPrice(newSubUnitPrice);
        setSubUnitPriceInputValue(newSubUnitPrice.toFixed(2));
        setIsSubUnitPriceAdjusted(false);
      }
    }
  };
  
  // New handlers for sub-unit price changes
  const handleSubUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty field for better editing experience
    setSubUnitPriceInputValue(inputValue);
    
    // If prices are linked, unlink them when user manually changes sub-unit price
    if (pricesLinked) {
      setPricesLinked(false);
    }
    
    // Only if there's a valid number, update the actual price
    if (inputValue !== '') {
      const numericValue = parseFloat(inputValue);
      
      // Calculate the equivalent base sub-unit price (from unit price)
      const baseSubUnitPrice = item.unitContains ? baseUnitPrice / item.unitContains.value : 0;
      
      // Validate the final value is not below the base sub-unit price
      if (!isNaN(numericValue)) {
        if (numericValue >= baseSubUnitPrice) {
          setAdjustedSubUnitPrice(numericValue);
          setIsSubUnitPriceAdjusted(numericValue > baseSubUnitPrice);
        }
      }
    }
  };
  
  // Handle sub-unit price blur event
  const handleSubUnitPriceBlur = () => {
    if (item.unitContains) {
      // Calculate the base sub-unit price
      const baseSubUnitPrice = baseUnitPrice / item.unitContains.value;
      
      // If empty or below base sub-unit price, reset to base sub-unit price
      const numericValue = parseFloat(subUnitPriceInputValue);
      if (subUnitPriceInputValue === '' || isNaN(numericValue) || numericValue < baseSubUnitPrice) {
        setAdjustedSubUnitPrice(baseSubUnitPrice);
        setSubUnitPriceInputValue(baseSubUnitPrice.toFixed(2));
        setIsSubUnitPriceAdjusted(false);
      }
    }
  };
  
  // Handle price linking toggle
  const handlePriceLinkToggle = (linked: boolean) => {
    setPricesLinked(linked);
    
    // If linking is turned on, reset sub-unit price to be derived from unit price
    if (linked && item.unitContains) {
      const calculatedSubUnitPrice = adjustedUnitPrice / item.unitContains.value;
      setAdjustedSubUnitPrice(calculatedSubUnitPrice);
      setSubUnitPriceInputValue(calculatedSubUnitPrice.toFixed(2));
      setIsSubUnitPriceAdjusted(false);
    }
  };
  
  // Discount handlers - Modified to enforce 5% maximum
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    
    // Clear previous errors
    setDiscountError('');
    
    // Check if value exceeds 5%
    if (value > 5) {
      setDiscountError('Maximum discount allowed is 5%');
      // Ensure discount is between 0 and 5%
      const validDiscount = Math.min(Math.max(0, value), 5);
      setDiscountPercentage(validDiscount);
    } else {
      // Ensure discount is between 0 and 5%
      const validDiscount = Math.min(Math.max(0, value), 5);
      setDiscountPercentage(validDiscount);
    }
  };
  
  const applyDiscount = () => {
    setShowDiscountDialog(false);
  };
  
  const removeDiscount = () => {
    setDiscountPercentage(0);
    setDiscountError('');
    setShowDiscountDialog(false);
  };
  
  // Predefined discount percentages for quick selection - Only include values up to 5%
  const quickDiscounts = [1, 2, 3, 4, 5];
  
  // Increment and decrement handlers
  const incrementUnitQty = () => {
    if (unitQty < maxAvailable) {
      setUnitQty(prev => prev + 1);
    }
  };
  
  const decrementUnitQty = () => {
    if (unitQty > 0) {
      setUnitQty(prev => prev - 1);
    }
  };
  
  const incrementSubUnitQty = () => {
    if (item.unitContains && subUnitQty < item.unitContains.value - 1) {
      setSubUnitQty(prev => prev + 1);
    }
  };
  
  const decrementSubUnitQty = () => {
    if (subUnitQty > 0) {
      setSubUnitQty(prev => prev - 1);
    }
  };

  // Handler for Add to Cart button
  const handleAddToCart = () => {
    if (!isValid || isSubmitting) return;
    
    // Set submission lock
    setIsSubmitting(true);
    
    // If both quantities are 0, default to 1 unit
    const finalUnitQty = (unitQty === 0 && subUnitQty === 0) ? 1 : unitQty;
    
    // Add to cart with adjusted prices
    onQuantityChange(
      finalUnitQty, 
      subUnitQty, 
      discountPercentage, 
      adjustedUnitPrice, 
      isSubUnitPriceAdjusted ? adjustedSubUnitPrice : undefined
    );
    
    // Reset submission lock after delay
    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  };
  
  // Auto-focus logic - only runs once after component mounts
  useEffect(() => {
    // Only apply focus once and only if the component is fully rendered
    if (!focusApplied) {
      // Delay focus to ensure the component is fully rendered
      const focusTimer = setTimeout(() => {
        if (item.unitContains && subUnitQtyRef.current) {
          subUnitQtyRef.current.focus();
        } else if (unitQtyRef.current) {
          unitQtyRef.current.focus();
        }
        setFocusApplied(true);
      }, 250);
      
      return () => clearTimeout(focusTimer);
    }
  }, [item.unitContains, unitQtyRef, subUnitQtyRef, focusApplied]);
  
  return (
    <div className="space-y-4">

     {/* Total Available Quantity Display */}
     <TotalQuantityDisplay 
      item={item} 
      allBatches={allBatches} 
      loading={loadingBatchData} 
    />

      {/* Show free item batch notice if applicable */}
      {batch.isFreeItem && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center space-x-3">
          <Gift className="h-5 w-5 text-purple-600" />
          <div>
            <p className="font-medium text-purple-800">Free Item Batch</p>
            <p className="text-sm text-purple-700">This batch contains items that were received for free. Cost price is Rs0.00.</p>
          </div>
        </div>
      )}
      
      {/* Show notice about highest price being used */}
      {isPriceAdjusted && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-3">
          <DollarSign className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-800">Using Highest Price</p>
            <p className="text-sm text-blue-700">
              Automatically using highest price (Rs{highestUnitPrice.toFixed(2)}) 
              instead of this batch's price (Rs{baseUnitPrice.toFixed(2)}).
            </p>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Package2 className="h-4 w-4 mr-2 text-primary" />
          <span className="font-medium">Quantity</span>
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          <span>Available: </span>
          <Badge variant="outline" className="ml-1 font-normal">
            {batch.quantity} {batch.quantity === 1 ? unitName : unitName}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="unitQty" className="text-sm font-medium flex items-center justify-between">
            <span>Units</span>
            <Badge variant="secondary" className="font-normal text-xs">
              Base Price: Rs{baseUnitPrice?.toFixed(2)}/unit
            </Badge>
          </label>
          <div className="flex items-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-r-none border-r-0"
              onClick={decrementUnitQty}
              disabled={unitQty <= 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="unitQty"
              type="number"
              min="0"
              step="1"
              value={unitQty || ''}
              onChange={handleUnitQtyChange}
              onKeyDown={handleKeyDown}
              placeholder="0"
              ref={unitQtyRef}
              className="h-9 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-l-none border-l-0"
              onClick={incrementUnitQty}
              disabled={unitQty >= maxAvailable}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {item.unitContains && (
          <div className="space-y-2">
            <label htmlFor="subUnitQty" className="text-sm font-medium flex items-center justify-between">
              <span>{unitName}</span>
              <Badge variant="secondary" className="font-normal text-xs">
                Max: {item.unitContains.value - 1}
              </Badge>
            </label>
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-r-none border-r-0"
                onClick={decrementSubUnitQty}
                disabled={subUnitQty <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="subUnitQty"
                type="number"
                min="0"
                max={item.unitContains.value - 1}
                step="1"
                value={subUnitQty || ''}
                onChange={handleSubUnitQtyChange}
                onKeyDown={handleKeyDown}
                placeholder="0"
                ref={subUnitQtyRef}
                className="h-9 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-l-none border-l-0"
                onClick={incrementSubUnitQty}
                disabled={item.unitContains && subUnitQty >= item.unitContains.value - 1}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Price Link Toggle */}
      {item.unitContains && (
        <div className="flex items-center space-x-2 mb-2">
          <Switch
            id="price-link"
            checked={pricesLinked}
            onCheckedChange={handlePriceLinkToggle}
          />
          <Label htmlFor="price-link" className="cursor-pointer flex items-center text-sm">
            {pricesLinked ? (
              <>
                <Link className="h-4 w-4 mr-1 text-blue-600" />
                <span className="text-blue-700">Prices linked</span>
              </>
            ) : (
              <>
                <Link2Off className="h-4 w-4 mr-1 text-gray-500" />
                <span className="text-gray-600">Prices unlinked</span>
              </>
            )}
          </Label>
        </div>
      )}
      
  
        <div className="space-y-2">
          <Label htmlFor="unitPrice" className="text-sm font-medium flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-blue-600" />
              <span>Unit Price</span>
              {isPriceAdjusted && !batch.isFreeItem && (
                <Badge 
                  variant="outline" 
                  className="ml-2 font-normal text-xs bg-blue-50 text-blue-600 border-blue-200"
                >
                  Highest price: Rs{highestUnitPrice.toFixed(2)}
                </Badge>
              )}
            </div>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">Rs</span>
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              value={priceInputValue}
              onChange={handlePriceChange}
              onBlur={handlePriceBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePriceBlur();
                  handleKeyDown(e);
                } else {
                  handleKeyDown(e);
                }
              }}
              placeholder={highestUnitPrice.toString()}
              className="pl-8"
              // Disable the input based on patient type or if it's a free item
              disabled={!isPriceEditable || batch.isFreeItem}
            />
          </div>
          
          {!isPriceEditable && patientType === 'local' && (
            <div className="text-xs text-blue-600 flex items-center">
              <Info className="h-3 w-3 mr-1" />
              Price editing disabled for local patients
            </div>
          )}
          
          {isPriceAdjusted && (
            <div className="text-xs text-blue-600 flex items-center">
              <Plus className="h-3 w-3 mr-1" />
              Auto-adjusted to highest price (Rs{(adjustedUnitPrice - baseUnitPrice).toFixed(2)} higher than this batch)
            </div>
          )}
        </div>
      
   


          {item.unitContains && (
          <div className="space-y-2">
            <Label htmlFor="subUnitPrice" className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-indigo-600" />
                <span>Price per {item.unitContains.unit}</span>
                {isSubUnitPriceAdjusted && !batch.isFreeItem && (
                  <Badge 
                    variant="outline" 
                    className="ml-2 font-normal text-xs bg-indigo-50 text-indigo-600 border-indigo-200"
                  >
                    Custom price set
                  </Badge>
                )}
              </div>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">Rs</span>
              <Input
                id="subUnitPrice"
                type="number"
                step="0.01"
                value={subUnitPriceInputValue}
                onChange={handleSubUnitPriceChange}
                onBlur={handleSubUnitPriceBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubUnitPriceBlur();
                    handleKeyDown(e);
                  } else {
                    handleKeyDown(e);
                  }
                }}
                placeholder={(baseUnitPrice / (item.unitContains.value || 1)).toString()}
                className="pl-8"
                // Disable based on patient type, batch type, or if prices are linked
                disabled={!isPriceEditable || batch.isFreeItem || pricesLinked}
              />
            </div>
            
            {!isPriceEditable && patientType === 'local' && (
              <div className="text-xs text-blue-600 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Price editing disabled for local patients
              </div>
            )}
            
            {isSubUnitPriceAdjusted && !pricesLinked && (
              <div className="text-xs text-indigo-600 flex items-center">
                <Plus className="h-3 w-3 mr-1" />
                Custom price (Rs{(adjustedSubUnitPrice - (baseUnitPrice / item.unitContains.value)).toFixed(2)} higher than base)
              </div>
            )}



          {batch.isFreeItem && (
            <div className="text-xs text-purple-600 flex items-center">
              <Gift className="h-3 w-3 mr-1" />
              This is a free item batch - selling price is fixed
            </div>
          )}
          {pricesLinked && !batch.isFreeItem && (
            <div className="text-xs text-blue-600 flex items-center">
              <Link className="h-3 w-3 mr-1" />
              Price automatically calculated from unit price
            </div>
          )}
        </div>
      )}
      
      {/* Discount controls */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium flex items-center">
            <Percent className="h-4 w-4 mr-1 text-green-600" />
            <span>Item Discount (Max 5%)</span>
          </label>
          
          <Button
            variant={discountPercentage > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDiscountDialog(true)}
            className={`text-xs h-7 ${discountPercentage > 0 ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            {discountPercentage > 0 ? (
              <>{discountPercentage}% Applied</>
            ) : (
              <>Add Discount</>
            )}
          </Button>
        </div>
        
        {discountPercentage > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-2 text-sm flex justify-between items-center">
            <span className="text-green-700">
              {discountPercentage}% discount applied
            </span>
            <span className="text-green-700 font-medium">
              -Rs{discountAmount.toFixed(2)}
            </span>
          </div>
        )}
        
        {/* Display discount error message if any */}
        {discountError && (
          <div className="flex items-center mt-1 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            {discountError}
          </div>
        )}
      </div>
      
      {/* Total calculation */}
      {isValid && unitQty + subUnitQty > 0 && (
        <div className="bg-gray-50 p-3 rounded-md border">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className={`font-semibold ${discountPercentage > 0 ? "line-through text-gray-500" : "text-primary"}`}>
              Rs{totalBeforeDiscount.toFixed(2)}
            </span>
          </div>
          
          {discountPercentage > 0 && (
            <>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-green-600">Discount ({discountPercentage}%):</span>
                <span className="font-semibold text-green-600">
                  -Rs{discountAmount.toFixed(2)}
                </span>
              </div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">Final Price:</span>
                <span className="font-bold text-primary">
                  Rs{finalPrice.toFixed(2)}
                </span>
              </div>
            </>
          )}
          
          {/* Show pricing breakdown if both quantities are used */}
          {unitQty > 0 && subUnitQty > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>{unitQty} units × Rs{adjustedUnitPrice.toFixed(2)}:</span>
                  <span>Rs{(unitQty * adjustedUnitPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>{subUnitQty} {item.unitContains?.unit} × Rs{subUnitPrice.toFixed(2)}:</span>
                  <span>Rs{(subUnitQty * subUnitPrice).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Show free item benefit if applicable */}
          {batch.isFreeItem && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-purple-700">
                <span className="flex items-center">
                  <Gift className="h-3 w-3 mr-1" />
                  Free item benefit:
                </span>
                <span className="font-semibold">
                  Rs{(finalPrice).toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-purple-600 mt-1">
                This item was received for free, so all revenue is profit!
              </div>
            </div>
          )}
        </div>
      )}
      
      {validationMessage && (
        <div className={`flex items-center ${isValid ? 'text-green-600' : 'text-red-500'}`}>
          {!isValid && <AlertCircle className="h-4 w-4 mr-1.5" />}
          <span className="text-sm">{validationMessage}</span>
        </div>
      )}
      
      <div className="pt-2">
        <Button
          className="w-full py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all hover:shadow-md"
          disabled={!isValid || isSubmitting}
          onClick={handleAddToCart}
        >
          <div className="flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            <span className="font-medium">Add to Cart</span>
            <span className="ml-2 bg-white/20 px-2 py-1 rounded text-xs font-bold">Enter ↵</span>
          </div>
        </Button>
      </div>
      
      {/* Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="sm:max-w-md rounded-lg p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white">
            <DialogTitle className="text-xl font-bold">Item Discount (Max 5%)</DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Discount Options</label>
              <div className="flex flex-wrap gap-2">
                {quickDiscounts.map(value => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDiscountPercentage(value);
                      setDiscountError(''); // Clear any errors
                    }}
                    className={`${discountPercentage === value ? "bg-green-50 text-green-600 border-green-200" : ""}`}
                  >
                    {value}%
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Discount Percentage (Max 5%)</label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={discountPercentage}
                  onChange={handleDiscountChange}
                  className="pr-8"
                />
                <span className="absolute right-3 top-2.5 text-gray-500">%</span>
              </div>
              
              {/* Display discount error message if any */}
              {discountError && (
                <div className="flex items-center mt-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {discountError}
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md space-y-2 mt-2">
              <div className="flex justify-between text-sm">
                <span>Original Price:</span>
                <span>Rs{totalBeforeDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({discountPercentage}%):</span>
                <span>-Rs{discountAmount.toFixed(2)}</span>
              </div>
              <div className="h-px bg-gray-200 my-1"></div>
              <div className="flex justify-between font-bold">
                <span>Final Price:</span>
                <span>Rs{finalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-6 border-t bg-gray-50">
            <div className="flex gap-3 w-full">
              {discountPercentage > 0 && (
                <Button 
                  variant="outline" 
                  onClick={removeDiscount}
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  Remove Discount
                </Button>
              )}
              <Button 
                onClick={applyDiscount} 
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Apply Discount
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}