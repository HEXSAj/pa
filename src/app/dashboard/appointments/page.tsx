// src/app/dashboard/appointments/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Appointment, DoctorSession } from '@/types/appointment';
import { Doctor, DoctorSchedule } from '@/types/doctor';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { doctorSessionService } from '@/services/doctorSessionService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Plus, 
  CalendarDays, 
  Clock, 
  Users,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Phone,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Stethoscope,
  Activity,
  BarChart3,
  CalendarCheck,
  UserCheck,
  Timer,
  Sparkles,
  X
} from 'lucide-react';
import { format, addDays, subDays, isToday, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import withAuth from '@/components/withAuth';

import AppointmentModal from './AppointmentModal';
import SessionDetailsModal from './SessionDetailsModal';

function AppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<{[doctorId: string]: any[]}>({});
  const [doctorSessions, setDoctorSessions] = useState<{[sessionId: string]: any}>({});
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [currentSessionForAppointment, setCurrentSessionForAppointment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');

  // Calculate week days for display (only today and future days)
  const weekDays = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      // Only include today and future days
      if (day >= today) {
        days.push(day);
      }
    }
    return days;
  }, [weekStart]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Load appointments when week changes
  useEffect(() => {
    loadAppointments();
    loadDoctorSessions();
  }, [weekDays]);

  const loadData = async () => {
    setLoading(true);
    try {
      await loadDoctors();
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const doctorsData = await doctorService.getAllDoctors();
      const activeDoctors = doctorsData.filter(doctor => doctor.isActive);
      setDoctors(activeDoctors);
      
      // Load schedules for each doctor
      const doctorSchedules: {[doctorId: string]: DoctorSchedule[]} = {};
      for (const doctor of activeDoctors) {
        if (doctor.id) {
          const schedules = await doctorService.getSchedulesByDoctorId(doctor.id);
          doctorSchedules[doctor.id] = schedules.filter(s => s.isActive);
        }
      }
      setSchedules(doctorSchedules);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive"
      });
    }
  };

  const loadAppointments = async () => {
    try {
      if (weekDays.length === 0) {
        setAppointments([]);
        return;
      }
      
      const startDate = format(weekDays[0], 'yyyy-MM-dd');
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      
      const appointmentsData = await appointmentService.getAppointmentsByDateRange(startDate, endDate);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive"
      });
    }
  };

  const loadDoctorSessions = async () => {
    try {
      const daysToCheck = weekDays.map(day => format(day, 'yyyy-MM-dd'));
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadAppointments(),
        loadDoctorSessions()
      ]);
      toast({
        title: "Success",
        description: "Appointments refreshed",
        variant: "default"
      });
    } catch (error) {
      console.error('Error refreshing appointments:', error);
      toast({
        title: "Error",
        description: "Failed to refresh appointments",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateAppointment = () => {
    // Check if there are any available doctor schedules
    const hasSchedules = Object.values(schedules).some(doctorSchedules => 
      doctorSchedules.some(schedule => schedule.timeSlots.length > 0)
    );
    
    if (!hasSchedules) {
      toast({
        title: "No Doctor Schedules Available",
        description: "No doctor schedules available. Please create doctor schedules first.",
        variant: "destructive"
      });
      return;
    }
    
    // Find the first available time slot from any doctor's schedule
    let firstAvailableSession = null;
    for (const doctor of doctors) {
      if (!doctor.id) continue;
      
      const doctorSchedules = schedules[doctor.id] || [];
      for (const schedule of doctorSchedules) {
        if (schedule.timeSlots.length > 0) {
          const firstTimeSlot = schedule.timeSlots[0];
          
          // Find the next available date for this schedule
          for (const date of weekDays) {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayOfWeek = getDayOfWeekFromDate(date);
            
            if (schedule.dayOfWeek === dayOfWeek) {
              const sessionId = `${doctor.id}_${dateStr}_${firstTimeSlot.startTime}_${firstTimeSlot.endTime}`;
              
              firstAvailableSession = {
                doctorId: doctor.id,
                doctorName: doctor.name,
                date: dateStr,
                dayOfWeek,
                startTime: firstTimeSlot.startTime,
                endTime: firstTimeSlot.endTime,
                appointmentCount: 0,
                appointments: [],
                sessionId: sessionId,
                doctorSession: null
              };
              break;
            }
          }
          if (firstAvailableSession) break;
        }
      }
      if (firstAvailableSession) break;
    }
    
    if (firstAvailableSession) {
      // Open the modal with the first available session
      setEditingAppointment(null);
      setCurrentSessionForAppointment(firstAvailableSession);
      setShowModal(true);
    } else {
      toast({
        title: "No Available Time Slots",
        description: "No available time slots found for the current week. Please check doctor schedules.",
        variant: "destructive"
      });
    }
  };

  const handleCreateAppointmentForSession = (session: any) => {
    setEditingAppointment(null);
    setCurrentSessionForAppointment(session);
    setShowModal(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowModal(true);
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      await appointmentService.deleteAppointment(appointmentId);
      await loadAppointments();
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Error",
        description: "Failed to delete appointment",
        variant: "destructive"
      });
    }
  };

  const handleUpdateAppointment = async (appointmentId: string, updates: Partial<Appointment>) => {
    try {
      await appointmentService.updateAppointment(appointmentId, updates);
      await loadAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  };

  const handleModalSuccess = () => {
    loadAppointments();
    setShowModal(false);
    setEditingAppointment(null);
    setCurrentSessionForAppointment(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingAppointment(null);
    setCurrentSessionForAppointment(null);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekStart(prevWeek => 
      direction === 'next' 
        ? addDays(prevWeek, 7)
        : subDays(prevWeek, 7)
    );
  };

  const goToCurrentWeek = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Helper to get the day index from date-fns to our day format
  const getDayOfWeekFromDate = (date: Date): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  // Get sessions by doctor and day - based on actual appointments
  const getSessionsByDoctorAndDay = () => {
    const sessionsMap: Record<string, Record<string, any[]>> = {};
    
    console.log('getSessionsByDoctorAndDay - doctors:', doctors.length);
    console.log('getSessionsByDoctorAndDay - appointments:', appointments.length);
    console.log('getSessionsByDoctorAndDay - weekDays:', weekDays.length);
    console.log('All appointments:', appointments);
    
    // First, let's group appointments by doctor and date
    const appointmentsByDoctorAndDate: Record<string, Record<string, any[]>> = {};
    
    appointments.forEach(appointment => {
      if (appointment.status === 'cancelled') return;
      
      // Apply filters to appointments
      const matchesSearch = searchQuery === '' || 
        appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.patientContact.includes(searchQuery);
      
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
      const matchesDoctor = doctorFilter === 'all' || appointment.doctorId === doctorFilter;
      
      if (!matchesSearch || !matchesStatus || !matchesDoctor) return;
      
      // Check if appointment is in current week
      const appointmentDate = new Date(appointment.date);
      const isInCurrentWeek = weekDays.some(day => 
        format(day, 'yyyy-MM-dd') === appointment.date
      );
      
      if (!isInCurrentWeek) return;
      
      if (!appointmentsByDoctorAndDate[appointment.doctorId]) {
        appointmentsByDoctorAndDate[appointment.doctorId] = {};
      }
      
      if (!appointmentsByDoctorAndDate[appointment.doctorId][appointment.date]) {
        appointmentsByDoctorAndDate[appointment.doctorId][appointment.date] = [];
      }
      
      appointmentsByDoctorAndDate[appointment.doctorId][appointment.date].push(appointment);
    });
    
    console.log('Appointments grouped by doctor and date:', appointmentsByDoctorAndDate);
    
    // Now create sessions based on actual appointments
    Object.keys(appointmentsByDoctorAndDate).forEach(doctorId => {
      const doctor = doctors.find(d => d.id === doctorId);
      if (!doctor) return;
      
      sessionsMap[doctorId] = {};
      
      Object.keys(appointmentsByDoctorAndDate[doctorId]).forEach(dateStr => {
        const dayAppointments = appointmentsByDoctorAndDate[doctorId][dateStr];
        
        // Group appointments by sessionId or create a default session
        const sessionGroups: Record<string, any[]> = {};
        
        dayAppointments.forEach(appointment => {
          const sessionKey = appointment.sessionId || `default_${doctorId}_${dateStr}`;
          
          if (!sessionGroups[sessionKey]) {
            sessionGroups[sessionKey] = [];
          }
          
          sessionGroups[sessionKey].push(appointment);
        });
        
        sessionsMap[doctorId][dateStr] = [];
        
        Object.keys(sessionGroups).forEach(sessionKey => {
          const sessionAppointments = sessionGroups[sessionKey];
          
          // Try to get session details from appointment or doctor schedule
          let sessionStartTime = '09:00';
          let sessionEndTime = '17:00';
          let sessionId = sessionKey;
          
          if (sessionAppointments.length > 0) {
            const firstAppointment = sessionAppointments[0];
            
            // Try to extract time from sessionId if it exists
            if (firstAppointment.sessionId && firstAppointment.sessionId.includes('_')) {
              const sessionParts = firstAppointment.sessionId.split('_');
              if (sessionParts.length >= 4) {
                const extractedStartTime = sessionParts[sessionParts.length - 2];
                const extractedEndTime = sessionParts[sessionParts.length - 1];
                
                // Only use extracted times if they are valid (not undefined and contain ':')
                if (extractedStartTime && extractedStartTime.includes(':') && extractedEndTime && extractedEndTime.includes(':')) {
                  sessionStartTime = extractedStartTime;
                  sessionEndTime = extractedEndTime;
                }
              }
            }
          }
          
          const sessionData = {
            doctorId: doctorId,
            doctorName: doctor.name,
            date: dateStr,
            dayOfWeek: getDayOfWeekFromDate(new Date(dateStr)),
            startTime: sessionStartTime,
            endTime: sessionEndTime,
            appointmentCount: sessionAppointments.length,
            appointments: sessionAppointments,
            sessionId: sessionId,
            doctorSession: doctorSessions[sessionId]
          };
          
          console.log(`Adding session for ${doctor.name} on ${dateStr} with ${sessionAppointments.length} appointments`);
          sessionsMap[doctorId][dateStr].push(sessionData);
        });
      });
    });
    
    console.log('Final sessions map:', sessionsMap);
    return sessionsMap;
  };

  // Filter appointments based on search, status, and doctor filters
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = searchQuery === '' || 
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patientContact.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesDoctor = doctorFilter === 'all' || apt.doctorId === doctorFilter;
    
    return matchesSearch && matchesStatus && matchesDoctor;
  });

  // Get appointment statistics
  const stats = {
    total: filteredAppointments.length,
    scheduled: filteredAppointments.filter(apt => apt.status === 'scheduled').length,
    completed: filteredAppointments.filter(apt => apt.status === 'completed').length,
    cancelled: filteredAppointments.filter(apt => apt.status === 'cancelled').length,
    noShow: filteredAppointments.filter(apt => apt.status === 'no-show').length
  };

  // Calculate revenue for the week
  const totalRevenue = filteredAppointments
    .filter(apt => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.totalCharge, 0);

  // Helper functions
  const formatTime = (time: string): string => {
    if (!time || time === 'undefined' || time.includes('undefined')) {
      return 'N/A';
    }
    
    try {
      const [hour, minute] = time.split(':');
      const hourNum = parseInt(hour);
      const minuteNum = parseInt(minute);
      
      // Validate that we have valid numbers
      if (isNaN(hourNum) || isNaN(minuteNum)) {
        return 'N/A';
      }
      
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const hour12 = hourNum % 12 || 12;
      const formattedMinute = minuteNum.toString().padStart(2, '0');
      return `${hour12}:${formattedMinute} ${ampm}`;
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'no-show': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const openSessionModal = (session: any) => {
    setSelectedSession(session);
    setShowSessionModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading appointments...</span>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="space-y-8 p-6">
          {/* Modern Header with Glass Effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                        Appointments
                      </h1>
                      <p className="text-slate-600 text-lg">
                        Manage patient schedules with precision and care
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Live Updates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span>{filteredAppointments.length} Total Appointments</span>
                    </div>
                  </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
                    size="lg"
              onClick={handleRefresh}
              disabled={refreshing}
                    className="hidden sm:flex bg-white/50 border-slate-200 hover:bg-white/80 transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={handleCreateAppointment} 
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
            >
                    <Sparkles className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
                </div>
              </div>
          </div>
        </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    placeholder="Search by patient name, phone, or appointment details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-white/80 border-slate-200 focus:border-blue-300 focus:ring-blue-200 rounded-xl text-base"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] h-12 bg-white/80 border-slate-200 focus:border-blue-300 rounded-xl pl-10">
                    <SelectValue placeholder="Status" />
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
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                    <SelectTrigger className="w-[180px] h-12 bg-white/80 border-slate-200 focus:border-blue-300 rounded-xl pl-10">
                    <SelectValue placeholder="Doctor" />
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
            </div>
            </div>
          </div>

          {/* Modern Weekly Navigation */}
          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                    size="lg"
                  onClick={() => navigateWeek('prev')}
                    className="h-12 w-12 p-0 bg-white/80 border-slate-200 hover:bg-white hover:border-blue-300 rounded-xl transition-all duration-200"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigateWeek('next')}
                    className="h-12 w-12 p-0 bg-white/80 border-slate-200 hover:bg-white hover:border-blue-300 rounded-xl transition-all duration-200"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {weekDays.length > 0 ? 
                      `${format(weekDays[0], 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}` :
                      'No upcoming days'
                    }
                  </h3>
                  {weekDays.some(day => isToday(day)) && (
                    <Badge className="mt-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1 text-sm font-medium">
                      <CalendarCheck className="h-3 w-3 mr-1" />
                      This Week
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={goToCurrentWeek}
                  className="hidden sm:flex bg-white/80 border-slate-200 hover:bg-white hover:border-blue-300 rounded-xl transition-all duration-200"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Go to Current Week
                </Button>
                <div className="text-right bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <div className="text-sm text-slate-600 font-medium">Showing</div>
                  <div className="text-2xl font-bold text-slate-900">{filteredAppointments.length}</div>
                  <div className="text-sm text-slate-500">appointments</div>
                </div>
              </div>
            </div>
          </div>

          {/* Simple Statistics Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Scheduled</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">Rs. {totalRevenue.toFixed(0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Simple Session-based View */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 p-4 rounded-t-xl border-b border-gray-100">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Weekly Sessions</h2>
              </div>
            </div>
            <div className="p-4">
            {(() => {
              const sessions = getSessionsByDoctorAndDay();
              const hasAnySessions = Object.values(sessions).some(doctorSessions => 
                Object.values(doctorSessions).some(daySessions => daySessions.length > 0)
              );
              
              // Debug logging
              console.log('Sessions data:', sessions);
              console.log('Has any sessions:', hasAnySessions);
              console.log('Appointments count:', appointments.length);
              console.log('Doctors count:', doctors.length);
              console.log('Week days:', weekDays.length);
              
              return !hasAnySessions ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-8 shadow-lg">
                    <Calendar className="h-16 w-16 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">No appointments found</h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto text-lg">
                    {searchQuery || statusFilter !== 'all' || doctorFilter !== 'all'
                      ? 'Try adjusting your search criteria or filters to find appointments.'
                      : 'There are no appointments scheduled for this week'
                    }
                  </p>
                  <Button 
                    onClick={handleCreateAppointment} 
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Create New Appointment
                  </Button>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(() => {
                  const sessions = getSessionsByDoctorAndDay();
                  const sessionCards: any[] = [];
                  
                  doctors.forEach(doctor => {
                    if (!doctor.id) return;
                    
                    const doctorSessions: any[] = [];
                    
                    weekDays.forEach(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const daySessions = sessions[doctor.id!]?.[dateStr] || [];
                      
                      daySessions.forEach(session => {
                        // Only show sessions that have appointments (filtered in getSessionsByDoctorAndDay)
                        doctorSessions.push({
                          ...session,
                          formattedDate: format(day, 'EEE, MMM d')
                        });
                      });
                    });
                    
                    doctorSessions.forEach((session, index) => (
                      sessionCards.push(
                        <div 
                          key={`${doctor.id}-${session.date}-${session.startTime}`} 
                          className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100"
                        >
                          {/* Simple Header */}
                          <div className="bg-gray-50 p-4 rounded-t-xl border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                  <Stethoscope className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 text-lg">{doctor.name}</h3>
                                  <p className="text-gray-500 text-sm">{doctor.speciality}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-gray-900 font-medium">{session.formattedDate}</div>
                                <div className="text-gray-500 text-sm">
                                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 pb-6">
                            {/* Simple Patient Count */}
                            <div className="text-center mb-4">
                              <div className="inline-flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <Users className="h-6 w-6 text-gray-600" />
                                <div>
                                  <p className="text-3xl font-bold text-gray-900">
                                    {session.appointmentCount}
                                  </p>
                                  <p className="text-gray-500 text-sm">
                                    Patient{session.appointmentCount !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Simple Statistics - Only 2 key metrics */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="p-3 bg-gray-50 rounded-lg text-center">
                                <p className="text-xl font-bold text-gray-900">
                                  {session.appointments.filter((apt: any) => apt.isPatientArrived).length}
                                </p>
                                <p className="text-gray-500 text-xs">Arrived</p>
                              </div>
                              <div className="p-3 bg-gray-50 rounded-lg text-center">
                                <p className="text-xl font-bold text-gray-900">
                                  Rs. {session.appointments.reduce((sum: number, apt: any) => sum + (apt.totalCharge || 0), 0)}
                                </p>
                                <p className="text-gray-500 text-xs">Revenue</p>
                              </div>
                            </div>
                            
                            {/* Professional Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 mt-4">
                              <Button
                                variant="outline" 
                                size="sm"
                                onClick={() => openSessionModal(session)}
                                className="flex-1 bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md py-2"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleCreateAppointmentForSession(session)}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 py-2"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    ));
                  });
                  
                  return sessionCards.length > 0 ? sessionCards : (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                        <Calendar className="h-12 w-12 text-blue-500" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">No Appointments Found</h3>
                      <p className="text-slate-600 mb-6 max-w-md">
                        There are no appointments scheduled for the selected week.
                      </p>
                      <Button 
                        onClick={handleCreateAppointment} 
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Create First Appointment
                      </Button>
                    </div>
                  );
                })()}
              </div>
              );
            })()}
            </div>
          </div>

        {/* Appointment Modal */}
        {showModal && (
          <AppointmentModal
            appointment={editingAppointment || undefined}
            onClose={handleModalClose}
            onSuccess={handleModalSuccess}
            sessionId={currentSessionForAppointment?.sessionId}
            doctorId={currentSessionForAppointment?.doctorId}
            date={currentSessionForAppointment?.date}
          />
        )}
        
        

        {/* Session Details Modal */}
        {showSessionModal && selectedSession && (
          <SessionDetailsModal
            doctorName={selectedSession.doctorName}
            doctorSpeciality={doctors.find(d => d.id === selectedSession.doctorId)?.speciality || ''}
            date={selectedSession.date}
            startTime={selectedSession.startTime}
            endTime={selectedSession.endTime}
            appointments={selectedSession.appointments}
            onClose={() => {
              setShowSessionModal(false);
              setSelectedSession(null);
            }}
            onEditAppointment={(appointment) => {
              setEditingAppointment(appointment);
              setShowSessionModal(false);
              setShowModal(true);
            }}
            onAppointmentUpdated={() => {
              loadAppointments();
              loadDoctorSessions();
            }}
          />
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}


export default withAuth(AppointmentsPage);
