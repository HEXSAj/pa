// src/services/diagnosisManagementService.ts

import { database } from '@/lib/firebase';
import { ref, set, get, push, remove, query, orderByChild, limitToLast } from 'firebase/database';

export interface SavedDiagnosis {
  id: string;
  text: string;
  usageCount: number;
  lastUsedAt: number;
  createdAt: number;
}

class DiagnosisManagementService {
  private diagnosesRef = ref(database, 'savedDiagnoses');

  /**
   * Get all saved diagnoses, sorted by usage count and last used
   */
  async getAllDiagnoses(): Promise<SavedDiagnosis[]> {
    try {
      const snapshot = await get(this.diagnosesRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const diagnoses: SavedDiagnosis[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Sort by usage count (descending) and then by last used (descending)
        return diagnoses.sort((a, b) => {
          if (b.usageCount !== a.usageCount) {
            return b.usageCount - a.usageCount;
          }
          return b.lastUsedAt - a.lastUsedAt;
        });
      }
      
      return [];
    } catch (error) {
      console.error('Error getting all diagnoses:', error);
      return [];
    }
  }

  /**
   * Search diagnoses by text (case-insensitive)
   */
  async searchDiagnoses(searchTerm: string): Promise<SavedDiagnosis[]> {
    try {
      const allDiagnoses = await this.getAllDiagnoses();
      
      if (!searchTerm.trim()) {
        return allDiagnoses;
      }
      
      const lowerSearchTerm = searchTerm.toLowerCase();
      return allDiagnoses.filter(diagnosis =>
        diagnosis.text.toLowerCase().includes(lowerSearchTerm)
      );
    } catch (error) {
      console.error('Error searching diagnoses:', error);
      return [];
    }
  }

  /**
   * Save or update a diagnosis
   * If the diagnosis already exists, increment usage count
   * If new, create a new entry
   */
  async saveOrUpdateDiagnosis(diagnosisText: string): Promise<void> {
    try {
      if (!diagnosisText.trim()) {
        return;
      }

      const trimmedText = diagnosisText.trim();
      const allDiagnoses = await this.getAllDiagnoses();
      
      // Check if diagnosis already exists (case-insensitive)
      const existingDiagnosis = allDiagnoses.find(
        d => d.text.toLowerCase() === trimmedText.toLowerCase()
      );

      if (existingDiagnosis) {
        // Update existing diagnosis
        const diagnosisRef = ref(database, `savedDiagnoses/${existingDiagnosis.id}`);
        await set(diagnosisRef, {
          text: trimmedText, // Keep the original casing
          usageCount: existingDiagnosis.usageCount + 1,
          lastUsedAt: Date.now(),
          createdAt: existingDiagnosis.createdAt
        });
      } else {
        // Create new diagnosis
        const newDiagnosisRef = push(this.diagnosesRef);
        await set(newDiagnosisRef, {
          text: trimmedText,
          usageCount: 1,
          lastUsedAt: Date.now(),
          createdAt: Date.now()
        });
      }
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      throw error;
    }
  }

  /**
   * Delete a diagnosis by ID
   */
  async deleteDiagnosis(diagnosisId: string): Promise<void> {
    try {
      const diagnosisRef = ref(database, `savedDiagnoses/${diagnosisId}`);
      await remove(diagnosisRef);
      console.log(`Diagnosis ${diagnosisId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting diagnosis:', error);
      throw error;
    }
  }

  /**
   * Get most frequently used diagnoses
   */
  async getMostUsedDiagnoses(limit: number = 10): Promise<SavedDiagnosis[]> {
    try {
      const allDiagnoses = await this.getAllDiagnoses();
      return allDiagnoses.slice(0, limit);
    } catch (error) {
      console.error('Error getting most used diagnoses:', error);
      return [];
    }
  }

  /**
   * Update diagnosis text (rename)
   */
  async updateDiagnosisText(diagnosisId: string, newText: string): Promise<void> {
    try {
      if (!newText.trim()) {
        throw new Error('Diagnosis text cannot be empty');
      }

      const allDiagnoses = await this.getAllDiagnoses();
      const diagnosis = allDiagnoses.find(d => d.id === diagnosisId);
      
      if (!diagnosis) {
        throw new Error('Diagnosis not found');
      }

      // Check if new text already exists (case-insensitive)
      const duplicate = allDiagnoses.find(
        d => d.id !== diagnosisId && d.text.toLowerCase() === newText.trim().toLowerCase()
      );
      
      if (duplicate) {
        throw new Error('A diagnosis with this name already exists');
      }

      const diagnosisRef = ref(database, `savedDiagnoses/${diagnosisId}`);
      await set(diagnosisRef, {
        ...diagnosis,
        text: newText.trim()
      });
    } catch (error) {
      console.error('Error updating diagnosis text:', error);
      throw error;
    }
  }

  /**
   * Clear all diagnoses (use with caution)
   */
  async clearAllDiagnoses(): Promise<void> {
    try {
      await set(this.diagnosesRef, null);
      console.log('All diagnoses cleared');
    } catch (error) {
      console.error('Error clearing all diagnoses:', error);
      throw error;
    }
  }
}

export const diagnosisManagementService = new DiagnosisManagementService();



