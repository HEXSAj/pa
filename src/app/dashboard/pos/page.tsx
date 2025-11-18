// src/app/dashboard/pos/page.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft,
  DollarSign,
  Store,
  Stethoscope,
  User,
  Shield,
  Activity,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  Plus,
  RefreshCw,
  LogOut,
  LayoutDashboard,
  UserCircle2,
  Clock,
  Maximize,
  Minimize
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import withAuth from '@/components/withAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { CashierControlModal } from './CashierControlModal';
import { cashierService } from '@/services/cashierService';
import { staffService } from '@/services/staffService';
import { appointmentService } from '@/services/appointmentService';
import { EnhancedLocalPatientPOS } from './EnhancedLocalPatientPOS';
import AppointmentModal from '../appointments/AppointmentModal';
import { useAttendanceValidation } from '@/hooks/useAttendanceValidation';
import { useAutoCashierSession } from '@/hooks/useAutoCashierSession';
import AutoCashierSessionPrompt from '@/components/AutoCashierSessionPrompt';
import CashierSessionWarningBanner from '@/components/CashierSessionWarningBanner';

import SessionDetailsModal from '../appointments/SessionDetailsModal';

import EditAppointmentModal from './EditAppointmentModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';


function POSPage() {
  const router = useRouter();
  const { user, userRole, logout } = useAuth();
  
  // Attendance validation
  const { 
    validationResult, 
    isLoading: attendanceLoading, 
    isValid, 
    isClockedIn, 
    error: attendanceError,
    message: attendanceMessage,
    refreshValidation
  } = useAttendanceValidation(true);
  
  // Auto cashier session hook for staff and admin users
  const {
    showCashierPrompt,
    showWarningBanner,
    promptCashierSession,
    skipCashierSession,
    dismissWarningBanner,
    startCashierSession,
    closeCashierPrompt
  } = useAutoCashierSession();
  
  // State
  const [showCashierControlModal, setShowCashierControlModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [hasCashierSession, setHasCashierSession] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [showLocalPatientPOS, setShowLocalPatientPOS] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prescriptionDataToPOS, setPrescriptionDataToPOS] = useState<any>(null);

  const [showEditAppointment, setShowEditAppointment] = useState(false);
  const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState<any>(null);

  // Today's appointments state
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [selectedSessionData, setSelectedSessionData] = useState<{
    doctorName: string;
    doctorSpeciality: string;
    date: string;
    startTime: string;
    endTime: string;
    appointments: any[];
  } | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (!user?.uid) {
          setLoading(false);
          return;
        }

        // Check cashier session status using the correct method
        const sessionStatus = await cashierService.getActiveSession(user.uid);
        setHasCashierSession(!!sessionStatus);

        // Get user display name
        try {
          const staffUser = await staffService.getStaffById(user.uid);
          if (staffUser) {
            setUserDisplayName(staffUser.displayName || staffUser.email || 'User');
          } else if (user.email) {
            setUserDisplayName(user.email.split('@')[0]);
          }
        } catch (error) {
          console.log('Could not fetch staff name, using email');
          if (user.email) {
            setUserDisplayName(user.email.split('@')[0]);
          }
        }

        // Fetch today's appointments
        const today = getTodayDateString();
        const appointments = await appointmentService.getAppointmentsByDateRange(today, today);
        setTodayAppointments(appointments);

      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error("Failed to load POS data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user?.uid, toast]);

  useEffect(() => {
    if (user?.uid) {
      getActiveSessionId();
    }
  }, [user?.uid]);

  // Check for prescription data in localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('prescriptionPOSData');
      if (storedData) {
        try {
          const prescriptionData = JSON.parse(storedData);
          console.log('Found prescription data in localStorage, opening Local Patient POS:', prescriptionData);
          setPrescriptionDataToPOS(prescriptionData);
          setShowLocalPatientPOS(true);
          // Data will be cleared by EnhancedLocalPatientPOS after loading
        } catch (error) {
          console.error('Error parsing prescription data from localStorage:', error);
          localStorage.removeItem('prescriptionPOSData');
        }
      }
    }
  }, [router]);

  const handleEditAppointment = (appointment: any) => {
    setSelectedAppointmentForEdit(appointment);
    setShowEditAppointment(true);
  };
  
  const handleAppointmentEditSuccess = () => {
    setShowEditAppointment(false);
    setSelectedAppointmentForEdit(null);
    if (activeSessionId) {
      refreshSessionAppointments();
    }
    
    // Refresh today's appointments after editing
    const today = getTodayDateString();
    appointmentService.getAppointmentsByDateRange(today, today).then(appointments => {
      setTodayAppointments(appointments);
    }).catch(error => {
      console.error('Error refreshing appointments after edit:', error);
    });
    
    toast.success("Appointment updated successfully");
  };


  
  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
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

  // Comprehensive refresh function
  const refreshAllPOSData = async () => {
    if (!user?.uid) return;
    
    setIsRefreshing(true);
    
    try {
      // 1. Refresh session status
      const sessionStatus = await cashierService.getActiveSession(user.uid);
      setHasCashierSession(!!sessionStatus);
      
      if (sessionStatus?.id) {
        setActiveSessionId(sessionStatus.id);
        
        // 2. Update session appointment count
        await cashierService.updateSessionAppointmentCount(sessionStatus.id);
      }
      
      // 3. Fetch today's appointments
      const today = getTodayDateString();
      const appointments = await appointmentService.getAppointmentsByDateRange(today, today);
      setTodayAppointments(appointments);
      
      // 4. Refresh user display name
      try {
        const staffUser = await staffService.getStaffById(user.uid);
        if (staffUser) {
          setUserDisplayName(staffUser.displayName || staffUser.email || 'User');
        } else if (user.email) {
          setUserDisplayName(user.email.split('@')[0]);
        }
      } catch (error) {
        console.log('Could not refresh staff name, using email');
        if (user.email) {
          setUserDisplayName(user.email.split('@')[0]);
        }
      }
      
      toast.success(`POS data refreshed successfully. Found ${appointments.length} appointments for today.`);
      
    } catch (error) {
      console.error('Error refreshing POS data:', error);
      toast.error("Failed to refresh POS data. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshSessionAppointments = async () => {
    if (!activeSessionId) return;
    
    try {
      await cashierService.updateSessionAppointmentCount(activeSessionId);
      
      toast.success("Session appointments refreshed");
    } catch (error) {
      console.error('Error refreshing appointments:', error);
      toast.error("Failed to refresh appointments");
    }
  };

  // Handlers
  const handleBackToDashboard = () => {
    router.push('/dashboard/attendance');
  };

  const handleCreateAppointment = () => {
    // Check attendance first
    if (!isValid || !isClockedIn) {
      toast.error(attendanceMessage || "Please clock in first before creating appointments");
      return;
    }
    setShowAppointmentModal(true);
  };

  const getActiveSessionId = async () => {
    try {
      const session = await cashierService.getActiveSession(user?.uid || '');
      const sessionId = session?.id || null;
      setActiveSessionId(sessionId);
      return sessionId;
    } catch (error) {
      console.error('Error getting active session:', error);
      setActiveSessionId(null);
      return null;
    }
  };
  const handleAppointmentSuccess = () => {
    setShowAppointmentModal(false);
    // Refresh today's appointments after creating a new one
    const today = getTodayDateString();
    appointmentService.getAppointmentsByDateRange(today, today).then(appointments => {
      setTodayAppointments(appointments);
    }).catch(error => {
      console.error('Error refreshing appointments after creation:', error);
    });
    
    toast.success("Appointment created successfully");
  };



  const handlePrescriptionLoadToPOS = (prescriptionData: any) => {
    console.log('POS page handlePrescriptionLoadToPOS called:', prescriptionData);
    
    // Clear any return path since we're loading from within POS page
    if (typeof window !== 'undefined') {
      localStorage.removeItem('posReturnPath');
    }
    
    // Check if this is from pharmacy review
    if (prescriptionData.pharmacyReviewStatus === 'reviewed') {
      console.log('Pharmacy reviewed prescription loaded:', prescriptionData);
      toast.success('Pharmacy reviewed prescription loaded to POS', {
        description: `${prescriptionData.pharmacyReviewedItems?.length || 0} medicines reviewed and loaded`
      });
    }
    
    setPrescriptionDataToPOS(prescriptionData);
    setShowLocalPatientPOS(true);
    setShowCashierControlModal(false); // Close the cashier modal
  };

  const handleSessionUpdate = async () => {
    if (!user?.uid) return;
    
    try {
      // Check current session status
      const sessionStatus = await cashierService.getActiveSession(user.uid);
      setHasCashierSession(!!sessionStatus);
    } catch (error) {
      console.error('Error checking session status:', error);
    }
  };

  const handleLocalPatientSelect = () => {
    // Check attendance first
    if (!isValid || !isClockedIn) {
      toast.error(attendanceMessage || "Please clock in first before accessing POS");
      return;
    }
    
    if (!hasCashierSession) {
      toast.error("Please start a cashier session first");
      setShowCashierControlModal(true);
      return;
    }
    setShowLocalPatientPOS(true);
  };

    // Handle logout function
    const handleLogout = async () => {
      try {
        await logout(); // Use the context logout function which handles auto clock-out
        window.location.href = '/'; // Redirect to root path
      } catch (error) {
        console.error('Error signing out:', error);
        toast.error("Failed to sign out. Please try again.");
      }
    };
  
    // Handle back to dashboard
   
  


  if (showLocalPatientPOS) {
    return (
      <EnhancedLocalPatientPOS 
        onBack={async () => {
          // Reset appointment loading status if user goes back without completing sale
          if (prescriptionDataToPOS?.appointment?.id) {
            try {
              const { appointmentService } = await import('@/services/appointmentService');
              await appointmentService.resetAppointmentLoadingStatus(prescriptionDataToPOS.appointment.id);
              console.log(`Reset loading status for appointment ${prescriptionDataToPOS.appointment.id}`);
            } catch (error) {
              console.error('Error resetting appointment loading status:', error);
            }
          }
          
          // Check if there's a return path in localStorage
          if (typeof window !== 'undefined') {
            const returnPath = localStorage.getItem('posReturnPath');
            if (returnPath) {
              console.log('Navigating back to:', returnPath);
              localStorage.removeItem('posReturnPath');
              localStorage.removeItem('prescriptionPOSData');
              router.push(returnPath);
              return;
            }
          }
          
          setShowLocalPatientPOS(false);
          setPrescriptionDataToPOS(null); // Clear the data when going back
        }}
        prescriptionData={prescriptionDataToPOS} // Pass the prescription data
      />
    );
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading POS System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Cashier Session Warning Banner */}
      {showWarningBanner && (
        <CashierSessionWarningBanner
          onStartSession={promptCashierSession}
          onDismiss={dismissWarningBanner}
        />
      )}
      
      {/* Modern Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Logo and Navigation */}
            <div className="flex items-center space-x-4">
              <Button
                size="sm"
                onClick={handleBackToDashboard}
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg transform hover:scale-105 px-4 py-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="font-semibold">Back to Dashboard</span>
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shadow-sm">
                  <img 
                    src="/logo.png" 
                    alt="Medical Center Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Pearls Family Care</h1>
                  <p className="text-xs text-gray-500">Medical Centre Management System
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - Actions and User */}
            <div className="flex items-center space-x-3">
              {/* Quick Action Buttons */}
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={handleCreateAppointment}
                  disabled={!isValid || !isClockedIn}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:from-gray-400 disabled:to-gray-500"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Create Appointment</span>
                  <span className="lg:hidden">Create</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/dashboard/pos/today-appointments')}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:from-gray-400 disabled:to-gray-500"
                  disabled={!hasCashierSession || !isValid || !isClockedIn}
                >
                  <Users className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Today's Appointments</span>
                  <span className="lg:hidden">Appointments</span>
                </Button>
                <Button
                  size="sm"
                  onClick={refreshAllPOSData}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:from-gray-400 disabled:to-gray-500"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden lg:inline">{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                  <span className="lg:hidden">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
                
                {/* Fullscreen Toggle Button */}
                <Button
                  size="sm"
                  onClick={toggleFullscreen}
                  className={`relative overflow-hidden group flex items-center justify-center w-10 h-10 p-0 rounded-lg transition-all duration-300 transform hover:scale-110 ${
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
              </div>
              
              {/* Session Status Button */}
              <Button
                onClick={() => setShowCashierControlModal(true)}
                className={`px-4 py-2 font-medium transition-all duration-200 text-sm rounded-lg ${
                  hasCashierSession 
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl' 
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{hasCashierSession ? 'Session Active' : 'Start Session'}</span>
                <span className="sm:hidden">{hasCashierSession ? 'Active' : 'Start'}</span>
              </Button>
              
              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100/50 transition-all duration-200 px-3 py-2 rounded-lg">
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
                  <DropdownMenuItem onClick={handleBackToDashboard} className="hover:bg-gray-50">
                    <LayoutDashboard className="h-4 w-4 mr-3 text-gray-500" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          
          
          {/* Session Status Indicator */}
          <div className="mb-8">
            <div className="inline-flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${hasCashierSession ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <div 
                className={`px-6 py-3 text-sm font-medium rounded-full border-2 transition-all duration-300 ${
                  hasCashierSession 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300 shadow-lg' 
                    : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-300 shadow-lg'
                }`}
              >
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  <span className="font-semibold">
                    {hasCashierSession ? 'Cashier Session Active' : 'No Active Session'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main POS Access */}
          <div className="mb-8">
            <Button 
              size="lg" 
              onClick={handleLocalPatientSelect}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 py-6 px-12 text-xl font-bold rounded-2xl transform hover:scale-105"
              disabled={!hasCashierSession || !isValid || !isClockedIn}
            >
              <User className="h-6 w-6 mr-3" />
              Open Patient POS
            </Button>
            
            {/* Status Messages */}
            {(!isValid || !isClockedIn) && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 max-w-md mx-auto">
                <p className="text-sm text-red-700 text-center">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {attendanceMessage || "Please clock in first before accessing POS"}
                </p>
              </div>
            )}
            
            {isValid && isClockedIn && !hasCashierSession && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-md mx-auto">
                <p className="text-sm text-amber-700 text-center">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Start cashier session to enable sales
                </p>
              </div>
            )}
          </div>

          {/* Welcome Section */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200/50 max-w-2xl">
              <div className="w-24 h-24 mx-auto mb-4">
                <img 
                  src="/logo.png" 
                  alt="Pearls Family Care Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pearls Family Care
              </h2>
              <p className="text-sm font-regular text-blue-800 mb-2">
                Dr Prabath Abaywardane
              </p>
              <p className="text-gray-600 mb-4">
                Comprehensive healthcare and Medical Centre Management System
              </p>
              {userDisplayName && (
                <p className="text-sm text-gray-500">Welcome back, {userDisplayName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="group hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 overflow-hidden rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Create Appointment</h3>
              <p className="text-sm text-gray-600 mb-6">Schedule new patient appointments with doctors</p>
              <Button 
                size="sm" 
                onClick={handleCreateAppointment}
                className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium"
              >
                Create Appointment
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 overflow-hidden rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Today's Appointments</h3>
              <div className="mb-4">
                <div className="text-2xl font-bold text-purple-600 mb-1">{todayAppointments.length}</div>
                <p className="text-sm text-gray-600">Appointments scheduled</p>
              </div>
              {todayAppointments.length > 0 && (
                <div className="mb-4 max-h-32 overflow-y-auto">
                  <div className="text-xs text-gray-500 mb-2">Recent appointments:</div>
                  {todayAppointments.slice(0, 3).map((appointment, index) => (
                    <div key={appointment.id || index} className="text-xs text-gray-600 mb-1">
                      {appointment.startTime} - {appointment.patientName} ({appointment.doctorName})
                    </div>
                  ))}
                  {todayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500">+{todayAppointments.length - 3} more...</div>
                  )}
                </div>
              )}
              <Button 
                size="sm" 
                onClick={() => router.push('/dashboard/pos/today-appointments')}
                disabled={!hasCashierSession || !isValid || !isClockedIn}
                className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                View All Appointments
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 overflow-hidden rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <RefreshCw className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Refresh Data</h3>
              <p className="text-sm text-gray-600 mb-6">Update session information and sync data</p>
              <Button 
                size="sm" 
                onClick={refreshAllPOSData}
                disabled={isRefreshing}
                className="w-full rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Medical Centre Management System</h3>
            <p className="text-gray-600">
              Access comprehensive billing for medical services, pharmacy items, lab tests, and procedures
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <Button 
          onClick={handleLocalPatientSelect}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110"
          disabled={!hasCashierSession || !isValid || !isClockedIn}
        >
          <User className="h-6 w-6" />
        </Button>
        {(!hasCashierSession || !isValid || !isClockedIn) && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
        )}
      </div>
      

     
       <CashierControlModal
      open={showCashierControlModal}
      onOpenChange={setShowCashierControlModal}
      onSessionUpdate={handleSessionUpdate}
      onPrescriptionLoadToPOS={handlePrescriptionLoadToPOS} // Make sure this line exists
      
      
    />

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
          onAppointmentUpdated={() => {
            // Refresh appointments when they are updated
            if (activeSessionId) {
              refreshSessionAppointments();
            }
          }}
        />
      )}

      {showEditAppointment && selectedAppointmentForEdit && (
        <EditAppointmentModal
          appointment={selectedAppointmentForEdit}
          open={showEditAppointment}
          onClose={() => {
            setShowEditAppointment(false);
            setSelectedAppointmentForEdit(null);
          }}
          onSuccess={handleAppointmentEditSuccess}
          
        />
      )}

    
   

    {showAppointmentModal && isValid && isClockedIn && (
          <AppointmentModal
            onClose={() => setShowAppointmentModal(false)}
            onSuccess={handleAppointmentSuccess}
            // Note: sessionId, doctorId, and date are not provided for POS-based appointment creation
            // The modal will create a default session for the selected doctor and date
          />
        )}

      {/* Auto Cashier Session Prompt Modal */}
      <AutoCashierSessionPrompt
        isOpen={showCashierPrompt}
        onClose={closeCashierPrompt}
        onSessionStarted={startCashierSession}
        onSkip={skipCashierSession}
      />

      {/* Sticky Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 shadow-lg z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium">
              Developed by WebVizard Solutions PVT LTD
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm">
              Contact: 0712654267
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



export default withAuth(POSPage);