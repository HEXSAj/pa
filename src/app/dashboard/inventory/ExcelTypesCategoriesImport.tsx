// src/app/dashboard/inventory/ExcelTypesCategoriesImport.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Loader2,
  FileSpreadsheet,
  Check,
  X,
  AlertTriangle,
  Info,
  Upload,
  TagIcon,
  ListPlus
} from 'lucide-react';
import { toast } from "sonner";

interface ExcelTypesCategoriesImportProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedCategory {
  name: string;
  description?: string;
  color: string;
  selected: boolean;
  exists: boolean;
}

interface ParsedType {
  name: string;
  defaultUnit: string;
  selected: boolean;
  exists: boolean;
}

const generateRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 80%)`;
};

const ExcelTypesCategoriesImport: React.FC<ExcelTypesCategoriesImportProps> = ({ onClose, onImportComplete }) => {
  // State for data and progress
  const [loading, setLoading] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'categories' | 'types' | 'import'>('upload');
  
  const [existingCategories, setExistingCategories] = useState<Category[]>([]);
  const [existingTypes, setExistingTypes] = useState<MedicineTypeModel[]>([]);
  
  const [parsedCategories, setParsedCategories] = useState<ParsedCategory[]>([]);
  const [parsedTypes, setParsedTypes] = useState<ParsedType[]>([]);
  
  const [defaultUnit, setDefaultUnit] = useState('tablets');
  
  const [selectAllCategories, setSelectAllCategories] = useState(true);
  const [selectAllTypes, setSelectAllTypes] = useState(true);
  
  const [searchCategoryQuery, setSearchCategoryQuery] = useState('');
  const [searchTypeQuery, setSearchTypeQuery] = useState('');
  
  const [isImporting, setIsImporting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [importResults, setImportResults] = useState({
    total: { categories: 0, types: 0 },
    success: { categories: 0, types: 0 },
    failed: { categories: 0, types: 0 },
    skipped: { categories: 0, types: 0 }
  });
  
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
        
        // First try column headers approach
        let typeColumnName = '';
        let categoryColumnName = '';
        
        // Convert to array of arrays to get direct column access
        const arrayData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Check if we have any data
        if (arrayData.length > 0) {
          // Try to find headers in the first row
          const headers = arrayData[0];
          if (Array.isArray(headers)) {
            headers.forEach((header, index) => {
              if (header) {
                const headerStr = String(header).toLowerCase();
                if (headerStr.includes('type') || headerStr === 'type' || headerStr === 'medicine type') {
                  typeColumnName = String(header);
                }
                if (headerStr.includes('category') || headerStr === 'category' || headerStr === 'med category') {
                  categoryColumnName = String(header);
                }
              }
            });
          }
          
          // If headers not found, use column position approach
          if (!typeColumnName && !categoryColumnName) {
            // Try positional approach - often column A is types, column B is categories
            console.log("Headers not found, using positional approach");
            
            // Create a JSON object with the column data
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            
            // If there are no column headers, use column references like __EMPTY_0, __EMPTY_1
            // or A, B, C depending on how XLSX processes the data
            const keys = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
            
            // For column A (first column) - Types
            const colA = keys[0] || '';
            typeColumnName = colA;
            
            // For column B (second column) - Categories  
            const colB = keys[1] || '';
            categoryColumnName = colB;
            
            console.log("Column names by position:", { typeColumnName, categoryColumnName });
          }
        }
        
        // Extract categories and types
        const categoriesSet = new Set<string>();
        const typesSet = new Set<string>();
        
        // Convert to JSON for easier processing
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        // Also try direct column extraction if normal methods fail
        let typesExtracted = false;
        let categoriesExtracted = false;
        
        jsonData.forEach((row: any) => {
          // Extract via column name if available
          if (typeColumnName && row[typeColumnName]) {
            const type = String(row[typeColumnName]).trim();
            if (type) {
              typesSet.add(type);
              typesExtracted = true;
            }
          }
          
          if (categoryColumnName && row[categoryColumnName]) {
            const category = String(row[categoryColumnName]).trim();
            if (category) {
              categoriesSet.add(category);
              categoriesExtracted = true;
            }
          }
          
          // Fallback to positional approach if column names don't work
          if (!typesExtracted || !categoriesExtracted) {
            // Try all properties - some may be the columns we want
            Object.entries(row).forEach(([key, value]) => {
              if (value && typeof value === 'string') {
                const val = value.trim();
                
                // If we haven't successfully extracted types, try first column values as types
                if (!typesExtracted && key === Object.keys(row)[0]) {
                  typesSet.add(val);
                }
                
                // If we haven't successfully extracted categories, try second column values as categories
                if (!categoriesExtracted && key === Object.keys(row)[1]) {
                  categoriesSet.add(val);
                }
              }
            });
          }
        });
        
        // If still empty, try the raw array approach for sheets without proper headers
        if (typesSet.size === 0 || categoriesSet.size === 0) {
          for (let i = 1; i < arrayData.length; i++) { // Skip first row (headers)
            const row = arrayData[i];
            if (Array.isArray(row)) {
              // First column (index 0) - Types
              if (row[0] && typeof row[0] === 'string' && row[0].trim() !== '') {
                typesSet.add(row[0].trim());
              }
              
              // Second column (index 1) - Categories
              if (row[1] && typeof row[1] === 'string' && row[1].trim() !== '') {
                categoriesSet.add(row[1].trim());
              }
            }
          }
        }
        
        // Log what we found
        console.log(`Found ${typesSet.size} types and ${categoriesSet.size} categories`);
        
        // Convert to array and check for existing items
        const categories: ParsedCategory[] = Array.from(categoriesSet).map(name => {
          const exists = existingCategories.some(c => 
            c.name.toLowerCase() === name.toLowerCase()
          );
          
          return {
            name,
            description: `Imported from Excel file`,
            color: generateRandomColor(),
            selected: !exists, // Don't select if already exists
            exists
          };
        });
        
        const types: ParsedType[] = Array.from(typesSet).map(name => {
          const exists = existingTypes.some(t => 
            t.name.toLowerCase() === name.toLowerCase()
          );
          
          const existingType = existingTypes.find(t => 
            t.name.toLowerCase() === name.toLowerCase()
          );
          
          return {
            name,
            defaultUnit: existingType?.defaultUnit || defaultUnit,
            selected: !exists, // Don't select if already exists
            exists
          };
        });
        
        // Sort alphabetically
        categories.sort((a, b) => a.name.localeCompare(b.name));
        types.sort((a, b) => a.name.localeCompare(b.name));
        
        setParsedCategories(categories);
        setParsedTypes(types);
        
        // Set initial import results
        setImportResults({
          total: { 
            categories: categories.length, 
            types: types.length 
          },
          success: { categories: 0, types: 0 },
          failed: { categories: 0, types: 0 },
          skipped: { categories: 0, types: 0 }
        });
        
        // Determine which tab to show first based on what was found
        if (categories.length > 0) {
          setActiveTab('categories');
          toast.success(`Found ${categories.length} categories and ${types.length} types in the Excel file`);
        } else if (types.length > 0) {
          setActiveTab('types');
          toast.success(`Found ${types.length} types in the Excel file`);
        } else {
          toast.error("No categories or types found in the Excel file");
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
  const handleCategorySelectionChange = (index: number, checked: boolean) => {
    const updatedCategories = [...parsedCategories];
    updatedCategories[index].selected = checked;
    setParsedCategories(updatedCategories);
  };

  const handleTypeSelectionChange = (index: number, checked: boolean) => {
    const updatedTypes = [...parsedTypes];
    updatedTypes[index].selected = checked;
    setParsedTypes(updatedTypes);
  };

  // Handle select all changes
  const handleSelectAllCategoriesChange = (checked: boolean) => {
    setSelectAllCategories(checked);
    const updatedCategories = parsedCategories.map(category => ({
      ...category,
      selected: checked && 
                (searchCategoryQuery.trim() === '' || 
                  category.name.toLowerCase().includes(searchCategoryQuery.toLowerCase()))
    }));
    setParsedCategories(updatedCategories);
  };

  const handleSelectAllTypesChange = (checked: boolean) => {
    setSelectAllTypes(checked);
    const updatedTypes = parsedTypes.map(type => ({
      ...type,
      selected: checked && 
                (searchTypeQuery.trim() === '' || 
                  type.name.toLowerCase().includes(searchTypeQuery.toLowerCase()))
    }));
    setParsedTypes(updatedTypes);
  };

  // Handle category color change
  const handleCategoryColorChange = (index: number, color: string) => {
    const updatedCategories = [...parsedCategories];
    updatedCategories[index].color = color;
    setParsedCategories(updatedCategories);
  };

  // Handle default unit change for a type
  const handleTypeUnitChange = (index: number, unit: string) => {
    const updatedTypes = [...parsedTypes];
    updatedTypes[index].defaultUnit = unit;
    setParsedTypes(updatedTypes);
  };

  // Get filtered categories and types
  const getFilteredCategories = () => {
    return parsedCategories.filter(category => {
      const matchesSearch = searchCategoryQuery.trim() === '' || 
        category.name.toLowerCase().includes(searchCategoryQuery.toLowerCase());
      
      return matchesSearch;
    });
  };

  const getFilteredTypes = () => {
    return parsedTypes.filter(type => {
      const matchesSearch = searchTypeQuery.trim() === '' || 
        type.name.toLowerCase().includes(searchTypeQuery.toLowerCase());
      
      return matchesSearch;
    });
  };

  // Start the import process
  const startImport = async () => {
    const selectedCategories = parsedCategories.filter(category => category.selected);
    const selectedTypes = parsedTypes.filter(type => type.selected);
    
    if (selectedCategories.length === 0 && selectedTypes.length === 0) {
      toast.error("No items selected for import");
      return;
    }
    
    setIsImporting(true);
    setProgress(0);
    setActiveTab('import');
    
    const results = {
      total: { 
        categories: selectedCategories.length, 
        types: selectedTypes.length 
      },
      success: { categories: 0, types: 0 },
      failed: { categories: 0, types: 0 },
      skipped: { categories: 0, types: 0 }
    };
    
    // Calculate total items for progress
    const totalItems = selectedCategories.length + selectedTypes.length;
    let processedItems = 0;
    
    // Process categories one by one
    for (let i = 0; i < selectedCategories.length; i++) {
      try {
        const category = selectedCategories[i];
        
        // Skip if category already exists
        if (category.exists) {
          results.skipped.categories++;
          processedItems++;
          continue;
        }
        
        // Create the category
        await categoryService.create({
          name: category.name,
          description: category.description,
          color: category.color
        });
        
        results.success.categories++;
      } catch (error) {
        console.error("Import error:", error);
        results.failed.categories++;
      }
      
      processedItems++;
      // Update progress
      const newProgress = Math.floor((processedItems / totalItems) * 100);
      setProgress(newProgress);
      
      // Update results periodically
      if (i % 5 === 0 || i === selectedCategories.length - 1) {
        setImportResults({...results});
        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // Process types one by one
    for (let i = 0; i < selectedTypes.length; i++) {
      try {
        const type = selectedTypes[i];
        
        // Skip if type already exists
        if (type.exists) {
          results.skipped.types++;
          processedItems++;
          continue;
        }
        
        // Create the type
        await medicineTypeService.create({
          name: type.name,
          defaultUnit: type.defaultUnit
        });
        
        results.success.types++;
      } catch (error) {
        console.error("Import error:", error);
        results.failed.types++;
      }
      
      processedItems++;
      // Update progress
      const newProgress = Math.floor((processedItems / totalItems) * 100);
      setProgress(newProgress);
      
      // Update results periodically
      if (i % 5 === 0 || i === selectedTypes.length - 1) {
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Categories & Types from Excel
          </DialogTitle>
          <DialogDescription>
            Import categories and types from columns in your Excel file
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mb-4">
            <TabsTrigger value="upload">Upload Excel</TabsTrigger>
            {parsedCategories.length > 0 && (
              <TabsTrigger value="categories">
                Categories ({parsedCategories.length})
              </TabsTrigger>
            )}
            {parsedTypes.length > 0 && (
              <TabsTrigger value="types">
                Types ({parsedTypes.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="import" disabled={!fileSelected || isImporting}>
              Import
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="flex-1 overflow-auto">
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
                
                <div className="mt-6 bg-blue-50 p-4 rounded-md">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-700 mb-1">About Excel Import</h4>
                      <p className="text-sm text-blue-600">
                        This tool will analyze your Excel sheet and find columns for <strong>Types</strong> and <strong>Categories</strong>. 
                        Items that already exist in your system will be identified and can be skipped during import.
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        For medicine types, a default unit will be assigned (e.g., "tablets"), which you can customize before importing.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categories" className="flex-1 overflow-auto">
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Categories Found</span>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="select-all-categories" 
                        checked={selectAllCategories}
                        onCheckedChange={handleSelectAllCategoriesChange}
                      />
                      <Label htmlFor="select-all-categories">Select All</Label>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="search-categories">Search categories</Label>
                  <Input 
                    id="search-categories" 
                    placeholder="Search by name..." 
                    value={searchCategoryQuery}
                    onChange={(e) => setSearchCategoryQuery(e.target.value)}
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-600">
                        Categories that already exist in your system are marked and deselected by default.
                        You can customize the colors for each category before importing.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md border overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="w-[60px]">Import</TableHead>
                        <TableHead className="w-[60px]">Color</TableHead>
                        <TableHead>Category Name</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredCategories().length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-32 text-gray-500">
                            No categories match your search
                          </TableCell>
                        </TableRow>
                      ) : (
                        getFilteredCategories().map((category, index) => {
                          const originalIndex = parsedCategories.findIndex(c => c.name === category.name);
                          return (
                            <TableRow key={category.name}>
                              <TableCell>
                                <Checkbox 
                                  checked={category.selected}
                                  onCheckedChange={(checked) => 
                                    handleCategorySelectionChange(originalIndex, checked as boolean)
                                  }
                                  disabled={category.exists}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center">
                                  <Input
                                    type="color"
                                    value={category.color}
                                    onChange={(e) => handleCategoryColorChange(originalIndex, e.target.value)}
                                    className="w-8 h-8 p-1 cursor-pointer"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>{category.name}</TableCell>
                              <TableCell>
                                {category.exists ? (
                                  <Badge variant="outline" className="bg-gray-100">
                                    Already exists
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-100 text-green-700">
                                    New
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
                    Showing {getFilteredCategories().length} of {parsedCategories.length} categories
                  </span>
                  <span>
                    {parsedCategories.filter(category => category.selected).length} categories selected for import
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
              {parsedTypes.length > 0 ? (
                <Button onClick={() => setActiveTab('types')}>
                  Continue to Types
                </Button>
              ) : (
                <Button onClick={() => setActiveTab('import')}>
                  Continue to Import
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="types" className="flex-1 overflow-auto">
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Types Found</span>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="select-all-types" 
                        checked={selectAllTypes}
                        onCheckedChange={handleSelectAllTypesChange}
                      />
                      <Label htmlFor="select-all-types">Select All</Label>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="search-types">Search types</Label>
                  <Input 
                    id="search-types" 
                    placeholder="Search by name..." 
                    value={searchTypeQuery}
                    onChange={(e) => setSearchTypeQuery(e.target.value)}
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="default-unit">Default unit for new types</Label>
                  <Input 
                    id="default-unit" 
                    placeholder="e.g., tablets, ml, g" 
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value)}
                    className="w-full md:w-64"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This unit will be used for any new types unless customized individually
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-600">
                        Types that already exist in your system are marked and deselected by default.
                        You can customize the default unit for each type before importing.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md border overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="w-[60px]">Import</TableHead>
                        <TableHead>Type Name</TableHead>
                        <TableHead>Default Unit</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredTypes().length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-32 text-gray-500">
                            No types match your search
                          </TableCell>
                        </TableRow>
                      ) : (
                        getFilteredTypes().map((type, index) => {
                          const originalIndex = parsedTypes.findIndex(t => t.name === type.name);
                          return (
                            <TableRow key={type.name}>
                              <TableCell>
                                <Checkbox 
                                  checked={type.selected}
                                  onCheckedChange={(checked) => 
                                    handleTypeSelectionChange(originalIndex, checked as boolean)
                                  }
                                  disabled={type.exists}
                                />
                              </TableCell>
                              <TableCell>{type.name}</TableCell>
                              <TableCell>
                                <Input
                                  value={type.defaultUnit}
                                  onChange={(e) => handleTypeUnitChange(originalIndex, e.target.value)}
                                  placeholder="e.g., tablets, ml, g"
                                  disabled={type.exists}
                                  className="w-full"
                                />
                              </TableCell>
                              <TableCell>
                                {type.exists ? (
                                  <Badge variant="outline" className="bg-gray-100">
                                    Already exists
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-100 text-green-700">
                                    New
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
                    Showing {getFilteredTypes().length} of {parsedTypes.length} types
                  </span>
                  <span>
                    {parsedTypes.filter(type => type.selected).length} types selected for import
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-2">
              {parsedCategories.length > 0 ? (
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('categories')}
                >
                  Back to Categories
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('upload')}
                >
                  Back
                </Button>
              )}
              <Button onClick={() => setActiveTab('import')}>
                Continue to Import
              </Button>
            </div>
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
                    
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-base font-medium mb-2">Categories</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-500">Total</div>
                            <div className="text-xl font-semibold">{importResults.total.categories}</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-sm text-green-600">Success</div>
                            <div className="text-xl font-semibold text-green-600">{importResults.success.categories}</div>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <div className="text-sm text-red-600">Failed</div>
                            <div className="text-xl font-semibold text-red-600">{importResults.failed.categories}</div>
                          </div>
                          <div className="bg-amber-50 p-3 rounded-lg">
                            <div className="text-sm text-amber-600">Skipped</div>
                            <div className="text-xl font-semibold text-amber-600">{importResults.skipped.categories}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-medium mb-2">Types</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-500">Total</div>
                            <div className="text-xl font-semibold">{importResults.total.types}</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-sm text-green-600">Success</div>
                            <div className="text-xl font-semibold text-green-600">{importResults.success.types}</div>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <div className="text-sm text-red-600">Failed</div>
                            <div className="text-xl font-semibold text-red-600">{importResults.failed.types}</div>
                          </div>
                          <div className="bg-amber-50 p-3 rounded-lg">
                            <div className="text-sm text-amber-600">Skipped</div>
                            <div className="text-xl font-semibold text-amber-600">{importResults.skipped.types}</div>
                          </div>
                        </div>
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
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                        <TagIcon className="h-5 w-5" />
                        Categories
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500">Total</div>
                          <div className="text-2xl font-bold">{importResults.total.categories}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm text-green-600">Successfully Imported</div>
                          <div className="text-2xl font-bold text-green-600">{importResults.success.categories}</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="text-sm text-red-600">Failed</div>
                          <div className="text-2xl font-bold text-red-600">{importResults.failed.categories}</div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <div className="text-sm text-amber-600">Skipped</div>
                          <div className="text-2xl font-bold text-amber-600">{importResults.skipped.categories}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                        <ListPlus className="h-5 w-5" />
                        Types
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500">Total</div>
                          <div className="text-2xl font-bold">{importResults.total.types}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm text-green-600">Successfully Imported</div>
                          <div className="text-2xl font-bold text-green-600">{importResults.success.types}</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="text-sm text-red-600">Failed</div>
                          <div className="text-2xl font-bold text-red-600">{importResults.failed.types}</div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-lg">
                          <div className="text-sm text-amber-600">Skipped</div>
                          <div className="text-2xl font-bold text-amber-600">{importResults.skipped.types}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {(importResults.success.categories > 0 || importResults.success.types > 0) && (
                    <div className="flex items-center gap-2 p-4 bg-green-50 rounded-md">
                      <Check className="h-5 w-5 text-green-500" />
                      <p className="text-green-700">
                        Successfully imported {importResults.success.categories} categories and {importResults.success.types} types.
                      </p>
                    </div>
                  )}
                  
                  {(importResults.skipped.categories > 0 || importResults.skipped.types > 0) && (
                    <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-md">
                      <Info className="h-5 w-5 text-amber-500" />
                      <p className="text-amber-700">
                        Skipped {importResults.skipped.categories} categories and {importResults.skipped.types} types that already exist in your system.
                      </p>
                    </div>
                  )}
                  
                  {(importResults.failed.categories > 0 || importResults.failed.types > 0) && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 rounded-md">
                      <X className="h-5 w-5 text-red-500" />
                      <p className="text-red-700">
                        Failed to import {importResults.failed.categories} categories and {importResults.failed.types} types. Please try again.
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
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <TagIcon className="h-5 w-5" />
                        Categories
                      </h3>
                      <p className="text-sm text-gray-600">
                        {parsedCategories.filter(c => c.selected).length} categories selected for import
                        {parsedCategories.filter(c => !c.selected && c.exists).length > 0 && 
                          ` (${parsedCategories.filter(c => !c.selected && c.exists).length} already exist)`}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <ListPlus className="h-5 w-5" />
                        Types
                      </h3>
                      <p className="text-sm text-gray-600">
                        {parsedTypes.filter(t => t.selected).length} types selected for import
                        {parsedTypes.filter(t => !t.selected && t.exists).length > 0 && 
                          ` (${parsedTypes.filter(t => !t.selected && t.exists).length} already exist)`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-md">
                    <div className="flex gap-3">
                      <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-600">
                          Click the button below to begin the import process. Any items that already exist in your system will be skipped.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={startImport}
                    className="w-full gap-2"
                    disabled={(parsedCategories.filter(c => c.selected).length === 0 && 
                              parsedTypes.filter(t => t.selected).length === 0)}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Start Import
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          {activeTab === 'upload' ? (
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          ) : isImporting ? (
            <Button variant="outline" disabled>Please wait...</Button>
          ) : showResults ? (
            <Button onClick={handleImportComplete}>
              Complete Import
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              {activeTab === 'categories' && (
                <Button onClick={() => setActiveTab('import')}>
                  Skip to Import
                </Button>
              )}
              {activeTab === 'types' && (
                <Button onClick={() => setActiveTab('import')}>
                  Continue to Import
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelTypesCategoriesImport;