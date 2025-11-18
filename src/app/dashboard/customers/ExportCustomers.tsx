// src/app/dashboard/customers/ExportCustomers.tsx
'use client';

import { useState } from 'react';
import { Customer } from '@/types/customer';
import { Download, FileText, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ExportCustomersProps {
  customers: Customer[];
}

export default function ExportCustomers({ customers }: ExportCustomersProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportCustomers = async () => {
    if (customers.length === 0) {
      toast({
        title: "No customers to export",
        description: "There are no customers in your database to export.",
        variant: "destructive"
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Create a formatted export of customer data
      const exportData = customers.map(customer => {
        return {
          name: customer.name,
          mobile: customer.mobile,
          address: customer.address || 'N/A',
          discountPercentage: `${customer.discountPercentage || 0}%`, // Include discount percentage
          createdAt: new Date(customer.createdAt).toLocaleDateString(),
          updatedAt: new Date(customer.updatedAt).toLocaleDateString(),
          documentName: customer.documentName || 'No document',
          documentText: customer.documentText || 'No content',
          documentUploadedAt: customer.documentUploadedAt 
            ? new Date(customer.documentUploadedAt).toLocaleDateString() 
            : 'N/A'
        };
      });

      // Convert to CSV string
      const csvHeader = Object.keys(exportData[0]).join(',');
      const csvRows = exportData.map(customer => 
        Object.values(customer)
          .map(value => JSON.stringify(value))
          .join(',')
      );
      const csvString = [csvHeader, ...csvRows].join('\n');

      // Generate text format
      const textContent = customers.map(customer => {
        const header = `--- CUSTOMER: ${customer.name} ---\n`;
        const details = [
          `Mobile: ${customer.mobile}`,
          `Discount: ${customer.discountPercentage || 0}%`, // Include discount percentage
          `Address: ${customer.address || 'N/A'}`,
          `Customer Since: ${new Date(customer.createdAt).toLocaleDateString()}`,
          customer.documentName 
            ? `Document: ${customer.documentName} (Uploaded: ${customer.documentUploadedAt 
                ? new Date(customer.documentUploadedAt).toLocaleDateString() 
                : 'N/A'})`
            : 'No Documents',
          customer.documentText 
            ? `\nDocument Content:\n${customer.documentText}\n` 
            : '\nNo Document Content\n'
        ].join('\n');
        
        return header + details + '\n\n';
      }).join('');

      // Create and download CSV file
      const csvBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const csvUrl = URL.createObjectURL(csvBlob);
      const csvLink = document.createElement('a');
      csvLink.href = csvUrl;
      csvLink.setAttribute('download', `customers_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(csvLink);
      csvLink.click();
      document.body.removeChild(csvLink);

      // Create and download text file
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      const textUrl = URL.createObjectURL(textBlob);
      const textLink = document.createElement('a');
      textLink.href = textUrl;
      textLink.setAttribute('download', `customers_documents_${new Date().toISOString().slice(0,10)}.txt`);
      document.body.appendChild(textLink);
      textLink.click();
      document.body.removeChild(textLink);

      toast({
        title: "Export Successful",
        description: `${customers.length} customers have been exported.`,
        action: (
          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        ),
      });
    } catch (error) {
      console.error('Error exporting customers:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your customers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenuItem 
      onClick={exportCustomers} 
      disabled={isExporting || customers.length === 0}
      className="flex items-center cursor-pointer"
    >
      {isExporting ? (
        <>
          <Loader2 className="animate-spin h-4 w-4 mr-2" />
          Exporting...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-2" />
          Export All Customers
        </>
      )}
    </DropdownMenuItem>
  );
}