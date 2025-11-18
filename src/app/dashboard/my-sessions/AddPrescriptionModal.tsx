//src/app/dashboard/my-sessions/AddPrescriptionModal.tsx

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader as AlertDialogHeading,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pill,
         Plus,
         Trash2,
         FileText,
         Save, 
         Loader2, 
         Search, 
         Package, 
         AlertCircle,
         Weight, 
         User, 
         Users,
         Edit3, 
         Check, 
         X, 
         AlertTriangle,
         Stethoscope, 
         Thermometer, 
         Heart, 
         Activity, 
         ClipboardList, 
         FileSearch,
         ImagePlus,
         Upload,
         Eye,
         FileImage,
         ImageIcon,
         History,
        Image, 
        Calendar, 
        Clock, 
        FileTextIcon,
        Download,
        ChevronLeft, 
        ChevronRight,
        Send,
        ChevronDown,
        ChevronUp,
        DollarSign,
        Phone,
        ZoomIn,
        ZoomOut,
        RotateCcw,
        Move,
        Maximize,
        Minimize,
        Printer
         } from 'lucide-react';
import { toast } from 'sonner';
import { formatPatientAge } from '@/utils/ageUtils';
import { useAuth } from '@/context/AuthContext';
import { Appointment, AppointmentDocument } from '@/types/appointment';
import { Medicine, Prescription, MedicineTemplate, PrescriptionImage, MedicalTest } from '@/types/prescription';
import { formatCurrency } from '@/types/doctor';
import { prescriptionService } from '@/services/prescriptionService';
import { inventoryService } from '@/services/inventoryService';
import { purchaseService } from '@/services/purchaseService';
import { InventoryItem } from '@/types/inventory';
import { BatchWithDetails } from '@/types/purchase';
import { appointmentService } from '@/services/appointmentService';
import { Patient, AppointmentProcedure } from '@/types/appointment';
import { doctorService } from '@/services/doctorService';
import { DoctorProcedure } from '@/types/doctor';
import { imageUploadService } from '@/services/imageUploadService';
import { ScrollArea } from "@/components/ui/scroll-area";
import { referralLetterService } from '@/services/referralLetterService';
import { referralDoctorService } from '@/services/referralDoctorService';
import { ReferralDoctor } from '@/types/referralDoctor';
import { ReferralLetter } from '@/types/referralLetter';
import { MedicalTestSection } from '@/components/MedicalTestSection';
import { NextVisitDateSection } from '@/components/NextVisitDateSection';
import { TagManager } from '@/components/TagManager';
import { tagManagementService } from '@/services/tagManagementService';
import { DiagnosisAutocomplete } from '@/components/DiagnosisAutocomplete';
import { diagnosisManagementService } from '@/services/diagnosisManagementService';
import { prescriptionPrintService } from '@/services/prescriptionPrintService';



interface AddPrescriptionModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}

interface DrugOption {
  id: string;
  code: string;
  name: string;
  genericName: string;
  type: string;
  totalQuantity: number;
  availableUnits: number;
  batches: BatchWithDetails[];
}

interface ExtendedMedicine extends Medicine {
  selectedDrugId?: string;
  availableQuantity?: number;
}

const doseOptions = [
  '1 tab', '2 tab', '3 tab', '4 tab', '½ tab', '¼ tab',
  '2.5ml', '5ml', '10ml', 'Custom ml',
  '1 puff', '2 puff',
  'LA', 'Capsules', 'Tubes'
];

const frequencyOptions = [
  'bd', 'tds', '4 hourly', '6 hourly', '8 hourly', 'mane', 'nocte', 'eve', 'stat', 'sos', 'EOD (Each Other Day)', 'Weekly'
];

// Legacy constants for backward compatibility
const commonDosages = [
  '250mg', '500mg', '1000mg', '1 tablet', '2 tablets', '5ml', '10ml', '1 capsule', '2 capsules'
];

const commonFrequencies = [
  'Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 
  'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'As needed'
];

const commonDurations = [
  '3 days', '5 days', '7 days', '10 days', '14 days', '21 days', '1 month', '2 months', '3 months'
];

const commonInstructions = [
  'Take with food', 'Take before meals', 'Take after meals', 'Take on empty stomach',
  'Take with plenty of water', 'Do not crush or chew', 'Take at bedtime', 'Avoid alcohol'
];

const instructionOptions = [
  'Before meal',
  'After meal',
  'During meal',
  'Shake well before use',
  'Mix with provided liquid in same package',
  'Mix with boiled and cooled room temperature water',
  'Insert into vagina, do not swallow or drink',
  'Insert into rectum, do not drink or swallow',
  'Apply on dry skin',
  'Mix both tubes together and apply',
  'Use staff assistance on using this 0719999012',
  'Two tablets now and as directed then onwards'
];

// Helper functions for date parsing
const parseDateToString = (dateString: string | undefined): { day: string; month: string; year: string } => {
  if (!dateString || dateString.trim() === '') {
    return { day: '', month: '', year: '' };
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { day: '', month: '', year: '' };
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    
    return { day, month, year };
  } catch (error) {
    return { day: '', month: '', year: '' };
  }
};

const combineDateParts = (day: string, month: string, year: string): string => {
  if (!day || !month || !year) {
    return '';
  }
  
  const dayNum = parseInt(day);
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  
  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
    return '';
  }
  
  // Validate date
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
    return '';
  }
  
  // Format as YYYY-MM-DD
  return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
};

// Generate array of years (from 1900 to current year)
const generateYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear; year >= 1900; year--) {
    years.push(year);
  }
  return years;
};

// Generate array of months
const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

// Get days in a month
const getDaysInMonth = (month: string, year: string): number => {
  if (!month || !year) return 31;
  
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  
  if (isNaN(monthNum) || isNaN(yearNum)) return 31;
  
  return new Date(yearNum, monthNum, 0).getDate();
};

// Helper function to truncate patient name to first word + "..."
const truncatePatientName = (name: string): string => {
  if (!name || name.trim() === '') return '';
  const firstWord = name.trim().split(/\s+/)[0];
  return name.trim().split(/\s+/).length > 1 ? `${firstWord}...` : firstWord;
};

export default function AddPrescriptionModal({ appointment, onClose, onSuccess }: AddPrescriptionModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingPrescription, setExistingPrescription] = useState<Prescription | null>(null);
  
  // Multi-patient support
  const [allPrescriptions, setAllPrescriptions] = useState<Prescription[]>([]);
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState<string | null>(null);
  const [isAddingNewPatient, setIsAddingNewPatient] = useState(false);
  
  // Local storage for unsaved prescription data (keyed by patient/prescription ID)
  const [localPrescriptionData, setLocalPrescriptionData] = useState<{
    [key: string]: {
      medicines: ExtendedMedicine[];
      notes: string;
      presentingComplaint: string;
      pastMedicalHistory: string;
      surgicalHistory: string;
      currentMedications: string;
      allergies: string;
      familyHistory: string;
      temperature: string;
      bloodPressure: string;
      heartRate: string;
      respiratoryRate: string;
      oxygenSaturation: string;
      lungs: string;
      abdomen: string;
      otherExamination: string;
      tsh: string;
      hba1c: string;
      ldl: string;
      cholesterol: string;
      glucose: string;
      creatinine: string;
      otherLabResults: string;
      wbc: string;
      ne: string;
      ly: string;
      hb: string;
      plt: string;
      crp: string;
      esr: string;
      pus: string;
      red: string;
      sug: string;
      aib: string;
      org: string;
      tc: string;
      tg: string;
      hdl: string;
      vldl: string;
      tcHdl: string;
      fbs: string;
      sCr: string;
      ast: string;
      alt: string;
      rf: string;
      customLabResults: Array<{ id: string; name: string; value: string }>;
      ecg: string;
      echo: string;
      xray: string;
      ct: string;
      mri: string;
      otherInvestigations: string;
      diagnosis: string;
      appointmentAmount: number | undefined;
      medicalTests: MedicalTest[];
      nextVisitDate: string | undefined;
      procedures: AppointmentProcedure[];
      procedureSearchTerms: { [key: number]: string };
      // For new patients, store patient data
      newPatientData?: {
        name: string;
        dateOfBirth: string;
        gender: string;
        contact: string;
      };
    };
  }>({});
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    dateOfBirth: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    bodyWeight: '',
    gender: '',
    drugAllergies: '',
    contact: ''
  });
  
  // Patient search state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<Patient | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const autoSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [medicines, setMedicines] = useState<ExtendedMedicine[]>([]);
  const [notes, setNotes] = useState('');
  const [medicineTemplates, setMedicineTemplates] = useState<MedicineTemplate[]>([]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState<'create' | 'edit'>('create');
  const [templateForm, setTemplateForm] = useState<{ templateId: string; name: string; description: string }>({
    templateId: '',
    name: '',
    description: ''
  });
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [replaceTemplateMedicines, setReplaceTemplateMedicines] = useState(true);
  const [clearMedicineDialog, setClearMedicineDialog] = useState<{ open: boolean; source: 'inventory' | 'written' | null }>({
    open: false,
    source: null
  });
  const [activeTab, setActiveTab] = useState<'inventory' | 'written'>('inventory');
  
  // Refs for medicine tables to enable auto-scroll
  const inventoryTableRef = useRef<HTMLDivElement>(null);
  const writtenTableRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const newPatientFormRef = useRef<HTMLDivElement>(null);
  const documentsSectionRef = useRef<HTMLDivElement>(null);
  const [lastAddedMedicineId, setLastAddedMedicineId] = useState<string | null>(null);
  
  // Procedures state - editable list
  const [procedures, setProcedures] = useState<AppointmentProcedure[]>([]);
  const [availableProcedures, setAvailableProcedures] = useState<DoctorProcedure[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [procedureSearchTerms, setProcedureSearchTerms] = useState<{ [key: number]: string }>({});
  const [showProcedureDropdown, setShowProcedureDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Create new procedure modal state
  const [showCreateProcedureModal, setShowCreateProcedureModal] = useState(false);
  const [creatingProcedureForIndex, setCreatingProcedureForIndex] = useState<number | null>(null);
  const [newProcedureData, setNewProcedureData] = useState({
    name: '',
    doctorCharge: 0,
    description: ''
  });
  const [creatingProcedure, setCreatingProcedure] = useState(false);
  
  // Drug search states
  const [drugOptions, setDrugOptions] = useState<DrugOption[]>([]);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
  const [drugSearchLoading, setDrugSearchLoading] = useState(false);
  const [showDrugDropdown, setShowDrugDropdown] = useState<string | null>(null);
  const [drugDropdownPosition, setDrugDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [quantityInputMode, setQuantityInputMode] = useState<{ [key: string]: 'bottles' | 'ml' }>({});
  
  // Dose/Frequency selection modal state
  const [showDoseFrequencyModal, setShowDoseFrequencyModal] = useState(false);
  const [doseFrequencyModalData, setDoseFrequencyModalData] = useState<{
    medicineId: string;
    type: 'dose' | 'frequency';
    currentValue: string;
  } | null>(null);
  
  // Instructions popover state - track which medicine's popover is open
  const [openInstructionPopover, setOpenInstructionPopover] = useState<string | null>(null);

  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  // const [isEditingAllergies, setIsEditingAllergies] = useState(false);
  // const [editedAllergies, setEditedAllergies] = useState('');
  const [isEditingPatientInfo, setIsEditingPatientInfo] = useState(false);
  const [editedPatientInfo, setEditedPatientInfo] = useState({
    name: '',
    dateOfBirth: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    bodyWeight: '',
    gender: '',
    drugAllergies: ''
  });

  const [presentingComplaint, setPresentingComplaint] = useState('');

  // Tags state - loaded from Firebase
  const [presentingComplaintTags, setPresentingComplaintTags] = useState<string[]>([]);
  const [pastMedicalHistoryTags, setPastMedicalHistoryTags] = useState<string[]>([]);
  const [lungsTags, setLungsTags] = useState<string[]>([]);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Function to handle presenting complaint tag click
  const handleTagClick = (tag: string) => {
    setPresentingComplaint(prev => {
      // If field is empty, just add the tag
      if (!prev.trim()) {
        return tag;
      }
      // If field has content, add the tag with a comma separator
      return prev.trim().endsWith(',') ? `${prev.trim()} ${tag}` : `${prev.trim()}, ${tag}`;
    });
  };

  // Function to handle past medical history tag click
  const handleMedicalHistoryTagClick = (tag: string) => {
    setPastMedicalHistory(prev => {
      // If field is empty, just add the tag
      if (!prev.trim()) {
        return tag;
      }
      // If field has content, add the tag with a comma separator
      return prev.trim().endsWith(',') ? `${prev.trim()} ${tag}` : `${prev.trim()}, ${tag}`;
    });
  };

  // Function to handle lungs tag click
  const handleLungsTagClick = (tag: string) => {
    setLungs(prev => {
      // If field is empty, just add the tag
      if (!prev.trim()) {
        return tag;
      }
      // If field has content, add the tag with a comma separator
      return prev.trim().endsWith(',') ? `${prev.trim()} ${tag}` : `${prev.trim()}, ${tag}`;
    });
  };
  
  // Enhanced medical history states
  const [pastMedicalHistory, setPastMedicalHistory] = useState('');
  const [surgicalHistory, setSurgicalHistory] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  
  // Enhanced examination states
  const [temperature, setTemperature] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [lungs, setLungs] = useState('');
  const [abdomen, setAbdomen] = useState('');
  const [otherExamination, setOtherExamination] = useState('');
  
  // Lab results states
  const [tsh, setTsh] = useState('');
  const [hba1c, setHba1c] = useState('');
  const [cholesterol, setCholesterol] = useState('');
  const [glucose, setGlucose] = useState('');
  const [creatinine, setCreatinine] = useState('');
  const [otherLabResults, setOtherLabResults] = useState('');

  // Detailed Lab Results States
  // FBC fields
  const [wbc, setWbc] = useState('');
  const [ne, setNe] = useState('');
  const [ly, setLy] = useState('');
  const [hb, setHb] = useState('');
  const [plt, setPlt] = useState('');
  
  // Other lab fields
  const [crp, setCrp] = useState('');
  const [esr, setEsr] = useState('');
  
  // UFR fields
  const [pus, setPus] = useState('');
  const [red, setRed] = useState('');
  const [sug, setSug] = useState('');
  const [aib, setAib] = useState('');
  const [org, setOrg] = useState('');
  
  // Lipid Profile fields
  const [tc, setTc] = useState('');
  const [tg, setTg] = useState('');
  const [ldl, setLdl] = useState('');
  const [hdl, setHdl] = useState('');
  const [vldl, setVldl] = useState('');
  const [tcHdl, setTcHdl] = useState('');
  
  // Individual test fields
  const [fbs, setFbs] = useState('');
  const [sCr, setSCr] = useState('');
  const [ast, setAst] = useState('');
  const [alt, setAlt] = useState('');
  const [rf, setRf] = useState('');
  
  // Custom lab results state
  const [customLabResults, setCustomLabResults] = useState<Array<{ id: string; name: string; value: string }>>([]);
  
  // Investigation states
  const [ecg, setEcg] = useState('');
  const [echo, setEcho] = useState('');
  const [xray, setXray] = useState('');
  const [ct, setCt] = useState('');
  const [mri, setMri] = useState('');
  const [otherInvestigations, setOtherInvestigations] = useState('');
  
  const [diagnosis, setDiagnosis] = useState('');

  // Appointment Amount
  const [appointmentAmount, setAppointmentAmount] = useState<number | undefined>(undefined);

  // Medical Tests and Next Visit Date
  const [medicalTests, setMedicalTests] = useState<MedicalTest[]>([]);
  const [nextVisitDate, setNextVisitDate] = useState<string | undefined>(undefined);

  // Previous appointment amounts history
  const [previousAppointments, setPreviousAppointments] = useState<Appointment[]>([]);
  const [loadingPreviousAppointments, setLoadingPreviousAppointments] = useState(false);
  const [showAppointmentHistory, setShowAppointmentHistory] = useState(false);

  const [images, setImages] = useState<PrescriptionImage[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageDescriptions, setImageDescriptions] = useState<{ [key: string]: string }>({});
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  const [medicineSource, setMedicineSource] = useState<{ [key: string]: 'inventory' | 'written' }>({});

  const [prescriptionHistory, setPrescriptionHistory] = useState<Prescription[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Referral letter states
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralDoctors, setReferralDoctors] = useState<ReferralDoctor[]>([]);
  const [filteredReferralDoctors, setFilteredReferralDoctors] = useState<ReferralDoctor[]>([]);
  const [selectedReferralDoctor, setSelectedReferralDoctor] = useState<ReferralDoctor | null>(null);
  const [referralNote, setReferralNote] = useState('');
  const [referralDate, setReferralDate] = useState(new Date().toISOString().split('T')[0]);
  const [creatingReferral, setCreatingReferral] = useState(false);
  const [referralDoctorSearchQuery, setReferralDoctorSearchQuery] = useState('');
  const [createdReferralLetterId, setCreatedReferralLetterId] = useState<string | null>(null);
  const [patientImages, setPatientImages] = useState<(PrescriptionImage & { prescriptionDate: Date, appointmentDate: Date })[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryPrescription, setSelectedHistoryPrescription] = useState<Prescription | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PrescriptionImage | null>(null);
  const [appointmentDocuments, setAppointmentDocuments] = useState<AppointmentDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AppointmentDocument | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  
  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewType, setPreviewType] = useState<'full' | 'inventory' | 'written'>('full');
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [printing, setPrinting] = useState<'full' | 'inventory' | 'written' | null>(null);
  // Track which prescription is being previewed (can be different from currently edited one)
  const [previewingPrescriptionId, setPreviewingPrescriptionId] = useState<string | null>(null);


  // useEffect(() => {

  //   if (appointment.payment?.refunded) {
  //     toast.error('Cannot add prescription - appointment has been refunded');
  //     onClose();
  //     return;
  //   }


  //   loadPrescriptionData();
  //   loadMedicineTemplates();
  //   loadDrugInventory();
  //   loadPatientData();
  // }, [appointment.id]);

  useEffect(() => {
    if (existingPrescription?.images) {
      setImages(existingPrescription.images);
    }
  }, [existingPrescription]);

// Initialize appointment amount only if no prescription is loaded yet
// For multi-patient appointments, each patient's amount is stored in their prescription
useEffect(() => {
  // Only set from appointment if we're on the original patient and no prescription exists
  if (
    currentPrescriptionId === 'appointment-original' &&
    !existingPrescription &&
    appointment.manualAppointmentAmount !== undefined &&
    appointment.manualAppointmentAmount !== null &&
    appointmentAmount === undefined
  ) {
    setAppointmentAmount(appointment.manualAppointmentAmount);
  }
}, [appointment.manualAppointmentAmount, appointmentAmount, currentPrescriptionId, existingPrescription]);

  useEffect(() => {
    const initializeData = async () => {
      // Load patient data first to ensure correct patient is shown
      await loadPatientData();
      
      // Then load prescription data (which may update patient data only for different patients)
      await Promise.all([
        loadPrescriptionData(),
        loadMedicineTemplates(),
        loadDrugInventory(),
        loadPrescriptionHistory(), // Add this
        loadPatientImages(), // Add this
        loadReferralDoctors(), // Add this
        loadPreviousAppointments(), // Add this for appointment history
        loadTags(), // Load tags from Firebase
        loadDoctorProcedures(), // Load available procedures for this doctor
        loadAppointmentDocuments() // Load appointment documents
      ]);
    };
  
    initializeData();
  }, [appointment.id, appointment.patientId, appointment.doctorId]);
  
  // Helper function to check if fullscreen is active
  const isFullscreenActive = (): boolean => {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  };

  // Fullscreen functions
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreenActive()) {
        // Enter fullscreen
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(isFullscreenActive());
    };

    // Check initial fullscreen state
    setIsFullscreen(isFullscreenActive());

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
  
  // Keyboard shortcuts for preview zoom
  useEffect(() => {
    if (!showPreviewModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Handle + key (regular + or Shift+=)
      if (event.key === '+' || event.key === '=' || event.code === 'Equal' || event.code === 'NumpadAdd') {
        event.preventDefault();
        setPreviewZoom(prev => Math.min(2, prev + 0.1));
      }
      
      // Handle - key (regular - or numpad -)
      if (event.key === '-' || event.code === 'Minus' || event.code === 'NumpadSubtract') {
        event.preventDefault();
        setPreviewZoom(prev => Math.max(0.5, prev - 0.1));
      }
      
      // Handle 0 key to reset zoom
      if (event.key === '0' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          event.preventDefault();
          setPreviewZoom(1);
          setPreviewPosition({ x: 0, y: 0 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPreviewModal]);

  // Initialize procedures from appointment
  useEffect(() => {
    if (appointment.procedures && appointment.procedures.length > 0) {
      setProcedures([...appointment.procedures]);
      // Initialize search terms with procedure names
      const initialSearchTerms: { [key: number]: string } = {};
      appointment.procedures.forEach((proc, index) => {
        initialSearchTerms[index] = proc.procedureName || '';
      });
      setProcedureSearchTerms(initialSearchTerms);
    } else {
      setProcedures([]);
      setProcedureSearchTerms({});
    }
  }, [appointment.procedures]);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close dropdown if clicking outside the search input and dropdown
      if (showDrugDropdown && 
          !target.closest('[data-dropdown-container]') && 
          !target.closest('.fixed.z-\\[9999\\]')) {
        setShowDrugDropdown(null);
        setDrugDropdownPosition(null);
      }
      
      // Close procedure dropdown if clicking outside
      if (showProcedureDropdown !== null && 
          !target.closest('[data-procedure-dropdown-container]') && 
          !target.closest('.absolute.z-\\[100\\]')) {
        setShowProcedureDropdown(null);
      }
    };

      document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDrugDropdown, showProcedureDropdown]);

  // Auto-scroll to newly added medicine when tab is active
  useEffect(() => {
    if (lastAddedMedicineId) {
      const medicine = medicines.find(m => m.id === lastAddedMedicineId);
      if (medicine) {
        const source = medicine.source;
        const isTabActive = (source === 'inventory' && activeTab === 'inventory') || 
                           (source === 'written' && activeTab === 'written');
        
        if (isTabActive) {
          // Wait for DOM to update and tab to render
          setTimeout(() => {
            const medicineRow = document.getElementById(`medicine-row-${lastAddedMedicineId}`);
            if (medicineRow && scrollAreaRef.current) {
              // Find the scrollable viewport element within ScrollArea
              // Radix ScrollArea wraps content in a viewport div
              const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
              
              if (scrollViewport) {
                // Get positions relative to the document
                const rowRect = medicineRow.getBoundingClientRect();
                const scrollRect = scrollViewport.getBoundingClientRect();
                
                // Calculate how much we need to scroll within the ScrollArea viewport
                // We want to center the row in the visible area of the ScrollArea
                const rowTopInViewport = rowRect.top - scrollRect.top + scrollViewport.scrollTop;
                const viewportCenter = scrollViewport.clientHeight / 2;
                const targetScrollTop = rowTopInViewport - viewportCenter;
                
                // Scroll only within the ScrollArea viewport, keeping header fixed
                scrollViewport.scrollTo({
                  top: Math.max(0, targetScrollTop),
                  behavior: 'smooth'
                });
              } else {
                // Fallback: Try to find viewport by traversing children
                const possibleViewport = Array.from(scrollAreaRef.current.children).find(
                  child => (child as HTMLElement).scrollHeight > (child as HTMLElement).clientHeight
                ) as HTMLElement;
                
                if (possibleViewport) {
                  const rowRect = medicineRow.getBoundingClientRect();
                  const viewportRect = possibleViewport.getBoundingClientRect();
                  const rowTopInViewport = rowRect.top - viewportRect.top + possibleViewport.scrollTop;
                  const viewportCenter = possibleViewport.clientHeight / 2;
                  const targetScrollTop = rowTopInViewport - viewportCenter;
                  
                  possibleViewport.scrollTo({
                    top: Math.max(0, targetScrollTop),
                    behavior: 'smooth'
                  });
                } else {
                  // Final fallback: scroll the table container
                  const tableContainer = source === 'inventory' ? inventoryTableRef.current : writtenTableRef.current;
                  if (tableContainer) {
                    const rowRect = medicineRow.getBoundingClientRect();
                    const containerRect = tableContainer.getBoundingClientRect();
                    
                    if (rowRect.bottom > containerRect.bottom || rowRect.top < containerRect.top) {
                      const rowTopRelativeToContainer = rowRect.top - containerRect.top + tableContainer.scrollTop;
                      const containerCenter = containerRect.height / 2;
                      const targetScrollTop = rowTopRelativeToContainer - containerCenter;
                      
                      tableContainer.scrollTo({
                        top: Math.max(0, targetScrollTop),
                        behavior: 'smooth'
                      });
                    }
                  }
                }
              }
            }
          }, 100);
        }
      }
    }
  }, [lastAddedMedicineId, activeTab, medicines]);

  // Update dropdown position on scroll
  useEffect(() => {
    if (showDrugDropdown && drugDropdownPosition) {
      const handleScroll = () => {
        const medicineId = showDrugDropdown;
        const inputElement = document.getElementById(`medicine-${medicineId}`);
        if (inputElement) {
          const rect = inputElement.getBoundingClientRect();
          setDrugDropdownPosition({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width
          });
        }
      };

      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [showDrugDropdown, drugDropdownPosition]);

  // Debug medicine state changes
  useEffect(() => {
    console.log('=== MEDICINE STATE DEBUG ===');
    console.log('Current medicines:', medicines);
    medicines.forEach((med, index) => {
      console.log(`Medicine ${index + 1}:`, {
        id: med.id,
        medicineName: med.medicineName,
        source: med.source,
        selectedDrugId: med.selectedDrugId,
        genericName: med.genericName
      });
    });
  }, [medicines]);

  const loadPrescriptionData = async () => {
    try {
      if (appointment.id) {
        // Load all prescriptions for this appointment (multi-patient support)
        const allPrescriptions = await prescriptionService.getAllPrescriptionsByAppointmentId(appointment.id);
        setAllPrescriptions(allPrescriptions);
        
        // If there are existing prescriptions, load the original patient's prescription first (or selected one)
        let prescriptionToLoad: Prescription | null = null;
        if (allPrescriptions.length > 0) {
          // Check if we should load original patient's prescription or a different one
          if (currentPrescriptionId === 'appointment-original') {
            // User wants to see original patient - find their prescription if it exists
            const originalPrescription = allPrescriptions.find(p => p.patientId === appointment.patientId);
            if (originalPrescription) {
              prescriptionToLoad = originalPrescription;
              setCurrentPrescriptionId(originalPrescription.id || 'appointment-original');
            } else {
              // Original patient has no prescription yet
              setCurrentPrescriptionId('appointment-original');
              prescriptionToLoad = null;
            }
          } else if (currentPrescriptionId && currentPrescriptionId !== 'appointment-original') {
            // Load selected prescription
            const selectedPrescription = allPrescriptions.find(p => p.id === currentPrescriptionId);
            if (selectedPrescription) {
              prescriptionToLoad = selectedPrescription;
              setCurrentPrescriptionId(selectedPrescription.id || null);
            } else {
              // Selected prescription not found - default to original patient's prescription
              const originalPrescription = allPrescriptions.find(p => p.patientId === appointment.patientId);
              if (originalPrescription) {
                prescriptionToLoad = originalPrescription;
                setCurrentPrescriptionId(originalPrescription.id || 'appointment-original');
              } else {
                // No prescription for original patient - show original appointment patient instead
                prescriptionToLoad = null;
                setCurrentPrescriptionId('appointment-original');
                // Ensure we're showing the original appointment patient data
                try {
                  const patient = await appointmentService.getPatientById(appointment.patientId);
                  if (patient) {
                    setPatientData(patient);
                    const dobParts = parseDateToString(patient.dateOfBirth);
                    setEditedPatientInfo({
                      name: patient.name || appointment.patientName,
                      dateOfBirth: patient.dateOfBirth || '',
                      dobDay: dobParts.day,
                      dobMonth: dobParts.month,
                      dobYear: dobParts.year,
                      bodyWeight: patient.bodyWeight ? patient.bodyWeight.toString() : '',
                      gender: patient.gender || 'not_specified',
                      drugAllergies: patient.drugAllergies || ''
                    });
                  }
                } catch (error) {
                  console.error('Error ensuring correct patient data:', error);
                }
              }
            }
          } else {
            // Default: prioritize original appointment patient's prescription
            const originalPrescription = allPrescriptions.find(p => p.patientId === appointment.patientId);
            if (originalPrescription) {
              prescriptionToLoad = originalPrescription;
              setCurrentPrescriptionId(originalPrescription.id || 'appointment-original');
            } else {
              // No prescription for original patient
              // Don't load any prescription - show original appointment patient instead
              prescriptionToLoad = null;
              setCurrentPrescriptionId('appointment-original');
              // Ensure we're showing the original appointment patient data
              // Patient data should already be loaded by loadPatientData(), but ensure it's correct
              try {
                const patient = await appointmentService.getPatientById(appointment.patientId);
                if (patient) {
                  setPatientData(patient);
                  const dobParts2 = parseDateToString(patient.dateOfBirth);
                  setEditedPatientInfo({
                    name: patient.name || appointment.patientName,
                    dateOfBirth: patient.dateOfBirth || '',
                    dobDay: dobParts2.day,
                    dobMonth: dobParts2.month,
                    dobYear: dobParts2.year,
                    bodyWeight: patient.bodyWeight ? patient.bodyWeight.toString() : '',
                    gender: patient.gender || 'not_specified',
                    drugAllergies: patient.drugAllergies || ''
                  });
                }
              } catch (error) {
                console.error('Error ensuring correct patient data:', error);
              }
            }
          }
        } else {
          // No prescriptions yet - this is the first patient (appointment patient)
          setCurrentPrescriptionId('appointment-original');
          setExistingPrescription(null);
        }
        
        const prescription = prescriptionToLoad;
        if (prescription) {
          // Only set existingPrescription if this prescription is NOT for the original appointment patient
          // If it's for the original patient, we still want to show appointment.patientName in header
          if (prescription.patientId !== appointment.patientId) {
            setExistingPrescription(prescription);
          } else {
            // This is the original patient's prescription - don't set existingPrescription
            // so header shows appointment.patientName
            setExistingPrescription(null);
          }
          
          setMedicines(prescription.medicines && prescription.medicines.length > 0 
            ? prescription.medicines.map(med => ({ ...med }))
            : []);
          setNotes(prescription.notes || '');
          
          // Load enhanced medical fields
          setPresentingComplaint(prescription.presentingComplaint || '');
          
          // Load medical history
          setPastMedicalHistory(prescription.medicalHistory?.pastMedicalHistory || '');
          setSurgicalHistory(prescription.medicalHistory?.surgicalHistory || '');
          setCurrentMedications(prescription.medicalHistory?.currentMedications || '');
          setAllergies(prescription.medicalHistory?.allergies || '');
          setFamilyHistory(prescription.medicalHistory?.familyHistory || '');
          
          // Load examination findings
          setTemperature(prescription.onExamination?.temperature || '');
          setBloodPressure(prescription.onExamination?.bloodPressure || '');
          setHeartRate(prescription.onExamination?.heartRate || '');
          setRespiratoryRate(prescription.onExamination?.respiratoryRate || '');
          setOxygenSaturation(prescription.onExamination?.oxygenSaturation || '');
          setLungs(prescription.onExamination?.lungs || '');
          setAbdomen(prescription.onExamination?.abdomen || '');
          setOtherExamination(prescription.onExamination?.other || '');
          
          // Load lab results
          setTsh(prescription.labResults?.tsh || '');
          setHba1c(prescription.labResults?.hba1c || '');
          setLdl(prescription.labResults?.ldl || '');
          setCholesterol(prescription.labResults?.cholesterol || '');
          setGlucose(prescription.labResults?.glucose || '');
          setCreatinine(prescription.labResults?.creatinine || '');
          setOtherLabResults(prescription.labResults?.other || '');
          
          // Load detailed lab results
          setWbc(prescription.labResults?.wbc || '');
          setNe(prescription.labResults?.ne || '');
          setLy(prescription.labResults?.ly || '');
          setHb(prescription.labResults?.hb || '');
          setPlt(prescription.labResults?.plt || '');
          setCrp(prescription.labResults?.crp || '');
          setEsr(prescription.labResults?.esr || '');
          setPus(prescription.labResults?.pus || '');
          setRed(prescription.labResults?.red || '');
          setSug(prescription.labResults?.sug || '');
          setAib(prescription.labResults?.aib || '');
          setOrg(prescription.labResults?.org || '');
          setTc(prescription.labResults?.tc || '');
          setTg(prescription.labResults?.tg || '');
          setLdl(prescription.labResults?.ldl || '');
          setHdl(prescription.labResults?.hdl || '');
          setVldl(prescription.labResults?.vldl || '');
          setTcHdl(prescription.labResults?.tcHdl || '');
          setFbs(prescription.labResults?.fbs || '');
          setSCr(prescription.labResults?.sCr || '');
          setAst(prescription.labResults?.ast || '');
          setAlt(prescription.labResults?.alt || '');
          setRf(prescription.labResults?.rf || '');
          
          // Load custom lab results
          setCustomLabResults(prescription.labResults?.customLabResults || []);
          
          // Load investigations
          setEcg(prescription.investigations?.ecg || '');
          setEcho(prescription.investigations?.echo || '');
          setXray(prescription.investigations?.xray || '');
          setCt(prescription.investigations?.ct || '');
          setMri(prescription.investigations?.mri || '');
          setOtherInvestigations(prescription.investigations?.other || '');
          
          setDiagnosis(prescription.diagnosis || '');
          setAppointmentAmount(prescription.appointmentAmount);
          setMedicalTests(prescription.medicalTests || []);
          setNextVisitDate(prescription.nextVisitDate);
          
          // Load patient data for this prescription
          // IMPORTANT: Only load patient data if this prescription is NOT for the appointment's original patient
          // If it's for the appointment's original patient, we should use the patient data already loaded by loadPatientData()
          if (prescription.patientId !== appointment.patientId) {
            // This is a different patient's prescription - load their patient data
            try {
              const patient = await appointmentService.getPatientById(prescription.patientId);
              if (patient) {
                // Verify we're loading the correct patient
                if (patient.id !== prescription.patientId) {
                  console.error('Patient ID mismatch when loading prescription patient!', {
                    expected: prescription.patientId,
                    got: patient.id
                  });
                }
                setPatientData(patient);
                const dobParts = parseDateToString(patient.dateOfBirth);
                setEditedPatientInfo({
                  name: patient.name || prescription.patientName,
                  dateOfBirth: patient.dateOfBirth || '',
                  dobDay: dobParts.day,
                  dobMonth: dobParts.month,
                  dobYear: dobParts.year,
                  bodyWeight: patient.bodyWeight ? patient.bodyWeight.toString() : '',
                  gender: patient.gender || 'not_specified',
                  drugAllergies: patient.drugAllergies || ''
                });
              }
            } catch (error) {
              console.error('Error loading patient data for prescription:', error);
            }
          } else {
            // This prescription is for the appointment's original patient
            // CRITICAL: Always reload and verify patient data matches appointment patient
            // This ensures we're showing the correct patient even if previous loads were incorrect
            try {
              const patient = await appointmentService.getPatientById(appointment.patientId);
              if (patient) {
                // Verify we loaded the correct patient for this appointment
                if (patient.id !== appointment.patientId) {
                  console.error('CRITICAL: Patient ID mismatch for appointment patient!', {
                    appointmentId: appointment.id,
                    expectedPatientId: appointment.patientId,
                    gotPatientId: patient.id,
                    appointmentPatientName: appointment.patientName
                  });
                  toast.error('Patient data mismatch detected');
                }
                setPatientData(patient);
                const dobParts3 = parseDateToString(patient.dateOfBirth);
                setEditedPatientInfo({
                  name: patient.name || appointment.patientName,
                  dateOfBirth: patient.dateOfBirth || '',
                  dobDay: dobParts3.day,
                  dobMonth: dobParts3.month,
                  dobYear: dobParts3.year,
                  bodyWeight: patient.bodyWeight ? patient.bodyWeight.toString() : '',
                  gender: patient.gender || 'not_specified',
                  drugAllergies: patient.drugAllergies || ''
                });
              } else {
                // Patient not found in database - use appointment data as fallback
                console.warn('Patient not found in database, using appointment data', {
                  appointmentId: appointment.id,
                  patientId: appointment.patientId,
                  patientName: appointment.patientName
                });
                setPatientData({
                  id: appointment.patientId,
                  name: appointment.patientName,
                  contactNumber: appointment.patientContact || '',
                  email: '',
                  dateOfBirth: undefined,
                  gender: undefined,
                  bodyWeight: undefined,
                  drugAllergies: '',
                  createdAt: new Date(),
                  updatedAt: new Date()
                });
                setEditedPatientInfo({
                  name: appointment.patientName,
                  dateOfBirth: '',
                  dobDay: '',
                  dobMonth: '',
                  dobYear: '',
                  bodyWeight: '',
                  gender: 'not_specified',
                  drugAllergies: ''
                });
              }
            } catch (error) {
              console.error('Error loading patient data for appointment:', error);
              // Fallback to appointment data
              setPatientData({
                id: appointment.patientId,
                name: appointment.patientName,
                contactNumber: appointment.patientContact || '',
                email: '',
                dateOfBirth: undefined,
                gender: undefined,
                bodyWeight: undefined,
                drugAllergies: '',
                createdAt: new Date(),
                updatedAt: new Date()
              });
              setEditedPatientInfo({
                name: appointment.patientName,
                dateOfBirth: '',
                dobDay: '',
                dobMonth: '',
                dobYear: '',
                bodyWeight: '',
                gender: 'not_specified',
                drugAllergies: ''
              });
            }
          }
        } else {
          // Start with empty medicines array - users can add medicines as needed
          setMedicines([]);
          // Ensure we're showing the original appointment patient
          setExistingPrescription(null);
          setCurrentPrescriptionId('appointment-original');
          
          // Ensure patient data is loaded for the appointment's patient
          // This handles the case where no prescriptions exist yet
          try {
            const patient = await appointmentService.getPatientById(appointment.patientId);
            if (patient) {
              setPatientData(patient);
              const dobParts6 = parseDateToString(patient.dateOfBirth);
              setEditedPatientInfo({
                name: patient.name || appointment.patientName,
                dateOfBirth: patient.dateOfBirth || '',
                dobDay: dobParts6.day,
                dobMonth: dobParts6.month,
                dobYear: dobParts6.year,
                bodyWeight: patient.bodyWeight ? patient.bodyWeight.toString() : '',
                gender: patient.gender || 'not_specified',
                drugAllergies: patient.drugAllergies || ''
              });
            }
          } catch (error) {
            console.error('Error loading patient data for appointment:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading prescription:', error);
      toast.error('Failed to load prescription data');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientData = async () => {
    try {
      setLoadingPatient(true);
      console.log('Loading patient data for appointment:', {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        patientName: appointment.patientName
      });
      
      const patient = await appointmentService.getPatientById(appointment.patientId);
      
      console.log('Loaded patient data:', {
        patientId: patient?.id,
        patientName: patient?.name,
        matchesAppointment: patient?.id === appointment.patientId
      });
      
      if (patient) {
        // Verify we loaded the correct patient
        if (patient.id !== appointment.patientId) {
          console.error('Patient ID mismatch!', {
            expected: appointment.patientId,
            got: patient.id
          });
          toast.error('Patient data mismatch detected');
        }
        
        setPatientData(patient);
        const dobParts7 = parseDateToString(patient.dateOfBirth);
        setEditedPatientInfo({
          name: patient.name || appointment.patientName,
          dateOfBirth: patient.dateOfBirth || '',
          dobDay: dobParts7.day,
          dobMonth: dobParts7.month,
          dobYear: dobParts7.year,
          bodyWeight: patient.bodyWeight ? patient.bodyWeight.toString() : '',
          gender: patient.gender || 'not_specified',
          drugAllergies: patient.drugAllergies || ''
        });
      } else {
        // Patient not found in database - use appointment data
        console.warn('Patient not found in database, using appointment data');
        setPatientData({
          id: appointment.patientId,
          name: appointment.patientName,
          contactNumber: appointment.patientContact || '',
          email: '',
          dateOfBirth: undefined,
          gender: undefined,
          bodyWeight: undefined,
          drugAllergies: '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setEditedPatientInfo({
          name: appointment.patientName,
          dateOfBirth: '',
          dobDay: '',
          dobMonth: '',
          dobYear: '',
          bodyWeight: '',
          gender: 'not_specified',
          drugAllergies: ''
        });
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient details');
      // Fallback to appointment data
      setPatientData({
        id: appointment.patientId,
        name: appointment.patientName,
        contactNumber: appointment.patientContact || '',
        email: '',
        dateOfBirth: undefined,
        gender: undefined,
        bodyWeight: undefined,
        drugAllergies: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setEditedPatientInfo({
        name: appointment.patientName,
        dateOfBirth: '',
        dobDay: '',
        dobMonth: '',
        dobYear: '',
        bodyWeight: '',
        gender: 'not_specified',
        drugAllergies: ''
      });
    } finally {
      setLoadingPatient(false);
    }
  };

  // Helper functions for custom lab results
  const addCustomLabResult = () => {
    const newLabResult = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      value: ''
    };
    setCustomLabResults([...customLabResults, newLabResult]);
  };

  const removeCustomLabResult = (id: string) => {
    setCustomLabResults(customLabResults.filter(result => result.id !== id));
  };

  const updateCustomLabResult = (id: string, field: 'name' | 'value', value: string) => {
    setCustomLabResults(customLabResults.map(result => 
      result.id === id ? { ...result, [field]: value } : result
    ));
  };

  // Helper function to save current form data locally
  const saveCurrentFormDataLocally = (key: string) => {
    setLocalPrescriptionData(prev => ({
      ...prev,
      [key]: {
        medicines: [...medicines],
        notes,
        presentingComplaint,
        pastMedicalHistory,
        surgicalHistory,
        currentMedications,
        allergies,
        familyHistory,
        temperature,
        bloodPressure,
        heartRate,
        respiratoryRate,
        oxygenSaturation,
        lungs,
        abdomen,
        otherExamination,
        tsh,
        hba1c,
        ldl,
        cholesterol,
        glucose,
        creatinine,
        otherLabResults,
        wbc,
        ne,
        ly,
        hb,
        plt,
        crp,
        esr,
        pus,
        red,
        sug,
        aib,
        org,
        tc,
        tg,
        hdl,
        vldl,
        tcHdl,
        fbs,
        sCr,
        ast,
        alt,
        rf,
        customLabResults: [...customLabResults],
        ecg,
        echo,
        xray,
        ct,
        mri,
        otherInvestigations,
        diagnosis,
        appointmentAmount,
        medicalTests: [...medicalTests],
        nextVisitDate,
        procedures: [...procedures],
        procedureSearchTerms: { ...procedureSearchTerms },
        // Store new patient data if we're adding a new patient
        ...(isAddingNewPatient && newPatientData.name.trim() ? {
          newPatientData: {
            name: newPatientData.name.trim(),
            dateOfBirth: combineDateParts(newPatientData.dobDay, newPatientData.dobMonth, newPatientData.dobYear) || '',
            gender: newPatientData.gender.trim(),
            contact: newPatientData.contact.trim()
          }
        } : {})
      }
    }));
  };

  // Helper function to restore local form data
  const restoreLocalFormData = (key: string) => {
    const localData = localPrescriptionData[key];
    if (localData) {
      setMedicines([...localData.medicines]);
      setNotes(localData.notes);
      setPresentingComplaint(localData.presentingComplaint);
      setPastMedicalHistory(localData.pastMedicalHistory);
      setSurgicalHistory(localData.surgicalHistory);
      setCurrentMedications(localData.currentMedications);
      setAllergies(localData.allergies);
      setFamilyHistory(localData.familyHistory);
      setTemperature(localData.temperature);
      setBloodPressure(localData.bloodPressure);
      setHeartRate(localData.heartRate);
      setRespiratoryRate(localData.respiratoryRate);
      setOxygenSaturation(localData.oxygenSaturation);
      setLungs(localData.lungs);
      setAbdomen(localData.abdomen);
      setOtherExamination(localData.otherExamination);
      setTsh(localData.tsh);
      setHba1c(localData.hba1c);
      setLdl(localData.ldl);
      setCholesterol(localData.cholesterol);
      setGlucose(localData.glucose);
      setCreatinine(localData.creatinine);
      setOtherLabResults(localData.otherLabResults);
      setWbc(localData.wbc);
      setNe(localData.ne);
      setLy(localData.ly);
      setHb(localData.hb);
      setPlt(localData.plt);
      setCrp(localData.crp);
      setEsr(localData.esr);
      setPus(localData.pus);
      setRed(localData.red);
      setSug(localData.sug);
      setAib(localData.aib);
      setOrg(localData.org);
      setTc(localData.tc);
      setTg(localData.tg);
      setHdl(localData.hdl);
      setVldl(localData.vldl);
      setTcHdl(localData.tcHdl);
      setFbs(localData.fbs);
      setSCr(localData.sCr);
      setAst(localData.ast);
      setAlt(localData.alt);
      setRf(localData.rf);
      setCustomLabResults([...localData.customLabResults]);
      setEcg(localData.ecg);
      setEcho(localData.echo);
      setXray(localData.xray);
      setCt(localData.ct);
      setMri(localData.mri);
      setOtherInvestigations(localData.otherInvestigations);
      setDiagnosis(localData.diagnosis);
      setAppointmentAmount(localData.appointmentAmount);
      setMedicalTests([...localData.medicalTests]);
      setNextVisitDate(localData.nextVisitDate);
      setProcedures([...localData.procedures]);
      setProcedureSearchTerms({ ...localData.procedureSearchTerms });
      
      // If this is a temporary new patient, restore new patient data and set isAddingNewPatient
      if (key.startsWith('temp-new-')) {
        setIsAddingNewPatient(true);
        setExistingPrescription(null);
        setCurrentPrescriptionId(key); // Track this temp patient with its key
        
        if (localData.newPatientData) {
          const dobParts = parseDateToString(localData.newPatientData.dateOfBirth);
          setNewPatientData({
            name: localData.newPatientData.name,
            dateOfBirth: localData.newPatientData.dateOfBirth,
            dobDay: dobParts.day,
            dobMonth: dobParts.month,
            dobYear: dobParts.year,
            bodyWeight: '',
            gender: localData.newPatientData.gender,
            drugAllergies: '',
            contact: localData.newPatientData.contact
          });
        } else {
          // If no patient data stored, reset to empty
          setNewPatientData({
            name: '',
            dateOfBirth: '',
            dobDay: '',
            dobMonth: '',
            dobYear: '',
            bodyWeight: '',
            gender: '',
            drugAllergies: '',
            contact: ''
          });
        }
      } else {
        // Not a temp patient, ensure isAddingNewPatient is false
        setIsAddingNewPatient(false);
        
        // If this is a saved prescription ID (not temp, not original), set existingPrescription
        if (key && !key.startsWith('temp-') && key !== `original-${appointment.patientId}`) {
          const savedPrescription = allPrescriptions.find(p => p.id === key);
          if (savedPrescription) {
            setExistingPrescription(savedPrescription);
            setCurrentPrescriptionId(key);
          }
        }
      }
      
      return true;
    }
    return false;
  };

  // Multi-patient helper functions
  const switchToPatient = async (prescriptionId: string) => {
    // Save current form data locally before switching
    let currentKey: string;
    
    // Priority 1: If we have an existing saved prescription, ALWAYS use its ID
    // This prevents accidentally creating temp keys for saved prescriptions
    if (existingPrescription?.id && !isAddingNewPatient) {
      currentKey = existingPrescription.id;
    } else if (isAddingNewPatient) {
      // Priority 2: If we're currently adding a new patient, find existing temp key or create one
      // First, check if currentPrescriptionId is already a temp-new-* key - use it directly
      if (currentPrescriptionId && currentPrescriptionId.startsWith('temp-new-')) {
        currentKey = currentPrescriptionId;
      } else if (newPatientData.name.trim()) {
        // Try to find existing temp key for this patient name
        const patientNameKey = newPatientData.name.trim().replace(/\s+/g, '-').toLowerCase();
        const existingTempKey = Object.keys(localPrescriptionData).find(key => 
          key.startsWith('temp-new-') && 
          key.includes(patientNameKey) &&
          localPrescriptionData[key]?.newPatientData?.name?.trim().toLowerCase() === newPatientData.name.trim().toLowerCase()
        );
        
        if (existingTempKey) {
          // Use existing temp key to avoid duplicates
          currentKey = existingTempKey;
        } else {
          // Create new temp key only if patient name doesn't exist
          currentKey = `temp-new-${patientNameKey}`;
        }
      } else {
        // No name yet - use a generic temp key
        currentKey = `temp-new-unnamed`;
      }
    } else if (currentPrescriptionId === 'appointment-original' || !currentPrescriptionId) {
      currentKey = `original-${appointment.patientId}`;
    } else if (currentPrescriptionId && !currentPrescriptionId.startsWith('temp-') && currentPrescriptionId !== 'appointment-original') {
      // If currentPrescriptionId is a saved prescription ID, use it
      currentKey = currentPrescriptionId;
    } else {
      currentKey = currentPrescriptionId || `original-${appointment.patientId}`;
    }
    
    if (currentKey) {
      // Capture medical tests snapshot before saving to prevent state batching issues
      const medicalTestsSnapshot = [...medicalTests];
      const nextVisitDateSnapshot = nextVisitDate;
      
      // Save with captured values
      setLocalPrescriptionData(prev => ({
        ...prev,
        [currentKey]: {
          medicines: [...medicines],
          notes,
          presentingComplaint,
          pastMedicalHistory,
          surgicalHistory,
          currentMedications,
          allergies,
          familyHistory,
          temperature,
          bloodPressure,
          heartRate,
          respiratoryRate,
          oxygenSaturation,
          lungs,
          abdomen,
          otherExamination,
          tsh,
          hba1c,
          ldl,
          cholesterol,
          glucose,
          creatinine,
          otherLabResults,
          wbc,
          ne,
          ly,
          hb,
          plt,
          crp,
          esr,
          pus,
          red,
          sug,
          aib,
          org,
          tc,
          tg,
          hdl,
          vldl,
          tcHdl,
          fbs,
          sCr,
          ast,
          alt,
          rf,
          customLabResults: [...customLabResults],
          ecg,
          echo,
          xray,
          ct,
          mri,
          otherInvestigations,
          diagnosis,
          appointmentAmount,
          medicalTests: medicalTestsSnapshot, // Use captured snapshot
          nextVisitDate: nextVisitDateSnapshot, // Use captured snapshot
          procedures: [...procedures],
          procedureSearchTerms: { ...procedureSearchTerms },
          ...(isAddingNewPatient && newPatientData.name.trim() ? {
            newPatientData: {
              name: newPatientData.name.trim(),
              dateOfBirth: combineDateParts(newPatientData.dobDay, newPatientData.dobMonth, newPatientData.dobYear) || '',
              gender: newPatientData.gender.trim(),
              contact: newPatientData.contact.trim()
            }
          } : {})
        }
      }));
    }
    
    // Special case: switching to original appointment patient
    if (prescriptionId === 'appointment-original') {
      setCurrentPrescriptionId('appointment-original');
      setExistingPrescription(null);
      setIsAddingNewPatient(false);
      
      // First check for local data
      const localKey = `original-${appointment.patientId}`;
      // Find if there's already a prescription for the original patient
      const originalPrescription = allPrescriptions.find(p => p.patientId === appointment.patientId);
      
      if (restoreLocalFormData(localKey)) {
        // Local data restored, but ensure we're not in "adding new patient" mode
        setIsAddingNewPatient(false);
        setCurrentPrescriptionId('appointment-original');
        // originalPrescription is already found above
        return;
      }
      
      if (originalPrescription) {
        // Load existing prescription for original patient
        // Don't set existingPrescription - this ensures header shows appointment.patientName
        setExistingPrescription(null);
        setMedicines(originalPrescription.medicines && originalPrescription.medicines.length > 0 
          ? originalPrescription.medicines.map(med => ({ ...med }))
          : []);
        setNotes(originalPrescription.notes || '');
        setPresentingComplaint(originalPrescription.presentingComplaint || '');
        setPastMedicalHistory(originalPrescription.medicalHistory?.pastMedicalHistory || '');
        setSurgicalHistory(originalPrescription.medicalHistory?.surgicalHistory || '');
        setCurrentMedications(originalPrescription.medicalHistory?.currentMedications || '');
        setAllergies(originalPrescription.medicalHistory?.allergies || '');
        setFamilyHistory(originalPrescription.medicalHistory?.familyHistory || '');
        setTemperature(originalPrescription.onExamination?.temperature || '');
        setBloodPressure(originalPrescription.onExamination?.bloodPressure || '');
        setHeartRate(originalPrescription.onExamination?.heartRate || '');
        setRespiratoryRate(originalPrescription.onExamination?.respiratoryRate || '');
        setOxygenSaturation(originalPrescription.onExamination?.oxygenSaturation || '');
        setLungs(originalPrescription.onExamination?.lungs || '');
        setAbdomen(originalPrescription.onExamination?.abdomen || '');
        setOtherExamination(originalPrescription.onExamination?.other || '');
        setTsh(originalPrescription.labResults?.tsh || '');
        setHba1c(originalPrescription.labResults?.hba1c || '');
        setLdl(originalPrescription.labResults?.ldl || '');
        setCholesterol(originalPrescription.labResults?.cholesterol || '');
        setGlucose(originalPrescription.labResults?.glucose || '');
        setCreatinine(originalPrescription.labResults?.creatinine || '');
        setOtherLabResults(originalPrescription.labResults?.other || '');
        setWbc(originalPrescription.labResults?.wbc || '');
        setNe(originalPrescription.labResults?.ne || '');
        setLy(originalPrescription.labResults?.ly || '');
        setHb(originalPrescription.labResults?.hb || '');
        setPlt(originalPrescription.labResults?.plt || '');
        setCrp(originalPrescription.labResults?.crp || '');
        setEsr(originalPrescription.labResults?.esr || '');
        setPus(originalPrescription.labResults?.pus || '');
        setRed(originalPrescription.labResults?.red || '');
        setSug(originalPrescription.labResults?.sug || '');
        setAib(originalPrescription.labResults?.aib || '');
        setOrg(originalPrescription.labResults?.org || '');
        setTc(originalPrescription.labResults?.tc || '');
        setTg(originalPrescription.labResults?.tg || '');
        setHdl(originalPrescription.labResults?.hdl || '');
        setVldl(originalPrescription.labResults?.vldl || '');
        setTcHdl(originalPrescription.labResults?.tcHdl || '');
        setFbs(originalPrescription.labResults?.fbs || '');
        setSCr(originalPrescription.labResults?.sCr || '');
        setAst(originalPrescription.labResults?.ast || '');
        setAlt(originalPrescription.labResults?.alt || '');
        setRf(originalPrescription.labResults?.rf || '');
        setCustomLabResults(originalPrescription.labResults?.customLabResults || []);
        setEcg(originalPrescription.investigations?.ecg || '');
        setEcho(originalPrescription.investigations?.echo || '');
        setXray(originalPrescription.investigations?.xray || '');
        setCt(originalPrescription.investigations?.ct || '');
        setMri(originalPrescription.investigations?.mri || '');
        setOtherInvestigations(originalPrescription.investigations?.other || '');
        setDiagnosis(originalPrescription.diagnosis || '');
        setAppointmentAmount(originalPrescription.appointmentAmount);
        setMedicalTests(originalPrescription.medicalTests || []);
        setNextVisitDate(originalPrescription.nextVisitDate);
      } else {
        // No prescription yet - reset to empty form
        setMedicines([]);
        setNotes('');
        setPresentingComplaint('');
        setPastMedicalHistory('');
        setSurgicalHistory('');
        setCurrentMedications('');
        setAllergies('');
        setFamilyHistory('');
        setTemperature('');
        setBloodPressure('');
        setHeartRate('');
        setRespiratoryRate('');
        setOxygenSaturation('');
        setLungs('');
        setAbdomen('');
        setOtherExamination('');
        setTsh('');
        setHba1c('');
        setLdl('');
        setCholesterol('');
        setGlucose('');
        setCreatinine('');
        setOtherLabResults('');
        setWbc('');
        setNe('');
        setLy('');
        setHb('');
        setPlt('');
        setCrp('');
        setEsr('');
        setPus('');
        setRed('');
        setSug('');
        setAib('');
        setOrg('');
        setTc('');
        setTg('');
        setHdl('');
        setVldl('');
        setTcHdl('');
        setFbs('');
        setSCr('');
        setAst('');
        setAlt('');
        setRf('');
        setCustomLabResults([]);
        setEcg('');
        setEcho('');
        setXray('');
        setCt('');
        setMri('');
        setOtherInvestigations('');
        setDiagnosis('');
        setAppointmentAmount(undefined);
        setMedicalTests([]);
        setNextVisitDate(undefined);
      }
      
      // Load original patient data
      try {
        const patient = await appointmentService.getPatientById(appointment.patientId);
        if (patient) {
          setPatientData(patient);
          setEditedPatientInfo({
            name: patient.name || appointment.patientName,
            dateOfBirth: patient.dateOfBirth || '',
            bodyWeight: patient.bodyWeight ? patient.bodyWeight.toString() : '',
            gender: patient.gender || 'not_specified',
            drugAllergies: patient.drugAllergies || ''
          });
        }
      } catch (error) {
        console.error('Error loading patient data:', error);
      }
      
      // If no prescription exists for original patient, load appointment amount from appointment
      if (!originalPrescription) {
        setAppointmentAmount(appointment.manualAppointmentAmount);
      }
      
      return;
    }
    
    // Regular prescription selection
    const prescription = allPrescriptions.find(p => p.id === prescriptionId);
    if (!prescription) {
      // Prescription not found - might be a temp patient, check local data
      if (prescriptionId.startsWith('temp-new-')) {
        // This is a temp patient, restoreLocalFormData will handle it
        if (restoreLocalFormData(prescriptionId)) {
          return;
        }
      }
      return;
    }
    
    setCurrentPrescriptionId(prescriptionId);
    setExistingPrescription(prescription);
    setIsAddingNewPatient(false);
    
    // First check for local data (unsaved changes)
    if (restoreLocalFormData(prescriptionId)) {
      // Local data restored - but ensure we still have the prescription reference
      // This is critical: always maintain that this is a SAVED prescription, not a new patient
      setExistingPrescription(prescription);
      setCurrentPrescriptionId(prescriptionId);
      setIsAddingNewPatient(false);
      
      // Double-check: if somehow isAddingNewPatient got set, fix it
      if (isAddingNewPatient) {
        setIsAddingNewPatient(false);
      }
      
      return;
    }
    
    // Load prescription data from database
    setMedicines(prescription.medicines && prescription.medicines.length > 0 
      ? prescription.medicines.map(med => ({ ...med }))
      : []);
    setNotes(prescription.notes || '');
    setPresentingComplaint(prescription.presentingComplaint || '');
    setPastMedicalHistory(prescription.medicalHistory?.pastMedicalHistory || '');
    setSurgicalHistory(prescription.medicalHistory?.surgicalHistory || '');
    setCurrentMedications(prescription.medicalHistory?.currentMedications || '');
    setAllergies(prescription.medicalHistory?.allergies || '');
    setFamilyHistory(prescription.medicalHistory?.familyHistory || '');
    setTemperature(prescription.onExamination?.temperature || '');
    setBloodPressure(prescription.onExamination?.bloodPressure || '');
    setHeartRate(prescription.onExamination?.heartRate || '');
    setRespiratoryRate(prescription.onExamination?.respiratoryRate || '');
    setOxygenSaturation(prescription.onExamination?.oxygenSaturation || '');
    setLungs(prescription.onExamination?.lungs || '');
    setAbdomen(prescription.onExamination?.abdomen || '');
    setOtherExamination(prescription.onExamination?.other || '');
    setTsh(prescription.labResults?.tsh || '');
    setHba1c(prescription.labResults?.hba1c || '');
    setLdl(prescription.labResults?.ldl || '');
    setCholesterol(prescription.labResults?.cholesterol || '');
    setGlucose(prescription.labResults?.glucose || '');
    setCreatinine(prescription.labResults?.creatinine || '');
    setOtherLabResults(prescription.labResults?.other || '');
    setWbc(prescription.labResults?.wbc || '');
    setNe(prescription.labResults?.ne || '');
    setLy(prescription.labResults?.ly || '');
    setHb(prescription.labResults?.hb || '');
    setPlt(prescription.labResults?.plt || '');
    setCrp(prescription.labResults?.crp || '');
    setEsr(prescription.labResults?.esr || '');
    setPus(prescription.labResults?.pus || '');
    setRed(prescription.labResults?.red || '');
    setSug(prescription.labResults?.sug || '');
    setAib(prescription.labResults?.aib || '');
    setOrg(prescription.labResults?.org || '');
    setTc(prescription.labResults?.tc || '');
    setTg(prescription.labResults?.tg || '');
    setHdl(prescription.labResults?.hdl || '');
    setVldl(prescription.labResults?.vldl || '');
    setTcHdl(prescription.labResults?.tcHdl || '');
    setFbs(prescription.labResults?.fbs || '');
    setSCr(prescription.labResults?.sCr || '');
    setAst(prescription.labResults?.ast || '');
    setAlt(prescription.labResults?.alt || '');
    setRf(prescription.labResults?.rf || '');
    setCustomLabResults(prescription.labResults?.customLabResults || []);
    setEcg(prescription.investigations?.ecg || '');
    setEcho(prescription.investigations?.echo || '');
    setXray(prescription.investigations?.xray || '');
    setCt(prescription.investigations?.ct || '');
    setMri(prescription.investigations?.mri || '');
    setOtherInvestigations(prescription.investigations?.other || '');
    setDiagnosis(prescription.diagnosis || '');
    setAppointmentAmount(prescription.appointmentAmount);
    setMedicalTests(prescription.medicalTests || []);
    setNextVisitDate(prescription.nextVisitDate);
    
    // Load patient data if available
    if (prescription.patientDateOfBirth) {
      const dobParts4 = parseDateToString(prescription.patientDateOfBirth);
      setEditedPatientInfo({
        name: prescription.patientName,
        dateOfBirth: prescription.patientDateOfBirth,
        dobDay: dobParts4.day,
        dobMonth: dobParts4.month,
        dobYear: dobParts4.year,
        bodyWeight: '',
        gender: '',
        drugAllergies: prescription.medicalHistory?.allergies || ''
      });
    } else if (prescription.patientId) {
      try {
        const patient = await appointmentService.getPatientById(prescription.patientId);
        if (patient) {
          setPatientData(patient);
          const dobParts5 = parseDateToString(patient.dateOfBirth);
          setEditedPatientInfo({
            name: patient.name || prescription.patientName,
            dateOfBirth: patient.dateOfBirth || '',
            dobDay: dobParts5.day,
            dobMonth: dobParts5.month,
            dobYear: dobParts5.year,
            bodyWeight: patient.bodyWeight ? patient.bodyWeight.toString() : '',
            gender: patient.gender || 'not_specified',
            drugAllergies: patient.drugAllergies || ''
          });
        }
      } catch (error) {
        console.error('Error loading patient data:', error);
      }
    }
  };

  const handleAddNewPatient = async () => {
    // Save current patient's form data locally (not to database)
    // Determine the key for local storage
    let currentKey: string;
    
    if (isAddingNewPatient) {
      // If we're already adding a new patient, find existing temp key or create one
      if (newPatientData.name.trim()) {
        const patientNameKey = newPatientData.name.trim().replace(/\s+/g, '-').toLowerCase();
        const existingTempKey = Object.keys(localPrescriptionData).find(key => 
          key.startsWith('temp-new-') && 
          key.includes(patientNameKey) &&
          localPrescriptionData[key]?.newPatientData?.name?.trim().toLowerCase() === newPatientData.name.trim().toLowerCase()
        );
        currentKey = existingTempKey || `temp-new-${patientNameKey}`;
      } else {
        currentKey = `temp-new-unnamed`;
      }
    } else if (currentPrescriptionId === 'appointment-original' || !currentPrescriptionId) {
      currentKey = `original-${appointment.patientId}`;
    } else if (existingPrescription?.id) {
      currentKey = existingPrescription.id;
    } else {
      currentKey = currentPrescriptionId || `original-${appointment.patientId}`;
    }
    
    // Save current form data locally before switching
    // IMPORTANT: Capture current medical tests before resetting to ensure they're saved correctly
    const currentMedicalTestsSnapshot = [...medicalTests];
    const currentNextVisitDateSnapshot = nextVisitDate;
    
    // Save with captured values to prevent React state batching issues
    setLocalPrescriptionData(prev => ({
      ...prev,
      [currentKey]: {
        medicines: [...medicines],
        notes,
        presentingComplaint,
        pastMedicalHistory,
        surgicalHistory,
        currentMedications,
        allergies,
        familyHistory,
        temperature,
        bloodPressure,
        heartRate,
        respiratoryRate,
        oxygenSaturation,
        lungs,
        abdomen,
        otherExamination,
        tsh,
        hba1c,
        ldl,
        cholesterol,
        glucose,
        creatinine,
        otherLabResults,
        wbc,
        ne,
        ly,
        hb,
        plt,
        crp,
        esr,
        pus,
        red,
        sug,
        aib,
        org,
        tc,
        tg,
        hdl,
        vldl,
        tcHdl,
        fbs,
        sCr,
        ast,
        alt,
        rf,
        customLabResults: [...customLabResults],
        ecg,
        echo,
        xray,
        ct,
        mri,
        otherInvestigations,
        diagnosis,
        appointmentAmount,
        medicalTests: currentMedicalTestsSnapshot, // Use captured snapshot
        nextVisitDate: currentNextVisitDateSnapshot, // Use captured snapshot
        procedures: [...procedures],
        procedureSearchTerms: { ...procedureSearchTerms },
        ...(isAddingNewPatient && newPatientData.name.trim() ? {
          newPatientData: {
            name: newPatientData.name.trim(),
            dateOfBirth: combineDateParts(newPatientData.dobDay, newPatientData.dobMonth, newPatientData.dobYear) || '',
            gender: newPatientData.gender.trim(),
            contact: newPatientData.contact.trim()
          }
        } : {})
      }
    }));
    
    // Now switch to new patient form - Reset medical tests IMMEDIATELY to prevent carryover
    setIsAddingNewPatient(true);
    setMedicalTests([]); // Reset immediately - critical to prevent test carryover
    setNextVisitDate(undefined);
    setExistingPrescription(null);
    setCurrentPrescriptionId(null);
    setMedicines([]);
    
    // Auto-scroll to new patient form after a brief delay to allow state update
    setTimeout(() => {
      if (newPatientFormRef.current && scrollAreaRef.current) {
        // Find the scrollable viewport element within ScrollArea
        const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        
        if (scrollViewport && newPatientFormRef.current) {
          // Get positions relative to the scroll viewport
          const formRect = newPatientFormRef.current.getBoundingClientRect();
          const viewportRect = scrollViewport.getBoundingClientRect();
          
          // Calculate scroll position to bring form to top of viewport
          const scrollTop = scrollViewport.scrollTop + (formRect.top - viewportRect.top);
          
          scrollViewport.scrollTo({
            top: scrollTop - 20, // Add small offset for better visibility
            behavior: 'smooth'
          });
        }
        
        // Also focus on the first input field after a brief delay
        setTimeout(() => {
          const nameInput = document.getElementById('new-patient-name');
          if (nameInput) {
            (nameInput as HTMLInputElement).focus();
          }
        }, 300);
      }
    }, 100);
    
    // Reset all other form fields (medical tests already reset above in setTimeout)
    setNotes('');
    setPresentingComplaint('');
    setPastMedicalHistory('');
    setSurgicalHistory('');
    setCurrentMedications('');
    setAllergies('');
    setFamilyHistory('');
    setTemperature('');
    setBloodPressure('');
    setHeartRate('');
    setRespiratoryRate('');
    setOxygenSaturation('');
    setLungs('');
    setAbdomen('');
    setOtherExamination('');
    setTsh('');
    setHba1c('');
    setLdl('');
    setCholesterol('');
    setGlucose('');
    setCreatinine('');
    setOtherLabResults('');
    setWbc('');
    setNe('');
    setLy('');
    setHb('');
    setPlt('');
    setCrp('');
    setEsr('');
    setPus('');
    setRed('');
    setSug('');
    setAib('');
    setOrg('');
    setTc('');
    setTg('');
    setHdl('');
    setVldl('');
    setTcHdl('');
    setFbs('');
    setSCr('');
    setAst('');
    setAlt('');
    setRf('');
    setCustomLabResults([]);
    setEcg('');
    setEcho('');
    setXray('');
    setCt('');
    setMri('');
    setOtherInvestigations('');
    setDiagnosis('');
    setAppointmentAmount(undefined);
    // Medical tests already reset above - don't reset again
    // setMedicalTests([]); - Already reset above
    // setNextVisitDate(undefined); - Already reset above
    setPatientData(null);
    setNewPatientData({
      name: '',
      dateOfBirth: '',
      dobDay: '',
      dobMonth: '',
      dobYear: '',
      bodyWeight: '',
      gender: '',
      drugAllergies: '',
      contact: ''
    });
    
    // Reset procedures to empty for new patient (each patient can have their own procedures)
    setProcedures([]);
    setProcedureSearchTerms({});
  };

  const handleCancelNewPatient = () => {
    setIsAddingNewPatient(false);
    // Reset search state
    setPatientSearchQuery('');
    setSearchResults([]);
    setSelectedExistingPatient(null);
    setShowSearchResults(false);
    setNewPatientData({
      name: '',
      dateOfBirth: '',
      dobDay: '',
      dobMonth: '',
      dobYear: '',
      bodyWeight: '',
      gender: '',
      drugAllergies: '',
      contact: ''
    });
    // Reload the first prescription if available
    if (allPrescriptions.length > 0) {
      switchToPatient(allPrescriptions[0].id!);
    }
  };
  
  const handlePatientSearch = async () => {
    if (!patientSearchQuery.trim() || patientSearchQuery.trim().length < 2) {
      toast.error('Please enter at least 2 characters to search');
      return;
    }
    
    setSearchingPatients(true);
    try {
      const results = await appointmentService.searchPatients(patientSearchQuery.trim());
      
      if (results.length === 0) {
        setSearchResults([]);
        setShowSearchResults(false);
        toast.info('No existing patient found. You can add a new patient below.');
      } else if (results.length === 1) {
        // Auto-select if only one result
        handleSelectExistingPatient(results[0]);
      } else {
        // Show list if multiple results
        setSearchResults(results);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching for patients:', error);
      toast.error('Failed to search for patients');
    } finally {
      setSearchingPatients(false);
    }
  };
  
  const handleSearchInputChange = (value: string) => {
    setPatientSearchQuery(value);
    
    // Clear any existing timeout
    if (autoSearchTimeoutRef.current) {
      clearTimeout(autoSearchTimeoutRef.current);
      autoSearchTimeoutRef.current = null;
    }
    
    // Auto-search when exactly 10 digits are entered (phone number)
    const numericValue = value.replace(/\D/g, ''); // Remove non-numeric characters
    if (numericValue.length === 10 && /^\d{10}$/.test(numericValue)) {
      // Debounce the auto-search to avoid multiple rapid searches
      autoSearchTimeoutRef.current = setTimeout(() => {
        // Check if we're not already searching and value is still valid
        if (!searchingPatients && value.trim().length >= 2) {
          // Use the current value from the closure
          const trimmedValue = value.trim();
          if (trimmedValue.length >= 2) {
            handlePatientSearch();
          }
        }
      }, 300); // 300ms debounce
    }
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSearchTimeoutRef.current) {
        clearTimeout(autoSearchTimeoutRef.current);
      }
    };
  }, []);
  
  const handleSelectExistingPatient = (patient: Patient) => {
    setSelectedExistingPatient(patient);
    const dobParts = parseDateToString(patient.dateOfBirth);
    setNewPatientData({
      name: patient.name || '',
      dateOfBirth: patient.dateOfBirth || '',
      dobDay: dobParts.day,
      dobMonth: dobParts.month,
      dobYear: dobParts.year,
      bodyWeight: patient.bodyWeight ? patient.bodyWeight.toString() : '',
      gender: patient.gender || '',
      drugAllergies: patient.drugAllergies || '',
      contact: patient.contactNumber || ''
    });
    setShowSearchResults(false);
    setPatientSearchQuery('');
    toast.success('Patient selected! Details loaded.');
  };
  
  const handleClearSelectedPatient = () => {
    setSelectedExistingPatient(null);
    setNewPatientData({
      name: '',
      dateOfBirth: '',
      dobDay: '',
      dobMonth: '',
      dobYear: '',
      bodyWeight: '',
      gender: '',
      drugAllergies: '',
      contact: ''
    });
    setPatientSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };



  const handleSavePatientInfo = async () => {
    if (!patientData?.id) return;
    
    // Validate that name is not empty
    if (!editedPatientInfo.name.trim()) {
      toast.error('Patient name is required');
      return;
    }
    
    try {
      const updateData: any = {
        bodyWeight: editedPatientInfo.bodyWeight ? parseFloat(editedPatientInfo.bodyWeight) : undefined,
        gender: editedPatientInfo.gender === "not_specified" ? undefined : editedPatientInfo.gender,
        drugAllergies: editedPatientInfo.drugAllergies.trim() || undefined
      };

      // Update name if it changed
      if (editedPatientInfo.name.trim() !== patientData.name) {
        updateData.name = editedPatientInfo.name.trim();
      }

      // Update dateOfBirth if it changed (combine day, month, year)
      const combinedDateOfBirth = combineDateParts(editedPatientInfo.dobDay, editedPatientInfo.dobMonth, editedPatientInfo.dobYear);
      if (combinedDateOfBirth !== patientData.dateOfBirth) {
        updateData.dateOfBirth = combinedDateOfBirth || undefined;
      }
  
      await appointmentService.updatePatient(patientData.id, updateData);
      
      // Update local patient state
      const updatedPatientData = { 
        ...patientData,
        name: updateData.name !== undefined ? updateData.name : patientData.name,
        dateOfBirth: updateData.dateOfBirth !== undefined ? updateData.dateOfBirth : patientData.dateOfBirth,
        bodyWeight: updateData.bodyWeight,
        gender: updateData.gender,
        drugAllergies: updateData.drugAllergies || ''
      };
      setPatientData(updatedPatientData);
      
      // Update editedPatientInfo with parsed date parts
      const dobParts = parseDateToString(updatedPatientData.dateOfBirth);
      setEditedPatientInfo(prev => ({
        ...prev,
        dobDay: dobParts.day,
        dobMonth: dobParts.month,
        dobYear: dobParts.year,
        dateOfBirth: updatedPatientData.dateOfBirth || ''
      }));
      
      // Update appointment's patientName if name changed
      if (updateData.name !== undefined && updateData.name !== appointment.patientName && appointment.id) {
        try {
          await appointmentService.updateAppointment(appointment.id, {
            patientName: updateData.name
          });
          // Update the appointment prop's patientName locally by calling onSuccess to refresh
          // The parent component should refresh the appointment data
        } catch (error) {
          console.error('Error updating appointment patient name:', error);
          // Don't fail the whole operation if appointment update fails
        }
      }
      
      setIsEditingPatientInfo(false);
      toast.success('Patient information updated successfully');
    } catch (error) {
      console.error('Error updating patient info:', error);
      toast.error('Failed to update patient information');
    }
  };

  const handleCancelEdit = () => {
    if (patientData) {
      const dobParts = parseDateToString(patientData.dateOfBirth);
      setEditedPatientInfo({
        name: patientData.name || '',
        dateOfBirth: patientData.dateOfBirth || '',
        dobDay: dobParts.day,
        dobMonth: dobParts.month,
        dobYear: dobParts.year,
        bodyWeight: patientData.bodyWeight ? patientData.bodyWeight.toString() : '',
        gender: patientData.gender || 'not_specified',
        drugAllergies: patientData.drugAllergies || ''
      });
    }
    setIsEditingPatientInfo(false);
  };


  const loadMedicineTemplates = async () => {
    if (!appointment.doctorId) {
      return;
    }
    try {
      const templates = await prescriptionService.getMedicineTemplates(appointment.doctorId);
      setMedicineTemplates(templates);
    } catch (error) {
      console.error('Error loading medicine templates:', error);
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      templateId: '',
      name: '',
      description: ''
    });
    setReplaceTemplateMedicines(true);
  };

  const openTemplateModal = (mode: 'create' | 'edit', template?: MedicineTemplate) => {
    setTemplateModalMode(mode);
    if (mode === 'edit' && template) {
      setTemplateForm({
        templateId: template.id || '',
        name: template.name,
        description: template.description || ''
      });
      setReplaceTemplateMedicines(false);
    } else {
      resetTemplateForm();
    }
    setTemplateModalOpen(true);
  };

  const sanitizeTemplateMedicine = (medicine: ExtendedMedicine): Medicine | null => {
    if (!medicine.medicineName || !medicine.medicineName.trim()) {
      return null;
    }

    return {
      id: medicine.id || prescriptionService.generateMedicineId(),
      medicineName: medicine.medicineName.trim(),
      genericName: medicine.genericName,
      tradeName: medicine.tradeName,
      dose: medicine.dose || '',
      customMl: medicine.customMl,
      frequency: medicine.frequency || '',
      days: medicine.days || 0,
      drugCount: medicine.drugCount || 0,
      calculatedMl: medicine.calculatedMl,
      specialNote: medicine.specialNote,
      instructions: medicine.instructions,
      duration: medicine.duration,
      dosage: medicine.dosage,
      source: medicine.source,
      inventoryId: medicine.inventoryId,
      pharmacyEdited: medicine.pharmacyEdited,
      pharmacyAdded: medicine.pharmacyAdded,
      originalDrugCount: medicine.originalDrugCount,
      outOfStock: medicine.outOfStock,
      outOfStockNote: medicine.outOfStockNote
    };
  };

  const getSanitizedMedicinesBySource = (source: 'inventory' | 'written'): Medicine[] => {
    return medicines
      .filter(med => med.source === source)
      .map(sanitizeTemplateMedicine)
      .filter((med): med is Medicine => med !== null);
  };

  const handleSaveTemplate = async () => {
    if (!appointment.doctorId) {
      toast.error('Doctor ID is required to save templates');
      return;
    }

    const trimmedName = templateForm.name.trim();
    if (!trimmedName) {
      toast.error('Template name is required');
      return;
    }

    const shouldCaptureMedicines = templateModalMode === 'create' || replaceTemplateMedicines;
    let inventoryMedicines: Medicine[] = [];
    let writtenMedicines: Medicine[] = [];

    if (shouldCaptureMedicines) {
      inventoryMedicines = getSanitizedMedicinesBySource('inventory');
      writtenMedicines = getSanitizedMedicinesBySource('written');

      if (inventoryMedicines.length === 0 && writtenMedicines.length === 0) {
        toast.error('Add at least one medicine before saving a template');
        return;
      }
    }

    setSavingTemplate(true);
    try {
      if (templateModalMode === 'create') {
        await prescriptionService.createMedicineTemplate({
          doctorId: appointment.doctorId,
          doctorName: appointment.doctorName || user?.displayName || '',
          name: trimmedName,
          description: templateForm.description.trim(),
          inventoryMedicines,
          writtenMedicines,
          isActive: true
        });
        toast.success('Template saved successfully');
      } else {
        if (!templateForm.templateId) {
          toast.error('No template selected to update');
          return;
        }

        const updatePayload: Partial<MedicineTemplate> = {
          name: trimmedName,
          description: templateForm.description.trim()
        };

        if (replaceTemplateMedicines) {
          updatePayload.inventoryMedicines = inventoryMedicines;
          updatePayload.writtenMedicines = writtenMedicines;
        }

        await prescriptionService.updateMedicineTemplate(templateForm.templateId, updatePayload);
        toast.success(replaceTemplateMedicines ? 'Template updated successfully' : 'Template details updated');
      }

      await loadMedicineTemplates();
      setTemplateModalOpen(false);
      resetTemplateForm();
    } catch (error) {
      console.error('Error saving medicine template:', error);
      toast.error('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const cloneTemplateMedicine = (medicine: Medicine): ExtendedMedicine => ({
    ...medicine,
    id: prescriptionService.generateMedicineId(),
    source: medicine.source || 'written'
  });

  const handleApplyTemplate = (template: MedicineTemplate, mode: 'append' | 'replace') => {
    const inventoryMeds = (template.inventoryMedicines || []).map(cloneTemplateMedicine);
    const writtenMeds = (template.writtenMedicines || []).map(cloneTemplateMedicine);
    const templateMedicines = [...inventoryMeds, ...writtenMeds];

    if (templateMedicines.length === 0) {
      toast.error('This template has no medicines to apply');
      return;
    }

    setApplyingTemplateId(template.id || null);

    try {
      const hadNoMedicines = medicines.length === 0;
      const newSourceMap: { [key: string]: 'inventory' | 'written' } = {};
      templateMedicines.forEach(med => {
        newSourceMap[med.id] = med.source;
      });

      if (mode === 'replace') {
        setMedicines(templateMedicines);
        setMedicineSource(newSourceMap);
        if (inventoryMeds.length > 0) {
          setActiveTab('inventory');
        } else if (writtenMeds.length > 0) {
          setActiveTab('written');
        }
      } else {
        setMedicines(prev => [...prev, ...templateMedicines]);
        setMedicineSource(prev => ({ ...prev, ...newSourceMap }));
        if (hadNoMedicines) {
          if (inventoryMeds.length > 0) {
            setActiveTab('inventory');
          } else if (writtenMeds.length > 0) {
            setActiveTab('written');
          }
        }
      }

      setLastAddedMedicineId(templateMedicines[templateMedicines.length - 1]?.id || null);
      setTemplateManagerOpen(false);
      toast.success(mode === 'replace' ? 'Template loaded into prescription' : 'Template medicines added');
    } finally {
      setApplyingTemplateId(null);
    }
  };

  const handleDeleteTemplate = async (templateId?: string) => {
    if (!templateId) {
      toast.error('Template ID missing');
      return;
    }

    setDeletingTemplateId(templateId);
    try {
      await prescriptionService.deleteMedicineTemplate(templateId);
      await loadMedicineTemplates();
      toast.success('Template deleted');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const clearMedicinesBySource = (source: 'inventory' | 'written') => {
    const remainingMedicines = medicines.filter(med => med.source !== source);
    const clearedIds = new Set(medicines.filter(med => med.source === source).map(med => med.id));

    setMedicines(remainingMedicines);
    setMedicineSource(prev => {
      const updated = { ...prev };
      clearedIds.forEach(id => {
        delete updated[id];
      });
      return updated;
    });
    setLastAddedMedicineId(null);
    toast.success(source === 'inventory' ? 'Inventory medicines cleared' : 'Written medicines cleared');
  };

  const handleClearMedicines = (source: 'inventory' | 'written') => {
    const hasMedicines = medicines.some(med => med.source === source);
    if (!hasMedicines) {
      toast.info(source === 'inventory' ? 'No inventory medicines to clear' : 'No written medicines to clear');
      return;
    }

    setClearMedicineDialog({
      open: true,
      source
    });
  };

  const confirmClearMedicines = () => {
    if (!clearMedicineDialog.source) {
      setClearMedicineDialog({ open: false, source: null });
      return;
    }
    clearMedicinesBySource(clearMedicineDialog.source);
    setClearMedicineDialog({ open: false, source: null });
  };

  const cancelClearMedicines = () => {
    setClearMedicineDialog({ open: false, source: null });
  };

  const inventoryMedicineCount = medicines.filter(med => med.source === 'inventory' && med.medicineName && med.medicineName.trim()).length;
  const writtenMedicineCount = medicines.filter(med => med.source === 'written' && med.medicineName && med.medicineName.trim()).length;

  // Load available procedures for the doctor
  const loadDoctorProcedures = async () => {
    if (!appointment.doctorId) return;
    
    setLoadingProcedures(true);
    try {
      const doctorProcs = await doctorService.getDoctorProceduresByDoctorId(appointment.doctorId);
      setAvailableProcedures(doctorProcs.filter(proc => proc.isActive));
    } catch (error) {
      console.error('Error loading doctor procedures:', error);
      toast.error('Failed to load available procedures');
    } finally {
      setLoadingProcedures(false);
    }
  };

  // Add a new procedure - adds empty row for user to fill in
  const addProcedure = () => {
    // Add an empty procedure row
    const newProcedure: AppointmentProcedure = {
      procedureId: '',
      procedureName: '',
      doctorCharge: 0
    };
    
    const newIndex = procedures.length;
    setProcedures([...procedures, newProcedure]);
    // Initialize empty search term for the new procedure
    setProcedureSearchTerms(prev => ({
      ...prev,
      [newIndex]: ''
    }));
  };

  // Remove a procedure
  const removeProcedure = (index: number) => {
    setProcedures(procedures.filter((_, i) => i !== index));
    // Clean up search terms - reindex remaining procedures
    setProcedureSearchTerms(prev => {
      const updated: { [key: number]: string } = {};
      procedures.forEach((proc, i) => {
        if (i !== index) {
          const newIndex = i > index ? i - 1 : i;
          updated[newIndex] = prev[i] || proc.procedureName || '';
        }
      });
      return updated;
    });
    // Close dropdown if it was open for this procedure
    if (showProcedureDropdown === index) {
      setShowProcedureDropdown(null);
    }
  };

  // Update a procedure
  const updateProcedure = (index: number, field: keyof AppointmentProcedure, value: string | number) => {
    const updatedProcedures = [...procedures];
    
    if (field === 'procedureId') {
      // When procedureId changes, update procedureName and doctorCharge from available procedures
      const selectedProcedure = availableProcedures.find(proc => proc.id === value);
      if (selectedProcedure) {
        updatedProcedures[index] = {
          procedureId: selectedProcedure.id!,
          procedureName: selectedProcedure.procedureName || '',
          doctorCharge: selectedProcedure.doctorCharge
        };
        // Update search term to match selected procedure
        setProcedureSearchTerms(prev => ({
          ...prev,
          [index]: selectedProcedure.procedureName || ''
        }));
      }
    } else {
      updatedProcedures[index] = {
        ...updatedProcedures[index],
        [field]: value
      };
    }
    
    setProcedures(updatedProcedures);
  };

  // Open create procedure modal
  const openCreateProcedureModal = (index: number) => {
    const currentSearchTerm = procedureSearchTerms[index] || '';
    setNewProcedureData({
      name: currentSearchTerm,
      doctorCharge: 0,
      description: ''
    });
    setCreatingProcedureForIndex(index);
    setShowCreateProcedureModal(true);
    setShowProcedureDropdown(null);
    
    // If adding a new procedure row (index equals or exceeds current procedures length), 
    // we need to add an empty procedure first so it can be updated
    if (index >= procedures.length) {
      const emptyProcedure: AppointmentProcedure = {
        procedureId: '',
        procedureName: '',
        doctorCharge: 0
      };
      setProcedures([...procedures, emptyProcedure]);
    }
  };

  // Create new procedure
  const handleCreateNewProcedure = async () => {
    if (!appointment.doctorId) {
      toast.error('Doctor ID is required');
      return;
    }

    if (!newProcedureData.name.trim()) {
      toast.error('Procedure name is required');
      return;
    }

    if (newProcedureData.doctorCharge <= 0) {
      toast.error('Doctor charge must be greater than zero');
      return;
    }

    try {
      setCreatingProcedure(true);

      // Step 1: Check if a MedicalProcedure with this name already exists
      const allProcedures = await doctorService.getAllProcedures();
      let procedureId = allProcedures.find(p => 
        p.name.toLowerCase() === newProcedureData.name.trim().toLowerCase()
      )?.id;

      // Step 2: If not exists, create a new MedicalProcedure
      if (!procedureId) {
        const procedurePayload: any = {
          name: newProcedureData.name.trim()
        };
        
        // Only include description if it has a value
        if (newProcedureData.description.trim()) {
          procedurePayload.description = newProcedureData.description.trim();
        }
        
        const newProcedure = await doctorService.createProcedure(procedurePayload);
        procedureId = newProcedure.id;
      }

      if (!procedureId) {
        throw new Error('Failed to get or create procedure');
      }

      // Step 3: Get doctor name
      const doctor = await doctorService.getDoctorById(appointment.doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Step 4: Create a DoctorProcedure linking doctor to procedure with charge
      const doctorProcedurePayload: any = {
        doctorId: appointment.doctorId,
        doctorName: doctor.name || '',
        procedureId: procedureId,
        procedureName: newProcedureData.name.trim(),
        doctorCharge: newProcedureData.doctorCharge,
        isActive: true
      };
      
      // Only include description if it has a value
      if (newProcedureData.description.trim()) {
        doctorProcedurePayload.description = newProcedureData.description.trim();
      }
      
      const doctorProcedure = await doctorService.createDoctorProcedure(doctorProcedurePayload);

      // Step 5: Reload available procedures
      await loadDoctorProcedures();

      // Step 6: Auto-select the newly created procedure
      if (creatingProcedureForIndex !== null) {
        const newProcedureId = doctorProcedure.id!;
        updateProcedure(creatingProcedureForIndex, 'procedureId', newProcedureId);
        setProcedureSearchTerms(prev => ({
          ...prev,
          [creatingProcedureForIndex]: newProcedureData.name.trim()
        }));
      }

      toast.success('Procedure created successfully and added to prescription');
      
      // Close modal and reset
      setShowCreateProcedureModal(false);
      setCreatingProcedureForIndex(null);
      setNewProcedureData({
        name: '',
        doctorCharge: 0,
        description: ''
      });
    } catch (error: any) {
      console.error('Error creating procedure:', error);
      toast.error(error.message || 'Failed to create procedure');
    } finally {
      setCreatingProcedure(false);
    }
  };

  const loadPreviousAppointments = async () => {
    try {
      setLoadingPreviousAppointments(true);
      // Get all appointments for this patient
      const allAppointments = await appointmentService.getAppointmentsByPatient(appointment.patientId);
      
      // Filter to only show:
      // 1. Previous appointments (not the current one)
      // 2. Paid appointments (with charged amounts)
      // 3. Not refunded
      // 4. Has manual appointment amount set
      const previousChargedAppointments = allAppointments.filter(apt => 
        apt.id !== appointment.id && // Not the current appointment
        apt.payment?.isPaid && // Must be paid
        !apt.payment?.refunded && // Not refunded
        apt.manualAppointmentAmount !== undefined && // Has charged amount
        apt.manualAppointmentAmount > 0 // Amount is greater than 0
      );
      
      // Sort by date descending (newest first)
      const sortedAppointments = previousChargedAppointments.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Newest first
      });
      
      setPreviousAppointments(sortedAppointments);
    } catch (error) {
      console.error('Error loading previous appointments:', error);
    } finally {
      setLoadingPreviousAppointments(false);
    }
  };

  const loadDrugInventory = async () => {
    try {
      setDrugSearchLoading(true);
      setDebugInfo('Loading inventory...');
      
      // Get all inventory items
      const allInventory = await inventoryService.getAll();
      setAllInventory(allInventory);
      
      console.log('=== INVENTORY DEBUG ===');
      console.log('Total inventory items loaded:', allInventory.length);
      
      if (allInventory.length === 0) {
        setDebugInfo('No inventory items found in database');
        setDrugOptions([]);
        return;
      }

      // Log first few items to see structure
      console.log('First 3 inventory items:', allInventory.slice(0, 3));
      
      // Get all unique types
      const allTypes = [...new Set(allInventory.map(item => item.type))];
      console.log('All item types found:', allTypes);
      setDebugInfo(`Found ${allInventory.length} items with types: ${allTypes.join(', ')}`);
      
      // For now, let's include ALL items to test the search functionality
      const drugsWithBatches = await Promise.all(
        allInventory.map(async (item, index) => {
          try {
            console.log(`Processing item ${index + 1}/${allInventory.length}: ${item.name}`);
            
            const batches = await purchaseService.getBatchesByItem(item.id!);
            
            // Calculate total quantity from all batches
            const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
            
            // Calculate available units based on unitContains
            const availableUnits = item.hasUnitContains && item.unitContains 
              ? Math.floor(totalQuantity / item.unitContains.value)
              : totalQuantity;

            return {
              id: item.id!,
              code: item.code,
              name: item.name,
              genericName: item.genericName || '',
              type: item.type,
              totalQuantity,
              availableUnits,
              batches
            };
          } catch (error) {
            console.error(`Error loading batches for item ${item.id}:`, error);
            return {
              id: item.id!,
              code: item.code,
              name: item.name,
              genericName: item.genericName || '',
              type: item.type,
              totalQuantity: 0,
              availableUnits: 0,
              batches: []
            };
          }
        })
      );

      console.log('Processed drugs with batches:', drugsWithBatches.length);
      setDrugOptions(drugsWithBatches);
      setDebugInfo(`Loaded ${drugsWithBatches.length} items successfully`);
      
    } catch (error) {
      console.error('Error loading drug inventory:', error);
      setDebugInfo(`Error loading inventory: ${error}`);
      toast.error('Failed to load drug inventory');
    } finally {
      setDrugSearchLoading(false);
    }
  };

  const getFilteredDrugs = (searchTerm: string) => {
    console.log('=== SEARCH DEBUG ===');
    console.log('Search term:', searchTerm);
    console.log('Available drug options:', drugOptions.length);
    
    if (!searchTerm.trim()) {
      const defaultResults = drugOptions.slice(0, 10);
      console.log('No search term, returning first 10:', defaultResults.map(d => d.name));
      return defaultResults;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = drugOptions.filter(drug => {
      const matchesName = drug.name.toLowerCase().includes(term);
      const matchesGeneric = drug.genericName.toLowerCase().includes(term);
      const matchesCode = drug.code.toLowerCase().includes(term);
      
      const matches = matchesName || matchesGeneric || matchesCode;
      if (matches) {
        console.log(`Match found: ${drug.name} (${drug.code})`);
      }
      return matches;
    }).slice(0, 10);
    
    console.log('Filtered results count:', filtered.length);
    return filtered;
  };



  const addMedicine = (source: 'inventory' | 'written' = 'inventory') => {
    const newMedicine: ExtendedMedicine = {
      id: prescriptionService.generateMedicineId(),
      medicineName: '',
      dose: '1 tab',
      frequency: 'bd',
      days: 4,
      drugCount: 8, // 1 tab × 2 times daily × 4 days = 8
      specialNote: '',
      source: source,
      // Legacy fields for backward compatibility
      dosage: '',
      duration: '',
      instructions: '',
      // Only set these for inventory medicines
      ...(source === 'inventory' && {
        selectedDrugId: '',
        availableQuantity: 0
      }),
      // Only set genericName and tradeName for written medicines
      ...(source === 'written' && {
        genericName: '',
        tradeName: ''
      })
    };
    
    // Switch to the correct tab if needed
    if (source === 'inventory' && activeTab !== 'inventory') {
      setActiveTab('inventory');
    } else if (source === 'written' && activeTab !== 'written') {
      setActiveTab('written');
    }
    
    setMedicines([...medicines, newMedicine]);
    setMedicineSource(prev => ({ ...prev, [newMedicine.id]: source }));
    
    // Set the last added medicine ID to trigger scroll (handled by useEffect)
    setLastAddedMedicineId(newMedicine.id);
  };

  const removeMedicine = (medicineId: string) => {
    setMedicines(medicines.filter(med => med.id !== medicineId));
  };



  // Bottle size constant (standard bottle is 100ml)
  const BOTTLE_SIZE_ML = 100;

  // Helper function to check if dose is ML-based
  const isMlDose = (dose: string): boolean => {
    return dose.toLowerCase().includes('ml');
  };

  // Helper function to check if dose is puff-based
  const isPuffDose = (dose: string): boolean => {
    return dose.toLowerCase().includes('puff');
  };

  // Helper function to check if dose is LA or Capsules
  const isLaOrCapsulesDose = (dose: string): boolean => {
    const lowerDose = dose.toLowerCase();
    return lowerDose === 'la' || lowerDose === 'capsules';
  };

  // Helper function to check if dose is Tubes
  const isTubesDose = (dose: string): boolean => {
    return dose.toLowerCase().includes('tube');
  };

  // Helper function to calculate total ML needed
  const calculateTotalMl = (dose: string, customMl: number | undefined, frequency: string, days: number): number => {
    // Get ML value from dose or custom input
    let mlValue = 0;
    if (dose === 'Custom ml') {
      mlValue = customMl || 0;
    } else {
      mlValue = parseFloat(dose.replace(/[^\d\.]/g, '')) || 0;
    }
    
    // Calculate frequency per day
    let frequencyPerDay = 0;
    switch (frequency.toLowerCase()) {
      case 'bd': frequencyPerDay = 2; break; // bis in die - twice a day
      case 'tds': frequencyPerDay = 3; break;
      case '4 hourly': frequencyPerDay = 6; break; // 24/4 = 6
      case '6 hourly': frequencyPerDay = 4; break; // 24/6 = 4
      case '8 hourly': frequencyPerDay = 3; break; // 24/8 = 3
      case 'mane': frequencyPerDay = 1; break; // morning
      case 'nocte': frequencyPerDay = 1; break; // night
      case 'eod (each other day)': frequencyPerDay = 0.5; break; // every other day
      case 'weekly': frequencyPerDay = 1/7; break; // once per week
      default: frequencyPerDay = 1; break;
    }
    
    return Math.ceil(mlValue * frequencyPerDay * days);
  };

  // Helper function to calculate drug count
  const calculateDrugCount = (dose: string, frequency: string, days: number, customMl?: number): number => {
    // For ML doses, default to 1 bottle (can be edited by user)
    if (isMlDose(dose)) {
      return 1;
    }
    
    // For puff doses, default to 1 nos (can be edited by user)
    if (isPuffDose(dose)) {
      return 1;
    }
    
    // For LA or Capsules doses, default to 1 nos (can be edited by user)
    if (isLaOrCapsulesDose(dose)) {
      return 1;
    }
    
    // For Tubes doses, default to 1 nos (can be edited by user)
    if (isTubesDose(dose)) {
      return 1;
    }
    
    // Extract numeric value from dose (e.g., "1 tab" -> 1, "½ tab" -> 0.5)
    let doseValue = 0;
    if (dose.includes('½')) {
      doseValue = 0.5;
    } else if (dose.includes('¼')) {
      doseValue = 0.25;
    } else {
      doseValue = parseFloat(dose.replace(/[^\d\.]/g, '')) || 0;
    }
    
    // Calculate frequency per day
    let frequencyPerDay = 0;
    switch (frequency.toLowerCase()) {
      case 'bd': frequencyPerDay = 2; break; // bis in die - twice a day
      case 'tds': frequencyPerDay = 3; break;
      case '4 hourly': frequencyPerDay = 6; break; // 24/4 = 6
      case '6 hourly': frequencyPerDay = 4; break; // 24/6 = 4
      case '8 hourly': frequencyPerDay = 3; break; // 24/8 = 3
      case 'mane': frequencyPerDay = 1; break; // morning
      case 'nocte': frequencyPerDay = 1; break; // night
      case 'eve': frequencyPerDay = 1; break; // evening
      case 'stat': frequencyPerDay = 0; break; // stat - immediately/once, manual entry required
      case 'sos': frequencyPerDay = 0; break; // sos - as needed, manual entry required
      case 'eod (each other day)': frequencyPerDay = 0.5; break; // every other day
      case 'weekly': frequencyPerDay = 1/7; break; // once per week
      default: frequencyPerDay = 1; break;
    }
    
    // For stat and sos, return 0 to indicate manual entry required
    if (frequency.toLowerCase() === 'stat' || frequency.toLowerCase() === 'sos') {
      return 0;
    }
    
    return Math.ceil(doseValue * frequencyPerDay * days);
  };

  const openDoseFrequencyModal = (medicineId: string, type: 'dose' | 'frequency', currentValue: string) => {
    setDoseFrequencyModalData({ medicineId, type, currentValue });
    setShowDoseFrequencyModal(true);
  };

  const closeDoseFrequencyModal = () => {
    setShowDoseFrequencyModal(false);
    setDoseFrequencyModalData(null);
  };

  const handleDoseFrequencySelect = (value: string) => {
    if (doseFrequencyModalData) {
      const field = doseFrequencyModalData.type === 'dose' ? 'dose' : 'frequency';
      updateMedicine(doseFrequencyModalData.medicineId, field, value);
      closeDoseFrequencyModal();
    }
  };

  const updateMedicine = (medicineId: string, field: keyof ExtendedMedicine, value: string | number) => {
    console.log(`Updating medicine ${medicineId}, field: ${field}, value:`, value);
    setMedicines(prevMedicines => 
      prevMedicines.map(med => {
        if (med.id === medicineId) {
          const updatedMed = { ...med, [field]: value };
          
          // Auto-calculate drug count and ML when dose, frequency, days, or customMl changes
          // Skip auto-calculation for 'stat' and 'sos' frequencies (manual entry required)
          if (field === 'dose' || field === 'frequency' || field === 'days' || field === 'customMl') {
            const dose = field === 'dose' ? value as string : med.dose || '';
            const frequency = field === 'frequency' ? value as string : med.frequency || '';
            const days = field === 'days' ? value as number : med.days || 0;
            const customMl = field === 'customMl' ? value as number : med.customMl;
            
            // For stat and sos frequencies, don't auto-calculate drug count (manual entry required)
            // Keep existing drugCount or set to 0 if not already set
            if (frequency.toLowerCase() === 'stat' || frequency.toLowerCase() === 'sos') {
              // Only set to 0 if drugCount wasn't previously set (not if user already entered a value)
              if (updatedMed.drugCount === undefined || updatedMed.drugCount === null) {
                updatedMed.drugCount = 0;
              }
              // Clear calculatedMl for stat/sos
              updatedMed.calculatedMl = undefined;
            } else {
              // Calculate drug count (1 bottle for ML doses, calculated for tablet doses)
              updatedMed.drugCount = calculateDrugCount(dose, frequency, days, customMl);
              
              // Calculate total ML if it's an ML dose
              if (isMlDose(dose)) {
                updatedMed.calculatedMl = calculateTotalMl(dose, customMl, frequency, days);
              } else {
                updatedMed.calculatedMl = undefined;
              }
            }
          }
          
          return updatedMed;
        }
        return med;
      })
    );
  };

  // const selectDrug = (medicineId: string, drug: DrugOption) => {
  //   console.log('=== DRUG SELECTION DEBUG ===');
  //   console.log('Medicine ID:', medicineId);
  //   console.log('Selected Drug:', drug);
    
  //   // Update multiple fields at once
  //   setMedicines(prevMedicines => 
  //     prevMedicines.map(med => 
  //       med.id === medicineId ? {
  //         ...med,
  //         medicineName: drug.name,
  //         selectedDrugId: drug.id,
  //         availableQuantity: drug.totalQuantity
  //       } : med
  //     )
  //   );
    
  //   // Close dropdown
  //   setShowDrugDropdown(null);
    
  //   console.log('Drug selected and dropdown closed');
  //   toast.success(`Selected: ${drug.name}`);
  // };

  const selectDrug = (medicineId: string, drug: DrugOption) => {
    console.log('=== DRUG SELECTION DEBUG ===');
    console.log('Medicine ID:', medicineId);
    console.log('Selected Drug:', drug);
    console.log('Current medicines before update:', medicines);
    
    try {
      // Update medicine with selected drug information
      setMedicines(prevMedicines => {
        console.log('Previous medicines:', prevMedicines);
        const updatedMedicines = prevMedicines.map(med => {
          if (med.id === medicineId) {
            const updatedMed = {
              ...med,
              medicineName: drug.name,
              genericName: drug.genericName,
              selectedDrugId: drug.id,
              availableQuantity: drug.totalQuantity,
              inventoryId: drug.id,
              source: 'inventory' as const
            };
            console.log('Updated medicine:', updatedMed);
            return updatedMed;
          }
          return med;
        });
        console.log('Updated medicines array:', updatedMedicines);
        return updatedMedicines;
      });
      
      // Close dropdown after state update
      setTimeout(() => {
        setShowDrugDropdown(null);
        setDrugDropdownPosition(null);
      }, 100);
      
      console.log('Drug selection completed');
      toast.success(`Selected: ${drug.name}`);
    } catch (error) {
      console.error('Error in selectDrug:', error);
      toast.error('Failed to select medicine');
    }
  };


  const handleInputChange = (medicineId: string, value: string) => {
    console.log('Input change:', medicineId, value);
    updateMedicine(medicineId, 'medicineName', value);
    setShowDrugDropdown(medicineId);
    // Update dropdown position
    const inputElement = document.getElementById(`medicine-${medicineId}`);
    if (inputElement) {
      const rect = inputElement.getBoundingClientRect();
      setDrugDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const handleInputFocus = (medicineId: string) => {
    console.log('Input focus:', medicineId);
    setShowDrugDropdown(medicineId);
    // Calculate dropdown position
    const inputElement = document.getElementById(`medicine-${medicineId}`);
    if (inputElement) {
      const rect = inputElement.getBoundingClientRect();
      setDrugDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };



  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = imageUploadService.validateImageFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        toast.error(`${file.name}: ${validation.error}`);
      }
    }
    
    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      // Initialize descriptions for new files
      const newDescriptions: { [key: string]: string } = {};
      validFiles.forEach(file => {
        newDescriptions[file.name] = '';
      });
      setImageDescriptions(prev => ({ ...prev, ...newDescriptions }));
    }
    
    // Reset input
    event.target.value = '';
  };
  
  const removeImageFile = (fileName: string) => {
    setImageFiles(prev => prev.filter(file => file.name !== fileName));
    setImageDescriptions(prev => {
      const updated = { ...prev };
      delete updated[fileName];
      return updated;
    });
  };
  
  const removeUploadedImage = async (imageId: string) => {
    if (!existingPrescription?.id) return;
    
    try {
      await prescriptionService.removeImageFromPrescription(existingPrescription.id, imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };
  
  const updateImageDescription = (fileName: string, description: string) => {
    setImageDescriptions(prev => ({
      ...prev,
      [fileName]: description
    }));
  };
  
  const openImagePreview = (url: string) => {
    setSelectedImagePreview(url);
  };
  
  const closeImagePreview = () => {
    setSelectedImagePreview(null);
  };

  // Helper function to preview a specific prescription
  const handlePreviewPrescription = (prescriptionId: string | null) => {
    setPreviewingPrescriptionId(prescriptionId);
    setPreviewType('full');
    setShowPreviewModal(true);
  };

  // Print handlers
  const handlePrintPrescription = async (type: 'full' | 'inventory' | 'written', prescriptionId?: string | null) => {
    setPrinting(type);
    try {
      const prescription = buildPrescriptionForPreview(prescriptionId || previewingPrescriptionId);
      let success = false;

      if (type === 'full') {
        success = await prescriptionPrintService.printFullPrescription(appointment, prescription);
      } else if (type === 'inventory') {
        success = await prescriptionPrintService.printInventoryMedicinesOnly(appointment, prescription);
      } else if (type === 'written') {
        success = await prescriptionPrintService.printWrittenMedicinesOnly(appointment, prescription);
      }

      if (success) {
        toast.success(`Prescription (${type}) printed successfully!`);
      } else {
        toast.error(`Failed to print ${type} prescription`);
      }
    } catch (error) {
      console.error('Error printing prescription:', error);
      toast.error('Error printing prescription');
    } finally {
      setPrinting(null);
    }
  };

  // Build prescription object from current form data for preview
  // If prescriptionId is provided, load that prescription instead of building from form
  const buildPrescriptionForPreview = (prescriptionId?: string | null): Prescription => {
    // If a prescription ID is provided and it exists in allPrescriptions, use that
    if (prescriptionId && prescriptionId !== 'appointment-original' && !prescriptionId.startsWith('temp-')) {
      const savedPrescription = allPrescriptions.find(p => p.id === prescriptionId);
      if (savedPrescription) {
        return savedPrescription;
      }
    }
    
    // Handle temp-new-* keys - load from local storage
    if (prescriptionId && prescriptionId.startsWith('temp-new-')) {
      const localData = localPrescriptionData[prescriptionId];
      if (localData) {
        const medicinesWithData = localData.medicines.filter((med: any) => med.medicineName.trim());
        const medicineData: Medicine[] = medicinesWithData.map((med: any) => {
          const medicine: Medicine = {
            id: med.id,
            medicineName: med.medicineName,
            frequency: med.frequency,
            source: med.source || 'written',
            dose: med.dose || '',
            days: med.days || 0,
            drugCount: med.drugCount || 0,
            dosage: med.dosage || med.dose || '',
            duration: med.duration || (med.days ? `${med.days} days` : ''),
            instructions: med.instructions || med.specialNote || '',
          };
          
          if (med.genericName && med.genericName.trim()) medicine.genericName = med.genericName;
          if (med.tradeName && med.tradeName.trim()) medicine.tradeName = med.tradeName;
          if (med.specialNote && med.specialNote.trim()) medicine.specialNote = med.specialNote;
          if (med.inventoryId && med.inventoryId.trim()) medicine.inventoryId = med.inventoryId;
          if (med.customMl !== undefined) medicine.customMl = med.customMl;
          if (med.calculatedMl !== undefined) medicine.calculatedMl = med.calculatedMl;
          
          return medicine;
        });

        const newPatientData = localData.newPatientData || {};
        const combinedDateOfBirth = combineDateParts(newPatientData.dobDay, newPatientData.dobMonth, newPatientData.dobYear);
        let finalPatientAge: string | undefined;
        if (combinedDateOfBirth) {
          const { formatAge } = require('@/utils/ageUtils');
          finalPatientAge = formatAge(combinedDateOfBirth);
        }

        return {
          appointmentId: appointment.id!,
          patientId: newPatientData.patientId || '',
          patientName: newPatientData.name?.trim() || 'New Patient',
          patientDateOfBirth: combinedDateOfBirth || undefined,
          patientAge: finalPatientAge,
          patientContact: newPatientData.contact?.trim() || '',
          patientGender: newPatientData.gender?.trim() || '',
          doctorId: appointment.doctorId,
          doctorName: appointment.doctorName,
          medicines: medicineData,
          notes: localData.notes || '',
          presentingComplaint: localData.presentingComplaint || '',
          medicalHistory: {
            pastMedicalHistory: localData.pastMedicalHistory || '',
            surgicalHistory: localData.surgicalHistory || '',
            currentMedications: localData.currentMedications || '',
            allergies: localData.allergies || '',
            familyHistory: localData.familyHistory || ''
          },
          onExamination: {
            temperature: localData.temperature || '',
            bloodPressure: localData.bloodPressure || '',
            heartRate: localData.heartRate || '',
            respiratoryRate: localData.respiratoryRate || '',
            oxygenSaturation: localData.oxygenSaturation || '',
            lungs: localData.lungs || '',
            abdomen: localData.abdomen || '',
            other: localData.otherExamination || ''
          },
          labResults: {
            tsh: localData.tsh || '',
            hba1c: localData.hba1c || '',
            ldl: localData.ldl || '',
            cholesterol: localData.cholesterol || '',
            glucose: localData.glucose || '',
            creatinine: localData.creatinine || '',
            other: localData.otherLabResults || '',
            wbc: localData.wbc || '',
            ne: localData.ne || '',
            ly: localData.ly || '',
            hb: localData.hb || '',
            plt: localData.plt || '',
            crp: localData.crp || '',
            esr: localData.esr || '',
            pus: localData.pus || '',
            red: localData.red || '',
            sug: localData.sug || '',
            aib: localData.aib || '',
            org: localData.org || '',
            tc: localData.tc || '',
            tg: localData.tg || '',
            hdl: localData.hdl || '',
            vldl: localData.vldl || '',
            tcHdl: localData.tcHdl || '',
            fbs: localData.fbs || '',
            sCr: localData.sCr || '',
            ast: localData.ast || '',
            alt: localData.alt || '',
            rf: localData.rf || '',
            ...(localData.customLabResults && localData.customLabResults.length > 0 && {
              customLabResults: localData.customLabResults.filter((result: any) => result.name.trim() || result.value.trim())
            })
          },
          investigations: {
            ecg: localData.ecg || '',
            echo: localData.echo || '',
            xray: localData.xray || '',
            ct: localData.ct || '',
            mri: localData.mri || '',
            other: localData.otherInvestigations || ''
          },
          diagnosis: localData.diagnosis || '',
          appointmentAmount: localData.appointmentAmount || 0,
          medicalTests: localData.medicalTests || [],
          nextVisitDate: localData.nextVisitDate || null,
          createdBy: user?.uid || ''
        };
      }
    }
    
    // Handle appointment-original
    if (prescriptionId === 'appointment-original') {
      // First check for saved prescription
      const originalPrescription = allPrescriptions.find(p => p.patientId === appointment.patientId);
      if (originalPrescription) {
        return originalPrescription;
      }
      
      // Then check for local unsaved data
      const localKey = `original-${appointment.patientId}`;
      const localData = localPrescriptionData[localKey];
      if (localData) {
        const medicinesWithData = localData.medicines.filter((med: any) => med.medicineName.trim());
        const medicineData: Medicine[] = medicinesWithData.map((med: any) => {
          const medicine: Medicine = {
            id: med.id,
            medicineName: med.medicineName,
            frequency: med.frequency,
            source: med.source || 'written',
            dose: med.dose || '',
            days: med.days || 0,
            drugCount: med.drugCount || 0,
            dosage: med.dosage || med.dose || '',
            duration: med.duration || (med.days ? `${med.days} days` : ''),
            instructions: med.instructions || med.specialNote || '',
          };
          
          if (med.genericName && med.genericName.trim()) medicine.genericName = med.genericName;
          if (med.tradeName && med.tradeName.trim()) medicine.tradeName = med.tradeName;
          if (med.specialNote && med.specialNote.trim()) medicine.specialNote = med.specialNote;
          if (med.inventoryId && med.inventoryId.trim()) medicine.inventoryId = med.inventoryId;
          if (med.customMl !== undefined) medicine.customMl = med.customMl;
          if (med.calculatedMl !== undefined) medicine.calculatedMl = med.calculatedMl;
          
          return medicine;
        });

        let finalPatientAge: string | undefined;
        const finalPatientDateOfBirth = patientData?.dateOfBirth || editedPatientInfo.dateOfBirth || undefined;
        if (finalPatientDateOfBirth) {
          const { formatAge } = require('@/utils/ageUtils');
          finalPatientAge = formatAge(finalPatientDateOfBirth);
        }

        return {
          appointmentId: appointment.id!,
          patientId: appointment.patientId,
          patientName: patientData?.name || appointment.patientName,
          patientDateOfBirth: finalPatientDateOfBirth,
          patientAge: finalPatientAge,
          patientContact: appointment.patientContact,
          patientGender: patientData?.gender || '',
          doctorId: appointment.doctorId,
          doctorName: appointment.doctorName,
          medicines: medicineData,
          notes: localData.notes || '',
          presentingComplaint: localData.presentingComplaint || '',
          medicalHistory: {
            pastMedicalHistory: localData.pastMedicalHistory || '',
            surgicalHistory: localData.surgicalHistory || '',
            currentMedications: localData.currentMedications || '',
            allergies: localData.allergies || '',
            familyHistory: localData.familyHistory || ''
          },
          onExamination: {
            temperature: localData.temperature || '',
            bloodPressure: localData.bloodPressure || '',
            heartRate: localData.heartRate || '',
            respiratoryRate: localData.respiratoryRate || '',
            oxygenSaturation: localData.oxygenSaturation || '',
            lungs: localData.lungs || '',
            abdomen: localData.abdomen || '',
            other: localData.otherExamination || ''
          },
          labResults: {
            tsh: localData.tsh || '',
            hba1c: localData.hba1c || '',
            ldl: localData.ldl || '',
            cholesterol: localData.cholesterol || '',
            glucose: localData.glucose || '',
            creatinine: localData.creatinine || '',
            other: localData.otherLabResults || '',
            wbc: localData.wbc || '',
            ne: localData.ne || '',
            ly: localData.ly || '',
            hb: localData.hb || '',
            plt: localData.plt || '',
            crp: localData.crp || '',
            esr: localData.esr || '',
            pus: localData.pus || '',
            red: localData.red || '',
            sug: localData.sug || '',
            aib: localData.aib || '',
            org: localData.org || '',
            tc: localData.tc || '',
            tg: localData.tg || '',
            hdl: localData.hdl || '',
            vldl: localData.vldl || '',
            tcHdl: localData.tcHdl || '',
            fbs: localData.fbs || '',
            sCr: localData.sCr || '',
            ast: localData.ast || '',
            alt: localData.alt || '',
            rf: localData.rf || '',
            ...(localData.customLabResults && localData.customLabResults.length > 0 && {
              customLabResults: localData.customLabResults.filter((result: any) => result.name.trim() || result.value.trim())
            })
          },
          investigations: {
            ecg: localData.ecg || '',
            echo: localData.echo || '',
            xray: localData.xray || '',
            ct: localData.ct || '',
            mri: localData.mri || '',
            other: localData.otherInvestigations || ''
          },
          diagnosis: localData.diagnosis || '',
          appointmentAmount: localData.appointmentAmount || 0,
          medicalTests: localData.medicalTests || [],
          nextVisitDate: localData.nextVisitDate || null,
          createdBy: user?.uid || ''
        };
      }
      
      // If no saved or local data, build from original patient's data (empty prescription)
      // This ensures we show original patient info even if no data entered yet
      let finalPatientAge: string | undefined;
      const finalPatientDateOfBirth = patientData?.dateOfBirth || editedPatientInfo.dateOfBirth || undefined;
      if (finalPatientDateOfBirth) {
        const { formatAge } = require('@/utils/ageUtils');
        finalPatientAge = formatAge(finalPatientDateOfBirth);
      }

      return {
        appointmentId: appointment.id!,
        patientId: appointment.patientId,
        patientName: patientData?.name || appointment.patientName,
        patientDateOfBirth: finalPatientDateOfBirth,
        patientAge: finalPatientAge,
        patientContact: appointment.patientContact,
        patientGender: patientData?.gender || '',
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        medicines: [],
        notes: '',
        presentingComplaint: '',
        medicalHistory: {
          pastMedicalHistory: '',
          surgicalHistory: '',
          currentMedications: '',
          allergies: '',
          familyHistory: ''
        },
        onExamination: {
          temperature: '',
          bloodPressure: '',
          heartRate: '',
          respiratoryRate: '',
          oxygenSaturation: '',
          lungs: '',
          abdomen: '',
          other: ''
        },
        labResults: {
          tsh: '',
          hba1c: '',
          ldl: '',
          cholesterol: '',
          glucose: '',
          creatinine: '',
          other: '',
          wbc: '',
          ne: '',
          ly: '',
          hb: '',
          plt: '',
          crp: '',
          esr: '',
          pus: '',
          red: '',
          sug: '',
          aib: '',
          org: '',
          tc: '',
          tg: '',
          hdl: '',
          vldl: '',
          tcHdl: '',
          fbs: '',
          sCr: '',
          ast: '',
          alt: '',
          rf: '',
        },
        investigations: {
          ecg: '',
          echo: '',
          xray: '',
          ct: '',
          mri: '',
          other: ''
        },
        diagnosis: '',
        appointmentAmount: 0,
        medicalTests: [],
        nextVisitDate: null,
        createdBy: user?.uid || ''
      };
    }
    
    // Handle temp-current - use current form data (this is correct for current new patient)
    // Otherwise, build from current form data (existing behavior)
    const medicinesWithData = medicines.filter(med => med.medicineName.trim());
    
    const medicineData: Medicine[] = medicinesWithData.map(med => {
      const medicine: Medicine = {
        id: med.id,
        medicineName: med.medicineName,
        frequency: med.frequency,
        source: med.source || 'written',
        dose: med.dose || '',
        days: med.days || 0,
        drugCount: med.drugCount || 0,
        dosage: med.dosage || med.dose || '',
        duration: med.duration || (med.days ? `${med.days} days` : ''),
        instructions: med.instructions || med.specialNote || '',
      };
      
      if (med.genericName && med.genericName.trim()) {
        medicine.genericName = med.genericName;
      }
      if (med.tradeName && med.tradeName.trim()) {
        medicine.tradeName = med.tradeName;
      }
      if (med.specialNote && med.specialNote.trim()) {
        medicine.specialNote = med.specialNote;
      }
      if (med.inventoryId && med.inventoryId.trim()) {
        medicine.inventoryId = med.inventoryId;
      }
      if (med.customMl !== undefined) {
        medicine.customMl = med.customMl;
      }
      if (med.calculatedMl !== undefined) {
        medicine.calculatedMl = med.calculatedMl;
      }
      
      return medicine;
    });

    // Determine patient information
    let finalPatientName: string;
    let finalPatientDateOfBirth: string | undefined;
    let finalPatientAge: string | undefined;

    if (isAddingNewPatient) {
      finalPatientName = newPatientData.name.trim() || 'New Patient';
      const combinedDateOfBirth = combineDateParts(newPatientData.dobDay, newPatientData.dobMonth, newPatientData.dobYear);
      finalPatientDateOfBirth = combinedDateOfBirth || undefined;
      if (finalPatientDateOfBirth) {
        const { formatAge } = require('@/utils/ageUtils');
        finalPatientAge = formatAge(finalPatientDateOfBirth);
      }
    } else if (existingPrescription) {
      finalPatientName = existingPrescription.patientName;
      finalPatientDateOfBirth = existingPrescription.patientDateOfBirth;
      finalPatientAge = existingPrescription.patientAge;
    } else {
      finalPatientName = patientData?.name || appointment.patientName;
      finalPatientDateOfBirth = patientData?.dateOfBirth || editedPatientInfo.dateOfBirth || undefined;
      if (finalPatientDateOfBirth) {
        const { formatAge } = require('@/utils/ageUtils');
        finalPatientAge = formatAge(finalPatientDateOfBirth);
      }
    }

    const prescription: Prescription = {
      appointmentId: appointment.id!,
      patientId: isAddingNewPatient && selectedExistingPatient?.id 
        ? selectedExistingPatient.id 
        : (existingPrescription?.patientId || appointment.patientId),
      patientName: finalPatientName,
      patientDateOfBirth: finalPatientDateOfBirth,
      patientAge: finalPatientAge,
      patientContact: isAddingNewPatient ? newPatientData.contact.trim() : (existingPrescription?.patientContact || appointment.patientContact),
      patientGender: isAddingNewPatient ? newPatientData.gender.trim() : (existingPrescription?.patientGender || patientData?.gender),
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      medicines: medicineData,
      notes: notes.trim(),
      presentingComplaint: presentingComplaint.trim(),
      medicalHistory: {
        pastMedicalHistory: pastMedicalHistory.trim(),
        surgicalHistory: surgicalHistory.trim(),
        currentMedications: currentMedications.trim(),
        allergies: allergies.trim(),
        familyHistory: familyHistory.trim()
      },
      onExamination: {
        temperature: temperature.trim(),
        bloodPressure: bloodPressure.trim(),
        heartRate: heartRate.trim(),
        respiratoryRate: respiratoryRate.trim(),
        oxygenSaturation: oxygenSaturation.trim(),
        lungs: lungs.trim(),
        abdomen: abdomen.trim(),
        other: otherExamination.trim()
      },
      labResults: {
        tsh: tsh.trim(),
        hba1c: hba1c.trim(),
        ldl: ldl.trim(),
        cholesterol: cholesterol.trim(),
        glucose: glucose.trim(),
        creatinine: creatinine.trim(),
        other: otherLabResults.trim(),
        wbc: wbc.trim(),
        ne: ne.trim(),
        ly: ly.trim(),
        hb: hb.trim(),
        plt: plt.trim(),
        crp: crp.trim(),
        esr: esr.trim(),
        pus: pus.trim(),
        red: red.trim(),
        sug: sug.trim(),
        aib: aib.trim(),
        org: org.trim(),
        tc: tc.trim(),
        tg: tg.trim(),
        hdl: hdl.trim(),
        vldl: vldl.trim(),
        tcHdl: tcHdl.trim(),
        fbs: fbs.trim(),
        sCr: sCr.trim(),
        ast: ast.trim(),
        alt: alt.trim(),
        rf: rf.trim(),
        ...(customLabResults.length > 0 && {
          customLabResults: customLabResults.filter(result => result.name.trim() || result.value.trim())
        })
      },
      investigations: {
        ecg: ecg.trim(),
        echo: echo.trim(),
        xray: xray.trim(),
        ct: ct.trim(),
        mri: mri.trim(),
        other: otherInvestigations.trim()
      },
      diagnosis: diagnosis.trim(),
      appointmentAmount: appointmentAmount,
      medicalTests: medicalTests,
      nextVisitDate: nextVisitDate,
      createdBy: user?.uid || ''
    };

    return prescription;
  };

  const handleSave = async () => {
    if (!user?.uid) {
      toast.error('User not authenticated');
      return;
    }
  
    // Validate medicines - only validate medicines that have been started (have a name)
    // This allows empty auto-added medicines to be ignored
    const medicinesWithData = medicines.filter(med => med.medicineName.trim());
    
    // Allow saving prescription with just appointment amount and no medicines
    // Only validate medicines if they are present
    if (medicinesWithData.length > 0) {
      const invalidMedicines = medicinesWithData.filter(med => {
        const hasName = med.medicineName.trim();
        const hasFrequency = med.frequency && med.frequency.trim();
        
        // Check if using new fields (dose + days) OR legacy fields (dosage + duration)
        const hasNewDose = med.dose && med.dose.trim();
        const hasNewDays = med.days !== undefined && med.days > 0;
        const hasLegacyDosage = med.dosage && med.dosage.trim();
        const hasLegacyDuration = med.duration && med.duration.trim();
        
        const isValid = hasName && hasFrequency && 
                        ((hasNewDose && hasNewDays) || (hasLegacyDosage && hasLegacyDuration));
        
        return !isValid;
      });
    
      if (invalidMedicines.length > 0) {
        toast.error('Please fill in all required fields for the medicines you have added');
        return;
      }
    }
  
    setSaving(true);
    try {
      // Convert ExtendedMedicine back to Medicine for saving - only include medicines with data
      const medicineData: Medicine[] = medicinesWithData.map(med => {
        const medicine: Medicine = {
          id: med.id,
          medicineName: med.medicineName,
          frequency: med.frequency,
          source: med.source || 'written', // Default to written if not set
          
          // New fields (dose/days/drugCount)
          dose: med.dose || '',
          days: med.days || 0,
          drugCount: med.drugCount || 0,
          
          // Legacy fields for backward compatibility
          dosage: med.dosage || med.dose || '',
          duration: med.duration || (med.days ? `${med.days} days` : ''),
          instructions: med.instructions || med.specialNote || '',
        };
  
        // Only add optional fields if they have values
        if (med.genericName && med.genericName.trim()) {
          medicine.genericName = med.genericName;
        }
        
        if (med.tradeName && med.tradeName.trim()) {
          medicine.tradeName = med.tradeName;
        }
        
        if (med.specialNote && med.specialNote.trim()) {
          medicine.specialNote = med.specialNote;
        }
  
        if (med.inventoryId && med.inventoryId.trim()) {
          medicine.inventoryId = med.inventoryId;
        }
        
        // ML dose fields
        if (med.customMl !== undefined) {
          medicine.customMl = med.customMl;
        }
        
        if (med.calculatedMl !== undefined) {
          medicine.calculatedMl = med.calculatedMl;
        }
  
        return medicine;
      });
  
      // Determine patient information - for new patients or existing
      let finalPatientId: string;
      let finalPatientName: string;
      let finalPatientDateOfBirth: string | undefined;
      let finalPatientAge: string | undefined;

      if (isAddingNewPatient) {
        // New patient - use newPatientData
        // Validate required fields: name, DOB, gender, and contact
        if (!newPatientData.name.trim()) {
          toast.error('Patient name is required');
          setSaving(false);
          return;
        }
        const combinedDateOfBirth = combineDateParts(newPatientData.dobDay, newPatientData.dobMonth, newPatientData.dobYear);
        if (!combinedDateOfBirth) {
          toast.error('Date of Birth is required for new patients (please select Day, Month, and Year)');
          setSaving(false);
          return;
        }
        if (!newPatientData.gender.trim() || newPatientData.gender === 'not_specified') {
          toast.error('Gender is required for new patients');
          setSaving(false);
          return;
        }
        if (!newPatientData.contact.trim()) {
          toast.error('Contact number is required for new patients');
          setSaving(false);
          return;
        }
        
        // Check if an existing patient was selected
        if (selectedExistingPatient?.id) {
          // Use existing patient's ID
          finalPatientId = selectedExistingPatient.id;
          finalPatientName = selectedExistingPatient.name;
          finalPatientDateOfBirth = selectedExistingPatient.dateOfBirth;
          if (finalPatientDateOfBirth) {
            const { formatAge } = await import('@/utils/ageUtils');
            finalPatientAge = formatAge(finalPatientDateOfBirth);
          }
        } else {
          // Create new patient in database
          try {
            const combinedDateOfBirth = combineDateParts(newPatientData.dobDay, newPatientData.dobMonth, newPatientData.dobYear);
            const newPatient = await appointmentService.createPatient({
              name: newPatientData.name.trim(),
              contactNumber: newPatientData.contact.trim(),
              dateOfBirth: combinedDateOfBirth,
              gender: newPatientData.gender.trim(),
              bodyWeight: newPatientData.bodyWeight ? parseFloat(newPatientData.bodyWeight) : undefined,
              drugAllergies: newPatientData.drugAllergies.trim() || undefined
            });
            finalPatientId = newPatient.id!;
            finalPatientName = newPatient.name;
            finalPatientDateOfBirth = newPatient.dateOfBirth;
            if (finalPatientDateOfBirth) {
              const { formatAge } = await import('@/utils/ageUtils');
              finalPatientAge = formatAge(finalPatientDateOfBirth);
            }
          } catch (error) {
            console.error('Error creating new patient:', error);
            toast.error('Failed to create new patient. Please try again.');
            setSaving(false);
            return;
          }
        }
      } else if (existingPrescription) {
        // Existing prescription - use existing patient data
        finalPatientId = existingPrescription.patientId;
        finalPatientName = existingPrescription.patientName;
        finalPatientDateOfBirth = existingPrescription.patientDateOfBirth;
        finalPatientAge = existingPrescription.patientAge;
      } else {
        // First patient for this appointment - use appointment patient data
        finalPatientId = appointment.patientId;
        finalPatientName = patientData?.name || appointment.patientName;
        finalPatientDateOfBirth = patientData?.dateOfBirth || editedPatientInfo.dateOfBirth || undefined;
        if (finalPatientDateOfBirth) {
          const { formatAge } = await import('@/utils/ageUtils');
          finalPatientAge = formatAge(finalPatientDateOfBirth);
        } else if (patientData?.dateOfBirth) {
          const { formatAge } = await import('@/utils/ageUtils');
          finalPatientAge = formatAge(patientData.dateOfBirth);
        }
      }

      const prescriptionData = {
        appointmentId: appointment.id!,
        patientId: finalPatientId,
        patientName: finalPatientName,
        patientDateOfBirth: finalPatientDateOfBirth,
        patientAge: finalPatientAge,
        patientContact: isAddingNewPatient ? newPatientData.contact.trim() : undefined,
        patientGender: isAddingNewPatient ? newPatientData.gender.trim() : undefined,
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        medicines: medicineData,
        notes: notes.trim(),
        
        // ENHANCED MEDICAL FIELDS
        presentingComplaint: presentingComplaint.trim(),
        
        // Medical history
        medicalHistory: {
          pastMedicalHistory: pastMedicalHistory.trim(),
          surgicalHistory: surgicalHistory.trim(),
          currentMedications: currentMedications.trim(),
          allergies: allergies.trim(),
          familyHistory: familyHistory.trim()
        },
        
        // Examination findings
        onExamination: {
          temperature: temperature.trim(),
          bloodPressure: bloodPressure.trim(),
          heartRate: heartRate.trim(),
          respiratoryRate: respiratoryRate.trim(),
          oxygenSaturation: oxygenSaturation.trim(),
          lungs: lungs.trim(),
          abdomen: abdomen.trim(),
          other: otherExamination.trim()
        },
        
        // Lab results
        labResults: {
          tsh: tsh.trim(),
          hba1c: hba1c.trim(),
          ldl: ldl.trim(),
          cholesterol: cholesterol.trim(),
          glucose: glucose.trim(),
          creatinine: creatinine.trim(),
          other: otherLabResults.trim(),
          // Detailed lab results
          wbc: wbc.trim(),
          ne: ne.trim(),
          ly: ly.trim(),
          hb: hb.trim(),
          plt: plt.trim(),
          crp: crp.trim(),
          esr: esr.trim(),
          pus: pus.trim(),
          red: red.trim(),
          sug: sug.trim(),
          aib: aib.trim(),
          org: org.trim(),
          tc: tc.trim(),
          tg: tg.trim(),
          hdl: hdl.trim(),
          vldl: vldl.trim(),
          tcHdl: tcHdl.trim(),
          fbs: fbs.trim(),
          sCr: sCr.trim(),
          ast: ast.trim(),
          alt: alt.trim(),
          rf: rf.trim(),
          // Custom lab results - only include if there are any
          ...(customLabResults.length > 0 && {
            customLabResults: customLabResults.filter(result => result.name.trim() || result.value.trim())
          })
        },
        
        // Investigations
        investigations: {
          ecg: ecg.trim(),
          echo: echo.trim(),
          xray: xray.trim(),
          ct: ct.trim(),
          mri: mri.trim(),
          other: otherInvestigations.trim()
        },
        
        diagnosis: diagnosis.trim(),
        appointmentAmount: appointmentAmount,
        images: images,
        
        // MEDICAL TESTS AND NEXT VISIT
        medicalTests: medicalTests,
        nextVisitDate: nextVisitDate,
        
        // REFERRAL LETTER LINK
        referralLetterId: createdReferralLetterId,
        
        createdBy: user.uid
      };
  
      // Update appointment procedures if they were changed
      if (appointment.id) {
        // Step 1: Process new procedures (ones without procedureId but with name and charge)
        const updatedProcedures = [...procedures];
        
        for (let i = 0; i < updatedProcedures.length; i++) {
          const proc = updatedProcedures[i];
          
          // Check if this is a new procedure (has name and charge but no procedureId)
          if (!proc.procedureId && proc.procedureName.trim() && proc.doctorCharge > 0) {
            try {
              // Step 1a: Check if a MedicalProcedure with this name already exists
              const allProcedures = await doctorService.getAllProcedures();
              let procedureId = allProcedures.find(p => 
                p.name.toLowerCase() === proc.procedureName.trim().toLowerCase()
              )?.id;

              // Step 1b: If not exists, create a new MedicalProcedure
              if (!procedureId) {
                const procedurePayload: any = {
                  name: proc.procedureName.trim()
                };
                
                const newProcedure = await doctorService.createProcedure(procedurePayload);
                procedureId = newProcedure.id;
              }

              if (!procedureId) {
                throw new Error('Failed to get or create procedure');
              }

              // Step 1c: Get doctor name
              const doctor = await doctorService.getDoctorById(appointment.doctorId);
              if (!doctor) {
                throw new Error('Doctor not found');
              }

              // Step 1d: Create a DoctorProcedure linking doctor to procedure with charge
              const doctorProcedurePayload: any = {
                doctorId: appointment.doctorId,
                doctorName: doctor.name || '',
                procedureId: procedureId,
                procedureName: proc.procedureName.trim(),
                doctorCharge: proc.doctorCharge,
                isActive: true
              };
              
              const doctorProcedure = await doctorService.createDoctorProcedure(doctorProcedurePayload);

              // Step 1e: Update the procedure with the new ID
              updatedProcedures[i] = {
                procedureId: doctorProcedure.id!,
                procedureName: proc.procedureName.trim(),
                doctorCharge: proc.doctorCharge
              };
              
              toast.success(`Procedure "${proc.procedureName}" saved successfully`);
            } catch (error: any) {
              console.error('Error creating procedure:', error);
              toast.error(`Failed to save procedure "${proc.procedureName}": ${error.message || 'Unknown error'}`);
              // Remove the invalid procedure from the list
              updatedProcedures.splice(i, 1);
              i--; // Adjust index after removal
            }
          }
        }
        
        // Step 2: Filter out empty procedures (no name or charge)
        const validProcedures = updatedProcedures.filter(proc => 
          proc.procedureName.trim() && proc.doctorCharge > 0
        );
        
        // Step 3: Update procedures state if any were created
        if (validProcedures.length !== procedures.length) {
          setProcedures(validProcedures);
        }
        
        // Step 4: Save procedures to appointment
        const originalProcedures = appointment.procedures || [];
        const proceduresChanged = JSON.stringify(originalProcedures) !== JSON.stringify(validProcedures);
        
        if (proceduresChanged || validProcedures.length > 0) {
          // Calculate total charge from procedures
          const calculateTotalCharge = (procs: AppointmentProcedure[]) => {
            return procs.reduce((sum, proc) => sum + proc.doctorCharge, 0);
          };
          
          const totalCharge = calculateTotalCharge(validProcedures);
          
          await appointmentService.updateAppointment(appointment.id, {
            procedures: validProcedures,
            totalCharge: totalCharge
          });
        }
        
        // Step 5: Reload available procedures to include newly created ones
        await loadDoctorProcedures();
      }
  
      let prescriptionId: string;
  
      if (existingPrescription) {
        await prescriptionService.updatePrescription(existingPrescription.id!, {
          patientName: finalPatientName,
          patientDateOfBirth: finalPatientDateOfBirth,
          patientAge: finalPatientAge,
          patientContact: isAddingNewPatient ? newPatientData.contact.trim() : existingPrescription.patientContact,
          patientGender: isAddingNewPatient ? newPatientData.gender.trim() : existingPrescription.patientGender,
          medicines: medicineData,
          notes: notes.trim(),
          presentingComplaint: presentingComplaint.trim(),
          
          // Medical history
          medicalHistory: {
            pastMedicalHistory: pastMedicalHistory.trim(),
            surgicalHistory: surgicalHistory.trim(),
            currentMedications: currentMedications.trim(),
            allergies: allergies.trim(),
            familyHistory: familyHistory.trim()
          },
          
          // Examination findings
          onExamination: {
            temperature: temperature.trim(),
            bloodPressure: bloodPressure.trim(),
            heartRate: heartRate.trim(),
            respiratoryRate: respiratoryRate.trim(),
            oxygenSaturation: oxygenSaturation.trim(),
            lungs: lungs.trim(),
            abdomen: abdomen.trim(),
            other: otherExamination.trim()
          },
          
          // Lab results
          labResults: {
            tsh: tsh.trim(),
            hba1c: hba1c.trim(),
            ldl: ldl.trim(),
            cholesterol: cholesterol.trim(),
            glucose: glucose.trim(),
            creatinine: creatinine.trim(),
            other: otherLabResults.trim(),
            // Detailed lab results
            wbc: wbc.trim(),
            ne: ne.trim(),
            ly: ly.trim(),
            hb: hb.trim(),
            plt: plt.trim(),
            crp: crp.trim(),
            esr: esr.trim(),
            pus: pus.trim(),
            red: red.trim(),
            sug: sug.trim(),
            aib: aib.trim(),
            org: org.trim(),
            tc: tc.trim(),
            tg: tg.trim(),
            hdl: hdl.trim(),
            vldl: vldl.trim(),
            tcHdl: tcHdl.trim(),
            fbs: fbs.trim(),
            sCr: sCr.trim(),
            ast: ast.trim(),
            alt: alt.trim(),
            rf: rf.trim(),
            // Custom lab results - only include if there are any
            ...(customLabResults.length > 0 && {
              customLabResults: customLabResults.filter(result => result.name.trim() || result.value.trim())
            })
          },
          
          // Investigations
          investigations: {
            ecg: ecg.trim(),
            echo: echo.trim(),
            xray: xray.trim(),
            ct: ct.trim(),
            mri: mri.trim(),
            other: otherInvestigations.trim()
          },
          
          diagnosis: diagnosis.trim(),
          appointmentAmount: appointmentAmount,
          images: images,
          medicalTests: medicalTests,
          nextVisitDate: nextVisitDate,
          referralLetterId: createdReferralLetterId
        });
        prescriptionId = existingPrescription.id!;
        // Clear local data after saving
        setLocalPrescriptionData(prev => {
          const updated = { ...prev };
          delete updated[prescriptionId];
          return updated;
        });
        // Only show toast if not auto-saving for new patient
        if (!(window as any).__isAutoSavingForNewPatient) {
          toast.success('Prescription updated successfully');
        }
      } else {
        prescriptionId = await prescriptionService.createPrescription(prescriptionData);
        // Clear local data after saving
        setLocalPrescriptionData(prev => {
          const updated = { ...prev };
          delete updated[prescriptionId];
          // Also clear original patient's local data if this was a new patient
          if (isAddingNewPatient) {
            delete updated[`original-${appointment.patientId}`];
          }
          return updated;
        });
        // Only show toast if not auto-saving for new patient
        if (!(window as any).__isAutoSavingForNewPatient) {
          toast.success('Prescription created successfully');
        }
      }

      // Save ALL local prescription data (for all patients) to database
      // This ensures all patients' prescriptions are saved when user clicks Save
      const localKeys = Object.keys(localPrescriptionData);
      const savedPrescriptionIds: string[] = [prescriptionId]; // Track saved prescription IDs
      
      // Initialize tracking for duplicate temp patients
      if (!(window as any).__processedTempPatients) {
        (window as any).__processedTempPatients = {};
      }
      
      for (const localKey of localKeys) {
        // Skip if this is the current prescription we just saved
        if (localKey === prescriptionId || 
            (localKey === `original-${appointment.patientId}` && !isAddingNewPatient && 
             (currentPrescriptionId === 'appointment-original' || !currentPrescriptionId))) {
          continue;
        }
        
        const localData = localPrescriptionData[localKey];
        
        // Check if this is for the original patient
        if (localKey.startsWith('original-')) {
          // Find existing prescription for original patient or create new one
          const originalPrescription = allPrescriptions.find(p => p.patientId === appointment.patientId);
          
          // Convert medicines
          const localMedicineData: Medicine[] = localData.medicines
            .filter(med => med.medicineName.trim())
            .map(med => ({
              id: med.id,
              medicineName: med.medicineName,
              frequency: med.frequency,
              source: med.source || 'written',
              dose: med.dose || '',
              days: med.days || 0,
              drugCount: med.drugCount || 0,
              dosage: med.dosage || med.dose || '',
              duration: med.duration || (med.days ? `${med.days} days` : ''),
              instructions: med.instructions || med.specialNote || '',
              ...(med.genericName && med.genericName.trim() ? { genericName: med.genericName } : {}),
              ...(med.tradeName && med.tradeName.trim() ? { tradeName: med.tradeName } : {}),
              ...(med.specialNote && med.specialNote.trim() ? { specialNote: med.specialNote } : {}),
              ...(med.inventoryId && med.inventoryId.trim() ? { inventoryId: med.inventoryId } : {}),
              ...(med.customMl !== undefined ? { customMl: med.customMl } : {}),
              ...(med.calculatedMl !== undefined ? { calculatedMl: med.calculatedMl } : {})
            }));
          
          const originalPrescriptionData = {
            appointmentId: appointment.id!,
            patientId: appointment.patientId,
            patientName: patientData?.name || appointment.patientName,
            patientDateOfBirth: patientData?.dateOfBirth || editedPatientInfo.dateOfBirth || undefined,
            patientAge: patientData?.dateOfBirth ? (await import('@/utils/ageUtils')).formatAge(patientData.dateOfBirth) : undefined,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctorName,
            medicines: localMedicineData,
            notes: localData.notes.trim(),
            presentingComplaint: localData.presentingComplaint.trim(),
            medicalHistory: {
              pastMedicalHistory: localData.pastMedicalHistory.trim(),
              surgicalHistory: localData.surgicalHistory.trim(),
              currentMedications: localData.currentMedications.trim(),
              allergies: localData.allergies.trim(),
              familyHistory: localData.familyHistory.trim()
            },
            onExamination: {
              temperature: localData.temperature.trim(),
              bloodPressure: localData.bloodPressure.trim(),
              heartRate: localData.heartRate.trim(),
              respiratoryRate: localData.respiratoryRate.trim(),
              oxygenSaturation: localData.oxygenSaturation.trim(),
              lungs: localData.lungs.trim(),
              abdomen: localData.abdomen.trim(),
              other: localData.otherExamination.trim()
            },
            labResults: {
              tsh: localData.tsh.trim(),
              hba1c: localData.hba1c.trim(),
              ldl: localData.ldl.trim(),
              cholesterol: localData.cholesterol.trim(),
              glucose: localData.glucose.trim(),
              creatinine: localData.creatinine.trim(),
              other: localData.otherLabResults.trim(),
              wbc: localData.wbc.trim(),
              ne: localData.ne.trim(),
              ly: localData.ly.trim(),
              hb: localData.hb.trim(),
              plt: localData.plt.trim(),
              crp: localData.crp.trim(),
              esr: localData.esr.trim(),
              pus: localData.pus.trim(),
              red: localData.red.trim(),
              sug: localData.sug.trim(),
              aib: localData.aib.trim(),
              org: localData.org.trim(),
              tc: localData.tc.trim(),
              tg: localData.tg.trim(),
              hdl: localData.hdl.trim(),
              vldl: localData.vldl.trim(),
              tcHdl: localData.tcHdl.trim(),
              fbs: localData.fbs.trim(),
              sCr: localData.sCr.trim(),
              ast: localData.ast.trim(),
              alt: localData.alt.trim(),
              rf: localData.rf.trim(),
              ...(localData.customLabResults.length > 0 && {
                customLabResults: localData.customLabResults.filter(result => result.name.trim() || result.value.trim())
              })
            },
            investigations: {
              ecg: localData.ecg.trim(),
              echo: localData.echo.trim(),
              xray: localData.xray.trim(),
              ct: localData.ct.trim(),
              mri: localData.mri.trim(),
              other: localData.otherInvestigations.trim()
            },
            diagnosis: localData.diagnosis.trim(),
            appointmentAmount: localData.appointmentAmount,
            medicalTests: localData.medicalTests,
            nextVisitDate: localData.nextVisitDate,
            createdBy: user.uid
          };
          
          try {
            if (originalPrescription) {
              await prescriptionService.updatePrescription(originalPrescription.id!, {
                medicines: localMedicineData,
                notes: localData.notes.trim(),
                presentingComplaint: localData.presentingComplaint.trim(),
                medicalHistory: {
                  pastMedicalHistory: localData.pastMedicalHistory.trim(),
                  surgicalHistory: localData.surgicalHistory.trim(),
                  currentMedications: localData.currentMedications.trim(),
                  allergies: localData.allergies.trim(),
                  familyHistory: localData.familyHistory.trim()
                },
                onExamination: {
                  temperature: localData.temperature.trim(),
                  bloodPressure: localData.bloodPressure.trim(),
                  heartRate: localData.heartRate.trim(),
                  respiratoryRate: localData.respiratoryRate.trim(),
                  oxygenSaturation: localData.oxygenSaturation.trim(),
                  lungs: localData.lungs.trim(),
                  abdomen: localData.abdomen.trim(),
                  other: localData.otherExamination.trim()
                },
                labResults: {
                  tsh: localData.tsh.trim(),
                  hba1c: localData.hba1c.trim(),
                  ldl: localData.ldl.trim(),
                  cholesterol: localData.cholesterol.trim(),
                  glucose: localData.glucose.trim(),
                  creatinine: localData.creatinine.trim(),
                  other: localData.otherLabResults.trim(),
                  wbc: localData.wbc.trim(),
                  ne: localData.ne.trim(),
                  ly: localData.ly.trim(),
                  hb: localData.hb.trim(),
                  plt: localData.plt.trim(),
                  crp: localData.crp.trim(),
                  esr: localData.esr.trim(),
                  pus: localData.pus.trim(),
                  red: localData.red.trim(),
                  sug: localData.sug.trim(),
                  aib: localData.aib.trim(),
                  org: localData.org.trim(),
                  tc: localData.tc.trim(),
                  tg: localData.tg.trim(),
                  hdl: localData.hdl.trim(),
                  vldl: localData.vldl.trim(),
                  tcHdl: localData.tcHdl.trim(),
                  fbs: localData.fbs.trim(),
                  sCr: localData.sCr.trim(),
                  ast: localData.ast.trim(),
                  alt: localData.alt.trim(),
                  rf: localData.rf.trim(),
                  ...(localData.customLabResults.length > 0 && {
                    customLabResults: localData.customLabResults.filter(result => result.name.trim() || result.value.trim())
                  })
                },
                investigations: {
                  ecg: localData.ecg.trim(),
                  echo: localData.echo.trim(),
                  xray: localData.xray.trim(),
                  ct: localData.ct.trim(),
                  mri: localData.mri.trim(),
                  other: localData.otherInvestigations.trim()
                },
                diagnosis: localData.diagnosis.trim(),
                appointmentAmount: localData.appointmentAmount,
                medicalTests: localData.medicalTests,
                nextVisitDate: localData.nextVisitDate
              });
              savedPrescriptionIds.push(originalPrescription.id!);
            } else {
              const newPrescriptionId = await prescriptionService.createPrescription(originalPrescriptionData);
              savedPrescriptionIds.push(newPrescriptionId);
            }
            
            // Update appointment amount for original patient
            if (localData.appointmentAmount !== undefined) {
              await appointmentService.updateAppointment(appointment.id!, {
                manualAppointmentAmount: localData.appointmentAmount
              });
            }
          } catch (error) {
            console.error(`Error saving original patient prescription:`, error);
            // Continue saving other prescriptions even if one fails
          }
        } else if (localKey.startsWith('temp-new-')) {
          // This is an unsaved new patient - create a new prescription for them
          const tempPatientData = localData.newPatientData;
          
          if (!tempPatientData || !tempPatientData.name.trim() || !tempPatientData.dateOfBirth.trim() || 
              !tempPatientData.gender.trim() || !tempPatientData.contact.trim()) {
            // Skip if patient data is incomplete
            continue;
          }
          
          // Check for duplicates: if we've already saved a prescription for a patient with the same name, DOB, and contact
          // This prevents creating duplicate patients when the same temp-new-* key appears multiple times
          // or when different temp keys represent the same patient
          const patientIdentifier = `${tempPatientData.name.trim().toLowerCase()}_${tempPatientData.dateOfBirth.trim()}_${tempPatientData.contact.trim()}`;
          const processedKey = (window as any).__processedTempPatients?.[patientIdentifier];
          
          if (processedKey && processedKey !== localKey) {
            // Skip this duplicate - we've already processed a patient with the same identifier
            console.log(`Skipping duplicate temp patient: ${localKey} (already processed as ${processedKey})`);
            continue;
          }
          
          // Track this patient as processed
          (window as any).__processedTempPatients[patientIdentifier] = localKey;
          
          // Convert medicines
          const localMedicineData: Medicine[] = localData.medicines
            .filter(med => med.medicineName.trim())
            .map(med => ({
              id: med.id,
              medicineName: med.medicineName,
              frequency: med.frequency,
              source: med.source || 'written',
              dose: med.dose || '',
              days: med.days || 0,
              drugCount: med.drugCount || 0,
              dosage: med.dosage || med.dose || '',
              duration: med.duration || (med.days ? `${med.days} days` : ''),
              instructions: med.instructions || med.specialNote || '',
              ...(med.genericName && med.genericName.trim() ? { genericName: med.genericName } : {}),
              ...(med.tradeName && med.tradeName.trim() ? { tradeName: med.tradeName } : {}),
              ...(med.specialNote && med.specialNote.trim() ? { specialNote: med.specialNote } : {}),
              ...(med.inventoryId && med.inventoryId.trim() ? { inventoryId: med.inventoryId } : {}),
              ...(med.customMl !== undefined ? { customMl: med.customMl } : {}),
              ...(med.calculatedMl !== undefined ? { calculatedMl: med.calculatedMl } : {})
            }));
          
          const { formatAge } = await import('@/utils/ageUtils');
          const tempPatientAge = formatAge(tempPatientData.dateOfBirth);
          
          const tempPrescriptionData = {
            appointmentId: appointment.id!,
            patientId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            patientName: tempPatientData.name,
            patientDateOfBirth: tempPatientData.dateOfBirth,
            patientAge: tempPatientAge,
            patientContact: tempPatientData.contact,
            patientGender: tempPatientData.gender,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctorName,
            medicines: localMedicineData,
            notes: localData.notes.trim(),
            presentingComplaint: localData.presentingComplaint.trim(),
            medicalHistory: {
              pastMedicalHistory: localData.pastMedicalHistory.trim(),
              surgicalHistory: localData.surgicalHistory.trim(),
              currentMedications: localData.currentMedications.trim(),
              allergies: localData.allergies.trim(),
              familyHistory: localData.familyHistory.trim()
            },
            onExamination: {
              temperature: localData.temperature.trim(),
              bloodPressure: localData.bloodPressure.trim(),
              heartRate: localData.heartRate.trim(),
              respiratoryRate: localData.respiratoryRate.trim(),
              oxygenSaturation: localData.oxygenSaturation.trim(),
              lungs: localData.lungs.trim(),
              abdomen: localData.abdomen.trim(),
              other: localData.otherExamination.trim()
            },
            labResults: {
              tsh: localData.tsh.trim(),
              hba1c: localData.hba1c.trim(),
              ldl: localData.ldl.trim(),
              cholesterol: localData.cholesterol.trim(),
              glucose: localData.glucose.trim(),
              creatinine: localData.creatinine.trim(),
              other: localData.otherLabResults.trim(),
              wbc: localData.wbc.trim(),
              ne: localData.ne.trim(),
              ly: localData.ly.trim(),
              hb: localData.hb.trim(),
              plt: localData.plt.trim(),
              crp: localData.crp.trim(),
              esr: localData.esr.trim(),
              pus: localData.pus.trim(),
              red: localData.red.trim(),
              sug: localData.sug.trim(),
              aib: localData.aib.trim(),
              org: localData.org.trim(),
              tc: localData.tc.trim(),
              tg: localData.tg.trim(),
              hdl: localData.hdl.trim(),
              vldl: localData.vldl.trim(),
              tcHdl: localData.tcHdl.trim(),
              fbs: localData.fbs.trim(),
              sCr: localData.sCr.trim(),
              ast: localData.ast.trim(),
              alt: localData.alt.trim(),
              rf: localData.rf.trim(),
              ...(localData.customLabResults.length > 0 && {
                customLabResults: localData.customLabResults.filter(result => result.name.trim() || result.value.trim())
              })
            },
            investigations: {
              ecg: localData.ecg.trim(),
              echo: localData.echo.trim(),
              xray: localData.xray.trim(),
              ct: localData.ct.trim(),
              mri: localData.mri.trim(),
              other: localData.otherInvestigations.trim()
            },
            diagnosis: localData.diagnosis.trim(),
            appointmentAmount: localData.appointmentAmount,
            medicalTests: localData.medicalTests,
            nextVisitDate: localData.nextVisitDate,
            createdBy: user.uid
          };
          
          try {
            const newTempPrescriptionId = await prescriptionService.createPrescription(tempPrescriptionData);
            savedPrescriptionIds.push(newTempPrescriptionId);
          } catch (error) {
            console.error(`Error saving temporary new patient prescription ${localKey}:`, error);
            // Continue saving other prescriptions even if one fails
          }
        } else {
          // This is for an existing prescription (additional patient)
          const existingPrescriptionForLocal = allPrescriptions.find(p => p.id === localKey);
          
          if (existingPrescriptionForLocal) {
            // Convert medicines
            const localMedicineData: Medicine[] = localData.medicines
              .filter(med => med.medicineName.trim())
              .map(med => ({
                id: med.id,
                medicineName: med.medicineName,
                frequency: med.frequency,
                source: med.source || 'written',
                dose: med.dose || '',
                days: med.days || 0,
                drugCount: med.drugCount || 0,
                dosage: med.dosage || med.dose || '',
                duration: med.duration || (med.days ? `${med.days} days` : ''),
                instructions: med.instructions || med.specialNote || '',
                ...(med.genericName && med.genericName.trim() ? { genericName: med.genericName } : {}),
                ...(med.tradeName && med.tradeName.trim() ? { tradeName: med.tradeName } : {}),
                ...(med.specialNote && med.specialNote.trim() ? { specialNote: med.specialNote } : {}),
                ...(med.inventoryId && med.inventoryId.trim() ? { inventoryId: med.inventoryId } : {}),
                ...(med.customMl !== undefined ? { customMl: med.customMl } : {}),
                ...(med.calculatedMl !== undefined ? { calculatedMl: med.calculatedMl } : {})
              }));
            
            try {
              await prescriptionService.updatePrescription(existingPrescriptionForLocal.id!, {
                medicines: localMedicineData,
                notes: localData.notes.trim(),
                presentingComplaint: localData.presentingComplaint.trim(),
                medicalHistory: {
                  pastMedicalHistory: localData.pastMedicalHistory.trim(),
                  surgicalHistory: localData.surgicalHistory.trim(),
                  currentMedications: localData.currentMedications.trim(),
                  allergies: localData.allergies.trim(),
                  familyHistory: localData.familyHistory.trim()
                },
                onExamination: {
                  temperature: localData.temperature.trim(),
                  bloodPressure: localData.bloodPressure.trim(),
                  heartRate: localData.heartRate.trim(),
                  respiratoryRate: localData.respiratoryRate.trim(),
                  oxygenSaturation: localData.oxygenSaturation.trim(),
                  lungs: localData.lungs.trim(),
                  abdomen: localData.abdomen.trim(),
                  other: localData.otherExamination.trim()
                },
                labResults: {
                  tsh: localData.tsh.trim(),
                  hba1c: localData.hba1c.trim(),
                  ldl: localData.ldl.trim(),
                  cholesterol: localData.cholesterol.trim(),
                  glucose: localData.glucose.trim(),
                  creatinine: localData.creatinine.trim(),
                  other: localData.otherLabResults.trim(),
                  wbc: localData.wbc.trim(),
                  ne: localData.ne.trim(),
                  ly: localData.ly.trim(),
                  hb: localData.hb.trim(),
                  plt: localData.plt.trim(),
                  crp: localData.crp.trim(),
                  esr: localData.esr.trim(),
                  pus: localData.pus.trim(),
                  red: localData.red.trim(),
                  sug: localData.sug.trim(),
                  aib: localData.aib.trim(),
                  org: localData.org.trim(),
                  tc: localData.tc.trim(),
                  tg: localData.tg.trim(),
                  hdl: localData.hdl.trim(),
                  vldl: localData.vldl.trim(),
                  tcHdl: localData.tcHdl.trim(),
                  fbs: localData.fbs.trim(),
                  sCr: localData.sCr.trim(),
                  ast: localData.ast.trim(),
                  alt: localData.alt.trim(),
                  rf: localData.rf.trim(),
                  ...(localData.customLabResults.length > 0 && {
                    customLabResults: localData.customLabResults.filter(result => result.name.trim() || result.value.trim())
                  })
                },
                investigations: {
                  ecg: localData.ecg.trim(),
                  echo: localData.echo.trim(),
                  xray: localData.xray.trim(),
                  ct: localData.ct.trim(),
                  mri: localData.mri.trim(),
                  other: localData.otherInvestigations.trim()
                },
                diagnosis: localData.diagnosis.trim(),
                appointmentAmount: localData.appointmentAmount,
                medicalTests: localData.medicalTests,
                nextVisitDate: localData.nextVisitDate
              });
              savedPrescriptionIds.push(existingPrescriptionForLocal.id!);
            } catch (error) {
              console.error(`Error saving prescription ${localKey}:`, error);
              // Continue saving other prescriptions even if one fails
            }
          }
        }
      }
      
      // Clear tracking for processed temp patients
      delete (window as any).__processedTempPatients;
      
      // Clear all saved local data
      setLocalPrescriptionData(prev => {
        const updated = { ...prev };
        savedPrescriptionIds.forEach(id => {
          delete updated[id];
        });
        // Also clear original patient's local data
        delete updated[`original-${appointment.patientId}`];
        // Clear all temporary new patient keys
        Object.keys(updated).forEach(key => {
          if (key.startsWith('temp-new-')) {
            delete updated[key];
          }
        });
        return updated;
      });

      // Save diagnosis to saved diagnoses database if it's not empty
      if (diagnosis.trim()) {
        try {
          await diagnosisManagementService.saveOrUpdateDiagnosis(diagnosis.trim());
        } catch (error) {
          console.error('Error saving diagnosis:', error);
          // Don't fail the whole operation if diagnosis save fails
        }
      }

      // Update appointment with the manual appointment amount ONLY for the original patient
      // For additional patients, the amount is stored only in their prescription
      if (appointment.id && appointmentAmount !== undefined) {
        // Only update appointment's manualAppointmentAmount if this is the original patient
        // For additional patients, the amount is stored only in the prescription
        const isOriginalPatient = !isAddingNewPatient && 
          (currentPrescriptionId === 'appointment-original' || 
           (!existingPrescription && !currentPrescriptionId) ||
           (existingPrescription && existingPrescription.patientId === appointment.patientId));
        
        if (isOriginalPatient) {
          try {
            await appointmentService.updateAppointment(appointment.id, {
              manualAppointmentAmount: appointmentAmount
            });
            console.log(`Updated appointment ${appointment.id} with amount: ${appointmentAmount} for original patient`);
          } catch (error) {
            console.error('Error updating appointment amount:', error);
            // Don't fail the whole operation if appointment update fails
            toast.error('Failed to update appointment amount, but prescription was saved');
          }
        } else {
          // For additional patients, the amount is stored in the prescription only
          console.log(`Appointment amount ${appointmentAmount} stored in prescription for patient: ${finalPatientName}`);
        }
      }
  
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        const uploadedImages: PrescriptionImage[] = [];
        
        for (const file of imageFiles) {
          try {
            const description = imageDescriptions[file.name] || '';
            const imageRecord = await imageUploadService.uploadPrescriptionImage(
              file, 
              prescriptionId, 
              description
            );
            uploadedImages.push(imageRecord);
          } catch (error) {
            console.error('Error uploading image:', error);
            toast.error(`Failed to upload ${file.name}`);
          }
        }
        
        if (uploadedImages.length > 0) {
          // Update prescription with new images
          const allImages = [...images, ...uploadedImages];
          await prescriptionService.updatePrescriptionImages(prescriptionId, allImages);
          toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
        }
        
        setUploadingImages(false);
      }
  
      // Store whether we were adding a new patient before state changes
      const wasAddingNewPatient = isAddingNewPatient;
      
      // Reload all prescriptions to refresh the list
      if (appointment.id) {
        const updatedPrescriptions = await prescriptionService.getAllPrescriptionsByAppointmentId(appointment.id);
        setAllPrescriptions(updatedPrescriptions);
        
        // If it was a new patient, show success and allow adding another patient
        if (wasAddingNewPatient) {
          const newPrescription = updatedPrescriptions.find(p => p.id === prescriptionId);
          if (newPrescription) {
            // Update the prescriptions list
            setAllPrescriptions(updatedPrescriptions);
            
            // Show success message with option to add another patient
            toast.success(`Patient "${newPrescription.patientName}" saved successfully! You can add another patient by clicking "Add Patient" button.`, {
              duration: 5000,
            });
            
            // Reset form to allow adding another patient immediately
            // User can click "Add Patient" again to add more patients
            setIsAddingNewPatient(false);
            setCurrentPrescriptionId(prescriptionId);
            setExistingPrescription(newPrescription);
            
            // Reset new patient data
            setNewPatientData({
              name: '',
              dateOfBirth: '',
              bodyWeight: '',
              gender: '',
              drugAllergies: '',
              contact: ''
            });
            
            // Load the newly created prescription data
            await switchToPatient(prescriptionId);
          }
        } else if (existingPrescription) {
          // Reload current prescription
          await switchToPatient(existingPrescription.id!);
        } else if (currentPrescriptionId === 'appointment-original') {
          // If we saved for the original patient, check if prescription was created
          const originalPrescription = updatedPrescriptions.find(p => p.patientId === appointment.patientId);
          if (originalPrescription) {
            // Update to use the actual prescription ID
            setCurrentPrescriptionId(originalPrescription.id || 'appointment-original');
            setExistingPrescription(originalPrescription);
          } else {
            // Still no prescription - keep as original
            setCurrentPrescriptionId('appointment-original');
          }
        }
      }

      // Only show generic success message if not already shown for new patient and not auto-saving
      if (!wasAddingNewPatient && !(window as any).__isAutoSavingForNewPatient) {
        toast.success('Prescription saved successfully!', {
          style: {
            background: '#10b981',
            color: 'white',
            border: '1px solid #059669'
          }
        });
      }
      onSuccess();
      // Don't close modal - allow adding more patients or editing existing ones
      // onClose();
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast.error('Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const loadPrescriptionHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await prescriptionService.getPrescriptionsByPatientId(appointment.patientId);
      
      // Filter out the current appointment's prescription if it exists
      const filteredHistory = history.filter(p => p.appointmentId !== appointment.id);
      
      // Sort by creation date (newest first)
      filteredHistory.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt!);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt!);
        return dateB.getTime() - dateA.getTime();
      });
      
      setPrescriptionHistory(filteredHistory);
    } catch (error) {
      console.error('Error loading prescription history:', error);
      toast.error('Failed to load prescription history');
    } finally {
      setLoadingHistory(false);
    }
  };


  const loadPatientImages = async () => {
    try {
      setLoadingImages(true);
      console.log('Loading images for patient:', appointment.patientId);
      
      const history = await prescriptionService.getPrescriptionsByPatientId(appointment.patientId);
      console.log('Found prescriptions:', history.length);
      
      const allImages: (PrescriptionImage & { prescriptionDate: Date, appointmentDate: Date })[] = [];
      
      for (const prescription of history) {
        if (prescription.images && prescription.images.length > 0) {
          console.log(`Prescription ${prescription.id} has ${prescription.images.length} images`);
          
          try {
            // Get appointment details for this prescription
            const prescriptionAppointment = await appointmentService.getAppointmentById(prescription.appointmentId);
            const appointmentDate = prescriptionAppointment ? new Date(prescriptionAppointment.date) : new Date();
            const prescriptionDate = prescription.createdAt instanceof Date ? prescription.createdAt : new Date(prescription.createdAt!);
            
            prescription.images.forEach(image => {
              console.log('Adding image:', image.originalName, 'URL:', image.downloadURL);
              allImages.push({
                ...image,
                prescriptionDate,
                appointmentDate
              });
            });
          } catch (appointmentError) {
            console.error('Error loading appointment for prescription:', prescription.id, appointmentError);
            // Still add images even if appointment loading fails
            const prescriptionDate = prescription.createdAt instanceof Date ? prescription.createdAt : new Date(prescription.createdAt!);
            
            prescription.images.forEach(image => {
              allImages.push({
                ...image,
                prescriptionDate,
                appointmentDate: prescriptionDate // Use prescription date as fallback
              });
            });
          }
        }
      }
      
      // Sort by prescription date (newest first)
      allImages.sort((a, b) => b.prescriptionDate.getTime() - a.prescriptionDate.getTime());
      
      console.log('Total images loaded:', allImages.length);
      setPatientImages(allImages);
    } catch (error) {
      console.error('Error loading patient images:', error);
      toast.error('Failed to load patient images');
    } finally {
      setLoadingImages(false);
    }
  };

  const loadAppointmentDocuments = async () => {
    try {
      setLoadingDocuments(true);
      console.log('Loading documents for appointment:', appointment.id);
      
      // Load the full appointment data to get documents
      const fullAppointment = await appointmentService.getAppointmentById(appointment.id!);
      
      if (fullAppointment && fullAppointment.documents && fullAppointment.documents.length > 0) {
        console.log(`Appointment ${appointment.id} has ${fullAppointment.documents.length} documents`);
        setAppointmentDocuments(fullAppointment.documents);
      } else {
        setAppointmentDocuments([]);
      }
    } catch (error) {
      console.error('Error loading appointment documents:', error);
      toast.error('Failed to load appointment documents');
      setAppointmentDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadReferralDoctors = async () => {
    try {
      const doctors = await referralDoctorService.getActiveReferralDoctors();
      setReferralDoctors(doctors);
      setFilteredReferralDoctors(doctors);
    } catch (error) {
      console.error('Error loading referral doctors:', error);
      toast.error('Failed to load referral doctors');
    }
  };

  const loadTags = async () => {
    try {
      // Initialize default tags if needed
      await tagManagementService.initializeDefaultTags();
      
      // Load all tags from Firebase
      const allTags = await tagManagementService.getAllTags();
      
      setPresentingComplaintTags(allTags.presentingComplaint);
      setPastMedicalHistoryTags(allTags.pastMedicalHistory);
      setLungsTags(allTags.lungs);
    } catch (error) {
      console.error('Error loading tags:', error);
      // Tags will remain empty arrays on error
    }
  };

  // Filter referral doctors based on search query
  useEffect(() => {
    if (referralDoctorSearchQuery.trim() === '') {
      setFilteredReferralDoctors(referralDoctors);
    } else {
      const query = referralDoctorSearchQuery.toLowerCase();
      const filtered = referralDoctors.filter(doctor => 
        doctor.name.toLowerCase().includes(query) || 
        doctor.specialty.toLowerCase().includes(query) ||
        (doctor.hospital && doctor.hospital.toLowerCase().includes(query)) ||
        (doctor.qualifications && doctor.qualifications.toLowerCase().includes(query))
      );
      setFilteredReferralDoctors(filtered);
    }
  }, [referralDoctorSearchQuery, referralDoctors]);

  const handleCreateReferralLetter = async () => {
    if (!selectedReferralDoctor || !referralNote.trim()) {
      toast.error('Please select a doctor and enter referral notes');
      return;
    }

    try {
      setCreatingReferral(true);
      
      const referralLetter = await referralLetterService.createReferralLetterWithData(
        patientData!,
        selectedReferralDoctor,
        referralNote,
        referralDate,
        user?.uid
      );
      
      // Store the referral letter ID to link it to the prescription
      setCreatedReferralLetterId(referralLetter.id);
      
      toast.success('Referral letter created successfully');
      setShowReferralModal(false);
      setReferralNote('');
      setSelectedReferralDoctor(null);
      setReferralDoctorSearchQuery('');
    } catch (error: any) {
      console.error('Error creating referral letter:', error);
      toast.error('Failed to create referral letter');
    } finally {
      setCreatingReferral(false);
    }
  };

  const handleViewHistoryPrescription = (prescription: Prescription) => {
    setSelectedHistoryPrescription(prescription);
    setShowHistoryModal(true);
  };
  
  const handleViewImage = (image: PrescriptionImage) => {
    setSelectedImage(image);
    setShowImageViewer(true);
  };
  
  const handleViewDocument = (document: AppointmentDocument) => {
    setSelectedDocument(document);
    setShowDocumentViewer(true);
  };
  
  const closeDocumentViewer = () => {
    setSelectedDocument(null);
    setShowDocumentViewer(false);
  };

  const scrollToDocumentsSection = () => {
    if (documentsSectionRef.current && scrollAreaRef.current) {
      // Get the scroll viewport element
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      
      if (scrollViewport && documentsSectionRef.current) {
        const documentsRect = documentsSectionRef.current.getBoundingClientRect();
        const viewportRect = scrollViewport.getBoundingClientRect();
        
        // Calculate the scroll position needed to bring the documents section into view
        const scrollTop = documentsRect.top - viewportRect.top + scrollViewport.scrollTop - 20; // 20px offset from top
        
        scrollViewport.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  };

  const debugImageUrls = () => {
    console.log('=== IMAGE DEBUGGING ===');
    patientImages.forEach((image, index) => {
      console.log(`Image ${index + 1}:`, {
        id: image.id,
        originalName: image.originalName,
        downloadURL: image.downloadURL,
        mimeType: image.mimeType,
        fileSize: image.fileSize
      });
    });
  };
  
  // Call this in useEffect after images are loaded
  useEffect(() => {
    if (patientImages.length > 0) {
      debugImageUrls();
    }
  }, [patientImages]);

  const ImageThumbnail = ({ 
    image, 
    onImageClick 
  }: { 
    image: PrescriptionImage & { prescriptionDate: Date, appointmentDate: Date },
    onImageClick: (image: PrescriptionImage) => void 
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
  
    const handleImageLoad = () => {
      setImageLoaded(true);
      setImageLoading(false);
      setImageError(false);
    };
  
    const handleImageError = () => {
      setImageError(true);
      setImageLoading(false);
      setImageLoaded(false);
      console.error('Failed to load image:', image.downloadURL);
    };
  
    const handleClick = () => {
      if (imageLoaded && !imageError) {
        onImageClick(image);
      }
    };
  
    return (
      <div className="relative group cursor-pointer" onClick={handleClick}>
        <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors bg-gray-100">
          {/* Loading state */}
          {imageLoading && (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
          
          {/* Error state */}
          {imageError && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
              <AlertCircle className="h-6 w-6 mb-1" />
              <span className="text-xs">Failed to load</span>
            </div>
          )}
          
          {/* Actual image */}
          <img
            src={image.downloadURL}
            alt={image.description || image.originalName}
            className={`w-full h-full object-cover transition-all duration-200 ${
              imageLoaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Hover overlay */}
          {imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
        
        {/* Image info */}
        <div className="mt-2">
          <p className="text-xs text-gray-600 truncate" title={image.description || 'No description'}>
            {image.description || 'No description'}
          </p>
          <p className="text-xs text-gray-400">
            {image.appointmentDate.toLocaleDateString()}
          </p>
          {imageError && (
            <p className="text-xs text-red-500">Image unavailable</p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Loading Prescription</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading prescription data...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Custom scrollbar styling for prescription modal - Pure Black */
        [data-radix-scroll-area-viewport] {
          scrollbar-width: auto !important;
          scrollbar-color: #000000 #e5e7eb !important;
        }
        [data-radix-scroll-area-viewport]::-webkit-scrollbar {
          width: 14px !important;
        }
        [data-radix-scroll-area-viewport]::-webkit-scrollbar-track {
          background: #e5e7eb !important;
          border-radius: 7px !important;
          border: 1px solid #d1d5db !important;
        }
        [data-radix-scroll-area-viewport]::-webkit-scrollbar-thumb {
          background: #000000 !important;
          border-radius: 7px !important;
          border: 2px solid #e5e7eb !important;
          min-height: 40px !important;
        }
        [data-radix-scroll-area-viewport]::-webkit-scrollbar-thumb:hover {
          background: #000000 !important;
        }
        [data-radix-scroll-area-viewport]::-webkit-scrollbar-thumb:active {
          background: #000000 !important;
        }
        /* Radix ScrollArea scrollbar styling - Force black */
        [data-radix-scroll-area-scrollbar] {
          display: flex !important;
          opacity: 1 !important;
        }
        [data-radix-scroll-area-scrollbar][data-orientation="vertical"] {
          width: 14px !important;
          background: #e5e7eb !important;
          border-radius: 7px !important;
          padding: 2px !important;
          border: 1px solid #d1d5db !important;
        }
        [data-radix-scroll-area-thumb] {
          background: #000000 !important;
          background-color: #000000 !important;
          border-radius: 7px !important;
          transition: background 0.2s !important;
          min-height: 40px !important;
        }
        [data-radix-scroll-area-thumb]:hover {
          background: #000000 !important;
          background-color: #000000 !important;
        }
        [data-radix-scroll-area-thumb]:active {
          background: #000000 !important;
          background-color: #000000 !important;
        }
        /* Override any bg-border class */
        [data-radix-scroll-area-thumb].bg-border {
          background: #000000 !important;
          background-color: #000000 !important;
        }
      `}} />
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[98vh] overflow-hidden p-0 [&>button]:hidden">
        {/* Modern Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-4 md:p-6 rounded-t-lg relative">
          {/* Enhanced Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 h-9 w-9 md:h-10 md:w-10 rounded-full bg-red-500 hover:bg-red-600 text-white hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl z-10"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pr-12 md:pr-16">
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Pill className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg md:text-xl font-semibold text-white truncate">
                  {isAddingNewPatient ? 'Add New Patient Prescription' : (existingPrescription ? 'Edit Prescription' : 'Create New Prescription')}
                </DialogTitle>
                <p className="text-blue-100 text-xs md:text-sm mt-1 truncate">
                  {isAddingNewPatient 
                    ? `New Patient • ${appointment.doctorName} • ${new Date(appointment.date).toLocaleDateString()}`
                    : `${currentPrescriptionId === 'appointment-original' || !currentPrescriptionId 
                        ? (patientData?.name || appointment.patientName)
                        : (existingPrescription?.patientName || patientData?.name || appointment.patientName)
                      } • ${appointment.doctorName} • ${new Date(appointment.date).toLocaleDateString()}`
                  }
                </p>
              </div>
            </div>
             <div className="flex flex-wrap items-center gap-2 lg:gap-3 lg:flex-nowrap">
               {/* Fullscreen Toggle Button */}
               <Button
                 type="button"
                 variant="ghost"
                 onClick={toggleFullscreen}
                 className="h-8 md:h-9 w-8 md:w-9 p-0 text-white hover:bg-white/20 border border-white/30 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                 title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
               >
                 {isFullscreen ? (
                   <Minimize className="h-4 w-4 md:h-4 md:w-4" />
                 ) : (
                   <Maximize className="h-4 w-4 md:h-4 md:w-4" />
                 )}
               </Button>
               {/* Documents Button - Show when appointment has documents */}
               {appointmentDocuments.length > 0 && (
                 <Button
                   type="button"
                   variant="ghost"
                   onClick={scrollToDocumentsSection}
                   className="h-8 md:h-9 px-3 md:px-4 text-white hover:bg-white/20 border border-white/30 rounded-lg flex items-center gap-2 flex-shrink-0 transition-all duration-200"
                   title={`View ${appointmentDocuments.length} document${appointmentDocuments.length !== 1 ? 's' : ''}`}
                 >
                   <FileTextIcon className="h-4 w-4 md:h-4 md:w-4 flex-shrink-0" />
                   <span className="text-xs md:text-sm font-medium hidden sm:inline">
                     Documents ({appointmentDocuments.length})
                   </span>
                   <ChevronDown className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                 </Button>
               )}
               {/* Patient Selector - Show when there are multiple patients (saved or unsaved) */}
               {(() => {
                 // Count total patients: 
                 // - Original patient (always exists)
                 // - Saved additional patients (excluding original)
                 // - Unsaved new patients (temp-new- keys)
                 // - Current new patient being added (if any)
                 const savedAdditionalPatients = allPrescriptions.filter(p => p.patientId !== appointment.patientId).length;
                 const unsavedNewPatients = Object.keys(localPrescriptionData).filter(key => 
                   key.startsWith('temp-new-')
                 ).length;
                 const hasCurrentNewPatient = isAddingNewPatient && newPatientData.name.trim();
                 
                 // Total patients = 1 (original) + saved additional + unsaved + current (if adding)
                 const totalPatients = 1 + savedAdditionalPatients + unsavedNewPatients + (hasCurrentNewPatient ? 1 : 0);
                 
                 // Show dropdown if there are 2 or more patients
                 const shouldShowDropdown = totalPatients >= 2;
                 
                 if (!shouldShowDropdown) return null;
                 
                 // Get current value for selector
                 let currentValue = currentPrescriptionId || 'appointment-original';
                 if (isAddingNewPatient) {
                   // Find the current temp key if we're adding a new patient
                   const tempKeys = Object.keys(localPrescriptionData).filter(key => key.startsWith('temp-new-'));
                   if (tempKeys.length > 0) {
                     // Use the most recent temp key or create a placeholder
                     currentValue = `temp-current-${Date.now()}`;
                   }
                 }
                 
                 // Get current patient name for display
                 const getCurrentPatientName = (): string => {
                   const selectedValue = isAddingNewPatient ? 'temp-current' : (currentPrescriptionId || 'appointment-original');
                   
                   if (selectedValue === 'appointment-original') {
                     return appointment.patientName;
                   } else if (selectedValue === 'temp-current') {
                     return newPatientData.name.trim() || 'New Patient';
                   } else if (selectedValue.startsWith('temp-new-')) {
                     const tempData = localPrescriptionData[selectedValue];
                     return tempData?.newPatientData?.name || 'New Patient';
                   } else {
                     const prescription = allPrescriptions.find(p => p.id === selectedValue);
                     return prescription?.patientName || appointment.patientName;
                   }
                 };
                 
                 const currentPatientName = getCurrentPatientName();
                 
                 return (
                   <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-2 md:px-3 py-1.5 md:py-2 border border-white/20 flex-shrink-0">
                     <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-white flex-shrink-0" />
                     <Select
                       value={isAddingNewPatient ? 'temp-current' : (currentPrescriptionId || 'appointment-original')}
                       onValueChange={async (value) => {
                         if (value === 'appointment-original') {
                           await switchToPatient('appointment-original');
                         } else if (value.startsWith('temp-new-')) {
                           // Switch to a temporary new patient
                           // Save current form data first using the same logic as switchToPatient
                           let currentKey: string;
                           // Priority 1: If we have an existing saved prescription, ALWAYS use its ID
                           if (existingPrescription?.id && !isAddingNewPatient) {
                             currentKey = existingPrescription.id;
                           } else if (isAddingNewPatient) {
                             // Priority 2: If we're currently adding a new patient, find existing temp key or create one
                             // First, check if currentPrescriptionId is already a temp-new-* key - use it directly
                             if (currentPrescriptionId && currentPrescriptionId.startsWith('temp-new-')) {
                               currentKey = currentPrescriptionId;
                             } else if (newPatientData.name.trim()) {
                               const patientNameKey = newPatientData.name.trim().replace(/\s+/g, '-').toLowerCase();
                               const existingTempKey = Object.keys(localPrescriptionData).find(key => 
                                 key.startsWith('temp-new-') && 
                                 key.includes(patientNameKey) &&
                                 localPrescriptionData[key]?.newPatientData?.name?.trim().toLowerCase() === newPatientData.name.trim().toLowerCase()
                               );
                               currentKey = existingTempKey || `temp-new-${patientNameKey}`;
                             } else {
                               currentKey = `temp-new-unnamed`;
                             }
                           } else if (currentPrescriptionId === 'appointment-original' || !currentPrescriptionId) {
                             currentKey = `original-${appointment.patientId}`;
                           } else if (currentPrescriptionId && !currentPrescriptionId.startsWith('temp-') && currentPrescriptionId !== 'appointment-original') {
                             currentKey = currentPrescriptionId;
                           } else {
                             currentKey = currentPrescriptionId || `original-${appointment.patientId}`;
                           }
                           if (currentKey) {
                             saveCurrentFormDataLocally(currentKey);
                           }
                           // Restore the selected temporary patient
                           restoreLocalFormData(value);
                           // Set the current prescription ID to the temp key so it's tracked
                           setCurrentPrescriptionId(value);
                         } else if (value === 'temp-current') {
                           // Already on current patient, do nothing
                           return;
                         } else {
                           // Switching to a saved prescription (original or other saved prescription)
                           // Use switchToPatient which handles saving current data correctly
                           await switchToPatient(value);
                         }
                       }}
                     >
                       <SelectTrigger className="h-7 md:h-8 bg-white/20 border-white/30 text-white hover:bg-white/30 w-auto min-w-[120px] md:min-w-[150px] max-w-[200px]">
                         <span className="truncate flex-1 text-left">{truncatePatientName(currentPatientName)}</span>
                       </SelectTrigger>
                       <SelectContent>
                         {/* Original Appointment Patient - Always show first */}
                         <SelectItem value="appointment-original">
                           <div className="flex items-center space-x-2">
                             <User className="h-4 w-4" />
                             <span>{appointment.patientName}</span>
                             {patientData?.dateOfBirth && (
                               <span className="text-xs text-gray-500">({formatPatientAge(patientData)})</span>
                             )}
                             <Badge variant="outline" className="ml-1 text-xs bg-blue-100 text-blue-700 border-blue-300">
                               Original
                             </Badge>
                           </div>
                         </SelectItem>
                         {/* Saved Additional Patients */}
                         {allPrescriptions
                           .filter(p => p.patientId !== appointment.patientId) // Exclude original patient's prescription if it exists
                           .map((prescription) => (
                             <SelectItem key={prescription.id} value={prescription.id!}>
                               <div className="flex items-center space-x-2">
                                 <User className="h-4 w-4" />
                                 <span>{prescription.patientName}</span>
                                 {prescription.patientAge && (
                                   <span className="text-xs text-gray-500">({prescription.patientAge})</span>
                                 )}
                               </div>
                             </SelectItem>
                           ))}
                         {/* Unsaved New Patients (temporary) */}
                         {Object.keys(localPrescriptionData)
                           .filter(key => key.startsWith('temp-new-'))
                           .map((tempKey) => {
                             const tempData = localPrescriptionData[tempKey];
                             const patientName = tempData.newPatientData?.name || 'New Patient';
                             const patientAge = tempData.newPatientData?.dateOfBirth 
                               ? formatPatientAge({ dateOfBirth: tempData.newPatientData.dateOfBirth } as Patient)
                               : '';
                             
                             return (
                               <SelectItem key={tempKey} value={tempKey}>
                                 <div className="flex items-center space-x-2">
                                   <User className="h-4 w-4" />
                                   <span>{patientName}</span>
                                   {patientAge && (
                                     <span className="text-xs text-gray-500">({patientAge})</span>
                                   )}
                                   <Badge variant="outline" className="ml-1 text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                                     Unsaved
                                   </Badge>
                                 </div>
                               </SelectItem>
                             );
                           })}
                         {/* Current new patient being added */}
                         {isAddingNewPatient && newPatientData.name.trim() && (
                           <SelectItem value="temp-current">
                             <div className="flex items-center space-x-2">
                               <User className="h-4 w-4" />
                               <span>{newPatientData.name}</span>
                               {newPatientData.dateOfBirth && (
                                 <span className="text-xs text-gray-500">
                                   ({formatPatientAge({ dateOfBirth: newPatientData.dateOfBirth } as Patient)})
                                 </span>
                               )}
                               <Badge variant="outline" className="ml-1 text-xs bg-green-100 text-green-700 border-green-300">
                                 Current
                               </Badge>
                             </div>
                           </SelectItem>
                         )}
                       </SelectContent>
                     </Select>
                   </div>
                 );
               })()}
               
               {/* Add New Patient Button */}
               <Button
                 onClick={handleAddNewPatient}
                 disabled={saving}
                 size="sm"
                 className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 transition-all duration-200 h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm flex-shrink-0"
               >
                 <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                 <span className="hidden sm:inline">Add Patient</span>
                 <span className="sm:hidden">Add</span>
               </Button>
               {/* Previous Appointment History */}
               {previousAppointments.length > 0 && (
                 <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-2 md:px-3 py-1.5 md:py-2 border border-white/20 flex-shrink-0">
                   <div className="flex items-center space-x-1.5 md:space-x-2">
                     <History className="h-3.5 w-3.5 md:h-4 md:w-4 text-white flex-shrink-0" />
                     <div className="flex flex-col min-w-0">
                       <span className="text-xs text-white/70 whitespace-nowrap">Previous:</span>
                       <span className="text-xs md:text-sm font-bold text-white truncate">
                         {formatCurrency(previousAppointments[0].manualAppointmentAmount)}
                       </span>
                     </div>
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button
                           size="sm"
                           variant="ghost"
                           className="h-6 md:h-7 px-1.5 md:px-2 text-white hover:bg-white/20 hover:text-white flex-shrink-0"
                         >
                           <span className="text-xs mr-0.5 md:mr-1 hidden sm:inline">History</span>
                           <ChevronDown className="h-3 w-3" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="w-72">
                         <DropdownMenuLabel className="text-sm font-semibold">
                           Appointment Amount History
                         </DropdownMenuLabel>
                         <DropdownMenuSeparator />
                         <div className="max-h-64 overflow-y-auto">
                           {previousAppointments.map((apt, index) => (
                             <DropdownMenuItem key={apt.id || index} className="flex flex-col items-start py-2">
                               <div className="flex justify-between w-full items-center">
                                 <span className="text-sm font-medium">
                                   {formatCurrency(apt.manualAppointmentAmount)}
                                 </span>
                                 <Badge variant="outline" className="text-xs">
                                   {new Date(apt.date).toLocaleDateString()}
                                 </Badge>
                               </div>
                               <div className="flex flex-col mt-1 w-full">
                                 <span className="text-xs text-gray-500">
                                   Dr. {apt.doctorName}
                                 </span>
                                 {apt.procedures && apt.procedures.length > 0 && (
                                   <span className="text-xs text-gray-400 truncate">
                                     {apt.procedures.map(p => p.procedureName).join(', ')}
                                   </span>
                                 )}
                               </div>
                             </DropdownMenuItem>
                           ))}
                         </div>
                       </DropdownMenuContent>
                     </DropdownMenu>
                   </div>
                 </div>
               )}
               
               {/* Appointment Amount Field */}
               <div className="flex items-center space-x-1.5 md:space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-2 md:px-3 py-1.5 md:py-2 border border-white/20 flex-shrink-0">
                 <div className="flex items-center space-x-1">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 md:h-4 md:w-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <Label htmlFor="appointment-amount-header" className="text-xs font-medium text-white whitespace-nowrap hidden sm:inline">
                     Amount:
                   </Label>
                   <Label htmlFor="appointment-amount-header" className="text-xs font-medium text-white whitespace-nowrap sm:hidden">
                     Amt:
                   </Label>
                 </div>
                 <Input
                   id="appointment-amount-header"
                   type="number"
                   value={appointmentAmount || ''}
                   onChange={(e) => setAppointmentAmount(e.target.value ? parseFloat(e.target.value) : undefined)}
                   placeholder="0.00"
                   min="0"
                   step="0.01"
                   className="w-20 md:w-28 h-7 md:h-8 text-xs md:text-sm bg-white/90 border-white/30 focus:border-white focus:ring-white/50 font-semibold text-gray-900"
                 />
                 <span className="text-xs text-white/80">Rs.</span>
               </div>
               
               <Button
                 onClick={() => setShowReferralModal(true)}
                 disabled={!patientData}
                 size="sm"
                 className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 transition-all duration-200 h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm flex-shrink-0"
               >
                 <Send className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                 <span className="hidden sm:inline">Referral</span>
                 <span className="sm:hidden">Ref</span>
               </Button>
               {(() => {
                 // Count total patients
                 const savedAdditionalPatients = allPrescriptions.filter(p => p.patientId !== appointment.patientId).length;
                 const unsavedNewPatients = Object.keys(localPrescriptionData).filter(key => key.startsWith('temp-new-')).length;
                 const hasCurrentNewPatient = isAddingNewPatient && newPatientData.name.trim();
                 const totalPatients = 1 + savedAdditionalPatients + unsavedNewPatients + (hasCurrentNewPatient ? 1 : 0);
                 const hasMultiplePatients = totalPatients > 1;
                 
                 // Check if any patient has data to preview
                 const originalPrescription = allPrescriptions.find(p => p.patientId === appointment.patientId);
                 const hasOriginalData = medicines.filter(m => m.medicineName.trim()).length > 0 || originalPrescription;
                 const hasAnyPatientData = hasOriginalData || allPrescriptions.length > 0;
                 
                 if (hasMultiplePatients && hasAnyPatientData) {
                   // Show dropdown menu for multiple patients
                   return (
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button
                           disabled={!hasAnyPatientData}
                           size="sm"
                           className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 transition-all duration-200 h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm flex-shrink-0"
                           title="Preview prescription - Select patient"
                         >
                           <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                           <span className="hidden sm:inline">Preview</span>
                           <span className="sm:hidden">View</span>
                           <ChevronDown className="h-3 w-3 ml-1" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
                         <DropdownMenuLabel>Select Patient to Preview</DropdownMenuLabel>
                         <DropdownMenuSeparator />
                         {/* Original Patient */}
                         {(hasOriginalData || originalPrescription) && (
                           <DropdownMenuItem
                             onClick={() => handlePreviewPrescription('appointment-original')}
                             className="cursor-pointer"
                           >
                             <div className="flex items-center space-x-2 w-full">
                               <User className="h-4 w-4 text-blue-600" />
                               <div className="flex-1 min-w-0">
                                 <div className="font-medium">{appointment.patientName}</div>
                                 {patientData?.dateOfBirth && (
                                   <div className="text-xs text-gray-500">({formatPatientAge(patientData)})</div>
                                 )}
                               </div>
                               <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                 Original
                               </Badge>
                             </div>
                           </DropdownMenuItem>
                         )}
                         {/* Additional Patients */}
                         {allPrescriptions
                           .filter(p => p.patientId !== appointment.patientId)
                           .map((prescription) => (
                             <DropdownMenuItem
                               key={prescription.id}
                               onClick={() => handlePreviewPrescription(prescription.id!)}
                               className="cursor-pointer"
                             >
                               <div className="flex items-center space-x-2 w-full">
                                 <User className="h-4 w-4 text-indigo-600" />
                                 <div className="flex-1 min-w-0">
                                   <div className="font-medium">{prescription.patientName}</div>
                                   {prescription.patientAge && (
                                     <div className="text-xs text-gray-500">({prescription.patientAge})</div>
                                   )}
                                 </div>
                               </div>
                             </DropdownMenuItem>
                           ))}
                         {/* Unsaved New Patients */}
                         {Object.keys(localPrescriptionData)
                           .filter(key => key.startsWith('temp-new-'))
                           .map((tempKey) => {
                             const tempData = localPrescriptionData[tempKey];
                             const patientName = tempData.newPatientData?.name || 'New Patient';
                             return (
                               <DropdownMenuItem
                                 key={tempKey}
                                 onClick={() => handlePreviewPrescription(tempKey)}
                                 className="cursor-pointer"
                               >
                                 <div className="flex items-center space-x-2 w-full">
                                   <User className="h-4 w-4 text-yellow-600" />
                                   <div className="flex-1 min-w-0">
                                     <div className="font-medium">{patientName}</div>
                                   </div>
                                   <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                                     Unsaved
                                   </Badge>
                                 </div>
                               </DropdownMenuItem>
                             );
                           })}
                         {/* Current new patient being added */}
                         {isAddingNewPatient && newPatientData.name.trim() && (
                           <DropdownMenuItem
                             onClick={() => handlePreviewPrescription('temp-current')}
                             className="cursor-pointer"
                           >
                             <div className="flex items-center space-x-2 w-full">
                               <User className="h-4 w-4 text-green-600" />
                               <div className="flex-1 min-w-0">
                                 <div className="font-medium">{newPatientData.name}</div>
                               </div>
                               <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                 Current
                               </Badge>
                             </div>
                           </DropdownMenuItem>
                         )}
                       </DropdownMenuContent>
                     </DropdownMenu>
                   );
                 } else {
                   // Single patient - direct preview button
                   return (
                     <Button
                       onClick={() => {
                         handlePreviewPrescription('appointment-original');
                       }}
                       disabled={!hasOriginalData}
                       size="sm"
                       className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 transition-all duration-200 h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm flex-shrink-0"
                       title="Preview prescription"
                     >
                       <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                       <span className="hidden sm:inline">Preview</span>
                       <span className="sm:hidden">View</span>
                     </Button>
                   );
                 }
               })()}
               <Button
                 onClick={handleSave} 
                 disabled={saving || uploadingImages}
                 size="sm"
                 className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 transition-all duration-200 h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm flex-shrink-0"
               >
                 {saving || uploadingImages ? (
                   <>
                     <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2 animate-spin" />
                     <span className="hidden sm:inline">{uploadingImages ? 'Uploading...' : 'Saving...'}</span>
                     <span className="sm:hidden">{uploadingImages ? 'Upload...' : 'Save...'}</span>
                   </>
                 ) : (
                   <>
                     <Save className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                     {existingPrescription ? 'Update' : 'Save'}
                   </>
                 )}
               </Button>
             </div>
          </div>
        </div>


         {/* Scrollable Content */}
         <ScrollArea ref={scrollAreaRef} className="max-h-[calc(98vh-120px)] p-6 [&_[data-radix-scroll-area-thumb]]:!bg-black [&_[data-radix-scroll-area-thumb]]:!bg-[#000000]">
           <div className="space-y-8">
       
          {/* All Patients Prescriptions - Preview/Print Section */}
          {(allPrescriptions.length > 0 || (currentPrescriptionId === 'appointment-original' && medicines.filter(m => m.medicineName.trim()).length > 0)) && (
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <div className="p-2 bg-blue-200 rounded-lg">
                    <Users className="h-5 w-5 text-blue-700" />
                  </div>
                  <span className="text-gray-800 font-semibold">All Patients - Preview & Print</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Original Patient */}
                  {(() => {
                    const originalPrescription = allPrescriptions.find(p => p.patientId === appointment.patientId);
                    const hasCurrentData = medicines.filter(m => m.medicineName.trim()).length > 0 || originalPrescription;
                    if (!hasCurrentData) return null;
                    
                    return (
                      <div key="appointment-original" className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <User className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{appointment.patientName}</span>
                              {patientData?.dateOfBirth && (
                                <span className="text-xs text-gray-500">({formatPatientAge(patientData)})</span>
                              )}
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                Original
                              </Badge>
                            </div>
                            {originalPrescription && (
                              <span className="text-xs text-gray-500">Saved prescription available</span>
                            )}
                            {!originalPrescription && medicines.filter(m => m.medicineName.trim()).length > 0 && (
                              <span className="text-xs text-amber-600">Unsaved changes</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            onClick={() => handlePreviewPrescription('appointment-original')}
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            title="Preview prescription"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Preview
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs"
                                disabled={printing !== null}
                              >
                                {printing !== null ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                Print
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePrintPrescription('full', 'appointment-original')}>
                                <Printer className="h-4 w-4 mr-2" />
                                Full Prescription
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintPrescription('inventory', 'appointment-original')}>
                                <Printer className="h-4 w-4 mr-2" />
                                Inventory Only
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintPrescription('written', 'appointment-original')}>
                                <Printer className="h-4 w-4 mr-2" />
                                Written Only
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Additional Patients */}
                  {allPrescriptions
                    .filter(p => p.patientId !== appointment.patientId)
                    .map((prescription) => (
                      <div key={prescription.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <User className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{prescription.patientName}</span>
                              {prescription.patientAge && (
                                <span className="text-xs text-gray-500">({prescription.patientAge})</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">Saved prescription</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            onClick={() => handlePreviewPrescription(prescription.id!)}
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            title="Preview prescription"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Preview
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs"
                                disabled={printing !== null}
                              >
                                {printing !== null ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                Print
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePrintPrescription('full', prescription.id!)}>
                                <Printer className="h-4 w-4 mr-2" />
                                Full Prescription
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintPrescription('inventory', prescription.id!)}>
                                <Printer className="h-4 w-4 mr-2" />
                                Inventory Only
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintPrescription('written', prescription.id!)}>
                                <Printer className="h-4 w-4 mr-2" />
                                Written Only
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
       
          {/* New Patient Form - Show when adding new patient */}
          {isAddingNewPatient && (
            <>
              {/* Patient Search Section */}
              <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                <CardHeader className="pb-4 bg-gradient-to-r from-green-100 to-emerald-100 border-b border-green-200">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div className="p-2 bg-green-200 rounded-lg">
                      <Search className="h-5 w-5 text-green-700" />
                    </div>
                    <span className="text-gray-800 font-semibold">Search Existing Patient</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {selectedExistingPatient ? (
                    <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className="bg-green-600 text-white">Selected Patient</Badge>
                            <span className="font-semibold text-gray-800">{selectedExistingPatient.name}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                            {selectedExistingPatient.dateOfBirth && (
                              <div>
                                <span className="font-medium">Age: </span>
                                {formatPatientAge({ dateOfBirth: selectedExistingPatient.dateOfBirth } as Patient)}
                              </div>
                            )}
                            {selectedExistingPatient.gender && (
                              <div>
                                <span className="font-medium">Gender: </span>
                                {selectedExistingPatient.gender}
                              </div>
                            )}
                            {selectedExistingPatient.contactNumber && (
                              <div>
                                <span className="font-medium">Contact: </span>
                                {selectedExistingPatient.contactNumber}
                              </div>
                            )}
                            {selectedExistingPatient.drugAllergies && (
                              <div className="md:col-span-2">
                                <span className="font-medium">Allergies: </span>
                                {selectedExistingPatient.drugAllergies}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearSelectedPatient}
                          className="ml-4 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Search by name or phone number (min 2 characters, auto-search at 10 digits)"
                            value={patientSearchQuery}
                            onChange={(e) => handleSearchInputChange(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handlePatientSearch();
                              }
                            }}
                            className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                        <Button
                          onClick={handlePatientSearch}
                          disabled={searchingPatients || !patientSearchQuery.trim() || patientSearchQuery.trim().length < 2}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {searchingPatients ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      {/* Search Results */}
                      {showSearchResults && searchResults.length > 0 && (
                        <div className="border border-gray-200 rounded-lg bg-white max-h-64 overflow-y-auto">
                          <div className="p-2 bg-gray-50 border-b border-gray-200 sticky top-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-700">
                                Found {searchResults.length} patient{searchResults.length > 1 ? 's' : ''}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowSearchResults(false)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="divide-y divide-gray-200">
                            {searchResults.map((patient) => (
                              <div
                                key={patient.id}
                                onClick={() => handleSelectExistingPatient(patient)}
                                className="p-3 hover:bg-green-50 cursor-pointer transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-800 mb-1">{patient.name}</div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                      {patient.dateOfBirth && (
                                        <div className="flex items-center space-x-1">
                                          <Calendar className="h-3 w-3" />
                                          <span>Age: {formatPatientAge({ dateOfBirth: patient.dateOfBirth } as Patient)}</span>
                                        </div>
                                      )}
                                      {patient.gender && (
                                        <div className="flex items-center space-x-1">
                                          <User className="h-3 w-3" />
                                          <span>{patient.gender}</span>
                                        </div>
                                      )}
                                      {patient.contactNumber && (
                                        <div className="flex items-center space-x-1">
                                          <Phone className="h-3 w-3" />
                                          <span>{patient.contactNumber}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    Select
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-600 italic text-center pt-2 border-t border-gray-200">
                        Can't find the patient? Fill in the form below to add a new patient.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* New Patient Form */}
              <Card ref={newPatientFormRef} className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
                <CardHeader className="pb-4 bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div className="p-2 bg-blue-200 rounded-lg">
                      <User className="h-5 w-5 text-blue-700" />
                    </div>
                    <span className="text-gray-800 font-semibold">
                      {selectedExistingPatient ? 'Edit Patient Information' : 'New Patient Information'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="new-patient-name" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Patient Name *
                    </Label>
                    <Input
                      id="new-patient-name"
                      value={newPatientData.name}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter patient name"
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Date of Birth *
                    </Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={newPatientData.dobDay || ''}
                        onValueChange={(value) => {
                          setNewPatientData(prev => ({ ...prev, dobDay: value }));
                        }}
                      >
                        <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: getDaysInMonth(newPatientData.dobMonth, newPatientData.dobYear) }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString().padStart(2, '0')}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={newPatientData.dobMonth || ''}
                        onValueChange={(value) => {
                          setNewPatientData(prev => {
                            const newMonth = value;
                            const currentDay = prev.dobDay ? parseInt(prev.dobDay) : 0;
                            const currentYear = prev.dobYear || new Date().getFullYear().toString();
                            const maxDays = getDaysInMonth(newMonth, currentYear);
                            
                            // Only clear day if current day is invalid for the new month
                            const newDay = (currentDay > 0 && currentDay <= maxDays) ? prev.dobDay : '';
                            
                            return { ...prev, dobMonth: newMonth, dobDay: newDay };
                          });
                        }}
                      >
                        <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={newPatientData.dobYear || ''}
                        onValueChange={(value) => {
                          setNewPatientData(prev => {
                            const newYear = value;
                            const currentDay = prev.dobDay ? parseInt(prev.dobDay) : 0;
                            const currentMonth = prev.dobMonth || '01';
                            const maxDays = getDaysInMonth(currentMonth, newYear);
                            
                            // Only clear day if current day is invalid for the new year (e.g., Feb 29 in non-leap year)
                            const newDay = (currentDay > 0 && currentDay <= maxDays) ? prev.dobDay : '';
                            
                            return { ...prev, dobYear: newYear, dobDay: newDay };
                          });
                        }}
                      >
                        <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {generateYears().map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="new-patient-gender" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Gender *
                    </Label>
                    <Select
                      value={newPatientData.gender || "not_specified"}
                      onValueChange={(value) => setNewPatientData(prev => ({
                        ...prev,
                        gender: value === "not_specified" ? "" : value
                      }))}
                    >
                      <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_specified">Not Specified</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="new-patient-weight" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Body Weight (kg)
                    </Label>
                    <Input
                      id="new-patient-weight"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newPatientData.bodyWeight}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, bodyWeight: e.target.value }))}
                      placeholder="Enter weight"
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-patient-contact" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Contact Number *
                    </Label>
                    <Input
                      id="new-patient-contact"
                      value={newPatientData.contact}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, contact: e.target.value }))}
                      placeholder="Enter contact number"
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label htmlFor="new-patient-allergies" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Drug Allergies
                    </Label>
                    <Textarea
                      id="new-patient-allergies"
                      value={newPatientData.drugAllergies}
                      onChange={(e) => setNewPatientData(prev => ({ ...prev, drugAllergies: e.target.value }))}
                      placeholder="Enter known drug allergies or type 'None' if no allergies"
                      rows={2}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-blue-200">
                  <Button
                    variant="outline"
                    onClick={handleCancelNewPatient}
                    disabled={saving}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !newPatientData.name.trim() || !newPatientData.dobDay || !newPatientData.dobMonth || !newPatientData.dobYear || !newPatientData.gender.trim() || newPatientData.gender === 'not_specified' || !newPatientData.contact.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Patient & Prescription
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            </>
          )}

          {/* Compact Patient Information Card */}
          {!isAddingNewPatient && (
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-2 px-4 md:px-6">
              <CardTitle className="text-sm md:text-base flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2 flex-wrap">
                  <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium text-xs md:text-sm">{new Date(appointment.date).toLocaleDateString()}</span>
                  <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium text-xs md:text-sm">Patient Details</span>
                </div>
                {!isEditingPatientInfo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingPatientInfo(true)}
                    className="text-xs h-6 md:h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 self-start sm:self-auto"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3 px-4 md:px-6">
              {loadingPatient ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {/* Patient Info - Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-3 text-xs md:text-sm">
                    <div className="flex items-center space-x-1 min-w-0">
                      <User className="h-3 w-3 text-blue-500 flex-shrink-0" />
                      <span className="text-gray-600 whitespace-nowrap">Name:</span>
                      {isEditingPatientInfo ? (
                        <Input
                          value={editedPatientInfo.name}
                          onChange={(e) => setEditedPatientInfo(prev => ({
                            ...prev,
                            name: e.target.value
                          }))}
                          placeholder="Patient name"
                          className="w-24 md:w-32 h-6 text-xs border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="font-medium text-gray-900 truncate">{patientData?.name || appointment.patientName}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 min-w-0">
                      <Calendar className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                      <span className="text-gray-600 whitespace-nowrap">DOB:</span>
                      {isEditingPatientInfo ? (
                        <div className="flex items-center space-x-1">
                          <Select
                            value={editedPatientInfo.dobDay || ''}
                            onValueChange={(value) => {
                              setEditedPatientInfo(prev => ({ ...prev, dobDay: value }));
                            }}
                          >
                            <SelectTrigger className="w-12 h-6 text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 px-1">
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: getDaysInMonth(editedPatientInfo.dobMonth, editedPatientInfo.dobYear) }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={day.toString().padStart(2, '0')}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={editedPatientInfo.dobMonth || ''}
                            onValueChange={(value) => {
                              setEditedPatientInfo(prev => {
                                const newMonth = value;
                                const currentDay = prev.dobDay ? parseInt(prev.dobDay) : 0;
                                const currentYear = prev.dobYear || new Date().getFullYear().toString();
                                const maxDays = getDaysInMonth(newMonth, currentYear);
                                
                                // Only clear day if current day is invalid for the new month
                                const newDay = (currentDay > 0 && currentDay <= maxDays) ? prev.dobDay : '';
                                
                                return { ...prev, dobMonth: newMonth, dobDay: newDay };
                              });
                            }}
                          >
                            <SelectTrigger className="w-20 h-6 text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 px-1">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month.value} value={month.value}>
                                  {month.label.slice(0, 3)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={editedPatientInfo.dobYear || ''}
                            onValueChange={(value) => {
                              setEditedPatientInfo(prev => {
                                const newYear = value;
                                const currentDay = prev.dobDay ? parseInt(prev.dobDay) : 0;
                                const currentMonth = prev.dobMonth || '01';
                                const maxDays = getDaysInMonth(currentMonth, newYear);
                                
                                // Only clear day if current day is invalid for the new year (e.g., Feb 29 in non-leap year)
                                const newDay = (currentDay > 0 && currentDay <= maxDays) ? prev.dobDay : '';
                                
                                return { ...prev, dobYear: newYear, dobDay: newDay };
                              });
                            }}
                          >
                            <SelectTrigger className="w-16 h-6 text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 px-1">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {generateYears().map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900">
                          {patientData?.dateOfBirth 
                            ? new Date(patientData.dateOfBirth).toLocaleDateString() 
                            : 'Not specified'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 min-w-0">
                      <Activity className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                      <span className="text-gray-600 whitespace-nowrap">Age:</span>
                      <span className="font-medium text-gray-900">{formatPatientAge(patientData || {})}</span>
                    </div>
                    <div className="flex items-center space-x-1 min-w-0">
                      <User className="h-3 w-3 text-purple-500 flex-shrink-0" />
                      <span className="text-gray-600 whitespace-nowrap">Gender:</span>
                      {isEditingPatientInfo ? (
                        <Select 
                          value={editedPatientInfo.gender || "not_specified"} 
                          onValueChange={(value) => setEditedPatientInfo(prev => ({
                            ...prev,
                            gender: value === "not_specified" ? "" : value
                          }))}
                        >
                          <SelectTrigger className="w-16 md:w-20 h-6 text-xs border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_specified">-</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="font-medium text-gray-900 truncate">
                          {patientData?.gender ? patientData.gender.charAt(0).toUpperCase() + patientData.gender.slice(1) : 'Not specified'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 min-w-0">
                      <Weight className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 whitespace-nowrap">Weight:</span>
                      {isEditingPatientInfo ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={editedPatientInfo.bodyWeight}
                          onChange={(e) => setEditedPatientInfo(prev => ({
                            ...prev,
                            bodyWeight: e.target.value
                          }))}
                          placeholder="kg"
                          className="w-14 md:w-16 h-6 text-xs border-gray-200 focus:border-green-500 focus:ring-green-500"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">
                          {patientData?.bodyWeight ? `${patientData.bodyWeight} kg` : 'Not specified'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 min-w-0">
                      <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                      <span className="text-gray-600 whitespace-nowrap">Allergies:</span>
                      {isEditingPatientInfo ? (
                        <Input
                          value={editedPatientInfo.drugAllergies}
                          onChange={(e) => setEditedPatientInfo(prev => ({
                            ...prev,
                            drugAllergies: e.target.value
                          }))}
                          placeholder="None"
                          className="w-16 md:w-20 h-6 text-xs border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      ) : (
                        <span className={`font-medium text-xs px-1 py-0.5 rounded-full whitespace-nowrap ${
                          patientData?.drugAllergies && patientData.drugAllergies.trim() !== '' 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                          {patientData?.drugAllergies && patientData.drugAllergies.trim() !== '' 
                            ? 'Known' 
                            : 'None'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Doctor Info - Compact Row */}
                  <div className="flex items-center space-x-1 text-xs md:text-sm">
                    <Stethoscope className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600 whitespace-nowrap">Doctor:</span>
                    <span className="font-medium text-gray-900 truncate">{appointment.doctorName}</span>
                  </div>

                  {/* Drug Allergies Detail - Only show when editing or when there are allergies */}
                  {isEditingPatientInfo && (
                    <div className="pt-2 md:pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-600">Drug Allergies Details:</span>
                      </div>
                      <Textarea
                        value={editedPatientInfo.drugAllergies}
                        onChange={(e) => setEditedPatientInfo(prev => ({
                          ...prev,
                          drugAllergies: e.target.value
                        }))}
                        placeholder="Enter known drug allergies or type 'None' if no allergies"
                        rows={2}
                        className="text-xs border-gray-200 focus:border-orange-500 focus:ring-orange-500 w-full"
                      />
                    </div>
                  )}

                  {patientData?.drugAllergies && patientData.drugAllergies.trim() !== '' && !isEditingPatientInfo && (
                    <div className="pt-2 md:pt-3 border-t border-gray-100">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="text-xs min-w-0 flex-1">
                          <span className="font-medium text-red-800">Known Allergies:</span>
                          <p className="text-red-700 bg-red-50 p-2 rounded border border-red-200 mt-1 break-words">{patientData.drugAllergies}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Only when editing */}
                  {isEditingPatientInfo && (
                    <div className="flex flex-wrap gap-2 pt-2 md:pt-3">
                      <Button
                        size="sm"
                        onClick={handleSavePatientInfo}
                        className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="h-7 px-3 text-xs border-gray-300 hover:bg-gray-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Debug Information
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <strong>Debug Info:</strong> {debugInfo}
                  {allInventory.length > 0 && (
                    <div className="mt-2">
                      <p>Total inventory items: {allInventory.length}</p>
                      <p>Available for search: {drugOptions.length}</p>
                      <p>Sample items: {allInventory.slice(0, 3).map(item => `${item.name} (${item.type})`).join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card> */}


          {/* NEW MEDICAL SECTIONS */}
            {/* Presenting Complaint Section */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Stethoscope className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-gray-800 font-semibold">P/C (Presenting Complaint)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="presenting-complaint" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Main reason for visit *
                    </Label>
                    <Input
                      id="presenting-complaint"
                      value={presentingComplaint}
                      onChange={(e) => setPresentingComplaint(e.target.value)}
                      placeholder="e.g., Fever for 3 days, Headache, Cough..."
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Enter the main symptoms or complaints that brought the patient to see you
                    </p>
                  </div>

                  {/* Quick Tags Section */}
                  <TagManager
                    tags={presentingComplaintTags}
                    onTagClick={handleTagClick}
                    category="presentingComplaint"
                    onTagsUpdate={setPresentingComplaintTags}
                    disabled={loading}
                    colorScheme="blue"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medical History Section */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/30">
              <CardHeader className="pb-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <History className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-gray-800 font-semibold">Medical History</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="past-medical-history" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Past Medical History
                    </Label>
                    <Input
                      id="past-medical-history"
                      value={pastMedicalHistory}
                      onChange={(e) => setPastMedicalHistory(e.target.value)}
                      placeholder="e.g., HT, ANT MI, SVD, DES TO PLAD 14.11.2020@ NHSL..."
                      className="border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                    
                    {/* Past Medical History Tags */}
                    <TagManager
                      tags={pastMedicalHistoryTags}
                      onTagClick={handleMedicalHistoryTagClick}
                      category="pastMedicalHistory"
                      onTagsUpdate={setPastMedicalHistoryTags}
                      disabled={loading}
                      colorScheme="amber"
                    />
                    
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Previous medical conditions and treatments
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="surgical-history" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Surgical History
                    </Label>
                    <Input
                      id="surgical-history"
                      value={surgicalHistory}
                      onChange={(e) => setSurgicalHistory(e.target.value)}
                      placeholder="e.g., DES TO PLAD 14.11.2020@ NHSL, Appendectomy 2019..."
                      className="border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="current-medications" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Current Medications
                    </Label>
                    <Input
                      id="current-medications"
                      value={currentMedications}
                      onChange={(e) => setCurrentMedications(e.target.value)}
                      placeholder="e.g., ON THYRXN, Metformin, Aspirin..."
                      className="border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="allergies" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Allergies
                    </Label>
                    <Input
                      id="allergies"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g., Penicillin allergy, Shellfish allergy..."
                      className="border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="family-history" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Family History
                    </Label>
                    <Input
                      id="family-history"
                      value={familyHistory}
                      onChange={(e) => setFamilyHistory(e.target.value)}
                      placeholder="e.g., Father: DM, Mother: HT, Sibling: Heart disease..."
                      className="border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* On Examination Section */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30">
              <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Heart className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-gray-800 font-semibold">O/E (On Examination)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="temperature" className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <Thermometer className="h-4 w-4 mr-2 text-red-500" />
                      Temperature
                    </Label>
                    <Input
                      id="temperature"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="e.g., 98.6°F, 37°C"
                      className="text-sm border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="blood-pressure" className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <Activity className="h-4 w-4 mr-2 text-blue-500" />
                      Blood Pressure
                    </Label>
                    <Input
                      id="blood-pressure"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      placeholder="e.g., 115/75 mmHg"
                      className="text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="heart-rate" className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <Heart className="h-4 w-4 mr-2 text-pink-500" />
                      Heart Rate
                    </Label>
                    <Input
                      id="heart-rate"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      placeholder="e.g., 75 bpm"
                      className="text-sm border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="respiratory-rate" className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <Activity className="h-4 w-4 mr-2 text-green-500" />
                      Respiratory Rate
                    </Label>
                    <Input
                      id="respiratory-rate"
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(e.target.value)}
                      placeholder="e.g., 16/min"
                      className="text-sm border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="oxygen-saturation" className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <Activity className="h-4 w-4 mr-2 text-cyan-500" />
                      Oxygen Saturation
                    </Label>
                    <Input
                      id="oxygen-saturation"
                      value={oxygenSaturation}
                      onChange={(e) => setOxygenSaturation(e.target.value)}
                      placeholder="e.g., 98%"
                      className="text-sm border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label htmlFor="lungs" className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <Activity className="h-4 w-4 mr-2 text-teal-500" />
                      Lungs
                    </Label>
                    <Input
                      id="lungs"
                      value={lungs}
                      onChange={(e) => setLungs(e.target.value)}
                      placeholder="e.g., Clear, Rhonchi, Creps..."
                      className="text-sm border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                    
                    {/* Lungs Tags */}
                    <TagManager
                      tags={lungsTags}
                      onTagClick={handleLungsTagClick}
                      category="lungs"
                      onTagsUpdate={setLungsTags}
                      disabled={loading}
                      colorScheme="teal"
                    />
                  </div>
                  
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label htmlFor="abdomen" className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <Activity className="h-4 w-4 mr-2 text-orange-500" />
                      Abdomen
                    </Label>
                    <Input
                      id="abdomen"
                      value={abdomen}
                      onChange={(e) => setAbdomen(e.target.value)}
                      placeholder="e.g., Soft, tender, distended..."
                      className="text-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label htmlFor="other-examination" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Other Findings
                    </Label>
                    <Input
                      id="other-examination"
                      value={otherExamination}
                      onChange={(e) => setOtherExamination(e.target.value)}
                      placeholder="e.g., Pulse rate, oxygen saturation, physical signs..."
                      className="text-sm border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lab Results Section */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/30">
              <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Activity className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-gray-800 font-semibold">Lab Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* FBC Section */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1">FBC (Full Blood Count)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="wbc" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">WBC:</Label>
                        <Input
                          id="wbc"
                          value={wbc}
                          onChange={(e) => setWbc(e.target.value)}
                          placeholder="e.g., 12.5"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="ne" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">NE:</Label>
                        <Input
                          id="ne"
                          value={ne}
                          onChange={(e) => setNe(e.target.value)}
                          placeholder="e.g., 65%"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="ly" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">LY:</Label>
                        <Input
                          id="ly"
                          value={ly}
                          onChange={(e) => setLy(e.target.value)}
                          placeholder="e.g., 30%"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="hb" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">HB:</Label>
                        <Input
                          id="hb"
                          value={hb}
                          onChange={(e) => setHb(e.target.value)}
                          placeholder="e.g., 14.2"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="plt" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">PLT:</Label>
                        <Input
                          id="plt"
                          value={plt}
                          onChange={(e) => setPlt(e.target.value)}
                          placeholder="e.g., 250"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CRP and ESR */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="crp" className="text-xs font-medium text-gray-600 w-12 flex-shrink-0">CRP:</Label>
                        <Input
                          id="crp"
                          value={crp}
                          onChange={(e) => setCrp(e.target.value)}
                          placeholder="e.g., 5.2 mg/L"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="esr" className="text-xs font-medium text-gray-600 w-12 flex-shrink-0">ESR:</Label>
                        <Input
                          id="esr"
                          value={esr}
                          onChange={(e) => setEsr(e.target.value)}
                          placeholder="e.g., 15 mm/hr"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* UFR Section */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1">UFR (Urine Full Report)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="pus" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">PUS:</Label>
                        <Input
                          id="pus"
                          value={pus}
                          onChange={(e) => setPus(e.target.value)}
                          placeholder="e.g., 0-2"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="red" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">RED:</Label>
                        <Input
                          id="red"
                          value={red}
                          onChange={(e) => setRed(e.target.value)}
                          placeholder="e.g., 0-1"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="sug" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">SUG:</Label>
                        <Input
                          id="sug"
                          value={sug}
                          onChange={(e) => setSug(e.target.value)}
                          placeholder="e.g., Negative"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="aib" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">AIB:</Label>
                        <Input
                          id="aib"
                          value={aib}
                          onChange={(e) => setAib(e.target.value)}
                          placeholder="e.g., Negative"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="org" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">ORG:</Label>
                        <Input
                          id="org"
                          value={org}
                          onChange={(e) => setOrg(e.target.value)}
                          placeholder="e.g., Negative"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lipid Profile Section */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1">Lipid Profile</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="tc" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">TC:</Label>
                        <Input
                          id="tc"
                          value={tc}
                          onChange={(e) => setTc(e.target.value)}
                          placeholder="e.g., 180"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="tg" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">TG:</Label>
                        <Input
                          id="tg"
                          value={tg}
                          onChange={(e) => setTg(e.target.value)}
                          placeholder="e.g., 120"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="ldl" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">LDL:</Label>
                        <Input
                          id="ldl"
                          value={ldl}
                          onChange={(e) => setLdl(e.target.value)}
                          placeholder="e.g., 45"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="hdl" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">HDL:</Label>
                        <Input
                          id="hdl"
                          value={hdl}
                          onChange={(e) => setHdl(e.target.value)}
                          placeholder="e.g., 40"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="vldl" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">VLDL:</Label>
                        <Input
                          id="vldl"
                          value={vldl}
                          onChange={(e) => setVldl(e.target.value)}
                          placeholder="e.g., 25"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="tcHdl" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">TC/HDL:</Label>
                        <Input
                          id="tcHdl"
                          value={tcHdl}
                          onChange={(e) => setTcHdl(e.target.value)}
                          placeholder="e.g., 4.5"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Individual Tests */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1">Individual Tests</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="fbs" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">FBS:</Label>
                        <Input
                          id="fbs"
                          value={fbs}
                          onChange={(e) => setFbs(e.target.value)}
                          placeholder="e.g., 90 mg/dL"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="sCr" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">S.Cr:</Label>
                        <Input
                          id="sCr"
                          value={sCr}
                          onChange={(e) => setSCr(e.target.value)}
                          placeholder="e.g., 1.0 mg/dL"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="ast" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">AST:</Label>
                        <Input
                          id="ast"
                          value={ast}
                          onChange={(e) => setAst(e.target.value)}
                          placeholder="e.g., 25 U/L"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="alt" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">ALT:</Label>
                        <Input
                          id="alt"
                          value={alt}
                          onChange={(e) => setAlt(e.target.value)}
                          placeholder="e.g., 30 U/L"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="tsh" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">TSH:</Label>
                        <Input
                          id="tsh"
                          value={tsh}
                          onChange={(e) => setTsh(e.target.value)}
                          placeholder="e.g., 2.5 mIU/L"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="hba1c" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">HbA1c:</Label>
                        <Input
                          id="hba1c"
                          value={hba1c}
                          onChange={(e) => setHba1c(e.target.value)}
                          placeholder="e.g., 6.5%"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label htmlFor="rf" className="text-xs font-medium text-gray-600 w-8 flex-shrink-0">RF:</Label>
                        <Input
                          id="rf"
                          value={rf}
                          onChange={(e) => setRf(e.target.value)}
                          placeholder="e.g., Negative"
                          className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Lab Results Section */}
                <div className="space-y-3 mt-6 pt-6 border-t border-indigo-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-800">Custom Lab Results</h4>
                    <Button
                      type="button"
                      onClick={addCustomLabResult}
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Custom Result
                    </Button>
                  </div>
                  
                  {customLabResults.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-xs bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p>No custom lab results added yet</p>
                      <p className="mt-1">Click "Add Custom Result" to add custom name-value pairs</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customLabResults.map((result, index) => (
                        <div key={result.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                          <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`custom-lab-name-${result.id}`} className="text-xs font-medium text-gray-600 w-16 flex-shrink-0">
                                Name:
                              </Label>
                              <Input
                                id={`custom-lab-name-${result.id}`}
                                value={result.name}
                                onChange={(e) => updateCustomLabResult(result.id, 'name', e.target.value)}
                                placeholder="e.g., Vitamin D, Ferritin..."
                                className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`custom-lab-value-${result.id}`} className="text-xs font-medium text-gray-600 w-16 flex-shrink-0">
                                Value:
                              </Label>
                              <Input
                                id={`custom-lab-value-${result.id}`}
                                value={result.value}
                                onChange={(e) => updateCustomLabResult(result.id, 'value', e.target.value)}
                                placeholder="e.g., 25 ng/mL, 150 ng/mL..."
                                className="text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomLabResult(result.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                            title="Remove custom lab result"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-4 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Enter laboratory test results and values. You can add custom lab results with any name and value.
                </p>
              </CardContent>
            </Card>

            {/* Investigations Section */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
              <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileSearch className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-gray-800 font-semibold">Ix (Investigations)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Inline Investigation Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="ecg" className="text-sm font-semibold text-gray-700 w-12 flex-shrink-0">
                        ECG:
                      </Label>
                      <Input
                        id="ecg"
                        value={ecg}
                        onChange={(e) => setEcg(e.target.value)}
                        placeholder="Normal sinus rhythm, ST elevation..."
                        className="text-sm border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="echo" className="text-sm font-semibold text-gray-700 w-12 flex-shrink-0">
                        Echo:
                      </Label>
                      <Input
                        id="echo"
                        value={echo}
                        onChange={(e) => setEcho(e.target.value)}
                        placeholder="DILATED LV, MILD MR, EF=50%..."
                        className="text-sm border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="xray" className="text-sm font-semibold text-gray-700 w-12 flex-shrink-0">
                        X-Ray:
                      </Label>
                      <Input
                        id="xray"
                        value={xray}
                        onChange={(e) => setXray(e.target.value)}
                        placeholder="Chest X-ray: Clear, Bone X-ray: Normal..."
                        className="text-sm border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="ct" className="text-sm font-semibold text-gray-700 w-12 flex-shrink-0">
                        CT:
                      </Label>
                      <Input
                        id="ct"
                        value={ct}
                        onChange={(e) => setCt(e.target.value)}
                        placeholder="CT Head: Normal, CT Chest: No masses..."
                        className="text-sm border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="mri" className="text-sm font-semibold text-gray-700 w-12 flex-shrink-0">
                        MRI:
                      </Label>
                      <Input
                        id="mri"
                        value={mri}
                        onChange={(e) => setMri(e.target.value)}
                        placeholder="MRI Brain: Normal, MRI Spine: No disc herniation..."
                        className="text-sm border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="other-investigations" className="text-sm font-semibold text-gray-700 w-12 flex-shrink-0">
                        Other:
                      </Label>
                      <Input
                        id="other-investigations"
                        value={otherInvestigations}
                        onChange={(e) => setOtherInvestigations(e.target.value)}
                        placeholder="Blood test, Urine analysis, Ultrasound..."
                        className="text-sm border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Document any tests or investigations ordered or reviewed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Diagnosis Section */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-red-50/30">
              <CardHeader className="pb-4 bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ClipboardList className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="text-gray-800 font-semibold">Diagnosis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="diagnosis" className="text-sm font-semibold text-gray-700 w-20 flex-shrink-0">
                      Diagnosis:
                    </Label>
                    <DiagnosisAutocomplete
                      value={diagnosis}
                      onChange={setDiagnosis}
                      placeholder="Type or select from saved diagnoses..."
                      disabled={loading}
                      className="border-gray-200 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Enter your clinical conclusion - frequently used diagnoses will be saved automatically
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Medical Tests Section */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
              <CardContent className="p-6">
                <MedicalTestSection
                  medicalTests={medicalTests}
                  onMedicalTestsChange={setMedicalTests}
                  patientId={
                    isAddingNewPatient 
                      ? (newPatientData.name.trim() ? `temp-${newPatientData.name.trim().replace(/\s+/g, '-').toLowerCase()}` : 'temp-new-patient')
                      : (existingPrescription?.patientId || appointment.patientId)
                  }
                  doctorId={appointment.doctorId}
                  disabled={loading}
                />
              </CardContent>
            </Card>

            {/* Next Visit Date Section */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30">
              <CardContent className="p-6">
                <NextVisitDateSection
                  nextVisitDate={nextVisitDate}
                  onNextVisitDateChange={setNextVisitDate}
                  disabled={loading}
                />
              </CardContent>
            </Card>

         

           <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30">
            <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Pill className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-gray-800 font-semibold">Medicines</span>
              </CardTitle>
            </CardHeader>
             <CardContent className="pt-6" style={{ overflow: 'visible' }}>
               <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'inventory' | 'written')}>
                 <div className="mb-6">
                   <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-sm h-auto">
                     <TabsTrigger 
                       value="inventory" 
                       className={`flex items-center justify-center gap-3 px-6 py-4 text-sm font-semibold transition-all duration-200 rounded-lg ${
                         activeTab === 'inventory' 
                           ? 'bg-white text-blue-700 shadow-md' 
                           : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
                       }`}
                     >
                       <div className="flex items-center gap-2">
                         <div className={`p-1.5 rounded-md ${
                           activeTab === 'inventory' ? 'bg-blue-100' : 'bg-blue-50'
                         }`}>
                           <Package className="h-4 w-4 text-blue-600" />
                         </div>
                         <span>Inventory Medicines</span>
                       </div>
                       <Badge 
                         variant="secondary" 
                         className={`ml-1 text-xs px-2 py-0.5 ${
                           activeTab === 'inventory' 
                             ? 'bg-blue-200 text-blue-800' 
                             : 'bg-blue-100 text-blue-700'
                         }`}
                       >
                         {medicines.filter(m => m.source === 'inventory').length}
                       </Badge>
                     </TabsTrigger>
                     <TabsTrigger 
                       value="written" 
                       className={`flex items-center justify-center gap-3 px-6 py-4 text-sm font-semibold transition-all duration-200 rounded-lg ${
                         activeTab === 'written' 
                           ? 'bg-white text-green-700 shadow-md' 
                           : 'text-gray-600 hover:text-green-600 hover:bg-green-50/50'
                       }`}
                     >
                       <div className="flex items-center gap-2">
                         <div className={`p-1.5 rounded-md ${
                           activeTab === 'written' ? 'bg-green-100' : 'bg-green-50'
                         }`}>
                           <Edit3 className="h-4 w-4 text-green-600" />
                         </div>
                         <span>Written Medicines</span>
                       </div>
                       <Badge 
                         variant="secondary" 
                         className={`ml-1 text-xs px-2 py-0.5 ${
                           activeTab === 'written' 
                             ? 'bg-green-200 text-green-800' 
                             : 'bg-green-100 text-green-700'
                         }`}
                       >
                         {medicines.filter(m => m.source === 'written').length}
                       </Badge>
                     </TabsTrigger>
                   </TabsList>
                   
                   {/* Tab Description */}
                   <div className="mt-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-lg border border-gray-100">
                     <div className="flex items-center gap-2 text-sm text-gray-600">
                       {activeTab === 'inventory' ? (
                         <>
                           <Package className="h-4 w-4 text-blue-500" />
                           <span>
                             <strong>Inventory Medicines:</strong> Select from your available inventory stock for quick prescription creation
                           </span>
                         </>
                       ) : (
                         <>
                           <Edit3 className="h-4 w-4 text-green-500" />
                           <span>
                             <strong>Written Medicines:</strong> Write custom prescriptions for medications not in your inventory
                           </span>
                         </>
                       )}
                     </div>
                   </div>
                 </div>

                <TabsContent value="inventory" className="space-y-4" style={{ overflow: 'visible' }}>
                  <div className="flex flex-wrap justify-end items-center gap-2 mb-4">
                      <div className="flex flex-wrap justify-center items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => addMedicine('inventory')}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 border-blue-300 hover:bg-blue-100 hover:border-blue-400 text-blue-700 shadow-sm transition-all duration-200"
                        >
                          <Plus className="h-4 w-4 text-blue-600" />
                          Add Medicine
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 border-green-200 hover:bg-green-50 hover:border-green-300 text-green-700 transition-all duration-200"
                          onClick={() => openTemplateModal('create')}
                        >
                          <Save className="h-4 w-4" />
                          Save Template
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow transition-all duration-200"
                          onClick={() => setTemplateManagerOpen(true)}
                        >
                          <FileText className="h-4 w-4" />
                          Templates
                        </Button>
                      </div>
                    <Button
                      type="button"
                      onClick={() => handleClearMedicines('inventory')}
                      variant="ghost"
                      size="sm"
                      disabled={medicines.filter(m => m.source === 'inventory').length === 0}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear Inventory List
                    </Button>
                   </div>

                   {medicines.filter(m => m.source === 'inventory').length === 0 ? (
                     <div className="text-center py-16 text-gray-500 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl border-2 border-dashed border-blue-200">
                       <div className="p-4 bg-white rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg border border-blue-100">
                         <Package className="h-10 w-10 text-blue-400" />
                       </div>
                       <p className="text-xl font-semibold text-gray-700 mb-2">No inventory medicines added yet</p>
                       <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">Add medicines from your inventory to create prescriptions quickly and efficiently</p>
                      <div className="flex flex-col items-center gap-3">
                        <Button
                          type="button"
                          onClick={() => addMedicine('inventory')}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Plus className="h-4 w-4" />
                          Add Medicine
                        </Button>
                        <div className="flex flex-wrap justify-center items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 border-green-200 hover:bg-green-50 hover:border-green-300 text-green-700 transition-all duration-200"
                            onClick={() => openTemplateModal('create')}
                          >
                            <Save className="h-4 w-4" />
                            Save Template
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow transition-all duration-200"
                            onClick={() => setTemplateManagerOpen(true)}
                          >
                            <FileText className="h-4 w-4" />
                            Templates
                          </Button>
                        </div>
                      </div>
                     </div>
                   ) : (
                    <div className="space-y-6" style={{ overflow: 'visible' }}>
                      {/* Inventory Medicines Card */}
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/30 to-indigo-50/30" style={{ overflow: 'visible' }}>
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Package className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                  Inventory Medicines
                                </CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                  {medicines.filter(m => m.source === 'inventory').length} medicine(s) added
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              onClick={() => addMedicine('inventory')}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Medicine
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0" style={{ overflow: 'visible' }}>
                          <div ref={inventoryTableRef} className="overflow-x-auto" style={{ overflowY: 'visible' }}>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12 text-center text-xs font-semibold py-2">#</TableHead>
                                  <TableHead className="min-w-[200px] text-xs font-semibold py-2">Medicine</TableHead>
                                  <TableHead className="w-32 text-xs font-semibold py-2">Dose</TableHead>
                                  <TableHead className="w-28 text-xs font-semibold py-2">Frequency</TableHead>
                                  <TableHead className="w-20 text-xs font-semibold py-2">Days</TableHead>
                                  <TableHead className="w-24 text-xs font-semibold py-2">Qty</TableHead>
                                  <TableHead className="min-w-[200px] text-xs font-semibold py-2">Instructions</TableHead>
                                  <TableHead className="w-16 text-center text-xs font-semibold py-2">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody style={{ overflow: 'visible' }}>
                                {medicines.filter(m => m.source === 'inventory').map((medicine, index) => (
                                  <TableRow key={medicine.id} id={`medicine-row-${medicine.id}`} className="hover:bg-blue-50/50">
                                    {/* Row Number */}
                                    <TableCell className="text-center py-1.5">
                                      <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold mx-auto">
                                        {index + 1}
                                      </div>
                                    </TableCell>

                                    {/* Medicine Search */}
                                    <TableCell className="py-1.5 relative" style={{ overflow: 'visible' }}>
                                      <div className="relative" data-dropdown-container>
                                        <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
                                        <Input
                                          id={`medicine-${medicine.id}`}
                                          value={medicine.medicineName || ''}
                                          onChange={(e) => handleInputChange(medicine.id, e.target.value)}
                                          onFocus={() => handleInputFocus(medicine.id)}
                                          placeholder="Search medicines..."
                                          className="pl-8 h-7 text-xs w-full"
                                          onBlur={() => {
                                            setTimeout(() => {
                                              if (showDrugDropdown === medicine.id) {
                                                setShowDrugDropdown(null);
                                                setDrugDropdownPosition(null);
                                              }
                                            }, 300);
                                          }}
                                        />
                                        
                                        {/* Enhanced Dropdown */}
                                        {showDrugDropdown === medicine.id && drugDropdownPosition && (
                                          <div 
                                            className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden"
                                            style={{
                                              top: `${drugDropdownPosition.top}px`,
                                              left: `${drugDropdownPosition.left}px`,
                                              width: `${drugDropdownPosition.width}px`
                                            }}
                                          >
                                            {drugSearchLoading ? (
                                              <div className="p-4 text-center">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Loading medicines...</p>
                                              </div>
                                            ) : getFilteredDrugs(medicine.medicineName).length === 0 ? (
                                              <div className="p-4 text-center text-gray-500">
                                                <p className="text-sm">No medicines found</p>
                                                <p className="text-xs mt-1">Try a different search term</p>
                                              </div>
                                            ) : (
                                              <div className="max-h-80 overflow-y-auto">
                                                {getFilteredDrugs(medicine.medicineName).map((drug) => (
                                                  <div
                                                    key={drug.id}
                                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      selectDrug(medicine.id, drug);
                                                    }}
                                                  >
                                                    <div className="flex items-start justify-between">
                                                      <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-sm text-gray-900 truncate">
                                                          {drug.name}
                                                        </div>
                                                        <div className="text-xs text-gray-600 mt-1">
                                                          Generic: {drug.genericName}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                          Code: {drug.code} | Type: {drug.type}
                                                        </div>
                                                      </div>
                                                      <div className="ml-3 flex-shrink-0">
                                                        <Badge 
                                                          variant={drug.totalQuantity > 0 ? "default" : "destructive"} 
                                                          className="text-xs"
                                                        >
                                                          Stock: {drug.totalQuantity}
                                                        </Badge>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      {medicine.genericName && (
                                        <div className="mt-1 text-[10px] text-gray-500">
                                          {medicine.genericName}
                                        </div>
                                      )}
                                    </TableCell>

                                    {/* Dose */}
                                    <TableCell className="py-1.5">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => openDoseFrequencyModal(medicine.id, 'dose', medicine.dose || '')}
                                        className="h-7 text-xs w-full justify-start font-normal"
                                      >
                                        {medicine.dose || 'Select Dose'}
                                      </Button>
                                      {medicine.dose === 'Custom ml' && (
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.5"
                                          value={medicine.customMl || ''}
                                          onChange={(e) => updateMedicine(medicine.id, 'customMl', parseFloat(e.target.value) || 0)}
                                          placeholder="ml"
                                          className="h-7 text-xs w-full mt-1"
                                        />
                                      )}
                                    </TableCell>

                                    {/* Frequency */}
                                    <TableCell className="py-1.5">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => openDoseFrequencyModal(medicine.id, 'frequency', medicine.frequency || '')}
                                        className="h-7 text-xs w-full justify-start font-normal"
                                      >
                                        {medicine.frequency || 'Select Frequency'}
                                      </Button>
                                    </TableCell>

                                    {/* Days */}
                                    <TableCell className="py-1.5">
                                      <Input
                                        id={`days-${medicine.id}`}
                                        type="number"
                                        min="1"
                                        value={medicine.days || ''}
                                        onChange={(e) => {
                                          const days = parseInt(e.target.value) || 0;
                                          updateMedicine(medicine.id, 'days', days);
                                        }}
                                        className="h-7 text-xs w-full"
                                      />
                                    </TableCell>

                                    {/* Quantity */}
                                    <TableCell className="py-1.5">
                                      {isMlDose(medicine.dose) ? (() => {
                                        const mode = quantityInputMode[medicine.id] || 'bottles';
                                        
                                        // Get the correct value based on mode
                                        let inputValue: number;
                                        let needsStateUpdate = false;
                                        
                                        if (mode === 'ml') {
                                          // For ml mode, use calculatedMl from state
                                          if (medicine.calculatedMl !== undefined && medicine.calculatedMl !== null && medicine.calculatedMl > 0) {
                                            inputValue = medicine.calculatedMl;
                                          } else {
                                            // Calculate default if not set
                                            const validFrequency = medicine.frequency || 'bd';
                                            const validDays = medicine.days || 1;
                                            const calculated = calculateTotalMl(
                                              medicine.dose || '',
                                              medicine.customMl,
                                              validFrequency,
                                              validDays
                                            );
                                            inputValue = calculated > 0 ? calculated : 1;
                                            needsStateUpdate = true;
                                          }
                                        } else {
                                          // For bottles mode, use drugCount from state
                                          if (medicine.drugCount !== undefined && medicine.drugCount !== null && medicine.drugCount > 0) {
                                            inputValue = medicine.drugCount;
                                          } else {
                                            inputValue = 1;
                                            needsStateUpdate = true;
                                          }
                                        }
                                        
                                        // Ensure state is updated if value was calculated (will trigger on next render)
                                        if (needsStateUpdate) {
                                          // Use requestAnimationFrame to update state after render
                                          requestAnimationFrame(() => {
                                            if (mode === 'ml') {
                                              updateMedicine(medicine.id, 'calculatedMl', inputValue);
                                            } else {
                                              updateMedicine(medicine.id, 'drugCount', inputValue);
                                            }
                                          });
                                        }

                                        return (
                                          <div className="flex gap-1">
                                            <div className="relative flex-1" style={{ width: '120px' }}>
                                              <Input
                                                key={`qty-input-${medicine.id}-${mode}`}
                                                type="number"
                                                min="1"
                                                step={mode === 'ml' ? '0.1' : '1'}
                                                value={inputValue > 0 ? String(inputValue) : ''}
                                                onChange={(e) => {
                                                  const inputVal = e.target.value;
                                                  const numVal = parseFloat(inputVal);
                                                  
                                                  if (inputVal === '' || isNaN(numVal) || numVal <= 0) {
                                                    // Reset to default when empty or invalid
                                                    if (mode === 'ml') {
                                                      const validFrequency = medicine.frequency || 'bd';
                                                      const validDays = medicine.days || 1;
                                                      const defaultMl = calculateTotalMl(
                                                        medicine.dose || '',
                                                        medicine.customMl,
                                                        validFrequency,
                                                        validDays
                                                      );
                                                      updateMedicine(medicine.id, 'calculatedMl', defaultMl > 0 ? defaultMl : 1);
                                                    } else {
                                                      updateMedicine(medicine.id, 'drugCount', 1);
                                                    }
                                                    return;
                                                  }
                                                  
                                                  // Update state based on mode
                                                  if (mode === 'ml') {
                                                    updateMedicine(medicine.id, 'calculatedMl', numVal);
                                                    updateMedicine(medicine.id, 'drugCount', Math.ceil(numVal / BOTTLE_SIZE_ML) || 1);
                                                  } else {
                                                    updateMedicine(medicine.id, 'drugCount', Math.max(1, Math.floor(numVal)));
                                                    // Update calculatedMl when bottle count changes
                                                    const validFrequency = medicine.frequency || 'bd';
                                                    const validDays = medicine.days || 1;
                                                    const calculatedMl = calculateTotalMl(
                                                      medicine.dose || '',
                                                      medicine.customMl,
                                                      validFrequency,
                                                      validDays
                                                    );
                                                    updateMedicine(medicine.id, 'calculatedMl', calculatedMl > 0 ? calculatedMl : 1);
                                                  }
                                                }}
                                                className="h-7 text-xs w-full [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                              />
                                            </div>
                                            <Select
                                              value={mode}
                                              onValueChange={(value: 'bottles' | 'ml') => {
                                                setQuantityInputMode(prev => ({
                                                  ...prev,
                                                  [medicine.id]: value
                                                }));
                                                
                                                // When switching modes, calculate and set values immediately
                                                if (value === 'ml') {
                                                  const validFrequency = medicine.frequency || 'bd';
                                                  const validDays = medicine.days || 1;
                                                  const calculated = calculateTotalMl(
                                                    medicine.dose || '',
                                                    medicine.customMl,
                                                    validFrequency,
                                                    validDays
                                                  );
                                                  updateMedicine(medicine.id, 'calculatedMl', calculated > 0 ? calculated : 1);
                                                } else {
                                                  // When switching to bottles, ensure drugCount is set
                                                  if (!medicine.drugCount || medicine.drugCount <= 0) {
                                                    updateMedicine(medicine.id, 'drugCount', 1);
                                                  }
                                                }
                                              }}
                                            >
                                              <SelectTrigger className="h-7 w-16 text-xs px-1">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="bottles">btl</SelectItem>
                                                <SelectItem value="ml">ml</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        );
                                      })()
                                      : isPuffDose(medicine.dose) || isLaOrCapsulesDose(medicine.dose) || isTubesDose(medicine.dose) ? (
                                        <div className="relative">
                                          <Input
                                            type="number"
                                            min="1"
                                            value={medicine.drugCount || 1}
                                            onChange={(e) => updateMedicine(medicine.id, 'drugCount', parseInt(e.target.value) || 1)}
                                            className="h-7 text-xs w-full pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                          />
                                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                            nos
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="relative">
                                          <Input
                                            type="number"
                                            min="1"
                                            value={medicine.drugCount || 0}
                                            onChange={(e) => updateMedicine(medicine.id, 'drugCount', parseInt(e.target.value) || 0)}
                                            className="h-7 text-xs w-full pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                          />
                                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                            tabs
                                          </div>
                                        </div>
                                      )}
                                    </TableCell>

                                    {/* Instructions */}
                                    <TableCell className="py-1.5">
                                      <div className="space-y-1">
                                        <Popover open={openInstructionPopover === medicine.id} onOpenChange={(open) => {
                                          setOpenInstructionPopover(open ? medicine.id : null);
                                        }}>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              role="combobox"
                                              className="h-7 text-xs w-full justify-between font-normal"
                                            >
                                              <span className="truncate">
                                                {medicine.specialNote || "Select..."}
                                              </span>
                                              <Search className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-[350px] p-0" align="start">
                                            <Command shouldFilter={false} className="overflow-visible flex flex-col">
                                              <CommandInput 
                                                placeholder="Search or type custom instructions..." 
                                                className="h-9"
                                                value={medicine.specialNote || ''}
                                                onValueChange={(value) => {
                                                  // Always update to allow typing, deleting, and clearing
                                                  updateMedicine(medicine.id, 'specialNote', value);
                                                }}
                                              />
                                              <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                                                <CommandList>
                                                  <CommandGroup>
                                                    {instructionOptions
                                                      .filter(option => 
                                                        !medicine.specialNote || 
                                                        option.toLowerCase().includes(medicine.specialNote.toLowerCase()) ||
                                                        medicine.specialNote.toLowerCase().includes(option.toLowerCase())
                                                      )
                                                      .map((option) => (
                                                        <CommandItem
                                                          key={option}
                                                          value={option}
                                                          onSelect={() => {
                                                            updateMedicine(medicine.id, 'specialNote', option);
                                                            setOpenInstructionPopover(null);
                                                          }}
                                                          className="text-xs cursor-pointer"
                                                        >
                                                          {option}
                                                        </CommandItem>
                                                      ))}
                                                  </CommandGroup>
                                                  {medicine.specialNote && !instructionOptions.includes(medicine.specialNote) && (
                                                    <CommandGroup>
                                                      <CommandItem
                                                        value={medicine.specialNote}
                                                        onSelect={() => {
                                                          setOpenInstructionPopover(null);
                                                        }}
                                                        className="text-xs bg-blue-50"
                                                      >
                                                        Custom: {medicine.specialNote}
                                                      </CommandItem>
                                                    </CommandGroup>
                                                  )}
                                                </CommandList>
                                              </div>
                                            </Command>
                                          </PopoverContent>
                                        </Popover>
                                        <Input
                                          id={`note-${medicine.id}`}
                                          value={medicine.specialNote || ''}
                                          onChange={(e) => updateMedicine(medicine.id, 'specialNote', e.target.value)}
                                          placeholder="Or type custom..."
                                          className="h-7 text-xs w-full"
                                        />
                                      </div>
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="text-center py-1.5">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeMedicine(medicine.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                                        title="Remove"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          
                          {/* Add Medicine Button */}
                          <div className="flex justify-center items-center mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap justify-center items-center gap-2">
                              <Button
                                type="button"
                                onClick={() => addMedicine('inventory')}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 border-blue-300 hover:bg-blue-100 hover:border-blue-400 text-blue-700 shadow-sm transition-all duration-200"
                              >
                                <Plus className="h-4 w-4 text-blue-600" />
                                Add Medicine
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 border-green-200 hover:bg-green-50 hover:border-green-300 text-green-700 transition-all duration-200"
                                onClick={() => openTemplateModal('create')}
                              >
                                <Save className="h-4 w-4" />
                                Save Template
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow transition-all duration-200"
                                onClick={() => setTemplateManagerOpen(true)}
                              >
                                <FileText className="h-4 w-4" />
                                Templates
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                   </div>
                   )}
                 </TabsContent>

                <TabsContent value="written" className="space-y-4" style={{ overflow: 'visible' }}>
                  <div className="flex flex-wrap justify-end items-center gap-2 mb-4">
                    <Button
                      type="button"
                      onClick={() => handleClearMedicines('written')}
                      variant="ghost"
                      size="sm"
                      disabled={medicines.filter(m => m.source === 'written').length === 0}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear Written List
                    </Button>
                  </div>
                   {medicines.filter(m => m.source === 'written').length === 0 ? (
                     <div className="text-center py-16 text-gray-500 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-xl border-2 border-dashed border-green-200">
                       <div className="p-4 bg-white rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg border border-green-100">
                         <Edit3 className="h-10 w-10 text-green-400" />
                       </div>
                       <p className="text-xl font-semibold text-gray-700 mb-2">No written medicines added yet</p>
                       <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">Write custom medicine prescriptions for medications not in your inventory</p>
                      <div className="flex flex-col items-center gap-3">
                        <Button
                          type="button"
                          onClick={() => addMedicine('written')}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Plus className="h-4 w-4" />
                          Add Medicine
                        </Button>
                        <div className="flex flex-wrap justify-center items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 border-green-200 hover:bg-green-50 hover:border-green-300 text-green-700 transition-all duration-200"
                            onClick={() => openTemplateModal('create')}
                          >
                            <Save className="h-4 w-4" />
                            Save Template
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow transition-all duration-200"
                            onClick={() => setTemplateManagerOpen(true)}
                          >
                            <FileText className="h-4 w-4" />
                            Templates
                          </Button>
                        </div>
                      </div>
                     </div>
                   ) : (
                     <div className="space-y-6">
                       {/* Written Medicines Card */}
                       <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50/30 to-emerald-50/30">
                         <CardHeader className="pb-4">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                               <div className="p-2 bg-green-100 rounded-lg">
                                 <Edit3 className="h-5 w-5 text-green-600" />
                               </div>
                               <div>
                                 <CardTitle className="text-lg font-semibold text-gray-900">
                                   Written Medicines
                                 </CardTitle>
                                 <p className="text-sm text-gray-600 mt-1">
                                   {medicines.filter(m => m.source === 'written').length} medicine(s) added
                                 </p>
                               </div>
                             </div>
                             <Button
                               type="button"
                               onClick={() => addMedicine('written')}
                               size="sm"
                               className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                             >
                               <Plus className="h-4 w-4 mr-2" />
                               Add Medicine
                             </Button>
                           </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div ref={writtenTableRef} className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12 text-center text-xs font-semibold py-2">#</TableHead>
                                  <TableHead className="min-w-[150px] text-xs font-semibold py-2">Medicine</TableHead>
                                  <TableHead className="min-w-[120px] text-xs font-semibold py-2">Trade Name</TableHead>
                                  <TableHead className="w-32 text-xs font-semibold py-2">Dose</TableHead>
                                  <TableHead className="w-28 text-xs font-semibold py-2">Frequency</TableHead>
                                  <TableHead className="w-20 text-xs font-semibold py-2">Days</TableHead>
                                  <TableHead className="w-24 text-xs font-semibold py-2">Qty</TableHead>
                                  <TableHead className="min-w-[200px] text-xs font-semibold py-2">Instructions</TableHead>
                                  <TableHead className="w-16 text-center text-xs font-semibold py-2">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {medicines.filter(m => m.source === 'written').map((medicine, index) => (
                                  <TableRow key={medicine.id} id={`medicine-row-${medicine.id}`} className="hover:bg-green-50/50">
                                     {/* Row Number */}
                                     <TableCell className="text-center py-1.5">
                                       <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-semibold mx-auto">
                                         {index + 1}
                                       </div>
                                     </TableCell>

                                     {/* Medicine Name */}
                                     <TableCell className="py-1.5">
                                       <Input
                                         id={`medicine-${medicine.id}`}
                                         value={medicine.medicineName}
                                         onChange={(e) => updateMedicine(medicine.id, 'medicineName', e.target.value)}
                                         placeholder="Medicine name"
                                         className="h-7 text-xs w-full"
                                       />
                                     </TableCell>

                                     {/* Trade Name */}
                                     <TableCell className="py-1.5">
                                       <Input
                                         id={`tradeName-${medicine.id}`}
                                         value={medicine.tradeName || ''}
                                         onChange={(e) => updateMedicine(medicine.id, 'tradeName', e.target.value)}
                                         placeholder="Trade name"
                                         className="h-7 text-xs w-full"
                                       />
                                     </TableCell>

                                     {/* Dose */}
                                     <TableCell className="py-1.5">
                                       <Button
                                         type="button"
                                         variant="outline"
                                         onClick={() => openDoseFrequencyModal(medicine.id, 'dose', medicine.dose || '')}
                                         className="h-7 text-xs w-full justify-start font-normal"
                                       >
                                         {medicine.dose || 'Select Dose'}
                                       </Button>
                                       {medicine.dose === 'Custom ml' && (
                                         <Input
                                           type="number"
                                           min="0"
                                           step="0.5"
                                           value={medicine.customMl || ''}
                                           onChange={(e) => updateMedicine(medicine.id, 'customMl', parseFloat(e.target.value) || 0)}
                                           placeholder="ml"
                                           className="h-7 text-xs w-full mt-1"
                                         />
                                       )}
                                     </TableCell>

                                     {/* Frequency */}
                                     <TableCell className="py-1.5">
                                       <Button
                                         type="button"
                                         variant="outline"
                                         onClick={() => openDoseFrequencyModal(medicine.id, 'frequency', medicine.frequency || '')}
                                         className="h-7 text-xs w-full justify-start font-normal"
                                       >
                                         {medicine.frequency || 'Select Frequency'}
                                       </Button>
                                     </TableCell>

                                     {/* Days */}
                                     <TableCell className="py-1.5">
                                       <Input
                                         id={`days-${medicine.id}`}
                                         type="number"
                                         min="1"
                                         value={medicine.days || ''}
                                         onChange={(e) => {
                                           const days = parseInt(e.target.value) || 0;
                                           updateMedicine(medicine.id, 'days', days);
                                         }}
                                         className="h-7 text-xs w-full"
                                       />
                                     </TableCell>

                                     {/* Quantity */}
                                     <TableCell className="py-1.5">
                                       {isMlDose(medicine.dose) ? (() => {
                                         const mode = quantityInputMode[medicine.id] || 'bottles';
                                         
                                         // Get the correct value based on mode
                                         let inputValue: number;
                                         let needsStateUpdate = false;
                                         
                                         if (mode === 'ml') {
                                           // For ml mode, use calculatedMl from state
                                           if (medicine.calculatedMl !== undefined && medicine.calculatedMl !== null && medicine.calculatedMl > 0) {
                                             inputValue = medicine.calculatedMl;
                                           } else {
                                             // Calculate default if not set
                                             const validFrequency = medicine.frequency || 'bd';
                                             const validDays = medicine.days || 1;
                                             const calculated = calculateTotalMl(
                                               medicine.dose || '',
                                               medicine.customMl,
                                               validFrequency,
                                               validDays
                                             );
                                             inputValue = calculated > 0 ? calculated : 1;
                                             needsStateUpdate = true;
                                           }
                                         } else {
                                           // For bottles mode, use drugCount from state
                                           if (medicine.drugCount !== undefined && medicine.drugCount !== null && medicine.drugCount > 0) {
                                             inputValue = medicine.drugCount;
                                           } else {
                                             inputValue = 1;
                                             needsStateUpdate = true;
                                           }
                                         }
                                         
                                         // Ensure state is updated if value was calculated (will trigger on next render)
                                         if (needsStateUpdate) {
                                           // Use requestAnimationFrame to update state after render
                                           requestAnimationFrame(() => {
                                             if (mode === 'ml') {
                                               updateMedicine(medicine.id, 'calculatedMl', inputValue);
                                             } else {
                                               updateMedicine(medicine.id, 'drugCount', inputValue);
                                             }
                                           });
                                         }

                                         return (
                                           <div className="flex gap-1">
                                             <div className="relative flex-1" style={{ width: '120px' }}>
                                               <Input
                                                 key={`qty-input-written-${medicine.id}-${mode}`}
                                                 type="number"
                                                 min="1"
                                                 step={mode === 'ml' ? '0.1' : '1'}
                                                 value={inputValue > 0 ? String(inputValue) : ''}
                                                 onChange={(e) => {
                                                   const inputVal = e.target.value;
                                                   const numVal = parseFloat(inputVal);
                                                   
                                                   if (inputVal === '' || isNaN(numVal) || numVal <= 0) {
                                                     // Reset to default when empty or invalid
                                                     if (mode === 'ml') {
                                                       const validFrequency = medicine.frequency || 'bd';
                                                       const validDays = medicine.days || 1;
                                                       const defaultMl = calculateTotalMl(
                                                         medicine.dose || '',
                                                         medicine.customMl,
                                                         validFrequency,
                                                         validDays
                                                       );
                                                       updateMedicine(medicine.id, 'calculatedMl', defaultMl > 0 ? defaultMl : 1);
                                                     } else {
                                                       updateMedicine(medicine.id, 'drugCount', 1);
                                                     }
                                                     return;
                                                   }
                                                   
                                                   // Update state based on mode
                                                   if (mode === 'ml') {
                                                     updateMedicine(medicine.id, 'calculatedMl', numVal);
                                                     updateMedicine(medicine.id, 'drugCount', Math.ceil(numVal / BOTTLE_SIZE_ML) || 1);
                                                   } else {
                                                     updateMedicine(medicine.id, 'drugCount', Math.max(1, Math.floor(numVal)));
                                                     // Update calculatedMl when bottle count changes
                                                     const validFrequency = medicine.frequency || 'bd';
                                                     const validDays = medicine.days || 1;
                                                     const calculatedMl = calculateTotalMl(
                                                       medicine.dose || '',
                                                       medicine.customMl,
                                                       validFrequency,
                                                       validDays
                                                     );
                                                     updateMedicine(medicine.id, 'calculatedMl', calculatedMl > 0 ? calculatedMl : 1);
                                                   }
                                                 }}
                                                 className="h-7 text-xs w-full [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                               />
                                             </div>
                                             <Select
                                               value={mode}
                                               onValueChange={(value: 'bottles' | 'ml') => {
                                                 setQuantityInputMode(prev => ({
                                                   ...prev,
                                                   [medicine.id]: value
                                                 }));
                                                 
                                                 // When switching modes, calculate and set values immediately
                                                 if (value === 'ml') {
                                                   const validFrequency = medicine.frequency || 'bd';
                                                   const validDays = medicine.days || 1;
                                                   const calculated = calculateTotalMl(
                                                     medicine.dose || '',
                                                     medicine.customMl,
                                                     validFrequency,
                                                     validDays
                                                   );
                                                   updateMedicine(medicine.id, 'calculatedMl', calculated > 0 ? calculated : 1);
                                                 } else {
                                                   // When switching to bottles, ensure drugCount is set
                                                   if (!medicine.drugCount || medicine.drugCount <= 0) {
                                                     updateMedicine(medicine.id, 'drugCount', 1);
                                                   }
                                                 }
                                               }}
                                             >
                                               <SelectTrigger className="h-7 w-16 text-xs px-1">
                                                 <SelectValue />
                                               </SelectTrigger>
                                               <SelectContent>
                                                 <SelectItem value="bottles">btl</SelectItem>
                                                 <SelectItem value="ml">ml</SelectItem>
                                               </SelectContent>
                                             </Select>
                                           </div>
                                         );
                                       })()
                                       : isPuffDose(medicine.dose) || isLaOrCapsulesDose(medicine.dose) || isTubesDose(medicine.dose) ? (
                                         <div className="relative">
                                           <Input
                                             type="number"
                                             min="1"
                                             value={medicine.drugCount || 1}
                                             onChange={(e) => updateMedicine(medicine.id, 'drugCount', parseInt(e.target.value) || 1)}
                                             className="h-7 text-xs w-full pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                           />
                                           <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                             nos
                                           </div>
                                         </div>
                                       ) : (
                                         <div className="relative">
                                           <Input
                                             type="number"
                                             min="1"
                                             value={medicine.drugCount || 0}
                                             onChange={(e) => updateMedicine(medicine.id, 'drugCount', parseInt(e.target.value) || 0)}
                                             className="h-7 text-xs w-full pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                           />
                                           <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                             tabs
                                           </div>
                                         </div>
                                       )}
                                     </TableCell>

                                     {/* Instructions */}
                                     <TableCell className="py-1.5">
                                       <div className="space-y-1">
                                         <Popover open={openInstructionPopover === medicine.id} onOpenChange={(open) => {
                                           setOpenInstructionPopover(open ? medicine.id : null);
                                         }}>
                                           <PopoverTrigger asChild>
                                             <Button
                                               variant="outline"
                                               role="combobox"
                                               className="h-7 text-xs w-full justify-between font-normal"
                                             >
                                               <span className="truncate">
                                                 {medicine.specialNote || "Select..."}
                                               </span>
                                               <Search className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                             </Button>
                                           </PopoverTrigger>
                                           <PopoverContent className="w-[350px] p-0" align="start">
                                             <Command shouldFilter={false} className="overflow-visible flex flex-col">
                                               <CommandInput 
                                                 placeholder="Search or type custom instructions..." 
                                                 className="h-9"
                                                 value={medicine.specialNote || ''}
                                                 onValueChange={(value) => {
                                                   // Always update to allow typing, deleting, and clearing
                                                   updateMedicine(medicine.id, 'specialNote', value);
                                                 }}
                                               />
                                               <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                                                 <CommandList>
                                                   <CommandGroup>
                                                     {instructionOptions
                                                       .filter(option => 
                                                         !medicine.specialNote || 
                                                         option.toLowerCase().includes(medicine.specialNote.toLowerCase()) ||
                                                         medicine.specialNote.toLowerCase().includes(option.toLowerCase())
                                                       )
                                                       .map((option) => (
                                                         <CommandItem
                                                           key={option}
                                                           value={option}
                                                           onSelect={() => {
                                                             updateMedicine(medicine.id, 'specialNote', option);
                                                             setOpenInstructionPopover(null);
                                                           }}
                                                           className="text-xs cursor-pointer"
                                                         >
                                                           {option}
                                                         </CommandItem>
                                                       ))}
                                                   </CommandGroup>
                                                   {medicine.specialNote && !instructionOptions.includes(medicine.specialNote) && (
                                                     <CommandGroup>
                                                       <CommandItem
                                                         value={medicine.specialNote}
                                                         onSelect={() => {
                                                           setOpenInstructionPopover(null);
                                                         }}
                                                         className="text-xs bg-blue-50"
                                                       >
                                                         Custom: {medicine.specialNote}
                                                       </CommandItem>
                                                     </CommandGroup>
                                                   )}
                                                 </CommandList>
                                               </div>
                                             </Command>
                                           </PopoverContent>
                                         </Popover>
                                         <Input
                                           id={`note-written-${medicine.id}`}
                                           value={medicine.specialNote || ''}
                                           onChange={(e) => updateMedicine(medicine.id, 'specialNote', e.target.value)}
                                           placeholder="Or type custom..."
                                           className="h-7 text-xs w-full"
                                         />
                                       </div>
                                     </TableCell>

                                     {/* Actions */}
                                     <TableCell className="text-center py-1.5">
                                       <Button
                                         type="button"
                                         variant="ghost"
                                         size="sm"
                                         onClick={() => removeMedicine(medicine.id)}
                                         className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                                         title="Remove"
                                       >
                                         <Trash2 className="h-3.5 w-3.5" />
                                       </Button>
                                     </TableCell>
                                   </TableRow>
                                 ))}
                               </TableBody>
                             </Table>
                           </div>
                           
                           {/* Add Medicine Button */}
                           <div className="flex justify-center items-center mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap justify-center items-center gap-2">
                              <Button
                                type="button"
                                onClick={() => addMedicine('written')}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 border-green-300 hover:bg-green-100 hover:border-green-400 text-green-700 shadow-sm transition-all duration-200"
                              >
                                <Plus className="h-4 w-4 text-green-600" />
                                Add Medicine
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 border-green-200 hover:bg-green-50 hover:border-green-300 text-green-700 transition-all duration-200"
                                onClick={() => openTemplateModal('create')}
                              >
                                <Save className="h-4 w-4" />
                                Save Template
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow transition-all duration-200"
                                onClick={() => setTemplateManagerOpen(true)}
                              >
                                <FileText className="h-4 w-4" />
                                Templates
                              </Button>
                            </div>
                           </div>
                         </CardContent>
                       </Card>
                     </div>
                   )}
                 </TabsContent>
               </Tabs>
            </CardContent>
          </Card>

          {/* Appointment Procedures Section - Editable */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
            <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Stethoscope className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-gray-800 font-semibold">Appointment Procedures</span>
                </CardTitle>
                <Button
                  type="button"
                  onClick={addProcedure}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={loadingProcedures}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Procedure
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingProcedures ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-purple-600" />
                  <span className="text-gray-600">Loading procedures...</span>
                </div>
              ) : procedures.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gradient-to-br from-purple-50/50 to-violet-50/50 rounded-xl border-2 border-dashed border-purple-200">
                  <div className="p-4 bg-white rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg border border-purple-100">
                    <Stethoscope className="h-10 w-10 text-purple-400" />
                  </div>
                  <p className="text-xl font-semibold text-gray-700 mb-2">No procedures added yet</p>
                  <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                    Click the button below to add a procedure row. You can search for existing procedures or type a new procedure name and charge.
                  </p>
                  <Button
                    type="button"
                    onClick={addProcedure}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    disabled={loadingProcedures}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Procedure Row
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {procedures.map((procedure, index) => (
                      <Card key={index} className="border border-purple-200 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                            {/* Row Number */}
                            <div className="lg:col-span-1 flex items-center justify-center">
                              <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </div>
                            </div>

                            {/* Procedure Selection - Searchable */}
                            <div className="lg:col-span-5">
                              <Label htmlFor={`procedure-${index}`} className="text-sm font-medium text-gray-700 mb-2 block">
                                Procedure
                              </Label>
                              <div className="relative" data-procedure-dropdown-container>
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id={`procedure-${index}`}
                                  value={procedureSearchTerms[index] !== undefined 
                                    ? procedureSearchTerms[index] 
                                    : procedure.procedureName || ''}
                                  onChange={(e) => {
                                    const searchTerm = e.target.value;
                                    setProcedureSearchTerms(prev => ({ ...prev, [index]: searchTerm }));
                                    // Update procedure name directly when typing (for new procedures)
                                    updateProcedure(index, 'procedureName', searchTerm);
                                    setShowProcedureDropdown(index);
                                  }}
                                  onFocus={() => {
                                    const currentName = procedure.procedureName || availableProcedures.find(p => p.id === procedure.procedureId)?.procedureName || '';
                                    setProcedureSearchTerms(prev => ({
                                      ...prev,
                                      [index]: currentName
                                    }));
                                    setShowProcedureDropdown(index);
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      if (showProcedureDropdown === index) {
                                        setShowProcedureDropdown(null);
                                      }
                                    }, 300);
                                  }}
                                  placeholder="Search procedures..."
                                  className="pl-10 w-full"
                                />
                                
                                {/* Searchable Dropdown */}
                                {showProcedureDropdown === index && (
                                  <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden">
                                    {(() => {
                                      const searchTerm = (procedureSearchTerms[index] || '').toLowerCase();
                                      const filteredProcedures = searchTerm
                                        ? availableProcedures.filter(proc =>
                                            proc.procedureName?.toLowerCase().includes(searchTerm) ||
                                            proc.description?.toLowerCase().includes(searchTerm)
                                          )
                                        : availableProcedures;
                                      
                                      return filteredProcedures.length === 0 ? (
                                        <div className="p-4">
                                          <div className="text-center text-gray-500 mb-3">
                                            <p className="text-sm">No procedures found</p>
                                            <p className="text-xs mt-1">Create a new procedure</p>
                                          </div>
                                          <Button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              openCreateProcedureModal(index);
                                            }}
                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm"
                                            size="sm"
                                          >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create New Procedure
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="max-h-80 overflow-y-auto">
                                          {filteredProcedures.map((proc) => (
                                            <div
                                              key={proc.id}
                                              className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                updateProcedure(index, 'procedureId', proc.id!);
                                                setProcedureSearchTerms(prev => ({
                                                  ...prev,
                                                  [index]: proc.procedureName || ''
                                                }));
                                                setShowProcedureDropdown(null);
                                              }}
                                            >
                                              <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                  <div className="font-medium text-sm text-gray-900">
                                                    {proc.procedureName}
                                                  </div>
                                                  {proc.description && (
                                                    <div className="text-xs text-gray-600 mt-1 truncate">
                                                      {proc.description}
                                                    </div>
                                                  )}
                                                </div>
                                                <div className="ml-3 flex-shrink-0">
                                                  <Badge variant="outline" className="text-xs text-purple-700 border-purple-300">
                                                    {formatCurrency(proc.doctorCharge)}
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                          {/* Add "Create New Procedure" option at the bottom */}
                                          <div className="border-t border-gray-200 p-2 bg-purple-50/50">
                                            <Button
                                              type="button"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openCreateProcedureModal(index);
                                              }}
                                              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm"
                                              size="sm"
                                            >
                                              <Plus className="h-4 w-4 mr-2" />
                                              Create New Procedure
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Charge Display/Edit */}
                            <div className="lg:col-span-4">
                              <Label htmlFor={`charge-${index}`} className="text-sm font-medium text-gray-700 mb-2 block">
                                Charge (Rs.)
                              </Label>
                              <Input
                                id={`charge-${index}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={procedure.doctorCharge === 0 ? '' : procedure.doctorCharge}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    updateProcedure(index, 'doctorCharge', 0);
                                  } else {
                                    const numValue = parseFloat(value);
                                    if (!isNaN(numValue) && numValue >= 0) {
                                      updateProcedure(index, 'doctorCharge', numValue);
                                    }
                                  }
                                }}
                                placeholder="Enter charge amount"
                                className="w-full"
                              />
                            </div>

                            {/* Remove Button */}
                            <div className="lg:col-span-1 flex items-end justify-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeProcedure(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
                                title="Remove procedure"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        Total Procedures Charge:
                      </span>
                      <span className="text-lg font-bold text-purple-700">
                        {formatCurrency(
                          procedures.reduce((sum, proc) => sum + proc.doctorCharge, 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImagePlus className="h-5 w-5 text-blue-600" />
              <span>Prescription Images</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div>
              <Label htmlFor="image-upload" className="text-sm font-medium mb-2 block">
                Upload Images (Max 5MB each)
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleImageSelect}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPEG, PNG, GIF, WebP
              </p>
            </div>

            {/* Selected Files Preview */}
            {imageFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">New Images to Upload:</h4>
                {imageFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <img
                          src={imageUploadService.generatePreviewURL(file)}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                          onClick={() => openImagePreview(imageUploadService.generatePreviewURL(file))}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImageFile(file.name)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <div>
                          <Label htmlFor={`desc-${file.name}`} className="text-xs text-gray-600">
                            Description (optional):
                          </Label>
                          <Input
                            id={`desc-${file.name}`}
                            type="text"
                            placeholder="Enter image description..."
                            value={imageDescriptions[file.name] || ''}
                            onChange={(e) => updateImageDescription(file.name, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Existing Images */}

              {images.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <ImageIcon className="h-4 w-4 mr-2 text-blue-600" />
                  Existing Images ({images.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-blue-300 transition-colors">
                      <div className="space-y-3">
                        {/* Image with larger size */}
                        <img
                          src={image.downloadURL}
                          alt={image.originalName}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 border shadow-sm"
                          onClick={() => openImagePreview(image.downloadURL)}
                        />
                        
                        {/* File name with better styling */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-900 truncate" title={image.originalName}>
                            📁 {image.originalName}
                          </p>
                          
                          {/* Description with highlighting */}
                          {image.description ? (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
                              <div className="flex items-start space-x-2">
                                <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-blue-800 mb-1">Description:</p>
                                  <p className="text-sm text-blue-900 leading-relaxed">
                                    {image.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 border-l-4 border-gray-300 p-3 rounded-r-lg">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="h-4 w-4 text-gray-500" />
                                <p className="text-xs text-gray-600 italic">No description provided</p>
                              </div>
                            </div>
                          )}
                          
                          {/* File info and actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500 font-medium">
                              📊 {(image.fileSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUploadedImage(image.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {images.length === 0 && imageFiles.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <FileImage className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No images uploaded yet</p>
                <p className="text-xs">Upload images to reference with this prescription</p>
              </div>
            )}
          </CardContent>
        </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Additional Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or instructions..."
                rows={4}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Prescription History Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <History className="h-5 w-5 mr-2 text-blue-600" />
                Patient's Prescription History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading history...
                </div>
              ) : prescriptionHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No previous prescriptions found</p>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {prescriptionHistory.map((prescription) => (
                      <div key={prescription.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer" onClick={() => handleViewHistoryPrescription(prescription)}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">Dr. {prescription.doctorName}</p>
                            <p className="text-xs text-gray-500">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {prescription.createdAt instanceof Date 
                                ? prescription.createdAt.toLocaleDateString() 
                                : new Date(prescription.createdAt!).toLocaleDateString()}
                            </p>
                            {prescription.appointmentAmount !== undefined && (
                              <p className="text-xs text-green-600 font-semibold mt-1 flex items-center">
                                <DollarSign className="h-3 w-3 inline mr-0.5" />
                                Amount: {formatCurrency(prescription.appointmentAmount)}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {prescription.medicines?.length || 0} medicine(s)
                          </Badge>
                        </div>
                        
                        {prescription.diagnosis && (
                          <p className="text-sm text-gray-700 mb-1">
                            <strong>Diagnosis:</strong> {prescription.diagnosis}
                          </p>
                        )}
                        
                        {prescription.medicines && prescription.medicines.length > 0 && (
                            <div className="text-xs text-gray-600">
                            <strong>Medicines:</strong> {prescription.medicines.slice(0, 2).map(m => m.medicineName).join(', ')}
                            {prescription.medicines.length > 2 && ` +${prescription.medicines.length - 2} more`}
                          </div>
                        )}
                        
                        {prescription.images && prescription.images.length > 0 && (
                          <div className="flex items-center mt-1">
                            <ImageIcon className="h-3 w-3 mr-1 text-blue-500" />
                            <span className="text-xs text-blue-600">{prescription.images.length} image(s)</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

      
          

          {/* Patient Images Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Image className="h-5 w-5 mr-2 text-purple-600" />
                All Patient Images ({patientImages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingImages ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading images...
                </div>
              ) : patientImages.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No images found for this patient</p>
              ) : (
                <ScrollArea className="h-64">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {patientImages.map((image, index) => (
                      <ImageThumbnail 
                        key={`${image.id}-${index}`} 
                        image={image} 
                        onImageClick={handleViewImage}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Appointment Documents Section */}
          <Card ref={documentsSectionRef} className="mt-6 border-l-4 border-l-indigo-500">
            <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-purple-50/30">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                  Appointment Documents ({appointmentDocuments.length})
                </div>
                {appointmentDocuments.length > 0 && (
                  <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-300">
                    {appointmentDocuments.length} file{appointmentDocuments.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDocuments ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-indigo-600" />
                  <span className="text-gray-600">Loading documents...</span>
                </div>
              ) : appointmentDocuments.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No documents attached to this appointment</p>
                  <p className="text-xs mt-1">Documents uploaded when creating/editing appointments will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {appointmentDocuments.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50/30 border border-indigo-200 rounded-lg hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <div className="p-3 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                          {doc.mimeType.startsWith('image/') ? (
                            <ImageIcon className="h-5 w-5 text-indigo-600" />
                          ) : doc.mimeType === 'application/pdf' ? (
                            <FileTextIcon className="h-5 w-5 text-red-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-indigo-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                            {doc.originalName}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                            {doc.description && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500 truncate">{doc.description}</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Uploaded {doc.uploadedAt instanceof Date 
                              ? doc.uploadedAt.toLocaleDateString()
                              : new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDocument(doc);
                            }}
                            className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="View document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(doc.downloadURL, '_blank', 'download');
                            }}
                            className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>


          </div>
        </ScrollArea>

        {/* Modern Footer with Action Buttons */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>All fields marked with * are required</span>
            </div>
            <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
                disabled={saving || uploadingImages}
                className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
                <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            </div>
          </div>
        </div>

        {selectedImagePreview && (
          <Dialog open={!!selectedImagePreview} onOpenChange={closeImagePreview}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Image Preview</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center">
                <img
                  src={selectedImagePreview}
                  alt="Preview"
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={closeImagePreview} variant="outline">
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Click outside to close dropdown - removed overlay that was interfering with clicks */}

        {/* Prescription History Details Modal */}
        {showHistoryModal && selectedHistoryPrescription && (
          <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <FileTextIcon className="h-5 w-5 text-blue-600" />
                  <span>Prescription Details</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Doctor:</span>
                    <p className="text-gray-900">Dr. {selectedHistoryPrescription.doctorName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Date:</span>
                    <p className="text-gray-900">
                      {selectedHistoryPrescription.createdAt instanceof Date 
                        ? selectedHistoryPrescription.createdAt.toLocaleDateString() 
                        : new Date(selectedHistoryPrescription.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedHistoryPrescription.appointmentAmount !== undefined && (
                    <div>
                      <span className="font-medium text-gray-600">Appointment Amount:</span>
                      <p className="text-green-600 font-bold text-lg">
                        {formatCurrency(selectedHistoryPrescription.appointmentAmount)}
                      </p>
                    </div>
                  )}
                </div>

                {selectedHistoryPrescription.presentingComplaint && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Presenting Complaint:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{selectedHistoryPrescription.presentingComplaint}</p>
                  </div>
                )}

                {selectedHistoryPrescription.diagnosis && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Diagnosis:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{selectedHistoryPrescription.diagnosis}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Medicines:</h4>
                  {selectedHistoryPrescription.medicines && selectedHistoryPrescription.medicines.length > 0 ? (
                    <div className="space-y-2">
                      {selectedHistoryPrescription.medicines.map((medicine, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="font-medium text-sm">{medicine.medicineName}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="mr-4">Dosage: {medicine.dosage}</span>
                            <span className="mr-4">Frequency: {medicine.frequency}</span>
                            <span>Duration: {medicine.duration}</span>
                          </div>
                          {medicine.instructions && (
                            <div className="text-xs text-gray-500 mt-1">Instructions: {medicine.instructions}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No medicines in this prescription</p>
                  )}
                </div>

                {selectedHistoryPrescription.images && selectedHistoryPrescription.images.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Images:</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {selectedHistoryPrescription.images.map((image, index) => (
                        <div key={index} className="cursor-pointer" onClick={() => handleViewImage(image)}>
                          <img
                            src={image.downloadURL}
                            alt={image.description || image.originalName}
                            className="w-full aspect-square object-cover rounded-lg border hover:border-blue-300"
                          />
                          {image.description && (
                            <p className="text-xs text-gray-600 mt-1 truncate">{image.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedHistoryPrescription.notes && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Notes:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{selectedHistoryPrescription.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Document Viewer Modal - Enhanced with PDF and Image Preview */}
        {showDocumentViewer && selectedDocument && (
          <Dialog open={showDocumentViewer} onOpenChange={closeDocumentViewer}>
            <DialogContent className="max-w-7xl max-h-[95vh] p-0 overflow-hidden flex flex-col [&>button]:hidden">
              <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectedDocument.mimeType.startsWith('image/') ? (
                      <div className="p-2 rounded-lg bg-purple-100 flex-shrink-0">
                        <ImageIcon className="h-5 w-5 text-purple-600" />
                      </div>
                    ) : selectedDocument.mimeType === 'application/pdf' ? (
                      <div className="p-2 rounded-lg bg-red-100 flex-shrink-0">
                        <FileTextIcon className="h-5 w-5 text-red-600" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-indigo-100 flex-shrink-0">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-bold truncate">{selectedDocument.originalName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {appointmentDocuments.length > 1 && (
                          <>Document {appointmentDocuments.findIndex(d => d.id === selectedDocument.id) + 1} of {appointmentDocuments.length}</>
                        )}
                        {appointmentDocuments.length === 1 && 'Document Viewer'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {appointmentDocuments.length > 1 && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const currentIndex = appointmentDocuments.findIndex(doc => doc.id === selectedDocument.id);
                            if (currentIndex > 0) {
                              setSelectedDocument(appointmentDocuments[currentIndex - 1]);
                            }
                          }}
                          disabled={appointmentDocuments.findIndex(doc => doc.id === selectedDocument.id) === 0}
                          className="h-8 w-8"
                          title="Previous document"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-gray-500 px-2 whitespace-nowrap">
                          {appointmentDocuments.findIndex(doc => doc.id === selectedDocument.id) + 1} / {appointmentDocuments.length}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const currentIndex = appointmentDocuments.findIndex(doc => doc.id === selectedDocument.id);
                            if (currentIndex < appointmentDocuments.length - 1) {
                              setSelectedDocument(appointmentDocuments[currentIndex + 1]);
                            }
                          }}
                          disabled={appointmentDocuments.findIndex(doc => doc.id === selectedDocument.id) === appointmentDocuments.length - 1}
                          className="h-8 w-8"
                          title="Next document"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={closeDocumentViewer}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="flex-1 min-h-0 px-6 py-4">
                <div className="space-y-4">
                  {/* Document Preview - Enhanced */}
                  <Card className="border-2 shadow-lg">
                    <CardContent className="p-0">
                      <div className="relative bg-gray-50 rounded-t-lg min-h-[500px] flex items-center justify-center">
                        {selectedDocument.mimeType.startsWith('image/') ? (
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <img
                              src={selectedDocument.downloadURL}
                              alt={selectedDocument.originalName}
                              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl"
                              style={{ minHeight: '400px' }}
                              onError={(e) => {
                                console.error('Failed to load image:', selectedDocument.downloadURL);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'text-red-500 text-center p-4';
                                errorDiv.textContent = 'Failed to load image';
                                target.parentElement?.appendChild(errorDiv);
                              }}
                            />
                          </div>
                        ) : selectedDocument.mimeType === 'application/pdf' ? (
                          <div className="w-full h-full flex flex-col">
                            <div className="bg-white border-b p-2 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FileTextIcon className="h-4 w-4 text-red-600" />
                                <span className="font-medium">PDF Preview</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(selectedDocument.downloadURL, '_blank')}
                                  className="h-7 text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Open Full
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = selectedDocument.downloadURL;
                                    link.download = selectedDocument.originalName;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="h-7 text-xs"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                            <iframe
                              src={`${selectedDocument.downloadURL}#toolbar=1&navpanes=1&scrollbar=1`}
                              className="w-full flex-1 min-h-[600px] border-0 rounded-b-lg"
                              title={selectedDocument.originalName}
                              style={{ minHeight: '600px' }}
                              onError={(e) => {
                                console.error('Failed to load PDF:', selectedDocument.downloadURL);
                                const target = e.target as HTMLIFrameElement;
                                target.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'flex flex-col items-center justify-center h-full text-gray-500 p-8';
                                errorDiv.innerHTML = `
                                  <svg class="h-16 w-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <p class="text-lg font-medium mb-2">Failed to load PDF</p>
                                  <button onclick="window.open('${selectedDocument.downloadURL}', '_blank')" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                    Open in New Tab
                                  </button>
                                `;
                                target.parentElement?.appendChild(errorDiv);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 min-h-[400px]">
                            <FileText className="h-16 w-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">{selectedDocument.originalName}</p>
                            <p className="text-sm mb-4 text-center max-w-md">
                              Preview not available for this file type. Please download or open in a new tab to view.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => window.open(selectedDocument.downloadURL, '_blank')}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Open in New Tab
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = selectedDocument.downloadURL;
                                  link.download = selectedDocument.originalName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Document Actions Bar */}
                  <div className="flex justify-center items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedDocument.downloadURL, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Open in New Tab
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = selectedDocument.downloadURL;
                        link.download = selectedDocument.originalName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    {selectedDocument.description && (
                      <div className="ml-auto px-3 py-1.5 bg-white rounded-md border border-indigo-200">
                        <p className="text-xs text-gray-600 font-medium">Description:</p>
                        <p className="text-xs text-gray-700">{selectedDocument.description}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Document Details Card */}
                  <Card className="border-l-4 border-l-indigo-500">
                    <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-transparent">
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                        Document Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              File Name:
                            </label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1 break-all border">
                              {selectedDocument.originalName}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              File Size:
                            </label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1 border">
                              {(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB
                              <span className="text-gray-500 ml-2">
                                ({selectedDocument.fileSize.toLocaleString()} bytes)
                              </span>
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <ClipboardList className="h-4 w-4" />
                              File Type:
                            </label>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-sm py-1 px-2">
                                {selectedDocument.mimeType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Upload Date:
                            </label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1 border">
                              {selectedDocument.uploadedAt instanceof Date 
                                ? selectedDocument.uploadedAt.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : new Date(selectedDocument.uploadedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <FileSearch className="h-4 w-4" />
                              Document ID:
                            </label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1 font-mono break-all border">
                              {selectedDocument.id}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Description Section */}
                      {selectedDocument.description && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                            <FileTextIcon className="h-4 w-4" />
                            Description:
                          </label>
                          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">
                              {selectedDocument.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}

        {/* Image Viewer Modal */}
          {showImageViewer && selectedImage && (
            <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
              <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="h-5 w-5 text-purple-600" />
                      <span>Image Viewer</span>
                    </div>
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowImageViewer(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button> */}
                  </DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="h-[calc(95vh-80px)]">
                  <div className="p-6 pt-4 space-y-6">
                    {/* Image Display Section */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-center mb-4">
                        <div className="relative max-w-full">
                          <img
                            src={selectedImage.downloadURL}
                            alt={selectedImage.description || selectedImage.originalName}
                            className="max-w-full max-h-[60vh] object-contain rounded-lg border shadow-lg"
                            style={{ minHeight: '200px' }}
                            onError={(e) => {
                              console.error('Failed to load full image:', selectedImage.downloadURL);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Image Actions */}
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedImage.downloadURL, '_blank')}
                          className="flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = selectedImage.downloadURL;
                            link.download = selectedImage.originalName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="flex items-center"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    {/* Image Details Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-600" />
                          Image Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-600">File Name:</label>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1 break-all">
                                {selectedImage.originalName}
                              </p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-600">File Size:</label>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                                {(selectedImage.fileSize / 1024 / 1024).toFixed(2)} MB
                                <span className="text-gray-500 ml-2">
                                  ({selectedImage.fileSize.toLocaleString()} bytes)
                                </span>
                              </p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-600">File Type:</label>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                                {selectedImage.mimeType}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-600">Upload Date:</label>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                                {selectedImage.uploadedAt instanceof Date 
                                  ? selectedImage.uploadedAt.toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : new Date(selectedImage.uploadedAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                              </p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-600">Image ID:</label>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1 font-mono break-all">
                                {selectedImage.id}
                              </p>
                            </div>
                            
                            {/* Show appointment date if available */}
                            {(selectedImage as any).appointmentDate && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">Appointment Date:</label>
                                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1">
                                  {((selectedImage as any).appointmentDate as Date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Description Section */}
                        <div>
                          <label className="text-sm font-medium text-gray-600">Description:</label>
                          <div className="mt-1">
                            {selectedImage.description ? (
                              <div className="bg-gray-50 p-3 rounded border">
                                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                  {selectedImage.description}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded border">
                                No description provided
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Technical Details Section */}
                    {/* <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                          <Activity className="h-5 w-5 mr-2 text-green-600" />
                          Technical Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="font-medium text-gray-600">Download URL:</label>
                            <div className="mt-1 bg-gray-50 p-2 rounded border">
                              <p className="font-mono text-xs break-all text-gray-700">
                                {selectedImage.downloadURL}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <label className="font-medium text-gray-600">File Name in Storage:</label>
                            <div className="mt-1 bg-gray-50 p-2 rounded border">
                              <p className="font-mono text-xs break-all text-gray-700">
                                {selectedImage.fileName}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card> */}
                    
                    {/* Navigation Section (if viewing from a list) */}
                    {patientImages.length > 1 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center">
                            <Image className="h-5 w-5 mr-2 text-purple-600" />
                            Navigation
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentIndex = patientImages.findIndex(img => img.id === selectedImage.id);
                                if (currentIndex > 0) {
                                  setSelectedImage(patientImages[currentIndex - 1]);
                                }
                              }}
                              disabled={patientImages.findIndex(img => img.id === selectedImage.id) === 0}
                              className="flex items-center"
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Previous
                            </Button>
                            
                            <span className="text-sm text-gray-600">
                              Image {patientImages.findIndex(img => img.id === selectedImage.id) + 1} of {patientImages.length}
                            </span>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentIndex = patientImages.findIndex(img => img.id === selectedImage.id);
                                if (currentIndex < patientImages.length - 1) {
                                  setSelectedImage(patientImages[currentIndex + 1]);
                                }
                              }}
                              disabled={patientImages.findIndex(img => img.id === selectedImage.id) === patientImages.length - 1}
                              className="flex items-center"
                            >
                              Next
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}

        {/* Referral Letter Modal */}
        {showReferralModal && (
          <Dialog open={showReferralModal} onOpenChange={setShowReferralModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
                <DialogTitle className="flex items-center space-x-2">
                  <Send className="h-5 w-5 text-blue-600" />
                  <span>Create Referral Letter</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto px-6">
                <div className="space-y-6 pb-4">
                {/* Patient Info */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Patient Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {patientData?.name}
                      </div>
                      <div>
                        <span className="font-medium">Age:</span> {patientData?.age || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Contact:</span> {patientData?.contactNumber}
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span> {patientData?.gender || 'N/A'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Referral Doctor Search and Selection */}
                <div className="space-y-2">
                  <Label htmlFor="referralDoctorSearch" className="text-sm font-medium">
                    Search & Select Referral Doctor *
                  </Label>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="referralDoctorSearch"
                      placeholder="Search by name, specialty, hospital, or qualifications..."
                      value={referralDoctorSearchQuery}
                      onChange={(e) => setReferralDoctorSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Doctor Selection Dropdown */}
                  <div className="border rounded-md max-h-60 overflow-y-auto">
                    {filteredReferralDoctors.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {referralDoctorSearchQuery ? 'No doctors found matching your search' : 'No referral doctors available'}
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {filteredReferralDoctors.map((doctor) => (
                          <div
                            key={doctor.id}
                            onClick={() => setSelectedReferralDoctor(doctor)}
                            className={`p-3 rounded-md cursor-pointer transition-colors ${
                              selectedReferralDoctor?.id === doctor.id
                                ? 'bg-blue-100 border-2 border-blue-500'
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{doctor.name}</span>
                                {selectedReferralDoctor?.id === doctor.id && (
                                  <Check className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                              <span className="text-sm text-gray-600">{doctor.specialty}</span>
                              {doctor.hospital && (
                                <span className="text-xs text-gray-500">{doctor.hospital}</span>
                              )}
                              {doctor.qualifications && (
                                <span className="text-xs text-gray-400 mt-1">{doctor.qualifications}</span>
                              )}
                              {doctor.contactNumber && (
                                <span className="text-xs text-blue-600 mt-1">{doctor.contactNumber}</span>
                              )}
                            </div>
                          </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Referral Date */}
                <div className="space-y-2">
                  <Label htmlFor="referralDate" className="text-sm font-medium">
                    Referral Date *
                  </Label>
                  <Input
                    id="referralDate"
                    type="date"
                    value={referralDate}
                    onChange={(e) => setReferralDate(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Referral Notes */}
                <div className="space-y-2">
                  <Label htmlFor="referralNote" className="text-sm font-medium">
                    Referral Notes *
                  </Label>
                  <Textarea
                    id="referralNote"
                    value={referralNote}
                    onChange={(e) => setReferralNote(e.target.value)}
                    placeholder="Enter detailed referral notes, reason for referral, and any specific instructions..."
                    className="min-h-[150px] resize-none"
                  />
                </div>

                {/* Selected Doctor Info */}
                {selectedReferralDoctor && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-green-900 mb-2">Selected Doctor</h3>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Name:</span> {selectedReferralDoctor.name}</div>
                        <div><span className="font-medium">Specialty:</span> {selectedReferralDoctor.specialty}</div>
                        {selectedReferralDoctor.hospital && (
                          <div><span className="font-medium">Hospital:</span> {selectedReferralDoctor.hospital}</div>
                        )}
                        {selectedReferralDoctor.contactNumber && (
                          <div><span className="font-medium">Contact:</span> {selectedReferralDoctor.contactNumber}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t flex-shrink-0 px-6 pb-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReferralModal(false);
                    setReferralNote('');
                    setSelectedReferralDoctor(null);
                    setReferralDoctorSearchQuery('');
                  }}
                  disabled={creatingReferral}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateReferralLetter}
                  disabled={!selectedReferralDoctor || !referralNote.trim() || creatingReferral}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {creatingReferral ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create Referral Letter
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>

      {/* Clear Medicines Confirmation */}
      <AlertDialog
        open={clearMedicineDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            cancelClearMedicines();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeading>
            <AlertDialogTitle>
              {clearMedicineDialog.source === 'inventory' ? 'Clear inventory medicines?' : 'Clear written medicines?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {clearMedicineDialog.source === 'inventory' ? 'inventory' : 'written'} medicines currently listed in this prescription.
              You can add them again later or load a template if needed.
            </AlertDialogDescription>
          </AlertDialogHeading>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelClearMedicines}>
              Keep Medicines
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearMedicines}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear List
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Medicine Templates Manager */}
      <Dialog open={templateManagerOpen} onOpenChange={setTemplateManagerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Medicine Templates
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Save frequently used combinations of inventory and written medicines and reuse them in future prescriptions.
            </p>
          </DialogHeader>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm text-gray-600">
              {medicineTemplates.length} template{medicineTemplates.length === 1 ? '' : 's'} saved
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openTemplateModal('create')}
                className="hover:bg-green-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save current list
              </Button>
            </div>
          </div>

          {medicineTemplates.length === 0 ? (
            <div className="text-center border-2 border-dashed border-green-200 rounded-lg p-10 bg-green-50/40">
              <div className="p-3 bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Pill className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-base font-semibold text-gray-800 mb-2">No templates yet</p>
              <p className="text-sm text-gray-600 mb-4">
                Create your first template by adding medicines to a prescription and clicking &ldquo;Save Template&rdquo;.
              </p>
              <Button type="button" onClick={() => openTemplateModal('create')} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create template from current list
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {medicineTemplates.map((template) => {
                const isApplying = applyingTemplateId === (template.id || null);
                const isDeleting = deletingTemplateId === template.id;
                return (
                  <div
                    key={template.id || template.name}
                    className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900">{template.name}</h3>
                            {!template.isActive && (
                              <Badge variant="destructive" className="text-[10px] uppercase tracking-wide">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Package className="h-3.5 w-3.5 text-blue-500" />
                              {template.inventoryMedicines?.length || 0} inventory
                            </span>
                            <span className="flex items-center gap-1">
                              <Edit3 className="h-3.5 w-3.5 text-green-500" />
                              {template.writtenMedicines?.length || 0} written
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApplyTemplate(template, 'append')}
                            disabled={isApplying}
                          >
                            {isApplying ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5 mr-2" />
                                Add to list
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyTemplate(template, 'replace')}
                            disabled={isApplying}
                          >
                            {isApplying ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                Replacing...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="h-3.5 w-3.5 mr-2" />
                                Replace current
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openTemplateModal('edit', template)}
                          >
                            <Edit3 className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Create / Edit Modal */}
      <Dialog
        open={templateModalOpen}
        onOpenChange={(open) => {
          setTemplateModalOpen(open);
          if (!open) {
            resetTemplateForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-green-600" />
              {templateModalMode === 'create' ? 'Save medicine template' : 'Update medicine template'}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              {templateModalMode === 'create'
                ? 'We will capture the current inventory and written medicine lists.'
                : 'Update the template details. Enable the switch below to replace the stored medicines.'}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template name *</Label>
              <Input
                id="template-name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Hypertension starter pack"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional short note"
                rows={3}
              />
            </div>

            <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-900 space-y-2">
              <div className="flex flex-wrap gap-4">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-700" />
                  <strong>{inventoryMedicineCount}</strong> inventory medicine{inventoryMedicineCount === 1 ? '' : 's'}
                </span>
                <span className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-green-700" />
                  <strong>{writtenMedicineCount}</strong> written medicine{writtenMedicineCount === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-green-800">
                Only medicines with a name will be included. Dose, frequency, days, quantity and instructions are saved as part of the template.
              </p>
            </div>

            {templateModalMode === 'edit' && (
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                <Switch
                  id="replace-template-medicines"
                  checked={replaceTemplateMedicines}
                  onCheckedChange={setReplaceTemplateMedicines}
                />
                <div>
                  <Label htmlFor="replace-template-medicines" className="text-sm font-semibold text-gray-800">
                    Replace saved medicines
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    When enabled, the template will be overwritten with your current medicine list. Keep it off to update only the name or description.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTemplateModalOpen(false);
                resetTemplateForm();
              }}
              disabled={savingTemplate}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveTemplate}
              disabled={savingTemplate}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {savingTemplate ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {templateModalMode === 'create' ? 'Save Template' : 'Update Template'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dose/Frequency Selection Modal */}
      <Dialog open={showDoseFrequencyModal} onOpenChange={(open) => {
        if (!open) {
          closeDoseFrequencyModal();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Select {doseFrequencyModalData?.type === 'dose' ? 'Dose' : 'Frequency'}
            </DialogTitle>
            {doseFrequencyModalData?.currentValue && (
              <p className="text-sm text-gray-500 mt-1">
                Current: <span className="font-medium text-blue-600">{doseFrequencyModalData.currentValue}</span>
              </p>
            )}
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {doseFrequencyModalData?.type === 'dose' ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Tablets
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {doseOptions.filter(d => d.includes('tab')).map((dose) => {
                      const isSelected = doseFrequencyModalData?.currentValue === dose;
                      return (
                        <Button
                          key={dose}
                          type="button"
                          onClick={() => handleDoseFrequencySelect(dose)}
                          className={`h-10 text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-700'
                              : 'bg-white hover:bg-blue-50 text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {dose}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Liquid (ml)
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {doseOptions.filter(d => d.includes('ml')).map((dose) => {
                      const isSelected = doseFrequencyModalData?.currentValue === dose;
                      return (
                        <Button
                          key={dose}
                          type="button"
                          onClick={() => handleDoseFrequencySelect(dose)}
                          className={`h-10 text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-700'
                              : 'bg-white hover:bg-green-50 text-gray-700 border-2 border-gray-200 hover:border-green-300'
                          }`}
                        >
                          {dose}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    Puffs
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {doseOptions.filter(d => d.includes('puff')).map((dose) => {
                      const isSelected = doseFrequencyModalData?.currentValue === dose;
                      return (
                        <Button
                          key={dose}
                          type="button"
                          onClick={() => handleDoseFrequencySelect(dose)}
                          className={`h-10 text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-700'
                              : 'bg-white hover:bg-purple-50 text-gray-700 border-2 border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          {dose}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    Other
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {doseOptions.filter(d => !d.includes('tab') && !d.includes('ml') && !d.includes('puff')).map((dose) => {
                      const isSelected = doseFrequencyModalData?.currentValue === dose;
                      return (
                        <Button
                          key={dose}
                          type="button"
                          onClick={() => handleDoseFrequencySelect(dose)}
                          className={`h-10 text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-700'
                              : 'bg-white hover:bg-orange-50 text-gray-700 border-2 border-gray-200 hover:border-orange-300'
                          }`}
                        >
                          {dose}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {frequencyOptions.map((freq) => {
                    const isSelected = doseFrequencyModalData?.currentValue === freq;
                    return (
                      <Button
                        key={freq}
                        type="button"
                        onClick={() => handleDoseFrequencySelect(freq)}
                        className={`h-14 text-sm font-medium whitespace-normal transition-all duration-200 ${
                          isSelected
                            ? 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-700'
                            : 'bg-white hover:bg-blue-50 text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {freq}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={closeDoseFrequencyModal}
              className="hover:bg-gray-100"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create New Procedure Modal */}
      <Dialog open={showCreateProcedureModal} onOpenChange={setShowCreateProcedureModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5 text-purple-600" />
              <span>Create New Procedure</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="procedure-name">Procedure Name *</Label>
              <Input
                id="procedure-name"
                value={newProcedureData.name}
                onChange={(e) => setNewProcedureData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter procedure name"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor-charge">Doctor Charge (Rs.) *</Label>
              <Input
                id="doctor-charge"
                type="number"
                min="0.01"
                step="0.01"
                value={newProcedureData.doctorCharge || ''}
                onChange={(e) => setNewProcedureData(prev => ({ 
                  ...prev, 
                  doctorCharge: parseFloat(e.target.value) || 0 
                }))}
                placeholder="0.00"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedure-description">Description (Optional)</Label>
              <Textarea
                id="procedure-description"
                value={newProcedureData.description}
                onChange={(e) => setNewProcedureData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter procedure description"
                rows={3}
                className="w-full"
              />
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-700">
                <strong>Note:</strong> This procedure will be saved and available for future prescriptions.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateProcedureModal(false);
                setCreatingProcedureForIndex(null);
                setNewProcedureData({
                  name: '',
                  doctorCharge: 0,
                  description: ''
                });
              }}
              disabled={creatingProcedure}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateNewProcedure}
              disabled={creatingProcedure || !newProcedureData.name.trim() || newProcedureData.doctorCharge <= 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {creatingProcedure ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create & Add
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prescription Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={(open) => {
        setShowPreviewModal(open);
        if (!open) {
          // Reset zoom and position when closing
          setPreviewZoom(1);
          setPreviewPosition({ x: 0, y: 0 });
          // Keep previewingPrescriptionId so user can reopen and continue previewing the same prescription
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Prescription Preview
                {(() => {
                  const previewPrescription = previewingPrescriptionId && previewingPrescriptionId !== 'appointment-original' && !previewingPrescriptionId.startsWith('temp-')
                    ? allPrescriptions.find(p => p.id === previewingPrescriptionId)
                    : null;
                  const patientName = previewPrescription?.patientName || 
                    (previewingPrescriptionId === 'appointment-original' ? appointment.patientName : 
                    (previewingPrescriptionId?.startsWith('temp-') ? 'New Patient' : 'Current Patient'));
                  return (
                    <span className="text-sm text-gray-600 font-normal ml-2">
                      - {patientName}
                    </span>
                  );
                })()}
                <span className="text-xs text-gray-500 font-normal ml-2">
                  (Use + / - keys to zoom)
                </span>
              </DialogTitle>
              <div className="flex items-center gap-3">
                <Tabs value={previewType} onValueChange={(value) => setPreviewType(value as 'full' | 'inventory' | 'written')}>
                  <TabsList>
                    <TabsTrigger value="full">Full</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    <TabsTrigger value="written">Written</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewZoom(prev => Math.max(0.5, prev - 0.1))}
                    className="h-8 w-8 p-0"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[3rem] text-center">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewZoom(prev => Math.min(2, prev + 0.1))}
                    className="h-8 w-8 p-0"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewZoom(1);
                      setPreviewPosition({ x: 0, y: 0 });
                    }}
                    className="h-8 w-8 p-0 ml-1"
                    title="Reset Zoom & Position"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Print Buttons */}
                <div className="flex items-center gap-2 border rounded-lg p-1 bg-blue-50">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePrintPrescription('full')}
                    disabled={printing !== null}
                    className="h-8 px-3 text-xs"
                    title="Print Full Prescription"
                  >
                    {printing === 'full' ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Printer className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Full
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePrintPrescription('inventory')}
                    disabled={printing !== null}
                    className="h-8 px-3 text-xs"
                    title="Print Inventory Medicines Only"
                  >
                    {printing === 'inventory' ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Printer className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Inventory
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePrintPrescription('written')}
                    disabled={printing !== null}
                    className="h-8 px-3 text-xs"
                    title="Print Written Medicines Only"
                  >
                    {printing === 'written' ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Printer className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Written
                  </Button>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <div 
            className="relative overflow-auto max-h-[calc(90vh-120px)] bg-gray-50 cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              if (e.button === 0) { // Left mouse button
                setIsDragging(true);
                setDragStart({
                  x: e.clientX - previewPosition.x,
                  y: e.clientY - previewPosition.y
                });
              }
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                setPreviewPosition({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y
                });
              }
            }}
            onMouseUp={() => {
              setIsDragging(false);
            }}
            onMouseLeave={() => {
              setIsDragging(false);
            }}
          >
            <div 
              className="flex items-center justify-center p-6 min-h-full"
              style={{
                transform: `translate(${previewPosition.x}px, ${previewPosition.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              <PrescriptionPreviewContent
                appointment={appointment}
                prescription={buildPrescriptionForPreview(previewingPrescriptionId)}
                previewType={previewType}
                zoom={previewZoom}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
    </>
  );
}

// Prescription Preview Content Component
function PrescriptionPreviewContent({ 
  appointment, 
  prescription, 
  previewType,
  zoom = 1
}: { 
  appointment: Appointment; 
  prescription: Prescription; 
  previewType: 'full' | 'inventory' | 'written';
  zoom?: number;
}) {
  // Filter medicines based on preview type
  let displayMedicines: Medicine[] = [];
  if (previewType === 'full') {
    displayMedicines = prescription.medicines || [];
  } else if (previewType === 'inventory') {
    displayMedicines = (prescription.medicines || []).filter(med => med.source === 'inventory');
  } else if (previewType === 'written') {
    displayMedicines = (prescription.medicines || []).filter(med => med.source === 'written');
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Use the prescription print service to generate the HTML content
  let previewContent = '';
  if (previewType === 'full') {
    previewContent = prescriptionPrintService.generateFullPrescriptionContent(appointment, prescription);
  } else if (previewType === 'written') {
    previewContent = prescriptionPrintService.generateWrittenMedicinesContent(appointment, prescription, displayMedicines);
  } else {
    // For inventory, create a modified prescription with only inventory medicines
    const inventoryPrescription: Prescription = {
      ...prescription,
      medicines: displayMedicines
    };
    previewContent = prescriptionPrintService.generateFullPrescriptionContent(appointment, inventoryPrescription);
  }

  return (
    <div className="prescription-preview-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div 
        dangerouslySetInnerHTML={{ __html: previewContent }}
        className="prescription-preview-content"
        style={{
          width: '14.5cm',
          minHeight: '16cm',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s ease-out',
          display: 'block',
          margin: '0 auto'
        }}
      />
    </div>
  );
}