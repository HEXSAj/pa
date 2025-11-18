// src/app/dashboard/pharmacyPOS/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft,
  Pill,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  ShoppingCart,
  User,
  Stethoscope,
  Phone,
  X,
  Plus,
  Minus,
  Trash2,
  Save,
  Edit3,
  Search,
  LogOut,
  LayoutDashboard,
  UserCircle2,
  Archive,
  ChevronDown,
  ChevronUp,
  PackageX
} from 'lucide-react';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import withAuth from '@/components/withAuth';
import { useAuth } from '@/context/AuthContext';
import { appointmentService } from '@/services/appointmentService';
import { prescriptionService } from '@/services/prescriptionService';
import { inventoryService } from '@/services/inventoryService';
import { format } from 'date-fns';
import { Appointment, getSessionTimeFromId } from '@/types/appointment';
import { Prescription } from '@/types/prescription';
import { PharmacyPOS } from '../pos/PharmacyPOS';
import { EnhancedPOSItemSearch } from '../pos/EnhancedPOSItemSearch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'firebase/auth';
import { auth, database } from '@/lib/firebase';
import { staffService } from '@/services/staffService';
import { ref, query, orderByChild, equalTo, onValue, off } from 'firebase/database';

// Custom DialogContent without close button
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
CustomDialogContent.displayName = "CustomDialogContent";

// Medicine Table Row Component
interface MedicineTableRowProps {
  medicine: any;
  isEditing: boolean;
  canEdit: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (updatedMedicine: any) => void;
  onRemove: () => void;
}

function MedicineTableRow({ 
  medicine, 
  isEditing, 
  canEdit, 
  onStartEdit, 
  onCancelEdit, 
  onSaveEdit, 
  onRemove 
}: MedicineTableRowProps) {
  const [editedMedicine, setEditedMedicine] = useState(medicine);

  const handleSave = () => {
    onSaveEdit({
      ...editedMedicine,
      pharmacyEdited: editedMedicine.drugCount !== medicine.originalDrugCount
    });
  };

  const handleQuantityChange = (newQuantity: number) => {
    setEditedMedicine(prev => ({ ...prev, drugCount: Math.max(0, newQuantity) }));
  };

  if (isEditing) {
    return (
      <TableRow className="bg-blue-50">
        <TableCell className="font-medium">{medicine.medicineName}</TableCell>
        <TableCell>{medicine.dose}</TableCell>
        <TableCell>{medicine.frequency}</TableCell>
        <TableCell>{medicine.days} days</TableCell>
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(editedMedicine.drugCount - 1)}
              disabled={!canEdit || editedMedicine.drugCount <= 0}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={editedMedicine.drugCount}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
              className="w-16 h-8 text-center"
              min="0"
              disabled={!canEdit}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(editedMedicine.drugCount + 1)}
              disabled={!canEdit}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Badge className="bg-green-100 text-green-800">Issued</Badge>
        </TableCell>
        <TableCell className="text-center">
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!canEdit}
              className="h-8 px-3"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelEdit}
              className="h-8 px-3"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="hover:bg-slate-50">
      <TableCell className="font-medium">{medicine.medicineName}</TableCell>
      <TableCell>{medicine.dose}</TableCell>
      <TableCell>{medicine.frequency}</TableCell>
      <TableCell>{medicine.days} days</TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="font-semibold">{medicine.drugCount}</span>
          {medicine.pharmacyEdited && (
            <Badge variant="outline" className="text-xs text-orange-600 bg-orange-100">
              Edited
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge className="bg-green-100 text-green-800">Issued</Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onStartEdit}
            disabled={!canEdit}
            className="h-8 px-3"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={!canEdit || medicine.source === 'prescription'}
            className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface AppointmentWithPrescription {
  appointment: Appointment;
  prescription: Prescription | null;
  hasInventoryMedicines: boolean;
  inventoryMedicineCount: number;
}

function PharmacyPOSPage() {
  const router = useRouter();
  const { user, userRole, logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentWithPrescription[]>([]);
  const [allAppointments, setAllAppointments] = useState<AppointmentWithPrescription[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [showPharmacyPOS, setShowPharmacyPOS] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPrescription | null>(null);
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<any>(null);
  const [editedMedicines, setEditedMedicines] = useState<any[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [showAddMedicineDialog, setShowAddMedicineDialog] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedMedicineForAdd, setSelectedMedicineForAdd] = useState<any>(null);
  const [addQuantity, setAddQuantity] = useState(1);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [selectedMedicineIds, setSelectedMedicineIds] = useState<Set<string>>(new Set());
  const [showArchivedAppointments, setShowArchivedAppointments] = useState(false);

  // Real-time listener for selected date's appointments with prescriptions
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const filterDate = selectedDate || new Date().toISOString().split('T')[0]; // Use selected date or today
    
    // Map to store prescription listener refs
    const prescriptionRefs = new Map<string, any>();
    const appointmentDataMap = new Map<string, Appointment>();
    
    // Set up real-time listener for selected date's appointments
    const appointmentsRef = ref(database, 'appointments');
    const appointmentsQuery = query(appointmentsRef, orderByChild('date'), equalTo(filterDate));
    
    const handleAppointmentsUpdate = (snapshot: any) => {
      const appointmentsData = snapshot.val();
      console.log('Real-time update: Appointments changed', {
        count: appointmentsData ? Object.keys(appointmentsData).length : 0,
        filterDate: filterDate
      });
      
      if (!appointmentsData) {
        setAllAppointments([]);
        setLoading(false);
        return;
      }
      
      const currentAppointmentIds = new Set<string>();
      
      // Process each appointment
      Object.entries(appointmentsData).forEach(([appointmentId, appointmentValue]: [string, any]) => {
        const appointmentData = { id: appointmentId, ...appointmentValue } as Appointment;
        currentAppointmentIds.add(appointmentId);
        appointmentDataMap.set(appointmentId, appointmentData);
        
        // Set up prescription listener if it doesn't exist yet
        if (!prescriptionRefs.has(appointmentId)) {
          const prescriptionsRef = ref(database, 'prescriptions');
          const prescriptionQuery = query(prescriptionsRef, orderByChild('appointmentId'), equalTo(appointmentId));
          
          const handlePrescriptionUpdate = (prescriptionSnapshot: any) => {
            const prescriptionsData = prescriptionSnapshot.val();
            let prescription: Prescription | null = null;
            
            if (prescriptionsData) {
              // Get the first prescription (there should only be one per appointment)
              const prescriptionId = Object.keys(prescriptionsData)[0];
              prescription = { id: prescriptionId, ...prescriptionsData[prescriptionId] } as Prescription;
            }
            
            // Get the latest appointment data
            const latestAppointmentData = appointmentDataMap.get(appointmentId) || appointmentData;
            
            // Check if prescription has inventory medicines
            let hasInventoryMedicines = false;
            let inventoryMedicineCount = 0;
            
            if (prescription && prescription.medicines) {
              const inventoryMedicines = prescription.medicines.filter(medicine => medicine.source === 'inventory');
              hasInventoryMedicines = inventoryMedicines.length > 0;
              inventoryMedicineCount = inventoryMedicines.length;
            }
            
            // Update allAppointments
            setAllAppointments(prevAppointments => {
              const existingIndex = prevAppointments.findIndex(apt => apt.appointment.id === latestAppointmentData.id);
              const newAppointment = {
                appointment: latestAppointmentData,
                prescription,
                hasInventoryMedicines,
                inventoryMedicineCount
              };
              
              if (existingIndex >= 0) {
                const updated = [...prevAppointments];
                updated[existingIndex] = newAppointment;
                return updated;
              } else {
                return [...prevAppointments, newAppointment];
              }
            });
          };
          
          onValue(prescriptionQuery, handlePrescriptionUpdate, (error) => {
            console.error(`Error listening to prescription for appointment ${appointmentId}:`, error);
            // Add appointment without prescription
            const latestAppointmentData = appointmentDataMap.get(appointmentId) || appointmentData;
            
            setAllAppointments(prevAppointments => {
              const existingIndex = prevAppointments.findIndex(apt => apt.appointment.id === latestAppointmentData.id);
              const newAppointment = {
                appointment: latestAppointmentData,
                prescription: null,
                hasInventoryMedicines: false,
                inventoryMedicineCount: 0
              };
              
              if (existingIndex >= 0) {
                const updated = [...prevAppointments];
                updated[existingIndex] = newAppointment;
                return updated;
              } else {
                return [...prevAppointments, newAppointment];
              }
            });
          });
          
          prescriptionRefs.set(appointmentId, prescriptionQuery);
        } else {
          // Update appointment data while keeping prescription listener
          setAllAppointments(prevAppointments => {
            const existingIndex = prevAppointments.findIndex(apt => apt.appointment.id === appointmentId);
            if (existingIndex >= 0) {
              const updated = [...prevAppointments];
              updated[existingIndex] = {
                ...updated[existingIndex],
                appointment: appointmentData
              };
              return updated;
            }
            return prevAppointments;
          });
        }
      });
      
      // Remove appointments that no longer exist
      setAllAppointments(prevAppointments => 
        prevAppointments.filter(apt => currentAppointmentIds.has(apt.appointment.id!))
      );
      
      // Clean up prescription listeners for removed appointments
      prescriptionRefs.forEach((prescriptionRef, appointmentId) => {
        if (!currentAppointmentIds.has(appointmentId)) {
          off(prescriptionRef);
          prescriptionRefs.delete(appointmentId);
        }
      });
      
      setLoading(false);
    };
    
    onValue(appointmentsQuery, handleAppointmentsUpdate, (error) => {
      console.error('Error listening to appointments:', error);
      toast.error('Error loading appointments. Please refresh.');
      setLoading(false);
    });
    
    // Cleanup function
    return () => {
      console.log('Cleaning up real-time listeners');
      off(appointmentsQuery);
      prescriptionRefs.forEach((prescriptionRef) => {
        off(prescriptionRef);
      });
      prescriptionRefs.clear();
    };
  }, [user, selectedDate]);

  // Update filtered appointments whenever allAppointments changes
  useEffect(() => {
    const filteredAppointments = allAppointments.filter(apt => apt.hasInventoryMedicines);
    setAppointments(filteredAppointments);
    
    console.log('Real-time update: Filtered appointments', {
      total: allAppointments.length,
      withInventoryMedicines: filteredAppointments.length
    });
  }, [allAppointments]);

  // Load inventory data
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const inventoryData = await inventoryService.getAll();
        setInventory(inventoryData);
      } catch (error) {
        console.error('Error loading inventory:', error);
        toast.error('Failed to load inventory data');
      }
    };
    loadInventory();
  }, []);

  // Load user display name
  useEffect(() => {
    const loadUserDisplayName = async () => {
      if (user?.uid) {
        try {
          const staffData = await staffService.getStaffById(user.uid);
          if (staffData) {
            setUserDisplayName(staffData.displayName || staffData.email || 'User');
          } else {
            setUserDisplayName(user.email || 'User');
          }
        } catch (error) {
          console.error('Error loading user display name:', error);
          setUserDisplayName(user.email || 'User');
        }
      }
    };
    loadUserDisplayName();
  }, [user]);

  const loadTodayAppointments = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const filterDate = selectedDate || new Date().toISOString().split('T')[0]; // Use selected date or today
      
      // Get selected date's appointments
      const todayAppointments = await appointmentService.getAppointmentsByDateRange(filterDate, filterDate);
      console.log('Loaded appointments for date:', filterDate, todayAppointments.length, todayAppointments);
      
      // Load prescriptions for each appointment
      const appointmentsWithPrescriptions: AppointmentWithPrescription[] = [];
      
      for (const appointment of todayAppointments) {
        try {
          const prescription = await prescriptionService.getPrescriptionByAppointmentId(appointment.id!);
          
          // Check if prescription has inventory medicines
          let hasInventoryMedicines = false;
          let inventoryMedicineCount = 0;
          
          if (prescription && prescription.medicines) {
            const inventoryMedicines = prescription.medicines.filter(medicine => medicine.source === 'inventory');
            hasInventoryMedicines = inventoryMedicines.length > 0;
            inventoryMedicineCount = inventoryMedicines.length;
          }
          
          appointmentsWithPrescriptions.push({
            appointment,
            prescription,
            hasInventoryMedicines,
            inventoryMedicineCount
          });
        } catch (error) {
          console.error(`Error loading prescription for appointment ${appointment.id}:`, error);
          appointmentsWithPrescriptions.push({
            appointment,
            prescription: null,
            hasInventoryMedicines: false,
            inventoryMedicineCount: 0
          });
        }
      }
      
      // Filter to only show appointments with inventory medicines (for summary cards)
      const filteredAppointments = appointmentsWithPrescriptions.filter(apt => apt.hasInventoryMedicines);
      
      console.log('Filtered appointments with pharmacy review status:', filteredAppointments.map(apt => ({
        id: apt.appointment.id,
        patientName: apt.appointment.patientName,
        pharmacyReviewStatus: apt.appointment.pharmacyReviewStatus
      })));
      
      // Store all appointments for the table
      setAllAppointments(appointmentsWithPrescriptions);
      // Store filtered appointments for summary cards
      setAppointments(filteredAppointments);
    } catch (error) {
      console.error('Error loading today appointments:', error);
      toast.error('Failed to load today appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    // Note: Data syncs automatically in real-time, this is a manual refresh fallback
    setRefreshing(true);
    try {
      await loadTodayAppointments();
      toast.success('Appointments refreshed manually');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Failed to refresh appointments');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenAppointmentsModal = () => {
    setShowAppointmentsModal(true);
  };

  const handleCloseAppointmentsModal = () => {
    setShowAppointmentsModal(false);
  };

  const handleOpenPharmacyPOS = (appointmentWithPrescription: AppointmentWithPrescription) => {
    setSelectedAppointment(appointmentWithPrescription);
    setShowPharmacyPOS(true);
    setShowAppointmentsModal(false);
  };

  const handleClosePharmacyPOS = () => {
    setShowPharmacyPOS(false);
    setSelectedAppointment(null);
  };

  const handlePharmacyLoadToMainPOS = async (pharmacyData: any) => {
    console.log('Pharmacy POS: Load to main POS called with:', pharmacyData);
    
    try {
      // Update appointment with pharmacy review status
      if (pharmacyData.appointment?.id && user?.uid) {
        console.log('Updating appointment:', pharmacyData.appointment.id, 'with user:', user.uid);
        
        const updateData = {
          pharmacyReviewStatus: 'reviewed' as const,
          pharmacyReviewedAt: Date.now(),
          pharmacyReviewedBy: user.uid,
          pharmacyReviewNotes: `Pharmacy reviewed and drugs issued for ${pharmacyData.pharmacyReviewedItems?.length || 0} medicines`
        };
        
        console.log('Update data:', updateData);
        
        await appointmentService.updateAppointment(pharmacyData.appointment.id, updateData);
        
        console.log('Appointment updated successfully');
        toast.success('Pharmacy review completed - data will sync automatically');
      } else {
        console.error('Missing appointment ID or user ID:', {
          appointmentId: pharmacyData.appointment?.id,
          userId: user?.uid
        });
        toast.error('Missing appointment or user information');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error(`Failed to update appointment status: ${error.message || 'Unknown error'}`);
    }
    
    setShowPharmacyPOS(false);
    setSelectedAppointment(null);
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard/attendance');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const handleOpenViewDetails = (appointmentWithPrescription: AppointmentWithPrescription) => {
    setSelectedAppointment(appointmentWithPrescription);
    const medicines = appointmentWithPrescription.prescription?.medicines || [];
    setEditedMedicines(medicines);
    setEditingRowId(null);
    setEditingMedicine(null);
    // Pre-select all inventory medicines
    const inventoryMedicineIds = new Set(
      medicines.filter(med => med.source === 'inventory').map(med => med.id)
    );
    setSelectedMedicineIds(inventoryMedicineIds);
    setShowViewDetailsModal(true);
  };

  const handleCloseViewDetails = () => {
    setShowViewDetailsModal(false);
    setSelectedAppointment(null);
    setEditedMedicines([]);
    setEditingMedicine(null);
    setEditingRowId(null);
    setShowAddMedicineDialog(false);
    setSelectedMedicineIds(new Set());
  };


  const handleSaveChanges = async () => {
    if (!selectedAppointment?.prescription?.id) {
      toast.error('No prescription selected');
      return;
    }

    try {
      setLoading(true);
      await prescriptionService.updatePrescription(selectedAppointment.prescription.id, {
        medicines: editedMedicines
      });
      
      toast.success('Changes saved - data will sync automatically');
      handleCloseViewDetails();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (medicineId: string) => {
    setEditingRowId(medicineId);
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
  };

  const handleSaveEdit = (medicineId: string, updatedMedicine: any) => {
    setEditedMedicines(prev => 
      prev.map(med => med.id === medicineId ? updatedMedicine : med)
    );
    setEditingRowId(null);
    toast.success('Medicine updated successfully');
  };

  const handleRemoveMedicine = (medicineId: string) => {
    setEditedMedicines(prev => prev.filter(med => med.id !== medicineId));
    toast.success('Medicine removed successfully');
  };

  const handleAddMedicine = () => {
    setShowAddMedicineDialog(true);
  };

  const handleCloseAddMedicine = () => {
    setShowAddMedicineDialog(false);
    setSelectedMedicineForAdd(null);
    setAddQuantity(1);
  };

  const handleSelectMedicine = (item: any) => {
    if (editedMedicines.some(med => med.inventoryId === item.id)) {
      toast.warning(`${item.name} is already in the prescription.`);
      return;
    }
    setSelectedMedicineForAdd(item);
  };

  const handleConfirmAddMedicine = () => {
    if (!selectedMedicineForAdd) {
      toast.error('Please select a medicine first');
      return;
    }

    if (addQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    const newMedicineId = prescriptionService.generateMedicineId();
    const newMedicine = {
      id: newMedicineId,
      medicineName: selectedMedicineForAdd.name,
      inventoryId: selectedMedicineForAdd.id,
      source: 'inventory',
      dose: 'N/A',
      frequency: 'N/A',
      days: 0,
      drugCount: addQuantity,
      originalDrugCount: 0,
      pharmacyAdded: true,
      pharmacyEdited: false,
    };
    setEditedMedicines(prev => [...prev, newMedicine]);
    // Auto-select the newly added medicine
    setSelectedMedicineIds(prev => new Set(prev).add(newMedicineId));
    toast.success(`${selectedMedicineForAdd.name} (${addQuantity} units) added to prescription.`);
    handleCloseAddMedicine();
  };

  const handleToggleMedicine = (medicineId: string) => {
    setSelectedMedicineIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(medicineId)) {
        newSet.delete(medicineId);
      } else {
        newSet.add(medicineId);
      }
      return newSet;
    });
  };

  const handleToggleAllMedicines = () => {
    const inventoryMedicines = editedMedicines.filter(med => med.source === 'inventory');
    if (selectedMedicineIds.size === inventoryMedicines.length) {
      // Deselect all
      setSelectedMedicineIds(new Set());
    } else {
      // Select all
      setSelectedMedicineIds(new Set(inventoryMedicines.map(med => med.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading pharmacy appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <style jsx>{`
        .modal-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .modal-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .modal-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .modal-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleBackToDashboard} 
              className="flex items-center gap-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-md hover:shadow-lg transition-all duration-300 border-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Pharmacy POS
                </h1>
                <p className="text-slate-600 mt-1">Review and manage prescribed medicines</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Real-time Sync Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <span className="text-xs font-medium text-green-700">Live Sync</span>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-slate-500">Current Time</p>
              <p className="text-sm font-medium text-slate-700">
                {format(new Date(), 'MMM dd, yyyy - HH:mm')}
              </p>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Manual refresh (data syncs automatically)"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 px-3 py-2 rounded-lg border border-transparent hover:border-indigo-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                    <UserCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{userDisplayName}</p>
                    <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-lg border border-gray-200/50 shadow-xl rounded-lg">
                <div className="px-3 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userDisplayName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <Badge variant="secondary" className="mt-2 text-xs capitalize bg-indigo-100 text-indigo-700">
                    {userRole}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleBackToDashboard} className="hover:bg-gray-50">
                  <LayoutDashboard className="h-4 w-4 mr-3 text-gray-500" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="flex justify-end mb-8">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-600 font-semibold tracking-wide">Filter by Date</label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-44 h-10 text-sm font-medium border-2 border-slate-300 focus:border-blue-500 hover:border-slate-400 transition-all duration-300 rounded-lg shadow-sm hover:shadow-md bg-white"
                />
              </div>
              <Button
                size="sm"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="h-10 px-4 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-300 border-0 whitespace-nowrap"
                title="Reset to today"
              >
                <Calendar className="h-4 w-4 mr-1.5" />
                Today
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selected Date Appointments Summary */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-slate-800">
                    {selectedDate === new Date().toISOString().split('T')[0] 
                      ? "Today's Appointments" 
                      : "Appointments"}
                  </span>
                </div>
                {selectedDate !== new Date().toISOString().split('T')[0] && (
                  <p className="text-sm text-slate-500 ml-11">{format(new Date(selectedDate), 'MMMM dd, yyyy')}</p>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="relative">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    {appointments.length}
                  </div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-slate-600 mb-6 text-sm">Appointments with prescribed inventory medicines</p>
                <Button
                  onClick={handleOpenAppointmentsModal}
                  disabled={appointments.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Appointments
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pharmacy Review Status */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-slate-800">Review Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-slate-700 font-medium">Reviewed & Drug Issued</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {appointments.filter(apt => apt.appointment.pharmacyReviewStatus === 'reviewed').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-slate-700 font-medium">Pending</span>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    {appointments.filter(apt => apt.appointment.pharmacyReviewStatus !== 'reviewed').length}
                  </Badge>
                </div>
                <div className="pt-2">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${appointments.length > 0 ? (appointments.filter(apt => apt.appointment.pharmacyReviewStatus === 'reviewed').length / appointments.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-center">
                    {appointments.length > 0 ? Math.round((appointments.filter(apt => apt.appointment.pharmacyReviewStatus === 'reviewed').length / appointments.length) * 100) : 0}% Complete
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <span className="text-slate-800">Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  onClick={handleOpenAppointmentsModal}
                  disabled={appointments.length === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  <Pill className="h-4 w-4 mr-2" />
                  Review Prescriptions
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/pos')}
                  className="w-full border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-all duration-200"
                  variant="outline"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Go to Main POS
                </Button>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500 text-center">
                    Last sync: {format(new Date(), 'HH:mm')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Appointments Statistics Summary */}
        {allAppointments.length > 0 && (() => {
          const isAppointmentArchived = (apt: AppointmentWithPrescription) => {
            return apt.appointment.payment?.isPaid === true && apt.appointment.status === 'completed';
          };
          
          const activeAppointments = allAppointments.filter(apt => !isAppointmentArchived(apt));
          const archivedAppointments = allAppointments.filter(apt => isAppointmentArchived(apt));
          
          return (
            <div className="space-y-6 mt-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Appointments</p>
                        <p className="text-3xl font-bold text-blue-900 mt-1">{allAppointments.length}</p>
                      </div>
                      <div className="p-3 bg-blue-200 rounded-full">
                        <Users className="h-6 w-6 text-blue-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-600">Active</p>
                        <p className="text-3xl font-bold text-amber-900 mt-1">{activeAppointments.length}</p>
                      </div>
                      <div className="p-3 bg-amber-200 rounded-full">
                        <Clock className="h-6 w-6 text-amber-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Archived</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{archivedAppointments.length}</p>
                      </div>
                      <div className="p-3 bg-slate-200 rounded-full">
                        <Archive className="h-6 w-6 text-slate-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Appointments Table */}
              {activeAppointments.length > 0 && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                          <span className="text-slate-800">Active Appointments</span>
                    <p className="text-sm text-slate-600 font-normal mt-1">
                            Appointments pending review or payment
                    </p>
                  </div>
                </CardTitle>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                        {activeAppointments.length} Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-slate-200">
                      <TableHead className="font-bold text-slate-800 w-[5%] text-center">#</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[20%]">Patient Details</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[15%]">Doctor</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[12%] text-center">Medicines</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[12%] text-center">Time</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[20%] text-center">Status</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[16%] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                          {activeAppointments.map((appointmentWithPrescription, index) => {
                      // Determine the status
                      let statusBadge;
                      let statusText;
                      let statusColor;
                      
                      if (appointmentWithPrescription.appointment.payment?.isPaid) {
                        statusText = "Completed (Paid)";
                        statusColor = "bg-green-600 text-white border-green-700 shadow-sm";
                        statusBadge = (
                          <Badge className={statusColor}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {statusText}
                          </Badge>
                        );
                      } else if (appointmentWithPrescription.appointment.pharmacyReviewStatus === 'reviewed') {
                        statusText = "Pharmacy Reviewed - Sent to Reception (Waiting for Payment)";
                        statusColor = "bg-blue-600 text-white border-blue-700 shadow-sm";
                        statusBadge = (
                          <Badge className={statusColor}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {statusText}
                          </Badge>
                        );
                      } else if (appointmentWithPrescription.hasInventoryMedicines) {
                        statusText = "Prescription Added - Waiting for Pharmacy Review";
                        statusColor = "bg-amber-600 text-white border-amber-700 shadow-sm";
                        statusBadge = (
                          <Badge className={statusColor}>
                            <Clock className="h-3 w-3 mr-1" />
                            {statusText}
                          </Badge>
                        );
                      } else {
                        statusText = "Waiting for Prescription";
                        statusColor = "bg-slate-500 text-white border-slate-600 shadow-sm";
                        statusBadge = (
                          <Badge className={statusColor}>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {statusText}
                          </Badge>
                        );
                      }

                      return (
                        <TableRow 
                          key={appointmentWithPrescription.appointment.id}
                          className={`group hover:bg-slate-100/50 transition-colors duration-200 ${
                            appointmentWithPrescription.appointment.payment?.isPaid
                              ? 'bg-green-50/20'
                              : appointmentWithPrescription.appointment.pharmacyReviewStatus === 'reviewed'
                              ? 'bg-blue-50/20'
                              : appointmentWithPrescription.hasInventoryMedicines
                              ? 'bg-amber-50/20'
                              : 'bg-white'
                          }`}
                        >
                          {/* Appointment Number */}
                          <TableCell className="text-center font-semibold text-slate-700">
                            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 font-bold text-sm px-3 py-1.5 shadow-md">
                              #{appointmentWithPrescription.appointment.sessionAppointmentNumber || (index + 1)}
                            </Badge>
                          </TableCell>

                          {/* Patient Details */}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md">
                                  <User className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <p className="font-semibold text-slate-800 text-sm">
                                  {appointmentWithPrescription.appointment.patientName}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 ml-7">
                                <Phone className="h-3 w-3 text-green-600" />
                                <p className="text-slate-600 text-xs">
                                  {appointmentWithPrescription.appointment.patientContact}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Doctor */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
                              <p className="text-slate-700 text-sm font-medium">
                                {appointmentWithPrescription.appointment.doctorName}
                              </p>
                            </div>
                          </TableCell>

                          {/* Medicines Count */}
                          <TableCell className="text-center">
                            {appointmentWithPrescription.inventoryMedicineCount > 0 ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <Pill className="h-3.5 w-3.5 text-purple-600" />
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                  {appointmentWithPrescription.inventoryMedicineCount}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </TableCell>

                          {/* Time */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-500" />
                              <p className="text-slate-700 text-sm">
                                {(() => {
                                  if (appointmentWithPrescription.appointment.sessionId) {
                                    const sessionTime = getSessionTimeFromId(appointmentWithPrescription.appointment.sessionId);
                                    if (sessionTime) {
                                      return `${sessionTime.startTime} - ${sessionTime.endTime}`;
                                    }
                                  }
                                  return 'N/A';
                                })()}
                              </p>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              {statusBadge}
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              {appointmentWithPrescription.appointment.payment?.isPaid ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-700 border-green-200 hover:bg-green-50 text-xs px-2 py-1 h-7"
                                  onClick={() => handleOpenViewDetails(appointmentWithPrescription)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              ) : appointmentWithPrescription.appointment.pharmacyReviewStatus === 'reviewed' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-700 border-blue-200 hover:bg-blue-50 text-xs px-2 py-1 h-7"
                                    onClick={() => handleOpenViewDetails(appointmentWithPrescription)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Details
                                  </Button>
                                </>
                              ) : appointmentWithPrescription.hasInventoryMedicines ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenPharmacyPOS(appointmentWithPrescription)}
                                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs px-3 py-1 h-7"
                                >
                                  <Pill className="h-3 w-3 mr-1" />
                                  Review
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-slate-500 border-slate-200 cursor-not-allowed text-xs px-2 py-1 h-7"
                                  disabled
                                >
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Pending
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

              {/* Archived Appointments Section */}
              {archivedAppointments.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-xl p-4 shadow-md">
                    <Button
                      onClick={() => setShowArchivedAppointments(!showArchivedAppointments)}
                      className="w-full flex items-center justify-between bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 shadow-sm h-14"
                      variant="outline"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-200 rounded-lg">
                          <Archive className="h-5 w-5 text-slate-700" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm">Archived Appointments</p>
                          <p className="text-xs text-slate-500">Completed and paid appointments</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-slate-200 text-slate-800 border-slate-300">
                          {archivedAppointments.length} Archived
                        </Badge>
                        {showArchivedAppointments ? (
                          <ChevronUp className="h-5 w-5 text-slate-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-600" />
                        )}
                      </div>
                    </Button>
                  </div>

                  {showArchivedAppointments && (
                    <div className="space-y-6 pl-4 border-l-4 border-slate-300">
                      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                        <CardHeader className="pb-4 border-b border-slate-200">
                          <CardTitle className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg">
                              <Archive className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <span className="text-slate-800">Archived Appointments</span>
                              <p className="text-sm text-slate-600 font-normal mt-1">
                                Completed and paid appointments
                              </p>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 border-b-2 border-slate-200">
                                  <TableHead className="font-bold text-slate-800 w-[5%] text-center">#</TableHead>
                                  <TableHead className="font-bold text-slate-800 w-[20%]">Patient Details</TableHead>
                                  <TableHead className="font-bold text-slate-800 w-[15%]">Doctor</TableHead>
                                  <TableHead className="font-bold text-slate-800 w-[12%] text-center">Medicines</TableHead>
                                  <TableHead className="font-bold text-slate-800 w-[12%] text-center">Time</TableHead>
                                  <TableHead className="font-bold text-slate-800 w-[20%] text-center">Status</TableHead>
                                  <TableHead className="font-bold text-slate-800 w-[16%] text-center">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {archivedAppointments.map((appointmentWithPrescription, index) => {
                                  const statusBadge = (
                                    <Badge className="bg-green-600 text-white border-green-700 shadow-sm">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Completed (Paid)
                                    </Badge>
                                  );

                                  return (
                                    <TableRow 
                                      key={appointmentWithPrescription.appointment.id}
                                      className="group hover:bg-slate-100/50 transition-colors duration-200 bg-green-50/20"
                                    >
                                      {/* Appointment Number */}
                                      <TableCell className="text-center font-semibold text-slate-700">
                                        <Badge className="bg-gradient-to-r from-slate-500 to-slate-600 text-white border-0 font-bold text-sm px-3 py-1.5 shadow-md">
                                          #{appointmentWithPrescription.appointment.sessionAppointmentNumber || (index + 1)}
                                        </Badge>
                                      </TableCell>

                                      {/* Patient Details */}
                                      <TableCell>
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md">
                                              <User className="h-3.5 w-3.5 text-blue-600" />
                                            </div>
                                            <p className="font-semibold text-slate-800 text-sm">
                                              {appointmentWithPrescription.appointment.patientName}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-1.5 ml-7">
                                            <Phone className="h-3 w-3 text-green-600" />
                                            <p className="text-slate-600 text-xs">
                                              {appointmentWithPrescription.appointment.patientContact}
                                            </p>
                                          </div>
                                        </div>
                                      </TableCell>

                                      {/* Doctor */}
                                      <TableCell>
                                        <div className="flex items-center gap-1.5">
                                          <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
                                          <p className="text-slate-700 text-sm font-medium">
                                            {appointmentWithPrescription.appointment.doctorName}
                                          </p>
                                        </div>
                                      </TableCell>

                                      {/* Medicines Count */}
                                      <TableCell className="text-center">
                                        {appointmentWithPrescription.inventoryMedicineCount > 0 ? (
                                          <div className="flex items-center justify-center gap-1.5">
                                            <Pill className="h-3.5 w-3.5 text-purple-600" />
                                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                              {appointmentWithPrescription.inventoryMedicineCount}
                                            </Badge>
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 text-sm">-</span>
                                        )}
                                      </TableCell>

                                      {/* Time */}
                                      <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                                          <p className="text-slate-700 text-sm">
                                            {(() => {
                                              if (appointmentWithPrescription.appointment.sessionId) {
                                                const sessionTime = getSessionTimeFromId(appointmentWithPrescription.appointment.sessionId);
                                                if (sessionTime) {
                                                  return `${sessionTime.startTime} - ${sessionTime.endTime}`;
                                                }
                                              }
                                              return 'N/A';
                                            })()}
                                          </p>
                                        </div>
                                      </TableCell>

                                      {/* Status */}
                                      <TableCell className="text-center">
                                        <div className="flex justify-center">
                                          {statusBadge}
                                        </div>
                                      </TableCell>

                                      {/* Actions */}
                                      <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-green-700 border-green-200 hover:bg-green-50 text-xs px-2 py-1 h-7"
                                            onClick={() => handleOpenViewDetails(appointmentWithPrescription)}
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            View
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

      </div>

      {/* Appointments Modal */}
      <Dialog open={showAppointmentsModal} onOpenChange={setShowAppointmentsModal}>
        <CustomDialogContent className="max-w-[98vw] w-full h-[90vh] bg-white/95 backdrop-blur-xl border-0 shadow-2xl p-0 flex flex-col">
          {/* Fixed Header */}
          <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Pill className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-800">
                    {selectedDate === new Date().toISOString().split('T')[0] 
                      ? "Today's Appointments - Pharmacy Review" 
                      : `Appointments - ${format(new Date(selectedDate), 'MMMM dd, yyyy')}`}
                  </DialogTitle>
                  <p className="text-slate-600 mt-1">
                    {appointments.length} appointments with prescribed medicines
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {appointments.filter(apt => apt.appointment.pharmacyReviewStatus !== 'reviewed').length} Pending
                  </Badge>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {appointments.filter(apt => apt.appointment.pharmacyReviewStatus === 'reviewed').length} Reviewed & Drug Issued
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAppointmentsModal(false)}
                  className="border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {/* Scrollable Content */}
          <div 
            className="flex-1 overflow-y-auto p-4 min-h-0 modal-scroll" 
            style={{ 
              maxHeight: 'calc(90vh - 100px)',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9'
            }}
          >
            {/* Appointments Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-slate-200">
                      <TableHead className="font-bold text-slate-800 w-[20%] py-3 text-sm">Patient</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[15%] py-3 text-sm">Doctor</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[12%] py-3 text-sm">Appointment #</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[12%] py-3 text-sm">Contact</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[10%] text-center py-3 text-sm">Medicines</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[12%] text-center py-3 text-sm">Status</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[19%] text-center py-3 text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {appointments.length > 0 ? (
                    appointments.map((appointmentWithPrescription) => (
                      <TableRow 
                        key={appointmentWithPrescription.appointment.id}
                        className={`group hover:bg-slate-50 transition-colors duration-200 ${
                          appointmentWithPrescription.appointment.pharmacyReviewStatus === 'reviewed'
                            ? 'bg-green-50/50 border-l-4 border-l-green-400'
                            : 'bg-white'
                        }`}
                      >
                        {/* Patient Name */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md">
                              <User className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm leading-tight">
                                {appointmentWithPrescription.appointment.patientName}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Doctor */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5">
                            <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
                            <p className="text-slate-700 text-sm font-medium leading-tight">
                              {appointmentWithPrescription.appointment.doctorName}
                            </p>
                          </div>
                        </TableCell>

                        {/* Appointment Number */}
                        <TableCell className="py-3">
                          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 font-medium text-xs">
                            {(() => {
                              const sessionNumber = appointmentWithPrescription.appointment.sessionAppointmentNumber;
                              // Check if sessionAppointmentNumber is a valid number
                              if (sessionNumber && typeof sessionNumber === 'number' && sessionNumber > 0) {
                                return `#${sessionNumber}`;
                              }
                              // Fallback to appointment ID suffix
                              return `#${appointmentWithPrescription.appointment.id?.slice(-4) || 'N/A'}`;
                            })()}
                          </Badge>
                        </TableCell>

                        {/* Contact */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-green-600" />
                            <p className="text-slate-700 text-sm leading-tight">
                              {appointmentWithPrescription.appointment.patientContact}
                            </p>
                          </div>
                        </TableCell>

                        {/* Medicines Count */}
                        <TableCell className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Pill className="h-3.5 w-3.5 text-purple-600" />
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-medium text-xs">
                              {appointmentWithPrescription.inventoryMedicineCount}
                            </Badge>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3 text-center">
                          {appointmentWithPrescription.appointment.pharmacyReviewStatus === 'reviewed' ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200 font-medium text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Reviewed
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-medium text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {appointmentWithPrescription.appointment.pharmacyReviewStatus === 'reviewed' ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-xs px-2 py-1 h-7"
                                  onClick={() => handleOpenViewDetails(appointmentWithPrescription)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Details
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200 text-xs px-2 py-1 h-7"
                                  disabled
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Done
                                </Button>
                              </>
                            ) : (
                              <Button
                                onClick={() => handleOpenPharmacyPOS(appointmentWithPrescription)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-xs px-3 py-1 h-7"
                                size="sm"
                              >
                                <Pill className="h-3 w-3 mr-1" />
                                Review
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-slate-100 rounded-full">
                            <Pill className="h-8 w-8 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-slate-600">No Appointments Found</p>
                            <p className="text-slate-500 text-sm">No appointments with prescribed medicines for today</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                </Table>
              </div>
            </div>

            {/* Summary Stats */}
            {appointments.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Total Appointments</p>
                        <p className="text-2xl font-bold text-blue-600">{appointments.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 bg-gradient-to-r from-amber-50 to-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Pending Review</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {appointments.filter(apt => apt.appointment.pharmacyReviewStatus !== 'reviewed').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Reviewed & Issued</p>
                        <p className="text-2xl font-bold text-green-600">
                          {appointments.filter(apt => apt.appointment.pharmacyReviewStatus === 'reviewed').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CustomDialogContent>
      </Dialog>

      {/* Pharmacy POS Modal */}
      {showPharmacyPOS && selectedAppointment && selectedAppointment.prescription && (
        <Dialog open={showPharmacyPOS} onOpenChange={setShowPharmacyPOS}>
          <CustomDialogContent className="max-w-[95vw] w-full h-[95vh] bg-white/95 backdrop-blur-xl border-0 shadow-2xl p-0 flex flex-col">
            {/* Fixed Header */}
            <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <Pill className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-slate-800">
                      Pharmacy Review
                    </DialogTitle>
                    <p className="text-slate-600 mt-1">
                      Patient: {selectedAppointment.appointment.patientName}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClosePharmacyPOS}
                  className="border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            
            {/* Scrollable Content */}
            <div 
              className="flex-1 overflow-y-auto p-6 min-h-0 modal-scroll" 
              style={{ 
                maxHeight: 'calc(95vh - 120px)',
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}
            >
              <PharmacyPOS
                appointment={selectedAppointment.appointment}
                prescription={selectedAppointment.prescription}
                onBack={handleClosePharmacyPOS}
                onLoadToMainPOS={handlePharmacyLoadToMainPOS}
              />
            </div>
          </CustomDialogContent>
        </Dialog>
      )}

      {/* View Details Modal */}
      {showViewDetailsModal && selectedAppointment && selectedAppointment.prescription && (
        <Dialog open={showViewDetailsModal} onOpenChange={setShowViewDetailsModal}>
          <CustomDialogContent className="max-w-[95vw] w-full h-[95vh] bg-white/95 backdrop-blur-xl border-0 shadow-2xl p-0 flex flex-col">
            {/* Fixed Header */}
            <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-slate-800">
                      Review Details & Edit Medicines
                    </DialogTitle>
                    <p className="text-slate-600 mt-1">
                      Patient: {selectedAppointment.appointment.patientName}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseViewDetails}
                  className="border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            
            {/* Scrollable Content */}
            <div 
              className="flex-1 overflow-y-auto p-6 min-h-0 modal-scroll" 
              style={{ 
                maxHeight: 'calc(95vh - 120px)',
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}
            >
              <div className="space-y-6">
                {/* Patient Information */}
                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-slate-800">Patient Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-blue-100">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Patient Name</p>
                          <p className="font-semibold text-slate-800">{selectedAppointment.appointment.patientName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-green-100">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Phone className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Contact</p>
                          <p className="font-semibold text-slate-800">{selectedAppointment.appointment.patientContact}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-purple-100">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Stethoscope className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Doctor</p>
                          <p className="font-semibold text-slate-800">{selectedAppointment.appointment.doctorName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-orange-100">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Date</p>
                          <p className="font-semibold text-slate-800">{format(new Date(selectedAppointment.appointment.date), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Status Warning */}
                {selectedAppointment.appointment.payment?.isPaid && (
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-rose-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-red-800 font-semibold">Appointment Already Paid</p>
                          <p className="text-red-600 text-sm">This appointment has been paid in the main POS. Editing is restricted to maintain data integrity.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Out of Stock Warning */}
                {(() => {
                  const outOfStockCount = editedMedicines.filter(med => med.outOfStock).length;
                  if (outOfStockCount > 0) {
                    return (
                      <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-red-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <PackageX className="h-5 w-5 text-red-600" />
                            <div>
                              <div className="text-red-800 font-semibold flex items-center gap-2">
                                Out of Stock Medicines
                                <Badge className="bg-red-500 text-white">{outOfStockCount}</Badge>
                              </div>
                              <p className="text-red-600 text-sm">
                                {outOfStockCount} medicine{outOfStockCount > 1 ? 's' : ''} marked as out of stock by pharmacy. 
                                {outOfStockCount > 1 ? ' These medicines' : ' This medicine'} cannot be dispensed.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  return null;
                })()}

                {/* Prescribed Medicines */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                          <Pill className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <span className="text-slate-800">Prescribed Medicines</span>
                          <p className="text-sm text-slate-600 font-normal">
                            {editedMedicines.filter(med => med.source === 'inventory').length} inventory medicines
                          </p>
                          <p className="text-xs text-blue-600 font-normal mt-1 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Select medicines to confirm and mark as reviewed
                          </p>
                        </div>
                      </CardTitle>
                      {!selectedAppointment.appointment.payment?.isPaid && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddMedicine}
                          className="flex items-center gap-2 border-2 border-green-200 hover:border-green-300 hover:bg-green-50 text-green-700 hover:text-green-800"
                        >
                          <Plus className="h-4 w-4" />
                          Add Medicine
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="font-semibold w-[5%] text-center">
                              <div className="flex flex-col items-center gap-1">
                                <Checkbox
                                  checked={
                                    editedMedicines.filter(med => med.source === 'inventory').length > 0 &&
                                    selectedMedicineIds.size === editedMedicines.filter(med => med.source === 'inventory').length
                                  }
                                  onCheckedChange={handleToggleAllMedicines}
                                  className="mx-auto"
                                  title="Select/Deselect All"
                                />
                                <span className="text-[10px] text-slate-500">Select</span>
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold w-[23%]">Medicine Name</TableHead>
                            <TableHead className="font-semibold w-[13%]">Dosage</TableHead>
                            <TableHead className="font-semibold w-[13%]">Frequency</TableHead>
                            <TableHead className="font-semibold w-[10%]">Duration</TableHead>
                            <TableHead className="font-semibold text-center w-[14%]">Quantity</TableHead>
                            <TableHead className="font-semibold text-center w-[10%]">Status</TableHead>
                            <TableHead className="font-semibold text-center w-[12%]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {editedMedicines.filter(med => med.source === 'inventory').length > 0 ? (
                            editedMedicines.filter(med => med.source === 'inventory').map((medicine) => (
                              <TableRow key={medicine.id} className="hover:bg-slate-50">
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={selectedMedicineIds.has(medicine.id)}
                                    onCheckedChange={() => handleToggleMedicine(medicine.id)}
                                    className="mx-auto"
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-base font-semibold text-slate-800">{medicine.medicineName}</span>
                                      {medicine.outOfStock && (
                                        <Badge className="bg-red-500 text-white text-xs">
                                          <PackageX className="h-3 w-3 mr-1" />
                                          Out of Stock
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-1 flex-wrap">
                                      {medicine.pharmacyAdded && (
                                        <Badge variant="outline" className="text-xs text-blue-600 bg-blue-100 w-fit">
                                          Added
                                        </Badge>
                                      )}
                                      {medicine.pharmacyEdited && (
                                        <Badge variant="outline" className="text-xs text-orange-600 bg-orange-100 w-fit">
                                          Edited
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {editingRowId === medicine.id ? (
                                    <Input
                                      value={editingMedicine?.dose || medicine.dose}
                                      onChange={(e) => setEditingMedicine({ ...editingMedicine, dose: e.target.value })}
                                      className="h-8"
                                    />
                                  ) : (
                                    <span className="text-slate-700">{medicine.dose}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingRowId === medicine.id ? (
                                    <Input
                                      value={editingMedicine?.frequency || medicine.frequency}
                                      onChange={(e) => setEditingMedicine({ ...editingMedicine, frequency: e.target.value })}
                                      className="h-8"
                                    />
                                  ) : (
                                    <span className="text-slate-700">{medicine.frequency}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingRowId === medicine.id ? (
                                    <Input
                                      type="number"
                                      value={editingMedicine?.days || medicine.days}
                                      onChange={(e) => setEditingMedicine({ ...editingMedicine, days: parseInt(e.target.value) || 0 })}
                                      className="h-8 w-20"
                                    />
                                  ) : (
                                    <span className="text-slate-700">{medicine.days} days</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {editingRowId === medicine.id ? (
                                    <Input
                                      type="number"
                                      value={editingMedicine?.drugCount || medicine.drugCount}
                                      onChange={(e) => setEditingMedicine({ ...editingMedicine, drugCount: parseInt(e.target.value) || 0 })}
                                      className="h-8 w-20 mx-auto"
                                    />
                                  ) : (
                                    <Badge className="bg-blue-100 text-blue-800">{medicine.drugCount}</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {medicine.outOfStock ? (
                                    <Badge className="bg-red-500 text-white">
                                      <PackageX className="h-3 w-3 mr-1" />
                                      Out of Stock
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-800">Issued</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {editingRowId === medicine.id ? (
                                    <div className="flex gap-2 justify-center">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          handleSaveEdit(medicine.id, editingMedicine);
                                          setEditingRowId(null);
                                        }}
                                        className="h-8 px-3"
                                      >
                                        <Save className="h-4 w-4 mr-1" />
                                        Save
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                        className="h-8 px-3"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2 justify-center">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleStartEdit(medicine.id)}
                                        disabled={!selectedAppointment || selectedAppointment.appointment.payment?.isPaid}
                                        className="h-8 px-3"
                                      >
                                        <Edit3 className="h-4 w-4 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveMedicine(medicine.id)}
                                        disabled={!selectedAppointment || selectedAppointment.appointment.payment?.isPaid || medicine.source === 'prescription'}
                                        className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Remove
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                                No medicines found. Add medicines using the "Add Medicine" button.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 p-6 pt-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Reviewed & Drug Issued
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    <Pill className="h-3 w-3 mr-1" />
                    {selectedMedicineIds.size} of {editedMedicines.filter(med => med.source === 'inventory').length} medicines selected
                  </Badge>
                  {selectedAppointment.appointment.payment?.isPaid && (
                    <Badge variant="outline" className="text-red-600 bg-red-100 border-red-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Payment Completed
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleCloseViewDetails}
                    className="border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-800 transition-all duration-200"
                  >
                    Close
                  </Button>
                  {!selectedAppointment.appointment.payment?.isPaid && (
                    <Button
                      onClick={handleSaveChanges}
                      disabled={loading || selectedMedicineIds.size === 0}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={selectedMedicineIds.size === 0 ? "Please select at least one medicine" : ""}
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm & Save ({selectedMedicineIds.size})
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CustomDialogContent>
        </Dialog>
      )}

      {/* Add Medicine Dialog */}
      <Dialog open={showAddMedicineDialog} onOpenChange={setShowAddMedicineDialog}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <span className="text-slate-800">Add Medicine from Inventory</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-bold text-lg mb-2">Search and Select Medicine</h3>
              <EnhancedPOSItemSearch 
                inventory={inventory} 
                onSelectItem={handleSelectMedicine} 
              />
            </div>

            {/* Selected Medicine Details */}
            {selectedMedicineForAdd && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="text-lg font-bold text-green-800">Selected Medicine</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-white/60 rounded-lg border border-green-100">
                    <p className="text-sm text-slate-500 mb-1">Medicine Name</p>
                    <p className="font-semibold text-slate-800">{selectedMedicineForAdd.name}</p>
                  </div>
                  {selectedMedicineForAdd.genericName && (
                    <div className="p-3 bg-white/60 rounded-lg border border-green-100">
                      <p className="text-sm text-slate-500 mb-1">Generic Name</p>
                      <p className="font-semibold text-slate-800">{selectedMedicineForAdd.genericName}</p>
                    </div>
                  )}
                </div>
                
                {/* Quantity Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Quantity to Add</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddQuantity(Math.max(1, addQuantity - 1))}
                      className="h-10 w-10 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 h-10 text-center"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddQuantity(addQuantity + 1)}
                      className="h-10 w-10 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p><strong>Note:</strong> Selected medicines will be added with default values (N/A for dosage/frequency). You can edit these values in the table after adding.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleCloseAddMedicine}>
              Cancel
            </Button>
            {selectedMedicineForAdd && (
              <Button 
                onClick={handleConfirmAddMedicine}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {addQuantity} Unit{addQuantity > 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(PharmacyPOSPage);

