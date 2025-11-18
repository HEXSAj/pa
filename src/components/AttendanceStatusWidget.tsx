// src/components/AttendanceStatusWidget.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  ClockIn, 
  ClockOut, 
  Timer, 
  User,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { attendanceValidationService } from '@/services/attendanceValidationService';
import { attendanceService } from '@/services/attendanceService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface AttendanceStatusWidgetProps {
  onAttendanceChange?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export const AttendanceStatusWidget: React.FC<AttendanceStatusWidgetProps> = ({
  onAttendanceChange,
  showActions = true,
  compact = false
}) => {
  const { user } = useAuth();
  const [attendanceStatus, setAttendanceStatus] = useState<{
    isClockedIn: boolean;
    totalHoursToday: number;
    currentSessionHours: number;
    sessionCount: number;
    lastClockIn?: Date;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClockOutLoading, setIsClockOutLoading] = useState(false);

  const loadAttendanceStatus = async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      const status = await attendanceValidationService.getCurrentAttendanceStatus(user.uid);
      setAttendanceStatus(status);
    } catch (error) {
      console.error('Error loading attendance status:', error);
      toast.error('Failed to load attendance status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceStatus();
  }, [user?.uid]);

  const handleClockOut = async () => {
    if (!user?.uid || !attendanceStatus?.isClockedIn) return;
    
    try {
      setIsClockOutLoading(true);
      
      // Get today's attendance to find the attendance ID
      const todayAttendance = await attendanceService.getTodayAttendance(user.uid);
      if (!todayAttendance?.id) {
        throw new Error('No attendance record found');
      }
      
      await attendanceService.clockOut(todayAttendance.id);
      toast.success('Clocked out successfully');
      
      // Refresh status
      await loadAttendanceStatus();
      onAttendanceChange?.();
      
    } catch (error) {
      console.error('Error clocking out:', error);
      toast.error('Failed to clock out. Please try again.');
    } finally {
      setIsClockOutLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadAttendanceStatus();
  };

  if (isLoading) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'} bg-white/90 backdrop-blur-sm border-0 shadow-sm`}>
        <CardContent className="p-0">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Loading attendance...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!attendanceStatus) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'} bg-red-50 border-red-200`}>
        <CardContent className="p-0">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">Unable to load attendance status</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  if (compact) {
    return (
      <Card className="p-3 bg-white/90 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {attendanceStatus.isClockedIn ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {attendanceStatus.isClockedIn ? 'Clocked In' : 'Not Clocked In'}
              </span>
            </div>
            {attendanceStatus.isClockedIn && (
              <Badge variant="secondary" className="text-xs">
                {formatHours(attendanceStatus.currentSessionHours)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-sm">
      <CardContent className="p-0">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Attendance Status</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-3">
            {attendanceStatus.isClockedIn ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="text-sm font-medium">
                {attendanceStatus.isClockedIn ? 'Currently Clocked In' : 'Not Clocked In'}
              </p>
              <p className="text-xs text-gray-500">{attendanceStatus.message}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Timer className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Today's Hours</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {formatHours(attendanceStatus.totalHoursToday)}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Sessions</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {attendanceStatus.sessionCount}
              </p>
            </div>
          </div>

          {/* Current Session */}
          {attendanceStatus.isClockedIn && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <ClockIn className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Current Session</span>
              </div>
              <p className="text-sm text-green-700">
                Duration: {formatHours(attendanceStatus.currentSessionHours)}
              </p>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex space-x-2">
              {attendanceStatus.isClockedIn ? (
                <Button
                  onClick={handleClockOut}
                  disabled={isClockOutLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  <ClockOut className="h-4 w-4 mr-2" />
                  {isClockOutLoading ? 'Clocking Out...' : 'Clock Out'}
                </Button>
              ) : (
                <Button
                  onClick={() => window.location.href = '/dashboard/attendance'}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <ClockIn className="h-4 w-4 mr-2" />
                  Go to Attendance
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

