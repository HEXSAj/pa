import React from 'react';
import { InventoryItem } from '@/types/inventory';
import { BatchWithDetails } from '@/types/purchase';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExcelExportProps {
  inventory: InventoryItem[];
  batches: { [key: string]: BatchWithDetails[] };
}

type ExportOption = 'all' | 'noPrices' | 'costOnly' | 'sellingOnly';

const ExcelExport = ({ inventory, batches }: ExcelExportProps) => {
  const [exportOption, setExportOption] = React.useState<ExportOption>('all');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '-';
    return amount.toFixed(2);
  };

  const getStatus = (expiryDate: Date) => {
    const today = new Date();
    const monthsUntilExpiry = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (expiryDate < today) {
      return 'Expired';
    }
    if (monthsUntilExpiry <= 3) {
      return 'Expiring Soon';
    }
    return 'Valid';
  };

  const prepareExcelData = () => {
    const data: any[] = [];

    // Add header row based on export option
    const headers = [
      'Item Code',
      'Item Name',
      'Type',
      'Contains Per Unit',
      'Batch Number',
      'Purchase Date',
      'Expiry Date',
      'Status',
      'Available Units',
      'Available Total Quantity',
      'Supplier Name',
      'Supplier Contact'
    ];

    if (exportOption === 'all' || exportOption === 'costOnly') {
      headers.push('Cost Price/Unit');
    }
    if (exportOption === 'all' || exportOption === 'sellingOnly') {
      headers.push('Selling Price/Unit');
      headers.push('Margin %');
    }

    data.push(headers);

    // Add data rows
    inventory.forEach(item => {
      const itemBatches = batches[item.id!] || [];
      
      if (itemBatches.length === 0) {
        // Add a row for items with no batches
        const row = [
          item.code,
          item.name,
          item.type,
          item.unitContains ? `${item.unitContains.value} ${item.unitContains.unit}` : '-',
          '-',
          '-',
          '-',
          '-',
          '0',
          '0',
          '-',
          '-'
        ];

        if (exportOption === 'all' || exportOption === 'costOnly') {
          row.push('-');
        }
        if (exportOption === 'all' || exportOption === 'sellingOnly') {
          row.push('-');
          row.push('-');
        }

        data.push(row);
      } else {
        // Add rows for each batch
        itemBatches.forEach(batch => {
          const availableUnits = item.unitContains
            ? Math.floor(batch.quantity / item.unitContains.value)
            : batch.quantity;

          const marginPercentage = batch.costPrice && batch.unitPrice
            ? ((batch.unitPrice - batch.costPrice) / batch.costPrice * 100).toFixed(1)
            : '-';

          const row = [
            item.code,
            item.name,
            item.type,
            item.unitContains ? `${item.unitContains.value} ${item.unitContains.unit}` : '-',
            batch.batchNumber,
            formatDate(batch.createdAt),
            formatDate(batch.expiryDate),
            getStatus(batch.expiryDate),
            availableUnits.toString(),
            batch.quantity + (item.unitContains ? ` ${item.unitContains.unit}` : ' units'),
            batch.supplier?.name || '-',
            batch.supplier?.phone || '-'
          ];

          if (exportOption === 'all' || exportOption === 'costOnly') {
            row.push(formatCurrency(batch.costPrice));
          }
          if (exportOption === 'all' || exportOption === 'sellingOnly') {
            row.push(formatCurrency(batch.unitPrice));
            row.push(marginPercentage);
          }

          data.push(row);
        });
      }
    });

    return data;
  };

  const exportToExcel = () => {
    const data = prepareExcelData();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const columnWidths = data[0].map((_, i) => ({ wch: 15 }));
    ws['!cols'] = columnWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `inventory_stock_${date}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={exportOption}
        onValueChange={(value: ExportOption) => setExportOption(value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select export option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Export All Details</SelectItem>
          <SelectItem value="noPrices">Export Without Prices</SelectItem>
          <SelectItem value="costOnly">Export with Cost Price Only</SelectItem>
          <SelectItem value="sellingOnly">Export with Selling Price Only</SelectItem>
        </SelectContent>
      </Select>

      <Button
        onClick={exportToExcel}
        variant="outline"
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export Excel
      </Button>
    </div>
  );
};

export default ExcelExport;