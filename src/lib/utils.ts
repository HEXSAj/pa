import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



/**
 * Formats a number as currency
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '-';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR', // Change to your preferred currency
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats a date as a string
 */
export function formatDate(date: Date | undefined | null): string {
  if (!date) return '-';
  
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

/**
 * Calculates the margin percentage between cost and selling price
 */
export function calculateMargin(costPrice: number, sellingPrice: number): string {
  if (costPrice <= 0) return '0.0';
  
  const margin = ((sellingPrice - costPrice) / costPrice) * 100;
  return isNaN(margin) ? '0.0' : margin.toFixed(1);
}

/**
 * Truncates a string to a specified length and adds ellipsis if needed
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}

/**
 * Debounces a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function(...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}