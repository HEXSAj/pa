// src/app/dashboard/appointments/DateTimePicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  CalendarDays,
  Timer
} from 'lucide-react';
import { format, startOfDay, isToday, isSameDay, addDays, subDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { TimeSlot } from '@/types/doctor';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  date: Date;
  availableTimeSlots: TimeSlot[];
  selectedTimeSlot: TimeSlot | null;
  onDateChange: (date: Date) => void;
  onTimeSlotSelect: (startTime: string, endTime: string) => void;
  disabled?: boolean;
  allowPastDates?: boolean; // Prop to control past date selection
}

export function DateTimePicker({
  date,
  availableTimeSlots,
  selectedTimeSlot,
  onDateChange,
  onTimeSlotSelect,
  disabled = false,
  allowPastDates = true // Default to true to allow past dates for testing
}: DateTimePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeSlotsOpen, setTimeSlotsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Debug logging
  console.log('🗓️ DateTimePicker props:', { allowPastDates, disabled, date });

  // Format time for display (24h to 12h)
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

  // Get minimum date (today)
  const today = startOfDay(new Date());

  // Close time slots when calendar opens and vice versa
  useEffect(() => {
    if (calendarOpen) {
      setTimeSlotsOpen(false);
    }
  }, [calendarOpen]);

  useEffect(() => {
    if (timeSlotsOpen) {
      setCalendarOpen(false);
    }
  }, [timeSlotsOpen]);

  // Animation handler
  const handleDateChange = (selectedDate: Date) => {
    setIsAnimating(true);
    onDateChange(selectedDate);
    setCalendarOpen(false);
    
    // Reset animation state after a short delay
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleTimeSlotSelect = (startTime: string, endTime: string) => {
    setIsAnimating(true);
    onTimeSlotSelect(startTime, endTime);
    setTimeSlotsOpen(false);
    
    // Reset animation state after a short delay
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Keyboard navigation handlers
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setCalendarOpen(false);
      setTimeSlotsOpen(false);
    }
  };

  const handleTimeSlotKeyDown = (event: React.KeyboardEvent, startTime: string, endTime: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTimeSlotSelect(startTime, endTime);
    }
  };

  // Quick date navigation helpers
  const goToToday = () => {
    if (!disabled) {
      handleDateChange(new Date());
    }
  };

  const goToTomorrow = () => {
    if (!disabled) {
      handleDateChange(addDays(new Date(), 1));
    }
  };

  const goToNextWeek = () => {
    if (!disabled) {
      handleDateChange(addDays(new Date(), 7));
    }
  };

  return (
    <>
      <style jsx global>{`
        [data-radix-popper-content-wrapper] {
          z-index: 9999 !important;
        }
        [data-radix-popover-content] {
          z-index: 9999 !important;
          max-height: 90vh !important;
          overflow-y: auto !important;
        }
        .rdp {
          margin: 0 !important;
        }
        .rdp-table {
          width: 100% !important;
        }
        .rdp-day {
          width: 2.75rem !important;
          height: 2.75rem !important;
          font-size: 0.95rem !important;
        }
        .rdp-head_cell {
          width: 2.75rem !important;
          height: 2.5rem !important;
          font-size: 0.9rem !important;
        }
        .rdp-caption {
          padding: 0.25rem 0 !important;
          margin-bottom: 0.25rem !important;
        }
        .rdp-caption_label {
          font-size: 0.875rem !important;
          font-weight: 600 !important;
        }
        .rdp-nav {
          padding: 0.125rem !important;
        }
        .rdp-nav_button {
          width: 1.25rem !important;
          height: 1.25rem !important;
        }
        .rdp-nav_button_previous,
        .rdp-nav_button_next {
          width: 1.25rem !important;
          height: 1.25rem !important;
        }
        .rdp-weekday {
          font-size: 0.7rem !important;
          font-weight: 500 !important;
        }
        .rdp-month {
          margin: 0 !important;
        }
        .rdp-tbody {
          margin-top: 0.625rem !important;
        }
        .rdp-tbody tr {
          margin-bottom: 0.5rem !important;
        }
        .rdp-tbody tr:last-child {
          margin-bottom: 0 !important;
        }
        .rdp-table {
          border-spacing: 0.625rem !important;
        }
        .rdp-caption_dropdowns {
          margin: 0 !important;
        }
        .rdp-caption_label {
          line-height: 1.2 !important;
        }
        .rdp-day_selected {
          font-weight: 600 !important;
        }
        .rdp-day_today {
          font-weight: 600 !important;
        }
        .rdp {
          font-size: 0.75rem !important;
        }
        .rdp-caption {
          height: 3rem !important;
        }
        .rdp-tbody tr:nth-child(6) {
          margin-bottom: 0.75rem !important;
        }
        .rdp-tbody tr:nth-child(5) {
          margin-bottom: 0.625rem !important;
        }
        .rdp-day:hover {
          background-color: #3b82f6 !important;
          color: white !important;
        }
        .rdp-day_selected {
          background-color: #1d4ed8 !important;
          color: white !important;
        }
      `}</style>
      <div className="w-full space-y-4" onKeyDown={handleKeyDown}>
      {/* Quick Date Navigation */}
      <div className="flex flex-wrap gap-2 sm:gap-3" role="group" aria-label="Quick date selection">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goToToday}
          disabled={disabled}
          className="text-xs px-3 py-1 h-8 sm:h-9 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 active:scale-95 transition-all duration-200 touch-manipulation"
          aria-label="Select today's date"
        >
          <CalendarDays className="h-3 w-3 mr-1" aria-hidden="true" />
          Today
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goToTomorrow}
          disabled={disabled}
          className="text-xs px-3 py-1 h-8 sm:h-9 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 active:scale-95 transition-all duration-200 touch-manipulation"
          aria-label="Select tomorrow's date"
        >
          <CalendarIcon className="h-3 w-3 mr-1" aria-hidden="true" />
          Tomorrow
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goToNextWeek}
          disabled={disabled}
          className="text-xs px-3 py-1 h-8 sm:h-9 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300 active:scale-95 transition-all duration-200 touch-manipulation"
          aria-label="Select next week's date"
        >
          <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
          Next Week
        </Button>
      </div>

      {/* Enhanced Date Selection */}
      <div className="w-full">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-between text-left font-normal h-12 sm:h-14 px-4 transition-all duration-200 touch-manipulation",
                !date && "text-muted-foreground",
                disabled && "cursor-not-allowed opacity-50",
                isAnimating && "scale-95",
                date && "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300 active:scale-98",
                isToday(date) && "bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 shadow-md"
              )}
              disabled={disabled}
              aria-label={date ? `Selected date: ${format(date, "EEEE, MMMM d, yyyy")}` : "Select appointment date"}
              aria-expanded={calendarOpen}
              aria-haspopup="dialog"
            >
              <div className="flex items-center">
                <div className={cn(
                  "p-2 rounded-lg mr-3 transition-colors duration-200",
                  isToday(date) 
                    ? "bg-blue-500 text-white" 
                    : date 
                      ? "bg-blue-100 text-blue-600" 
                      : "bg-gray-100 text-gray-500"
                )}>
                  <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                  {date ? (
                    <span className={cn(
                        isToday(date) && "text-blue-700 font-bold"
                    )}>
                      {format(date, "EEEE, MMMM d, yyyy")}
                    </span>
                  ) : (
                    "Select appointment date"
                  )}
                </span>
                  {date && (
                    <span className="text-xs text-muted-foreground">
                      {isToday(date) ? "Today" : format(date, "MMM d, yyyy")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {date && (
                  <Badge 
                    variant={isToday(date) ? "default" : "secondary"}
                    className={cn(
                      "text-xs px-2 py-1",
                      isToday(date) 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {isToday(date) ? "Today" : "Selected"}
                  </Badge>
                )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 z-[9999] shadow-xl border-0" 
            align="start"
            side="bottom"
            sideOffset={8}
            avoidCollisions={true}
            collisionPadding={24}
            alignOffset={0}
            sticky="always"
            style={{
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden min-w-[450px] w-full">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2.5 text-white">
                <h3 className="font-semibold text-sm flex items-center">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                  Select Date
                </h3>
                <p className="text-blue-100 text-xs mt-0.5">
                  Choose your preferred appointment date
                </p>
              </div>
              <div className="p-5 pb-6">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      handleDateChange(selectedDate);
                    }
                  }}
                  disabled={(date) => !allowPastDates && date < today}
                  initialFocus
                  className="rounded-md border-0 w-full"
                  modifiers={{
                    today: (date) => isToday(date)
                  }}
                  modifiersClassNames={{
                    today: "bg-blue-500 text-white font-bold hover:bg-blue-600 focus:bg-blue-600 relative ring-2 ring-blue-200"
                  }}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Enhanced Time Slot Selection */}
      <div className="w-full">
        <Popover open={timeSlotsOpen} onOpenChange={setTimeSlotsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-between text-left font-normal h-12 sm:h-14 px-4 transition-all duration-200 touch-manipulation",
                !selectedTimeSlot && "text-muted-foreground",
                (disabled || availableTimeSlots.length === 0) && "cursor-not-allowed opacity-50",
                isAnimating && "scale-95",
                selectedTimeSlot && "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300 active:scale-98"
              )}
              disabled={disabled || availableTimeSlots.length === 0}
              aria-label={selectedTimeSlot ? `Selected time: ${formatTime(selectedTimeSlot.startTime)} to ${formatTime(selectedTimeSlot.endTime)}` : "Select time slot"}
              aria-expanded={timeSlotsOpen}
              aria-haspopup="dialog"
            >
              <div className="flex items-center">
                <div className={cn(
                  "p-2 rounded-lg mr-3 transition-colors duration-200",
                  selectedTimeSlot 
                    ? "bg-green-500 text-white" 
                    : availableTimeSlots.length > 0
                      ? "bg-green-100 text-green-600" 
                      : "bg-gray-100 text-gray-500"
                )}>
                  <Clock className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                  {selectedTimeSlot 
                    ? `${formatTime(selectedTimeSlot.startTime)} - ${formatTime(selectedTimeSlot.endTime)}` 
                    : availableTimeSlots.length === 0 
                      ? "No time slots available for selected date" 
                      : "Select time slot"
                  }
                </span>
                  {selectedTimeSlot && (
                    <span className="text-xs text-muted-foreground">
                      {availableTimeSlots.length} slot{availableTimeSlots.length !== 1 ? 's' : ''} available
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedTimeSlot && (
                  <Badge 
                    variant="default"
                    className="bg-green-500 text-white text-xs px-2 py-1"
                  >
                    Selected
                  </Badge>
                )}
              {availableTimeSlots.length > 0 && (
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-full max-w-sm p-0 z-[9999] shadow-xl border-0" 
            align="start"
            side="bottom"
            sideOffset={8}
            avoidCollisions={true}
            collisionPadding={24}
            alignOffset={0}
            sticky="always"
            style={{
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 text-white">
                <h3 className="font-semibold text-base flex items-center">
                  <Timer className="h-4 w-4 mr-2" />
                  Available Time Slots
                </h3>
                <p className="text-green-100 text-xs mt-1">
                  {availableTimeSlots.length} slot{availableTimeSlots.length !== 1 ? 's' : ''} available
                </p>
              </div>
              
              {availableTimeSlots.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">No Time Slots Available</h4>
                  <p className="text-sm text-gray-500 mb-4">Please select a different date to see available time slots.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTimeSlotsOpen(false)}
                    className="text-xs"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <div className="p-3">
                  <div className="space-y-1 max-h-[200px] sm:max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {availableTimeSlots.map((slot, index) => (
                      <Button
                        key={`${slot.startTime}-${slot.endTime}-${index}`}
                        variant={
                          selectedTimeSlot?.startTime === slot.startTime && 
                          selectedTimeSlot?.endTime === slot.endTime 
                            ? "default" 
                            : "ghost"
                        }
                        size="sm"
                        className={cn(
                          "w-full justify-between h-10 sm:h-11 px-3 text-left transition-all duration-200 touch-manipulation",
                          selectedTimeSlot?.startTime === slot.startTime && 
                          selectedTimeSlot?.endTime === slot.endTime
                            ? "bg-green-500 text-white shadow-md hover:bg-green-600 active:scale-98" 
                            : "hover:bg-green-50 hover:text-green-700 border border-gray-200 active:scale-98"
                        )}
                        onClick={() => handleTimeSlotSelect(slot.startTime, slot.endTime)}
                        onKeyDown={(e) => handleTimeSlotKeyDown(e, slot.startTime, slot.endTime)}
                        aria-label={`Select time slot from ${formatTime(slot.startTime)} to ${formatTime(slot.endTime)}`}
                      >
                        <div className="flex items-center">
                          <Clock className="mr-3 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                            <span className="text-xs opacity-75">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                        </div>
                        {selectedTimeSlot?.startTime === slot.startTime && 
                         selectedTimeSlot?.endTime === slot.endTime && (
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Enhanced Selection Summary */}
      {date && selectedTimeSlot && (
        <div 
          className="rounded-xl bg-gradient-to-r from-blue-50 via-green-50 to-indigo-50 p-4 border border-blue-200 shadow-sm"
          role="status"
          aria-live="polite"
          aria-label="Appointment selection summary"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
              Appointment Confirmed
            </p>
                <p className="text-xs text-green-600">Ready to book your appointment</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
                <CalendarIcon className="h-4 w-4 text-blue-600 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                  <p className={cn(
                    "text-sm font-medium",
                    isToday(date) && "text-blue-700 font-bold"
              )}>
                {format(date, "EEEE, MMMM d, yyyy")}
                {isToday(date) && " (Today)"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                <Clock className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Time</p>
                  <p className="text-sm font-medium text-green-700">
                    {formatTime(selectedTimeSlot.startTime)} - {formatTime(selectedTimeSlot.endTime)}
                  </p>
                </div>
            </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}