// src/services/reportsService.ts
import { database } from '@/lib/firebase';
import { ref, get, push, set, query, orderByChild, startAt, endAt } from 'firebase/database';
import { Sale } from '@/types/sale';
import { Appointment } from '@/types/appointment';
import { ReportsFilter, ReportsData, ServiceTypeIncome, PaymentMethodBreakdown, PatientTypeBreakdown, CashOutRecord } from '@/types/reports';

const SALES_COLLECTION = 'sales';
const APPOINTMENTS_COLLECTION = 'appointments';
const CASHOUT_COLLECTION = 'cashOutRecords';

export const reportsService = {
  
  async getReportsData(filter: ReportsFilter): Promise<ReportsData> {
    try {
      // Get all sales within date range
      const salesRef = ref(database, SALES_COLLECTION);
      const salesSnapshot = await get(salesRef);
      
      const sales: Sale[] = [];
      if (salesSnapshot.exists()) {
        const salesData = salesSnapshot.val();
        
        // Convert to Sale objects and filter by date
        Object.entries(salesData).forEach(([id, data]: [string, any]) => {
          const sale: Sale = {
            id,
            ...data,
            saleDate: new Date(data.saleDate),
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
          };
          
          // Filter by date range
          const saleDate = sale.saleDate;
          if (saleDate >= filter.startDate && saleDate <= filter.endDate) {
            // Apply additional filters
            if (filter.patientType !== 'all' && sale.patientType !== filter.patientType) return;
            if (filter.paymentMethod !== 'all' && sale.paymentMethod !== filter.paymentMethod) return;
            
            sales.push(sale);
          }
        });
      }
      
      // Get all appointments within date range
      const appointmentsRef = ref(database, APPOINTMENTS_COLLECTION);
      const appointmentsSnapshot = await get(appointmentsRef);
      
      const appointments: Appointment[] = [];
      if (appointmentsSnapshot.exists()) {
        const appointmentsData = appointmentsSnapshot.val();
        
        // Convert to Appointment objects and filter by date
        Object.entries(appointmentsData).forEach(([id, data]: [string, any]) => {
          const appointment: Appointment = {
            id,
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
          };
          
          // Filter by date range and only include paid appointments
          const appointmentDate = new Date(appointment.date);
          if (appointmentDate >= filter.startDate && 
              appointmentDate <= filter.endDate && 
              appointment.payment?.isPaid) {
            appointments.push(appointment);
          }
        });
      }
      
      return this.calculateReportsData(sales, appointments, filter);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      return this.getEmptyReportsData();
    }
  },
  
  calculateReportsData(sales: Sale[], appointments: Appointment[], filter: ReportsFilter): ReportsData {
    const serviceTypes: ServiceTypeIncome = {
      appointments: { lkr: 0, count: 0 },
      procedures: { lkr: 0, count: 0 },
      lab: { lkr: 0, count: 0 },
      pharmacy: { lkr: 0, count: 0 }
    };
    
    const paymentMethods: PaymentMethodBreakdown = {
      cash: { lkr: 0, count: 0 },
      card: { lkr: 0, count: 0 }
    };
    
    const patientTypes: PatientTypeBreakdown = {
      local: { lkr: 0, count: 0, insurance: 0, nonInsurance: 0 }
    };
    
    const dailyBreakdown = new Map<string, {lkr: number, transactions: number}>();
    
    let totalIncome = { lkr: 0 };
    
    // Calculate appointments income
    appointments.forEach(appointment => {
      const appointmentAmount = appointment.totalCharge;
      totalIncome.lkr += appointmentAmount;
      
      // Add to appointments service type
      serviceTypes.appointments.lkr += appointmentAmount;
      serviceTypes.appointments.count++;
      
      // Add to payment methods based on appointment payment
      if (appointment.payment?.paidBy === 'cash') {
        paymentMethods.cash.lkr += appointmentAmount;
        paymentMethods.cash.count++;
      } else if (appointment.payment?.paidBy === 'card') {
        paymentMethods.card.lkr += appointmentAmount;
        paymentMethods.card.count++;
      }
      
      // Add to patient types (all appointments are local patients)
      patientTypes.local.lkr += appointmentAmount;
      patientTypes.local.count++;
      // Note: Appointments don't have insurance info, so we'll count them as non-insurance
      patientTypes.local.nonInsurance++;
    });
    
    sales.forEach(sale => {
      // Only process local patients
      if (sale.patientType !== 'local') {
        return; // Skip foreign patients
      }
      
      const isInsurance = sale.isInsurancePatient || false;
      const dateKey = sale.saleDate.toISOString().split('T')[0];
      
      // Initialize daily breakdown entry
      if (!dailyBreakdown.has(dateKey)) {
        dailyBreakdown.set(dateKey, { lkr: 0, transactions: 0 });
      }
      
      const dailyEntry = dailyBreakdown.get(dateKey)!;
      dailyEntry.transactions++;
      
      // Calculate amounts for local patients only
      const amount = sale.totalAmount;
      totalIncome.lkr += amount;
      dailyEntry.lkr += amount;
      
      // Patient type tracking
      patientTypes.local.lkr += amount;
      patientTypes.local.count++;
      if (isInsurance) patientTypes.local.insurance++;
      else patientTypes.local.nonInsurance++;
      
      // Payment method tracking
      if (sale.paymentMethod === 'cash') {
        paymentMethods.cash.lkr += amount;
        paymentMethods.cash.count++;
      } else if (sale.paymentMethod === 'card') {
        paymentMethods.card.lkr += amount;
        paymentMethods.card.count++;
      }
      
      // Service type breakdown
      this.addLocalServiceAmounts(sale, serviceTypes);
    });
    
    return {
      totalIncome,
      serviceTypes,
      paymentMethods,
      patientTypes,
      totalTransactions: sales.length,
      averageTransactionValue: {
        lkr: sales.length > 0 ? totalIncome.lkr / sales.length : 0
      },
      dailyBreakdown: Array.from(dailyBreakdown.entries()).map(([date, data]) => ({
        date,
        ...data
      })).sort((a, b) => a.date.localeCompare(b.date))
    };
  },
  
  addLocalServiceAmounts(sale: Sale, serviceTypes: ServiceTypeIncome) {
    // Procedures
    if (sale.procedures && sale.procedures.length > 0) {
      const proceduresTotal = sale.proceduresTotal || sale.procedures.reduce((sum, proc) => sum + proc.total, 0);
      serviceTypes.procedures.lkr += proceduresTotal;
      serviceTypes.procedures.count += sale.procedures.length;
    }
    
    // Lab Tests
    if (sale.labTests && sale.labTests.length > 0) {
      const labTotal = sale.labTestsTotal || sale.labTests.reduce((sum, test) => sum + test.total, 0);
      serviceTypes.lab.lkr += labTotal;
      serviceTypes.lab.count += sale.labTests.length;
    }
    
    // Pharmacy
    if (sale.items && sale.items.length > 0) {
      const pharmacyTotal = sale.pharmacyTotal || sale.items.reduce((sum, item) => sum + item.totalPrice, 0);
      serviceTypes.pharmacy.lkr += pharmacyTotal;
      serviceTypes.pharmacy.count += sale.items.length;
    }
  },
  
  
  getEmptyReportsData(): ReportsData {
    return {
      totalIncome: { lkr: 0 },
      serviceTypes: {
        appointments: { lkr: 0, count: 0 },
        procedures: { lkr: 0, count: 0 },
        lab: { lkr: 0, count: 0 },
        pharmacy: { lkr: 0, count: 0 }
      },
      paymentMethods: {
        cash: { lkr: 0, count: 0 },
        card: { lkr: 0, count: 0 }
      },
      patientTypes: {
        local: { lkr: 0, count: 0, insurance: 0, nonInsurance: 0 }
      },
      totalTransactions: 0,
      averageTransactionValue: { lkr: 0 },
      dailyBreakdown: []
    };
  },
  
  // Cash Out functionality
  async recordCashOut(cashOutData: Omit<CashOutRecord, 'id' | 'createdAt'>): Promise<string> {
    try {
      const now = Date.now();
      const docData: any = {
        currency: cashOutData.currency,
        amount: cashOutData.amount,
        cashOutDate: cashOutData.cashOutDate.getTime(),
        performedBy: cashOutData.performedBy,
        createdAt: now
      };
      
      // Only add notes if it exists and is not empty
      if (cashOutData.notes && cashOutData.notes.trim()) {
        docData.notes = cashOutData.notes.trim();
      }
      
      const newCashOutRef = push(ref(database, CASHOUT_COLLECTION));
      await set(newCashOutRef, docData);
      
      return newCashOutRef.key!;
    } catch (error) {
      console.error('Error recording cash out:', error);
      throw error;
    }
  },
  
  async getCashOutRecords(startDate: Date, endDate: Date): Promise<CashOutRecord[]> {
    try {
      const cashOutRef = ref(database, CASHOUT_COLLECTION);
      const snapshot = await get(cashOutRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const cashOutData = snapshot.val();
      const records: CashOutRecord[] = [];
      
      Object.entries(cashOutData).forEach(([id, data]: [string, any]) => {
        const record: CashOutRecord = {
          id,
          ...data,
          cashOutDate: new Date(data.cashOutDate),
          createdAt: new Date(data.createdAt)
        };
        
        // Filter by date range
        const cashOutDate = record.cashOutDate;
        if (cashOutDate >= startDate && cashOutDate <= endDate) {
          records.push(record);
        }
      });
      
      return records.sort((a, b) => b.cashOutDate.getTime() - a.cashOutDate.getTime());
    } catch (error) {
      console.error('Error fetching cash out records:', error);
      return [];
    }
  }
};