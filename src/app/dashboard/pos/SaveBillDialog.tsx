// src/app/dashboard/pos/SaveBillDialog.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Save, Loader2 } from 'lucide-react';
import { SaleItem } from '@/types/sale';
import { Customer } from '@/types/customer';
import { pendingBillService } from '@/services/pendingBillService';
import { useToast } from '@/hooks/use-toast';

import { useAuth } from '@/context/AuthContext';
import { staffService } from '@/services/staffService';

interface SaveBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: SaleItem[];
  totalAmount: number;
  customer?: Customer;
  discountPercentage?: number;
  totalDiscount?: number;
  onSaveComplete: () => void;
}

export function SaveBillDialog({ 
  open, 
  onOpenChange, 
  cartItems, 
  totalAmount,
  customer,
  discountPercentage,
  totalDiscount,
  onSaveComplete
}: SaveBillDialogProps) {
  const { toast } = useToast();
  const [billName, setBillName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { user, userRole } = useAuth();

  

  // Generate suggested name based on customer name and items

  const handleSave = async () => {
    if (!billName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for this bill",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Cannot save an empty bill",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Create user info object
      const createdBy = {
        uid: user?.uid || 'unknown',
        email: user?.email || 'unknown',
        role: userRole || 'unknown',
        displayName: user?.displayName || 'Unknown User'
      };
      
      // Try to get staff user info if available
      if (user?.uid) {
        try {
          const staffUser = await staffService.getStaffById(user.uid);
          if (staffUser && staffUser.displayName) {
            createdBy.displayName = staffUser.displayName;
          }
        } catch (error) {
          console.error('Error fetching staff user:', error);
        }
      }
      
      // Prepare simplified items to avoid circular references
      const simplifiedItems = cartItems.map(item => {
        // Create a simplified version of each item that won't have circular references
        const simplifiedItem = {
          itemId: item.itemId,
          batchId: item.batchId,
          unitQuantity: item.unitQuantity,
          subUnitQuantity: item.subUnitQuantity,
          unitPrice: item.unitPrice,
          subUnitPrice: item.subUnitPrice,
          totalPrice: item.totalPrice,
          totalCost: item.totalCost,
          itemDiscount: item.itemDiscount || null,
          itemDiscountPercentage: item.itemDiscountPercentage || null,
          
          // Include essential item information
          item: {
            id: item.item.id,
            name: item.item.name,
            code: item.item.code,
            type: item.item.type,
            hasUnitContains: item.item.hasUnitContains || false,
            unitContains: item.item.unitContains
          },
          
          // Include essential batch information
          batch: {
            id: item.batch.id,
            batchNumber: item.batch.batchNumber,
            expiryDate: item.batch.expiryDate,
            quantity: item.batch.quantity,
            unitPrice: item.batch.unitPrice,
            costPrice: item.batch.costPrice
          }
        };
        
        return simplifiedItem;
      });
      
      // Create pending bill data
      const pendingBill = {
        items: simplifiedItems,
        totalAmount,
        createdAt: new Date(),
        name: billName,
        customerId: customer?.id,
        customer,
        discountPercentage,
        totalDiscount,
        createdBy // Add user info to pending bill
      };
      
      const result = await pendingBillService.create(pendingBill);
      console.log('Bill saved with ID:', result.id);
      
      toast({
        title: "Bill Saved",
        description: "Your bill has been saved and can be retrieved later",
        variant: "success",
      });
      
      onOpenChange(false);
      setBillName('');
      onSaveComplete();
    } catch (error) {
      console.error('Error saving pending bill:', error);
      toast({
        title: "Error",
        description: `Failed to save pending bill: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };


  const generateName = () => {
    let name = '';
    
    // Add customer name if available
    if (customer?.name) {
      name += customer.name;
    }
    
    // Add first item name
    if (cartItems.length > 0) {
      if (name) name += ' - ';
      name += cartItems[0].item.name;
      
      // Add count if more than one item
      if (cartItems.length > 1) {
        name += ` +${cartItems.length - 1} more`;
      }
    }
    
    // Add date if no other info available
    if (!name) {
      name = 'Bill - ' + new Date().toLocaleDateString();
    }
    
    setBillName(name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-lg p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-indigo-600 to-indigo-500 p-6 text-white">
          <DialogTitle className="text-xl font-bold">Save Current Bill</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billName">Bill Name</Label>
            <div className="flex space-x-2">
              <Input
                id="billName"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                placeholder="Enter a name for this bill"
                className="flex-1"
                autoFocus
              />
              <Button 
                variant="outline" 
                onClick={generateName}
                type="button"
              >
                Suggest
              </Button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Items:</span>
              <span>{cartItems.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Amount:</span>
              <span>Rs{totalAmount.toFixed(2)}</span>
            </div>
            {discountPercentage && discountPercentage > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount Applied:</span>
                <span>{discountPercentage}%</span>
              </div>
            )}
            {customer && (
              <div className="flex justify-between text-sm">
                <span>Customer:</span>
                <span>{customer.name}</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            This bill will be saved temporarily and can be retrieved later. 
            No inventory adjustments will be made until you complete the sale.
          </p>
        </div>
        
        <DialogFooter className="p-6 border-t bg-gray-50">
          <div className="flex space-x-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !billName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Bill
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}