// src/app/dashboard/pos/StaffSelector.tsx
import React, { useState, useEffect } from 'react';
import { staffService } from '@/services/staffService';
import { Badge } from "@/components/ui/badge";
import { User, UserCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { StaffUser } from '@/types/staff';
import { useAuth } from '@/context/AuthContext';

interface StaffSelectorProps {
  onSelectStaff: (staff: StaffUser | null) => void;
  defaultStaff?: StaffUser | null;
}

export function StaffSelector({ onSelectStaff, defaultStaff }: StaffSelectorProps) {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(defaultStaff?.uid || null);
  
  // Load all staff members
  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);
        const staffList = await staffService.getAllStaff();
        setStaff(staffList);
        
        // If no default staff is provided, select the current user
        if (!defaultStaff && user) {
          const currentUserInList = staffList.find(s => s.uid === user.uid);
          if (currentUserInList) {
            setSelectedStaffId(currentUserInList.uid);
            onSelectStaff(currentUserInList);
          }
        }
      } catch (error) {
        console.error('Error loading staff:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStaff();
  }, [user, defaultStaff, onSelectStaff]);
  
  const handleStaffSelect = (staffMember: StaffUser) => {
    if (selectedStaffId === staffMember.uid) {
      // Deselect if already selected
      setSelectedStaffId(null);
      onSelectStaff(null);
    } else {
      // Select new staff
      setSelectedStaffId(staffMember.uid);
      onSelectStaff(staffMember);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span>Loading staff...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-gray-500" />
        <span className="font-medium">Sale created by</span>
        {selectedStaffId && (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            {staff.find(s => s.uid === selectedStaffId)?.displayName || 'Unknown'}
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {staff.map((staffMember) => (
          <motion.div
            key={staffMember.uid}
            whileTap={{ scale: 0.95 }}
            className={`
              p-3 rounded-lg border cursor-pointer transition-all flex flex-col items-center
              ${selectedStaffId === staffMember.uid 
                ? 'bg-primary/10 border-primary shadow' 
                : 'bg-white hover:bg-gray-50 border-gray-200'}
            `}
            onClick={() => handleStaffSelect(staffMember)}
          >
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mb-1
              ${selectedStaffId === staffMember.uid 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-600'}
            `}>
              {staffMember.displayName?.charAt(0).toUpperCase() || 
               staffMember.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-center">
              <div className="text-sm font-medium truncate max-w-full">
                {staffMember.displayName || 'Unknown'}
              </div>
              <div className="text-xs text-gray-500 truncate max-w-full">
                {staffMember.role}
              </div>
            </div>
            {selectedStaffId === staffMember.uid && (
              <Badge className="mt-1 bg-primary/10 text-primary border-primary/20">
                <UserCheck className="h-3 w-3 mr-1" />
                Selected
              </Badge>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}