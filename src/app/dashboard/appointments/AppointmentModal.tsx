// src/app/dashboard/appointments/AppointmentModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Doctor, 
  DoctorSchedule, 
  TimeSlot, 
  DoctorProcedure, 
  formatCurrency
} from '@/types/doctor';
import { 
  Appointment, 
  AppointmentProcedure, 
  isSessionAvailable, 
  calculateTotalCharge,
  Patient,
  getSessionTimeFromId
} from '@/types/appointment';
import { formatPatientAge } from '@/utils/ageUtils';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Calendar,
  Clock,
  DollarSign,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Badge,
  AlertCircle,
  User,
  Phone,
  Stethoscope,
  FileText,
  CheckCircle,
  Circle,
  X,
  Settings,
  Upload,
  File,
  Image as ImageIcon,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from "sonner";
import { format, isBefore, startOfDay } from 'date-fns'; // Add the missing imports here

import { DateTimePicker } from './DateTimePicker';

import { useAuth } from '@/context/AuthContext';
import { cashierService } from '@/services/cashierService';
import { attendanceService } from '@/services/attendanceService';
import { staffService } from '@/services/staffService';
import { attendanceValidationService } from '@/services/attendanceValidationService';
import { businessSettingsService } from '@/services/businessSettingsService';
import { imageUploadService } from '@/services/imageUploadService';
import { AppointmentDocument } from '@/types/appointment';


interface AppointmentModalProps {
  appointment?: Appointment;
  onClose: () => void;
  onSuccess: () => void;
  sessionId?: string; // Add sessionId for session-based appointment creation
  doctorId?: string; // Add doctorId for session-based appointment creation
  date?: string; // Add date for session-based appointment creation
}

// Helper to convert day name to WeekDay type
const getDayOfWeek = (date: Date): string => {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return dayName;
};

// Helper to calculate age from DOB
const calculateAge = (dob: string): { years: number; months: number } => {
  const birthDate = new Date(dob);
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months };
};

const modalStyles = `
  .appointment-modal-content {
    z-index: 50;
  }
  
  .appointment-modal-content [data-radix-popper-content-wrapper] {
    z-index: 9999 !important;
  }
  
  .appointment-modal-content [data-radix-popover-content] {
    z-index: 9999 !important;
  }
  
  .appointment-modal-content [data-radix-popper-content] {
    z-index: 9999 !important;
  }
  
  /* Ensure proper stacking in nested modals */
  .appointment-modal-content .date-time-picker [data-radix-popover-content] {
    z-index: 10000 !important;
    position: fixed !important;
  }
`;



export default function AppointmentModal({ appointment, onClose, onSuccess, sessionId, doctorId, date }: AppointmentModalProps) {
  const isEditMode = !!appointment;
  
  // Check if this is a past appointment (add this check)
  const isPastAppointment = appointment && isBefore(new Date(appointment.date), startOfDay(new Date()));
  const [phoneDigitCount, setPhoneDigitCount] = useState(0);
  
  // Get default appointment amount from business settings
  const getDefaultAppointmentAmount = () => {
    if (isEditMode && appointment?.manualAppointmentAmount !== undefined && appointment?.manualAppointmentAmount !== null) {
      return appointment.manualAppointmentAmount.toString();
    }
    
    // For new appointments, use default from settings
    const settings = businessSettingsService.getSettings();
    if (settings.defaultAppointmentAmount !== undefined && settings.defaultAppointmentAmount !== null) {
      return settings.defaultAppointmentAmount.toString();
    }
    
    return '';
  };
  
  // Form data state
  const [formData, setFormData] = useState<{
    patientName: string;
    patientContact: string;
    patientId: string;
    patientDOB?: string;
    patientGender?: string;
    patientBodyWeight?: number;
    drugAllergies?: string;
    doctorId: string;
    date: string;
    dayOfWeek: string;
    availableTimeSlots: TimeSlot[];
    selectedTimeSlot: TimeSlot | null;
    availableProcedures: DoctorProcedure[];
    selectedProcedures: string[];
    notes: string;
    status: string;
    appointmentAmount: string;
  }>({
    patientName: '',
    patientContact: '',
    patientId: '',
    patientDOB: undefined,
    patientGender: undefined,
    patientBodyWeight: undefined,
    drugAllergies: '',
    doctorId: doctorId || '', // Use provided doctorId from session
    date: date || format(new Date(), 'yyyy-MM-dd'), // Use provided date from session
    dayOfWeek: date ? getDayOfWeek(new Date(date)) : getDayOfWeek(new Date()),
    availableTimeSlots: [],
    selectedTimeSlot: null,
    availableProcedures: [],
    selectedProcedures: [],
    notes: '',
    status: 'scheduled',
    appointmentAmount: getDefaultAppointmentAmount()
  });
  
  // Loading and error states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [doctorProcedures, setDoctorProcedures] = useState<DoctorProcedure[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [checkingPatient, setCheckingPatient] = useState(false);
  const [patientExists, setPatientExists] = useState(false);
  const [patientHasContact, setPatientHasContact] = useState(false);
  const [searchContactNumber, setSearchContactNumber] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Calculate total charge
  const [totalCharge, setTotalCharge] = useState(0);

  const [checkingSession, setCheckingSession] = useState(false);
  const [hasAttendance, setHasAttendance] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [hasAnyActiveSession, setHasAnyActiveSession] = useState(false);
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);

  const [userRole, setUserRole] = useState<string>('cashier');

  const [foundPatients, setFoundPatients] = useState<Patient[]>([]);
  const [showPatientSelection, setShowPatientSelection] = useState(false);
  const [patientNameSearch, setPatientNameSearch] = useState('');
  const [showNameSearchResults, setShowNameSearchResults] = useState(false);

  // Default appointment amount editing state
  const [showEditDefaultDialog, setShowEditDefaultDialog] = useState(false);
  const [editingDefaultAmount, setEditingDefaultAmount] = useState('');
  const [savingDefaultAmount, setSavingDefaultAmount] = useState(false);

  // Document upload state
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentDescriptions, setDocumentDescriptions] = useState<{ [key: string]: string }>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<AppointmentDocument[]>([]);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [selectedDocumentPreview, setSelectedDocumentPreview] = useState<string | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const { user } = useAuth();

  
  
  useEffect(() => {
    const loadData = async () => {
      await loadDoctors();
      await loadAppointments();
      
      // Initialize form data if editing
      if (isEditMode && appointment) {
        await initializeFormData();
      }
      
      // Load schedules if doctorId is provided (e.g., from session)
      if (doctorId && !isEditMode) {
        await loadDoctorSchedules(doctorId);
        await loadDoctorProcedures(doctorId);
      }
    };
    
    loadData();
  }, [appointment, doctorId]);

  useEffect(() => {
  if (user && !isEditMode) {
    checkCashierSessionRequirement();
  } else if (isEditMode) {
    // For edit mode, skip the check
    setSessionCheckComplete(true);
    setHasAttendance(true);
    setHasActiveSession(true);
  }
}, [user, isEditMode]);

useEffect(() => {
  const searchTimeout = setTimeout(async () => {
    if (searchContactNumber.length >= 3 && !isPastAppointment) {
      await searchPatientsRealtime(searchContactNumber);
    } else if (searchContactNumber.length < 3) {
      // Clear results if less than 3 digits
      setFoundPatients([]);
      setShowPatientSelection(false);
      setPatientExists(false);
      setPatientHasContact(false);
      setFormData(prev => ({
        ...prev,
        patientId: '',
        patientDOB: undefined,
        patientGender: undefined,
        patientBodyWeight: undefined,
        drugAllergies: ''  // Add this line
      }));
    }
  }, 500); // 500ms delay after user stops typing

  return () => clearTimeout(searchTimeout);
}, [searchContactNumber, isPastAppointment]);

// Add new useEffect for name-based patient search
useEffect(() => {
  const searchTimeout = setTimeout(async () => {
    if (patientNameSearch.length >= 2 && !isPastAppointment) {
      await searchPatientsByName(patientNameSearch);
    } else if (patientNameSearch.length < 2) {
      // Clear results if less than 2 characters
      setFoundPatients([]);
      setShowNameSearchResults(false);
    }
  }, 300); // 300ms delay after user stops typing

  return () => clearTimeout(searchTimeout);
}, [patientNameSearch, isPastAppointment]);

// Update time slots when schedules are loaded and date is available
useEffect(() => {
  if (schedules.length > 0 && formData.date && formData.doctorId) {
    updateAvailableTimeSlots(schedules, formData.date);
  }
}, [schedules, formData.date, formData.doctorId]);

const searchPatientsRealtime = async (contactNumber: string) => {
  if (!contactNumber || contactNumber.length < 3) return;
  
  setLoadingPatient(true);
  
  try {
    // Get ALL patients with this contact number
    const patients = await appointmentService.getPatientsByContact(contactNumber);

    console.log('Patients from database:', patients); // Add this debug line
    console.log('First patient drug allergies:', patients[0]?.drugAllergies);
    
    if (patients.length === 0) {
      // No patients found
      setPatientExists(false);
      setPatientHasContact(false);
      setShowPatientSelection(false);
      setFoundPatients([]);
      setFormData(prev => ({
        ...prev,
        patientId: '',
        patientDOB: undefined,
        patientGender: undefined,
        patientBodyWeight: undefined,
        drugAllergies: ''  // Change from 'undefined' to empty string
      }));
      setPhoneDigitCount(contactNumber.replace(/[^0-9]/g, '').length);
    } else if (patients.length === 1) {
      // Single patient found - auto-select
      const patient = patients[0];
      const hasContact = patient.contactNumber && patient.contactNumber.trim() !== '';
      setFormData(prev => ({
        ...prev,
        patientName: patient.name,
        patientContact: patient.contactNumber || '',
        patientId: patient.id!,
        patientDOB: patient.dateOfBirth || undefined, // Use dateOfBirth field from patient
        patientGender: patient.gender,
        patientBodyWeight: patient.bodyWeight,
        drugAllergies: patient.drugAllergies || ''  // This is already correct
      }));
      setPatientExists(true);
      setPatientHasContact(hasContact);
      setShowPatientSelection(false);
      setFoundPatients([]);
      // Update search field to show the found patient's contact
      setSearchContactNumber(patient.contactNumber || '');
      setPhoneDigitCount((patient.contactNumber || '').replace(/[^0-9]/g, '').length);
      
      // Show success message with patient details
      const dobInfo = patient.dateOfBirth ? ` (DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()})` : '';
      toast.success(`Patient found: ${patient.name}${dobInfo}`);
    } else {
      // Multiple patients found - show selection dropdown
      setFoundPatients(patients);
      setShowPatientSelection(true);
      setPatientExists(false);
      setPatientHasContact(false);
      setFormData(prev => ({
        ...prev,
        patientId: '',
        patientDOB: undefined,
        patientGender: undefined,
        patientBodyWeight: undefined,
        drugAllergies: ''  // This is already correct
      }));
      setPhoneDigitCount(contactNumber.replace(/[^0-9]/g, '').length);
    }
  } catch (error) {
    console.error('Error searching patients:', error);
    // Don't show toast for real-time search errors to avoid spam
  } finally {
    setLoadingPatient(false);
  }
};

// Add new function for name-based patient search
const searchPatientsByName = async (nameQuery: string) => {
  if (!nameQuery || nameQuery.length < 2) return;
  
  setLoadingPatient(true);
  
  try {
    // Search patients by name
    const patients = await appointmentService.searchPatientsByName(nameQuery);
    
    if (patients.length === 0) {
      // No patients found
      setFoundPatients([]);
      setShowNameSearchResults(false);
    } else {
      // Show search results
      setFoundPatients(patients);
      setShowNameSearchResults(true);
    }
  } catch (error) {
    console.error('Error searching patients by name:', error);
    setFoundPatients([]);
    setShowNameSearchResults(false);
  } finally {
    setLoadingPatient(false);
  }
};


const loadPatientDetails = async (patientId: string) => {
  try {
    const patient = await appointmentService.getPatientById(patientId);
      if (patient) {
        const hasContact = patient.contactNumber && patient.contactNumber.trim() !== '';
        setFormData(prev => ({
          ...prev,
          patientContact: patient.contactNumber || prev.patientContact,
          patientDOB: patient.dateOfBirth || undefined, // Use dateOfBirth field from patient
          patientGender: patient.gender,
          patientBodyWeight: patient.bodyWeight,
          drugAllergies: patient.drugAllergies || '' 
        }));
        setPatientHasContact(hasContact);
        setPhoneDigitCount((patient.contactNumber || '').replace(/[^0-9]/g, '').length);
        
        // Show success message with patient details
        const dobInfo = patient.dateOfBirth ? ` (DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()})` : '';
        console.log(`Patient details loaded: ${patient.name}${dobInfo}`);
      }
  } catch (error) {
    console.error('Error loading patient details:', error);
  }
};


  const checkCashierSessionRequirement = async () => {
    if (!user) return;
    
    setCheckingSession(true);
    try {
      console.log('?? Checking attendance for appointments, user:', user.uid);
      
      // Use our new attendance validation system
      const attendanceValidation = await attendanceValidationService.validateAttendanceForAppointments(user.uid);
      console.log('?? Attendance validation result:', attendanceValidation);
      
      setHasAttendance(attendanceValidation.isValid && attendanceValidation.isClockedIn);
      
      // Check cashier session separately
      const sessionCheck = await appointmentService.checkCashierSessionRequirement(user.uid);
      setHasActiveSession(sessionCheck.hasActiveSession);
      setHasAnyActiveSession(sessionCheck.hasAnyActiveSession || false);
      
      // Get user role for UI display
      const staffUser = await staffService.getStaffById(user.uid);
      setUserRole(staffUser?.role || 'cashier');
      
      console.log('? Final check results - hasAttendance:', attendanceValidation.isValid && attendanceValidation.isClockedIn, 'hasActiveSession:', sessionCheck.hasActiveSession, 'hasAnyActiveSession:', sessionCheck.hasAnyActiveSession);
      
    } catch (error) {
      console.error('? Error checking cashier session requirement:', error);
      setHasAttendance(false);
      setHasActiveSession(false);
    } finally {
      setCheckingSession(false);
      setSessionCheckComplete(true);
    }
  };
  
  
  const loadDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const data = await doctorService.getAllDoctors();
      setDoctors(data.filter(doc => doc.isActive));
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error("Failed to load doctors");
    } finally {
      setLoadingDoctors(false);
    }
  };
  
  const loadAppointments = async () => {
    try {
      const appointments = await appointmentService.getAllAppointments();
      setExistingAppointments(appointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error("Failed to load existing appointments");
    }
  };
  
  const initializeFormData = async () => {
    if (!appointment) return;
    
    // Get time slot from sessionId or use default
    let selectedTimeSlot = null;
    if (appointment.sessionId) {
      const sessionTimes = getSessionTimeFromId(appointment.sessionId);
      if (sessionTimes) {
        selectedTimeSlot = {
          startTime: sessionTimes.startTime,
          endTime: sessionTimes.endTime
        };
      }
    }
    
      // Get default appointment amount if no existing amount
      const settings = businessSettingsService.getSettings();
      let appointmentAmountValue = '';
      if (appointment.manualAppointmentAmount !== undefined && appointment.manualAppointmentAmount !== null) {
        appointmentAmountValue = appointment.manualAppointmentAmount.toString();
      } else if (settings.defaultAppointmentAmount !== undefined && settings.defaultAppointmentAmount !== null) {
        // Use default if no existing amount
        appointmentAmountValue = settings.defaultAppointmentAmount.toString();
      }
      
      setFormData({
        patientName: appointment.patientName,
        patientContact: appointment.patientContact,
        patientId: appointment.patientId,
        patientDOB: undefined, // Will be loaded from patient record
        patientGender: undefined, // Will be loaded from patient record
        patientBodyWeight: undefined, // Will be loaded from patient record
        drugAllergies: '',
        doctorId: appointment.doctorId,
        date: appointment.date,
        dayOfWeek: appointment.dayOfWeek,
        availableTimeSlots: [],
        selectedTimeSlot: selectedTimeSlot,
        availableProcedures: [],
        selectedProcedures: (appointment.procedures || []).map(p => p.procedureId),
        notes: appointment.notes || '',
        status: appointment.status,
        appointmentAmount: appointmentAmountValue
      });
    
    setTotalCharge(appointment.totalCharge || 0);
    setPatientExists(true);
    const hasContact = appointment.patientContact && appointment.patientContact.trim() !== '';
    setPatientHasContact(hasContact);
    // Update search field to show the appointment's contact
    setSearchContactNumber(appointment.patientContact || '');
    setPhoneDigitCount((appointment.patientContact || '').replace(/[^0-9]/g, '').length);
    
    // Load documents if they exist
    if (appointment.documents && appointment.documents.length > 0) {
      setUploadedDocuments(appointment.documents);
    }
    
    // Load patient details from database
    if (appointment.patientId) {
      await loadPatientDetails(appointment.patientId);
    }
    
    await loadDoctorSchedules(appointment.doctorId);
    await loadDoctorProcedures(appointment.doctorId);
  };
  
  const loadDoctorSchedules = async (doctorId: string) => {
    setLoadingSchedules(true);
    try {
      const doctorSchedules = await doctorService.getSchedulesByDoctorId(doctorId);
      const activeSchedules = doctorSchedules.filter(schedule => schedule.isActive);
      setSchedules(activeSchedules);
      
      if (formData.date) {
        updateAvailableTimeSlots(activeSchedules, formData.date);
      }
    } catch (error) {
      console.error('Error loading doctor schedules:', error);
      toast.error("Failed to load doctor schedules");
    } finally {
      setLoadingSchedules(false);
    }
  };
  
  const loadDoctorProcedures = async (doctorId: string) => {
    setLoadingProcedures(true);
    try {
      const procedures = await doctorService.getDoctorProceduresByDoctorId(doctorId);
      setDoctorProcedures(procedures.filter(proc => proc.isActive));
      setFormData(prev => ({
        ...prev,
        availableProcedures: procedures.filter(proc => proc.isActive)
      }));
    } catch (error) {
      console.error('Error loading doctor procedures:', error);
      toast.error("Failed to load doctor procedures");
    } finally {
      setLoadingProcedures(false);
    }
  };
  


  const updateAvailableTimeSlots = (schedules: DoctorSchedule[], dateString: string) => {
  const date = new Date(dateString);
  const dayOfWeek = getDayOfWeek(date);
  
  const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
  
  if (daySchedule) {
    // For appointments, show ALL time slots regardless of current time
    // This allows booking past time slots for today, but the DateTimePicker
    // already prevents selecting past dates
    const availableSlots = daySchedule.timeSlots.map(slot => {
      // Count existing appointments for this slot
      const existingCount = existingAppointments.filter(app => {
        // Get session times from sessionId
        if (!app.sessionId) return false;
        const sessionTimes = getSessionTimeFromId(app.sessionId);
        return (
          sessionTimes &&
          app.doctorId === formData.doctorId &&
          app.date === dateString &&
          sessionTimes.startTime === slot.startTime &&
          sessionTimes.endTime === slot.endTime &&
          app.status !== 'cancelled' &&
          app.id !== (isEditMode ? appointment?.id : undefined)
        );
      }).length;

      // Always show the slot, but add count info
      return {
        ...slot,
        existingCount // Add this for display purposes
      };
    });
    
    setFormData(prev => ({
      ...prev,
      dayOfWeek,
      availableTimeSlots: availableSlots,
      selectedTimeSlot: null
    }));
  } else {
    setFormData(prev => ({
      ...prev,
      dayOfWeek,
      availableTimeSlots: [],
      selectedTimeSlot: null
    }));
  }
};



  const handleDoctorChange = async (doctorId: string) => {
    setFormData(prev => ({
      ...prev,
      doctorId,
      availableTimeSlots: [],
      selectedTimeSlot: null,
      availableProcedures: [],
      selectedProcedures: []
    }));
    
    await loadDoctorSchedules(doctorId);
    await loadDoctorProcedures(doctorId);
  };
  
  const handleDateChange = (dateString: string) => {
    setFormData(prev => ({
      ...prev,
      date: dateString,
      selectedTimeSlot: null
    }));
    
    updateAvailableTimeSlots(schedules, dateString);
  };
  
  const handleTimeSlotSelect = (startTime: string, endTime: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTimeSlot: { startTime, endTime }
    }));
  };
  
  const handleProcedureToggle = (procedureId: string, checked: boolean) => {
    setFormData(prev => {
      let selectedProcs;
      if (checked) {
        selectedProcs = [...prev.selectedProcedures, procedureId];
      } else {
        selectedProcs = prev.selectedProcedures.filter(id => id !== procedureId);
      }
      
      const selectedProcedureObjects = prev.availableProcedures.filter(
        proc => selectedProcs.includes(proc.id!)
      );
      
      const procedures: AppointmentProcedure[] = selectedProcedureObjects.map(proc => ({
        procedureId: proc.id!,
        procedureName: proc.procedureName!,
        doctorCharge: proc.doctorCharge
      }));
      
      setTotalCharge(calculateTotalCharge(procedures));
      
      return {
        ...prev,
        selectedProcedures: selectedProcs
      };
    });
  };
  
  

  
  

  const checkPatient = async () => {
    if (!formData.patientContact) {
      // Contact is now optional, so we can skip the check
      return;
    }
    
    setCheckingPatient(true);
    setLoadingPatient(true);
    
    try {
      const patient = await appointmentService.getPatientByContact(formData.patientContact);
      
      if (patient) {
        setFormData(prev => ({
          ...prev,
          patientName: patient.name,
          patientId: patient.id!,
          patientDOB: patient.dateOfBirth || undefined, // Use dateOfBirth field from patient
          patientGender: patient.gender,
          patientBodyWeight: patient.bodyWeight,
          drugAllergies: patient.drugAllergies || ''  // Add this line
        }));
      const hasContact = patient.contactNumber && patient.contactNumber.trim() !== '';
      setPatientExists(true);
      setPatientHasContact(hasContact);
      // Update search field to show the found patient's contact
      setSearchContactNumber(patient.contactNumber || '');
      toast.success("Patient found");
    } else {
      setPatientExists(false);
      setPatientHasContact(false);
      setFormData(prev => ({
        ...prev,
        patientId: '',
        drugAllergies: ''  // Reset drug allergies when no patient found
      }));
      }
    } catch (error) {
      console.error('Error checking patient:', error);
      toast.error("Failed to check patient");
    } finally {
      setCheckingPatient(false);
      setLoadingPatient(false);
    }
  };
  
  const handlePatientSelect = (patient: Patient) => {
    const hasContact = patient.contactNumber && patient.contactNumber.trim() !== '';
    setFormData(prev => ({
      ...prev,
      patientName: patient.name,
      patientContact: patient.contactNumber || '',
      patientId: patient.id!,
      patientDOB: patient.dateOfBirth || undefined, // Use dateOfBirth field from patient
      patientGender: patient.gender,
      patientBodyWeight: patient.bodyWeight,
      drugAllergies: patient.drugAllergies || ''
    }));
    setPatientExists(true);
    setPatientHasContact(hasContact);
    setShowPatientSelection(false);
    setShowNameSearchResults(false);
    setFoundPatients([]);
    setPatientNameSearch(''); // Clear name search
    // Update search field to show the selected patient's contact
    setSearchContactNumber(patient.contactNumber || '');
    setPhoneDigitCount((patient.contactNumber || '').replace(/[^0-9]/g, '').length);
    
    // Show success message with patient details
    const dobInfo = patient.dateOfBirth ? ` (DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()})` : '';
    toast.success(`Patient selected: ${patient.name}${dobInfo}`);
  };




  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.patientName.trim()) {
      newErrors.patientName = "Patient name is required";
    }
    
    // Contact number is now optional, but if provided, must be valid
    if (formData.patientContact.trim() && !/^\+?[0-9\s-]{7,15}$/.test(formData.patientContact.trim())) {
      newErrors.patientContact = "Please enter a valid contact number";
    }
    
    if (!formData.doctorId) {
      newErrors.doctorId = "Please select a doctor";
    }
    
    if (!formData.date) {
      newErrors.date = "Please select a date";
    }
    
    if (!formData.selectedTimeSlot) {
      newErrors.timeSlot = "Please select an available time slot";
    }
    
    // Procedures are now optional - no validation required

    if (formData.appointmentAmount.trim() !== '') {
      const amount = parseFloat(formData.appointmentAmount);
      if (isNaN(amount) || amount < 0) {
        newErrors.appointmentAmount = 'Please enter a valid non-negative amount';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  
  


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Check session requirements for new appointments
  if (!isEditMode && user) {
    if (!hasAttendance) {
      toast.error("You must mark attendance before creating appointments");
      return;
    }
    
    if (!hasActiveSession && !hasAnyActiveSession) {
      toast.error("You must start a cashier session before creating appointments");
      return;
    }
  }
  
  if (!validateForm()) {
    toast.error("Please correct the errors in the form");
    return;
  }
  
  setIsSaving(true);
  
  try {
    let patientId = formData.patientId;
    
    // Handle patient creation or update
    if (!patientId) {
      // Create new patient
      const newPatient = await appointmentService.createPatient({
        name: formData.patientName,
        contactNumber: formData.patientContact || '', // Make contact optional
        age: formData.patientDOB ? calculateAge(formData.patientDOB).years : undefined,
        dateOfBirth: formData.patientDOB, // Save the actual date of birth
        gender: formData.patientGender,
        bodyWeight: formData.patientBodyWeight,
        drugAllergies: formData.drugAllergies
      });
      patientId = newPatient.id!;
      toast.success("New patient created");
    } else {
      // Update existing patient if details changed (for both edit and new appointments)
      const currentPatient = await appointmentService.getPatientById(patientId);
      if (currentPatient) {
        const hasChanges = 
          currentPatient.name !== formData.patientName ||
          currentPatient.contactNumber !== formData.patientContact ||
          currentPatient.age !== (formData.patientDOB ? calculateAge(formData.patientDOB).years : undefined) ||
          currentPatient.dateOfBirth !== formData.patientDOB ||
          currentPatient.gender !== formData.patientGender ||
          currentPatient.bodyWeight !== formData.patientBodyWeight||
          currentPatient.drugAllergies !== formData.drugAllergies;
        
        if (hasChanges) {
          await appointmentService.updatePatient(patientId, {
            name: formData.patientName,
            contactNumber: formData.patientContact || '', // Make contact optional
            age: formData.patientDOB ? calculateAge(formData.patientDOB).years : undefined,
            dateOfBirth: formData.patientDOB, // Save the actual date of birth
            gender: formData.patientGender,
            bodyWeight: formData.patientBodyWeight,
            drugAllergies: formData.drugAllergies
          });
          toast.success("Patient details updated");
        }
      }
    }
    
    // Continue with appointment creation/update logic...
    const selectedProcedureObjects = formData.availableProcedures.filter(
      proc => formData.selectedProcedures.includes(proc.id!)
    );
    
    const procedures: AppointmentProcedure[] = selectedProcedureObjects.map(proc => ({
      procedureId: proc.id!,
      procedureName: proc.procedureName!,
      doctorCharge: proc.doctorCharge
    }));
    
      const doctor = doctors.find(d => d.id === formData.doctorId);
      
      if (!doctor) {
        throw new Error("Selected doctor not found");
      }

      const appointmentAmountValue =
        formData.appointmentAmount.trim() !== ''
          ? parseFloat(formData.appointmentAmount)
          : undefined;
    
    // For new appointments, create or reuse a session if sessionId is not provided (for POS creation)
    let finalSessionId = sessionId;
    if (!isEditMode && !sessionId) {
      try {
        // Check if there's already an existing session for this doctor and date
        const existingAppointments = await appointmentService.getAppointmentsByDateRange(formData.date, formData.date);
        const existingSession = existingAppointments.find(apt => 
          apt.doctorId === formData.doctorId && 
          apt.date === formData.date && 
          apt.sessionId
        );
        
        if (existingSession?.sessionId) {
          // Check if the existing session matches the selected time slot
          const existingSessionInfo = existingSession.sessionId.split('_');
          if (existingSessionInfo.length >= 4) {
            const existingStartTime = existingSessionInfo[2];
            const existingEndTime = existingSessionInfo[3];
            
            // Only reuse if the time slots match
            if (formData.selectedTimeSlot && 
                existingStartTime === formData.selectedTimeSlot.startTime && 
                existingEndTime === formData.selectedTimeSlot.endTime) {
              finalSessionId = existingSession.sessionId;
              console.log('Reusing existing session ID with matching time slot:', finalSessionId);
            } else {
              // Create new session ID for different time slot
              if (formData.selectedTimeSlot) {
                finalSessionId = `${formData.doctorId}_${formData.date}_${formData.selectedTimeSlot.startTime}_${formData.selectedTimeSlot.endTime}`;
                console.log('Creating new session ID for different time slot:', finalSessionId);
              } else {
                // Fallback to first time slot if no selection made
                const doctorSchedules = await doctorService.getSchedulesByDoctorId(formData.doctorId);
                const dayOfWeek = getDayOfWeek(new Date(formData.date));
                let foundSchedule = null;
                for (const schedule of doctorSchedules) {
                  if (schedule.dayOfWeek === dayOfWeek && schedule.timeSlots.length > 0) {
                    foundSchedule = schedule;
                    break;
                  }
                }
                if (foundSchedule && foundSchedule.timeSlots.length > 0) {
                  const firstTimeSlot = foundSchedule.timeSlots[0];
                  finalSessionId = `${formData.doctorId}_${formData.date}_${firstTimeSlot.startTime}_${firstTimeSlot.endTime}`;
                  console.log('Created session ID from first time slot (no selection):', finalSessionId);
                } else {
                  finalSessionId = `${formData.doctorId}_${formData.date}_09:00_17:00`;
                  console.log('Using fallback session ID (no schedule found):', finalSessionId);
                }
              }
            }
          } else {
            // Invalid session ID format, create new one
            if (formData.selectedTimeSlot) {
              finalSessionId = `${formData.doctorId}_${formData.date}_${formData.selectedTimeSlot.startTime}_${formData.selectedTimeSlot.endTime}`;
              console.log('Creating new session ID (invalid existing format):', finalSessionId);
            } else {
              finalSessionId = `${formData.doctorId}_${formData.date}_09:00_17:00`;
              console.log('Using fallback session ID (invalid existing format):', finalSessionId);
            }
          }
        } else {
          // Try to find a matching doctor schedule for this date and use actual time slots
          const doctorSchedules = await doctorService.getSchedulesByDoctorId(formData.doctorId);
          const dayOfWeek = getDayOfWeek(new Date(formData.date));
          
          let foundSchedule = null;
          for (const schedule of doctorSchedules) {
            if (schedule.dayOfWeek === dayOfWeek && schedule.timeSlots.length > 0) {
              foundSchedule = schedule;
              break;
            }
          }
          
          if (foundSchedule && foundSchedule.timeSlots.length > 0) {
            // Use the selected time slot for session ID creation
            if (formData.selectedTimeSlot) {
              finalSessionId = `${formData.doctorId}_${formData.date}_${formData.selectedTimeSlot.startTime}_${formData.selectedTimeSlot.endTime}`;
              console.log('Created session ID from selected time slot:', finalSessionId);
            } else {
              // Fallback to first time slot if no selection made
              const firstTimeSlot = foundSchedule.timeSlots[0];
              finalSessionId = `${formData.doctorId}_${formData.date}_${firstTimeSlot.startTime}_${firstTimeSlot.endTime}`;
              console.log('Created session ID from first time slot (no selection):', finalSessionId);
            }
          } else {
            // Fallback to selected time slot or default session ID if no schedule found
            if (formData.selectedTimeSlot) {
              finalSessionId = `${formData.doctorId}_${formData.date}_${formData.selectedTimeSlot.startTime}_${formData.selectedTimeSlot.endTime}`;
              console.log('Using selected time slot for session ID (no schedule found):', finalSessionId);
            } else {
              finalSessionId = `${formData.doctorId}_${formData.date}_09:00_17:00`;
              console.log('Using fallback session ID (no schedule found):', finalSessionId);
            }
          }
        }
      } catch (error) {
        console.error('Error checking existing sessions:', error);
        // Fallback to selected time slot or default session ID
        if (formData.selectedTimeSlot) {
          finalSessionId = `${formData.doctorId}_${formData.date}_${formData.selectedTimeSlot.startTime}_${formData.selectedTimeSlot.endTime}`;
          console.log('Using selected time slot for session ID (error fallback):', finalSessionId);
        } else {
          finalSessionId = `${formData.doctorId}_${formData.date}_09:00_17:00`;
          console.log('Using fallback session ID (error fallback):', finalSessionId);
        }
      }
    }

      const appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
        patientId,
        patientName: formData.patientName,
        patientContact: formData.patientContact,
        doctorId: formData.doctorId,
        doctorName: doctor.name,
        date: formData.date,
        dayOfWeek: formData.dayOfWeek,
        procedures,
        status: formData.status as any,
        notes: formData.notes,
        totalCharge,
        ...(appointmentAmountValue !== undefined && { manualAppointmentAmount: appointmentAmountValue }),
        sessionId: finalSessionId || appointment?.sessionId // Use finalSessionId or existing one for edits
      };
    


    let savedAppointmentId: string;
    if (isEditMode && appointment?.id) {
      // Pass true as isEdit parameter for doctors
      await appointmentService.updateAppointment(appointment.id, appointmentData, user?.uid, true);
      savedAppointmentId = appointment.id;
      toast.success("Appointment updated successfully");
    } else {
      // Pass user ID for new appointments to check session requirement
      const newAppointment = await appointmentService.createAppointment(appointmentData, user?.uid);
      savedAppointmentId = newAppointment.id!;
      toast.success("Appointment booked successfully");
    }
    
    // Upload documents if any
    if (documentFiles.length > 0 && savedAppointmentId) {
      setIsUploadingDocuments(true);
      try {
        const uploadedDocs: AppointmentDocument[] = [];
        for (const file of documentFiles) {
          try {
            const description = documentDescriptions[file.name] || '';
            const documentRecord = await imageUploadService.uploadAppointmentDocument(
              file,
              savedAppointmentId,
              description
            );
            await appointmentService.addDocumentToAppointment(savedAppointmentId, documentRecord);
            uploadedDocs.push(documentRecord);
          } catch (uploadError) {
            console.error('Error uploading document:', uploadError);
            toast.error(`Failed to upload ${file.name}`);
          }
        }
        
        if (uploadedDocs.length > 0) {
          setUploadedDocuments(prev => [...prev, ...uploadedDocs]);
          setDocumentFiles([]);
          setDocumentDescriptions({});
          toast.success(`${uploadedDocs.length} document(s) uploaded successfully`);
        }
      } catch (error) {
        console.error('Error uploading documents:', error);
        toast.error('Failed to upload some documents');
      } finally {
        setIsUploadingDocuments(false);
      }
    }
    
    onSuccess();
  } catch (error: any) {
    console.error('Error saving appointment:', error);
    toast.error(error.message || "Failed to save appointment");
  } finally {
    setIsSaving(false);
  }
};



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

  // Document handling functions
  const handleDocumentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = imageUploadService.validateDocumentFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        toast.error(`${file.name}: ${validation.error}`);
      }
    }
    
    if (validFiles.length > 0) {
      setDocumentFiles(prev => [...prev, ...validFiles]);
      // Initialize descriptions for new files
      const newDescriptions: { [key: string]: string } = {};
      validFiles.forEach(file => {
        newDescriptions[file.name] = '';
      });
      setDocumentDescriptions(prev => ({ ...prev, ...newDescriptions }));
    }
    
    // Reset input
    event.target.value = '';
  };
  
  const removeDocumentFile = (fileName: string) => {
    setDocumentFiles(prev => prev.filter(file => file.name !== fileName));
    setDocumentDescriptions(prev => {
      const updated = { ...prev };
      delete updated[fileName];
      return updated;
    });
  };
  
  const removeUploadedDocument = async (documentId: string) => {
    if (!appointment?.id) return;
    
    try {
      const document = uploadedDocuments.find(doc => doc.id === documentId);
      if (document) {
        await imageUploadService.deleteAppointmentDocument(appointment.id, document.fileName);
        await appointmentService.removeDocumentFromAppointment(appointment.id, documentId);
        setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
        toast.success('Document removed successfully');
      }
    } catch (error) {
      console.error('Error removing document:', error);
      toast.error('Failed to remove document');
    }
  };
  
  const updateDocumentDescription = (fileName: string, description: string) => {
    setDocumentDescriptions(prev => ({
      ...prev,
      [fileName]: description
    }));
  };
  
  const openDocumentPreview = (url: string) => {
    setSelectedDocumentPreview(url);
  };
  
  const closeDocumentPreview = () => {
    setSelectedDocumentPreview(null);
  };

  // Handle opening edit default dialog
  const handleOpenEditDefault = () => {
    const settings = businessSettingsService.getSettings();
    setEditingDefaultAmount(settings.defaultAppointmentAmount?.toString() || '');
    setShowEditDefaultDialog(true);
  };

  // Handle saving default appointment amount
  const handleSaveDefaultAmount = async () => {
    const amount = editingDefaultAmount.trim() === '' ? undefined : parseFloat(editingDefaultAmount);
    
    if (amount !== undefined && (isNaN(amount) || amount < 0)) {
      toast.error('Please enter a valid non-negative amount');
      return;
    }

    setSavingDefaultAmount(true);
    try {
      const settings = businessSettingsService.getSettings();
      const updatedSettings = {
        ...settings,
        defaultAppointmentAmount: amount
      };
      businessSettingsService.saveSettings(updatedSettings);
      
      // Update current form data if it's using the default
      const currentSettings = businessSettingsService.getSettings();
      if (formData.appointmentAmount === (settings.defaultAppointmentAmount?.toString() || '')) {
        setFormData(prev => ({
          ...prev,
          appointmentAmount: amount !== undefined ? amount.toString() : ''
        }));
      }
      
      toast.success('Default appointment amount saved successfully');
      setShowEditDefaultDialog(false);
    } catch (error) {
      console.error('Error saving default appointment amount:', error);
      toast.error('Failed to save default appointment amount');
    } finally {
      setSavingDefaultAmount(false);
    }
  };

  // Progress indicator steps
  const getFormProgress = () => {
    const steps = [
      { key: 'patient', label: 'Patient Info', completed: formData.patientName }, // Contact is now optional
      { key: 'doctor', label: 'Doctor & Time', completed: formData.doctorId && formData.selectedTimeSlot },
      { key: 'procedures', label: 'Procedures', completed: formData.selectedProcedures.length > 0 },
      { key: 'notes', label: 'Notes', completed: true } // Optional step
    ];
    
    const completedSteps = steps.filter(step => step.completed).length;
    const progress = (completedSteps / steps.length) * 100;
    
    return { steps, completedSteps, progress };
  };

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = modalStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  const today = new Date().toISOString().split('T')[0];

  if (checkingSession) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Checking Requirements</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Checking attendance and session status...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

    // Show warning if session requirements are not met
    // Don't show warning if any user has an active session (since that means the system is already being used)
    if (!isEditMode && sessionCheckComplete && !hasAnyActiveSession && (!hasAttendance || (userRole !== 'doctor' && !hasActiveSession))) {
      return (
        <Dialog open={true} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                Requirements Not Met
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 mb-4">
                  You need to complete the following requirements before creating appointments:
                </p>
                <div className="space-y-3">
                  {!hasAttendance && (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-5 w-5 mr-3" />
                      <div className="flex-1">
                        <span className="font-medium">Mark Attendance</span>
                        <p className="text-sm text-red-500">You must clock in before creating appointments</p>
                      </div>
                    </div>
                  )}
                  {userRole !== 'doctor' && !hasActiveSession && (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-5 w-5 mr-3" />
                      <div className="flex-1">
                        <span className="font-medium">Start Cashier Session</span>
                        <p className="text-sm text-red-500">You must start a POS cashier session before creating appointments</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {!hasAttendance && (
                  <Button 
                    onClick={() => {
                      onClose();
                      window.open('/dashboard/attendance?tab=clock-in', '_blank');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Go to Attendance
                  </Button>
                )}
                {userRole !== 'doctor' && !hasActiveSession && (
                  <Button 
                    onClick={() => {
                      onClose();
                      window.open('/dashboard/pos', '_blank');
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Go to POS (Start Session)
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    }
  
  const { steps, completedSteps, progress } = getFormProgress();
  const modalTitle = formData.patientName || (isEditMode ? 'Edit Appointment' : 'New Appointment');

  return (
    <>
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[76vw] h-[98vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Enhanced Header with Modern Gradient */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-6 py-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-white">
                  {modalTitle}
                </span>
                <span className="text-xs text-blue-100 font-normal mt-0.5">
                  {isEditMode ? 'Update appointment details' : 'Create a new patient appointment'}
                </span>
              </div>
              {isPastAppointment && (
                <Badge variant="outline" className="ml-2 bg-amber-500/20 text-amber-100 border-amber-300/50 backdrop-blur-sm">
                  Past Appointment
                </Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                <div className="text-sm font-medium text-white">
                  Step {completedSteps} / {steps.length}
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Progress Indicator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-white">Completion Progress</span>
              <span className="text-blue-100 font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-3 p-0.5 shadow-inner">
              <div 
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg flex-1">
                  <div className={`p-1 rounded-full transition-all duration-300 ${
                    step.completed 
                      ? 'bg-green-400/30 text-green-100 ring-2 ring-green-400/50' 
                      : 'bg-white/20 text-white/60'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-all duration-300 ${
                    step.completed ? 'text-green-100' : 'text-white/70'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Enhanced Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/30">
          <div className="p-6 space-y-6">
            {/* Enhanced Warning for past appointments */}
            {isPastAppointment && (
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-100">
                      <AlertTriangle className="h-6 w-6 text-amber-700 flex-shrink-0" />
                    </div>
                    <div>
                      <div className="font-semibold text-amber-900 mb-1">Past Appointment Notice</div>
                      <div className="text-sm text-amber-800">
                        This is a past appointment. You can view details and update status, but scheduling changes may be limited.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
       

                <Card className="border-l-4 border-l-blue-500 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 via-blue-50/50 to-transparent border-b border-blue-100">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 mr-3 shadow-md">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-800 font-bold">Patient Information</span>
                            {formData.patientName && (
                              <CheckCircle className="h-5 w-5 text-green-500 animate-pulse" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500 font-normal">Search or create patient record</span>
                        </div>
                      </div>
                      {patientExists && (
                        <Badge className="bg-green-100 text-green-700 border border-green-300 px-3 py-1">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Existing Patient
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    {/* Enhanced Patient Search Section */}
                    <div className="space-y-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <User className="h-4 w-4 text-blue-700" />
                        </div>
                        <span className="font-bold text-blue-900">Search Patient</span>
                        <span className="ml-auto text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Optional</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name Search */}
                        <div className="space-y-2">
                          <Label htmlFor="patientNameSearch" className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            Search by Name
                          </Label>
                          <div className="relative">
                            <Input
                              id="patientNameSearch"
                              value={patientNameSearch}
                              onChange={(e) => {
                                setPatientNameSearch(e.target.value);
                                // Clear other fields when searching by name
                                if (e.target.value.length >= 2) {
                                  setFormData(prev => ({
                                    ...prev,
                                    patientId: '',
                                    patientDOB: undefined,
                                    patientGender: undefined,
                                    patientBodyWeight: undefined,
                                    drugAllergies: ''
                                  }));
                                }
                              }}
                              placeholder="Enter patient name (min 2 characters)"
                              disabled={isSaving || isPastAppointment}
                              className="pr-10"
                            />
                            {loadingPatient && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contact Search */}
                        <div className="space-y-2">
                          <Label htmlFor="patientContact" className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-blue-600" />
                            Search by Contact Number (Optional)
                          </Label>
                          <div className="relative">
                            <Input
                              id="patientContact"
                              value={searchContactNumber}
                              onChange={(e) => {
                                // Allow only numbers, spaces, hyphens, and plus sign
                                let sanitizedValue = e.target.value.replace(/[^0-9\s\-+]/g, '');
                                
                                // Count only digits for the 10-digit limit
                                const digitCount = sanitizedValue.replace(/[^0-9]/g, '').length;
                                
                                // Prevent entering more than 10 digits
                                if (digitCount > 10) {
                                  return; // Don't update if exceeding 10 digits
                                }
                                
                                // Update search contact number state (separate from formData.patientContact)
                                setSearchContactNumber(sanitizedValue);
                                
                                // Reset patient selection when contact number changes
                                if (sanitizedValue !== searchContactNumber) {
                                  setShowPatientSelection(false);
                                  setFoundPatients([]);
                                  setPatientExists(false);
                                  setPatientHasContact(false);
                                  setFormData(prev => ({
                                    ...prev,
                                    patientId: '',
                                    drugAllergies: ''
                                  }));
                                }
                              }}
                              placeholder="Enter contact number (auto-search after 3 digits)"
                              disabled={isSaving || isPastAppointment}
                              className={`pr-20 ${
                                searchContactNumber.replace(/[^0-9]/g, '').length >= 10 
                                  ? 'border-green-300 bg-green-50' 
                                  : searchContactNumber.replace(/[^0-9]/g, '').length > 0 
                                    ? 'border-blue-300 bg-blue-50' 
                                    : ''
                              }`}
                            />
                            <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-slate-500 bg-white px-1">
                              {10 - searchContactNumber.replace(/[^0-9]/g, '').length} left
                            </div>
                            {searchContactNumber.replace(/[^0-9]/g, '').length >= 10 && !loadingPatient && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Patient Selection Dropdowns */}
                    {showPatientSelection && foundPatients.length > 0 && (
                      <Card className="mt-2 border-blue-200 bg-blue-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-blue-800">
                            Select Patient by Contact ({foundPatients.length} found)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                          {foundPatients.map((patient) => {
                            console.log('Patient in dropdown:', patient); // Add this debug line
                            return (
                              <Button
                                key={patient.id}
                                type="button"
                                variant="outline"
                                className="w-full justify-start h-auto p-3 text-left hover:bg-blue-100"
                                onClick={() => handlePatientSelect(patient)}
                              >
                                <div className="flex flex-col space-y-1 w-full">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{patient.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {patient.id}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                    {formatPatientAge(patient) !== 'N/A' && (
                                      <span>Age: {formatPatientAge(patient)}</span>
                                    )}
                                    {patient.gender && (
                                      <span>Gender: {patient.gender}</span>
                                    )}
                                    {patient.bodyWeight && (
                                      <span>Weight: {patient.bodyWeight} kg</span>
                                    )}
                                  </div>
                                 {/* Drug allergies display - add debug */}
                                  {patient.drugAllergies && patient.drugAllergies.trim() !== '' && (
                                    <div className="flex items-center text-xs text-red-600">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      <span>Allergies: {patient.drugAllergies}</span>
                                    </div>
                                  )}
                                </div>
                              </Button>
                            );
                          })}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-muted-foreground"
                            onClick={() => {
                              setShowPatientSelection(false);
                              setFoundPatients([]);
                            }}
                          >
                            Create new patient instead
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Name Search Results */}
                    {showNameSearchResults && foundPatients.length > 0 && (
                      <Card className="mt-2 border-green-200 bg-green-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-green-800">
                            Select Patient by Name ({foundPatients.length} found)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                          {foundPatients.map((patient) => {
                            return (
                              <Button
                                key={patient.id}
                                type="button"
                                variant="outline"
                                className="w-full justify-start h-auto p-3 text-left hover:bg-green-100"
                                onClick={() => handlePatientSelect(patient)}
                              >
                                <div className="flex flex-col space-y-1 w-full">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{patient.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {patient.id}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                    <span>Contact: {patient.contactNumber || 'Not provided'}</span>
                                    {patient.age && (
                                      <span>Age: {patient.age} years</span>
                                    )}
                                    {patient.gender && (
                                      <span>Gender: {patient.gender}</span>
                                    )}
                                    {patient.bodyWeight && (
                                      <span>Weight: {patient.bodyWeight} kg</span>
                                    )}
                                  </div>
                                  {patient.drugAllergies && patient.drugAllergies.trim() !== '' && (
                                    <div className="flex items-center text-xs text-red-600">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      <span>Allergies: {patient.drugAllergies}</span>
                                    </div>
                                  )}
                                </div>
                              </Button>
                            );
                          })}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-muted-foreground"
                            onClick={() => {
                              setShowNameSearchResults(false);
                              setFoundPatients([]);
                              setPatientNameSearch('');
                            }}
                          >
                            Create new patient instead
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 space-y-2">
                        <div className="relative">
                          {patientExists && (
                            <div className="absolute right-0 -top-6 flex items-center text-green-600 text-sm">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              <span>Existing patient</span>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor="patientName">Patient Name *</Label>
                            <Input
                              id="patientName"
                              value={formData.patientName}
                              onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                              placeholder="Enter patient's full name"
                              disabled={isSaving || isPastAppointment}
                            />
                            {errors.patientName && <p className="text-sm text-red-500">{errors.patientName}</p>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="patientContactDisplay">Contact Number (Optional)</Label>
                        <div className="relative">
                          <Input
                            id="patientContactDisplay"
                            value={formData.patientContact}
                            onChange={(e) => {
                              // Allow only numbers, spaces, hyphens, and plus sign
                              let sanitizedValue = e.target.value.replace(/[^0-9\s\-+]/g, '');
                              
                              // Count only digits for the 10-digit limit
                              const digitCount = sanitizedValue.replace(/[^0-9]/g, '').length;
                              
                              // Prevent entering more than 10 digits
                              if (digitCount > 10) {
                                return; // Don't update if exceeding 10 digits
                              }
                              
                              // Update digit count state
                              setPhoneDigitCount(digitCount);
                              
                              setFormData(prev => ({ 
                                ...prev, 
                                patientContact: sanitizedValue
                              }));
                              
                              // Update patientHasContact when user enters contact for existing patient without contact
                              if (patientExists && !patientHasContact && sanitizedValue.trim() !== '') {
                                setPatientHasContact(true);
                              } else if (patientExists && patientHasContact && sanitizedValue.trim() === '') {
                                // If contact is cleared for existing patient, reset the flag
                                setPatientHasContact(false);
                              }
                              
                              // Only clear patientId if user is manually entering contact for new patient
                              // Don't clear manually entered fields like DOB, gender, body weight, etc.
                              if (!patientExists && sanitizedValue !== formData.patientContact) {
                                setFormData(prev => ({
                                  ...prev,
                                  patientId: '' // Only clear patientId, keep other manually entered fields
                                }));
                              }
                            }}
                            disabled={isSaving || isPastAppointment || (patientExists && patientHasContact)}
                            className={`${
                              (patientExists && patientHasContact)
                                ? 'bg-gray-50' 
                                : phoneDigitCount >= 10 
                                  ? 'border-green-300 bg-green-50' 
                                  : phoneDigitCount > 0 
                                    ? 'border-blue-300 bg-blue-50' 
                                    : ''
                            } ${(patientExists && patientHasContact) ? '' : 'pr-20'}`}
                            placeholder={
                              (patientExists && patientHasContact) 
                                ? "Contact from patient record" 
                                : patientExists 
                                  ? "Enter contact number for this patient (optional)"
                                  : "Enter contact number or leave empty"
                            }
                            onBlur={(e) => {
                              // Update patientHasContact when user enters a contact for existing patient
                              if (patientExists && !patientHasContact) {
                                const value = e.target.value.trim();
                                if (value !== '') {
                                  setPatientHasContact(true);
                                }
                              }
                            }}
                          />
                          {(!patientExists || (patientExists && !patientHasContact)) && (
                            <>
                              <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-slate-500 bg-white px-1">
                                {10 - phoneDigitCount} left
                              </div>
                              {phoneDigitCount >= 10 && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {patientExists && patientHasContact && (
                          <p className="text-xs text-gray-500">Contact number from existing patient record</p>
                        )}
                        {patientExists && !patientHasContact && (
                          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                            This patient has no contact number. You can add one now (optional).
                          </p>
                        )}
                        {!patientExists && (
                          <p className="text-xs text-gray-500">Enter contact number for new patient (optional)</p>
                        )}
                        {errors.patientContact && <p className="text-sm text-red-500">{errors.patientContact}</p>}
                      </div>
                    </div>

                    {/* Additional Patient Details - Optional Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                      <div className="space-y-2">
                        <Label htmlFor="patientDOB">Date of Birth (optional)</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="yearInput"
                            type="text"
                            placeholder="YYYY"
                            maxLength={4}
                            value={formData.patientDOB ? formData.patientDOB.split('-')[0] : ''}
                            onChange={(e) => {
                              const year = e.target.value.replace(/\D/g, '');
                              if (year.length <= 4) {
                                const currentDate = formData.patientDOB ? formData.patientDOB.split('-') : ['', '', ''];
                                const month = currentDate[1] || '';
                                const day = currentDate[2] || '';
                                
                                // Always update to show typing, construct date string
                                if (year.length > 0) {
                                  const newDate = `${year}-${month}-${day}`;
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    patientDOB: newDate
                                  }));
                                } else {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    patientDOB: undefined
                                  }));
                                }
                                
                                // Move to month field when year is complete
                                if (year.length === 4) {
                                  setTimeout(() => {
                                    document.getElementById('monthInput')?.focus();
                                  }, 100);
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              // Handle backspace navigation
                              if (e.key === 'Backspace' && e.currentTarget.value === '') {
                                e.preventDefault();
                                document.getElementById('yearInput')?.focus();
                              }
                            }}
                            disabled={isSaving || loadingPatient || isPastAppointment}
                            className="text-center font-mono"
                          />
                          <span className="flex items-center text-gray-500 font-bold">-</span>
                          <Input
                            id="monthInput"
                            type="text"
                            placeholder="MM"
                            maxLength={2}
                            value={formData.patientDOB ? formData.patientDOB.split('-')[1] : ''}
                            onChange={(e) => {
                              const month = e.target.value.replace(/\D/g, '');
                              if (month.length <= 2) {
                                const currentDate = formData.patientDOB ? formData.patientDOB.split('-') : ['', '', ''];
                                const year = currentDate[0] || '';
                                const day = currentDate[2] || '';
                                
                                // Always update to show typing
                                if (month.length > 0) {
                                  const newDate = `${year}-${month}-${day}`;
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    patientDOB: newDate
                                  }));
                                } else if (year) {
                                  // Keep the year if month is cleared
                                  const newDate = `${year}--${day}`;
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    patientDOB: newDate
                                  }));
                                }
                                
                                // Move to day field when month is complete
                                if (month.length === 2) {
                                  setTimeout(() => {
                                    document.getElementById('dayInput')?.focus();
                                  }, 100);
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              // Handle backspace navigation
                              if (e.key === 'Backspace' && e.currentTarget.value === '') {
                                e.preventDefault();
                                document.getElementById('yearInput')?.focus();
                              }
                            }}
                            disabled={isSaving || loadingPatient || isPastAppointment}
                            className="text-center font-mono"
                          />
                          <span className="flex items-center text-gray-500 font-bold">-</span>
                          <Input
                            id="dayInput"
                            type="text"
                            placeholder="DD"
                            maxLength={2}
                            value={formData.patientDOB ? formData.patientDOB.split('-')[2] : ''}
                            onChange={(e) => {
                              const day = e.target.value.replace(/\D/g, '');
                              if (day.length <= 2) {
                                const currentDate = formData.patientDOB ? formData.patientDOB.split('-') : ['', '', ''];
                                const year = currentDate[0] || '';
                                const month = currentDate[1] || '';
                                
                                // Always update to show typing
                                if (day.length > 0) {
                                  const newDate = `${year}-${month}-${day}`;
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    patientDOB: newDate
                                  }));
                                } else if (year || month) {
                                  // Keep the year and month if day is cleared
                                  const newDate = `${year}-${month}-`;
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    patientDOB: newDate
                                  }));
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              // Handle backspace navigation
                              if (e.key === 'Backspace' && e.currentTarget.value === '') {
                                e.preventDefault();
                                document.getElementById('monthInput')?.focus();
                              }
                            }}
                            disabled={isSaving || loadingPatient || isPastAppointment}
                            className="text-center font-mono"
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Enter year (4 digits), then month (2 digits), then day (2 digits)
                        </div>
                        {formData.patientDOB && (() => {
                          const parts = formData.patientDOB.split('-');
                          const year = parts[0];
                          const month = parts[1];
                          const day = parts[2];
                          
                          // Check if all parts are complete
                          if (year && year.length === 4 && month && month.length === 2 && day && day.length === 2) {
                            const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                            const date = new Date(dateStr);
                            const isValid = !isNaN(date.getTime()) && 
                                           date.getFullYear() > 1900 && 
                                           date.getFullYear() <= new Date().getFullYear();
                            
                            if (isValid) {
                              const age = calculateAge(dateStr);
                              return (
                                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                                  Age: {age.years} years, {age.months} months
                                </div>
                              );
                            } else {
                              return (
                                <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                                  Please enter a valid date of birth
                                </div>
                              );
                            }
                          }
                          return null;
                        })()}
                      </div>

                   
                      <div className="space-y-2">
                        <Label htmlFor="patientGender">Gender (optional)</Label>
                        <Select 
                          value={formData.patientGender || "not_specified"} 
                          onValueChange={(value) => setFormData(prev => ({ 
                            ...prev, 
                            patientGender: value === "not_specified" ? undefined : value
                          }))}
                          disabled={isSaving || loadingPatient || isPastAppointment}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_specified">Not specified</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="patientBodyWeight">Body Weight (kg) (optional)</Label>
                        <Input
                          id="patientBodyWeight"
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.patientBodyWeight || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            patientBodyWeight: e.target.value ? parseFloat(e.target.value) : undefined 
                          }))}
                          placeholder="Enter weight in kg"
                          disabled={isSaving || loadingPatient || isPastAppointment}
                        />
                      </div>


                      <div className="space-y-2">
                        <Label htmlFor="patientDrugAllergies">Drug Allergies (optional)</Label>
                        <Textarea
                          id="patientDrugAllergies"
                          value={formData.drugAllergies || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            drugAllergies: e.target.value 
                          }))}
                          placeholder="Enter any known drug allergies"
                          rows={2}
                          disabled={isSaving || loadingPatient || isPastAppointment}
                          className="resize-none"
                        />
                        <p className="text-xs text-gray-500">
                          List any medications or substances the patient is allergic to
                        </p>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              
              {/* Enhanced Appointment Details Card */}
              <Card className="border-l-4 border-l-green-500 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4 bg-gradient-to-r from-green-50 via-emerald-50/50 to-transparent border-b border-green-100">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 mr-3 shadow-md">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 font-bold">Appointment Details</span>
                          {formData.doctorId && formData.selectedTimeSlot && (
                            <CheckCircle className="h-5 w-5 text-green-500 animate-pulse" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-normal">Select doctor, date and time slot</span>
                      </div>
                    </div>
                    {formData.selectedTimeSlot && (
                      <Badge className="bg-green-100 text-green-700 border border-green-300 px-3 py-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Time Selected
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Doctor Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="doctor" className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-green-600" />
                      Doctor *
                    </Label>
                    {loadingDoctors ? (
                      <div className="flex items-center space-x-2 p-3 border rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading doctors...</span>
                      </div>
                    ) : (
                      <>
                        <Select
                          value={formData.doctorId}
                          onValueChange={handleDoctorChange}
                          disabled={isSaving || isPastAppointment}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a doctor" />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.map(doctor => (
                              <SelectItem key={doctor.id} value={doctor.id!}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{doctor.name}</span>
                                  <span className="text-sm text-muted-foreground">{doctor.speciality}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.doctorId && <p className="text-sm text-red-500">{errors.doctorId}</p>}
                      </>
                    )}
                  </div>
                  
                  {/* Date and Time Selection */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Date Selection */}
                    


                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Appointment Date & Time *</Label>
                                <DateTimePicker
                                  date={formData.date ? new Date(formData.date) : new Date()}
                                  availableTimeSlots={formData.availableTimeSlots}
                                  selectedTimeSlot={formData.selectedTimeSlot}
                                  allowPastDates={true}
                                  onDateChange={(selectedDate) => {
                                    console.log('??? Date changed:', selectedDate);
                                    const dateString = format(selectedDate, 'yyyy-MM-dd');
                                    handleDateChange(dateString);
                                  }}
                                  onTimeSlotSelect={(startTime, endTime) => {
                                    handleTimeSlotSelect(startTime, endTime);
                                  }}
                                  disabled={!formData.doctorId || isSaving}
                                />
                                {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                                {!formData.selectedTimeSlot && formData.doctorId && formData.date && (
                                  <p className="text-sm text-red-500">Please select a time slot</p>
                                )}
                                {loadingSchedules && (
                                  <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Loading available time slots...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                   
                      {/* Time Slots Selection */}
                      <div className="space-y-2">
                        <Label>Available Time Slots *</Label>
                        {loadingSchedules ? (
                          <div className="flex items-center space-x-2 p-4 border rounded-md bg-gray-50">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading schedule...</span>
                          </div>
                        ) : formData.availableTimeSlots.length === 0 ? (
                          <div className="border rounded-md p-4 bg-gray-50 text-gray-500 text-sm">
                            {formData.doctorId ? (
                              formData.date ? (
                                <div className="flex items-center justify-center text-center">
                                  <XCircle className="h-5 w-5 mr-2 text-red-500" />
                                  <span>No available time slots for this date</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center text-center">
                                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                                  <span>Please select a date</span>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center justify-center text-center">
                                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                                <span>Please select a doctor first</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="border rounded-md p-3 bg-gray-50">
                            <div className="max-h-40 overflow-y-auto space-y-2">
                              {formData.availableTimeSlots.map((slot, index) => {
                                // Count existing appointments in this slot
                                const existingCount = existingAppointments.filter(app => {
                                  // Get session times from sessionId
                                  if (!app.sessionId) return false;
                                  const sessionTimes = getSessionTimeFromId(app.sessionId);
                                  return (
                                    sessionTimes &&
                                    app.doctorId === formData.doctorId &&
                                    app.date === formData.date &&
                                    sessionTimes.startTime === slot.startTime &&
                                    sessionTimes.endTime === slot.endTime &&
                                    app.status !== 'cancelled' &&
                                    app.id !== (isEditMode ? appointment?.id : undefined)
                                  );
                                }).length;

                                // Calculate what appointment number this patient will get
                                const nextAppointmentNumber = existingCount + 1;

                                return (
                                  <Button
                                    key={index}
                                    type="button"
                                    variant={formData.selectedTimeSlot?.startTime === slot.startTime ? "default" : "outline"}
                                    className="w-full justify-between h-14 text-sm p-3"
                                    onClick={() => handleTimeSlotSelect(slot.startTime, slot.endTime)}
                                    disabled={isSaving || isPastAppointment}
                                  >
                                    <div className="flex flex-col items-start gap-1">
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span className="font-medium">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                                      </div>
                                      {existingCount > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                          {existingCount} patient{existingCount !== 1 ? 's' : ''} already booked
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                      {/* Show the appointment number this patient will get */}
                                      <div className="flex items-center gap-2">
                                        <Badge 
                                          variant={formData.selectedTimeSlot?.startTime === slot.startTime ? "secondary" : "outline"} 
                                          className={`text-xs font-bold ${
                                            formData.selectedTimeSlot?.startTime === slot.startTime 
                                              ? 'bg-white text-blue-600' 
                                              : 'bg-blue-50 text-blue-700 border-blue-200'
                                          }`}
                                        >
                                          Appointment #{nextAppointmentNumber}
                                        </Badge>
                                        {formData.selectedTimeSlot?.startTime === slot.startTime && (
                                          <CheckCircle2 className="h-4 w-4 text-white" />
                                        )}
                                      </div>
                                      
                                      {existingCount > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          {existingCount} existing
                                        </Badge>
                                      )}
                                    </div>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {errors.timeSlot && <p className="text-sm text-red-500">{errors.timeSlot}</p>}
                      </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Enhanced Procedures Selection Card */}
              <Card className="border-l-4 border-l-purple-500 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 via-violet-50/50 to-transparent border-b border-purple-100">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 mr-3 shadow-md">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 font-bold">Procedures & Pricing</span>
                          {formData.selectedProcedures.length > 0 && (
                            <CheckCircle className="h-5 w-5 text-green-500 animate-pulse" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-normal">Select consultation procedures (optional)</span>
                      </div>
                    </div>
                    {formData.selectedProcedures.length > 0 && (
                      <Badge className="bg-purple-100 text-purple-700 border border-purple-300 px-3 py-1">
                        {formData.selectedProcedures.length} Selected
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Procedures (Optional)</Label>
                    {loadingProcedures ? (
                      <div className="flex items-center space-x-2 p-4 border rounded-md bg-gray-50 mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading procedures...</span>
                      </div>
                    ) : formData.availableProcedures.length === 0 ? (
                      <div className="border rounded-md p-4 bg-gray-50 text-gray-500 text-sm mt-2">
                        {formData.doctorId ? (
                          <div className="flex items-center justify-center text-center">
                            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                            <span>No procedures available for this doctor</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center text-center">
                            <AlertTriangle className="h-5 w-5 mr-2 text-blue-500" />
                            <span>Please select a doctor first</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border rounded-md bg-gray-50 mt-2">
                        <div className="max-h-56 overflow-y-auto p-3">
                          <div className="space-y-3">
                            {formData.availableProcedures.map((proc) => (
                              <div key={proc.id} className="flex items-start space-x-3 p-3 bg-white rounded-md border">
                                <Checkbox
                                  id={`proc-${proc.id}`}
                                  checked={formData.selectedProcedures.includes(proc.id!)}
                                  onCheckedChange={(checked) => 
                                    handleProcedureToggle(proc.id!, checked as boolean)
                                  }
                                  disabled={isSaving}
                                  className="mt-1"
                                />
                                <div className="flex-1 space-y-1">
                                  <Label
                                    htmlFor={`proc-${proc.id}`}
                                    className="text-sm font-medium leading-none cursor-pointer"
                                  >
                                    {proc.procedureName}
                                  </Label>
                                  <div className="flex justify-between items-center text-sm">
                                    {/* <span className="text-muted-foreground">
                                      Doctor: {formatCurrency(proc.doctorCharge)} ? 
                                      Center: {formatCurrency(proc.centerCharge)}
                                    </span>
                                    <span className="font-semibold text-primary">
                                      {formatCurrency(proc.doctorCharge + proc.centerCharge)}
                                    </span> */}
                                    <span className="text-muted-foreground">
                                      Doctor: {formatCurrency(proc.doctorCharge)}
                                    </span>
                                    <span className="font-semibold text-primary">
                                      {formatCurrency(proc.doctorCharge)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {errors.procedures && <p className="text-sm text-red-500 mt-2">{errors.procedures}</p>}
                  </div>
                  
                  {/* Enhanced Total Charge Display */}
                  <div className="relative overflow-hidden p-6 bg-gradient-to-br from-purple-100 via-violet-50 to-blue-50 rounded-2xl border-2 border-purple-300 shadow-lg">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200/30 rounded-full -ml-12 -mb-12"></div>
                    
                    <div className="relative flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <span className="text-sm text-purple-700 font-medium">Total Charge</span>
                          <div className="text-xs text-purple-600 mt-0.5">
                            {formData.selectedProcedures.length > 0 
                              ? `${formData.selectedProcedures.length} procedure${formData.selectedProcedures.length !== 1 ? 's' : ''} selected`
                              : 'No procedures selected'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                          {formatCurrency(totalCharge)}
                        </div>
                        {totalCharge === 0 && (
                          <div className="text-xs text-purple-500 mt-1">
                            Select procedures to calculate
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Enhanced Additional Information Card */}
              <Card className="border-l-4 border-l-slate-500 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 via-gray-50/50 to-transparent border-b border-slate-100">
                  <CardTitle className="text-lg flex items-center">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 mr-3 shadow-md">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-gray-800 font-bold">Additional Information</div>
                      <span className="text-xs text-gray-500 font-normal">Notes and appointment status</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="appointment-amount" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                        Appointment Amount (Optional)
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleOpenEditDefault}
                        disabled={isSaving}
                        className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Edit Default
                      </Button>
                    </div>
                    <Input
                      id="appointment-amount"
                      type="number"
                      value={formData.appointmentAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, appointmentAmount: e.target.value }))}
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                      disabled={isSaving}
                    />
                    {(() => {
                      const settings = businessSettingsService.getSettings();
                      const isUsingDefault = 
                        settings.defaultAppointmentAmount !== undefined && 
                        settings.defaultAppointmentAmount !== null &&
                        formData.appointmentAmount === settings.defaultAppointmentAmount.toString();
                      
                      if (isUsingDefault) {
                        return (
                          <div className="flex items-center justify-between text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            <span>Using default amount: Rs. {settings.defaultAppointmentAmount?.toFixed(2)}. You can change this if needed.</span>
                          </div>
                        );
                      }
                      
                      // Show current default if not using it
                      if (settings.defaultAppointmentAmount !== undefined && settings.defaultAppointmentAmount !== null) {
                        return (
                          <p className="text-xs text-gray-500">
                            Default: Rs. {settings.defaultAppointmentAmount.toFixed(2)} | 
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, appointmentAmount: settings.defaultAppointmentAmount!.toString() }))}
                              className="ml-1 text-blue-600 hover:text-blue-700 underline"
                            >
                              Use default
                            </button>
                          </p>
                        );
                      }
                      return null;
                    })()}
                    {errors.appointmentAmount && (
                      <p className="text-sm text-red-500">{errors.appointmentAmount}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any additional notes or special instructions"
                      rows={3}
                      disabled={isSaving}
                    />
                  </div>
                  {isEditMode && (
                   <div className="space-y-2">
                     <Label htmlFor="status">Appointment Status</Label>
                     <Select
                       value={formData.status}
                       onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                       disabled={isSaving}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Select status" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="scheduled">Scheduled</SelectItem>
                         <SelectItem value="completed">Completed</SelectItem>
                         <SelectItem value="cancelled">Cancelled</SelectItem>
                         <SelectItem value="no-show">No Show</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 )}
               </CardContent>
             </Card>
              
              {/* Enhanced Documents Card */}
              <Card className="border-l-4 border-l-indigo-500 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 via-purple-50/50 to-transparent border-b border-indigo-100">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 mr-3 shadow-md">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-gray-800 font-bold">Appointment Documents</div>
                        <span className="text-xs text-gray-500 font-normal">Upload PDFs, images, and other documents</span>
                      </div>
                    </div>
                    {(uploadedDocuments.length > 0 || documentFiles.length > 0) && (
                      <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-300 px-3 py-1">
                        {uploadedDocuments.length + documentFiles.length} file{uploadedDocuments.length + documentFiles.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Upload Section */}
                  <div className="space-y-2">
                    <Label htmlFor="document-upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-indigo-600" />
                      Upload Documents (PDF, Images, Docs)
                    </Label>
                    <div className="border-2 border-dashed border-indigo-200 rounded-lg p-6 bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-3 rounded-full bg-indigo-100">
                          <FileText className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF, Images (JPEG, PNG, GIF, WebP), Documents (DOC, DOCX, XLS, XLSX, TXT, CSV) up to 10MB
                          </p>
                        </div>
                        <Input
                          id="document-upload"
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv,image/*,application/pdf"
                          onChange={handleDocumentSelect}
                          disabled={isSaving || isUploadingDocuments || isPastAppointment}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('document-upload')?.click()}
                          disabled={isSaving || isUploadingDocuments || isPastAppointment}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Select Files
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* New Document Files */}
                  {documentFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">New Documents (will be uploaded on save)</Label>
                      <div className="space-y-2">
                        {documentFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="p-2 rounded bg-blue-100">
                              {file.type.startsWith('image/') ? (
                                <ImageIcon className="h-4 w-4 text-blue-600" />
                              ) : file.type === 'application/pdf' ? (
                                <FileText className="h-4 w-4 text-red-600" />
                              ) : (
                                <File className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <Input
                                type="text"
                                placeholder="Add description (optional)"
                                value={documentDescriptions[file.name] || ''}
                                onChange={(e) => updateDocumentDescription(file.name, e.target.value)}
                                className="mt-1 h-8 text-xs"
                                disabled={isSaving || isUploadingDocuments}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDocumentFile(file.name)}
                              disabled={isSaving || isUploadingDocuments}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Uploaded Documents */}
                  {uploadedDocuments.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Uploaded Documents</Label>
                      <div className="space-y-2">
                        {uploadedDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="p-2 rounded bg-green-100">
                              {doc.mimeType.startsWith('image/') ? (
                                <ImageIcon className="h-4 w-4 text-green-600" />
                              ) : doc.mimeType === 'application/pdf' ? (
                                <FileText className="h-4 w-4 text-red-600" />
                              ) : (
                                <File className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{doc.originalName}</p>
                              <p className="text-xs text-gray-500">
                                {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                {doc.description && ` • ${doc.description}`}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Uploaded {doc.uploadedAt instanceof Date 
                                  ? doc.uploadedAt.toLocaleDateString()
                                  : new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(doc.downloadURL, '_blank')}
                                disabled={isSaving || isUploadingDocuments || isPastAppointment}
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="View document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!isPastAppointment && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeUploadedDocument(doc.id)}
                                  disabled={isSaving || isUploadingDocuments}
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Remove document"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isUploadingDocuments && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-700">Uploading documents...</span>
                    </div>
                  )}

                  {uploadedDocuments.length === 0 && documentFiles.length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No documents uploaded yet</p>
                      <p className="text-xs mt-1">Upload PDFs, images, or other documents related to this appointment</p>
                    </div>
                  )}
                </CardContent>
              </Card>
           </form>
         </div>
       </div>

       {/* Enhanced Fixed Footer */}
       <div className="flex-shrink-0 bg-gradient-to-r from-slate-50 via-white to-blue-50 border-t-2 border-gray-200 shadow-lg">
         <div className="px-6 py-5 flex justify-between items-center gap-4">
           <div className="flex items-center gap-3">
             {completedSteps === steps.length ? (
               <div className="flex items-center gap-3 bg-green-50 px-4 py-2.5 rounded-lg border-2 border-green-200">
                 <div className="p-1.5 rounded-full bg-green-100">
                   <CheckCircle className="h-5 w-5 text-green-600" />
                 </div>
                 <div>
                   <div className="text-sm font-bold text-green-700">
                     Ready to {isEditMode ? 'Update' : 'Book'}
                   </div>
                   <div className="text-xs text-green-600">
                     All required fields completed
                   </div>
                 </div>
               </div>
             ) : (
               <div className="flex items-center gap-3 bg-amber-50 px-4 py-2.5 rounded-lg border-2 border-amber-200">
                 <div className="p-1.5 rounded-full bg-amber-100">
                   <AlertCircle className="h-5 w-5 text-amber-600" />
                 </div>
                 <div>
                   <div className="text-sm font-bold text-amber-700">
                     {steps.length - completedSteps} step{steps.length - completedSteps !== 1 ? 's' : ''} remaining
                   </div>
                   <div className="text-xs text-amber-600">
                     Complete required fields to continue
                   </div>
                 </div>
               </div>
             )}
           </div>
           
           <div className="flex gap-3">
             <Button
               type="button"
               variant="outline"
               onClick={onClose}
               disabled={isSaving}
               className="px-6 py-2.5 border-2 hover:bg-gray-100 transition-all duration-200"
             >
               <X className="h-4 w-4 mr-2" />
               Cancel
             </Button>
             <Button
              type="submit"
              disabled={isSaving || completedSteps < steps.length - 1}
              onClick={handleSubmit}
              className="px-8 py-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  {isEditMode ? "Update Appointment" : "Book Appointment"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
           </div>
         </div>
      </div>
    </DialogContent>
    </Dialog>

    {/* Edit Default Appointment Amount Dialog */}
    <Dialog open={showEditDefaultDialog} onOpenChange={setShowEditDefaultDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Edit Default Appointment Amount
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="default-amount" className="text-sm font-medium">
              Default Appointment Amount (Rs.)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="default-amount"
                type="number"
                min="0"
                step="0.01"
                value={editingDefaultAmount}
                onChange={(e) => setEditingDefaultAmount(e.target.value)}
                placeholder="Enter default amount (leave empty to remove default)"
                className="pl-10"
                disabled={savingDefaultAmount}
              />
            </div>
            <p className="text-xs text-gray-500">
              This amount will be pre-filled when creating new appointments. Leave empty to remove the default.
            </p>
            {(() => {
              const currentSettings = businessSettingsService.getSettings();
              if (currentSettings.defaultAppointmentAmount !== undefined && currentSettings.defaultAppointmentAmount !== null) {
                return (
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    Current default: Rs. {currentSettings.defaultAppointmentAmount.toFixed(2)}
                  </p>
                );
              }
              return (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  No default amount set. New appointments will have an empty amount field.
                </p>
              );
            })()}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowEditDefaultDialog(false)}
            disabled={savingDefaultAmount}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveDefaultAmount}
            disabled={savingDefaultAmount}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {savingDefaultAmount ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Default
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}