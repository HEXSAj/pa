// src/utils/excelCategoryExtractor.ts

/**
 * Utility functions to help extract categories from Excel files
 */

// Common medical/pharmacy category names to look for in Excel files
export const COMMON_CATEGORIES = [
    'DIAPERS',
    'SYRUP',
    'EYE DROPS',
    'VITAMIN',
    'TABLET',
    'TABLETS',
    'CAPSULE',
    'CAPSULES',
    'CREAM',
    'LOTION',
    'INJECTION',
    'OINTMENT',
    'GEL',
    'SOLUTION',
    'SUSPENSION',
    'POWDER',
    'SPRAY',
    'INHALERS',
    'SUPPOSITORY',
    'PATCH'
  ];
  
  /**
   * Extract potential categories from Excel data
   * @param rows The Excel data as an array of objects
   * @returns Array of unique category names
   */
  export function extractCategoriesFromExcel(rows: any[]): string[] {
    const uniqueCategories = new Set<string>();
    
    // Look for categories in common column names
    const potentialCategoryFields = [
      'CATEGORY', 'Category', 'category',
      'TYPE', 'Type', 'type',
      'GROUP', 'Group', 'group',
      'CLASS', 'Class', 'class',
      'FORM', 'Form', 'form',
      'DOSAGE FORM', 'Dosage Form', 'dosage form'
    ];
    
    // Process each row
    rows.forEach(row => {
      // Check common column names first
      for (const field of potentialCategoryFields) {
        if (row[field] && typeof row[field] === 'string') {
          const category = row[field].trim().toUpperCase();
          uniqueCategories.add(category);
        }
      }
      
      // Check if any value in the row matches our common categories
      Object.values(row).forEach(value => {
        if (typeof value === 'string') {
          const upperValue = value.trim().toUpperCase();
          
          // Check against our list of common categories
          if (COMMON_CATEGORIES.includes(upperValue)) {
            uniqueCategories.add(upperValue);
          }
          
          // Also check for partial matches if the value is long enough to be a phrase containing a category
          if (upperValue.length > 10) {
            for (const category of COMMON_CATEGORIES) {
              if (upperValue.includes(category)) {
                uniqueCategories.add(category);
              }
            }
          }
        }
      });
    });
    
    return Array.from(uniqueCategories);
  }
  
  /**
   * Extracts categories from Excel array data (rows as arrays instead of objects)
   * @param arrayData Excel data as arrays of values
   * @returns Array of unique category names
   */
  export function extractCategoriesFromArrayData(arrayData: any[][]): string[] {
    const uniqueCategories = new Set<string>();
    
    arrayData.forEach(row => {
      if (!Array.isArray(row)) return;
      
      row.forEach(cell => {
        if (typeof cell === 'string') {
          const upperCell = cell.trim().toUpperCase();
          
          // Direct matches
          if (COMMON_CATEGORIES.includes(upperCell)) {
            uniqueCategories.add(upperCell);
          }
          
          // Check for categories within longer text
          if (upperCell.length > 10) {
            for (const category of COMMON_CATEGORIES) {
              if (upperCell.includes(category)) {
                uniqueCategories.add(category);
              }
            }
          }
        }
      });
    });
    
    return Array.from(uniqueCategories);
  }
  
  /**
   * Generate a random color suitable for category display
   * @returns CSS color string in HSL format
   */
  export function generateRandomColor(): string {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  }
  
  /**
   * Check if a category already exists in the database
   * @param categoryName Name of the category to check
   * @param existingCategories Array of existing categories
   * @returns Boolean indicating if the category exists
   */
  export function categoryExists(categoryName: string, existingCategories: any[]): boolean {
    return existingCategories.some(
      cat => cat.name.toLowerCase() === categoryName.toLowerCase()
    );
  }