import React, { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
}

export default function ModernDatePicker({ value, onChange, label }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const selectedDate = value ? new Date(value) : undefined;
  const containerRef = useRef<HTMLDivElement>(null);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left border rounded-md hover:bg-gray-50"
      >
        <CalendarIcon className="h-4 w-4 text-gray-500" />
        {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 p-4 bg-white border rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <div className="font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button
              type="button"
              onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}

            {days.map(day => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={day.toString()}
                  type="button"
                  onClick={() => {
                    onChange(format(day, 'yyyy-MM-dd'));
                    setIsOpen(false);
                  }}
                  className={`
                    p-2 text-sm rounded-full
                    ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                    ${!isCurrentMonth && 'text-gray-300'}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}