// src/app/dashboard/inventory/ExcelInventoryImport.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { inventoryService } from '@/services/inventoryService';
import { categoryService } from '@/services/categoryService';
import { medicineTypeService } from '@/services/medicineTypeService';
import { Category, MedicineTypeModel } from '@/types/inventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  FileSpreadsheet,
  Check,
  X,
  AlertTriangle,
  Info,
  Upload,
  TagIcon,
  Pill,
  Tag,
  Package
} from 'lucide-react';
import { toast } from "sonner";

interface ExcelInventoryImportProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedInventoryItem {
  // Excel columns
  genericName: string;
  tradeName: string;
  type: string;
  category: string;
  minStockLevel: number;
  
  // Additional properties
  categoryId?: string;
  categoryColor?: string;
  typeExists: boolean;
  categoryExists: boolean;
  
  // UI state
  selected: boolean;
  valid: boolean;
  error?: string;
}

const ExcelInventoryImport: React.FC<ExcelInventoryImportProps> = ({ onClose, onImportComplete }) => {
  // State for data and progress
  const [loading, setLoading] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'items' | 'import'>('upload');
  
  const [existingCategories, setExistingCategories] = useState<Category[]>([]);
  const [existingTypes, setExistingTypes] = useState<MedicineTypeModel[]>([]);
  
  const [parsedItems, setParsedItems] = useState<ParsedInventoryItem[]>([]);
  
  const [selectAll, setSelectAll] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInvalidItems, setFilterInvalidItems] = useState(false);
  
  const [isImporting, setIsImporting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [importResults, setImportResults] = useState({
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0
  });
  
  // Default units for types not found
  const [defaultUnit, setDefaultUnit] = useState('tablets');
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing data on component mount
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [categoriesData, typesData] = await Promise.all([
          categoryService.getAll(),
          medicineTypeService.getAll()
        ]);
        
        setExistingCategories(categoriesData);
        setExistingTypes(typesData);
      } catch (error) {
        console.error("Error loading reference data:", error);
        toast.error("Failed to load reference data");
      }
    };
    
    loadReferenceData();
  }, []);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setLoading(true);
      const file = files[0];
      processExcelFile(file);
    }
  };

  // Handle drag/drop
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      setLoading(true);
      const file = files[0];
      processExcelFile(file);
    }
  };

  // Process the Excel file
  const processExcelFile = async (file: File) => {
    try {
      setFileSelected(true);
      
      // Read the file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (!e.target?.result) {
            throw new Error("Failed to read file");
          }
          
          const data = e.target.result;
          const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true
          });
          
          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          
          // Find column names (they could be different in different Excel files)
          let genericNameCol = '';
          let tradeNameCol = '';
          let typeCol = '';
          let categoryCol = '';
          let minStockLevelCol = '';
          
          // Try to detect column names from the first row
          if (jsonData.length > 0) {
            const firstRow = jsonData[0] as any;
            const keys = Object.keys(firstRow);
            
            // Look for likely column names
            for (const key of keys) {
              const lowerKey = key.toLowerCase();
              if (lowerKey.includes('generic') || lowerKey === 'generic name') {
                genericNameCol = key;
              }
              if (lowerKey.includes('trade') || lowerKey === 'trade name') {
                tradeNameCol = key;
              }
              if (lowerKey.includes('type') || lowerKey === 'medicine type') {
                typeCol = key;
              }
              if (lowerKey.includes('category') || lowerKey === 'med category') {
                categoryCol = key;
              }
              if (lowerKey.includes('min') || lowerKey.includes('stock') || lowerKey === 'minimum stock level') {
                minStockLevelCol = key;
              }
            }
          }
          
          // If column names not found by header names, use positional approach
          if (!genericNameCol || !tradeNameCol || !typeCol || !categoryCol) {
            console.log("Using positional approach for columns");
            
            // Try to get column references (A, B, C, etc or __EMPTY_0, __EMPTY_1, etc)
            if (jsonData.length > 0) {
              const firstRow = jsonData[0] as any;
              const keys = Object.keys(firstRow);
              
              // Based on your description of the Excel structure:
              // A column: Generic Name
              genericNameCol = keys[0] || '';
              
              // B column: Trade Name
              tradeNameCol = keys[1] || '';
              
              // C column: Type
              typeCol = keys[2] || '';
              
              // D column: Category
              categoryCol = keys[3] || '';
              
              // E column: Minimum Stock Level
              minStockLevelCol = keys[4] || '';
            }
          }
          
          console.log("Column mapping:", { 
            genericNameCol, 
            tradeNameCol, 
            typeCol, 
            categoryCol, 
            minStockLevelCol 
          });
          
          // Extract inventory items
          const items: ParsedInventoryItem[] = [];
          
          jsonData.forEach((row: any) => {
            // Skip empty rows or header rows
            if (!row || Object.keys(row).length < 3) return;
            
            // Try to extract values from the row
            const genericName = String(row[genericNameCol] || '').trim();
            const tradeName = String(row[tradeNameCol] || genericName || '').trim();
            const type = String(row[typeCol] || '').trim();
            const category = String(row[categoryCol] || '').trim();
            const minStockLevelStr = String(row[minStockLevelCol] || '0').trim();
            
            // Parse min stock level, default to 0 if invalid
            let minStockLevel = 0;
            try {
              minStockLevel = parseInt(minStockLevelStr) || 0;
            } catch (e) {
              minStockLevel = 0;
            }
            
            // Skip rows with missing essential data
            if (!genericName || !type) return;
            
            // Check if type and category exist
            const typeExists = existingTypes.some(t => 
              t.name.toLowerCase() === type.toLowerCase()
            );
            
            const categoryExists = existingCategories.some(c => 
              c.name.toLowerCase() === category.toLowerCase()
            );
            
            // Find category ID and color if it exists
            let categoryId: string | undefined;
            let categoryColor: string | undefined;
            
            if (category) {
              const existingCategory = existingCategories.find(c => 
                c.name.toLowerCase() === category.toLowerCase()
              );
              
              if (existingCategory) {
                categoryId = existingCategory.id;
                categoryColor = existingCategory.color;
              }
            }
            
            // Create item object
            const item: ParsedInventoryItem = {
              genericName,
              tradeName,
              type,
              category,
              minStockLevel,
              categoryId,
              categoryColor,
              typeExists,
              categoryExists,
              selected: true,
              valid: typeExists && (category ? categoryExists : true) // Valid if type exists and category (if provided) exists
            };
            
            // Add validation error message if needed
            if (!item.valid) {
              const errors = [];
              if (!typeExists) errors.push(`Type "${type}" not found`);
              if (category && !categoryExists) errors.push(`Category "${category}" not found`);
              item.error = errors.join(', ');
            }
            
            items.push(item);
          });
          
          // Filter out items with missing essential data
          const validItems = items.filter(item => item.genericName && item.type);
          
          setParsedItems(validItems);
          
          // Set initial import results
          setImportResults({
            total: validItems.length,
            success: 0,
            failed: 0,
            skipped: 0
          });
          
          // Switch to items tab if items were found
          if (validItems.length > 0) {
            setActiveTab('items');
            toast.success(`Found ${validItems.length} items in the Excel file`);
          } else {
            toast.error("No valid items found in the Excel file");
          }
          
        } catch (error) {
          console.error("Error processing Excel file:", error);
          toast.error("Failed to process Excel file");
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        toast.error("Error reading the file");
        setLoading(false);
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      console.error("Error processing Excel file:", error);
      toast.error("Failed to process Excel file");
      setLoading(false);
    }
  };

  // Handle selection changes
  const handleItemSelectionChange = (index: number, checked: boolean) => {
    const updatedItems = [...parsedItems];
    updatedItems[index].selected = checked;
    setParsedItems(updatedItems);
  };

  // Handle select all
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    const updatedItems = parsedItems.map(item => ({
      ...item,
      selected: checked && 
                (!filterInvalidItems || item.valid) &&
                (searchQuery.trim() === '' || 
                  item.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.category.toLowerCase().includes(searchQuery.toLowerCase()))
    }));
    setParsedItems(updatedItems);
  };

  // Filter change handler
  const handleFilterInvalidItemsChange = (checked: boolean) => {
    setFilterInvalidItems(checked);
    if (checked) {
      // Deselect invalid items
      const updatedItems = parsedItems.map(item => ({
        ...item,
        selected: item.valid && item.selected
      }));
      setParsedItems(updatedItems);
    }
  };

  // Get filtered items
  const getFilteredItems = () => {
    return parsedItems.filter(item => {
      const matchesSearch = searchQuery.trim() === '' || 
        item.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const passesValidFilter = !filterInvalidItems || item.valid;
      
      return matchesSearch && passesValidFilter;
    });
  };

  // Start the import process
  const startImport = async () => {
    const selectedItems = parsedItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      toast.error("No items selected for import");
      return;
    }
    
    setIsImporting(true);
    setProgress(0);
    setActiveTab('import');
    
    const results = {
      total: selectedItems.length,
      success: 0,
      failed: 0,
      skipped: 0
    };
    
    // Process items one by one
    for (let i = 0; i < selectedItems.length; i++) {
      try {
        const item = selectedItems[i];
        
        // Skip invalid items
        if (!item.valid) {
          results.skipped++;
          continue;
        }
        
        // Create the inventory item
        await inventoryService.create({
          code: '', // Will be auto-generated by the service
          name: item.tradeName,
          genericName: item.genericName,
          type: item.type,
          categoryId: item.categoryId,
          categoryName: item.category,
          hasUnitContains: false, // Default to false, can be updated later
          minQuantity: item.minStockLevel
        });
        
        results.success++;
      } catch (error) {
        console.error("Import error:", error);
        results.failed++;
      }
      
      // Update progress
      const newProgress = Math.floor(((i + 1) / selectedItems.length) * 100);
      setProgress(newProgress);
      
      // Update results periodically
      if (i % 5 === 0 || i === selectedItems.length - 1) {
        setImportResults({...results});
        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    setImportResults(results);
    setIsImporting(false);
    setShowResults(true);
  };

  // Handle import completion
  const handleImportComplete = () => {
    onImportComplete();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Inventory Items from Excel
          </DialogTitle>
          <DialogDescription>
            Import inventory items from your Excel file with Generic Name, Trade Name, Type, Category, and Minimum Stock Level
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="mb-4">
            <div className="flex space-x-2">
              <Button 
                variant={activeTab === 'upload' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('upload')}
                className="flex-1"
              >
                1. Upload File
              </Button>
              <Button 
                variant={activeTab === 'items' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('items')}
                disabled={parsedItems.length === 0}
                className="flex-1"
              >
                2. Review Items ({parsedItems.length})
              </Button>
              <Button 
                variant={activeTab === 'import' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('import')}
                disabled={!fileSelected || isImporting}
                className="flex-1"
              >
                3. Import
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            {activeTab === 'upload' && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Excel File</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="border-2 border-dashed rounded-md p-10 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                    />
                    
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-32">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                        <p className="text-gray-500">Processing Excel file...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          Upload Excel File
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          Drag and drop your file here, or click to browse
                        </p>
                        <p className="text-xs text-gray-400">
                          Supports .xlsx, .xls, and .csv files
                        </p>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-base font-medium mb-2">Expected Excel Format</h3>
                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-blue-600 mb-2">
                            Your Excel file should have the following columns:
                          </p>
                          <ul className="list-disc ml-5 text-sm text-blue-600">
                            <li>Column A: Generic Name (required)</li>
                            <li>Column B: Trade Name (will use Generic Name if empty)</li>
                            <li>Column C: Type (required, must exist in your system)</li>
                            <li>Column D: Category (optional, must exist in your system if provided)</li>
                            <li>Column E: Minimum Stock Level (number, defaults to 0 if invalid)</li>
                          </ul>
                          <p className="text-sm text-blue-600 mt-2">
                            Item codes will be automatically generated for each imported item.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {fileSelected && parsedItems.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <h3 className="text-base font-medium mb-2">Analysis Results</h3>
                      <p className="mb-3">
                        Found <span className="font-medium">{parsedItems.length}</span> inventory items in your Excel file.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Valid items: <span className="text-green-600">{parsedItems.filter(i => i.valid).length}</span></p>
                          <p className="text-sm font-medium">Invalid items: <span className="text-red-600">{parsedItems.filter(i => !i.valid).length}</span></p>
                        </div>
                        <div>
                          <Button 
                            onClick={() => setActiveTab('items')} 
                            className="w-full"
                          >
                            Review Items
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'items' && (
              <>
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between items-center">
                      <span>Items Found</span>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="select-all" 
                            checked={selectAll}
                            onCheckedChange={handleSelectAllChange}
                          />
                          <Label htmlFor="select-all">Select All</Label>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                      <div>
                        <Label htmlFor="search">Search items</Label>
                        <Input 
                          id="search" 
                          placeholder="Search by name, type, or category..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex flex-col justify-end">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="filter-invalid" 
                            checked={filterInvalidItems}
                            onCheckedChange={handleFilterInvalidItemsChange}
                          />
                          <Label htmlFor="filter-invalid">Filter out invalid items</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-md mb-4">
                      <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-blue-600">
                            Items are marked as invalid if their Type or Category does not exist in your system.
                            You need to create the missing Types and Categories first before importing these items.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="rounded-md border overflow-auto max-h-[400px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white z-10">
                          <TableRow>
                            <TableHead className="w-[60px]">Import</TableHead>
                            <TableHead>Generic Name</TableHead>
                            <TableHead>Trade Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Min Stock</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getFilteredItems().length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center h-32 text-gray-500">
                                No items match your filters
                              </TableCell>
                            </TableRow>
                          ) : (
                            getFilteredItems().map((item, index) => {
                              const originalIndex = parsedItems.findIndex(i => 
                                i.genericName === item.genericName && 
                                i.tradeName === item.tradeName
                              );
                              return (
                                <TableRow key={index} className={!item.valid ? "bg-red-50" : ""}>
                                  <TableCell>
                                    <Checkbox 
                                      checked={item.selected}
                                      onCheckedChange={(checked) => 
                                        handleItemSelectionChange(originalIndex, checked as boolean)
                                      }
                                      disabled={!item.valid}
                                    />
                                  </TableCell>
                                  <TableCell>{item.genericName}</TableCell>
                                  <TableCell>{item.tradeName}</TableCell>
                                  <TableCell>
                                    {item.typeExists ? (
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        {item.type}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-red-50 text-red-700">
                                        {item.type} (Not found)
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {!item.category ? (
                                      <span className="text-gray-400">-</span>
                                    ) : item.categoryExists ? (
                                      <div className="flex items-center gap-1.5">
                                        {item.categoryColor && (
                                          <div
                                            className="w-2.5 h-2.5 rounded-full" 
                                            style={{ backgroundColor: item.categoryColor }}
                                          />
                                        )}
                                        <span>{item.category}</span>
                                      </div>
                                    ) : (
                                      <Badge variant="outline" className="bg-red-50 text-red-700">
                                        {item.category} (Not found)
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.minStockLevel}
                                  </TableCell>
                                  <TableCell>
                                    {item.valid ? (
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        Valid
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-red-50 text-red-700" title={item.error}>
                                        Invalid
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="text-sm text-gray-500 p-4 flex items-center justify-between">
                      <span>
                        Showing {getFilteredItems().length} of {parsedItems.length} items
                      </span>
                      <span>
                        {parsedItems.filter(item => item.selected).length} items selected for import
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('upload')}
                  >
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab('import')}>
                    Continue to Import
                  </Button>
                </div>
              </>
            )}
            
            {activeTab === 'import' && (
              <>
                {isImporting ? (
                  <div className="space-y-6">
                    <div className="bg-amber-50 p-4 rounded-md">
                      <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                        <p className="text-sm text-amber-600">
                          Import is in progress. Please do not close this window until the import is complete.
                        </p>
                      </div>
                    </div>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>Import Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2 flex justify-between text-sm">
                          <span>Importing items...</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        
                        <div className="mt-6 grid grid-cols-4 gap-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-500">Total</div>
                            <div className="text-xl font-semibold">{importResults.total}</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-sm text-green-600">Success</div>
                            <div className="text-xl font-semibold text-green-600">{importResults.success}</div>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <div className="text-sm text-red-600">Failed</div>
                            <div className="text-xl font-semibold text-red-600">{importResults.failed}</div>
                          </div>
                          <div className="bg-amber-50 p-3 rounded-lg">
                            <div className="text-sm text-amber-600">Skipped</div>
                            <div className="text-xl font-semibold text-amber-600">{importResults.skipped}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : showResults ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Import Complete</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500">Total Items</div>
                          <div className="text-2xl font-bold">{importResults.total}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm text-green-600">Successfully Imported</div>
                          <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="text-sm text-red-600">Failed</div>
                          <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <div className="text-sm text-amber-600">Skipped</div>
                          <div className="text-2xl font-bold text-amber-600">{importResults.skipped}</div>
                        </div>
                      </div>
                      
                      {importResults.success > 0 && (
                        <div className="flex items-center gap-2 p-4 bg-green-50 rounded-md">
                          <Check className="h-5 w-5 text-green-500" />
                          <p className="text-green-700">
                            {importResults.success} items were successfully imported into your inventory.
                          </p>
                        </div>
                      )}
                      
                      {importResults.skipped > 0 && (
                        <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-md">
                          <Info className="h-5 w-5 text-amber-500" />
                          <p className="text-amber-700">
                            {importResults.skipped} items were skipped because they were invalid.
                            Make sure all Types and Categories exist in your system before importing.
                          </p>
                        </div>
                      )}
                      
                      {importResults.failed > 0 && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 rounded-md">
                          <X className="h-5 w-5 text-red-500" />
                          <p className="text-red-700">
                            {importResults.failed} items failed to import. This might be due to
                            server issues or conflicting item codes. Please try again.
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-center">
                        <Button onClick={handleImportComplete}>
                          Complete & Return to Inventory
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Ready to Import</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p className="text-center">
                        You have selected <span className="font-medium">{parsedItems.filter(item => item.selected).length}</span> 
                        {" "}items to import out of {parsedItems.length} total items.
                      </p>
                      
                      <div className="grid md:grid-cols-3 gap-4 mx-auto max-w-3xl">
                        <div className="border rounded-md p-4 text-center">
                          <Package className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                          <div className="text-xl font-medium">{parsedItems.filter(item => item.selected).length}</div>
                          <div className="text-sm text-gray-500">Items Selected</div>
                        </div>
                        
                        <div className="border rounded-md p-4 text-center">
                          <Pill className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <div className="text-xl font-medium">
                            {parsedItems.filter(item => item.selected && item.valid).length}
                          </div>
                          <div className="text-sm text-gray-500">Valid Items</div>
                        </div>
                        
                        <div className="border rounded-md p-4 text-center">
                          <Tag className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                          <div className="text-xl font-medium">Auto</div>
                          <div className="text-sm text-gray-500">Item Codes</div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-md">
                        <div className="flex gap-3">
                          <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-blue-600">
                              <strong>Important information before importing:</strong>
                            </p>
                            <ul className="list-disc ml-5 text-sm text-blue-600 mt-2">
                              <li>Item codes will be automatically generated for each item</li>
                              <li>Only items marked as "Valid" will be imported</li>
                              <li>All items will be created with "Contains per Unit" turned off by default</li>
                              <li>You can edit items after import to add additional details</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab('items')}
                        >
                          Back to Review
                        </Button>
                        
                        <Button
                          onClick={startImport}
                          disabled={parsedItems.filter(item => item.selected && item.valid).length === 0}
                          className="px-8"
                        >
                          Start Import
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            {showResults ? "Cancel" : "Close"}
          </Button>
          {showResults && (
            <Button onClick={handleImportComplete}>
              Complete Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelInventoryImport;