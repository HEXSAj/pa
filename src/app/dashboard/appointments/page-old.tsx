// src/app/dashboard/appointments/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import { doctorSessionService } from '@/services/doctorSessionService';
import { Appointment, formatAppointmentDate, DoctorSession } from '@/types/appointment';
import { Doctor, DoctorSchedule, formatCurrency } from '@/types/doctor';
import DashboardLayout from '@/components/DashboardLayout';
import AppointmentModal from './AppointmentModal';
import SessionDetailsModal from './SessionDetailsModal';
import { 
  Plus, 
  Loader2, 
  Search, 
  FilterX, 
  Calendar,
  Clock, 
  Users,
  CalendarDays,
  X,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Eye,
  Filter,
  Download,
  MoreVertical,
  User,
  Phone,
  Stethoscope,
  History,
  CalendarCheck,
  ToggleLeft,
  ToggleRight,
  LogOut,
  UserCheck,
  CheckCircle2,
  RefreshCcw,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format, addDays, startOfWeek, getDay, isToday, isBefore, parseISO, startOfDay, subDays } from 'date-fns';
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';

import * as XLSX from 'xlsx';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Helper to get the day index from date-fns to our day format
const getDayOfWeekFromDate = (date: Date): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[getDay(date)];
};



function AppointmentsPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  // State for data
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<{[doctorId: string]: DoctorSchedule[]}>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [doctorSessions, setDoctorSessions] = useState<{[sessionId: string]: DoctorSession}>({});
  
  // State for current week
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // UI states
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedSession, setSelectedSession] = useState<{
    doctorName: string;
    doctorSpeciality: string;
    date: string;
    startTime: string;
    endTime: string;
    appointments: Appointment[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingPastAppointments, setLoadingPastAppointments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Past appointments toggle
  const [showPastAppointments, setShowPastAppointments] = useState(false);
  const [pastAppointmentsDateRange, setPastAppointmentsDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'), // Last 30 days
    endDate: format(subDays(new Date(), 1), 'yyyy-MM-dd') // Until yesterday
  });

  const [isExporting, setIsExporting] = useState(false);
  const [showExportDateModal, setShowExportDateModal] = useState(false);
  const [exportDateRange, setExportDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  
  // Calculate week days for display (only today and future days)
  const weekDays = useMemo(() => {
    const days = [];
    const today = startOfDay(new Date());
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      // Only include today and future days
      if (!isBefore(day, today)) {
        days.push(day);
      }
    }
    return days;
  }, [weekStart]);

  const handleExportAppointments = async () => {
    try {
      setIsExporting(true);
      
      let appointmentsToExport: Appointment[] = [];
      
      if (showPastAppointments) {
        // Export past appointments within selected date range
        appointmentsToExport = await appointmentService.getAppointmentsByDateRange(
          pastAppointmentsDateRange.startDate,
          pastAppointmentsDateRange.endDate
        );
      } else {
        // Show date range modal for current appointments
        setShowExportDateModal(true);
        setIsExporting(false);
        return;
      }
      
      if (appointmentsToExport.length === 0) {
        toast.info('No appointments found in the selected date range');
        setIsExporting(false);
        return;
      }
      
      // Prepare data for export
      const exportData = appointmentsToExport.map(appointment => ({
        'Date': appointment.date,
        'Day': appointment.dayOfWeek,
        'Start Time': appointment.startTime,
        'End Time': appointment.endTime,
        'Doctor': appointment.doctorName,
        'Patient Name': appointment.patientName,
        'Patient Contact': appointment.patientContact,
        'Procedures': (appointment.procedures || []).map(p => p.procedureName).join(', '),
        'Total Charge': appointment.totalCharge,
        'Status': appointment.status,
        'Payment Status': appointment.payment?.status || 'Unpaid',
        'Payment Method': appointment.payment?.method || 'N/A',
        'Patient Arrived': appointment.isPatientArrived ? 'Yes' : 'No',
        'Notes': appointment.notes || ''
      }));
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const columnWidths = [
        { wch: 12 }, // Date
        { wch: 10 }, // Day
        { wch: 10 }, // Start Time
        { wch: 10 }, // End Time
        { wch: 20 }, // Doctor
        { wch: 20 }, // Patient Name
        { wch: 15 }, // Patient Contact
        { wch: 30 }, // Procedures
        { wch: 12 }, // Total Charge
        { wch: 10 }, // Status
        { wch: 12 }, // Payment Status
        { wch: 12 }, // Payment Method
        { wch: 12 }, // Patient Arrived
        { wch: 30 }  // Notes
      ];
      worksheet['!cols'] = columnWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments');
      
      // Generate filename with date range
      const filename = showPastAppointments 
        ? `appointments_${pastAppointmentsDateRange.startDate}_to_${pastAppointmentsDateRange.endDate}.xlsx`
        : `appointments_${exportDateRange.startDate}_to_${exportDateRange.endDate}.xlsx`;
      
      // Download file
      XLSX.writeFile(workbook, filename);
      
      toast.success(`Successfully exported ${appointmentsToExport.length} appointments`);
      
    } catch (error: any) {
      console.error('Error exporting appointments:', error);
      toast.error('Failed to export appointments');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleExportWithDateRange = async () => {
    try {
      setIsExporting(true);
      setShowExportDateModal(false);
      
      const appointmentsToExport = await appointmentService.getAppointmentsByDateRange(
        exportDateRange.startDate,
        exportDateRange.endDate
      );
      
      if (appointmentsToExport.length === 0) {
        toast.info('No appointments found in the selected date range');
        setIsExporting(false);
        return;
      }
      
      // Same export logic as above
      const exportData = appointmentsToExport.map(appointment => ({
        'Date': appointment.date,
        'Day': appointment.dayOfWeek,
        'Start Time': appointment.startTime,
        'End Time': appointment.endTime,
        'Doctor': appointment.doctorName,
        'Patient Name': appointment.patientName,
        'Patient Contact': appointment.patientContact,
        'Procedures': (appointment.procedures || []).map(p => p.procedureName).join(', '),
        'Total Charge': appointment.totalCharge,
        'Status': appointment.status,
        'Payment Status': appointment.payment?.status || 'Unpaid',
        'Payment Method': appointment.payment?.method || 'N/A',
        'Patient Arrived': appointment.isPatientArrived ? 'Yes' : 'No',
        'Notes': appointment.notes || ''
      }));
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      const columnWidths = [
        { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 20 },
        { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 10 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }
      ];
      worksheet['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments');
      
      const filename = `appointments_${exportDateRange.startDate}_to_${exportDateRange.endDate}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      toast.success(`Successfully exported ${appointmentsToExport.length} appointments`);
      
    } catch (error: any) {
      console.error('Error exporting appointments:', error);
      toast.error('Failed to export appointments');
    } finally {
      setIsExporting(false);
    }
  };

  const isAppointmentOngoing = (appointment: Appointment): boolean => {
      const now = new Date();
      const currentDate = format(now, 'yyyy-MM-dd');
      const currentTime = format(now, 'HH:mm');
      
      return appointment.date === currentDate &&
            appointment.startTime <= currentTime &&
            appointment.endTime >= currentTime &&
            appointment.status === 'scheduled' &&
            appointment.isPatientArrived;
    };

    // Helper function to get the next upcoming appointment
    const getNextAppointment = (appointments: Appointment[]): Appointment | null => {
      const now = new Date();
      const currentDate = format(now, 'yyyy-MM-dd');
      const currentTime = format(now, 'HH:mm');
      
      const upcomingAppointments = appointments.filter(appointment => {
        const appointmentDateTime = new Date(`${appointment.date}T${appointment.startTime}`);
        const nowDateTime = new Date();
        
        return appointmentDateTime > nowDateTime &&
              appointment.status === 'scheduled';
      });
      
      if (upcomingAppointments.length === 0) return null;
      
      // Sort by date and time to get the earliest one
      return upcomingAppointments.sort((a, b) => {
        const aDateTime = new Date(`${a.date}T${a.startTime}`);
        const bDateTime = new Date(`${b.date}T${b.startTime}`);
        return aDateTime.getTime() - bDateTime.getTime();
      })[0];
    };

    const openSessionModal = (appointment: Appointment) => {
      const doctor = doctors.find(d => d.id === appointment.doctorId);
      if (!doctor) {
        toast.error('Doctor information not found');
        return;
      }
      
      // Find all appointments for this session
      const sessionAppointments = appointments.filter(apt => 
        apt.doctorId === appointment.doctorId &&
        apt.date === appointment.date &&
        apt.startTime === appointment.startTime &&
        apt.endTime === appointment.endTime &&
        apt.status !== 'cancelled'
      );
      
      setSelectedSession({
        doctorName: doctor.name,
        doctorSpeciality: doctor.speciality,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        appointments: sessionAppointments
      });
      setShowSessionDetailsModal(true);
    };

  
  // Calculate statistics (only for current/future appointments)
  const stats = useMemo(() => {
    const totalAppointments = filteredAppointments.length;
    const completedAppointments = filteredAppointments.filter(a => a.status === 'completed').length;
    const scheduledAppointments = filteredAppointments.filter(a => a.status === 'scheduled').length;
    const totalRevenue = filteredAppointments
      .filter(a => a.payment?.isPaid && !a.payment?.refunded)
      .reduce((sum, a) => sum + a.totalCharge, 0);
    
    return {
      total: totalAppointments,
      completed: completedAppointments,
      scheduled: scheduledAppointments,
      revenue: totalRevenue
    };
  }, [filteredAppointments]);
  
  // Load doctor sessions function
  const loadDoctorSessions = async () => {
    try {
      const daysToCheck = showPastAppointments ? 
        Array.from(new Set(pastAppointments.map(apt => apt.date))) :
        weekDays.map(day => format(day, 'yyyy-MM-dd'));

      const allSessions: {[sessionId: string]: DoctorSession} = {};
      
      for (const dateStr of daysToCheck) {
        const sessions = await doctorSessionService.getSessionsByDate(dateStr);
        sessions.forEach(session => {
          if (session.id) {
            allSessions[session.id] = session;
          }
        });
      }
      
      setDoctorSessions(allSessions);
    } catch (error) {
      console.error('Error loading doctor sessions:', error);
    }
  };
  
  // Format timestamp helper
  const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Load data on initial render and when week changes
  useEffect(() => {
    loadAppointments();
    loadDoctorSessions();
  }, [weekDays]);
  
  useEffect(() => {
    loadDoctors();
  }, []);
  
  // Load past appointments when toggle is enabled
  useEffect(() => {
    if (showPastAppointments) {
      loadPastAppointments();
      loadDoctorSessions();
    }
  }, [showPastAppointments, pastAppointmentsDateRange]);
  
  // Filter appointments when filters change or data changes
  useEffect(() => {
    applyFilters();
  }, [appointments, searchQuery, doctorFilter, statusFilter]);
  
  const loadAppointments = async () => {
    setLoading(true);
    try {
      if (weekDays.length === 0) {
        setAppointments([]);
        setError(null);
        setLoading(false);
        return;
      }
      
      const startDate = format(weekDays[0], 'yyyy-MM-dd');
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd'); // Still load full week but filter display
      
      const data = await appointmentService.getAppointmentsByDateRange(startDate, endDate);
      
      // Filter to only show today and future appointments
      const today = startOfDay(new Date());
      const currentAndFutureAppointments = data.filter(appointment => {
        const appointmentDate = startOfDay(new Date(appointment.date));
        return !isBefore(appointmentDate, today);
      });
      
      setAppointments(currentAndFutureAppointments);
      setError(null);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      // Refresh appointments
      if (showPastAppointments) {
        await loadPastAppointments();
      } else {
        await loadAppointments();
      }
      
      // Refresh doctor sessions
      await loadDoctorSessions();
      
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const loadPastAppointments = async () => {
    setLoadingPastAppointments(true);
    try {
      const data = await appointmentService.getAppointmentsByDateRange(
        pastAppointmentsDateRange.startDate,
        pastAppointmentsDateRange.endDate
      );
      setPastAppointments(data);
    } catch (error) {
      console.error('Error loading past appointments:', error);
      toast.error('Failed to load past appointments');
    } finally {
      setLoadingPastAppointments(false);
    }
  };
  
  const loadDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const data = await doctorService.getAllDoctors();
      setDoctors(data.filter(doc => doc.isActive));
      
      const doctorSchedules: {[doctorId: string]: DoctorSchedule[]} = {};
      
      for (const doctor of data.filter(doc => doc.isActive)) {
        if (doctor.id) {
          const schedules = await doctorService.getSchedulesByDoctorId(doctor.id);
          doctorSchedules[doctor.id] = schedules.filter(s => s.isActive);
        }
      }
      
      setSchedules(doctorSchedules);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error("Failed to load doctors");
    } finally {
      setLoadingDoctors(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...appointments];
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(appointment => 
        appointment.patientName.toLowerCase().includes(query) ||
        appointment.patientContact.toLowerCase().includes(query) ||
        appointment.doctorName.toLowerCase().includes(query)
      );
    }
    
    if (doctorFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.doctorId === doctorFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }
    
    setFilteredAppointments(filtered);
  };
  
  const handleDeleteAppointment = async (id: string) => {
    try {
      await appointmentService.deleteAppointment(id);
      setShowDeleteDialog(false);
      setSelectedAppointment(null);
      toast.success('Appointment deleted successfully');
      loadAppointments();
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      toast.error(error.message || 'Failed to delete appointment');
    }
  };
  
  const handlePreviousWeek = () => {
    setWeekStart(prevWeek => addDays(prevWeek, -7));
  };
  
  const handleNextWeek = () => {
    setWeekStart(prevWeek => addDays(prevWeek, 7));
  };
  
  const goToCurrentWeek = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setDoctorFilter('all');
    setStatusFilter('all');
  };
  
  // Format time for display (24h to 12h)
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
  
  const getSessionsByDoctorAndDay = (appointmentsToUse: Appointment[] = filteredAppointments) => {
    const sessionsMap: Record<string, Record<string, {
      doctorId: string;
      doctorName: string;
      date: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      appointmentCount: number;
      appointments: Appointment[];
      sessionId?: string;
      doctorSession?: DoctorSession;
    }[]>> = {};
    
    doctors.forEach(doctor => {
      if (!doctor.id) return;
      
      const doctorSchedules = schedules[doctor.id] || [];
      sessionsMap[doctor.id] = {};
      
      const daysToProcess = showPastAppointments ? 
        // For past appointments, use the date range from past appointments
        pastAppointments.map(apt => new Date(apt.date)).filter((date, index, array) => 
          array.findIndex(d => d.getTime() === date.getTime()) === index
        ) : 
        weekDays;
      
      daysToProcess.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOfWeek = getDayOfWeekFromDate(date);
        
        const daySchedule = doctorSchedules.find(s => s.dayOfWeek === dayOfWeek);
        
        if (daySchedule && daySchedule.timeSlots.length > 0) {
          sessionsMap[doctor.id!][dateStr] = [];
          
          daySchedule.timeSlots.forEach(slot => {
            const slotAppointments = appointmentsToUse.filter(a => 
              a.doctorId === doctor.id && 
              a.date === dateStr && 
              a.startTime === slot.startTime && 
              a.endTime === slot.endTime &&
              a.status !== 'cancelled'
            );
            
            const sessionDate = new Date(`${dateStr}T${slot.startTime}`);
            const isPastSession = isBefore(sessionDate, new Date()) && !isToday(sessionDate);
            
            // For current view, only show if has appointments or not past
            // For past view, only show if has appointments
            if (slotAppointments.length > 0 || (!showPastAppointments && !isPastSession)) {
              const sessionId = `${doctor.id}_${dateStr}_${slot.startTime}_${slot.endTime}`;
              const doctorSession = doctorSessions[sessionId];
              
              sessionsMap[doctor.id!][dateStr].push({
                doctorId: doctor.id!,
                doctorName: doctor.name,
                date: dateStr,
                dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                appointmentCount: slotAppointments.length,
                appointments: slotAppointments,
                sessionId: sessionId,
                doctorSession: doctorSession
              });
            }
          });
        }
      });
    });
    
    return sessionsMap;
  };
  
  // Get background color based on appointment status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'no-show':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      case 'no-show':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };
  
  const sessions = getSessionsByDoctorAndDay(showPastAppointments ? pastAppointments : filteredAppointments);
  
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {showPastAppointments ? 'Past Appointments' : 'Appointments'}
                </h1>
                
                {/* Past Appointments Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPastAppointments(!showPastAppointments)}
                  className={`flex items-center gap-2 transition-all ${
                    showPastAppointments 
                      ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' 
                      : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {showPastAppointments ? (
                    <>
                      <ToggleRight className="h-4 w-4" />
                      <History className="h-4 w-4" />
                      Past View
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-4 w-4" />
                      <CalendarCheck className="h-4 w-4" />
                      Current View
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-slate-600">
                {showPastAppointments 
                  ? 'View and manage past appointment records'
                  : 'Manage your clinic appointments and patient schedules'
                }
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-white border-blue-200 text-blue-700 font-medium">
                  <Activity className="h-3 w-3 mr-1" />
                  {userRole} Access
                </Badge>
                {showPastAppointments && (
                  <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 font-medium">
                    <History className="h-3 w-3 mr-1" />
                    Historical Data
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {showPastAppointments && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={pastAppointmentsDateRange.startDate}
                    onChange={(e) => setPastAppointmentsDateRange(prev => ({
                      ...prev,
                      startDate: e.target.value
                    }))}
                    className="w-40 text-sm"
                  />
                  <span className="text-slate-500">to</span>
                  <Input
                    type="date"
                    value={pastAppointmentsDateRange.endDate}
                    onChange={(e) => setPastAppointmentsDateRange(prev => ({
                      ...prev,
                      endDate: e.target.value
                    }))}
                    className="w-40 text-sm"
                  />
                </div>
              )}
              
              {/* <Button 
                variant="outline" 
                size="sm"
                className="bg-white shadow-sm border-slate-200 hover:bg-slate-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button> */}

              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportAppointments}
                disabled={isExporting}
                className="bg-white shadow-sm border-slate-200 hover:bg-slate-50"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshAllData}
                disabled={isRefreshing}
                className="bg-white shadow-sm border-slate-200 hover:bg-slate-50"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
              
              {!showPastAppointments && (
                <Button 
                  onClick={() => {
                    setSelectedAppointment(null);
                    setShowAppointmentModal(true);
                  }} 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              )}
            </div>
          </div>
          
          {/* Statistics Cards - only show for current appointments */}
          {!showPastAppointments && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white shadow-sm border-0 shadow-slate-100">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">Total Appointments</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm border-0 shadow-slate-100">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">Completed</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm border-0 shadow-slate-100">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">Scheduled</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.scheduled}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm border-0 shadow-slate-100">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">Revenue</p>
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.revenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Weekly Schedule Card */}
          <Card className="bg-white shadow-sm border-0 shadow-slate-100">
            <CardHeader className="border-b border-slate-100">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    {showPastAppointments ? 'Past Appointments' : 'Weekly Schedule'}
                  </CardTitle>
                  <p className="text-slate-600 mt-1">
                    {showPastAppointments ? (
                      `${format(new Date(pastAppointmentsDateRange.startDate), 'MMMM d, yyyy')} - ${format(new Date(pastAppointmentsDateRange.endDate), 'MMMM d, yyyy')}`
                    ) : (
                      weekDays.length > 0 ? 
                        `${format(weekDays[0], 'MMMM d, yyyy')} - ${format(addDays(weekStart, 6), 'MMMM d, yyyy')}` :
                        'No upcoming days to display'
                    )}
                  </p>
                </div>
                
                {!showPastAppointments && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handlePreviousWeek}
                      className="h-9 px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={goToCurrentWeek}
                      className="h-9 px-4"
                    >
                      Today
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleNextWeek}
                      className="h-9 px-3"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {/* Enhanced Search and Filter Controls */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search patients, doctors, or contact numbers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className={showFilters ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                    
                    {(searchQuery.trim() !== '' || doctorFilter !== 'all' || statusFilter !== 'all') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <FilterX className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Collapsible Filters */}
                {showFilters && (
                  <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="min-w-[200px]">
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Doctor</label>
                      <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="All Doctors" />
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
                    
                    <div className="min-w-[150px]">
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="All Status" />
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
                 </div>
               )}
             </div>

             {/* Ongoing and Next Appointment Section */}
              {!showPastAppointments && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Ongoing Appointment */}
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        Current Ongoing Session
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const ongoingAppointment = filteredAppointments.find(isAppointmentOngoing);
                        
                        if (ongoingAppointment) {
                          const sessionAppointments = filteredAppointments.filter(apt => 
                            apt.doctorId === ongoingAppointment.doctorId &&
                            apt.date === ongoingAppointment.date &&
                            apt.startTime === ongoingAppointment.startTime &&
                            apt.endTime === ongoingAppointment.endTime &&
                            apt.status !== 'cancelled'
                          );
                          
                          const arrivedPatients = sessionAppointments.filter(apt => apt.isPatientArrived).length;
                          
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-green-900">{ongoingAppointment.doctorName}</h3>
                                  <p className="text-sm text-green-700">
                                    {doctors.find(d => d.id === ongoingAppointment.doctorId)?.speciality}
                                  </p>
                                </div>
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  Live Session
                                </Badge>
                              </div>
                              
                              <Separator className="bg-green-200" />
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-green-700">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-sm">
                                    {formatTime(ongoingAppointment.startTime)} - {formatTime(ongoingAppointment.endTime)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-green-700">
                                  <Calendar className="h-4 w-4" />
                                  <span className="text-sm">{formatAppointmentDate(ongoingAppointment.date)}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-green-600" />
                                  <div>
                                    <p className="text-sm font-medium text-green-900">
                                      {arrivedPatients} / {sessionAppointments.length} Patients
                                    </p>
                                    <p className="text-xs text-green-700">Present in session</p>
                                  </div>
                                </div>
                                
                                <Button
                                  onClick={() => openSessionModal(ongoingAppointment)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Session
                                </Button>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-center py-8">
                              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                <Clock className="h-6 w-6 text-green-600" />
                              </div>
                              <p className="text-green-800 font-medium">No Ongoing Sessions</p>
                              <p className="text-sm text-green-600 mt-1">
                                No appointments are currently in progress
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </CardContent>
                  </Card>
                  
                  {/* Next Appointment */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                        <CalendarCheck className="h-5 w-5 text-blue-600" />
                        Next Upcoming Session
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const nextAppointment = getNextAppointment(filteredAppointments);
                        
                        if (nextAppointment) {
                          const sessionAppointments = filteredAppointments.filter(apt => 
                            apt.doctorId === nextAppointment.doctorId &&
                            apt.date === nextAppointment.date &&
                            apt.startTime === nextAppointment.startTime &&
                            apt.endTime === nextAppointment.endTime &&
                            apt.status !== 'cancelled'
                          );
                          
                          // Calculate time until appointment
                          const appointmentDateTime = new Date(`${nextAppointment.date}T${nextAppointment.startTime}`);
                          const now = new Date();
                          const timeDiff = appointmentDateTime.getTime() - now.getTime();
                          const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
                          const minutesUntil = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                          
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-blue-900">{nextAppointment.doctorName}</h3>
                                  <p className="text-sm text-blue-700">
                                    {doctors.find(d => d.id === nextAppointment.doctorId)?.speciality}
                                  </p>
                                </div>
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                  {hoursUntil > 0 ? `${hoursUntil}h ${minutesUntil}m` : `${minutesUntil}m`}
                                </Badge>
                              </div>
                              
                              <Separator className="bg-blue-200" />
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-blue-700">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-sm">
                                    {formatTime(nextAppointment.startTime)} - {formatTime(nextAppointment.endTime)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-blue-700">
                                  <Calendar className="h-4 w-4" />
                                  <span className="text-sm">{formatAppointmentDate(nextAppointment.date)}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">
                                      {sessionAppointments.length} Patient{sessionAppointments.length !== 1 ? 's' : ''}
                                    </p>
                                    <p className="text-xs text-blue-700">Scheduled for session</p>
                                  </div>
                                </div>
                                
                                <Button
                                  onClick={() => openSessionModal(nextAppointment)}
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Session
                                </Button>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-center py-8">
                              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                <CalendarCheck className="h-6 w-6 text-blue-600" />
                              </div>
                              <p className="text-blue-800 font-medium">No Upcoming Sessions</p>
                              <p className="text-sm text-blue-600 mt-1">
                                No future appointments scheduled
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}
             
             {/* Session Boxes View */}
             <div className="relative">
               {(loading || loadingDoctors || (showPastAppointments && loadingPastAppointments)) ? (
                 <div className="flex justify-center items-center h-64">
                   <div className="text-center">
                     <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                     <p className="text-slate-600">
                       {showPastAppointments ? 'Loading past appointments...' : 'Loading appointments...'}
                     </p>
                   </div>
                 </div>
               ) : error ? (
                 <div className="flex flex-col items-center justify-center h-64 text-center">
                   <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                   <p className="text-red-500 font-medium mb-2">{error}</p>
                   <Button 
                    variant="outline" 
                    onClick={loadAppointments}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Enhanced Session Cards */}
                  {doctors.map(doctor => {
                    if (!doctor.id) return null;
                    
                    const doctorSessions: {
                      doctorId: string;
                      doctorName: string;
                      date: string;
                      dayOfWeek: string;
                      startTime: string;
                      endTime: string;
                      appointmentCount: number;
                      appointments: Appointment[];
                      formattedDate: string;
                      sessionId?: string;
                      doctorSession?: DoctorSession;
                    }[] = [];
                    
                    const daysToProcess = showPastAppointments ? 
                      // For past appointments, get unique dates from past appointments
                      Array.from(new Set(pastAppointments.map(apt => apt.date)))
                        .map(dateStr => new Date(dateStr))
                        .sort((a, b) => b.getTime() - a.getTime()) : // Sort desc for past
                      weekDays;
                    
                    daysToProcess.forEach(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const formattedDate = format(day, 'EEE, MMM d');
                      
                      const daySessions = sessions[doctor.id!]?.[dateStr] || [];
                      
                      daySessions.forEach(session => {
                        if (session.appointmentCount > 0) {
                          doctorSessions.push({
                            ...session,
                            formattedDate
                          });
                        }
                      });
                    });
                    
                    if (doctorSessions.length === 0) return null;
                    
                    return doctorSessions.map((session, index) => (
                      <Card 
                        key={`${doctor.id}-${session.date}-${session.startTime}`} 
                        className={`group hover:shadow-lg transition-all duration-300 border-slate-300 shadow-sm hover:shadow-slate-200 ${
                          showPastAppointments ? 'bg-amber-50/30' : 'bg-white'
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-md ${
                                  showPastAppointments ? 'bg-amber-100' : 'bg-blue-50'
                                }`}>
                                  <Stethoscope className={`h-3 w-3 ${
                                    showPastAppointments ? 'text-amber-600' : 'text-blue-600'
                                  }`} />
                                </div>
                                <h3 className="font-semibold text-slate-900 truncate">{doctor.name}</h3>
                              </div>
                              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs">
                                {doctor.speciality}
                              </Badge>
                              
                              {/* Doctor Session Status */}
                              {session.doctorSession && (
                                <div className="flex flex-col gap-1">
                                  {session.doctorSession.isArrived && (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        session.doctorSession.isDeparted 
                                          ? 'bg-gray-50 text-gray-600 border-gray-200'
                                          : 'bg-green-50 text-green-600 border-green-200'
                                      }`}
                                    >
                                      {session.doctorSession.isDeparted ? (
                                        <>
                                          <LogOut className="h-3 w-3 mr-1" />
                                          Departed {formatTimestamp(session.doctorSession.departedAt)}
                                        </>
                                      ) : (
                                        <>
                                          <UserCheck className="h-3 w-3 mr-1" />
                                          Arrived {formatTimestamp(session.doctorSession.arrivedAt)}
                                        </>
                                      )}
                                    </Badge>
                                  )}
                                  
                                  {!session.doctorSession.isArrived && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-xs">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Not Arrived
                                    </Badge>
                                  )}
                                  
                                  {/* Session Status Indicator */}
                                  {session.doctorSession.isArrived && !session.doctorSession.isDeparted && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs">
                                      <Activity className="h-3 w-3 mr-1 animate-pulse" />
                                      Session Ongoing
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              {showPastAppointments && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-xs">
                                  <History className="h-3 w-3 mr-1" />
                                  Past Session
                                </Badge>
                              )}
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Export Session</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Date and Time */}
                          <div className="flex items-center justify-between text-sm">
                            <div className={`flex items-center gap-2 ${
                              showPastAppointments ? 'text-amber-600' : 'text-blue-600'
                            }`}>
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">{session.formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          {/* Enhanced Session Status Section */}
                          {session.doctorSession && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">Session Status:</span>
                                <div className="flex items-center gap-2">
                                  {session.doctorSession.isArrived ? (
                                    session.doctorSession.isDeparted ? (
                                      <div className="flex items-center gap-1 text-gray-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-sm font-medium">Completed</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-blue-600">
                                        <Activity className="h-4 w-4 animate-pulse" />
                                        <span className="text-sm font-medium">Ongoing</span>
                                      </div>
                                    )
                                  ) : (
                                    <div className="flex items-center gap-1 text-amber-600">
                                      <Clock className="h-4 w-4" />
                                      <span className="text-sm font-medium">Waiting</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Doctor Fee Status */}
                              {session.doctorSession.totalDoctorFees > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-slate-700">Doctor Fee:</span>
                                  <div className="text-right">
                                    <div className="text-sm font-bold text-slate-900">
                                      {formatCurrency(session.doctorSession.totalDoctorFees)}
                                    </div>
                                    {session.doctorSession.isPaid && (
                                      <div className="text-xs text-green-600 font-medium">Paid</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <Separator />
                          
                          {/* Patient Count */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-lg ${
                                showPastAppointments ? 'bg-amber-50' : 'bg-blue-50'
                              }`}>
                                <Users className={`h-4 w-4 ${
                                  showPastAppointments ? 'text-amber-600' : 'text-blue-600'
                                }`} />
                              </div>
                              <div>
                                <p className="text-lg font-bold text-slate-900">{session.appointmentCount}</p>
                                <p className="text-xs text-slate-600">patient{session.appointmentCount !== 1 ? 's' : ''}</p>
                                {session.doctorSession && session.doctorSession.arrivedPatients > 0 && (
                                  <p className="text-xs text-green-600 font-medium">
                                    {session.doctorSession.arrivedPatients} arrived
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedSession({
                                  doctorName: doctor.name,
                                  doctorSpeciality: doctor.speciality,
                                  date: session.date,
                                  startTime: session.startTime,
                                  endTime: session.endTime,
                                  appointments: session.appointments
                                });
                                setShowSessionDetailsModal(true);
                              }}
                              className={`${
                                showPastAppointments 
                                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              <Eye className="h-3 w-3 mr-2" />
                              View
                            </Button>
                          </div>
                          
                          {/* Patient List Preview - Enhanced with arrival status */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-medium text-slate-700 uppercase tracking-wide">Patients</h4>
                            <div className="space-y-2">
                              {session.appointments.slice(0, 2).map((apt, idx) => (
                                <div 
                                  key={idx}
                                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 bg-white rounded relative">
                                      <User className="h-3 w-3 text-slate-500" />
                                      {apt.isPatientArrived && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                                      )}
                                    </div>
                                    <span className="text-sm font-medium text-slate-900 truncate">
                                      {apt.patientName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {apt.isPatientArrived && (
                                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    )}
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${getStatusColor(apt.status)}`}
                                    >
                                      {getStatusIcon(apt.status)}
                                      <span className="ml-1 capitalize">{apt.status}</span>
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                              {session.appointments.length > 2 && (
                                <div className="text-center py-1">
                                  <span className={`text-xs font-medium ${
                                    showPastAppointments ? 'text-amber-600' : 'text-blue-600'
                                  }`}>
                                    + {session.appointments.length - 2} more patient(s)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ));
                  })}
                  
                  {/* Empty State */}
                  {((showPastAppointments ? pastAppointments : filteredAppointments).length === 0) && !(loading || loadingDoctors || (showPastAppointments && loadingPastAppointments)) && (
                    <div className="col-span-full">
                      <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="p-3 bg-slate-100 rounded-full mb-4">
                            {showPastAppointments ? (
                              <History className="h-8 w-8 text-slate-400" />
                            ) : (
                              <CalendarDays className="h-8 w-8 text-slate-400" />
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {showPastAppointments ? (
                              searchQuery || doctorFilter !== 'all' || statusFilter !== 'all' 
                                ? 'No Matching Past Appointments' 
                                : 'No Past Appointments Found'
                            ) : (
                              searchQuery || doctorFilter !== 'all' || statusFilter !== 'all' 
                                ? 'No Matching Appointments' 
                                : weekDays.length === 0 
                                  ? 'No Upcoming Days' 
                                  : 'No Appointments This Week'
                            )}
                          </h3>
                          <p className="text-slate-600 mb-6 max-w-md">
                            {showPastAppointments ? (
                              searchQuery || doctorFilter !== 'all' || statusFilter !== 'all'
                                ? 'Try adjusting your search criteria or filters to find past appointments.'
                                : 'No past appointments found in the selected date range.'
                            ) : (
                              searchQuery || doctorFilter !== 'all' || statusFilter !== 'all'
                                ? 'Try adjusting your search criteria or filters to find appointments.'
                                : weekDays.length === 0
                                  ? 'All days this week are in the past. Navigate to future weeks to see upcoming appointments.'
                                  : 'There are no appointments scheduled for the upcoming days. Start by booking your first appointment.'
                            )}
                          </p>
                          {(searchQuery || doctorFilter !== 'all' || statusFilter !== 'all') ? (
                            <Button variant="outline" onClick={clearFilters} className="mb-2">
                              <FilterX className="h-4 w-4 mr-2" />
                              Clear Filters
                            </Button>
                          ) : !showPastAppointments && weekDays.length > 0 ? (
                            <Button 
                              onClick={() => {
                                setSelectedAppointment(null);
                                setShowAppointmentModal(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Book First Appointment
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Enhanced Appointments List - only show for current appointments */}
        {!showPastAppointments && (
          <Card className="bg-white shadow-sm border-0 shadow-slate-100">
            <CardHeader className="border-b border-slate-100">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900">Recent Appointments</CardTitle>
                  <p className="text-slate-600 mt-1">Latest appointment bookings and updates</p>
                </div>
                <Button variant="outline" size="sm" className="bg-slate-50 border-slate-200">
                  View All
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium mb-2">No appointments found</p>
                  <p className="text-sm">Appointments matching your criteria will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Doctor
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Procedures
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {filteredAppointments.slice(0, 10).map((appointment, index) => (
                        <tr key={appointment.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{appointment.patientName}</div>
                                <div className="flex items-center text-sm text-slate-600">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {appointment.patientContact}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-2 bg-green-50 rounded-lg mr-3">
                                <Stethoscope className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="text-sm font-medium text-slate-900">{appointment.doctorName}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900 font-medium">{formatAppointmentDate(appointment.date)}</div>
                            <div className="text-sm text-slate-600">
                              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-900">
                              {appointment.procedures && appointment.procedures.length > 0 ? (
                                <div className="space-y-1">
                                  {appointment.procedures.slice(0, 2).map((proc, idx) => (
                                    <div key={idx} className="text-sm font-medium">{proc.procedureName}</div>
                                  ))}
                                  {appointment.procedures.length > 2 && (
                                    <div className="text-xs text-blue-600 font-medium">
                                      +{appointment.procedures.length - 2} more procedures
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No procedures</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-slate-900">
                              {formatCurrency(appointment.totalCharge)}
                            </div>
                            {appointment.payment?.isPaid && (
                              <div className="text-xs text-green-600 font-medium">Paid</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant="outline"
                              className={`inline-flex items-center gap-1 ${getStatusColor(appointment.status)}`}
                            >
                              {getStatusIcon(appointment.status)}
                              <span className="capitalize font-medium">{appointment.status}</span>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setShowAppointmentModal(true);
                                }}
                                className="h-8 w-8 p-0 hover:bg-blue-50"
                                title="Edit appointment"
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-red-50"
                                  title="Delete appointment"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            
            {filteredAppointments.length > 10 && (
              <CardFooter className="border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between w-full">
                  <p className="text-sm text-slate-600">
                    Showing 10 of {filteredAppointments.length} appointments
                  </p>
                  <Button variant="outline" size="sm" className="bg-white">
                    View All {filteredAppointments.length} Appointments
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        )}
      </div>
    </div>
    
    {/* Appointment Modal */}
    {showAppointmentModal && (
      <AppointmentModal
        appointment={selectedAppointment || undefined}
        onClose={() => {
          setShowAppointmentModal(false);
          setSelectedAppointment(null);
        }}
        onSuccess={() => {
          setShowAppointmentModal(false);
          setSelectedAppointment(null);
          toast.success(selectedAppointment ? "Appointment updated successfully" : "Appointment booked successfully");
          loadAppointments();
        }}
      />
    )}
    
    {/* Session Details Modal */}
    {showSessionDetailsModal && selectedSession && (
      <SessionDetailsModal
        doctorName={selectedSession.doctorName}
        doctorSpeciality={selectedSession.doctorSpeciality}
        date={selectedSession.date}
        startTime={selectedSession.startTime}
        endTime={selectedSession.endTime}
        appointments={selectedSession.appointments}
        onClose={() => {
          setShowSessionDetailsModal(false);
          setSelectedSession(null);
        }}
        onEditAppointment={(appointment) => {
          setSelectedAppointment(appointment);
          setShowSessionDetailsModal(false);
          setShowAppointmentModal(true);
        }}
        onAppointmentUpdated={() => {
          if (showPastAppointments) {
            loadPastAppointments();
          } else {
            loadAppointments();
          }
          loadDoctorSessions(); // Reload sessions when appointments are updated
        }}
      />
    )}
    
    {/* Enhanced Delete Confirmation Dialog */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent className="bg-white border-0 shadow-xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-slate-900">
                Cancel Appointment?
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-slate-600 mt-4">
            This will cancel the appointment for{' '}
            {selectedAppointment && (
              <span className="font-semibold text-slate-900">{selectedAppointment.patientName}</span>
            )}{' '}
            on{' '}
            {selectedAppointment && (
              <span className="font-semibold text-slate-900">
                {formatAppointmentDate(selectedAppointment.date)} at {formatTime(selectedAppointment.startTime)}
              </span>
            )}.
            <br /><br />
            <span className="text-sm bg-amber-50 text-amber-800 p-2 rounded-md inline-block">
              Would you like to permanently delete this appointment instead?
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="bg-white border-slate-200 hover:bg-slate-50">
            Cancel
          </AlertDialogCancel>
          <Button
            variant="outline"
            onClick={async () => {
              if (selectedAppointment?.id) {
                try {
                  await appointmentService.updateAppointmentStatus(selectedAppointment.id, 'cancelled');
                  setShowDeleteDialog(false);
                  setSelectedAppointment(null);
                  toast.success('Appointment cancelled successfully');
                  loadAppointments();
                } catch (error: any) {
                  console.error('Error cancelling appointment:', error);
                  toast.error(error.message || 'Failed to cancel appointment');
                }
              }
            }}
            className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
          >
            Cancel Appointment
          </Button>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              if (selectedAppointment?.id) {
                handleDeleteAppointment(selectedAppointment.id);
              }
            }}
          >
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>



            {/* Export Date Range Modal */}
          <Dialog open={showExportDateModal} onOpenChange={setShowExportDateModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export Appointments</DialogTitle>
                <DialogDescription>
                  Select the date range for exporting appointments
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={exportDateRange.startDate}
                      onChange={(e) => setExportDateRange(prev => ({
                        ...prev,
                        startDate: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={exportDateRange.endDate}
                      onChange={(e) => setExportDateRange(prev => ({
                        ...prev,
                        endDate: e.target.value
                      }))}
                    />
                  </div>
                </div>
                
                {exportDateRange.startDate && exportDateRange.endDate && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Exporting appointments from{' '}
                      <span className="font-medium">{format(new Date(exportDateRange.startDate), 'MMM dd, yyyy')}</span>
                      {' '}to{' '}
                      <span className="font-medium">{format(new Date(exportDateRange.endDate), 'MMM dd, yyyy')}</span>
                    </p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExportDateModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleExportWithDateRange}
                  disabled={!exportDateRange.startDate || !exportDateRange.endDate || isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>


  </DashboardLayout>
);
}

export default withAuth(AppointmentsPage);