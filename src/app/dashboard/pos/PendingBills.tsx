// src/app/dashboard/pos/PendingBills.tsx
import React, { useState, useEffect } from 'react';
import { SaleItem } from '@/types/sale';
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Clock, 
  Calendar, 
  FileText, 
  Trash2, 
  Search, 
  ShoppingCart,
  Loader2,
  User,
  X,
  AlertCircle
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Customer } from '@/types/customer';
import { pendingBillService } from '@/services/pendingBillService';
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';

export interface PendingBill {
  id?: string;
  items: SaleItem[];
  totalAmount: number;
  createdAt: Date;
  customer?: Customer;
  customerId?: string;
  name: string;
  discountPercentage?: number;
  totalDiscount?: number;
}

interface PendingBillsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectBill: (bill: PendingBill) => void;
}

export function PendingBills({ open, onOpenChange, onSelectBill }: PendingBillsProps) {
  const { toast } = useToast();
  const [pendingBills, setPendingBills] = useState<PendingBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBills, setFilteredBills] = useState<PendingBill[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadPendingBills();
    }
  }, [open]);

  // Filter bills when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBills(pendingBills);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = pendingBills.filter(bill => 
      bill.name.toLowerCase().includes(searchLower) ||
      bill.customer?.name?.toLowerCase().includes(searchLower) ||
      formatDate(bill.createdAt).toLowerCase().includes(searchLower)
    );
    
    setFilteredBills(filtered);
  }, [searchTerm, pendingBills]);

  const loadPendingBills = async () => {
    try {
      setLoading(true);
      const bills = await pendingBillService.getAll();
      
      // Add debug info about each bill
      const billsWithDebug = bills.map(bill => {
        console.log(`Loaded bill: ${bill.name}, Items count: ${bill.items.length}`);
        if (bill.items.length > 0) {
          const firstItem = bill.items[0];
          console.log('First item:', {
            name: firstItem.item?.name || 'Unknown',
            unitQty: firstItem.unitQuantity,
            structure: JSON.stringify(firstItem, null, 2).slice(0, 200) + '...' // Log a slice of the structure
          });
        }
        return bill;
      });
      
      setPendingBills(bills);
      setFilteredBills(bills);
      
      // Set debug info
    //   setDebugInfo(`Loaded ${bills.length} pending bills. ${bills.map(b => `"${b.name}" (${b.items.length} items)`).join(', ')}`);
    } catch (error) {
      console.error('Error loading pending bills:', error);
      toast({
        title: "Error",
        description: "Failed to load pending bills",
        variant: "destructive",
      });
      setDebugInfo(`Error loading bills: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = async (id: string) => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      await pendingBillService.delete(id);
      
      // Remove from state
      setPendingBills(prev => prev.filter(bill => bill.id !== id));
      setFilteredBills(prev => prev.filter(bill => bill.id !== id));
      
      toast({
        title: "Bill Deleted",
        description: "Pending bill has been deleted successfully",
        variant: "success",
      });
    } catch (error) {
      console.error('Error deleting pending bill:', error);
      toast({
        title: "Error",
        description: "Failed to delete pending bill",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleSelectBill = async (bill: PendingBill) => {
    console.log('Selected bill:', bill);
    console.log('Items count:', bill.items.length);
    
    try {
      // If bill has zero items, try to load it directly from the database
      if (bill.items.length === 0 && bill.id) {
        console.log('Bill has no items, loading from database...');
        const loadedBill = await pendingBillService.getById(bill.id);
        console.log('Freshly loaded bill:', loadedBill);
        console.log('Loaded items count:', loadedBill.items.length);
        
        if (loadedBill.items.length > 0) {
          toast({
            title: "Bill Loaded",
            description: `Loaded bill with ${loadedBill.items.length} items`,
            variant: "success",
          });
          onSelectBill(loadedBill);
        } else {
          toast({
            title: "Empty Bill",
            description: "This bill doesn't contain any items",
            variant: "warning",
          });
        }
      } else {
        // Bill has items, use it directly
        onSelectBill(bill);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error selecting bill:', error);
      toast({
        title: "Error",
        description: "Failed to load bill details",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date) => {
    try {
      // Convert to Date object if it's not already
      const dateObj = date instanceof Date ? date : new Date(date);
      return isNaN(dateObj.getTime()) 
        ? "Invalid date" 
        : dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "Invalid date";
    }
  };
  
  const getTimeAgo = (date: Date) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return "Unknown time";
      
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } catch (e) {
      return "Unknown time";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-lg p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
          <DialogTitle className="text-xl font-bold flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Pending Bills
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by bill name or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Debug info section */}
        {debugInfo && (
          <div className="p-2 border-b bg-blue-50 text-xs text-blue-800 font-mono">
            <div className="flex items-start">
              <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0 text-blue-600" />
              <div>
                <strong>Debug info:</strong> {debugInfo}
              </div>
            </div>
          </div>
        )}
        
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-2" />
              <span>Loading pending bills...</span>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium">No pending bills found</p>
              <p className="text-sm mt-1">
                {searchTerm 
                  ? "Try a different search term" 
                  : "Save your current cart as a pending bill to see it here"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBills.map((bill) => (
                <div 
                  key={bill.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{bill.name}</h3>
                      
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        <span>{formatDate(bill.createdAt)}</span>
                        <span className="mx-1.5 text-gray-300">•</span>
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        <span>{getTimeAgo(bill.createdAt)}</span>
                      </div>
                      
                      {bill.customer && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <User className="h-3.5 w-3.5 mr-1.5" />
                          <span>{bill.customer.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`font-normal ${bill.items.length === 0 ? 'text-red-500' : ''}`}>
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
                        </Badge>
                        
                        <Badge variant="outline" className="font-normal text-primary">
                          Rs{bill.totalAmount.toFixed(2)}
                        </Badge>
                        
                        {bill.discountPercentage && bill.discountPercentage > 0 && (
                          <Badge variant="outline" className="font-normal bg-green-50 text-green-600 border-green-200">
                            {bill.discountPercentage}% discount
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {confirmDeleteId === bill.id ? (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isDeleting}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteBill(bill.id!)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              'Confirm'
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setConfirmDeleteId(bill.id!)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleSelectBill(bill)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Select
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter className="p-4 border-t bg-gray-50">
          <div className="w-full flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPendingBills()}
              className="text-blue-600"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-24"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for the refresh button
const RefreshCw = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);