

// src/app/dashboard/attendance/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Clock,
  UserCog,
  FileText,
  Calendar,
  ClipboardCheck,
  Users,
  CalendarCheck2,
  CalendarX2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  TimerOff,
  Timer,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash,
  ChevronDown,
  BarChart,
  FileBarChart,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Search,
  PlusCircle,
  X,
  Coffee,
  Download,
  Filter,
  TrendingUp,
  Activity,
  Camera
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { attendanceService } from '@/services/attendanceService';
import { staffService } from '@/services/staffService';
import { Attendance, AttendanceStatus, AttendanceSummary } from '@/types/attendance';
import { StaffUser } from '@/types/staff';
import { useToast } from '@/hooks/use-toast';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useAuth } from '@/context/AuthContext';
import { DatePicker } from '@/components/ui/date-picker';
import { addDays, format, isSameDay, subMonths } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from "next/navigation";
import withAuth from '@/components/withAuth';
import { Checkbox } from "@/components/ui/checkbox";
import { PhotoCaptureModal } from '@/components/PhotoCaptureModal';
import { imageUploadService } from '@/services/imageUploadService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Enhanced Mark Attendance Dialog Component
// const MarkAttendanceDialog = ({ 
//   isOpen, 
//   onClose, 
//   staffList, 
//   onMarkAttendance,
//   initialStaffId = "",
//   initialDate = new Date()
// }) => {

interface MarkAttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffUser[];
  onMarkAttendance: (staffId: string, date: Date, data: Partial<Attendance>) => Promise<void>;
  initialStaffId?: string;
  initialDate?: Date;
}

const MarkAttendanceDialog: React.FC<MarkAttendanceDialogProps> = ({ 
  isOpen, 
  onClose, 
  staffList, 
  onMarkAttendance,
  initialStaffId = "",
  initialDate = new Date()
}) => {
  const [staffId, setStaffId] = useState(initialStaffId);
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async () => {
    if (!staffId || !date) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      let timeInDate: Date | undefined;
      let timeOutDate: Date | undefined;
      
      if (timeIn) {
        timeInDate = new Date(date);
        const [hours, minutes] = timeIn.split(':').map(Number);
        timeInDate.setHours(hours, minutes, 0, 0);
      }
      
      if (timeOut) {
        timeOutDate = new Date(date);
        const [hours, minutes] = timeOut.split(':').map(Number);
        timeOutDate.setHours(hours, minutes, 0, 0);
      }
      
      await onMarkAttendance(staffId, date, {
        timeIn: timeInDate,
        timeOut: timeOutDate,
        status,
        notes: notes.trim() || undefined
      });
      
      onClose();
    } catch (error) {
      console.error('Error marking attendance:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-primary" />
            Mark Attendance
          </DialogTitle>
          <DialogDescription className="text-base">
            Record attendance for a staff member on a specific date.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff" className="text-sm font-medium">Staff Member</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.uid} value={staff.uid}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        {staff.displayName || staff.email}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">Date</Label>
              <DatePicker date={date} setDate={setDate} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeIn" className="text-sm font-medium">Time In</Label>
              <Input
                id="timeIn"
                type="time"
                value={timeIn}
                onChange={(e) => setTimeIn(e.target.value)}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeOut" className="text-sm font-medium">Time Out</Label>
              <Input
                id="timeOut"
                type="time"
                value={timeOut}
                onChange={(e) => setTimeOut(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as AttendanceStatus)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Present
                  </div>
                </SelectItem>
                <SelectItem value="absent">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    Absent
                  </div>
                </SelectItem>
                <SelectItem value="leave">
                  <div className="flex items-center gap-2">
                    <CalendarX2 className="h-4 w-4 text-blue-600" />
                    Leave
                  </div>
                </SelectItem>
                <SelectItem value="holiday">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    Holiday
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or comments (optional)"
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isProcessing} className="px-6">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!staffId || !date || isProcessing} className="px-6">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CalendarCheck2 className="mr-2 h-4 w-4" />
                Mark Attendance
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Enhanced Clock Action Component
interface ClockActionProps {
  staffId: string;
  onComplete?: () => void;
}

const ClockAction: React.FC<ClockActionProps> = ({ staffId, onComplete }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [pendingAction, setPendingAction] = useState<'clockIn' | 'clockOut' | null>(null);
  
  const fetchTodayAttendance = async () => {
    try {
      setIsLoading(true);
      const today = await attendanceService.getTodayAttendance(staffId);
      setAttendance(today);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch today's attendance",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTodayAttendance();
  }, [staffId]);

  const handleClockIn = () => {
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive"
      });
      return;
    }
    
    if (!staffId || staffId.trim() === '') {
      toast({
        title: "Error",
        description: "Please select a staff member first",
        variant: "destructive"
      });
      return;
    }
    
    // Open photo capture modal first
    setPendingAction('clockIn');
    setShowPhotoModal(true);
  };

  const processClockIn = async (photoFile: File | null) => {
    try {
      setIsLoading(true);
      let photoInUrl: string | undefined;

      // Upload photo if provided
      // Generate timestamp once to ensure session ID matches
      const sessionTimestamp = Date.now();
      
      if (photoFile) {
        try {
          setIsUploadingPhoto(true);
          const sessionId = `session_${staffId}_${sessionTimestamp}`;
          photoInUrl = await imageUploadService.uploadAttendancePhoto(
            photoFile,
            staffId,
            sessionId,
            'clockIn'
          );
          setIsUploadingPhoto(false);
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          setIsUploadingPhoto(false);
          toast({
            title: "Warning",
            description: "Photo upload failed, but proceeding with clock in",
            variant: "default"
          });
        }
      }

      // Clock in with photo URL
      // Note: The service will generate its own session ID, but the photo is already uploaded
      // The photo URL will be associated with the session when saved
      await attendanceService.clockIn(staffId, notes.trim() || undefined, photoInUrl);
      toast({
        title: "Success",
        description: "Clocked in successfully",
        variant: "success"
      });
      await fetchTodayAttendance();
      onComplete && onComplete();
      setNotes('');
      setShowNotes(false);
    } catch (error: any) {
      console.error('Error clocking in:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to clock in",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsUploadingPhoto(false);
    }
  };

  const handleClockOut = () => {
    if (!attendance || !attendance.id) {
      toast({
        title: "Error",
        description: "No active attendance record found",
        variant: "destructive"
      });
      return;
    }
    
    // Open photo capture modal first
    setPendingAction('clockOut');
    setShowPhotoModal(true);
  };

  const processClockOut = async (photoFile: File | null) => {
    if (!attendance || !attendance.id) {
      return;
    }
    
    try {
      setIsLoading(true);
      let photoOutUrl: string | undefined;

      // Upload photo if provided
      if (photoFile) {
        try {
          setIsUploadingPhoto(true);
          // Get the open session to use its ID
          const openSession = attendance.clockSessions.find(session => 
            session.timeIn && !session.timeOut
          );
          const sessionId = openSession?.id || `session_${staffId}_${Date.now()}`;
          
          photoOutUrl = await imageUploadService.uploadAttendancePhoto(
            photoFile,
            staffId,
            sessionId,
            'clockOut'
          );
          setIsUploadingPhoto(false);
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          setIsUploadingPhoto(false);
          toast({
            title: "Warning",
            description: "Photo upload failed, but proceeding with clock out",
            variant: "default"
          });
        }
      }

      // Clock out with photo URL
      await attendanceService.clockOut(attendance.id, notes.trim() || undefined, photoOutUrl);
      toast({
        title: "Success",
        description: "Clocked out successfully",
        variant: "success"
      });
      await fetchTodayAttendance();
      onComplete && onComplete();
      setNotes('');
      setShowNotes(false);
    } catch (error: any) {
      console.error('Error clocking out:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to clock out",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoCapture = (photoFile: File) => {
    setShowPhotoModal(false);
    if (pendingAction === 'clockIn') {
      processClockIn(photoFile);
    } else if (pendingAction === 'clockOut') {
      processClockOut(photoFile);
    }
    setPendingAction(null);
  };

  const handlePhotoModalClose = () => {
    setShowPhotoModal(false);
    setPendingAction(null);
  };

  return (
    <>
      <PhotoCaptureModal
        isOpen={showPhotoModal}
        onClose={handlePhotoModalClose}
        onCapture={handlePhotoCapture}
        title={pendingAction === 'clockIn' ? 'Capture Clock-In Photo' : 'Capture Clock-Out Photo'}
        description={pendingAction === 'clockIn' 
          ? 'Please capture your photo for clock-in attendance verification.'
          : 'Please capture your photo for clock-out attendance verification.'
        }
      />
      <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading attendance...</p>
          </div>
        </div>
      ) : attendance?.clockSessions && attendance.clockSessions.some(session => session.timeIn && !session.timeOut) ? (
        <div className="space-y-4">
          <div className="relative p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <p className="text-sm font-medium text-blue-800">Currently clocked in</p>
                </div>
                <p className="text-3xl font-bold text-blue-900">
                  {attendance.clockSessions.find(session => session.timeIn && !session.timeOut)?.timeIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm text-blue-700">
                  {format(attendance.clockSessions.find(session => session.timeIn && !session.timeOut)?.timeIn || new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
          
          {showNotes && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
              <Label className="text-sm font-medium">Clock Out Notes</Label>
              <Textarea
                placeholder="Add notes for clock out (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] bg-white"
              />
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              onClick={() => setShowNotes(!showNotes)}
              variant="outline"
              className="flex-1 h-11"
            >
              {showNotes ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Notes
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Add Notes
                </>
              )}
            </Button>
            <Button 
              onClick={handleClockOut} 
              className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <>
                  <TimerOff className="h-4 w-4 mr-2" />
                  Clock Out
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {attendance?.clockSessions && attendance.clockSessions.length > 0 && attendance.clockSessions.every(session => session.timeOut) ? (
            <div className="relative p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <p className="text-sm font-medium text-green-800">Attendance completed</p>
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs text-green-600 font-medium">Clock Sessions</div>
                    <div className="space-y-2">
                      {attendance.clockSessions.map((session, index) => (
                        <div key={index} className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                          <div className="flex gap-4 flex-1">
                            <div>
                              <p className="text-xs text-green-600 font-medium">In</p>
                              <p className="text-sm font-bold text-green-900">
                                {session.timeIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {session.photoInUrl && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button className="mt-1">
                                      <img
                                        src={session.photoInUrl}
                                        alt="Clock-in photo"
                                        className="h-8 w-8 rounded object-cover border border-green-400 hover:border-green-600 transition-colors"
                                      />
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Clock-In Photo</DialogTitle>
                                      <DialogDescription>
                                        {format(session.timeIn, 'EEEE, MMMM d, yyyy h:mm a')}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex justify-center">
                                      <img
                                        src={session.photoInUrl}
                                        alt="Clock-in photo"
                                        className="max-w-full max-h-[600px] rounded-lg"
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-green-600 font-medium">Out</p>
                              <p className="text-sm font-bold text-green-900">
                                {session.timeOut?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '--'}
                              </p>
                              {session.photoOutUrl && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button className="mt-1">
                                      <img
                                        src={session.photoOutUrl}
                                        alt="Clock-out photo"
                                        className="h-8 w-8 rounded object-cover border border-orange-400 hover:border-orange-600 transition-colors"
                                      />
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Clock-Out Photo</DialogTitle>
                                      <DialogDescription>
                                        {session.timeOut ? format(session.timeOut, 'EEEE, MMMM d, yyyy h:mm a') : 'N/A'}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex justify-center">
                                      <img
                                        src={session.photoOutUrl}
                                        alt="Clock-out photo"
                                        className="max-w-full max-h-[600px] rounded-lg"
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-green-600 font-medium">Hours</p>
                              <p className="text-sm font-bold text-green-900">
                                {session.hoursWorked.toFixed(1)}h
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {attendance.totalHoursWorked.toFixed(1)} hours
                    </Badge>
                    {attendance.overtime > 0 && (
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {attendance.overtime.toFixed(1)} overtime
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative p-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200/50 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-800">Ready to clock in</p>
                  <p className="text-lg text-gray-600">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-500">
                    Start your work day by clocking in
                  </p>
                </div>
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            </div>
          )}
          
          {showNotes && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
              <Label className="text-sm font-medium">Clock In Notes</Label>
              <Textarea
                placeholder="Add notes for clock in (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] bg-white"
              />
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              onClick={() => setShowNotes(!showNotes)}
              variant="outline"
              className="flex-1 h-11"
              disabled={!!(attendance?.timeIn && attendance.timeOut)}
            >
              {showNotes ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Notes
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Add Notes
                </>
              )}
            </Button>
            <Button 
              onClick={handleClockIn} 
              className="flex-1 h-11 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              disabled={isLoading || !!(attendance?.timeIn && attendance.timeOut)}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <>
                  <Timer className="h-4 w-4 mr-2" />
                  Clock In
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      </div>
      {(isLoading || isUploadingPhoto) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {isUploadingPhoto ? 'Uploading photo...' : 'Processing...'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};


interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
}

const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({ status }) => {
  const statusMap = {
    present: { 
      label: 'Present', 
      className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200', 
      icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> 
    },
    absent: { 
      label: 'Absent', 
      className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200', 
      icon: <X className="h-3.5 w-3.5 mr-1.5" /> 
    },
    leave: { 
      label: 'Leave', 
      className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200', 
      icon: <CalendarX2 className="h-3.5 w-3.5 mr-1.5" /> 
    },
    holiday: { 
      label: 'Holiday', 
      className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200', 
      icon: <Calendar className="h-3.5 w-3.5 mr-1.5" /> 
    }
  } as const;
  
  const config = statusMap[status] || statusMap.absent;
  
  return (
    <Badge className={`${config.className} flex items-center px-3 py-1 font-medium transition-colors`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  color?: "primary" | "green" | "yellow" | "red" | "purple";
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, color = "primary" }) => {
  const colorClasses = {
    primary: "from-blue-500 to-indigo-500",
    green: "from-green-500 to-emerald-500",
    yellow: "from-yellow-500 to-orange-500",
    red: "from-red-500 to-pink-500",
    purple: "from-purple-500 to-violet-500"
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5`}></div>
      <CardContent className="p-6 relative">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend && (
                <span className="text-xs text-green-600 font-medium">
                  +{trend}%
                </span>
              )}
            </div>
          </div>
          <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-sm`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Attendance Page
function AttendancePage() {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const router = useRouter();
  
  // State for authentication check
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // States for UI
  const [activeTab, setActiveTab] = useState('clock-in');
  const [isLoading, setIsLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  
  // State for attendance mark dialog
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  
  // States for date filters
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 1),
    to: new Date()
  });
  
  // State for attendance data
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [allStaffSummaries, setAllStaffSummaries] = useState<AttendanceSummary[]>([]);
  
  // Sorting state for reports
  const [sortColumn, setSortColumn] = useState('staffName');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Search and filter state for records
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Search and filter state for reports
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [reportSortColumn, setReportSortColumn] = useState('staffName');
  const [showReportFilters, setShowReportFilters] = useState(false);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState<Attendance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check authorization on page load
  useEffect(() => {
    if (user) {
      console.log('👤 User authenticated:', user.email, 'UID:', user.uid);
      setIsAuthorized(true);
      setSelectedStaffId(user.uid);
      console.log('🎯 Set selectedStaffId to user UID:', user.uid);
    } else if (user === null) {
      // User is explicitly null (not loading)
      console.log('❌ No user authenticated, redirecting to login');
      router.push('/');
    }
    // If user is undefined, we're still loading, so don't do anything
  }, [user, router]);
  
  // Load staff list
  useEffect(() => {
    const loadStaffList = async () => {
      try {
        setIsLoading(true);
        const staffMembers = await staffService.getAllStaff();
        console.log('👥 Loaded staff members:', staffMembers.length);
        console.log('📋 Staff list:', staffMembers.map(s => ({ uid: s.uid, email: s.email, displayName: s.displayName })));
        setStaffList(staffMembers);
      } catch (error) {
        console.error('Error loading staff list:', error);
        toast({
          title: "Error",
          description: "Failed to load staff list",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthorized) {
      loadStaffList();
    }
  }, [isAuthorized]);
  
  // Filter attendance records based on search and status
  const filteredAttendanceRecords = attendanceRecords.filter(record => {
    const matchesSearch = searchTerm === '' || 
      format(record.date, 'EEEE, MMM d, yyyy').toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter staff summaries based on search
  const filteredStaffSummaries = allStaffSummaries.filter(summary => {
    const matchesSearch = reportSearchTerm === '' || 
      summary.staffName.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
      summary.staffEmail.toLowerCase().includes(reportSearchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Get selected staff information
  const selectedStaff = staffList.find(staff => staff.uid === selectedStaffId);

  // Enhanced Excel export function
  const handleExportToExcel = () => {
    try {
      // Check if there's data to export
      if (!filteredStaffSummaries || filteredStaffSummaries.length === 0) {
        toast({
          title: "No Data to Export",
          description: "No attendance data available for the selected date range. Please ensure you have attendance records and are on the 'Attendance Report' tab.",
          variant: "destructive"
        });
        return;
      }

      // Create CSV content with enhanced headers
      const headers = [
        'Staff Name',
        'Email',
        'Present Days',
        'Absent Days',
        'Leave Days',
        'Holiday Days',
        'Total Days',
        'Total Hours Worked',
        'Total Overtime Hours',
        'Average Hours Per Day',
        'Attendance Rate (%)',
        'Date Range'
      ];

      const csvContent = [
        headers.join(','),
        ...filteredStaffSummaries.map(summary => {
          const totalWorkDays = summary.totalDays - summary.holidayDays;
          const presentDays = summary.presentDays;
          const attendanceRate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
          
          return [
            `"${summary.staffName || 'N/A'}"`,
            `"${summary.staffEmail || 'N/A'}"`,
            summary.presentDays || 0,
            summary.absentDays || 0,
            summary.leaveDays || 0,
            summary.holidayDays || 0,
            summary.totalDays || 0,
            (summary.totalHoursWorked || 0).toFixed(2),
            (summary.totalOvertimeHours || 0).toFixed(2),
            (summary.averageHoursPerDay || 0).toFixed(2),
            attendanceRate.toFixed(2),
            `"${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}"`
          ].join(',');
        })
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance-summary-report-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the URL object

      toast({
        title: "Export Successful",
        description: `Attendance summary report exported successfully with ${filteredStaffSummaries.length} staff members`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance report. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Export detailed attendance records
  const handleExportDetailedRecords = async () => {
    try {
      if (!attendanceRecords || attendanceRecords.length === 0) {
        toast({
          title: "No Data to Export",
          description: "No detailed attendance records available. Please select a staff member and ensure you have attendance records.",
          variant: "destructive"
        });
        return;
      }

      // Create CSV content for detailed records
      const headers = [
        'Staff Name',
        'Staff Email',
        'Date',
        'Time In',
        'Time Out',
        'Status',
        'Hours Worked',
        'Overtime Hours',
        'Overtime Status',
        'Notes',
        'Date Range'
      ];

      const csvContent = [
        headers.join(','),
        ...attendanceRecords.map(record => {
          // Get staff name and email with better fallbacks
          const staffName = record.staffUser?.displayName || 
                           record.staffUser?.email || 
                           (selectedStaff && (selectedStaff.displayName || selectedStaff.email)) ||
                           'Unknown Staff';
          const staffEmail = record.staffUser?.email || 
                            (selectedStaff && selectedStaff.email) ||
                            'N/A';
          
          // Get time in from first session
          const firstSession = record.clockSessions && record.clockSessions.length > 0 
            ? record.clockSessions[0] 
            : null;
          const timeIn = firstSession?.timeIn;
          
          // Get time out from last completed session or check for open session
          let timeOut: Date | undefined;
          let hasOpenSession = false;
          if (record.clockSessions && record.clockSessions.length > 0) {
            const openSession = record.clockSessions.find(s => s.timeIn && !s.timeOut);
            if (openSession) {
              hasOpenSession = true;
            } else {
              const completedSessions = record.clockSessions.filter(s => s.timeOut);
              if (completedSessions.length > 0) {
                const lastSession = completedSessions[completedSessions.length - 1];
                timeOut = lastSession.timeOut;
              }
            }
          }
          
          // Handle time out display - show "Still Clocked In" if no time out but has time in
          let timeOutDisplay = 'N/A';
          if (timeOut) {
            timeOutDisplay = `"${format(timeOut, 'HH:mm:ss')}"`;
          } else if (hasOpenSession) {
            timeOutDisplay = '"Still Clocked In"';
          }
          
          return [
            `"${staffName}"`,
            `"${staffEmail}"`,
            `"${format(record.date, 'MMM dd, yyyy')}"`,
            timeIn ? `"${format(timeIn, 'HH:mm:ss')}"` : 'N/A',
            timeOutDisplay,
            `"${record.status}"`,
            (record.hoursWorked || 0).toFixed(2),
            (record.overtime || 0).toFixed(2),
            `"${record.overtimeStatus || 'none'}"`,
            record.notes ? `"${record.notes.replace(/"/g, '""')}"` : 'N/A',
            `"${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}"`
          ].join(',');
        })
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance-detailed-records-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the URL object

      toast({
        title: "Export Successful",
        description: `Detailed attendance records exported successfully with ${attendanceRecords.length} records`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error exporting detailed records:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export detailed attendance records. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Load attendance data when tab, selected staff, or date range changes
  useEffect(() => {
    const loadAttendanceData = async () => {
      if (!selectedStaffId || !dateRange.from || !dateRange.to) return;
      
      try {
        setIsLoading(true);
        
        if (activeTab === 'attendance-records' || activeTab === 'clock-in') {
          const records = await attendanceService.getAttendanceByDateRange(
            selectedStaffId,
            dateRange.from,
            dateRange.to
          );
          setAttendanceRecords(records);
          
          const summary = await attendanceService.getAttendanceSummary(
            selectedStaffId,
            dateRange.from,
            dateRange.to
          );
          setAttendanceSummary(summary);
        } else if (activeTab === 'attendance-report') {
          const summaries = await attendanceService.getAllStaffAttendanceSummary(
            dateRange.from,
            dateRange.to
          );
          setAllStaffSummaries(summaries);
        }
      } catch (error) {
        console.error('Error loading attendance data:', error);
        toast({
          title: "Error",
          description: "Failed to load attendance data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthorized) {
      loadAttendanceData();
    }
  }, [activeTab, selectedStaffId, dateRange.from, dateRange.to, isAuthorized]);
  
  // Handle delete attendance
  const handleDeleteAttendance = async () => {
    if (!attendanceToDelete || !attendanceToDelete.id) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await attendanceService.deleteAttendance(attendanceToDelete.id);
      
      toast({
        title: "Success",
        description: "Attendance record and associated photos deleted successfully",
        variant: "success"
      });
      
      // Refresh attendance data
      const loadAttendanceData = async () => {
        try {
          setIsLoading(true);
          const records = await attendanceService.getAttendanceByDateRange(
            selectedStaffId,
            dateRange.from,
            dateRange.to
          );
          setAttendanceRecords(records);
          
          const summary = await attendanceService.getAttendanceSummary(
            selectedStaffId,
            dateRange.from,
            dateRange.to
          );
          setAttendanceSummary(summary);
        } catch (error) {
          console.error('Error loading attendance data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      await loadAttendanceData();
      
      // Close dialog
      setDeleteDialogOpen(false);
      setAttendanceToDelete(null);
    } catch (error: any) {
      console.error('Error deleting attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete attendance record",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle mark attendance
  const handleMarkAttendance = async (staffId, date, data) => {
    try {
      await attendanceService.markAttendance(staffId, date, data);
      toast({
        title: "Success",
        description: "Attendance marked successfully",
        variant: "success"
      });
      
      if (activeTab === 'attendance-records' || activeTab === 'clock-in') {
        const records = await attendanceService.getAttendanceByDateRange(
          selectedStaffId,
          dateRange.from,
          dateRange.to
        );
        setAttendanceRecords(records);
        
        const summary = await attendanceService.getAttendanceSummary(
          selectedStaffId,
          dateRange.from,
          dateRange.to
        );
        setAttendanceSummary(summary);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  // Handle sorting for reports
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Get sorted staff summaries
  const getSortedStaffSummaries = () => {
    return [...allStaffSummaries].sort((a, b) => {
      let valueA, valueB;
      
      switch (sortColumn) {
        case 'staffName':
          valueA = a.staffName.toLowerCase();
          valueB = b.staffName.toLowerCase();
          break;
        case 'presentDays':
          valueA = a.presentDays;
          valueB = b.presentDays;
          break;
       case 'absentDays':
         valueA = a.absentDays;
         valueB = b.absentDays;
         break;
       case 'totalHoursWorked':
         valueA = a.totalHoursWorked;
         valueB = b.totalHoursWorked;
         break;
       case 'totalOvertimeHours':
         valueA = a.totalOvertimeHours;
         valueB = b.totalOvertimeHours;
         break;
       default:
         valueA = a.staffName.toLowerCase();
         valueB = b.staffName.toLowerCase();
     }
     
     if (sortDirection === 'asc') {
       return valueA > valueB ? 1 : -1;
     } else {
       return valueA < valueB ? 1 : -1;
     }
   });
 };
 
 if (!isAuthorized) {
   return (
     <div className="flex justify-center items-center h-screen">
       <div className="flex flex-col items-center gap-4">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="text-lg font-medium">Loading attendance system...</p>
       </div>
     </div>
   );
 }
 
 return (
   <DashboardLayout>
     <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-gray-100">
       {/* Enhanced Header */}
       <div className="p-6 pb-0">
         <div className="flex items-center justify-between">
           <div className="space-y-1">
             <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
               Staff Attendance
             </h1>
             <p className="text-lg text-muted-foreground">Manage staff attendance and view comprehensive reports</p>
           </div>
           <div className="hidden lg:block">
             <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm">
               <Activity className="h-4 w-4 text-green-500" />
               <span className="text-sm font-medium">{staffList.length} Active Staff</span>
             </div>
           </div>
         </div>
       </div>
       
       <div className="p-6 flex-1 overflow-hidden">
         <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
           {/* Enhanced Tab Navigation */}
           <div className="border-b bg-white rounded-t-lg shadow-sm">
             <div className="flex items-center justify-between p-4">
               <TabsList className="grid w-full max-w-lg grid-cols-3 h-12 bg-gray-100">
                 <TabsTrigger value="clock-in" className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                   <Clock className="h-4 w-4" />
                   <span className="hidden sm:inline">Clock In/Out</span>
                   <span className="sm:hidden">Clock</span>
                 </TabsTrigger>
                 <TabsTrigger value="attendance-records" className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                   <ClipboardCheck className="h-4 w-4" />
                   <span className="hidden sm:inline">Records</span>
                   <span className="sm:hidden">Records</span>
                 </TabsTrigger>
                 <TabsTrigger value="attendance-report" className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                   <BarChart className="h-4 w-4" />
                   <span className="hidden sm:inline">Reports</span>
                   <span className="sm:hidden">Reports</span>
                 </TabsTrigger>
               </TabsList>
               
               {/* Enhanced Controls */}
               <div className="hidden lg:flex items-center gap-3">
                 {activeTab !== 'clock-in' && (
                   <div className="flex items-center gap-2">
                     <Calendar className="h-4 w-4 text-muted-foreground" />
                     <DatePickerWithRange
                       dateRange={dateRange}
                       onDateRangeChange={(range) => {
                         if (range?.from && range?.to) {
                           setDateRange({ from: range.from, to: range.to });
                         }
                       }}
                     />
                   </div>
                 )}
                 
                 {(activeTab === 'attendance-records' || activeTab === 'clock-in') && (
                   <div className="flex items-center gap-2">
                     <Users className="h-4 w-4 text-muted-foreground" />
                     <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                       <SelectTrigger className="w-[220px] h-10">
                         <SelectValue placeholder="Select staff member" />
                       </SelectTrigger>
                       <SelectContent>
                         {staffList.map((staff) => (
                           <SelectItem key={staff.uid} value={staff.uid}>
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-green-500"></div>
                               {staff.displayName || staff.email}
                             </div>
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 )}
                 
                 {userRole === 'admin' && (
                   <Button 
                     onClick={() => setShowMarkDialog(true)}
                     className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-sm"
                   >
                     <PlusCircle className="h-4 w-4 mr-2" />
                     Mark Attendance
                   </Button>
                 )}
               </div>
             </div>
             
             {/* Mobile Controls */}
             <div className="lg:hidden border-t bg-gray-50 p-4">
               <div className="flex flex-col gap-3">
                 {activeTab !== 'clock-in' && (
                   <div className="flex items-center gap-2">
                     <Calendar className="h-4 w-4 text-muted-foreground" />
                     <DatePickerWithRange
                       dateRange={dateRange}
                       onDateRangeChange={(range) => {
                         if (range?.from && range?.to) {
                           setDateRange({ from: range.from, to: range.to });
                         }
                       }}
                     />
                   </div>
                 )}
                 
                 {(activeTab === 'attendance-records' || activeTab === 'clock-in') && (
                   <div className="flex items-center gap-2">
                     <Users className="h-4 w-4 text-muted-foreground" />
                     <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                       <SelectTrigger className="flex-1">
                         <SelectValue placeholder="Select staff member" />
                       </SelectTrigger>
                       <SelectContent>
                         {staffList.map((staff) => (
                           <SelectItem key={staff.uid} value={staff.uid}>
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-green-500"></div>
                               {staff.displayName || staff.email}
                             </div>
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 )}
                 
                 {userRole === 'admin' && (
                   <Button 
                     onClick={() => setShowMarkDialog(true)} 
                     className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                   >
                     <PlusCircle className="h-4 w-4 mr-2" />
                     Mark Attendance
                   </Button>
                 )}
               </div>
             </div>
           </div>
           
           {/* Tab Content */}
           <div className="flex-1 overflow-auto bg-white rounded-b-lg shadow-sm">
           


            <TabsContent value="clock-in" className="h-full m-0">
              <div className="h-full flex flex-col">
                {/* Compact Fixed Header Section - Always Visible */}
                <div className="flex-shrink-0 bg-white border-b sticky top-0 z-10 shadow-sm">
                  <div className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Attendance Clock</h2>
                        <p className="text-sm text-gray-600">Record your daily attendance</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Scrollable Content Section */}
                <div className="flex-1 overflow-auto p-6">
                  <div className="flex items-start justify-center min-h-full">
                    <div className="w-full max-w-2xl">
                      <Card className="border-0 shadow-lg">
                        <CardContent className="p-8">
                          {selectedStaffId ? (
                            <ClockAction
                              staffId={selectedStaffId}
                              onComplete={() => {
                                const loadAttendanceRecords = async () => {
                                  try {
                                    const records = await attendanceService.getAttendanceByDateRange(
                                      selectedStaffId,
                                      dateRange.from,
                                      dateRange.to
                                    );
                                    setAttendanceRecords(records);
                                    
                                    const summary = await attendanceService.getAttendanceSummary(
                                      selectedStaffId,
                                      dateRange.from,
                                      dateRange.to
                                    );
                                    setAttendanceSummary(summary);
                                  } catch (error) {
                                    console.error('Error refreshing attendance records:', error);
                                  }
                                };
                                
                                loadAttendanceRecords();
                              }}
                            />
                          ) : (
                            <div className="text-center py-12">
                              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                              <p className="text-xl font-medium text-muted-foreground mb-2">Please select a staff member</p>
                              <p className="text-base text-muted-foreground">Choose from the dropdown above to continue</p>
                            </div>
                          )}
                        </CardContent>
                        
                        {/* Enhanced Recent Attendance Footer */}
                        <CardFooter className="flex-col items-start border-t bg-gray-50 rounded-b-lg p-6">
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-base">Recent Attendance</h3>
                              <Badge variant="outline" className="text-sm">
                                Last 5 days
                              </Badge>
                            </div>
                            {isLoading ? (
                              <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              </div>
                            ) : attendanceRecords.length > 0 ? (
                              <div className="space-y-3 max-h-60 overflow-y-auto">
                                {attendanceRecords.slice(0, 5).map((record) => (
                                  <div key={record.id} className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-3">
                                      <AttendanceStatusBadge status={record.status} />
                                      <div>
                                        <span className="text-sm font-medium text-gray-900">
                                          {format(record.date, 'EEEE, MMM d')}
                                        </span>
                                        {record.hoursWorked > 0 && (
                                          <p className="text-xs text-gray-500">
                                            {record.hoursWorked.toFixed(1)} hours worked
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                      {(() => {
                                        const firstSession = record.clockSessions && record.clockSessions.length > 0 
                                          ? record.clockSessions[0] 
                                          : null;
                                        const timeIn = firstSession?.timeIn;
                                        
                                        // Check for open session or get last time out
                                        let timeOut: Date | undefined;
                                        let hasOpenSession = false;
                                        
                                        if (record.clockSessions && record.clockSessions.length > 0) {
                                          const openSession = record.clockSessions.find(s => s.timeIn && !s.timeOut);
                                          if (openSession) {
                                            hasOpenSession = true;
                                          } else {
                                            const completedSessions = record.clockSessions.filter(s => s.timeOut);
                                            if (completedSessions.length > 0) {
                                              const lastSession = completedSessions[completedSessions.length - 1];
                                              timeOut = lastSession.timeOut;
                                            }
                                          }
                                        }
                                        
                                        return (
                                          <>
                                            {timeIn && (
                                              <p className="text-sm font-medium text-green-600">
                                                In: {format(timeIn, 'h:mm a')}
                                              </p>
                                            )}
                                            {timeOut && (
                                              <p className="text-sm font-medium text-orange-600">
                                                Out: {format(timeOut, 'h:mm a')}
                                              </p>
                                            )}
                                            {hasOpenSession && (
                                              <p className="text-xs text-blue-600 font-medium">
                                                Currently clocked in
                                              </p>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <CalendarX2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-base text-muted-foreground mb-1">No recent attendance records</p>
                                <p className="text-sm text-gray-500">Start by clocking in to see your records here</p>
                              </div>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
             
             {/* Attendance Records Tab */}
             <TabsContent value="attendance-records" className="h-full m-0">
               <div className="h-full flex flex-col p-6 space-y-6">
                

                  {attendanceSummary && (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                      <StatsCard
                        title="Present Days"
                        value={attendanceSummary.presentDays}
                        icon={CalendarCheck2}
                        color="green"
                      />
                      <StatsCard
                        title="Total Hours"
                        value={`${attendanceSummary.totalHoursWorked.toFixed(1)}h`}
                        icon={Clock}
                        color="primary"
                      />
                      <StatsCard
                        title="Overtime Hours"
                        value={`${attendanceSummary.totalOvertimeHours.toFixed(1)}h`}
                        icon={Timer}
                        color="purple"
                      />
                      <StatsCard
                        title="Absent Days"
                        value={attendanceSummary.absentDays}
                        icon={CalendarX2}
                        color="red"
                      />
                    </div>
                  )}
                 
                 {/* Enhanced Records Table with Improved Scrolling */}
                 <Card className="flex-1 flex flex-col border-0 shadow-lg bg-white">
                   <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200/60 flex-shrink-0">
                     <div className="flex items-center justify-between">
                       <div>
                         <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                           <ClipboardCheck className="h-5 w-5 text-blue-600" />
                           Attendance Records
                         </CardTitle>
                         <CardDescription className="mt-1 text-gray-600">
                           Detailed attendance history for <span className="font-medium text-gray-900">{staffList.find(s => s.uid === selectedStaffId)?.displayName || 'selected staff'}</span>
                         </CardDescription>
                       </div>
                       <div className="flex items-center gap-2">
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="border-gray-300 hover:bg-gray-50"
                           onClick={() => setShowFilters(!showFilters)}
                         >
                           <Filter className="h-4 w-4 mr-2" />
                           Filter
                           {statusFilter !== 'all' && (
                             <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                               !
                             </Badge>
                           )}
                         </Button>
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="border-gray-300 hover:bg-gray-50"
                           onClick={handleExportDetailedRecords}
                           disabled={!attendanceRecords || attendanceRecords.length === 0}
                         >
                           <Download className="h-4 w-4 mr-2" />
                           Export Records
                         </Button>
                       </div>
                     </div>
                   </CardHeader>
                   
                   {/* Search and Filter Section */}
                   {showFilters && (
                     <div className="border-b border-gray-200 bg-gray-50/50 p-4">
                       <div className="flex flex-col sm:flex-row gap-4">
                         <div className="flex-1">
                           <div className="relative">
                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                             <Input
                               placeholder="Search by date, status, or notes..."
                               value={searchTerm}
                               onChange={(e) => setSearchTerm(e.target.value)}
                               className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                             />
                           </div>
                         </div>
                         <div className="flex gap-2">
                           <Select value={statusFilter} onValueChange={setStatusFilter}>
                             <SelectTrigger className="w-[180px] border-gray-300">
                               <SelectValue placeholder="Filter by status" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">All Status</SelectItem>
                               <SelectItem value="present_full">Present Full</SelectItem>
                               <SelectItem value="present_half">Present Half</SelectItem>
                               <SelectItem value="absent">Absent</SelectItem>
                               <SelectItem value="leave">Leave</SelectItem>
                               <SelectItem value="holiday">Holiday</SelectItem>
                             </SelectContent>
                           </Select>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               setSearchTerm('');
                               setStatusFilter('all');
                             }}
                             className="border-gray-300 hover:bg-gray-50"
                           >
                             <X className="h-4 w-4 mr-1" />
                             Clear
                           </Button>
                         </div>
                       </div>
                       {(searchTerm || statusFilter !== 'all') && (
                         <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                           <span>Showing {filteredAttendanceRecords.length} of {attendanceRecords.length} records</span>
                           {searchTerm && (
                             <Badge variant="outline" className="text-xs">
                               Search: "{searchTerm}"
                             </Badge>
                           )}
                           {statusFilter !== 'all' && (
                             <Badge variant="outline" className="text-xs">
                               Status: {statusFilter.replace('_', ' ')}
                             </Badge>
                           )}
                         </div>
                       )}
                     </div>
                   )}
                   
                   {/* Scrollable Table Container */}
                   <div className="flex-1 overflow-hidden">
                     {isLoading ? (
                       <div className="flex justify-center items-center h-full min-h-[400px]">
                         <div className="flex flex-col items-center gap-4">
                           <div className="relative">
                             <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                             <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-blue-200"></div>
                         </div>
                           <div className="text-center">
                             <p className="text-sm font-medium text-gray-900">Loading attendance records...</p>
                             <p className="text-xs text-gray-500 mt-1">Please wait while we fetch the data</p>
                       </div>
                         </div>
                       </div>
                     ) : filteredAttendanceRecords.length > 0 ? (
                       <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                         <Table className="relative">
                           <TableHeader className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
                             <TableRow className="hover:bg-transparent">
                               <TableHead className="font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm">
                                 <div className="flex items-center gap-2">
                                   <Calendar className="h-4 w-4 text-gray-500" />
                                   Date
                                 </div>
                               </TableHead>
                               <TableHead className="font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm">
                                 <div className="flex items-center gap-2">
                                   <CheckCircle2 className="h-4 w-4 text-gray-500" />
                                   Status
                                 </div>
                               </TableHead>
                               <TableHead className="font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm">
                                 <div className="flex items-center gap-2">
                                   <Clock className="h-4 w-4 text-gray-500" />
                                   Clock In
                                 </div>
                               </TableHead>
                               <TableHead className="font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm">
                                 <div className="flex items-center gap-2">
                                   <Clock className="h-4 w-4 text-gray-500" />
                                   Clock Out
                                 </div>
                               </TableHead>
                               <TableHead className="font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm">
                                 <div className="flex items-center gap-2">
                                   <Timer className="h-4 w-4 text-gray-500" />
                                   Hours Worked
                                 </div>
                               </TableHead>
                               <TableHead className="font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm">
                                 <div className="flex items-center gap-2">
                                   <TrendingUp className="h-4 w-4 text-gray-500" />
                                   Overtime
                                 </div>
                               </TableHead>
                               <TableHead className="font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm">
                                 <div className="flex items-center gap-2">
                                   <Camera className="h-4 w-4 text-gray-500" />
                                   Photos
                                 </div>
                               </TableHead>
                               <TableHead className="text-right font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm">
                                 Actions
                               </TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                             {filteredAttendanceRecords.map((record, index) => (
                               <TableRow 
                                 key={record.id} 
                                 className="group hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                               >
                                 <TableCell className="py-4 px-6">
                                   <div className="flex items-center gap-4">
                                     <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 min-w-[60px]">
                                       <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                       {format(record.date, 'MMM')}
                                     </p>
                                       <p className="font-bold text-xl text-gray-900 mt-1">
                                       {format(record.date, 'd')}
                                     </p>
                                   </div>
                                   <div>
                                       <p className="font-semibold text-gray-900">
                                       {format(record.date, 'EEEE')}
                                     </p>
                                       <p className="text-sm text-gray-500">
                                       {format(record.date, 'yyyy')}
                                     </p>
                                   </div>
                                 </div>
                               </TableCell>
                                 <TableCell className="py-4 px-6">
                                 <AttendanceStatusBadge status={record.status} />
                               </TableCell>
                                 <TableCell className="py-4 px-6">
                                 {(() => {
                                   // Get first clock session's time in
                                   const firstSession = record.clockSessions && record.clockSessions.length > 0 
                                     ? record.clockSessions[0] 
                                     : null;
                                   const timeIn = firstSession?.timeIn;
                                   
                                   return timeIn ? (
                                     <div className="flex items-center gap-3">
                                       <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                                       <div>
                                         <span className="font-semibold text-gray-900">
                                           {format(timeIn, 'h:mm a')}
                                         </span>
                                         <p className="text-xs text-gray-500">
                                           {format(timeIn, 'MMM d')}
                                         </p>
                                       </div>
                                     </div>
                                   ) : (
                                     <div className="flex items-center gap-2">
                                       <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                                       <span className="text-gray-500 italic">Not clocked in</span>
                                     </div>
                                   );
                                 })()}
                               </TableCell>
                                 <TableCell className="py-4 px-6">
                                 {(() => {
                                   // Get last completed session's time out, or check if there's an open session
                                   let timeOut: Date | undefined;
                                   let hasOpenSession = false;
                                   
                                   if (record.clockSessions && record.clockSessions.length > 0) {
                                     // Check for open session (clocked in but not out)
                                     const openSession = record.clockSessions.find(s => s.timeIn && !s.timeOut);
                                     if (openSession) {
                                       hasOpenSession = true;
                                     } else {
                                       // Get the last completed session's time out
                                       const completedSessions = record.clockSessions.filter(s => s.timeOut);
                                       if (completedSessions.length > 0) {
                                         const lastSession = completedSessions[completedSessions.length - 1];
                                         timeOut = lastSession.timeOut;
                                       }
                                     }
                                   }
                                   
                                   if (hasOpenSession) {
                                     return (
                                       <div className="flex items-center gap-3">
                                         <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm animate-pulse"></div>
                                         <div>
                                           <span className="font-semibold text-blue-600">
                                             Still Clocked In
                                           </span>
                                           <p className="text-xs text-blue-500">
                                             Active session
                                           </p>
                                         </div>
                                       </div>
                                     );
                                   } else if (timeOut) {
                                     return (
                                       <div className="flex items-center gap-3">
                                         <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div>
                                         <div>
                                           <span className="font-semibold text-gray-900">
                                             {format(timeOut, 'h:mm a')}
                                           </span>
                                           <p className="text-xs text-gray-500">
                                             {format(timeOut, 'MMM d')}
                                           </p>
                                         </div>
                                       </div>
                                     );
                                   } else {
                                     return (
                                       <div className="flex items-center gap-2">
                                         <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                                         <span className="text-gray-500 italic">Not clocked out</span>
                                       </div>
                                     );
                                   }
                                 })()}
                               </TableCell>
                                 <TableCell className="py-4 px-6">
                                 {record.hoursWorked ? (
                                     <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors">
                                       <Timer className="h-3 w-3 mr-1" />
                                     {record.hoursWorked}h
                                   </Badge>
                                 ) : (
                                     <span className="text-gray-400 italic">-</span>
                                 )}
                               </TableCell>
                                 <TableCell className="py-4 px-6">
                                 {record.overtime > 0 ? (
                                     <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 transition-colors">
                                     <TrendingUp className="h-3 w-3 mr-1" />
                                     {record.overtime}h
                                   </Badge>
                                 ) : (
                                     <span className="text-gray-400 italic">-</span>
                                 )}
                               </TableCell>
                                 <TableCell className="py-4 px-6">
                                 {record.clockSessions && record.clockSessions.length > 0 ? (
                                   <div className="flex items-center gap-2">
                                     {record.clockSessions.map((session, sessionIndex) => (
                                       <div key={sessionIndex} className="flex items-center gap-1">
                                         {session.photoInUrl && (
                                           <Dialog>
                                             <DialogTrigger asChild>
                                               <button className="relative group">
                                                 <img
                                                   src={session.photoInUrl}
                                                   alt={`Clock-in photo ${format(session.timeIn, 'h:mm a')}`}
                                                   className="h-10 w-10 rounded object-cover border-2 border-green-500 hover:border-green-600 transition-colors cursor-pointer"
                                                 />
                                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded transition-colors flex items-center justify-center">
                                                   <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                                                 </div>
                                               </button>
                                             </DialogTrigger>
                                             <DialogContent className="max-w-2xl">
                                               <DialogHeader>
                                                 <DialogTitle>Clock-In Photo</DialogTitle>
                                                 <DialogDescription>
                                                   {format(session.timeIn, 'EEEE, MMMM d, yyyy h:mm a')}
                                                 </DialogDescription>
                                               </DialogHeader>
                                               <div className="flex justify-center">
                                                 <img
                                                   src={session.photoInUrl}
                                                   alt="Clock-in photo"
                                                   className="max-w-full max-h-[600px] rounded-lg"
                                                 />
                                               </div>
                                             </DialogContent>
                                           </Dialog>
                                         )}
                                         {session.photoOutUrl && (
                                           <Dialog>
                                             <DialogTrigger asChild>
                                               <button className="relative group">
                                                 <img
                                                   src={session.photoOutUrl}
                                                   alt={`Clock-out photo ${session.timeOut ? format(session.timeOut, 'h:mm a') : ''}`}
                                                   className="h-10 w-10 rounded object-cover border-2 border-orange-500 hover:border-orange-600 transition-colors cursor-pointer"
                                                 />
                                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded transition-colors flex items-center justify-center">
                                                   <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                                                 </div>
                                               </button>
                                             </DialogTrigger>
                                             <DialogContent className="max-w-2xl">
                                               <DialogHeader>
                                                 <DialogTitle>Clock-Out Photo</DialogTitle>
                                                 <DialogDescription>
                                                   {session.timeOut ? format(session.timeOut, 'EEEE, MMMM d, yyyy h:mm a') : 'N/A'}
                                                 </DialogDescription>
                                               </DialogHeader>
                                               <div className="flex justify-center">
                                                 <img
                                                   src={session.photoOutUrl}
                                                   alt="Clock-out photo"
                                                   className="max-w-full max-h-[600px] rounded-lg"
                                                 />
                                               </div>
                                             </DialogContent>
                                           </Dialog>
                                         )}
                                       </div>
                                     ))}
                                     {record.clockSessions.every(s => !s.photoInUrl && !s.photoOutUrl) && (
                                       <span className="text-gray-400 italic text-sm">No photos</span>
                                     )}
                                   </div>
                                 ) : (
                                   <span className="text-gray-400 italic text-sm">No sessions</span>
                                 )}
                               </TableCell>
                                 <TableCell className="text-right py-4 px-6">
                                 {userRole === 'admin' && (
                                   <DropdownMenu>
                                     <DropdownMenuTrigger asChild>
                                         <Button 
                                           variant="ghost" 
                                           size="icon" 
                                           className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100"
                                         >
                                         <MoreHorizontal className="h-4 w-4" />
                                       </Button>
                                     </DropdownMenuTrigger>
                                       <DropdownMenuContent align="end" className="w-48">
                                         <DropdownMenuLabel className="text-gray-900">Actions</DropdownMenuLabel>
                                       <DropdownMenuItem
                                         onClick={() => {
                                           setShowMarkDialog(true);
                                         }}
                                           className="cursor-pointer"
                                       >
                                         <Edit className="h-4 w-4 mr-2" />
                                         Edit Record
                                       </DropdownMenuItem>
                                       <DropdownMenuSeparator />
                                         <DropdownMenuItem 
                                           className="text-red-600 cursor-pointer hover:bg-red-50"
                                           onClick={() => {
                                             setAttendanceToDelete(record);
                                             setDeleteDialogOpen(true);
                                           }}
                                         >
                                         <Trash className="h-4 w-4 mr-2" />
                                         Delete Record
                                       </DropdownMenuItem>
                                     </DropdownMenuContent>
                                   </DropdownMenu>
                                 )}
                               </TableCell>
                             </TableRow>
                           ))}
                         </TableBody>
                       </Table>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-4">
                         <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 shadow-sm">
                           <CalendarX2 className="h-12 w-12 text-gray-400" />
                         </div>
                         <h3 className="font-semibold text-xl mb-2 text-gray-900">
                           {attendanceRecords.length === 0 ? 'No attendance records found' : 'No matching records found'}
                         </h3>
                         <p className="text-center text-gray-500 max-w-md leading-relaxed">
                           {attendanceRecords.length === 0 
                             ? 'No attendance records found for the selected staff member in this date range. Records will appear here once attendance is marked.'
                             : 'No records match your current search and filter criteria. Try adjusting your filters or search terms.'
                           }
                         </p>
                         <div className="flex gap-2 mt-4">
                           {attendanceRecords.length > 0 && (searchTerm || statusFilter !== 'all') && (
                             <Button 
                               variant="outline" 
                               className="border-gray-300 hover:bg-gray-50"
                               onClick={() => {
                                 setSearchTerm('');
                                 setStatusFilter('all');
                               }}
                             >
                               <X className="h-4 w-4 mr-2" />
                               Clear Filters
                             </Button>
                           )}
                           <Button 
                             variant="outline" 
                             className="border-gray-300 hover:bg-gray-50"
                             onClick={() => setShowMarkDialog(true)}
                           >
                             <PlusCircle className="h-4 w-4 mr-2" />
                             Mark Attendance
                           </Button>
                         </div>
                       </div>
                     )}
                   </div>
                 </Card>
               </div>
             </TabsContent>
             
             {/* Attendance Report Tab */}
             <TabsContent value="attendance-report" className="h-full m-0">
               <div className="h-full flex flex-col p-6 space-y-6">
                 <Card className="flex-1 flex flex-col border-0 shadow-lg bg-white">
                   <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200/60 flex-shrink-0">
                     <div className="flex items-center justify-between">
                       <div>
                         <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                           <BarChart className="h-5 w-5 text-blue-600" />
                           Staff Attendance Report
                         </CardTitle>
                         <CardDescription className="mt-1 text-gray-600">
                           Comprehensive attendance overview from <span className="font-medium text-gray-900">{format(dateRange.from, 'MMM d, yyyy')}</span> to <span className="font-medium text-gray-900">{format(dateRange.to, 'MMM d, yyyy')}</span>
                         </CardDescription>
                       </div>
                       <div className="flex items-center gap-2">
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="border-gray-300 hover:bg-gray-50"
                           onClick={() => setShowReportFilters(!showReportFilters)}
                         >
                           <Filter className="h-4 w-4 mr-2" />
                           Filter
                           {reportSearchTerm && (
                             <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                               !
                             </Badge>
                           )}
                         </Button>
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="border-gray-300 hover:bg-gray-50"
                             >
                               <Download className="h-4 w-4 mr-2" />
                               Export
                               <ChevronDown className="h-4 w-4 ml-1" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={handleExportToExcel}>
                               <FileBarChart className="h-4 w-4 mr-2" />
                               Summary Report (CSV)
                             </DropdownMenuItem>
                             <DropdownMenuItem 
                               onClick={handleExportDetailedRecords}
                               disabled={!attendanceRecords || attendanceRecords.length === 0}
                             >
                               <FileText className="h-4 w-4 mr-2" />
                               Detailed Records (CSV)
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </div>
                     </div>
                   </CardHeader>
                   
                   {/* Search and Filter Section */}
                   {showReportFilters && (
                     <div className="border-b border-gray-200 bg-gray-50/50 p-4">
                       <div className="flex flex-col sm:flex-row gap-4">
                         <div className="flex-1">
                           <div className="relative">
                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                             <Input
                               placeholder="Search by staff name or email..."
                               value={reportSearchTerm}
                               onChange={(e) => setReportSearchTerm(e.target.value)}
                               className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                             />
                           </div>
                         </div>
                         <div className="flex gap-2">
                           <Select value={reportSortColumn} onValueChange={setReportSortColumn}>
                             <SelectTrigger className="w-[180px] border-gray-300">
                               <SelectValue placeholder="Sort by" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="staffName">Staff Name</SelectItem>
                               <SelectItem value="presentDays">Present Days</SelectItem>
                               <SelectItem value="absentDays">Absent Days</SelectItem>
                               <SelectItem value="totalHoursWorked">Total Hours</SelectItem>
                               <SelectItem value="totalOvertimeHours">Overtime</SelectItem>
                             </SelectContent>
                           </Select>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               setReportSearchTerm('');
                               setReportSortColumn('staffName');
                             }}
                             className="border-gray-300 hover:bg-gray-50"
                           >
                             <X className="h-4 w-4 mr-1" />
                             Clear
                           </Button>
                         </div>
                       </div>
                       {reportSearchTerm && (
                         <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                           <span>Showing {filteredStaffSummaries.length} of {allStaffSummaries.length} staff members</span>
                           <Badge variant="outline" className="text-xs">
                             Search: "{reportSearchTerm}"
                           </Badge>
                         </div>
                       )}
                     </div>
                   )}
                   
                   {/* Scrollable Table Container */}
                   <div className="flex-1 overflow-hidden">
                     {isLoading ? (
                       <div className="flex justify-center items-center h-full min-h-[400px]">
                         <div className="flex flex-col items-center gap-4">
                           <div className="relative">
                             <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                             <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-blue-200"></div>
                           </div>
                           <div className="text-center">
                             <p className="text-sm font-medium text-gray-900">Generating attendance report...</p>
                             <p className="text-xs text-gray-500 mt-1">Please wait while we process the data</p>
                           </div>
                         </div>
                       </div>
                     ) : filteredStaffSummaries.length > 0 ? (
                       <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                         <Table className="relative">
                           <TableHeader className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
                             <TableRow className="hover:bg-transparent">
                               <TableHead 
                                 className="cursor-pointer hover:bg-gray-50 font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm"
                                 onClick={() => handleSort('staffName')}
                               >
                                 <div className="flex items-center gap-2">
                                   <Users className="h-4 w-4 text-gray-500" />
                                   Staff Member
                                   {sortColumn === 'staffName' && (
                                     sortDirection === 'asc' ? 
                                       <ArrowUp className="h-4 w-4 text-blue-600" /> : 
                                       <ArrowDown className="h-4 w-4 text-blue-600" />
                                   )}
                                 </div>
                               </TableHead>
                               <TableHead 
                                 className="cursor-pointer hover:bg-gray-50 font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm"
                                 onClick={() => handleSort('presentDays')}
                               >
                                 <div className="flex items-center gap-2">
                                   <CalendarCheck2 className="h-4 w-4 text-gray-500" />
                                   Present Days
                                   {sortColumn === 'presentDays' && (
                                     sortDirection === 'asc' ? 
                                       <ArrowUp className="h-4 w-4 text-blue-600" /> : 
                                       <ArrowDown className="h-4 w-4 text-blue-600" />
                                   )}
                                 </div>
                               </TableHead>
                               <TableHead 
                                 className="cursor-pointer hover:bg-gray-50 font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm"
                                 onClick={() => handleSort('absentDays')}
                               >
                                 <div className="flex items-center gap-2">
                                   <CalendarX2 className="h-4 w-4 text-gray-500" />
                                   Absent
                                   {sortColumn === 'absentDays' && (
                                     sortDirection === 'asc' ? 
                                       <ArrowUp className="h-4 w-4 text-blue-600" /> : 
                                       <ArrowDown className="h-4 w-4 text-blue-600" />
                                   )}
                                 </div>
                               </TableHead>
                               <TableHead 
                                 className="cursor-pointer hover:bg-gray-50 font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm"
                                 onClick={() => handleSort('totalHoursWorked')}
                               >
                                 <div className="flex items-center gap-2">
                                   <Timer className="h-4 w-4 text-gray-500" />
                                   Total Hours
                                   {sortColumn === 'totalHoursWorked' && (
                                     sortDirection === 'asc' ? 
                                       <ArrowUp className="h-4 w-4 text-blue-600" /> : 
                                       <ArrowDown className="h-4 w-4 text-blue-600" />
                                   )}
                                 </div>
                               </TableHead>
                               <TableHead 
                                 className="cursor-pointer hover:bg-gray-50 font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm"
                                 onClick={() => handleSort('totalOvertimeHours')}
                               >
                                 <div className="flex items-center gap-2">
                                   <TrendingUp className="h-4 w-4 text-gray-500" />
                                   Overtime
                                   {sortColumn === 'totalOvertimeHours' && (
                                     sortDirection === 'asc' ? 
                                       <ArrowUp className="h-4 w-4 text-blue-600" /> : 
                                       <ArrowDown className="h-4 w-4 text-blue-600" />
                                   )}
                                 </div>
                               </TableHead>
                               <TableHead className="font-semibold text-gray-900 py-4 px-6 bg-white/95 backdrop-blur-sm">
                                 <div className="flex items-center gap-2">
                                   <BarChart className="h-4 w-4 text-gray-500" />
                                   Attendance Rate
                                 </div>
                               </TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {getSortedStaffSummaries().filter(summary => {
                               const matchesSearch = reportSearchTerm === '' || 
                                 summary.staffName.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
                                 summary.staffEmail.toLowerCase().includes(reportSearchTerm.toLowerCase());
                               return matchesSearch;
                             }).map((summary, index) => {
                             const totalWorkDays = summary.totalDays - summary.holidayDays;
                             const presentDays = summary.presentDays;
                             const attendanceRate = totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0;
                             
                             return (
                               <TableRow 
                                 key={summary.staffId} 
                                 className="group hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                               >
                                 <TableCell className="py-4 px-6">
                                   <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                                       {summary.staffName.charAt(0).toUpperCase()}
                                     </div>
                                     <div>
                                       <p className="font-semibold text-gray-900">{summary.staffName}</p>
                                       <p className="text-sm text-gray-500">{summary.staffEmail}</p>
                                     </div>
                                   </div>
                                 </TableCell>
                                 <TableCell className="py-4 px-6">
                                   <Badge variant="outline" className="font-medium bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors">
                                     <CalendarCheck2 className="h-3 w-3 mr-1" />
                                     {summary.presentDays}
                                   </Badge>
                                 </TableCell>
                                 <TableCell className="py-4 px-6">
                                   <Badge variant="outline" className="font-medium bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-colors">
                                     <CalendarX2 className="h-3 w-3 mr-1" />
                                     {summary.absentDays}
                                   </Badge>
                                 </TableCell>
                                 <TableCell className="py-4 px-6">
                                   <div>
                                     <p className="font-semibold text-gray-900 flex items-center gap-2">
                                       <Timer className="h-4 w-4 text-blue-600" />
                                       {summary.totalHoursWorked.toFixed(1)}h
                                     </p>
                                     {summary.totalDays > 0 && (
                                       <p className="text-xs text-gray-500 mt-1">
                                         Avg: {summary.averageHoursPerDay.toFixed(1)}h/day
                                       </p>
                                     )}
                                   </div>
                                 </TableCell>
                                 <TableCell className="py-4 px-6">
                                   {summary.totalOvertimeHours > 0 ? (
                                     <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 transition-colors">
                                       <TrendingUp className="h-3 w-3 mr-1" />
                                       {summary.totalOvertimeHours.toFixed(1)}h
                                     </Badge>
                                   ) : (
                                     <span className="text-gray-400 italic">No overtime</span>
                                   )}
                                 </TableCell>
                                 <TableCell className="py-4 px-6">
                                   <div className="space-y-3">
                                     <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                                       <div 
                                         className={`h-3 rounded-full transition-all duration-500 shadow-sm ${
                                           attendanceRate >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                           attendanceRate >= 75 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                           'bg-gradient-to-r from-red-500 to-pink-500'
                                         }`} 
                                         style={{ width: `${Math.min(100, attendanceRate)}%` }}
                                       ></div>
                                     </div>
                                     <div className="flex items-center justify-between">
                                       <span className={`text-sm font-bold ${
                                         attendanceRate >= 90 ? 'text-green-700' :
                                         attendanceRate >= 75 ? 'text-yellow-700' :
                                         'text-red-700'
                                       }`}>
                                         {attendanceRate.toFixed(1)}%
                                       </span>
                                       <Badge 
                                         variant="outline" 
                                         className={`text-xs font-medium ${
                                           attendanceRate >= 90 ? 'bg-green-50 text-green-700 border-green-200' :
                                           attendanceRate >= 75 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                           'bg-red-50 text-red-700 border-red-200'
                                         }`}
                                       >
                                         {attendanceRate >= 90 ? 'Excellent' :
                                          attendanceRate >= 75 ? 'Good' : 'Needs Improvement'}
                                       </Badge>
                                     </div>
                                   </div>
                                 </TableCell>
                               </TableRow>
                             );
                           })}
                         </TableBody>
                       </Table>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-4">
                         <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6 shadow-sm">
                           <FileBarChart className="h-12 w-12 text-gray-400" />
                         </div>
                         <h3 className="font-semibold text-xl mb-2 text-gray-900">
                           {allStaffSummaries.length === 0 ? 'No attendance data available' : 'No matching staff found'}
                         </h3>
                         <p className="text-center text-gray-500 max-w-md leading-relaxed">
                           {allStaffSummaries.length === 0 
                             ? 'No attendance data found for the selected date range. Data will appear here once staff members start recording their attendance.'
                             : 'No staff members match your current search criteria. Try adjusting your search terms.'
                           }
                         </p>
                         {allStaffSummaries.length > 0 && reportSearchTerm && (
                           <Button 
                             variant="outline" 
                             className="mt-4 border-gray-300 hover:bg-gray-50"
                             onClick={() => setReportSearchTerm('')}
                           >
                             <X className="h-4 w-4 mr-2" />
                             Clear Search
                           </Button>
                         )}
                       </div>
                     )}
                   </div>
                   
                   {/* Enhanced Footer with Summary Stats */}
                   {allStaffSummaries.length > 0 && (
                     <CardFooter className="border-t bg-gradient-to-r from-gray-50 to-slate-50 p-6 flex-shrink-0">
                       <div className="w-full">
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                           <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
                             <p className="text-2xl font-bold text-blue-600">
                               {filteredStaffSummaries.length}
                             </p>
                             <p className="text-sm text-gray-600">Staff Members</p>
                             {reportSearchTerm && (
                               <p className="text-xs text-gray-500 mt-1">
                                 of {allStaffSummaries.length} total
                               </p>
                             )}
                           </div>
                           <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
                             <p className="text-2xl font-bold text-green-600">
                               {filteredStaffSummaries.reduce((sum, s) => sum + s.totalHoursWorked, 0).toFixed(0)}h
                             </p>
                             <p className="text-sm text-gray-600">Total Hours</p>
                           </div>
                           <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
                             <p className="text-2xl font-bold text-purple-600">
                               {filteredStaffSummaries.reduce((sum, s) => sum + s.totalOvertimeHours, 0).toFixed(0)}h
                             </p>
                             <p className="text-sm text-gray-600">Overtime Hours</p>
                           </div>
                           <div className="text-center p-4 bg-white rounded-lg border shadow-sm">
                             <p className="text-2xl font-bold text-orange-600">
                               {filteredStaffSummaries.length > 0 ? (
                                 (filteredStaffSummaries.reduce((sum, s) => {
                                   const totalWorkDays = s.totalDays - s.holidayDays;
                                   const presentDays = s.presentDays;
                                   return sum + (totalWorkDays > 0 ? (presentDays / totalWorkDays) * 100 : 0);
                                 }, 0) / filteredStaffSummaries.length).toFixed(1)
                               ) : '0.0'}%
                             </p>
                             <p className="text-sm text-gray-600">Avg Attendance</p>
                           </div>
                         </div>
                         
                         <div className="flex flex-wrap gap-3">
                           <Button
                             variant="outline"
                             onClick={() => {
                               const loadReportData = async () => {
                                 try {
                                   setIsLoading(true);
                                   const summaries = await attendanceService.getAllStaffAttendanceSummary(
                                     dateRange.from,
                                     dateRange.to
                                   );
                                   setAllStaffSummaries(summaries);
                                   toast({
                                     title: "Report Refreshed",
                                     description: "Attendance report has been updated with latest data",
                                     variant: "success"
                                   });
                                 } catch (error) {
                                   console.error('Error refreshing report data:', error);
                                   toast({
                                     title: "Error",
                                     description: "Failed to refresh report data",
                                     variant: "destructive"
                                   });
                                 } finally {
                                   setIsLoading(false);
                                 }
                               };
                               
                               loadReportData();
                             }}
                             className="gap-2 border-gray-300 hover:bg-gray-50"
                           >
                             <RefreshCw className="h-4 w-4" />
                             Refresh Report
                           </Button>
                           
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button
                                 variant="outline"
                                 className="gap-2 border-gray-300 hover:bg-gray-50"
                               >
                                 <Download className="h-4 w-4" />
                                 Export Data
                                 <ChevronDown className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                               <DropdownMenuSeparator />
                               <DropdownMenuItem onClick={handleExportToExcel}>
                                 <FileBarChart className="h-4 w-4 mr-2" />
                                 Summary Report (CSV)
                               </DropdownMenuItem>
                               <DropdownMenuItem 
                                 onClick={handleExportDetailedRecords}
                                 disabled={!attendanceRecords || attendanceRecords.length === 0}
                               >
                                 <FileText className="h-4 w-4 mr-2" />
                                 Detailed Records (CSV)
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                           
                           {/* <Button
                             variant="outline"
                             onClick={() => {
                               toast({
                                 title: "PDF Export Coming Soon",
                                 description: "PDF export functionality will be available in the next update",
                                 variant: "default"
                               });
                             }}
                             className="gap-2 border-gray-300 hover:bg-gray-50"
                           >
                             <FileText className="h-4 w-4" />
                             Export to PDF
                           </Button> */}
                         </div>
                       </div>
                     </CardFooter>
                   )}
                 </Card>
               </div>
             </TabsContent>
           </div>
         </Tabs>
       </div>
     </div>
     
    {/* Enhanced Mark Attendance Dialog */}
    <MarkAttendanceDialog
      isOpen={showMarkDialog}
      onClose={() => setShowMarkDialog(false)}
      staffList={staffList}
      onMarkAttendance={handleMarkAttendance}
    />
    
    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent className="bg-white rounded-xl border-0 shadow-xl max-w-md">
        <AlertDialogHeader className="gap-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <AlertDialogTitle className="text-xl font-semibold text-center">
            Delete Attendance Record
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-slate-600">
            {attendanceToDelete && (
              <>
                Are you sure you want to delete the attendance record for{' '}
                <span className="font-medium text-gray-900">
                  {format(attendanceToDelete.date, 'EEEE, MMMM d, yyyy')}
                </span>?
              </>
            )}
          </AlertDialogDescription>
          {attendanceToDelete && (
            <div className="space-y-4 pt-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Date:</span>
                  <span>{format(attendanceToDelete.date, 'MMMM d, yyyy')}</span>
                </div>
                {attendanceToDelete.clockSessions && attendanceToDelete.clockSessions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Sessions:</span>
                    <span>{attendanceToDelete.clockSessions.length}</span>
                  </div>
                )}
                {attendanceToDelete.clockSessions && attendanceToDelete.clockSessions.some(s => s.photoInUrl || s.photoOutUrl) && (
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Photos:</span>
                    <span>
                      {attendanceToDelete.clockSessions.filter(s => s.photoInUrl || s.photoOutUrl).length} photo(s) will be deleted
                    </span>
                  </div>
                )}
              </div>
              <p className="text-red-600 font-medium text-center text-sm">
                This action cannot be undone. This will permanently delete the attendance record and all associated photos.
              </p>
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <AlertDialogCancel 
            asChild
            disabled={isDeleting}
          >
            <Button variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction
            asChild
            disabled={isDeleting}
          >
            <Button
              variant="destructive"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              onClick={handleDeleteAttendance}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Record
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </DashboardLayout>
);
}

export default withAuth(AttendancePage);