// src/app/dashboard/appointments/DateTimePicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TimeSlot } from '@/types/doctor';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  date: Date;
  availableTimeSlots: TimeSlot[];
  selectedTimeSlot: TimeSlot | null;
  onDateChange: (date: Date) => void;
  onTimeSlotSelect: (startTime: string, endTime: string) => void;
  disabled?: boolean;
}

export function DateTimePicker({
  date,
  availableTimeSlots,
  selectedTimeSlot,
  onDateChange,
  onTimeSlotSelect,
  disabled = false
}: DateTimePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeSlotsOpen, setTimeSlotsOpen] = useState(false);

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

  return (
    <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal sm:w-[240px]",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "MMMM d, yyyy") : "Select date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(day) => {
              onDateChange(day || new Date());
              setCalendarOpen(false);
            }}
            disabled={(date) => date < today} // This prevents selecting past dates
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover open={timeSlotsOpen} onOpenChange={setTimeSlotsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedTimeSlot && "text-muted-foreground"
            )}
            disabled={disabled || availableTimeSlots.length === 0}
          >
            <Clock className="mr-2 h-4 w-4" />
            {selectedTimeSlot 
              ? `${formatTime(selectedTimeSlot.startTime)} - ${formatTime(selectedTimeSlot.endTime)}` 
              : availableTimeSlots.length === 0 
                ? "No time slots available" 
                : "Select time slot"
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-2">
            <h4 className="mb-2 font-medium">Available Time Slots</h4>
            {availableTimeSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">No time slots available for this date</p>
            ) : (
              <div className="grid grid-cols-1 gap-1 max-h-[300px] overflow-y-auto p-1">
                {availableTimeSlots.map((slot, index) => (
                  <Button
                    key={index}
                    variant={selectedTimeSlot?.startTime === slot.startTime ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      onTimeSlotSelect(slot.startTime, slot.endTime);
                      setTimeSlotsOpen(false);
                    }}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}