// src/app/dashboard/appointments/AppointmentTimeline.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Appointment, formatDuration } from '@/types/appointment';
import { Doctor } from '@/types/doctor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  User, 
  Phone, 
  DollarSign, 
  Calendar,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  GripVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AppointmentTimelineProps {
  appointments: Appointment[];
  doctors: Doctor[];
  selectedDate: string;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onUpdateAppointment: (appointmentId: string, updates: Partial<Appointment>) => Promise<void>;
}

interface TimeSlot {
  time: string;
  appointments: Appointment[];
}

interface DragState {
  isDragging: boolean;
  draggedAppointment: Appointment | null;
  startPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    case 'no-show': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'scheduled': return <Clock className="h-3 w-3" />;
    case 'completed': return <CheckCircle2 className="h-3 w-3" />;
    case 'cancelled': return <XCircle className="h-3 w-3" />;
    case 'no-show': return <AlertCircle className="h-3 w-3" />;
    default: return <Clock className="h-3 w-3" />;
  }
};

export default function AppointmentTimeline({
  appointments,
  doctors,
  selectedDate,
  onEditAppointment,
  onDeleteAppointment,
  onUpdateAppointment
}: AppointmentTimelineProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedAppointment: null,
    startPosition: null,
    currentPosition: null
  });
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Group appointments by time slots
  useEffect(() => {
    const groupedSlots: TimeSlot[] = TIME_SLOTS.map(time => ({
      time,
      appointments: appointments.filter(apt => {
        const aptStartTime = apt.startTime;
        const aptEndTime = apt.endTime;
        
        // Check if appointment overlaps with this time slot
        return aptStartTime <= time && aptEndTime > time;
      })
    }));
    
    setTimeSlots(groupedSlots);
  }, [appointments]);

  const getTimeSlotPosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 8 * 60; // 8:00 AM
    return ((totalMinutes - startMinutes) / 30) * 60; // 60px per 30-minute slot
  };

  const getAppointmentHeight = (appointment: Appointment): number => {
    // Calculate height based on duration to match time slot grid (60px per 30-minute slot)
    const calculatedHeight = (appointment.duration / 30) * 60;
    
    // For very short appointments (15 min), ensure minimum usable height
    if (appointment.duration <= 15) {
      return Math.max(calculatedHeight, 60); // 60px minimum (1 time slot)
    }
    // For short appointments (30 min or less), use calculated height
    if (appointment.duration <= 30) {
      return Math.max(calculatedHeight, 60); // 60px minimum (1 time slot)
    }
    // For longer appointments, use calculated height
    return Math.max(calculatedHeight, 60); // 60px minimum (1 time slot)
  };

  const getAppointmentTop = (appointment: Appointment): number => {
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 8 * 60; // 8:00 AM
    return ((totalMinutes - startMinutes) / 30) * 60;
  };

  // Function to detect overlapping appointments and calculate positioning
  const getAppointmentPosition = (appointment: Appointment) => {
    const top = getAppointmentTop(appointment);
    const height = getAppointmentHeight(appointment);
    
    // Find all appointments that overlap with this one
    const overlappingAppointments = appointments.filter(apt => {
      if (apt.id === appointment.id) return false;
      
      const aptTop = getAppointmentTop(apt);
      const aptHeight = getAppointmentHeight(apt);
      
      // Check if appointments overlap (excluding consecutive appointments that share time boundaries)
      return !(top + height <= aptTop || aptTop + aptHeight <= top);
    });
    
    // Sort overlapping appointments by start time
    const sortedOverlapping = [appointment, ...overlappingAppointments].sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
    
    // Find the index of current appointment in the sorted list
    const index = sortedOverlapping.findIndex(apt => apt.id === appointment.id);
    const totalOverlapping = sortedOverlapping.length;
    
    // Calculate width and left position for side-by-side display
    const marginLeft = 6; // 6px margin from left edge
    const marginRight = 6; // 6px margin from right edge
    const availableWidth = 100 - (marginLeft + marginRight); // Available width in percentage
    const gap = 1; // 1% gap between overlapping appointments
    const totalGapWidth = (totalOverlapping - 1) * gap;
    const width = (availableWidth - totalGapWidth) / totalOverlapping;
    const left = marginLeft + (index * (width + gap));
    
    // Debug logging
    if (totalOverlapping > 1) {
      console.log(`Appointment ${appointment.patientName} (${appointment.startTime}-${appointment.endTime}) has ${totalOverlapping} overlapping appointments:`, 
        sortedOverlapping.map(apt => `${apt.patientName} (${apt.startTime}-${apt.endTime})`));
      console.log(`Position: left=${left}%, width=${width}%, index=${index}/${totalOverlapping}`);
    }
    
    return {
      top,
      height,
      left: `${left}%`,
      width: `${width}%`,
      zIndex: totalOverlapping - index // Higher z-index for earlier appointments
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, appointment: Appointment) => {
    e.preventDefault();
    setDragState({
      isDragging: true,
      draggedAppointment: appointment,
      startPosition: { x: e.clientX, y: e.clientY },
      currentPosition: { x: e.clientX, y: e.clientY }
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    setDragState(prev => ({
      ...prev,
      currentPosition: { x: e.clientX, y: e.clientY }
    }));
  }, [dragState.isDragging]);

  const handleMouseUp = useCallback(async (e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedAppointment || !timelineRef.current) {
      setDragState({
        isDragging: false,
        draggedAppointment: null,
        startPosition: null,
        currentPosition: null
      });
      return;
    }

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const relativeY = e.clientY - timelineRect.top;
    
    // Calculate new time based on position
    const slotHeight = 60; // 60px per 30-minute slot
    const slotIndex = Math.floor(relativeY / slotHeight);
    const newTimeMinutes = 8 * 60 + (slotIndex * 30); // Start from 8:00 AM
    const newHours = Math.floor(newTimeMinutes / 60);
    const newMinutes = newTimeMinutes % 60;
    const newStartTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;

    // Check if the new time is valid
    if (newTimeMinutes < 8 * 60 || newTimeMinutes > 18 * 60) {
      toast.error('Cannot move appointment outside working hours (8:00 AM - 6:00 PM)');
      setDragState({
        isDragging: false,
        draggedAppointment: null,
        startPosition: null,
        currentPosition: null
      });
      return;
    }

    // Check for conflicts
    const conflictingAppointment = appointments.find(apt => 
      apt.id !== dragState.draggedAppointment!.id &&
      apt.doctorId === dragState.draggedAppointment!.doctorId &&
      apt.date === selectedDate &&
      ((newStartTime >= apt.startTime && newStartTime < apt.endTime) ||
       (newStartTime < apt.startTime && newStartTime + dragState.draggedAppointment!.duration > apt.startTime))
    );

    if (conflictingAppointment) {
      toast.error('Cannot move appointment - time slot is already occupied');
      setDragState({
        isDragging: false,
        draggedAppointment: null,
        startPosition: null,
        currentPosition: null
      });
      return;
    }

    try {
      // Update appointment with new time
      const newEndTime = `${Math.floor((newTimeMinutes + dragState.draggedAppointment!.duration) / 60).toString().padStart(2, '0')}:${((newTimeMinutes + dragState.draggedAppointment!.duration) % 60).toString().padStart(2, '0')}`;
      
      await onUpdateAppointment(dragState.draggedAppointment.id!, {
        startTime: newStartTime,
        endTime: newEndTime
      });
      
      toast.success('Appointment time updated successfully!');
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment time');
    }

    setDragState({
      isDragging: false,
      draggedAppointment: null,
      startPosition: null,
      currentPosition: null
    });
  }, [dragState, appointments, selectedDate, onUpdateAppointment]);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Timeline View</h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Drag appointments to reschedule • Click to edit • Overlapping appointments display side by side
          </div>
          <div className="text-sm font-medium text-blue-600">
            {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Enhanced Timeline */}
      <div className="relative">
        <div 
          ref={timelineRef}
          className="relative border-0 rounded-xl bg-gradient-to-b from-gray-50 to-white shadow-sm min-h-[600px] overflow-hidden overflow-x-auto"
          style={{ 
            height: `${TIME_SLOTS.length * 60}px`,
            minWidth: '100%'
          }}
        >
          {/* Enhanced Time grid lines */}
          {TIME_SLOTS.map((time, index) => (
            <div
              key={time}
              className={`absolute left-0 right-0 ${
                index % 2 === 0 ? 'border-t border-gray-200' : 'border-t border-gray-100'
              }`}
              style={{ top: `${index * 60}px` }}
            >
              <div className="absolute left-4 top-2 text-xs text-gray-600 font-medium bg-white px-2 py-1 rounded-md shadow-sm">
                {formatTime(time)}
              </div>
            </div>
          ))}

          {/* Appointments */}
          {appointments.map((appointment) => {
            const position = getAppointmentPosition(appointment);
            const doctor = doctors.find(d => d.id === appointment.doctorId);
            
            return (
              <div
                key={appointment.id}
                className={`group absolute rounded-xl border-2 cursor-move transition-all duration-300 shadow-sm ${
                  dragState.draggedAppointment?.id === appointment.id
                    ? 'opacity-50 scale-105 shadow-2xl z-50'
                    : 'hover:shadow-lg hover:scale-[1.02]'
                } ${getStatusColor(appointment.status)} backdrop-blur-sm ${
                  position.width !== '88%' ? 'ring-2 ring-blue-200' : ''
                }`}
                style={{
                  top: `${position.top}px`,
                  height: `${position.height}px`,
                  left: position.left,
                  width: position.width,
                  zIndex: position.zIndex,
                  transform: dragState.draggedAppointment?.id === appointment.id && dragState.currentPosition
                    ? `translate(${dragState.currentPosition.x - (dragState.startPosition?.x || 0)}px, ${dragState.currentPosition.y - (dragState.startPosition?.y || 0)}px)`
                    : 'none'
                }}
                onMouseDown={(e) => handleMouseDown(e, appointment)}
                title={`${appointment.patientName} - ${doctor?.name || 'Unknown Doctor'} - ${formatTime(appointment.startTime)} to ${formatTime(appointment.endTime)} - Rs. ${appointment.totalCharge.toFixed(2)}`}
              >
                <div className="p-1 h-full flex flex-col bg-white/95 backdrop-blur-sm overflow-hidden relative">
                  {/* Visual indicator for very short appointments */}
                  {appointment.duration <= 15 && (
                    <div className="absolute top-0 right-0 w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-orange-400"></div>
                  )}
                  
                  {/* Visual indicator for overlapping appointments */}
                  {(() => {
                    const overlappingCount = appointments.filter(apt => {
                      if (apt.id === appointment.id) return false;
                      const aptTop = getAppointmentTop(apt);
                      const aptHeight = getAppointmentHeight(apt);
                      const currentTop = getAppointmentTop(appointment);
                      const currentHeight = getAppointmentHeight(appointment);
                      return !(currentTop + currentHeight <= aptTop || aptTop + aptHeight <= currentTop);
                    }).length;
                    
                    return overlappingCount > 0 && (
                      <div className="absolute top-0 left-0 w-0 h-0 border-r-[6px] border-r-transparent border-t-[6px] border-t-blue-400"></div>
                    );
                  })()}
                  
                  {/* Ultra-compact layout for small heights */}
                  {appointment.duration <= 15 ? (
                    // Very compact layout for 15-minute appointments
                    <>
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <GripVertical className="h-2 w-2 text-gray-400 flex-shrink-0" />
                          <span className="font-semibold text-xs truncate">
                            {appointment.patientName}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs bg-white/90 flex-shrink-0 ml-1 px-1 py-0">
                          {getStatusIcon(appointment.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-gray-600 truncate">
                          {doctor?.name || 'Unknown Doctor'}
                        </span>
                        <span className="text-xs text-gray-600">
                          {formatTime(appointment.startTime)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs font-semibold text-green-700">
                          Rs.{appointment.totalCharge.toFixed(0)}
                        </span>
                        <div className="flex gap-0.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 hover:bg-blue-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditAppointment(appointment);
                            }}
                            title="Edit appointment"
                          >
                            <Edit className="h-2 w-2" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteAppointment(appointment.id!);
                            }}
                            title="Delete appointment"
                          >
                            <Trash2 className="h-2 w-2" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Standard compact layout for longer appointments
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <GripVertical className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                          <span className="font-semibold text-xs truncate">
                            {appointment.patientName}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs bg-white/90 flex-shrink-0 ml-1 px-1 py-0">
                          {getStatusIcon(appointment.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-1">
                        <User className="h-2.5 w-2.5 text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate">
                          {doctor?.name || 'Unknown Doctor'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 text-gray-500" />
                          <span className="text-xs text-gray-600">
                            {formatTime(appointment.startTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-2.5 w-2.5 text-green-600" />
                          <span className="text-xs font-semibold text-green-700">
                            Rs.{appointment.totalCharge.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs text-gray-500">
                          ({formatDuration(appointment.duration)})
                        </span>
                        <div className="flex gap-0.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 hover:bg-blue-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditAppointment(appointment);
                            }}
                            title="Edit appointment"
                          >
                            <Edit className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteAppointment(appointment.id!);
                            }}
                            title="Delete appointment"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Enhanced Drag preview */}
          {dragState.isDragging && dragState.draggedAppointment && (
            <div
              className="fixed pointer-events-none z-50 opacity-90"
              style={{
                left: dragState.currentPosition?.x || 0,
                top: dragState.currentPosition?.y || 0,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <Card className="w-72 shadow-2xl border-2 border-blue-300">
                <CardContent className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="font-semibold text-sm text-blue-900">
                    {dragState.draggedAppointment.patientName}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    {formatTime(dragState.draggedAppointment.startTime)} - {formatTime(dragState.draggedAppointment.endTime)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Moving appointment...
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Legend */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-lg bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
                <Clock className="h-2 w-2 text-blue-600" />
              </div>
              <span className="font-medium text-blue-700">Scheduled</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-lg bg-green-50 border-2 border-green-200 flex items-center justify-center">
                <CheckCircle2 className="h-2 w-2 text-green-600" />
              </div>
              <span className="font-medium text-green-700">Completed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-lg bg-red-50 border-2 border-red-200 flex items-center justify-center">
                <XCircle className="h-2 w-2 text-red-600" />
              </div>
              <span className="font-medium text-red-700">Cancelled</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-lg bg-yellow-50 border-2 border-yellow-200 flex items-center justify-center">
                <AlertCircle className="h-2 w-2 text-yellow-600" />
              </div>
              <span className="font-medium text-yellow-700">No Show</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-4 h-4 rounded-lg bg-orange-50 border-2 border-orange-200">
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-orange-400"></div>
              </div>
              <span className="font-medium text-orange-700">Short (≤15min)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-4 h-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                <div className="absolute top-0 left-0 w-0 h-0 border-r-[6px] border-r-transparent border-t-[6px] border-t-blue-400"></div>
              </div>
              <span className="font-medium text-blue-700">Overlapping</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
