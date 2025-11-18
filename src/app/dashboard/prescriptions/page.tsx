'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { prescriptionService } from '@/services/prescriptionService';
import { appointmentService } from '@/services/appointmentService';
import { Prescription } from '@/types/prescription';
import { Appointment } from '@/types/appointment';
import DashboardLayout from '@/components/DashboardLayout';
import withAuth from '@/components/withAuth';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Phone, 
  Eye, 
  Printer, 
  Download,
  FileText,
  Image as ImageIcon,
  Pill,
  Stethoscope,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  MoreVertical,
  Heart,
  Activity,
  TrendingUp,
  Users,
  Calendar as CalendarIcon,
  Sparkles,
  BookOpen,
  Shield,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { prescriptionPrintService } from '@/services/prescriptionPrintService';
import { toast } from '@/hooks/use-toast';

interface PrescriptionWithAppointment extends Prescription {
  appointment?: Appointment;
}

function PrescriptionsPage() {
  const { user, userRole } = useAuth();
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithAppointment[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<PrescriptionWithAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithAppointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [doctors, setDoctors] = useState<string[]>([]);
  const [printing, setPrinting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalPrescriptions: 0,
    todayPrescriptions: 0,
    totalMedicines: 0,
    totalImages: 0
  });

  // Load prescriptions data
  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      
      // Get all prescriptions
      const allPrescriptions: PrescriptionWithAppointment[] = [];
      
      // For doctors, only show their prescriptions
      if (userRole === 'doctor' && user?.uid) {
        const doctorPrescriptions = await prescriptionService.getPrescriptionsByDoctorId(user.uid);
        
        for (const prescription of doctorPrescriptions) {
          const appointment = await appointmentService.getAppointmentById(prescription.appointmentId);
          allPrescriptions.push({
            ...prescription,
            appointment
          });
        }
      } else {
        // For admins, show all prescriptions
        // We need to get all prescriptions by getting all appointments first
        const allAppointments = await appointmentService.getAllAppointments();
        
        for (const appointment of allAppointments) {
          const prescription = await prescriptionService.getPrescriptionByAppointmentId(appointment.id!);
          if (prescription) {
            allPrescriptions.push({
              ...prescription,
              appointment
            });
          }
        }
      }

      setPrescriptions(allPrescriptions);
      
      // Extract unique doctors
      const uniqueDoctors = Array.from(new Set(allPrescriptions.map(p => p.doctorName)));
      setDoctors(uniqueDoctors);
      
      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayPrescriptions = allPrescriptions.filter(p => {
        let prescriptionDate: Date;
        if (p.createdAt instanceof Date) {
          prescriptionDate = p.createdAt;
        } else if (typeof p.createdAt === 'string') {
          prescriptionDate = new Date(p.createdAt);
        } else if (p.createdAt && typeof p.createdAt === 'object' && 'seconds' in p.createdAt) {
          prescriptionDate = new Date(p.createdAt.seconds * 1000);
        } else {
          return false;
        }
        return prescriptionDate >= today;
      }).length;
      
      const totalMedicines = allPrescriptions.reduce((sum, p) => sum + p.medicines.length, 0);
      const totalImages = allPrescriptions.reduce((sum, p) => sum + (p.images?.length || 0), 0);
      
      setStats({
        totalPrescriptions: allPrescriptions.length,
        todayPrescriptions,
        totalMedicines,
        totalImages
      });
      
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort prescriptions
  useEffect(() => {
    let filtered = [...prescriptions];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.patientName.toLowerCase().includes(searchLower) ||
        p.patientId.toLowerCase().includes(searchLower) ||
        p.appointment?.patientContact?.toLowerCase().includes(searchLower) ||
        p.medicines.some(m => m.medicineName.toLowerCase().includes(searchLower))
      );
    }

    // Doctor filter
    if (selectedDoctor !== 'all') {
      filtered = filtered.filter(p => p.doctorName === selectedDoctor);
    }

    // Date range filter
    if (selectedDateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(p => {
        let prescriptionDate: Date;
        
        if (p.createdAt instanceof Date) {
          prescriptionDate = p.createdAt;
        } else if (typeof p.createdAt === 'string') {
          prescriptionDate = new Date(p.createdAt);
        } else if (p.createdAt && typeof p.createdAt === 'object' && 'seconds' in p.createdAt) {
          prescriptionDate = new Date(p.createdAt.seconds * 1000);
        } else {
          return true; // Skip if no valid date
        }
        
        switch (selectedDateRange) {
          case 'today':
            return prescriptionDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return prescriptionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return prescriptionDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
        case 'oldest': {
          let dateA: Date, dateB: Date;
          
          if (a.createdAt instanceof Date) {
            dateA = a.createdAt;
          } else if (typeof a.createdAt === 'string') {
            dateA = new Date(a.createdAt);
          } else if (a.createdAt && typeof a.createdAt === 'object' && 'seconds' in a.createdAt) {
            dateA = new Date(a.createdAt.seconds * 1000);
          } else {
            dateA = new Date(0);
          }
          
          if (b.createdAt instanceof Date) {
            dateB = b.createdAt;
          } else if (typeof b.createdAt === 'string') {
            dateB = new Date(b.createdAt);
          } else if (b.createdAt && typeof b.createdAt === 'object' && 'seconds' in b.createdAt) {
            dateB = new Date(b.createdAt.seconds * 1000);
          } else {
            dateB = new Date(0);
          }
          
          return sortBy === 'newest' 
            ? dateB.getTime() - dateA.getTime()
            : dateA.getTime() - dateB.getTime();
        }
        case 'patient':
          return a.patientName.localeCompare(b.patientName);
        case 'doctor':
          return a.doctorName.localeCompare(b.doctorName);
        default:
          return 0;
      }
    });

    setFilteredPrescriptions(filtered);
  }, [prescriptions, searchTerm, selectedDoctor, selectedDateRange, sortBy]);

  const handlePrintPrescription = async (prescription: PrescriptionWithAppointment, type: 'full' | 'written') => {
    if (!prescription.appointment) {
      toast({
        title: "Error",
        description: "Appointment data not found",
        variant: "destructive",
      });
      return;
    }

    setPrinting(prescription.id!);
    
    try {
      let success = false;
      
      if (type === 'full') {
        success = await prescriptionPrintService.printFullPrescription(
          prescription.appointment, 
          prescription
        );
      } else {
        success = await prescriptionPrintService.printWrittenMedicinesOnly(
          prescription.appointment, 
          prescription
        );
      }

      if (success) {
        toast({
          title: "Success",
          description: `Prescription ${type === 'full' ? '' : '(written medicines only) '}sent to printer`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to print prescription",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Error",
        description: "Failed to print prescription",
        variant: "destructive",
      });
    } finally {
      setPrinting(null);
    }
  };

  const formatDate = (date: Date | string | any) => {
    let d: Date;
    
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else if (date && typeof date === 'object' && 'seconds' in date) {
      // Firebase Timestamp
      d = new Date(date.seconds * 1000);
    } else {
      d = new Date();
    }
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMedicineCount = (prescription: Prescription) => {
    const inventoryCount = (prescription.medicines || []).filter(m => m.source === 'inventory').length;
    const writtenCount = (prescription.medicines || []).filter(m => m.source === 'written').length;
    return { inventoryCount, writtenCount, total: prescription.medicines?.length || 0 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading prescriptions...</span>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="space-y-8 p-6">
          {/* Enhanced Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight">Prescriptions</h1>
                      <p className="text-blue-100 text-lg">
                        Comprehensive prescription management system
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-semibold">{filteredPrescriptions.length} Active</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm">
                    <TrendingUp className="h-5 w-5" />
                    <span className="font-semibold">{stats.todayPrescriptions} Today</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10"></div>
            <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-white/5"></div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Total Prescriptions</p>
                    <p className="text-3xl font-bold">{stats.totalPrescriptions}</p>
                  </div>
                  <div className="rounded-xl bg-white/20 p-3">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Today's Prescriptions</p>
                    <p className="text-3xl font-bold">{stats.todayPrescriptions}</p>
                  </div>
                  <div className="rounded-xl bg-white/20 p-3">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Medicines</p>
                    <p className="text-3xl font-bold">{stats.totalMedicines}</p>
                  </div>
                  <div className="rounded-xl bg-white/20 p-3">
                    <Pill className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Attached Images</p>
                    <p className="text-3xl font-bold">{stats.totalImages}</p>
                  </div>
                  <div className="rounded-xl bg-white/20 p-3">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Search and Filters */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Search Bar */}
                <div className="flex-1 max-w-2xl">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      placeholder="Search by patient name, phone number, or medicine..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-2xl bg-white/50 backdrop-blur-sm transition-all duration-300"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        viewMode === 'grid' 
                          ? 'bg-white shadow-sm text-blue-600' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        viewMode === 'list' 
                          ? 'bg-white shadow-sm text-blue-600' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Filter Toggle */}
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="rounded-xl border-2 hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Doctor Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        Doctor
                      </label>
                      <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                        <SelectTrigger className="rounded-xl border-2 focus:border-blue-500">
                          <SelectValue placeholder="All Doctors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Doctors</SelectItem>
                          {doctors.map(doctor => (
                            <SelectItem key={doctor} value={doctor}>
                              {doctor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Date Range
                      </label>
                      <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                        <SelectTrigger className="rounded-xl border-2 focus:border-blue-500">
                          <SelectValue placeholder="All Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <SortAsc className="h-4 w-4" />
                        Sort By
                      </label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="rounded-xl border-2 focus:border-blue-500">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="patient">Patient Name</SelectItem>
                          <SelectItem value="doctor">Doctor Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clear Filters */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Actions</label>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedDoctor('all');
                          setSelectedDateRange('all');
                          setSortBy('newest');
                        }}
                        className="w-full rounded-xl border-2 hover:border-red-500 hover:text-red-600 transition-all duration-200"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescriptions List */}
          {filteredPrescriptions.length === 0 ? (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-16 text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50"></div>
                  <div className="relative bg-white rounded-3xl p-8 shadow-2xl">
                    <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No prescriptions found</h3>
                    <p className="text-gray-600 text-lg mb-6">
                      {searchTerm || selectedDoctor !== 'all' || selectedDateRange !== 'all'
                        ? 'Try adjusting your search criteria to find prescriptions'
                        : 'No prescriptions have been created yet'
                      }
                    </p>
                    {(searchTerm || selectedDoctor !== 'all' || selectedDateRange !== 'all') && (
                      <Button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedDoctor('all');
                          setSelectedDateRange('all');
                          setSortBy('newest');
                        }}
                        className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">Prescriptions</h2>
                  <Badge variant="outline" className="text-sm px-3 py-1 rounded-full">
                    {filteredPrescriptions.length} result{filteredPrescriptions.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              {/* Prescriptions Grid/List */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPrescriptions.map((prescription) => {
                    const medicineCount = getMedicineCount(prescription);
                    
                    return (
                      <Card key={prescription.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-0">
                          {/* Card Header */}
                          <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative z-10">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold mb-1">{prescription.patientName}</h3>
                                  <p className="text-blue-100 text-sm">{prescription.appointment?.patientContact || 'No contact'}</p>
                                </div>
                                <div className="rounded-full bg-white/20 p-2">
                                  <Heart className="h-5 w-5" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-6 space-y-4">
                            {/* Doctor & Date */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Stethoscope className="h-4 w-4" />
                                <span className="font-medium">{prescription.doctorName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(prescription.createdAt!)}</span>
                              </div>
                            </div>

                            {/* Medicine Stats */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3">
                                <div className="flex items-center gap-2">
                                  <Pill className="h-4 w-4 text-emerald-600" />
                                  <span className="text-sm font-medium text-emerald-700">Medicines</span>
                                </div>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">{medicineCount.total}</p>
                                {medicineCount.inventoryCount > 0 && medicineCount.writtenCount > 0 && (
                                  <p className="text-xs text-emerald-500 mt-1">
                                    {medicineCount.inventoryCount} inventory, {medicineCount.writtenCount} written
                                  </p>
                                )}
                              </div>
                              
                              {prescription.images && prescription.images.length > 0 && (
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3">
                                  <div className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-700">Images</span>
                                  </div>
                                  <p className="text-2xl font-bold text-purple-600 mt-1">{prescription.images.length}</p>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPrescription(prescription);
                                  setShowDetailsModal(true);
                                }}
                                className="flex-1 rounded-xl border-2 hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="rounded-xl border-2 hover:border-green-500 hover:text-green-600 transition-all duration-200">
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                  <DropdownMenuItem
                                    onClick={() => handlePrintPrescription(prescription, 'full')}
                                    disabled={printing === prescription.id}
                                    className="rounded-lg"
                                  >
                                    {printing === prescription.id ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <FileText className="h-4 w-4 mr-2" />
                                    )}
                                    Full Prescription
                                  </DropdownMenuItem>
                                  {medicineCount.writtenCount > 0 && (
                                    <DropdownMenuItem
                                      onClick={() => handlePrintPrescription(prescription, 'written')}
                                      disabled={printing === prescription.id}
                                      className="rounded-lg"
                                    >
                                      {printing === prescription.id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Pill className="h-4 w-4 mr-2" />
                                      )}
                                      Written Medicines
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPrescriptions.map((prescription) => {
                    const medicineCount = getMedicineCount(prescription);
                    
                    return (
                      <Card key={prescription.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            {/* Patient Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-3">
                                  <User className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">{prescription.patientName}</h3>
                                  <p className="text-gray-600">{prescription.appointment?.patientContact || 'No contact'}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Stethoscope className="h-4 w-4" />
                                  <span className="font-medium">{prescription.doctorName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(prescription.createdAt!)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Pill className="h-4 w-4" />
                                  <span>
                                    {medicineCount.total} medicine{medicineCount.total !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                {prescription.images && prescription.images.length > 0 && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <ImageIcon className="h-4 w-4" />
                                    <span>{prescription.images.length} image{prescription.images.length !== 1 ? 's' : ''}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPrescription(prescription);
                                  setShowDetailsModal(true);
                                }}
                                className="rounded-xl border-2 hover:border-blue-500 hover:text-blue-600 transition-all duration-200"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="rounded-xl border-2 hover:border-green-500 hover:text-green-600 transition-all duration-200">
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                  <DropdownMenuItem
                                    onClick={() => handlePrintPrescription(prescription, 'full')}
                                    disabled={printing === prescription.id}
                                    className="rounded-lg"
                                  >
                                    {printing === prescription.id ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <FileText className="h-4 w-4 mr-2" />
                                    )}
                                    Full Prescription
                                  </DropdownMenuItem>
                                  {medicineCount.writtenCount > 0 && (
                                    <DropdownMenuItem
                                      onClick={() => handlePrintPrescription(prescription, 'written')}
                                      disabled={printing === prescription.id}
                                      className="rounded-lg"
                                    >
                                      {printing === prescription.id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Pill className="h-4 w-4 mr-2" />
                                      )}
                                      Written Medicines Only
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Enhanced Prescription Details Modal */}
          <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto border-0 shadow-2xl">
              <DialogHeader className="pb-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 p-3">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-gray-900">Prescription Details</DialogTitle>
                    <p className="text-gray-600 mt-1">Complete prescription information and medical records</p>
                  </div>
                </div>
              </DialogHeader>
          
              {selectedPrescription && (
                <div className="space-y-8">
                  {/* Patient & Appointment Info */}
                  <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-2">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        Patient Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Patient Name
                          </label>
                          <p className="text-xl font-bold text-gray-900">{selectedPrescription.patientName}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Contact Number
                          </label>
                          <p className="text-xl font-semibold text-gray-900">{selectedPrescription.appointment?.patientContact || 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            Doctor
                          </label>
                          <p className="text-xl font-semibold text-gray-900">{selectedPrescription.doctorName}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date
                          </label>
                          <p className="text-xl font-semibold text-gray-900">{formatDate(selectedPrescription.createdAt!)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Medical History */}
                  {selectedPrescription.medicalHistory && (
                    <Card className="border-0 shadow-xl bg-gradient-to-r from-amber-50 to-orange-50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-2">
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                          Medical History
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedPrescription.medicalHistory.pastMedicalHistory && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                              <Heart className="h-4 w-4" />
                              Past Medical History
                            </label>
                            <p className="text-gray-900 text-lg">{selectedPrescription.medicalHistory.pastMedicalHistory}</p>
                          </div>
                        )}
                        
                        {selectedPrescription.medicalHistory.surgicalHistory && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                              <Activity className="h-4 w-4" />
                              Surgical History
                            </label>
                            <p className="text-gray-900 text-lg">{selectedPrescription.medicalHistory.surgicalHistory}</p>
                          </div>
                        )}
                        
                        {selectedPrescription.medicalHistory.currentMedications && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                              <Pill className="h-4 w-4" />
                              Current Medications
                            </label>
                            <p className="text-gray-900 text-lg">{selectedPrescription.medicalHistory.currentMedications}</p>
                          </div>
                        )}
                        
                        {selectedPrescription.medicalHistory.allergies && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4" />
                              Allergies
                            </label>
                            <p className="text-gray-900 text-lg">{selectedPrescription.medicalHistory.allergies}</p>
                          </div>
                        )}
                        
                        {selectedPrescription.medicalHistory.familyHistory && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4" />
                              Family History
                            </label>
                            <p className="text-gray-900 text-lg">{selectedPrescription.medicalHistory.familyHistory}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Presenting Complaint */}
                  {selectedPrescription.presentingComplaint && (
                    <Card className="border-0 shadow-xl bg-gradient-to-r from-red-50 to-pink-50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="rounded-xl bg-gradient-to-r from-red-500 to-pink-600 p-2">
                            <Heart className="h-5 w-5 text-white" />
                          </div>
                          Presenting Complaint
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                          <p className="text-gray-900 text-lg leading-relaxed">{selectedPrescription.presentingComplaint}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* On Examination */}
                  {selectedPrescription.onExamination && (
                    <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-50 to-teal-50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-2">
                            <Stethoscope className="h-5 w-5 text-white" />
                          </div>
                          On Examination
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedPrescription.onExamination.temperature && (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">Temperature</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.onExamination.temperature}</p>
                              </div>
                            )}
                            {selectedPrescription.onExamination.bloodPressure && (
                              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">Blood Pressure</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.onExamination.bloodPressure}</p>
                              </div>
                            )}
                            {selectedPrescription.onExamination.heartRate && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">Heart Rate</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.onExamination.heartRate}</p>
                              </div>
                            )}
                            {selectedPrescription.onExamination.respiratoryRate && (
                              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">Respiratory Rate</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.onExamination.respiratoryRate}</p>
                              </div>
                            )}
                            {selectedPrescription.onExamination.oxygenSaturation && (
                              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">Oxygen Saturation</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.onExamination.oxygenSaturation}</p>
                              </div>
                            )}
                            {selectedPrescription.onExamination.other && (
                              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3 md:col-span-2 lg:col-span-3">
                                <p className="text-sm text-gray-600">Other Findings</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.onExamination.other}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Lab Results */}
                  {selectedPrescription.labResults && (
                    <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-50 to-purple-50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-2">
                            <Activity className="h-5 w-5 text-white" />
                          </div>
                          Lab Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedPrescription.labResults.tsh && (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">TSH</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.labResults.tsh}</p>
                              </div>
                            )}
                            {selectedPrescription.labResults.hba1c && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">HbA1c</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.labResults.hba1c}</p>
                              </div>
                            )}
                            {selectedPrescription.labResults.ldl && (
                              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">LDL</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.labResults.ldl}</p>
                              </div>
                            )}
                            {selectedPrescription.labResults.cholesterol && (
                              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">Total Cholesterol</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.labResults.cholesterol}</p>
                              </div>
                            )}
                            {selectedPrescription.labResults.glucose && (
                              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">Glucose</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.labResults.glucose}</p>
                              </div>
                            )}
                            {selectedPrescription.labResults.creatinine && (
                              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">Creatinine</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.labResults.creatinine}</p>
                              </div>
                            )}
                            {selectedPrescription.labResults.other && (
                              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-3 md:col-span-2 lg:col-span-3">
                                <p className="text-sm text-gray-600">Other Lab Results</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.labResults.other}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Investigations */}
                  {selectedPrescription.investigations && (
                    <Card className="border-0 shadow-xl bg-gradient-to-r from-cyan-50 to-blue-50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 p-2">
                            <Zap className="h-5 w-5 text-white" />
                          </div>
                          Investigations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedPrescription.investigations.ecg && (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">ECG</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.investigations.ecg}</p>
                              </div>
                            )}
                            {selectedPrescription.investigations.echo && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">Echocardiogram</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.investigations.echo}</p>
                              </div>
                            )}
                            {selectedPrescription.investigations.xray && (
                              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">X-Ray</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.investigations.xray}</p>
                              </div>
                            )}
                            {selectedPrescription.investigations.ct && (
                              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">CT Scan</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.investigations.ct}</p>
                              </div>
                            )}
                            {selectedPrescription.investigations.mri && (
                              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600">MRI</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.investigations.mri}</p>
                              </div>
                            )}
                            {selectedPrescription.investigations.other && (
                              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-3 md:col-span-2">
                                <p className="text-sm text-gray-600">Other Investigations</p>
                                <p className="font-semibold text-gray-900">{selectedPrescription.investigations.other}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Medical Tests */}
                  {selectedPrescription.medicalTests && selectedPrescription.medicalTests.length > 0 && (
                    <Card className="border-0 shadow-xl bg-gradient-to-r from-violet-50 to-purple-50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 p-2">
                            <Activity className="h-5 w-5 text-white" />
                          </div>
                          Medical Tests
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedPrescription.medicalTests.map((test, index) => (
                            <div key={test.id} className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-violet-500">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-bold text-lg text-gray-900">
                                  {index + 1}. {test.testName}
                                </h4>
                                <div className="flex gap-2">
                                  {test.urgency && (
                                    <Badge 
                                      variant={test.urgency === 'stat' ? 'destructive' : test.urgency === 'urgent' ? 'default' : 'secondary'}
                                      className="px-2 py-1 text-xs"
                                    >
                                      {test.urgency.toUpperCase()}
                                    </Badge>
                                  )}
                                  {test.fastingRequired && (
                                    <Badge variant="outline" className="px-2 py-1 text-xs border-orange-200 text-orange-800">
                                      Fasting Required
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {test.testType && (
                                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                                    <span className="font-semibold text-gray-600 text-sm">Test Type</span>
                                    <p className="text-gray-900 font-medium">{test.testType}</p>
                                  </div>
                                )}
                                {test.instructions && (
                                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3">
                                    <span className="font-semibold text-gray-600 text-sm">Instructions</span>
                                    <p className="text-gray-900 font-medium">{test.instructions}</p>
                                  </div>
                                )}
                                {test.fastingInstructions && (
                                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 md:col-span-2">
                                    <span className="font-semibold text-gray-600 text-sm">Fasting Instructions</span>
                                    <p className="text-gray-900 font-medium">{test.fastingInstructions}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Diagnosis */}
                  {selectedPrescription.diagnosis && (
                    <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-50 to-teal-50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-2">
                            <Shield className="h-5 w-5 text-white" />
                          </div>
                          Diagnosis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                          <p className="text-gray-900 text-lg font-semibold leading-relaxed">{selectedPrescription.diagnosis}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Next Visit Date */}
                  {selectedPrescription.nextVisitDate && (
                    <Card className="border-0 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 p-2">
                            <CalendarIcon className="h-5 w-5 text-white" />
                          </div>
                          Next Visit
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                          <div className="flex items-center gap-3">
                            <CalendarIcon className="h-6 w-6 text-green-600" />
                            <div>
                              <p className="text-sm text-gray-600">Scheduled for</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {new Date(selectedPrescription.nextVisitDate).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Medicines */}
                  <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 p-2">
                          <Pill className="h-5 w-5 text-white" />
                        </div>
                        Prescribed Medicines
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {selectedPrescription.medicines.map((medicine, index) => (
                          <div key={medicine.id} className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-l-purple-500">
                            <div className="flex items-start justify-between mb-4">
                              <h4 className="font-bold text-xl text-gray-900">
                                {index + 1}. {medicine.medicineName}
                              </h4>
                              <Badge 
                                variant={medicine.source === 'inventory' ? 'default' : 'secondary'}
                                className={`px-3 py-1 rounded-full ${
                                  medicine.source === 'inventory' 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : 'bg-orange-100 text-orange-800 border-orange-200'
                                }`}
                              >
                                {medicine.source === 'inventory' ? 'Inventory' : 'Written'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                                  <span className="font-semibold text-gray-600 text-sm">Dosage</span>
                                  <p className="text-gray-900 text-lg font-medium">{medicine.dosage}</p>
                                </div>
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4">
                                  <span className="font-semibold text-gray-600 text-sm">Frequency</span>
                                  <p className="text-gray-900 text-lg font-medium">{medicine.frequency}</p>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
                                  <span className="font-semibold text-gray-600 text-sm">Duration</span>
                                  <p className="text-gray-900 text-lg font-medium">{medicine.duration}</p>
                                </div>
                                {medicine.instructions && (
                                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4">
                                    <span className="font-semibold text-gray-600 text-sm">Instructions</span>
                                    <p className="text-gray-900 text-lg font-medium">{medicine.instructions}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Images */}
                  {selectedPrescription.images && selectedPrescription.images.length > 0 && (
                    <Card className="border-0 shadow-xl bg-gradient-to-r from-orange-50 to-red-50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 p-2">
                            <ImageIcon className="h-5 w-5 text-white" />
                          </div>
                          Attached Images
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {selectedPrescription.images.map((image) => (
                            <div key={image.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                              <img
                                src={image.downloadURL}
                                alt={image.description || image.originalName}
                                className="w-full h-48 object-cover"
                              />
                              <div className="p-4">
                                <p className="text-sm font-semibold text-gray-900 truncate">{image.originalName}</p>
                                {image.description && (
                                  <p className="text-xs text-gray-600 mt-2">{image.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Notes */}
                  {selectedPrescription.notes && (
                    <Card className="border-0 shadow-xl bg-gradient-to-r from-gray-50 to-slate-50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="rounded-xl bg-gradient-to-r from-gray-500 to-slate-600 p-2">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          Additional Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                          <p className="text-gray-900 text-lg whitespace-pre-wrap leading-relaxed">{selectedPrescription.notes}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => handlePrintPrescription(selectedPrescription, 'full')}
                      disabled={printing === selectedPrescription.id}
                      className="rounded-xl border-2 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 px-6 py-3"
                    >
                      {printing === selectedPrescription.id ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <Printer className="h-5 w-5 mr-2" />
                      )}
                      Print Full Prescription
                    </Button>
                    
                    {getMedicineCount(selectedPrescription).writtenCount > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => handlePrintPrescription(selectedPrescription, 'written')}
                        disabled={printing === selectedPrescription.id}
                        className="rounded-xl border-2 hover:border-green-500 hover:text-green-600 transition-all duration-200 px-6 py-3"
                      >
                        {printing === selectedPrescription.id ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                          <Pill className="h-5 w-5 mr-2" />
                        )}
                        Print Written Medicines
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(PrescriptionsPage);
