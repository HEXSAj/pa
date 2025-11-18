// src/app/dashboard/inventory/ExcelDirectImport.tsx
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
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  FileSpreadsheet,
  Check,
  X,
  AlertTriangle,
  Info,
  Upload,
  HelpCircle,
} from 'lucide-react';
import { toast } from "sonner";

interface ExcelDirectImportProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedItem {
  code: string;
  name: string;
  category: string;
  packSize: number;
  quantity: number;
  erPrice?: number;
  ewPrice?: number;
  lastPurchaseDate?: Date | string;
  age?: string | number;
  selected: boolean;
  rowIndex: number;
  valid: boolean;
  error?: string;
}

interface ImportItem {
  code: string;
  name: string;
  type: string;
  categoryId?: string;
  categoryName?: string;
  hasUnitContains: boolean;
  unitContains?: {
    value: number;
    unit: string;
  };
  minQuantity: number;
}

const ExcelDirectImport: React.FC<ExcelDirectImportProps> = ({ onClose, onImportComplete }) => {
  // State for data and progress
  const [loading, setLoading] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [medicineTypes, setMedicineTypes] = useState<MedicineTypeModel[]>([]);
  const [defaultMedicineType, setDefaultMedicineType] = useState<string>('');
  const [defaultMinQuantity, setDefaultMinQuantity] = useState<number>(10);
  const [defaultUnitType, setDefaultUnitType] = useState<string>('tablets');
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState({
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0
  });
  const [isImporting, setIsImporting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [selectAll, setSelectAll] = useState(true);
  const [filterZeroQuantity, setFilterZeroQuantity] = useState(true);
  const [filterNegativeQuantity, setFilterNegativeQuantity] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load categories and medicine types on component mount
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [categoriesData, typesData] = await Promise.all([
          categoryService.getAll(),
          medicineTypeService.getAll()
        ]);
        
        setCategories(categoriesData);
        setMedicineTypes(typesData);
        
        // Set default medicine type if available
        if (typesData.length > 0) {
          setDefaultMedicineType(typesData[0].name);
          setDefaultUnitType(typesData[0].defaultUnit);
        }
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
          
          // Convert to array of arrays
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          // Parse the inventory items from the data
          const items: ParsedItem[] = [];
          let currentCategory = '';
          
          // Process all rows
          for (let i = 10; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (!row || row.length < 5) continue;
            
            // Check if this is a category row
            if (row[1] && typeof row[1] === 'string' && row[4] && !row[12]) {
              currentCategory = String(row[4]).trim();
              continue;
            }
            
            // Check if this is an item row with enough data
            if (row[1] && row[4] && row[12] !== undefined) {
              // Extract data from row
              const code = String(row[1]).trim();
              const name = String(row[4]).trim();
              const packSize = Number(row[12]) || 1;
              const quantity = Number(row[15]) || 0;
              const erPrice = row[17] !== undefined ? Number(row[17]) : undefined;
              const ewPrice = row[21] !== undefined ? Number(row[21]) : undefined;
              
              // Skip rows with short codes (likely not actual items)
              if (code.length <= 3) continue;
              
              // Create item object
              const item: ParsedItem = {
                code,
                name,
                category: currentCategory,
                packSize,
                quantity,
                erPrice,
                ewPrice,
                lastPurchaseDate: row[25],
                age: row[29],
                selected: true,
                rowIndex: i + 1,
                valid: true
              };
              
              // Apply filters for zero and negative quantities
              if ((filterZeroQuantity && quantity === 0) || 
                  (filterNegativeQuantity && quantity < 0)) {
                item.selected = false;
              }
              
              items.push(item);
            }
          }
          
          setParsedItems(items);
          
          // Set initial import results
          setImportResults({
            total: items.length,
            success: 0,
            failed: 0,
            skipped: 0
          });
          
          // Switch to items tab if items were found
          if (items.length > 0) {
            setActiveTab('items');
            toast.success(`Found ${items.length} items in the Excel file`);
          } else {
            toast.error("No items found in the Excel file");
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

  // Handle item selection change
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
                (!filterZeroQuantity || item.quantity !== 0) && 
                (!filterNegativeQuantity || item.quantity >= 0) &&
                (searchQuery.trim() === '' || 
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.code.toLowerCase().includes(searchQuery.toLowerCase())) &&
                (selectedCategory === 'all' || item.category === selectedCategory)
    }));
    setParsedItems(updatedItems);
  };

  // Filter change handlers
  const handleFilterZeroQuantityChange = (checked: boolean) => {
    setFilterZeroQuantity(checked);
    if (checked) {
      // Deselect items with zero quantity
      const updatedItems = parsedItems.map(item => ({
        ...item,
        selected: item.quantity !== 0 && item.selected
      }));
      setParsedItems(updatedItems);
    }
  };

  const handleFilterNegativeQuantityChange = (checked: boolean) => {
    setFilterNegativeQuantity(checked);
    if (checked) {
      // Deselect items with negative quantity
      const updatedItems = parsedItems.map(item => ({
        ...item,
        selected: item.quantity >= 0 && item.selected
      }));
      setParsedItems(updatedItems);
    }
  };

  // Get filtered items based on search query and category
  const getFilteredItems = () => {
    return parsedItems.filter(item => {
      const matchesSearch = searchQuery.trim() === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        item.category === selectedCategory;
      
      const matchesQuantityFilters = 
        (!filterZeroQuantity || item.quantity !== 0) &&
        (!filterNegativeQuantity || item.quantity >= 0);
      
      return matchesSearch && matchesCategory && matchesQuantityFilters;
    });
  };

  // Get unique categories from items
  const getUniqueCategories = () => {
    const uniqueCategories = new Set<string>();
    parsedItems.forEach(item => {
      if (item.category) {
        uniqueCategories.add(item.category);
      }
    });
    return Array.from(uniqueCategories).sort();
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
    
    // Validate items before import
    const validatedItems = validateItems(selectedItems);
    setParsedItems([...parsedItems]); // Update UI with validation errors
    
    const itemsToImport = validatedItems.filter(item => item.valid);
    
    const results = {
      total: selectedItems.length,
      success: 0,
      failed: 0,
      skipped: selectedItems.length - itemsToImport.length
    };
    
    // Process items one by one
    for (let i = 0; i < itemsToImport.length; i++) {
      try {
        const item = itemsToImport[i];
        const importItem = convertToImportItem(item);
        
        // Create the item in the inventory
        await inventoryService.create(importItem);
        
        results.success++;
      } catch (error) {
        console.error("Import error:", error);
        results.failed++;
      }
      
      // Update progress
      const newProgress = Math.floor(((i + 1) / itemsToImport.length) * 100);
      setProgress(newProgress);
      
      // Update results periodically
      if (i % 5 === 0 || i === itemsToImport.length - 1) {
        setImportResults({...results});
        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    setImportResults(results);
    setIsImporting(false);
    setShowResults(true);
  };

  // Validate items before import
  const validateItems = (items: ParsedItem[]): ParsedItem[] => {
    return items.map(item => {
      const validatedItem = { ...item };
      
      // Validate code and name
      if (!item.code || item.code.trim() === '') {
        validatedItem.valid = false;
        validatedItem.error = "Missing item code";
        return validatedItem;
      }
      
      if (!item.name || item.name.trim() === '') {
        validatedItem.valid = false;
        validatedItem.error = "Missing item name";
        return validatedItem;
      }
      
      return validatedItem;
    });
  };

  // Convert parsed item to import item format with auto category selection and pack size handling
  const convertToImportItem = (item: ParsedItem): ImportItem => {
    // Find category ID if it exists
    const matchingCategory = categories.find(
      c => c.name.toLowerCase() === item.category.toLowerCase()
    );
    
    // Determine unit contains based on pack size
    const hasUnitContains = item.packSize > 1;
    
    const importItem: ImportItem = {
      code: item.code,
      name: item.name,
      type: defaultMedicineType,
      categoryId: matchingCategory?.id,
      categoryName: matchingCategory?.name || item.category,
      hasUnitContains: hasUnitContains,
      minQuantity: defaultMinQuantity
    };
    
    // Add unit contains if pack size > 1
    if (hasUnitContains) {
      importItem.unitContains = {
        value: item.packSize,
        unit: defaultUnitType
      };
    }
    
    return importItem;
  };

  // Handle import completion
  const handleImportComplete = () => {
    onImportComplete();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Inventory from Excel
          </DialogTitle>
          <DialogDescription>
            {parsedItems.length > 0 
              ? `${parsedItems.length} items found in your Excel file` 
              : "Upload your Excel file to import items into inventory"}
          </DialogDescription>
        </DialogHeader>
        
        <TooltipProvider>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mb-4">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="items" disabled={parsedItems.length === 0}>
                Items ({parsedItems.length})
              </TabsTrigger>
              <TabsTrigger value="settings" disabled={parsedItems.length === 0}>
                Import Settings
              </TabsTrigger>
              <TabsTrigger value="import" disabled={isImporting || parsedItems.length === 0}>
                {isImporting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </div>
                ) : "Import Progress"}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="flex-1 overflow-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Excel File</CardTitle>
                  <CardDescription>
                    Upload an Excel file to import inventory items
                  </CardDescription>
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
                  
                  <div className="mt-6 bg-blue-50 p-4 rounded-md">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-700 mb-1">About Excel Import</h4>
                        <p className="text-sm text-blue-600">
                          This import tool is designed to process inventory Excel files with a specific structure.
                          It will extract item codes, names, categories, and quantities, then allow you to map
                          them to your inventory system.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="items" className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="h-10 w-10 animate-spin text-gray-400 mb-4" />
                  <p className="text-gray-500">Loading items from Excel file...</p>
                </div>
              ) : (
                <>
                  <Card className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between items-center">
                        <span>Filters</span>
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
                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <Label htmlFor="search">Search items</Label>
                          <Input 
                            id="search" 
                            placeholder="Search by name or code..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="category">Filter by category</Label>
                          <Select 
                            value={selectedCategory} 
                            onValueChange={setSelectedCategory}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All categories" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All categories</SelectItem>
                              {getUniqueCategories().map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex flex-col justify-end">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="filter-zero" 
                              checked={filterZeroQuantity}
                              onCheckedChange={handleFilterZeroQuantityChange}
                            />
                            <Label htmlFor="filter-zero">Filter out zero quantity</Label>
                          </div>
                        </div>
                        
                        <div className="flex flex-col justify-end">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="filter-negative" 
                              checked={filterNegativeQuantity}
                              onCheckedChange={handleFilterNegativeQuantityChange}
                            />
                            <Label htmlFor="filter-negative">Filter out negative quantity</Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-0">
                      <div className="rounded-md border overflow-auto max-h-[400px]">
                        <Table>
                          <TableHeader className="sticky top-0 bg-white z-10">
                            <TableRow>
                              <TableHead className="w-[60px]">Import</TableHead>
                              <TableHead>Code</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span>Pack Size</span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="cursor-help">
                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs max-w-[200px]">
                                        Pack Size > 1 will automatically enable "Contains per Unit" for the item
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Price</TableHead>
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
                              getFilteredItems().map((item, index) => (
                                <TableRow key={`${item.code}-${index}`}>
                                  <TableCell>
                                    <Checkbox 
                                      checked={item.selected}
                                      onCheckedChange={(checked) => 
                                        handleItemSelectionChange(parsedItems.indexOf(item), checked as boolean)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">{item.code}</TableCell>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{item.category}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.packSize > 1 ? (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-600">
                                        {item.packSize}
                                      </Badge>
                                    ) : (
                                      <span>{item.packSize}</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.quantity < 0 ? (
                                      <span className="text-red-500">{item.quantity}</span>
                                    ) : item.quantity === 0 ? (
                                      <span className="text-amber-500">{item.quantity}</span>
                                    ) : (
                                      <span>{item.quantity}</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.erPrice ? (
                                      <span>Rs. {item.erPrice.toFixed(2)}</span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
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
                </>
              )}
            </TabsContent>
            
            <TabsContent value="settings" className="flex-1 overflow-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Import Settings</CardTitle>
                  <CardDescription>
                    Configure how the items will be imported into your inventory
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="medicine-type">Default Medicine Type</Label>
                    <Select 
                      value={defaultMedicineType} 
                      onValueChange={setDefaultMedicineType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medicine type" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicineTypes.map(type => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      This type will be assigned to all imported items
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="min-quantity">Default Minimum Quantity</Label>
                    <Input 
                      id="min-quantity" 
                      type="number" 
                      min={0}
                      value={defaultMinQuantity}
                      onChange={(e) => setDefaultMinQuantity(Number(e.target.value))}
                    />
                    <p className="text-sm text-gray-500">
                      The minimum stock level for all imported items
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="unit-contains">Contains per Unit</Label>
                      <Badge variant="outline" className="bg-blue-50 text-blue-600">Auto from pack size</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      "Contains per Unit" will be automatically determined based on pack size. 
                      Items with pack size > 1 will have this enabled.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="unit-type">Default Unit Type</Label>
                        <Input 
                          id="unit-type" 
                          value={defaultUnitType}
                          onChange={(e) => setDefaultUnitType(e.target.value)}
                          placeholder="e.g., tablets, ml, g"
                        />
                        <p className="text-xs text-gray-500">
                          This unit type will be used for all items with pack size > 1
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-md">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-700 mb-1">Category Matching</h4>
                        <p className="text-sm text-blue-600">
                          Categories from the Excel file will be matched with existing categories in your system.
                          If a matching category isn't found, the category name from Excel will be used.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-md mt-4">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-amber-700 mb-1">Automatic Pack Size Handling</h4>
                        <p className="text-sm text-amber-600">
                          Pack sizes from the Excel file will be used to determine "Contains per Unit" settings:
                        </p>
                        <ul className="mt-2 ml-5 list-disc text-sm text-amber-600">
                          <li>Items with pack size = 1: No "Contains per Unit" will be set</li>
                          <li>Items with pack size > 1: "Contains per Unit" will be enabled with the pack size value</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="import" className="flex-1 overflow-auto">
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
                    
                    {importResults.failed > 0 && (
                      <div className="flex items-center gap-2 p-4 bg-red-50 rounded-md">
                        <X className="h-5 w-5 text-red-500" />
                        <p className="text-red-700">
                          {importResults.failed} items failed to import. Please check your data and try again.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Ready to Import</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      You have selected {parsedItems.filter(item => item.selected).length} items to import.
                      Click the button below to start the import process.
                    </p>
                    
                    <Button
                      onClick={startImport}
                      className="w-full gap-2"
                      disabled={parsedItems.filter(item => item.selected).length === 0}
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Start Import
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </TooltipProvider>
        
        <DialogFooter>
          {activeTab === 'upload' ? (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              {fileSelected && parsedItems.length > 0 && (
                <Button onClick={() => setActiveTab('items')}>
                  Continue to Items
                </Button>
              )}
            </>
          ) : activeTab === 'items' ? (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button variant="outline" onClick={() => setActiveTab('upload')} className="mr-2">
                Back
              </Button>
              <Button onClick={() => setActiveTab('settings')}>
                Continue to Settings
              </Button>
            </>
          ) : activeTab === 'settings' ? (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button variant="outline" onClick={() => setActiveTab('items')} className="mr-2">
                Back
              </Button>
              <Button onClick={() => setActiveTab('import')}>
                Continue to Import
              </Button>
            </>
          ) : (
            <>
              {!isImporting && !showResults && (
                <Button variant="outline" onClick={onClose}>Cancel</Button>
              )}
              {showResults && (
                <Button onClick={handleImportComplete}>
                  Complete Import
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelDirectImport;