// src/components/StaffAttendanceDashboardWidget.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle2, TimerOff, AlertCircle, UserCheck, CalendarClock } from 'lucide-react';
import { attendanceService } from '@/services/attendanceService';
import { Attendance } from '@/types/attendance';
import { format, isToday } from 'date-fns';
import { useRouter } from "next/navigation";

interface StaffAttendanceDashboardWidgetProps {
  staffId: string;
}

export function StaffAttendanceDashboardWidget({ staffId }: StaffAttendanceDashboardWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [weekStats, setWeekStats] = useState({
    presentFullDays: 0,
    presentHalfDays: 0,
    absentDays: 0,
    totalHoursWorked: 0,
    overtimeHours: 0
  });
  const router = useRouter();
  
  useEffect(() => {
    const loadAttendanceData = async () => {
      if (!staffId) return;
      
      try {
        setIsLoading(true);
        
        // Get today's attendance
        const today = await attendanceService.getTodayAttendance(staffId);
        setTodayAttendance(today);
        
        // Get weekly stats
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        
        const summary = await attendanceService.getAttendanceSummary(
          staffId,
          startOfWeek,
          now
        );
        
        setWeekStats({
          presentFullDays: summary.presentFullDays,
          presentHalfDays: summary.presentHalfDays,
          absentDays: summary.absentDays,
          totalHoursWorked: summary.totalHoursWorked,
          overtimeHours: summary.totalOvertimeHours
        });
      } catch (error) {
        console.error('Error loading attendance data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAttendanceData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadAttendanceData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [staffId]);
  
  // Determine action button
  const getActionButton = () => {
    if (!todayAttendance) {
      return (
        <Button
          onClick={() => router.push('/dashboard/attendance?tab=clock-in')}
          className="w-full"
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Clock In Now
        </Button>
      );
    } else if (todayAttendance.timeIn && !todayAttendance.timeOut) {
      return (
        <Button
          onClick={() => router.push('/dashboard/attendance?tab=clock-in')}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          <TimerOff className="h-4 w-4 mr-2" />
          Clock Out
        </Button>
      );
    } else if (todayAttendance.timeIn && todayAttendance.timeOut) {
      return (
        <Button
          onClick={() => router.push('/dashboard/attendance?tab=attendance-records')}
          variant="outline"
          className="w-full"
        >
          <CalendarClock className="h-4 w-4 mr-2" />
          View Attendance
        </Button>
      );
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Clock className="h-5 w-5 mr-2 text-primary" />
          Attendance Status
        </CardTitle>
        <CardDescription>Today's attendance and weekly summary</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Today's Status */}
            <div className={`p-3 rounded-lg border flex items-center justify-between
              ${!todayAttendance 
                ? 'bg-gray-50 border-gray-200' 
                : todayAttendance.timeIn && !todayAttendance.timeOut
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div>
                <div className="text-sm font-medium flex items-center">
                  {!todayAttendance 
                    ? 'Not Clocked In'
                    : todayAttendance.timeIn && !todayAttendance.timeOut
                      ? 'Currently Working'
                      : 'Day Complete'
                  }
                </div>
                
                {!todayAttendance ? (
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(), 'EEEE, MMMM d')}
                  </p>
                ) : todayAttendance.timeIn && !todayAttendance.timeOut ? (
                  <div className="flex gap-1 items-center text-blue-600 text-sm mt-1">
                    <p>In: {format(todayAttendance.timeIn, 'h:mm a')}</p>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      {calculateHoursWorkedSoFar(todayAttendance.timeIn)} hrs
                    </Badge>
                  </div>
                ) : (
                  <div className="flex gap-1 items-center text-green-600 text-sm mt-1">
                    <p>
                      {todayAttendance.hoursWorked} hrs
                      {todayAttendance.overtime > 0 && ` (${todayAttendance.overtime} OT)`}
                    </p>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      {getAttendanceStatusLabel(todayAttendance.status)}
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className={`h-10 w-10 rounded-full flex items-center justify-center
                ${!todayAttendance 
                  ? 'bg-gray-100' 
                  : todayAttendance.timeIn && !todayAttendance.timeOut
                    ? 'bg-blue-100'
                    : 'bg-green-100'
                }`}
              >
                {!todayAttendance ? (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                ) : todayAttendance.timeIn && !todayAttendance.timeOut ? (
                  <Clock className="h-5 w-5 text-blue-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>
            </div>
            
            {/* Weekly Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center">
                <div className="text-xs text-gray-500">Full Days</div>
                <div className="text-lg font-bold">{weekStats.presentFullDays}</div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center">
                <div className="text-xs text-gray-500">Hours</div>
                <div className="text-lg font-bold">{weekStats.totalHoursWorked.toFixed(1)}</div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center">
                <div className="text-xs text-gray-500">Overtime</div>
                <div className="text-lg font-bold">{weekStats.overtimeHours.toFixed(1)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          getActionButton()
        )}
      </CardFooter>
    </Card>
  );
}

// Helper functions
function calculateHoursWorkedSoFar(clockInTime: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - clockInTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours.toFixed(1);
}

function getAttendanceStatusLabel(status: string): string {
  switch (status) {
    case 'present_full':
      return 'Full Day';
    case 'present_half':
      return 'Half Day';
    case 'absent':
      return 'Absent';
    case 'leave':
      return 'Leave';
    case 'holiday':
      return 'Holiday';
    default:
      return status;
  }
}