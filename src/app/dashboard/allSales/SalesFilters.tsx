import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar,X } from 'lucide-react';
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
import { CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface SalesFiltersProps {
  filterType: string;
  setFilterType: (type: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  saleType: string;
  setSaleType: (type: string) => void;
}

const SalesFilters = ({
  filterType,
  setFilterType,
  dateRange,
  setDateRange,
  saleType,
  setSaleType
}: SalesFiltersProps) => {
  const handleClearFilters = () => {
    setFilterType('all');
    setDateRange({ from: undefined, to: undefined });
    setSaleType('all');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Filters</CardTitle>
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
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Time Period Filter */}
          <div className="space-y-2">
            <Label>Time Period</Label>
            <Select
              value={filterType}
              onValueChange={(value) => {
                setFilterType(value);
                if (value !== 'custom') {
                  setDateRange({ from: undefined, to: undefined });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {filterType === 'custom' && (
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
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
                      "Select dates..."
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) => {
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
          )}

          {/* Sale Type Filter */}
          <div className="space-y-2">
            <Label>Sale Type</Label>
            <Select
              value={saleType}
              onValueChange={setSaleType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sale type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sales</SelectItem>
                <SelectItem value="inventory">Inventory Only</SelectItem>
                <SelectItem value="labTests">Laboratory Tests</SelectItem>
                <SelectItem value="doctorFees">Doctor Fees</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesFilters;