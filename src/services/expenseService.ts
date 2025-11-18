// src/services/expenseService.ts

import { database } from '@/lib/firebase';
import { 
  ref, 
  set, 
  push, 
  update,
  remove, 
  get, 
  query, 
  orderByChild, 
  equalTo
} from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { Expense, ExpenseCategory } from '@/types/expense';

const EXPENSE_COLLECTION = 'expenses';
const CATEGORY_COLLECTION = 'expense-categories';

// Helper function to check authentication with fallback for development
function checkAuth(requireAuth = true) {
  const auth = getAuth();
  
  if (!auth.currentUser) {
    console.log("No authenticated user found");
    
    if (requireAuth) {
      console.error("User not authenticated");
      throw new Error("User not authenticated. Please sign in.");
    }
    
    // Return null if not requiring auth (for development purposes)
    return null;
  }
  
  return auth.currentUser;
}

export const expenseService = {
  // Expense CRUD operations
  // async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
  //   try {
  //     // Check authentication - expenses require auth
  //     const user = checkAuth(true);
      
  //     const now = Date.now();
  //     const expenseData = {
  //       ...expense,
  //       // Store date as timestamp for easier querying in Realtime DB
  //       date: expense.date.getTime(),
  //       createdBy: user?.uid,
  //       createdAt: now,
  //       updatedAt: now
  //     };
      
  //     console.log("Creating expense:", expenseData);
      
  //     // Generate a unique key
  //     const newExpenseRef = push(ref(database, EXPENSE_COLLECTION));
      
  //     // Set the data with the generated key
  //     await set(newExpenseRef, expenseData);
      
  //     return newExpenseRef;
  //   } catch (error) {
  //     console.error("Error creating expense:", error);
  //     throw error;
  //   }
  // },

//   async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
//   try {
//     // Check authentication - expenses require auth
//     const user = checkAuth(true);
    
//     const now = Date.now();
//     const expenseData = {
//       ...expense,
//       // Store date as timestamp for easier querying in Realtime DB
//       date: expense.date.getTime(),
//       paidAt: expense.paidAt || now, // Use provided paidAt or current time
//       createdBy: user?.uid,
//       createdAt: now,
//       updatedAt: now
//     };
    
//     console.log("Creating expense:", expenseData);
    
//     // Generate a unique key
//     const newExpenseRef = push(ref(database, EXPENSE_COLLECTION));
    
//     // Set the data with the generated key
//     await set(newExpenseRef, expenseData);
    
//     return newExpenseRef;
//   } catch (error) {
//     console.error("Error creating expense:", error);
//     throw error;
//   }
// },

// async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
//   try {
//     // Check authentication - expenses require auth
//     const user = checkAuth(true);
    
//     const now = Date.now();
    
//     // Try to get active cashier session and link expense to it
//     let sessionId = null;
//     try {
//       const { cashierService } = await import('./cashierService');
//       const activeSession = await cashierService.getActiveSession(user!.uid);
//       if (activeSession && activeSession.isActive) {
//         sessionId = activeSession.id;
//         console.log(`Linking expense to active cashier session: ${sessionId}`);
//       }
//     } catch (sessionError) {
//       console.log('No active cashier session found or error getting session:', sessionError);
//     }
    
//     const expenseData = {
//       ...expense,
//       // Store date as timestamp for easier querying in Realtime DB
//       date: expense.date.getTime(),
//       paidAt: expense.paidAt || now, // Use provided paidAt or current time
//       createdBy: user?.uid,
//       sessionId: sessionId, // Link to active session if available
//       createdAt: now,
//       updatedAt: now
//     };
    
//     console.log("Creating expense:", expenseData);
    
//     // Generate a unique key
//     const newExpenseRef = push(ref(database, EXPENSE_COLLECTION));
//     const expenseId = newExpenseRef.key!;
    
//     // Set the expense data
//     await set(newExpenseRef, expenseData);
    
//     // If we have an active session, add this expense to the session
//     if (sessionId) {
//       try {
//         const { cashierService } = await import('./cashierService');
//         await cashierService.addExpenseToSession(sessionId, expenseId, expense.amount);
//         console.log(`Successfully linked expense ${expenseId} to session ${sessionId}`);
//       } catch (sessionError) {
//         console.error('Error linking expense to session:', sessionError);
//         // Don't throw error - expense was created successfully
//       }
//     }
    
//     return newExpenseRef;
//   } catch (error) {
//     console.error("Error creating expense:", error);
//     throw error;
//   }
// },

async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> & { sessionId?: string }) {
  try {
    // Check authentication - expenses require auth
    const user = checkAuth(true);
    
    const now = Date.now();
    
    // Try to get active cashier session and link expense to it
    let sessionId = expense.sessionId; // Use provided sessionId first
    if (!sessionId) {
      try {
        const { cashierService } = await import('./cashierService');
        const activeSession = await cashierService.getActiveSession(user!.uid);
        if (activeSession && activeSession.isActive) {
          sessionId = activeSession.id;
          console.log(`Linking expense to active cashier session: ${sessionId}`);
        }
      } catch (sessionError) {
        console.log('No active cashier session found or error getting session:', sessionError);
      }
    }
    
    const expenseData = {
      ...expense,
      // Store date as timestamp for easier querying in Realtime DB
      date: expense.date.getTime(),
      paidAt: expense.paidAt || now, // Use provided paidAt or current time
      createdBy: user?.uid,
      sessionId: sessionId, // Link to session if available
      createdAt: now,
      updatedAt: now
    };
    
    console.log("Creating expense:", expenseData);
    
    // Generate a unique key
    const newExpenseRef = push(ref(database, EXPENSE_COLLECTION));
    const expenseId = newExpenseRef.key!;
    
    // Set the data with the generated key
    await set(newExpenseRef, expenseData);
    
    // If we have a sessionId, add this expense to the cashier session
    if (sessionId) {
      try {
        const { cashierService } = await import('./cashierService');
        await cashierService.addExpenseToSession(sessionId, expenseId, expense.amount);
        console.log(`Successfully linked expense ${expenseId} to session ${sessionId}`);
      } catch (sessionError) {
        console.error('Error linking expense to session:', sessionError);
        // Don't throw error - expense was created successfully
      }
    }
    
    return newExpenseRef;
  } catch (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
},

  async createSessionExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>, sessionId: string) {
  try {
    // Check authentication
    const user = checkAuth(true);
    
    const now = Date.now();
    const expenseData = {
      ...expense,
      date: expense.date.getTime(),
      createdBy: user?.uid,
      sessionId: sessionId, // Link to session
      createdAt: now,
      updatedAt: now
    };
    
    console.log("Creating session expense:", expenseData);
    
    // Generate a unique key
    const newExpenseRef = push(ref(database, EXPENSE_COLLECTION));
    const expenseId = newExpenseRef.key!;
    
    // Set the expense data
    await set(newExpenseRef, expenseData);
    
    // Add expense to the session
    const { cashierService } = await import('./cashierService');
    await cashierService.addExpenseToSession(sessionId, expenseId, expense.amount);
    
    return { key: expenseId, expense: expenseData };
  } catch (error) {
    console.error("Error creating session expense:", error);
    throw error;
  }
},

  async ensureDoctorFeesCategory(): Promise<string> {
    try {
      // Check if Doctor Fees category already exists
      const categories = await this.getAllCategories();
      const doctorFeesCategory = categories.find(cat => cat.name === 'Doctor Fees');
      
      if (doctorFeesCategory?.id) {
        return doctorFeesCategory.id;
      }

      // Create Doctor Fees category if it doesn't exist
    const newCategory = await this.createCategory({
      name: 'Doctor Fees',
      description: 'Payments made to doctors for their services'
    });
    
    return newCategory.key!;
  } catch (error) {
    console.error('Error ensuring Doctor Fees category:', error);
    throw new Error('Failed to create Doctor Fees category');
  }
  },

  async updateExpense(id: string, expense: Partial<Omit<Expense, 'id' | 'createdAt'>>) {
    try {
      // Check authentication - expenses require auth
      checkAuth(true);
      
      const expenseRef = ref(database, `${EXPENSE_COLLECTION}/${id}`);
      
      const updates: any = {
        updatedAt: Date.now()
      };
      
      // Add all fields that need to be updated
      if (expense.date) updates.date = expense.date.getTime();
      if (expense.amount !== undefined) updates.amount = expense.amount;
      if (expense.details !== undefined) updates.details = expense.details;
      if (expense.categoryId !== undefined) updates.categoryId = expense.categoryId;
      if (expense.categoryName !== undefined) updates.categoryName = expense.categoryName;
      
      console.log("Updating expense:", id, updates);
      
      return await update(expenseRef, updates);
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  },

  async deleteExpense(id: string) {
    try {
      // Check authentication - expenses require auth
      checkAuth(true);
      
      console.log("Deleting expense:", id);
      
      const expenseRef = ref(database, `${EXPENSE_COLLECTION}/${id}`);
      return await remove(expenseRef);
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  },

  // async getAllExpenses() {

  //   try {
  //     // Check authentication - expenses require auth
  //     checkAuth(true);
      
  //     console.log("Getting all expenses");
      
  //     // Query expenses, ordered by date descending
  //     const expensesRef = ref(database, EXPENSE_COLLECTION);
  //     const snapshot = await get(expensesRef);
      
  //     if (!snapshot.exists()) {
  //       return [];
  //     }
      
  //     const expenses: Expense[] = [];
      
  //     snapshot.forEach((childSnapshot) => {
  //       const data = childSnapshot.val();
  //       expenses.push({
  //         id: childSnapshot.key,
  //         // Convert numeric timestamp back to Date object
  //         date: new Date(data.date),
  //         amount: data.amount,
  //         details: data.details,
  //         categoryId: data.categoryId,
  //         categoryName: data.categoryName,
  //         createdAt: new Date(data.createdAt),
  //         updatedAt: new Date(data.updatedAt)
  //       });
  //     });
      
  //     // Sort by date descending (newest first)
  //     return expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
  //   } catch (error) {
  //     console.error("Error getting expenses:", error);
  //     return [];
  //   }
  // },


  async getAllExpenses() {
  try {
    // Check authentication - expenses require auth
    checkAuth(true);
    
    console.log("Getting all expenses");
    
    // Query expenses, ordered by date descending
    const expensesRef = ref(database, EXPENSE_COLLECTION);
    const snapshot = await get(expensesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const expenses: Expense[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      expenses.push({
        id: childSnapshot.key,
        // Convert numeric timestamp back to Date object
        date: new Date(data.date),
        amount: data.amount,
        details: data.details,
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        paidAt: data.paidAt, // Add this field
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      });
    });
    
    // Sort by date descending (newest first)
    return expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error("Error getting expenses:", error);
    return [];
  }
},


  // Category CRUD operations - categories don't require authentication as per your Firebase rules
  async createCategory(category: Omit<ExpenseCategory, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Get user if available (optional for categories)
      const user = checkAuth(false);
      console.log("User creating category:", user?.email || "Anonymous");
      
      // Validate category data
      if (!category.name || category.name.trim() === '') {
        throw new Error('Category name is required');
      }
      
      const now = Date.now();
      // Prepare category data
      const categoryData = {
        name: category.name.trim(),
        description: category.description || '',
        createdAt: now,
        updatedAt: now,
        ...(user && { createdBy: user.uid })  // Only add createdBy if user is authenticated
      };
      
      console.log("Creating category with data:", categoryData);
      
      // Generate a unique key for the category
      const newCategoryRef = push(ref(database, CATEGORY_COLLECTION));
      
      // Set the data with the generated key
      await set(newCategoryRef, categoryData);
      
      return newCategoryRef;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  async updateCategory(id: string, category: Partial<Omit<ExpenseCategory, 'id' | 'createdAt'>>) {
    try {
      // Categories don't require authentication as per your Firebase rules
      const user = checkAuth(false);
      
      if (category.name !== undefined && category.name.trim() === '') {
        throw new Error('Category name cannot be empty');
      }
      
      const updateData: any = {
        updatedAt: Date.now()
      };
      
      if (category.name) updateData.name = category.name.trim();
      if (category.description !== undefined) updateData.description = category.description;
      
      console.log("Updating category:", id, updateData);
      
      const categoryRef = ref(database, `${CATEGORY_COLLECTION}/${id}`);
      return await update(categoryRef, updateData);
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  async deleteCategory(id: string) {
    try {
      // Categories don't require authentication as per your Firebase rules
      const user = checkAuth(false);
      
      console.log("Deleting category:", id);
      
      const categoryRef = ref(database, `${CATEGORY_COLLECTION}/${id}`);
      return await remove(categoryRef);
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },

  async getAllCategories() {
    try {
      // Categories don't require authentication as per your Firebase rules
      const user = checkAuth(false);
      console.log("User getting categories:", user?.email || "Anonymous");
      
      console.log("Getting all categories from collection:", CATEGORY_COLLECTION);
      const categoriesRef = ref(database, CATEGORY_COLLECTION);
      const snapshot = await get(categoriesRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const categories: ExpenseCategory[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        categories.push({
          id: childSnapshot.key,
          name: data.name || '',
          description: data.description || '',
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        });
      });
      
      // Sort by name
      return categories.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Error getting categories:", error);
      return []; // Return empty array instead of throwing to prevent UI from breaking
    }
  }
};