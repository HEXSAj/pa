// src/app/dashboard/doctors/ScheduleModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Doctor, DoctorSchedule, TimeSlot, WeekDay } from '@/types/doctor';
import { doctorService } from '@/services/doctorService';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  Plus, 
  X, 
  Clock, 
  AlertTriangle,
  Calendar,
  User,
  CheckCircle2,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Zap,
  CalendarDays
} from 'lucide-react';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScheduleModalProps {
  schedule?: DoctorSchedule;
  doctorId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const weekDays: { value: WeekDay; label: string; icon: string; color: string }[] = [
  { value: 'monday', label: 'Monday', icon: '📅', color: 'blue' },
  { value: 'tuesday', label: 'Tuesday', icon: '📅', color: 'green' },
  { value: 'wednesday', label: 'Wednesday', icon: '📅', color: 'yellow' },
  { value: 'thursday', label: 'Thursday', icon: '📅', color: 'orange' },
  { value: 'friday', label: 'Friday', icon: '📅', color: 'red' },
  { value: 'saturday', label: 'Saturday', icon: '📅', color: 'purple' },
  { value: 'sunday', label: 'Sunday', icon: '📅', color: 'pink' },
];

// Time presets for quick selection
const timePresets = [
  { label: 'Morning Shift', start: '08:00', end: '12:00', icon: <Sunrise className="h-4 w-4" />, color: 'orange' },
  { label: 'Afternoon Shift', start: '13:00', end: '17:00', icon: <Sun className="h-4 w-4" />, color: 'yellow' },
  { label: 'Evening Shift', start: '18:00', end: '22:00', icon: <Sunset className="h-4 w-4" />, color: 'purple' },
  { label: 'Night Shift', start: '22:00', end: '06:00', icon: <Moon className="h-4 w-4" />, color: 'blue' },
];

export default function ScheduleModal({ schedule, doctorId, onClose, onSuccess }: ScheduleModalProps) {
  const isEditMode = !!schedule;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  
  const [formData, setFormData] = useState<Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'>>({
    doctorId: doctorId || '',
    dayOfWeek: 'monday',
    timeSlots: [],
    isActive: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  // Load doctors if needed
  useEffect(() => {
    if (!doctorId) {
      loadDoctors();
    }
  }, [doctorId]);

  // Initialize form data if editing
  useEffect(() => {
    if (schedule) {
      setFormData({
        doctorId: schedule.doctorId,
        dayOfWeek: schedule.dayOfWeek,
        timeSlots: [...schedule.timeSlots],
        isActive: schedule.isActive !== undefined ? schedule.isActive : true
      });
    } else if (doctorId) {
      setFormData(prev => ({
        ...prev,
        doctorId
      }));
    }
  }, [schedule, doctorId]);

  // Update selected doctor when doctorId changes
  useEffect(() => {
    if (formData.doctorId && doctors.length > 0) {
      const doctor = doctors.find(d => d.id === formData.doctorId);
      setSelectedDoctor(doctor || null);
    }
  }, [formData.doctorId, doctors]);

  // Update selected day when dayOfWeek changes
  useEffect(() => {
    const day = weekDays.find(d => d.value === formData.dayOfWeek);
    setSelectedDay(day);
  }, [formData.dayOfWeek]);

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.doctorId) {
      newErrors.doctorId = 'Doctor selection is required';
    }

    if (!formData.dayOfWeek) {
      newErrors.dayOfWeek = 'Day of week is required';
    }

    if (formData.timeSlots.length === 0) {
      newErrors.timeSlots = 'At least one time slot is required';
    } else {
      formData.timeSlots.forEach((slot, index) => {
        if (!slot.startTime) {
          newErrors[`timeSlot_${index}_start`] = 'Start time is required';
        }
        if (!slot.endTime) {
          newErrors[`timeSlot_${index}_end`] = 'End time is required';
        }
        if (slot.startTime && slot.endTime && slot.startTime >= slot.endTime) {
          newErrors[`timeSlot_${index}_range`] = 'End time must be after start time';
        }
      });

      // Check for overlapping time slots
      for (let i = 0; i < formData.timeSlots.length; i++) {
        for (let j = i + 1; j < formData.timeSlots.length; j++) {
          const slotA = formData.timeSlots[i];
          const slotB = formData.timeSlots[j];

          const bStartsDuringA = slotB.startTime >= slotA.startTime && slotB.startTime < slotA.endTime;
          const bEndsDuringA = slotB.endTime > slotA.startTime && slotB.endTime <= slotA.endTime;
          const bContainsA = slotB.startTime <= slotA.startTime && slotB.endTime >= slotA.endTime;

          if (bStartsDuringA || bEndsDuringA || bContainsA) {
            newErrors.timeSlotOverlap = 'Time slots cannot overlap';
            break;
          }
        }
      }
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
      if (isEditMode && schedule?.id) {
        await doctorService.updateSchedule(schedule.id, formData);
        toast.success("Schedule updated successfully");
      } else {
        await doctorService.createSchedule(formData);
        toast.success("Schedule added successfully");
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast.error(error.message || "Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { startTime: '', endTime: '' }]
    }));
  };

  const addPresetTimeSlot = (preset: any) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { startTime: preset.start, endTime: preset.end }]
    }));
  };

  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string) => {
    setFormData(prev => {
      const newTimeSlots = [...prev.timeSlots];
      newTimeSlots[index] = { ...newTimeSlots[index], [field]: value };
      return { ...prev, timeSlots: newTimeSlots };
    });
  };

  const formatTime = (time: string) => {
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

  const getTimeSlotDuration = (slot: TimeSlot) => {
    if (!slot.startTime || !slot.endTime) return '';
    
    const start = new Date(`2000-01-01T${slot.startTime}`);
    const end = new Date(`2000-01-01T${slot.endTime}`);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] rounded-xl overflow-hidden p-0 flex flex-col [&>button]:hidden">
        {/* Hidden DialogTitle for accessibility */}
        <VisuallyHidden>
          <DialogTitle>
            {isEditMode ? `Edit Schedule - ${selectedDay?.label}` : 'Add New Schedule'}
          </DialogTitle>
        </VisuallyHidden>

        {/* Custom Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 py-4 px-6 flex-shrink-0 relative">
          <div className="pr-10">
            <h2 className="text-white text-xl font-semibold flex items-center gap-2">
              {isEditMode ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Edit Schedule - {selectedDay?.label}
                </>
              ) : (
                <>
                  <CalendarDays className="h-5 w-5" />
                  Add New Schedule
                </>
              )}
            </h2>
            <p className="text-green-200 mt-1 text-sm">
              {isEditMode ? 'Update doctor availability schedule' : 'Set up doctor availability times'}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="absolute top-4 right-4 h-8 w-8 rounded-full text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-col flex-grow min-h-0">
          <div className="flex-grow overflow-y-auto px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="border-0 shadow-none bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                <CardContent className="space-y-6 pt-6">
                  
                  {/* Selection Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Schedule Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Doctor Selection */}
                      {!doctorId && (
                        <div className="space-y-2">
                          <Label htmlFor="doctorId" className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Doctor *
                          </Label>
                          {loadingDoctors ? (
                            <div className="flex items-center space-x-2 p-3 border rounded-md">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Loading doctors...</span>
                            </div>
                          ) : (
                            <Select
                              value={formData.doctorId}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, doctorId: value }))}
                            >
                              <SelectTrigger className={`h-11 ${errors.doctorId ? 'border-red-300' : 'border-gray-200'}`}>
                                <SelectValue placeholder="Select a doctor" />
                              </SelectTrigger>
                              <SelectContent>
                                {doctors.map(doctor => (
                                  <SelectItem key={doctor.id} value={doctor.id!}>
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      <span>{doctor.name}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {doctor.speciality}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {errors.doctorId && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {errors.doctorId}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Day Selection */}
                      <div className={`space-y-2 ${!doctorId ? '' : 'md:col-span-2'}`}>
                        <Label htmlFor="dayOfWeek" className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Day of Week *
                        </Label>
                        <Select
                          value={formData.dayOfWeek}
                          onValueChange={(value: WeekDay) => setFormData(prev => ({ ...prev, dayOfWeek: value }))}
                        >
                          <SelectTrigger className={`h-11 ${errors.dayOfWeek ? 'border-red-300' : 'border-gray-200'}`}>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {weekDays.map(day => (
                              <SelectItem key={day.value} value={day.value}>
                                <div className="flex items-center gap-2">
                                  <span>{day.icon}</span>
                                  <span>{day.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.dayOfWeek && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {errors.dayOfWeek}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Selected Doctor Info Card */}
                    {selectedDoctor && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{selectedDoctor.name}</h4>
                            <p className="text-sm text-blue-600">{selectedDoctor.speciality}</p>
                          </div>
                          {selectedDay && (
                            <div className="ml-auto text-right">
                              <p className="text-sm font-medium">{selectedDay.label}</p>
                              <Badge variant="outline" className="text-xs">
                                {selectedDay.icon} Schedule
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Time Slots Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Time Slots</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Add multiple time slots for availability windows</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addTimeSlot}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Custom Slot
                      </Button>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {timePresets.map((preset, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addPresetTimeSlot(preset)}
                          className="h-auto p-3 flex flex-col items-center gap-1 hover:bg-blue-50"
                        >
                          {preset.icon}
                          <span className="text-xs font-medium">{preset.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(preset.start)} - {formatTime(preset.end)}
                          </span>
                        </Button>
                      ))}
                    </div>
                    
                    {errors.timeSlots && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        {errors.timeSlots}
                      </p>
                    )}
                    
                    {errors.timeSlotOverlap && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <p>{errors.timeSlotOverlap}</p>
                      </div>
                    )}
                    
                    {/* Time Slots List */}
                    {formData.timeSlots.length === 0 ? (
                      <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <Clock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-muted-foreground mb-3">No time slots added yet</p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Use the preset buttons above or click "Add Custom Slot" to define availability windows
                        </p>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={addTimeSlot}
                          className="gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add First Time Slot
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.timeSlots.map((slot, index) => (
                          <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                </div>
                              </div>
                              
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                {/* Start Time */}
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-gray-600">Start Time</Label>
                                  <Input
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                                    className="h-9 text-sm"
                                  />
                                  {errors[`timeSlot_${index}_start`] && (
                                    <p className="text-xs text-red-500">{errors[`timeSlot_${index}_start`]}</p>
                                  )}
                                </div>
                                
                                {/* End Time */}
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-gray-600">End Time</Label>
                                  <Input
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                                    className="h-9 text-sm"
                                  />
                                  {errors[`timeSlot_${index}_end`] && (
                                    <p className="text-xs text-red-500">{errors[`timeSlot_${index}_end`]}</p>
                                  )}
                                </div>
                                
                                {/* Duration & Actions */}
                                <div className="flex items-center justify-between">
                                  {slot.startTime && slot.endTime && (
                                    <div className="text-center">
                                      <p className="text-xs text-gray-600">Duration</p>
                                      <Badge variant="secondary" className="text-xs">
                                        {getTimeSlotDuration(slot)}
                                      </Badge>
                                    </div>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTimeSlot(index)}
                                    className="h-8 w-8 p-0 flex-shrink-0 text-red-600 hover:text-red-900 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Time Display */}
                            {slot.startTime && slot.endTime && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Time Window:</span>
                                  <span className="font-medium text-gray-900">
                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {errors[`timeSlot_${index}_range`] && (
                              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {errors[`timeSlot_${index}_range`]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Status Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Schedule Status</h3>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <Checkbox
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ 
                            ...prev, 
                            isActive: checked as boolean 
                          }))
                        }
                        className="h-5 w-5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Active Schedule
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.isActive 
                            ? "This schedule is currently active and available for patient bookings" 
                            : "This schedule is currently inactive and not available for new bookings"
                          }
                        </p>
                      </div>
                      <Badge variant={formData.isActive ? "success" : "secondary"} className="ml-2">
                        {formData.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {/* Schedule Summary */}
                    {formData.timeSlots.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Schedule Summary
                        </h4>
                        <div className="space-y-1 text-sm text-blue-700">
                          <p><strong>Doctor:</strong> {selectedDoctor?.name || 'Selected Doctor'}</p>
                          <p><strong>Day:</strong> {selectedDay?.label}</p>
                          <p><strong>Time Slots:</strong> {formData.timeSlots.length} slot(s)</p>
                          <div className="text-xs text-blue-600 mt-2">
                            {formData.timeSlots.map((slot, index) => (
                              slot.startTime && slot.endTime && (
                                <span key={index} className="inline-block mr-2 mb-1">
                                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  {index < formData.timeSlots.length - 1 && ', '}
                                </span>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
          
          {/* Fixed Footer */}
          <div className="px-6 pb-6 pt-4 flex-shrink-0 border-t bg-gray-50/50">
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-lg border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {isEditMode ? (
                      <><CheckCircle2 className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Add Schedule
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
}