import React, { useState, useEffect } from 'react';
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
import { Search, UserPlus, User, X } from "lucide-react";

interface CustomerSelectorProps {
  onSelectCustomer: (customer: Customer | undefined) => void;
  selectedCustomer?: Customer;
}

export function CustomerSelector({ onSelectCustomer, selectedCustomer }: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    mobile: '',
    address: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.mobile) {
      alert('Name and mobile number are required');
      return;
    }

    setLoading(true);
    try {
      const createdCustomer = await customerService.create(newCustomer);
      await loadCustomers();
      onSelectCustomer(createdCustomer);
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
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase().trim();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.mobile.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-2">
      <Label>Customer</Label>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => {
            setShowSearchDialog(true);
            setSearchQuery('');
          }}
        >
          {selectedCustomer ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{selectedCustomer.name}</span>
              <span className="text-muted-foreground">({selectedCustomer.mobile})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search customer...</span>
            </div>
          )}
        </Button>
        
        {selectedCustomer && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSelectCustomer(undefined)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowNewCustomerDialog(true)}
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Search Customers</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Search by name or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {filteredCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No customers found
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      className="w-full px-4 py-3 text-left rounded-lg hover:bg-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={() => {
                        onSelectCustomer(customer);
                        setShowSearchDialog(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{customer.name}</span>
                        <span className="text-sm text-muted-foreground">{customer.mobile}</span>
                        {customer.address && (
                          <span className="text-sm text-muted-foreground truncate">{customer.address}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter customer name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Mobile</Label>
              <Input
                value={newCustomer.mobile}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="Enter mobile number"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={newCustomer.address}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter address"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewCustomerDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomer}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}