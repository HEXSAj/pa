// // src/components/ui/date-range-picker.tsx
// import * as React from "react";
// import { CalendarIcon } from "lucide-react";
// import { format } from "date-fns";
// import { DayPicker, DateRange } from "react-day-picker";
// import 'react-day-picker/dist/style.css';

// interface DatePickerWithRangeProps {
//   dateRange: DateRange;
//   onDateRangeChange: (range: DateRange | undefined) => void;
// }

// export function DatePickerWithRange({
//   dateRange,
//   onDateRangeChange,
// }: DatePickerWithRangeProps) {
//   const [isOpen, setIsOpen] = React.useState(false);

//   return (
//     <div className="relative">
//       <button
//         className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <CalendarIcon className="h-4 w-4" />
//         {dateRange?.from ? (
//           dateRange.to ? (
//             <>
//               {format(dateRange.from, "LLL dd, y")} -{" "}
//               {format(dateRange.to, "LLL dd, y")}
//             </>
//           ) : (
//             format(dateRange.from, "LLL dd, y")
//           )
//         ) : (
//           <span>Pick a date range</span>
//         )}
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg z-50">
//           <DayPicker
//             mode="range"
//             defaultMonth={dateRange?.from}
//             selected={dateRange}
//             onSelect={(range) => {
//               onDateRangeChange(range);
//               if (range?.from && range?.to) {
//                 setIsOpen(false);
//               }
//             }}
//             numberOfMonths={2}
//             className="p-3"
//           />
//         </div>
//       )}

//       {isOpen && (
//         <div 
//           className="fixed inset-0 z-40"
//           onClick={() => setIsOpen(false)}
//         />
//       )}
//     </div>
//   );
// }

// src/components/ui/date-range-picker.tsx
import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import 'react-day-picker/dist/style.css';

interface DatePickerWithRangeProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function DatePickerWithRange({
  dateRange,
  onDateRangeChange,
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  // Handle clicking outside of the date picker
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="h-4 w-4" />
        {dateRange?.from ? (
          dateRange.to ? (
            <>
              {format(dateRange.from, "MMM dd, yyyy")} -{" "}
              {format(dateRange.to, "MMM dd, yyyy")}
            </>
          ) : (
            format(dateRange.from, "MMM dd, yyyy")
          )
        ) : (
          <span>Pick a date range</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg z-50">
          <DayPicker
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
            className="p-3"
            styles={{
              day: { margin: '2px' }
            }}
          />
        </div>
      )}
    </div>
  );
}