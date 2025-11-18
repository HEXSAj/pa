"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={className}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-2 relative items-center",
        caption_label: "text-sm font-semibold text-gray-800",
        nav: "space-x-1 flex items-center",
        nav_button: "h-8 w-8 bg-transparent p-0 hover:bg-gray-100 rounded-full transition-colors duration-200",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-gray-500 rounded-md w-10 font-medium text-[0.8rem] uppercase tracking-wider",
        row: "flex w-full mt-2",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        day: "h-10 w-10 p-0 font-normal rounded-full hover:bg-gray-100 transition-colors duration-200 aria-selected:opacity-100",
        day_range_end: "day-range-end",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full transition-colors duration-200",
        day_today: "bg-gray-100 text-gray-900 font-semibold",
        day_outside: "text-gray-400 opacity-50 hover:bg-transparent",
        day_disabled: "text-gray-400 opacity-50 hover:bg-transparent",
        day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => (
          <ChevronLeft className="h-4 w-4 text-gray-600 hover:text-gray-900 transition-colors duration-200" />
        ),
        IconRight: ({ ...props }) => (
          <ChevronRight className="h-4 w-4 text-gray-600 hover:text-gray-900 transition-colors duration-200" />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }