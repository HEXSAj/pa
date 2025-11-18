import React from 'react';
import { format, subDays, startOfMonth } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRangePickerProps {
  dateRange: {
    start: string;
    end: string;
  };
  onChange: (range: { start: string; end: string }) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const presets = [
    { label: 'Today', getValue: () => new Date() },
    { label: 'Yesterday', getValue: () => subDays(new Date(), 1) },
    { label: 'Last 7 days', getValue: () => subDays(new Date(), 7) },
    { label: 'Last 30 days', getValue: () => subDays(new Date(), 30) },
    { label: 'This month', getValue: () => startOfMonth(new Date()) },
  ];

  const handlePresetClick = (preset: { getValue: () => Date }) => {
    const end = new Date();
    const start = preset.getValue();
    onChange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700">
          {format(new Date(dateRange.start), 'MMM dd, yyyy')} - {format(new Date(dateRange.end), 'MMM dd, yyyy')}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-10 mt-2 bg-white rounded-lg shadow-lg border p-4 w-80">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => onChange({ ...dateRange, start: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => onChange({ ...dateRange, end: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 mb-2">Quick Select</div>
            {presets.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetClick(preset)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};