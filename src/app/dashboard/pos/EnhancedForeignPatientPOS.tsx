// src/app/dashboard/pos/EnhancedForeignPatientPOS.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Shield,
  CreditCard
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
import { useAuth } from '@/context/AuthContext';
import { staffService } from '@/services/staffService';
import { ForeignPatientPaymentMethodModal } from './ForeignPatientPaymentMethodModal';
import { posReceiptService } from '@/services/posReceiptService';

// Define the ForeignPaymentDetails interface here since it might not be exported from the modal
// interface ForeignPaymentDetails {
//   method: 'cash' | 'card';
//   // Cash payment details
//   lkrCash?: number;
//   usdCash?: number;
//   euroCash?: number;
//   receivedAmount?: number;
//   balanceGiven?: number; // Always in LKR
//   // Card payment details
//   cardType?: 'usd' | 'euro';
//   cardAmount?: number;
//   totalAmount?: number;
//   cardNumber?: string; // Formatted as ****-****-****-1234
// }

interface ForeignPaymentDetails {
  method: 'cash' | 'card';
  // Cash payment details
  lkrCash?: number;
  usdCash?: number;
  euroCash?: number;
  receivedAmount?: number;
  balanceGiven?: number; // Always in LKR
  // Card payment details
  cardType?: 'usd' | 'lkr'; // Changed from 'usd' | 'euro'
  cardAmount?: number;
  totalAmount?: number;
  cardNumber?: string; // Formatted as ****-****-****-1234
}

interface ForeignPatientData {
  name: string;
  phone: string;
}

interface SelectedForeignProcedure extends Procedure {
  quantity: number;
  totalLKR: number;
  totalUSD: number;
  usdAmount: number; // User entered USD amount per unit
}

// UPDATED LAB TEST INTERFACE
interface SelectedForeignLabTest extends LabTest {
    quantity: number;
    originalPrice: number; // Store the original price from LabTest
    actualPrice: number;   // Store the price actually used (may be edited)
    totalLKR: number;      // quantity * actualPrice
    usdAmount: number;     // USD amount per unit
    totalUSD: number;      // quantity * usdAmount
    invNo?: string;
}

interface ForeignSaleItem extends SaleItem {
  usdAmount: number; // User entered USD amount for this item
  totalUSD: number; // Total USD for this item
}

interface ForeignPatientPOSProps {
  onBack: () => void;
}

export const EnhancedForeignPatientPOS: React.FC<ForeignPatientPOSProps> = ({ onBack }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Patient Information
  const [patientData, setPatientData] = useState<ForeignPatientData>({
    name: '',
    phone: ''
  });

  // Insurance Selection (Non-Insurance as default)
  const [isInsurancePatient, setIsInsurancePatient] = useState<boolean>(false);

  // OPD Charges (in USD for foreign patients)
  const [opdChargesUSD, setOpdChargesUSD] = useState<number>(0);

  // Procedures
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedures, setSelectedProcedures] = useState<SelectedForeignProcedure[]>([]);
  const [showProceduresModal, setShowProceduresModal] = useState(false);
  const [procedureSearchTerm, setProcedureSearchTerm] = useState('');
  const [filteredProcedures, setFilteredProcedures] = useState<Procedure[]>([]);
  const [loadingProcedures, setLoadingProcedures] = useState(false);

  // Lab Tests
  const [labs, setLabs] = useState<Lab[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedLabTests, setSelectedLabTests] = useState<SelectedForeignLabTest[]>([]);
  const [showLabTestsModal, setShowLabTestsModal] = useState(false);
  const [labTestSearchTerm, setLabTestSearchTerm] = useState('');
  const [filteredLabTests, setFilteredLabTests] = useState<LabTest[]>([]);
  const [loadingLabTests, setLoadingLabTests] = useState(false);

  // NEW LAB TEST SELECTION MODAL STATES
  const [showLabTestSelectionModal, setShowLabTestSelectionModal] = useState(false);
  const [selectedLabTestForAdd, setSelectedLabTestForAdd] = useState<LabTest | null>(null);
  const [labTestPrice, setLabTestPrice] = useState<number>(0);
  const [labTestQuantity, setLabTestQuantity] = useState<number>(1);
  const [labTestUSDAmount, setLabTestUSDAmount] = useState<number>(0);
  const [labTestsTotalUSD, setLabTestsTotalUSD] = useState<number>(0);

  // Pharmacy - KEEP YOUR ORIGINAL STATES
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemBatches, setItemBatches] = useState<BatchWithDetails[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchWithDetails | null>(null);
  const [pharmacyItems, setPharmacyItems] = useState<ForeignSaleItem[]>([]);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);

  const unitQtyInputRef = useRef<HTMLInputElement>(null);
  const subUnitQtyInputRef = useRef<HTMLInputElement>(null);

  // Saving
  const [isSaving, setIsSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Calculate totals with insurance logic
  const proceduresTotalLKR = selectedProcedures.reduce((sum, proc) => sum + proc.totalLKR, 0);
  const proceduresTotalUSD = useMemo(() => {
    if (isInsurancePatient) return 0;
    return selectedProcedures.reduce((sum, proc) => sum + proc.totalUSD, 0);
  }, [selectedProcedures, isInsurancePatient]);

  // UPDATED LAB TEST TOTAL CALCULATIONS
  const calculateLabTestsLKRTotal = () => {
    return selectedLabTests.reduce((sum, test) => sum + test.totalLKR, 0);
  };

  const calculateLabTestsUSDTotal = () => {
    if (isInsurancePatient) return 0;
    return selectedLabTests.reduce((sum, test) => sum + test.totalUSD, 0);
  };

  // Calculate pharmacy totals
  const pharmacyTotalLKR = pharmacyItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const pharmacyTotalUSD = useMemo(() => {
    if (isInsurancePatient) return 0;
    return pharmacyItems.reduce((sum, item) => sum + item.totalUSD, 0);
  }, [pharmacyItems, isInsurancePatient]);

  // Calculate OPD total
  const opdTotalUSD = useMemo(() => {
    if (isInsurancePatient) return 0;
    return opdChargesUSD;
  }, [opdChargesUSD, isInsurancePatient]);

  // Calculate lab tests totals using the functions
  const labTestsTotalUSDCalculated = calculateLabTestsUSDTotal();

  // Calculate grand totals
  const grandTotalLKR = proceduresTotalLKR + calculateLabTestsLKRTotal() + pharmacyTotalLKR;
  const grandTotalUSD = opdTotalUSD + proceduresTotalUSD + labTestsTotalUSDCalculated + pharmacyTotalUSD;

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load inventory
        const inventoryData = await inventoryService.getAll();
        setInventory(inventoryData);

        // Load procedures
        const proceduresData = await procedureService.getAll();
        setProcedures(proceduresData);
        setFilteredProcedures(proceduresData);

        // Load labs and lab tests
        const labsData = await labService.getAll();
        setLabs(labsData);
        
        const labTestsData = await labTestService.getAll();
        setLabTests(labTestsData);
        setFilteredLabTests(labTestsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load required data",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [toast]);

  // Filter procedures
  useEffect(() => {
    if (procedureSearchTerm) {
      const filtered = procedures.filter(procedure =>
        procedure.name.toLowerCase().includes(procedureSearchTerm.toLowerCase())
      );
      setFilteredProcedures(filtered);
    } else {
      setFilteredProcedures(procedures);
    }
  }, [procedureSearchTerm, procedures]);

  // Filter lab tests
  useEffect(() => {
    if (labTestSearchTerm) {
      const filtered = labTests.filter(test =>
        test.name.toLowerCase().includes(labTestSearchTerm.toLowerCase())
      );
      setFilteredLabTests(filtered);
    } else {
      setFilteredLabTests(labTests);
    }
  }, [labTestSearchTerm, labTests]);

  // Procedure handlers
  const handleAddProcedure = (procedure: Procedure) => {
    const existingIndex = selectedProcedures.findIndex(p => p.id === procedure.id);
    
    if (existingIndex >= 0) {
      const updated = [...selectedProcedures];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalLKR = updated[existingIndex].quantity * updated[existingIndex].localPatientCharge;
      updated[existingIndex].totalUSD = updated[existingIndex].quantity * updated[existingIndex].foreignPatientCharge;
      setSelectedProcedures(updated);
    } else {
      const newProcedure: SelectedForeignProcedure = {
        ...procedure,
        quantity: 1,
        totalLKR: procedure.localPatientCharge,
        totalUSD: procedure.foreignPatientCharge,
        usdAmount: procedure.foreignPatientCharge
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
          totalLKR: quantity * proc.localPatientCharge,
          totalUSD: quantity * proc.foreignPatientCharge,
          usdAmount: proc.foreignPatientCharge
        };
      }
      return proc;
    });
    setSelectedProcedures(updated);
  };

  const handleUpdateProcedureUSDAmount = (procedureId: string, usdAmount: number) => {
    const updated = selectedProcedures.map(proc => {
      if (proc.id === procedureId) {
        return {
          ...proc,
          usdAmount,
          totalUSD: proc.quantity * usdAmount
        };
      }
      return proc;
    });
    setSelectedProcedures(updated);
  };

  // NEW LAB TEST FUNCTIONS
  const handleSelectLabTest = (labTest: LabTest) => {
    setSelectedLabTestForAdd(labTest);
    setLabTestPrice(labTest.price);
    setLabTestQuantity(1);
    setLabTestUSDAmount(labTest.price);
    setShowLabTestSelectionModal(true);
    setShowLabTestsModal(false);
  };

  const handleConfirmAddLabTest = () => {
    if (!selectedLabTestForAdd) return;

    const existingIndex = selectedLabTests.findIndex(t => t.id === selectedLabTestForAdd.id);
    
    if (existingIndex >= 0) {
      // Increase quantity
      const updated = [...selectedLabTests];
      updated[existingIndex].quantity += labTestQuantity;
      updated[existingIndex].totalLKR = updated[existingIndex].quantity * updated[existingIndex].actualPrice;
      updated[existingIndex].totalUSD = updated[existingIndex].quantity * updated[existingIndex].usdAmount;
      setSelectedLabTests(updated);
    } else {
      // Add new lab test
      const newLabTest: SelectedForeignLabTest = {
        ...selectedLabTestForAdd,
        quantity: labTestQuantity,
        originalPrice: selectedLabTestForAdd.price,
        actualPrice: labTestPrice,
        totalLKR: labTestQuantity * labTestPrice,
        usdAmount: labTestUSDAmount,
        totalUSD: labTestQuantity * labTestUSDAmount,
        invNo: ''
      };
      setSelectedLabTests([...selectedLabTests, newLabTest]);
    }

    toast({
      title: "Lab Test Added",
      description: `${selectedLabTestForAdd.name} added to the list`,
      variant: "default",
    });

    setShowLabTestSelectionModal(false);
    setSelectedLabTestForAdd(null);
    setLabTestPrice(0);
    setLabTestQuantity(1);
    setLabTestUSDAmount(0);
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
          totalLKR: quantity * test.actualPrice,
          totalUSD: quantity * test.usdAmount
        };
      }
      return test;
    });
    setSelectedLabTests(updated);
  };

  const handleUpdateLabTestInvNo = (testId: string, invNo: string) => {
    const updated = selectedLabTests.map(test => {
      if (test.id === testId) {
        return { ...test, invNo };
      }
      return test;
    });
    setSelectedLabTests(updated);
  };

  // Pharmacy handlers
  const handleItemSelect = async (item: InventoryItem) => {
    if (selectedItem?.id === item.id) return;

    setSelectedItem(item);
    setSelectedBatch(null);
    setItemBatches([]);
    setIsLoadingBatches(true);

    try {
      const batches = await purchaseService.getBatchesByItem(item.id);
      const batchesWithDetails = batches.map(batch => ({
        ...batch,
        available: batch.quantity - (batch.soldQuantity || 0)
      }));

      const availableBatches = batchesWithDetails.filter(batch => batch.available > 0);
      setItemBatches(availableBatches);

      if (availableBatches.length === 1) {
        setSelectedBatch(availableBatches[0]);
      }
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

  // UPDATED addToCart function with insurance logic
  const addToCart = (
    unitQty: number, 
    subUnitQty: number, 
    discountPercentage: number = 0,
    adjustedUnitPrice?: number, 
    adjustedSubUnitPrice?: number
  ) => {
    if (!selectedItem || !selectedBatch) return;

    const unitPrice = adjustedUnitPrice || selectedBatch.unitPrice || 0;
    const subUnitPrice = adjustedSubUnitPrice || (selectedItem.unitContains ?
      (selectedBatch.unitPrice || 0) / selectedItem.unitContains.value : 0);

    const totalQuantity = unitQty + (subUnitQty / (selectedItem.unitContains?.value || 1));
    const basePrice = (unitQty * unitPrice) + (subUnitQty * subUnitPrice);
    const discountAmount = basePrice * (discountPercentage / 100);
    
    // For insurance patients, set selling price to 0 for pharmacy items
    const finalPrice = isInsurancePatient ? 0 : (basePrice - discountAmount);
    const itemUSDAmount = isInsurancePatient ? 0 : finalPrice;

    // Calculate cost correctly regardless of insurance status
    const totalCost = selectedBatch.costPerUnit ? 
      totalQuantity * selectedBatch.costPerUnit :
      (selectedBatch.unitPrice || 0) / (selectedItem.unitContains?.value || 1);

    const cartItem: ForeignSaleItem = {
      itemId: selectedItem.id,
      item: selectedItem,
      batchId: selectedBatch.id!,
      batch: selectedBatch,
      unitQuantity: unitQty,
      subUnitQuantity: subUnitQty,
      unitPrice: isInsurancePatient ? 0 : unitPrice,
      subUnitPrice: isInsurancePatient ? 0 : subUnitPrice,
      totalPrice: finalPrice,
      totalCost: totalCost, // Keep cost accurate for accounting
      fromFreeItemBatch: selectedBatch.isFreeItem,
      usdAmount: itemUSDAmount,
      totalUSD: itemUSDAmount
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
      const searchInput = document.querySelector('[placeholder*="Search"], input[type="text"], input[type="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }, 100);

    toast({
      title: "Item Added",
      description: `${selectedItem.name} added to pharmacy cart ${isInsurancePatient ? '(Insurance - Zero Price)' : ''}`,
      variant: "default",
    });
  };

  const handleRemovePharmacyItem = (index: number) => {
    setPharmacyItems(pharmacyItems.filter((_, i) => i !== index));
  };

  const handleUpdatePharmacyItemUSD = (index: number, usdAmount: number) => {
    const updated = [...pharmacyItems];
    updated[index].usdAmount = usdAmount;
    updated[index].totalUSD = usdAmount;
    setPharmacyItems(updated);
  };

  // Confirm Sale - Show Payment Modal - UPDATED WITH LAB TEST VALIDATION
  const handleConfirmSale = () => {
    // Validate required fields
    if (!patientData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Patient name is required",
        variant: "destructive",
      });
      return;
    }

    if (!patientData.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Patient phone number is required",
        variant: "destructive",
      });
      return;
    }

    // if (grandTotalUSD <= 0) {
    //   toast({
    //     title: "Validation Error",
    //     description: "Please add at least one item to the sale",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    const hasItems = opdChargesUSD > 0 || selectedProcedures.length > 0 || selectedLabTests.length > 0 || pharmacyItems.length > 0;

        if (!isInsurancePatient && grandTotalUSD <= 0) {
        toast({
            title: "Validation Error",
            description: "Please add at least one item to the sale",
            variant: "destructive",
        });
        return;
        }

        if (isInsurancePatient && !hasItems) {
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

  // Handle Payment Confirmation - UPDATED FOR INSURANCE LOGIC
  const handlePaymentConfirm = async (paymentDetails: ForeignPaymentDetails) => {
    setIsSaving(true);

    try {
      // Get user display name for logging
      let createdByName = 'Unknown User';
      if (user?.uid) {
        try {
          const staffUser = await staffService.getStaffById(user.uid);
          if (staffUser) {
            createdByName = staffUser.displayName || staffUser.email || 'Unknown';
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

      // Convert foreign sale items to regular sale items
      const regularSaleItems: SaleItem[] = pharmacyItems.map(item => ({
        itemId: item.itemId,
        item: item.item,
        batchId: item.batchId,
        batch: item.batch,
        unitQuantity: item.unitQuantity,
        subUnitQuantity: item.subUnitQuantity,
        unitPrice: item.unitPrice,
        subUnitPrice: item.subUnitPrice,
        totalPrice: item.totalPrice,
        totalCost: item.totalCost,
        fromFreeItemBatch: item.fromFreeItemBatch
      }));

      // Prepare sale data with insurance handling
      const saleData = {
        customerInfo: {
          id: null,
          name: patientData.name,
          mobile: patientData.phone,
        },
        items: regularSaleItems,
        totalAmount: grandTotalUSD,
        totalCost: pharmacyItems.reduce((sum, item) => sum + item.totalCost, 0),
        saleDate: new Date(),
        paymentMethod: paymentDetails.method,
        patientType: 'foreign' as const,
        isInsurancePatient,
        createdBy: {
          uid: user?.uid || null,
          name: createdByName,
          email: user?.email || null
        },
        // Foreign patient specific fields with insurance handling
        opdCharges: opdTotalUSD,
        procedures: selectedProcedures.map(proc => ({
          id: proc.id!,
          name: proc.name,
          foreignPatientCharge: isInsurancePatient ? 0 : proc.foreignPatientCharge,
          quantity: proc.quantity,
          total: isInsurancePatient ? 0 : proc.totalUSD,
          totalLKR: proc.totalLKR,
          totalUSD: isInsurancePatient ? 0 : proc.totalUSD,
          usdAmount: isInsurancePatient ? 0 : proc.foreignPatientCharge 
        })),
        labTests: selectedLabTests.map(test => ({
          id: test.id!,
          name: test.name,
          price: isInsurancePatient ? 0 : test.actualPrice,
          labId: test.labId,
          labName: test.labName,
          originalPrice: test.originalPrice,
          quantity: test.quantity,
          total: isInsurancePatient ? 0 : test.totalLKR,
          totalLKR: isInsurancePatient ? 0 : test.totalLKR,
          totalUSD: isInsurancePatient ? 0 : test.totalUSD,
          usdAmount: isInsurancePatient ? 0 : test.usdAmount,
          invNo: test.invNo || '' 
        })),
        proceduresTotal: proceduresTotalUSD,
        labTestsTotal: labTestsTotalUSDCalculated,
        pharmacyTotal: pharmacyTotalUSD,
        proceduresTotalLKR,
        labTestsTotalLKR: calculateLabTestsLKRTotal(),
        pharmacyTotalLKR,
        grandTotalLKR,
        pharmacyItemsUSD: pharmacyItems.map(item => ({
          itemId: item.itemId,
          usdAmount: isInsurancePatient ? 0 : item.usdAmount,
          totalUSD: isInsurancePatient ? 0 : item.totalUSD
        })),
        // Add payment details
        paymentDetails: {
          method: paymentDetails.method,
          ...(paymentDetails.method === 'cash' ? {
            lkrCash: paymentDetails.lkrCash,
            usdCash: paymentDetails.usdCash,
            euroCash: paymentDetails.euroCash,
            receivedAmount: paymentDetails.receivedAmount,
            balanceGiven: paymentDetails.balanceGiven
          } : {
            cardType: paymentDetails.cardType,
            cardAmount: paymentDetails.cardAmount,
            totalAmount: paymentDetails.totalAmount,
            cardNumber: paymentDetails.cardNumber
          })
        }
      };

      const saleId = await saleService.create(saleData);

      const saleForReceipt = {
        id: saleId,
        ...saleData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Skip receipt printing for insurance patients
      if (!isInsurancePatient) {
        try {
          await posReceiptService.printPOSReceipt(saleForReceipt);
          
          toast({
            title: "Foreign Patient Sale Completed",
            description: "USD receipt has been printed successfully",
            variant: "default",
          });
        } catch (printError) {
          console.error('Error printing receipt:', printError); 
          toast({
            title: "Sale Completed",
            description: "Sale saved, but receipt printing failed",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Insurance Patient Sale Completed",
          description: "Sale saved successfully (No receipt printed for insurance patients)",
          variant: "default",
        });
      }

      // Close payment modal
      setShowPaymentModal(false);

      // Reset form
      setPatientData({ name: '', phone: '' });
      setOpdChargesUSD(0);
      setSelectedProcedures([]);
      setSelectedLabTests([]);
      setPharmacyItems([]);
      setIsInsurancePatient(false);

    } catch (error) {
      console.error('Error saving sale:', error);
      toast({
        title: "Error",
        description: "Failed to save sale. Please try again.",
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <User className="h-6 w-6 mr-2 text-blue-600" />
                Foreign Patient POS
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
                onClick={handleConfirmSale}
                disabled={isSaving || (!isInsurancePatient && grandTotalUSD <= 0)}
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
            {/* Patient Information */}
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
                      onChange={(e) => setPatientData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter patient name"
                      className="mt-1 bg-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientPhone" className="text-gray-700 font-medium">
                      Phone Number *
                    </Label>
                    <Input
                      id="patientPhone"
                      value={patientData.phone}
                      onChange={(e) => setPatientData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                      className="mt-1 bg-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Insurance Patient Selector */}
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="insurance-mode"
                        checked={isInsurancePatient}
                        onCheckedChange={setIsInsurancePatient}
                      />
                      <Label htmlFor="insurance-mode" className="text-sm font-medium cursor-pointer">
                        Insurance Patient
                      </Label>
                    </div>
                    {isInsurancePatient ? (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        <Shield className="h-4 w-4 mr-1" />
                        Insurance Mode
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        <CreditCard className="h-4 w-4 mr-1" />
                        Non-Insurance
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* OPD Charges */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center text-gray-800">
                  <DollarSign className="h-5 w-5 mr-2 text-purple-600" />
                  OPD Charges (USD)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="opdCharges" className="text-gray-700">Amount (USD):</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <Input
                      id="opdCharges"
                      type="number"
                      value={opdChargesUSD}
                      onChange={(e) => setOpdChargesUSD(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-32 pl-8"
                      step="0.01"
                    />
                  </div>
                  {isInsurancePatient && opdChargesUSD > 0 && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                      Insurance: $0
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Procedures */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
                    Procedures
                    {selectedProcedures.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                        {selectedProcedures.length}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    onClick={() => setShowProceduresModal(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Procedures
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProcedures.length === 0 ? (
                  <div className="text-center py-4 border border-dashed rounded-lg border-gray-300">
                    <Stethoscope className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">No procedures selected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedProcedures.map((procedure) => (
                      <div key={procedure.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{procedure.name}</h4>
                          <p className="text-sm text-gray-600 truncate">
                            LKR: Rs {procedure.totalLKR.toFixed(2)} | USD: ${procedure.totalUSD.toFixed(2)}
                            {isInsurancePatient && (
                              <span className="text-purple-600 ml-2">(Insurance: $0)</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="1"
                            value={procedure.quantity}
                            onChange={(e) => handleUpdateProcedureQuantity(procedure.id!, Number(e.target.value))}
                            className="w-20 text-center"
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
                    <div className="text-right mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="font-semibold text-green-800">
                        Procedures Total (USD): ${proceduresTotalUSD.toFixed(2)}
                        {isInsurancePatient && <span className="text-purple-600 ml-2">(Insurance: $0)</span>}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lab Tests - Enhanced with Status Indicators */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TestTube className="h-5 w-5 mr-2 text-orange-600" />
                    Lab Tests
                    <div className="ml-2 flex items-center">
                      {selectedLabTests.length > 0 && (
                        <>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            {selectedLabTests.length}
                          </Badge>
                          <span className="ml-2">
                            {(() => {
                              const missingInvNo = selectedLabTests.filter(test => !test.invNo || test.invNo.trim() === '').length;
                              return missingInvNo > 0 ? (
                                <Badge variant="destructive" className="text-xs">
                                  {missingInvNo} missing INV No
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  All INV No entered
                                </Badge>
                              );
                            })()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowLabTestsModal(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lab Tests
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedLabTests.length === 0 ? (
                  <div className="text-center py-4 border border-dashed rounded-lg border-gray-300">
                    <TestTube className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">No lab tests selected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedLabTests.map((test) => (
                      <div key={test.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{test.name}</h4>
                            <p className="text-sm text-gray-600 truncate">
                              {test.labName} - LKR: Rs {test.totalLKR.toFixed(2)} | USD: ${test.totalUSD.toFixed(2)}
                              {isInsurancePatient && <span className="text-purple-600 ml-2">(Insurance: $0)</span>}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="1"
                              value={test.quantity}
                              onChange={(e) => handleUpdateLabTestQuantity(test.id!, Number(e.target.value))}
                              className="w-20 text-center"
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
                      <p className="font-semibold text-orange-800">
                        Lab Tests Total (USD): ${labTestsTotalUSDCalculated.toFixed(2)}
                        {isInsurancePatient && <span className="text-purple-600 ml-2">(Insurance: $0)</span>}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pharmacy */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Pill className="h-5 w-5 mr-2 text-indigo-600" />
                    Pharmacy Items
                    {pharmacyItems.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-800">
                        {pharmacyItems.length}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    onClick={() => setShowPharmacyModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Items
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pharmacyItems.length === 0 ? (
                  <div className="text-center py-4 border border-dashed rounded-lg border-gray-300">
                    <Pill className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">No pharmacy items selected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pharmacyItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{item.item.name}</h4>
                          <p className="text-sm text-gray-600 truncate">
                            Qty: {item.unitQuantity} | LKR: Rs {item.totalPrice.toFixed(2)} | USD: ${item.totalUSD.toFixed(2)}
                            {isInsurancePatient && <span className="text-purple-600 ml-2">(Insurance: $0)</span>}
                          </p>
                          {isInsurancePatient && (
                            <p className="text-xs text-purple-600">Cost Tracked: ${item.totalCost.toFixed(2)}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!isInsurancePatient && (
                            <div className="relative">
                              <span className="absolute left-2 top-2 text-xs text-gray-500">$</span>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.usdAmount}
                                onChange={(e) => handleUpdatePharmacyItemUSD(index, Number(e.target.value))}
                                className="w-24 pl-6 text-sm"
                                placeholder="USD"
                              />
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleRemovePharmacyItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="text-right mt-3 p-3 bg-indigo-50 rounded-lg">
                      <p className="font-semibold text-indigo-800">
                        Pharmacy Total (USD): ${pharmacyTotalUSD.toFixed(2)}
                        {isInsurancePatient && <span className="text-purple-600 ml-2">(Insurance: $0)</span>}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary - Enhanced Visual Design */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg py-4">
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Bill Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  {/* OPD */}
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-700">OPD (USD):</span>
                    <span className="font-medium">
                      ${opdTotalUSD.toFixed(2)}
                      {isInsurancePatient && opdChargesUSD > 0 && (
                        <span className="text-xs text-purple-600 ml-2">(Insurance: $0)</span>
                      )}
                    </span>
                  </div>

                  {/* Procedures */}
                  {selectedProcedures.length > 0 && (
                    <div className="pt-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Procedures (LKR):</span>
                        <span>Rs {proceduresTotalLKR.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>Procedures (USD):</span>
                        <span className="font-medium">
                          ${proceduresTotalUSD.toFixed(2)}
                          {isInsurancePatient && (
                            <span className="text-xs text-purple-600 ml-2">(Insurance: $0)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lab Tests */}
                  {selectedLabTests.length > 0 && (
                    <div className="pt-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Lab Tests (LKR):</span>
                        <span>Rs {calculateLabTestsLKRTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>Lab Tests (USD):</span>
                        <span className="font-medium">
                          ${labTestsTotalUSDCalculated.toFixed(2)}
                          {isInsurancePatient && (
                            <span className="text-xs text-purple-600 ml-2">(Insurance: $0)</span>
                          )}
                        </span>
                      </div>
                      {/* Add warning for missing invoice numbers */}
                      {(() => {
                        const missingInvNo = selectedLabTests.filter(test => !test.invNo || test.invNo.trim() === '').length;
                        return missingInvNo > 0 ? (
                          <div className="flex items-center mt-1 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {missingInvNo} lab test{missingInvNo > 1 ? 's' : ''} missing invoice number
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* Pharmacy */}
                  <div className="pt-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Pharmacy (LKR):</span>
                      <span>Rs {pharmacyTotalLKR.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Pharmacy (USD):</span>
                      <span className="font-medium">
                        ${pharmacyTotalUSD.toFixed(2)}
                        {isInsurancePatient && pharmacyItems.length > 0 && (
                          <span className="text-xs text-purple-600 ml-2">(Insurance: $0)</span>
                        )}
                      </span>
                    </div>
                    {isInsurancePatient && pharmacyItems.length > 0 && (
                      <div className="flex justify-between text-xs text-purple-600 bg-purple-50 p-2 rounded">
                        <span>Cost Tracked:</span>
                        <span>${pharmacyItems.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Grand Total */}
                  <div className="pt-4 border-t border-gray-300">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="font-medium">Total (LKR):</span>
                      <span>Rs {grandTotalLKR.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg mt-2">
                      <span className="font-bold">Grand Total (USD):</span>
                      <span className="font-bold text-blue-700">${grandTotalUSD.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Procedures Modal */}
      <Dialog open={showProceduresModal} onOpenChange={setShowProceduresModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Procedures</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search procedures..."
                value={procedureSearchTerm}
                onChange={(e) => setProcedureSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {loadingProcedures ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                filteredProcedures.map((procedure) => (
                  <div key={procedure.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h4 className="font-medium">{procedure.name}</h4>
                      <p className="text-sm text-gray-600">
                        Local: Rs {procedure.localPatientCharge} | Foreign: ${procedure.foreignPatientCharge}
                      </p>
                    </div>
                    <Button onClick={() => handleAddProcedure(procedure)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lab Tests Modal */}
      <Dialog open={showLabTestsModal} onOpenChange={setShowLabTestsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Lab Tests</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search lab tests..."
                value={labTestSearchTerm}
                onChange={(e) => setLabTestSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {loadingLabTests ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                filteredLabTests.map((test) => {
                  const lab = labs.find(l => l.id === test.labId);
                  return (
                    <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-gray-600">
                          {lab?.name} - Rs {test.price}
                        </p>
                      </div>
                      <Button onClick={() => handleSelectLabTest(test)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lab Test Selection Modal */}
      <Dialog open={showLabTestSelectionModal} onOpenChange={setShowLabTestSelectionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lab Test</DialogTitle>
          </DialogHeader>
          {selectedLabTestForAdd && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{selectedLabTestForAdd.name}</h4>
                <p className="text-sm text-gray-600">
                  {labs.find(l => l.id === selectedLabTestForAdd.labId)?.name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={labTestQuantity}
                    onChange={(e) => setLabTestQuantity(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Price (LKR)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={labTestPrice}
                    onChange={(e) => setLabTestPrice(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label>USD Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={labTestUSDAmount}
                  onChange={(e) => setLabTestUSDAmount(Number(e.target.value))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLabTestSelectionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAddLabTest}>
              Add Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pharmacy Modal */}
      <Dialog open={showPharmacyModal} onOpenChange={setShowPharmacyModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Package2 className="h-5 w-5 mr-2" />
              Add Pharmacy Items
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            {/* Left: Item Search */}
            <div className="flex flex-col min-h-0">
              <h3 className="font-medium text-lg mb-3 flex-shrink-0">Search Items</h3>
              <div className="bg-gray-50 p-4 rounded-lg flex-1 min-h-0 flex flex-col">
                <div className="h-full min-h-[400px]">
                  <EnhancedPOSItemSearch 
                    inventory={inventory}
                    onSelectItem={handleItemSelect}
                  />
                </div>
              </div>
            </div>
            
            {/* Current Pharmacy Cart Items */}
            {pharmacyItems.length > 0 && (
              <div className="flex-shrink-0 mt-4 max-h-60">
                <h4 className="font-medium text-base mb-2">Cart ({pharmacyItems.length})</h4>
                <div className="bg-white border rounded-lg p-3 max-h-52 overflow-y-auto">
                  <div className="space-y-2">
                    {pharmacyItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.item.name}</div>
                          <div className="text-gray-500">
                            Qty: {item.unitQuantity} | LKR {item.totalPrice.toFixed(2)} | USD ${item.totalUSD.toFixed(2)}
                            {isInsurancePatient && <span className="text-purple-600 ml-2">(Insurance: $0)</span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePharmacyItem(index)}
                          className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Center: Selected Item Details */}
            <div className="lg:col-span-2 flex flex-col">
              <h3 className="font-medium text-lg mb-3">Selected Item</h3>
              {selectedItem ? (
                <div className="bg-white border rounded-lg p-4 flex-1">
                  <div className="mb-4">
                    <h4 className="font-semibold text-lg">{selectedItem.name}</h4>
                    <p className="text-gray-600">{selectedItem.category}</p>
                  </div>

                  {/* Batch Selection */}
                  {itemBatches.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">Select Batch</Label>
                      {/* <BatchSelector
                        batches={itemBatches}
                        selectedBatch={selectedBatch}
                        onBatchSelect={setSelectedBatch}
                        isLoading={isLoadingBatches}
                      /> */}

                        <BatchSelector
                            batches={itemBatches}
                            selectedBatch={selectedBatch}
                            onSelectBatch={setSelectedBatch}  // ← Fixed: onBatchSelect → onSelectBatch
                            isLoading={isLoadingBatches}
                            />

                    </div>
                  )}

                  {/* Quantity Input */}
                  {selectedBatch && (
                    <div className="border-t pt-4">
                      <QuantityInput
                        item={selectedItem}
                        batch={selectedBatch}
                        allBatches={itemBatches}
                        onQuantityChange={addToCart}
                        unitQtyInputRef={unitQtyInputRef}
                        subUnitQtyInputRef={subUnitQtyInputRef}
                        patientType="foreign"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center flex-1">
                  <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select an item from the search to view details</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <ForeignPatientPaymentMethodModal
            open={showPaymentModal}
            onOpenChange={setShowPaymentModal}
            onPaymentConfirm={handlePaymentConfirm}
            totalAmountUSD={grandTotalUSD}
            processing={isSaving}
            />
    </div>
  );
};