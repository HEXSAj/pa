// src/services/expenseService.ts

import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  Timestamp,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Expense, ExpenseCategory } from '@/types/expense';

const EXPENSE_COLLECTION = 'expenses';
const CATEGORY_COLLECTION = 'expense-categories';

// Helper function to check authentication
function checkAuth() {
  const auth = getAuth();
  if (!auth.currentUser) {
    console.error("User not authenticated");
    throw new Error("User not authenticated. Please sign in.");
  }
  return auth.currentUser;
}

export const expenseService = {
  // Test function to check Firestore access
  async testFirestoreAccess() {
    try {
      const auth = getAuth();
      console.log("Auth state:", auth.currentUser ? `Logged in as ${auth.currentUser.email}` : "Not logged in");
      
      if (!auth.currentUser) {
        console.log("No user is authenticated");
        return false;
      }
      
      // Try to read the collection (just the collection, not the documents)
      const collectionRef = collection(db, CATEGORY_COLLECTION);
      console.log("Collection reference created successfully");
      
      // Try to get documents count
      const snapshot = await getDocs(collectionRef);
      console.log("Successfully read collection, document count:", snapshot.size);
      
      return true;
    } catch (error) {
      console.error("Firestore access test failed:", error);
      return false;
    }
  },

  // Expense CRUD operations
  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Check authentication
      checkAuth();
      
      const expenseData = {
        ...expense,
        date: Timestamp.fromDate(expense.date),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log("Creating expense:", expenseData);
      return await addDoc(collection(db, EXPENSE_COLLECTION), expenseData);
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  },

  async updateExpense(id: string, expense: Partial<Omit<Expense, 'id' | 'createdAt'>>) {
    try {
      // Check authentication
      checkAuth();
      
      const ref = doc(db, EXPENSE_COLLECTION, id);
      const updateData = {
        ...expense,
        ...(expense.date && { date: Timestamp.fromDate(expense.date) }),
        updatedAt: serverTimestamp()
      };
      
      console.log("Updating expense:", id, updateData);
      return await updateDoc(ref, updateData);
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  },

  async deleteExpense(id: string) {
    try {
      // Check authentication
      checkAuth();
      
      console.log("Deleting expense:", id);
      return await deleteDoc(doc(db, EXPENSE_COLLECTION, id));
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  },

  async getAllExpenses() {
    try {
      // Check authentication
      checkAuth();
      
      console.log("Getting all expenses");
      const q = query(collection(db, EXPENSE_COLLECTION), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      }) as Expense[];
    } catch (error) {
      console.error("Error getting expenses:", error);
      return [];
    }
  },

  // Category CRUD operations
  async createCategory(category: Omit<ExpenseCategory, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Check authentication
      const user = checkAuth();
      console.log("Authenticated user creating category:", user.email);
      
      // Validate category data
      if (!category.name || category.name.trim() === '') {
        throw new Error('Category name is required');
      }
      
      // Prepare category data
      const categoryData = {
        name: category.name.trim(),
        description: category.description || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid  // Optional: track who created this
      };
      
      console.log("Creating category with data:", categoryData);
      
      // Add document to collection
      return await addDoc(collection(db, CATEGORY_COLLECTION), categoryData);
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  async updateCategory(id: string, category: Partial<Omit<ExpenseCategory, 'id' | 'createdAt'>>) {
    try {
      // Check authentication
      checkAuth();
      
      if (category.name !== undefined && category.name.trim() === '') {
        throw new Error('Category name cannot be empty');
      }
      
      const updateData = {
        ...(category.name && { name: category.name.trim() }),
        ...(category.description !== undefined && { description: category.description }),
        updatedAt: serverTimestamp()
      };
      
      console.log("Updating category:", id, updateData);
      const ref = doc(db, CATEGORY_COLLECTION, id);
      return await updateDoc(ref, updateData);
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  async deleteCategory(id: string) {
    try {
      // Check authentication
      checkAuth();
      
      console.log("Deleting category:", id);
      return await deleteDoc(doc(db, CATEGORY_COLLECTION, id));
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },

  async getAllCategories() {
    try {
      // Check authentication
      const user = checkAuth();
      console.log("Authenticated user getting categories:", user.email);
      
      console.log("Getting all categories from collection:", CATEGORY_COLLECTION);
      const q = query(collection(db, CATEGORY_COLLECTION), orderBy('name'));
      console.log("Query created successfully");
      
      const snapshot = await getDocs(q);
      console.log("Got categories snapshot, count:", snapshot.size);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      }) as ExpenseCategory[];
    } catch (error) {
      console.error("Error getting categories:", error);
      return []; // Return empty array instead of throwing to prevent UI from breaking
    }
  }
};