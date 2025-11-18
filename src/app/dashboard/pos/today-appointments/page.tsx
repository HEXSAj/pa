// src/app/dashboard/pos/today-appointments/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Appointment, formatAppointmentDate, getSessionTimeFromId } from '@/types/appointment';
import { Prescription } from '@/types/prescription';
import { ReferralLetter } from '@/types/referralLetter';
import { prescriptionService } from '@/services/prescriptionService';
import { staffService } from '@/services/staffService';
import { referralLetterService } from '@/services/referralLetterService';
import { appointmentService } from '@/services/appointmentService';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  RefreshCw,
  Search,
  Pill,
  Loader2,
  UserCheck,
  Calendar,
  Minus,
  ArrowLeft,
  Plus,
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  UserCircle2,
  Archive,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Maximize,
  Minimize
} from 'lucide-react';
import { toast } from "sonner";
import { format } from 'date-fns';
import { CombinedPrintButton } from '../CombinedPrintButton';
import { useAuth } from '@/context/AuthContext';
import withAuth from '@/components/withAuth';
import SessionDetailsModal from '../../appointments/SessionDetailsModal';
import AppointmentModal from '../../appointments/AppointmentModal';
import { database, auth } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { LoadPrescriptionToPOSButton } from '../LoadPrescriptionToPOSButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import DocumentUploadModal from './DocumentUploadModal';

function TodayAppointmentsPage() {
  const router = useRouter();
  const { user, userRole, logout } = useAuth();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [appointmentPrescriptions, setAppointmentPrescriptions] = useState<{[appointmentId: string]: Prescription}>({});
  const [allPrescriptionsByAppointment, setAllPrescriptionsByAppointment] = useState<{[appointmentId: string]: Prescription[]}>({});
  const [appointmentReferralLetters, setAppointmentReferralLetters] = useState<{[appointmentId: string]: ReferralLetter}>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingArrival, setProcessingArrival] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today'>('today');
  const [creatorNames, setCreatorNames] = useState<{[userId: string]: string}>({});
  const [userDisplayName, setUserDisplayName] = useState('');
  const [showArchivedAppointments, setShowArchivedAppointments] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPrescriptionByAppointment, setSelectedPrescriptionByAppointment] = useState<{[appointmentId: string]: string | null}>({});
  const [locallyLoadedPrescriptions, setLocallyLoadedPrescriptions] = useState<{[prescriptionId: string]: boolean}>({});
  
  // Session details modal state
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [selectedSessionData, setSelectedSessionData] = useState<{
    doctorName: string;
    doctorSpeciality: string;
    date: string;
    startTime: string;
    endTime: string;
    appointments: Appointment[];
  } | null>(null);
  
  // Edit appointment modal state
  const [showEditAppointment, setShowEditAppointment] = useState(false);
  const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState<Appointment | null>(null);
  
  // Create appointment modal state
  const [showCreateAppointment, setShowCreateAppointment] = useState(false);
  
  // Document upload modal state
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedAppointmentForDocuments, setSelectedAppointmentForDocuments] = useState<Appointment | null>(null);
  
  // Real-time listener for today's appointments with prescriptions and referral letters
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    console.log('🔥 Setting up real-time listener for appointments on:', today);
    
    // Create query for today's appointments
    const appointmentsRef = ref(database, 'appointments');
    const appointmentsQuery = query(appointmentsRef, orderByChild('date'), equalTo(today));
    
    // Maps to store listener refs and data
    const prescriptionListeners = new Map<string, any>();
    const referralLetterListeners = new Map<string, any>();
    const creatorNamesMap = new Map<string, string>();
    
    const handleAppointmentsUpdate = (snapshot: any) => {
      console.log('📊 Real-time appointments update received');
      
      const currentAppointmentIds = new Set<string>();
      const appointmentsData: Appointment[] = [];
      
      snapshot.forEach((childSnapshot: any) => {
        const data = childSnapshot.val();
        const appointmentId = childSnapshot.key;
        
        if (!appointmentId) return;
        
        currentAppointmentIds.add(appointmentId);
        
        const appointment: Appointment = {
          ...data,
          id: appointmentId,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        };
        
        appointmentsData.push(appointment);
        
        // Load creator name if available
        const createdBy = data.createdBy;
        if (createdBy?.uid && !creatorNamesMap.has(createdBy.uid)) {
          staffService.getStaffById(createdBy.uid).then(staffData => {
            if (staffData) {
              setCreatorNames(prev => ({
                ...prev,
                [createdBy.uid]: staffData.displayName || staffData.email || 'Unknown'
              }));
              creatorNamesMap.set(createdBy.uid, staffData.displayName || staffData.email || 'Unknown');
            }
          }).catch(error => {
            console.error('Error loading creator name:', error);
          });
        }
        
        // Set up real-time listener for prescription if not already listening
        if (!prescriptionListeners.has(appointmentId)) {
          const prescriptionsRef = ref(database, 'prescriptions');
          const prescriptionQuery = query(prescriptionsRef, orderByChild('appointmentId'), equalTo(appointmentId));
          
          const handlePrescriptionUpdate = (prescriptionSnapshot: any) => {
            if (prescriptionSnapshot.exists()) {
              const prescriptions: Prescription[] = [];
              prescriptionSnapshot.forEach((prescChildSnapshot: any) => {
                const prescData = prescChildSnapshot.val();
                const prescription: Prescription = {
                  ...prescData,
                  id: prescChildSnapshot.key,
                  createdAt: prescData.createdAt ? new Date(prescData.createdAt) : new Date(),
                  updatedAt: prescData.updatedAt ? new Date(prescData.updatedAt) : new Date(),
                };
                prescriptions.push(prescription);
              });
              
              // Store all prescriptions for this appointment
              setAllPrescriptionsByAppointment(prev => ({
                ...prev,
                [appointmentId]: prescriptions
              }));
              
              // Store first prescription for backward compatibility
              if (prescriptions.length > 0) {
                setAppointmentPrescriptions(prev => ({
                  ...prev,
                  [appointmentId]: prescriptions[0]
                }));
              }
            } else {
              setAllPrescriptionsByAppointment(prev => {
                const newPrescriptions = { ...prev };
                delete newPrescriptions[appointmentId];
                return newPrescriptions;
              });
              setAppointmentPrescriptions(prev => {
                const newPrescriptions = { ...prev };
                delete newPrescriptions[appointmentId];
                return newPrescriptions;
              });
            }
          };
          
          onValue(prescriptionQuery, handlePrescriptionUpdate, (error) => {
            console.error(`Error listening to prescription for appointment ${appointmentId}:`, error);
          });
          
          prescriptionListeners.set(appointmentId, prescriptionQuery);
        }
        
        // Set up real-time listener for referral letter if not already listening
        if (!referralLetterListeners.has(appointmentId)) {
          const referralLettersRef = ref(database, 'referralLetters');
          const referralLetterQuery = query(referralLettersRef, orderByChild('appointmentId'), equalTo(appointmentId));
          
          const handleReferralLetterUpdate = (referralSnapshot: any) => {
            if (referralSnapshot.exists()) {
              referralSnapshot.forEach((refChildSnapshot: any) => {
                const refData = refChildSnapshot.val();
                const referralLetter: ReferralLetter = {
                  ...refData,
                  id: refChildSnapshot.key,
                  createdAt: refData.createdAt ? new Date(refData.createdAt) : new Date(),
                  updatedAt: refData.updatedAt ? new Date(refData.updatedAt) : new Date(),
                };
                
                setAppointmentReferralLetters(prev => ({
                  ...prev,
                  [appointmentId]: referralLetter
                }));
              });
            } else {
              setAppointmentReferralLetters(prev => {
                const newReferralLetters = { ...prev };
                delete newReferralLetters[appointmentId];
                return newReferralLetters;
              });
            }
          };
          
          onValue(referralLetterQuery, handleReferralLetterUpdate, (error) => {
            console.error(`Error listening to referral letter for appointment ${appointmentId}:`, error);
          });
          
          referralLetterListeners.set(appointmentId, referralLetterQuery);
        }
      });
      
      // Update appointments state
      setAppointments(appointmentsData);
      setFilteredAppointments(appointmentsData);
      
      // Clean up listeners for removed appointments
      prescriptionListeners.forEach((listenerRef, appointmentId) => {
        if (!currentAppointmentIds.has(appointmentId)) {
          off(listenerRef);
          prescriptionListeners.delete(appointmentId);
        }
      });
      
      referralLetterListeners.forEach((listenerRef, appointmentId) => {
        if (!currentAppointmentIds.has(appointmentId)) {
          off(listenerRef);
          referralLetterListeners.delete(appointmentId);
        }
      });
      
      setLoading(false);
      console.log('✅ Real-time appointments updated:', appointmentsData.length);
    };
    
    onValue(appointmentsQuery, handleAppointmentsUpdate, (error) => {
      console.error('❌ Error listening to appointments:', error);
      toast.error('Error loading appointments. Please refresh.');
      setLoading(false);
    });
    
    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time listeners');
      off(appointmentsQuery);
      prescriptionListeners.forEach((listenerRef) => {
        off(listenerRef);
      });
      referralLetterListeners.forEach((listenerRef) => {
        off(listenerRef);
      });
      prescriptionListeners.clear();
      referralLetterListeners.clear();
    };
  }, [user]);

  const loadTodayAppointments = async () => {
    // This function is now only used for manual refresh
    if (!user?.uid) {
      return;
    }

    try {
      setIsRefreshing(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's appointments
      const todayAppointments = await appointmentService.getAppointmentsByDateRange(today, today);
      console.log('Manual refresh: Loaded appointments for today:', today, todayAppointments.length);
      
      // Load prescriptions and referral letters for each appointment
      const prescriptions: {[key: string]: Prescription} = {};
      const allPrescriptionsByAppt: {[key: string]: Prescription[]} = {};
      const referralLetters: {[key: string]: ReferralLetter} = {};
      const creatorNamesMap: {[key: string]: string} = {};
      
      for (const appointment of todayAppointments) {
        if (appointment.id) {
          try {
            // Load ALL prescriptions for multi-patient support
            const allPrescriptions = await prescriptionService.getAllPrescriptionsByAppointmentId(appointment.id);
            if (allPrescriptions.length > 0) {
              allPrescriptionsByAppt[appointment.id] = allPrescriptions;
              // Store first prescription for backward compatibility
              prescriptions[appointment.id] = allPrescriptions[0];
            }
          } catch (error) {
            console.error(`Error loading prescriptions for appointment ${appointment.id}:`, error);
          }

          try {
            const referralLetter = await referralLetterService.getReferralLetterByAppointmentId(appointment.id);
            if (referralLetter) {
              referralLetters[appointment.id] = referralLetter;
            }
          } catch (error) {
            console.error(`Error loading referral letter for appointment ${appointment.id}:`, error);
          }

          // Load creator name
          const createdBy = (appointment as any).createdBy;
          if (createdBy?.uid && !creatorNamesMap[createdBy.uid]) {
            try {
              const staffData = await staffService.getStaffById(createdBy.uid);
              if (staffData) {
                creatorNamesMap[createdBy.uid] = staffData.displayName || staffData.email || 'Unknown';
              }
            } catch (error) {
              console.error('Error loading creator name:', error);
            }
          }
        }
      }
      
      setAppointments(todayAppointments);
      setFilteredAppointments(todayAppointments);
      setAppointmentPrescriptions(prescriptions);
      setAllPrescriptionsByAppointment(allPrescriptionsByAppt);
      setAppointmentReferralLetters(referralLetters);
      setCreatorNames(creatorNamesMap);
      toast.success('Appointments refreshed');
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
      await loadTodayAppointments();
  };

  // Load user display name
  useEffect(() => {
    const loadUserDisplayName = async () => {
      if (user?.uid) {
        try {
          const staffData = await staffService.getStaffById(user.uid);
          if (staffData) {
            setUserDisplayName(staffData.displayName || staffData.email || 'User');
          } else {
            setUserDisplayName(user.email || 'User');
          }
    } catch (error) {
          console.error('Error loading user display name:', error);
          setUserDisplayName(user.email || 'User');
        }
      }
    };
    loadUserDisplayName();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout(); // Use the context logout function which handles auto clock-out
      window.location.href = '/'; // Redirect to root path
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard/attendance');
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredAppointments(appointments);
    } else {
      const filtered = appointments.filter(apt => 
        apt.patientName.toLowerCase().includes(query.toLowerCase()) ||
        apt.patientContact?.includes(query)
      );
      setFilteredAppointments(filtered);
    }
  };

  const handleToggleArrival = async (appointmentId: string, currentStatus: boolean) => {
    setProcessingArrival(appointmentId);
    try {
      await appointmentService.updateAppointment(appointmentId, {
        isPatientArrived: !currentStatus,
        patientArrivedAt: !currentStatus ? Date.now() : null
      });
      
      await loadTodayAppointments();
      toast.success(`Patient arrival status updated`);
    } catch (error) {
      console.error('Error updating arrival status:', error);
      toast.error('Failed to update arrival status');
    } finally {
      setProcessingArrival(null);
    }
  };

  const generateAppointmentNumber = (id: string) => {
    return id?.slice(-6).toUpperCase() || 'N/A';
  };

  const formatTime = (time: string) => {
    return time || 'N/A';
  };

  const calculateAgeFromDOB = (dob?: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 0 ? null : age;
  };

  const formatPrescriptionAge = (prescription?: Prescription | null) => {
    if (!prescription) return null;
    if (prescription.patientAge) return prescription.patientAge;
    const calculatedAge = calculateAgeFromDOB(prescription.patientDateOfBirth);
    if (calculatedAge !== null) {
      return `${calculatedAge} yrs`;
    }
    return null;
  };

  const getPrescriptionsForAppointment = (appointmentId?: string) => {
    if (!appointmentId) return [];
    return allPrescriptionsByAppointment[appointmentId] || [];
  };

  const hasMultiplePatients = (appointmentId?: string) => {
    return getPrescriptionsForAppointment(appointmentId).length > 1;
  };

  const getMultiPatientSummary = (appointmentId?: string) => {
    const prescriptions = getPrescriptionsForAppointment(appointmentId);
    if (prescriptions.length <= 1) {
      return null;
    }
    const paidCount = prescriptions.filter(p => p.isPaid).length;
    return { prescriptions, total: prescriptions.length, paidCount };
  };

  const handleSelectPrescriptionForAppointment = (appointmentId: string, prescriptionId?: string | null) => {
    if (!prescriptionId) return;
    setSelectedPrescriptionByAppointment(prev => ({
      ...prev,
      [appointmentId]: prescriptionId
    }));
  };

  const getSessionTimes = (appointment: Appointment) => {
    if (appointment.sessionId) {
      const sessionTime = getSessionTimeFromId(appointment.sessionId);
      if (sessionTime) {
        return {
          startTime: sessionTime.startTime,
          endTime: sessionTime.endTime
        };
      }
    }
    return { startTime: 'N/A', endTime: 'N/A' };
  };

  const groupAppointmentsBySession = (appointments: Appointment[]) => {
    const groups: {[key: string]: Appointment[]} = {};
    
    appointments.forEach(apt => {
      const key = `${apt.doctorName}-${apt.sessionId || 'no-session'}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(apt);
    });
    
    return groups;
  };

  const updateLegacyAppointment = async (appointmentId: string) => {
    if (!user?.uid) return;
    
    try {
      await appointmentService.updateAppointment(appointmentId, {
        createdBy: {
          uid: user.uid,
          email: user.email || '',
          role: 'cashier',
          displayName: user.displayName || user.email || ''
        }
      });
      
      await loadTodayAppointments();
      toast.success('Appointment updated');
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const handleNavigateToSession = async (appointment: Appointment) => {
    try {
      if (!appointment.sessionId) {
        toast.error('No session information found for this appointment');
        return;
      }

      // Get all appointments for this session
      const sessionAppointments = appointments.filter(
        app => app.sessionId === appointment.sessionId && app.status !== 'cancelled'
      );

      if (sessionAppointments.length === 0) {
        toast.error('No appointments found for this session');
        return;
      }

      // Extract session time from sessionId (format: "doctor-date-startTime-endTime")
      const sessionTimes = getSessionTimeFromId(appointment.sessionId);
      
      setSelectedSessionData({
        doctorName: appointment.doctorName,
        doctorSpeciality: '', // You can fetch this from doctor service if needed
        date: appointment.date,
        startTime: sessionTimes?.startTime || '',
        endTime: sessionTimes?.endTime || '',
        appointments: sessionAppointments
      });
      
      setShowSessionDetails(true);
    } catch (error) {
      console.error('Error loading session details:', error);
      toast.error('Failed to load session details');
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointmentForEdit(appointment);
    setShowEditAppointment(true);
  };

  const handleAppointmentEditSuccess = () => {
    setShowEditAppointment(false);
    setSelectedAppointmentForEdit(null);
    toast.success('Appointment updated successfully');
    // Real-time listener will automatically update the list
  };

  const handleSessionAppointmentUpdated = () => {
    // Real-time listener will automatically update the list
    console.log('Appointment updated in session - real-time listener will handle it');
  };

  const handleCreateAppointment = () => {
    setShowCreateAppointment(true);
  };

  const handleLoadPrescriptionToPOS = (prescriptionData: any) => {
    console.log('handleLoadPrescriptionToPOS called with:', prescriptionData);
    
    // Store the prescription data in localStorage for the POS to pick up
    if (typeof window !== 'undefined') {
      localStorage.setItem('prescriptionPOSData', JSON.stringify(prescriptionData));
      // Store the return path so the back button knows where to go
      localStorage.setItem('posReturnPath', '/dashboard/pos/today-appointments');
    }
    
    toast.success('Prescription loaded to POS', {
      description: `${prescriptionData.prescriptionItems?.length || 0} medicines loaded.`
    });

    if (prescriptionData?.prescription?.id) {
      setLocallyLoadedPrescriptions(prev => ({
        ...prev,
        [prescriptionData.prescription.id]: true
      }));
    }
    
    // Navigate to POS page
    router.push('/dashboard/pos');
  };

  const handleCreateAppointmentSuccess = () => {
    setShowCreateAppointment(false);
    toast.success('Appointment created successfully');
    // Real-time listener will automatically update the list
  };

  const handleOpenDocumentUpload = (appointment: Appointment) => {
    setSelectedAppointmentForDocuments(appointment);
    setShowDocumentUpload(true);
  };

  const handleDocumentUploadClose = () => {
    setShowDocumentUpload(false);
    setSelectedAppointmentForDocuments(null);
  };

  const handleDocumentUploadSuccess = () => {
    // Real-time listener will automatically update the list
    // Refresh the appointment to show document count badge
    if (selectedAppointmentForDocuments?.id) {
      appointmentService.getAppointmentById(selectedAppointmentForDocuments.id).then(updatedAppointment => {
        if (updatedAppointment) {
          // Update the appointment in the local state to reflect document changes
          setAppointments(prev => prev.map(apt => 
            apt.id === updatedAppointment.id ? updatedAppointment : apt
          ));
          setFilteredAppointments(prev => prev.map(apt => 
            apt.id === updatedAppointment.id ? updatedAppointment : apt
          ));
        }
      }).catch(error => {
        console.error('Error refreshing appointment:', error);
      });
    }
  };

  const handleOpenPOS = () => {
    router.push('/dashboard/pos');
  };

  // Helper function to check if appointment is archived (paid and completed)
  const isAppointmentArchived = (appointment: Appointment) => {
    return appointment.payment?.isPaid === true && appointment.status === 'completed';
  };

  // Separate appointments into active and archived
  const activeAppointments = filteredAppointments.filter(apt => !isAppointmentArchived(apt));
  const archivedAppointments = filteredAppointments.filter(apt => isAppointmentArchived(apt));

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Helper function to check if fullscreen is active
  const isFullscreenActive = (): boolean => {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  };

  // Fullscreen functions
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreenActive()) {
        // Enter fullscreen
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(isFullscreenActive());
    };

    // Check initial fullscreen state
    setIsFullscreen(isFullscreenActive());

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Auto-select a prescription per appointment (prefer unpaid) to improve multi-patient UX
  useEffect(() => {
    setSelectedPrescriptionByAppointment(prev => {
      let updated = false;
      const next = { ...prev };

      Object.entries(allPrescriptionsByAppointment).forEach(([appointmentId, prescriptions]) => {
        if (!prescriptions || prescriptions.length === 0) return;
        const currentSelection = next[appointmentId];
        const isCurrentSelectable = currentSelection
          ? prescriptions.some(p => {
              if (p.id !== currentSelection) return false;
              if (p.isPaid) return false;
              if (p.id && locallyLoadedPrescriptions[p.id]) return false;
              return true;
            })
          : false;

        if (!isCurrentSelectable) {
          const preferred = prescriptions.find(p => {
            if (p.isPaid) return false;
            if (p.id && locallyLoadedPrescriptions[p.id]) return false;
            return true;
          }) || prescriptions[0];
          next[appointmentId] = preferred?.id || prescriptions[0]?.id || null;
          updated = true;
        }
      });

      return updated ? next : prev;
    });
  }, [allPrescriptionsByAppointment, locallyLoadedPrescriptions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-[98vw] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push('/dashboard/pos')} 
              className="flex items-center gap-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-md hover:shadow-lg transition-all duration-300 border-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to POS
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Today's Appointments
                </h1>
                <p className="text-slate-600 mt-1">Manage and view appointment details</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleCreateAppointment}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 border-0"
            >
              <Plus className="h-4 w-4" />
              Create Appointment
            </Button>
            
            <Button
              onClick={handleOpenPOS}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-md hover:shadow-lg transition-all duration-300 border-0"
            >
              <ShoppingCart className="h-4 w-4" />
              Open Patient POS
            </Button>
          
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 border-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

            {/* Fullscreen Toggle Button */}
            <Button
              onClick={toggleFullscreen}
              className={`relative overflow-hidden group flex items-center justify-center h-10 w-10 p-0 rounded-lg transition-all duration-300 transform hover:scale-110 border-0 ${
                isFullscreen 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
              }`}
              title={isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              {isFullscreen ? (
                <Minimize className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
              ) : (
                <Maximize className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
              )}
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100/50 transition-all duration-200 px-3 py-2 rounded-lg border border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <UserCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{userDisplayName}</p>
                    <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-lg border border-gray-200/50 shadow-xl rounded-lg">
                <div className="px-3 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userDisplayName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <Badge variant="secondary" className="mt-2 text-xs capitalize bg-indigo-100 text-indigo-700">
                    {userRole}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleBackToDashboard} className="hover:bg-gray-50 cursor-pointer">
                  <LayoutDashboard className="h-4 w-4 mr-3 text-gray-500" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Statistics Summary */}
        {filteredAppointments.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Total Appointments</p>
                    <p className="text-3xl font-bold text-blue-600">{filteredAppointments.length}</p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Active Appointments</p>
                    <p className="text-3xl font-bold text-green-600">{activeAppointments.length}</p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Archived (Paid)</p>
                    <p className="text-3xl font-bold text-slate-600">{archivedAppointments.length}</p>
                  </div>
                  <div className="p-3 bg-slate-500 rounded-lg">
                    <Archive className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Section */}
        <div className="mb-6 bg-white rounded-xl shadow-md p-4 border border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search by patient name or phone..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-10 bg-white border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 rounded-lg"
            />
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-slate-600">
              Showing {filteredAppointments.length} of {appointments.length} appointments
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSearchChange('')}
                className="ml-2 text-xs text-blue-600"
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Appointments List */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-6">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  {searchQuery ? 'No appointments found' : 'No appointments for today'}
                </h3>
                <p className="text-slate-500">
                  {searchQuery ? 'Try adjusting your search criteria' : 'Appointments for today will appear here'}
                </p>
              </div>
            ) : (
              <>
                {/* Active Appointments Section */}
                {activeAppointments.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-1 flex-1 bg-gradient-to-r from-blue-500 to-transparent rounded"></div>
                      <h2 className="text-lg font-bold text-slate-700">Active Appointments</h2>
                      <div className="h-1 flex-1 bg-gradient-to-l from-blue-500 to-transparent rounded"></div>
                    </div>
                    {Object.entries(groupAppointmentsBySession(activeAppointments)).map(([sessionKey, sessionAppointments]) => {
                  const firstAppointment = sessionAppointments[0];
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
                              <TableHead className="font-bold text-slate-900 w-[10%] text-center py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <FileText className="h-4 w-4 text-indigo-600" />
                                  Documents
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
                                    {(() => {
                                      const primaryPrescription = getPrescriptionsForAppointment(appointment.id)[0];
                                      const ageLabel = formatPrescriptionAge(primaryPrescription);
                                      return ageLabel ? (
                                        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full w-fit">
                                          Age: {ageLabel}
                                        </div>
                                      ) : null;
                                    })()}
                                    <div className="flex items-center gap-1.5">
                                      <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-300 font-mono">
                                        #{generateAppointmentNumber(appointment.id)}
                                      </Badge>
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
                                  {(() => {
                                    // Check if this is a multi-patient appointment
                                    const allPrescriptions = appointment.id ? allPrescriptionsByAppointment[appointment.id] : [];
                                    const hasMultiplePatients = allPrescriptions && allPrescriptions.length > 1;
                                    
                                    if (hasMultiplePatients) {
                                      // Multi-patient: Show partial payment status
                                      const paidCount = allPrescriptions.filter(p => p.isPaid).length;
                                      const totalCount = allPrescriptions.length;
                                      const allPaid = paidCount === totalCount;
                                      
                                      if (allPaid) {
                                        return (
                                          <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 font-bold shadow-md px-4 py-2 text-sm">
                                            <CreditCard className="h-4 w-4 mr-1.5" />
                                            All Paid
                                          </Badge>
                                        );
                                      } else {
                                        return (
                                          <div className="flex flex-col items-center gap-1">
                                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                                              Partial ({paidCount}/{totalCount})
                                            </Badge>
                                            <span className="text-xs text-gray-600">
                                              {totalCount - paidCount} remaining
                                            </span>
                                          </div>
                                        );
                                      }
                                    } else {
                                      // Single patient: Show normal payment status
                                      return appointment.payment?.isPaid ? (
                                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 font-bold shadow-md px-4 py-2 text-sm">
                                          <CreditCard className="h-4 w-4 mr-1.5" />
                                          Paid
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 font-bold shadow-md px-4 py-2 text-sm">
                                          <Clock className="h-4 w-4 mr-1.5" />
                                          Pending
                                        </Badge>
                                      );
                                    }
                                  })()}
                                </TableCell>
                                
                                {/* Prescription Status */}
                                <TableCell className="text-center py-4">
                                  {appointment.id && allPrescriptionsByAppointment[appointment.id] && allPrescriptionsByAppointment[appointment.id].length > 0 ? (
                                    <div className="flex flex-col items-center gap-1.5">
                                      {allPrescriptionsByAppointment[appointment.id].length > 1 ? (
                                        // Multi-patient: Show summary
                                        <>
                                          <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                            <Users className="h-3.5 w-3.5 mr-1.5" />
                                            {allPrescriptionsByAppointment[appointment.id].length} Patients
                                          </Badge>
                                          <div className="flex items-center gap-2 text-xs">
                                            <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                                              <span className="font-semibold text-green-700">
                                                {allPrescriptionsByAppointment[appointment.id].filter(p => p.isPaid).length} paid
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full">
                                              <AlertCircle className="h-3 w-3 text-orange-600" />
                                              <span className="font-semibold text-orange-700">
                                                {allPrescriptionsByAppointment[appointment.id].filter(p => !p.isPaid).length} remaining
                                              </span>
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        // Single patient: Show simple status
                                        <>
                                          <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                            Available
                                          </Badge>
                                          <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-full">
                                            <Pill className="h-3 w-3 text-purple-600" />
                                            <span className="text-xs font-semibold text-purple-700">
                                              {allPrescriptionsByAppointment[appointment.id][0].medicines?.length || 0} meds
                                            </span>
                                          </div>
                                        </>
                                      )}
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
                                  <div className="flex flex-col gap-3">
                                    {appointment.id && getPrescriptionsForAppointment(appointment.id).length > 1 && (() => {
                                      const prescriptions = getPrescriptionsForAppointment(appointment.id);
                                      const selectedId = selectedPrescriptionByAppointment[appointment.id] || undefined;
                                      const selectedPrescription = prescriptions.find(p => p.id === selectedId);
                                      const paidCount = prescriptions.filter(p => p.isPaid || (p.id && locallyLoadedPrescriptions[p.id])).length;
                                      const total = prescriptions.length;

                                      const renderOptionLabel = (prescriptionItem: Prescription, idx: number) => {
                                        const ageLabel = formatPrescriptionAge(prescriptionItem);
                                        const status = prescriptionItem.isPaid || (prescriptionItem.id && locallyLoadedPrescriptions[prescriptionItem.id])
                                          ? 'Paid'
                                          : 'Pending';
                                        return `${prescriptionItem.patientName || `Patient ${idx + 1}`}${ageLabel ? ` · ${ageLabel}` : ''} · ${status}`;
                                      };

                                      return (
                                        <div className="text-left bg-blue-50 border-2 border-blue-200 rounded-2xl p-3 shadow-sm space-y-3">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="text-sm font-semibold text-blue-900">Multiple patients in this appointment</p>
                                              <p className="text-xs text-blue-700">Select the patient to load into POS</p>
                                            </div>
                                            <Badge className="bg-white text-blue-700 border-blue-300 px-2 py-1 text-xs">
                                              {paidCount}/{total} paid
                                            </Badge>
                                          </div>
                                          <div className="space-y-2">
                                            <Select
                                              value={selectedId}
                                              onValueChange={(value) => handleSelectPrescriptionForAppointment(appointment.id!, value)}
                                            >
                                              <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-200 focus:border-blue-400">
                                                <SelectValue placeholder="Select patient" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {prescriptions.map((prescriptionItem, idx) => {
                                                  const optionId = prescriptionItem.id || `temp-${idx}`;
                                                  const isDisabled = prescriptionItem.isPaid || (prescriptionItem.id && locallyLoadedPrescriptions[prescriptionItem.id]);
                                                  return (
                                                    <SelectItem
                                                      key={optionId}
                                                      value={optionId}
                                                      disabled={isDisabled}
                                                      className="text-sm"
                                                    >
                                                      {renderOptionLabel(prescriptionItem, idx)}
                                                    </SelectItem>
                                                  );
                                                })}
                                              </SelectContent>
                                            </Select>
                                            {selectedPrescription && (
                                              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-slate-800">
                                                  {selectedPrescription.patientName}
                                                </span>
                                                {formatPrescriptionAge(selectedPrescription) && (
                                                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                                                    Age {formatPrescriptionAge(selectedPrescription)}
                                                  </Badge>
                                                )}
                                                <Badge
                                                  className={`text-[10px] ${
                                                    selectedPrescription.isPaid || (selectedPrescription.id && locallyLoadedPrescriptions[selectedPrescription.id])
                                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                      : 'bg-amber-100 text-amber-700 border-amber-200'
                                                  }`}
                                                >
                                                  {selectedPrescription.isPaid || (selectedPrescription.id && locallyLoadedPrescriptions[selectedPrescription.id]) ? 'Paid' : 'Pending'}
                                                </Badge>
                                              </div>
                                            )}
                                            <p className="text-[11px] text-blue-700">
                                              Patients marked as paid (after POS load) are disabled automatically.
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                    <Button
                                      onClick={() => handleNavigateToSession(appointment)}
                                      size="sm"
                                      className="w-full h-9 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                                      View Session
                                    </Button>
                                    {appointment.id && appointmentPrescriptions[appointment.id] && (
                                      <div className="flex flex-col gap-2">
                                        <div className="transform hover:scale-105 transition-transform duration-200">
                                          <LoadPrescriptionToPOSButton
                                            appointment={appointment}
                                            prescription={appointmentPrescriptions[appointment.id]}
                                            initialPrescriptionId={appointment.id ? selectedPrescriptionByAppointment[appointment.id] : undefined}
                                            hidePatientSelector
                                            onLoadToPOS={handleLoadPrescriptionToPOS}
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
                                
                                {/* Documents */}
                                <TableCell className="text-center py-4">
                                  <Button
                                    onClick={() => handleOpenDocumentUpload(appointment)}
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-9 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border-indigo-300 text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                                  >
                                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                                    Documents
                                    {appointment.documents && appointment.documents.length > 0 && (
                                      <Badge className="ml-2 bg-indigo-600 text-white text-xs px-1.5 py-0">
                                        {appointment.documents.length}
                                      </Badge>
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
                  </div>
                )}

                {/* Archived Appointments Section */}
                {archivedAppointments.length > 0 && (
                  <div className="space-y-4 mt-8">
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-xl p-4 shadow-md">
                                          <Button
                        onClick={() => setShowArchivedAppointments(!showArchivedAppointments)}
                        className="w-full flex items-center justify-between bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 shadow-sm h-14"
                        variant="outline"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-500 rounded-lg">
                            <Archive className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <span className="font-bold text-base">Archived Appointments</span>
                            <p className="text-xs text-slate-500 mt-0.5">Paid & Completed Appointments</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-slate-500 text-white px-3 py-1.5">
                            {archivedAppointments.length} Archived
                          </Badge>
                          {showArchivedAppointments ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                                          </Button>
                                        </div>

                    {showArchivedAppointments && (
                      <div className="space-y-6 pl-4 border-l-4 border-slate-300">
                        {Object.entries(groupAppointmentsBySession(archivedAppointments)).map(([sessionKey, sessionAppointments]) => {
                          const firstAppointment = sessionAppointments[0];
                          const { startTime: sessionStartTime, endTime: sessionEndTime } = getSessionTimes(firstAppointment);
                          
                          return (
                            <div key={sessionKey} className="space-y-3 mb-6 opacity-75 hover:opacity-100 transition-opacity">
                              {/* Session Header */}
                              <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-300 rounded-lg p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-400 rounded-lg">
                                      <Users className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-bold text-slate-700">
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
                                  <Badge className="bg-slate-100 text-slate-700 border-slate-200 px-3 py-1.5">
                                    <Archive className="h-4 w-4 mr-1" />
                                    {sessionAppointments.length} Archived
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Session Appointments Table */}
                              <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-lg">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-gradient-to-r from-slate-100 to-gray-100 border-b-2 border-slate-300">
                                      <TableHead className="font-bold text-slate-900 w-[4%] text-center py-4">#</TableHead>
                                      <TableHead className="font-bold text-slate-900 w-[16%] py-4">
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-slate-600" />
                                          Patient Info
                                        </div>
                                      </TableHead>
                                      <TableHead className="font-bold text-slate-900 w-[12%] text-center py-4">
                                        <div className="flex items-center justify-center gap-2">
                                          <Phone className="h-4 w-4 text-slate-600" />
                                          Contact
                                        </div>
                                      </TableHead>
                                      <TableHead className="font-bold text-slate-900 w-[10%] text-center py-4">
                                        <div className="flex items-center justify-center gap-2">
                                          <CheckCircle2 className="h-4 w-4 text-slate-600" />
                                          Status
                                        </div>
                                      </TableHead>
                                      <TableHead className="font-bold text-slate-900 w-[10%] text-center py-4">
                                        <div className="flex items-center justify-center gap-2">
                                          <CreditCard className="h-4 w-4 text-slate-600" />
                                          Payment
                                        </div>
                                      </TableHead>
                                      <TableHead className="font-bold text-slate-900 w-[10%] text-center py-4">
                                        <div className="flex items-center justify-center gap-2">
                                          <Pill className="h-4 w-4 text-slate-600" />
                                          Prescription
                                        </div>
                                      </TableHead>
                                      <TableHead className="font-bold text-slate-900 w-[10%] text-center py-4">
                                        <div className="flex items-center justify-center gap-2">
                                          <FileText className="h-4 w-4 text-slate-600" />
                                          Referral
                                        </div>
                                      </TableHead>
                                      <TableHead className="font-bold text-slate-900 w-[10%] text-center py-4">Actions</TableHead>
                                      <TableHead className="font-bold text-slate-900 w-[10%] text-center py-4">
                                        <div className="flex items-center justify-center gap-2">
                                          <FileText className="h-4 w-4 text-slate-600" />
                                          Documents
                                        </div>
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sessionAppointments.map((appointment, index) => (
                                      <TableRow key={appointment.id} className="hover:bg-slate-50/50 border-b border-slate-200 transition-colors">
                                        <TableCell className="text-center font-semibold text-slate-700 py-4">
                                          {index + 1}
                                        </TableCell>
                                        
                                        {/* Patient Info */}
                                        <TableCell className="py-4">
                                          <div className="flex flex-col gap-2">
                                            <div className="flex flex-col gap-1">
                                              <span className="font-semibold text-slate-800">
                                                {appointment.patientName}
                                              </span>
                                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <UserCheck className="h-3 w-3" />
                                                <span>
                                                  {creatorNames[appointment.createdBy?.uid || ''] || 'Unknown'}
                                                </span>
                                              </div>
                                            </div>
                                            {appointment.id && hasMultiplePatients(appointment.id) && (
                                              <div className="bg-slate-100 border border-slate-200 rounded-lg p-2">
                                                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                                                  <span className="flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5" />
                                                    Multiple patients
                                                  </span>
                                                  <Badge className="bg-white text-slate-700 border-slate-300 px-2 py-0.5 text-[10px]">
                                                    {getPrescriptionsForAppointment(appointment.id).length}
                                                  </Badge>
                                                </div>
                                                <div className="space-y-1">
                                                  {getPrescriptionsForAppointment(appointment.id).map((prescription, idx) => (
                                                    <div
                                                      key={prescription.id || `archived-prescription-${appointment.id}-${idx}`}
                                                      className="flex items-center justify-between text-[11px] text-slate-600"
                                                    >
                                                      <span className="truncate">
                                                        {idx + 1}. {prescription.patientName || 'Patient'}
                                                      </span>
                                                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                                                        Paid
                                                      </Badge>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </TableCell>
                                        
                                        {/* Contact */}
                                        <TableCell className="text-center py-4">
                                          <span className="text-slate-700">{appointment.patientContact || 'N/A'}</span>
                                        </TableCell>
                                        
                                        {/* Status */}
                                        <TableCell className="text-center py-4">
                                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                            {appointment.status}
                                          </Badge>
                                        </TableCell>
                                        
                                        {/* Payment Status */}
                                        <TableCell className="text-center py-4">
                                          {(() => {
                                            const summary = getMultiPatientSummary(appointment.id);
                                            if (summary) {
                                              return (
                                                <div className="flex flex-col items-center gap-1">
                                                  <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                                    All Paid
                                                  </Badge>
                                                  <span className="text-[11px] text-slate-600 font-medium">
                                                    {summary.paidCount}/{summary.total} patients
                                                  </span>
                                                </div>
                                              );
                                            }
                                            return (
                                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                                Paid
                                              </Badge>
                                            );
                                          })()}
                                        </TableCell>
                                        
                                        {/* Prescription Status */}
                                        <TableCell className="text-center py-4">
                                          {(() => {
                                            const prescriptions = getPrescriptionsForAppointment(appointment.id);
                                            if (prescriptions.length > 1) {
                                              return (
                                                <div className="flex flex-col items-center gap-1">
                                                  <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                                    <Users className="h-3.5 w-3.5 mr-1.5" />
                                                    {prescriptions.length} prescriptions
                                                  </Badge>
                                                  <span className="text-[11px] text-slate-600 font-medium">
                                                    {prescriptions.reduce((acc, presc) => acc + (presc.medicines?.length || 0), 0)} total meds
                                                  </span>
                                                </div>
                                              );
                                            }
                                            if (prescriptions.length === 1 && appointment.id && appointmentPrescriptions[appointment.id]) {
                                              return (
                                                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                                  Available
                                                </Badge>
                                              );
                                            }
                                            return (
                                              <Badge className="bg-gradient-to-r from-gray-400 to-slate-500 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                                <Minus className="h-3.5 w-3.5 mr-1.5" />
                                                N/A
                                              </Badge>
                                            );
                                          })()}
                                        </TableCell>
                                        
                                        {/* Referral Letter Status */}
                                        <TableCell className="text-center py-4">
                                          {appointment.id && appointmentReferralLetters[appointment.id] ? (
                                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 font-bold shadow-md px-3 py-1.5 text-xs">
                                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                              Available
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
                                              className="w-full h-9 bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                            >
                                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                                              View Session
                                            </Button>
                                            {appointment.id && appointmentPrescriptions[appointment.id] && (
                                        <div className="transform hover:scale-105 transition-transform duration-200">
                                          <CombinedPrintButton
                                            appointment={appointment}
                                            prescription={appointmentPrescriptions[appointment.id]}
                                            referralLetter={appointmentReferralLetters[appointment.id]}
                                          />
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                
                                {/* Documents */}
                                <TableCell className="text-center py-4">
                                  <Button
                                    onClick={() => handleOpenDocumentUpload(appointment)}
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-9 bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100 text-slate-700 border-slate-300 text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                                  >
                                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                                    Documents
                                    {appointment.documents && appointment.documents.length > 0 && (
                                      <Badge className="ml-2 bg-slate-600 text-white text-xs px-1.5 py-0">
                                        {appointment.documents.length}
                                      </Badge>
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Session Details Modal */}
      {showSessionDetails && selectedSessionData && (
        <SessionDetailsModal
          doctorName={selectedSessionData.doctorName}
          doctorSpeciality={selectedSessionData.doctorSpeciality}
          date={selectedSessionData.date}
          startTime={selectedSessionData.startTime}
          endTime={selectedSessionData.endTime}
          appointments={selectedSessionData.appointments}
          onClose={() => {
            setShowSessionDetails(false);
            setSelectedSessionData(null);
          }}
          onEditAppointment={handleEditAppointment}
          onAppointmentUpdated={handleSessionAppointmentUpdated}
        />
      )}

      {/* Edit Appointment Modal */}
      {showEditAppointment && selectedAppointmentForEdit && (
        <AppointmentModal
          appointment={selectedAppointmentForEdit}
          onClose={() => {
            setShowEditAppointment(false);
            setSelectedAppointmentForEdit(null);
          }}
          onSuccess={handleAppointmentEditSuccess}
        />
      )}

      {/* Create Appointment Modal */}
      {showCreateAppointment && (
        <AppointmentModal
          onClose={() => setShowCreateAppointment(false)}
          onSuccess={handleCreateAppointmentSuccess}
        />
      )}

      {/* Document Upload Modal */}
      {showDocumentUpload && selectedAppointmentForDocuments && (
        <DocumentUploadModal
          appointment={selectedAppointmentForDocuments}
          onClose={handleDocumentUploadClose}
          onSuccess={handleDocumentUploadSuccess}
        />
      )}
    </div>
  );
}

export default withAuth(TodayAppointmentsPage);

