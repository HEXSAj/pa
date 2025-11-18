// src/app/dashboard/viewSales/StaffSelector.tsx
import React, { useState, useEffect } from 'react';
import { staffService } from '@/services/staffService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, User, X } from "lucide-react";
import { StaffUser } from '@/types/staff';

interface StaffSelectorProps {
  onSelectStaff: (staff: StaffUser | undefined) => void;
  selectedStaff?: StaffUser;
}

export function StaffSelector({ onSelectStaff, selectedStaff }: StaffSelectorProps) {
  const [staffMembers, setStaffMembers] = useState<StaffUser[]>([]);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStaffMembers();
  }, []);

  const loadStaffMembers = async () => {
    try {
      setLoading(true);
      const staff = await staffService.getAllStaff();
      setStaffMembers(staff);
    } catch (error) {
      console.error('Error loading staff members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staffMembers.filter(staff => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase().trim();
    return (
      (staff.displayName?.toLowerCase() || '').includes(searchLower) ||
      (staff.email?.toLowerCase() || '').includes(searchLower) ||
      (staff.role?.toLowerCase() || '').includes(searchLower)
    );
  });

  return (
    <div className="space-y-2">
      <Label>Staff Member</Label>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => {
            setShowSearchDialog(true);
            setSearchQuery('');
          }}
        >
          {selectedStaff ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{selectedStaff.displayName || selectedStaff.email}</span>
              <span className="text-muted-foreground">({selectedStaff.role})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search staff member...</span>
            </div>
          )}
        </Button>
        
        {selectedStaff && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSelectStaff(undefined)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Search Staff Members</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Search by name, email or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading staff members...
                </p>
              ) : filteredStaff.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No staff members found
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredStaff.map((staff) => (
                    <button
                      key={staff.uid}
                      className="w-full px-4 py-3 text-left rounded-lg hover:bg-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={() => {
                        onSelectStaff(staff);
                        setShowSearchDialog(false);
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{staff.displayName || 'Unknown'}</span>
                        <span className="text-sm text-muted-foreground">{staff.email}</span>
                        <span className="text-xs text-muted-foreground capitalize">{staff.role || 'Staff'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}