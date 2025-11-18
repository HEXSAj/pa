//src/app/dashboard/patients/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { Patient } from '@/types/appointment';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  Search, 
  X, 
  Loader2, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Users,
  Stethoscope,
  Activity,
  Clock,
  Pill
} from 'lucide-react';
import AddPatientModal from './AddPatientModal';
import EditPatientModal from './EditPatientModal';
import DeletePatientDialog from './DeletePatientDialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { formatPatientAge } from '@/utils/ageUtils';

function PatientsPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAllPatients();
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(query) || 
        patient.contactNumber.toLowerCase().includes(query) ||
        (patient.email && patient.email.toLowerCase().includes(query)) ||
        (patient.drugAllergies && patient.drugAllergies.toLowerCase().includes(query))
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const handleDelete = async (id: string) => {
    try {
      await appointmentService.deletePatient(id);
      await loadPatients();
      setShowDeleteDialog(false);
      setSelectedPatient(null);
      toast.success('Patient deleted successfully');
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast.error(error.message || 'Failed to delete patient');
    }
  };

  const openDeleteDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDeleteDialog(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const formatDate = (date: Date | any | undefined) => {
    if (!date) return 'N/A';
    // Handle both Date and Timestamp types
    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else if (date && typeof date === 'object' && 'seconds' in date) {
      // Firebase Timestamp
      dateObj = new Date(date.seconds * 1000);
    } else {
      dateObj = new Date(date);
    }
    return dateObj.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full px-4 py-6 max-w-7xl mx-auto">
        {/* Header with gradient background */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Patient Management</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-blue-100">Manage your clinic patients and their information</p>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30 ml-2">
                  {userRole || 'User'} Mode
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {isAdmin ? (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Patient
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button 
                          disabled
                          className="bg-white/20 text-white border-white/30"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Patient
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Only admins can add patients</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-50"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">With Allergies</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patients.filter(p => p.drugAllergies && p.drugAllergies.trim() !== '').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Pill className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Patients
            </CardTitle>
            <CardDescription>
              Find patients by name, phone number, email, or allergies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patients List
            </CardTitle>
            <CardDescription>
              {filteredPatients.length} of {patients.length} patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading patients...</span>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No patients found' : 'No patients yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search criteria'
                    : 'Start by adding your first patient'
                  }
                </p>
                {!searchQuery && isAdmin && (
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Patient
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Allergies</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{patient.name}</div>
                              {patient.email && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {patient.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {patient.contactNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatPatientAge(patient)}
                        </TableCell>
                        <TableCell>
                          {patient.gender ? (
                            <Badge variant="outline" className="capitalize">
                              {patient.gender}
                            </Badge>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {patient.bodyWeight ? `${patient.bodyWeight} kg` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {patient.drugAllergies && patient.drugAllergies.trim() !== '' ? (
                            <div className="flex items-center gap-1 text-red-600">
                              <Pill className="h-3 w-3" />
                              <span className="text-sm max-w-32 truncate" title={patient.drugAllergies}>
                                {patient.drugAllergies}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(patient.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPatient(patient);
                                    setShowEditModal(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteDialog(patient)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadPatients();
          }}
        />
      )}

      {showEditModal && selectedPatient && (
        <EditPatientModal
          patient={selectedPatient}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPatient(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedPatient(null);
            loadPatients();
          }}
        />
      )}

      {showDeleteDialog && selectedPatient && (
        <DeletePatientDialog
          patient={selectedPatient}
          onConfirm={() => {
            if (selectedPatient?.id) {
              handleDelete(selectedPatient.id);
            }
            setShowDeleteDialog(false);
            setSelectedPatient(null);
          }}
          onCancel={() => {
            setShowDeleteDialog(false);
            setSelectedPatient(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default withAuth(PatientsPage);
