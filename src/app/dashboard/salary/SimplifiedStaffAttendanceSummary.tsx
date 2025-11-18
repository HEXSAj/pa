// src/app/dashboard/salary/SimplifiedStaffAttendanceSummary.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { attendanceService } from '@/services/attendanceService';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarIcon, Clock, CheckCircle, XCircle, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StaffAttendanceSummaryProps {
  staffId: string;
  period?: Date; // Month to calculate attendance for
  staffList: any[]; // Pass the staffList to lookup staff information
}

export function SimplifiedStaffAttendanceSummary({ 
  staffId, 
  period = new Date(),
  staffList
}: StaffAttendanceSummaryProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(period);
  const [attendanceSummary, setAttendanceSummary] = useState({
    presentFullDays: 0,
    presentHalfDays: 0,
    absentDays: 0,
    overtimeHours: 0,
    totalWorkingDays: 0
  });

  // Get staff name from the staffList instead of making a separate API call
  const getStaffName = (staffId: string) => {
    const staff = staffList.find(s => s.uid === staffId);
    return staff?.displayName || staff?.email || 'Unknown Staff';
  };

  // Load attendance data for the selected month
  useEffect(() => {
    const loadAttendanceData = async () => {
      if (!staffId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Calculate date range for the selected month
        const startDate = startOfMonth(selectedMonth);
        const endDate = endOfMonth(selectedMonth);
        
        // Get attendance records directly without summary
        const attendanceRecords = await attendanceService.getAttendanceByDateRange(staffId, startDate, endDate);
        
        // Calculate summary from the records
        let presentFullDays = 0;
        let presentHalfDays = 0;
        let absentDays = 0;
        let overtimeHours = 0;
        
        attendanceRecords.forEach(record => {
          if (record.status === 'present_full') {
            presentFullDays++;
          } else if (record.status === 'present_half') {
            presentHalfDays++;
          } else if (record.status === 'absent') {
            absentDays++;
          }
          
          // Add overtime
          overtimeHours += record.overtime || 0;
        });
        
        // Calculate total working days (simplified)
        const totalWorkingDays = attendanceService.calculateBusinessDays(startDate, endDate);
        
        // Missing days are assumed to be absent
        absentDays += (totalWorkingDays - presentFullDays - presentHalfDays - absentDays);
        
        setAttendanceSummary({
          presentFullDays,
          presentHalfDays,
          absentDays,
          overtimeHours,
          totalWorkingDays
        });
      } catch (error) {
        console.error('Error loading attendance data:', error);
        toast({
          title: "Error",
          description: "Failed to load attendance data. Using empty values.",
          variant: "destructive"
        });
        // Set default values in case of error
        setAttendanceSummary({
          presentFullDays: 0,
          presentHalfDays: 0,
          absentDays: 0,
          overtimeHours: 0,
          totalWorkingDays: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAttendanceData();
  }, [staffId, selectedMonth]);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Attendance Summary</CardTitle>
          <div className="flex items-center space-x-2">
            <DatePicker
              date={selectedMonth}
              setDate={setSelectedMonth}
              captionLayout="dropdown-buttons"
              fromYear={2020}
              toYear={2030}
              showMonthYearPicker
              disabled={isLoading}
            />
          </div>
        </div>
        <CardDescription>
          {format(selectedMonth, 'MMMM yyyy')} attendance record for {getStaffName(staffId)}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        ) : !staffId ? (
          <div className="flex items-center justify-center h-28 text-center bg-muted/20 rounded-md">
            <p className="text-muted-foreground">Select a staff member to view attendance details</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Attendance Overview Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded-md p-3 bg-green-50">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium">Full Days</span>
                </div>
                <p className="text-xl font-bold mt-1 text-green-700">{attendanceSummary.presentFullDays}</p>
              </div>
              
              <div className="border rounded-md p-3 bg-blue-50">
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-sm font-medium">Half Days</span>
                </div>
                <p className="text-xl font-bold mt-1 text-blue-700">{attendanceSummary.presentHalfDays}</p>
              </div>
              
              <div className="border rounded-md p-3 bg-amber-50">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-amber-600" />
                  <span className="text-sm font-medium">Overtime Hours</span>
                </div>
                <p className="text-xl font-bold mt-1 text-amber-700">{attendanceSummary.overtimeHours.toFixed(1)}</p>
              </div>
              
              <div className="border rounded-md p-3 bg-red-50">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                  <span className="text-sm font-medium">Absent Days</span>
                </div>
                <p className="text-xl font-bold mt-1 text-red-700">{attendanceSummary.absentDays}</p>
              </div>
            </div>
            
            {/* Working Days Summary */}
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-700">Working Days</p>
                  <p className="text-xl font-bold text-gray-900">{attendanceSummary.totalWorkingDays}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">Days Present</p>
                  <p className="text-xl font-bold text-gray-900">
                    {attendanceSummary.presentFullDays + (attendanceSummary.presentHalfDays * 0.5)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}