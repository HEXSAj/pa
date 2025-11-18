// src/app/dashboard/purchases/DrugExcelImporter.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, push, set, get, query, orderByChild, equalTo } from 'firebase/database';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, FileSpreadsheet, AlertTriangle, Info, Check, CheckCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supplierService } from '@/services/supplierService';
import { Supplier } from '@/types/supplier';
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DrugItem {
  itemCode: string;  
  genericName: string;
  tradeName: string;
  costPerUnit: number;
  sellingPerUnit: number;
  quantity: number;
  expiryDate: Date;
  code?: string;
  itemId?: string;
}

const DrugExcelImporter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [supplierId, setSupplierId] = useState<string>('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('DRUG-IMPORT-' + new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'idle' | 'parsing' | 'validating' | 'importing' | 'complete'>('idle');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [stats, setStats] = useState<{
    totalRows: number;
    validRows: number;
    skippedRows: number;
    newItems: number;
    existingItems: number;
  }>({ totalRows: 0, validRows: 0, skippedRows: 0, newItems: 0, existingItems: 0 });
  const [previewData, setPreviewData] = useState<DrugItem[]>([]);
  const [processedItems, setProcessedItems] = useState<{
    item: DrugItem;
    status: 'success' | 'error' | 'skipped';
    message?: string;
  }[]>([]);

  // Load suppliers when component mounts
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const supplierData = await supplierService.getActive();
        setSuppliers(supplierData);
        if (supplierData.length > 0) {
          setSupplierId(supplierData[0].id || '');
        }
      } catch (error) {
        console.error("Error loading suppliers:", error);
        toast.error("Failed to load suppliers");
      }
    };
    
    loadSuppliers();
  }, []);

  // Helper function to ensure numeric values are valid and properly rounded
  const ensureValidNumber = (value: any, defaultValue: number = 1): number => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    const stringValue = String(value).trim();
    const cleanValue = stringValue.replace(/[₹$,\s]/g, '');
    const parsedValue = parseFloat(cleanValue);
    
    if (!isNaN(parsedValue) && parsedValue > 0) {
      return Math.round(parsedValue * 100) / 100;
    }
    
    console.warn(`Invalid number value: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  };

  // Helper function to parse date from Excel
  const parseExcelDate = (value: any): Date => {
    if (!value) {
      console.warn('No date value provided, using default expiry (1 year from now)');
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() + 1);
      return defaultDate;
    }

    // If it's already a Date object
    if (value instanceof Date) {
      return value;
    }

    // If it's a number (Excel serial date)
    if (typeof value === 'number') {
      // Excel stores dates as days since January 1, 1900
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
      
      // Validate the parsed date
      if (date.getFullYear() < 2020 || date.getFullYear() > 2030) {
        console.warn(`Parsed date seems invalid: ${date}, using default`);
        const defaultDate = new Date();
        defaultDate.setFullYear(defaultDate.getFullYear() + 1);
        return defaultDate;
      }
      
      return date;
    }

    // If it's a string, try to parse it
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020 && parsed.getFullYear() <= 2030) {
        return parsed;
      }
    }

    // Default to 1 year from now if parsing fails
    console.warn(`Could not parse date: ${value}, using default expiry (1 year from now)`);
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 1);
    return defaultDate;
  };

  // Helper function to sanitize data for Firebase
  const sanitizeForFirebase = (obj: any): any => {
    if (obj === undefined || obj === null) {
      return null;
    }
    
    if (typeof obj === 'number' && isNaN(obj)) {
      return 1;
    }
    
    if (typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeForFirebase(item));
    }
    
    const result: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        if (key === 'costPricePerUnit' || key === 'sellingPricePerUnit' || key === 'costPrice' || key === 'unitPrice') {
          result[key] = typeof value === 'number' && !isNaN(value) ? Math.round(value * 100) / 100 : 1;
        } else {
          result[key] = sanitizeForFirebase(value);
        }
      }
    }
    
    return result;
  };

  // Function to check if item exists
  const checkItemExists = async (itemCode: string, tradeName: string, genericName: string): Promise<{exists: boolean, id?: string}> => {
    try {
      const itemsRef = ref(database, 'inventory');
      
      // Query by code field
      const codeQuery = query(itemsRef, orderByChild('code'), equalTo(itemCode));
      const codeSnapshot = await get(codeQuery);
      
      if (codeSnapshot.exists()) {
        let itemId: string | undefined;
        codeSnapshot.forEach((childSnapshot) => {
          if (!itemId) itemId = childSnapshot.key || undefined;
        });
        return { exists: true, id: itemId };
      }
      
      // If not found by code, try by trade name
      const nameQuery = query(itemsRef, orderByChild('name'), equalTo(tradeName));
      const nameSnapshot = await get(nameQuery);
      
      if (nameSnapshot.exists()) {
        let itemId: string | undefined;
        nameSnapshot.forEach((childSnapshot) => {
          if (!itemId) itemId = childSnapshot.key || undefined;
        });
        return { exists: true, id: itemId };
      }
      
      return { exists: false };
    } catch (error) {
      console.error(`Error checking if item exists:`, error);
      return { exists: false };
    }
  };

  const createInventoryItem = async (item: DrugItem): Promise<string> => {
    try {
      const now = Date.now();
      
      const code = item.itemCode;
      const costPrice = Math.round(item.costPerUnit * 100) / 100;
      const sellingPrice = Math.round(item.sellingPerUnit * 100) / 100;
      
      console.log(`Creating inventory item: ${item.tradeName}, Cost: ${costPrice}, Selling: ${sellingPrice}`);
      
      const inventoryRef = ref(database, 'inventory');
      const newItemRef = push(inventoryRef);
      
      const itemData = {
        name: item.tradeName,
        genericName: item.genericName,
        code: code,
        type: 'drug',
        description: '',
        hasUnitContains: false,
        unitContains: null,
        reorderLevel: 100,
        reorderQuantity: 500,
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        createdAt: now,
        updatedAt: now,
        active: true
      };
      
      await set(newItemRef, itemData);
      return newItemRef.key || '';
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  };

  // Function to generate batch numbers
  const getNextBatchNumber = async (itemId: string): Promise<string> => {
    try {
      const batchesRef = ref(database, 'batches');
      const batches = query(
        batchesRef,
        orderByChild('itemId'),
        equalTo(itemId)
      );
      const snapshot = await get(batches);
      
      if (!snapshot.exists()) {
        return '001';
      }

      const batchNumbers: number[] = [];
      snapshot.forEach((childSnapshot) => {
        const batchNumber = parseInt(childSnapshot.val().batchNumber || '0');
        if (!isNaN(batchNumber)) {
          batchNumbers.push(batchNumber);
        }
      });
      
      const maxBatchNumber = Math.max(...batchNumbers, 0);
      return (maxBatchNumber + 1).toString().padStart(3, '0');
    } catch (error) {
      console.error('Error getting next batch number:', error);
      return Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    }
  };

  // Function to create a batch
  const createBatch = async (
    itemId: string, 
    drugItem: DrugItem,
    purchaseId: string, 
    supplierId: string, 
    batchNumber: string
  ) => {
    if (!itemId) {
      console.warn("Skipping batch creation for undefined itemId");
      return null;
    }

    const now = Date.now();
    
    const costPrice = Math.round(ensureValidNumber(drugItem.costPerUnit, 1) * 100) / 100;
    const unitPrice = Math.round(ensureValidNumber(drugItem.sellingPerUnit, costPrice * 1.2) * 100) / 100;
    const quantity = ensureValidNumber(drugItem.quantity, 1000);
    
    console.log(`Creating batch for item ${itemId} with cost: ${costPrice}, selling: ${unitPrice}, quantity: ${quantity}, expiry: ${drugItem.expiryDate}`);
    
    const batchData = {
      batchNumber: batchNumber,
      itemId: itemId,
      quantity: quantity,
      expiryDate: drugItem.expiryDate.getTime(),
      purchaseId: purchaseId,
      costPrice: costPrice,
      unitPrice: unitPrice,
      supplierId: supplierId,
      createdAt: now,
      updatedAt: now
    };
    
    const sanitizedBatchData = sanitizeForFirebase(batchData);
    
    const batchesRef = ref(database, 'batches');
    const newBatchRef = push(batchesRef);
    
    await set(newBatchRef, sanitizedBatchData);
    return newBatchRef.key;
  };

  // Function to read Excel file with new columns
  const readExcelFile = (file: File): Promise<DrugItem[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          setStage('parsing');
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { 
            type: 'array',
            cellDates: true, // Enable automatic date parsing
            cellNF: false,
            cellStyles: false,
            raw: false // Don't keep raw values for better date parsing
          });
          
          console.log("Available sheets:", workbook.SheetNames);
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          console.log("Worksheet range:", worksheet['!ref']);
          console.log("Sample cells:", {
            A1: worksheet['A1'], B1: worksheet['B1'], C1: worksheet['C1'], 
            D1: worksheet['D1'], E1: worksheet['E1'], F1: worksheet['F1'], G1: worksheet['G1'],
            A2: worksheet['A2'], B2: worksheet['B2'], C2: worksheet['C2'], 
            D2: worksheet['D2'], E2: worksheet['E2'], F2: worksheet['F2'], G2: worksheet['G2']
          });
          
          let rawData;
          
          try {
            rawData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: '',
              raw: false // Important for date parsing
            });
            console.log("Method 1 - Raw data with headers:", rawData.slice(0, 3));
          } catch (e) {
            console.error("Method 1 failed:", e);
          }
          
          if (!rawData || rawData.length === 0) {
            try {
              rawData = XLSX.utils.sheet_to_json(worksheet, {
                defval: '',
                raw: false
              });
              console.log("Method 2 - Raw data with named headers:", rawData.slice(0, 3));
            } catch (e) {
              console.error("Method 2 failed:", e);
            }
          }
          
          if (!rawData || rawData.length === 0) {
            throw new Error("Could not parse Excel file. Please check the file format.");
          }
          
          const drugItems: DrugItem[] = [];
          
          // If rawData[0] is an array, we have array format
          if (Array.isArray(rawData[0])) {
            console.log("Processing as array format");
            
            // Skip header row and process each row
            for (let i = 1; i < rawData.length; i++) {
              const row = rawData[i] as any[];
              
              if (!row || row.length < 7) {
                console.log(`Skipping row ${i + 1}: insufficient columns`, row);
                continue;
              }
              
              const itemCode = String(row[0] || '').trim();
              const genericName = String(row[1] || '').trim();
              const tradeName = String(row[2] || '').trim();
              const rawCostValue = row[3];
              const rawSellingValue = row[4];
              const rawQuantityValue = row[5];
              const rawExpiryValue = row[6];
              
              console.log(`Row ${i + 1} raw values:`, {
                itemCode, genericName, tradeName,
                rawCost: rawCostValue, rawCostType: typeof rawCostValue,
                rawSelling: rawSellingValue, rawSellingType: typeof rawSellingValue,
                rawQuantity: rawQuantityValue, rawQuantityType: typeof rawQuantityValue,
                rawExpiry: rawExpiryValue, rawExpiryType: typeof rawExpiryValue
              });
              
              if (!itemCode || !tradeName) {
                console.log(`Skipping row ${i + 1}: missing required fields`);
                continue;
              }
              
              const costPerUnit = ensureValidNumber(rawCostValue, 1);
              const sellingPerUnit = ensureValidNumber(rawSellingValue, costPerUnit * 1.2);
              const quantity = ensureValidNumber(rawQuantityValue, 1000);
              const expiryDate = parseExcelDate(rawExpiryValue);
              
              console.log(`Row ${i + 1} parsed values:`, {
                costPerUnit, sellingPerUnit, quantity, expiryDate
              });
              
              drugItems.push({
                itemCode, genericName, tradeName,
                costPerUnit, sellingPerUnit, quantity, expiryDate
              });
            }
          } else {
            // Object format - try different key combinations
            console.log("Processing as object format");
            
            (rawData as any[]).forEach((row: any, index: number) => {
              console.log(`Row ${index + 1} object:`, row);
              
              const itemCode = String(
                row['A'] || row['Item Code'] || row['item code'] || row['itemCode'] || 
                row['ItemCode'] || row['ITEM CODE'] || Object.values(row)[0] || ''
              ).trim();
              
              const genericName = String(
                row['B'] || row['Generic Name'] || row['generic name'] || row['genericName'] ||
                row['GenericName'] || row['GENERIC NAME'] || Object.values(row)[1] || ''
              ).trim();
              
              const tradeName = String(
                row['C'] || row['Trade Name'] || row['trade name'] || row['tradeName'] ||
                row['TradeName'] || row['TRADE NAME'] || Object.values(row)[2] || ''
              ).trim();
              
              const rawCostValue = 
                row['D'] || row['Cost per unit'] || row['cost per unit'] || row['costPerUnit'] ||
                row['CostPerUnit'] || row['COST PER UNIT'] || Object.values(row)[3];
              
              const rawSellingValue = 
                row['E'] || row['Selling per unit'] || row['selling per unit'] || row['sellingPerUnit'] ||
                row['SellingPerUnit'] || row['SELLING PER UNIT'] || Object.values(row)[4];
              
              const rawQuantityValue = 
                row['F'] || row['Quantity'] || row['quantity'] || row['QUANTITY'] ||
                row['Stock'] || row['stock'] || row['STOCK'] || Object.values(row)[5];
              
              const rawExpiryValue = 
                row['G'] || row['Expiry Date'] || row['expiry date'] || row['expiryDate'] ||
                row['ExpiryDate'] || row['EXPIRY DATE'] || row['Expiry'] || row['expiry'] ||
                Object.values(row)[6];
              
              console.log(`Row ${index + 1} extracted values:`, {
                itemCode, genericName, tradeName,
                rawCost: rawCostValue, rawSelling: rawSellingValue, 
                rawQuantity: rawQuantityValue, rawExpiry: rawExpiryValue
              });
              
              if (!itemCode || !tradeName) {
                console.log(`Skipping row ${index + 1}: missing required fields`);
                return;
              }
              
              const costPerUnit = ensureValidNumber(rawCostValue, 1);
              const sellingPerUnit = ensureValidNumber(rawSellingValue, costPerUnit * 1.2);
              const quantity = ensureValidNumber(rawQuantityValue, 1000);
              const expiryDate = parseExcelDate(rawExpiryValue);
              
              drugItems.push({
                itemCode, genericName, tradeName,
                costPerUnit, sellingPerUnit, quantity, expiryDate
              });
            });
          }
          
          console.log(`Final parsed ${drugItems.length} drug items:`, drugItems.slice(0, 3));
          resolve(drugItems);
          
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // Process excel data and validate
  const validateDrugItems = async (items: DrugItem[]): Promise<{
    validItems: DrugItem[];
    warnings: string[];
    stats: {
      totalRows: number;
      validRows: number;
      skippedRows: number;
      newItems: number;
      existingItems: number;
    }
  }> => {
    setStage('validating');
    const warnings: string[] = [];
    const validItems: DrugItem[] = [];
    
    let skippedRows = 0;
    let existingItems = 0;
    let newItems = 0;
    
    if (!items || items.length === 0) {
      warnings.push("Excel file contains no valid drug data");
      return { 
        validItems, 
        warnings, 
        stats: { 
          totalRows: 0, 
          validRows: 0, 
          skippedRows: 0, 
          newItems: 0, 
          existingItems: 0 
        } 
      };
    }
    
    const processedItemsArray: {
      item: DrugItem;
      status: 'success' | 'error' | 'skipped';
      message?: string;
    }[] = [];
    
    let counter = 0;
    
    for (const item of items) {
      counter++;
      setProgress(Math.floor((counter / items.length) * 50));
      
      // Skip items without trade name or item code
      if (!item.tradeName || !item.itemCode) {
        skippedRows++;
        processedItemsArray.push({
          item,
          status: 'skipped',
          message: 'Missing trade name or item code'
        });
        continue;
      }
      
      // Validate prices
      if (item.costPerUnit <= 0 || item.sellingPerUnit <= 0) {
        skippedRows++;
        processedItemsArray.push({
          item,
          status: 'skipped',
          message: 'Invalid price values'
        });
        continue;
      }

      // Validate quantity
      if (item.quantity <= 0) {
        skippedRows++;
        processedItemsArray.push({
          item,
          status: 'skipped',
          message: 'Invalid quantity value'
        });
        continue;
      }

      // Validate expiry date
      const today = new Date();
      if (item.expiryDate <= today) {
        skippedRows++;
        processedItemsArray.push({
          item,
          status: 'skipped',
          message: 'Expiry date is in the past or today'
        });
        continue;
      }
      
      try {
        const itemCheck = await checkItemExists(item.itemCode, item.tradeName, item.genericName);
        
        if (itemCheck.exists) {
          existingItems++;
          item.itemId = itemCheck.id;
          validItems.push(item);
          processedItemsArray.push({
            item,
            status: 'success',
            message: 'Existing item found'
          });
        } else {
          newItems++;
          validItems.push(item);
          processedItemsArray.push({
            item,
            status: 'success',
            message: 'Will create new item'
          });
        }
      } catch (error) {
        skippedRows++;
        console.error(`Error validating item ${item.tradeName}:`, error);
        processedItemsArray.push({
          item,
          status: 'error',
          message: `Error: ${(error as Error).message}`
        });
      }
    }
    
    setProcessedItems(processedItemsArray);
    
    if (skippedRows > 0) {
      warnings.unshift(`Skipped ${skippedRows} rows due to validation issues`);
    }
    
    return { 
      validItems, 
      warnings, 
      stats: { 
        totalRows: items.length, 
        validRows: validItems.length, 
        skippedRows, 
        newItems, 
        existingItems 
      } 
    };
  };

  // Main function to create a purchase with all items
  const createDrugPurchase = async (drugItems: DrugItem[]) => {
    try {
      setStage('importing');
      const now = Date.now();
      const today = new Date();
      
      if (drugItems.length === 0) {
        toast.error("No valid items to import");
        return null;
      }
      
      const processedItems: {
        itemId: string;
        drugItem: DrugItem;
        batchNumber: string;
      }[] = [];
      
      let counter = 0;
      for (const item of drugItems) {
        counter++;
        setProgress(50 + Math.floor((counter / drugItems.length) * 25));
        
        let itemId = item.itemId;
        
        if (!itemId) {
          itemId = await createInventoryItem(item);
          item.itemId = itemId;
        }
        
        const batchNumber = await getNextBatchNumber(itemId);
        
        processedItems.push({
          itemId,
          drugItem: item,
          batchNumber
        });
      }
      
      setProgress(75);
      
      const purchasesRef = ref(database, 'purchases');
      const newPurchaseRef = push(purchasesRef);
      
      const totalAmount = Math.round(drugItems.reduce((sum, item) => {
        return sum + (item.costPerUnit * item.quantity);
      }, 0) * 100) / 100;
      
      const purchaseItems = processedItems.map(({ itemId, drugItem, batchNumber }) => ({
        itemId: itemId,
        batchNumber: batchNumber,
        quantity: drugItem.quantity,
        costPricePerUnit: Math.round(drugItem.costPerUnit * 100) / 100,
        sellingPricePerUnit: Math.round(drugItem.sellingPerUnit * 100) / 100,
        expiryDate: drugItem.expiryDate.getTime(),
        totalQuantity: drugItem.quantity
      }));
      
      const purchaseData = {
        supplierId: supplierId || null,
        items: purchaseItems,
        totalAmount: totalAmount,
        purchaseDate: today.getTime(),
        invoiceNumber: invoiceNumber || "DRUG-IMPORT",
        status: "completed",
        createdByName: "Drug Import Tool",
        createdAt: now,
        updatedAt: now,
        notes: `Imported ${drugItems.length} drugs from Excel file with individual quantities and expiry dates`
      };
      
      const sanitizedPurchaseData = sanitizeForFirebase(purchaseData);
      
      console.log('Creating purchase with data:', sanitizedPurchaseData);
      
      await set(newPurchaseRef, sanitizedPurchaseData);
      console.log(`Purchase created with ID: ${newPurchaseRef.key}`);
      
      let processedBatches = 0;
      for (const { itemId, drugItem, batchNumber } of processedItems) {
        await createBatch(
          itemId,
          drugItem,
          newPurchaseRef.key!,
          supplierId,
          batchNumber
        );
        
        processedBatches++;
        setProgress(75 + Math.floor((processedBatches / processedItems.length) * 25));
      }
      
      setProgress(100);
      console.log("Drug import completed successfully!");
      
      return {
        purchaseId: newPurchaseRef.key,
        itemCount: drugItems.length,
        totalAmount
      };
    } catch (error) {
      console.error("Error creating drug purchase:", error);
      throw error;
    }
  };

  // Handle file selection and preview data
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setValidationWarnings([]);
    setStats({ totalRows: 0, validRows: 0, skippedRows: 0, newItems: 0, existingItems: 0 });
    setProcessedItems([]);
    
    try {
      const drugItems = await readExcelFile(selectedFile);
      setPreviewData(drugItems.slice(0, 10));
      
      const { validItems, warnings, stats } = await validateDrugItems(drugItems);
      
      setValidationWarnings(warnings);
      setStats(stats);
      
      toast.success(`Validated ${stats.validRows} drug items from Excel file`);
    } catch (error) {
      console.error("Error processing Excel file:", error);
      toast.error(`Error processing file: ${(error as Error).message}`);
      setStage('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error("Please select an Excel file first");
      return;
    }
    
    if (!supplierId) {
      toast.error("Please select a supplier");
      return;
    }
    
    try {
      setLoading(true);
      setProgress(0);
      
      const drugItems = await readExcelFile(file);
      const { validItems, warnings } = await validateDrugItems(drugItems);
      
      if (validItems.length === 0) {
        toast.error("No valid items to import");
        setLoading(false);
        return;
      }
      
      toast.info(`Starting import of ${validItems.length} drug items...`);
      
      const result = await createDrugPurchase(validItems);
      
      if (result) {
        setStage('complete');
        toast.success(`Successfully imported ${result.itemCount} drugs with individual quantities and expiry dates! Total: Rs${result.totalAmount.toFixed(2)}`);
        
        setTimeout(() => {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setFile(null);
          setPreviewData([]);
          setProcessedItems([]);
          setProgress(0);
          setStage('idle');
        }, 3000);
      }
    } catch (error) {
      console.error("Error importing drugs:", error);
      toast.error(`Import failed: ${(error as Error).message}`);
     setStage('idle');
   } finally {
     setLoading(false);
   }
 };

 return (
   <Card className="w-full">
     <CardHeader>
       <CardTitle>Import Drugs From Excel (Enhanced)</CardTitle>
       <CardDescription>
         Upload an Excel file containing drug details with individual quantities and expiry dates to create inventory items and batches.
       </CardDescription>
     </CardHeader>
     <CardContent>
       <form onSubmit={handleSubmit} className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-2">
             <Label htmlFor="supplier">Supplier *</Label>
             <Select
               value={supplierId}
               onValueChange={(value) => setSupplierId(value)}
               disabled={loading}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Select supplier" />
               </SelectTrigger>
               <SelectContent>
                 {suppliers.map((supplier) => (
                   <SelectItem key={supplier.id} value={supplier.id || ''}>
                     {supplier.name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           
           <div className="space-y-2">
             <Label htmlFor="invoiceNumber">Invoice Number</Label>
             <Input
               id="invoiceNumber"
               value={invoiceNumber}
               onChange={(e) => setInvoiceNumber(e.target.value)}
               placeholder="Enter invoice number"
               disabled={loading}
             />
           </div>
         </div>
         
         <div className="space-y-2">
           <Label htmlFor="excelFile">Excel File *</Label>
           <Input
             id="excelFile"
             type="file"
             accept=".xlsx,.xls"
             onChange={handleFileUpload}
             ref={fileInputRef}
             disabled={loading}
           />
           <p className="text-sm text-muted-foreground">
             File should contain columns: Item Code (A), Generic Name (B), Trade Name (C), Cost per unit (D), Selling per unit (E), Quantity (F), Expiry Date (G)
           </p>
         </div>
         
         {/* Import progress */}
         {(stage !== 'idle' && stage !== 'complete') && (
           <div className="space-y-2">
             <div className="flex justify-between text-sm mb-1">
               <span>{stage === 'parsing' ? 'Parsing Excel file...' : 
                      stage === 'validating' ? 'Validating drugs...' : 
                      'Importing drugs...'}</span>
               <span>{progress}%</span>
             </div>
             <Progress value={progress} />
           </div>
         )}
         
         {/* Success message */}
         {stage === 'complete' && (
           <Alert className="bg-green-50 border-green-200">
             <CheckCircle className="h-4 w-4 text-green-500" />
             <AlertTitle className="text-green-800">Import Complete</AlertTitle>
             <AlertDescription className="text-green-700">
               Successfully imported drugs into inventory with individual quantities and expiry dates.
             </AlertDescription>
           </Alert>
         )}
         
         {/* File information */}
         {file && (
           <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
             <FileSpreadsheet className="h-5 w-5 text-blue-500" />
             <span className="text-sm font-medium">{file.name}</span>
             <span className="text-xs text-gray-500 ml-auto">{(file.size / 1024).toFixed(2)} KB</span>
           </div>
         )}
         
         {/* Excel file preview */}
         {previewData.length > 0 && (
           <div className="space-y-2">
             <h3 className="text-sm font-medium">File Preview (first 10 rows)</h3>
             <div className="rounded-md border overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Item Code</TableHead>
                     <TableHead>Generic Name</TableHead>
                     <TableHead>Trade Name</TableHead>
                     <TableHead>Cost per Unit</TableHead>
                     <TableHead>Selling per Unit</TableHead>
                     <TableHead>Quantity</TableHead>
                     <TableHead>Expiry Date</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {previewData.map((row, index) => (
                     <TableRow key={index}>
                       <TableCell>{row.itemCode}</TableCell>
                       <TableCell>{row.genericName || '-'}</TableCell>
                       <TableCell>{row.tradeName}</TableCell>
                       <TableCell>Rs{row.costPerUnit.toFixed(2)}</TableCell>
                       <TableCell>Rs{row.sellingPerUnit.toFixed(2)}</TableCell>
                       <TableCell>{row.quantity}</TableCell>
                       <TableCell>{row.expiryDate.toLocaleDateString()}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
           </div>
         )}

         {/* Validation stats */}
         {stats.totalRows > 0 && (
           <Alert className="bg-blue-50 border-blue-200">
             <Info className="h-4 w-4 text-blue-500" />
             <AlertTitle className="text-blue-800">File Analysis</AlertTitle>
             <AlertDescription className="text-blue-700">
               <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                 <div>
                   <p className="text-xs text-blue-800">Total Rows</p>
                   <p className="font-bold">{stats.totalRows}</p>
                 </div>
                 <div>
                   <p className="text-xs text-blue-800">Valid Items</p>
                   <p className="font-bold">{stats.validRows}</p>
                 </div>
                 <div>
                   <p className="text-xs text-blue-800">Skipped</p>
                   <p className="font-bold">{stats.skippedRows}</p>
                 </div>
                 <div>
                   <p className="text-xs text-blue-800">New Items</p>
                   <p className="font-bold">{stats.newItems}</p>
                 </div>
                 <div>
                   <p className="text-xs text-blue-800">Existing Items</p>
                   <p className="font-bold">{stats.existingItems}</p>
                 </div>
               </div>
             </AlertDescription>
           </Alert>
         )}
         
         {/* Warnings list */}
         {validationWarnings.length > 0 && (
           <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
             <AlertTriangle className="h-4 w-4 text-yellow-500" />
             <AlertTitle className="text-yellow-700">Validation Warnings</AlertTitle>
             <AlertDescription className="text-yellow-600">
               <p>The import will continue, but some rows may be skipped or require attention.</p>
               <ul className="list-disc list-inside mt-2 space-y-1">
                 {validationWarnings.slice(0, 5).map((warning, index) => (
                   <li key={index}>{warning}</li>
                 ))}
                 {validationWarnings.length > 5 && (
                   <li>...and {validationWarnings.length - 5} more warnings</li>
                 )}
               </ul>
             </AlertDescription>
           </Alert>
         )}

         {/* Processed items details */}
         {processedItems.length > 0 && (
           <div className="space-y-2">
             <h3 className="text-sm font-medium">Processed Items Status</h3>
             <div className="max-h-[300px] overflow-y-auto border rounded-md">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Item Code</TableHead>
                     <TableHead>Drug Name</TableHead>
                     <TableHead>Generic Name</TableHead>
                     <TableHead>Cost Price</TableHead>
                     <TableHead>Selling Price</TableHead>
                     <TableHead>Quantity</TableHead>
                     <TableHead>Expiry Date</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Details</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {processedItems.map((processedItem, index) => (
                     <TableRow key={index} className={
                       processedItem.status === 'success' ? 'bg-green-50' : 
                       processedItem.status === 'error' ? 'bg-red-50' : 'bg-yellow-50'
                     }>
                       <TableCell>{processedItem.item.itemCode}</TableCell>
                       <TableCell>{processedItem.item.tradeName}</TableCell>
                       <TableCell>{processedItem.item.genericName || '-'}</TableCell>
                       <TableCell>Rs{processedItem.item.costPerUnit.toFixed(2)}</TableCell>
                       <TableCell>Rs{processedItem.item.sellingPerUnit.toFixed(2)}</TableCell>
                       <TableCell>{processedItem.item.quantity}</TableCell>
                       <TableCell>{processedItem.item.expiryDate.toLocaleDateString()}</TableCell>
                       <TableCell>
                         <Badge className={
                           processedItem.status === 'success' ? 'bg-green-100 text-green-800 border-green-200' : 
                           processedItem.status === 'error' ? 'bg-red-100 text-red-800 border-red-200' : 
                           'bg-yellow-100 text-yellow-800 border-yellow-200'
                         }>
                           {processedItem.status === 'success' ? 'Ready' : 
                            processedItem.status === 'error' ? 'Error' : 'Skipped'}
                         </Badge>
                       </TableCell>
                       <TableCell>{processedItem.message || '-'}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
           </div>
         )}

         <Button
           type="submit"
           className="w-full mt-4"
           disabled={loading || stats.validRows === 0 || !supplierId}
         >
           {loading ? (
             <>
               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               {stage === 'parsing' ? 'Parsing...' : 
                stage === 'validating' ? 'Validating...' : 
                stage === 'importing' ? 'Importing...' : 
                stage === 'complete' ? 'Completed!' : 'Processing...'}
             </>
           ) : (
             <>
               <Upload className="mr-2 h-4 w-4" />
               Import {stats.validRows} Drugs with Individual Quantities & Expiry Dates
             </>
           )}
         </Button>
       </form>
     </CardContent>
     <CardFooter className="border-t px-6 py-4">
       <div className="text-sm text-muted-foreground">
         <p>This enhanced tool will create inventory items for each drug and set up batches with individual quantities and expiry dates.</p>
         <p>Make sure your Excel file has the correct structure with all 7 columns: Item Code, Generic Name, Trade Name, Cost per unit, Selling per unit, Quantity, and Expiry Date.</p>
         <p className="mt-2 font-medium text-amber-600">
           <AlertTriangle className="inline h-4 w-4 mr-1" />
           Note: Prices will be automatically rounded to 2 decimal places. Expiry dates must be in the future and will be validated.
         </p>
       </div>
     </CardFooter>
   </Card>
 );
};

export default DrugExcelImporter;