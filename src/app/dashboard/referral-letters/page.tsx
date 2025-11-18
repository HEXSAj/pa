// src/app/dashboard/referral-letters/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { referralLetterService } from '@/services/referralLetterService';
import { ReferralLetter, ReferralStatus, ReferralLetterSearchFilters } from '@/types/referralLetter';
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
  FileText,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import CreateReferralLetterModal from './CreateReferralLetterModal';
import ReferralLetterDetailsModal from './ReferralLetterDetailsModal';
import DeleteReferralLetterDialog from './DeleteReferralLetterDialog';
import { getReferralStatusColor, getReferralStatusLabel, formatReferralDate } from '@/types/referralLetter';

function ReferralLettersPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  const [referralLetters, setReferralLetters] = useState<ReferralLetter[]>([]);
  const [filteredReferralLetters, setFilteredReferralLetters] = useState<ReferralLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReferralLetter, setSelectedReferralLetter] = useState<ReferralLetter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const loadReferralLetters = async () => {
    try {
      setLoading(true);
      const data = await referralLetterService.getAll();
      setReferralLetters(data);
      setFilteredReferralLetters(data);
    } catch (error) {
      console.error('Error loading referral letters:', error);
      toast.error('Failed to load referral letters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferralLetters();
  }, []);

  useEffect(() => {
    let filtered = referralLetters;

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(letter => 
        letter.patientName.toLowerCase().includes(query) || 
        letter.patientContact.includes(query) ||
        letter.referralDoctorName.toLowerCase().includes(query) ||
        letter.referralDoctorSpecialty.toLowerCase().includes(query) ||
        letter.referralNote.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(letter => letter.status === statusFilter);
    }

    setFilteredReferralLetters(filtered);
  }, [searchQuery, statusFilter, referralLetters]);

  const handleDelete = async (id: string) => {
    try {
      await referralLetterService.delete(id);
      await loadReferralLetters();
      setShowDeleteDialog(false);
      setSelectedReferralLetter(null);
      toast.success('Referral letter deleted successfully');
    } catch (error: any) {
      console.error('Error deleting referral letter:', error);
      toast.error(error.message || 'Failed to delete referral letter');
    }
  };

  const openDeleteDialog = (referralLetter: ReferralLetter) => {
    setSelectedReferralLetter(referralLetter);
    setShowDeleteDialog(true);
  };

  const openDetailsModal = (referralLetter: ReferralLetter) => {
    setSelectedReferralLetter(referralLetter);
    setShowDetailsModal(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const getStatusIcon = (status: ReferralStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'received':
        return <Eye className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full px-4 py-6 max-w-7xl mx-auto">
        {/* Header with gradient background */}
        <div className="rounded-xl bg-gradient-to-r from-green-600 to-teal-600 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Referral Letters</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-green-100">Manage patient referral letters and doctor communications</p>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30 ml-2">
                  {userRole || 'User'} Mode
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Referral Letter
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-teal-50"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Letters</p>
                  <p className="text-2xl font-bold text-gray-900">{referralLetters.length}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {referralLetters.filter(l => l.status === 'pending').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {referralLetters.filter(l => l.status === 'sent').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-green-50"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {referralLetters.filter(l => l.status === 'completed').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Referral Letters
                </CardTitle>
                <CardDescription>
                  Find referral letters by patient, doctor, specialty, or content
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search referral letters..."
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

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status Filter</label>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReferralStatus | 'all')}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Referral Letters Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Referral Letters List
            </CardTitle>
            <CardDescription>
              {filteredReferralLetters.length} of {referralLetters.length} letters
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading referral letters...</span>
              </div>
            ) : filteredReferralLetters.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || statusFilter !== 'all' ? 'No referral letters found' : 'No referral letters yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters'
                    : 'Start by creating your first referral letter'
                  }
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Referral Letter
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Referral Doctor</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Referral Note</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferralLetters.map((letter) => (
                      <TableRow key={letter.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium">{letter.patientName}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {letter.patientContact}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <Stethoscope className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-medium">{letter.referralDoctorName}</div>
                              {letter.referralDoctorHospital && (
                                <div className="text-sm text-gray-500">
                                  {letter.referralDoctorHospital}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {letter.referralDoctorSpecialty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-48 truncate" title={letter.referralNote}>
                            {letter.referralNote}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {formatReferralDate(letter.referralDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${getReferralStatusColor(letter.status)} flex items-center gap-1 w-fit`}
                          >
                            {getStatusIcon(letter.status)}
                            {getReferralStatusLabel(letter.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDetailsModal(letter)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Details</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteDialog(letter)}
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
      {showCreateModal && (
        <CreateReferralLetterModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadReferralLetters();
          }}
        />
      )}

      {showDetailsModal && selectedReferralLetter && (
        <ReferralLetterDetailsModal
          referralLetter={selectedReferralLetter}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedReferralLetter(null);
          }}
          onUpdate={() => {
            loadReferralLetters();
          }}
        />
      )}

      {showDeleteDialog && selectedReferralLetter && (
        <DeleteReferralLetterDialog
          referralLetter={selectedReferralLetter}
          onConfirm={() => {
            if (selectedReferralLetter?.id) {
              handleDelete(selectedReferralLetter.id);
            }
            setShowDeleteDialog(false);
            setSelectedReferralLetter(null);
          }}
          onCancel={() => {
            setShowDeleteDialog(false);
            setSelectedReferralLetter(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default withAuth(ReferralLettersPage);
