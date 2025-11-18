// src/app/dashboard/reports/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { Appointment } from '@/types/appointment';
import { Doctor, formatCurrency } from '@/types/doctor';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  CalendarDays,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  FileText,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Calendar,
  Clock,
  Stethoscope,
  Phone,
  User,
  CreditCard,
  Loader2,
  FilterX,
  Search,
  BarChart3,
  Hash,
} from 'lucide-react';
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns';
import withAuth from '@/components/withAuth';

interface ReportsData {
  totalAppointments: number;
  totalPatients: number;
  completedAppointments: number;
  canceledAppointments: number;
  refundedAppointments: number;
  totalDoctorFees: number;
  totalRevenue: number;
  paidAppointments: number;
  scheduledAppointments: number;
}

interface DoctorReportData {
  doctorId: string;
  doctorName: string;
  appointments: number;
  completedAppointments: number;
  totalRevenue: number;
  doctorFees: number;
  patients: string[];
}

// Extended appointment interface with session info
interface AppointmentWithSessionInfo extends Appointment {
  sessionId: string;
  appointmentNumber: string;
  sessionDisplay: string;
}

function ReportsPage() {
  // State for data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState('thisMonth'); // thisMonth, thisYear, custom, all
  const [customStartDate, setCustomStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // View states
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'doctors'>('overview');
  
  // Helper function - moved before useMemo hooks
  const formatTime = (time: string): string => {
    if (!time) return '';
    try {
      const [hour, minute] = time.split(':');
      const hourNum = parseInt(hour);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const hour12 = hourNum % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
    } catch (e) {
      return time;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'no-show': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-3 w-3" />;
      case 'completed': return <CheckCircle2 className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      case 'no-show': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    loadAppointments();
    loadDoctors();
  }, []);
  
  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters();
  }, [appointments, dateFilter, customStartDate, customEndDate, doctorFilter, statusFilter, searchQuery]);
  
  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAllAppointments();
      
      // Enrich appointments with sale data if they don't have manualAppointmentAmount
      const enrichedData = await Promise.all(
        data.map(async (appointment) => {
          // If appointment already has manualAppointmentAmount, return as is
          if (appointment.manualAppointmentAmount && appointment.manualAppointmentAmount > 0) {
            return appointment;
          }
          
          // If appointment has a linked POS sale, fetch the amount from the sale
          if (appointment.payment?.posSaleId) {
            try {
              const { saleService } = await import('@/services/saleService');
              const sale = await saleService.getById(appointment.payment.posSaleId);
              
              if (sale?.manualAppointmentAmount && sale.manualAppointmentAmount > 0) {
                // Return appointment with manualAppointmentAmount from sale
                return {
                  ...appointment,
                  manualAppointmentAmount: sale.manualAppointmentAmount
                };
              }
            } catch (error) {
              console.warn(`Failed to fetch sale ${appointment.payment.posSaleId} for appointment ${appointment.id}:`, error);
            }
          }
          
          return appointment;
        })
      );
      
      setAppointments(enrichedData);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };
  
  const loadDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const data = await doctorService.getAllDoctors();
      setDoctors(data.filter(doc => doc.isActive));
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoadingDoctors(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...appointments];
    
    // Date filtering
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      
      switch (dateFilter) {
        case 'thisMonth':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'thisYear':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        case 'last30Days':
          startDate = subDays(now, 30);
          endDate = now;
          break;
        case 'custom':
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          break;
        default:
          startDate = new Date(0);
          endDate = now;
      }
      
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= startDate && appointmentDate <= endDate;
      });
    }
    
    // Doctor filtering
    if (doctorFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.doctorId === doctorFilter);
    }
    
    // Status filtering
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }
    
    // Search filtering
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(appointment =>
        appointment.patientName.toLowerCase().includes(query) ||
        appointment.patientContact.toLowerCase().includes(query) ||
        appointment.doctorName.toLowerCase().includes(query)
      );
    }
    
    setFilteredAppointments(filtered);
  };

  // Generate appointments with session info and appointment numbers
  const appointmentsWithSessionInfo: AppointmentWithSessionInfo[] = useMemo(() => {
    // Group appointments by session (doctorId + date + startTime + endTime)
    const sessionGroups = new Map<string, Appointment[]>();
    
    filteredAppointments.forEach(appointment => {
      // Create a unique session ID with fallback values for undefined properties
      const doctorId = appointment.doctorId || 'unknown';
      const date = appointment.date || 'no-date';
      const startTime = appointment.startTime || 'no-time';
      const endTime = appointment.endTime || 'no-endtime';
      const sessionId = `${doctorId}_${date}_${startTime}_${endTime}`;
      
      if (!sessionGroups.has(sessionId)) {
        sessionGroups.set(sessionId, []);
      }
      sessionGroups.get(sessionId)!.push(appointment);
    });
    
    // Sort appointments within each session and assign appointment numbers
    const appointmentsWithInfo: AppointmentWithSessionInfo[] = [];
    
    sessionGroups.forEach((sessionAppointments, sessionId) => {
      // Sort appointments within session by creation time or ID to maintain consistent order
      const sortedSessionAppointments = sessionAppointments.sort((a, b) => {
        // First try to sort by creation time if both have it
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        // If only one has creation time, prioritize it
        if (a.createdAt) return -1;
        if (b.createdAt) return 1;
        // Otherwise sort by ID
        const aId = a.id || '';
        const bId = b.id || '';
        return aId.localeCompare(bId);
      });
      
      sortedSessionAppointments.forEach((appointment, index) => {
        const appointmentNumber = (index + 1).toString();
        
        // Safely create session display with fallbacks for undefined values
        const dateDisplay = appointment.date 
          ? format(new Date(appointment.date), 'MMM dd') 
          : 'No Date';
        const timeDisplay = appointment.startTime 
          ? formatTime(appointment.startTime) 
          : 'No Time';
        const sessionDisplay = `${appointment.doctorName || 'Unknown Doctor'} - ${dateDisplay} ${timeDisplay}`;
        
        appointmentsWithInfo.push({
          ...appointment,
          sessionId,
          appointmentNumber,
          sessionDisplay
        });
      });
    });
    
    // Sort all appointments by date and time for display
    return appointmentsWithInfo.sort((a, b) => {
      // Handle undefined dates
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      
      // Handle undefined start times
      if (!a.startTime && !b.startTime) return 0;
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      
      return a.startTime.localeCompare(b.startTime);
    });
  }, [filteredAppointments]);
  
  // Calculate reports data
  const reportsData: ReportsData = useMemo(() => {
    const uniquePatients = new Set(filteredAppointments.map(apt => apt.patientContact));
    
    let totalDoctorFees = 0;
    let totalRevenue = 0;
    let paidCount = 0;
    let refundedCount = 0;
    
    filteredAppointments.forEach(appointment => {
      // Count refunded appointments
      if (appointment.payment?.refunded) {
        refundedCount++;
        return; // Skip refunded appointments from revenue calculations
      }
      
      // Count paid appointments and calculate revenue
      if (appointment.payment?.isPaid) {
        paidCount++;
        // Use manualAppointmentAmount if available, otherwise fall back to totalCharge
        const appointmentAmount = (appointment.manualAppointmentAmount && appointment.manualAppointmentAmount > 0)
          ? appointment.manualAppointmentAmount
          : appointment.totalCharge || 0;
        totalRevenue += appointmentAmount;
        
        // Doctor fees only for arrived and paid (non-refunded) appointments
        if (appointment.isPatientArrived) {
          totalDoctorFees += appointmentAmount;
        }
      }
    });
    
    return {
      totalAppointments: filteredAppointments.length,
      totalPatients: uniquePatients.size,
      completedAppointments: filteredAppointments.filter(a => a.status === 'completed').length,
      canceledAppointments: filteredAppointments.filter(a => a.status === 'cancelled').length,
      refundedAppointments: refundedCount,
      totalDoctorFees,
      totalRevenue,
      paidAppointments: paidCount,
      scheduledAppointments: filteredAppointments.filter(a => a.status === 'scheduled').length,
    };
  }, [filteredAppointments]);
  
  // Calculate doctor-wise reports
  const doctorReports: DoctorReportData[] = useMemo(() => {
    const doctorMap = new Map<string, DoctorReportData>();
    
    filteredAppointments.forEach(appointment => {
      if (!doctorMap.has(appointment.doctorId)) {
        doctorMap.set(appointment.doctorId, {
          doctorId: appointment.doctorId,
          doctorName: appointment.doctorName,
          appointments: 0,
          completedAppointments: 0,
          totalRevenue: 0,
          doctorFees: 0,
          patients: [],
        });
      }
      
      const doctorData = doctorMap.get(appointment.doctorId)!;
      doctorData.appointments++;
      
      if (appointment.status === 'completed') {
        doctorData.completedAppointments++;
      }
      
      // Add unique patients
      if (!doctorData.patients.includes(appointment.patientContact)) {
        doctorData.patients.push(appointment.patientContact);
      }
      
      // Calculate revenue (exclude refunded)
      if (appointment.payment?.isPaid && !appointment.payment?.refunded) {
        // Use manualAppointmentAmount if available, otherwise fall back to totalCharge
        const appointmentAmount = (appointment.manualAppointmentAmount && appointment.manualAppointmentAmount > 0)
          ? appointment.manualAppointmentAmount
          : appointment.totalCharge || 0;
        doctorData.totalRevenue += appointmentAmount;
        
        // Doctor fees for arrived and paid appointments
        if (appointment.isPatientArrived) {
          doctorData.doctorFees += appointmentAmount;
        }
      }
    });
    
    return Array.from(doctorMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredAppointments]);
  
  // Chart data for monthly trends
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { month: string; appointments: number; revenue: number }>();
    
    filteredAppointments.forEach(appointment => {
      const month = format(new Date(appointment.date), 'MMM yyyy');
      
      if (!monthMap.has(month)) {
        monthMap.set(month, { month, appointments: 0, revenue: 0 });
      }
      
      const monthData = monthMap.get(month)!;
      monthData.appointments++;
      
      if (appointment.payment?.isPaid && !appointment.payment?.refunded) {
        // Use manualAppointmentAmount if available, otherwise fall back to totalCharge
        const appointmentAmount = (appointment.manualAppointmentAmount && appointment.manualAppointmentAmount > 0)
          ? appointment.manualAppointmentAmount
          : appointment.totalCharge || 0;
        monthData.revenue += appointmentAmount;
      }
    });
    
    return Array.from(monthMap.values()).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }, [filteredAppointments]);
  
  // Status distribution for pie chart
  const statusData = [
    { name: 'Completed', value: reportsData.completedAppointments, color: '#10B981' },
    { name: 'Scheduled', value: reportsData.scheduledAppointments, color: '#3B82F6' },
    { name: 'Cancelled', value: reportsData.canceledAppointments, color: '#EF4444' },
    { name: 'Refunded', value: reportsData.refundedAppointments, color: '#F59E0B' },
  ].filter(item => item.value > 0);
  
  const clearFilters = () => {
    setDateFilter('thisMonth');
    setDoctorFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setCustomStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    setCustomEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  };
  
  const exportData = () => {
    const csvData = appointmentsWithSessionInfo.map(apt => ({
      'Session': apt.sessionDisplay,
      'Appointment Number': apt.appointmentNumber,
      'Appointment ID': apt.id,
      'Patient Name': apt.patientName,
      'Patient Contact': apt.patientContact,
      'Doctor Name': apt.doctorName,
      'Date': apt.date,
      'Time': `${apt.startTime} - ${apt.endTime}`,
      'Status': apt.status,
      'Total Charge': apt.totalCharge,
      'Appointment Fee': apt.manualAppointmentAmount && apt.manualAppointmentAmount > 0 
        ? apt.manualAppointmentAmount 
        : apt.totalCharge || 0,
      'Amount Source': apt.manualAppointmentAmount && apt.manualAppointmentAmount > 0
        ? (apt.payment?.posSaleId ? 'From POS Sale' : 'Manual Amount')
        : 'Total Charge',
      'Payment Status': apt.payment?.isPaid ? 'Paid' : 'Unpaid',
      'Payment Method': apt.payment?.paidBy || '',
      'Refunded': apt.payment?.refunded ? 'Yes' : 'No',
      'Patient Arrived': apt.isPatientArrived ? 'Yes' : 'No',
      'POS Sale ID': apt.payment?.posSaleId || '',
    }));
    
    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Appointments Reports
              </h1>
              <p className="text-slate-600">
                Comprehensive analytics and insights for your clinic appointments
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-white border-blue-200 text-blue-700 font-medium">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Analytics Dashboard
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadAppointments}
                disabled={loading}
                className="bg-white shadow-sm border-slate-200 hover:bg-slate-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button 
                onClick={exportData}
                disabled={filteredAppointments.length === 0}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
          
          {/* Filters Section */}
          <Card className="bg-white shadow-sm border-0 shadow-slate-100">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Filters & Search
                </CardTitle>
                {(dateFilter !== 'thisMonth' || doctorFilter !== 'all' || statusFilter !== 'all' || searchQuery.trim() !== '') && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <FilterX className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search patients, doctors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white border-slate-200"
                    />
                  </div>
                </div>
                
                {/* Date Filter */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Date Period</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                      <SelectItem value="thisYear">This Year</SelectItem>
                      <SelectItem value="last30Days">Last 30 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Doctor Filter */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Doctor</Label>
                  <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Doctors</SelectItem>
                      {doctors.map(doctor => (
                        <SelectItem key={doctor.id} value={doctor.id!}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Status Filter */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no-show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Custom Date Range */}
                {dateFilter === 'custom' && (
                  <div className="lg:col-span-2 grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">Start Date</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="bg-white border-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">End Date</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="bg-white border-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-slate-600">Loading reports...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Navigation Tabs */}
              <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm border border-slate-200">
                <Button
                  variant={activeTab === 'overview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('overview')}
                  className={activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-600'}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </Button>
                <Button
                  variant={activeTab === 'detailed' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('detailed')}
                  className={activeTab === 'detailed' ? 'bg-blue-600 text-white' : 'text-slate-600'}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Detailed
                </Button>
                <Button
                  variant={activeTab === 'doctors' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('doctors')}
                  className={activeTab === 'doctors' ? 'bg-blue-600 text-white' : 'text-slate-600'}
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Doctor Reports
                </Button>
              </div>
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-700">Total Appointments</p>
                            <p className="text-3xl font-bold text-blue-900">{reportsData.totalAppointments}</p>
                            <p className="text-sm text-blue-600 mt-1">All appointments</p>
                          </div>
                          <div className="p-3 bg-blue-200 rounded-xl">
                            <CalendarDays className="h-8 w-8 text-blue-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-700">Total Patients</p>
                            <p className="text-3xl font-bold text-green-900">{reportsData.totalPatients}</p>
                            <p className="text-sm text-green-600 mt-1">Unique patients</p>
                          </div>
                          <div className="p-3 bg-green-200 rounded-xl">
                            <Users className="h-8 w-8 text-green-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-0">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-indigo-700">Appointment Fees</p>
                            <p className="text-3xl font-bold text-indigo-900">{formatCurrency(reportsData.totalDoctorFees)}</p>
                            <p className="text-sm text-indigo-600 mt-1">From arrived patients</p>
                          </div>
                          <div className="p-3 bg-indigo-200 rounded-xl">
                            <DollarSign className="h-8 w-8 text-indigo-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-700">Total Revenue</p>
                            <p className="text-3xl font-bold text-purple-900">{formatCurrency(reportsData.totalRevenue)}</p>
                            <p className="text-sm text-purple-600 mt-1">Paid appointments</p>
                          </div>
                          <div className="p-3 bg-purple-200 rounded-xl">
                            <TrendingUp className="h-8 w-8 text-purple-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-0">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-amber-700">Completion Rate</p>
                            <p className="text-3xl font-bold text-amber-900">
                              {reportsData.totalAppointments > 0 
                                ? Math.round((reportsData.completedAppointments / reportsData.totalAppointments) * 100)
                                : 0}%
                            </p>
                            <p className="text-sm text-amber-600 mt-1">Success rate</p>
                          </div>
                          <div className="p-3 bg-amber-200 rounded-xl">
                            <Activity className="h-8 w-8 text-amber-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Revenue Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white shadow-sm border-0 shadow-slate-100">
                      <CardHeader className="border-b border-slate-100">
                        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          Revenue Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Stethoscope className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-blue-900">Doctor Fees</p>
                                <p className="text-sm text-blue-600">From arrived & paid patients</p>
                              </div>
                            </div>
                            <p className="text-2xl font-bold text-blue-900">
                              {formatCurrency(reportsData.totalDoctorFees)}
                            </p>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <CreditCard className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-medium text-purple-900">Total Revenue</p>
                                <p className="text-sm text-purple-600">Excluding refunds</p>
                              </div>
                            </div>
                            <p className="text-3xl font-bold text-purple-900">
                              {formatCurrency(reportsData.totalRevenue)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Appointment Status Distribution */}
                    <Card className="bg-white shadow-sm border-0 shadow-slate-100">
                      <CardHeader className="border-b border-slate-100">
                        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          Status Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-green-900">{reportsData.completedAppointments}</p>
                              <p className="text-sm text-green-600">Completed</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-blue-900">{reportsData.scheduledAppointments}</p>
                              <p className="text-sm text-blue-600">Scheduled</p>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-red-900">{reportsData.canceledAppointments}</p>
                              <p className="text-sm text-red-600">Cancelled</p>
                            </div>
                            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                              <RotateCcw className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-amber-900">{reportsData.refundedAppointments}</p>
                              <p className="text-sm text-amber-600">Refunded</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Charts */}
                  {monthlyData.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Monthly Trends */}
                      <Card className="bg-white shadow-sm border-0 shadow-slate-100">
                        <CardHeader className="border-b border-slate-100">
                          <CardTitle className="text-lg font-semibold text-slate-900">Monthly Trends</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis yAxisId="left" />
                              <YAxis yAxisId="right" orientation="right" />
                              <Tooltip 
                                formatter={(value, name) => [
                                  name === 'revenue' ? formatCurrency(value as number) : value,
                                  name === 'revenue' ? 'Revenue' : 'Appointments'
                                ]}
                              />
                              <Bar yAxisId="left" dataKey="appointments" fill="#3B82F6" name="appointments" />
                              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} name="revenue" />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      
                      {/* Status Pie Chart */}
                      <Card className="bg-white shadow-sm border-0 shadow-slate-100">
                        <CardHeader className="border-b border-slate-100">
                          <CardTitle className="text-lg font-semibold text-slate-900">Status Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {statusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
              
              {/* Doctor Reports Tab */}
              {activeTab === 'doctors' && (
                <Card className="bg-white shadow-sm border-0 shadow-slate-100">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                      Doctor-wise Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="font-semibold text-slate-700">Doctor</TableHead>
                            <TableHead className="font-semibold text-slate-700">Appointments</TableHead>
                            <TableHead className="font-semibold text-slate-700">Completed</TableHead>
                            <TableHead className="font-semibold text-slate-700">Patients</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right">Appointment Fees</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right">Total Revenue</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right">Success Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {doctorReports.map((doctor) => (
                            <TableRow key={doctor.doctorId} className="hover:bg-slate-50/50">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-50 rounded-lg">
                                    <Stethoscope className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900">{doctor.doctorName}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {doctor.appointments}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {doctor.completedAppointments}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  {doctor.patients.length}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-indigo-900">
                                    {formatCurrency(doctor.doctorFees)}
                                  </div>
                                  <div className="text-xs text-slate-600">
                                    From arrived patients
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold text-purple-900">
                                {formatCurrency(doctor.totalRevenue)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge 
                                  variant="outline" 
                                  className={
                                    doctor.appointments > 0 && (doctor.completedAppointments / doctor.appointments) >= 0.8
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : doctor.appointments > 0 && (doctor.completedAppointments / doctor.appointments) >= 0.6
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }
                                >
                                  {doctor.appointments > 0 
                                    ? Math.round((doctor.completedAppointments / doctor.appointments) * 100)
                                    : 0}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Detailed Tab - Updated with appointment numbers */}
              {activeTab === 'detailed' && (
                <Card className="bg-white shadow-sm border-0 shadow-slate-100">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Detailed Appointments Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-slate-50 z-10">
                          <TableRow>
                            <TableHead className="font-semibold text-slate-700">Appointment #</TableHead>
                            <TableHead className="font-semibold text-slate-700">Session</TableHead>
                            <TableHead className="font-semibold text-slate-700">Patient</TableHead>
                            <TableHead className="font-semibold text-slate-700">Doctor</TableHead>
                            <TableHead className="font-semibold text-slate-700">Date & Time</TableHead>
                            <TableHead className="font-semibold text-slate-700">Procedures</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right">Total Charge</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right">Appointment Fee</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="font-semibold text-slate-700">Payment</TableHead>
                            <TableHead className="font-semibold text-slate-700">Arrival</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {appointmentsWithSessionInfo.map((appointment) => (
                            <TableRow key={appointment.id} className="hover:bg-slate-50/50">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-blue-50 rounded-lg">
                                    <Hash className="h-3 w-3 text-blue-600" />
                                  </div>
                                  <span className="font-mono text-sm font-medium text-slate-900">
                                    #{appointment.appointmentNumber}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium text-slate-900 truncate max-w-32">
                                    {appointment.sessionDisplay}
                                  </div>
                                  <div className="text-xs text-slate-600">
                                    Session ID: {appointment.sessionId.split('_').slice(-2).join(' ')}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-50 rounded-lg">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900">{appointment.patientName}</div>
                                    <div className="flex items-center gap-1 text-sm text-slate-600">
                                      <Phone className="h-3 w-3" />
                                      {appointment.patientContact}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-green-50 rounded-lg">
                                    <Stethoscope className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div className="font-medium text-slate-900">{appointment.doctorName}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-slate-900">
                                    {appointment.date ? format(new Date(appointment.date), 'MMM dd, yyyy') : 'No Date'}
                                  </div>
                                  <div className="text-sm text-slate-600">
                                    {appointment.startTime ? formatTime(appointment.startTime) : 'No Time'} - {appointment.endTime ? formatTime(appointment.endTime) : 'No Time'}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {appointment.procedures && appointment.procedures.length > 0 ? (
                                    <>
                                      {appointment.procedures.slice(0, 2).map((proc, idx) => (
                                        <div key={idx} className="text-sm font-medium text-slate-900">
                                          {proc.procedureName}
                                        </div>
                                      ))}
                                      {appointment.procedures.length > 2 && (
                                        <div className="text-xs text-blue-600 font-medium">
                                          +{appointment.procedures.length - 2} more
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-sm text-slate-500 italic">No procedures</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-900">
                                    {formatCurrency(appointment.totalCharge)}
                                  </div>
                                  {appointment.payment?.refunded && (
                                    <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
                                      Refunded
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="space-y-1">
                                  {appointment.manualAppointmentAmount && appointment.manualAppointmentAmount > 0 ? (
                                    <>
                                      <div className="font-bold text-blue-900">
                                        {formatCurrency(appointment.manualAppointmentAmount)}
                                      </div>
                                      <div className="text-xs text-slate-600">
                                        {appointment.payment?.posSaleId ? 'From POS Sale' : 'Appointment Fee'}
                                      </div>
                                    </>
                                  ) : appointment.totalCharge > 0 ? (
                                    <>
                                      <div className="font-semibold text-slate-700">
                                        {formatCurrency(appointment.totalCharge)}
                                      </div>
                                      <div className="text-xs text-slate-600">
                                        Total Charge
                                      </div>
                                    </>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                      Not Set
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline"
                                  className={`inline-flex items-center gap-1 ${getStatusColor(appointment.status)}`}
                                >
                                  {getStatusIcon(appointment.status)}
                                  <span className="capitalize">{appointment.status}</span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {appointment.payment?.isPaid ? (
                                    <Badge className="bg-green-50 text-green-700 border-green-200">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Paid ({appointment.payment.paidBy})
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-50 text-red-700 border-red-200">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Unpaid
                                    </Badge>
                                  )}
                                  {appointment.payment?.cardDetails && (
                                    <div className="text-xs text-slate-600 font-mono">
                                      {appointment.payment.cardDetails.maskedNumber}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {appointment.isPatientArrived ? (
                                  <Badge className="bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Arrived
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ReportsPage);