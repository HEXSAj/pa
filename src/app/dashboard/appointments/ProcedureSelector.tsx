// src/app/dashboard/appointments/ProcedureSelector.tsx
'use client';

import { useState } from 'react';
import { DoctorProcedure, formatCurrency } from '@/types/doctor';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ProcedureSelectorProps {
  procedures: DoctorProcedure[];
  selectedProcedures: string[];
  onProcedureToggle: (procedureId: string, checked: boolean) => void;
  disabled?: boolean;
}

export function ProcedureSelector({
  procedures,
  selectedProcedures,
  onProcedureToggle,
  disabled = false
}: ProcedureSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter procedures based on search query
  const filteredProcedures = procedures.filter(proc => 
    proc.procedureName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 mb-2">
        <strong>Procedures are optional</strong> - You can select procedures now or enter the amount manually in POS
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search procedures..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          disabled={disabled}
        />
      </div>

      <ScrollArea className="h-[300px] rounded-md border p-4">
        {filteredProcedures.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            {searchQuery.trim() !== '' 
              ? "No procedures found matching your search" 
              : "No procedures available"
            }
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProcedures.map((proc) => (
              <div key={proc.id} className="flex items-start space-x-3 border-b pb-3">
                <Checkbox
                  id={`proc-${proc.id}`}
                  checked={selectedProcedures.includes(proc.id!)}
                  onCheckedChange={(checked) => 
                    onProcedureToggle(proc.id!, checked as boolean)
                  }
                  disabled={disabled}
                />
                <div className="space-y-1 flex-1">
                  <Label
                    htmlFor={`proc-${proc.id}`}
                    className="text-base font-medium leading-none cursor-pointer"
                  >
                    {proc.procedureName}
                  </Label>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">
                    <div className="text-muted-foreground line-clamp-2">
                      {proc.description || 'No description available'}
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-muted-foreground">
                        Doctor: {formatCurrency(proc.doctorCharge)}
                      </span>
                      <span className="font-semibold">
                        Total: {formatCurrency(proc.doctorCharge)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}