// src/components/NextVisitDateSection.tsx

'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface NextVisitDateSectionProps {
  nextVisitDate?: string;
  onNextVisitDateChange: (date: string | undefined) => void;
  disabled?: boolean;
}

export function NextVisitDateSection({ 
  nextVisitDate, 
  onNextVisitDateChange, 
  disabled = false 
}: NextVisitDateSectionProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(nextVisitDate || '');

  // Quick selection options
  const quickOptions = [
    { label: '1 day', days: 1 },
    { label: '2 days', days: 2 },
    { label: '3 days', days: 3 },
    { label: '4 days', days: 4 },
    { label: '5 days', days: 5 },
    { label: '10 days', days: 10 },
    { label: '1 week', days: 7 },
    { label: '2 weeks', days: 14 },
    { label: '3 weeks', days: 21 },
    { label: '1 month', days: 30 },
    { label: '2 months', days: 60 },
    { label: '3 months', days: 90 },
    { label: '4 months', days: 120 },
    { label: '6 months', days: 180 }
  ];

  const handleDateChange = (date: string) => {
    setTempDate(date);
  };

  const handleSaveDate = () => {
    if (!tempDate) {
      toast.error('Please select a date');
      return;
    }

    const selectedDate = new Date(tempDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error('Next visit date cannot be in the past');
      return;
    }

    onNextVisitDateChange(tempDate);
    setShowDatePicker(false);
    toast.success('Next visit date set successfully');
  };

  const handleRemoveDate = () => {
    onNextVisitDateChange(undefined);
    setTempDate('');
    toast.success('Next visit date removed');
  };

  const handleQuickSelect = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const dateString = date.toISOString().split('T')[0];
    onNextVisitDateChange(dateString);
    toast.success(`Next visit set for ${formatDate(dateString)}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Next Visit
        </h3>
        {!disabled && (
          <Button
            onClick={() => setShowDatePicker(true)}
            size="sm"
            variant={nextVisitDate ? "outline" : "default"}
            className="h-7 px-2 text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            {nextVisitDate ? 'Change' : 'Set'}
          </Button>
        )}
      </div>

      {/* Current Next Visit Date - Compact */}
      {nextVisitDate && (
        <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-green-600" />
            <span className="text-xs font-medium text-green-800">
              {formatDate(nextVisitDate)}
            </span>
          </div>
          
          {!disabled && (
            <Button
              onClick={handleRemoveDate}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Quick Selection Options */}
      {!nextVisitDate && !showDatePicker && !disabled && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600">Quick Select:</div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-1">
            {quickOptions.map((option) => (
              <Button
                key={option.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(option.days)}
                className="h-7 px-2 text-xs hover:bg-green-50 hover:border-green-300"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Date Picker - Compact */}
      {showDatePicker && (
        <div className="p-3 border border-green-200 rounded-lg bg-green-50">
          <div className="space-y-3">
            <div>
              <Label htmlFor="nextVisitDate" className="text-xs font-medium">Select Date:</Label>
              <Input
                id="nextVisitDate"
                type="date"
                value={tempDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={getMinDate()}
                className="h-7 text-xs mt-1"
              />
            </div>

            {tempDate && (
              <div className="p-2 bg-white border border-green-300 rounded text-xs text-green-800">
                <strong>Selected:</strong> {formatDate(tempDate)}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSaveDate} disabled={!tempDate} size="sm" className="h-7 px-3 text-xs">
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowDatePicker(false);
                  setTempDate(nextVisitDate || '');
                }}
                className="h-7 px-3 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
