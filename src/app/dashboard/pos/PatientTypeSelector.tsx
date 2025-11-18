// src/app/dashboard/pos/PatientTypeSelector.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { User, Plane, Lock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { PatientType } from '@/types/sale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PatientTypeSelectorProps {
  selectedType: PatientType;
  onSelectType: (type: PatientType) => void;
  disabled?: boolean; // Add disabled prop
  disabledReason?: string; // Optional reason for being disabled
}

export function PatientTypeSelector({ 
  selectedType, 
  onSelectType,
  disabled = false,
  disabledReason = "Patient type cannot be changed once items are added to cart"
}: PatientTypeSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm font-medium mr-2">Patient Type:</div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant={selectedType === 'local' ? "default" : "outline"}
                size="sm"
                className={selectedType === 'local' ? "bg-blue-600 hover:bg-blue-700" : ""}
                onClick={() => !disabled && onSelectType('local')}
                disabled={disabled}
              >
                <User className="h-4 w-4 mr-2" />
                Local
                {selectedType === 'local' && (
                  <Badge variant="secondary" className="ml-2 bg-blue-700 text-white">
                    Fixed Price
                  </Badge>
                )}
                {disabled && selectedType !== 'local' && (
                  <Lock className="h-3 w-3 ml-2 text-gray-400" />
                )}
              </Button>
            </div>
          </TooltipTrigger>
          {disabled && selectedType !== 'local' && (
            <TooltipContent side="bottom">
              <p>{disabledReason}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant={selectedType === 'foreign' ? "default" : "outline"}
                size="sm"
                className={selectedType === 'foreign' ? "bg-amber-600 hover:bg-amber-700" : ""}
                onClick={() => !disabled && onSelectType('foreign')}
                disabled={disabled}
              >
                <Plane className="h-4 w-4 mr-2" />
                Foreign
                {selectedType === 'foreign' && (
                  <Badge variant="secondary" className="ml-2 bg-amber-700 text-white">
                    Adjustable Price
                  </Badge>
                )}
                {disabled && selectedType !== 'foreign' && (
                  <Lock className="h-3 w-3 ml-2 text-gray-400" />
                )}
              </Button>
            </div>
          </TooltipTrigger>
          {disabled && selectedType !== 'foreign' && (
            <TooltipContent side="bottom">
              <p>{disabledReason}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}