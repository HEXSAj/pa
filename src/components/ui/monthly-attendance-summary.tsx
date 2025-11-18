// src/components/ui/monthly-attendance-summary.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, CheckCircle2, Coffee, X, FileText, CalendarClock, Download } from 'lucide-react';
import { attendanceService } from '@/services/attendanceService';
import { AttendanceSummary } from '@/types/attendance';
import { format, subMonths, endOfMonth, startOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface MonthlyAttendanceSummaryProps {
  staffId: string;
  initialMonth?: Date;
  compact?: boolean;
}

export function MonthlyAttendanceSummary({ 
  staffId, 
  initialMonth = new Date(), 
  compact = false 
}: MonthlyAttendanceSummaryProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date>(initialMonth);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  
  // Generate last 12 months options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: date.toISOString(),
      label: format(date, 'MMMM yyyy')
    };
  });
  
  const loadMonthlySummary = async (monthDate: Date) => {
    if (!staffId) return;
    
    try {
      setIsLoading(true);
      
      const startDate = startOfMonth(monthDate);
      const endDate = endOfMonth(monthDate);
      
      const summary = await attendanceService.getAttendanceSummary(
        staffId,
        startDate,
        endDate
      );
      
      setAttendanceSummary(summary);
    } catch (error) {
      console.error('Error loading monthly summary:', error);
      toast({
        title: "Error",
        description: "Failed to load monthly attendance summary",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data when month changes
  const handleMonthChange = (value: string) => {
    const date = new Date(value);
    setSelectedMonth(date);
    loadMonthlySummary(date);
  };
  
  // Initial data load
  React.useEffect(() => {
    loadMonthlySummary(selectedMonth);
  }, [staffId, selectedMonth]);
  
  // Calculate attendance rate
  const calculateAttendanceRate = () => {
    if (!attendanceSummary) return 0;
    
    const totalWorkDays = attendanceSummary.totalDays - attendanceSummary.holidayDays;
    const presentDays = attendanceSummary.presentFullDays + (attendanceSummary.presentHalfDays * 0.5);
    
    return totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
  };
  
  // Status breakdown for pie chart
  const getAttendanceBreakdown = () => {
    if (!attendanceSummary) return [];
    
    return [
      { status: 'Full Days', count: attendanceSummary.presentFullDays, color: '#10b981' },
      { status: 'Half Days', count: attendanceSummary.presentHalfDays, color: '#f59e0b' },
      { status: 'Absent', count: attendanceSummary.absentDays, color: '#ef4444' },
      { status: 'Leave', count: attendanceSummary.leaveDays, color: '#3b82f6' },
      { status: 'Holiday', count: attendanceSummary.holidayDays, color: '#8b5cf6' }
    ];
  };
  
  // Group attendance records by week
  const getWeeklyBreakdown = () => {
    if (!attendanceSummary || !attendanceSummary.attendance.length) return [];
    
    const weeks: { [key: string]: any } = {};
    
    attendanceSummary.attendance.forEach(record => {
      // Get the week number of the month (1-indexed)
      const weekOfMonth = Math.ceil(record.date.getDate() / 7);
      const weekKey = `Week ${weekOfMonth}`;
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          week: weekKey,
          fullDays: 0,
          halfDays: 0,
          absent: 0,
          leave: 0,
          holiday: 0,
          hoursWorked: 0,
          overtimeHours: 0
        };
      }
      
      // Update stats based on status
      switch (record.status) {
        case 'present_full':
          weeks[weekKey].fullDays += 1;
          break;
        case 'present_half':
          weeks[weekKey].halfDays += 1;
          break;
        case 'absent':
          weeks[weekKey].absent += 1;
          break;
        case 'leave':
          weeks[weekKey].leave += 1;
          break;
        case 'holiday':
          weeks[weekKey].holiday += 1;
          break;
      }
      
      // Add hours worked and overtime
      weeks[weekKey].hoursWorked += record.hoursWorked;
      weeks[weekKey].overtimeHours += record.overtime;
    });
    
    // Convert to array and sort by week
    return Object.values(weeks).sort((a, b) => {
      const weekNumA = parseInt(a.week.split(' ')[1]);
      const weekNumB = parseInt(b.week.split(' ')[1]);
      return weekNumA - weekNumB;
    });
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Monthly Attendance Summary
            </CardTitle>
            <CardDescription>
              Summary for {format(selectedMonth, 'MMMM yyyy')}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Select 
              value={selectedMonth.toISOString()} 
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadMonthlySummary(selectedMonth)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarClock className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : attendanceSummary ? (
          <div className="space-y-6">
            {/* Summary metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-3 rounded-lg border border-green-100 space-y-1">
                <div className="text-sm text-green-600 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Full Days
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {attendanceSummary.presentFullDays}
                </div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 space-y-1">
                <div className="text-sm text-yellow-600 flex items-center">
                  <Coffee className="h-4 w-4 mr-1" />
                  Half Days
                </div>
                <div className="text-2xl font-bold text-yellow-700">
                  {attendanceSummary.presentHalfDays}
                </div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg border border-red-100 space-y-1">
                <div className="text-sm text-red-600 flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  Absent
                </div>
                <div className="text-2xl font-bold text-red-700">
                  {attendanceSummary.absentDays}
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-1">
                <div className="text-sm text-blue-600 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Hours Worked
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {attendanceSummary.totalHoursWorked.toFixed(1)}
                </div>
              </div>
            </div>
            
            {/* Attendance Rate and Charts (hide in compact mode) */}
            {!compact && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="text-sm font-medium mb-2">Attendance Rate</h3>
                  <div className="flex items-end gap-4">
                    <div className="relative h-24 w-24">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="15"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={calculateAttendanceRate() >= 90 ? '#10b981' : 
                                 calculateAttendanceRate() >= 75 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="15"
                          strokeDasharray={`${2 * Math.PI * 40 * calculateAttendanceRate() / 100} ${2 * Math.PI * 40}`}
                          strokeDashoffset={2 * Math.PI * 40 * 0.25}
                          strokeLinecap="round"
                          transform="rotate(-90, 50, 50)"
                        />
                        <text
                          x="50"
                          y="50"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="20"
                          fontWeight="bold"
                          fill="#374151"
                        >
                          {calculateAttendanceRate().toFixed(0)}%
                        </text>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Present Days</div>
                      <div className="text-xl font-bold">
                        {attendanceSummary.presentFullDays + (attendanceSummary.presentHalfDays * 0.5)}
                      </div>
                      <div className="text-sm text-gray-500">out of {attendanceSummary.totalDays - attendanceSummary.holidayDays}</div>
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-2 bg-gray-50 p-4 rounded-lg border">
                  <h3 className="text-sm font-medium mb-2">Status Breakdown</h3>
                  <div className="mt-2 flex items-center gap-8">
                    <div className="relative h-32 w-32">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        {getAttendanceBreakdown().map((item, index) => {
                          const total = getAttendanceBreakdown().reduce((sum, i) => sum + i.count, 0);
                          
                          // Skip if count is 0
                          if (item.count === 0) return null;
                          
                          // Calculate angles
                          let startAngle = 0;
                          getAttendanceBreakdown().slice(0, index).forEach(prev => {
                            startAngle += (prev.count / total) * 360;
                          });
                          
                          const endAngle = startAngle + (item.count / total) * 360;
                          
                          // Convert to radians
                          const startRad = (startAngle - 90) * Math.PI / 180;
                          const endRad = (endAngle - 90) * Math.PI / 180;
                          
                          // Calculate path
                          const x1 = 50 + 40 * Math.cos(startRad);
                          const y1 = 50 + 40 * Math.sin(startRad);
                          const x2 = 50 + 40 * Math.cos(endRad);
                          const y2 = 50 + 40 * Math.sin(endRad);
                          
                          // Determine if the arc should be drawn as a large arc
                          const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                          
                          return (
                            <path
                              key={item.status}
                              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                              fill={item.color}
                            />
                          );
                        })}
                      </svg>
                    </div>
                    <div className="flex flex-col gap-2">
                      {getAttendanceBreakdown().map(item => (
                        <div key={item.status} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <div className="text-sm">{item.status}</div>
                          <div className="text-sm font-medium">{item.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Weekly Breakdown Table */}
            {!compact && getWeeklyBreakdown().length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Weekly Breakdown</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>Full Days</TableHead>
                      <TableHead>Half Days</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Overtime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getWeeklyBreakdown().map(week => (
                      <TableRow key={week.week}>
                        <TableCell className="font-medium">{week.week}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {week.fullDays}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                            {week.halfDays}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            {week.absent}
                          </Badge>
                        </TableCell>
                        <TableCell>{week.hoursWorked.toFixed(1)}</TableCell>
                        <TableCell>
                          {week.overtimeHours > 0 ? (
                            <Badge className="bg-purple-100 text-purple-800">
                              {week.overtimeHours.toFixed(1)}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 p-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-lg mb-1">No data available</h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              No attendance records found for {format(selectedMonth, 'MMMM yyyy')}. Try selecting a different month or update attendance records.
            </p>
          </div>
        )}
      </CardContent>
      
      {!compact && attendanceSummary && (
        <CardFooter className="border-t pt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Generated on {format(new Date(), 'PPpp')}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Export functionality would go here
              toast({
                title: "Export Initiated",
                description: "Your monthly report is being prepared for download",
                variant: "success"
              });
            }}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}