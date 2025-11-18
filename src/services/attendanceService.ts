

// src/services/attendanceService.ts
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
  startAt,
  endAt,
  remove
} from 'firebase/database';
import { Attendance, AttendanceStatus, AttendanceSummary, ClockSession } from '@/types/attendance';
import { staffService } from './staffService';
import { StaffUser } from '@/types/staff';

const DB_PATH = 'attendance';

export const attendanceService = {
  async clockIn(staffId: string, notes?: string, photoInUrl?: string): Promise<Attendance> {
    try {
      console.log('🕐 ClockIn started for staffId:', staffId, 'notes:', notes);
      
      // Check authentication status
      const { auth } = await import('@/lib/firebase');
      const currentUser = auth.currentUser;
      console.log('🔐 Current user:', currentUser ? currentUser.email : 'Not authenticated');
      
      if (!currentUser) {
        throw new Error('User not authenticated. Please log in first.');
      }
      
      // Check if staff exists
      console.log('🔍 Looking up staff with ID:', staffId);
      const staff = await staffService.getStaffById(staffId);
      if (!staff) {
        console.error('❌ Staff not found for staffId:', staffId);
        console.log('💡 This might be because the user is not in the staff collection');
        throw new Error('Staff not found. Please ensure you are registered in the staff system.');
      }
      console.log('✅ Staff found:', staff.displayName || staff.email);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get today's attendance record
      const existingAttendance = await this.getTodayAttendance(staffId);
      console.log('📅 Existing attendance:', existingAttendance);
      
      const now = new Date();
      // Generate a unique session ID for this clock-in
      const sessionId = `session_${staffId}_${now.getTime()}`;
      const newClockSession: ClockSession = {
        id: sessionId,
        timeIn: now,
        hoursWorked: 0,
        notes: notes?.trim() || undefined,
        photoInUrl: photoInUrl,
        createdAt: now,
        updatedAt: now
      };
      console.log('🆕 New clock session:', newClockSession);
      
      if (existingAttendance) {
        console.log('🔄 Found existing attendance, adding new session...');
        // Check if there's an open session (clocked in but not out)
        const hasOpenSession = existingAttendance.clockSessions.some(session => 
          session.timeIn && !session.timeOut
        );
        
        if (hasOpenSession) {
          console.log('⚠️ Open session found, cannot clock in');
          throw new Error('You have an open clock session. Please clock out first.');
        }
        
        // Add new clock session to existing attendance
        const updatedSessions = [...existingAttendance.clockSessions, newClockSession];
        const totalHours = this.calculateTotalHours(updatedSessions);
        console.log('📊 Updated sessions:', updatedSessions.length, 'Total hours:', totalHours);
        
        const updateData = {
          clockSessions: updatedSessions.map(session => this.convertClockSessionToDatabase(session)),
          totalHoursWorked: totalHours,
          status: 'present' as AttendanceStatus,
          updatedAt: now.toISOString()
        };
        console.log('💾 Update data:', updateData);
        
        await update(ref(database, `${DB_PATH}/${existingAttendance.id}`), updateData);
        console.log('✅ Successfully updated existing attendance');
        
        return {
          ...existingAttendance,
          clockSessions: updatedSessions,
          totalHoursWorked: totalHours,
          status: 'present',
          updatedAt: now
        };
      } else {
        console.log('🆕 No existing attendance, creating new record...');
        // Create new attendance record
        const attendanceData: Omit<Attendance, 'id'> = {
          staffId,
          date: today,
          clockSessions: [newClockSession],
          status: 'present',
          totalHoursWorked: 0,
          overtime: 0,
          overtimeStatus: 'none',
          createdAt: now,
          updatedAt: now
        };
        console.log('📝 New attendance data:', attendanceData);
        
        // Create a new record with a generated key
        const newAttendanceRef = push(ref(database, DB_PATH));
        const id = newAttendanceRef.key;
        console.log('🆔 Generated ID:', id);
        
        const dbData = this.convertToDatabase(attendanceData);
        console.log('💾 Database data:', dbData);
        
        await set(newAttendanceRef, dbData);
        console.log('✅ Successfully created new attendance record');
        
        return {
          id,
          ...attendanceData
        };
      }
    } catch (error) {
      console.error('❌ Error clocking in:', error);
      throw error;
    }
  },
  

  async clockOut(attendanceId: string, notes?: string, photoOutUrl?: string): Promise<Attendance> {
    try {
      // Get the attendance record
      const attendanceRef = ref(database, `${DB_PATH}/${attendanceId}`);
      const snapshot = await get(attendanceRef);
      
      if (!snapshot.exists()) {
        throw new Error('Attendance record not found');
      }
      
      const attendance = this.convertFromDatabase({
        id: attendanceId,
        ...snapshot.val()
      });
      
      // Find the open session (clocked in but not out)
      const openSessionIndex = attendance.clockSessions.findIndex(session => 
        session.timeIn && !session.timeOut
      );
      
      if (openSessionIndex === -1) {
        throw new Error('No open clock session found');
      }
      
      const now = new Date();
      const openSession = attendance.clockSessions[openSessionIndex];
      const hoursWorked = this.calculateHoursWorked(openSession.timeIn, now);
      
      // Update the open session
      const updatedSessions = [...attendance.clockSessions];
      updatedSessions[openSessionIndex] = {
        ...openSession,
        timeOut: now,
        hoursWorked,
        notes: notes?.trim() || openSession.notes,
        photoOutUrl: photoOutUrl || openSession.photoOutUrl,
        updatedAt: now
      };
      
      // Calculate total hours for the day
      const totalHours = this.calculateTotalHours(updatedSessions);
      const overtime = totalHours > 10 ? totalHours - 10 : 0;
      
      const updateData = {
        clockSessions: updatedSessions.map(session => this.convertClockSessionToDatabase(session)),
        totalHoursWorked: totalHours,
        overtime,
        updatedAt: now.toISOString()
      };
      
      await update(attendanceRef, updateData);
      
      return {
        ...attendance,
        clockSessions: updatedSessions,
        totalHoursWorked: totalHours,
        overtime,
        updatedAt: now
      };
    } catch (error) {
      console.error('Error clocking out:', error);
      throw error;
    }
  },
  
  // Get today's attendance for a staff member
  async getTodayAttendance(staffId: string): Promise<Attendance | null> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const attendanceList = await this.getAttendanceByDateRange(staffId, today, tomorrow);
      
      return attendanceList.length > 0 ? attendanceList[0] : null;
    } catch (error) {
      console.error('Error getting today attendance:', error);
      throw error;
    }
  },
  
  // Get attendance records for a staff member by date range
  async getAttendanceByDateRange(staffId: string, startDate: Date, endDate: Date): Promise<Attendance[]> {
    try {
      // Convert dates to ISO strings for comparison
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      // First, get all attendance records for the specific staff
      const staffAttendanceQuery = query(
        ref(database, DB_PATH),
        orderByChild('staffId'),
        equalTo(staffId)
      );
      
      const snapshot = await get(staffAttendanceQuery);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const attendanceList: Attendance[] = [];
      
      // Filter by date range client-side
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        const dateStr = data.date;
        
        // Check if date is within range
        if (dateStr >= startDateStr && dateStr < endDateStr) {
          attendanceList.push(this.convertFromDatabase({
            id: childSnapshot.key,
            ...data
          }));
        }
      });
      
      // Sort by date in descending order
      attendanceList.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      // Populate staff user data for each attendance record
      try {
        const staff = await staffService.getStaffById(staffId);
        if (staff) {
          attendanceList.forEach(attendance => {
            attendance.staffUser = staff;
          });
        }
      } catch (staffError) {
        console.warn('Could not fetch staff data for attendance records:', staffError);
      }
      
      return attendanceList;
    } catch (error) {
      console.error('Error getting attendance by date range:', error);
      throw error;
    }
  },
  


  async updateAttendance(attendanceId: string, data: Partial<Attendance>): Promise<Attendance> {
  try {
    const attendanceRef = ref(database, `${DB_PATH}/${attendanceId}`);
    const snapshot = await get(attendanceRef);
    
    if (!snapshot.exists()) {
      throw new Error('Attendance record not found');
    }
    
    const now = new Date();
    const convertedData = this.convertToDatabase(data);
    
    // Remove any undefined values
    const cleanedData: any = {};
    Object.keys(convertedData).forEach(key => {
      if (convertedData[key] !== undefined) {
        cleanedData[key] = convertedData[key];
      }
    });
    
    const updateData = {
      ...cleanedData,
      updatedAt: now.toISOString()
    };
    
    await update(attendanceRef, updateData);
    
    const updatedSnapshot = await get(attendanceRef);
    
    return this.convertFromDatabase({
      id: attendanceId,
      ...updatedSnapshot.val()
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw error;
  }
},
  
  // Get attendance summary for a staff member
  async getAttendanceSummary(staffId: string, startDate: Date, endDate: Date): Promise<AttendanceSummary> {
    try {
      // Get staff details
      const staff = await staffService.getStaffById(staffId);
      if (!staff) {
        throw new Error('Staff not found');
      }
      
      // Get attendance records
      const attendanceList = await this.getAttendanceByDateRange(staffId, startDate, endDate);
      
      // Calculate total days in the date range (excluding weekends)
      const totalDays = this.calculateBusinessDays(startDate, endDate);
      
      // Initialize counters
      let presentDays = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let holidayDays = 0;
      let totalHoursWorked = 0;
      let totalOvertimeHours = 0;
      
      // Count attendance types
      attendanceList.forEach(attendance => {
        switch (attendance.status) {
          case 'present':
            presentDays++;
            break;
          case 'absent':
            absentDays++;
            break;
          case 'leave':
            leaveDays++;
            break;
          case 'holiday':
            holidayDays++;
            break;
        }
        
        totalHoursWorked += attendance.totalHoursWorked;
        totalOvertimeHours += attendance.overtime;
      });
      
      // Calculate missing absent days (days without any record)
      const daysWithRecords = attendanceList.length;
      absentDays += (totalDays - daysWithRecords - holidayDays - leaveDays);
      
      const averageHoursPerDay = daysWithRecords > 0 ? totalHoursWorked / daysWithRecords : 0;
      
      return {
        staffId,
        staffName: staff.displayName || staff.email,
        staffEmail: staff.email,
        startDate,
        endDate,
        totalDays,
        presentDays,
        absentDays,
        leaveDays,
        holidayDays,
        totalHoursWorked,
        totalOvertimeHours,
        averageHoursPerDay,
        attendance: attendanceList
      };
    } catch (error) {
      console.error('Error getting attendance summary:', error);
      throw error;
    }
  },
  
  // Get attendance summaries for all staff members
  async getAllStaffAttendanceSummary(startDate: Date, endDate: Date): Promise<AttendanceSummary[]> {
    try {
      const staffList = await staffService.getAllStaff();
      
      const summaries = await Promise.all(
        staffList.map(staff => this.getAttendanceSummary(staff.uid, startDate, endDate))
      );
      
      return summaries;
    } catch (error) {
      console.error('Error getting all staff attendance summary:', error);
      throw error;
    }
  },
  


  async markAttendance(staffId: string, date: Date, data: Partial<Attendance>): Promise<Attendance> {
  try {
    // Check if staff exists
    const staff = await staffService.getStaffById(staffId);
    if (!staff) {
      throw new Error('Staff not found');
    }
    
    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    
    // Check if attendance record already exists for this date
    const nextDay = new Date(normalizedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const existingAttendance = await this.getAttendanceByDateRange(staffId, normalizedDate, nextDay);
    
    const now = new Date();
    
    if (existingAttendance.length > 0) {
      // Update existing record
      const existing = existingAttendance[0];
      
      const updateData = {
        ...data,
        updatedAt: now
      };
      
      return this.updateAttendance(existing.id!, updateData);
    } else {
      // Create new record
      const timeIn = data.timeIn || null;
      const timeOut = data.timeOut || null;
      
      let hoursWorked = 0;
      let overtime = 0;
      let status: AttendanceStatus = data.status || 'absent';
      
      if (timeIn && timeOut) {
        hoursWorked = this.calculateHoursWorked(timeIn, timeOut);
        
        // Determine status based on hours worked (if not explicitly set)
        if (!data.status) {
          if (hoursWorked < 8) {
            status = 'present_half';
          } else {
            status = 'present_full';
          }
        }
        
        // Calculate overtime
        if (hoursWorked > 10) {
          overtime = hoursWorked - 10;
        }
      }
      
      const attendanceData: Omit<Attendance, 'id'> = {
        staffId,
        date: normalizedDate,
        timeIn: data.timeIn,
        timeOut: data.timeOut,
        status,
        hoursWorked,
        overtime,
        overtimeStatus: data.overtimeStatus || 'none',
        createdAt: now,
        updatedAt: now
      };
      
      // Only include notes if they exist and are not empty
      if (data.notes && data.notes.trim()) {
        attendanceData.notes = data.notes.trim();
      }
      
      // Create a new record with a generated key
      const newAttendanceRef = push(ref(database, DB_PATH));
      const id = newAttendanceRef.key;
      
      await set(newAttendanceRef, this.convertToDatabase(attendanceData));
      
      return {
        id,
        ...attendanceData
      };
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
},
  
  // Delete attendance record and associated photos
  async deleteAttendance(attendanceId: string): Promise<void> {
    try {
      // Get the attendance record first to extract photo URLs
      const attendanceRef = ref(database, `${DB_PATH}/${attendanceId}`);
      const snapshot = await get(attendanceRef);
      
      if (!snapshot.exists()) {
        throw new Error('Attendance record not found');
      }
      
      const attendance = this.convertFromDatabase({
        id: attendanceId,
        ...snapshot.val()
      });
      
      // Delete associated photos from Firebase Storage
      const { storage } = await import('@/lib/firebase');
      const { ref: storageRef, deleteObject } = await import('firebase/storage');
      
      // Collect all photo URLs from clock sessions
      const photoUrls: string[] = [];
      if (attendance.clockSessions && attendance.clockSessions.length > 0) {
        console.log('📸 Found', attendance.clockSessions.length, 'clock session(s)');
        attendance.clockSessions.forEach((session, index) => {
          console.log(`  Session ${index + 1}:`, {
            hasPhotoIn: !!session.photoInUrl,
            hasPhotoOut: !!session.photoOutUrl,
            photoInUrl: session.photoInUrl?.substring(0, 50) + '...',
            photoOutUrl: session.photoOutUrl?.substring(0, 50) + '...'
          });
          if (session.photoInUrl) {
            photoUrls.push(session.photoInUrl);
            console.log('  ✅ Added clock-in photo to delete list');
          }
          if (session.photoOutUrl) {
            photoUrls.push(session.photoOutUrl);
            console.log('  ✅ Added clock-out photo to delete list');
          }
        });
      }
      
      console.log(`🗑️ Total photos to delete: ${photoUrls.length}`);
      
      // Delete each photo from Storage
      const deletePromises = photoUrls.map(async (photoUrl, index) => {
        try {
          // Extract the storage path from the URL
          // Firebase Storage URLs format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
          const urlMatch = photoUrl.match(/\/o\/(.+?)\?/);
          if (urlMatch && urlMatch[1]) {
            const decodedPath = decodeURIComponent(urlMatch[1]);
            console.log(`  🗑️ Deleting photo ${index + 1}/${photoUrls.length}: ${decodedPath}`);
            const photoRef = storageRef(storage, decodedPath);
            await deleteObject(photoRef);
            console.log(`  ✅ Successfully deleted photo ${index + 1}: ${decodedPath}`);
            return { success: true, path: decodedPath };
          } else {
            console.error(`  ⚠️ Could not parse photo URL: ${photoUrl.substring(0, 100)}...`);
            return { success: false, path: null, error: 'Invalid URL format' };
          }
        } catch (photoError: any) {
          // Log error but don't fail the entire operation
          console.error(`  ⚠️ Error deleting photo ${index + 1}:`, photoUrl.substring(0, 100) + '...', photoError);
          return { success: false, path: null, error: photoError.message || 'Unknown error' };
        }
      });
      
      // Wait for all photo deletions to complete
      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value && r.value.success
      ).length;
      const failed = results.filter(r => 
        r.status === 'rejected' || (r.status === 'fulfilled' && (!r.value || !r.value.success))
      ).length;
      console.log(`📊 Photo deletion summary: ${successful} successful, ${failed} failed`);
      
      // Delete the attendance record from database
      await remove(attendanceRef);
      console.log('✅ Deleted attendance record:', attendanceId);
    } catch (error) {
      console.error('❌ Error deleting attendance:', error);
      throw error;
    }
  },
  
  // Helper methods
  calculateHoursWorked(timeIn: Date, timeOut: Date): number {
    const diffMs = timeOut.getTime() - timeIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Round to 2 decimal places
    return Math.round(diffHours * 100) / 100;
  },
  
  calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    
    return count;
  },
  

  // Helper method to calculate total hours from clock sessions
  calculateTotalHours(clockSessions: ClockSession[]): number {
    return clockSessions.reduce((total, session) => {
      if (session.timeOut) {
        return total + session.hoursWorked;
      }
      return total;
    }, 0);
  },

  // Helper method to convert clock session to database format
  convertClockSessionToDatabase(session: ClockSession): any {
    const result: any = {
      timeIn: session.timeIn.toISOString(),
      hoursWorked: session.hoursWorked,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString()
    };
    
    // Include session ID if it exists
    if (session.id) {
      result.id = session.id;
    }
    
    // Only include timeOut if it exists
    if (session.timeOut) {
      result.timeOut = session.timeOut.toISOString();
    }
    
    // Only include notes if it's not undefined
    if (session.notes !== undefined && session.notes !== null && session.notes !== '') {
      result.notes = session.notes;
    }
    
    // Include photo URLs if they exist
    if (session.photoInUrl) {
      result.photoInUrl = session.photoInUrl;
    }
    
    if (session.photoOutUrl) {
      result.photoOutUrl = session.photoOutUrl;
    }
    
    return result;
  },

  // Helper method to convert clock session from database format
  convertClockSessionFromDatabase(data: any): ClockSession {
    return {
      id: data.id || undefined,
      timeIn: new Date(data.timeIn),
      timeOut: data.timeOut ? new Date(data.timeOut) : undefined,
      hoursWorked: data.hoursWorked || 0,
      notes: data.notes || undefined,
      photoInUrl: data.photoInUrl || undefined,
      photoOutUrl: data.photoOutUrl || undefined,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  },

  convertToDatabase(attendance: Partial<Attendance>): any {
    const result: any = {};
    
    // Only include defined values
    Object.keys(attendance).forEach(key => {
      const value = attendance[key as keyof Attendance];
      if (value !== undefined && value !== null) {
        if (key === 'date' || key === 'createdAt' || key === 'updatedAt') {
          // Convert Date objects to ISO strings for Realtime Database
          if (value instanceof Date) {
            result[key] = value.toISOString();
          }
        } else if (key === 'clockSessions') {
          // Convert clock sessions array
          result[key] = (value as ClockSession[]).map(session => 
            this.convertClockSessionToDatabase(session)
          );
        } else if (key !== 'staffUser' && key !== 'id') {
          // Include all other properties except staffUser and id
          result[key] = value;
        }
      }
    });
    
    return result;
  },
  
  convertFromDatabase(data: any): Attendance {
    const result: any = { ...data };
    
    // Convert ISO strings back to Date objects
    if (data.date) {
      result.date = new Date(data.date);
    }
    
    if (data.createdAt) {
      result.createdAt = new Date(data.createdAt);
    }
    
    if (data.updatedAt) {
      result.updatedAt = new Date(data.updatedAt);
    }
    
    // Convert clock sessions array
    if (data.clockSessions && Array.isArray(data.clockSessions)) {
      result.clockSessions = data.clockSessions.map((session: any) => 
        this.convertClockSessionFromDatabase(session)
      );
    } else {
      // Handle legacy attendance records that don't have clockSessions
      // Convert old timeIn/timeOut to clockSessions format
      const legacySessions: ClockSession[] = [];
      
      if (data.timeIn) {
        const timeIn = new Date(data.timeIn);
        const timeOut = data.timeOut ? new Date(data.timeOut) : undefined;
        const hoursWorked = timeOut ? this.calculateHoursWorked(timeIn, timeOut) : 0;
        
        legacySessions.push({
          timeIn,
          timeOut,
          hoursWorked,
          notes: data.notes || undefined,
          createdAt: data.createdAt ? new Date(data.createdAt) : timeIn,
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : timeIn
        });
      }
      
      result.clockSessions = legacySessions;
      
      // Update totalHoursWorked for legacy records
      if (data.hoursWorked !== undefined) {
        result.totalHoursWorked = data.hoursWorked;
      } else {
        result.totalHoursWorked = legacySessions.reduce((total, session) => total + session.hoursWorked, 0);
      }
    }
    
    return result as Attendance;
  }
};