// src/components/modals/EditAppointmentModal.tsx
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
  isTimeSlotAvailable, 
  calculateTotalCharge,
  Patient
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
  Save
} from 'lucide-react';
import { toast } from "sonner";
import { format, isBefore, startOfDay } from 'date-fns';
import { calculateAge, formatPatientAge } from '@/utils/ageUtils';

import { DateTimePicker } from './DateTimePicker';

interface EditAppointmentModalProps {
  appointment: Appointment;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper to convert day name to WeekDay type
const getDayOfWeek = (date: Date): string => {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return dayName;
};

export default function EditAppointmentModal({
  appointment,
  open,
  onClose,
  onSuccess
}: EditAppointmentModalProps) {
  const isEditMode = true; // Always in edit mode
  
  // Check if this is a past appointment
  const isPastAppointment = appointment && isBefore(new Date(appointment.date), startOfDay(new Date()));
  
  // Form data state - exactly matching AppointmentModal
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
    availableTimeSlots: [],
    selectedTimeSlot: null,
    availableProcedures: [],
    selectedProcedures: [],
    notes: '',
    status: 'scheduled'
  });
  
  // Loading and error states - exactly matching AppointmentModal
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
  
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Calculate total charge
  const [totalCharge, setTotalCharge] = useState(0);

  const [foundPatients, setFoundPatients] = useState<Patient[]>([]);
  const [showPatientSelection, setShowPatientSelection] = useState(false);
  
  useEffect(() => {
    if (open) {
      loadDoctors();
      loadAppointments();
      initializeFormData();
    }
  }, [open, appointment]);

  useEffect(() => {
    if (open && appointment) {
      setFormData(prev => ({
        ...prev,
        patientName: appointment.patientName,
        patientContact: appointment.patientContact,
        patientId: appointment.patientId,
        patientDOB: undefined, // Will be loaded when checking patient
        patientGender: undefined, // Will be loaded when checking patient  
        patientBodyWeight: undefined, // Will be loaded when checking patient
        drugAllergies: '', 
        doctorId: appointment.doctorId,
        date: appointment.date,
        dayOfWeek: appointment.dayOfWeek,
        selectedProcedures: (appointment.procedures || []).map(p => p.procedureId),
        notes: appointment.notes || '',
        status: appointment.status
      }));
      
      setTotalCharge(appointment.totalCharge || 0);
      setPatientExists(true);
      
      // Load patient details when editing
      if (appointment.patientId) {
        loadPatientDetails(appointment.patientId);
      }
    }
  }, [open, appointment]);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (formData.patientContact.length >= 3 && !isPastAppointment) {
        await searchPatientsRealtime(formData.patientContact);
      } else if (formData.patientContact.length < 3) {
        // Clear results if less than 3 digits
        setFoundPatients([]);
        setShowPatientSelection(false);
        setPatientExists(false);
        setFormData(prev => ({
          ...prev,
          patientId: '',
          patientDOB: undefined,
          patientGender: undefined,
          patientBodyWeight: undefined,
          drugAllergies: ''
        }));
      }
    }, 500); // 500ms delay after user stops typing

    return () => clearTimeout(searchTimeout);
  }, [formData.patientContact, isPastAppointment]);

  const searchPatientsRealtime = async (contactNumber: string) => {
    if (!contactNumber || contactNumber.length < 3) return;
    
    setLoadingPatient(true);
    
    try {
      // Get ALL patients with this contact number
      const patients = await appointmentService.getPatientsByContact(contactNumber);
      
      if (patients.length === 0) {
        // No patients found
        setPatientExists(false);
        setShowPatientSelection(false);
        setFoundPatients([]);
        setFormData(prev => ({
          ...prev,
          patientId: '',
          patientDOB: undefined,
          patientGender: undefined,
          patientBodyWeight: undefined,
          drugAllergies: ''
        }));
      } else if (patients.length === 1) {
        // Single patient found - auto-select
        const patient = patients[0];
        setFormData(prev => ({
          ...prev,
          patientName: patient.name,
          patientId: patient.id!,
          patientDOB: patient.age ? undefined : undefined, // We'll need to add DOB field to patient model
          patientGender: patient.gender,
          patientBodyWeight: patient.bodyWeight,
          drugAllergies: patient.drugAllergies || ''
        }));
        setPatientExists(true);
        setShowPatientSelection(false);
        setFoundPatients([]);
      } else {
        // Multiple patients found - show selection dropdown
        setFoundPatients(patients);
        setShowPatientSelection(true);
        setPatientExists(false);
        setFormData(prev => ({
          ...prev,
          patientId: '',
          patientDOB: undefined,
          patientGender: undefined,
          patientBodyWeight: undefined,
          drugAllergies: ''
        }));
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      // Don't show toast for real-time search errors to avoid spam
    } finally {
      setLoadingPatient(false);
    }
  };

  const loadPatientDetails = async (patientId: string) => {
    try {
      const patient = await appointmentService.getPatientById(patientId);
      if (patient) {
        setFormData(prev => ({
          ...prev,
          patientDOB: patient.age ? undefined : undefined, // We'll need to add DOB field to patient model
          patientGender: patient.gender,
          patientBodyWeight: patient.bodyWeight,
          drugAllergies: patient.drugAllergies || '' 
        }));
      }
    } catch (error) {
      console.error('Error loading patient details:', error);
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
    
    setFormData({
      patientName: appointment.patientName,
      patientContact: appointment.patientContact,
      patientId: appointment.patientId,
      patientAge: undefined,
      patientGender: undefined,
      patientBodyWeight: undefined,
      drugAllergies: '',
      doctorId: appointment.doctorId,
      date: appointment.date,
      dayOfWeek: appointment.dayOfWeek,
      availableTimeSlots: [],
      selectedTimeSlot: {
        startTime: appointment.startTime,
        endTime: appointment.endTime
      },
      availableProcedures: [],
      selectedProcedures: (appointment.procedures || []).map(p => p.procedureId),
      notes: appointment.notes || '',
      status: appointment.status
    });
    
    await loadDoctorSchedules(appointment.doctorId);
    await loadDoctorProcedures(appointment.doctorId);
    
    setTotalCharge(appointment.totalCharge);
  };
  
  const loadDoctorSchedules = async (doctorId: string) => {
    setLoadingSchedules(true);
    try {
      const doctorSchedules = await doctorService.getSchedulesByDoctorId(doctorId);
      setSchedules(doctorSchedules.filter(schedule => schedule.isActive));
      
      if (formData.date) {
        updateAvailableTimeSlots(doctorSchedules, formData.date);
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
      const availableSlots = daySchedule.timeSlots.map(slot => {
        // Count existing appointments for this slot
        const existingCount = existingAppointments.filter(app =>
          app.doctorId === formData.doctorId &&
          app.date === dateString &&
          app.startTime === slot.startTime &&
          app.endTime === slot.endTime &&
          app.status !== 'cancelled' &&
          app.id !== appointment?.id // Exclude current appointment when editing
        ).length;

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
        selectedTimeSlot: prev.selectedTimeSlot // Keep current selection when editing
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
        doctorCharge: proc.doctorCharge,
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
      setErrors(prev => ({ ...prev, patientContact: "Contact number is required" }));
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
          patientDOB: patient.age ? undefined : undefined, // We'll need to add DOB field to patient model
          patientGender: patient.gender,
          patientBodyWeight: patient.bodyWeight,
          drugAllergies: patient.drugAllergies || ''
        }));
        setPatientExists(true);
        toast.success("Patient found");
      } else {
        setPatientExists(false);
        setFormData(prev => ({
          ...prev,
          patientId: '',
          drugAllergies: ''
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
    setFormData(prev => ({
      ...prev,
      patientName: patient.name,
      patientId: patient.id!,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientBodyWeight: patient.bodyWeight,
      drugAllergies: patient.drugAllergies || ''
    }));
    setPatientExists(true);
    setShowPatientSelection(false);
    setFoundPatients([]);
    toast.success("Patient selected");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.patientName.trim()) {
      newErrors.patientName = "Patient name is required";
    }
    
    if (!formData.patientContact.trim()) {
      newErrors.patientContact = "Patient contact number is required";
    } else if (!/^\+?[0-9\s-]{7,15}$/.test(formData.patientContact.trim())) {
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
    
    if (formData.selectedProcedures.length === 0) {
      newErrors.procedures = "Please select at least one procedure";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
          contactNumber: formData.patientContact,
          age: formData.patientDOB ? calculateAge(formData.patientDOB).years : undefined,
          gender: formData.patientGender,
          bodyWeight: formData.patientBodyWeight,
          drugAllergies: formData.drugAllergies
        });
        patientId = newPatient.id!;
        toast.success("New patient created");
      } else {
        // Update existing patient if details changed
        const currentPatient = await appointmentService.getPatientById(patientId);
        if (currentPatient) {
        const hasChanges = 
          currentPatient.name !== formData.patientName ||
          currentPatient.contactNumber !== formData.patientContact ||
          currentPatient.age !== (formData.patientDOB ? calculateAge(formData.patientDOB).years : undefined) ||
          currentPatient.gender !== formData.patientGender ||
          currentPatient.bodyWeight !== formData.patientBodyWeight ||
          currentPatient.drugAllergies !== formData.drugAllergies;
        
        if (hasChanges) {
          await appointmentService.updatePatient(patientId, {
            name: formData.patientName,
            contactNumber: formData.patientContact,
            age: formData.patientDOB ? calculateAge(formData.patientDOB).years : undefined,
            gender: formData.patientGender,
            bodyWeight: formData.patientBodyWeight,
            drugAllergies: formData.drugAllergies
          });
            toast.success("Patient details updated");
          }
        }
      }
      
      // Continue with appointment update logic...
      const selectedProcedureObjects = formData.availableProcedures.filter(
        proc => formData.selectedProcedures.includes(proc.id!)
      );
      
      const procedures: AppointmentProcedure[] = selectedProcedureObjects.map(proc => ({
        procedureId: proc.id!,
        procedureName: proc.procedureName!,
        doctorCharge: proc.doctorCharge,
      }));
      
      const doctor = doctors.find(d => d.id === formData.doctorId);
      
      if (!doctor) {
        throw new Error("Selected doctor not found");
      }
      
      const appointmentData: Partial<Omit<Appointment, 'id' | 'createdAt'>> = {
        patientId,
        patientName: formData.patientName,
        patientContact: formData.patientContact,
        doctorId: formData.doctorId,
        doctorName: doctor.name,
        date: formData.date,
        startTime: formData.selectedTimeSlot!.startTime,
        endTime: formData.selectedTimeSlot!.endTime,
        dayOfWeek: formData.dayOfWeek,
        procedures,
        status: formData.status as any,
        notes: formData.notes,
        totalCharge
      };
      
      await appointmentService.updateAppointment(appointment.id!, appointmentData);
      toast.success("Appointment updated successfully");
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast.error(error.message || "Failed to update appointment");
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

  if (!open) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="text-xl">
            Edit Appointment
            {isPastAppointment && (
              <span className="ml-2 text-sm font-normal text-amber-600">(Past Appointment)</span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-1 pr-4">
            {/* Warning for past appointments */}
            {isPastAppointment && (
              <Card className="bg-amber-50 border-amber-200 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <strong>Note:</strong> This is a past appointment. You can view details and update status, but scheduling changes may be limited.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Information Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-2">
                      <Label htmlFor="patientContact">Contact Number *</Label>
                      <div className="flex space-x-2">
                        <div className="flex-1 relative">
                          <Input
                            id="patientContact"
                            value={formData.patientContact}
                            onChange={(e) => {
                              // Allow only numbers, spaces, hyphens, and plus sign
                              const sanitizedValue = e.target.value.replace(/[^0-9\s\-+]/g, '');
                              
                              setFormData(prev => ({ 
                                ...prev, 
                                patientContact: sanitizedValue,
                                patientId: prev.patientId // Keep existing patient ID when editing
                              }));
                              
                              // Reset patient selection when contact number changes significantly
                              if (sanitizedValue !== formData.patientContact && sanitizedValue.length < 3) {
                                setShowPatientSelection(false);
                                setFoundPatients([]);
                                setPatientExists(false);
                              }
                            }}
                            placeholder="Enter patient's contact number (auto-search after 3 digits)"
                            disabled={isSaving || isPastAppointment}
                            className="flex-1"
                          />
                          {loadingPatient && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            </div>
                          )}
                        </div>
                        <Button 
                          type="button"
                          variant="secondary"
                          onClick={checkPatient}
                          disabled={!formData.patientContact || isSaving || checkingPatient || isPastAppointment}
                          className="flex-shrink-0"
                        >
                          {checkingPatient ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <UserPlus className="h-4 w-4 mr-1" />
                          )}
                          Manual Check
                        </Button>
                      </div>
                      {errors.patientContact && <p className="text-sm text-red-500">{errors.patientContact}</p>}
                      
                      {/* Patient Selection Dropdown */}
                      {showPatientSelection && foundPatients.length > 0 && (
                        <Card className="mt-2 border-blue-200 bg-blue-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-blue-800">
                              Select Patient ({foundPatients.length} found)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {foundPatients.map((patient) => (
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
                                      {patient.age && (
                                        <span>Age: {patient.age}</span>
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
                              ))}
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
                    </div>
                      
                    <div className="relative">
                      {patientExists && (
                        <div className="absolute right-0 -top-6 flex items-center text-green-600 text-sm">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span>Existing patient</span>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="patientName">Patient Name *</Label>
                        <Input id="patientName"
                         value={formData.patientName}
                         onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                         placeholder="Enter patient's full name"
                         disabled={isSaving || isPastAppointment}
                       />
                       {errors.patientName && <p className="text-sm text-red-500">{errors.patientName}</p>}
                     </div>
                   </div>
                 </div>

                 {/* Additional Patient Details - Optional Fields */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                   <div className="space-y-2">
                     <Label htmlFor="patientDOB">Date of Birth (optional)</Label>
                     <Input
                       id="patientDOB"
                       type="date"
                       value={formData.patientDOB || ''}
                       onChange={(e) => setFormData(prev => ({ 
                         ...prev, 
                         patientDOB: e.target.value || undefined 
                       }))}
                       placeholder="Select date of birth"
                       disabled={isSaving || loadingPatient || isPastAppointment}
                     />
                     {formData.patientDOB && (
                       <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                         Age: {calculateAge(formData.patientDOB).years} years, {calculateAge(formData.patientDOB).months} months
                       </div>
                     )}
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

                   <div className="space-y-2 md:col-span-3">
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
             
             {/* Appointment Details Card */}
             <Card>
               <CardHeader className="pb-3">
                 <CardTitle className="text-lg flex items-center">
                   <Calendar className="h-5 w-5 mr-2" />
                   Appointment Details
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                 {/* Doctor Selection */}
                 <div className="space-y-2">
                   <Label htmlFor="doctor">Doctor *</Label>
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
                   <div className="space-y-2">
                     <Label>Appointment Date & Time *</Label>
                     <DateTimePicker
                       date={formData.date ? new Date(formData.date) : new Date()}
                       availableTimeSlots={formData.availableTimeSlots}
                       selectedTimeSlot={formData.selectedTimeSlot}
                       onDateChange={(selectedDate) => {
                         const dateString = format(selectedDate, 'yyyy-MM-dd');
                         handleDateChange(dateString);
                       }}
                       onTimeSlotSelect={(startTime, endTime) => {
                         handleTimeSlotSelect(startTime, endTime);
                       }}
                       disabled={!formData.doctorId || isSaving || isPastAppointment}
                     />
                     {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                     {!formData.selectedTimeSlot && formData.doctorId && formData.date && (
                       <p className="text-sm text-red-500">Please select a time slot</p>
                     )}
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
                             // Count existing appointments in this slot (excluding current appointment)
                             const existingCount = existingAppointments.filter(app =>
                               app.doctorId === formData.doctorId &&
                               app.date === formData.date &&
                               app.startTime === slot.startTime &&
                               app.endTime === slot.endTime &&
                               app.status !== 'cancelled' &&
                               app.id !== appointment?.id // Exclude current appointment
                             ).length;

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
             
             {/* Procedures Selection Card */}
             <Card>
               <CardHeader className="pb-3">
                 <CardTitle className="text-lg flex items-center">
                   <DollarSign className="h-5 w-5 mr-2" />
                   Procedures & Pricing
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div>
                   <Label>Select Procedures *</Label>
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
                 
                 {/* Total Charge Display */}
                 <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                   <div className="flex justify-between items-center">
                     <span className="text-lg font-medium text-blue-900">Total Charge:</span>
                     <span className="text-2xl font-bold text-blue-600">
                       {formatCurrency(totalCharge)}
                     </span>
                   </div>
                   {totalCharge !== appointment.totalCharge && (
                     <div className="mt-2 text-sm text-blue-700">
                       <span>Original: {formatCurrency(appointment.totalCharge || 0)}</span>
                       <span className="ml-2 font-medium">
                         Change: {totalCharge > (appointment.totalCharge || 0) ? '+' : ''}{formatCurrency(totalCharge - (appointment.totalCharge || 0))}
                       </span>
                     </div>
                   )}
                 </div>
               </CardContent>
             </Card>
             
             {/* Additional Information Card */}
             <Card>
               <CardContent className="pt-6 space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="notes">Notes (Optional)</Label>
                   <Textarea
                     id="notes"
                     value={formData.notes}
                     onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                     placeholder="Add any additional notes or special instructions"
                     rows={3}
                     disabled={isSaving}
                   />
                 </div>
                 
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
               </CardContent>
             </Card>
           </form>
         </div>
       </div>

       {/* Fixed Footer */}
       <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t bg-white">
         <Button
           type="button"
           variant="outline"
           onClick={onClose}
           disabled={isSaving}
         >
           Cancel
         </Button>
         <Button
           type="submit"
           disabled={isSaving || (isPastAppointment && !isEditMode)}
           onClick={handleSubmit}
         >
           {isSaving ? (
             <>
               <Loader2 className="h-4 w-4 mr-2 animate-spin" />
               Updating...
             </>
           ) : (
             <>
               <Save className="h-4 w-4 mr-2" />
               Update Appointment
             </>
           )}
         </Button>
       </div>
     </DialogContent>
   </Dialog>
 );
}