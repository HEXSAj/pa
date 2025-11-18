// src/app/dashboard/appointments/que-display/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { queueDisplayService, QueueDisplayData } from '@/services/queueDisplayService';
import { appointmentService } from '@/services/appointmentService';
import { Appointment } from '@/types/appointment';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Stethoscope, Calendar, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatAppointmentDate } from '@/types/appointment';

export default function QueueDisplayPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [queueData, setQueueData] = useState<QueueDisplayData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeAppointmentsRef = useRef<(() => void) | null>(null);

  const loadAppointments = useCallback(async (data: QueueDisplayData) => {
    try {
      setLoading(true);
      
      // Get all appointments for this session
      const sessionAppointments = await appointmentService.getAppointmentsBySession(
        data.sessionId
      );
      
      // Sort by appointment number
      sessionAppointments.sort((a, b) => (a.sessionAppointmentNumber || 0) - (b.sessionAppointmentNumber || 0));
      
      setAppointments(sessionAppointments);
      setError(null);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID is required');
      setLoading(false);
      return;
    }

    // Subscribe to queue display updates
    const unsubscribeQueue = queueDisplayService.subscribeToQueueDisplay(
      sessionId,
      (data) => {
        setQueueData(data);
        if (data) {
          // Load appointments for this session
          loadAppointments(data);
          
          // Also subscribe to real-time appointment updates
          if (data.doctorId && data.date && data.startTime && data.endTime) {
            // Clean up previous subscription if exists
            if (unsubscribeAppointmentsRef.current) {
              appointmentService.unsubscribe(unsubscribeAppointmentsRef.current);
            }
            
            unsubscribeAppointmentsRef.current = appointmentService.subscribeToSessionAppointments(
              data.doctorId,
              data.date,
              data.startTime,
              data.endTime,
              (updatedAppointments) => {
                const sessionAppointments = updatedAppointments
                  .filter(apt => apt.sessionId === sessionId)
                  .sort((a, b) => (a.sessionAppointmentNumber || 0) - (b.sessionAppointmentNumber || 0));
                setAppointments(sessionAppointments);
              }
            );
          }
        } else {
          setAppointments([]);
          setLoading(false);
          // Clean up appointment subscription if queue data is cleared
          if (unsubscribeAppointmentsRef.current) {
            appointmentService.unsubscribe(unsubscribeAppointmentsRef.current);
            unsubscribeAppointmentsRef.current = null;
          }
        }
      }
    );

    return () => {
      unsubscribeQueue();
      if (unsubscribeAppointmentsRef.current) {
        appointmentService.unsubscribe(unsubscribeAppointmentsRef.current);
        unsubscribeAppointmentsRef.current = null;
      }
    };
  }, [sessionId, loadAppointments]);

  // Calculate previous, ongoing, and next appointments
  const currentNumber = queueData?.currentAppointmentNumber;
  const previousNumbers: number[] = [];
  const nextNumbers: number[] = [];
  let ongoingNumber: number | null = null;

  if (currentNumber !== null && currentNumber !== undefined) {
    ongoingNumber = currentNumber;
    
    // Get all appointment numbers from appointments
    const allNumbers = appointments
      .map(apt => apt.sessionAppointmentNumber)
      .filter((num): num is number => num !== undefined && num !== null)
      .sort((a, b) => a - b);
    
    // Separate previous and next based on current number
    // Previous: all numbers less than current
    // Next: all numbers greater than current
    allNumbers.forEach(num => {
      if (num < currentNumber) {
        previousNumbers.push(num);
      } else if (num > currentNumber) {
        nextNumbers.push(num);
      }
    });
    
    // Sort previous (descending - most recent first) and next (ascending)
    previousNumbers.sort((a, b) => b - a);
    nextNumbers.sort((a, b) => a - b);
    
    // Limit previous to last 5 for better display
    const limitedPrevious = previousNumbers.slice(0, 5);
    previousNumbers.length = 0;
    previousNumbers.push(...limitedPrevious);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-xl text-gray-700">Loading queue display...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-xl text-red-600 mb-2">Error</p>
            <p className="text-gray-700">{error || 'Session ID is required'}</p>
            <p className="text-sm text-gray-500 mt-4">
              Please provide a sessionId query parameter
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!queueData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Stethoscope className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-700 mb-2">No Active Session</p>
            <p className="text-gray-500">
              Waiting for doctor to start working on appointments...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <div className="inline-flex items-center justify-center space-x-3 md:space-x-4 mb-3 md:mb-4">
            <div className="p-2 md:p-3 bg-blue-600 rounded-full">
              <Stethoscope className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900">Appointment Queue</h1>
              <p className="text-base md:text-lg lg:text-xl text-gray-600 mt-1">Dr. {queueData.doctorName}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 md:space-x-6 text-xs md:text-sm lg:text-base text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 md:h-5 md:w-5" />
              <span>{formatAppointmentDate(queueData.date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 md:h-5 md:w-5" />
              <span>{queueData.startTime} - {queueData.endTime}</span>
            </div>
          </div>
        </div>

        {/* Main Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Previous Appointments */}
          <Card className="bg-white shadow-xl border-2 border-gray-200">
            <CardContent className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-700 mb-4 md:mb-6 text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-gray-500" />
                Previous
              </h2>
              <div className="space-y-2 md:space-y-3 max-h-[500px] md:max-h-[600px] overflow-y-auto">
                {previousNumbers.length > 0 ? (
                  previousNumbers.map((num) => {
                    const appointment = appointments.find(
                      apt => apt.sessionAppointmentNumber === num
                    );
                    return (
                      <div
                        key={num}
                        className="bg-gray-100 rounded-lg p-3 md:p-4 border-2 border-gray-300 hover:border-gray-400 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 md:space-x-3 flex-1">
                            <div className="bg-gray-500 text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg md:text-xl font-bold flex-shrink-0">
                              {num}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-800 text-sm md:text-base truncate">
                                {appointment?.patientName || 'Unknown'}
                              </p>
                              <p className="text-xs md:text-sm text-gray-600 truncate">
                                {appointment?.patientContact || ''}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-gray-200 text-gray-700 text-xs md:text-sm flex-shrink-0 ml-2">
                            Done
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 md:py-12 text-gray-400">
                    <User className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm md:text-base">No previous appointments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ongoing Appointment */}
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl border-4 border-green-400 animate-pulse">
            <CardContent className="p-4 md:p-6 lg:p-8">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6 lg:mb-8 text-center">
                Ongoing
              </h2>
              {ongoingNumber !== null ? (
                <div className="bg-white rounded-xl p-4 md:p-6 shadow-xl animate-fade-in">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 flex items-center justify-center text-4xl md:text-5xl lg:text-6xl font-bold mx-auto mb-3 md:mb-4 shadow-lg animate-bounce">
                      {ongoingNumber}
                    </div>
                    {(() => {
                      const appointment = appointments.find(
                        apt => apt.sessionAppointmentNumber === ongoingNumber
                      );
                      return (
                        <>
                          <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                            {appointment?.patientName || 'Unknown Patient'}
                          </h3>
                          <p className="text-sm md:text-base lg:text-lg text-gray-600 mb-3 md:mb-4">
                            {appointment?.patientContact || ''}
                          </p>
                          {appointment?.procedures && appointment.procedures.length > 0 && (
                            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
                              <p className="text-xs md:text-sm font-semibold text-gray-700 mb-2">
                                Procedures:
                              </p>
                              <div className="flex flex-wrap justify-center gap-1 md:gap-2">
                                {appointment.procedures.map((proc, idx) => (
                                  <Badge
                                    key={idx}
                                    className="bg-green-100 text-green-800 text-xs md:text-sm"
                                  >
                                    {proc.procedureName}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 md:py-12">
                  <div className="bg-white/20 rounded-full w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-10 w-10 md:h-12 md:w-12 text-white" />
                  </div>
                  <p className="text-lg md:text-xl lg:text-2xl text-white">Waiting...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Appointments */}
          <Card className="bg-white shadow-xl border-2 border-blue-200">
            <CardContent className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-700 mb-4 md:mb-6 text-center flex items-center justify-center gap-2">
                <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                Next
              </h2>
              <div className="space-y-2 md:space-y-3 max-h-[500px] md:max-h-[600px] overflow-y-auto">
                {nextNumbers.length > 0 ? (
                  nextNumbers.map((num, index) => {
                    const appointment = appointments.find(
                      apt => apt.sessionAppointmentNumber === num
                    );
                    // Highlight the first next appointment
                    const isFirst = index === 0;
                    return (
                      <div
                        key={num}
                        className={`rounded-lg p-3 md:p-4 border-2 transition-all ${
                          isFirst
                            ? 'bg-blue-100 border-blue-500 shadow-md scale-105'
                            : 'bg-blue-50 border-blue-300 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 md:space-x-3 flex-1">
                            <div className={`text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-lg md:text-xl font-bold flex-shrink-0 ${
                              isFirst ? 'bg-blue-700 animate-pulse' : 'bg-blue-600'
                            }`}>
                              {num}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-800 text-sm md:text-base truncate">
                                {appointment?.patientName || 'Unknown'}
                              </p>
                              <p className="text-xs md:text-sm text-gray-600 truncate">
                                {appointment?.patientContact || ''}
                              </p>
                            </div>
                          </div>
                          <Badge className={`text-white text-xs md:text-sm flex-shrink-0 ml-2 ${
                            isFirst ? 'bg-blue-700' : 'bg-blue-600'
                          }`}>
                            {isFirst ? 'Next' : 'Waiting'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 md:py-12 text-gray-400">
                    <User className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm md:text-base">No upcoming appointments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-4 md:mt-6 lg:mt-8 text-center text-xs md:text-sm text-gray-500">
          <p>Last updated: {new Date(queueData.updatedAt).toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}

