// src/components/AdminAttendanceReport.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  Loader2, 
  FileBarChart, 
  Search, 
  X, 
  Download, 
  Calendar, 
  Clock, 
  FileText, 
  RefreshCw,
  Users,
  UserCheck,
  FileCog,
  Printer,
  ListFilter,
  ArrowUpDown
} from 'lucide-react';
import { attendanceService } from '@/services/attendanceService';
import { AttendanceSummary } from '@/types/attendance';
import { format, subMonths, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface AdminAttendanceReportProps {
  compact?: boolean;
}

export function AdminAttendanceReport({ compact = false }: AdminAttendanceReportProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [activeTab, setActiveTab] = useState('summary');
  const [staffSummaries, setStaffSummaries] = useState<AttendanceSummary[]>([]);
  const [filteredSummaries, setFilteredSummaries] = useState<AttendanceSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('staffName');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Filter options
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Report metrics
  const [metrics, setMetrics] = useState({
    totalStaff: 0,
    averageAttendanceRate: 0,
    totalAbsences: 0,
    totalOvertimeHours: 0,
    totalHours: 0,
  });
  
  // Load data when date range changes
  useEffect(() => {
    const loadAttendanceData = async () => {
      if (!dateRange.from || !dateRange.to) return;
      
      try {
        setIsLoading(true);
        
        const summaries = await attendanceService.getAllStaffAttendanceSummary(
          dateRange.from,
          dateRange.to
        );
        
        setStaffSummaries(summaries);
        
        // Calculate metrics
        const totalStaff = summaries.length;
        let totalAttendanceRate = 0;
        let totalAbsences = 0;
        let totalOvertimeHours = 0;
        let totalHours = 0;
        
        summaries.forEach(summary => {
          const totalWorkDays = summary.totalDays - summary.holidayDays;
          const presentDays = summary.presentDays;
          const attendanceRate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
          
          totalAttendanceRate += attendanceRate;
          totalAbsences += summary.absentDays;
          totalOvertimeHours += summary.totalOvertimeHours;
          totalHours += summary.totalHoursWorked;
        });
        
        setMetrics({
          totalStaff,
          averageAttendanceRate: totalStaff > 0 ? totalAttendanceRate / totalStaff : 0,
          totalAbsences,
          totalOvertimeHours,
          totalHours
        });
      } catch (error) {
        console.error('Error loading attendance data:', error);
        toast({
          title: "Error",
          description: "Failed to load attendance report data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAttendanceData();
  }, [dateRange]);
  
  // Filter and sort staff summaries
  useEffect(() => {
    let filtered = [...staffSummaries];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(summary => 
        summary.staffName.toLowerCase().includes(query) ||
        summary.staffEmail.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(summary => {
        const totalWorkDays = summary.totalDays - summary.holidayDays;
        const presentDays = summary.presentDays;
        const attendanceRate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
        
        switch (filterStatus) {
          case 'high':
            return attendanceRate >= 90;
          case 'medium':
            return attendanceRate >= 75 && attendanceRate < 90;
          case 'low':
            return attendanceRate < 75;
          case 'overtime':
            return summary.totalOvertimeHours > 0;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      // Determine values based on sort column
      switch (sortColumn) {
        case 'staffName':
          valueA = a.staffName.toLowerCase();
          valueB = b.staffName.toLowerCase();
          break;
        case 'presentDays':
          valueA = a.presentDays;
          valueB = b.presentDays;
          break;
        case 'absentDays':
          valueA = a.absentDays;
          valueB = b.absentDays;
          break;
        case 'totalHoursWorked':
          valueA = a.totalHoursWorked;
          valueB = b.totalHoursWorked;
          break;
        case 'totalOvertimeHours':
          valueA = a.totalOvertimeHours;
          valueB = b.totalOvertimeHours;
          break;
        case 'attendanceRate':
          const totalWorkDaysA = a.totalDays - a.holidayDays;
          const presentDaysA = a.presentDays;
          const attendanceRateA = totalWorkDaysA > 0 ? (presentDaysA / totalWorkDaysA) * 100 : 0;
          
          const totalWorkDaysB = b.totalDays - b.holidayDays;
          const presentDaysB = b.presentDays;
          const attendanceRateB = totalWorkDaysB > 0 ? (presentDaysB / totalWorkDaysB) * 100 : 0;
          
          valueA = attendanceRateA;
          valueB = attendanceRateB;
          break;
        default:
          valueA = a.staffName.toLowerCase();
          valueB = b.staffName.toLowerCase();
      }
      
      // Sort based on direction
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
    
    setFilteredSummaries(filtered);
  }, [staffSummaries, searchQuery, filterStatus, sortColumn, sortDirection]);
  
  // Handle sort
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle sort direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Refresh data
  const refreshData = async () => {
    try {
      setIsLoading(true);
      
      const summaries = await attendanceService.getAllStaffAttendanceSummary(
        dateRange.from,
        dateRange.to
      );
      
      setStaffSummaries(summaries);
      
      toast({
        title: "Data Refreshed",
        description: "Attendance report data has been updated",
        variant: "success"
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh attendance data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className={compact ? "pb-0" : ""}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-primary" />
              Staff Attendance Report
            </CardTitle>
            <CardDescription>
              {format(dateRange.from, 'MMM d, yyyy')} to {format(dateRange.to, 'MMM d, yyyy')}
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <DatePickerWithRange
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={refreshData}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`p-0 ${compact ? "pt-4" : ""} flex-1 overflow-hidden flex flex-col`}>
        {!compact && (
          <div className="px-6 py-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="summary" className="flex items-center gap-2">
                  <FileBarChart className="h-4 w-4" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Staff Details
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center gap-2">
                  <FileCog className="h-4 w-4" />
                  Export Options
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        
        <div className="px-6">
          {isLoading && staffSummaries.length === 0 ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {!compact && activeTab === 'summary' && (
                <div className="space-y-6">
                  {/* Summary metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-1">
                      <div className="text-sm text-blue-600 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Total Staff
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {metrics.totalStaff}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100 space-y-1">
                      <div className="text-sm text-green-600 flex items-center">
                        <UserCheck className="h-4 w-4 mr-1" />
                        Avg. Attendance
                      </div>
                      <div className="text-2xl font-bold text-green-700">
                        {metrics.averageAttendanceRate.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 space-y-1">
                      <div className="text-sm text-yellow-600 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Total Hours
                      </div>
                      <div className="text-2xl font-bold text-yellow-700">
                        {metrics.totalHours.toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 space-y-1">
                      <div className="text-sm text-purple-600 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Overtime Hours
                      </div>
                      <div className="text-2xl font-bold text-purple-700">
                        {metrics.totalOvertimeHours.toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 space-y-1">
                      <div className="text-sm text-red-600 flex items-center">
                        <X className="h-4 w-4 mr-1" />
                        Absences
                      </div>
                      <div className="text-2xl font-bold text-red-700">
                        {metrics.totalAbsences}
                      </div>
                    </div>
                    
                  </div>
                  
                  {/* Attendance distribution chart would go here */}
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-base font-medium mb-4">Attendance Distribution</h3>
                    
                    {/* This would be a chart in a real implementation */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">High Attendance (≥90%)</span>
                          <span className="text-sm font-medium">
                            {filteredSummaries.filter(s => {
                              const totalWorkDays = s.totalDays - s.holidayDays;
                              const presentDays = s.presentFullDays + (s.presentHalfDays * 0.5);
                              const rate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
                              return rate >= 90;
                            }).length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-500 h-2.5 rounded-full" 
                            style={{ 
                              width: `${filteredSummaries.length > 0 
                                ? (filteredSummaries.filter(s => {
                                  const totalWorkDays = s.totalDays - s.holidayDays;
                                  const presentDays = s.presentFullDays + (s.presentHalfDays * 0.5);
                                  const rate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
                                  return rate >= 90;
                                }).length / filteredSummaries.length) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Medium Attendance (75-89%)</span>
                          <span className="text-sm font-medium">
                            {filteredSummaries.filter(s => {
                              const totalWorkDays = s.totalDays - s.holidayDays;
                              const presentDays = s.presentFullDays + (s.presentHalfDays * 0.5);
                              const rate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
                              return rate >= 75 && rate < 90;
                            }).length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-yellow-500 h-2.5 rounded-full" 
                            style={{ 
                              width: `${filteredSummaries.length > 0 
                                ? (filteredSummaries.filter(s => {
                                  const totalWorkDays = s.totalDays - s.holidayDays;
                                  const presentDays = s.presentFullDays + (s.presentHalfDays * 0.5);
                                  const rate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
                                  return rate >= 75 && rate < 90;
                                }).length / filteredSummaries.length) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Low Attendance (<75%)</span>
                          <span className="text-sm font-medium">
                            {filteredSummaries.filter(s => {
                              const totalWorkDays = s.totalDays - s.holidayDays;
                              const presentDays = s.presentFullDays + (s.presentHalfDays * 0.5);
                              const rate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
                              return rate < 75;
                            }).length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-red-500 h-2.5 rounded-full" 
                            style={{ 
                              width: `${filteredSummaries.length > 0 
                                ? (filteredSummaries.filter(s => {
                                  const totalWorkDays = s.totalDays - s.holidayDays;
                                  const presentDays = s.presentFullDays + (s.presentHalfDays * 0.5);
                                  const rate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
                                  return rate < 75;
                                }).length / filteredSummaries.length) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Staff with Overtime</span>
                          <span className="text-sm font-medium">
                            {filteredSummaries.filter(s => s.totalOvertimeHours > 0).length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-purple-500 h-2.5 rounded-full" 
                            style={{ 
                              width: `${filteredSummaries.length > 0 
                                ? (filteredSummaries.filter(s => s.totalOvertimeHours > 0).length / filteredSummaries.length) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {(compact || activeTab === 'details' || activeTab === 'export') && (
                <div className="space-y-4">
                  {/* Search and filter */}
                  <div className="flex flex-wrap gap-2 mb-4 items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search staff..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-10">
                          <ListFilter className="h-4 w-4 mr-2" />
                          <span>Filter</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className={filterStatus === 'all' ? 'bg-accent text-accent-foreground' : ''}
                          onClick={() => setFilterStatus('all')}
                        >
                          All Staff
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={filterStatus === 'high' ? 'bg-accent text-accent-foreground' : ''}
                          onClick={() => setFilterStatus('high')}
                        >
                          High Attendance (≥90%)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={filterStatus === 'medium' ? 'bg-accent text-accent-foreground' : ''}
                          onClick={() => setFilterStatus('medium')}
                        >
                          Medium Attendance (75-89%)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={filterStatus === 'low' ? 'bg-accent text-accent-foreground' : ''}
                          onClick={() => setFilterStatus('low')}
                        >
                          Low Attendance (<75%)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={filterStatus === 'overtime' ? 'bg-accent text-accent-foreground' : ''}
                          onClick={() => setFilterStatus('overtime')}
                        >
                          With Overtime
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Staff table */}
                  <div className="border rounded-lg max-h-[60vh] flex-1 overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead 
                            className="cursor-pointer w-52"
                            onClick={() => handleSort('staffName')}
                          >
                            <div className="flex items-center">
                              <span>Staff Name</span>
                              {sortColumn === 'staffName' && (
                                <ArrowUpDown className="ml-1 h-4 w-4" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer"
                            onClick={() => handleSort('presentDays')}
                          >
                            <div className="flex items-center">
                              <span>Present Days</span>
                              {sortColumn === 'presentDays' && (
                                <ArrowUpDown className="ml-1 h-4 w-4" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer"
                            onClick={() => handleSort('absentDays')}
                          >
                            <div className="flex items-center">
                              <span>Absent</span>
                              {sortColumn === 'absentDays' && (
                                <ArrowUpDown className="ml-1 h-4 w-4" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer"
                            onClick={() => handleSort('totalHoursWorked')}
                          >
                            <div className="flex items-center">
                              <span>Hours</span>
                              {sortColumn === 'totalHoursWorked' && (
                                <ArrowUpDown className="ml-1 h-4 w-4" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer"
                            onClick={() => handleSort('totalOvertimeHours')}
                          >
                            <div className="flex items-center">
                              <span>OT</span>
                              {sortColumn === 'totalOvertimeHours' && (
                                <ArrowUpDown className="ml-1 h-4 w-4" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer"
                            onClick={() => handleSort('attendanceRate')}
                          >
                            <div className="flex items-center">
                              <span>Rate</span>
                              {sortColumn === 'attendanceRate' && (
                                <ArrowUpDown className="ml-1 h-4 w-4" />
                              )}
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSummaries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center h-32">
                              {searchQuery || filterStatus !== 'all' ? (
                                <div className="flex flex-col items-center space-y-2">
                                  <Search className="h-8 w-8 text-gray-300" />
                                  <p className="text-gray-500">No staff match the current filters</p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center space-y-2">
                                  <Users className="h-8 w-8 text-gray-300" />
                                  <p className="text-gray-500">No attendance data for this period</p>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredSummaries.map(summary => {
                            const totalWorkDays = summary.totalDays - summary.holidayDays;
                            const presentDays = summary.presentDays;
                            const attendanceRate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
                            
                            return (
                              <TableRow key={summary.staffId}>
                                <TableCell>
                                  <div className="font-medium">{summary.staffName}</div>
                                  <div className="text-xs text-gray-500">{summary.staffEmail}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    {summary.presentDays}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-red-50 text-red-700">
                                    {summary.absentDays}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {summary.totalHoursWorked.toFixed(1)}
                                </TableCell>
                                <TableCell>
                                  {summary.totalOvertimeHours > 0 ? (
                                    <Badge className="bg-purple-100 text-purple-800">
                                      {summary.totalOvertimeHours.toFixed(1)}
                                    </Badge>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        attendanceRate >= 90 ? 'bg-green-500' :
                                        attendanceRate >= 75 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                      }`} 
                                      style={{ width: `${Math.min(100, attendanceRate)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium">{attendanceRate.toFixed(0)}%</span>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {activeTab === 'export' && (
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                      <h3 className="font-medium">Export Options</h3>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full sm:w-auto flex justify-start gap-2"
                          onClick={() => {
                            toast({
                              title: "Export Started",
                              description: "Exporting attendance data to CSV",
                              variant: "success"
                            });
                          }}
                        >
                          <FileText className="h-4 w-4" />
                          Export to CSV
                        </Button>
                        
                        <Button 
                          variant="outline"
                          className="w-full sm:w-auto flex justify-start gap-2"
                          onClick={() => {
                            toast({
                              title: "Print Job Started",
                              description: "Preparing attendance report for printing",
                              variant: "success"
                            });
                          }}
                        >
                          <Printer className="h-4 w-4" />
                          Print Report
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
      
      {!compact && (
        <CardFooter className="border-t pt-4 px-6">
          <div className="flex flex-wrap justify-between items-center gap-2 w-full">
            <div className="text-sm text-gray-500">
              Showing {filteredSummaries.length} of {staffSummaries.length} staff members
            </div>
            <Button 
              variant="outline" 
              onClick={refreshData}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Data
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}