// src/services/categoryService.ts

import { database } from '@/lib/firebase';
import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { Category } from '@/types/inventory';

const COLLECTION = 'categories';

// Cache for categories to improve performance
let categoriesCache: Category[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const categoryService = {
  async create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now();
    const categoryData = {
      name: category.name,
      description: category.description || '',
      color: category.color || '#6b7280', // Default gray color
      createdAt: now,
      updatedAt: now
    };

    // Generate a new key and set the data
    const newCategoryRef = push(ref(database, COLLECTION));
    await set(newCategoryRef, categoryData);
    
    // Invalidate cache after creating a new category
    categoriesCache = null;
    
    return newCategoryRef;
  },

  async update(id: string, category: Partial<Omit<Category, 'id' | 'createdAt'>>) {
    const categoryRef = ref(database, `${COLLECTION}/${id}`);
    const updateData: any = {
      updatedAt: Date.now()
    };

    // Only update fields that were provided
    if (category.name !== undefined) updateData.name = category.name;
    if (category.description !== undefined) updateData.description = category.description;
    if (category.color !== undefined) updateData.color = category.color;

    const result = await update(categoryRef, updateData);
    
    // Invalidate cache after updating
    categoriesCache = null;
    
    return result;
  },

  async delete(id: string) {
    // Check if any inventory items are using this category
    const inventoryRef = ref(database, 'inventory');
    const categoryQuery = query(inventoryRef, orderByChild('categoryId'), equalTo(id));
    const snapshot = await get(categoryQuery);
    
    if (snapshot.exists()) {
      throw new Error('Cannot delete category that is being used by inventory items');
    }
    
    const categoryRef = ref(database, `${COLLECTION}/${id}`);
    const result = await remove(categoryRef);
    
    // Invalidate cache after deleting
    categoriesCache = null;
    
    return result;
  },

  async getAll() {
    // Use cache if available and not expired
    const now = Date.now();
    if (categoriesCache && (now - lastFetchTime < CACHE_DURATION)) {
      return categoriesCache;
    }

    const categoriesRef = ref(database, COLLECTION);
    const snapshot = await get(categoriesRef);
    
    if (!snapshot.exists()) {
      categoriesCache = [];
      lastFetchTime = now;
      return [];
    }
    
    const categories: Category[] = [];
    
    // Convert the snapshot to array of categories
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      categories.push({
        id: childSnapshot.key,
        name: data.name,
        description: data.description || '',
        color: data.color || '#6b7280',
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
      });
    });
    
    // Update cache
    categoriesCache = categories;
    lastFetchTime = now;
    
    return categories;
  },
  
  async getById(id: string) {
    // Try to find in cache first
    if (categoriesCache) {
      const cachedCategory = categoriesCache.find(c => c.id === id);
      if (cachedCategory) return cachedCategory;
    }
    
    const categoryRef = ref(database, `${COLLECTION}/${id}`);
    const snapshot = await get(categoryRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    return {
      id: snapshot.key,
      name: data.name,
      description: data.description || '',
      color: data.color || '#6b7280',
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
    } as Category;
  },

  clearCache() {
    categoriesCache = null;
    lastFetchTime = 0;
  }
};