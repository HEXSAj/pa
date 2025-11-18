// src/app/dashboard/referral-doctors/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { referralDoctorService } from '@/services/referralDoctorService';
import { ReferralDoctor } from '@/types/referralDoctor';
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
  Stethoscope,
  Activity,
  Building,
  MapPin,
  GraduationCap,
  Award
} from 'lucide-react';
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
import AddReferralDoctorModal from './AddReferralDoctorModal';
import EditReferralDoctorModal from './EditReferralDoctorModal';
import DeleteReferralDoctorDialog from './DeleteReferralDoctorDialog';

function ReferralDoctorsPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  const [referralDoctors, setReferralDoctors] = useState<ReferralDoctor[]>([]);
  const [filteredReferralDoctors, setFilteredReferralDoctors] = useState<ReferralDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReferralDoctor, setSelectedReferralDoctor] = useState<ReferralDoctor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadReferralDoctors = async () => {
    try {
      setLoading(true);
      const data = await referralDoctorService.getAll();
      setReferralDoctors(data);
      setFilteredReferralDoctors(data);
    } catch (error) {
      console.error('Error loading referral doctors:', error);
      toast.error('Failed to load referral doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferralDoctors();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredReferralDoctors(referralDoctors);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = referralDoctors.filter(doctor => 
        doctor.name.toLowerCase().includes(query) || 
        doctor.specialty.toLowerCase().includes(query) ||
        doctor.qualifications.toLowerCase().includes(query) ||
        (doctor.hospital && doctor.hospital.toLowerCase().includes(query)) ||
        (doctor.contactNumber && doctor.contactNumber.includes(query)) ||
        (doctor.email && doctor.email.toLowerCase().includes(query))
      );
      setFilteredReferralDoctors(filtered);
    }
  }, [searchQuery, referralDoctors]);

  const handleDelete = async (id: string) => {
    try {
      await referralDoctorService.delete(id);
      await loadReferralDoctors();
      setShowDeleteDialog(false);
      setSelectedReferralDoctor(null);
      toast.success('Referral doctor deleted successfully');
    } catch (error: any) {
      console.error('Error deleting referral doctor:', error);
      toast.error(error.message || 'Failed to delete referral doctor');
    }
  };

  const openDeleteDialog = (referralDoctor: ReferralDoctor) => {
    setSelectedReferralDoctor(referralDoctor);
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
        <div className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Referral Doctors</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-purple-100">Manage doctors for referral letters</p>
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
                  Add Referral Doctor
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
                          Add Referral Doctor
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Only admins can add referral doctors</p>
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
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Doctors</p>
                  <p className="text-2xl font-bold text-gray-900">{referralDoctors.length}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Doctors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {referralDoctors.filter(d => d.isActive).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Specialties</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(referralDoctors.map(d => d.specialty)).size}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
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
              Search Referral Doctors
            </CardTitle>
            <CardDescription>
              Find doctors by name, specialty, qualifications, hospital, or contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search referral doctors..."
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

        {/* Referral Doctors Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Referral Doctors List
            </CardTitle>
            <CardDescription>
              {filteredReferralDoctors.length} of {referralDoctors.length} doctors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading referral doctors...</span>
              </div>
            ) : filteredReferralDoctors.length === 0 ? (
              <div className="text-center py-12">
                <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No referral doctors found' : 'No referral doctors yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search criteria'
                    : 'Start by adding your first referral doctor'
                  }
                </p>
                {!searchQuery && isAdmin && (
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Referral Doctor
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Qualifications</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferralDoctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {doctor.titles && (
                                  <span className="text-sm text-gray-500">{doctor.titles}</span>
                                )}
                                {doctor.name}
                              </div>
                              {doctor.email && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {doctor.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{doctor.specialty}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-gray-400" />
                            <span className="text-sm max-w-32 truncate" title={doctor.qualifications}>
                              {doctor.qualifications}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doctor.hospital ? (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              <span className="text-sm max-w-32 truncate" title={doctor.hospital}>
                                {doctor.hospital}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {doctor.contactNumber ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              {doctor.contactNumber}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {doctor.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(doctor.createdAt)}
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
                                    setSelectedReferralDoctor(doctor);
                                    setShowEditModal(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteDialog(doctor)}
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
        <AddReferralDoctorModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadReferralDoctors();
          }}
        />
      )}

      {showEditModal && selectedReferralDoctor && (
        <EditReferralDoctorModal
          referralDoctor={selectedReferralDoctor}
          onClose={() => {
            setShowEditModal(false);
            setSelectedReferralDoctor(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedReferralDoctor(null);
            loadReferralDoctors();
          }}
        />
      )}

      {showDeleteDialog && selectedReferralDoctor && (
        <DeleteReferralDoctorDialog
          referralDoctor={selectedReferralDoctor}
          onConfirm={() => {
            if (selectedReferralDoctor?.id) {
              handleDelete(selectedReferralDoctor.id);
            }
            setShowDeleteDialog(false);
            setSelectedReferralDoctor(null);
          }}
          onCancel={() => {
            setShowDeleteDialog(false);
            setSelectedReferralDoctor(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default withAuth(ReferralDoctorsPage);
