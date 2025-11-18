// src/app/dashboard/inventory/types/EditMedicineTypeModal.tsx
'use client';

import { useState } from 'react';
import { medicineTypeService } from '@/services/medicineTypeService';
import { MedicineTypeModel } from '@/types/inventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EditMedicineTypeModalProps {
  type: MedicineTypeModel;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditMedicineTypeModal({ type, onClose, onSuccess }: EditMedicineTypeModalProps) {
  const [formData, setFormData] = useState({
    name: type.name,
    defaultUnit: type.defaultUnit
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type.id) {
      await medicineTypeService.update(type.id, formData);
      onSuccess();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Medicine Type</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Type Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultUnit">Default Unit *</Label>
                  <Input
                    id="defaultUnit"
                    required
                    value={formData.defaultUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultUnit: e.target.value }))}
                    placeholder="e.g. tablets, ml, g, etc."
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be used when measuring items of this type
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}