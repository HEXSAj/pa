// src/app/dashboard/pos/CustomerSelector.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Customer } from '@/types/customer';
import { customerService } from '@/services/customerService';
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
import { Search, UserPlus, User, X, Phone, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface CustomerSelectorProps {
  onSelectCustomer: (customer: Customer | undefined) => void;
  selectedCustomer?: Customer;
  autoFocusSearch?: boolean;
}

export function CustomerSelector({ 
  onSelectCustomer, 
  selectedCustomer,
  autoFocusSearch = true
}: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    mobile: '',
    address: ''
  });
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCustomers();
    
    // Auto-focus the search input when dialog opens
    if (autoFocusSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [autoFocusSearch]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.mobile) {
      alert('Name and mobile number are required');
      return;
    }

    setLoading(true);
    try {
      await customerService.create(newCustomer);
      const updatedCustomers = await customerService.getAll();
      setCustomers(updatedCustomers);
      
      // Find and select the newly created customer
      const createdCustomer = updatedCustomers.find(
        c => c.name === newCustomer.name && c.mobile === newCustomer.mobile
      );
      if (createdCustomer) {
        onSelectCustomer(createdCustomer);
      }
      
      setShowNewCustomerDialog(false);
      setNewCustomer({ name: '', mobile: '', address: '' });
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error creating customer');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true; // Show all customers when no search query
    
    const searchLower = searchQuery.toLowerCase().trim();
    const nameMatch = customer.name.toLowerCase().includes(searchLower);
    const mobileMatch = customer.mobile?.toLowerCase().includes(searchLower);
    
    return nameMatch || mobileMatch;
  });
  
  // Handle keyboard navigation for customer selection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredCustomers.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredCustomers.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredCustomers.length) {
          onSelectCustomer(filteredCustomers[focusedIndex]);
          setSearchQuery('');
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setSearchQuery('');
        break;
    }
  };
  
  // Scroll to focused item
  useEffect(() => {
    if (focusedIndex >= 0 && resultsContainerRef.current) {
      const container = resultsContainerRef.current;
      const focusedElement = container.children[focusedIndex] as HTMLElement;
      
      if (focusedElement) {
        // Check if element is not fully visible
        const containerRect = container.getBoundingClientRect();
        const focusedRect = focusedElement.getBoundingClientRect();
        
        if (focusedRect.bottom > containerRect.bottom) {
          // Need to scroll down
          container.scrollTop += focusedRect.bottom - containerRect.bottom;
        } else if (focusedRect.top < containerRect.top) {
          // Need to scroll up
          container.scrollTop -= containerRect.top - focusedRect.top;
        }
      }
    }
  }, [focusedIndex]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <Input
          ref={searchInputRef}
          placeholder="Search by name or phone number..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Reset focused index when search changes
            setFocusedIndex(e.target.value ? 0 : -1);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 py-6 text-lg"
          autoFocus={autoFocusSearch}
        />
        
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 h-8 w-8"
            onClick={() => {
              setSearchQuery('');
              searchInputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Loading customers...</span>
        </div>
      ) : (
        <div 
          ref={resultsContainerRef}
          className="max-h-[400px] overflow-y-auto space-y-2 rounded-md"
        >
          <AnimatePresence>
            {filteredCustomers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground text-center py-8 bg-gray-50 rounded-lg border"
              >
                {searchQuery ? (
                  <div className="flex flex-col items-center">
                    <Search className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="font-medium">No customers found</p>
                    <p className="text-gray-500 mt-1">Try a different search term or create a new customer</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <User className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="font-medium">Type to search customers</p>
                    <p className="text-gray-500 mt-1">Or create a new customer using the button below</p>
                  </div>
                )}
              </motion.div>
            ) : (
              filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className={`p-4 cursor-pointer border rounded-md transition-all ${
                    index === focusedIndex 
                      ? 'bg-primary/10 border-primary shadow-sm' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    onSelectCustomer(customer);
                    setSearchQuery('');
                  }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium flex items-center">
                        <User className="h-4 w-4 mr-1.5 text-primary" />
                        {customer.name}
                      </div>
                      {customer.mobile && (
                        <div className="text-sm text-muted-foreground mt-1 flex items-center">
                          <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          {customer.mobile}
                        </div>
                      )}
                      {customer.address && (
                        <div className="text-xs text-gray-500 mt-1 flex items-start">
                          <MapPin className="h-3 w-3 mr-1.5 text-gray-400 mt-0.5" />
                          <span className="line-clamp-2">{customer.address}</span>
                        </div>
                      )}
                    </div>
                    
                    {index === focusedIndex && (
                      <Badge variant="secondary" className="flex items-center">
                        <span className="mr-1">Select</span>
                        <ArrowRight className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
      
      <div className="flex justify-between items-center pt-2 border-t">
        <div className="text-sm text-muted-foreground">
          {filteredCustomers.length > 0 && `${filteredCustomers.length} customer(s) found`}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowNewCustomerDialog(true)}
            disabled={loading}
            className="group transition-all duration-300"
          >
            <UserPlus className="mr-2 h-4 w-4 group-hover:text-primary" />
            New Customer
          </Button>
          
          <Button
            variant="default"
            onClick={() => onSelectCustomer(undefined)}
            className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-md transition-all"
          >
            Continue Without Customer
          </Button>
        </div>
      </div>

      <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
        <DialogContent className="max-w-md p-0 rounded-lg overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
            <DialogTitle className="text-xl font-bold flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Add New Customer
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <Label className="text-base">Name</Label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter customer name"
                ref={nameInputRef}
                autoFocus
                className="border-gray-300"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-base">Mobile</Label>
              <Input
                value={newCustomer.mobile}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="Enter mobile number"
                className="border-gray-300"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-base">Address</Label>
              <Input
                value={newCustomer.address}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter address"
                className="border-gray-300"
              />
            </div>
          </div>
          
          <DialogFooter className="bg-gray-50 p-6 border-t">
            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNewCustomerDialog(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCustomer}
                disabled={loading || !newCustomer.name || !newCustomer.mobile}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Customer
                  </div>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}