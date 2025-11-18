// src/app/dashboard/doctors/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { doctorService } from '@/services/doctorService';
import { Doctor, DoctorSchedule, DoctorProcedure, MedicalProcedure, WeekDay, formatCurrency } from '@/types/doctor';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  Loader2, 
  Search, 
  FilterX, 
  Clock, 
  Stethoscope, 
  Calendar, 
  FileText, 
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Users,
  Activity,
  Star,
  MapPin,
  Phone,
  Mail,
  Filter,
  Grid3X3,
  List,
  Eye,
  MoreVertical,
  TrendingUp,
  CalendarDays,
  DollarSign,
  Shield,
  User
} from 'lucide-react';
import DoctorModal from './DoctorModal';
import ScheduleModal from './ScheduleModal';
import ProcedureModal from './ProcedureModal';
import DoctorProcedureModal from './DoctorProcedureModal';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast, Toaster } from "sonner";
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';
import React from 'react';

function DoctorsPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  
  // State for tabs and view
  const [activeTab, setActiveTab] = useState('doctors');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // State for data
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<{[doctorId: string]: DoctorSchedule[]}>({});
  const [doctorProcedures, setDoctorProcedures] = useState<{[doctorId: string]: DoctorProcedure[]}>({});
  const [allProcedures, setAllProcedures] = useState<MedicalProcedure[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [loadingAllProcedures, setLoadingAllProcedures] = useState(false);
  
  // Error state removed - using toast notifications instead
  
  // Modals and dialogs
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [showDoctorProcedureModal, setShowDoctorProcedureModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<'doctor' | 'schedule' | 'procedure' | 'doctorProcedure'>('doctor');
  
  // Selected items
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<DoctorSchedule | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<DoctorProcedure | null>(null);
  const [selectedProcedureToEdit, setSelectedProcedureToEdit] = useState<MedicalProcedure | null>(null);
  const [selectedProcedureToDelete, setSelectedProcedureToDelete] = useState<MedicalProcedure | null>(null);
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [specialityFilter, setSpecialityFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  // All your existing useEffect hooks and functions remain the same...
  useEffect(() => {
    loadDoctors();
  }, []);
  
  useEffect(() => {
    if (expandedDoctor) {
      loadDoctorDetails(expandedDoctor);
    }
  }, [expandedDoctor]);
  
  useEffect(() => {
    applyFilters();
  }, [doctors, searchQuery, specialityFilter, activeFilter]);

  useEffect(() => {
    if (activeTab === 'procedures') {
      loadAllProcedures();
    }
  }, [activeTab]);

  // All your existing functions remain the same...
  const loadDoctors = async () => {
    try {
      setLoading(true);
      
      const data = await doctorService.getAllDoctors();
      setDoctors(data);
      setFilteredDoctors(data);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('Failed to load doctors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorDetails = async (doctorId: string) => {
    try {
      setLoadingSchedules(true);
      setLoadingProcedures(true);
      
      const [doctorSchedules, doctorProcs] = await Promise.all([
        doctorService.getSchedulesByDoctorId(doctorId),
        doctorService.getDoctorProceduresByDoctorId(doctorId)
      ]);
      
      setSchedules(prev => ({
        ...prev,
        [doctorId]: doctorSchedules
      }));
      
      setDoctorProcedures(prev => ({
        ...prev,
        [doctorId]: doctorProcs
      }));
    } catch (error) {
      console.error('Error loading doctor details:', error);
      toast.error('Failed to load doctor details');
    } finally {
      setLoadingSchedules(false);
      setLoadingProcedures(false);
    }
  };

  const loadAllProcedures = async () => {
    try {
      setLoadingAllProcedures(true);
      
      const data = await doctorService.getAllProcedures();
      setAllProcedures(data);
    } catch (error) {
      console.error('Error loading procedures:', error);
      toast.error('Failed to load procedures. Please try again.');
    } finally {
      setLoadingAllProcedures(false);
    }
  };

  const refreshExpandedDoctor = () => {
    if (expandedDoctor) {
      loadDoctorDetails(expandedDoctor);
    }
  };

  const applyFilters = () => {
    let filtered = [...doctors];
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(query) ||
        doctor.speciality.toLowerCase().includes(query) ||
        doctor.description?.toLowerCase().includes(query)
      );
    }
    
    if (specialityFilter !== 'all') {
      filtered = filtered.filter(doctor => doctor.speciality.toLowerCase() === specialityFilter.toLowerCase());
    }
    
    if (activeFilter !== 'all') {
      const isActive = activeFilter === 'active';
      filtered = filtered.filter(doctor => doctor.isActive === isActive);
    }
    
    setFilteredDoctors(filtered);
  };

  // All your existing handler functions remain the same...
  const handleDeleteDoctor = async (id: string) => {
    try {
      await doctorService.deleteDoctor(id);
      setShowDeleteDialog(false);
      setSelectedDoctor(null);
      toast.success('Doctor deleted successfully');
      loadDoctors();
    } catch (error: any) {
      console.error('Error deleting doctor:', error);
      toast.error(error.message || 'Failed to delete doctor');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await doctorService.deleteSchedule(id);
      setShowDeleteDialog(false);
      setSelectedSchedule(null);
      toast.success('Schedule deleted successfully');
      refreshExpandedDoctor();
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      toast.error(error.message || 'Failed to delete schedule');
    }
  };

  const handleDeleteDoctorProcedure = async (id: string) => {
    try {
      await doctorService.deleteDoctorProcedure(id);
      setShowDeleteDialog(false);
      setSelectedProcedure(null);
      toast.success('Procedure assignment deleted successfully');
      refreshExpandedDoctor();
    } catch (error: any) {
      console.error('Error deleting doctor procedure:', error);
      toast.error(error.message || 'Failed to delete procedure assignment');
    }
  };

  const handleDeleteProcedure = async (id: string) => {
    try {
      await doctorService.deleteProcedure(id);
      setShowDeleteDialog(false);
      setSelectedProcedureToDelete(null);
      toast.success('Procedure deleted successfully');
      loadAllProcedures();
    } catch (error: any) {
      console.error('Error deleting procedure:', error);
      
      // Show a more detailed error message with guidance
      if (error.message && error.message.includes('assigned to doctors')) {
        // Get the procedure name for better context
        const procedureName = selectedProcedureToDelete?.name || 'this procedure';
        
        toast.error(
          `Cannot delete "${procedureName}"`,
          {
            description: 'This procedure is currently assigned to one or more doctors. Please remove all doctor assignments first before deleting.',
            action: {
              label: 'View Doctor Procedures',
              onClick: () => {
                // Set the active tab to doctor procedures to help user find assignments
                setActiveTab('doctorProcedures');
                toast.info('Navigate to Doctor Procedures tab to remove assignments');
              }
            }
          }
        );
      } else {
        toast.error(error.message || 'Failed to delete procedure');
      }
    }
  };

  const getUniqueSpecialities = () => {
    const specialities = new Set<string>();
    doctors.forEach(doctor => {
      if (doctor.speciality) {
        specialities.add(doctor.speciality.toLowerCase());
      }
    });
    return Array.from(specialities).sort();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSpecialityFilter('all');
    setActiveFilter('all');
  };

  const formatDayOfWeek = (day: WeekDay) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    
    try {
      const [hour, minute] = time.split(':');
      const hourNum = parseInt(hour);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const hour12 = hourNum % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
    } catch (e) {
      return time;
    }
  };

  const getStats = () => {
    return {
      total: doctors.length,
      active: doctors.filter(d => d.isActive).length,
      inactive: doctors.filter(d => !d.isActive).length,
      specialties: new Set(doctors.map(d => d.speciality)).size
    };
  };

  const stats = getStats();

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 h-full bg-gray-50/50">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Doctor Management</h1>
                <p className="text-gray-600">Manage doctors, schedules, and procedures</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Shield className="h-3 w-3 mr-1" />
                {userRole} Access
              </Badge>
              
              {!isAdmin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <ShieldAlert className="h-3 w-3 mr-1" />
                        Limited Actions
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Staff users have limited permissions</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Tabs defaultValue="doctors" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm">
                <TabsTrigger value="doctors" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Stethoscope className="h-4 w-4" />
                  Doctors
                </TabsTrigger>
                <TabsTrigger value="procedures" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <FileText className="h-4 w-4" />
                  Procedures
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {activeTab === 'doctors' ? (
              <Button 
                onClick={() => setShowDoctorModal(true)} 
                className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                disabled={true}
              >
                <Plus className="h-4 w-4" />
                Add Doctor
              </Button>
            ) : (
              <Button 
                onClick={() => setShowProcedureModal(true)} 
                className="gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Add Procedure
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {activeTab === 'doctors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Doctors</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                  </div>
                  <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Active</p>
                    <p className="text-2xl font-bold text-green-900">{stats.active}</p>
                  </div>
                  <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Inactive</p>
                    <p className="text-2xl font-bold text-orange-900">{stats.inactive}</p>
                  </div>
                  <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Specialties</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.specialties}</p>
                  </div>
                  <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Doctors Tab */}
        {activeTab === 'doctors' && (
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                  Doctors Directory
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className="h-8 w-8 p-0"
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Grid View</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className="h-8 w-8 p-0"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>List View</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {/* Enhanced Search and Filter Controls */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search doctors by name, specialty, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={specialityFilter}
                    onValueChange={setSpecialityFilter}
                  >
                    <SelectTrigger className="min-w-[180px] h-11 border-gray-200">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      {getUniqueSpecialities().map(speciality => (
                        <SelectItem key={speciality} value={speciality}>
                          {speciality.charAt(0).toUpperCase() + speciality.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={activeFilter}
                    onValueChange={setActiveFilter}
                  >
                    <SelectTrigger className="min-w-[140px] h-11 border-gray-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {(searchQuery.trim() !== '' || specialityFilter !== 'all' || activeFilter !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="h-11 px-3"
                    >
                      <FilterX className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="flex flex-col justify-center items-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                  <p className="text-gray-600">Loading doctors...</p>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || specialityFilter !== 'all' || activeFilter !== 'all' 
                      ? 'Try adjusting your filters or search terms.' 
                      : 'Get started by adding your first doctor.'
                    }
                  </p>
                  {(searchQuery || specialityFilter !== 'all' || activeFilter !== 'all') ? (
                    <Button variant="outline" onClick={clearFilters}>
                      <FilterX className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  ) : (
                    <Button onClick={() => setShowDoctorModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Doctor
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Grid View */}
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredDoctors.map((doctor) => (
                        <Card key={doctor.id} className="group hover:shadow-lg transition-all duration-200 border-gray-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                  <User className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {doctor.name}
                                  </h3>
                                  <Badge variant="secondary" className="text-xs">
                                    {doctor.speciality}
                                  </Badge>
                                </div>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => setExpandedDoctor(expandedDoctor === doctor.id ? null : doctor.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedDoctor(doctor);
                                      setShowDoctorModal(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Doctor
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {isAdmin && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedDoctor(doctor);
                                        setDeleteType('doctor');
                                        setShowDeleteDialog(true);
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-3">
                            {doctor.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {doctor.description}
                              </p>
                            )}
                            
                            <div className="space-y-2">
                              {doctor.contactNumber && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="h-4 w-4" />
                                  <span>{doctor.contactNumber}</span>
                                </div>
                              )}
                              
                              {doctor.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="h-4 w-4" />
                                  <span>{doctor.email}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <Badge 
                                variant={doctor.isActive ? "success" : "secondary"}
                                className={doctor.isActive 
                                  ? "bg-green-100 text-green-700 hover:bg-green-100" 
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                                }
                              >
                                {doctor.isActive ? "Active" : "Inactive"}
                              </Badge>
                              
                              <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => setExpandedDoctor(expandedDoctor === doctor.id ? null : doctor.id)}
                               className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                             >
                               {expandedDoctor === doctor.id ? (
                                 <>
                                   <ChevronDown className="h-4 w-4 mr-1" />
                                   Hide Details
                                 </>
                               ) : (
                                 <>
                                   <ChevronRight className="h-4 w-4 mr-1" />
                                   View Details
                                 </>
                               )}
                             </Button>
                           </div>
                         </CardContent>
                         
                         {/* Expanded Details for Grid View */}
                         {expandedDoctor === doctor.id && (
                           <div className="border-t border-gray-100 bg-gray-50/50">
                             <div className="p-4">
                               <Tabs defaultValue="schedule" className="w-full">
                                 <TabsList className="grid w-full grid-cols-2 mb-4">
                                   <TabsTrigger value="schedule" className="gap-2 text-xs">
                                     <Calendar className="h-3 w-3" />
                                     Schedule
                                   </TabsTrigger>
                                   <TabsTrigger value="procedures" className="gap-2 text-xs">
                                     <FileText className="h-3 w-3" />
                                     Procedures
                                   </TabsTrigger>
                                 </TabsList>
                                 
                                 <TabsContent value="schedule" className="space-y-3">
                                   <div className="flex justify-between items-center">
                                     <h4 className="font-medium text-sm">Weekly Schedule</h4>
                                     <Button 
                                       variant="outline" 
                                       size="sm"
                                       onClick={() => {
                                         setSelectedSchedule(null);
                                         setShowScheduleModal(true);
                                       }}
                                       className="h-7 text-xs gap-1"
                                     >
                                       <Plus className="h-3 w-3" />
                                       Add
                                     </Button>
                                   </div>
                                   
                                   {loadingSchedules ? (
                                     <div className="flex justify-center py-4">
                                       <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                     </div>
                                   ) : !schedules[doctor.id!] || schedules[doctor.id!].length === 0 ? (
                                     <div className="text-center py-6 bg-white rounded-lg border border-dashed border-gray-200">
                                       <Clock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                       <p className="text-xs text-gray-500">No schedule</p>
                                     </div>
                                   ) : (
                                     <div className="space-y-2">
                                       {schedules[doctor.id!].slice(0, 3).map(schedule => (
                                         <div key={schedule.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                           <div className="flex justify-between items-start">
                                             <div>
                                               <p className="font-medium text-sm">{formatDayOfWeek(schedule.dayOfWeek)}</p>
                                               <div className="flex flex-wrap gap-1 mt-1">
                                                 {schedule.timeSlots.map((slot, index) => (
                                                   <Badge key={index} variant="outline" className="text-xs">
                                                     {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                   </Badge>
                                                 ))}
                                               </div>
                                             </div>
                                             <div className="flex gap-1">
                                               <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 onClick={() => {
                                                   setSelectedSchedule(schedule);
                                                   setShowScheduleModal(true);
                                                 }}
                                                 className="h-6 w-6 p-0"
                                               >
                                                 <Edit className="h-3 w-3" />
                                               </Button>
                                               {isAdmin && (
                                                 <Button
                                                   variant="ghost"
                                                   size="sm"
                                                   onClick={() => {
                                                     setSelectedSchedule(schedule);
                                                     setDeleteType('schedule');
                                                     setShowDeleteDialog(true);
                                                   }}
                                                   className="h-6 w-6 p-0 text-red-600"
                                                 >
                                                   <Trash2 className="h-3 w-3" />
                                                 </Button>
                                               )}
                                             </div>
                                           </div>
                                         </div>
                                       ))}
                                       {schedules[doctor.id!].length > 3 && (
                                         <p className="text-xs text-center text-gray-500">
                                           +{schedules[doctor.id!].length - 3} more schedules
                                         </p>
                                       )}
                                     </div>
                                   )}
                                 </TabsContent>
                                 
                                 <TabsContent value="procedures" className="space-y-3">
                                   <div className="flex justify-between items-center">
                                     <h4 className="font-medium text-sm">Assigned Procedures</h4>
                                     <Button 
                                       variant="outline" 
                                       size="sm"
                                       onClick={() => {
                                         setSelectedProcedure(null);
                                         setShowDoctorProcedureModal(true);
                                       }}
                                       className="h-7 text-xs gap-1"
                                     >
                                       <Plus className="h-3 w-3" />
                                       Assign
                                     </Button>
                                   </div>
                                   
                                   {loadingProcedures ? (
                                     <div className="flex justify-center py-4">
                                       <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                     </div>
                                   ) : !doctorProcedures[doctor.id!] || doctorProcedures[doctor.id!].length === 0 ? (
                                     <div className="text-center py-6 bg-white rounded-lg border border-dashed border-gray-200">
                                       <FileText className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                       <p className="text-xs text-gray-500">No procedures</p>
                                     </div>
                                   ) : (
                                     <div className="space-y-2">
                                       {doctorProcedures[doctor.id!].slice(0, 3).map(procedure => (
                                         <div key={procedure.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                           <div className="flex justify-between items-start">
                                             <div className="flex-1">
                                               <p className="font-medium text-sm">{procedure.procedureName}</p>
                                               <div className="flex items-center gap-2 mt-1">
                                                 <span className="text-xs text-gray-600">Total:</span>
                                                 <Badge variant="secondary" className="text-xs">
                                                   {formatCurrency(procedure.doctorCharge)}
                                                 </Badge>
                                               </div>
                                             </div>
                                             <div className="flex gap-1">
                                               <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 onClick={() => {
                                                   setSelectedProcedure(procedure);
                                                   setShowDoctorProcedureModal(true);
                                                 }}
                                                 className="h-6 w-6 p-0"
                                               >
                                                 <Edit className="h-3 w-3" />
                                               </Button>
                                               {isAdmin && (
                                                 <Button
                                                   variant="ghost"
                                                   size="sm"
                                                   onClick={() => {
                                                     setSelectedProcedure(procedure);
                                                     setDeleteType('doctorProcedure');
                                                     setShowDeleteDialog(true);
                                                   }}
                                                   className="h-6 w-6 p-0 text-red-600"
                                                 >
                                                   <Trash2 className="h-3 w-3" />
                                                 </Button>
                                               )}
                                             </div>
                                           </div>
                                         </div>
                                       ))}
                                       {doctorProcedures[doctor.id!].length > 3 && (
                                         <p className="text-xs text-center text-gray-500">
                                           +{doctorProcedures[doctor.id!].length - 3} more procedures
                                         </p>
                                       )}
                                     </div>
                                   )}
                                 </TabsContent>
                               </Tabs>
                             </div>
                           </div>
                         )}
                       </Card>
                     ))}
                   </div>
                 )}

                 {/* List View */}
                 {viewMode === 'list' && (
                   <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                     <Table>
                       <TableHeader className="bg-gray-50/50">
                         <TableRow>
                           <TableHead className="w-[40px]"></TableHead>
                           <TableHead className="font-semibold">Doctor</TableHead>
                           <TableHead className="font-semibold">Specialty</TableHead>
                           <TableHead className="font-semibold">Contact</TableHead>
                           <TableHead className="font-semibold">Status</TableHead>
                           <TableHead className="text-right font-semibold">Actions</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {filteredDoctors.map((doctor) => (
                           <React.Fragment key={doctor.id}>
                             <TableRow 
                               className={`transition-colors hover:bg-gray-50/50 ${
                                 expandedDoctor === doctor.id ? 'bg-blue-50/30 border-b-0' : ''
                               }`}
                             >
                               <TableCell>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   className="h-8 w-8 p-0"
                                   onClick={() => setExpandedDoctor(expandedDoctor === doctor.id ? null : doctor.id)}
                                 >
                                   {expandedDoctor === doctor.id ? (
                                     <ChevronDown className="h-4 w-4" />
                                   ) : (
                                     <ChevronRight className="h-4 w-4" />
                                   )}
                                 </Button>
                               </TableCell>
                               <TableCell>
                                 <div className="flex items-center gap-3">
                                   <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                     <User className="h-5 w-5 text-white" />
                                   </div>
                                   <div>
                                     <p className="font-medium text-gray-900">{doctor.name}</p>
                                     {doctor.description && (
                                       <p className="text-sm text-gray-500 line-clamp-1">{doctor.description}</p>
                                     )}
                                   </div>
                                 </div>
                               </TableCell>
                               <TableCell>
                                 <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                   {doctor.speciality}
                                 </Badge>
                               </TableCell>
                               <TableCell>
                                 <div className="space-y-1">
                                   {doctor.contactNumber ? (
                                     <div className="flex items-center gap-1 text-sm">
                                       <Phone className="h-3 w-3 text-gray-400" />
                                       <span>{doctor.contactNumber}</span>
                                     </div>
                                   ) : (
                                     <span className="text-sm text-gray-400">No phone</span>
                                   )}
                                   {doctor.email && (
                                     <div className="flex items-center gap-1 text-sm text-gray-600">
                                       <Mail className="h-3 w-3 text-gray-400" />
                                       <span className="truncate max-w-[150px]">{doctor.email}</span>
                                     </div>
                                   )}
                                 </div>
                               </TableCell>
                               <TableCell>
                                 <Badge 
                                   variant={doctor.isActive ? "success" : "secondary"}
                                   className={doctor.isActive 
                                     ? "bg-green-100 text-green-700 hover:bg-green-100" 
                                     : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                                   }
                                 >
                                   {doctor.isActive ? "Active" : "Inactive"}
                                 </Badge>
                               </TableCell>
                               <TableCell className="text-right">
                                 <div className="flex items-center justify-end gap-1">
                                   <TooltipProvider>
                                     <Tooltip>
                                       <TooltipTrigger asChild>
                                         <Button
                                           variant="ghost"
                                           size="sm"
                                           onClick={() => {
                                             setSelectedDoctor(doctor);
                                             setShowDoctorModal(true);
                                           }}
                                           className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                         >
                                           <Edit className="h-4 w-4" />
                                         </Button>
                                       </TooltipTrigger>
                                       <TooltipContent>Edit Doctor</TooltipContent>
                                     </Tooltip>
                                   </TooltipProvider>
                                   
                                   {isAdmin && (
                                     <TooltipProvider>
                                       <Tooltip>
                                         <TooltipTrigger asChild>
                                           <Button
                                             variant="ghost"
                                             size="sm"
                                             onClick={() => {
                                               setSelectedDoctor(doctor);
                                               setDeleteType('doctor');
                                               setShowDeleteDialog(true);
                                             }}
                                             className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                           >
                                             <Trash2 className="h-4 w-4" />
                                           </Button>
                                         </TooltipTrigger>
                                         <TooltipContent>Delete Doctor</TooltipContent>
                                       </Tooltip>
                                     </TooltipProvider>
                                   )}
                                 </div>
                               </TableCell>
                             </TableRow>
                             
                             {/* Expanded Details for List View */}
                             {expandedDoctor === doctor.id && (
                               <TableRow className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                                 <TableCell colSpan={6} className="p-0">
                                   <div className="p-6">
                                     <Tabs defaultValue="schedule">
                                       <TabsList className="mb-6">
                                         <TabsTrigger value="schedule" className="gap-2">
                                           <CalendarDays className="h-4 w-4" />
                                           Schedule
                                         </TabsTrigger>
                                         <TabsTrigger value="procedures" className="gap-2">
                                           <FileText className="h-4 w-4" />
                                           Procedures
                                         </TabsTrigger>
                                       </TabsList>
                                       
                                       {/* Schedule Tab Content - Your existing schedule content */}
                                       <TabsContent value="schedule">
                                         <div className="flex justify-between items-center mb-4">
                                           <h3 className="text-lg font-semibold flex items-center gap-2">
                                             <Calendar className="h-5 w-5 text-blue-600" />
                                             Weekly Schedule
                                           </h3>
                                           <Button 
                                             variant="outline" 
                                             size="sm"
                                             onClick={() => {
                                               setSelectedSchedule(null);
                                               setShowScheduleModal(true);
                                             }}
                                             className="gap-2"
                                           >
                                             <Plus className="h-4 w-4" />
                                             Add Time Slot
                                           </Button>
                                         </div>
                                         
                                         {loadingSchedules ? (
                                           <div className="flex justify-center items-center h-24">
                                             <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                           </div>
                                         ) : !schedules[doctor.id!] || schedules[doctor.id!].length === 0 ? (
                                           <div className="text-center p-8 bg-white rounded-lg border border-dashed border-gray-200">
                                             <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                             <h4 className="font-medium text-gray-900 mb-2">No Schedule Found</h4>
                                             <p className="text-gray-500 mb-4">This doctor doesn't have any scheduled time slots yet.</p>
                                             <Button 
                                               variant="outline" 
                                               size="sm" 
                                               onClick={() => {
                                                 setSelectedSchedule(null);
                                                 setShowScheduleModal(true);
                                               }}
                                               className="gap-2"
                                             >
                                               <Plus className="h-4 w-4" />
                                               Add First Schedule
                                             </Button>
                                           </div>
                                         ) : (
                                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                             {schedules[doctor.id!].map(schedule => (
                                               <Card key={schedule.id} className="border border-gray-200">
                                                 <CardContent className="p-4">
                                                   <div className="flex justify-between items-start mb-3">
                                                     <div>
                                                       <h4 className="font-medium text-gray-900">
                                                         {formatDayOfWeek(schedule.dayOfWeek)}
                                                       </h4>
                                                       <Badge 
                                                         variant={schedule.isActive ? "success" : "secondary"}
                                                         className="text-xs mt-1"
                                                       >
                                                         {schedule.isActive ? "Active" : "Inactive"}
                                                       </Badge>
                                                     </div>
                                                     <div className="flex gap-1">
                                                       <Button
                                                         variant="ghost"
                                                         size="sm"
                                                         onClick={() => {
                                                           setSelectedSchedule(schedule);
                                                           setShowScheduleModal(true);
                                                         }}
                                                         className="h-7 w-7 p-0"
                                                       >
                                                         <Edit className="h-3 w-3" />
                                                       </Button>
                                                       {isAdmin && (
                                                         <Button
                                                           variant="ghost"
                                                           size="sm"
                                                           onClick={() => {
                                                             setSelectedSchedule(schedule);
                                                             setDeleteType('schedule');
                                                             setShowDeleteDialog(true);
                                                           }}
                                                           className="h-7 w-7 p-0 text-red-600"
                                                         >
                                                           <Trash2 className="h-3 w-3" />
                                                         </Button>
                                                       )}
                                                     </div>
                                                   </div>
                                                   
                                                   {schedule.timeSlots.length === 0 ? (
                                                     <p className="text-sm text-gray-500">No time slots</p>
                                                   ) : (
                                                     <div className="space-y-2">
                                                       {schedule.timeSlots.map((slot, index) => (
                                                         <div key={index} className="flex items-center gap-2 text-sm">
                                                           <Clock className="h-3 w-3 text-gray-400" />
                                                           <span className="text-gray-700">
                                                             {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                           </span>
                                                         </div>
                                                       ))}
                                                     </div>
                                                   )}
                                                 </CardContent>
                                               </Card>
                                             ))}
                                           </div>
                                         )}
                                       </TabsContent>
                                       
                                       {/* Procedures Tab Content - Your existing procedures content */}
                                       <TabsContent value="procedures">
                                         <div className="flex justify-between items-center mb-4">
                                           <h3 className="text-lg font-semibold flex items-center gap-2">
                                             <FileText className="h-5 w-5 text-green-600" />
                                             Assigned Procedures
                                           </h3>
                                           <Button 
                                             variant="outline" 
                                             size="sm"
                                             onClick={() => {
                                               setSelectedProcedure(null);
                                               setShowDoctorProcedureModal(true);
                                             }}
                                             className="gap-2"
                                           >
                                             <Plus className="h-4 w-4" />
                                             Assign Procedure
                                           </Button>
                                         </div>
                                         
                                         {loadingProcedures ? (
                                           <div className="flex justify-center items-center h-24">
                                             <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                           </div>
                                         ) : !doctorProcedures[doctor.id!] || doctorProcedures[doctor.id!].length === 0 ? (
                                           <div className="text-center p-8 bg-white rounded-lg border border-dashed border-gray-200">
                                             <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                             <h4 className="font-medium text-gray-900 mb-2">No Procedures Assigned</h4>
                                             <p className="text-gray-500 mb-4">This doctor doesn't have any procedures assigned yet.</p>
                                             <Button 
                                               variant="outline" 
                                               size="sm" 
                                               onClick={() => {
                                                 setSelectedProcedure(null);
                                                 setShowDoctorProcedureModal(true);
                                               }}
                                               className="gap-2"
                                             >
                                               <Plus className="h-4 w-4" />
                                               Assign First Procedure
                                             </Button>
                                           </div>
                                         ) : (
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             {doctorProcedures[doctor.id!].map(procedure => (
                                               <Card key={procedure.id} className="border border-gray-200">
                                                 <CardContent className="p-4">
                                                   <div className="flex justify-between items-start mb-3">
                                                     <div className="flex-1">
                                                       <h4 className="font-medium text-gray-900 mb-1">
                                                         {procedure.procedureName}
                                                       </h4>
                                                       <Badge 
                                                         variant={procedure.isActive ? "success" : "secondary"}
                                                         className="text-xs"
                                                       >
                                                         {procedure.isActive ? "Active" : "Inactive"}
                                                       </Badge>
                                                     </div>
                                                     <div className="flex gap-1">
                                                       <Button
                                                         variant="ghost"
                                                         size="sm"
                                                         onClick={() => {
                                                           setSelectedProcedure(procedure);
                                                           setShowDoctorProcedureModal(true);
                                                         }}
                                                         className="h-7 w-7 p-0"
                                                       >
                                                         <Edit className="h-3 w-3" />
                                                       </Button>
                                                       {isAdmin && (
                                                         <Button
                                                           variant="ghost"
                                                           size="sm"
                                                           onClick={() => {
                                                             setSelectedProcedure(procedure);
                                                             setDeleteType('doctorProcedure');
                                                             setShowDeleteDialog(true);
                                                           }}
                                                           className="h-7 w-7 p-0 text-red-600"
                                                         >
                                                           <Trash2 className="h-3 w-3" />
                                                         </Button>
                                                       )}
                                                     </div>
                                                   </div>
                                                   
                                                   <div className="space-y-2 text-sm">
                                                     <div className="flex justify-between items-center">
                                                       <span className="text-gray-600">Doctor Fee:</span>
                                                       <span className="font-medium">{formatCurrency(procedure.doctorCharge)}</span>
                                                     </div>
                                                     <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                                       <span className="font-medium text-gray-900">Total:</span>
                                                       <div className="flex items-center gap-1">
                                                         <DollarSign className="h-3 w-3 text-green-600" />
                                                         <span className="font-bold text-green-700">
                                                           {formatCurrency(procedure.doctorCharge)}
                                                         </span>
                                                       </div>
                                                     </div>
                                                   </div>
                                                 </CardContent>
                                               </Card>
                                             ))}
                                           </div>
                                         )}
                                       </TabsContent>
                                     </Tabs>
                                   </div>
                                 </TableCell>
                               </TableRow>
                             )}
                           </React.Fragment>
                         ))}
                       </TableBody>
                     </Table>
                   </div>
                 )}
               </>
             )}
           </CardContent>
         </Card>
       )}

       {/* Procedures Tab */}
       {activeTab === 'procedures' && (
         <Card className="shadow-lg border-0">
           <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
             <CardTitle className="text-xl font-semibold flex items-center gap-2">
               <FileText className="h-5 w-5 text-green-600" />
               Medical Procedures
             </CardTitle>
           </CardHeader>
           
           <CardContent className="p-6">
             {loadingAllProcedures ? (
               <div className="flex flex-col justify-center items-center h-64">
                 <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
                 <p className="text-gray-600">Loading procedures...</p>
               </div>
             ) : allProcedures.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-center">
                 <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                   <FileText className="h-8 w-8 text-gray-400" />
                 </div>
                 <h3 className="text-lg font-medium text-gray-900 mb-2">No Procedures Found</h3>
                 <p className="text-gray-500 mb-4">Get started by adding your first medical procedure.</p>
                 <Button 
                   onClick={() => setShowProcedureModal(true)}
                   className="gap-2"
                 >
                   <Plus className="h-4 w-4" />
                   Add First Procedure
                 </Button>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {allProcedures.map((procedure) => (
                   <Card key={procedure.id} className="group hover:shadow-lg transition-all duration-200 border-gray-200">
                     <CardHeader className="pb-3">
                       <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                           <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                             <FileText className="h-6 w-6 text-white" />
                           </div>
                           <div>
                             <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                               {procedure.name}
                             </h3>
                             {procedure.category && (
                               <Badge variant="secondary" className="text-xs mt-1">
                                 {procedure.category}
                               </Badge>
                             )}
                           </div>
                         </div>
                         
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                               <MoreVertical className="h-4 w-4" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuLabel>Actions</DropdownMenuLabel>
                             <DropdownMenuItem
                               onClick={() => {
                                 setSelectedProcedureToEdit(procedure);
                                 setShowProcedureModal(true);
                               }}
                             >
                               <Edit className="h-4 w-4 mr-2" />
                               Edit Procedure
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             {isAdmin && (
                               <DropdownMenuItem
                                 onClick={() => {
                                   setSelectedProcedureToDelete(procedure);
                                   setDeleteType('procedure');
                                   setShowDeleteDialog(true);
                                 }}
                                 className="text-red-600"
                               >
                                 <Trash2 className="h-4 w-4 mr-2" />
                                 Delete
                               </DropdownMenuItem>
                             )}
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </div>
                     </CardHeader>
                     
                     <CardContent className="space-y-3">
                       {procedure.description ? (
                         <p className="text-sm text-gray-600 line-clamp-3">
                           {procedure.description}
                         </p>
                       ) : (
                         <p className="text-sm text-gray-400 italic">No description provided</p>
                       )}
                       
                       <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                         {procedure.category ? (
                           <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                             {procedure.category}
                           </Badge>
                         ) : (
                           <Badge variant="outline" className="bg-gray-50 text-gray-500">
                             No Category
                           </Badge>
                         )}
                         
                         <div className="flex gap-1">
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => {
                                     setSelectedProcedureToEdit(procedure);
                                     setShowProcedureModal(true);
                                   }}
                                   className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                                 >
                                   <Edit className="h-4 w-4" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>Edit Procedure</TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                           
                           {isAdmin && (
                             <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => {
                                       setSelectedProcedureToDelete(procedure);
                                       setDeleteType('procedure');
                                       setShowDeleteDialog(true);
                                     }}
                                     className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                   >
                                     <Trash2 className="h-4 w-4" />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>Delete Procedure</TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                           )}
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>
       )}
     </div>
     
     {/* All your existing modals remain the same */}
     {showDoctorModal && (
       <DoctorModal
         doctor={selectedDoctor || undefined}
         onClose={() => {
           setShowDoctorModal(false);
           setSelectedDoctor(null);
         }}
         onSuccess={() => {
           setShowDoctorModal(false);
           setSelectedDoctor(null);
           loadDoctors();
         }}
       />
     )}
     
     {showScheduleModal && (
       <ScheduleModal
         schedule={selectedSchedule || undefined}
         doctorId={selectedDoctor?.id || expandedDoctor || undefined}
         onClose={() => {
           setShowScheduleModal(false);
           setSelectedSchedule(null);
         }}
         onSuccess={() => {
           setShowScheduleModal(false);
           setSelectedSchedule(null);
           toast.success("Schedule saved successfully!");
           refreshExpandedDoctor();
         }}
       />
     )}

     {showProcedureModal && (
       <ProcedureModal
         procedure={selectedProcedureToEdit || undefined}
         onClose={() => {
           setShowProcedureModal(false);
           setSelectedProcedureToEdit(null);
         }}
         onSuccess={() => {
           setShowProcedureModal(false);
           setSelectedProcedureToEdit(null);
           toast.success("Procedure saved successfully!");
           
           if (activeTab === 'procedures') {
             loadAllProcedures();
           }
           refreshExpandedDoctor();
         }}
       />
     )}
     
     {showDoctorProcedureModal && (
       <DoctorProcedureModal
         doctorProcedure={selectedProcedure || undefined}
         doctorId={selectedDoctor?.id || expandedDoctor || undefined}
         onClose={() => {
           setShowDoctorProcedureModal(false);
           setSelectedProcedure(null);
         }}
         onSuccess={() => {
           setShowDoctorProcedureModal(false);
           setSelectedProcedure(null);
           toast.success("Procedure assignment saved successfully!");
           refreshExpandedDoctor();
         }}
       />
     )}
     
     {/* Delete Confirmation Dialog */}
     <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
       <AlertDialogContent className="sm:max-w-md">
         <AlertDialogHeader>
           <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
               <AlertTriangle className="h-5 w-5 text-red-600" />
             </div>
             <div>
               <AlertDialogTitle className="text-lg">Confirm Deletion</AlertDialogTitle>
             </div>
           </div>
         </AlertDialogHeader>
         
         <AlertDialogDescription className="text-gray-600">
           This action cannot be undone. This will permanently delete{' '}
           {deleteType === 'doctor' && selectedDoctor && (
             <span className="font-medium text-gray-900">Dr. {selectedDoctor.name}</span>
           )}
           {deleteType === 'schedule' && selectedSchedule && (
             <span className="font-medium text-gray-900">the schedule for {formatDayOfWeek(selectedSchedule.dayOfWeek)}</span>
           )}
           {deleteType === 'doctorProcedure' && selectedProcedure && (
             <span className="font-medium text-gray-900">the procedure "{selectedProcedure.procedureName}"</span>
           )}
           {deleteType === 'procedure' && selectedProcedureToDelete && (
             <span className="font-medium text-gray-900">the procedure "{selectedProcedureToDelete.name}"</span>
           )}
           .
         </AlertDialogDescription>
         
         <AlertDialogFooter className="gap-2">
           <AlertDialogCancel className="h-10">Cancel</AlertDialogCancel>
           <AlertDialogAction
             className="bg-red-600 hover:bg-red-700 h-10"
             onClick={() => {
               if (deleteType === 'doctor' && selectedDoctor?.id) {
                 handleDeleteDoctor(selectedDoctor.id);
               } else if (deleteType === 'schedule' && selectedSchedule?.id) {
                 handleDeleteSchedule(selectedSchedule.id);
               } else if (deleteType === 'doctorProcedure' && selectedProcedure?.id) {
                 handleDeleteDoctorProcedure(selectedProcedure.id);
               } else if (deleteType === 'procedure' && selectedProcedureToDelete?.id) {
                 handleDeleteProcedure(selectedProcedureToDelete.id);
               }
             }}
           >
             <Trash2 className="h-4 w-4 mr-2" />
             Delete
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
     
     {/* Test Toaster - Remove this after testing */}
     <Toaster 
       position="top-right"
       expand={true}
       richColors={true}
       closeButton={true}
       toastOptions={{
         style: {
           zIndex: 9999,
           background: 'white',
           border: '1px solid #e5e7eb',
         },
       }}
     />
   </DashboardLayout>
 );
}

export default withAuth(DoctorsPage);