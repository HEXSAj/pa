// src/utils/reportUtils.ts
import { Appointment } from '@/types/appointment';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';

export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRangeFromFilter(filter: string, customStart?: string, customEnd?: string): DateRange {
  const now = new Date();
  
  switch (filter) {
    case 'thisMonth':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    case 'thisYear':
      return {
        start: startOfYear(now),
        end: endOfYear(now)
      };
    case 'last30Days':
      return {
        start: subDays(now, 30),
        end: now
      };
    case 'custom':
      return {
        start: new Date(customStart || now),
        end: new Date(customEnd || now)
      };
    default:
      return {
        start: new Date(0),
        end: now
      };
  }
}

export function calculateRevenueMetrics(appointments: Appointment[]) {
  let totalDoctorFees = 0;
  let totalCenterCharges = 0;
  let totalRevenue = 0;
  let paidCount = 0;
  let refundedCount = 0;
  
  appointments.forEach(appointment => {
    // Count refunded appointments
    if (appointment.payment?.refunded) {
      refundedCount++;
      return; // Skip refunded appointments from revenue calculations
    }
    
    // Count paid appointments and calculate revenue
    if (appointment.payment?.isPaid) {
      paidCount++;
      totalRevenue += appointment.manualAppointmentAmount || 0;
      
      
      // Doctor fees only for arrived and paid (non-refunded) appointments
      if (appointment.isPatientArrived) {
        const doctorCharges = appointment.manualAppointmentAmount || 0;
        totalDoctorFees += doctorCharges;
      }
    }
  });
  
  return {
    totalDoctorFees,
    totalCenterCharges,
    totalRevenue,
    paidCount,
    refundedCount
  };
}

export function generateAppointmentCSV(appointments: Appointment[]): string {
  const headers = [
    'Appointment ID',
    'Patient Name',
    'Patient Contact',
    'Doctor Name',
    'Date',
    'Start Time',
    'End Time',
    'Status',
    'Total Charge',
    'Payment Status',
    'Payment Method',
    'Refunded',
    'Patient Arrived',
    'Procedures',
    'Doctor Charges',
  ];
  
  const rows = appointments.map(apt => [
    apt.id || '',
    apt.patientName,
    apt.patientContact,
    apt.doctorName,
    apt.date,
    apt.startTime,
    apt.endTime,
    apt.status,
    apt.totalCharge.toString(),
    apt.payment?.isPaid ? 'Paid' : 'Unpaid',
    apt.payment?.paidBy || '',
    apt.payment?.refunded ? 'Yes' : 'No',
    apt.isPatientArrived ? 'Yes' : 'No',
    apt.procedures.map(p => p.procedureName).join('; '),
    apt.procedures.reduce((sum, p) => sum + p.doctorCharge, 0).toString(),
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}