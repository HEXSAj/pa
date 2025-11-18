// src/utils/cardUtils.ts
export const formatCardNumberInput = (value: string): string => {
  // Remove all non-digits and asterisks
  const cleanValue = value.replace(/[^\d]/g, '');
  
  // Limit to 12 digits only (4+4+4, skipping 3rd set)
  const limitedValue = cleanValue.substring(0, 12);
  
  let formatted = '';
  
  // First 4 digits
  if (limitedValue.length > 0) {
    formatted += limitedValue.substring(0, Math.min(4, limitedValue.length));
  }
  
  // Second 4 digits with space
  if (limitedValue.length > 4) {
    formatted += ' ' + limitedValue.substring(4, Math.min(8, limitedValue.length));
  }
  
  // Add masked third set when we have more than 8 digits
  if (limitedValue.length > 8) {
    formatted += ' ****';
    // Fourth set (last 4 digits)
    formatted += ' ' + limitedValue.substring(8, Math.min(12, limitedValue.length));
  }
  
  return formatted;
};

export const getCleanCardNumber = (formattedValue: string): string => {
  // Extract only the digits (excluding spaces and asterisks)
  return formattedValue.replace(/[^\d]/g, '');
};

export const maskCardNumber = (inputValue: string): string => {
  const cleanDigits = getCleanCardNumber(inputValue);
  
  if (cleanDigits.length !== 12) {
    return inputValue;
  }
  
  // Format as: 1234 5678 **** 1516
  const first4 = cleanDigits.substring(0, 4);
  const second4 = cleanDigits.substring(4, 8);
  const fourth4 = cleanDigits.substring(8, 12);
  
  return `${first4} ${second4} **** ${fourth4}`;
};

export const getStoredCardNumber = (inputValue: string): string => {
  // This will be the 12 digits without the 3rd set
  return getCleanCardNumber(inputValue);
};

export const validateCardNumber = (inputValue: string): boolean => {
  const cleanNumber = getCleanCardNumber(inputValue);
  return /^\d{12}$/.test(cleanNumber);
};

export const detectCardType = (inputValue: string): string => {
  const cleanNumber = getCleanCardNumber(inputValue);
  
  if (cleanNumber.length < 4) return '';
  
  const firstDigit = cleanNumber.substring(0, 1);
  const firstTwo = cleanNumber.substring(0, 2);
  
  if (firstDigit === '4') return 'Visa';
  if (['51', '52', '53', '54', '55'].includes(firstTwo)) return 'Mastercard';
  if (['34', '37'].includes(firstTwo)) return 'American Express';
  if (firstDigit === '6') return 'Discover';
  
  return 'Unknown';
};

// Helper to manage cursor position
export const getAdjustedCursorPosition = (
  oldValue: string, 
  newValue: string, 
  cursorPos: number
): number => {
  const oldClean = oldValue.replace(/[^\d]/g, '');
  const newClean = newValue.replace(/[^\d]/g, '');
  
  // If we're at the end or adding characters, put cursor at the end
  if (newClean.length >= oldClean.length) {
    return newValue.length;
  }
  
  // Otherwise, try to maintain relative position
  return Math.min(cursorPos, newValue.length);
};