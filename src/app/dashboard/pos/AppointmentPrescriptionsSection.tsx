//src/app/dashboard/pos/AppointmentPrescriptionsSectionProps.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Pill, 
  Search, 
  Calendar, 
  User, 
  Stethoscope,
  FileText,
  Clock,
  Package,
  Eye,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Appointment } from '@/types/appointment';
import { Prescription } from '@/types/prescription';
import { prescriptionService } from '@/services/prescriptionService';
import { appointmentService } from '@/services/appointmentService';
import { format } from 'date-fns';
import { LoadPrescriptionToPOSButton } from './LoadPrescriptionToPOSButton';



interface AppointmentPrescriptionsSectionProps {
  sessionId: string;
  appointmentIds: string[];
  onLoadPrescriptionToPOS?: (prescriptionData: any) => void; // Add this
}

interface AppointmentWithPrescription {
  appointment: Appointment;
  prescription: Prescription | null;
}

export function AppointmentPrescriptionsSection({ 
  sessionId, 
  appointmentIds,
  onLoadPrescriptionToPOS // Add this
}: AppointmentPrescriptionsSectionProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [appointmentsWithPrescriptions, setAppointmentsWithPrescriptions] = useState<AppointmentWithPrescription[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Load appointments and their prescriptions
  useEffect(() => {
    loadAppointmentsWithPrescriptions();
  }, [appointmentIds]);

  const loadAppointmentsWithPrescriptions = async () => {
    if (!appointmentIds || appointmentIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const appointmentsData: AppointmentWithPrescription[] = [];

      // Load each appointment and its prescription
      for (const appointmentId of appointmentIds) {
        try {
          const appointment = await appointmentService.getAppointmentById(appointmentId);
          if (appointment) {
            const prescription = await prescriptionService.getPrescriptionByAppointmentId(appointmentId);
            appointmentsData.push({
              appointment,
              prescription
            });
          }
        } catch (error) {
          console.error(`Error loading appointment ${appointmentId}:`, error);
        }
      }

      // Sort by appointment date/time (newest first)
      appointmentsData.sort((a, b) => {
        const dateA = new Date(`${a.appointment.date} ${a.appointment.startTime}`);
        const dateB = new Date(`${b.appointment.date} ${b.appointment.startTime}`);
        return dateB.getTime() - dateA.getTime();
      });

      setAppointmentsWithPrescriptions(appointmentsData);
    } catch (error) {
      console.error('Error loading appointments with prescriptions:', error);
      toast.error('Failed to load appointment prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAppointmentsWithPrescriptions();
    setRefreshing(false);
    toast.success('Prescriptions refreshed');
  };

  const toggleCardExpansion = (appointmentId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(appointmentId)) {
      newExpanded.delete(appointmentId);
    } else {
      newExpanded.add(appointmentId);
    }
    setExpandedCards(newExpanded);
  };

  // Filter appointments based on search term
  const filteredAppointments = appointmentsWithPrescriptions.filter(({ appointment, prescription }) => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      appointment.patientName.toLowerCase().includes(searchLower) ||
      appointment.doctorName.toLowerCase().includes(searchLower) ||
      appointment.sessionAppointmentNumber?.toString().includes(searchLower) ||
      (prescription?.medicines.some(med => 
        med.medicineName.toLowerCase().includes(searchLower)
      ))
    );
  });

  const appointmentsWithPrescriptionsCount = appointmentsWithPrescriptions.filter(
    ({ prescription }) => prescription !== null
  ).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-green-600" />
            Appointment Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading prescriptions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-green-600" />
            Appointment Prescriptions
            <Badge variant="secondary" className="ml-2">
              {appointmentsWithPrescriptionsCount} of {appointmentsWithPrescriptions.length}
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by patient name, doctor, appointment number, or medicine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {appointmentsWithPrescriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No appointments in this session</p>
            <p className="text-sm">Appointments with prescriptions will appear here</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No matching prescriptions found</p>
            <p className="text-sm">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map(({ appointment, prescription }) => {
              const isExpanded = expandedCards.has(appointment.id!);
              const hasPrescription = prescription !== null;

              console.log('Appointment:', appointment.patientName);
              console.log('hasPrescription:', hasPrescription);
              console.log('onLoadPrescriptionToPOS exists:', !!onLoadPrescriptionToPOS);
          

              return (
                <Card key={appointment.id} className={`transition-all ${
                  hasPrescription ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}>
                  <CardContent className="p-4">
                    {/* Appointment Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{appointment.patientName}</span>
                        </div>
                        
                        {appointment.sessionAppointmentNumber && (
                          <Badge variant="outline" className="text-xs">
                            #{appointment.sessionAppointmentNumber}
                          </Badge>
                        )}
                        
                        {hasPrescription ? (
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            <Pill className="h-3 w-3 mr-1" />
                            Has Prescription
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            <FileText className="h-3 w-3 mr-1" />
                            No Prescription
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {hasPrescription && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCardExpansion(appointment.id!)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {isExpanded ? 'Hide' : 'View'} Details
                            </Button>
                            
                            {/* Add debug info here */}
                            {console.log('Checking button conditions for:', appointment.patientName, 'onLoadPrescriptionToPOS:', !!onLoadPrescriptionToPOS)}
                            
                            {onLoadPrescriptionToPOS && (
                              <LoadPrescriptionToPOSButton
                                appointment={appointment}
                                prescription={prescription!}
                                onLoadToPOS={onLoadPrescriptionToPOS}
                              />
                            )}
                            
                            {/* Add this temporary button to test if it's a prop issue */}
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                console.log('Test button clicked');
                                console.log('onLoadPrescriptionToPOS:', onLoadPrescriptionToPOS);
                                if (onLoadPrescriptionToPOS) {
                                  onLoadPrescriptionToPOS({
                                    patientName: appointment.patientName,
                                    patientPhone: appointment.patientPhone || '',
                                    prescriptionItems: [],
                                    appointment,
                                    prescription
                                  });
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Test Load
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Appointment Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        <span>{appointment.doctorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(appointment.date), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{appointment.startTime} - {appointment.endTime}</span>
                      </div>
                    </div>

                    {/* Prescription Details (Expanded) */}
                    {hasPrescription && isExpanded && prescription && (
                      <div className="border-t pt-3 mt-3">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4 text-green-600" />
                          Prescribed Medicines ({prescription.medicines?.length || 0})
                        </h4>
                        
                        <div className="space-y-3">
                          {(prescription.medicines || []).map((medicine, index) => (
                            <div key={medicine.id} className="bg-white rounded-lg p-3 border">
                              <div className="flex items-start justify-between mb-2">
                                <div className="font-medium text-blue-700">
                                  {index + 1}. {medicine.medicineName}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {medicine.dosage}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div><strong>Frequency:</strong> {medicine.frequency}</div>
                                <div><strong>Duration:</strong> {medicine.duration}</div>
                              </div>
                              
                              {medicine.instructions && (
                                <div className="mt-2 text-sm text-gray-700 bg-blue-50 p-2 rounded">
                                  <strong>Instructions:</strong> {medicine.instructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Prescription Notes */}
                        {prescription.notes && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h5 className="font-medium text-yellow-800 mb-1">Additional Notes:</h5>
                            <p className="text-sm text-yellow-700">{prescription.notes}</p>
                          </div>
                        )}
                        
                        {/* Prescription Metadata */}
                        <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                          <div className="flex justify-between">
                            <span>
                              Prescribed: {prescription.createdAt ? 
                                format(new Date(prescription.createdAt), 'MMM dd, yyyy HH:mm') : 
                                'Unknown'
                              }
                            </span>
                            {prescription.updatedAt && prescription.createdAt && 
                             new Date(prescription.updatedAt).getTime() !== new Date(prescription.createdAt).getTime() && (
                              <span>
                                Updated: {format(new Date(prescription.updatedAt), 'MMM dd, yyyy HH:mm')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}