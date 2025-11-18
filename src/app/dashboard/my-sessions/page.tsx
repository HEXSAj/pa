//src/app/dashboard/my-sessions/page.tsx


'use client';

import { useState, useEffect, useMemo,useCallback, useRef } from 'react';
import { format, startOfWeek, endOfWeek, addDays, isBefore, isToday,startOfDay  } from 'date-fns';

import { Appointment, DoctorSession } from '@/types/appointment';
import { Doctor, DoctorSchedule } from '@/types/doctor';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { doctorSessionService } from '@/services/doctorSessionService';
import { staffService } from '@/services/staffService';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Users,
  ChevronLeft,
  ChevronRight,
  Home,
  Stethoscope,
  FileText,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from "sonner";
import SessionDetailsModal from '../appointments/SessionDetailsModal';

import { prescriptionService } from '@/services/prescriptionService';
import AddPrescriptionModal from './AddPrescriptionModal';
import { Prescription } from '@/types/prescription';

import AppointmentModal from '../appointments/AppointmentModal';


interface SessionData {
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
}

export default function MySessionsPage() {
  const { user, userRole } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [doctorSessions, setDoctorSessions] = useState<{[sessionId: string]: DoctorSession}>({});
  const [schedules, setSchedules] = useState<{[doctorId: string]: DoctorSchedule[]}>({});
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showPastAppointments, setShowPastAppointments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  
  // Session modal state
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<{
    doctorName: string;
    doctorSpeciality: string;
    date: string;
    startTime: string;
    endTime: string;
    appointments: Appointment[];
  } | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  //added for edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const [appointmentListeners, setAppointmentListeners] = useState<(() => void)[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [pastLoading, setPastLoading] = useState(false);
  const [pastError, setPastError] = useState<string | null>(null);
  const [pastAppointmentsDateRange, setPastAppointmentsDateRange] = useState({
    start: addDays(new Date(), -30), // Default to last 30 days
    end: new Date()
  });

  // Prescription state
  const [appointmentPrescriptions, setAppointmentPrescriptions] = useState<{[appointmentId: string]: Prescription}>({});
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);

  // Get current doctor ID from staff record
  useEffect(() => {
    const getCurrentDoctorId = async () => {
      if (!user?.uid || (userRole !== 'doctor' && userRole !== 'admin')) {
        setLoading(false);
        return;
      }

      try {
        console.log('=== GETTING DOCTOR ID ===');
        console.log('User UID:', user.uid);
        console.log('User Role:', userRole);
        
        const staffUser = await staffService.getStaffById(user.uid);
        console.log('Staff User:', staffUser);
        
        // For admins, we don't need a specific doctor ID - they can see all doctors
        if (userRole === 'admin') {
          console.log('Admin user - can access all doctor sessions');
          setCurrentDoctorId('admin'); // Special identifier for admin
          setCurrentDoctor(null); // No specific doctor for admin
          setLoading(false);
          return;
        }
        
        if (staffUser?.doctorId) {
          console.log('Found Doctor ID:', staffUser.doctorId);
          setCurrentDoctorId(staffUser.doctorId);
          
          // Get doctor details
          const doctor = await doctorService.getDoctorById(staffUser.doctorId);
          console.log('Doctor Details:', doctor);
          setCurrentDoctor(doctor);
          
          // TEMPORARY: Let's also check what appointments exist for this doctor
          console.log('=== CHECKING ALL APPOINTMENTS FOR THIS DOCTOR ===');
          const allAppointments = await appointmentService.getAllAppointments();
          const doctorAppointments = allAppointments.filter(apt => apt.doctorId === staffUser.doctorId);
          console.log(`Found ${doctorAppointments.length} appointments for doctor ${staffUser.doctorId}:`);
          doctorAppointments.forEach((apt, index) => {
            console.log(`  ${index + 1}. ${apt.patientName} - ${apt.date} (Status: ${apt.status})`);
          });
          
        } else {
          console.log('No doctor ID found in staff user');
          console.log('Available fields in staff user:', Object.keys(staffUser || {}));
          toast.error('No doctor profile found for your account');
        }
      } catch (error) {
        console.error('Error getting doctor ID:', error);
        toast.error('Failed to load doctor information');
      } finally {
        setLoading(false);
      }
    };

    getCurrentDoctorId();
  }, [user, userRole]);

  // Load appointments for current doctor only
  useEffect(() => {
    if (currentDoctorId) {
      loadAppointments();
      loadPastAppointments();
      loadDoctorSchedules();
      loadDoctorSessions();
    }
  }, [currentDoctorId, weekStart]);

  // Load prescriptions when appointments change
  useEffect(() => {
    if (appointments.length > 0) {
      loadPrescriptions();
    }
  }, [appointments]);

  const loadPrescriptions = async () => {
    setPrescriptionsLoading(true);
    try {
      const prescriptions: {[appointmentId: string]: Prescription} = {};
      
      for (const appointment of appointments) {
        if (appointment.id) {
          const prescription = await prescriptionService.getPrescriptionByAppointmentId(appointment.id);
          if (prescription) {
            prescriptions[appointment.id] = prescription;
          }
        }
      }
      
      setAppointmentPrescriptions(prescriptions);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup all listeners on component unmount
      appointmentListeners.forEach(unsubscribe => unsubscribe());
    };
  }, [appointmentListeners]);




  // const loadAppointments = async () => {
  //   if (!currentDoctorId) return;
    
  //   try {
  //     const allAppointments = await appointmentService.getAllAppointments();
      
  //     // Filter appointments for current doctor only
  //     const doctorAppointments = allAppointments.filter(appointment => 
  //       appointment.doctorId === currentDoctorId &&
  //       appointment.status !== 'cancelled'
  //     );
      
  //     // Filter for current/future appointments
  //     const currentAppointments = doctorAppointments.filter(appointment => {
  //       const appointmentDate = new Date(appointment.date);
  //       const today = new Date();
  //       today.setHours(0, 0, 0, 0);
  //       return appointmentDate >= today;
  //     });
      
  //     setAppointments(currentAppointments);
  //   } catch (error) {
  //     console.error('Error loading appointments:', error);
  //     toast.error("Failed to load appointments");
  //   }
  // };


  // const loadAppointments = useCallback(async () => {
  //   setLoading(true);
  //   try {
  //     // Clean up existing listeners
  //     appointmentListeners.forEach(unsubscribe => unsubscribe());
  //     setAppointmentListeners([]);
      
  //     if (weekDays.length === 0) {
  //       setAppointments([]);
  //       setError(null);
  //       setLoading(false);
  //       return;
  //     }
      
  //     const startDate = format(weekDays[0], 'yyyy-MM-dd');
  //     const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      
  //     console.log('=== SETTING UP REAL-TIME APPOINTMENTS LISTENER ===');
  //     console.log('Date range:', startDate, 'to', endDate);
      
  //     // Set up real-time listener
  //     const unsubscribe = appointmentService.subscribeToAppointmentsByDateRange(
  //       startDate,
  //       endDate,
  //       (data) => {
  //         console.log('=== REAL-TIME APPOINTMENTS UPDATE ===');
  //         console.log('Received appointments count:', data.length);
          
  //         // Filter to only show today and future appointments
  //         const today = startOfDay(new Date());
  //         const currentAndFutureAppointments = data.filter(appointment => {
  //           const appointmentDate = startOfDay(new Date(appointment.date));
  //           return !isBefore(appointmentDate, today);
  //         });
          
  //         console.log('Filtered appointments count:', currentAndFutureAppointments.length);
  //         setAppointments(currentAndFutureAppointments);
  //         setError(null);
  //         setLoading(false);
  //       }
  //     );
      
  //     // Store the unsubscribe function
  //     setAppointmentListeners([unsubscribe]);
      
  //   } catch (error) {
  //     console.error('Error setting up real-time appointments listener:', error);
  //     setError('Failed to load appointments. Please try again.');
  //     setLoading(false);
  //   }
  // }, [weekDays, weekStart]);

  const loadAppointments = useCallback(async () => {
    if (!currentDoctorId) return;
    
    setLoading(true);
    try {
      // Clean up existing listeners
      appointmentListeners.forEach(unsubscribe => unsubscribe());
      setAppointmentListeners([]);
      
      if (weekDays.length === 0) {
        setAppointments([]);
        setError(null);
        setLoading(false);
        return;
      }
      
      // Expand date range to include more days for debugging
      const startDate = format(addDays(weekStart, -7), 'yyyy-MM-dd'); // Start 7 days before
      const endDate = format(addDays(weekStart, 14), 'yyyy-MM-dd'); // End 14 days after
      
      console.log('=== SETTING UP REAL-TIME APPOINTMENTS LISTENER ===');
      console.log('Week Start:', weekStart);
      console.log('Week Days:', weekDays.map(d => format(d, 'yyyy-MM-dd')));
      console.log('Date range:', startDate, 'to', endDate);
      console.log('Current Doctor ID:', currentDoctorId);
      console.log('User Role:', userRole);
      
      // Set up real-time listener
      const unsubscribe = appointmentService.subscribeToAppointmentsByDateRange(
        startDate,
        endDate,
        (data) => {
          console.log('=== REAL-TIME APPOINTMENTS UPDATE ===');
          console.log('Received appointments count:', data.length);
          console.log('Current Doctor ID:', currentDoctorId);
          console.log('Date range:', startDate, 'to', endDate);
          
          // Log all appointments for debugging
          data.forEach((apt, index) => {
            console.log(`Appointment ${index + 1}:`, {
              id: apt.id,
              patientName: apt.patientName,
              doctorId: apt.doctorId,
              doctorName: apt.doctorName,
              date: apt.date,
              status: apt.status
            });
          });
          
          // Filter appointments based on user role
          const today = startOfDay(new Date());
          let filteredAppointments;
          
          if (userRole === 'admin') {
            // Admin can see all doctor appointments
            filteredAppointments = data.filter(appointment => {
              const appointmentDate = startOfDay(new Date(appointment.date));
              const isTodayOrFuture = true; // !isBefore(appointmentDate, today);
              const isNotCancelled = appointment.status !== 'cancelled';
              
              console.log(`Admin view - Appointment ${appointment.patientName}:`, {
                doctorId: appointment.doctorId,
                doctorName: appointment.doctorName,
                appointmentDate: appointment.date,
                today: today.toISOString().split('T')[0],
                isTodayOrFuture,
                status: appointment.status,
                isNotCancelled,
                willInclude: isTodayOrFuture && isNotCancelled
              });
              
              return isTodayOrFuture && isNotCancelled;
            });
          } else {
            // Doctor can only see their own appointments
            filteredAppointments = data.filter(appointment => {
              const appointmentDate = startOfDay(new Date(appointment.date));
              const isCurrentDoctor = appointment.doctorId === currentDoctorId;
              const isTodayOrFuture = true; // !isBefore(appointmentDate, today);
              const isNotCancelled = appointment.status !== 'cancelled';
              
              console.log(`Doctor view - Appointment ${appointment.patientName}:`, {
                doctorId: appointment.doctorId,
                currentDoctorId,
                isCurrentDoctor,
                appointmentDate: appointment.date,
                today: today.toISOString().split('T')[0],
                isTodayOrFuture,
                status: appointment.status,
                isNotCancelled,
                willInclude: isCurrentDoctor && isTodayOrFuture && isNotCancelled
              });
              
              return isCurrentDoctor && isTodayOrFuture && isNotCancelled;
            });
          }
          
          console.log('Filtered appointments count:', filteredAppointments.length);
          setAppointments(filteredAppointments);
          setError(null);
          setLoading(false);
        }
      );
      
      // Store the unsubscribe function
      setAppointmentListeners([unsubscribe]);
      
    } catch (error) {
      console.error('Error setting up real-time appointments listener:', error);
      setError('Failed to load appointments. Please try again.');
      setLoading(false);
    }
  }, [weekDays, weekStart, currentDoctorId, userRole]);
  

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowEditModal(true);
    setSelectedSession(null); // Close session modal
  };
  
  // Add this function for handling appointment updates
  const handleAppointmentUpdated = async () => {
    setShowEditModal(false);
    setEditingAppointment(null);
    // Refresh appointments data
    await loadAppointments();
    toast.success('Appointment updated successfully');
  };

  const isDateToday = (dateString: string): boolean => {
    const today = new Date();
    const checkDate = new Date(dateString);
    return today.toDateString() === checkDate.toDateString();
  };

  // const loadPastAppointments = async () => {
  //   if (!currentDoctorId) return;
    
  //   try {
  //     const allAppointments = await appointmentService.getAllAppointments();
      
  //     // Filter past appointments for current doctor only
  //     const doctorPastAppointments = allAppointments.filter(appointment => {
  //       const appointmentDate = new Date(appointment.date);
  //       const today = new Date();
  //       today.setHours(0, 0, 0, 0);
  //       return appointment.doctorId === currentDoctorId && 
  //              appointmentDate < today &&
  //              appointment.status !== 'cancelled';
  //     });
      
  //     setPastAppointments(doctorPastAppointments);
  //   } catch (error) {
  //     console.error('Error loading past appointments:', error);
  //   }
  // };


  // const loadPastAppointments = useCallback(async () => {
  //   setPastLoading(true);
  //   try {
  //     // Clean up existing past appointment listeners
  //     appointmentListeners.forEach(unsubscribe => unsubscribe());
      
  //     const startDate = format(pastAppointmentsDateRange.start, 'yyyy-MM-dd');
  //     const endDate = format(pastAppointmentsDateRange.end, 'yyyy-MM-dd');
      
  //     console.log('=== SETTING UP REAL-TIME PAST APPOINTMENTS LISTENER ===');
      
  //     const unsubscribe = appointmentService.subscribeToAppointmentsByDateRange(
  //       startDate,
  //       endDate,
  //       (data) => {
  //         console.log('=== REAL-TIME PAST APPOINTMENTS UPDATE ===');
          
  //         // Filter to only show past appointments
  //         const today = startOfDay(new Date());
  //         const pastAppointmentsData = data.filter(appointment => {
  //           const appointmentDate = startOfDay(new Date(appointment.date));
  //           return isBefore(appointmentDate, today);
  //         });
          
  //         setPastAppointments(pastAppointmentsData);
  //         setPastError(null);
  //         setPastLoading(false);
  //       }
  //     );
      
  //     setAppointmentListeners([unsubscribe]);
      
  //   } catch (error) {
  //     console.error('Error setting up real-time past appointments listener:', error);
  //     setPastError('Failed to load past appointments. Please try again.');
  //     setPastLoading(false);
  //   }
  // }, [pastAppointmentsDateRange]);

  const loadPastAppointments = useCallback(async () => {
    if (!currentDoctorId) return;
    
    setPastLoading(true);
    try {
      // Clean up existing past appointment listeners
      appointmentListeners.forEach(unsubscribe => unsubscribe());
      
      const startDate = format(pastAppointmentsDateRange.start, 'yyyy-MM-dd');
      const endDate = format(pastAppointmentsDateRange.end, 'yyyy-MM-dd');
      
      console.log('=== SETTING UP REAL-TIME PAST APPOINTMENTS LISTENER ===');
      console.log('Date range:', startDate, 'to', endDate);
      console.log('Current Doctor ID:', currentDoctorId);
      console.log('User Role:', userRole);
      
      const unsubscribe = appointmentService.subscribeToAppointmentsByDateRange(
        startDate,
        endDate,
        (data) => {
          console.log('=== REAL-TIME PAST APPOINTMENTS UPDATE ===');
          
          // Filter appointments based on user role
          const today = startOfDay(new Date());
          let pastAppointmentsData;
          
          if (userRole === 'admin') {
            // Admin can see all past doctor appointments
            pastAppointmentsData = data.filter(appointment => {
              const appointmentDate = startOfDay(new Date(appointment.date));
              return isBefore(appointmentDate, today) &&
                     appointment.status !== 'cancelled';
            });
          } else {
            // Doctor can only see their own past appointments
            pastAppointmentsData = data.filter(appointment => {
              const appointmentDate = startOfDay(new Date(appointment.date));
              return appointment.doctorId === currentDoctorId &&
                     isBefore(appointmentDate, today) &&
                     appointment.status !== 'cancelled';
            });
          }
          
          setPastAppointments(pastAppointmentsData);
          setPastError(null);
          setPastLoading(false);
        }
      );
      
      setAppointmentListeners([unsubscribe]);
      
    } catch (error) {
      console.error('Error setting up real-time past appointments listener:', error);
      setPastError('Failed to load past appointments. Please try again.');
      setPastLoading(false);
    }
  }, [pastAppointmentsDateRange, currentDoctorId, userRole]);

  const loadDoctorSchedules = async () => {
    if (!currentDoctorId) return;
    
    try {
      if (userRole === 'admin') {
        // Admin can see all doctor schedules
        const allDoctors = await doctorService.getAllDoctors();
        const allSchedules: {[doctorId: string]: DoctorSchedule[]} = {};
        
        for (const doctor of allDoctors) {
          const doctorSchedules = await doctorService.getSchedulesByDoctorId(doctor.id);
          allSchedules[doctor.id] = doctorSchedules.filter(s => s.isActive);
        }
        
        setSchedules(allSchedules);
      } else {
        // Doctor can only see their own schedules
        const doctorSchedules = await doctorService.getSchedulesByDoctorId(currentDoctorId);
        setSchedules({ [currentDoctorId]: doctorSchedules.filter(s => s.isActive) });
      }
    } catch (error) {
      console.error('Error loading doctor schedules:', error);
      toast.error("Failed to load schedules");
    }
  };

  const loadDoctorSessions = async () => {
    if (!currentDoctorId) return;
    
    try {
      const daysToCheck = showPastAppointments ? 
        Array.from(new Set(pastAppointments.map(apt => apt.date))) :
        weekDays.map(day => format(day, 'yyyy-MM-dd'));

      const allSessions: {[sessionId: string]: DoctorSession} = {};
      
      for (const dateStr of daysToCheck) {
        const sessions = await doctorSessionService.getSessionsByDate(dateStr);
        
        if (userRole === 'admin') {
          // Admin can see all doctor sessions
          sessions.forEach(session => {
            if (session.id) {
              allSessions[session.id] = session;
            }
          });
        } else {
          // Doctor can only see their own sessions
          const doctorSessions = sessions.filter(session => session.doctorId === currentDoctorId);
          doctorSessions.forEach(session => {
            if (session.id) {
              allSessions[session.id] = session;
            }
          });
        }
      }
      
      setDoctorSessions(allSessions);
    } catch (error) {
      console.error('Error loading doctor sessions:', error);
    }
  };

  // Helper function to get day of week from date
  const getDayOfWeekFromDate = (date: Date): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
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

  // Get sessions organized by day
  const getSessionsByDay = () => {
    if (!currentDoctorId) return {};
    
    const appointmentsToUse = showPastAppointments ? pastAppointments : appointments;
    const sessionsMap: Record<string, SessionData[]> = {};
    
    console.log('=== GETTING SESSIONS BY DAY ===');
    console.log('Current Doctor ID:', currentDoctorId);
    console.log('User Role:', userRole);
    console.log('Appointments to use:', appointmentsToUse.length);
    console.log('Appointments:', appointmentsToUse.map(apt => ({
      patientName: apt.patientName,
      date: apt.date,
      startTime: '09:00', // Default time since appointments don't have time slots
      endTime: '17:00',   // Default time since appointments don't have time slots
      doctorId: apt.doctorId,
      doctorName: apt.doctorName
    })));
    
    const daysToProcess = showPastAppointments ? 
      pastAppointments.map(apt => new Date(apt.date)).filter((date, index, array) => 
        array.findIndex(d => d.getTime() === date.getTime()) === index
      ) : 
      weekDays;
    
    if (userRole === 'admin') {
      // Admin view: Show all doctor sessions
      daysToProcess.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOfWeek = getDayOfWeekFromDate(date);
        
        // Get all doctor schedules for this day
        Object.entries(schedules).forEach(([doctorId, doctorSchedules]) => {
          const daySchedule = doctorSchedules.find(s => s.dayOfWeek === dayOfWeek);
          
          if (daySchedule && daySchedule.timeSlots.length > 0) {
            if (!sessionsMap[dateStr]) {
              sessionsMap[dateStr] = [];
            }
            
            daySchedule.timeSlots.forEach(slot => {
              // Filter appointments by sessionId to ensure proper session isolation
              const sessionId = `${doctorId}_${dateStr}_${slot.startTime}_${slot.endTime}`;
              const slotAppointments = appointmentsToUse.filter(a => {
                if (a.doctorId !== doctorId || a.date !== dateStr || a.status === 'cancelled') {
                  return false;
                }
                
                // CRITICAL: Filter by sessionId to ensure appointments only appear in their specific session
                // This prevents appointments from showing in all sessions for the same doctor/date
                return a.sessionId === sessionId;
              });
              
              const sessionDate = new Date(`${dateStr}T${slot.startTime}`);
              const isPastSession = isBefore(sessionDate, new Date()) && !isToday(sessionDate);
              
              // For current view, show all scheduled sessions
              // For past view, only show if has appointments
              if (slotAppointments.length > 0 || (!showPastAppointments && !isPastSession)) {
                const sessionId = `${doctorId}_${dateStr}_${slot.startTime}_${slot.endTime}`;
                const doctorSession = doctorSessions[sessionId];
                
                // Get doctor name from appointment or find it
                const doctorName = slotAppointments[0]?.doctorName || `Doctor ${doctorId}`;
                
                sessionsMap[dateStr].push({
                  doctorId: doctorId,
                  doctorName: doctorName,
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
    } else {
      // Doctor view: Show only their own sessions
      const doctorSchedules = schedules[currentDoctorId] || [];
      console.log('Doctor schedules:', doctorSchedules);
      
      daysToProcess.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOfWeek = getDayOfWeekFromDate(date);
        
        const daySchedule = doctorSchedules.find(s => s.dayOfWeek === dayOfWeek);
        
        if (daySchedule && daySchedule.timeSlots.length > 0) {
          sessionsMap[dateStr] = [];
          
          daySchedule.timeSlots.forEach(slot => {
            // Filter appointments by sessionId to ensure proper session isolation
            const sessionId = `${currentDoctorId}_${dateStr}_${slot.startTime}_${slot.endTime}`;
            const slotAppointments = appointmentsToUse.filter(a => {
              if (a.doctorId !== currentDoctorId || a.date !== dateStr || a.status === 'cancelled') {
                return false;
              }
              
              // CRITICAL: Filter by sessionId to ensure appointments only appear in their specific session
              // This prevents appointments from showing in all sessions for the same doctor/date
              return a.sessionId === sessionId;
            });
            
            const sessionDate = new Date(`${dateStr}T${slot.startTime}`);
            const isPastSession = isBefore(sessionDate, new Date()) && !isToday(sessionDate);
            
            // For current view, show all scheduled sessions
            // For past view, only show if has appointments
            if (slotAppointments.length > 0 || (!showPastAppointments && !isPastSession)) {
              const sessionId = `${currentDoctorId}_${dateStr}_${slot.startTime}_${slot.endTime}`;
              const doctorSession = doctorSessions[sessionId];
              
              console.log(`Session ${slot.startTime}-${slot.endTime} on ${dateStr}: Found ${slotAppointments.length} appointments:`, 
                slotAppointments.map(apt => `${apt.patientName}`));
              
              sessionsMap[dateStr].push({
                doctorId: currentDoctorId,
                doctorName: currentDoctor?.name || '',
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
    }
    
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

  const openSessionModal = (session: SessionData) => {
    // For admin, we can use the doctor name from the session
    // For doctor, we use the current doctor
    const doctorName = userRole === 'admin' ? session.doctorName : (currentDoctor?.name || '');
    const doctorSpeciality = userRole === 'admin' ? 'Multiple Specialties' : (currentDoctor?.speciality || '');
    
    setSelectedSession({
      doctorName: doctorName,
      doctorSpeciality: doctorSpeciality,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      appointments: session.appointments
    });
    setShowSessionDetailsModal(true);
  };

  useEffect(() => {
    if (showPastAppointments && currentDoctorId) {
      loadPastAppointments();
    }
  }, [showPastAppointments, loadPastAppointments]);

  // Calculate statistics
  const stats = useMemo(() => {
    const appointmentsToUse = showPastAppointments ? pastAppointments : appointments;
    const totalAppointments = appointmentsToUse.length;
    const completedAppointments = appointmentsToUse.filter(a => a.status === 'completed').length;
    const scheduledAppointments = appointmentsToUse.filter(a => a.status === 'scheduled').length;
    const totalRevenue = appointmentsToUse
      .filter(a => a.payment?.isPaid && !a.payment?.refunded)
      .reduce((sum, a) => sum + (a.manualAppointmentAmount || 0), 0);
    
    // Calculate prescription statistics
    const appointmentsWithPrescriptions = appointmentsToUse.filter(a => appointmentPrescriptions[a.id!]).length;
    const prescriptionRate = totalAppointments > 0 ? Math.round((appointmentsWithPrescriptions / totalAppointments) * 100) : 0;
    
    return {
      total: totalAppointments,
      completed: completedAppointments,
      scheduled: scheduledAppointments,
      revenue: totalRevenue,
      prescribed: appointmentsWithPrescriptions,
      prescriptionRate: prescriptionRate
    };
  }, [appointments, pastAppointments, showPastAppointments, appointmentPrescriptions]);

  const handlePreviousWeek = () => {
    setWeekStart(prevWeek => addDays(prevWeek, -7));
  };

  const handleNextWeek = () => {
    setWeekStart(prevWeek => addDays(prevWeek, 7));
  };

  const goToCurrentWeek = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  if (userRole !== 'doctor' && userRole !== 'admin') {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader className="text-center">
              <CardTitle className="text-red-600">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p>This section is only available for doctors and administrators.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentDoctorId || (userRole === 'doctor' && !currentDoctor)) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader className="text-center">
              <CardTitle className="text-amber-600">No Doctor Profile</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p>No doctor profile is linked to your account. Please contact an administrator.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const sessions = getSessionsByDay();

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    {userRole === 'admin' 
                      ? (showPastAppointments ? 'All Past Sessions' : 'All Doctor Sessions')
                      : (showPastAppointments ? 'My Past Sessions' : 'My Sessions')
                    }
                  </h1>
                
                {/* Past Sessions Toggle */}
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
                  {showPastAppointments ? <FileText className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                  {showPastAppointments ? 'Past Sessions' : 'Current Sessions'}
                </Button>
              </div>
              
              <p className="text-slate-600">
                {userRole === 'admin' 
                  ? 'Administrator View - All Doctor Sessions'
                  : `${currentDoctor?.name || ''} - ${currentDoctor?.speciality || ''}`
                }
              </p>
            </div>

            {/* Week Navigation */}
            {!showPastAppointments && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                  <Home className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {/* <span className="text-sm font-medium text-slate-600 ml-2">
                  {format(weekStart, 'MMM d')} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                </span> */}
                <span className="text-sm font-medium text-slate-600 ml-2">
                {format(weekStart, 'MMM d')} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                {weekDays.some(day => isDateToday(format(day, 'yyyy-MM-dd'))) && (
                  <Badge className="bg-green-600 text-white text-xs px-2 py-1 ml-2">
                    Current Week
                  </Badge>
                )}
              </span>
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Sessions</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-600 text-sm font-medium">Scheduled</p>
                    <p className="text-2xl font-bold text-amber-900">{stats.scheduled}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 text-sm font-medium">Prescribed</p>
                    <p className="text-2xl font-bold text-emerald-900">{stats.prescribed}</p>
                    <p className="text-xs text-emerald-700">{stats.prescriptionRate}% rate</p>
                  </div>
                  <FileText className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Revenue</p>
                    <p className="text-2xl font-bold text-purple-900">Rs. {stats.revenue.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sessions Grid */}
          <div className="space-y-6">
            {Object.entries(sessions).length === 0 ? (
              <Card className="bg-white/70 backdrop-blur-sm border border-slate-200">
                <CardContent className="p-12 text-center">
                  <Stethoscope className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    {showPastAppointments ? 'No Past Sessions' : 'No Sessions This Week'}
                  </h3>
                  <p className="text-slate-500">
                    {showPastAppointments 
                      ? 'No past sessions found in your records.'
                      : 'No scheduled sessions for this week.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(sessions).map(([date, daySessions]) => (
                <Card key={date} className="bg-white/70 backdrop-blur-sm border border-slate-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="text-lg font-semibold">
                        {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                      </span>
                      <Badge variant="outline" className="ml-auto">
                        {daySessions.length} {daySessions.length === 1 ? 'Session' : 'Sessions'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {daySessions.map((session, sessionIndex) => (
                        <div
                          key={sessionIndex}
                          className="border border-slate-200 rounded-lg p-4 bg-white/80 hover:bg-white/90 transition-colors cursor-pointer"
                          onClick={() => openSessionModal(session)}
                        >
                          {/* <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">
                                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                </span>
                              </div> */}

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    {/* Enhanced Date Display with Today Indicator */}
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                      isDateToday(session.date) 
                                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-300 shadow-md' 
                                        : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      <Calendar className="h-4 w-4" />
                                      {format(new Date(session.date), 'EEE, MMM d')}
                                      {isDateToday(session.date) && (
                                        <Badge className="bg-green-600 text-white text-xs px-2 py-0.5 ml-1 animate-pulse">
                                          TODAY
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-slate-700">
                                      <Clock className="h-4 w-4" />
                                      <span className="font-medium">
                                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                      </span>
                                    </div>
                                    
                                    {/* Show doctor name for admin view */}
                                    {userRole === 'admin' && (
                                      <div className="flex items-center gap-2 text-slate-600">
                                        <Stethoscope className="h-4 w-4" />
                                        <span className="text-sm font-medium">
                                          {session.doctorName}
                                        </span>
                                      </div>
                                    )}
                              
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-600">
                                  {session.appointmentCount} {session.appointmentCount === 1 ? 'Patient' : 'Patients'}
                                </span>
                              </div>

                              {/* Prescription Status */}
                              {session.appointments.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-emerald-600" />
                                  <span className="text-sm font-medium text-emerald-600">
                                    {session.appointments.filter(apt => appointmentPrescriptions[apt.id!]).length}/{session.appointments.length} Prescribed
                                  </span>
                                </div>
                              )}

                              {session.doctorSession && (
                                <div className="flex items-center gap-2">
                                  {session.doctorSession.isArrived && (
                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                      Arrived
                                    </Badge>
                                  )}
                                  {session.doctorSession.isDeparted && (
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                      Departed
                                    </Badge>
                                  )}
                                  {session.doctorSession.isPaid && (
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                      Paid
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {session.appointments.length > 0 && (
                                <div className="flex -space-x-1">
                                  {session.appointments.slice(0, 3).map((appointment, index) => {
                                    const hasPrescription = appointmentPrescriptions[appointment.id!];
                                    return (
                                      <div
                                        key={index}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(appointment.status)} ${hasPrescription ? 'bg-emerald-50 border-emerald-200' : ''}`}
                                      >
                                        {getStatusIcon(appointment.status)}
                                        <span className="hidden sm:inline">{appointment.patientName}</span>
                                        {hasPrescription && (
                                          <FileText className="h-3 w-3 text-emerald-600" />
                                        )}
                                      </div>
                                    );
                                  })}
                                  {session.appointments.length > 3 && (
                                    <Badge variant="outline" className="ml-2">
                                      +{session.appointments.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Session Details Modal */}
        {/* {showSessionDetailsModal && selectedSession && (
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
            onEditAppointment={() => {
              // Doctors shouldn't edit appointments, or you can handle this differently
              toast.info('Please contact staff to edit appointments');
            }}
            onAppointmentUpdated={() => {
              if (showPastAppointments) {
                loadPastAppointments();
              } else {
                loadAppointments();
              }
              loadDoctorSessions();
            }}
          />
        )} */}

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
            onEditAppointment={handleEditAppointment}
            onAppointmentUpdated={() => {
              if (showPastAppointments) {
                loadPastAppointments();
              } else {
                loadAppointments();
              }
              loadDoctorSessions();
            }}
          />
        )}
      </div>



      {showEditModal && editingAppointment && (
        <AppointmentModal
          onClose={() => {
            setShowEditModal(false);
            setEditingAppointment(null);
          }}
          onSuccess={handleAppointmentUpdated}
          appointment={editingAppointment}
        />
      )}


    </DashboardLayout>
  );
}