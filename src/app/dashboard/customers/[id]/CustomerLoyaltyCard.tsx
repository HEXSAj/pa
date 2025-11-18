// src/app/dashboard/customers/[id]/CustomerLoyaltyCard.tsx

import React from 'react';
import { Customer } from '@/types/customer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Award, TrendingUp, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CustomerLoyaltyCardProps {
  customer: Customer;
}

export function CustomerLoyaltyCard({ customer }: CustomerLoyaltyCardProps) {
  const loyaltyPoints = customer.loyaltyPoints || 0;
  const hasPoints = loyaltyPoints > 0;
  
  return (
    <Card className={`border-purple-200 ${hasPoints ? 'bg-purple-50/50' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Award className="h-5 w-5 mr-2 text-purple-500" />
          Loyalty Program
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2">
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Customer earns 0.01 points per Rs 1000 spent</p>
                <p className="text-sm">Points can be redeemed during checkout</p>
                <p className="text-sm">1 point = Rs 1 discount</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Customer loyalty points balance
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Star className="h-5 w-5 text-purple-500 mr-2" />
            <span className="font-medium">Available Points</span>
          </div>
          <Badge className={`text-md px-3 py-1 ${hasPoints ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
            {loyaltyPoints.toFixed(2)}
          </Badge>
        </div>
        
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-4 w-4 text-gray-500 mr-2" />
            <span className="font-medium">Estimated Value</span>
          </div>
          
          <div className="text-2xl font-bold text-purple-700">
            Rs{loyaltyPoints.toFixed(2)}
          </div>
          
          {!hasPoints && (
            <p className="text-sm text-gray-500 mt-3">
              This customer hasn't earned any loyalty points yet. Points are earned from purchases without discounts.
            </p>
          )}
          
          {hasPoints && (
            <p className="text-sm text-purple-600 mt-3">
              These points can be used as a discount on the customer's next purchase.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}