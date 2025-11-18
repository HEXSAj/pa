

// src/app/dashboard/inventory/CategoryImport.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { categoryService } from '@/services/categoryService';
import { Category } from '@/types/inventory';
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
  Plus
} from 'lucide-react';
import { toast } from "sonner";

interface CategoryImporterProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface CategoryToImport {
  name: string;
  description?: string;
  color: string;
  selected: boolean;
  exists: boolean;
}

// Generate random color for new categories
const generateRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 20); // 60-80%
  const lightness = 70 + Math.floor(Math.random() * 10); // 70-80%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Check if category exists (case-insensitive)
const categoryExists = (name: string, existingCategories: Category[]): boolean => {
  return existingCategories.some(cat => 
    cat.name.toLowerCase().trim() === name.toLowerCase().trim()
  );
};

// Extract categories from Excel data
const extractCategoriesFromExcel = (jsonData: any[]): string[] => {
  const categories = new Set<string>();
  
  jsonData.forEach((row: any) => {
    if (!row || typeof row !== 'object') return;
    
    // Look for category-related columns
    Object.entries(row).forEach(([key, value]) => {
      const keyLower = key.toLowerCase();
      
      // Check if this column might contain categories
      if (keyLower.includes('category') || 
          keyLower.includes('cat') ||
          keyLower === 'type' ||
          keyLower.includes('class')) {
        
        if (value && typeof value === 'string') {
          const categoryName = value.toString().trim().toUpperCase();
          if (categoryName.length > 0 && categoryName !== 'CATEGORY') {
            categories.add(categoryName);
          }
        }
      }
    });
  });
  
  return Array.from(categories);
};

// Extract from array data (for sheets without proper headers)
const extractCategoriesFromArrayData = (arrayData: any[][]): string[] => {
  const categories = new Set<string>();
  
  // Skip header row and process data
  for (let i = 1; i < arrayData.length; i++) {
    const row = arrayData[i];
    if (!Array.isArray(row)) continue;
    
    // Check each column for potential category data
    row.forEach((cell, columnIndex) => {
      if (cell && typeof cell === 'string') {
        const cellValue = cell.toString().trim().toUpperCase();
        
        // Skip obvious non-category values
        if (cellValue.length > 1 && 
            cellValue.length < 50 && // Reasonable category name length
            !cellValue.match(/^\d+$/) && // Not just numbers
            !cellValue.includes('@') && // Not email
            cellValue !== 'CATEGORY') {
          
          // Add if it looks like a category
          categories.add(cellValue);
        }
      }
    });
  }
  
  return Array.from(categories);
};

const CategoryImporter: React.FC<CategoryImporterProps> = ({ onClose, onImportComplete }) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [existingCategories, setExistingCategories] = useState<Category[]>([]);
  const [categoriesToImport, setCategoriesToImport] = useState<CategoryToImport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectAll, setSelectAll] = useState(true);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState({
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0
  });
  const [isImporting, setIsImporting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryService.getAll();
        setExistingCategories(data);
      } catch (error) {
        console.error("Error loading categories:", error);
        toast.error("Failed to load existing categories");
      }
    };
    
    loadCategories();
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

  // Process Excel file
  const processExcelFile = async (file: File) => {
    try {
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
          
          // Try JSON format first
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          let categories: string[] = extractCategoriesFromExcel(jsonData);
          
          // If no categories found, try array approach
          if (categories.length === 0) {
            const arrayData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            categories = extractCategoriesFromArrayData(arrayData);
          }
          
          // If still no categories, try to detect from specific columns
          if (categories.length === 0) {
            // Try to find category column by position (common patterns)
            const arrayData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            // Check if there's a header row with "category" or similar
            let categoryColumnIndex = -1;
            if (arrayData.length > 0) {
              const headerRow = arrayData[0];
              if (Array.isArray(headerRow)) {
                headerRow.forEach((header, index) => {
                  if (header && typeof header === 'string') {
                    const headerLower = header.toLowerCase();
                    if (headerLower.includes('category') || 
                        headerLower.includes('cat') ||
                        headerLower === 'type') {
                      categoryColumnIndex = index;
                    }
                  }
                });
              }
            }
            
            // Extract from specific column if found
            if (categoryColumnIndex >= 0) {
              for (let i = 1; i < arrayData.length; i++) {
                const row = arrayData[i];
                if (Array.isArray(row) && row[categoryColumnIndex]) {
                  const categoryName = row[categoryColumnIndex].toString().trim().toUpperCase();
                  if (categoryName.length > 0) {
                    categories.push(categoryName);
                  }
                }
              }
            }
          }
          
          // Remove duplicates and filter valid categories
          const uniqueCategories = Array.from(new Set(categories)).filter(cat => 
            cat && cat.length > 0 && cat.length < 100
          );
          
          // Convert to category objects
          const categoryArray: CategoryToImport[] = uniqueCategories.map(name => {
            const exists = categoryExists(name, existingCategories);
            
            return {
              name: name.trim(),
              description: `Imported from Excel file`,
              color: generateRandomColor(),
              selected: !exists, // Don't select existing categories
              exists
            };
          });
          
          // Sort alphabetically
          categoryArray.sort((a, b) => a.name.localeCompare(b.name));
          
          setCategoriesToImport(categoryArray);
          
          setImportResults({
            total: categoryArray.length,
            success: 0,
            failed: 0,
            skipped: 0
          });
          
          if (categoryArray.length > 0) {
            toast.success(`Found ${categoryArray.length} categories in the Excel file`);
          } else {
            toast.error("No categories found in the Excel file. Make sure your file has a column with category names.");
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

  // Handle category selection change
  const handleCategorySelectionChange = (index: number, checked: boolean) => {
    const updatedCategories = [...categoriesToImport];
    updatedCategories[index].selected = checked;
    setCategoriesToImport(updatedCategories);
  };

  // Handle select all
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    const updatedCategories = categoriesToImport.map(category => ({
      ...category,
      selected: checked && 
                !category.exists && // Don't select existing categories
                (searchQuery.trim() === '' || 
                  category.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }));
    setCategoriesToImport(updatedCategories);
  };

  // Get filtered categories
  const getFilteredCategories = () => {
    return categoriesToImport.filter(category => {
      const matchesSearch = searchQuery.trim() === '' || 
        category.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  };

  // Start import process
  const startImport = async () => {
    const selectedCategories = categoriesToImport.filter(category => category.selected);
    
    if (selectedCategories.length === 0) {
      toast.error("No categories selected for import");
      return;
    }
    
    setIsImporting(true);
    setProgress(0);
    
    const results = {
      total: selectedCategories.length,
      success: 0,
      failed: 0,
      skipped: 0
    };
    
    // Process categories one by one
    for (let i = 0; i < selectedCategories.length; i++) {
      try {
        const category = selectedCategories[i];
        
        // Skip if category already exists
        if (category.exists) {
          results.skipped++;
          continue;
        }
        
        // Create the category
        await categoryService.create({
          name: category.name,
          description: category.description,
          color: category.color
        });
        
        results.success++;
      } catch (error) {
        console.error("Import error:", error);
        results.failed++;
      }
      
      // Update progress
      const newProgress = Math.floor(((i + 1) / selectedCategories.length) * 100);
      setProgress(newProgress);
      
      // Update results periodically
      if (i % 5 === 0 || i === selectedCategories.length - 1) {
        setImportResults({...results});
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    setImportResults(results);
    setIsImporting(false);
    setShowResults(true);
  };

  // Handle color change
  const handleColorChange = (index: number, color: string) => {
    const updatedCategories = [...categoriesToImport];
    updatedCategories[index].color = color;
    setCategoriesToImport(updatedCategories);
  };

  // Handle manual category addition
  const handleAddManualCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    
    const categoryName = newCategoryName.trim().toUpperCase();
    
    // Check if already in list
    if (categoriesToImport.some(c => c.name.toUpperCase() === categoryName)) {
      toast.error("This category is already in the list");
      return;
    }
    
    const exists = categoryExists(categoryName, existingCategories);
    
    const newCategory: CategoryToImport = {
      name: categoryName,
      description: "Manually added category",
      color: generateRandomColor(),
      selected: !exists,
      exists
    };
    
    setCategoriesToImport(prev => [...prev, newCategory]);
    setNewCategoryName('');
    setShowManualEntry(false);
    
    toast.success(`Added "${categoryName}" to the import list`);
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
            <TagIcon className="h-5 w-5" />
            Import Categories from Excel
          </DialogTitle>
          <DialogDescription>
            {categoriesToImport.length > 0 
              ? `${categoriesToImport.length} categories found in your Excel file` 
              : "Upload your Excel file to import categories"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {!categoriesToImport.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Upload Excel File</CardTitle>
                <DialogDescription>
                  Upload an Excel file containing categories in any column.
                </DialogDescription>
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
                      <h4 className="font-medium text-blue-700 mb-1">Expected File Format</h4>
                      <p className="text-sm text-blue-600">
                        The tool will automatically detect category columns in your Excel file. 
                        Categories that already exist in your system will be identified and can be skipped.
                      </p>
                      <ul className="list-disc ml-5 text-sm text-blue-600 mt-2">
                        <li>Column headers like "Category", "Type", "Class" are automatically detected</li>
                        <li>Existing categories will be marked and deselected by default</li>
                        <li>You can manually add categories if needed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : isImporting ? (
            <div className="space-y-6">
              <div className="bg-amber-50 p-4 rounded-md">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-600">
                    Import is in progress. Please do not close this window.
                  </p>
                </div>
              </div>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Import Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Importing categories...</span>
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
                    <div className="text-sm text-gray-500">Total Categories</div>
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
                      {importResults.success} categories were successfully imported.
                    </p>
                  </div>
                )}
                
                {importResults.skipped > 0 && (
                  <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-md">
                    <Info className="h-5 w-5 text-amber-500" />
                    <p className="text-amber-700">
                      {importResults.skipped} categories were skipped because they already exist.
                    </p>
                  </div>
                )}
                
                {importResults.failed > 0 && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 rounded-md">
                    <X className="h-5 w-5 text-red-500" />
                    <p className="text-red-700">
                      {importResults.failed} categories failed to import. Please try again.
                    </p>
                  </div>
                )}
                
                <div className="mt-6 flex justify-center">
                  <Button onClick={handleImportComplete}>
                    Complete Import & Return to Categories
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span>Categories Found</span>
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
                  <div className="mb-4 flex flex-col gap-4">
                    <div>
                      <Label htmlFor="search">Search categories</Label>
                      <Input 
                        id="search" 
                        placeholder="Search by name..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    {/* Manual Category Entry */}
                    {showManualEntry ? (
                      <div className="border border-blue-200 bg-blue-50 rounded-md p-4">
                        <h3 className="text-sm font-medium text-blue-700 mb-2">Add Category Manually</h3>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter category name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={handleAddManualCategory}
                              disabled={!newCategoryName.trim()}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setShowManualEntry(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="text-blue-600 border-blue-200"
                        onClick={() => setShowManualEntry(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Category Manually
                      </Button>
                    )}
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
                  
                  <div className="rounded-md border overflow-auto max-h-[400px]">
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
                            const originalIndex = categoriesToImport.findIndex(c => c.name === category.name);
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
                                      onChange={(e) => handleColorChange(originalIndex, e.target.value)}
                                      className="w-8 h-8 p-1 cursor-pointer"
                                      disabled={category.exists}
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
                    <div className="text-sm text-gray-500 p-4 flex items-center justify-between">
                      <span>
                        Showing {getFilteredCategories().length} of {categoriesToImport.length} categories
                      </span>
                      <span>
                        {categoriesToImport.filter(category => category.selected).length} categories selected for import
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button
                onClick={startImport}
                className="w-full gap-2"
                disabled={categoriesToImport.filter(category => category.selected).length === 0}
              >
                <TagIcon className="h-4 w-4" />
                Import {categoriesToImport.filter(category => category.selected).length} Categories
              </Button>
            </>
          )}
        </div>
        
        <DialogFooter>
          {!(isImporting || showResults) && (
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          )}
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

export default CategoryImporter;