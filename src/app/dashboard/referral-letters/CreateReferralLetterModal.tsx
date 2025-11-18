// src/app/dashboard/referral-letters/CreateReferralLetterModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { referralLetterService } from '@/services/referralLetterService';
import { referralDoctorService } from '@/services/referralDoctorService';
import { appointmentService } from '@/services/appointmentService';
import { ReferralLetterFormData } from '@/types/referralLetter';
import { ReferralDoctor } from '@/types/referralDoctor';
import { Patient } from '@/types/appointment';
import { useAuth } from '@/context/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X, Search, User, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { formatPatientAge } from '@/utils/ageUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CreateReferralLetterModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateReferralLetterModal({ onClose, onSuccess }: CreateReferralLetterModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [referralDoctors, setReferralDoctors] = useState<ReferralDoctor[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<ReferralDoctor[]>([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<ReferralDoctor | null>(null);
  const [formData, setFormData] = useState<ReferralLetterFormData>({
    patientId: '',
    referralDoctorId: '',
    referralNote: '',
    referralDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter patients based on search query
    if (patientSearchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const query = patientSearchQuery.toLowerCase();
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(query) || 
        patient.contactNumber.includes(query) ||
        (patient.email && patient.email.toLowerCase().includes(query))
      );
      setFilteredPatients(filtered);
    }
  }, [patientSearchQuery, patients]);

  useEffect(() => {
    // Filter doctors based on search query
    if (doctorSearchQuery.trim() === '') {
      setFilteredDoctors(referralDoctors);
    } else {
      const query = doctorSearchQuery.toLowerCase();
      const filtered = referralDoctors.filter(doctor => 
        doctor.name.toLowerCase().includes(query) || 
        doctor.specialty.toLowerCase().includes(query) ||
        (doctor.hospital && doctor.hospital.toLowerCase().includes(query))
      );
      setFilteredDoctors(filtered);
    }
  }, [doctorSearchQuery, referralDoctors]);

  const loadData = async () => {
    try {
      const [patientsData, doctorsData] = await Promise.all([
        appointmentService.getAllPatients(),
        referralDoctorService.getActiveReferralDoctors()
      ]);
      setPatients(patientsData);
      setReferralDoctors(doctorsData);
      setFilteredPatients(patientsData);
      setFilteredDoctors(doctorsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient || !selectedDoctor || !formData.referralNote.trim()) {
      toast.error('Please select a patient, doctor, and enter referral notes');
      return;
    }

    try {
      setLoading(true);
      await referralLetterService.createReferralLetterWithData(
        selectedPatient,
        selectedDoctor,
        formData.referralNote,
        formData.referralDate,
        user?.uid
      );
      
      toast.success('Referral letter created successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating referral letter:', error);
      toast.error('Failed to create referral letter');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ReferralLetterFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, patientId: patient.id! }));
    setPatientSearchQuery('');
  };

  const selectDoctor = (doctor: ReferralDoctor) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({ ...prev, referralDoctorId: doctor.id! }));
    setDoctorSearchQuery('');
  };

  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setFormData(prev => ({ ...prev, patientId: '' }));
  };

  const clearDoctorSelection = () => {
    setSelectedDoctor(null);
    setFormData(prev => ({ ...prev, referralDoctorId: '' }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create Referral Letter
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Select Patient</Label>
            
            {selectedPatient ? (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{selectedPatient.name}</div>
                      <div className="text-sm text-gray-500">
                        {selectedPatient.contactNumber}
                        {selectedPatient.age && ` • ${formatPatientAge(selectedPatient)}`}
                        {selectedPatient.gender && ` • ${selectedPatient.gender}`}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearPatientSelection}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search patients..."
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border rounded-md">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => selectPatient(patient)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-gray-500">
                            {patient.contactNumber}
                            {patient.age && ` • ${formatPatientAge(patient)}`}
                            {patient.gender && ` • ${patient.gender}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Doctor Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Select Referral Doctor</Label>
            
            {selectedDoctor ? (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">{selectedDoctor.name}</div>
                      <div className="text-sm text-gray-500">
                        {selectedDoctor.specialty}
                        {selectedDoctor.hospital && ` • ${selectedDoctor.hospital}`}
                      </div>
                      <div className="text-xs text-gray-400">
                        {selectedDoctor.qualifications}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearDoctorSelection}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search referral doctors..."
                    value={doctorSearchQuery}
                    onChange={(e) => setDoctorSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border rounded-md">
                  {filteredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => selectDoctor(doctor)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Stethoscope className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{doctor.name}</div>
                          <div className="text-sm text-gray-500">
                            {doctor.specialty}
                            {doctor.hospital && ` • ${doctor.hospital}`}
                          </div>
                          <div className="text-xs text-gray-400">
                            {doctor.qualifications}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {doctor.specialty}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Referral Date */}
          <div className="space-y-2">
            <Label htmlFor="referralDate">Referral Date *</Label>
            <Input
              id="referralDate"
              type="date"
              value={formData.referralDate}
              onChange={(e) => handleInputChange('referralDate', e.target.value)}
              required
            />
          </div>

          {/* Referral Note */}
          <div className="space-y-2">
            <Label htmlFor="referralNote">Referral Note *</Label>
            <Textarea
              id="referralNote"
              value={formData.referralNote}
              onChange={(e) => handleInputChange('referralNote', e.target.value)}
              placeholder="Enter detailed referral notes, patient condition, reason for referral, etc."
              rows={6}
              required
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedPatient || !selectedDoctor}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Referral Letter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
