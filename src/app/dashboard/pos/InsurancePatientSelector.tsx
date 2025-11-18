// src/app/dashboard/pos/InsurancePatientSelector.tsx
import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, InfoIcon } from 'lucide-react';
import { motion } from "framer-motion";

interface InsurancePatientSelectorProps {
  isInsurancePatient: boolean;
  onToggleInsurance: (isInsurance: boolean) => void;
}

export function InsurancePatientSelector({
  isInsurancePatient,
  onToggleInsurance
}: InsurancePatientSelectorProps) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch 
            id="insurance-mode" 
            checked={isInsurancePatient} 
            onCheckedChange={onToggleInsurance}
          />
          <label 
            htmlFor="insurance-mode" 
            className="text-sm font-medium cursor-pointer"
          >
            Insurance Patient
          </label>
        </div>
        {isInsurancePatient && (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Stethoscope className="h-3 w-3 mr-1" />
            Zero profit
          </Badge>
        )}
      </div>
      
      {isInsurancePatient && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-50 border border-purple-200 rounded p-3 mt-2 text-xs text-purple-700 flex items-start gap-2"
        >
          <InfoIcon className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Insurance Patient Selected</p>
            <p className="mt-1">
              Sale profit will be set to zero and selling price will match cost price for accounting purposes.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}