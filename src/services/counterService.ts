// src/services/counterService.ts

import { database } from '@/lib/firebase';
import { ref, get, set, runTransaction } from 'firebase/database';

export const counterService = {
  /**
   * Generate a unique incremental code with the specified prefix and padding
   * @param counterName The name of the counter to use
   * @param prefix Optional prefix for the code (e.g., 'INV-')
   * @param padding Number of digits to pad with zeros (default: 4)
   * @returns Promise with the generated code
   */
  async generateCode(counterName: string, prefix: string = '', padding: number = 4): Promise<string> {
    try {
      const counterRef = ref(database, `counters/${counterName}`);
      
      // Use a transaction to ensure atomic operation and prevent race conditions
      return await runTransaction(counterRef, (currentValue) => {
        // If counter doesn't exist, start from 1
        const nextValue = (currentValue || 0) + 1;
        return nextValue;
      }).then(result => {
        const counterValue = result.snapshot.val();
        // Format the counter value with leading zeros
        const paddedNumber = String(counterValue).padStart(padding, '0');
        return `${prefix}${paddedNumber}`;
      });
    } catch (error) {
      console.error('Error generating code:', error);
      throw new Error('Failed to generate unique code');
    }
  },
  
  /**
   * Check if a code already exists to ensure uniqueness
   * @param collection The collection to check
   * @param code The code to check
   * @returns Promise<boolean> True if code exists, false otherwise
   */
  async codeExists(collection: string, code: string): Promise<boolean> {
    try {
      const collectionRef = ref(database, collection);
      const snapshot = await get(collectionRef);
      
      if (!snapshot.exists()) {
        return false;
      }
      
      // Check if any item has this code
      let exists = false;
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.code === code) {
          exists = true;
          return true; // Break the forEach loop
        }
      });
      
      return exists;
    } catch (error) {
      console.error('Error checking code existence:', error);
      throw new Error('Failed to check code uniqueness');
    }
  },
  
  /**
   * Reset a counter to a specific value
   * @param counterName The name of the counter to reset
   * @param value The value to reset to (default: 0)
   */
  async resetCounter(counterName: string, value: number = 0): Promise<void> {
    try {
      const counterRef = ref(database, `counters/${counterName}`);
      await set(counterRef, value);
    } catch (error) {
      console.error('Error resetting counter:', error);
      throw new Error('Failed to reset counter');
    }
  }
};