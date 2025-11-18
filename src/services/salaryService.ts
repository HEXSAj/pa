// src/services/salaryService.ts
import { database } from '@/lib/firebase';
import { 
  ref, 
  set, 
  update, 
  get, 
  push,
  query, 
  orderByChild, 
  equalTo, 
  remove 
} from 'firebase/database';
import { Salary, SalaryPayment } from '@/types/salary';

const SALARY_PATH = 'staff_salaries';
const PAYMENT_PATH = 'salary_payments';

export const salaryService = {
  /**
   * Get a staff member's salary information
   */
  async getStaffSalary(staffId: string): Promise<Salary | null> {
    try {
      if (!staffId) return null;
      
      const salaryRef = ref(database, `${SALARY_PATH}/${staffId}`);
      const snapshot = await get(salaryRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return {
        staffId,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error getting staff salary:', error);
      throw error;
    }
  },
  
  /**
   * Create or update a staff member's salary information
   */
  async updateStaffSalary(salary: Omit<Salary, 'updatedAt' | 'createdAt'>): Promise<Salary> {
    try {
      const now = new Date().toISOString();
      const { staffId } = salary;
      
      if (!staffId) {
        throw new Error('Staff ID is required');
      }
      
      // Check if salary record already exists
      const salaryRef = ref(database, `${SALARY_PATH}/${staffId}`);
      const snapshot = await get(salaryRef);
      
      if (snapshot.exists()) {
        // Update existing record
        const updateData = {
          ...salary,
          updatedAt: now
        };
        
        await update(salaryRef, updateData);
        
        return {
          ...updateData,
          createdAt: snapshot.val().createdAt
        };
      } else {
        // Create new record
        const newSalary = {
          ...salary,
          updatedAt: now,
          createdAt: now
        };
        
        await set(salaryRef, newSalary);
        
        return newSalary;
      }
    } catch (error) {
      console.error('Error updating staff salary:', error);
      throw error;
    }
  },
  
  /**
   * Add a new salary payment
   */
  async addSalaryPayment(payment: Omit<SalaryPayment, 'id'>): Promise<SalaryPayment> {
    try {
      // Create a new payment with a generated key
      const newPaymentRef = push(ref(database, PAYMENT_PATH));
      const id = newPaymentRef.key;
      
      if (!id) {
        throw new Error('Failed to generate payment ID');
      }
      
      const newPayment = {
        ...payment,
        id,
        status: 'paid', // Default to paid
        receiptNumber: generateReceiptNumber(),
      };
      
      await set(newPaymentRef, newPayment);
      
      return newPayment;
    } catch (error) {
      console.error('Error adding salary payment:', error);
      throw error;
    }
  },
  
  /**
   * Get all salary payments
   */
  async getAllSalaryPayments(): Promise<SalaryPayment[]> {
    try {
      const paymentsRef = ref(database, PAYMENT_PATH);
      const snapshot = await get(paymentsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const payments: SalaryPayment[] = [];
      
      snapshot.forEach((childSnapshot) => {
        payments.push({
          id: childSnapshot.key!,
          ...childSnapshot.val()
        });
      });
      
      // Sort by payment date (descending)
      payments.sort((a, b) => 
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      );
      
      return payments;
    } catch (error) {
      console.error('Error getting all salary payments:', error);
      throw error;
    }
  },
  
  /**
   * Get salary payments for a specific staff member
   */
  async getSalaryPaymentsByStaff(staffId: string): Promise<SalaryPayment[]> {
    try {
      const paymentsQuery = query(
        ref(database, PAYMENT_PATH),
        orderByChild('staffId'),
        equalTo(staffId)
      );
      
      const snapshot = await get(paymentsQuery);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const payments: SalaryPayment[] = [];
      
      snapshot.forEach((childSnapshot) => {
        payments.push({
          id: childSnapshot.key!,
          ...childSnapshot.val()
        });
      });
      
      // Sort by payment date (descending)
      payments.sort((a, b) => 
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      );
      
      return payments;
    } catch (error) {
      console.error('Error getting staff salary payments:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific salary payment by ID
   */
  async getSalaryPayment(paymentId: string): Promise<SalaryPayment | null> {
    try {
      const paymentRef = ref(database, `${PAYMENT_PATH}/${paymentId}`);
      const snapshot = await get(paymentRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return {
        id: paymentId,
        ...snapshot.val()
      };
    } catch (error) {
      console.error('Error getting salary payment:', error);
      throw error;
    }
  },
  
  /**
   * Update a salary payment
   */
  async updateSalaryPayment(payment: SalaryPayment): Promise<SalaryPayment> {
    try {
      const paymentRef = ref(database, `${PAYMENT_PATH}/${payment.id}`);
      await update(paymentRef, payment);
      
      return payment;
    } catch (error) {
      console.error('Error updating salary payment:', error);
      throw error;
    }
  },
  
  /**
   * Delete a salary payment
   */
  async deleteSalaryPayment(paymentId: string): Promise<void> {
    try {
      const paymentRef = ref(database, `${PAYMENT_PATH}/${paymentId}`);
      await remove(paymentRef);
    } catch (error) {
      console.error('Error deleting salary payment:', error);
      throw error;
    }
  },
  
  /**
   * Generate salary and payment reports
   */
  async generateSalaryReport(startDate: Date, endDate: Date, staffId?: string): Promise<any> {
    try {
      // This would be implemented with more complex reporting logic in a real system
      // For now, we'll return a simplified report
      
      let payments: SalaryPayment[];
      
      if (staffId) {
        // Get payments for a specific staff member
        payments = await this.getSalaryPaymentsByStaff(staffId);
      } else {
        // Get all payments
        payments = await this.getAllSalaryPayments();
      }
      
      // Filter by date range
      const filteredPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
      
      // Calculate totals
      const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const paymentsByMethod = filteredPayments.reduce((acc, payment) => {
        const method = payment.paymentMethod;
        acc[method] = (acc[method] || 0) + payment.amount;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        startDate,
        endDate,
        staffId,
        totalPayments: filteredPayments.length,
        totalAmount,
        paymentsByMethod,
        payments: filteredPayments
      };
    } catch (error) {
      console.error('Error generating salary report:', error);
      throw error;
    }
  }
};

// Helper function to generate a receipt number
function generateReceiptNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `SAL-${year}${month}${day}-${random}`;
}