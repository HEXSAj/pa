// src/app/dashboard/pos/EnhancedLocalPatientPOS.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ShoppingCart, 
  User, 
  Phone, 
  DollarSign,
  Stethoscope,
  TestTube,
  Pill,
  Calculator,
  Save,
  X,
  Loader2,
  Package2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { procedureService } from '@/services/procedureService';
import { labTestService } from '@/services/labTestService';
import { labService } from '@/services/labService';
import { saleService } from '@/services/saleService';
import { Procedure } from '@/types/procedure';
import { LabTest } from '@/types/labTest';
import { Lab } from '@/types/lab';
import { InventoryItem } from '@/types/inventory';
import { BatchWithDetails } from '@/types/purchase';
import { SaleItem } from '@/types/sale';
import { EnhancedPOSItemSearch } from './EnhancedPOSItemSearch';
import { BatchSelector } from './BatchSelector';
import { QuantityInput } from './QuantityInput';
import { purchaseService } from '@/services/purchaseService';
import { inventoryService } from '@/services/inventoryService';
import { LocalPatientPaymentMethodModal } from './LocalPatientPaymentMethodModal';
import { useAuth } from '@/context/AuthContext';
import { staffService } from '@/services/staffService';
import { posReceiptService } from '@/services/posReceiptService';
import { appointmentService } from '@/services/appointmentService';
import { prescriptionService } from '@/services/prescriptionService';
import { AppointmentProcedure } from '@/types/appointment';

// ... (rest of the imports and type definitions remain the same)


interface LocalPatientData {
  name: string;
  phone: string;
}

interface SelectedProcedure extends Procedure {
  quantity: number;
  total: number;
}

interface SelectedLabTest extends LabTest {
  quantity: number;
  total: number;
  invNo?: string;
}

interface LocalPatientPOSProps {
  onBack: () => void;
  prescriptionData?: any; 
}


interface ExtendedSaleItem extends SaleItem {
  prescriptionInfo?: {
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  };
  isAppointmentProcedure?: boolean;
  appointmentProcedureId?: string;
}

export const EnhancedLocalPatientPOS: React.FC<LocalPatientPOSProps> = ({ onBack,prescriptionData  }) => {
  // ... (all state and logic remains exactly the same)

   const { toast } = useToast();
   const { user } = useAuth(); 
  
  // Patient Information
  const [patientData, setPatientData] = useState<LocalPatientData>({
    name: '',
    phone: ''
  });


  // Procedures
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<SelectedProcedure[]>([]);
  const [showProceduresModal, setShowProceduresModal] = useState(false);
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('');

  // Appointment Procedures (from appointment)
  const [appointmentProcedures, setAppointmentProcedures] = useState<AppointmentProcedure[]>([]);

  // Manual Appointment Amount (replaces appointment procedures)
  const [manualAppointmentAmount, setManualAppointmentAmount] = useState<number>(0);
  const [filteredProcedures, setFilteredProcedures] = useState<Procedure[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState(false);

  // Lab Tests
  const [labs, setLabs] = useState<Lab[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedLabTests, setSelectedLabTests] = useState<SelectedLabTest[]>([]);
  const [showLabTestsModal, setShowLabTestsModal] = useState(false);
  const [labTestSearchTerm, setLabTestSearchTerm] = useState('');
  const [filteredLabTests, setFilteredLabTests] = useState<LabTest[]>([]);
  const [loadingLabTests, setLoadingLabTests] = useState(false);

  // Pharmacy
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemBatches, setItemBatches] = useState<BatchWithDetails[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchWithDetails | null>(null);
  const [pharmacyItems, setPharmacyItems] = useState<ExtendedSaleItem[]>([]);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isPharmacyReviewed, setIsPharmacyReviewed] = useState(false);

  const unitQtyInputRef = useRef<HTMLInputElement>(null);
  const subUnitQtyInputRef = useRef<HTMLInputElement>(null);

  const [isPrescriptionSession, setIsPrescriptionSession] = useState(false);

  // Saving
  const [isSaving, setIsSaving] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    method: 'cash' | 'card';
    receivedAmount?: number;
    changeAmount?: number;
    cardNumber?: string;
  } | null>(null);

  // Rounding options
  const [selectedRounding, setSelectedRounding] = useState<'20' | '10' | '50' | 'none'>('50');

  // Calculator modal state
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorPosition, setCalculatorPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Calculator state
  const [calculatorDisplay, setCalculatorDisplay] = useState('0');
  const [calculatorPreviousValue, setCalculatorPreviousValue] = useState<number | null>(null);
  const [calculatorOperation, setCalculatorOperation] = useState<string | null>(null);
  const [calculatorWaitingForOperand, setCalculatorWaitingForOperand] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [proceduresData, labsData, labTestsData, inventoryData] = await Promise.all([
        procedureService.getAll(),
        labService.getAll(),
        labTestService.getAll(),
        inventoryService.getAll()
      ]);

      setProcedures(proceduresData.filter(p => p.isActive));
      setLabs(labsData.filter(l => l.isActive));
      setLabTests(labTestsData.filter(t => t.isActive));
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive",
      });
    }
  };



// useEffect(() => {
//   const loadPrescriptionData = async () => {
//     // Check for prescription data from props first
//     let dataToProcess = prescriptionData;
    
//     // If no props data, check localStorage
//     if (!dataToProcess && typeof window !== 'undefined') {
//       const storedData = localStorage.getItem('prescriptionPOSData');
//       if (storedData) {
//         try {
//           dataToProcess = JSON.parse(storedData);
//           // Clear the stored data after using it
//           localStorage.removeItem('prescriptionPOSData');
//         } catch (error) {
//           console.error('Error parsing prescription data from localStorage:', error);
//           localStorage.removeItem('prescriptionPOSData');
//         }
//       }
//     }

//     // Process prescription data if available
//     if (dataToProcess) {
//       // Auto-fill patient information
//       setPatientData({
//         name: dataToProcess.patientName || '',
//         phone: dataToProcess.patientPhone || ''
//       });

//       // Load prescription medicines to pharmacy cart
//       if (dataToProcess.prescriptionItems && dataToProcess.prescriptionItems.length > 0) {
//         const prescriptionPharmacyItems: ExtendedSaleItem[] = dataToProcess.prescriptionItems.map((item: any) => {
//           const bestBatch = item.availableBatches.length > 0 ? 
//             item.availableBatches[0] : null;
          
//           if (bestBatch && item.inventoryItem) {
//             // Ensure unitContains and subUnitContains have default values
//             const inventoryItem = {
//               ...item.inventoryItem,
//               unitContains: item.inventoryItem.unitContains || { name: 'units', value: 1 },
//               subUnitContains: item.inventoryItem.subUnitContains || { name: 'sub-units', value: 1 }
//             };

//             return {
//               itemId: inventoryItem.id!,
//               item: inventoryItem,
//               batchId: bestBatch.id!,
//               batch: bestBatch,
//               unitQuantity: 1,
//               subUnitQuantity: 0,
//               unitPrice: bestBatch.unitPrice || 0,
//               subUnitPrice: (bestBatch.unitPrice || 0) / (inventoryItem.unitContains?.value || 1),
//               totalPrice: bestBatch.unitPrice || 0,
//               totalCost: bestBatch.costPrice || 0,
//               discountPercentage: 0,
//               fromFreeItemBatch: bestBatch.isFreeItem || false,
//               prescriptionInfo: {
//                 dosage: item.prescriptionDosage || '',
//                 frequency: item.prescriptionFrequency || '',
//                 duration: item.prescriptionDuration || '',
//                 instructions: item.prescriptionInstructions || ''
//               }
//             };
//           }
//           return null;
//         }).filter(Boolean);

//         setPharmacyItems(prescriptionPharmacyItems);
//         setIsPrescriptionSession(true);
        
//         // Auto-open pharmacy modal after a short delay
//         setTimeout(() => {
//           setShowPharmacyModal(true);
//         }, 500);
        
//         toast({
//           title: "Prescription Loaded",
//           description: `${prescriptionPharmacyItems.length} medicines loaded from prescription. Pharmacy opened automatically.`,
//           variant: "default",
//         });
//       }
//     }
//   };

//   // Load prescription data when component mounts or prescriptionData changes
//   loadPrescriptionData();
// }, [prescriptionData]);


useEffect(() => {
  const loadPrescriptionData = async () => {
    // Check for prescription data from props first
    let dataToProcess = prescriptionData;
    
    // If no props data, check localStorage
    if (!dataToProcess && typeof window !== 'undefined') {
      const storedData = localStorage.getItem('prescriptionPOSData');
      if (storedData) {
        try {
          dataToProcess = JSON.parse(storedData);
          // Clear the stored data after using it
          localStorage.removeItem('prescriptionPOSData');
        } catch (error) {
          console.error('Error parsing prescription data from localStorage:', error);
          localStorage.removeItem('prescriptionPOSData');
        }
      }
    }

    // Process prescription data if available
    if (dataToProcess) {
      // Auto-fill patient information
      setPatientData({
        name: dataToProcess.patientName || '',
        phone: dataToProcess.patientPhone || ''
      });

      // Set prescription session if appointment exists (even without medicines)
      if (dataToProcess.appointment) {
        setIsPrescriptionSession(true);
      }

      // Handle manual appointment amount if available
      if (dataToProcess.manualAppointmentAmount && dataToProcess.manualAppointmentAmount > 0) {
        console.log('Processing manual appointment amount:', dataToProcess.manualAppointmentAmount);
        setManualAppointmentAmount(dataToProcess.manualAppointmentAmount);
        
        // Show success message
        toast({
          title: "Appointment Amount Loaded",
          description: `Appointment amount Rs. ${dataToProcess.manualAppointmentAmount.toFixed(2)} added to POS`,
          variant: "default",
        });
      }

      // Load appointment procedures if available (from appointmentProcedures or from appointment object)
      const proceduresToLoad = dataToProcess.appointmentProcedures || dataToProcess.appointment?.procedures || [];
      if (proceduresToLoad.length > 0) {
        console.log('Processing appointment procedures:', proceduresToLoad);
        setAppointmentProcedures(proceduresToLoad);
        
        // Show success message
        toast({
          title: "Doctor Procedures Loaded",
          description: `${proceduresToLoad.length} procedure(s) from appointment loaded to POS`,
          variant: "default",
        });
      }

      // Load prescription medicines to pharmacy cart
      if (dataToProcess.prescriptionItems && dataToProcess.prescriptionItems.length > 0) {
        const prescriptionPharmacyItems: ExtendedSaleItem[] = dataToProcess.prescriptionItems.map((item: any) => {
          const bestBatch = item.availableBatches.length > 0 ? item.availableBatches[0] : null;
          
          if (bestBatch && item.inventoryItem) {
            // Ensure unitContains and subUnitContains have default values
            const inventoryItem = {
              ...item.inventoryItem,
              unitContains: item.inventoryItem.unitContains || { name: 'units', value: 1 },
              subUnitContains: item.inventoryItem.subUnitContains || { name: 'sub-units', value: 1 }
            };

            // Use requested quantities from LoadPrescriptionToPOSButton
            const unitQuantity = item.requestedUnitQuantity || 1;
            const subUnitQuantity = item.requestedSubUnitQuantity || 0;

            // Calculate prices based on quantities
            const unitPrice = bestBatch.unitPrice || 0;
            const subUnitPrice = (bestBatch.unitPrice || 0) / (inventoryItem.unitContains?.value || 1);
            
            // Calculate total price based on both unit and sub-unit quantities
            const totalPrice = (unitQuantity * unitPrice) + (subUnitQuantity * subUnitPrice);
            
            // Calculate total cost based on both unit and sub-unit quantities
            const unitCostPrice = bestBatch.costPrice || 0;
            const subUnitCostPrice = unitCostPrice / (inventoryItem.unitContains?.value || 1);
            const totalCost = (unitQuantity * unitCostPrice) + (subUnitQuantity * subUnitCostPrice);

            return {
              itemId: inventoryItem.id!,
              item: inventoryItem,
              batchId: bestBatch.id!,
              batch: bestBatch,
              unitQuantity: unitQuantity,
              subUnitQuantity: subUnitQuantity,
              unitPrice: unitPrice,
              subUnitPrice: subUnitPrice,
              totalPrice: totalPrice,
              totalCost: totalCost,
              discountPercentage: 0,
              fromFreeItemBatch: bestBatch.isFreeItem || false,
              prescriptionInfo: {
                dosage: item.medicine.dosage || '',
                frequency: item.medicine.frequency || '',
                duration: item.medicine.duration || '',
                instructions: item.medicine.instructions || ''
              }
            };
          }
          return null;
        }).filter(Boolean);

        setPharmacyItems(prescriptionPharmacyItems);
        setIsPrescriptionSession(true);
        
        // Set pharmacy reviewed status
        if (dataToProcess.pharmacyReviewStatus === 'reviewed') {
          setIsPharmacyReviewed(true);
        }
        
        // Auto-open pharmacy modal after a short delay
        setTimeout(() => {
          setShowPharmacyModal(true);
        }, 500);
        
        // Check if this is from pharmacy review
        if (dataToProcess.pharmacyReviewStatus === 'reviewed') {
          toast({
            title: "Pharmacy Reviewed Prescription Loaded",
            description: `${prescriptionPharmacyItems.length} medicines reviewed by pharmacy and loaded to POS.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Prescription Loaded",
            description: `${prescriptionPharmacyItems.length} medicines loaded from prescription with custom quantities.`,
            variant: "default",
          });
        }
      }
    }
  };

  // Load prescription data when component mounts or prescriptionData changes
  loadPrescriptionData();
}, [prescriptionData]);
  
  useEffect(() => {
    if (procedureSearchTerm) {
      const filtered = procedures.filter(procedure =>
        procedure.name.toLowerCase().includes(procedureSearchTerm.toLowerCase()) ||
        procedure.category?.toLowerCase().includes(procedureSearchTerm.toLowerCase())
      );
      setFilteredProcedures(filtered);
    } else {
      setFilteredProcedures(procedures);
    }
  }, [procedureSearchTerm, procedures]);

  // Filter lab tests based on search
  useEffect(() => {
    if (labTestSearchTerm) {
      const filtered = labTests.filter(test =>
        test.name.toLowerCase().includes(labTestSearchTerm.toLowerCase()) ||
        test.labName?.toLowerCase().includes(labTestSearchTerm.toLowerCase())
      );
      setFilteredLabTests(filtered);
    } else {
      setFilteredLabTests(labTests);
    }
  }, [labTestSearchTerm, labTests]);

  // Calculate totals
  const proceduresTotal = selectedProcedures.reduce((sum, proc) => sum + proc.total, 0);
  const appointmentProceduresTotal = appointmentProcedures.reduce((sum, proc) => sum + proc.doctorCharge, 0);
  const labTestsTotal = selectedLabTests.reduce((sum, test) => sum + test.total, 0);
  const pharmacyTotal = pharmacyItems.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Check if appointment is already paid in appointments section
  const isAppointmentAlreadyPaid = prescriptionData?.appointment?.payment?.isPaid && 
    prescriptionData?.appointment?.payment?.paidInAppointments;
  
  // Calculate original total (before rounding)
  const originalTotal = isAppointmentAlreadyPaid 
    ? proceduresTotal + appointmentProceduresTotal + labTestsTotal + pharmacyTotal  // Exclude appointment amount from bill
    : proceduresTotal + appointmentProceduresTotal + manualAppointmentAmount + labTestsTotal + pharmacyTotal; // Include all in bill
  
  // Calculate rounding based on selected option
  const calculateRoundedTotal = (total: number, rounding: '20' | '10' | '50' | 'none'): number => {
    if (rounding === 'none') {
      return total;
    }
    const roundTo = parseInt(rounding);
    return Math.ceil(total / roundTo) * roundTo;
  };
  
  const roundedTotal = calculateRoundedTotal(originalTotal, selectedRounding);
  
  // Calculate the rounding adjustment amount
  const roundingAdjustmentAmount = roundedTotal - originalTotal;
  
  // Debug logging
  console.log('POS Payment Logic Debug:', {
    isAppointmentAlreadyPaid,
    appointmentPayment: prescriptionData?.appointment?.payment,
    manualAppointmentAmount,
    proceduresTotal,
    appointmentProceduresTotal,
    labTestsTotal,
    pharmacyTotal,
    originalTotal,
    roundedTotal,
    roundingAdjustmentAmount
  });
  
  // For bill total: use rounded total (this is what customer pays)
  const billTotal = roundedTotal;
  
  // For receipt total: use rounded total (this is what appears on receipt)
  const receiptTotal = roundedTotal;
  
  // Grand total for payment processing
  const grandTotal = billTotal;
  
  // Debug logging for totals
  console.log('POS Totals Debug:', {
    billTotal,
    receiptTotal,
    grandTotal,
    isAppointmentAlreadyPaid,
    manualAppointmentAmount,
    proceduresTotal,
    labTestsTotal,
    pharmacyTotal
  });

  // Procedure functions
  const handleAddProcedure = (procedure: Procedure) => {
    const existingIndex = selectedProcedures.findIndex(p => p.id === procedure.id);
    
    if (existingIndex >= 0) {
      // Increase quantity
      const updated = [...selectedProcedures];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * procedure.charge;
      setSelectedProcedures(updated);
    } else {
      // Add new procedure
      const newProcedure: SelectedProcedure = {
        ...procedure,
        quantity: 1,
        total: procedure.charge
      };
      setSelectedProcedures([...selectedProcedures, newProcedure]);
    }

    toast({
      title: "Procedure Added",
      description: `${procedure.name} added to the list`,
      variant: "default",
    });
  };

  const handleRemoveProcedure = (procedureId: string) => {
    setSelectedProcedures(selectedProcedures.filter(p => p.id !== procedureId));
  };

  const handleRemoveManualAppointmentAmount = () => {
    setManualAppointmentAmount(0);
  };

  const handleUpdateProcedureQuantity = (procedureId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveProcedure(procedureId);
      return;
    }

    const updated = selectedProcedures.map(proc => {
      if (proc.id === procedureId) {
        return {
          ...proc,
          quantity,
          total: quantity * proc.charge
        };
      }
      return proc;
    });
    setSelectedProcedures(updated);
  };

  // Lab test functions
  const handleAddLabTest = (labTest: LabTest) => {
    const existingIndex = selectedLabTests.findIndex(t => t.id === labTest.id);
    
    if (existingIndex >= 0) {
      // Increase quantity
      const updated = [...selectedLabTests];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * labTest.price;
      setSelectedLabTests(updated);
    } else {
      // Add new lab test
      const newLabTest: SelectedLabTest = {
        ...labTest,
        quantity: 1,
        total: labTest.price,
        invNo: '' // Initialize empty INV No
      };
      setSelectedLabTests([...selectedLabTests, newLabTest]);
    }

    toast({
      title: "Lab Test Added",
      description: `${labTest.name} added to the list`,
      variant: "default",
    });
  };

  const handleUpdateLabTestInvNo = (testId: string, invNo: string) => {
    const updated = selectedLabTests.map(test => {
      if (test.id === testId) {
        return {
          ...test,
          invNo
        };
      }
      return test;
    });
    setSelectedLabTests(updated);
  };

  const handleRemoveLabTest = (testId: string) => {
    setSelectedLabTests(selectedLabTests.filter(t => t.id !== testId));
  };

  const handleUpdateLabTestQuantity = (testId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveLabTest(testId);
      return;
    }

    const updated = selectedLabTests.map(test => {
      if (test.id === testId) {
        return {
          ...test,
          quantity,
          total: quantity * test.price
        };
      }
      return test;
    });
    setSelectedLabTests(updated);
  };
  
  // Pharmacy functions
  const handleItemSelect = async (item: InventoryItem) => {
    setSelectedItem(item);
    setSelectedBatch(null);
    setIsLoadingBatches(true);

    try {
      const batches = await purchaseService.getBatchesByItem(item.id);
      const today = new Date();
      
      const validBatches = batches.filter(batch => 
        batch.quantity > 0 && new Date(batch.expiryDate) > today
      );
      
      setItemBatches(validBatches);
    } catch (error) {
      console.error('Error loading batches:', error);
      toast({
        title: "Error",
        description: "Failed to load item batches",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const handleAddToPharmacyCart = (unitQty: number, subUnitQty: number, discountPercentage = 0, adjustedUnitPrice?: number, adjustedSubUnitPrice?: number) => {
    if (!selectedItem || !selectedBatch) return;

    // If both quantities are 0, set unit quantity to 1 to prevent empty entries
    if (unitQty === 0 && subUnitQty === 0) {
      unitQty = 1;
    }

    const unitPrice = adjustedUnitPrice || selectedBatch.unitPrice || 0;
    
    // The cost is stored as 'costPrice' in the batch, not 'unitCost'
    const costPrice = selectedBatch.costPrice || 0;
    
    console.log('Batch data for cost calculation:', {
      batchId: selectedBatch.id,
      batchNumber: selectedBatch.batchNumber,
      costPrice: selectedBatch.costPrice,
      unitPrice: selectedBatch.unitPrice,
      finalCostPrice: costPrice
    });
    
    // Calculate the default sub-unit price based on unit price
    const defaultSubUnitPrice = selectedItem.unitContains 
      ? unitPrice / selectedItem.unitContains.value 
      : 0;
    
    // Use adjusted sub-unit price if provided, otherwise use calculated default
    const subUnitPrice = adjustedSubUnitPrice !== undefined 
      ? adjustedSubUnitPrice 
      : defaultSubUnitPrice;
    
    const totalBeforeDiscount = (unitQty * unitPrice) + (subUnitQty * subUnitPrice);
    const discountAmount = totalBeforeDiscount * (discountPercentage / 100);
    const totalPrice = totalBeforeDiscount - discountAmount;
    
    // Calculate total cost using the correct costPrice field
    let totalCost = 0;
    if (costPrice > 0) {
      const subUnitCostPrice = selectedItem.unitContains?.value 
        ? costPrice / selectedItem.unitContains.value 
        : costPrice;
      
      totalCost = (unitQty * costPrice) + (subUnitQty * subUnitCostPrice);
    } else {
      console.warn('No cost price found for batch:', selectedBatch.id, 'Item:', selectedItem.name);
      totalCost = 0;
    }

    console.log('Cost calculation result:', {
      unitQty,
      subUnitQty,
      costPrice,
      totalCost,
      unitPrice,
      totalPrice
    });

    const cartItem: SaleItem = {
      itemId: selectedItem.id!,
      item: selectedItem,
      batchId: selectedBatch.id!,
      batch: selectedBatch,
      unitQuantity: unitQty,
      subUnitQuantity: subUnitQty,
      unitPrice,
      subUnitPrice,
      totalPrice,
      totalCost,
      itemDiscountPercentage: discountPercentage,
      itemDiscount: discountAmount,
      isPriceAdjusted: adjustedUnitPrice !== undefined && adjustedUnitPrice !== selectedBatch.unitPrice,
      originalUnitPrice: selectedBatch.unitPrice,
      isSubUnitPriceAdjusted: adjustedSubUnitPrice !== undefined,
      originalSubUnitPrice: selectedItem.unitContains ? 
        (selectedBatch.unitPrice || 0) / selectedItem.unitContains.value : 0,
      fromFreeItemBatch: selectedBatch.isFreeItem
    };

    setPharmacyItems([...pharmacyItems, cartItem]);
    
    // Clear selections after adding
    setSelectedItem(null);
    setSelectedBatch(null);
    setItemBatches([]);

    // Reset quantity input fields
    if (unitQtyInputRef.current) {
      unitQtyInputRef.current.value = '0';
    }
    if (subUnitQtyInputRef.current) {
      subUnitQtyInputRef.current.value = '0';
    }

    // Auto-focus back to search input after a short delay
    setTimeout(() => {
      // Try to find and focus the search input
      const searchInput = document.querySelector('[placeholder*="Search"], input[type="text"], input[type="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select(); // Also select any existing text for easy replacement
      }
    }, 100);

    toast({
      title: "Item Added",
      description: `${selectedItem.name} added to pharmacy cart`,
      variant: "default",
    });
  };

  const handleRemovePharmacyItem = (index: number) => {
    setPharmacyItems(pharmacyItems.filter((_, i) => i !== index));
  };

  const handleSaveSale = async () => {
    // Validation
    if (!patientData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Patient name is required",
        variant: "destructive",
      });
      return;
    }

    // Phone number is now optional - no validation required

    if (billTotal <= 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item to the sale",
        variant: "destructive",
      });
      return;
    }

    // NEW VALIDATION: Check if lab tests have invoice numbers
    if (selectedLabTests.length > 0) {
      const labTestsWithoutInvNo = selectedLabTests.filter(test => !test.invNo || test.invNo.trim() === '');
      if (labTestsWithoutInvNo.length > 0) {
        toast({
          title: "Validation Error",
          description: "Invoice number is required for all lab tests. Please enter invoice numbers for all lab tests before completing the sale.",
          variant: "destructive",
        });
        return;
      }
    }

    // Show payment modal instead of directly saving
    setShowPaymentModal(true);
  };

  // Calculator functions
  const handleCalculatorNumber = (number: string) => {
    if (calculatorWaitingForOperand) {
      setCalculatorDisplay(number);
      setCalculatorWaitingForOperand(false);
    } else {
      setCalculatorDisplay(calculatorDisplay === '0' ? number : calculatorDisplay + number);
    }
  };

  const handleCalculatorDecimal = () => {
    if (calculatorWaitingForOperand) {
      setCalculatorDisplay('0.');
      setCalculatorWaitingForOperand(false);
    } else if (calculatorDisplay.indexOf('.') === -1) {
      setCalculatorDisplay(calculatorDisplay + '.');
    }
  };

  const handleCalculatorOperation = (nextOperation: string) => {
    const inputValue = parseFloat(calculatorDisplay);

    if (calculatorPreviousValue === null) {
      setCalculatorPreviousValue(inputValue);
    } else if (calculatorOperation) {
      const currentValue = calculatorPreviousValue || 0;
      const newValue = calculate(currentValue, inputValue, calculatorOperation);

      setCalculatorDisplay(String(newValue));
      setCalculatorPreviousValue(newValue);
    }

    setCalculatorWaitingForOperand(true);
    setCalculatorOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const handleCalculatorEquals = () => {
    const inputValue = parseFloat(calculatorDisplay);

    if (calculatorPreviousValue !== null && calculatorOperation) {
      const newValue = calculate(calculatorPreviousValue, inputValue, calculatorOperation);
      setCalculatorDisplay(String(newValue));
      setCalculatorPreviousValue(null);
      setCalculatorOperation(null);
      setCalculatorWaitingForOperand(true);
    }
  };

  const handleCalculatorClear = () => {
    setCalculatorDisplay('0');
    setCalculatorPreviousValue(null);
    setCalculatorOperation(null);
    setCalculatorWaitingForOperand(false);
  };

  const handleCalculatorClearEntry = () => {
    setCalculatorDisplay('0');
    setCalculatorWaitingForOperand(true);
  };

  // Draggable calculator handlers
  const handleCalculatorMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the header, not from buttons or display
    const target = e.target as HTMLElement;
    if (target.closest('.calculator-content') || target.closest('button')) {
      return; // Don't drag when clicking on calculator content or buttons
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - calculatorPosition.x,
      y: e.clientY - calculatorPosition.y
    });
  };

  const handleCalculatorHeaderMouseDown = (e: React.MouseEvent) => {
    // Allow dragging from header
    setIsDragging(true);
    setDragStart({
      x: e.clientX - calculatorPosition.x,
      y: e.clientY - calculatorPosition.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setCalculatorPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handlePaymentConfirm = async (paymentInfo: {
    method: 'cash' | 'card' | 'free' | 'partial' | 'credit';
    receivedAmount?: number;
    changeAmount?: number;
    cardNumber?: string;
    initialPayment?: number;
    isPartialPayment?: boolean;
    isCredit?: boolean;
  }) => {
    setIsSaving(true);

    try {
      // Get user display name for logging
      let createdByName = 'Unknown User';
      if (user?.uid) {
        try {
          const staffUser = await staffService.getStaffById(user.uid);
          if (staffUser) {
            createdByName = staffUser.displayName || staffUser.email.split('@')[0];
          } else if (user.email) {
            createdByName = user.email.split('@')[0];
          }
        } catch (error) {
          console.log('Could not fetch staff name, using email');
          if (user.email) {
            createdByName = user.email.split('@')[0];
          }
        }
      }

      // Check if this is a free bill, partial payment, or credit
      const isFreeBill = paymentInfo.method === 'free';
      const isCredit = paymentInfo.method === 'credit' || paymentInfo.isCredit;
      const isPartialPayment = paymentInfo.method === 'partial' || paymentInfo.isPartialPayment;

      // Calculate initial payment and due amount for partial payments and credit
      let initialPaymentAmount = 0;
      let dueAmount = 0;
      let isPaid = true;
      let paymentHistory: any[] = [];

      if (isCredit) {
        // Credit payment - whole amount as credit, no initial payment
        initialPaymentAmount = 0;
        dueAmount = receiptTotal;
        isPaid = false;
        // No initial payment record for credit
        paymentHistory = [];
      } else if (isPartialPayment && paymentInfo.initialPayment !== undefined) {
        // Partial payment - has initial payment
        initialPaymentAmount = paymentInfo.initialPayment;
        dueAmount = receiptTotal - initialPaymentAmount;
        isPaid = false;
        
        // Create initial payment record only if initial payment > 0
        if (initialPaymentAmount > 0) {
          paymentHistory = [{
            amount: initialPaymentAmount,
            date: new Date(),
            paymentMethod: 'cash', // Default for initial payment, can be enhanced
            notes: 'Initial payment at time of sale',
            recordedBy: createdByName
          }];
        }
      }

      // Prepare payment details for storage - only include defined values
      const paymentDetailsForSale: any = {
        method: paymentInfo.method,
      };

      // Only add fields that have values
      if (paymentInfo.receivedAmount !== undefined) {
        paymentDetailsForSale.receivedAmount = paymentInfo.receivedAmount;
      }

      if (paymentInfo.changeAmount !== undefined) {
        paymentDetailsForSale.changeAmount = paymentInfo.changeAmount;
      }

      if (paymentInfo.cardNumber !== undefined && paymentInfo.cardNumber.trim() !== '') {
        // Store card number (already formatted as ****-****-****-XXXX)
        paymentDetailsForSale.cardNumber = paymentInfo.cardNumber;
      }

      // For free bills, add discount information
      if (isFreeBill) {
        paymentDetailsForSale.isFreeBill = true;
        paymentDetailsForSale.discountPercentage = 100;
        paymentDetailsForSale.originalAmount = receiptTotal;
        paymentDetailsForSale.discountAmount = receiptTotal;
      }

      // Prepare sale data
      const saleData = {
        customerInfo: {
          id: null,
          name: patientData.name,
          mobile: patientData.phone,
        },
        items: pharmacyItems,
        totalAmount: isFreeBill ? 0 : receiptTotal, // Use 0 for free bills, otherwise use receipt total
        originalAmount: isFreeBill ? receiptTotal : undefined, // Store original amount for free bills
        totalCost: pharmacyItems.reduce((sum, item) => sum + item.totalCost, 0),
        saleDate: new Date(),
        paymentMethod: isPartialPayment ? 'credit' : paymentInfo.method, // Use 'credit' for partial payments
        patientType: 'local' as const,
        createdBy: {
          uid: user?.uid || '',
          email: user?.email || '',
          role: 'cashier', // Default role, could be enhanced to get actual role
          displayName: createdByName
        },
        // Add payment details
        paymentDetails: paymentDetailsForSale,
        // Add free bill information
        isFreeBill: isFreeBill,
        discountPercentage: isFreeBill ? 100 : 0,
        discountAmount: isFreeBill ? receiptTotal : 0,
        // Add partial payment information
        initialPayment: isPartialPayment ? initialPaymentAmount : undefined,
        dueAmount: isPartialPayment ? dueAmount : undefined,
        isPaid: isPartialPayment ? isPaid : !isFreeBill,
        paymentHistory: isPartialPayment ? paymentHistory : undefined,
        // Add custom fields for procedures and lab tests
        procedures: selectedProcedures.map(proc => ({
          id: proc.id || '',
          name: proc.name,
          localPatientCharge: proc.charge, // Map 'charge' to 'localPatientCharge' for Sale type
          quantity: proc.quantity,
          total: proc.total
        })),
        // Add appointment procedures from doctor
        appointmentProcedures: appointmentProcedures.map(proc => ({
          procedureId: proc.procedureId,
          procedureName: proc.procedureName,
          doctorCharge: proc.doctorCharge
        })),
        appointmentProceduresTotal: appointmentProceduresTotal,
        manualAppointmentAmount: manualAppointmentAmount,
        labTests: selectedLabTests.map(test => ({
          id: test.id,
          name: test.name,
          price: test.price || 0, // Use price for local patients
          labId: test.labId, 
          labName: test.labName,
          quantity: test.quantity,
          total: test.total,
          totalLKR: test.total,
          invNo: test.invNo || '' // Include INV No
        })),
        proceduresTotal,
        appointmentProceduresTotal,
        labTestsTotal,
        pharmacyTotal,
        roundingAdjustmentAmount: roundingAdjustmentAmount, // Store the rounding adjustment
        selectedRounding: selectedRounding // Store the selected rounding option
      };

      // Create the sale and get the ID
      const saleResult = await saleService.create(saleData);
      const saleId = saleResult.id;

      // Update appointment payment if this is from a prescription session
      if (isPrescriptionSession && prescriptionData?.appointment) {
        try {
          // First, mark the individual prescription as paid
          let prescriptionMarkedAsPaid = false;
          if (prescriptionData.prescription?.id) {
            try {
              await prescriptionService.updatePrescription(prescriptionData.prescription.id, {
                isPaid: true,
                paidAt: new Date(),
                paidThroughPOS: true
              });
              prescriptionMarkedAsPaid = true;
              console.log(`Prescription ${prescriptionData.prescription.id} marked as paid`);
              
              // Small delay to ensure database consistency before checking all prescriptions
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (prescriptionError) {
              console.error('Error marking prescription as paid:', prescriptionError);
              // Don't fail the sale if prescription update fails
              // We'll skip archiving check if prescription update failed
            }
          }
          
          // Check if all prescriptions are paid before marking appointment as fully paid
          try {
            const allPrescriptions = await prescriptionService.getAllPrescriptionsByAppointmentId(prescriptionData.appointment.id);
            
            if (allPrescriptions.length === 0) {
              // No prescriptions exist - single patient appointment, mark as paid
              await appointmentService.processPOSPayment(
                prescriptionData.appointment.id,
                saleId,
                paymentInfo.method,
                paymentInfo.cardNumber ? { cardNumber: paymentInfo.cardNumber } : undefined
              );
              console.log(`Appointment ${prescriptionData.appointment.id} marked as paid through POS (single patient, no prescriptions)`);
            } else {
              // Check if ALL prescriptions are paid
              const allPaid = allPrescriptions.every(p => p.isPaid === true);
              
              if (allPaid) {
                // All patients have been paid - mark appointment as fully paid
                await appointmentService.processPOSPayment(
                  prescriptionData.appointment.id,
                  saleId,
                  paymentInfo.method,
                  paymentInfo.cardNumber ? { cardNumber: paymentInfo.cardNumber } : undefined
                );
                console.log(`Appointment ${prescriptionData.appointment.id} marked as fully paid through POS (all ${allPrescriptions.length} patients paid)`);
              } else {
                // Not all patients are paid yet - don't mark appointment as fully paid
                // Only mark individual prescription as paid (already done above)
                const paidCount = allPrescriptions.filter(p => p.isPaid === true).length;
                console.log(`Appointment ${prescriptionData.appointment.id} partially paid - ${paidCount}/${allPrescriptions.length} patients paid. Appointment remains active for remaining patients.`);
              }
            }
          } catch (checkError) {
            console.error('Error checking prescription payment status:', checkError);
            // If check fails, still mark appointment as paid to be safe (backward compatibility)
            await appointmentService.processPOSPayment(
              prescriptionData.appointment.id,
              saleId,
              paymentInfo.method,
              paymentInfo.cardNumber ? { cardNumber: paymentInfo.cardNumber } : undefined
            );
          }
          
          // Mark appointment as loaded to POS (now that sale is completed)
          if (user?.uid) {
            try {
              await appointmentService.markAppointmentLoadedToPOS(
                prescriptionData.appointment.id, 
                user.uid, 
                saleId
              );
              console.log(`Appointment ${prescriptionData.appointment.id} marked as loaded to POS after sale completion`);
            } catch (loadError) {
              console.error('Error marking appointment as loaded to POS:', loadError);
              // Don't fail the sale if marking as loaded fails
            }
          }
          
          // Check if all patients in the appointment have been paid before archiving
          // For multi-patient appointments, only archive when ALL patients are paid
          // Only proceed with archiving check if we have a prescription (multi-patient) or if there's no prescription (single patient)
          try {
            const allPrescriptions = await prescriptionService.getAllPrescriptionsByAppointmentId(prescriptionData.appointment.id);
            
            if (allPrescriptions.length === 0) {
              // No prescriptions exist yet - this is likely a single-patient appointment
              // Archive immediately since there's only one patient
              await appointmentService.archivePaidAppointment(prescriptionData.appointment.id);
              console.log(`Appointment ${prescriptionData.appointment.id} archived after payment (no prescriptions - single patient)`);
            } else if (allPrescriptions.length === 1) {
              // Only one prescription exists - check if it's paid
              const prescription = allPrescriptions[0];
              if (prescription.isPaid === true) {
                // Single patient has been paid - archive the appointment
                await appointmentService.archivePaidAppointment(prescriptionData.appointment.id);
                console.log(`Appointment ${prescriptionData.appointment.id} archived after payment (single patient paid)`);
              } else {
                console.log(`Appointment ${prescriptionData.appointment.id} not archived yet - single patient prescription not marked as paid`);
              }
            } else {
              // Multiple prescriptions exist - check if ALL are paid
              // For multi-patient appointments, we must verify ALL prescriptions are marked as paid
              const allPaid = allPrescriptions.every(p => p.isPaid === true);
              const paidCount = allPrescriptions.filter(p => p.isPaid === true).length;
              const totalCount = allPrescriptions.length;
              
              if (allPaid) {
                // All patients have been paid - archive the appointment
                await appointmentService.archivePaidAppointment(prescriptionData.appointment.id);
                console.log(`Appointment ${prescriptionData.appointment.id} archived after payment (all ${totalCount} patients paid)`);
              } else {
                // Not all patients are paid yet - don't archive
                // The appointment will remain active until all patients are paid
                console.log(`Appointment ${prescriptionData.appointment.id} NOT archived - ${paidCount}/${totalCount} patients paid. Remaining unpaid patients must be loaded and paid before archiving.`);
              }
            }
          } catch (archiveError) {
            console.error('Error checking/archiving appointment:', archiveError);
            // Don't fail the sale if archiving check fails
            // Better to leave appointment active than to archive incorrectly
          }
        } catch (error) {
          console.error('Error updating appointment payment:', error);
          // Don't fail the sale if appointment update fails
        }
      }

      // Prepare sale data for receipt printing
      const saleForReceipt = {
        id: saleId,
        ...saleData,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Include appointment information for receipt
        appointmentInfo: isPrescriptionSession && prescriptionData?.appointment ? {
          appointmentId: prescriptionData.appointment.id,
          patientName: prescriptionData.appointment.patientName,
          doctorName: prescriptionData.appointment.doctorName,
          appointmentDate: prescriptionData.appointment.date,
          appointmentTime: `${prescriptionData.appointment.startTime} - ${prescriptionData.appointment.endTime}`
        } : undefined
      } as any; // Type assertion to handle the appointmentInfo property

      // Print receipt
      try {
        await posReceiptService.printPOSReceipt(saleForReceipt);
        
        toast({
          title: "Sale Completed",
          description: "Receipt has been printed successfully",
          variant: "success",
        });
      } catch (printError) {
        console.error('Error printing receipt:', printError);
        toast({
          title: "Sale Completed",
          description: "Sale saved, but receipt printing failed",
          variant: "warning",
        });
      }

      // Close payment modal
      setShowPaymentModal(false);

      // Show success message with payment details
      let successMessage = '';
      let title = "Sale Completed";
      if (isFreeBill) {
        title = "Free Bill Created";
        successMessage = `Free bill created successfully. Original Amount: Rs ${receiptTotal.toFixed(2)} (100% Discount Applied) | Final Total: Rs 0.00 (Created by: ${createdByName})`;
      } else if (isCredit) {
        title = "Credit Sale Created";
        successMessage = `Credit sale created successfully. Total: Rs ${receiptTotal.toFixed(2)} | Due Amount: Rs ${dueAmount.toFixed(2)} (Created by: ${createdByName})`;
      } else if (isPartialPayment) {
        title = "Partial Payment Recorded";
        successMessage = `Partial payment recorded. Total: Rs ${receiptTotal.toFixed(2)} | Initial Payment: Rs ${initialPaymentAmount.toFixed(2)} | Due Amount: Rs ${dueAmount.toFixed(2)} (Created by: ${createdByName})`;
      } else {
        successMessage = `Sale saved successfully. Total: Rs ${receiptTotal.toFixed(2)} (Created by: ${createdByName})`;
        if (paymentInfo.method === 'cash' && paymentInfo.changeAmount && paymentInfo.changeAmount > 0) {
          successMessage += ` | Change: Rs ${paymentInfo.changeAmount.toFixed(2)}`;
        }
      }

      toast({
        title: title,
        description: successMessage,
        variant: "default",
      });
      
      // Reset form for safety (in case navigation does not occur)
      setPatientData({ name: '', phone: '' });
      setSelectedProcedures([]);
      setAppointmentProcedures([]);
      setManualAppointmentAmount(0);
      setSelectedLabTests([]);
      setPharmacyItems([]);
      setPaymentDetails(null);

      // After successful sale + receipt, auto-navigate back to the return path (e.g. today's appointments)
      if (typeof window !== 'undefined') {
        const returnPath = localStorage.getItem('posReturnPath');
        if (returnPath) {
          // Clean up POS handover data
          localStorage.removeItem('posReturnPath');
          localStorage.removeItem('prescriptionPOSData');
          // Navigate back to the stored return path
          window.location.href = returnPath;
          return;
        }
      }

    } catch (error) {
      console.error('Error saving sale:', error);
      toast({
        title: "Error",
        description: "Failed to save sale",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-6 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <User className="h-6 w-6 mr-2 text-blue-600" />
                Medical Center POS
              </h1>
              <p className="text-gray-600 mt-1">Complete medical services billing</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="bg-white hover:bg-gray-50 border-gray-300"
              >
                <X className="h-4 w-4 mr-2" />
                Back to Main POS
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                size="lg"
                onClick={handleSaveSale}
                disabled={isSaving || billTotal <= 0 || !patientData.name.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Complete Sale
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Patient Info & Services */}
          <div className="xl:col-span-2 space-y-6">
            {/* Patient Information Card - Enhanced */}
            <Card className="border-blue-100 bg-blue-50">
              <CardHeader className="bg-blue-50 rounded-t-lg py-3">
                <CardTitle className="flex items-center text-blue-800">
                  <User className="h-5 w-5 mr-2" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientName" className="text-gray-700 font-medium">
                      Patient Name *
                    </Label>
                    <Input
                      id="patientName"
                      value={patientData.name}
                      onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                      placeholder="Enter patient name"
                      className="mt-1 bg-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientPhone" className="text-gray-700 font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="patientPhone"
                      value={patientData.phone}
                      onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                      placeholder="Enter phone number (optional)"
                      className="mt-1 bg-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services Grid */}
            <div className="grid grid-cols-1 gap-6">
              {/* Procedures Card */}
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-gray-800">
                      <Stethoscope className="h-5 w-5 mr-2 text-purple-600" />
                      Procedures
                      {selectedProcedures.length > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800">
                          {selectedProcedures.length}
                        </Badge>
                      )}
                    </CardTitle>
                    <Button 
                      size="sm"
                      onClick={() => setShowProceduresModal(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedProcedures.length === 0 ? (
                    <div className="text-center py-4 border border-dashed rounded-lg border-gray-300">
                      <Stethoscope className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="text-gray-500 mt-2">No procedures added</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedProcedures.map((procedure) => (
                        <div key={procedure.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{procedure.name}</h4>
                            <p className="text-sm text-gray-600 truncate">
                              Rs {procedure.charge} × {procedure.quantity} = Rs {procedure.total}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={procedure.quantity}
                              onChange={(e) => handleUpdateProcedureQuantity(procedure.id!, Number(e.target.value))}
                              className="w-20 h-8 text-center"
                              min="1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleRemoveProcedure(procedure.id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="text-right mt-3 p-3 bg-purple-50 rounded-lg">
                        <p className="font-semibold text-purple-800">Procedures Total: Rs {proceduresTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Doctor Procedures from Appointment Card */}
            {appointmentProcedures.length > 0 && (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="py-3 bg-green-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-gray-800">
                      <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
                      Doctor Procedures (from Appointment)
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                        {appointmentProcedures.length}
                      </Badge>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {appointmentProcedures.map((procedure, index) => (
                      <div key={`${procedure.procedureId}-${index}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">{procedure.procedureName}</h4>
                          <p className="text-sm text-gray-600">
                            Doctor Charge: Rs {procedure.doctorCharge.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-700">Rs {procedure.doctorCharge.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="text-right mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-semibold text-green-800">Doctor Procedures Total: Rs {appointmentProceduresTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appointment Amount Card */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center text-gray-800">
                  <Stethoscope className="h-5 w-5 mr-2 text-purple-600" />
                  Appointment Amount
                  {manualAppointmentAmount > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800">
                      Rs {manualAppointmentAmount.toFixed(2)}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Manual Entry Section - Always Visible */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Label htmlFor="appointmentAmount" className="text-sm font-medium text-gray-700 mb-2 block">
                      Enter Appointment Amount
                    </Label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs</span>
                        <Input
                          id="appointmentAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={manualAppointmentAmount || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setManualAppointmentAmount(value);
                          }}
                          placeholder="0.00"
                          className="pl-10 bg-white focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      {manualAppointmentAmount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveManualAppointmentAmount}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the appointment consultation fee or load from appointment
                    </p>
                  </div>

                  {/* Display Current Amount */}
                  {manualAppointmentAmount > 0 && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-purple-900">Appointment Fee</h4>
                          <p className="text-sm text-purple-700">
                            Rs {manualAppointmentAmount.toFixed(2)}
                            {isAppointmentAlreadyPaid && (
                              <span className="text-xs text-green-600 ml-2">(Already Paid - Excluded from Bill)</span>
                            )}
                          </p>
                        </div>
                        <Edit className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lab Tests Card - Enhanced with Status Indicators */}
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-gray-800">
                    <TestTube className="h-5 w-5 mr-2 text-orange-600" />
                    Lab Tests
                    <div className="ml-2 flex items-center">
                      {selectedLabTests.length > 0 && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          {selectedLabTests.length}
                        </Badge>
                      )}
                      {(() => {
                        const missingInvNo = selectedLabTests.filter(test => !test.invNo || test.invNo.trim() === '').length;
                        return missingInvNo > 0 ? (
                          <Badge variant="destructive" className="ml-2">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {missingInvNo} missing INV
                          </Badge>
                        ) : selectedLabTests.length > 0 ? (
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                            All INV entered
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                  </CardTitle>
                  <Button 
                    size="sm"
                    onClick={() => setShowLabTestsModal(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedLabTests.length === 0 ? (
                  <div className="text-center py-4 border border-dashed rounded-lg border-gray-300">
                    <TestTube className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">No lab tests added</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedLabTests.map((test) => (
                      <div key={test.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{test.name}</h4>
                            <p className="text-sm text-gray-600 truncate">
                              {test.labName} - Rs {test.price} × {test.quantity} = Rs {test.total}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={test.quantity}
                              onChange={(e) => handleUpdateLabTestQuantity(test.id!, Number(e.target.value))}
                              className="w-20 h-8 text-center"
                              min="1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleRemoveLabTest(test.id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`invNo-${test.id}`} className="text-xs font-medium text-gray-700">
                              Invoice Number <span className="text-red-500">*</span>
                            </Label>
                            {(!test.invNo || test.invNo.trim() === '') && (
                              <span className="text-xs text-red-500 flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Required
                              </span>
                            )}
                          </div>
                          <Input
                            id={`invNo-${test.id}`}
                            type="text"
                            value={test.invNo || ''}
                            onChange={(e) => handleUpdateLabTestInvNo(test.id!, e.target.value)}
                            placeholder="Enter invoice number"
                            className={`mt-1 ${(!test.invNo || test.invNo.trim() === '') 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                              : 'border-green-500 focus:border-green-500 focus:ring-green-500'}`}
                          />
                          {(!test.invNo || test.invNo.trim() === '') && (
                            <p className="text-xs text-red-500 mt-1">Required for lab tests</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="text-right mt-3 p-3 bg-orange-50 rounded-lg">
                      <p className="font-semibold text-orange-800">Lab Tests Total: Rs {labTestsTotal.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

      
            <Card className={isPrescriptionSession ? "border-green-300 bg-green-50" : ""}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-gray-800">
                  <Pill className="h-5 w-5 mr-2 text-indigo-600" />
                  Pharmacy
                  {isPharmacyReviewed && (
                    <Badge className="ml-2 bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Pharmacy Reviewed
                    </Badge>
                  )}
                  {isPrescriptionSession && !isPharmacyReviewed && (
                    <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-300">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      From Prescription
                    </Badge>
                  )}
                  {pharmacyItems.length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-800">
                      {pharmacyItems.length}
                    </Badge>
                  )}
                </CardTitle>
                <Button 
                  size="sm"
                  onClick={() => setShowPharmacyModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {isPrescriptionSession ? 'Manage Items' : 'Add Items'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pharmacyItems.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Package2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No pharmacy items</p>
                  <p className="text-sm">Add medicines and medical supplies</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pharmacyItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{item.item.name}</h4>
                          {item.prescriptionInfo && (
                            <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                              Prescribed
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Quantity:</span> 
                                  {item.unitQuantity > 0 && item.item.unitContains && ` ${item.unitQuantity} ${item.item.unitContains.unit}`}
                                  {item.subUnitQuantity > 0 && item.item.unitContains && ` + ${item.subUnitQuantity} ${item.item.unitContains.unit}`}
                                </div>
                                <div>
                                  <span className="font-medium">Total:</span> Rs {item.totalPrice.toFixed(2)}
                                </div>
                              </div>
                        {item.prescriptionInfo && (
                          <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                            <strong>Prescription:</strong> {item.prescriptionInfo.dosage} - {item.prescriptionInfo.frequency}
                            {item.prescriptionInfo.instructions && ` - ${item.prescriptionInfo.instructions}`}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePharmacyItem(index)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>

          {/* Right Column - Summary - Enhanced Visual Design */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg py-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Bill Summary
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCalculator(true)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    title="Open Calculator"
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Doctor Procedures Total */}
                  {appointmentProceduresTotal > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-700">Doctor Procedures Total:</span>
                      <span className="font-medium text-green-700">Rs {appointmentProceduresTotal.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Appointment Fee */}
                  {manualAppointmentAmount > 0 && (
                    <div className="mb-4 pb-4 border-b border-purple-200">
                      <div className="flex justify-between py-2">
                        <div className="flex flex-col">
                          <span className="text-gray-700 font-medium">Appointment Fee</span>
                          {isAppointmentAlreadyPaid && (
                            <span className="text-xs text-green-600 mt-0.5">(Already Paid - Excluded from Bill)</span>
                          )}
                        </div>
                        <span className="font-medium text-purple-700">
                          Rs {(manualAppointmentAmount + roundingAdjustmentAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Other Items Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-700">Procedures:</span>
                      <span className="font-medium">Rs {proceduresTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-700">Lab Tests:</span>
                      <span className="font-medium">Rs {labTestsTotal.toFixed(2)}</span>
                    </div>
                    {selectedLabTests.length > 0 && (() => {
                      const missingInvNo = selectedLabTests.filter(test => !test.invNo || test.invNo.trim() === '').length;
                      return missingInvNo > 0 ? (
                        <div className="flex items-center text-xs py-2 px-3 bg-amber-50 text-amber-700 rounded-lg">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {missingInvNo} lab test{missingInvNo > 1 ? 's' : ''} missing invoice number
                        </div>
                      ) : null;
                    })()}
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-700">Pharmacy:</span>
                      <span className="font-medium">Rs {pharmacyTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Bill Total:</span>
                      <span className="text-blue-700">Rs {billTotal.toFixed(2)}</span>
                    </div>
                    {isAppointmentAlreadyPaid && manualAppointmentAmount > 0 && (
                      <div className="flex justify-between text-sm text-gray-600 mt-2">
                        <span>Receipt Total (includes appointment amount):</span>
                        <span>Rs {receiptTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {roundingAdjustmentAmount > 0 && (
                      <div className="flex justify-between text-sm text-gray-600 mt-2">
                        <span>Rounding Adjustment:</span>
                        <span className="text-green-600">+Rs {roundingAdjustmentAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rounding Options */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Rounding Options</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={selectedRounding === '50' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedRounding('50')}
                        className={`text-xs ${
                          selectedRounding === '50' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        Round to 50
                      </Button>
                      <Button
                        variant={selectedRounding === '20' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedRounding('20')}
                        className={`text-xs ${
                          selectedRounding === '20' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        Round to 20
                      </Button>
                      <Button
                        variant={selectedRounding === '10' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedRounding('10')}
                        className={`text-xs ${
                          selectedRounding === '10' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        Round to 10
                      </Button>
                      <Button
                        variant={selectedRounding === 'none' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedRounding('none')}
                        className={`text-xs ${
                          selectedRounding === 'none' 
                            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                            : 'hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        No Rounding
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedRounding === 'none' 
                        ? 'No rounding applied - exact amount' 
                        : `Rounds up to nearest Rs ${selectedRounding}`
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <Button 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                    size="lg"
                    onClick={handleSaveSale}
                    disabled={isSaving || billTotal <= 0 || !patientData.name.trim()}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Complete Payment
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Required field: Patient name only
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals remain unchanged */}
      {/* ... (all modal components remain exactly the same) */}

        {/* Procedures Modal */}
      <Dialog open={showProceduresModal} onOpenChange={setShowProceduresModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Procedures</DialogTitle>
         </DialogHeader>           <div className="space-y-4">
             <div className="relative">
               <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
               <Input
                placeholder="Search procedures..."
                value={procedureSearchTerm}
                onChange={(e) => setProcedureSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {filteredProcedures.map((procedure) => (
                <div key={procedure.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h4 className="font-medium">{procedure.name}</h4>
                    <p className="text-sm text-gray-600">
                      {procedure.category && `${procedure.category} - `}
                      Rs {procedure.charge}
                      {procedure.duration && ` - ${procedure.duration} min`}
                    </p>
                    {procedure.description && (
                      <p className="text-xs text-gray-500 mt-1">{procedure.description}</p>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleAddProcedure(procedure)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
              {filteredProcedures.length === 0 && (
                <p className="text-center text-gray-500 py-8">No procedures found</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProceduresModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lab Tests Modal */}
      <Dialog open={showLabTestsModal} onOpenChange={setShowLabTestsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Lab Tests</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search lab tests..."
                value={labTestSearchTerm}
                onChange={(e) => setLabTestSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {filteredLabTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h4 className="font-medium">{test.name}</h4>
                    <p className="text-sm text-gray-600">
                      {test.labName} - Rs {test.price}
                    </p>
                    {test.description && (
                      <p className="text-xs text-gray-500 mt-1">{test.description}</p>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleAddLabTest(test)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
              {filteredLabTests.length === 0 && (
                <p className="text-center text-gray-500 py-8">No lab tests found</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLabTestsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pharmacy Modal */}
      <Dialog open={showPharmacyModal} onOpenChange={setShowPharmacyModal}>
        <DialogContent className="max-w-7xl max-h-[95vh] w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] p-0 overflow-y-auto flex flex-col">
          <DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-white">
            <DialogTitle className="text-xl">Add Pharmacy Items</DialogTitle>
          </DialogHeader>
          
          {/* Main content area with improved layout and proper scrolling */}
          <div className="flex-1 min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-0 min-h-[700px]">
              
              {/* Left: Item Search and Cart - Fixed width with controlled height */}
              <div className="lg:col-span-3 flex flex-col h-full border-r bg-gray-50">
                {/* Search Section - Fixed */}
                <div className="flex-shrink-0 p-4 border-b bg-white">
                  <h3 className="font-medium text-lg mb-3">Search Items</h3>
                  <div className="relative">
                    <EnhancedPOSItemSearch 
                      inventory={inventory}
                      onSelectItem={handleItemSelect}
                    />
                  </div>
                </div>
                
                {/* Cart Items - Scrollable */}
                <div className="flex-1 flex flex-col p-4 min-h-0">
                  <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-base">
                        Cart ({pharmacyItems.length} {pharmacyItems.length === 1 ? 'item' : 'items'})
                      </h4>
                      {pharmacyItems.length > 3 && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    {pharmacyItems.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPharmacyItems([]);
                          toast({
                            title: "Cart Cleared",
                            description: "All pharmacy items removed from cart",
                            variant: "default",
                          });
                        }}
                        className="text-xs px-2 py-1"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                  
                  {/* Scrollable cart items */}
                  <div className="flex-1 overflow-y-auto pr-2 h-0 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500 mb-2" style={{maxHeight: '400px'}}>
                    {pharmacyItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-center text-gray-500">
                        <Package2 className="h-8 w-8 mb-2 text-gray-300" />
                        <p className="text-sm">No items in cart</p>
                        <p className="text-xs text-gray-400">Search and select items to add</p>
                      </div>
                    ) : (
                      <div className="space-y-2 pb-8">
                        {pharmacyItems.map((item, index) => (
                          <div key={index} className="flex items-start justify-between p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow min-h-[80px]">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-sm text-gray-900 truncate">{item.item.name}</h5>
                                {item.prescriptionInfo && (
                                  <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700 px-1">
                                    Rx
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-gray-600">
                                <div>
                                  Qty: {item.unitQuantity > 0 && `${item.unitQuantity} ${item.item.unitContains?.unit || 'units'}`}
                                  {item.subUnitQuantity > 0 && ` + ${item.subUnitQuantity} ${item.item.unitContains?.unit || 'sub-units'}`}
                                </div>
                                <div>Price: Rs {item.totalPrice.toFixed(2)}</div>
                                {item.prescriptionInfo && (
                                  <div className="text-green-600 mt-1">
                                    {item.prescriptionInfo.dosage} - {item.prescriptionInfo.frequency}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePharmacyItem(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2 px-2 flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        {/* Scroll indicator when there are many items */}
                        {pharmacyItems.length > 5 && (
                          <div className="text-center py-2">
                            <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                              <span className="ml-2">Scroll to see more items</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Cart Total - Always visible when items exist */}
                  {pharmacyItems.length > 0 && (
                    <div className="flex-shrink-0 border-t pt-3 mt-4 bg-white rounded-lg p-3 shadow-sm border-2 border-green-200">
                      <div className="flex justify-between items-center font-medium">
                        <span className="text-green-800">Cart Total:</span>
                        <span className="text-lg font-bold text-green-700">Rs {pharmacyTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Batch Selection and Add to Cart - Takes remaining space */}
              <div className="lg:col-span-4 flex flex-col min-h-[700px] bg-white">
                {selectedItem ? (
                  <>
                    {/* Item Info Header - Fixed */}
                    <div className="flex-shrink-0 p-4 border-b bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-lg text-blue-800 truncate">{selectedItem.name}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-blue-600 mt-1">
                            <span>Code: {selectedItem.code}</span>
                            <span>Type: {selectedItem.type}</span>
                            {selectedItem.genericName && <span>Generic: {selectedItem.genericName}</span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(null);
                            setSelectedBatch(null);
                            setItemBatches([]);
                          }}
                          className="text-blue-600 hover:text-blue-800 flex-shrink-0 ml-2"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>

                    {/* Batch Selection - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{maxHeight: '250px'}}>
                      {isLoadingBatches ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                          <span className="ml-2 text-gray-600">Loading batches...</span>
                        </div>
                      ) : itemBatches.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-800">Available Batches ({itemBatches.length})</h4>
                            {itemBatches.length > 3 && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <span className="ml-1">Scroll</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-3 pb-4">
                            {itemBatches.map((batch) => (
                              <div
                                key={batch.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                  selectedBatch?.id === batch.id
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                                }`}
                                onClick={() => setSelectedBatch(batch)}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium">Batch: {batch.batchNumber}</span>
                                  <Badge variant={batch.quantity > 10 ? "default" : "destructive"}>
                                    {batch.quantity} available
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                  <div>Expires: {new Date(batch.expiryDate).toLocaleDateString()}</div>
                                  <div>Price: Rs {batch.unitPrice?.toFixed(2) || '0.00'}</div>
                                </div>
                                {batch.supplier && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Supplier: {batch.supplier.name}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                          <p className="text-gray-600 text-lg font-medium">No Valid Batches</p>
                          <p className="text-gray-500 text-sm mt-2">
                            This item has no available batches with stock or all batches have expired.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Add to Cart Section - Fixed at bottom */}
                    {selectedBatch ? (
                      <div className="flex-shrink-0 border-t-2 border-blue-200 bg-blue-50 p-4 shadow-lg min-h-[180px] mt-4">
                        <h4 className="font-bold text-blue-800 mb-3 text-lg">Add to Cart</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="text-sm font-bold text-blue-700 mb-2 block">
                              {selectedItem.unitContains ? selectedItem.unitContains.unit : 'Units'}
                            </label>
                            <Input
                              ref={unitQtyInputRef}
                              type="number"
                              min="0"
                              defaultValue="1"
                              className="text-center border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const unitQty = unitQtyInputRef.current ? Number(unitQtyInputRef.current.value) || 0 : 1;
                                  const subUnitQty = subUnitQtyInputRef.current ? Number(subUnitQtyInputRef.current.value) || 0 : 0;
                                  handleAddToPharmacyCart(unitQty, subUnitQty);
                                }
                              }}
                            />
                          </div>
                          {selectedItem.hasUnitContains && selectedItem.unitContains && (
                            <div>
                              <label className="text-sm font-bold text-blue-700 mb-2 block">
                                {selectedItem.unitContains.unit}
                              </label>
                              <Input
                                ref={subUnitQtyInputRef}
                                type="number"
                                min="0"
                                defaultValue="0"
                                className="text-center border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const unitQty = unitQtyInputRef.current ? Number(unitQtyInputRef.current.value) || 0 : 1;
                                    const subUnitQty = subUnitQtyInputRef.current ? Number(subUnitQtyInputRef.current.value) || 0 : 0;
                                    handleAddToPharmacyCart(unitQty, subUnitQty);
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => {
                            const unitQty = unitQtyInputRef.current ? Number(unitQtyInputRef.current.value) || 0 : 1;
                            const subUnitQty = subUnitQtyInputRef.current ? Number(subUnitQtyInputRef.current.value) || 0 : 0;
                            handleAddToPharmacyCart(unitQty, subUnitQty);
                          }}
                          disabled={!selectedBatch}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart (Enter)
                        </Button>
                        <p className="text-xs text-blue-600 mt-2 text-center font-medium">
                          Set quantity above and press Enter or click this button
                        </p>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 border-t-2 border-amber-200 bg-amber-50 p-4 shadow-lg min-h-[150px] flex flex-col justify-center mt-4">
                        <h4 className="font-bold text-amber-800 mb-3 text-lg text-center">Select a Batch</h4>
                        <p className="text-amber-700 text-center">
                          Please select a batch from the list above to add items to cart
                        </p>
                        <div className="mt-4 text-center">
                          <div className="text-xs text-amber-600 flex items-center justify-center gap-1">
                            <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                            <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                            <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                            <span className="ml-1">Scroll up to see batches</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <Search className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-xl font-medium">Select an Item</p>
                    <p className="text-gray-400 text-sm mt-2 max-w-md">
                      Search and select an item from the left panel to view available batches and add to cart
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <DialogFooter className="flex-shrink-0 pt-4 border-t bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-600">
                {pharmacyItems.length > 0 && (
                  <span className="font-medium">
                    {pharmacyItems.length} item(s) in cart - Rs {pharmacyTotal.toFixed(2)}
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPharmacyModal(false);
                  setSelectedItem(null);
                  setSelectedBatch(null);
                  setItemBatches([]);
                }}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LocalPatientPaymentMethodModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        totalAmount={billTotal}
        onPaymentConfirm={handlePaymentConfirm}
        processing={isSaving}
      />

      {/* Draggable Calculator Modal */}
      {showCalculator && (
        <div
          className="fixed z-50"
          style={{
            left: `${calculatorPosition.x}px`,
            top: `${calculatorPosition.y}px`,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          <div
            className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 w-80"
          >
            {/* Calculator Header - Draggable */}
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 rounded-t-lg flex items-center justify-between cursor-move select-none"
              onMouseDown={handleCalculatorHeaderMouseDown}
            >
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                <h3 className="font-semibold">Calculator</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCalculator(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="text-white hover:bg-white/20 h-6 w-6 p-0"
                title="Close Calculator"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Calculator Content - Not draggable */}
            <div className="calculator-content p-4 bg-gray-50">
              {/* Display */}
              <div className="bg-white rounded-lg p-4 mb-4 border-2 border-gray-300 min-h-[80px] flex items-center justify-end">
                <div className="text-3xl font-bold text-gray-900 text-right w-full overflow-x-auto">
                  {calculatorDisplay}
                </div>
              </div>

              {/* Buttons Grid */}
              <div className="grid grid-cols-4 gap-2">
                {/* Row 1 */}
                <Button
                  variant="outline"
                  className="h-14 bg-red-50 hover:bg-red-100 text-red-700 font-bold border-red-300"
                  onClick={handleCalculatorClear}
                >
                  C
                </Button>
                <Button
                  variant="outline"
                  className="h-14 bg-red-50 hover:bg-red-100 text-red-700 font-bold border-red-300"
                  onClick={handleCalculatorClearEntry}
                >
                  CE
                </Button>
                <Button
                  variant="outline"
                  className="h-14 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border-blue-300"
                  onClick={() => handleCalculatorOperation('÷')}
                >
                  ÷
                </Button>
                <Button
                  variant="outline"
                  className="h-14 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border-blue-300"
                  onClick={() => handleCalculatorOperation('×')}
                >
                  ×
                </Button>

                {/* Row 2 */}
                <Button
                  variant="outline"
                  className="h-14 bg-gray-100 hover:bg-gray-200 font-bold"
                  onClick={() => handleCalculatorNumber('7')}
                >
                  7
                </Button>
                <Button
                  variant="outline"
                  className="h-14 bg-gray-100 hover:bg-gray-200 font-bold"
                  onClick={() => handleCalculatorNumber('8')}
                >
                  8
                </Button>
                <Button
                  variant="outline"
                  className="h-14 bg-gray-100 hover:bg-gray-200 font-bold"
                  onClick={() => handleCalculatorNumber('9')}
                >
                  9
                </Button>
                <Button
                  variant="outline"
                  className="h-14 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border-blue-300"
                  onClick={() => handleCalculatorOperation('-')}
                >
                  −
                </Button>

                {/* Row 3 */}
                <Button
                  variant="outline"
                  className="h-14 bg-gray-100 hover:bg-gray-200 font-bold"
                  onClick={() => handleCalculatorNumber('4')}
                >
                  4
                </Button>
                <Button
                  variant="outline"
                  className="h-14 bg-gray-100 hover:bg-gray-200 font-bold"
                  onClick={() => handleCalculatorNumber('5')}
                >
                  5
                </Button>
                <Button
                  variant="outline"
                  className="h-14 bg-gray-100 hover:bg-gray-200 font-bold"
                  onClick={() => handleCalculatorNumber('6')}
                >
                  6
                </Button>
                <Button
                  variant="outline"
                  className="h-14 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border-blue-300"
                  onClick={() => handleCalculatorOperation('+')}
                >
                  +
                </Button>

                {/* Row 4 */}
                <Button
                  variant="outline"
                  className="h-14 bg-gray-100 hover:bg-gray-200 font-bold"
                  onClick={() => handleCalculatorNumber('1')}
                >
                  1
                </Button>
                <Button
                  variant="outline"
                  className="h-14 bg-gray-100 hover:bg-gray-200 font-bold"
                  onClick={() => handleCalculatorNumber('2')}
                >
                  2
                </Button>
                <Button
                  variant="outline"
                  className="h-14 bg-gray-100 hover:bg-gray-200 font-bold"
                  onClick={() => handleCalculatorNumber('3')}
                >
                  3
                </Button>
                <Button
                  variant="default"
                  className="h-14 bg-green-600 hover:bg-green-700 text-white font-bold row-span-2"
                  onClick={handleCalculatorEquals}
                >
                  =
                </Button>

                {/* Row 5 */}
                <Button
                  variant="outline"
                  className="h-14 bg-gray-100 hover:bg-gray-200 font-bold col-span-2"
                  onClick={() => handleCalculatorNumber('0')}
                >
                  0
                </Button>
                <Button
                  variant="outline"
                  className="h-14 bg-gray-100 hover:bg-gray-200 font-bold"
                  onClick={handleCalculatorDecimal}
                >
                  .
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};