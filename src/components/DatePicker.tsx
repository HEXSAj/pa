// DatePicker.jsx
import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

const DatePicker = ({ value, onChange, className = '' }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const [showYearSelect, setShowYearSelect] = useState(false);
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const days = eachDayOfInterval({
    start: startOfMonth(viewDate),
    end: endOfMonth(viewDate)
  });

  const handleYearSelect = (e, year) => {
    e.preventDefault();
    e.stopPropagation();
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
    setShowYearSelect(false);
  };

  const handleDateSelect = (e, date) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(format(date, 'yyyy-MM-dd'));
    setShowCalendar(false);
  };

  const monthNavigator = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    const newDate = new Date(viewDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setViewDate(newDate);
  };

  const toggleYearSelect = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowYearSelect(!showYearSelect);
  };

  const toggleCalendar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCalendar(!showCalendar);
  };

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <div className="relative">
        <input
          type="text"
          className={`w-full rounded-md border border-gray-300 px-3 py-2 pl-10 ${className}`}
          placeholder="Select Date..."
          value={value ? format(new Date(value), 'MMM dd, yyyy') : ''}
          readOnly
          onClick={toggleCalendar}
        />
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {showCalendar && (
        <div className="absolute z-50 mt-1 w-72 rounded-lg bg-white p-2 shadow-lg border border-gray-200">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => monthNavigator(e, 'prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              type="button"
              className="px-2 py-1 text-sm font-semibold hover:bg-gray-100 rounded"
              onClick={toggleYearSelect}
            >
              {format(viewDate, 'MMMM yyyy')}
            </button>

            <button
              type="button"
              onClick={(e) => monthNavigator(e, 'next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {showYearSelect ? (
            <div className="max-h-48 overflow-y-auto grid grid-cols-4 gap-1">
              {years.map(year => (
                <button
                  type="button"
                  key={year}
                  onClick={(e) => handleYearSelect(e, year)}
                  className="p-1 text-sm hover:bg-gray-100 rounded"
                >
                  {year}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 text-xs mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-center font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: days[0].getDay() }).map((_, index) => (
                  <div key={`empty-${index}`} />
                ))}
                
                {days.map((day) => {
                  const isSelected = value && isSameDay(new Date(value), day);
                  const isCurrentMonth = isSameMonth(day, viewDate);

                  return (
                    <button
                      type="button"
                      key={day.toISOString()}
                      onClick={(e) => handleDateSelect(e, day)}
                      className={`
                        p-1 text-sm rounded hover:bg-gray-100
                        ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                        ${!isSelected && isToday(day) ? 'bg-blue-50' : ''}
                        ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePicker;