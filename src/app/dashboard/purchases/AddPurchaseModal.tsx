// src/app/dashboard/purchases/AddPurchaseModal.tsx
'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { purchaseService } from '@/services/purchaseService';
import { supplierService } from '@/services/supplierService';
import { inventoryService } from '@/services/inventoryService';
import { Supplier } from '@/types/supplier';
import { InventoryItem } from '@/types/inventory';
import { PurchaseItem, PurchaseWithDetails, PaymentMethod  } from '@/types/purchase';
import { useAuth } from '@/context/AuthContext';
import { useBeforeUnload } from 'react-use';
import { 
  Plus, 
  X, 
  Loader2, 
  Search, 
  ChevronDown, 
  Check, 
  Calendar, 
  FileText, 
  Save, 
  Clock,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Package,
  Gift,
  DollarSign
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from "@/components/ui/alert";
import { toast } from "sonner";

// Import the PurchaseItemForm component
import { PurchaseItemForm } from './PurchaseItemForm';

interface AddPurchaseModalProps {
  onClose: () => void;
  onSuccess: () => void;
  pendingId?: string; // ID of pending purchase to continue
}

export default function AddPurchaseModal({ onClose, onSuccess, pendingId }: AddPurchaseModalProps) {
  const { user, userRole } = useAuth(); // Get the current logged-in user
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [currentPendingId, setCurrentPendingId] = useState<string | undefined>(pendingId);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pendingCreator, setPendingCreator] = useState<{
    name: string | null;
    email: string | null;
  }>({ name: null, email: null });
  
  // Online/offline status
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [hasSavedWhileOffline, setHasSavedWhileOffline] = useState<boolean>(false);

  // UI state for dropdowns
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  
  // For filtering suppliers and inventory
  const [supplierFilter, setSupplierFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');

  // Form data - simplified without payment fields
  // const [formData, setFormData] = useState({
  //   supplierId: '',
  //   supplierName: '',
  //   items: [] as PurchaseItem[],
  //   totalAmount: 0,
  //   purchaseDate: new Date().toISOString().split('T')[0],
  //   invoiceNumber: '',
  //   notes: '',
  // });

  const [formData, setFormData] = useState({
    supplierId: '',
    items: [] as PurchaseItem[],
    totalAmount: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    notes: '',
    // Payment fields
    paymentMethod: 'credit' as PaymentMethod,
    initialPayment: 0,
  });

  const calculatePaymentSummary = () => {
    const totalCost = formData.totalAmount;
    const initialPayment = formData.initialPayment || 0;
    const remainingDue = totalCost - initialPayment;
    
    return {
      totalCost,
      initialPayment,
      remainingDue,
      isFullyPaid: remainingDue <= 0
    };
  };
  

  const [currentItem, setCurrentItem] = useState<{
    itemId: string;
    itemName: string;
  }>({
    itemId: '',
    itemName: '',
  });

  // Monitor online/offline status
  useEffect(() => {
    // Initial connection status
    setIsOnline(window.navigator.onLine);
    
    // Add event listeners for connection changes
    const handleOnline = () => {
      setIsOnline(true);
      
      // If we've saved while offline, try to sync now
      if (hasSavedWhileOffline) {
        handleAutosave();
        setHasSavedWhileOffline(false);
      }
    };
    
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasSavedWhileOffline]);

  // Filtered lists
  const filteredSuppliers = useMemo(() => {
    if (!supplierFilter.trim()) return suppliers;
    const lowerFilter = supplierFilter.toLowerCase();
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(lowerFilter) || 
      (supplier.phone && supplier.phone.toLowerCase().includes(lowerFilter))
    );
  }, [suppliers, supplierFilter]);
  
  // Load suppliers and inventory data
  
  const filteredInventory = useMemo(() => {
  if (!inventory) return [];
  
  const filter = itemFilter.toLowerCase().trim();
  if (!filter) return inventory;
  
  return inventory.filter(item => 
    item.name.toLowerCase().includes(filter) ||
    item.code.toLowerCase().includes(filter) ||
    (item.genericName && item.genericName.toLowerCase().includes(filter)) ||  // Add generic name search
    item.type.toLowerCase().includes(filter)
  );
}, [inventory, itemFilter]);

  
  useEffect(() => {
    const loadData = async () => {
      try {
        const [suppliersData, inventoryData] = await Promise.all([
          supplierService.getActive(),
          inventoryService.getAll()
        ]);
        setSuppliers(suppliersData);
        setInventory(inventoryData);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load pending purchase data if ID provided
  useEffect(() => {
    if (pendingId) {
      const loadPendingPurchase = async () => {
        try {
          setLoading(true);
          const allPurchases = await purchaseService.getAll();
          const pendingPurchase = allPurchases.find(p => p.id === pendingId);
          
          if (pendingPurchase && pendingPurchase.status === 'pending') {
            // Set form data from pending purchase
            setFormData({
              supplierId: pendingPurchase.supplierId,
              supplierName: pendingPurchase.supplier?.name || '',
              items: pendingPurchase.items.map(item => ({
                ...item,
                expiryDate: item.expiryDate instanceof Date ? 
                  item.expiryDate : 
                  new Date(item.expiryDate)
              })),
              totalAmount: pendingPurchase.totalAmount,
              purchaseDate: pendingPurchase.purchaseDate instanceof Date ?
                pendingPurchase.purchaseDate.toISOString().split('T')[0] :
                new Date(pendingPurchase.purchaseDate).toISOString().split('T')[0],
              invoiceNumber: pendingPurchase.invoiceNumber || '',
              notes: pendingPurchase.notes || '',
            });
            
            // Store creator info
            setPendingCreator({
              name: pendingPurchase.createdByName || null,
              email: pendingPurchase.createdByEmail || null
            });
            
            // Set current pending ID
            setCurrentPendingId(pendingId);
            
            // Set last saved time
            setLastSaved(pendingPurchase.updatedAt);
            
            toast.info("Loaded saved draft purchase");
          } else {
            toast.error("Could not find pending purchase");
          }
        } catch (error) {
          console.error('Error loading pending purchase:', error);
          toast.error('Error loading draft purchase');
        } finally {
          setLoading(false);
        }
      };
      
      loadPendingPurchase();
    }
  }, [pendingId]);

  // Check for local storage on component mount
  useEffect(() => {
    // If we're already loading a specific draft, don't check localStorage
    if (pendingId) return;
    
    // Check if there's a draft in localStorage (from a crashed session)
    const localStorageKeys = Object.keys(localStorage);
    const pendingPurchaseKeys = localStorageKeys.filter(key => key.startsWith('pendingPurchase_'));
    
    if (pendingPurchaseKeys.length > 0) {
      // Sort by timestamp to get the most recent
      const sortedKeys = pendingPurchaseKeys.sort((a, b) => {
        const aTime = JSON.parse(localStorage.getItem(a) || '{}').timestamp || '';
        const bTime = JSON.parse(localStorage.getItem(b) || '{}').timestamp || '';
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
      
      // Get the most recent draft
      const mostRecentKey = sortedKeys[0];
      const storedData = JSON.parse(localStorage.getItem(mostRecentKey) || '{}');
      
      // Ask user if they want to restore the draft
      if (storedData && storedData.data) {
        const confirmRestore = window.confirm(
          'We found an unsaved purchase draft from a previous session. Would you like to restore it?'
        );
        
        if (confirmRestore) {
          const data = storedData.data;
          
          try {
            // Restore form data
            setFormData({
              supplierId: data.supplierId || '',
              supplierName: data.supplierName || '',
              items: data.items?.map(item => ({
                ...item,
                expiryDate: new Date(item.expiryDate)
              })) || [],
              totalAmount: data.totalAmount || 0,
              purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
              invoiceNumber: data.invoiceNumber || '',
              notes: data.notes || '',
            });
            
            // Set creator info
            setPendingCreator({
              name: data.createdByName || null,
              email: data.createdByEmail || null
            });
            
            // Set current pending ID if it exists
            if (data.id) {
              setCurrentPendingId(data.id);
            }
            
            // Set last saved time
            setLastSaved(new Date(storedData.timestamp));
            
            toast.success('Recovered unsaved purchase draft');
          } catch (error) {
            console.error('Error restoring draft from localStorage:', error);
            toast.error('Error restoring draft');
          }
        } else {
          // If user doesn't want to restore, clean up localStorage
          pendingPurchaseKeys.forEach(key => {
            localStorage.removeItem(key);
          });
        }
      }
    }
  }, [pendingId]);

  // Reset filters when dropdown closes
  useEffect(() => {
    if (!supplierOpen) {
      setSupplierFilter('');
    }
  }, [supplierOpen]);

  useEffect(() => {
    if (!itemOpen) {
      setItemFilter('');
    }
  }, [itemOpen]);

  function sanitizeForFirestore(data: any): any {
    // Handle null or undefined
    if (data === undefined) {
      return null;
    }
    
    // Handle primitive types (just return them)
    if (data === null || 
        typeof data !== 'object' || 
        data instanceof Date) {
      return data;
    }
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => sanitizeForFirestore(item));
    }
    
    // Handle objects
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Don't include function properties
      if (typeof value !== 'function') {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    
    return sanitized;
  }

  // Autosave function
  const handleAutosave = useCallback(async () => {
    if (!autoSaveEnabled) return;
    if (!formData.supplierId || formData.items.length === 0) return;
    
    try {
      setSavingDraft(true);
      
      // Prepare draft data without payment details
      const unsanitizedData = {
        ...formData,
        id: currentPendingId,
        purchaseDate: new Date(formData.purchaseDate),
        status: 'pending',
        createdByUid: user?.uid,
        createdByName: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Unknown User'),
        createdByEmail: user?.email,
        createdByRole: userRole,
      };
      
      // Sanitize data to replace undefined with null
      const draftData = sanitizeForFirestore(unsanitizedData);
      
      // If we're offline, store data in local storage
      if (!isOnline) {
        // Store in localStorage as a fallback
        const localStorageKey = `pendingPurchase_${currentPendingId || 'new'}`;
        localStorage.setItem(localStorageKey, JSON.stringify({
          data: draftData,
          timestamp: new Date().toISOString()
        }));
        
        setHasSavedWhileOffline(true);
        setLastSaved(new Date());
        
        // No ID is returned from the service since we're offline
        return;
      }
      
      // If we're online, save to Firebase
      const id = await purchaseService.savePending(draftData);
      setCurrentPendingId(id);
      setLastSaved(new Date());
      
      // Clear localStorage backup if we successfully saved online
      const localStorageKey = `pendingPurchase_${currentPendingId || 'new'}`;
      localStorage.removeItem(localStorageKey);
    } catch (error) {
      console.error('Error autosaving purchase:', error);
      
      // If save fails, try storing in localStorage as a fallback
      try {
        const localStorageKey = `pendingPurchase_${currentPendingId || 'new'}`;
        
        // Create a version of the data that will work with localStorage
        const localData = {
          ...formData,
          id: currentPendingId,
          purchaseDate: formData.purchaseDate,
          status: 'pending',
          createdByUid: user?.uid,
          createdByName: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Unknown User'),
          createdByEmail: user?.email,
          createdByRole: userRole,
        };
        
        localStorage.setItem(localStorageKey, JSON.stringify({
          data: localData,
          timestamp: new Date().toISOString()
        }));
        
        setHasSavedWhileOffline(true);
        setLastSaved(new Date());
      } catch (localStorageError) {
        console.error('Failed to save to localStorage:', localStorageError);
      }
    } finally {
      setSavingDraft(false);
    }
  }, [formData, currentPendingId, user, userRole, autoSaveEnabled, isOnline]);

  // Set up autosave interval
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const autosaveInterval = setInterval(() => {
      if (formData.supplierId && formData.items.length > 0) {
        handleAutosave();
      }
    }, 60000); // Autosave every minute
    
    return () => {
      clearInterval(autosaveInterval);
    };
  }, [formData, handleAutosave, autoSaveEnabled]);

  // Use beforeunload hook to ensure data is saved when window/tab is closed
  useBeforeUnload(() => {
    if (formData.supplierId && formData.items.length > 0) {
      // Try to save one last time before unloading
      handleAutosave();
    }
  }, 'You have unsaved changes. Are you sure you want to leave?');

  // Handle manual save as draft
  const handleSaveDraft = async () => {
    if (!formData.supplierId) {
      toast.error('Please select a supplier first');
      return;
    }

    try {
      setSavingDraft(true);
      
      // Prepare draft data without payment details
      const unsanitizedData = {
        ...formData,
        id: currentPendingId,
        purchaseDate: new Date(formData.purchaseDate),
        status: 'pending',
        createdByUid: user?.uid,
        createdByName: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Unknown User'),
        createdByEmail: user?.email,
        createdByRole: userRole,
      };
      
      // Sanitize data to replace undefined with null
      const draftData = sanitizeForFirestore(unsanitizedData);
      
      if (!isOnline) {
        // Store in localStorage if offline
        const localStorageKey = `pendingPurchase_${currentPendingId || 'new'}`;
        localStorage.setItem(localStorageKey, JSON.stringify({
          data: draftData,
          timestamp: new Date().toISOString()
        }));
        
        setHasSavedWhileOffline(true);
        setLastSaved(new Date());
        
        toast.success('Purchase draft saved locally. Will sync when online.');
        return;
      }
      
      const id = await purchaseService.savePending(draftData);
      setCurrentPendingId(id);
      setLastSaved(new Date());
      
      toast.success('Purchase draft saved successfully');
    } catch (error) {
      console.error('Error saving purchase draft:', error);
      toast.error('Error saving draft. Please try again.');
      
      // Attempt localStorage fallback
      try {
        const localStorageKey = `pendingPurchase_${currentPendingId || 'new'}`;
        
        // Create a localStorage-friendly version
        const localData = {
          ...formData,
          id: currentPendingId,
          purchaseDate: formData.purchaseDate,
          status: 'pending',
          createdByUid: user?.uid,
          createdByName: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Unknown User'),
          createdByEmail: user?.email,
          createdByRole: userRole,
        };
        
        localStorage.setItem(localStorageKey, JSON.stringify({
          data: localData,
          timestamp: new Date().toISOString()
        }));
        
        setHasSavedWhileOffline(true);
        setLastSaved(new Date());
        
        toast.success('Purchase draft saved locally. Will sync when online.');
      } catch (localStorageError) {
        console.error('Failed to save to localStorage:', localStorageError);
      }
    } finally {
      setSavingDraft(false);
    }
  };

  const handleAddItem = async (item: Partial<PurchaseItem>) => {
    if (!currentItem.itemId) {
      toast.error('Please select an item first');
      return;
    }
    
    const selectedItem = inventory.find(i => i.id === currentItem.itemId);
    if (!selectedItem) return;
    
    // Get batch number if not provided
    const batchNumber = item.batchNumber || await purchaseService.getNextBatchNumber(currentItem.itemId);
    
    // Create complete item with free items count
    const purchaseItem: PurchaseItem = {
      itemId: currentItem.itemId,
      batchNumber,
      quantity: item.quantity || 0,
      unitsPerPack: selectedItem.unitContains?.value,
      totalQuantity: item.totalQuantity || 0,
      expiryDate: item.expiryDate || new Date(),
      costPricePerUnit: item.costPricePerUnit || 0,
      sellingPricePerUnit: item.sellingPricePerUnit || 0,
      freeItemCount: item.freeItemCount || 0 // Add free item count
    };

    const updatedItems = [...formData.items, purchaseItem];
    
    // Calculate new total amount including free items
    // Note: Free items don't affect the total purchase cost
    const newTotalAmount = updatedItems.reduce(
      (sum, item) => sum + (item.costPricePerUnit * item.quantity), 
      0
    );

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      totalAmount: newTotalAmount
    }));

    // Reset the current item
    setCurrentItem({
      itemId: '',
      itemName: '',
    });
    
    // Trigger autosave after adding item
    if (autoSaveEnabled) {
      setTimeout(handleAutosave, 1000);
    }
  };

  const removeItem = (index: number) => {
    setFormData(prev => {
      const removedItem = prev.items[index];
      const newTotalAmount = prev.totalAmount - (removedItem.costPricePerUnit * removedItem.quantity);
      return {
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
        totalAmount: newTotalAmount
      };
    });
    
    // Trigger autosave after removing item
    if (autoSaveEnabled && formData.supplierId) {
      setTimeout(handleAutosave, 1000);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.supplierId) {
      toast.error('Please select a supplier');
      return;
    }

    if (!formData.purchaseDate) {
      toast.error('Please select a purchase date');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Check if we're online
    if (!isOnline) {
      toast.error('You are currently offline. Please connect to the internet to complete the purchase.');
      return;
    }

    setSaving(true);
    try {
      // Prepare data for submitting
      const submitData = {
        ...formData,
        id: currentPendingId, // Include ID if this was a pending purchase
        purchaseDate: new Date(formData.purchaseDate),
        // Preserve creator information from the pending purchase if available
        createdByUid: pendingCreator.name ? undefined : user?.uid,
        createdByName: pendingCreator.name || (user?.displayName || (user?.email ? user.email.split('@')[0] : 'Unknown User')),
        createdByEmail: pendingCreator.email || user?.email,
        createdByRole: userRole
      };
      
      // Create the purchase which will directly add to inventory
      await purchaseService.create(submitData);
      toast.success('Purchase created and items added to inventory');
      
      // Remove any localStorage backup
      if (currentPendingId) {
        const localStorageKey = `pendingPurchase_${currentPendingId}`;
        localStorage.removeItem(localStorageKey);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error('Error creating purchase. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Loading Purchase Data</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <div className="flex justify-between items-center">
            <DialogTitle>
              {currentPendingId ? 'Continue Purchase Draft' : 'Add New Purchase'}
            </DialogTitle>
            
            {/* Autosave indicator */}
            {autoSaveEnabled && (
              <div className="flex items-center text-sm text-gray-500">
                {savingDraft ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    <span>Saved {formatTimeAgo(lastSaved)}</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Autosave on</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Connection status indicator */}
          <div className="flex items-center mt-1 text-sm">
            {isOnline ? (
              <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                <Wifi className="h-3 w-3" />
                <span>Online</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
                <WifiOff className="h-3 w-3" />
                <span>Offline - Changes will sync when you reconnect</span>
              </Badge>
            )}
          </div>
          
          {/* Show pending creator info if available */}
          {pendingCreator.name && (
            <>
              <DialogDescription className="mt-2">
                Draft created by:
              </DialogDescription>
              <div className="flex items-center gap-2 text-sm mt-1">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {pendingCreator.name} {pendingCreator.email ? `(${pendingCreator.email})` : ''}
                </Badge>
              </div>
            </>
          )}
        </DialogHeader>
        
        {!isOnline && (
          <Alert variant="destructive" className="mx-6 my-2 bg-amber-50 text-amber-700 border-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>You're working offline</AlertTitle>
            <AlertDescription>
              Your changes are being saved locally and will sync when you're back online.
              {hasSavedWhileOffline && ' Changes are waiting to be synced.'}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 px-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className="w-full justify-between"
                    >
                      {formData.supplierId
                        ? formData.supplierName
                        : "Select supplier..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <div className="rounded-md border">
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Search supplier..."
                          value={supplierFilter}
                          onChange={(e) => setSupplierFilter(e.target.value)}
                        />
                      </div>
                      <div className="max-h-64 overflow-auto p-1">
                        {filteredSuppliers.length === 0 ? (
                          <div className="py-6 text-center text-sm">No supplier found.</div>
                        ) : (
                          filteredSuppliers.map((supplier) => (
                            <div
                              key={supplier.id}
                              className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${
                                formData.supplierId === supplier.id ? "bg-accent" : ""
                              }`}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  supplierId: supplier.id!,
                                  supplierName: supplier.name
                                });
                                setSupplierOpen(false);
                                
                                // Trigger autosave after selecting supplier
                                if (autoSaveEnabled) {
                                  setTimeout(handleAutosave, 500);
                                }
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{supplier.name}</span>
                                <span className="text-xs text-muted-foreground">{supplier.phone}</span>
                              </div>
                              <Check
                                className={`ml-auto h-4 w-4 ${formData.supplierId === supplier.id ? "opacity-100" : "opacity-0"}`}
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    invoiceNumber: e.target.value 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Purchase Date *</Label>
                <Input
                  type="date"
                  required
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    purchaseDate: e.target.value 
                  }))}
                />
              </div>
            </div>

            <Card>
              <CardContent className="pt-4">
                <h3 className="font-medium mb-4">Add Items</h3>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Item *</Label>
                      <Popover open={itemOpen} onOpenChange={setItemOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            type="button"
                            className="w-full justify-between"
                          >
                            {currentItem.itemId
                              ? currentItem.itemName
                              : "Select item..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <div className="rounded-md border">
                            <div className="flex items-center border-b px-3">
                              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              {/* <input
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search by name or code..."
                                value={itemFilter}
                                onChange={(e) => setItemFilter(e.target.value)}
                              /> */}
                              <input
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search by name, generic name, or code..."
                                value={itemFilter}
                                onChange={(e) => setItemFilter(e.target.value)}
                              />
                            </div>
                 
                            <div className="max-h-64 overflow-auto p-1">
                              {filteredInventory.length === 0 ? (
                                <div className="py-6 text-center text-sm">No item found.</div>
                              ) : (
                                filteredInventory.map((item) => (
                                  <div
                                    key={item.id}
                                    className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${
                                      currentItem.itemId === item.id ? "bg-accent" : ""
                                    }`}
                                    onClick={() => {
                                      setCurrentItem({
                                        itemId: item.id!,
                                        itemName: item.name
                                      });
                                      setItemOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      {/* Trade name as primary */}
                                      <span className="font-medium">{item.name}</span>
                                      
                                      {/* Generic name if different from trade name */}
                                      {item.genericName && item.genericName !== item.name && (
                                        <span className="text-xs text-blue-600">
                                          Generic: {item.genericName}
                                        </span>
                                      )}
                                      
                                      {/* Code and Type */}
                                      <span className="text-xs text-muted-foreground">
                                        Code: {item.code} | Type: {item.type}
                                      </span>
                                    </div>
                                    <Check
                                      className={`ml-auto h-4 w-4 ${currentItem.itemId === item.id ? 
                                        "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {currentItem.itemId && (
                      <PurchaseItemForm
                        item={inventory.find(i => i.id === currentItem.itemId) || null}
                        batchNumber=""
                        onAddItem={handleAddItem}
                      />
                    )}
                  </div>

                  {/* Added Items List */}
                  {formData.items.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Added Items</h4>
                      <div className="space-y-2">
                        {formData.items.map((item, index) => {
                          const inventoryItem = inventory.find(i => i.id === item.itemId);
                          return (
                            <div 
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                            >
                              <div>
                                <div className="font-medium">{inventoryItem?.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Batch: {item.batchNumber} | Qty: {item.quantity} 
                                  {item.unitsPerPack 
                                    ? ` (Total: ${item.quantity * item.unitsPerPack} ${inventoryItem?.unitContains?.unit})` 
                                    : ' units'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Cost: Rs{item.costPricePerUnit}/unit | Selling: Rs{item.sellingPricePerUnit}/unit
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Expires: {item.expiryDate instanceof Date ? item.expiryDate.toLocaleDateString() : new Date(item.expiryDate).toLocaleDateString()}
                                </div>
                                {item.freeItemCount > 0 && (
                                  <div className="mt-1 flex items-center">
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                                      <Gift className="h-3 w-3" />
                                      {item.freeItemCount} free {inventoryItem?.unitContains?.unit || 'units'}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-3">Payment Information</h3>
              
              {/* Total Cost Display */}
              <div className="bg-blue-50 p-3 rounded-md mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800">Total Purchase Cost:</span>
                  <span className="text-xl font-bold text-blue-600">Rs{formData.totalAmount.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value: PaymentMethod) => setFormData(prev => ({
                    ...prev, 
                    paymentMethod: value,
                    initialPayment: value === 'full_payment' ? prev.totalAmount : 0
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_payment">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>Full Payment</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="credit">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span>Credit (Pay Later)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Initial Payment for Credit */}
              {formData.paymentMethod === 'credit' && (
                <div className="space-y-2">
                  <Label htmlFor="initialPayment">Initial Payment (Optional)</Label>
                  <Input
                    id="initialPayment"
                    type="number"
                    min="0"
                    max={formData.totalAmount}
                    step="0.01"
                    value={formData.initialPayment || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      initialPayment: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="Enter initial payment amount"
                  />
                  <div className="text-sm text-muted-foreground">
                    Remaining due: Rs{(formData.totalAmount - (formData.initialPayment || 0)).toFixed(2)}
                  </div>
                </div>
              )}
              
              {/* Payment Summary */}
              <div className="bg-gray-50 p-3 rounded-md mt-3">
                <h4 className="font-medium mb-2">Payment Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span>Rs{calculatePaymentSummary().totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Initial Payment:</span>
                    <span className="text-green-600">Rs{calculatePaymentSummary().initialPayment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Due Amount:</span>
                    <span className={calculatePaymentSummary().isFullyPaid ? "text-green-600" : "text-orange-600"}>
                      Rs{calculatePaymentSummary().remainingDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                placeholder="Any additional notes..."
                className="h-20"
              />
            </div>

            <Card>
              <CardContent className="pt-4">
                <h3 className="font-medium mb-4">Purchase Summary</h3>
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label>Total Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.totalAmount}
                      readOnly
                      className="bg-gray-50 font-medium text-lg"
                    />
                    <div className="text-sm text-muted-foreground">
                      Auto-calculated based on cost price and quantity (free items not included in cost)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Information about adding to inventory */}
            <Alert className="bg-green-50 border-green-200">
              <Package className="h-4 w-4 text-green-600" />
              <AlertTitle>Items Will Be Added to Inventory</AlertTitle>
              <AlertDescription className="text-green-700">
                When you complete this purchase, all items will be immediately added to inventory with the specified batch numbers and quantities.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-between gap-3 p-6 border-t">
            <div className="flex items-center gap-2">
              <Switch
                id="autosave"
                checked={autoSaveEnabled}
                onCheckedChange={setAutoSaveEnabled}
              />
              <Label htmlFor="autosave" className="text-sm cursor-pointer">
                Autosave
              </Label>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving || savingDraft}
              >
                Cancel
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={!formData.supplierId || formData.items.length === 0 || saving || savingDraft}
                className="gap-1"
              >
                {savingDraft ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Draft
                  </>
                )}
              </Button>
              
              <Button
                type="submit"
                disabled={formData.items.length === 0 || saving || savingDraft || !isOnline}
                className="gap-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-1" />
                    Complete Purchase
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to format time ago
function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  
  return date.toLocaleDateString();
}