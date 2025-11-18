import React from 'react';
import { Button } from "@/components/ui/button";
import { FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Sale } from '@/types/sale';

interface ExportSalesButtonProps {
  sales: Sale[];
  isFiltered: boolean;
  allSales: Sale[];
}

const ExportSalesButton = ({ sales, isFiltered, allSales }: ExportSalesButtonProps) => {
  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  const prepareExcelData = (salesData: Sale[]) => {
    return salesData.map(sale => ({
      'Sale ID': sale.id,
      'Date': formatDate(sale.saleDate),
      'Customer Name': sale.customer?.name || 'Walk-in Customer',
      'Customer Mobile': sale.customer?.mobile || '-',
      'Customer Address': sale.customer?.address || '-',
      'Total Amount': `Rs${sale.totalAmount.toFixed(2)}`,
      'Total Cost': `Rs${sale.totalCost.toFixed(2)}`,
      'Profit': `Rs${(sale.totalAmount - sale.totalCost).toFixed(2)}`,
      'Profit Margin': `${((sale.totalAmount - sale.totalCost) / sale.totalAmount * 100).toFixed(1)}%`,
      'Items Count': sale.items.length,
      'Items Details': sale.items.map(item => 
        `${item.item.name} (${item.unitQuantity} units${item.subUnitQuantity ? ` + ${item.subUnitQuantity} ${item.item.unitContains?.unit || ''}` : ''}) - Rs${item.totalPrice.toFixed(2)}`
      ).join('\n'),
      'Created At': formatDate(sale.createdAt),
      'Updated At': formatDate(sale.updatedAt)
    }));
  };

  const handleExport = () => {
    const dataToExport = isFiltered ? sales : allSales;
    const data = prepareExcelData(dataToExport);
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, 
        ...data.map(row => String(row[key]).length))
    }));
    ws['!cols'] = colWidths;

    // Export the file
    XLSX.writeFile(wb, `sales_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport}
      className="gap-2"
    >
      <FileDown className="h-4 w-4" />
      Export {isFiltered ? 'Filtered' : 'All'} Sales
    </Button>
  );
};

export default ExportSalesButton;