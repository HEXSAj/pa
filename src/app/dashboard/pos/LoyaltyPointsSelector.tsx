// src/app/dashboard/pos/LoyaltyPointsSelector.tsx
import React from 'react';
import { Customer } from '@/types/customer';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LoyaltyPointsSelectorProps {
  customer: Customer;
  useLoyaltyPoints: boolean;
  onUseLoyaltyPointsChange: (use: boolean) => void;
  loyaltyDiscount: number;
  cartTotal: number;
}

export function LoyaltyPointsSelector({
  customer,
  useLoyaltyPoints,
  onUseLoyaltyPointsChange,
  loyaltyDiscount,
  cartTotal
}: LoyaltyPointsSelectorProps) {
  // Only show if customer has loyalty points
  if (!customer || !customer.loyaltyPoints || customer.loyaltyPoints <= 0) {
    return null;
  }

  // Calculate the maximum amount of points that can be used
  const maxPointsUsable = Math.min(customer.loyaltyPoints, cartTotal);
  const pointsValue = maxPointsUsable.toFixed(2);
  
  return (
    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 mt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-purple-800">Loyalty Points Available</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-purple-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Each loyalty point equals Rs 1 in discount.</p>
                <p className="text-sm">Points are earned at a rate of 0.01 per Rs 1000 spent.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Badge className="bg-purple-100 text-purple-800 border-0">
          {customer.loyaltyPoints.toFixed(2)} points
        </Badge>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <Switch 
            id="use-loyalty-points"
            checked={useLoyaltyPoints}
            onCheckedChange={onUseLoyaltyPointsChange}
          />
          <Label htmlFor="use-loyalty-points" className="text-sm cursor-pointer">
            Apply as discount (up to {pointsValue}pts)
          </Label>
        </div>
        
        {useLoyaltyPoints && (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            -Rs{loyaltyDiscount.toFixed(2)}
          </Badge>
        )}
      </div>
    </div>
  );
}