// src/app/dashboard/inventory/types/AddMedicineTypeModal.tsx
'use client';

import { useState } from 'react';
import { medicineTypeService } from '@/services/medicineTypeService';
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
import { Loader2 } from "lucide-react";

interface AddMedicineTypeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMedicineTypeModal({ onClose, onSuccess }: AddMedicineTypeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    defaultUnit: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await medicineTypeService.create(formData);
      onSuccess();
    } catch (error) {
      console.error("Error adding medicine type:", error);
      // You could add error handling/notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Medicine Type</DialogTitle>
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
                    disabled={loading}
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
                    disabled={loading}
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
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Add Type"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}