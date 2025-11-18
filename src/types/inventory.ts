// src/types/inventory.ts

import { Timestamp } from 'firebase/firestore';

export interface MedicineTypeModel {
  id?: string;
  name: string;
  defaultUnit: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  id?: string;
  name: string;
  description?: string;
  color?: string; // For color-coding categories in the UI
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UnitMeasurement {
  value: number;
  unit: string;
}

export const getMedicineTypeUnit = (typeName: string, types: MedicineTypeModel[]): string => {
  // Find the type in our custom types
  const foundType = types.find(type => type.name === typeName);
  if (foundType) {
    return foundType.defaultUnit;
  }
  
  // Fallback to default logic for backward compatibility
  switch (typeName) {
    case 'Tablet':
    case 'Capsule':
      return 'tablets';
    case 'Syrup':
      return 'ml';
    case 'Injection':
      return 'ml';
    case 'Cream':
    case 'Ointment':
      return 'g';
    default:
      return 'units';
  }
};

export interface InventoryItem {
  id?: string;
  code: string;
  name: string;
  genericName: string;  // Trade name (brand name)
  type?: string; // Changed from MedicineType to string to support custom types, now optional
  categoryId?: string; // New field for category
  categoryName?: string; // For easier display, optional
  categoryColor?: string; // Added for displaying the category color
  hasUnitContains: boolean;
  unitContains?: UnitMeasurement;
  minQuantity: number;

  mainItemName?: string; // Add this for secondary items
  mainItemCode?: string; // Optional
  mainItemId?: string;   // Optional

  // New optional fields
  brand?: string; // Brand of the item
  supplier?: string; // Supplier name
  costPrice?: number; // Cost price
  sellingPrice?: number; // Selling price
  currentStock?: number; // Current stock quantity

  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}