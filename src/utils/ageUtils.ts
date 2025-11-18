// src/utils/ageUtils.ts

/**
 * Calculate age from date of birth
 * @param dob - Date of birth in YYYY-MM-DD format or Date object
 * @returns Object with years and months
 */
export const calculateAge = (dob: string | Date): { years: number; months: number } => {
  const birthDate = typeof dob === 'string' ? new Date(dob) : dob;
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months };
};

/**
 * Format age for display
 * @param dob - Date of birth in YYYY-MM-DD format or Date object
 * @returns Formatted age string (e.g., "25 years, 3 months" or "25 years")
 */
export const formatAge = (dob: string | Date): string => {
  const { years, months } = calculateAge(dob);
  
  if (months === 0) {
    return `${years} years`;
  }
  
  return `${years} years, ${months} months`;
};

/**
 * Get age in years only (for backward compatibility)
 * @param dob - Date of birth in YYYY-MM-DD format or Date object
 * @returns Age in years
 */
export const getAgeInYears = (dob: string | Date): number => {
  return calculateAge(dob).years;
};

/**
 * Check if patient has DOB and calculate age, otherwise return stored age
 * @param patient - Patient object with age and potentially dateOfBirth field
 * @returns Age in years or undefined
 */
export const getPatientAge = (patient: { age?: number; dateOfBirth?: string }): number | undefined => {
  if (patient.dateOfBirth) {
    return getAgeInYears(patient.dateOfBirth);
  }
  return patient.age;
};

/**
 * Format patient age for display
 * @param patient - Patient object with age and potentially dateOfBirth field
 * @returns Formatted age string or 'N/A'
 */
export const formatPatientAge = (patient: { age?: number; dateOfBirth?: string }): string => {
  if (patient.dateOfBirth) {
    return formatAge(patient.dateOfBirth);
  }
  return patient.age ? `${patient.age} years` : 'N/A';
};
