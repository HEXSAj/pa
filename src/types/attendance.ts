
// src/types/attendance.ts
import { StaffUser } from './staff';

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'holiday';
export type OvertimeStatus = 'none' | 'approved' | 'pending' | 'rejected';

export interface ClockSession {
  id?: string;
  timeIn: Date;
  timeOut?: Date;
  hoursWorked: number;
  notes?: string;
  photoInUrl?: string;
  photoOutUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id?: string;
  staffId: string;
  staffUser?: StaffUser;
  date: Date;
  clockSessions: ClockSession[];
  status: AttendanceStatus;
  totalHoursWorked: number;
  overtime: number;
  overtimeStatus: OvertimeStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface AttendanceSummary {
  staffId: string;
  staffName: string;
  staffEmail: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  holidayDays: number;
  totalHoursWorked: number;
  totalOvertimeHours: number;
  averageHoursPerDay: number;
  attendance: Attendance[];
}