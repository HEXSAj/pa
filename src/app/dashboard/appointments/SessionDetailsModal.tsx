// src/app/dashboard/appointments/SessionDetailsModal.tsx
'use client';

import { useState, useEffect,useCallback, useRef } from 'react';
import { Appointment, formatAppointmentDate, calculateTotalDoctorCharges, AppointmentProcedure } from '@/types/appointment';
import { DoctorSession } from '@/types/appointment';
import { formatCurrency } from '@/types/doctor';
import { appointmentService } from '@/services/appointmentService';
import { doctorSessionService } from '@/services/doctorSessionService';
import { prescriptionService } from '@/services/prescriptionService';
import { staffService } from '@/services/staffService';
import { Prescription } from '@/types/prescription';
import { useAuth } from '@/context/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  Users,
  Calendar, 
  DollarSign,
  CreditCard,
  Edit,
  Printer,
  RefreshCcw,
  CheckCircle,
  UserCheck,
  Bell,
  Send,
  Stethoscope,
  Phone,
  User,
  FileText,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  LogOut,
  Receipt,
  Plus,
  Pill,
  Loader2,
  Archive,
  ChevronDown,
  ChevronUp,
  Trash2,
  Maximize,
  Minimize
} from 'lucide-react';
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
 formatCardNumberInput, 
  maskCardNumber, 
  getStoredCardNumber, 
  validateCardNumber, 
  detectCardType,
  getCleanCardNumber,
  getAdjustedCursorPosition
} from '@/utils/cardUtils';

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

import { appointmentReceiptService } from '@/services/appointmentReceiptService';
import AddPrescriptionModal from '@/app/dashboard/my-sessions/AddPrescriptionModal';
import { queueDisplayService } from '@/services/queueDisplayService';

interface SessionDetailsModalProps {
  doctorName: string;
  doctorSpeciality: string;
  date: string;
  startTime: string;
  endTime: string;
  appointments: Appointment[];
  onClose: () => void;
  onEditAppointment: (appointment: Appointment) => void;
  onAppointmentUpdated?: () => void;
}

export default function SessionDetailsModal({
  doctorName,
  doctorSpeciality,
  date,
  startTime,
  endTime,
  appointments,
  onClose,
  onEditAppointment,
  onAppointmentUpdated
}: SessionDetailsModalProps) {
  const { user, userRole } = useAuth();
  
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [processingRefund, setProcessingRefund] = useState<string | null>(null);
  const [processingArrival, setProcessingArrival] = useState<string | null>(null);
  const [processingDoctorAction, setProcessingDoctorAction] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Track the appointments locally to update UI immediately
  const [localAppointments, setLocalAppointments] = useState<Appointment[]>(appointments);
  
  // Doctor session state
  const [doctorSession, setDoctorSession] = useState<DoctorSession | null>(null);
  
  // Payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState<boolean>(false);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState<Appointment | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cash');
  const [cardNumber, setCardNumber] = useState('');
  const [cardNumberError, setCardNumberError] = useState('');

  // Doctor fee payment dialog
  const [showDoctorFeeDialog, setShowDoctorFeeDialog] = useState<boolean>(false);

  const [editableProcedures, setEditableProcedures] = useState<AppointmentProcedure[]>([]);
  const [originalProcedures, setOriginalProcedures] = useState<AppointmentProcedure[]>([]);
  const [hasChargeChanges, setHasChargeChanges] = useState(false);

  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [receivedAmountError, setReceivedAmountError] = useState('');

  const [showPostDepartureExpenseDialog, setShowPostDepartureExpenseDialog] = useState(false);
  
  const [postDepartureInfo, setPostDepartureInfo] = useState<{
    postDeparturePatients: any[];
    postDepartureFees: number;
    unpaidPostDepartureFees: number;
    canCreateExpense: boolean;
  } | null>(null);

  // Prescription states
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedAppointmentForPrescription, setSelectedAppointmentForPrescription] = useState<Appointment | null>(null);
  const [appointmentPrescriptions, setAppointmentPrescriptions] = useState<{[appointmentId: string]: Prescription}>({});
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);

  // Edit appointment amount states
  const [showEditAmountDialog, setShowEditAmountDialog] = useState(false);
  const [selectedAppointmentForAmountEdit, setSelectedAppointmentForAmountEdit] = useState<Appointment | null>(null);
  const [editingAppointmentAmount, setEditingAppointmentAmount] = useState<string>('');
  const [updatingAmount, setUpdatingAmount] = useState(false);

  // Archive state
  const [showArchivedAppointments, setShowArchivedAppointments] = useState(false);

  // Delete appointment states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAppointmentForDelete, setSelectedAppointmentForDelete] = useState<Appointment | null>(null);
  const [processingDelete, setProcessingDelete] = useState<string | null>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get current doctor ID
  useEffect(() => {
    const getCurrentDoctorId = async () => {
      if (!user?.uid || userRole !== 'doctor') {
        return;
      }
      try {
        const staffUser = await staffService.getStaffById(user.uid);
        if (staffUser?.doctorId) {
          setCurrentDoctorId(staffUser.doctorId);
        }
      } catch (error) {
        console.error('Error getting doctor ID:', error);
      }
    };

    getCurrentDoctorId();
  }, [user, userRole]);

  // const handleRefresh = async () => {
  //   setIsRefreshing(true);
  //   try {
  //     if (onAppointmentUpdated) {
  //       await onAppointmentUpdated();
  //     }
      
  //     // If we have a doctor session, refresh it too
  //     if (doctorSession?.id) {
  //       const updatedSession = await doctorSessionService.getSession(doctorSession.id);
  //       if (updatedSession) {
  //         setDoctorSession(updatedSession);
  //       }
  //     }
      
  //     // Reload prescriptions
  //     await loadPrescriptions();
      
  //     toast.success('Session data refreshed successfully');
  //   } catch (error) {
  //     console.error('Error refreshing session data:', error);
  //     toast.error('Failed to refresh session data');
  //   } finally {
  //     setIsRefreshing(false);
  //   }
  // };

  // Load prescriptions when appointments change
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Don't call onAppointmentUpdated here as it causes loops
      
      // If we have a doctor session, refresh it
      if (doctorSession?.id) {
        const updatedSession = await doctorSessionService.getSession(doctorSession.id);
        if (updatedSession) {
          setDoctorSession(updatedSession);
        }
      }
      
      // Reload prescriptions
      await loadPrescriptions();
      
      toast.success('Session data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing session data:', error);
      toast.error('Failed to refresh session data');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    if (localAppointments.length > 0) {
      loadPrescriptions();
    }
  }, [localAppointments]);

  const loadPrescriptions = async () => {
    try {
      const prescriptions: {[appointmentId: string]: Prescription} = {};
      
      for (const appointment of localAppointments) {
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
    }
  };

  // useEffect(() => {
  //   console.log('=== SETTING UP REAL-TIME LISTENER ===');
  //   console.log('Doctor session details:', { doctorName, date, startTime, endTime });
    
  //   // Extract doctorId from the first appointment if available
  //   const doctorId = appointments.length > 0 ? appointments[0].doctorId : null;
    
  //   if (!doctorId) {
  //     console.log('No doctorId available, skipping real-time listener');
  //     return;
  //   }
    
  //   // Set up real-time listener for this specific session
  //   const unsubscribe = appointmentService.subscribeToSessionAppointments(
  //     doctorId,
  //     date,
  //     startTime,
  //     endTime,
  //     (updatedAppointments) => {
  //       console.log('=== REAL-TIME UPDATE RECEIVED ===');
  //       console.log('Updated appointments count:', updatedAppointments.length);
  //       console.log('Updated appointments:', updatedAppointments);
        
  //       setLocalAppointments(updatedAppointments);
        
  //       // Call the parent callback if provided
  //       if (onAppointmentUpdated) {
  //         onAppointmentUpdated();
  //       }
  //     }
  //   );
    
  //   console.log('Real-time listener set up successfully');
    
  //   // Cleanup function
  //   return () => {
  //     console.log('=== CLEANING UP REAL-TIME LISTENER ===');
  //     appointmentService.unsubscribe(unsubscribe);
  //   };
  // }, [doctorName, date, startTime, endTime, onAppointmentUpdated]);

  // const handleAddPrescription = (appointment: Appointment) => {
  //   setSelectedAppointmentForPrescription(appointment);
  //   setShowPrescriptionModal(true);
  // };


  useEffect(() => {
    console.log('=== SETTING UP REAL-TIME LISTENER ===');
    console.log('Doctor session details:', { doctorName, date, startTime, endTime });
    
    // Extract doctorId from the first appointment if available
    const doctorId = appointments.length > 0 ? appointments[0].doctorId : null;
    
    if (!doctorId) {
      console.log('No doctorId available, skipping real-time listener');
      return;
    }
    
    // Set up real-time listener for this specific session
    const unsubscribe = appointmentService.subscribeToSessionAppointments(
      doctorId,
      date,
      startTime,
      endTime,
      (updatedAppointments) => {
        console.log('=== REAL-TIME UPDATE RECEIVED ===');
        console.log('Updated appointments count:', updatedAppointments.length);
        console.log('Updated appointments:', updatedAppointments);
        
        setLocalAppointments(updatedAppointments);
        
        // Don't call onAppointmentUpdated here - it causes infinite loops
        // The parent component will handle its own updates
      }
    );
    
    console.log('Real-time listener set up successfully');
    
    // Cleanup function
    return () => {
      console.log('=== CLEANING UP REAL-TIME LISTENER ===');
      appointmentService.unsubscribe(unsubscribe);
    };
  }, [doctorName, date, startTime, endTime]); 

  const handleAddPrescription = async (appointment: Appointment) => {
    // Check if appointment is refunded
    if (appointment.payment?.refunded) {
      toast.error('Cannot add prescription - appointment has been refunded');
      return;
    }
    
    // Track current appointment number for queue display
    if (appointment.sessionId && appointment.sessionAppointmentNumber !== undefined && appointment.sessionAppointmentNumber !== null) {
      try {
        await queueDisplayService.setCurrentAppointment(
          appointment.sessionId,
          appointment.sessionAppointmentNumber,
          appointment.doctorId,
          appointment.doctorName,
          appointment.date,
          startTime,
          endTime,
          user?.uid
        );
      } catch (error) {
        console.error('Error updating queue display:', error);
        // Don't block the modal from opening if queue update fails
      }
    }
    
    setSelectedAppointmentForPrescription(appointment);
    setShowPrescriptionModal(true);
  };



  const handlePrescriptionSuccess = () => {
    loadPrescriptions(); // Reload prescriptions
    setShowPrescriptionModal(false);
    setSelectedAppointmentForPrescription(null);
  };


  const isArrivalStatusDisabled = (appointment: Appointment): boolean => {
    // If appointment is refunded, disable arrival status changes
    if (appointment.payment?.refunded) {
      return true;
    }
    
    // If doctor has not departed, allow changes (unless refunded)
    if (!doctorSession?.isDeparted) {
      return false;
    }
    
    // If doctor has departed and payment is completed and doctor fee is paid, disable unmarking arrival
    if (doctorSession.isDeparted && 
        appointment.payment?.isPaid && 
        !appointment.payment?.refunded && 
        doctorSession.isPaid && 
        appointment.isPatientArrived) {
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    initializeDoctorSession();
  }, []);

  useEffect(() => {
    if (doctorSession?.id) {
      console.log(`Updating session stats for ${localAppointments.length} appointments`);
      updateSessionStats();
    }
  }, [localAppointments, doctorSession?.id]);

  const updateSessionStats = async () => {
    if (!doctorSession?.id) return;

    try {
      console.log(`=== UPDATING SESSION STATS ===`);
      console.log(`Session ID: ${doctorSession.id}`);
      console.log(`Appointments to process: ${localAppointments.length}`);
      
      // Log detailed appointment information
      localAppointments.forEach((apt, index) => {
        console.log(`  ${index + 1}. ${apt.patientName}:`);
        console.log(`     - Arrived: ${apt.isPatientArrived ? 'Yes' : 'No'}`);
        console.log(`     - Paid: ${apt.payment?.isPaid ? 'Yes' : 'No'}`);
        console.log(`     - Refunded: ${apt.payment?.refunded ? 'Yes' : 'No'}`);
        console.log(`     - Total Charge: Rs. ${apt.totalCharge}`);
        console.log(`     - Doctor Fees: Rs. ${(apt.procedures || []).reduce((sum, proc) => sum + proc.doctorCharge, 0)}`);
      });

      await doctorSessionService.updateSessionStats(doctorSession.id, localAppointments);
      
      // Refresh session data
      const updatedSession = await doctorSessionService.getSession(doctorSession.id);
      if (updatedSession) {
        console.log('=== SESSION STATS UPDATED ===');
        console.log('Total Patients:', updatedSession.totalPatients);
        console.log('Arrived Patients:', updatedSession.arrivedPatients);
        console.log('Total Doctor Fees:', updatedSession.totalDoctorFees);
        
        setDoctorSession(updatedSession);
      }
    } catch (error) {
      console.error('Error updating session stats:', error);
    }
  };

  const generateSequentialAppointmentNumber = (appointmentIndex: number): string => {
    return (appointmentIndex + 1).toString();
  };

  const initializeDoctorSession = async () => {
    try {
      console.log('=== INITIALIZING DOCTOR SESSION (FROM CASHIER) ===');
      console.log(`Received ${appointments.length} appointments`);
      console.log('Doctor details:', { doctorName, date, startTime, endTime });

      if (appointments.length === 0) {
        toast.error('No appointments data available');
        return;
      }

      const firstAppointment = appointments[0];
      console.log('First appointment:', {
        doctorId: firstAppointment.doctorId,
        sessionId: firstAppointment.sessionId,
        date: firstAppointment.date
      });
      
      // Create/get doctor session using the SAME logic as appointments section
      const session = await doctorSessionService.createOrUpdateSession(
        firstAppointment.doctorId,
        doctorName,
        date, // This should be string format YYYY-MM-DD
        startTime,
        endTime
      );

      console.log('Doctor session created/retrieved:', {
        id: session.id,
        isArrived: session.isArrived,
        isDeparted: session.isDeparted,
        isPaid: session.isPaid,
        totalDoctorFees: session.totalDoctorFees
      });

      // Set the session first
      setDoctorSession(session);
      setLocalAppointments(appointments);
      
      // Update session stats with all appointments
      console.log('Updating session stats with appointments...');
      await doctorSessionService.updateSessionStats(session.id!, appointments);
      
      // Get the updated session to ensure we have latest data
      const updatedSession = await doctorSessionService.getSession(session.id!);
      if (updatedSession) {
        console.log('=== UPDATED SESSION DATA ===');
        console.log('Session ID:', updatedSession.id);
        console.log('Doctor Arrived:', updatedSession.isArrived);
        console.log('Doctor Departed:', updatedSession.isDeparted);
        console.log('Doctor Fees Paid:', updatedSession.isPaid);
        console.log('Total Patients:', updatedSession.totalPatients);
        console.log('Arrived Patients:', updatedSession.arrivedPatients);
        console.log('Total Doctor Fees:', updatedSession.totalDoctorFees);
        
        setDoctorSession(updatedSession);
      }
    } catch (error) {
      console.error('Error initializing doctor session:', error);
      toast.error('Failed to initialize doctor session');
    }
  };

  useEffect(() => {
    const checkPostDeparturePatients = async () => {
      if (doctorSession?.id && doctorSession.isDeparted) {
        try {
          const info = await doctorSessionService.getSessionWithPostDepartureInfo(doctorSession.id);
          
          setPostDepartureInfo({
            postDeparturePatients: info.postDeparturePatients,
            postDepartureFees: info.postDepartureFees,
            unpaidPostDepartureFees: info.unpaidPostDepartureFees,
            canCreateExpense: info.canCreateExpense
          });
        } catch (error) {
          console.error('Error checking post-departure patients:', error);
          // Set empty state on error
          setPostDepartureInfo({
            postDeparturePatients: [],
            postDepartureFees: 0,
            unpaidPostDepartureFees: 0,
            canCreateExpense: false
          });
        }
      } else {
        // Reset state when session is not departed
        setPostDepartureInfo(null);
      }
    };

    checkPostDeparturePatients();
  }, [doctorSession, localAppointments]);

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

  // useEffect(() => {
  //   console.log('=== SESSION MODAL APPOINTMENTS UPDATED ===');
  //   console.log('Appointments prop changed, updating local state');
  //   console.log('New appointments count:', appointments.length);
  //   setLocalAppointments(appointments);
  // }, [appointments]);

  const handleCreatePostDepartureExpense = async () => {
    if (!doctorSession?.id) return;

    try {
      setProcessingDoctorAction(true);
      const result = await doctorSessionService.createPostDepartureExpense(doctorSession.id);
      
      toast.success(`Post-departure expense created: ${formatCurrency(result.amount)}`);
      
      // Refresh session and post-departure info
      const updatedSession = await doctorSessionService.getSession(doctorSession.id);
      if (updatedSession) {
        setDoctorSession(updatedSession);
      }
      
      const updatedInfo = await doctorSessionService.getSessionWithPostDepartureInfo(doctorSession.id);
      setPostDepartureInfo({
        postDeparturePatients: updatedInfo.postDeparturePatients,
        postDepartureFees: updatedInfo.postDepartureFees,
        unpaidPostDepartureFees: updatedInfo.unpaidPostDepartureFees,
        canCreateExpense: updatedInfo.canCreateExpense
      });
      
      setShowPostDepartureExpenseDialog(false);
    } catch (error: any) {
      console.error('Error creating post-departure expense:', error);
      toast.error(error.message || 'Failed to create post-departure expense');
    } finally {
      setProcessingDoctorAction(false);
    }
  };

  const handleDoctorArrival = async () => {
    if (!doctorSession?.id) return;

    try {
      setProcessingDoctorAction(true);
      await doctorSessionService.markDoctorArrival(doctorSession.id);
      
      // Refresh session data
      const updatedSession = await doctorSessionService.getSession(doctorSession.id);
      if (updatedSession) {
        setDoctorSession(updatedSession);
      }
      
      toast.success('Doctor marked as arrived');
    } catch (error: any) {
      console.error('Error marking doctor arrival:', error);
      toast.error(error.message || 'Failed to mark doctor arrival');
    } finally {
      setProcessingDoctorAction(false);
    }
  };

  // Fixed method name here
  const processDoctorDeparture = async () => {
    if (!doctorSession?.id) return;

    try {
      setProcessingDoctorAction(true);
      const result = await doctorSessionService.markDoctorDeparture(doctorSession.id);
      
      // Refresh session data
      setDoctorSession(result.session);
      
      if (result.expenseId) {
        toast.success(`Doctor departed and fee (${formatCurrency(doctorSession.totalDoctorFees)}) added to expenses`);
      } else {
        toast.success('Doctor marked as departed');
      }
      
      setShowDoctorFeeDialog(false);
    } catch (error: any) {
      console.error('Error processing doctor departure:', error);
      toast.error(error.message || 'Failed to process doctor departure');
    } finally {
      setProcessingDoctorAction(false);
    }
  };

  // const handleProcessPayment = async (appointmentId: string, paymentMethod: string = 'cash', cardDetails?: any) => {
  //   try {
  //     setProcessingPayment(appointmentId);
  //     await appointmentService.processPayment(appointmentId, paymentMethod, cardDetails);
      
  //     // Update local state
  //     setLocalAppointments(prev => prev.map(apt => 
  //       apt.id === appointmentId 
  //         ? { 
  //             ...apt, 
  //             payment: { 
  //               ...apt.payment, 
  //               isPaid: true, 
  //               paidAt: Date.now(),
  //               paidBy: paymentMethod,
  //               ...(cardDetails && { cardDetails })
  //             } 
  //           }
  //         : apt
  //     ));
      
  //     toast.success('Payment processed successfully');
  //     setShowPaymentDialog(false);
  //     setSelectedAppointmentForPayment(null);
  //     setSelectedPaymentMethod('cash');
  //     setCardNumber('');
  //     setReceivedAmount('');
      
  //     // Call the callback to refresh data in parent
  //     if (onAppointmentUpdated) {
  //       onAppointmentUpdated();
  //     }
  //   } catch (error: any) {
  //     console.error('Error processing payment:', error);
  //     toast.error(error.message || 'Failed to process payment');
  //   } finally {
  //     setProcessingPayment(null);
  //   }
  // };


  const handleProcessPayment = async (appointmentId: string, paymentMethod: string = 'cash', cardDetails?: any) => {
    try {
      setProcessingPayment(appointmentId);
      await appointmentService.processPayment(appointmentId, paymentMethod, cardDetails, true);
      
      // Don't update local state manually - real-time listener will handle it
      toast.success('Payment processed successfully');
      setShowPaymentDialog(false);
      setSelectedAppointmentForPayment(null);
      setSelectedPaymentMethod('cash');
      setCardNumber('');
      setReceivedAmount('');
      
      // Don't call onAppointmentUpdated - real-time listener will update the UI
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setProcessingPayment(null);
    }
  };


  // const handleProcessRefund = async (appointmentId: string) => {
  //   try {
  //     setProcessingRefund(appointmentId);
  //     await appointmentService.processRefund(appointmentId);
      
  //     // Update local state
  //     setLocalAppointments(prev => prev.map(apt => 
  //       apt.id === appointmentId 
  //         ? { 
  //             ...apt, 
  //             payment: { 
  //               ...apt.payment, 
  //               refunded: true, 
  //               refundedAt: Date.now() 
  //             } 
  //           }
  //         : apt
  //     ));
      
  //     toast.success('Refund processed successfully');
      
  //     // Call the callback to refresh data in parent
  //     if (onAppointmentUpdated) {
  //       onAppointmentUpdated();
  //     }
  //   } catch (error: any) {
  //     console.error('Error processing refund:', error);
  //     toast.error(error.message || 'Failed to process refund');
  //   } finally {
  //     setProcessingRefund(null);
  //   }
  // };


  const handleProcessRefund = async (appointmentId: string) => {
    try {
      setProcessingRefund(appointmentId);
      await appointmentService.processRefund(appointmentId);
      
      // Don't update local state manually - real-time listener will handle it
      toast.success('Refund processed successfully');
      
      // Don't call onAppointmentUpdated - real-time listener will update the UI
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast.error(error.message || 'Failed to process refund');
    } finally {
      setProcessingRefund(null);
    }
  };

  // const handleToggleArrival = async (appointmentId: string, currentStatus: boolean) => {
  //   try {
  //     setProcessingArrival(appointmentId);
  //     const newStatus = !currentStatus;
      
  //     await appointmentService.updatePatientArrival(appointmentId, newStatus);
      
  //     // Update local state
  //     setLocalAppointments(prev => prev.map(apt => 
  //       apt.id === appointmentId 
  //         ? { 
  //             ...apt, 
  //             isPatientArrived: newStatus, 
  //             patientArrivedAt: newStatus ? Date.now() : undefined 
  //           }
  //         : apt
  //     ));
      
  //     toast.success(`Patient ${newStatus ? 'marked as arrived' : 'arrival unmarked'}`);
      
  //     // Call the callback to refresh data in parent
  //     if (onAppointmentUpdated) {
  //       onAppointmentUpdated();
  //     }
  //   } catch (error: any) {
  //     console.error('Error updating patient arrival:', error);
  //     toast.error(error.message || 'Failed to update patient arrival status');
  //   } finally {
  //     setProcessingArrival(null);
  //   }
  // };

  const handleToggleArrival = async (appointmentId: string, currentStatus: boolean) => {
    try {
      setProcessingArrival(appointmentId);
      const newStatus = !currentStatus;
      
      await appointmentService.updatePatientArrival(appointmentId, newStatus);
      
      // Don't update local state manually - real-time listener will handle it
      toast.success(`Patient ${newStatus ? 'marked as arrived' : 'arrival unmarked'}`);
      
      // Don't call onAppointmentUpdated - real-time listener will update the UI
    } catch (error: any) {
      console.error('Error updating patient arrival:', error);
      toast.error(error.message || 'Failed to update patient arrival status');
    } finally {
      setProcessingArrival(null);
    }
  };

  const openPaymentDialog = (appointment: Appointment) => {
    setSelectedAppointmentForPayment(appointment);
    setReceivedAmount(appointment.totalCharge.toString());
    setShowPaymentDialog(true);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    const formattedValue = formatCardNumberInput(input);
    const adjustedCursorPosition = getAdjustedCursorPosition(input, formattedValue, cursorPosition);
    
    setCardNumber(formattedValue);
    setCardNumberError('');
    
    // Set cursor position after the state update
    setTimeout(() => {
      if (e.target) {
        e.target.setSelectionRange(adjustedCursorPosition, adjustedCursorPosition);
      }
    }, 0);
  };

  const handlePaymentSubmit = () => {
    const appointment = selectedAppointmentForPayment;
    if (!appointment) return;

    // Validate received amount
    const receivedAmountNum = parseFloat(receivedAmount);
    if (isNaN(receivedAmountNum) || receivedAmountNum < appointment.totalCharge) {
      setReceivedAmountError(`Amount must be at least ${formatCurrency(appointment.totalCharge)}`);
      return;
    }

    let cardDetails = undefined;
    if (selectedPaymentMethod === 'card') {
      const cleanCardNumber = getCleanCardNumber(cardNumber);
      const isValidCard = validateCardNumber(cleanCardNumber);
      
      if (!isValidCard) {
        setCardNumberError('Please enter a valid card number');
        return;
      }

      cardDetails = {
        maskedNumber: maskCardNumber(cleanCardNumber),
        storedNumber: getStoredCardNumber(cleanCardNumber),
        cardType: detectCardType(cleanCardNumber)
      };
    }

    handleProcessPayment(appointment.id!, selectedPaymentMethod, cardDetails);
  };

  // Handle editing appointment amount
  const openEditAmountDialog = (appointment: Appointment) => {
    setSelectedAppointmentForAmountEdit(appointment);
    setEditingAppointmentAmount((appointment.manualAppointmentAmount || 0).toString());
    setShowEditAmountDialog(true);
  };

  const handleSaveAppointmentAmount = async () => {
    if (!selectedAppointmentForAmountEdit || !selectedAppointmentForAmountEdit.id) return;

    const amount = parseFloat(editingAppointmentAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setUpdatingAmount(true);
    try {
      await appointmentService.updateAppointment(selectedAppointmentForAmountEdit.id, {
        manualAppointmentAmount: amount
      });

      // Update local state
      setLocalAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointmentForAmountEdit.id 
            ? { ...apt, manualAppointmentAmount: amount }
            : apt
        )
      );

      toast.success('Appointment amount updated successfully');
      setShowEditAmountDialog(false);
      setSelectedAppointmentForAmountEdit(null);
      setEditingAppointmentAmount('');

      // Trigger refresh if callback provided
      if (onAppointmentUpdated) {
        onAppointmentUpdated();
      }
    } catch (error) {
      console.error('Error updating appointment amount:', error);
      toast.error('Failed to update appointment amount');
    } finally {
      setUpdatingAmount(false);
    }
  };

  // Handle deleting appointment
  const handleDeleteAppointment = async () => {
    if (!selectedAppointmentForDelete || !selectedAppointmentForDelete.id) return;

    const appointmentId = selectedAppointmentForDelete.id;
    
    try {
      setProcessingDelete(appointmentId);
      await appointmentService.deleteAppointment(appointmentId);
      
      // Remove from local state
      setLocalAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
      
      // Also remove from prescriptions if exists
      setAppointmentPrescriptions(prev => {
        const updated = { ...prev };
        delete updated[appointmentId];
        return updated;
      });
      
      toast.success('Appointment deleted successfully');
      setShowDeleteDialog(false);
      setSelectedAppointmentForDelete(null);
      
      // Refresh session stats after deletion
      if (doctorSession?.id) {
        await updateSessionStats();
      }
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      toast.error(error.message || 'Failed to delete appointment');
    } finally {
      setProcessingDelete(null);
    }
  };

  const openDeleteDialog = (appointment: Appointment) => {
    setSelectedAppointmentForDelete(appointment);
    setShowDeleteDialog(true);
  };

  const renderAppointmentRow = (appointment: Appointment, index: number) => {
    const hasPrescription = appointmentPrescriptions[appointment.id!];
    const isArchived = appointment.payment?.isPaid && !appointment.payment?.refunded && hasPrescription;
    
    return (
      <TableRow key={appointment.id || index} className={`hover:bg-gray-50 ${isArchived ? 'bg-green-50/50 border-l-4 border-l-green-500' : hasPrescription ? 'bg-green-50/30' : ''}`}>
        <TableCell className="font-mono text-sm font-medium text-slate-900 whitespace-nowrap">
          #{appointment.sessionAppointmentNumber || (index + 1)}
        </TableCell>

        <TableCell className="font-medium min-w-[200px]">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{appointment.patientName}</span>
              {isArchived && (
                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs whitespace-nowrap">
                  <Archive className="h-3 w-3 mr-1" />
                  Done
                </Badge>
              )}
              {hasPrescription && !isArchived && (
                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs whitespace-nowrap">
                  <Pill className="h-3 w-3 mr-1" />
                  Rx
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-500">{appointment.patientContact}</span>
              {/* Tiny prescription buttons in patient name column */}
              {userRole === 'doctor' && appointment.doctorId === currentDoctorId && !appointment.payment?.refunded && (
                <Button
                  variant={hasPrescription ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddPrescription(appointment);
                  }}
                  className={`h-6 px-2 text-xs whitespace-nowrap ${
                    hasPrescription 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'text-green-600 border-green-600 hover:bg-green-50'
                  }`}
                  title={hasPrescription ? 'Edit Prescription' : 'Add Prescription'}
                >
                  <Pill className="h-3 w-3 mr-0.5" />
                  {hasPrescription ? 'Edit' : 'Add'}
                </Button>
              )}
              {/* Disabled button for refunded appointments */}
              {userRole === 'doctor' && appointment.doctorId === currentDoctorId && appointment.payment?.refunded && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-6 px-2 text-xs text-gray-400 border-gray-300 whitespace-nowrap"
                  title="Cannot add prescription - appointment has been refunded"
                >
                  <Pill className="h-3 w-3 mr-0.5" />
                  Rx
                </Button>
              )}
            </div>
          </div>
        </TableCell>
        
        <TableCell className="min-w-[120px]">
          <div className="text-sm">
            {appointment.procedures && appointment.procedures.length > 0 
              ? appointment.procedures.map(proc => proc.procedureName).join(', ')
              : '-'}
          </div>
        </TableCell>
        
        <TableCell className="text-right font-medium whitespace-nowrap">
          {formatCurrency(appointment.totalCharge)}
        </TableCell>
        
        <TableCell className="min-w-[120px]">
          <div className="flex items-center space-x-2">
            <Button
              variant={appointment.isPatientArrived ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggleArrival(appointment.id!, appointment.isPatientArrived || false)}
              disabled={processingArrival === appointment.id || isArrivalStatusDisabled(appointment)}
              className={`whitespace-nowrap ${
                appointment.isPatientArrived 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'border-green-600 text-green-600 hover:bg-green-50'
              } ${isArrivalStatusDisabled(appointment) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {processingArrival === appointment.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <UserCheck className="h-3 w-3 mr-1" />
              )}
              {appointment.isPatientArrived ? 'Arrived' : 'Mark'}
            </Button>
          </div>
        </TableCell>
        
        <TableCell className="min-w-[120px]">
          <div className="flex items-center space-x-2 flex-wrap">
            {appointment.payment?.refunded ? (
              <Badge variant="destructive" className="bg-red-100 text-red-800 whitespace-nowrap">
                Refunded
              </Badge>
            ) : appointment.payment?.isPaid ? (
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <Badge variant="default" className="bg-green-100 text-green-800 whitespace-nowrap">
                  Paid
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleProcessRefund(appointment.id!)}
                  disabled={processingRefund === appointment.id}
                  className="text-red-600 border-red-600 hover:bg-red-50 whitespace-nowrap"
                >
                  {processingRefund === appointment.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-3 w-3 mr-1" />
                  )}
                  Refund
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openPaymentDialog(appointment)}
                disabled={processingPayment === appointment.id}
                className="text-blue-600 border-blue-600 hover:bg-blue-50 whitespace-nowrap"
              >
                {processingPayment === appointment.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CreditCard className="h-3 w-3 mr-1" />
                )}
                Pay
              </Button>
            )}
          </div>
        </TableCell>

        <TableCell className="min-w-[180px]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center flex-wrap gap-1.5">
              {hasPrescription ? (
                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs whitespace-nowrap">
                  <Pill className="h-3 w-3 mr-1" />
                  Prescribed
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs whitespace-nowrap">
                  <Pill className="h-3 w-3 mr-1" />
                  No Rx
                </Badge>
              )}
              
              {userRole === 'doctor' && appointment.doctorId === currentDoctorId && !appointment.payment?.refunded && (
                <Button
                  variant={hasPrescription ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAddPrescription(appointment)}
                  className={`whitespace-nowrap ${
                    hasPrescription 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'text-green-600 border-green-600 hover:bg-green-50'
                  }`}
                >
                  <Pill className="h-3 w-3 mr-1" />
                  {hasPrescription ? 'Edit' : 'Add'}
                </Button>
              )}
            </div>
            

            {/* Show disabled prescription button for refunded appointments */}
            {userRole === 'doctor' && appointment.doctorId === currentDoctorId && appointment.payment?.refunded && (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="text-gray-400 border-gray-300 whitespace-nowrap"
                title="Cannot add prescription - appointment has been refunded"
              >
                <Pill className="h-3 w-3 mr-1" />
                Rx
              </Button>
            )}
          </div>
        </TableCell>

        <TableCell className="min-w-[100px]">
          <div className="flex items-center space-x-2">
            {/* Edit Button */}
            {(userRole === 'admin' || userRole === 'doctor') && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditAppointment(appointment)}
                  className="text-gray-600 border-gray-600 hover:bg-gray-50 whitespace-nowrap"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                {/* Delete Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteDialog(appointment)}
                  disabled={processingDelete === appointment.id}
                  className="text-red-600 border-red-600 hover:bg-red-50 whitespace-nowrap"
                >
                  {processingDelete === appointment.id ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  Delete
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // Calculate totals
  const totalPatients = localAppointments.length;
  const arrivedPatients = localAppointments.filter(apt => apt.isPatientArrived).length;
  const paidAppointments = localAppointments.filter(apt => apt.payment?.isPaid && !apt.payment?.refunded).length;
  const totalRevenue = localAppointments
    .filter(apt => apt.payment?.isPaid && !apt.payment?.refunded)
    .reduce((sum, apt) => sum + apt.totalCharge, 0);
  const totalDoctorFees = localAppointments
    .filter(apt => apt.isPatientArrived && apt.payment?.isPaid && !apt.payment?.refunded)
    .reduce((sum, apt) => sum + apt.procedures.reduce((procSum, proc) => procSum + proc.doctorCharge, 0), 0);
  
  // Calculate prescription statistics
  const appointmentsWithPrescriptions = localAppointments.filter(apt => appointmentPrescriptions[apt.id!]).length;
  const appointmentsWithoutPrescriptions = totalPatients - appointmentsWithPrescriptions;
  const prescriptionRate = totalPatients > 0 ? Math.round((appointmentsWithPrescriptions / totalPatients) * 100) : 0;

  // Separate active and archived appointments
  // Archived = Paid AND Prescribed
  const archivedAppointments = localAppointments.filter(apt => 
    apt.payment?.isPaid && 
    !apt.payment?.refunded && 
    appointmentPrescriptions[apt.id!]
  );
  
  const activeAppointments = localAppointments.filter(apt => 
    !(apt.payment?.isPaid && !apt.payment?.refunded && appointmentPrescriptions[apt.id!])
  );

  // Appointments to display based on toggle
  const displayedAppointments = showArchivedAppointments ? localAppointments : activeAppointments;

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] h-screen max-h-screen overflow-hidden p-0 flex flex-col [&>button]:hidden">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex-shrink-0 relative">
  <div className="flex items-center justify-between pr-12">
    <div className="flex items-center space-x-2">
      <div className="p-1.5 bg-white/20 rounded-lg">
        <Stethoscope className="h-5 w-5" />
      </div>
      <div>
        <DialogTitle className="text-lg font-semibold">
          Dr. {doctorName}
        </DialogTitle>
        <p className="text-blue-100 text-xs mt-0.5">
          {doctorSpeciality} • {formatAppointmentDate(date)} • {startTime} - {endTime}
        </p>
      </div>
    </div>
    
    {/* Header Actions */}
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleFullscreen}
        className="text-white hover:bg-white/20 h-8 w-8 p-0"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? (
          <Minimize className="h-3.5 w-3.5" />
        ) : (
          <Maximize className="h-3.5 w-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="text-white hover:bg-white/20 h-8 px-3"
      >
        {isRefreshing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            <span className="text-xs">Refreshing...</span>
          </>
        ) : (
          <>
            <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Refresh</span>
          </>
        )}
      </Button>
    </div>
  </div>
  
  {/* Enhanced Close Button */}
  <Button
    variant="ghost"
    size="icon"
    onClick={onClose}
    className="absolute top-4 right-4 h-9 w-9 md:h-10 md:w-10 rounded-full bg-red-500 hover:bg-red-600 text-white hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl z-10"
    aria-label="Close modal"
  >
    <X className="h-5 w-5 md:h-6 md:w-6" />
  </Button>
</DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                
                {/* Doctor Session Status */}
                {doctorSession && (
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span>Doctor Session Status</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                       <div className="flex items-center space-x-2">
                         <div className={`p-1.5 rounded-full ${doctorSession.isArrived ? 'bg-green-100' : 'bg-gray-100'}`}>
                           <CheckCircle className={`h-3 w-3 ${doctorSession.isArrived ? 'text-green-600' : 'text-gray-400'}`} />
                         </div>
                         <div>
                           <p className="text-xs font-medium">Doctor Arrival</p>
                           <p className={`text-xs ${doctorSession.isArrived ? 'text-green-600' : 'text-gray-500'}`}>
                             {doctorSession.isArrived ? 'Arrived' : 'Not Arrived'}
                           </p>
                         </div>
                       </div>
                       
                       <div className="flex items-center space-x-2">
                         <div className={`p-1.5 rounded-full ${doctorSession.isDeparted ? 'bg-orange-100' : 'bg-gray-100'}`}>
                           <LogOut className={`h-3 w-3 ${doctorSession.isDeparted ? 'text-orange-600' : 'text-gray-400'}`} />
                         </div>
                         <div>
                           <p className="text-xs font-medium">Doctor Departure</p>
                           <p className={`text-xs ${doctorSession.isDeparted ? 'text-orange-600' : 'text-gray-500'}`}>
                             {doctorSession.isDeparted ? 'Departed' : 'Present'}
                           </p>
                         </div>
                       </div>
                       
                       <div className="flex items-center space-x-2">
                         <div className={`p-1.5 rounded-full ${doctorSession.isPaid ? 'bg-green-100' : 'bg-gray-100'}`}>
                           <DollarSign className={`h-3 w-3 ${doctorSession.isPaid ? 'text-green-600' : 'text-gray-400'}`} />
                         </div>
                         <div>
                           <p className="text-xs font-medium">Fee Payment</p>
                           <p className={`text-xs ${doctorSession.isPaid ? 'text-green-600' : 'text-gray-500'}`}>
                             {doctorSession.isPaid ? 'Paid' : 'Pending'}
                           </p>
                         </div>
                       </div>
                       
                       <div className="flex items-center space-x-2">
                         <div className="p-1.5 rounded-full bg-blue-100">
                           <DollarSign className="h-3 w-3 text-blue-600" />
                         </div>
                         <div>
                           <p className="text-xs font-medium">Doctor Fees</p>
                           <p className="text-xs text-blue-600 font-semibold">
                             {formatCurrency(doctorSession.totalDoctorFees)}
                           </p>
                         </div>
                       </div>
                     </div>

                     {/* Doctor Action Buttons */}
                     <div className="flex items-center space-x-2 pt-2 border-t">
                       {!doctorSession.isArrived && (
                         <Button
                           onClick={handleDoctorArrival}
                           disabled={processingDoctorAction}
                           className="bg-green-600 hover:bg-green-700 h-8 text-xs px-3"
                         >
                           {processingDoctorAction ? (
                             <>
                               <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                               Processing...
                             </>
                           ) : (
                             <>
                               <CheckCircle className="h-3 w-3 mr-1.5" />
                               Mark Doctor Arrived
                             </>
                           )}
                         </Button>
                       )}
                       
                       {doctorSession.isArrived && !doctorSession.isDeparted && doctorSession.totalDoctorFees > 0 && (
                         <Button
                           onClick={() => setShowDoctorFeeDialog(true)}
                           disabled={processingDoctorAction}
                           className="bg-orange-600 hover:bg-orange-700 h-8 text-xs px-3"
                         >
                           <LogOut className="h-3 w-3 mr-1.5" />
                           Process Departure & Pay Fee
                         </Button>
                       )}

                       {/* Post-departure expense button */}
                       {postDepartureInfo && postDepartureInfo.canCreateExpense && (
                         <Button
                           onClick={() => setShowPostDepartureExpenseDialog(true)}
                           disabled={processingDoctorAction}
                           className="bg-purple-600 hover:bg-purple-700 h-8 text-xs px-3"
                         >
                           <Plus className="h-3 w-3 mr-1.5" />
                           Create Post-Departure Expense ({formatCurrency(postDepartureInfo.unpaidPostDepartureFees)})
                         </Button>
                       )}
                     </div>
                   </CardContent>
                 </Card>
               )}

               {/* Session Statistics */}
               <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                 <Card>
                   <CardContent className="p-2.5 text-center">
                     <div className="flex items-center justify-center mb-1">
                       <Users className="h-4 w-4 text-blue-600" />
                     </div>
                     <p className="text-lg font-bold text-gray-900">{totalPatients}</p>
                     <p className="text-xs text-gray-600">Total Patients</p>
                   </CardContent>
                 </Card>
                 
                 <Card>
                   <CardContent className="p-2.5 text-center">
                     <div className="flex items-center justify-center mb-1">
                       <CheckCircle className="h-4 w-4 text-green-600" />
                     </div>
                     <p className="text-lg font-bold text-gray-900">{arrivedPatients}</p>
                     <p className="text-xs text-gray-600">Arrived</p>
                   </CardContent>
                 </Card>
                 
                 <Card>
                   <CardContent className="p-2.5 text-center">
                     <div className="flex items-center justify-center mb-1">
                       <CreditCard className="h-4 w-4 text-blue-600" />
                     </div>
                     <p className="text-lg font-bold text-gray-900">{paidAppointments}</p>
                     <p className="text-xs text-gray-600">Paid</p>
                   </CardContent>
                 </Card>
                 
                 <Card>
                   <CardContent className="p-2.5 text-center">
                     <div className="flex items-center justify-center mb-1">
                       <Pill className="h-4 w-4 text-green-600" />
                     </div>
                     <p className="text-lg font-bold text-gray-900">{appointmentsWithPrescriptions}</p>
                     <p className="text-xs text-gray-600">Prescribed</p>
                   </CardContent>
                 </Card>
                 
                 <Card>
                   <CardContent className="p-2.5 text-center">
                     <div className="flex items-center justify-center mb-1">
                       <TrendingUp className="h-4 w-4 text-green-600" />
                     </div>
                     <p className="text-lg font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                     <p className="text-xs text-gray-600">Total Revenue</p>
                   </CardContent>
                 </Card>
                 
                 <Card>
                   <CardContent className="p-2.5 text-center">
                     <div className="flex items-center justify-center mb-1">
                       <DollarSign className="h-4 w-4 text-purple-600" />
                     </div>
                     <p className="text-lg font-bold text-gray-900">{formatCurrency(totalDoctorFees)}</p>
                     <p className="text-xs text-gray-600">Doctor Fees</p>
                   </CardContent>
                 </Card>
               </div>

              {/* Appointments Table */}
              <Card>
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <Calendar className="h-4 w-4" />
                      <span>Appointments ({localAppointments.length})</span>
                    </CardTitle>
                    
                    {archivedAppointments.length > 0 && (
                      <Button
                        variant={showArchivedAppointments ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowArchivedAppointments(!showArchivedAppointments)}
                        className={`${
                          showArchivedAppointments 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'border-green-600 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        {showArchivedAppointments ? 'Hide' : 'Show'} Archived ({archivedAppointments.length})
                        {showArchivedAppointments ? (
                          <ChevronUp className="h-4 w-4 ml-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-2" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {localAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No appointments scheduled for this session</p>
                    </div>
                  ) : (
                    <>
                      {!showArchivedAppointments && archivedAppointments.length > 0 && (
                        <div className="bg-green-50 border-b border-green-200 px-4 py-2">
                          <p className="text-xs text-green-700 flex items-center">
                            <Archive className="h-3.5 w-3.5 mr-1.5" />
                            {archivedAppointments.length} completed appointment{archivedAppointments.length > 1 ? 's' : ''} archived (Paid & Prescribed)
                          </p>
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <Table>
                         <TableHeader>
                           <TableRow>
                           <TableHead className="font-semibold text-slate-700 min-w-[80px]">Appt. #</TableHead>
                             <TableHead className="min-w-[150px]">Patient</TableHead>
                             <TableHead className="min-w-[120px]">Procedures</TableHead>
                             <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                             <TableHead className="min-w-[120px]">Arrival</TableHead>
                             <TableHead className="min-w-[120px]">Payment</TableHead>
                             <TableHead className="min-w-[180px]">Prescription</TableHead>
                             <TableHead className="min-w-[100px]">Actions</TableHead>
                           </TableRow>
                         </TableHeader>
                          <TableBody>
                            {displayedAppointments.map((appointment, index) => 
                              renderAppointmentRow(appointment, index)
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
             </div>
           </ScrollArea>
         </div>
       </DialogContent>
     </Dialog>

     {/* Payment Dialog */}
     {showPaymentDialog && selectedAppointmentForPayment && (
       <Dialog open={showPaymentDialog} onOpenChange={() => setShowPaymentDialog(false)}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center space-x-2">
               <CreditCard className="h-5 w-5 text-blue-600" />
               <span>Process Payment</span>
             </DialogTitle>
             <DialogDescription>
               Processing payment for {selectedAppointmentForPayment.patientName}
             </DialogDescription>
           </DialogHeader>

           <div className="space-y-4">
             <div className="bg-gray-50 p-4 rounded-lg">
               <div className="flex justify-between items-center">
                 <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                 <span className="text-lg font-bold text-gray-900">
                   {formatCurrency(selectedAppointmentForPayment.totalCharge)}
                 </span>
               </div>
             </div>

             <div className="space-y-3">
               <Label htmlFor="received-amount" className="text-sm font-medium">
                 Received Amount
               </Label>
               <Input
                 id="received-amount"
                 type="number"
                 value={receivedAmount}
                 onChange={(e) => {
                   setReceivedAmount(e.target.value);
                   setReceivedAmountError('');
                 }}
                 placeholder="Enter received amount"
                 className={receivedAmountError ? 'border-red-500' : ''}
               />
               {receivedAmountError && (
                 <p className="text-sm text-red-600">{receivedAmountError}</p>
               )}
             </div>

             <div className="space-y-3">
               <Label className="text-sm font-medium">Payment Method</Label>
               <div className="flex space-x-2">
                 <Button
                   type="button"
                   variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'}
                   onClick={() => setSelectedPaymentMethod('cash')}
                   className="flex-1"
                 >
                   Cash
                 </Button>
                 <Button
                   type="button"
                   variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
                   onClick={() => setSelectedPaymentMethod('card')}
                   className="flex-1"
                 >
                   Card
                 </Button>
               </div>
             </div>

             {selectedPaymentMethod === 'card' && (
               <div className="space-y-3">
                 <Label htmlFor="card-number" className="text-sm font-medium">
                   Card Number
                 </Label>
                 <Input
                   id="card-number"
                   type="text"
                   value={cardNumber}
                   onChange={handleCardNumberChange}
                   placeholder="1234 5678 9012 3456"
                   maxLength={19}
                   className={cardNumberError ? 'border-red-500' : ''}
                 />
                 {cardNumberError && (
                   <p className="text-sm text-red-600">{cardNumberError}</p>
                 )}
               </div>
             )}
           </div>

           <DialogFooter className="gap-2">
             <Button
               variant="outline"
               onClick={() => setShowPaymentDialog(false)}
               disabled={processingPayment === selectedAppointmentForPayment.id}
             >
               Cancel
             </Button>
             <Button
               onClick={handlePaymentSubmit}
               disabled={processingPayment === selectedAppointmentForPayment.id}
               className="bg-green-600 hover:bg-green-700"
             >
               {processingPayment === selectedAppointmentForPayment.id ? (
                 <>
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   Processing...
                 </>
               ) : (
                 <>
                   <CheckCircle className="h-4 w-4 mr-2" />
                   Process Payment
                 </>
               )}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     )}

     {/* Doctor Fee Dialog */}
     {showDoctorFeeDialog && (
       <Dialog open={showDoctorFeeDialog} onOpenChange={() => setShowDoctorFeeDialog(false)}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center space-x-2">
               <LogOut className="h-5 w-5 text-orange-600" />
               <span>Process Doctor Departure</span>
             </DialogTitle>
             <DialogDescription>
               Process doctor departure and fee payment
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-4">
             <Card className="border-orange-200">
               <CardContent className="p-4">
                 <div className="space-y-3">
                   <div className="flex justify-between items-center">
                     <span className="text-sm font-medium text-gray-600">Doctor Fee:</span>
                     <span className="text-lg font-bold text-orange-600">
                       {formatCurrency(doctorSession?.totalDoctorFees || 0)}
                     </span>
                   </div>
                   
                   <Separator />
                   
                   <div className="space-y-2 text-sm text-gray-600">
                     <p className="font-medium">This will:</p>
                     <ul className="list-disc list-inside space-y-1">
                       <li>Mark the doctor as departed</li>
                       <li>Create an expense entry for the doctor fee</li>
                       <li>Mark the doctor fee as paid</li>
                     </ul>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
           
           <DialogFooter className="gap-2">
             <Button
               variant="outline"
               onClick={() => setShowDoctorFeeDialog(false)}
               disabled={processingDoctorAction}
               className="bg-white border-slate-200 hover:bg-slate-50"
             >
               Cancel
             </Button>
             <Button
               onClick={processDoctorDeparture}
               disabled={processingDoctorAction}
               className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
             >
               {processingDoctorAction ? (
                 <>
                   <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                   Processing...
                 </>
               ) : (
                 <>
                   <CheckCircle className="h-4 w-4 mr-2" />
                   Confirm Departure & Pay Fee
                 </>
               )}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     )}

     {/* Post-departure expense dialog */}
     {showPostDepartureExpenseDialog && postDepartureInfo && (
       <AlertDialog open={showPostDepartureExpenseDialog} onOpenChange={setShowPostDepartureExpenseDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle className="flex items-center space-x-2">
               <Plus className="h-5 w-5 text-purple-600" />
               <span>Create Post-Departure Expense</span>
             </AlertDialogTitle>
             <AlertDialogDescription>
               Create an expense for patients who arrived and were paid after the doctor departed.
             </AlertDialogDescription>
           </AlertDialogHeader>
           
           <div className="space-y-4">
             <div className="bg-purple-50 p-4 rounded-lg">
               <div className="space-y-2">
                 <div className="flex justify-between">
                   <span className="text-sm font-medium">Post-departure patients:</span>
                   <span className="text-sm font-bold">{postDepartureInfo.postDeparturePatients.length}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-sm font-medium">Additional doctor fees:</span>
                   <span className="text-sm font-bold text-purple-600">
                     {formatCurrency(postDepartureInfo.unpaidPostDepartureFees)}
                   </span>
                 </div>
               </div>
             </div>
             
             <div className="text-sm text-gray-600">
               <p>This will create an expense entry for the additional doctor fees from patients who were processed after the doctor departed.</p>
             </div>
           </div>
           
           <AlertDialogFooter>
             <AlertDialogCancel disabled={processingDoctorAction}>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleCreatePostDepartureExpense}
               disabled={processingDoctorAction}
               className="bg-purple-600 hover:bg-purple-700"
             >
               {processingDoctorAction ? (
                 <>
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   Creating...
                 </>
               ) : (
                 <>
                   <Plus className="h-4 w-4 mr-2" />
                   Create Expense
                 </>
               )}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     )}

    {/* Prescription Modal */}
    {showPrescriptionModal && selectedAppointmentForPrescription && (
      <AddPrescriptionModal
        appointment={selectedAppointmentForPrescription}
        onClose={() => {
          setShowPrescriptionModal(false);
          setSelectedAppointmentForPrescription(null);
        }}
        onSuccess={handlePrescriptionSuccess}
      />
    )}

    {/* Edit Appointment Amount Dialog */}
    <Dialog open={showEditAmountDialog} onOpenChange={setShowEditAmountDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            <span>Edit Appointment Fee</span>
          </DialogTitle>
          <DialogDescription>
            Update the appointment fee for {selectedAppointmentForAmountEdit?.patientName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="appointment-amount" className="text-sm font-medium">
              Appointment Fee (Rs.)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="appointment-amount"
                type="number"
                min="0"
                step="0.01"
                value={editingAppointmentAmount}
                onChange={(e) => setEditingAppointmentAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10 text-lg font-semibold"
                disabled={updatingAmount}
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter the consultation fee for this appointment
            </p>
          </div>

          {selectedAppointmentForAmountEdit && (
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient:</span>
                  <span className="font-medium">{selectedAppointmentForAmountEdit.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Fee:</span>
                  <span className="font-medium">{formatCurrency(selectedAppointmentForAmountEdit.manualAppointmentAmount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Fee:</span>
                  <span className="font-semibold text-purple-700">
                    {formatCurrency(parseFloat(editingAppointmentAmount) || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowEditAmountDialog(false);
              setSelectedAppointmentForAmountEdit(null);
              setEditingAppointmentAmount('');
            }}
            disabled={updatingAmount}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAppointmentAmount}
            disabled={updatingAmount}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {updatingAmount ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Amount
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Appointment Confirmation Dialog */}
    {showDeleteDialog && selectedAppointmentForDelete && (
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <span>Delete Appointment</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Patient:</span>
                  <span className="font-semibold">{selectedAppointmentForDelete.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Date:</span>
                  <span className="font-semibold">{formatAppointmentDate(selectedAppointmentForDelete.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Amount:</span>
                  <span className="font-semibold">{formatCurrency(selectedAppointmentForDelete.totalCharge)}</span>
                </div>
                {selectedAppointmentForDelete.payment?.isPaid && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
                    <p className="text-xs font-medium text-yellow-800">
                      ⚠️ Warning: This appointment has been paid. Deleting it will remove the payment record.
                    </p>
                  </div>
                )}
                {selectedAppointmentForDelete.payment?.refunded && (
                  <div className="mt-2 p-2 bg-gray-100 rounded border border-gray-300">
                    <p className="text-xs font-medium text-gray-700">
                      ℹ️ This appointment has been refunded.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingDelete === selectedAppointmentForDelete.id}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointment}
              disabled={processingDelete === selectedAppointmentForDelete.id}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingDelete === selectedAppointmentForDelete.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Appointment
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
   </>
 );
}
