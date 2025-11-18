// src/services/installmentService.ts

import { database } from '@/lib/firebase';
import { ref, set, update, remove, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { InstallmentPlan, Installment, Purchase } from '@/types/purchase';

const INSTALLMENT_PLANS_PATH = 'installmentPlans';

export const installmentService = {
  // Create an installment plan
  async createInstallmentPlan(
    purchaseId: string,
    installmentCount: number,
    frequency: 'weekly' | 'monthly' | 'custom',
    startDate: Date,
    customDueDates?: Date[]
  ): Promise<string> {
    try {
      const now = Date.now();
      
      // Get purchase details
      const purchaseRef = ref(database, `purchases/${purchaseId}`);
      const purchaseSnapshot = await get(purchaseRef);
      
      if (!purchaseSnapshot.exists()) {
        throw new Error('Purchase not found');
      }
      
      const purchase = purchaseSnapshot.val() as Purchase;
      const remainingAmount = purchase.dueAmount || 0;
      
      if (remainingAmount <= 0) {
        throw new Error('No remaining amount to create installment plan');
      }
      
      // Calculate installment amount
      const installmentAmount = Math.round((remainingAmount / installmentCount) * 100) / 100;
      
      // Generate installments
      const installments: Installment[] = [];
      
      for (let i = 0; i < installmentCount; i++) {
        let dueDate: Date;
        
        if (frequency === 'custom' && customDueDates && customDueDates[i]) {
          dueDate = customDueDates[i];
        } else {
          dueDate = new Date(startDate);
          if (frequency === 'weekly') {
            dueDate.setDate(startDate.getDate() + (i * 7));
          } else if (frequency === 'monthly') {
            dueDate.setMonth(startDate.getMonth() + i);
          }
        }
        
        // Adjust last installment to cover any rounding differences
        const amount = i === installmentCount - 1 
          ? remainingAmount - (installmentAmount * (installmentCount - 1))
          : installmentAmount;
        
        installments.push({
          installmentNumber: i + 1,
          dueDate,
          amount,
          status: 'pending'
        });
      }
      
      // Create installment plan
      const installmentPlan: Omit<InstallmentPlan, 'id'> = {
        purchaseId,
        totalAmount: remainingAmount,
        installmentCount,
        installmentAmount,
        frequency,
        startDate,
        installments,
        createdAt: new Date(now),
        updatedAt: new Date(now)
      };
      
      // Save to database
      const plansRef = ref(database, INSTALLMENT_PLANS_PATH);
      const newPlanRef = push(plansRef);
      const planId = newPlanRef.key!;
      
      await set(newPlanRef, {
        ...installmentPlan,
        startDate: startDate.getTime(),
        createdAt: now,
        updatedAt: now,
        installments: installments.map(inst => ({
          ...inst,
          dueDate: inst.dueDate.getTime(),
          paidDate: inst.paidDate?.getTime() || null
        }))
      });
      
      // Update purchase with installment plan reference
      await update(purchaseRef, {
        hasInstallmentPlan: true,
        installmentPlanId: planId,
        updatedAt: now
      });
      
      return planId;
    } catch (error) {
      console.error('Error creating installment plan:', error);
      throw error;
    }
  },
  
  // Get installment plan for a purchase
  async getInstallmentPlan(purchaseId: string): Promise<InstallmentPlan | null> {
    try {
      const plansRef = ref(database, INSTALLMENT_PLANS_PATH);
      const planQuery = query(plansRef, orderByChild('purchaseId'), equalTo(purchaseId));
      const snapshot = await get(planQuery);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      let planData: any = null;
      let planId: string = '';
      
      snapshot.forEach((childSnapshot) => {
        planData = childSnapshot.val();
        planId = childSnapshot.key!;
      });
      
      if (!planData) return null;
      
      return {
        id: planId,
        ...planData,
        startDate: new Date(planData.startDate),
        createdAt: new Date(planData.createdAt),
        updatedAt: new Date(planData.updatedAt),
        installments: planData.installments.map((inst: any) => ({
          ...inst,
          dueDate: new Date(inst.dueDate),
          paidDate: inst.paidDate ? new Date(inst.paidDate) : undefined
        }))
      };
    } catch (error) {
      console.error('Error getting installment plan:', error);
      throw error;
    }
  },
  
  // Pay an installment
  async payInstallment(
    planId: string,
    installmentNumber: number,
    paymentAmount: number,
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'cheque',
    notes?: string,
    recordedBy?: string,
    recordedByName?: string
  ): Promise<void> {
    try {
      const now = Date.now();
      
      // Get installment plan
      const planRef = ref(database, `${INSTALLMENT_PLANS_PATH}/${planId}`);
      const planSnapshot = await get(planRef);
      
      if (!planSnapshot.exists()) {
        throw new Error('Installment plan not found');
      }
      
      const planData = planSnapshot.val();
      const installments = [...planData.installments];
      
      // Find the installment
      const installmentIndex = installments.findIndex(
        inst => inst.installmentNumber === installmentNumber
      );
      
      if (installmentIndex === -1) {
        throw new Error('Installment not found');
      }
      
      const installment = installments[installmentIndex];
      
      if (installment.status === 'paid') {
        throw new Error('Installment already paid');
      }
      
      if (paymentAmount > installment.amount) {
        throw new Error('Payment amount exceeds installment amount');
      }
      
      // Update installment
      installments[installmentIndex] = {
        ...installment,
        status: paymentAmount >= installment.amount ? 'paid' : 'pending',
        paidDate: now,
        paidAmount: paymentAmount,
        paymentMethod,
        notes,
        recordedBy,
        recordedByName
      };
      
      // Update installment plan
      await update(planRef, {
        installments,
        updatedAt: now
      });
      
      // Update purchase payment status
      await this.updatePurchasePaymentStatus(planData.purchaseId);
      
    } catch (error) {
      console.error('Error paying installment:', error);
      throw error;
    }
  },
  
  // Update purchase payment status based on installment progress
  async updatePurchasePaymentStatus(purchaseId: string): Promise<void> {
    try {
      const plan = await this.getInstallmentPlan(purchaseId);
      if (!plan) return;
      
      const paidInstallments = plan.installments.filter(inst => inst.status === 'paid');
      const totalPaid = paidInstallments.reduce((sum, inst) => sum + (inst.paidAmount || 0), 0);
      const remainingDue = plan.totalAmount - totalPaid;
      
      let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
      if (remainingDue <= 0) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      }
      
      // Update purchase
      const purchaseRef = ref(database, `purchases/${purchaseId}`);
      await update(purchaseRef, {
        dueAmount: remainingDue,
        paymentStatus,
        isPaid: paymentStatus === 'paid',
        updatedAt: Date.now()
      });
      
    } catch (error) {
      console.error('Error updating purchase payment status:', error);
      throw error;
    }
  },
  
  // Get overdue installments
  async getOverdueInstallments(): Promise<{plan: InstallmentPlan, overdue: Installment[]}[]> {
    try {
      const plansRef = ref(database, INSTALLMENT_PLANS_PATH);
      const snapshot = await get(plansRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const overdueData: {plan: InstallmentPlan, overdue: Installment[]}[] = [];
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      snapshot.forEach((childSnapshot) => {
        const planData = childSnapshot.val();
        const plan: InstallmentPlan = {
          id: childSnapshot.key!,
          ...planData,
          startDate: new Date(planData.startDate),
          createdAt: new Date(planData.createdAt),
          updatedAt: new Date(planData.updatedAt),
          installments: planData.installments.map((inst: any) => ({
            ...inst,
            dueDate: new Date(inst.dueDate),
            paidDate: inst.paidDate ? new Date(inst.paidDate) : undefined
          }))
        };
        
        const overdueInstallments = plan.installments.filter(inst => 
          inst.status === 'pending' && inst.dueDate < today
        );
        
        if (overdueInstallments.length > 0) {
          // Update status to overdue
          overdueInstallments.forEach(inst => {
            inst.status = 'overdue';
          });
          
          overdueData.push({
            plan,
            overdue: overdueInstallments
          });
        }
      });
      
      return overdueData;
    } catch (error) {
      console.error('Error getting overdue installments:', error);
      throw error;
    }
  }
};