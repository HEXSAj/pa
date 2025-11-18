// src/services/attendanceValidationService.ts
import { attendanceService } from './attendanceService';
import { Attendance } from '@/types/attendance';

export interface AttendanceValidationResult {
  isValid: boolean;
  isClockedIn: boolean;
  currentAttendance?: Attendance;
  openSession?: {
    timeIn: Date;
    hoursWorked: number;
    notes?: string;
  };
  error?: string;
  message?: string;
}

export const attendanceValidationService = {
  /**
   * Validates if a staff member is properly clocked in for POS operations
   */
  async validateAttendanceForPOS(staffId: string): Promise<AttendanceValidationResult> {
    try {
      console.log('🔍 Validating attendance for POS, staffId:', staffId);
      
      // Get today's attendance
      const todayAttendance = await attendanceService.getTodayAttendance(staffId);
      console.log('📅 Today attendance:', todayAttendance);
      
      if (!todayAttendance) {
        console.log('❌ No attendance record found');
        return {
          isValid: false,
          isClockedIn: false,
          error: 'No attendance record found',
          message: 'Please clock in first before accessing POS system'
        };
      }
      
      console.log('📊 Clock sessions:', todayAttendance.clockSessions);
      
      // Check if there's an open session (clocked in but not out)
      const openSession = todayAttendance.clockSessions.find(session => 
        session.timeIn && !session.timeOut
      );
      
      console.log('🔍 Open session found:', openSession);
      
      if (!openSession) {
        console.log('❌ No open session found');
        return {
          isValid: false,
          isClockedIn: false,
          currentAttendance: todayAttendance,
          error: 'No active clock session',
          message: 'Please clock in first before accessing POS system'
        };
      }
      
      // Calculate hours worked in current session
      const now = new Date();
      const hoursWorked = attendanceService.calculateHoursWorked(openSession.timeIn, now);
      
      console.log('✅ Valid attendance found, hours worked:', hoursWorked);
      
      return {
        isValid: true,
        isClockedIn: true,
        currentAttendance: todayAttendance,
        openSession: {
          timeIn: openSession.timeIn,
          hoursWorked,
          notes: openSession.notes
        },
        message: `Clocked in since ${openSession.timeIn.toLocaleTimeString()}`
      };
      
    } catch (error) {
      console.error('❌ Error validating attendance:', error);
      return {
        isValid: false,
        isClockedIn: false,
        error: 'Failed to validate attendance',
        message: 'Unable to verify attendance status. Please try again.'
      };
    }
  },

  /**
   * Validates if a staff member is properly clocked in for appointment operations
   */
  async validateAttendanceForAppointments(staffId: string): Promise<AttendanceValidationResult> {
    try {
      console.log('🔍 Validating attendance for appointments, staffId:', staffId);
      
      // Get today's attendance
      const todayAttendance = await attendanceService.getTodayAttendance(staffId);
      console.log('📅 Today attendance for appointments:', todayAttendance);
      
      if (!todayAttendance) {
        console.log('❌ No attendance record found for appointments');
        return {
          isValid: false,
          isClockedIn: false,
          error: 'No attendance record found',
          message: 'Please clock in first before managing appointments'
        };
      }
      
      console.log('📊 Clock sessions for appointments:', todayAttendance.clockSessions);
      
      // Check if there's an open session
      const openSession = todayAttendance.clockSessions.find(session => 
        session.timeIn && !session.timeOut
      );
      
      console.log('🔍 Open session found for appointments:', openSession);
      
      if (!openSession) {
        console.log('❌ No open session found for appointments');
        return {
          isValid: false,
          isClockedIn: false,
          currentAttendance: todayAttendance,
          error: 'No active clock session',
          message: 'Please clock in first before managing appointments'
        };
      }
      
      console.log('✅ Valid attendance found for appointments');
      
      return {
        isValid: true,
        isClockedIn: true,
        currentAttendance: todayAttendance,
        openSession: {
          timeIn: openSession.timeIn,
          hoursWorked: 0, // Will be calculated when needed
          notes: openSession.notes
        },
        message: `Clocked in since ${openSession.timeIn.toLocaleTimeString()}`
      };
      
    } catch (error) {
      console.error('❌ Error validating attendance for appointments:', error);
      return {
        isValid: false,
        isClockedIn: false,
        error: 'Failed to validate attendance',
        message: 'Unable to verify attendance status. Please try again.'
      };
    }
  },

  /**
   * Gets current attendance status for display
   */
  async getCurrentAttendanceStatus(staffId: string): Promise<{
    isClockedIn: boolean;
    totalHoursToday: number;
    currentSessionHours: number;
    sessionCount: number;
    lastClockIn?: Date;
    message: string;
  }> {
    try {
      const todayAttendance = await attendanceService.getTodayAttendance(staffId);
      
      if (!todayAttendance) {
        return {
          isClockedIn: false,
          totalHoursToday: 0,
          currentSessionHours: 0,
          sessionCount: 0,
          message: 'Not clocked in today'
        };
      }
      
      const openSession = todayAttendance.clockSessions.find(session => 
        session.timeIn && !session.timeOut
      );
      
      const totalHoursToday = todayAttendance.totalHoursWorked || 0;
      const sessionCount = todayAttendance.clockSessions.length;
      
      let currentSessionHours = 0;
      let lastClockIn: Date | undefined;
      
      if (openSession) {
        const now = new Date();
        currentSessionHours = attendanceService.calculateHoursWorked(openSession.timeIn, now);
        lastClockIn = openSession.timeIn;
      } else {
        // Get the last clock in time
        const lastSession = todayAttendance.clockSessions
          .filter(session => session.timeIn)
          .sort((a, b) => b.timeIn.getTime() - a.timeIn.getTime())[0];
        
        if (lastSession) {
          lastClockIn = lastSession.timeIn;
        }
      }
      
      return {
        isClockedIn: !!openSession,
        totalHoursToday,
        currentSessionHours,
        sessionCount,
        lastClockIn,
        message: openSession 
          ? `Clocked in since ${openSession.timeIn.toLocaleTimeString()}`
          : `Last clock in: ${lastClockIn?.toLocaleTimeString() || 'N/A'}`
      };
      
    } catch (error) {
      console.error('❌ Error getting attendance status:', error);
      return {
        isClockedIn: false,
        totalHoursToday: 0,
        currentSessionHours: 0,
        sessionCount: 0,
        message: 'Unable to load attendance status'
      };
    }
  }
};
