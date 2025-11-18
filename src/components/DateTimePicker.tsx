import React, { useState } from 'react';
import { format, addDays, startOfDay, addMonths, subMonths, isToday, isSameMonth, isAfter, isSameDay, endOfMonth, startOfMonth, eachDayOfInterval, subDays } from 'date-fns';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const ModernDateTimePicker = ({ value, onChange }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = startOfDay(new Date());
  const hours = Array.from({ length: 12 }, (_, i) => i + 9);
  const minutes = ['00', '15', '30', '45'];

  const getDaysInMonth = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  };

  const handleDateClick = (date) => {
    if (isAfter(date, subDays(new Date(), 1))) {
      const currentTime = new Date(value);
      const newDate = new Date(date);
      newDate.setHours(currentTime.getHours(), currentTime.getMinutes());
      onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
      setShowDatePicker(false);
      setShowTimePicker(true);
    }
  };

  const handleTimeClick = (hour, minute) => {
    const date = new Date(value);
    date.setHours(hour, parseInt(minute));
    onChange(format(date, "yyyy-MM-dd'T'HH:mm"));
    setShowTimePicker(false);
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = startOfMonth(currentMonth);
  const emptyDays = firstDayOfMonth.getDay();

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setShowDatePicker(!showDatePicker);
            setShowTimePicker(false);
          }}
          className="flex-1 flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-gray-700">
            {format(new Date(value), 'MMM dd, yyyy')}
          </span>
        </button>
        
        <button
          type="button"
          onClick={() => {
            setShowTimePicker(!showTimePicker);
            setShowDatePicker(false);
          }}
          className="flex-1 flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Clock className="w-5 h-5 text-gray-500" />
          <span className="text-gray-700">
            {format(new Date(value), 'hh:mm a')}
          </span>
        </button>
      </div>

      {showDatePicker && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button
             type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button
             type="button" 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-xs font-medium text-gray-500 text-center p-2">
                {day}
              </div>
            ))}
            
            {Array.from({ length: emptyDays }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}
            
            {daysInMonth.map((date) => {
              const isSelected = isSameDay(date, new Date(value));
              const isDisabled = !isAfter(date, subDays(new Date(), 1));
              
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => !isDisabled && handleDateClick(date)}
                  disabled={isDisabled}
                  className={`
                    p-2 text-sm rounded-lg text-center
                    ${isSelected ? 'bg-blue-100 text-blue-700' : ''}
                    ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50'}
                    ${isToday(date) ? 'border border-blue-500' : ''}
                  `}
                >
                  {format(date, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showTimePicker && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="grid grid-cols-4 gap-2 p-4">
            {hours.map((hour) => (
              minutes.map((minute) => {
                const timeStr = `${hour}:${minute}`;
                const currentDate = new Date(value);
                const compareDate = new Date(value);
                compareDate.setHours(hour, parseInt(minute));
                
                return (
                  <button
                    key={timeStr}
                    onClick={() => handleTimeClick(hour, minute)}
                    className={`p-2 text-sm rounded-lg hover:bg-blue-50 focus:outline-none
                      ${format(compareDate, 'HH:mm') === format(currentDate, 'HH:mm')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700'
                      }`}
                  >
                    {format(compareDate, 'hh:mm a')}
                  </button>
                );
              })
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernDateTimePicker;