// src/app/dashboard/pos/SessionSelectionModal.tsx

'use client';

import { useState } from 'react';
import { DoctorSession } from '@/types/appointment';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  User
} from 'lucide-react';
import { formatCurrency } from '@/types/doctor';

interface SessionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  sessions: DoctorSession[];
  doctorName: string;
  appointmentPatientName: string;
  importingAppointment: boolean;
}

export default function SessionSelectionModal({
  isOpen,
  onClose,
  onSelectSession,
  sessions,
  doctorName,
  appointmentPatientName,
  importingAppointment
}: SessionSelectionModalProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedSessionId) {
      onSelectSession(selectedSessionId);
    }
  };

  const formatTime = (time: string): string => {
    if (!time || time === 'undefined' || time === 'N/A') return 'N/A';
    
    try {
      let hour, minute;
      
      if (time.includes(':')) {
        [hour, minute] = time.split(':');
      } else if (time.length === 4 && !isNaN(parseInt(time))) {
        hour = time.substring(0, 2);
        minute = time.substring(2, 4);
      } else {
        return time;
      }
      
      const hour24 = parseInt(hour);
      const minute24 = parseInt(minute);
      
      if (isNaN(hour24) || isNaN(minute24)) return time;
      
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      
      return `${hour12}:${minute24.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
      return time;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            Select Session for Import
          </DialogTitle>
          <div className="text-slate-600 mt-2">
            <p className="text-lg font-semibold">Doctor: {doctorName}</p>
            <p className="text-sm">Importing appointment for: <span className="font-medium text-slate-800">{appointmentPatientName}</span></p>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Sessions Available</h3>
              <p className="text-slate-500">No sessions found for this doctor today. Please create a session first.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <Card 
                  key={session.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedSessionId === session.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedSessionId(session.id!)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          selectedSessionId === session.id 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Clock className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-800">
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-slate-600 flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {session.doctorName}
                            </span>
                            <span className="text-sm text-slate-600 flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {session.date}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {session.isArrived && (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Arrived
                          </Badge>
                        )}
                        {session.isDeparted && (
                          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            Departed
                          </Badge>
                        )}
                        {!session.isArrived && !session.isDeparted && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-slate-800">{session.totalPatients}</div>
                        <div className="text-sm text-slate-600">Total Patients</div>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{session.arrivedPatients}</div>
                        <div className="text-sm text-slate-600">Arrived</div>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(session.totalDoctorFees)}
                        </div>
                        <div className="text-sm text-slate-600">Total Fees</div>
                      </div>
                      <div className="text-center p-3 bg-slate-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {session.isPaid ? 'Yes' : 'No'}
                        </div>
                        <div className="text-sm text-slate-600">Paid</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={importingAppointment}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSessionId || importingAppointment}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {importingAppointment ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </>
            ) : (
              'Import to Selected Session'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

