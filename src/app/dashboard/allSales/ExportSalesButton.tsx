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
    return salesData.map(sale => {
      // Calculate totals for each category
      const inventoryTotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const inventoryCost = sale.items.reduce((sum, item) => sum + item.totalCost, 0);
      const doctorFeesTotal = sale.doctorFees?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const labTestsTotal = sale.laboratoryTests?.reduce((sum, test) => sum + test.price, 0) || 0;

      return {
        'Sale ID': sale.id,
        'Date': formatDate(sale.saleDate),
        'Customer Name': sale.customer?.name || 'Walk-in Customer',
        'Customer Mobile': sale.customer?.mobile || '-',
        'Customer Address': sale.customer?.address || '-',
        
        // Inventory Items
        'Inventory Items Count': sale.items.length,
        'Inventory Items Details': sale.items.map(item => 
          `${item.item.name} (${item.unitQuantity} units${item.subUnitQuantity ? ` + ${item.subUnitQuantity} ${item.item.unitContains?.unit || ''}` : ''}) - Rs${item.totalPrice.toFixed(2)}`
        ).join('\n'),
        'Inventory Total': `Rs${inventoryTotal.toFixed(2)}`,
        'Inventory Cost': `Rs${inventoryCost.toFixed(2)}`,
        'Inventory Profit': `Rs${(inventoryTotal - inventoryCost).toFixed(2)}`,
        
        // Doctor Fees
        'Doctor Fees Count': sale.doctorFees?.length || 0,
        'Doctor Fees Details': sale.doctorFees?.map(fee => 
          `${fee.fee.name} - Rs${fee.amount.toFixed(2)}${fee.fee.description ? ` (${fee.fee.description})` : ''}`
        ).join('\n') || '-',
        'Doctor Fees Total': `Rs${doctorFeesTotal.toFixed(2)}`,
        
        // Laboratory Tests
        'Lab Tests Count': sale.laboratoryTests?.length || 0,
        'Lab Tests Details': sale.laboratoryTests?.map(test => 
          `${test.test.name} - Rs${test.price.toFixed(2)}${test.test.description ? ` (${test.test.description})` : ''}`
        ).join('\n') || '-',
        'Lab Tests Total': `Rs${labTestsTotal.toFixed(2)}`,
        
        // Overall Totals
        'Total Amount': `Rs${sale.totalAmount.toFixed(2)}`,
        'Total Cost': `Rs${sale.totalCost.toFixed(2)}`,
        'Total Profit': `Rs${(sale.totalAmount - sale.totalCost).toFixed(2)}`,
        'Profit Margin': `${((sale.totalAmount - sale.totalCost) / sale.totalAmount * 100).toFixed(1)}%`,
        
        'Created At': formatDate(sale.createdAt),
        'Updated At': formatDate(sale.updatedAt)
      };
    });
  };

  const handleExport = () => {
    const dataToExport = isFiltered ? sales : allSales;
    const data = prepareExcelData(dataToExport);
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(
        key.length, 
        ...data.map(row => {
          const cellValue = String(row[key] || '');
          // For multiline content, get the longest line
          return Math.max(...cellValue.split('\n').map(line => line.length));
        })
      )
    }));
    ws['!cols'] = colWidths;

    // Set row heights for cells with multiline content
    const rowHeights = {};
    data.forEach((row, idx) => {
      const lineCount = Math.max(
        (row['Inventory Items Details'] || '').split('\n').length,
        (row['Doctor Fees Details'] || '').split('\n').length,
        (row['Lab Tests Details'] || '').split('\n').length
      );
      if (lineCount > 1) {
        rowHeights[idx + 1] = { hpt: lineCount * 20 }; // 20 points per line
      }
    });
    ws['!rows'] = rowHeights;

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