// src/app/dashboard/inventory/types/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { medicineTypeService } from '@/services/medicineTypeService';
import { MedicineTypeModel } from '@/types/inventory';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MedicineTypesTable from './MedicineTypesTable';
import AddMedicineTypeModal from './AddMedicineTypeModal';
import EditMedicineTypeModal from './EditMedicineTypeModal';

export default function MedicineTypesPage() {
  const { userRole } = useAuth();
  const canManageTypes = userRole === 'admin' || userRole === 'doctor';
  
  const [types, setTypes] = useState<MedicineTypeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<MedicineTypeModel | null>(null);

  const loadTypes = async () => {
    try {
      setLoading(true);
      const data = await medicineTypeService.getAll();
      setTypes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const handleDelete = async (id: string) => {
    await medicineTypeService.delete(id);
    setShowDeleteDialog(false);
    setSelectedType(null);
    await loadTypes();
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-6 h-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/inventory">
              <Button variant="ghost" size="sm" className="gap-1 hover:bg-gray-100 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Inventory
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Medicine Types</h1>
            
            {/* User role badge */}
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 capitalize">
              {userRole || 'User'} Access
            </Badge>
          </div>
          {canManageTypes && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Type
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <MedicineTypesTable
            types={types}
            canManage={canManageTypes}
            onEdit={(type) => {
              setSelectedType(type);
              setShowEditModal(true);
            }}
            onDelete={(type) => {
              setSelectedType(type);
              setShowDeleteDialog(true);
            }}
          />
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddMedicineTypeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadTypes();
          }}
        />
      )}

      {showEditModal && selectedType && (
        <EditMedicineTypeModal
          type={selectedType}
          onClose={() => {
            setShowEditModal(false);
            setSelectedType(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedType(null);
            loadTypes();
          }}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <span className="font-medium">{selectedType?.name}</span> from the system.
              <br /><br />
              <strong className="text-red-600">Warning:</strong> If any inventory items are using this type, 
              they may display incorrectly after deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedType?.id && handleDelete(selectedType.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}