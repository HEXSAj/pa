// src/app/dashboard/appointments/EnhancedAppointmentModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Doctor, 
  DoctorSchedule, 
  DoctorProcedure, 
  formatCurrency
} from '@/types/doctor';
import { 
  Appointment, 
  AppointmentProcedure, 
  isTimeSlotAvailable, 
  calculateTotalCharge,
  Patient,
  calculateEndTime,
  calculateDuration,
  formatDuration
} from '@/types/appointment';
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
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Badge,
  AlertCircle,
  Timer,
  User
} from 'lucide-react';
import { toast } from "sonner";
import { calculateAge, formatPatientAge } from '@/utils/ageUtils';
import { format, isBefore, startOfDay } from 'date-fns';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { cashierService } from '@/services/cashierService';
import { attendanceService } from '@/services/attendanceService';
import { staffService } from '@/services/staffService';

interface EnhancedAppointmentModalProps {
  appointment?: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper to convert day name to WeekDay type
const getDayOfWeek = (date: Date): string => {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return dayName;
};

// Predefined duration options
const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
];

export default function EnhancedAppointmentModal({ appointment, onClose, onSuccess }: EnhancedAppointmentModalProps) {
  const isEditMode = !!appointment;
  
  // Check if this is a past appointment
  const isPastAppointment = appointment && isBefore(new Date(appointment.date), startOfDay(new Date()));
  const [phoneDigitCount, setPhoneDigitCount] = useState(0);
  
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
    startTime: string;
    duration: number;
    endTime: string;
    availableProcedures: DoctorProcedure[];
    selectedProcedures: string[];
    notes: string;
    status: string;
  }>({
    patientName: '',
    patientContact: '',
    patientId: '',
    patientDOB: undefined,     
    patientGender: undefined,  
    patientBodyWeight: undefined,
    drugAllergies: '',
    doctorId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dayOfWeek: getDayOfWeek(new Date()),
    startTime: '',
    duration: 30, // Default 30 minutes
    endTime: '',
    availableProcedures: [],
    selectedProcedures: [],
    notes: '',
    status: 'scheduled'
  });
  
  // Loading and error states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorProcedures, setDoctorProcedures] = useState<DoctorProcedure[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [checkingPatient, setCheckingPatient] = useState(false);
  const [patientExists, setPatientExists] = useState(false);
  
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

  const { user } = useAuth();

  // Update end time when start time or duration changes
  useEffect(() => {
    if (formData.startTime && formData.duration) {
      const endTime = calculateEndTime(formData.startTime, formData.duration);
      setFormData(prev => ({ ...prev, endTime }));
    }
  }, [formData.startTime, formData.duration]);

  useEffect(() => {
    loadDoctors();
    loadAppointments();
    
    // Initialize form data if editing
    if (isEditMode && appointment) {
      initializeFormData();
    }
  }, [appointment]);

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

  const loadDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const doctorsData = await doctorService.getAllDoctors();
      setDoctors(doctorsData.filter(doctor => doctor.isActive));
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
    
    const duration = appointment.duration || calculateDuration(appointment.startTime, appointment.endTime);
    
    setFormData({
      patientName: appointment.patientName,
      patientContact: appointment.patientContact,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: appointment.date,
      dayOfWeek: appointment.dayOfWeek,
      startTime: appointment.startTime,
      duration: duration,
      endTime: appointment.endTime,
      availableProcedures: [],
      selectedProcedures: (appointment.procedures || []).map(p => p.procedureId),
      notes: appointment.notes || '',
      status: appointment.status
    });
    
    await loadDoctorProcedures(appointment.doctorId);
    setTotalCharge(appointment.totalCharge);
  };

  const loadDoctorProcedures = async (doctorId: string) => {
    setLoadingProcedures(true);
    try {
      const procedures = await doctorService.getDoctorProceduresByDoctorId(doctorId);
      setDoctorProcedures(procedures.filter(proc => proc.isActive));
      setFormData(prev => ({ ...prev, availableProcedures: procedures.filter(proc => proc.isActive) }));
    } catch (error) {
      console.error('Error loading doctor procedures:', error);
      toast.error("Failed to load doctor procedures");
    } finally {
      setLoadingProcedures(false);
    }
  };

  const checkCashierSessionRequirement = async () => {
    if (!user) return;
    
    setCheckingSession(true);
    try {
      const sessionCheck = await appointmentService.checkCashierSessionRequirement(user.uid);
      
      setHasAttendance(sessionCheck.hasAttendance);
      setHasActiveSession(sessionCheck.hasActiveSession);
      setHasAnyActiveSession(sessionCheck.hasAnyActiveSession || false);
      setUserRole(sessionCheck.userRole || 'cashier');
      
      if (!sessionCheck.hasAttendance) {
        toast.error("You must mark attendance before creating appointments");
        return;
      }
      
      if (sessionCheck.userRole !== 'doctor' && !sessionCheck.hasActiveSession && !sessionCheck.hasAnyActiveSession) {
        toast.error("You must start a cashier session before creating appointments");
        return;
      }
      
      setSessionCheckComplete(true);
    } catch (error) {
      console.error('Error checking session requirement:', error);
      toast.error("Failed to check session requirements");
    } finally {
      setCheckingSession(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhoneChange = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    setPhoneDigitCount(numericValue.length);
    handleInputChange('patientContact', numericValue);
  };

  const handlePatientSearch = async () => {
    if (!formData.patientContact || formData.patientContact.length < 10) {
      toast.error("Please enter a valid phone number (10 digits)");
      return;
    }

    setCheckingPatient(true);
    try {
      const patients = await appointmentService.getPatientsByContact(formData.patientContact);
      
      if (patients.length === 0) {
        setPatientExists(false);
        setFoundPatients([]);
        toast.info("No existing patient found. You can create a new patient.");
      } else if (patients.length === 1) {
        const patient = patients[0];
        setFormData(prev => ({
          ...prev,
          patientName: patient.name,
          patientId: patient.id || '',
          patientDOB: patient.dateOfBirth || undefined, // Use dateOfBirth field from patient
          patientGender: patient.gender,
          patientBodyWeight: patient.bodyWeight,
          drugAllergies: patient.drugAllergies || ''
        }));
        setPatientExists(true);
        setFoundPatients([]);
        toast.success("Patient found and details loaded!");
      } else {
        setFoundPatients(patients);
        setShowPatientSelection(true);
        setPatientExists(true);
      }
    } catch (error) {
      console.error('Error searching for patient:', error);
      toast.error("Failed to search for patient");
    } finally {
      setCheckingPatient(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setFormData(prev => ({
      ...prev,
      patientName: patient.name,
      patientId: patient.id || '',
      patientDOB: patient.dateOfBirth || undefined, // Use dateOfBirth field from patient
      patientGender: patient.gender,
      patientBodyWeight: patient.bodyWeight,
      drugAllergies: patient.drugAllergies || ''
    }));
    setShowPatientSelection(false);
    setFoundPatients([]);
    toast.success("Patient selected!");
  };

  const handleProcedureChange = (procedureId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedProcedures: checked 
        ? [...prev.selectedProcedures, procedureId]
        : prev.selectedProcedures.filter(id => id !== procedureId)
    }));
  };

  // Calculate total charge when procedures change
  useEffect(() => {
    const selectedProceduresData = doctorProcedures.filter(proc => 
      formData.selectedProcedures.includes(proc.id)
    );
    
    const total = selectedProceduresData.reduce((sum, proc) => sum + proc.doctorCharge, 0);
    setTotalCharge(total);
  }, [formData.selectedProcedures, doctorProcedures]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }

    if (!formData.patientContact.trim()) {
      newErrors.patientContact = 'Patient contact is required';
    } else if (formData.patientContact.length < 10) {
      newErrors.patientContact = 'Please enter a valid phone number (10 digits)';
    }

    if (!formData.doctorId) {
      newErrors.doctorId = 'Please select a doctor';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Please select a start time';
    }

    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = 'Please select a valid duration';
    }

    // Procedures are now optional - no validation required

    // Check for time conflicts
    if (formData.doctorId && formData.date && formData.startTime && formData.endTime) {
      const isAvailable = isTimeSlotAvailable(
        formData.doctorId,
        formData.date,
        formData.startTime,
        formData.endTime,
        existingAppointments,
        isEditMode ? appointment?.id : undefined
      );

      if (!isAvailable) {
        newErrors.timeSlot = 'This time slot is not available';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    if (!sessionCheckComplete) {
      toast.error("Please wait for session verification to complete");
      return;
    }

    setIsSaving(true);
    try {
      const selectedProceduresData = doctorProcedures.filter(proc => 
        formData.selectedProcedures.includes(proc.id)
      );

      const appointmentProcedures: AppointmentProcedure[] = selectedProceduresData.map(proc => ({
        procedureId: proc.id,
        procedureName: proc.procedureName || proc.id,
        doctorCharge: proc.doctorCharge
      }));

      // Generate session ID for the appointment
      const sessionId = `${formData.doctorId}_${formData.date}_${formData.startTime}_${formData.endTime}`;

      const appointmentData = {
        patientId: formData.patientId,
        patientName: formData.patientName,
        patientContact: formData.patientContact,
        doctorId: formData.doctorId,
        doctorName: doctors.find(d => d.id === formData.doctorId)?.name || '',
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: formData.duration,
        dayOfWeek: formData.dayOfWeek,
        procedures: appointmentProcedures,
        totalCharge: totalCharge,
        notes: formData.notes,
        status: formData.status as any,
        sessionId: sessionId
      };

      if (isEditMode && appointment) {
        await appointmentService.updateAppointment(appointment.id!, appointmentData);
        toast.success("Appointment updated successfully!");
      } else {
        await appointmentService.createAppointment(appointmentData, user?.uid);
        toast.success("Appointment created successfully!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      toast.error(error.message || "Failed to save appointment");
    } finally {
      setIsSaving(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <>
      <style>{`
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
        
        .appointment-modal-content [data-radix-popover-content] {
          z-index: 10001 !important;
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
      `}</style>
      
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="appointment-modal-content max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {formData.patientName || (isEditMode ? 'Edit Appointment' : 'New Appointment')}
            </DialogTitle>
          </DialogHeader>

          {checkingSession && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Checking session requirements...</span>
            </div>
          )}

          {!sessionCheckComplete && !isEditMode && (
            <div className="flex items-center justify-center p-4">
              <AlertCircle className="h-6 w-6 text-yellow-500 mr-2" />
              <span>Please wait for session verification...</span>
            </div>
          )}

          {/* Show warning if session requirements are not met */}
          {/* Don't show warning if any user has an active session (since that means the system is already being used) */}
          {!isEditMode && sessionCheckComplete && !hasAnyActiveSession && (!hasAttendance || (userRole !== 'doctor' && !hasActiveSession)) && (
            <div className="space-y-6 p-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-600 mb-2">Requirements Not Met</h3>
                <p className="text-sm text-red-800 mb-6">
                  You need to complete the following requirements before creating appointments:
                </p>
              </div>
              
              <div className="space-y-4">
                {!hasAttendance && (
                  <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-500 mr-3" />
                    <div className="flex-1">
                      <span className="font-medium text-red-700">Mark Attendance</span>
                      <p className="text-sm text-red-600">You must clock in before creating appointments</p>
                    </div>
                  </div>
                )}
                {userRole !== 'doctor' && !hasActiveSession && (
                  <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-500 mr-3" />
                    <div className="flex-1">
                      <span className="font-medium text-red-700">Start Cashier Session</span>
                      <p className="text-sm text-red-600">You must start a POS cashier session before creating appointments</p>
                    </div>
                  </div>
                )}
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
          )}

          {sessionCheckComplete && (!isEditMode ? (hasAttendance && (userRole === 'doctor' || hasActiveSession || hasAnyActiveSession)) : true) && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patientContact">Phone Number *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="patientContact"
                          type="tel"
                          value={formData.patientContact}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="Enter phone number"
                          className={errors.patientContact ? 'border-red-500' : ''}
                          maxLength={10}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePatientSearch}
                          disabled={checkingPatient || phoneDigitCount < 10}
                        >
                          {checkingPatient ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Search'
                          )}
                        </Button>
                      </div>
                      {errors.patientContact && (
                        <p className="text-sm text-red-500">{errors.patientContact}</p>
                      )}
                      {phoneDigitCount > 0 && phoneDigitCount < 10 && (
                        <p className="text-sm text-yellow-600">
                          {phoneDigitCount}/10 digits
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="patientName">Patient Name *</Label>
                      <Input
                        id="patientName"
                        value={formData.patientName}
                        onChange={(e) => handleInputChange('patientName', e.target.value)}
                        placeholder="Enter patient name"
                        className={errors.patientName ? 'border-red-500' : ''}
                      />
                      {errors.patientName && (
                        <p className="text-sm text-red-500">{errors.patientName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patientDOB">Date of Birth</Label>
                      <Input
                        id="patientDOB"
                        type="date"
                        value={formData.patientDOB || ''}
                        onChange={(e) => handleInputChange('patientDOB', e.target.value || undefined)}
                        placeholder="Select date of birth"
                      />
                      {formData.patientDOB && (
                        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                          Age: {calculateAge(formData.patientDOB).years} years, {calculateAge(formData.patientDOB).months} months
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="patientGender">Gender</Label>
                      <Select
                        value={formData.patientGender || ''}
                        onValueChange={(value) => handleInputChange('patientGender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="patientBodyWeight">Weight (kg)</Label>
                      <Input
                        id="patientBodyWeight"
                        type="number"
                        value={formData.patientBodyWeight || ''}
                        onChange={(e) => handleInputChange('patientBodyWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="Weight"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="drugAllergies">Drug Allergies</Label>
                    <Textarea
                      id="drugAllergies"
                      value={formData.drugAllergies}
                      onChange={(e) => handleInputChange('drugAllergies', e.target.value)}
                      placeholder="Enter any drug allergies"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Appointment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Appointment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="doctorId">Doctor *</Label>
                      <Select
                        value={formData.doctorId}
                        onValueChange={(value) => {
                          handleInputChange('doctorId', value);
                          loadDoctorProcedures(value);
                        }}
                      >
                        <SelectTrigger className={errors.doctorId ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingDoctors ? (
                            <SelectItem value="loading" disabled>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Loading doctors...
                            </SelectItem>
                          ) : (
                            doctors.map(doctor => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                {doctor.name} - {doctor.speciality}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {errors.doctorId && (
                        <p className="text-sm text-red-500">{errors.doctorId}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="date"
                          id="date"
                          value={formData.date}
                          onChange={(e) => {
                            const dateString = e.target.value;
                            const dayOfWeek = getDayOfWeek(new Date(dateString));
                            handleInputChange('date', dateString);
                            handleInputChange('dayOfWeek', dayOfWeek);
                          }}
                          className="pl-10 h-10"
                          disabled={isPastAppointment}
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time *</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="time"
                          id="startTime"
                          value={formData.startTime}
                          onChange={(e) => {
                            const startTime = e.target.value;
                            const endTime = calculateEndTime(startTime, formData.duration);
                            handleInputChange('startTime', startTime);
                            handleInputChange('endTime', endTime);
                          }}
                          className="pl-10 h-10"
                          step="900"
                        />
                      </div>
                      {errors.startTime && (
                        <p className="text-sm text-red-500">{errors.startTime}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration *</Label>
                      <div className="relative">
                        <Timer className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Select
                          value={formData.duration.toString()}
                          onValueChange={(value) => {
                            const duration = parseInt(value);
                            const endTime = calculateEndTime(formData.startTime, duration);
                            handleInputChange('duration', duration);
                            handleInputChange('endTime', endTime);
                          }}
                        >
                          <SelectTrigger className={`pl-10 h-10 ${errors.duration ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {DURATION_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                <div className="flex items-center gap-2">
                                  <Timer className="h-4 w-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {errors.duration && (
                        <p className="text-sm text-red-500">{errors.duration}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <div className="flex items-center h-10 px-3 py-2 border border-input bg-background rounded-md">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{formData.endTime || 'Auto-calculated'}</span>
                      </div>
                    </div>
                  </div>

                  {errors.timeSlot && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <p className="text-sm text-red-600">{errors.timeSlot}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Procedures */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Procedures & Charges (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingProcedures ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading procedures...</span>
                    </div>
                  ) : (
                    <>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {doctorProcedures.map(procedure => (
                            <div key={procedure.id} className="flex items-center space-x-2 p-2 border rounded">
                              <Checkbox
                                id={procedure.id}
                                checked={formData.selectedProcedures.includes(procedure.id)}
                                onCheckedChange={(checked) => 
                                  handleProcedureChange(procedure.id, checked as boolean)
                                }
                              />
                              <div className="flex-1">
                                <Label htmlFor={procedure.id} className="text-sm font-medium">
                                  {procedure.procedureName || procedure.id}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(procedure.doctorCharge)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      {errors.procedures && (
                        <p className="text-sm text-red-500">{errors.procedures}</p>
                      )}

                      <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <span className="font-medium">Total Charge:</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(totalCharge)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter any additional notes for this appointment"
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving || !sessionCheckComplete}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {isEditMode ? 'Update Appointment' : 'Create Appointment'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Patient Selection Modal */}
          {showPatientSelection && (
            <Dialog open={showPatientSelection} onOpenChange={setShowPatientSelection}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Patient</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  {foundPatients.map(patient => (
                    <div
                      key={patient.id}
                      className="p-3 border rounded cursor-pointer hover:bg-muted"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Age: {formatPatientAge(patient)} | Gender: {patient.gender || 'N/A'}
                      </div>
                      {patient.drugAllergies && (
                        <div className="text-sm text-red-600">
                          Allergies: {patient.drugAllergies}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
