// import React from 'react';
// import { CustomerSelector } from './CustomerSelector';
// import { Customer } from '@/types/customer';
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Calendar as CalendarIcon, X } from "lucide-react";
// import { format } from "date-fns";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Calendar } from "@/components/ui/calendar";

// export type DateFilterType = 'all' | 'date' | 'month' | 'year' | 'range';

// interface SalesFilterProps {
//   dateFilter: DateFilterType;
//   setDateFilter: (filter: DateFilterType) => void;
//   selectedDate: Date | undefined;
//   setSelectedDate: (date: Date | undefined) => void;
//   selectedMonth: string | undefined;
//   setSelectedMonth: (month: string | undefined) => void;
//   selectedYear: string | undefined;
//   setSelectedYear: (year: string | undefined) => void;
//   dateRange: { from: Date | undefined; to: Date | undefined };
//   setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
//   selectedCustomer: Customer | undefined;
//   setSelectedCustomer: (customer: Customer | undefined) => void;
// }

// export function SalesFilter({
//   dateFilter,
//   setDateFilter,
//   selectedDate,
//   setSelectedDate,
//   selectedMonth,
//   setSelectedMonth,
//   selectedYear,
//   setSelectedYear,
//   dateRange,
//   setDateRange,
//   selectedCustomer,
//   setSelectedCustomer,
// }: SalesFilterProps) {
//   const months = [
//     "January", "February", "March", "April", "May", "June",
//     "July", "August", "September", "October", "November", "December"
//   ];

//   const years = Array.from({ length: 10 }, (_, i) => 
//     (new Date().getFullYear() - i).toString()
//   );

//   const handleClearFilters = () => {
//     setDateFilter('all');
//     setSelectedDate(undefined);
//     setSelectedMonth(undefined);
//     setSelectedYear(undefined);
//     setDateRange({ from: undefined, to: undefined });
//     setSelectedCustomer(undefined);
//   };

//   return (
//     <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
//       <div className="flex justify-between items-center">
//         <h3 className="font-medium">Filters</h3>
//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={handleClearFilters}
//           className="h-8"
//         >
//           <X className="h-4 w-4 mr-2" />
//           Clear Filters
//         </Button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {/* Date Filter Type */}
//         <div className="space-y-2">
//           <Label>Filter By</Label>
//           <Select
//             value={dateFilter}
//             onValueChange={(value: DateFilterType) => setDateFilter(value)}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder="Select filter type" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Time</SelectItem>
//               <SelectItem value="date">Specific Date</SelectItem>
//               <SelectItem value="month">Month</SelectItem>
//               <SelectItem value="year">Year</SelectItem>
//               <SelectItem value="range">Date Range</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Date Specific Controls */}
//         {dateFilter === 'date' && (
//           <div className="space-y-2">
//             <Label>Select Date</Label>
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className="w-full justify-start text-left font-normal"
//                 >
//                   <CalendarIcon className="mr-2 h-4 w-4" />
//                   {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0">
//                 <Calendar
//                   mode="single"
//                   selected={selectedDate}
//                   onSelect={setSelectedDate}
//                   initialFocus
//                 />
//               </PopoverContent>
//             </Popover>
//           </div>
//         )}

//         {/* Month Selection */}
//         {dateFilter === 'month' && (
//           <div className="space-y-2">
//             <Label>Select Month</Label>
//             <Select
//               value={selectedMonth}
//               onValueChange={setSelectedMonth}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select month" />
//               </SelectTrigger>
//               <SelectContent>
//                 {months.map((month, index) => (
//                   <SelectItem key={index} value={month}>
//                     {month}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         )}

//         {/* Year Selection */}
//         {dateFilter === 'year' && (
//           <div className="space-y-2">
//             <Label>Select Year</Label>
//             <Select
//               value={selectedYear}
//               onValueChange={setSelectedYear}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select year" />
//               </SelectTrigger>
//               <SelectContent>
//                 {years.map((year) => (
//                   <SelectItem key={year} value={year}>
//                     {year}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         )}

//         {/* Date Range */}
//         {dateFilter === 'range' && (
//           <div className="space-y-2">
//             <Label>Select Date Range</Label>
//             <div className="grid gap-2">
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     className="w-full justify-start text-left font-normal"
//                   >
//                     <CalendarIcon className="mr-2 h-4 w-4" />
//                     {dateRange.from ? (
//                       dateRange.to ? (
//                         <>
//                           {format(dateRange.from, "LLL dd, y")} -{" "}
//                           {format(dateRange.to, "LLL dd, y")}
//                         </>
//                       ) : (
//                         format(dateRange.from, "LLL dd, y")
//                       )
//                     ) : (
//                       "Pick a date range"
//                     )}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0" align="start">
//                   <Calendar
//                     initialFocus
//                     mode="range"
//                     defaultMonth={dateRange.from}
//                     selected={{
//                       from: dateRange.from,
//                       to: dateRange.to,
//                     }}
//                     onSelect={(range: { from?: Date; to?: Date } | undefined) => {
//                       setDateRange({
//                         from: range?.from,
//                         to: range?.to,
//                       });
//                     }}
//                     numberOfMonths={2}
//                   />
//                 </PopoverContent>
//               </Popover>
//             </div>
//           </div>
//         )}

//         {/* Customer Filter */}
//         <div className="space-y-2">
//           <CustomerSelector
//             selectedCustomer={selectedCustomer}
//             onSelectCustomer={setSelectedCustomer}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default SalesFilter;


// src/app/dashboard/viewSales/SalesFilter.tsx
import React from 'react';
import { CustomerSelector } from './CustomerSelector';
import { Customer } from '@/types/customer';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, X, User, Plane } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PatientType } from '@/types/sale'; // Make sure this type is imported

export type DateFilterType = 'all' | 'date' | 'month' | 'year' | 'range';

interface SalesFilterProps {
  dateFilter: DateFilterType;
  setDateFilter: (filter: DateFilterType) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedMonth: string | undefined;
  setSelectedMonth: (month: string | undefined) => void;
  selectedYear: string | undefined;
  setSelectedYear: (year: string | undefined) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  selectedCustomer: Customer | undefined;
  setSelectedCustomer: (customer: Customer | undefined) => void;
  // Add patient type filter
  selectedPatientType: PatientType | 'all' | undefined;
  setSelectedPatientType: (type: PatientType | 'all' | undefined) => void;
}

export function SalesFilter({
  dateFilter,
  setDateFilter,
  selectedDate,
  setSelectedDate,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  dateRange,
  setDateRange,
  selectedCustomer,
  setSelectedCustomer,
  selectedPatientType,
  setSelectedPatientType
}: SalesFilterProps) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 10 }, (_, i) => 
    (new Date().getFullYear() - i).toString()
  );

  const handleClearFilters = () => {
    setDateFilter('all');
    setSelectedDate(undefined);
    setSelectedMonth(undefined);
    setSelectedYear(undefined);
    setDateRange({ from: undefined, to: undefined });
    setSelectedCustomer(undefined);
    setSelectedPatientType('all'); // Reset patient type filter
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-8"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Date Filter Type */}
        <div className="space-y-2">
          <Label>Filter By</Label>
          <Select
            value={dateFilter}
            onValueChange={(value: DateFilterType) => setDateFilter(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="date">Specific Date</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              <SelectItem value="range">Date Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Specific Controls */}
        {dateFilter === 'date' && (
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Month Selection */}
        {dateFilter === 'month' && (
          <div className="space-y-2">
            <Label>Select Month</Label>
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Year Selection */}
        {dateFilter === 'year' && (
          <div className="space-y-2">
            <Label>Select Year</Label>
            <Select
              value={selectedYear}
              onValueChange={setSelectedYear}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range */}
        {dateFilter === 'range' && (
          <div className="space-y-2">
            <Label>Select Date Range</Label>
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range: { from?: Date; to?: Date } | undefined) => {
                      setDateRange({
                        from: range?.from,
                        to: range?.to,
                      });
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Patient Type Filter */}
        <div className="space-y-2">
          <Label>Patient Type</Label>
          <Select
            value={selectedPatientType || 'all'}
            onValueChange={(value) => setSelectedPatientType(value as PatientType | 'all')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select patient type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              <SelectItem value="local">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-600" />
                  Local Patients
                </div>
              </SelectItem>
              <SelectItem value="foreign">
                <div className="flex items-center">
                  <Plane className="h-4 w-4 mr-2 text-amber-600" />
                  Foreign Patients
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customer Filter */}
        <div className="space-y-2">
          <CustomerSelector
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
          />
        </div>
      </div>

      {/* Show selected filters as badges */}
      {(selectedPatientType && selectedPatientType !== 'all') && (
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge 
            className={selectedPatientType === 'local' 
              ? "bg-blue-100 text-blue-800 hover:bg-blue-200" 
              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
            }
            variant="secondary"
          >
            {selectedPatientType === 'local' ? (
              <><User className="h-3 w-3 mr-1" /> Local Patients</>
            ) : (
              <><Plane className="h-3 w-3 mr-1" /> Foreign Patients</>
            )}
            <button className="ml-1" onClick={() => setSelectedPatientType('all')}>×</button>
          </Badge>
        </div>
      )}
    </div>
  );
}

export default SalesFilter;