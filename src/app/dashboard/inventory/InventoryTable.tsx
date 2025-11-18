// src/app/dashboard/inventory/InventoryTable.tsx

import { InventoryItem } from '@/types/inventory';
import { BatchWithDetails } from '@/types/purchase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, TagIcon, Settings } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InventoryTableProps {
  inventory: InventoryItem[];
  batches: { [key: string]: BatchWithDetails[] };
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onViewBatches: (item: InventoryItem) => void;
  onStockAdjustment: (item: InventoryItem) => void;
  isAdmin?: boolean; // Optional flag for role-based actions
}

interface InventoryRowProps {
  item: InventoryItem;
  batches: BatchWithDetails[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onViewBatches: (item: InventoryItem) => void;
  onStockAdjustment: (item: InventoryItem) => void;
  isAdmin?: boolean; // Optional flag for role-based actions
}

const InventoryRow = ({ item, batches, onEdit, onDelete, onViewBatches, onStockAdjustment, isAdmin = true }: InventoryRowProps) => {
  // Calculate total quantity from all batches
  const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  
  // Calculate available units
  const availableUnits = item.unitContains 
    ? Math.floor(totalQuantity / item.unitContains.value)
    : totalQuantity;

  const formatUnitContains = () => {
    if (!item.unitContains) return '-';
    return `${item.unitContains.value} ${item.unitContains.unit}`;
  };

  // Render category with color indicator
  const renderCategory = () => {
    if (!item.categoryId || !item.categoryName) {
      return <span className="text-gray-400">-</span>;
    }
    
    return (
      <div className="flex items-center gap-1.5">
        {item.categoryColor && (
          <div
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: item.categoryColor }}
          />
        )}
        <span>{item.categoryName}</span>
      </div>
    );
  };
  
  // Render trade and generic name with tooltip
  const renderMedicineName = () => {
    // If generic and trade names are different, show both
    if (item.genericName && item.genericName !== item.name) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <div>{item.name}</div>
                <div className="text-xs text-muted-foreground italic truncate max-w-[200px]">
                  {item.genericName}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <strong>Trade Name:</strong> {item.name}<br />
                <strong>Generic Name:</strong> {item.genericName}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // If they're the same, just show the name
    return <span>{item.name}</span>;
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{item.code}</TableCell>
      <TableCell>{renderMedicineName()}</TableCell>
      <TableCell>
        <Badge variant="secondary">
          {item.type}
        </Badge>
      </TableCell>
      <TableCell>{renderCategory()}</TableCell>
      <TableCell>{formatUnitContains()}</TableCell>
      <TableCell className="text-right">
        {availableUnits} {item.unitContains ? 'units' : ''}
      </TableCell>
      <TableCell className="text-right">
        {totalQuantity} {item.unitContains ? item.unitContains.unit : 'units'}
      </TableCell>
      <TableCell className="text-right">
        {item.minQuantity} {item.unitContains ? 'units' : ''}
      </TableCell>
      <TableCell className="text-right">
        {item.unitContains 
          ? `${item.minQuantity * item.unitContains.value} ${item.unitContains.unit}`
          : `${item.minQuantity} units`
        }
      </TableCell>
      <TableCell>
        {availableUnits < item.minQuantity && (
          <Badge variant="destructive">Low Stock</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewBatches(item)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStockAdjustment(item)} // Add this button
          className="h-8 w-8 p-0"
          title="Stock Adjustment"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item)}
          className="h-8 w-8 p-0"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-900"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

const InventoryTable = ({ inventory, batches, onEdit, onDelete, onViewBatches, onStockAdjustment, isAdmin = true }: InventoryTableProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Inventory Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="relative overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 bg-white">Code</TableHead>
                  <TableHead className="sticky top-0 bg-white">Medicine Name</TableHead>
                  <TableHead className="sticky top-0 bg-white">Type</TableHead>
                  <TableHead className="sticky top-0 bg-white">Category</TableHead>
                  <TableHead className="sticky top-0 bg-white">Contains Per Unit</TableHead>
                  <TableHead className="sticky top-0 bg-white text-right">Available Units</TableHead>
                  <TableHead className="sticky top-0 bg-white text-right">Total Quantity</TableHead>
                  <TableHead className="sticky top-0 bg-white text-right">Min Units</TableHead>
                  <TableHead className="sticky top-0 bg-white text-right">Min Total Quantity</TableHead>
                  <TableHead className="sticky top-0 bg-white">Status</TableHead>
                  <TableHead className="sticky top-0 bg-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <InventoryRow 
                    key={item.id} 
                    item={item} 
                    batches={batches[item.id!] || []}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onViewBatches={onViewBatches}
                    onStockAdjustment={onStockAdjustment} 
                    isAdmin={isAdmin}
                  />
                ))}
                {inventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      No inventory items found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryTable;