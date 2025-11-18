// src/app/dashboard/inventory/types/MedicineTypesTable.tsx
'use client';

import { MedicineTypeModel } from '@/types/inventory';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MedicineTypesTableProps {
  types: MedicineTypeModel[];
  canManage: boolean;
  onEdit: (type: MedicineTypeModel) => void;
  onDelete: (type: MedicineTypeModel) => void;
}

export default function MedicineTypesTable({ types, canManage, onEdit, onDelete }: MedicineTypesTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Medicine Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type Name</TableHead>
                <TableHead>Default Unit</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    No medicine types found. Add your first type!
                  </TableCell>
                </TableRow>
              ) : (
                types.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.defaultUnit}</TableCell>
                    <TableCell>
                        {type.createdAt && ( 
                            type.createdAt instanceof Date 
                            ? type.createdAt.toLocaleDateString()
                            : type.createdAt.toDate 
                                ? type.createdAt.toDate().toLocaleDateString() 
                                : 'N/A'
                        )}
                        </TableCell>
                    <TableCell className="text-right">
                      {canManage ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(type)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(type)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground italic px-2">
                          View only
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}