// src/app/dashboard/pos/CashierControlModal.tsx

'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation";
import { 
  DollarSign, 
  Clock, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Banknote,
  CreditCard,
  Receipt,
  Plus,
  Loader2,
  AlertTriangle,
  FileText,
  Calendar,
  Stethoscope,
  Calculator,
  RefreshCw,
  Eye,
  Users,
  Pill,
  Zap,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  Info,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { cashierService } from '@/services/cashierService';
import type { CashierSession } from '@/types/cashierSession';
import { staffService } from '@/services/staffService';
import { attendanceService } from '@/services/attendanceService';
import { attendanceValidationService } from '@/services/attendanceValidationService';
import { SessionExpenseModal } from './SessionExpenseModal';
import { CashierSessionSalesView } from './CashierSessionSalesView';
import SessionDetailsModal from '../appointments/SessionDetailsModal';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { appointmentService } from '@/services/appointmentService';


import { AppointmentPrescriptionsSection } from './AppointmentPrescriptionsSection';


import { receiptService } from '@/services/receiptService';


interface CashierControlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionUpdate?: () => void;
  onPrescriptionLoadToPOS?: (prescriptionData: any) => void; // Add this
}

export function CashierControlModal({
  open,
  onOpenChange,
  onSessionUpdate,
  onPrescriptionLoadToPOS
}: CashierControlModalProps) {
  console.log('CashierControlModal received onPrescriptionLoadToPOS:', !!onPrescriptionLoadToPOS);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeSession, setActiveSession] = useState<CashierSession | null>(null);
  const [sessionSales, setSessionSales] = useState<any[]>([]);
  const [sessionExpenses, setSessionExpenses] = useState<any[]>([]);
  const [showStartForm, setShowStartForm] = useState(false);
  const [showEndForm, setShowEndForm] = useState(false);
  const [showSessionView, setShowSessionView] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [isAttendanceActive, setIsAttendanceActive] = useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const [prescriptionPOSData, setPrescriptionPOSData] = useState<any>(null);
  
  
  // State for managing starting amounts (only LKR)


  const [startingAmounts, setStartingAmounts] = useState({
    lkr: 0 as number | string
  });
  
  // State for managing ending amounts (only LKR)
  const [endingAmounts, setEndingAmounts] = useState({
    lkr: 0
  });

  // Session verification
  const [latestSession, setLatestSession] = useState<CashierSession | null>(null);
  const [cashDiscrepancy, setCashDiscrepancy] = useState(false);
  const [discrepancyReason, setDiscrepancyReason] = useState("");
  const [showDiscrepancyForm, setShowDiscrepancyForm] = useState(false);
  
  // Ending session
  const [endAmountDiscrepancy, setEndAmountDiscrepancy] = useState(false);
  const [endAmountDiscrepancyReason, setEndAmountDiscrepancyReason] = useState("");
  const [originalEndingAmounts, setOriginalEndingAmounts] = useState({
    lkr: 0
  });

  // Appointment tracking states
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [selectedSessionData, setSelectedSessionData] = useState<any>(null);

  const [showPrescriptionsTab, setShowPrescriptionsTab] = useState(false);

  // Load initial data
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, user?.uid]);


  useEffect(() => {
    if (!open) {
      // Reset prescription tab state when modal closes
      setShowPrescriptionsTab(false);
    }
  }, [open]);

  const handleModalClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset all modal states when closing
      setShowPrescriptionsTab(false);
      setShowStartForm(false);
      setShowEndForm(false);
      setShowSessionView(false);
      setShowSessionDetails(false);
      setSelectedSessionData(null);
      setSelectedSessionId(null);
    }
    onOpenChange(isOpen);
  };



  useEffect(() => {
    console.log('State changed - showSessionView:', showSessionView);
    console.log('State changed - selectedSessionId:', selectedSessionId);
    console.log('Should render modal:', showSessionView && selectedSessionId);
  }, [showSessionView, selectedSessionId]);


  const loadData = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      console.log(`Loading data for user: ${user.uid}`);
      
      // Check attendance status first using new validation system
      setCheckingAttendance(true);
      console.log('🔍 Checking attendance for cashier session, user:', user.uid);
      
      try {
        const attendanceValidation = await attendanceValidationService.validateAttendanceForPOS(user.uid);
        console.log('📊 Cashier attendance validation result:', attendanceValidation);
        
        setIsAttendanceActive(attendanceValidation.isValid && attendanceValidation.isClockedIn);
        console.log('✅ Cashier attendance check - isActive:', attendanceValidation.isValid && attendanceValidation.isClockedIn);
      } catch (error) {
        console.error('❌ Error checking attendance for cashier session:', error);
        setIsAttendanceActive(false);
      } finally {
        setCheckingAttendance(false);
      }
      
      // Get the active session for this user
      const sessionData = await cashierService.getActiveSession(user.uid);
      console.log('Active session:', sessionData);
      if (sessionData) {
        // Convert timestamp to Date for display
        const sessionWithDate = {
          ...sessionData,
          startDate: new Date(sessionData.startDate)
        };
        setActiveSession(sessionWithDate as any);
      } else {
        setActiveSession(null);
      }
      
      // If there's an active session, get the sales, expenses, and refresh appointment count
      if (sessionData?.id) {
        console.log(`Found active session: ${sessionData.id}`);
        
        const [sales, expenses] = await Promise.all([
          cashierService.getSessionSales(sessionData.id),
          cashierService.getSessionExpenses(sessionData.id)
        ]);
        setSessionSales(sales);
        setSessionExpenses(expenses);
        
        // Load appointment count and refresh the session data with updated payment totals
        await refreshAppointmentCount();
      } else {
        // Get latest session for starting amount reference
        const latestSessionData = await cashierService.getLatestSession(user.uid);
        if (latestSessionData) {
          const latestWithDate = {
            ...latestSessionData,
            startDate: new Date(latestSessionData.startDate)
          };
          setLatestSession(latestWithDate as any);
        } else {
          setLatestSession(null);
        }
        
        // If there's a latest session with ending amounts, set those as suggested starting amounts
        if (latestSessionData?.endingAmounts) {
          setStartingAmounts({
            lkr: latestSessionData.endingAmounts.lkr || 0
          });
        }
      }
      
      // Load user info
      if (user.uid) {
        const staffData = await staffService.getStaffById(user.uid);
        if (staffData) {
          setUserDisplayName(staffData.displayName || '');
        }
      }
    } catch (error) {
      console.error('Error loading cashier data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load cashier data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  // const handleLoadPrescriptionToPOS = (prescriptionData: any) => {
  //   console.log('handleLoadPrescriptionToPOS called with:', prescriptionData);
  //   console.log('onPrescriptionLoadToPOS prop exists:', !!onPrescriptionLoadToPOS);
    
  //   // Store the prescription data in state/localStorage for the POS to pick up
  //   if (typeof window !== 'undefined') {
  //     localStorage.setItem('prescriptionPOSData', JSON.stringify(prescriptionData));
  //   }
    
  //   // Call the parent handler if it exists
  //   if (onPrescriptionLoadToPOS) {
  //     onPrescriptionLoadToPOS(prescriptionData);
  //   }
    
  //   toast({
  //     title: "Prescription Loaded",
  //     description: `${prescriptionData.prescriptionItems.length} medicines loaded.`,
  //     variant: "default",
  //   });
    
  //   // Close the modal to show the POS
  //   onOpenChange(false);
  // };

  const handleLoadPrescriptionToPOS = (prescriptionData: any) => {
    console.log('handleLoadPrescriptionToPOS called with:', prescriptionData);
    console.log('onPrescriptionLoadToPOS prop exists:', !!onPrescriptionLoadToPOS); // Add this debug line
    
    // Store the prescription data in state/localStorage for the POS to pick up
    if (typeof window !== 'undefined') {
      localStorage.setItem('prescriptionPOSData', JSON.stringify(prescriptionData));
    }
    
    // Call the parent handler if it exists
    if (onPrescriptionLoadToPOS) {
      onPrescriptionLoadToPOS(prescriptionData);
    }
    
    toast({
      title: "Prescription Loaded",
      description: `${prescriptionData.prescriptionItems.length} medicines loaded.`,
      variant: "default",
    });
    
    // Close the modal to show the POS
    onOpenChange(false);
  };


  // Refresh appointment count and payment totals



  const refreshAppointmentCount = async () => {
    if (!activeSession?.id) return;
    
    try {
      console.log('=== REFRESHING APPOINTMENT COUNT AND PAYMENT TOTALS ===');
      console.log('Current session before refresh:', activeSession);
      
      // Update session appointment count and payment totals
      await cashierService.updateSessionAppointmentCount(activeSession.id);
      const refreshedSession = await cashierService.getActiveSession(user!.uid);
      
      console.log('Session after refresh:', refreshedSession);
      console.log('Appointment count after refresh:', refreshedSession?.appointmentsCount);
      console.log('Payment totals after refresh:', {
        cashPayments: refreshedSession?.appointmentCashPayments,
        cardPayments: refreshedSession?.appointmentCardPayments,
        totalPaid: refreshedSession?.totalPaidAppointments
      });
      
      setActiveSession(refreshedSession);
      setAppointmentCount(refreshedSession?.appointmentsCount || 0);
      
      toast({
        title: "Refreshed",
        description: `Appointment data updated: ${refreshedSession?.appointmentsCount || 0} appointments`,
      });
    } catch (error) {
      console.error('Error refreshing appointment count:', error);
      toast({
        title: "Error",
        description: "Failed to refresh appointment data",
        variant: "destructive",
      });
    }
  };

  // Calculate session totals including new payment breakdown
  const calculateSessionTotals = () => {
    if (!activeSession) {
      return {
        local: { count: 0, totalLKR: 0 },
        cash: { lkr: 0 },
        card: { lkr: 0 },
        revenue: { lkr: 0 },
        expenses: { count: 0, total: 0 },
        appointments: {
          count: 0,
          totalFees: 0,
          cashPayments: 0,
          cardPayments: 0,
          paidAppointments: 0
        },
        startingAmounts: { lkr: 0 },
        endingAmounts: null,
        expectedCash: { lkr: 0 },
        cashDifference: null,
        grand: {
          totalSales: 0,
          totalRevenueLKR: 0,
          totalExpenses: 0,
          netRevenueLKR: 0,
          netCashLKR: 0,
          totalAppointmentRevenue: 0,
          grandTotalRevenue: 0
        }
      };
    }
    
    const localSales = sessionSales.filter(sale => sale.patientType === 'local');
    
    // POS Revenue calculations
    const localTotalLKR = localSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    // POS Payment method calculations
    const posCashSales = sessionSales.filter(sale => sale.paymentMethod === 'cash');
    const posCardSales = sessionSales.filter(sale => sale.paymentMethod === 'card');
    
    const posCashTotals = posCashSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const posCardTotals = posCardSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    // Expense calculations
    const totalExpenses = sessionExpenses.reduce((sum, expense) => {
      const amount = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount) || 0;
      return sum + amount;
    }, 0);
    
    // NEW: Appointment data from session (now includes payment breakdown)
    const appointmentCount = activeSession.appointmentCount || 0;
    const totalDoctorFees = activeSession.totalDoctorFees || 0;
    const appointmentCashPayments = activeSession.appointmentCashPayments || 0;
    const appointmentCardPayments = activeSession.appointmentCardPayments || 0;
    const totalPaidAppointments = activeSession.totalPaidAppointments || 0;
    
    // Combined cash and card totals (POS + Appointments)
    const totalCashLKR = posCashTotals + appointmentCashPayments;
    const totalCardLKR = posCardTotals + appointmentCardPayments;
    
    // Revenue totals (POS + Appointments)
    const totalRevenueLKR = localTotalLKR + totalDoctorFees;
    
    // Net calculations
    const netRevenueLKR = totalRevenueLKR - totalExpenses;
    const netCashLKR = totalCashLKR - totalExpenses;
    
    // Get starting amounts (only LKR)
    const startingAmountsLKR = activeSession?.startingAmounts?.lkr || 0;
    
    // Expected cash calculation (starting amount + cash sales + appointment cash - expenses)
    const expectedCashLKR = startingAmountsLKR + totalCashLKR;
    
    // Cash difference (if ending amounts provided)
    const cashDifference = activeSession?.endingAmounts ? {
      lkr: activeSession.endingAmounts.lkr - expectedCashLKR
    } : null;
    
    return {
      local: {
        count: localSales.length,
        totalLKR: localTotalLKR,
      },
      // Cash totals (POS + Appointments)
      cash: {
        lkr: totalCashLKR,
        pos: posCashTotals,
        appointments: appointmentCashPayments
      },
      // Card totals (POS + Appointments)
      card: {
        lkr: totalCardLKR,
        pos: posCardTotals,
        appointments: appointmentCardPayments
      },
      // Revenue totals (POS + Appointments)
      revenue: {
        lkr: totalRevenueLKR
      },
      expenses: {
        count: sessionExpenses.length,
        total: totalExpenses,
      },
      // NEW: Enhanced appointment totals with payment breakdown
      appointments: {
        count: appointmentCount,
        totalFees: totalDoctorFees,
        cashPayments: appointmentCashPayments,
        cardPayments: appointmentCardPayments,
        paidAppointments: totalPaidAppointments
      },
      // Starting amounts (only LKR)
      startingAmounts: {
        lkr: startingAmountsLKR
      },
      // Ending amounts (if available)
      endingAmounts: activeSession?.endingAmounts || null,
      // Expected cash amounts (only LKR)
      expectedCash: {
        lkr: expectedCashLKR
      },
      // Cash difference (if ending amounts provided)
      cashDifference,
      // Grand totals
      grand: {
        totalSales: sessionSales.length,
        totalRevenueLKR: totalRevenueLKR,
        totalExpenses: totalExpenses,
        netRevenueLKR: netRevenueLKR,
        netCashLKR: netCashLKR,
        totalAppointmentRevenue: totalDoctorFees,
        grandTotalRevenue: totalRevenueLKR
      }
    };
  };

  const sessionTotals = calculateSessionTotals();

  // Check for cash discrepancy
  const checkCashDiscrepancy = () => {
    if (!latestSession?.endingAmounts) return false;
    
    const expectedLKR = latestSession.endingAmounts.lkr;
    const actualLKR = typeof startingAmounts.lkr === 'string' ? parseFloat(startingAmounts.lkr) || 0 : startingAmounts.lkr;
    
    const hasDifference = Math.abs(expectedLKR - actualLKR) > 0.01;
    setCashDiscrepancy(hasDifference);
    return hasDifference;
  };

  // Check for end amount discrepancy
  const checkEndAmountDiscrepancy = (amounts: typeof endingAmounts) => {
    const expectedLKR = originalEndingAmounts.lkr;
    const actualLKR = amounts.lkr;
    
    const hasDifference = Math.abs(expectedLKR - actualLKR) > 0.01;
    setEndAmountDiscrepancy(hasDifference);
    return hasDifference;
  };

  // Start session
  const handleStartSession = async () => {
    if (!user?.uid) return;
    
    setProcessing(true);
    try {
      // Check for discrepancy if there's a latest session
      if (latestSession?.endingAmounts) {
        const hasDifference = checkCashDiscrepancy();
        
        if (hasDifference && !discrepancyReason.trim()) {
          setShowDiscrepancyForm(true);
          setProcessing(false);
          return;
        }
        
        // Record discrepancy if there is one
        if (hasDifference) {
          await cashierService.recordCashDiscrepancy({
            userId: user.uid,
            userName: userDisplayName,
            sessionId: latestSession.id!,
            expectedAmounts: latestSession.endingAmounts,
            actualAmounts: {
              lkr: typeof startingAmounts.lkr === 'string' ? parseFloat(startingAmounts.lkr) || 0 : startingAmounts.lkr
            },
            reason: discrepancyReason,
            createdAt: Date.now()
          });
        }
      }
      
      // Start the session
      // const session = {
      //   userId: user.uid,
      //   userName: userDisplayName || user.email || 'Unknown User',
      //   startDate: new Date(),
      //   startingAmounts: startingAmounts
      // };

      const session = {
        userId: user.uid,
        userName: userDisplayName || user.email || 'Unknown User',
        startDate: new Date(),
        startingAmounts: {
          lkr: typeof startingAmounts.lkr === 'string' ? 
               parseFloat(startingAmounts.lkr) || 0 : 
               startingAmounts.lkr
        } as { lkr: number }
      };
      
      await cashierService.startSession(session);
      
      // Reload data
      const sessionData = await cashierService.getActiveSession(user.uid);
      if (sessionData) {
        const sessionWithDate = {
          ...sessionData,
          startDate: new Date(sessionData.startDate)
        };
        setActiveSession(sessionWithDate as any);
      } else {
        setActiveSession(null);
      }
      
      // Reset forms
      setShowStartForm(false);
      setShowDiscrepancyForm(false);
      setDiscrepancyReason("");
      
      toast({
        title: "Session Started",
        description: "Cashier session started successfully",
        variant: "default",
      });
      
      // Notify parent component
      if (onSessionUpdate) {
        onSessionUpdate();
      }

   
      
    } catch (error) {
      console.error('Error starting cashier session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start cashier session",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // End session
  const handleEndSession = async () => {
    if (!activeSession?.id) return;
    
    // Calculate expected ending amounts
    const expectedAmounts = {
      lkr: sessionTotals.expectedCash.lkr
    };
    
    setOriginalEndingAmounts(expectedAmounts);
    setEndingAmounts(expectedAmounts);
    setShowEndForm(true);
  };


  const handleConfirmEndSession = async () => {
    if (!activeSession?.id) return;
    
    const sessionId = activeSession.id;
    
    // Check for discrepancy
    const hasDifference = checkEndAmountDiscrepancy(endingAmounts);
    
    // If there's a difference but no reason provided
    if (hasDifference && !endAmountDiscrepancyReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the cash amount discrepancy",
        variant: "destructive",
      });
      return;
    }
    
    setProcessing(true);
    try {
      // Record discrepancy if there is one
      if (hasDifference) {
        await cashierService.recordEndAmountDiscrepancy({
          userId: user!.uid,
          userName: userDisplayName,
          sessionId,
          expectedAmounts: originalEndingAmounts,
          actualAmounts: endingAmounts,
          reason: endAmountDiscrepancyReason,
          createdAt: Date.now()
        });
      }
      
      // End the session
      await cashierService.endSession(sessionId, endingAmounts);
      
      // Get final session data for printing
      const finalSession = await cashierService.getSessionById(sessionId);
      
      // Print the session report automatically
      try {
        await receiptService.printCashierSessionReportWithExpenses(
          finalSession,
          sessionSales,
          sessionExpenses,
          sessionTotals
        );
        
        toast({
          title: "Session Ended & Printed",
          description: "Cashier session ended successfully and receipt has been printed",
          variant: "default",
        });
      } catch (printError) {
        console.error('Error printing session receipt:', printError);
        toast({
          title: "Session Ended",
          description: "Session ended successfully, but printing failed. You can print manually.",
          variant: "default",
        });
      }
      
      // Reset state
      setActiveSession(null);
      setSessionSales([]);
      setSessionExpenses([]);
      setShowEndForm(false);
      setEndAmountDiscrepancyReason("");
      
      // Notify parent component
      if (onSessionUpdate) {
        onSessionUpdate();
      }
      
    } catch (error) {
      console.error('Error ending cashier session:', error);
      toast({
        title: "Error",
        description: "Failed to end cashier session",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRefreshCashierData = async () => {
    if (!activeSession?.id) {
      toast({
        title: "Error",
        description: "No active session to refresh",
        variant: "destructive",
      });
      return;
    }
  
    try {
      setLoading(true);
      console.log('=== REFRESHING COMPLETE CASHIER DATA ===');
      console.log('Refreshing session:', activeSession.id);
      
      // Update session appointment count and payment totals first
      await cashierService.updateSessionAppointmentCount(activeSession.id);
      
      // Get all updated data in parallel
      const [refreshedSession, sales, expenses] = await Promise.all([
        cashierService.getActiveSession(user!.uid),
        cashierService.getSessionSales(activeSession.id),
        cashierService.getSessionExpenses(activeSession.id)
      ]);
      
      // Update all state
      if (refreshedSession) {
        const sessionWithDate = {
          ...refreshedSession,
          startDate: new Date(refreshedSession.startDate)
        };
        setActiveSession(sessionWithDate as any);
        setAppointmentCount(refreshedSession.appointmentCount || 0);
        console.log('Session refreshed:', {
          appointmentCount: refreshedSession.appointmentCount,
          totalDoctorFees: refreshedSession.totalDoctorFees,
          appointmentCashPayments: refreshedSession.appointmentCashPayments,
          appointmentCardPayments: refreshedSession.appointmentCardPayments,
          totalPaidAppointments: refreshedSession.totalPaidAppointments,
          totalSalesAmount: refreshedSession.totalSalesAmount,
          totalExpenses: refreshedSession.totalExpenses
        });
      }
      
      setSessionSales(sales);
      setSessionExpenses(expenses);
      
      console.log('All data refreshed:', {
        salesCount: sales.length,
        expensesCount: expenses.length,
        appointmentCount: refreshedSession?.appointmentCount || 0
      });
      
      toast({
        title: "Data Refreshed",
        description: `Updated: ${refreshedSession?.appointmentCount || 0} appointments, ${sales.length} sales, ${expenses.length} expenses`,
      });
      
    } catch (error) {
      console.error('Error refreshing cashier data:', error);
      toast({
        title: "Refresh Error",
        description: "Failed to refresh cashier data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  

  // Handle expense added
  // const handleExpenseAdded = async () => {
  //   if (!activeSession?.id) return;
    
  //   try {
  //     // Reload session and expenses data
  //     const [sessionData, expenses] = await Promise.all([
  //       cashierService.getSessionById(activeSession.id),
  //       cashierService.getSessionExpenses(activeSession.id)
  //     ]);
  //     setActiveSession(sessionData);
  //     setSessionExpenses(expenses);
  //   } catch (error) {
  //     console.error('Error reloading after expense added:', error);
  //   }
  // };

  const handleExpenseAdded = async () => {
    if (!activeSession?.id) return;
    
    try {
      // Use the comprehensive refresh function
      await handleRefreshCashierData();
    } catch (error) {
      console.error('Error reloading after expense added:', error);
      toast({
        title: "Error",
        description: "Failed to reload data after expense added",
        variant: "destructive",
      });
    }
  };

  const handleViewSessionSales = () => {
    console.log('View Sales clicked!');
    console.log('Active Session:', activeSession);
    console.log('Active Session ID:', activeSession?.id);
    
    if (activeSession?.id) {
      console.log('Setting session view state...');
      setSelectedSessionId(activeSession.id);
      setShowSessionView(true);
    } else {
      console.log('No active session ID found');
      toast({
        title: "Error",
        description: "No active session found",
        variant: "destructive",
      });
    }
  };

  // Handle print report
  const handlePrintReport = async (sessionId: string) => {
    try {
      setProcessing(true);
      // Add your print report logic here
      toast({
        title: "Report Generated",
        description: "Session report has been generated",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };





  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Cashier Data</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading cashier data...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }


  return (
    <>
      <Dialog open={open} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50/30">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg">
                <Calculator className="h-6 w-6" />
              </div>
              Cashier Control Panel
              {activeSession && (
                <Badge variant="secondary" className="ml-3 bg-green-100 text-green-800 border-green-200 shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Session Active
                </Badge>
              )}
            </DialogTitle>
            <VisuallyHidden>
              <p>Cashier control panel for managing cash register sessions</p>
            </VisuallyHidden>
          </DialogHeader>

          <div className="space-y-8">
            {/* Attendance Check */}
            {checkingAttendance && (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="py-8">
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <div className="absolute inset-0 h-6 w-6 border-2 border-blue-200 rounded-full animate-pulse"></div>
                    </div>
                    <span className="ml-3 text-lg font-medium text-blue-700">Checking attendance status...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {!checkingAttendance && !isAttendanceActive && (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-red-50">
                <CardContent className="py-8">
                  <div className="flex items-center justify-center">
                    <div className="p-3 bg-orange-100 rounded-full mr-4">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-orange-800">Attendance Required</p>
                      <p className="text-orange-600">You must mark attendance before starting a cashier session</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Session Display */}
            {isAttendanceActive && activeSession && (
              <div className="space-y-8">
                {/* Session Header */}
                <Card className="border-0 shadow-xl bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg text-white shadow-md">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-xl font-bold text-green-800">Active Session</span>
                          <p className="text-sm text-green-600 font-medium">Session ID: {activeSession.id?.slice(-8)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={handleRefreshCashierData}
                          variant="outline"
                          className="bg-white/80 hover:bg-white border-green-300 text-green-700 shadow-md hover:shadow-lg transition-all duration-200"
                          disabled={!activeSession?.id || loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Refreshing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refresh All
                            </>
                          )}
                        </Button>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 shadow-sm">
                          <Clock className="h-3 w-3 mr-1" />
                          Started {format(new Date(activeSession.startDate), 'MMM dd, HH:mm')}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center shadow-md hover:shadow-lg transition-all duration-200 border border-blue-200">
                        <div className="p-3 bg-blue-500 rounded-full w-fit mx-auto mb-3">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-blue-600 mb-1">Starting Cash</p>
                        <p className="text-2xl font-bold text-blue-800">
                          Rs {sessionTotals.startingAmounts.lkr.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center shadow-md hover:shadow-lg transition-all duration-200 border border-green-200">
                        <div className="p-3 bg-green-500 rounded-full w-fit mx-auto mb-3">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-green-600 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-800">
                          Rs {sessionTotals.grand.grandTotalRevenue.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl text-center shadow-md hover:shadow-lg transition-all duration-200 border border-red-200">
                        <div className="p-3 bg-red-500 rounded-full w-fit mx-auto mb-3">
                          <TrendingDown className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-red-600 mb-1">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-800">
                          Rs {sessionTotals.expenses.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center shadow-md hover:shadow-lg transition-all duration-200 border border-purple-200">
                        <div className="p-3 bg-purple-500 rounded-full w-fit mx-auto mb-3">
                          <Target className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-purple-600 mb-1">Expected Cash</p>
                        <p className="text-2xl font-bold text-purple-800">
                          Rs {sessionTotals.expectedCash.lkr.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Cash Payments */}
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg text-white">
                          <Banknote className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold text-green-800">Cash Payments</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">POS Sales</span>
                          <span className="font-bold text-green-700">Rs {sessionTotals.cash.pos.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Appointments</span>
                          <span className="font-bold text-green-700">Rs {sessionTotals.cash.appointments.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-green-200 pt-3">
                          <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
                            <span className="font-semibold text-green-800">Total Cash</span>
                            <span className="text-xl font-bold text-green-900">Rs {sessionTotals.cash.lkr.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card Payments */}
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg text-white">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold text-blue-800">Card Payments</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">POS Sales</span>
                          <span className="font-bold text-blue-700">Rs {sessionTotals.card.pos.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Appointments</span>
                          <span className="font-bold text-blue-700">Rs {sessionTotals.card.appointments.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-blue-200 pt-3">
                          <div className="flex justify-between items-center p-3 bg-blue-100 rounded-lg">
                            <span className="font-semibold text-blue-800">Total Card</span>
                            <span className="text-xl font-bold text-blue-900">Rs {sessionTotals.card.lkr.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Appointments Section */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500 rounded-lg text-white">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <span className="text-lg font-bold text-indigo-800">Appointments Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl text-center shadow-md border border-slate-200">
                        <div className="p-3 bg-slate-500 rounded-full w-fit mx-auto mb-3">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Total Appointments</p>
                        <p className="text-2xl font-bold text-slate-800">{sessionTotals.appointments.count}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center shadow-md border border-green-200">
                        <div className="p-3 bg-green-500 rounded-full w-fit mx-auto mb-3">
                          <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-green-600 mb-1">Paid Appointments</p>
                        <p className="text-2xl font-bold text-green-800">{sessionTotals.appointments.paidAppointments}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center shadow-md border border-purple-200">
                        <div className="p-3 bg-purple-500 rounded-full w-fit mx-auto mb-3">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm font-medium text-purple-600 mb-1">Total Doctor Fees</p>
                        <p className="text-2xl font-bold text-purple-800">Rs {sessionTotals.appointments.totalFees.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <Button 
                          variant="outline" 
                          size="lg"
                          onClick={() => window.location.href = '/dashboard/pos/today-appointments'}
                          className="w-full h-full bg-white/80 hover:bg-white border-indigo-300 text-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Calendar className="h-5 w-5 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>

                    {/* Payment Method Breakdown for Appointments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 shadow-sm">
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-green-700 flex items-center gap-2">
                           <div className="p-1 bg-green-500 rounded text-white">
                             <Banknote className="h-4 w-4" />
                           </div>
                           Cash Payments
                         </span>
                         <span className="font-bold text-green-800 text-lg">
                           Rs {sessionTotals.appointments.cashPayments.toFixed(2)}
                         </span>
                       </div>
                     </div>
                     <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-blue-700 flex items-center gap-2">
                           <div className="p-1 bg-blue-500 rounded text-white">
                             <CreditCard className="h-4 w-4" />
                           </div>
                           Card Payments
                         </span>
                         <span className="font-bold text-blue-800 text-lg">
                           Rs {sessionTotals.appointments.cardPayments.toFixed(2)}
                         </span>
                       </div>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Prescriptions Section */}
               {activeSession && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-teal-500 rounded-lg text-white">
                          <Pill className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold text-teal-800">Session Prescriptions</span>
                      </CardTitle>
                      <Button
                        variant={showPrescriptionsTab ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowPrescriptionsTab(!showPrescriptionsTab)}
                        className={showPrescriptionsTab ? "bg-teal-600 hover:bg-teal-700" : "border-teal-300 text-teal-700 hover:bg-teal-50"}
                      >
                        {showPrescriptionsTab ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Hide Prescriptions
                          </>
                        ) : (
                          <>
                            <Pill className="h-4 w-4 mr-2" />
                            View Prescriptions
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {showPrescriptionsTab && (
                    <CardContent>
                      <AppointmentPrescriptionsSection
                        sessionId={activeSession.id!}
                        appointmentIds={activeSession.appointmentIds || []}
                        onLoadPrescriptionToPOS={handleLoadPrescriptionToPOS}
                      />
                    </CardContent>
                  )}
                </Card>
              )}

               {/* Action Buttons */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    onClick={handleViewSessionSales}
                    variant="outline"
                    className="h-16 bg-white/80 hover:bg-white border-blue-300 text-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Receipt className="h-5 w-5" />
                      <span className="text-sm font-medium">View Sales</span>
                      <span className="text-xs text-blue-600">({sessionTotals.grand.totalSales})</span>
                    </div>
                  </Button>
                 
                 <Button
                   onClick={() => setShowExpenseModal(true)}
                   variant="outline"
                   className="h-16 bg-white/80 hover:bg-white border-green-300 text-green-700 shadow-md hover:shadow-lg transition-all duration-200"
                 >
                   <div className="flex flex-col items-center gap-1">
                     <Plus className="h-5 w-5" />
                     <span className="text-sm font-medium">Add Expense</span>
                     <span className="text-xs text-green-600">({sessionTotals.expenses.count})</span>
                   </div>
                 </Button>
                 
                 <Button
                   onClick={() => handlePrintReport(activeSession.id!)}
                   variant="outline"
                   disabled={processing}
                   className="h-16 bg-white/80 hover:bg-white border-purple-300 text-purple-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                 >
                   <div className="flex flex-col items-center gap-1">
                     {processing ? (
                       <Loader2 className="h-5 w-5 animate-spin" />
                     ) : (
                       <FileText className="h-5 w-5" />
                     )}
                     <span className="text-sm font-medium">
                       {processing ? 'Generating...' : 'Print Report'}
                     </span>
                   </div>
                 </Button>
                 
                 <Button
                   onClick={handleEndSession}
                   variant="destructive"
                   className="h-16 bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                 >
                   <div className="flex flex-col items-center gap-1">
                     <Clock className="h-5 w-5" />
                     <span className="text-sm font-medium">End Session</span>
                     <span className="text-xs text-red-200">Finalize</span>
                   </div>
                 </Button>
               </div>
             </div>
           )}

           {/* No Active Session */}
           {isAttendanceActive && !activeSession && !showStartForm && (
             <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-gray-50">
               <CardHeader className="text-center pb-4">
                 <div className="mx-auto w-16 h-16 bg-gradient-to-br from-slate-400 to-gray-500 rounded-full flex items-center justify-center mb-4">
                   <User className="h-8 w-8 text-white" />
                 </div>
                 <CardTitle className="text-xl font-bold text-slate-800">No Active Session</CardTitle>
               </CardHeader>
               <CardContent className="text-center">
                 <p className="text-gray-600 mb-6 text-lg">
                   Start a new cashier session to begin tracking sales and appointments.
                 </p>
                 <Button 
                   onClick={() => setShowStartForm(true)}
                   className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                 >
                   <Zap className="h-5 w-5 mr-2" />
                   Start New Session
                 </Button>
               </CardContent>
             </Card>
           )}

           {/* Start Session Form */}
           {showStartForm && (
             <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
               <CardHeader className="text-center pb-4">
                 <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                   <Sparkles className="h-8 w-8 text-white" />
                 </div>
                 <CardTitle className="text-xl font-bold text-blue-800">Start New Cashier Session</CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div className="bg-white/60 p-6 rounded-xl border border-blue-200">
                   <Label htmlFor="startingLKR" className="text-lg font-semibold text-blue-800 mb-3 block">
                     Starting Cash Amount (LKR)
                   </Label>
                  <Input
                    id="startingLKR"
                    type="number"
                    step="0.01"
                    value={startingAmounts.lkr}
                    onChange={(e) => setStartingAmounts(prev => ({
                      ...prev,
                      lkr: e.target.value === '' ? '' : parseFloat(e.target.value)
                    }))}
                    placeholder="0.00"
                    className="text-lg font-semibold border-blue-300 focus:border-blue-500"
                  />
                   {latestSession?.endingAmounts && (
                     <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-200">
                       <p className="text-sm text-blue-700 font-medium">
                         <Info className="h-4 w-4 inline mr-1" />
                         Previous session ended with: Rs {latestSession.endingAmounts.lkr.toFixed(2)}
                       </p>
                     </div>
                   )}
                 </div>

                 {showDiscrepancyForm && (
                   <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-300 shadow-md">
                     <div className="flex items-center gap-3 mb-4">
                       <div className="p-2 bg-yellow-500 rounded-lg">
                         <AlertTriangle className="h-5 w-5 text-white" />
                       </div>
                       <span className="font-semibold text-yellow-800 text-lg">Cash Amount Discrepancy</span>
                     </div>
                     <div className="bg-yellow-100 p-4 rounded-lg mb-4 border border-yellow-200">
                       <p className="text-sm text-yellow-800 font-medium">
                         Expected: Rs {latestSession?.endingAmounts?.lkr.toFixed(2)} | 
                         Actual: Rs {(typeof startingAmounts.lkr === 'string' ? parseFloat(startingAmounts.lkr) || 0 : startingAmounts.lkr).toFixed(2)}
                       </p>
                     </div>
                     <div>
                       <Label htmlFor="discrepancyReason" className="text-yellow-800 font-semibold mb-2 block">
                         Reason for difference
                       </Label>
                       <Textarea
                         id="discrepancyReason"
                         value={discrepancyReason}
                         onChange={(e) => setDiscrepancyReason(e.target.value)}
                         placeholder="Please explain the reason for the cash amount difference..."
                         className="border-yellow-300 focus:border-yellow-500"
                         rows={3}
                       />
                     </div>
                   </div>
                 )}
               </CardContent>
               <CardFooter className="flex gap-4 pt-6">
                 <Button 
                   onClick={handleStartSession} 
                   disabled={processing}
                   className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                 >
                   {processing ? (
                     <>
                       <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                       Starting Session...
                     </>
                   ) : (
                     <>
                       <CheckCircle className="h-5 w-5 mr-2" />
                       Start Session
                     </>
                   )}
                 </Button>
                 <Button 
                   variant="outline" 
                   onClick={() => {
                     setShowStartForm(false);
                     setShowDiscrepancyForm(false);
                     setDiscrepancyReason("");
                   }}
                   className="px-8 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                 >
                   <XCircle className="h-4 w-4 mr-2" />
                   Cancel
                 </Button>
               </CardFooter>
             </Card>
           )}

           {/* End Session Form */}
           {showEndForm && (
             <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-orange-50">
               <CardHeader className="text-center pb-4">
                 <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
                   <Clock className="h-8 w-8 text-white" />
                 </div>
                 <CardTitle className="text-xl font-bold text-red-800">End Cashier Session</CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-md">
                   <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                     <BarChart3 className="h-5 w-5" />
                     Session Summary
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-white/60 p-3 rounded-lg">
                       <span className="text-sm text-blue-600 font-medium">Expected Cash</span>
                       <p className="text-lg font-bold text-blue-800">Rs {originalEndingAmounts.lkr.toFixed(2)}</p>
                     </div>
                     <div className="bg-white/60 p-3 rounded-lg">
                       <span className="text-sm text-green-600 font-medium">Total Revenue</span>
                       <p className="text-lg font-bold text-green-800">Rs {sessionTotals.grand.grandTotalRevenue.toFixed(2)}</p>
                     </div>
                     <div className="bg-white/60 p-3 rounded-lg">
                       <span className="text-sm text-red-600 font-medium">Total Expenses</span>
                       <p className="text-lg font-bold text-red-800">Rs {sessionTotals.expenses.total.toFixed(2)}</p>
                     </div>
                     <div className="bg-white/60 p-3 rounded-lg">
                       <span className="text-sm text-purple-600 font-medium">Net Revenue</span>
                       <p className="text-lg font-bold text-purple-800">Rs {sessionTotals.grand.netRevenueLKR.toFixed(2)}</p>
                     </div>
                   </div>
                 </div>

                 <div className="bg-white/60 p-6 rounded-xl border border-gray-200">
                   <Label htmlFor="endingLKR" className="text-lg font-semibold text-gray-800 mb-3 block">
                     Actual Cash Count (LKR)
                   </Label>
                   <Input
                     id="endingLKR"
                     type="number"
                     step="0.01"
                     value={endingAmounts.lkr}
                     onChange={(e) => {
                       const newAmounts = {
                         ...endingAmounts,
                         lkr: parseFloat(e.target.value) || 0
                       };
                       setEndingAmounts(newAmounts);
                       checkEndAmountDiscrepancy(newAmounts);
                     }}
                     placeholder="0.00"
                     className="text-lg font-semibold border-gray-300 focus:border-gray-500"
                   />
                 </div>

                 {endAmountDiscrepancy && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border border-red-300 shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-500 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-bold text-red-800 text-lg">⚠️ Cash Count Discrepancy - Reference Required</span>
                    </div>
                    <div className="bg-red-100 p-4 rounded-lg mb-4 border border-red-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-red-600 font-medium">Expected:</span>
                          <p className="font-bold text-red-800">Rs {originalEndingAmounts.lkr.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-red-600 font-medium">Actual:</span>
                          <p className="font-bold text-red-800">Rs {endingAmounts.lkr.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-red-600 font-medium">Difference:</span>
                          <p className="font-bold text-red-800">Rs {(endingAmounts.lkr - originalEndingAmounts.lkr).toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-red-600 mt-2 font-medium">
                        You cannot end the session without providing a reference for this discrepancy.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="endDiscrepancyReason" className="text-red-800 font-semibold mb-2 block">
                        Reference/Reason for difference *
                      </Label>
                      <Textarea
                        id="endDiscrepancyReason"
                        value={endAmountDiscrepancyReason}
                        onChange={(e) => setEndAmountDiscrepancyReason(e.target.value)}
                        placeholder="Please explain the reason for the cash count difference (required)..."
                        className="border-red-300 focus:border-red-500"
                        rows={3}
                        required
                      />
                      {!endAmountDiscrepancyReason.trim() && endAmountDiscrepancy && (
                        <p className="text-xs text-red-500 mt-2 font-medium">This field is required when there's a cash discrepancy</p>
                      )}
                    </div>
                  </div>
                )}
               </CardContent>
               <CardFooter className="flex gap-4 pt-6">
                 <Button 
                   onClick={handleConfirmEndSession} 
                   disabled={processing}
                   className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                 >
                   {processing ? (
                     <>
                       <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                       Ending Session...
                     </>
                   ) : (
                     <>
                       <Clock className="h-5 w-5 mr-2" />
                       End Session
                     </>
                   )}
                 </Button>
                 <Button 
                   variant="outline" 
                   onClick={() => {
                     setShowEndForm(false);
                     setEndAmountDiscrepancyReason("");
                   }}
                   className="px-8 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                 >
                   <XCircle className="h-4 w-4 mr-2" />
                   Cancel
                 </Button>
               </CardFooter>
             </Card>
           )}
         </div>
       </DialogContent>
     </Dialog>

 
      {showSessionView && selectedSessionId && (
        <Dialog open={showSessionView} onOpenChange={(open) => {
          if (!open) {
            setShowSessionView(false);
            setSelectedSessionId(null);
          }
        }}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Session Sales View
              </DialogTitle>
              <VisuallyHidden>
                <p>Detailed view of all sales for the selected cashier session</p>
              </VisuallyHidden>
            </DialogHeader>
            <CashierSessionSalesView
              sessionId={selectedSessionId}
              onClose={() => {
                setShowSessionView(false);
                setSelectedSessionId(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}


     {/* Expense Modal */}
     {showExpenseModal && activeSession && (
       <SessionExpenseModal
         open={showExpenseModal}
         onOpenChange={setShowExpenseModal}
         sessionId={activeSession.id!}
         onExpenseAdded={handleExpenseAdded}
       />
     )}

      {showPrescriptionsTab && (
        <AppointmentPrescriptionsSection
          sessionId={activeSession.id!}
          appointmentIds={activeSession.appointmentIds || []}
          onLoadPrescriptionToPOS={handleLoadPrescriptionToPOS}
        />
      )}

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
         onEditAppointment={() => {
           // Handle edit if needed
         }}
         onAppointmentUpdated={() => {
           // Refresh appointment count when appointments are updated
           if (activeSession?.id) {
             refreshAppointmentCount();
           }
         }}
       />
     )}
   </>
 );
}