// src/app/dashboard/pos/AppointmentDetailsModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { Appointment, formatAppointmentDate } from '@/types/appointment';
import { Prescription } from '@/types/prescription';
import { ReferralLetter } from '@/types/referralLetter';
import { prescriptionService } from '@/services/prescriptionService';
import { cashierService } from '@/services/cashierService';
import { staffService } from '@/services/staffService';
import { referralLetterService } from '@/services/referralLetterService';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Clock, 
  Users,
  Phone,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  CreditCard,
  Eye,
  MapPin,
  RefreshCw,
  Search,
  Pill,
  Loader2,
  UserCheck,
  Calendar,
  Minus
} from 'lucide-react';
import { formatCurrency } from '@/types/doctor';

import {appointmentService} from '@/services/appointmentService';

import {toast} from "sonner";

import { format } from 'date-fns';

import { LoadPrescriptionToPOSButton } from './LoadPrescriptionToPOSButton';
import { PrescriptionPrintButtons } from './PrescriptionPrintButtons';
import { CombinedPrintButton } from './CombinedPrintButton';
import { useAuth } from '@/context/AuthContext';
import SessionSelectionModal from './SessionSelectionModal';
import { doctorSessionService } from '@/services/doctorSessionService';
import { DoctorSession } from '@/types/appointment';
import { PharmacyPOS } from './PharmacyPOS';

// interface AppointmentDetailsModalProps {
//   sessionId: string;
//   onClose: () => void;
//   onNavigateToSession: (doctorName: string, doctorSpeciality: string, date: string, startTime: string, endTime: string, appointments: Appointment[]) => void;
// }

interface AppointmentDetailsModalProps {
  sessionId?: string; // Make optional since we're now showing today's appointments
  onClose: () => void;
  onNavigateToSession: (doctorName: string, doctorSpeciality: string, date: string, startTime: string, endTime: string, appointments: Appointment[]) => void;
  onLoadPrescriptionToPOS?: (prescriptionData: any) => void; // Add this line
}

export default function AppointmentDetailsModal({
  sessionId,
  onClose,
  onNavigateToSession,
  onLoadPrescriptionToPOS
}: AppointmentDetailsModalProps) {
  console.log('AppointmentDetailsModal received onLoadPrescriptionToPOS:', !!onLoadPrescriptionToPOS);
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [appointmentPrescriptions, setAppointmentPrescriptions] = useState<{[appointmentId: string]: Prescription}>({});
  const [appointmentReferralLetters, setAppointmentReferralLetters] = useState<{[appointmentId: string]: ReferralLetter}>({});
  const [allPrescriptionsByAppointment, setAllPrescriptionsByAppointment] = useState<{[appointmentId: string]: Prescription[]}>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingArrival, setProcessingArrival] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'pos-paid' | 'archived' | 'pending-prescriptions' | 'past-unpaid'>('today');
  const [posPaidAppointments, setPosPaidAppointments] = useState<Appointment[]>([]);
  const [archivedAppointments, setArchivedAppointments] = useState<Appointment[]>([]);
  const [pendingPrescriptionAppointments, setPendingPrescriptionAppointments] = useState<Appointment[]>([]);
  const [pastUnpaidAppointments, setPastUnpaidAppointments] = useState<Appointment[]>([]);
  const [creatorNames, setCreatorNames] = useState<{[userId: string]: string}>({});
  const [importingAppointment, setImportingAppointment] = useState<string | null>(null);
  
  // Session selection modal state
  const [showSessionSelection, setShowSessionSelection] = useState(false);
  const [availableSessions, setAvailableSessions] = useState<DoctorSession[]>([]);
  const [selectedAppointmentForImport, setSelectedAppointmentForImport] = useState<Appointment | null>(null);
  
  // Pharmacy POS modal state
  const [showPharmacyPOS, setShowPharmacyPOS] = useState(false);
  const [selectedAppointmentForPharmacy, setSelectedAppointmentForPharmacy] = useState<Appointment | null>(null);

  // Format time function (24h to 12h)
  const formatTime = (time: string): string => {
    if (!time || time === 'undefined' || time === 'N/A') return 'N/A';
    
    try {
      // Handle different time formats
      let hour, minute;
      
      if (time.includes(':')) {
        // Standard HH:MM format
        [hour, minute] = time.split(':');
      } else if (time.length === 4 && !isNaN(parseInt(time))) {
        // HHMM format (e.g., "1200" for 12:00)
        hour = time.substring(0, 2);
        minute = time.substring(2, 4);
      } else if (time.length === 3 && !isNaN(parseInt(time))) {
        // HMM format (e.g., "900" for 9:00)
        hour = time.substring(0, 1);
        minute = time.substring(1, 3);
      } else {
        return 'N/A';
      }
      
      if (!hour || !minute || isNaN(parseInt(hour)) || isNaN(parseInt(minute))) {
        return 'N/A';
      }
      
      const hourNum = parseInt(hour);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const hour12 = hourNum % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
    } catch (e) {
      return 'N/A';
    }
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    return format(new Date(), 'yyyy-MM-dd');
  };

  // Helper function to extract session information from sessionId
  const extractSessionInfo = (sessionId: string) => {
    if (!sessionId) return null;
    
    // sessionId format: doctorId_date_sessionStartTime_sessionEndTime
    // But the doctorId and date might contain underscores, so we need to be smarter about parsing
    const parts = sessionId.split('_');
    
    if (parts.length >= 4) {
      // The last two parts should always be the times
      const sessionEndTime = parts[parts.length - 1];
      const sessionStartTime = parts[parts.length - 2];
      
      // The remaining parts are doctorId and date
      const remainingParts = parts.slice(0, -2);
      
      // Find the date part (it should be in YYYY-MM-DD format)
      let date = '';
      let doctorId = '';
      
      for (let i = remainingParts.length - 1; i >= 0; i--) {
        const part = remainingParts[i];
        // Check if this part looks like a date (YYYY-MM-DD format)
        if (part.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = part;
          doctorId = remainingParts.slice(0, i).join('_');
          break;
        }
      }
      
      // If we didn't find a date, use the last part as date and everything else as doctorId
      if (!date && remainingParts.length > 0) {
        date = remainingParts[remainingParts.length - 1];
        doctorId = remainingParts.slice(0, -1).join('_');
      }
      
      console.log('🔍 Parsed sessionId:', {
        original: sessionId,
        doctorId,
        date,
        sessionStartTime,
        sessionEndTime
      });
      
      // Validate that time parts are not undefined or empty and look like times
      if (sessionStartTime && sessionEndTime && 
          sessionStartTime !== 'undefined' && sessionEndTime !== 'undefined' &&
          sessionStartTime.includes(':') && sessionEndTime.includes(':')) {
        return { doctorId, date, sessionStartTime, sessionEndTime };
      }
    }
    return null;
  };

  // Helper function to get session times with fallback
  const getSessionTimes = (appointment: Appointment): { startTime: string; endTime: string } => {
    console.log('🔍 getSessionTimes called for appointment:', {
      id: appointment.id,
      patientName: appointment.patientName,
      sessionId: appointment.sessionId
    });
    
    // First try to get times from sessionId
    if (appointment.sessionId) {
      const sessionInfo = extractSessionInfo(appointment.sessionId);
      console.log('📝 Session info from sessionId:', sessionInfo);
      if (sessionInfo?.sessionStartTime && sessionInfo?.sessionEndTime) {
        console.log('✅ Using times from sessionId');
        return {
          startTime: sessionInfo.sessionStartTime,
          endTime: sessionInfo.sessionEndTime
        };
      }
    }
    
    // Fallback: Check if appointment has old startTime/endTime fields (for legacy data)
    if ((appointment as any).startTime && (appointment as any).endTime) {
      console.log('✅ Using legacy startTime/endTime fields');
      return {
        startTime: (appointment as any).startTime,
        endTime: (appointment as any).endTime
      };
    }
    
    // Final fallback: Use default session times
    console.log('⚠️ Using default session times for appointment:', appointment.patientName);
    const testStart = formatTime('09:00');
    const testEnd = formatTime('17:00');
    console.log('🧪 Testing formatTime with default values:', { testStart, testEnd });
    
    return {
      startTime: '09:00',
      endTime: '17:00'
    };
  };

  // Group appointments by doctor session
  const groupAppointmentsBySession = (appointments: Appointment[]) => {
    const groups: {[key: string]: Appointment[]} = {};
    
    appointments.forEach(appointment => {
      // Use sessionId if available, otherwise create a fallback key
      let sessionKey: string;
      
      if (appointment.sessionId) {
        // Use the sessionId directly as it contains the correct session times
        sessionKey = appointment.sessionId;
      } else {
        // Fallback: create a key based on doctor, date, and time
        // This ensures appointments for the same doctor and date are grouped together
        sessionKey = `${appointment.doctorId}_${appointment.date}_default`;
      }
      
      if (!groups[sessionKey]) {
        groups[sessionKey] = [];
      }
      groups[sessionKey].push(appointment);
    });
    
    // Sort appointments within each group by session appointment number
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        // First try to sort by session appointment number
        const aNumber = a.sessionAppointmentNumber || 0;
        const bNumber = b.sessionAppointmentNumber || 0;
        
        if (aNumber !== bNumber) {
          return aNumber - bNumber;
        }
        
        // If session numbers are the same or missing, sort by creation time
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 
                     (a.createdAt && typeof a.createdAt === 'object' && 'seconds' in a.createdAt) ? 
                     (a.createdAt as any).seconds * 1000 : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 
                     (b.createdAt && typeof b.createdAt === 'object' && 'seconds' in b.createdAt) ? 
                     (b.createdAt as any).seconds * 1000 : 0;
        return aTime - bTime;
      });
    });
    
    console.log('Session groups:', Object.keys(groups).map(key => ({
      sessionKey: key,
      appointmentCount: groups[key].length,
      appointments: groups[key].map(apt => ({
        id: apt.id,
        patientName: apt.patientName,
        sessionId: apt.sessionId,
        sessionAppointmentNumber: apt.sessionAppointmentNumber
      }))
    })));
    
    return groups;
  };

  // Get filtered appointments based on active tab
  const getFilteredAppointmentsForTab = (): Appointment[] => {
    let baseAppointments: Appointment[] = [];
    const today = getTodayDate();
    
    switch (activeTab) {
      case 'today':
        baseAppointments = appointments; // All today's appointments
        break;
      case 'pos-paid':
        // Filter POS paid appointments to show only today's appointments
        baseAppointments = posPaidAppointments.filter(appointment => appointment.date === today);
        break;
      case 'archived':
        // Filter archived appointments to show only today's appointments
        baseAppointments = archivedAppointments.filter(appointment => appointment.date === today);
        break;
      case 'pending-prescriptions':
        // Filter pending prescription appointments to show only today's appointments
        baseAppointments = pendingPrescriptionAppointments.filter(appointment => appointment.date === today);
        break;
      case 'past-unpaid':
        // Show all past unpaid appointments (not filtered by today)
        baseAppointments = pastUnpaidAppointments;
        break;
      default:
        baseAppointments = appointments;
    }

    // Apply search filter if query exists
    let filteredAppointments = baseAppointments;
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filteredAppointments = baseAppointments.filter(appointment => {
        const patientName = appointment.patientName?.toLowerCase() || '';
        const phone = (appointment.patientContact || '')?.toLowerCase();
        
        return patientName.includes(searchLower) || phone.includes(searchLower);
      });
    }

    // Sort appointments by session appointment number for better organization
    return filteredAppointments.sort((a, b) => {
      // First sort by doctor name
      const doctorCompare = a.doctorName.localeCompare(b.doctorName);
      if (doctorCompare !== 0) return doctorCompare;
      
      // Then by date
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      
      // Finally by session appointment number
      const aNumber = a.sessionAppointmentNumber || 0;
      const bNumber = b.sessionAppointmentNumber || 0;
      return aNumber - bNumber;
    });
  };

  useEffect(() => {
    console.log('🔐 Current user:', user);
    loadTodayAppointments();
  }, []);

  // Update filtered appointments when appointments, activeTab, searchQuery, pending prescription appointments, or past unpaid appointments change
  useEffect(() => {
    const filtered = getFilteredAppointmentsForTab();
    setFilteredAppointments(filtered);
  }, [appointments, activeTab, searchQuery, pendingPrescriptionAppointments, pastUnpaidAppointments]);

  // Load prescriptions when appointments or pending prescription appointments change
  useEffect(() => {
    if (appointments.length > 0 || pendingPrescriptionAppointments.length > 0) {
      loadPrescriptions();
    }
  }, [appointments, pendingPrescriptionAppointments]);

  useEffect(() => {
    console.log('Current appointmentPrescriptions state:', appointmentPrescriptions);
    console.log('Current appointments count:', appointments.length);
    console.log('onLoadPrescriptionToPOS callback exists:', !!onLoadPrescriptionToPOS);
  }, [appointmentPrescriptions, appointments, onLoadPrescriptionToPOS]);

  // Load POS-paid, archived, past unpaid, and pending prescription appointments
  useEffect(() => {
    const loadPaidAppointments = async () => {
      try {
        const [posPaid, archived, pastUnpaid] = await Promise.all([
          appointmentService.getAppointmentsPaidThroughPOS(),
          appointmentService.getArchivedAppointments(),
          appointmentService.getPastUnpaidAppointments()
        ]);
        
        console.log('Loaded appointments:', { posPaid: posPaid.length, archived: archived.length, pastUnpaid: pastUnpaid.length });
        setPosPaidAppointments(posPaid);
        setArchivedAppointments(archived);
        setPastUnpaidAppointments(pastUnpaid);
        
        // Load creator names for all appointment types
        const allAppointments = [...posPaid, ...archived, ...pastUnpaid];
        if (allAppointments.length > 0) {
          await loadCreatorNames(allAppointments);
        }
      } catch (error) {
        console.error('Error loading paid appointments:', error);
      }
    };

    loadPaidAppointments();
  }, []);

  // Load pending prescription appointments
  const loadPendingPrescriptionAppointments = async () => {
    try {
      const today = getTodayDate();
      const allAppointments = await appointmentService.getNonArchivedAppointments();
      
      // Filter for today's appointments that have prescriptions but haven't been loaded to POS
      const todayAppointments = allAppointments.filter(appointment => 
        appointment.date === today && 
        !appointment.loadedToPOS && // Not loaded to POS yet
        !(appointment.payment?.isPaid && appointment.payment?.paidThroughPOS) // Not paid through POS
      );

      // Check which appointments have prescriptions
      const appointmentsWithPrescriptions: Appointment[] = [];
      
      for (const appointment of todayAppointments) {
        if (appointment.id) {
          const prescription = await prescriptionService.getPrescriptionByAppointmentId(appointment.id);
          if (prescription) {
            appointmentsWithPrescriptions.push(appointment);
          }
        }
      }
      
      setPendingPrescriptionAppointments(appointmentsWithPrescriptions);
      
      // Load creator names for pending prescription appointmentswha
      if (appointmentsWithPrescriptions.length > 0) {
        await loadCreatorNames(appointmentsWithPrescriptions);
      }
    } catch (error) {
      console.error('Error loading pending prescription appointments:', error);
    }
  };

  // Load pending prescription appointments on component mount
  useEffect(() => {
    loadPendingPrescriptionAppointments();
  }, []);

  // Function to remove appointment from pending prescriptions when loaded to POS
  const removeFromPendingPrescriptions = (appointmentId: string) => {
    setPendingPrescriptionAppointments(prev => 
      prev.filter(appointment => appointment.id !== appointmentId)
    );
  };

  // Enhanced onLoadPrescriptionToPOS callback that also removes from pending list
  const handleLoadPrescriptionToPOS = (prescriptionData: any) => {
    if (onLoadPrescriptionToPOS) {
      onLoadPrescriptionToPOS(prescriptionData);
    }
    // Remove from pending prescriptions list
    if (prescriptionData.appointment?.id) {
      removeFromPendingPrescriptions(prescriptionData.appointment.id);
    }
  };

  const handleOpenPharmacyPOS = (appointment: Appointment) => {
    setSelectedAppointmentForPharmacy(appointment);
    setShowPharmacyPOS(true);
  };

  const handlePharmacyPOSBack = () => {
    setShowPharmacyPOS(false);
    setSelectedAppointmentForPharmacy(null);
  };

  const handlePharmacyLoadToMainPOS = async (pharmacyData: any) => {
    console.log('AppointmentDetailsModal: handlePharmacyLoadToMainPOS called with:', pharmacyData);
    
    try {
      // Update appointment with pharmacy review status
      if (pharmacyData.appointment?.id && user?.uid) {
        await appointmentService.updateAppointment(pharmacyData.appointment.id, {
          pharmacyReviewStatus: 'reviewed',
          pharmacyReviewedAt: Date.now(),
          pharmacyReviewedBy: user.uid,
          pharmacyReviewNotes: `Pharmacy reviewed and drugs issued for ${pharmacyData.pharmacyReviewedItems?.length || 0} medicines`
        });
        
        toast.success('Pharmacy review status updated');
        
        // Refresh the appointments to show updated status
        await loadPendingPrescriptionAppointments();
      }
      
      if (onLoadPrescriptionToPOS) {
        onLoadPrescriptionToPOS(pharmacyData);
      }
      
      // Remove from pending prescriptions list
      if (pharmacyData.appointment?.id) {
        removeFromPendingPrescriptions(pharmacyData.appointment.id);
      }
      
      setShowPharmacyPOS(false);
      setSelectedAppointmentForPharmacy(null);
    } catch (error) {
      console.error('Error updating pharmacy review status:', error);
      toast.error('Failed to update pharmacy review status');
    }
  };

  // Import appointment to today's session
  const handleImportAppointment = async (appointment: Appointment) => {
    if (!user?.uid) {
      toast.error('User not authenticated');
      return;
    }

    try {
      // Get today's sessions for the same doctor
      const today = getTodayDate();
      const todaySessions = await doctorSessionService.getSessionsByDate(today);
      console.log('All today sessions from getSessionsByDate:', todaySessions);
      
      const doctorSessions = todaySessions.filter(session => 
        session.doctorId === appointment.doctorId
      );
      
      console.log('Doctor sessions found from getSessionsByDate:', doctorSessions);
      console.log('Looking for doctor ID:', appointment.doctorId);
      
      // Always check for existing sessions from appointments first, regardless of what getSessionsByDate returns
      try {
        const todayAppointments = await appointmentService.getAppointmentsByDateRange(today, today);
        const doctorTodayAppointments = todayAppointments.filter(apt => 
          apt.doctorId === appointment.doctorId && apt.sessionId
        );
        
        console.log('Today appointments for doctor:', doctorTodayAppointments);
        console.log('Session IDs found:', doctorTodayAppointments.map(apt => apt.sessionId));
        
        if (doctorTodayAppointments.length > 0) {
          // Get all unique sessions from existing appointments
          const sessionIds = doctorTodayAppointments.map(apt => apt.sessionId).filter(Boolean);
          const uniqueSessionIds = sessionIds.filter((id, index) => sessionIds.indexOf(id) === index);
          
          console.log('Unique session IDs:', uniqueSessionIds);
          
          // Clear the existing doctorSessions array and populate with sessions from appointments
          doctorSessions.length = 0;
          
          for (const sessionId of uniqueSessionIds) {
            console.log('Loading session:', sessionId);
            const existingSession = await doctorSessionService.getSession(sessionId);
            console.log('Loaded session:', existingSession);
            if (existingSession) {
              doctorSessions.push(existingSession);
            }
          }
          
          console.log('Final doctor sessions after loading from appointments:', doctorSessions);
          
          if (doctorSessions.length > 0) {
            toast.info(`Found ${doctorSessions.length} existing session(s) for today`);
          }
        }
        
        // If still no sessions found, create a new one
        if (doctorSessions.length === 0) {
          console.log('No sessions found, creating a new one');
          const newSession = await doctorSessionService.createOrUpdateSession(
            appointment.doctorId,
            appointment.doctorName,
            today,
            '08:00', // Default start time
            '17:00'  // Default end time
          );
          
          doctorSessions.push(newSession);
          toast.info('Created a new session for today. You can modify the session times later.');
        } else {
          console.log('Found existing sessions, not creating new one');
        }
      } catch (error) {
        console.error('Error checking for existing sessions:', error);
        toast.error('Failed to check for existing sessions. Please try again.');
        return;
      }
      
      // If only one session, import directly
      if (doctorSessions.length === 1) {
        await performImport(appointment, doctorSessions[0].id!, user.uid);
      } else {
        // Multiple sessions - show selection modal
        setSelectedAppointmentForImport(appointment);
        setAvailableSessions(doctorSessions);
        setShowSessionSelection(true);
      }
      
    } catch (error) {
      console.error('Error getting sessions for import:', error);
      toast.error('Failed to get available sessions. Please try again.');
    }
  };

  // Perform the actual import
  const performImport = async (appointment: Appointment, sessionId: string, userId: string) => {
    setImportingAppointment(appointment.id!);
    
    try {
      // Import the appointment
      await appointmentService.importAppointmentToToday(
        appointment.id!,
        sessionId,
        userId
      );
      
      toast.success(`Appointment for ${appointment.patientName} imported to today's session`);
      
      // Refresh the appointments
      await loadTodayAppointments();
      // Past unpaid appointments will be refreshed automatically via useEffect
      
      // Switch to today's tab to show the imported appointment
      setActiveTab('today');
      
    } catch (error) {
      console.error('Error importing appointment:', error);
      toast.error('Failed to import appointment. Please try again.');
    } finally {
      setImportingAppointment(null);
    }
  };

  // Handle session selection from modal
  const handleSessionSelection = async (sessionId: string) => {
    if (!selectedAppointmentForImport || !user?.uid) {
      return;
    }
    
    setShowSessionSelection(false);
    await performImport(selectedAppointmentForImport, sessionId, user.uid);
    setSelectedAppointmentForImport(null);
    setAvailableSessions([]);
  };

  const loadPrescriptions = async () => {
    try {
      const prescriptions: {[appointmentId: string]: Prescription} = {};
      const allPrescriptionsByAppointment: {[appointmentId: string]: Prescription[]} = {}; // Track all prescriptions per appointment
      const referralLetters: {[appointmentId: string]: ReferralLetter} = {};
      
      // Load prescriptions and referral letters for today's appointments
      for (const appointment of appointments) {
        if (appointment.id) {
          // Load all prescriptions for this appointment (multi-patient support)
          const allPrescriptions = await prescriptionService.getAllPrescriptionsByAppointmentId(appointment.id);
          allPrescriptionsByAppointment[appointment.id] = allPrescriptions;
          
          // Use the first prescription for backward compatibility
          if (allPrescriptions.length > 0) {
            const prescription = allPrescriptions[0];
            prescriptions[appointment.id] = prescription;
            
            // Load referral letter if prescription has one
            if (prescription.referralLetterId) {
              try {
                const referralLetter = await referralLetterService.getById(prescription.referralLetterId);
                if (referralLetter) {
                  referralLetters[appointment.id] = referralLetter;
                }
              } catch (error) {
                console.error('Error loading referral letter:', error);
              }
            }
          }
        }
      }
      
      // Also load prescriptions and referral letters for pending prescription appointments
      for (const appointment of pendingPrescriptionAppointments) {
        if (appointment.id && !prescriptions[appointment.id]) {
          // Load all prescriptions for this appointment
          const allPrescriptions = await prescriptionService.getAllPrescriptionsByAppointmentId(appointment.id);
          allPrescriptionsByAppointment[appointment.id] = allPrescriptions;
          
          if (allPrescriptions.length > 0) {
            const prescription = allPrescriptions[0];
            prescriptions[appointment.id] = prescription;
            
            // Load referral letter if prescription has one
            if (prescription.referralLetterId) {
              try {
                const referralLetter = await referralLetterService.getById(prescription.referralLetterId);
                if (referralLetter) {
                  referralLetters[appointment.id] = referralLetter;
                }
              } catch (error) {
                console.error('Error loading referral letter:', error);
              }
            }
          }
        }
      }
      
      setAppointmentPrescriptions(prescriptions);
      setAppointmentReferralLetters(referralLetters);
      setAllPrescriptionsByAppointment(allPrescriptionsByAppointment);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    }
  };

  const loadTodayAppointments = async (showRefreshToast = false) => {
    try {
      setLoading(true);
      if (showRefreshToast) {
        setIsRefreshing(true);
      }
      
      // Get all non-archived appointments for today
      const today = getTodayDate();
      const allAppointments = await appointmentService.getNonArchivedAppointments();
      
      // Filter for today's appointments that are not completed (not paid through POS)
      const todayAppointments = allAppointments.filter(appointment => 
        appointment.date === today && 
        !(appointment.payment?.isPaid && appointment.payment?.paidThroughPOS)
      );
      
      // Sort appointments by creation time (most recent first)
      const sortedAppointments = todayAppointments.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 
                     (a.createdAt && typeof a.createdAt === 'object' && 'seconds' in a.createdAt) ? 
                     (a.createdAt as any).seconds * 1000 : Date.now();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 
                     (b.createdAt && typeof b.createdAt === 'object' && 'seconds' in b.createdAt) ? 
                     (b.createdAt as any).seconds * 1000 : Date.now();
        return bTime - aTime;
      });
      
      console.log(`Loaded ${sortedAppointments.length} appointments for today (${today})`);
      
      if (showRefreshToast) {
        toast.success(`Refreshed! Found ${sortedAppointments.length} appointments for today`);
      }
      
      setAppointments(sortedAppointments);
      setFilteredAppointments(sortedAppointments);
      
      // Load creator names for appointments
      await loadCreatorNames(sortedAppointments);
      
    } catch (error) {
      console.error('Error loading today appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
      if (showRefreshToast) {
        setIsRefreshing(false);
      }
    }
  };

  const loadCreatorNames = async (appointments: Appointment[]) => {
    try {
      console.log('🔍 Loading creator names for appointments:', appointments.length);
      
      const uniqueUserIds = new Set<string>();
      
      // Extract unique user IDs from appointments
      appointments.forEach((appointment, index) => {
        console.log(`📋 Appointment ${index + 1}:`, {
          id: appointment.id,
          patientName: appointment.patientName,
          createdBy: (appointment as any).createdBy
        });
        
        // Check if appointment has createdBy field with uid
        if ((appointment as any).createdBy?.uid) {
          uniqueUserIds.add((appointment as any).createdBy.uid);
          console.log(`✅ Found createdBy.uid: ${(appointment as any).createdBy.uid}`);
        } else {
          console.log(`❌ No createdBy.uid found for appointment ${appointment.id}`);
        }
      });
      
      console.log('👥 Unique user IDs found:', Array.from(uniqueUserIds));
      
      // Load display names for each unique user ID
      const creatorNamesMap: {[userId: string]: string} = {};
      
      for (const userId of Array.from(uniqueUserIds)) {
        try {
          console.log(`🔍 Loading staff user: ${userId}`);
          const staffUser = await staffService.getStaffById(userId);
          console.log(`📊 Staff user data:`, staffUser);
          
          if (staffUser) {
            const displayName = staffUser.displayName || staffUser.email || 'Unknown User';
            creatorNamesMap[userId] = displayName;
            console.log(`✅ Mapped ${userId} -> ${displayName}`);
          } else {
            creatorNamesMap[userId] = 'User Not Found';
            console.log(`❌ Staff user not found for ID: ${userId}`);
          }
        } catch (error) {
          console.error(`Error loading staff user ${userId}:`, error);
          creatorNamesMap[userId] = 'Error Loading User';
        }
      }
      
      console.log('📝 Final creator names map:', creatorNamesMap);
      setCreatorNames(prev => ({ ...prev, ...creatorNamesMap }));
    } catch (error) {
      console.error('Error loading creator names:', error);
    }
  };

  // Function to update legacy appointments with current user info
  const updateLegacyAppointment = async (appointmentId: string) => {
    console.log('🔄 Starting updateLegacyAppointment for:', appointmentId);
    
    if (!user?.uid) {
      console.error('❌ User not authenticated');
      toast.error('User not authenticated');
      return;
    }

    try {
      console.log('👤 Updating appointment creator for:', user.uid);
      
      // Use the service method to update the appointment creator
      const result = await appointmentService.updateAppointmentCreator(appointmentId, user.uid);
      
      console.log('✅ Appointment updated successfully:', result);
      toast.success('Appointment updated with creator information');
      
      // Update the creator names map immediately
      if (result.createdBy) {
        setCreatorNames(prev => ({
          ...prev,
          [user.uid]: result.createdBy.displayName || result.createdBy.email || 'Unknown User'
        }));
      }
      
      // Refresh the appointments to show updated data
      console.log('🔄 Refreshing appointments...');
      loadTodayAppointments();
    } catch (error) {
      console.error('❌ Error updating legacy appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  // Search filtering function
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    // The useEffect will handle the filtering automatically
  };

  // Refresh handler
  const handleRefresh = async () => {
    await loadTodayAppointments(true);
    await loadPendingPrescriptionAppointments(); // Also refresh pending prescriptions
  };

  // Removed handleBackfillSessionNumbers as the service method doesn't exist

  const generateAppointmentNumber = (appointmentId: string): string => {
    if (appointmentId) {
      const cleanId = appointmentId.replace(/[^a-zA-Z0-9]/g, '');
      return cleanId.substring(Math.max(0, cleanId.length - 8)).toUpperCase();
    }
    return 'N/A';
  };

  const debugAppointmentData = async (appointment: Appointment) => {
    try {
      console.log('\n=== 📊 APPOINTMENT DEBUG DATA ===');
      console.log('Current appointment details:', {
        id: appointment.id,
        patientName: appointment.patientName,
        sessionId: appointment.sessionId,
        cashierSessionId: appointment.cashierSessionId,
        doctorId: appointment.doctorId,
        date: appointment.date,
        status: appointment.status
      });

      // Get all appointments and analyze
      const allAppointments = await appointmentService.getAllAppointments();
      console.log(`\n📈 Total appointments in database: ${allAppointments.length}`);
      
      // Check appointments with same sessionId
      if (appointment.sessionId) {
        const exactSessionMatches = allAppointments.filter(apt => 
          apt.sessionId === appointment.sessionId
        );
        console.log(`\n🎯 Appointments with exact sessionId "${appointment.sessionId}": ${exactSessionMatches.length}`);
        
        if (exactSessionMatches.length > 0) {
          exactSessionMatches.forEach((apt, index) => {
            console.log(`   ${index + 1}. ${apt.patientName} (Status: ${apt.status}, CashierSession: ${apt.cashierSessionId || 'None'})`);
          });
        }
      }
      
      // Check appointments for same doctor/date/time
      const doctorDateTimeMatches = allAppointments.filter(apt => 
        apt.doctorId === appointment.doctorId &&
        apt.date === appointment.date &&
        apt.sessionId === appointment.sessionId
      );
      console.log(`\n🏥 Appointments for same doctor/date/time: ${doctorDateTimeMatches.length}`);
      
      if (doctorDateTimeMatches.length > 0) {
        console.log('   Doctor/date/time matches:');
        doctorDateTimeMatches.forEach((apt, index) => {
          console.log(`   ${index + 1}. ${apt.patientName}`);
          console.log(`      SessionId: ${apt.sessionId || 'Missing!'}`);
          console.log(`      CashierSession: ${apt.cashierSessionId || 'None'}`);
          console.log(`      Status: ${apt.status}`);
        });
      }
      
      console.log('\n=== END DEBUG ===\n');
      
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  const handleToggleArrival = async (appointmentId: string, currentStatus: boolean) => {
    try {
      setProcessingArrival(appointmentId);
      const newStatus = !currentStatus;
      
      await appointmentService.updatePatientArrival(appointmentId, newStatus);
      
      // Update local state to reflect the change immediately
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId 
          ? { 
              ...apt, 
              isPatientArrived: newStatus, 
              patientArrivedAt: newStatus ? Date.now() : undefined 
            }
          : apt
      ));
      
      // Also update filtered appointments
      setFilteredAppointments(prev => prev.map(apt => 
        apt.id === appointmentId 
          ? { 
              ...apt, 
              isPatientArrived: newStatus, 
              patientArrivedAt: newStatus ? Date.now() : undefined 
            }
          : apt
      ));
      
      toast.success(`Patient ${newStatus ? 'marked as arrived' : 'arrival unmarked'}`);
      
    } catch (error: any) {
      console.error('Error updating patient arrival:', error);
      toast.error(error.message || 'Failed to update patient arrival status');
    } finally {
      setProcessingArrival(null);
    }
  };

  const handleNavigateToSession = async (appointment: Appointment) => {
    try {
      console.log('=== LOADING COMPLETE DOCTOR SESSION ===');
      console.log('Current appointment:', appointment);
      
      // Get ALL appointments from database
      const allAppointments = await appointmentService.getAllAppointments();
      console.log(`Total appointments in database: ${allAppointments.length}`);
      
      // Convert appointment date to string format for comparison
      const targetDate = typeof appointment.date === 'string' 
        ? appointment.date 
        : format(new Date(appointment.date), 'yyyy-MM-dd');
      
      console.log('Target date for filtering:', targetDate);
      console.log('Looking for appointments with:', {
        doctorId: appointment.doctorId,
        date: targetDate,
        sessionId: appointment.sessionId
      });
      
      // Get ALL appointments for this doctor session using sessionId if available
      let completeSessionAppointments: Appointment[] = [];
      
      if (appointment.sessionId) {
        // Use sessionId to find all appointments in the same session
        completeSessionAppointments = allAppointments.filter(apt => 
          apt.sessionId === appointment.sessionId && apt.status !== 'cancelled'
        );
        console.log(`Found ${completeSessionAppointments.length} appointments using sessionId: ${appointment.sessionId}`);
      } else {
        // Fallback: filter by doctor, date, and time
        completeSessionAppointments = allAppointments.filter(apt => {
          const aptDate = typeof apt.date === 'string' 
            ? apt.date 
            : format(new Date(apt.date), 'yyyy-MM-dd');
          
          return apt.doctorId === appointment.doctorId &&
            aptDate === targetDate &&
            apt.sessionId === appointment.sessionId &&
            apt.status !== 'cancelled';
        });
        console.log(`Found ${completeSessionAppointments.length} appointments using fallback method`);
      }
      
      // Sort appointments by session appointment number, then by creation time
      completeSessionAppointments.sort((a, b) => {
        // First sort by session appointment number
        const aNumber = a.sessionAppointmentNumber || 0;
        const bNumber = b.sessionAppointmentNumber || 0;
        
        if (aNumber !== bNumber) {
          return aNumber - bNumber;
        }
        
        // If session numbers are the same or missing, sort by creation time
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 
                     (a.createdAt && typeof a.createdAt === 'object' && 'seconds' in a.createdAt) ? 
                     (a.createdAt as any).seconds * 1000 : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 
                     (b.createdAt && typeof b.createdAt === 'object' && 'seconds' in b.createdAt) ? 
                     (b.createdAt as any).seconds * 1000 : 0;
        return aTime - bTime;
      });

      console.log('Sorted appointments:', completeSessionAppointments.map(apt => ({
        patientName: apt.patientName,
        sessionAppointmentNumber: apt.sessionAppointmentNumber,
        sessionId: apt.sessionId
      })));

      // CRITICAL: Pass the date in the same format as appointments section
      const sessionDate = targetDate; // Use string format YYYY-MM-DD
      
      console.log('Passing to SessionDetailsModal:', {
        doctorName: appointment.doctorName,
        date: sessionDate,
        // Session times are derived from sessionId
        appointmentCount: completeSessionAppointments.length,
        sessionId: appointment.sessionId
      });

      // Pass ALL doctor session appointments to SessionDetailsModal
      // Get session times with fallback
      const { startTime, endTime } = getSessionTimes(appointment);
      
      onNavigateToSession(
        appointment.doctorName,
        '',
        sessionDate, // Use consistent date format
        startTime,
        endTime,
        completeSessionAppointments
      );

    } catch (error) {
      console.error('Error loading doctor session:', error);
      toast.error('Failed to load doctor session');
      
      // Fallback with proper date format
      const fallbackDate = typeof appointment.date === 'string' 
        ? appointment.date 
        : format(new Date(appointment.date), 'yyyy-MM-dd');
        
      // Get session times with fallback
      const { startTime, endTime } = getSessionTimes(appointment);
      
      onNavigateToSession(
        appointment.doctorName,
        '',
        fallbackDate,
        startTime,
        endTime,
        [appointment]
      );
    }
  };

  const debugAppointments = async (targetSessionId: string, appointment: Appointment) => {
    try {
      console.log('=== DEBUG: ALL APPOINTMENTS ANALYSIS ===');
      const allAppointments = await appointmentService.getAllAppointments();
      console.log(`Total appointments in database: ${allAppointments.length}`);
      
      // Show appointments that might be related
      const relatedAppointments = allAppointments.filter(apt => 
        apt.doctorId === appointment.doctorId &&
        apt.date === appointment.date
      );
      
      console.log(`Appointments for same doctor (${appointment.doctorId}) on same date (${appointment.date}):`);
      relatedAppointments.forEach((apt, index) => {
        console.log(`  ${index + 1}. ${apt.patientName}:`);
        console.log(`      ID: ${apt.id}`);
        console.log(`      SessionId: ${apt.sessionId}`);
        // Session times are derived from sessionId
        console.log(`      Status: ${apt.status}`);
      });
      
      // Check if any appointments have similar sessionIds
      const sessionIdMatches = allAppointments.filter(apt => 
        apt.sessionId && apt.sessionId.includes(appointment.doctorId)
      );
      
      console.log(`Appointments with similar sessionIds containing doctorId (${appointment.doctorId}):`);
      sessionIdMatches.forEach((apt, index) => {
        console.log(`  ${index + 1}. ${apt.patientName} - SessionId: ${apt.sessionId}`);
      });
      
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">Loading Appointments</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="ml-2 text-slate-600">Loading appointments...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[98vw] w-[98vw] max-h-[95vh] flex flex-col bg-white/95 backdrop-blur-xl border-0 shadow-2xl"
        aria-describedby="appointment-modal-description"
      >
        <DialogHeader className="space-y-4 flex-shrink-0 pb-4 border-b border-slate-200/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg" aria-hidden="true">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-800">
                  Today's Appointments
                </DialogTitle>
                <p id="appointment-modal-description" className="text-sm text-slate-500 mt-1">
                  Manage and view appointment details
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-white/90 border-slate-200 hover:bg-white hover:border-blue-300 transition-all duration-200"
              aria-label={isRefreshing ? "Refreshing appointments" : "Refresh appointments list"}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {/* Search Section */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" aria-hidden="true" />
              <Input
                placeholder="Search by patient name or phone..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-10 bg-white/90 border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 rounded-lg text-slate-700 placeholder:text-slate-400"
                aria-label="Search appointments by patient name or phone number"
                aria-describedby="search-results-count"
              />
            </div>
            
            {/* Results count */}
            <div className="flex items-center justify-between">
              <div 
                id="search-results-count"
                className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-sm"
                role="status"
                aria-live="polite"
              >
                {searchQuery ? (
                  <>Showing {filteredAppointments.length} of {appointments.length}</>
                ) : (
                  <>{appointments.length} appointments</>
                )}
              </div>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearchChange('')}
                  className="text-xs px-2 py-1 h-auto text-slate-500 hover:text-slate-700"
                  aria-label="Clear search and show all appointments"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'today' | 'pos-paid' | 'archived' | 'pending-prescriptions' | 'past-unpaid')} className="w-full flex flex-col flex-1">
          <TabsList 
            className="grid w-full grid-cols-5 bg-slate-100 p-1 rounded-lg"
            role="tablist"
            aria-label="Appointment categories"
          >
            <TabsTrigger 
              value="today" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
              role="tab"
              aria-selected={activeTab === 'today'}
              aria-controls="today-panel"
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Today's</span>
              <span className="sm:hidden">Today</span>
              <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium" aria-label={`${appointments.length} appointments`}>
                {appointments.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="pos-paid" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
              role="tab"
              aria-selected={activeTab === 'pos-paid'}
              aria-controls="pos-paid-panel"
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">POS Paid</span>
              <span className="sm:hidden">POS</span>
              <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium" aria-label={`${posPaidAppointments.filter(apt => apt.date === getTodayDate()).length} today's appointments`}>
                {posPaidAppointments.filter(apt => apt.date === getTodayDate()).length}
              </span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="archived" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
              role="tab"
              aria-selected={activeTab === 'archived'}
              aria-controls="archived-panel"
            >
              <FileText className="h-4 w-4 text-gray-600" />
              <span className="hidden sm:inline">Archived</span>
              <span className="sm:hidden">Archived</span>
              <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium" aria-label={`${archivedAppointments.filter(apt => apt.date === getTodayDate()).length} today's appointments`}>
                {archivedAppointments.filter(apt => apt.date === getTodayDate()).length}
              </span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="pending-prescriptions" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
              role="tab"
              aria-selected={activeTab === 'pending-prescriptions'}
              aria-controls="pending-prescriptions-panel"
            >
              <Pill className="h-4 w-4 text-purple-600" />
              <span className="hidden sm:inline">Pending Prescriptions</span>
              <span className="sm:hidden">Prescriptions</span>
              <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium" aria-label={`${pendingPrescriptionAppointments.filter(apt => apt.date === getTodayDate()).length} today's appointments`}>
                {pendingPrescriptionAppointments.filter(apt => apt.date === getTodayDate()).length}
              </span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="past-unpaid" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
              role="tab"
              aria-selected={activeTab === 'past-unpaid'}
              aria-controls="past-unpaid-panel"
            >
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="hidden sm:inline">Past Unpaid</span>
              <span className="sm:hidden">Past</span>
              <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium" aria-label={`${pastUnpaidAppointments.length} past unpaid appointments`}>
                {pastUnpaidAppointments.length}
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="mt-4 flex-1" id="today-panel" role="tabpanel" aria-labelledby="today-tab">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6" role="list" aria-label="Today's appointments">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-8" role="status" aria-live="polite">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3" aria-hidden="true">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700 mb-2">
                      {searchQuery ? 'No appointments found' : 'No appointments for today'}
                    </h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                      {searchQuery ? 'Try adjusting your search criteria' : 'Appointments for today will appear here once they are scheduled'}
                    </p>
                  </div>
                ) : (
                  <>
                    {Object.entries(groupAppointmentsBySession(filteredAppointments)).map(([sessionKey, sessionAppointments]) => {
                      const firstAppointment = sessionAppointments[0];
                      
                      // Get session times from the first appointment
                      const { startTime: sessionStartTime, endTime: sessionEndTime } = getSessionTimes(firstAppointment);
                      
                      return (
                        <div key={sessionKey} className="space-y-3 mb-6">
                          {/* Session Header */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                  <Users className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                  <h3 className="text-xl font-bold text-slate-800">
                                  Dr. {firstAppointment.doctorName}
                                </h3>
                                  <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatAppointmentDate(firstAppointment.date)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatTime(sessionStartTime)} - {formatTime(sessionEndTime)}
                                  </span>
                                </div>
                              </div>
                              </div>
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1.5">
                                <Users className="h-4 w-4 mr-1" />
                                {sessionAppointments.length} Patient{sessionAppointments.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Session Appointments Table */}
                          <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-lg">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gradient-to-r from-slate-100 to-blue-50 border-b-2 border-slate-300">
                                  <TableHead className="font-bold text-slate-900 w-[4%] text-center py-4">#</TableHead>
                                  <TableHead className="font-bold text-slate-900 w-[16%] py-4">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-blue-600" />
                                      Patient Info
                        </div>
                                  </TableHead>
                                  <TableHead className="font-bold text-slate-900 w-[10%] py-4">
                              <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-green-600" />
                                      Contact
                              </div>
                                  </TableHead>
                                  <TableHead className="font-bold text-slate-900 w-[8%] text-center py-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <Users className="h-4 w-4 text-blue-600" />
                                      Session #
                          </div>
                                  </TableHead>
                                  <TableHead className="font-bold text-slate-900 w-[12%] text-center py-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-amber-600" />
                                      Arrival
                        </div>
                                  </TableHead>
                                  <TableHead className="font-bold text-slate-900 w-[10%] text-center py-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <CreditCard className="h-4 w-4 text-emerald-600" />
                                      Payment
                      </div>
                                  </TableHead>
                                  <TableHead className="font-bold text-slate-900 w-[12%] text-center py-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <Pill className="h-4 w-4 text-purple-600" />
                                      Prescription
                            </div>
                                  </TableHead>
                                  <TableHead className="font-bold text-slate-900 w-[10%] text-center py-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <Pill className="h-4 w-4 text-green-600" />
                                      Pharmacy
                                </div>
                                  </TableHead>
                                  <TableHead className="font-bold text-slate-900 w-[18%] text-center py-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <Eye className="h-4 w-4 text-blue-600" />
                                      Actions
                                </div>
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sessionAppointments.map((appointment, index) => (
                                  <TableRow 
                                    key={appointment.id} 
                                    className={`
                                      ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                                      hover:bg-blue-50/50 transition-all duration-200 border-b border-slate-200
                                      ${appointment.isPatientArrived ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-transparent'}
                                      ${appointment.payment?.isPaid ? 'border-r-4 border-r-emerald-500' : 'border-r-4 border-r-transparent'}
                                    `}
                                  >
                                    {/* Index */}
                                    <TableCell className="text-center py-4">
                                      <div className="flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                          {index + 1}
                            </div>
                          </div>
                                    </TableCell>
                                    
                                    {/* Patient Name */}
                                    <TableCell className="py-4">
                                      <div className="space-y-1.5">
                                        <div className="font-bold text-slate-900 text-base leading-tight">{appointment.patientName}</div>
                                        <div className="flex items-center gap-1.5">
                                          <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-300 font-mono">
                                            #{generateAppointmentNumber(appointment.id)}
                          </Badge>
                                          {/* Multiple Patients Indicator */}
                                          {appointment.id && allPrescriptionsByAppointment[appointment.id] && allPrescriptionsByAppointment[appointment.id].length > 1 && (
                                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1">
                                              <Users className="h-3 w-3" />
                                              {allPrescriptionsByAppointment[appointment.id].length} patients
                                            </Badge>
                                          )}
                                        </div>
                                        {(appointment as any).createdBy?.uid ? (
                                          <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                                            <UserCheck className="h-3 w-3" />
                                            <span className="font-medium">{creatorNames[(appointment as any).createdBy.uid] || 'Loading...'}</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                                              Legacy
                          </Badge>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => updateLegacyAppointment(appointment.id!)}
                                              className="h-5 px-2 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                            >
                                              Update
                                            </Button>
                            </div>
                            )}
                          </div>
                                    </TableCell>
                                    
                                    {/* Contact */}
                                    <TableCell className="py-4">
                                      <div className="flex items-center gap-2 text-sm text-slate-800 bg-green-50 px-3 py-2 rounded-lg w-fit font-medium">
                          <Phone className="h-4 w-4 text-green-600" />
                            {appointment.patientContact}
                        </div>
                                    </TableCell>
                                    
                                    {/* Session Number */}
                                    <TableCell className="text-center py-4">
                                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 font-bold text-sm px-3 py-1.5 shadow-md">
                                        #{appointment.sessionAppointmentNumber || 'N/A'}
                                      </Badge>
                                    </TableCell>
                                    
                                    {/* Arrival Status */}
                                    <TableCell className="text-center py-4">
                                      <div className="flex flex-col items-center gap-2">
                              {appointment.isPatientArrived ? (
                                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 font-semibold shadow-md px-3 py-1.5 text-xs">
                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                  Arrived
                                          </Badge>
                              ) : (
                                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 font-semibold shadow-md px-3 py-1.5 text-xs animate-pulse">
                                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                                  Pending
                            </Badge>
                            )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleArrival(appointment.id!, appointment.isPatientArrived || false)}
                            disabled={processingArrival === appointment.id}
                                          className={`h-8 w-full text-xs font-semibold shadow-sm transition-all duration-200 ${
                              appointment.isPatientArrived 
                                              ? 'bg-red-50 border-2 border-red-400 text-red-700 hover:bg-red-100 hover:border-red-500' 
                                              : 'bg-green-50 border-2 border-green-400 text-green-700 hover:bg-green-100 hover:border-green-500'
                            }`}
                          >
                            {processingArrival === appointment.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                {appointment.isPatientArrived ? (
                                  <>
                                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Unmark
                                  </>
                                ) : (
                                  <>
                                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Mark Arrived
                                  </>
                                )}
                              </>
                            )}
                          </Button>
                        </div>
                                    </TableCell>
                                    
                                    {/* Payment Status */}
                                    <TableCell className="text-center py-4">
                                      {appointment.payment?.isPaid ? (
                                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 font-bold shadow-md px-4 py-2 text-sm">
                                          <CreditCard className="h-4 w-4 mr-1.5" />
                                          Paid
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 font-bold shadow-md px-4 py-2 text-sm">
                                          <Clock className="h-4 w-4 mr-1.5" />
                                          Pending
                                        </Badge>
                                      )}
                                    </TableCell>
                                    
                                    {/* Prescription Status */}
                                    <TableCell className="text-center py-4">
                          {appointment.id && appointmentPrescriptions[appointment.id] ? (
                                        <div className="flex flex-col items-center gap-1.5">
                                          <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                    Available
                                  </Badge>
                                          <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-full">
                                            <Pill className="h-3 w-3 text-purple-600" />
                                            <span className="text-xs font-semibold text-purple-700">
                                              {appointmentPrescriptions[appointment.id].medicines?.length || 0} meds
                                            </span>
                                </div>
                              </div>
                                      ) : (
                                        <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                          <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                          None
                                        </Badge>
                                      )}
                                    </TableCell>
                                    
                                    {/* Pharmacy Review Status */}
                                    <TableCell className="text-center py-4">
                                      {appointment.pharmacyReviewStatus === 'reviewed' ? (
                                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                          Reviewed
                                        </Badge>
                                      ) : appointment.pharmacyReviewStatus === 'pending' ? (
                                        <Badge className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs animate-pulse">
                                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                                          Pending
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-gradient-to-r from-gray-400 to-slate-500 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                          <Minus className="h-3.5 w-3.5 mr-1.5" />
                                          N/A
                                        </Badge>
                                      )}
                                    </TableCell>
                                    
                                    {/* Actions */}
                                    <TableCell className="text-center py-4">
                                      <div className="flex flex-col gap-2">
                                        <Button
                                          onClick={() => handleNavigateToSession(appointment)}
                                          size="sm"
                                          className="w-full h-9 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                        >
                                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                                          View Session
                                        </Button>
                                        {appointment.id && appointmentPrescriptions[appointment.id] && onLoadPrescriptionToPOS && (
                                          <div className="flex flex-col gap-2">
                                            <div className="transform hover:scale-105 transition-transform duration-200">
                                  <LoadPrescriptionToPOSButton
                                    appointment={appointment}
                                    prescription={appointmentPrescriptions[appointment.id]}
                                    onLoadToPOS={onLoadPrescriptionToPOS}
                                  />
                                            </div>
                                            <div className="transform hover:scale-105 transition-transform duration-200">
                                  <CombinedPrintButton
                                    appointment={appointment}
                                    prescription={appointmentPrescriptions[appointment.id]}
                                    referralLetter={appointmentReferralLetters[appointment.id]}
                                  />
                              </div>
                            </div>
                          )}
                        </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          

          <TabsContent value="pos-paid" className="mt-6 flex-1">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <CreditCard className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                      {searchQuery ? 'No appointments found' : 'No POS-paid appointments for today'}
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      {searchQuery ? 'Try adjusting your search criteria' : 'Today\'s appointments paid through POS will appear here'}
                    </p>
                  </div>
                ) : (
                  filteredAppointments.map((appointment, index) => (
                    <Card key={appointment.id} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden group">
                      <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50/50 border-b border-green-100">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
                              <CreditCard className="h-6 w-6 text-white" />
                            </div>
                            <div className="space-y-1">
                              <CardTitle className="text-xl font-bold text-slate-800">
                                {appointment.patientName}
                              </CardTitle>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                #{generateAppointmentNumber(appointment.id)}
                                </span>
                                {/* Multiple Patients Indicator */}
                                {appointment.id && allPrescriptionsByAppointment[appointment.id] && allPrescriptionsByAppointment[appointment.id].length > 1 && (
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {allPrescriptionsByAppointment[appointment.id].length} patients
                                  </Badge>
                                )}
                                <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                                <Users className="h-3 w-3" />
                                  Session #{appointment.sessionAppointmentNumber || 'N/A'}
                                </span>
                                <span className="flex items-center gap-1 text-green-600 font-medium">
                                <CreditCard className="h-4 w-4" />
                                POS Sale ID: {appointment.payment?.posSaleId || 'N/A'}
                                </span>
                                {(appointment as any).createdBy?.uid ? (
                                  <span className="flex items-center gap-1 text-blue-600">
                                    <UserCheck className="h-4 w-4" />
                                    Created by: {creatorNames[(appointment as any).createdBy.uid] || 'Loading...'}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-gray-500" title="This appointment was created before user tracking was implemented">
                                      <UserCheck className="h-4 w-4" />
                                      Created by: Legacy System
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        console.log('🖱️ Update button clicked for appointment:', appointment.id);
                                        updateLegacyAppointment(appointment.id!);
                                      }}
                                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      title="Update with your information"
                                    >
                                      Update
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 text-xs font-medium shadow-sm">
                              <CreditCard className="h-3 w-3 mr-1.5" />
                              POS Paid
                            </Badge>
                            {appointment.isPatientArrived ? (
                              <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 px-3 py-1.5 text-xs font-medium shadow-sm">
                                <CheckCircle2 className="h-3 w-3 mr-1.5" />
                                Arrived
                              </Badge>
                            ) : (
                              <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200 px-3 py-1.5 text-xs font-medium shadow-sm">
                                <Clock className="h-3 w-3 mr-1.5" />
                                Pending Arrival
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Doctor Information */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                              <span className="text-sm font-semibold text-slate-700">Doctor</span>
                            </div>
                            <div className="pl-11">
                              <p className="font-bold text-slate-900 text-lg">{appointment.doctorName}</p>
                            </div>
                          </div>

                          {/* Patient Phone */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                              <Phone className="h-4 w-4 text-green-600" />
                            </div>
                              <span className="text-sm font-semibold text-slate-700">Contact</span>
                            </div>
                            <div className="pl-11">
                              <p className="font-semibold text-slate-900 text-lg">
                                {appointment.patientContact}
                              </p>
                            </div>
                          </div>

                          {/* Payment Status */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-100 rounded-lg">
                              <CreditCard className="h-4 w-4 text-emerald-600" />
                            </div>
                              <span className="text-sm font-semibold text-slate-700">Payment Status</span>
                            </div>
                            <div className="pl-11 space-y-2">
                              <p className="text-sm text-slate-600 font-medium">
                                {appointment.payment?.paidBy || 'Cash'}
                              </p>
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs text-green-700 font-medium">
                                  ✅ Paid: {appointment.payment?.paidAt ? format(new Date(appointment.payment.paidAt), 'MMM dd, yyyy HH:mm') : 'Unknown'}
                              </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>


          <TabsContent value="archived" className="mt-6 flex-1">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <FileText className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                      {searchQuery ? 'No appointments found' : 'No archived appointments for today'}
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      {searchQuery ? 'Try adjusting your search criteria' : 'Today\'s paid appointments will be automatically archived and appear here'}
                    </p>
                  </div>
                ) : (
                  filteredAppointments.map((appointment, index) => (
                    <Card key={appointment.id} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden group">
                      <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-slate-50/50 border-b border-gray-100">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
                              <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div className="space-y-1">
                              <CardTitle className="text-xl font-bold text-slate-800">
                                {appointment.patientName}
                              </CardTitle>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  #{generateAppointmentNumber(appointment.id)}
                                </span>
                                {/* Multiple Patients Indicator */}
                                {appointment.id && allPrescriptionsByAppointment[appointment.id] && allPrescriptionsByAppointment[appointment.id].length > 1 && (
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {allPrescriptionsByAppointment[appointment.id].length} patients
                                  </Badge>
                                )}
                                <span className="flex items-center gap-1 text-gray-600 font-medium">
                                  <FileText className="h-4 w-4" />
                                  Archived
                                </span>
                                {appointment.archivedAt && (
                                  <span className="flex items-center gap-1 text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    Archived: {format(new Date(appointment.archivedAt), 'MMM dd, yyyy HH:mm')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200 px-3 py-1.5 text-xs font-medium shadow-sm">
                              <FileText className="h-3 w-3 mr-1.5" />
                              Archived
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-semibold text-slate-700">Patient Info</span>
                            </div>
                            <div className="pl-11 space-y-2">
                              <p className="font-bold text-slate-900">{appointment.patientName}</p>
                              <p className="text-sm text-slate-600">{appointment.patientContact}</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-100 rounded-lg">
                                <CreditCard className="h-4 w-4 text-emerald-600" />
                              </div>
                              <span className="text-sm font-semibold text-slate-700">Payment Status</span>
                            </div>
                            <div className="pl-11 space-y-2">
                              <p className="text-sm text-slate-600 font-medium">
                                {appointment.payment?.paidBy || 'Cash'}
                              </p>
                              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-xs text-gray-700 font-medium">
                                  ✅ Paid: {appointment.payment?.paidAt ? format(new Date(appointment.payment.paidAt), 'MMM dd, yyyy HH:mm') : 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="pending-prescriptions" className="mt-6 flex-1" id="pending-prescriptions-panel" role="tabpanel" aria-labelledby="pending-prescriptions-tab">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6" role="list" aria-label="Pending prescription appointments">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <Pill className="h-8 w-8 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                      {searchQuery ? 'No appointments found' : 'No pending prescriptions for today'}
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      {searchQuery ? 'Try adjusting your search criteria' : 'Today\'s appointments with prescriptions that haven\'t been loaded to POS will appear here'}
                    </p>
                  </div>
                ) : (
                  filteredAppointments.map((appointment, index) => (
                    <Card key={appointment.id} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden group">
                      <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-violet-50/50 border-b border-purple-100">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
                              <Pill className="h-6 w-6 text-white" />
                            </div>
                            <div className="space-y-1">
                              <CardTitle className="text-xl font-bold text-slate-800">
                                {appointment.patientName}
                              </CardTitle>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  #{generateAppointmentNumber(appointment.id)}
                                </span>
                                {/* Multiple Patients Indicator */}
                                {appointment.id && allPrescriptionsByAppointment[appointment.id] && allPrescriptionsByAppointment[appointment.id].length > 1 && (
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {allPrescriptionsByAppointment[appointment.id].length} patients
                                  </Badge>
                                )}
                                <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                                  <Users className="h-3 w-3" />
                                  Session #{appointment.sessionAppointmentNumber || 'N/A'}
                                </span>
                                <span className="flex items-center gap-1 text-purple-600 font-medium">
                                  <Pill className="h-4 w-4" />
                                  Prescription Available
                                </span>
                                {(appointment as any).createdBy?.uid ? (
                                  <span className="flex items-center gap-1 text-blue-600">
                                    <UserCheck className="h-4 w-4" />
                                    Created by: {creatorNames[(appointment as any).createdBy.uid] || 'Loading...'}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-gray-500" title="This appointment was created before user tracking was implemented">
                                      <UserCheck className="h-4 w-4" />
                                      Created by: Legacy System
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        console.log('🖱️ Update button clicked for appointment:', appointment.id);
                                        updateLegacyAppointment(appointment.id!);
                                      }}
                                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      title="Update with your information"
                                    >
                                      Update
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200 px-3 py-1.5 text-xs font-medium shadow-sm">
                              <Pill className="h-3 w-3 mr-1.5" />
                              Pending Prescription
                            </Badge>
                            {appointment.isPatientArrived ? (
                              <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 px-3 py-1.5 text-xs font-medium shadow-sm">
                                <CheckCircle2 className="h-3 w-3 mr-1.5" />
                                Arrived
                              </Badge>
                            ) : (
                              <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200 px-3 py-1.5 text-xs font-medium shadow-sm">
                                <Clock className="h-3 w-3 mr-1.5" />
                                Pending Arrival
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Doctor Information */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-semibold text-slate-700">Doctor</span>
                            </div>
                            <div className="pl-11">
                              <p className="font-bold text-slate-900 text-lg">{appointment.doctorName}</p>
                            </div>
                          </div>

                          {/* Patient Phone */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <Phone className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="text-sm font-semibold text-slate-700">Contact</span>
                            </div>
                            <div className="pl-11">
                              <p className="font-semibold text-slate-900 text-lg">
                                {appointment.patientContact}
                              </p>
                            </div>
                          </div>

                          {/* Prescription Status */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Pill className="h-4 w-4 text-purple-600" />
                              </div>
                              <span className="text-sm font-semibold text-slate-700">Prescription Status</span>
                            </div>
                            <div className="pl-11 space-y-2">
                              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-xs text-purple-700 font-medium">
                                  💊 Prescription ready to load to POS
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Prescription Action Buttons */}
                        <div className="pt-6 border-t border-slate-200">
                          {onLoadPrescriptionToPOS && appointmentPrescriptions[appointment.id!] && (
                            <div className="space-y-3">
                              <div className="flex gap-3">
                                <Button
                                  onClick={() => handleOpenPharmacyPOS(appointment)}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                                >
                                  <Pill className="h-4 w-4 mr-2" />
                                  Review & Load to POS
                                </Button>
                                <LoadPrescriptionToPOSButton
                                  appointment={appointment}
                                  prescription={appointmentPrescriptions[appointment.id!]}
                                  onLoadToPOS={handleLoadPrescriptionToPOS}
                                />
                              </div>
                              <p className="text-xs text-slate-500 text-center">
                                Use "Review & Load to POS" for pharmacy review, or "Load to POS" for direct loading
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="past-unpaid" className="mt-6 flex-1" id="past-unpaid-panel" role="tabpanel" aria-labelledby="past-unpaid-tab">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6" role="list" aria-label="Past unpaid appointments">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12" role="status" aria-live="polite">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm" aria-hidden="true">
                      <Calendar className="h-8 w-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                      {searchQuery ? 'No appointments found' : 'No past unpaid appointments'}
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      {searchQuery ? 'Try adjusting your search criteria' : 'Past appointments that haven\'t been paid will appear here for import to today\'s sessions'}
                    </p>
                  </div>
                ) : (
                  (() => {
                    // Group appointments by date for better organization
                    const groupedAppointments = filteredAppointments.reduce((groups, appointment) => {
                      const date = appointment.date;
                      if (!groups[date]) {
                        groups[date] = [];
                      }
                      groups[date].push(appointment);
                      return groups;
                    }, {} as {[date: string]: Appointment[]});

                    return Object.entries(groupedAppointments)
                      .sort(([a], [b]) => b.localeCompare(a)) // Sort dates newest first
                      .map(([date, dateAppointments]) => (
                        <div key={date} className="space-y-4">
                          {/* Date Header */}
                          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                  <Calendar className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-slate-800">
                                    {formatAppointmentDate(date)}
                                  </h3>
                                  <p className="text-sm text-slate-600">
                                    {dateAppointments.length} unpaid appointment{dateAppointments.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Appointments for this date */}
                          <div className="space-y-4">
                            {dateAppointments.map((appointment, index) => (
                              <Card key={appointment.id} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden group">
                                <CardHeader className="pb-4 bg-gradient-to-r from-orange-50 to-amber-50/50 border-b border-orange-100">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                      <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
                                        <Calendar className="h-6 w-6 text-white" />
                                      </div>
                                      <div className="space-y-1">
                                        <CardTitle className="text-xl font-bold text-slate-800">
                                          {appointment.patientName}
                                        </CardTitle>
                                        <div className="flex items-center gap-4 text-sm text-slate-600">
                                          <span className="flex items-center gap-1">
                                            <FileText className="h-4 w-4" />
                                            #{generateAppointmentNumber(appointment.id)}
                                          </span>
                                          {/* Multiple Patients Indicator */}
                                          {appointment.id && allPrescriptionsByAppointment[appointment.id] && allPrescriptionsByAppointment[appointment.id].length > 1 && (
                                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1">
                                              <Users className="h-3 w-3" />
                                              {allPrescriptionsByAppointment[appointment.id].length} patients
                                            </Badge>
                                          )}
                                          <span className="flex items-center gap-1 text-orange-600 font-medium">
                                            <Calendar className="h-4 w-4" />
                                            {appointment.date}
                                          </span>
                                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                                            <CreditCard className="h-4 w-4" />
                                            Payment Pending
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 px-3 py-1.5 text-xs font-medium shadow-sm">
                                        <CreditCard className="h-3 w-3 mr-1.5" />
                                        Payment Pending
                                      </Badge>
                                      <Badge className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200 px-3 py-1.5 text-xs font-medium shadow-sm">
                                        <Calendar className="h-3 w-3 mr-1.5" />
                                        Past Date
                                      </Badge>
                                    </div>
                                  </div>
                                </CardHeader>
                                
                                <CardContent className="space-y-6 p-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Doctor Information */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                          <Users className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700">Doctor</span>
                                      </div>
                                      <div className="pl-11">
                                        <p className="font-bold text-slate-900 text-lg">{appointment.doctorName}</p>
                                      </div>
                                    </div>

                                    {/* Patient Phone */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                          <Phone className="h-4 w-4 text-green-600" />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700">Contact</span>
                                      </div>
                                      <div className="pl-11">
                                        <p className="font-semibold text-slate-900 text-lg">
                                          {appointment.patientContact}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Total Charge */}
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 rounded-lg">
                                          <CreditCard className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700">Total Charge</span>
                                      </div>
                                      <div className="pl-11">
                                        <p className="text-lg font-bold text-slate-900">
                                          {formatCurrency(appointment.totalCharge)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Procedures */}
                                  {appointment.procedures && appointment.procedures.length > 0 && (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                          <FileText className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700">Procedures</span>
                                      </div>
                                      <div className="pl-11 space-y-2">
                                        {appointment.procedures.map((procedure, procIndex) => (
                                          <div key={procIndex} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                            <span className="font-medium text-slate-700">{procedure.procedureName}</span>
                                            <span className="text-sm font-semibold text-slate-600">
                                              {formatCurrency(procedure.doctorCharge)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Import Action Button */}
                                  <div className="pt-6 border-t border-slate-200">
                                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <div className="flex items-center gap-2 text-sm text-blue-700">
                                        <Users className="h-4 w-4" />
                                        <span className="font-medium">Import Information:</span>
                                      </div>
                                      <p className="text-xs text-blue-600 mt-1">
                                        This appointment will be imported to today's session for Dr. {appointment.doctorName}. 
                                        If multiple sessions exist, you'll be able to choose which one.
                                      </p>
                                    </div>
                                    <Button
                                      onClick={() => handleImportAppointment(appointment)}
                                      disabled={importingAppointment === appointment.id}
                                      className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                      {importingAppointment === appointment.id ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Importing...
                                        </>
                                      ) : (
                                        <>
                                          <RefreshCw className="h-4 w-4 mr-2" />
                                          Import to Today's Session
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ));
                  })()
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
      
      {/* Session Selection Modal */}
      <SessionSelectionModal
        isOpen={showSessionSelection}
        onClose={() => {
          setShowSessionSelection(false);
          setSelectedAppointmentForImport(null);
          setAvailableSessions([]);
        }}
        onSelectSession={handleSessionSelection}
        sessions={availableSessions}
        doctorName={selectedAppointmentForImport?.doctorName || ''}
        appointmentPatientName={selectedAppointmentForImport?.patientName || ''}
        importingAppointment={!!importingAppointment}
      />

      {/* Pharmacy POS Modal */}
      {showPharmacyPOS && selectedAppointmentForPharmacy && appointmentPrescriptions[selectedAppointmentForPharmacy.id!] && (
        <Dialog open={showPharmacyPOS} onOpenChange={setShowPharmacyPOS}>
          <DialogContent className="max-w-7xl max-h-[95vh] bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-slate-800">
                Pharmacy Review - {selectedAppointmentForPharmacy.patientName}
              </DialogTitle>
            </DialogHeader>
            <PharmacyPOS
              appointment={selectedAppointmentForPharmacy}
              prescription={appointmentPrescriptions[selectedAppointmentForPharmacy.id!]}
              onBack={handlePharmacyPOSBack}
              onLoadToMainPOS={handlePharmacyLoadToMainPOS}
            />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

