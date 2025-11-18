// src/app/dashboard/customers/ImportCustomers.tsx
import React, { useState, useRef } from 'react';
import { customerService, CustomerExistsError } from '@/services/customerService';
import Papa from 'papaparse';
import { Customer } from '@/types/customer';
import { Loader2, Upload, X, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ImportCustomersProps {
  onSuccess: () => void;
  onClose: () => void;
}

interface CSVRow {
  Name?: string;
  'Business Name'?: string;
  Mobile?: string;
  Address?: string;
  Discount?: string;
  'Discount Percentage'?: string;
  'Loyalty Gold'?: string;
  'Alagies 1'?: string;
  'Alagies 2'?: string;
  'Alagies 4'?: string;
  'Alagies 6'?: string;
  [key: string]: string | undefined;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  duplicates: string[];
  errors: string[];
}

export default function ImportCustomers({ onSuccess, onClose }: ImportCustomersProps) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult>({
    total: 0,
    success: 0,
    failed: 0,
    duplicates: [],
    errors: []
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processCustomer = (row: CSVRow): Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> => {
    // Check for discount percentage in different possible column names
    let discountPercentage = 0;
    if (row.Discount) {
      // Remove any % symbol and convert to number
      discountPercentage = parseFloat(row.Discount.replace('%', '')) || 0;
    } else if (row['Discount Percentage']) {
      discountPercentage = parseFloat(row['Discount Percentage'].replace('%', '')) || 0;
    }

    return {
      name: row.Name || row['Business Name'] || '',
      mobile: row.Mobile?.toString() || '',
      address: row.Address || '',
      discountPercentage: discountPercentage,
      customerType: 'Regular Customer' as const,
      loyaltyPoints: parseInt(row['Loyalty Gold'] || '0') || 0,
      allergies: [row['Alagies 1'], row['Alagies 2'], row['Alagies 4'], row['Alagies 6']]
        .filter((allergy): allergy is string => Boolean(allergy))
        .join(', '),
    };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    parseAndImportFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      parseAndImportFile(file);
    }
  };

  const parseAndImportFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }

    setImporting(true);
    setError('');
    
    // Reset import results
    setImportResult({
      total: 0,
      success: 0,
      failed: 0,
      duplicates: [],
      errors: []
    });

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            setError(`Error parsing CSV: ${results.errors[0].message}`);
            setImporting(false);
            return;
          }

          const validRows = results.data.filter(row => 
            (row.Name || row['Business Name']) && row.Mobile
          );
          
          if (validRows.length === 0) {
            setError('No valid customer data found in CSV file.');
            setImporting(false);
            return;
          }
          
          setProgress({ current: 0, total: validRows.length });
          
          const result: ImportResult = {
            total: validRows.length,
            success: 0,
            failed: 0,
            duplicates: [],
            errors: []
          };
          
          for (let i = 0; i < validRows.length; i++) {
            const customerData = processCustomer(validRows[i]);
            try {
              await customerService.create(customerData);
              result.success++;
            } catch (err) {
              result.failed++;
              if (err instanceof CustomerExistsError) {
                result.duplicates.push(customerData.name);
              } else {
                result.errors.push(`Error importing ${customerData.name}: ${err instanceof Error ? err.message : String(err)}`);
                console.error(`Error importing customer ${customerData.name}:`, err);
              }
            }
            setProgress(prev => ({ ...prev, current: i + 1 }));
          }
          
          setImportResult(result);
          setImportComplete(true);
          
          if (result.success > 0) {
            setTimeout(() => {
              onSuccess();
            }, 3000);
          }
        } catch (error) {
          setError('Error processing file: ' + (error instanceof Error ? error.message : String(error)));
          setImporting(false);
        }
      },
      error: (error: Papa.ParseError) => {
        setError('Error parsing CSV: ' + error.message);
        setImporting(false);
      }
    });
  };

  const renderImportSummary = () => {
    const { total, success, failed, duplicates, errors } = importResult;
    
    return (
      <div className="py-6 px-2">
        <div className="mx-auto rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mb-4">
          <Info className="h-8 w-8 text-blue-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-center text-gray-900 mb-4">Import Summary</h3>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold">{total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Imported</p>
              <p className="text-xl font-bold text-green-600">{success}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-xl font-bold text-red-600">{failed}</p>
            </div>
          </div>
        </div>
        
        {duplicates.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-red-600 mb-2">Duplicate Customers ({duplicates.length})</h4>
            <div className="max-h-32 overflow-y-auto bg-red-50 rounded-lg p-3">
              <ul className="text-sm space-y-1">
                {duplicates.map((name, index) => (
                  <li key={index} className="text-red-700">{name} - already exists</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {errors.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-red-600 mb-2">Other Errors ({errors.length})</h4>
            <div className="max-h-32 overflow-y-auto bg-red-50 rounded-lg p-3">
              <ul className="text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-red-700">{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        <div className="text-center mt-6">
          <Button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl overflow-hidden p-0">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 py-6 px-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-xl">Import Customers</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              disabled={importing}
              className="h-8 w-8 rounded-full text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-blue-200 mt-1">
            Upload a CSV file to import multiple customers at once.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error Importing Customers</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
          
          {importComplete ? (
            renderImportSummary()
          ) : importing ? (
            <div className="py-8">
              <div className="flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              </div>
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Importing Customers</h3>
                <p className="text-gray-500 mt-1">
                  {progress.current} of {progress.total} customers processed
                </p>
              </div>
              <Progress 
                value={(progress.current / progress.total) * 100} 
                className="h-2 bg-gray-100"
              />
              <p className="text-xs text-gray-400 text-center mt-2">
                Please don't close this window until the import is complete.
              </p>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${isDragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mx-auto rounded-full bg-blue-50 w-16 h-16 flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-blue-500" />
                </div>
                
                {fileName ? (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-blue-600">{fileName}</span>
                    </div>
                    <p className="text-sm text-gray-500">Click to select a different file</p>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
                    <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
                    <Button 
                      variant="outline" 
                      className="mx-auto rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                    </Button>
                  </>
                )}
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">CSV Format Guidelines:</h4>
                <ul className="text-sm text-gray-500 space-y-1 list-disc pl-5">
                  <li>The CSV file must include 'Name' or 'Business Name' columns</li>
                  <li>Mobile numbers are required for each customer</li>
                  <li>You can include a 'Discount' or 'Discount Percentage' column</li>
                  <li>Address field is optional but recommended</li>
                  <li>Each row represents a single customer record</li>
                  <li><span className="text-blue-600 font-medium">Note:</span> Customers with already existing names will be skipped</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}