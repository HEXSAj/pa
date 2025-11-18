// src/services/tagManagementService.ts

import { database } from '@/lib/firebase';
import { ref, set, get, push, remove, update } from 'firebase/database';

export type TagCategory = 
  | 'presentingComplaint' 
  | 'pastMedicalHistory' 
  | 'lungs' 
  | 'medicalTests';

export interface Tag {
  id: string;
  text: string;
  category: TagCategory;
  createdAt: number;
}

export interface TagsByCategory {
  presentingComplaint: string[];
  pastMedicalHistory: string[];
  lungs: string[];
  medicalTests: string[];
}

class TagManagementService {
  private tagsRef = ref(database, 'prescriptionTags');

  // Default tags for each category (to preserve existing ones)
  private defaultTags: TagsByCategory = {
    presentingComplaint: [
      'Fever', 'Headache', 'Cough', 'Cold', 'Wheezing', 'SOB', 'DIB', 'Rhynorrhea',
      'Chest pain', 'Constricting', 'Pleuratic', 'Aching', 'Back pain', 'Left', 'Right', 
      'Upper', 'Lower', 'Ab. pain', 'RIF pain', 'LTG pain', 'LL pain', 'UL pain',
      'Numbness', 'Vomiting', 'Diarrhea', 'Palpitation', 'Dysurea', 'Polyurea',
      'Dysmenorrhea', 'Menorrhagia'
    ],
    pastMedicalHistory: ['HT', 'DM', 'DL', 'BA', 'IHD', 'CKD'],
    lungs: ['Clear', 'left', 'right', 'bilateral', 'Rhonchi +', 'Rhonchi ++', 'Rhonchi +++', 'Creps +', 'Creps++', 'Creps +++'],
    medicalTests: ['FBC', 'CRP', 'ESR', 'URF', 'Lipid Profile', 'FBS', 'S.Cr', 'AST', 'ALT', 'TSH', 'HbA1c', 'RF']
  };

  /**
   * Initialize default tags in database if they don't exist
   */
  async initializeDefaultTags(): Promise<void> {
    try {
      const snapshot = await get(this.tagsRef);
      
      if (!snapshot.exists()) {
        // Database is empty, initialize with default tags
        await set(this.tagsRef, this.defaultTags);
        console.log('Default tags initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing default tags:', error);
      throw error;
    }
  }

  /**
   * Get all tags for a specific category
   */
  async getTagsByCategory(category: TagCategory): Promise<string[]> {
    try {
      const categoryRef = ref(database, `prescriptionTags/${category}`);
      const snapshot = await get(categoryRef);
      
      if (snapshot.exists()) {
        const tags = snapshot.val();
        // Convert to array if it's an object
        if (Array.isArray(tags)) {
          return tags;
        } else if (typeof tags === 'object') {
          return Object.values(tags);
        }
        return [];
      } else {
        // Return default tags if category doesn't exist
        return this.defaultTags[category] || [];
      }
    } catch (error) {
      console.error(`Error getting tags for category ${category}:`, error);
      // Return default tags on error
      return this.defaultTags[category] || [];
    }
  }

  /**
   * Get all tags for all categories
   */
  async getAllTags(): Promise<TagsByCategory> {
    try {
      const snapshot = await get(this.tagsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return {
          presentingComplaint: this.normalizeTagArray(data.presentingComplaint) || this.defaultTags.presentingComplaint,
          pastMedicalHistory: this.normalizeTagArray(data.pastMedicalHistory) || this.defaultTags.pastMedicalHistory,
          lungs: this.normalizeTagArray(data.lungs) || this.defaultTags.lungs,
          medicalTests: this.normalizeTagArray(data.medicalTests) || this.defaultTags.medicalTests,
        };
      } else {
        return this.defaultTags;
      }
    } catch (error) {
      console.error('Error getting all tags:', error);
      return this.defaultTags;
    }
  }

  /**
   * Add a new tag to a category
   */
  async addTag(category: TagCategory, tagText: string): Promise<void> {
    try {
      if (!tagText.trim()) {
        throw new Error('Tag text cannot be empty');
      }

      const tags = await this.getTagsByCategory(category);
      
      // Check if tag already exists (case-insensitive)
      const tagExists = tags.some(
        tag => tag.toLowerCase() === tagText.trim().toLowerCase()
      );
      
      if (tagExists) {
        throw new Error('Tag already exists');
      }

      // Add new tag to the array
      const updatedTags = [...tags, tagText.trim()];
      
      const categoryRef = ref(database, `prescriptionTags/${category}`);
      await set(categoryRef, updatedTags);
      
      console.log(`Tag "${tagText}" added to category ${category}`);
    } catch (error) {
      console.error(`Error adding tag to category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Remove a tag from a category
   */
  async removeTag(category: TagCategory, tagText: string): Promise<void> {
    try {
      const tags = await this.getTagsByCategory(category);
      
      // Remove the tag
      const updatedTags = tags.filter(
        tag => tag.toLowerCase() !== tagText.toLowerCase()
      );
      
      if (updatedTags.length === tags.length) {
        throw new Error('Tag not found');
      }

      const categoryRef = ref(database, `prescriptionTags/${category}`);
      await set(categoryRef, updatedTags);
      
      console.log(`Tag "${tagText}" removed from category ${category}`);
    } catch (error) {
      console.error(`Error removing tag from category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Update/rename a tag in a category
   */
  async updateTag(category: TagCategory, oldTagText: string, newTagText: string): Promise<void> {
    try {
      if (!newTagText.trim()) {
        throw new Error('New tag text cannot be empty');
      }

      const tags = await this.getTagsByCategory(category);
      
      // Check if new tag already exists (case-insensitive)
      const newTagExists = tags.some(
        tag => tag.toLowerCase() === newTagText.trim().toLowerCase() && tag.toLowerCase() !== oldTagText.toLowerCase()
      );
      
      if (newTagExists) {
        throw new Error('New tag name already exists');
      }

      // Update the tag
      const updatedTags = tags.map(tag =>
        tag.toLowerCase() === oldTagText.toLowerCase() ? newTagText.trim() : tag
      );

      const categoryRef = ref(database, `prescriptionTags/${category}`);
      await set(categoryRef, updatedTags);
      
      console.log(`Tag "${oldTagText}" updated to "${newTagText}" in category ${category}`);
    } catch (error) {
      console.error(`Error updating tag in category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Helper to normalize tag arrays from Firebase
   */
  private normalizeTagArray(data: any): string[] | null {
    if (!data) return null;
    
    if (Array.isArray(data)) {
      return data;
    } else if (typeof data === 'object') {
      return Object.values(data);
    }
    
    return null;
  }

  /**
   * Reset tags to default for a specific category
   */
  async resetCategoryToDefaults(category: TagCategory): Promise<void> {
    try {
      const categoryRef = ref(database, `prescriptionTags/${category}`);
      await set(categoryRef, this.defaultTags[category]);
      console.log(`Category ${category} reset to defaults`);
    } catch (error) {
      console.error(`Error resetting category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Reset all tags to defaults
   */
  async resetAllToDefaults(): Promise<void> {
    try {
      await set(this.tagsRef, this.defaultTags);
      console.log('All tags reset to defaults');
    } catch (error) {
      console.error('Error resetting all tags:', error);
      throw error;
    }
  }
}

export const tagManagementService = new TagManagementService();



