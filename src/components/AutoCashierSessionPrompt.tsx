// src/components/AutoCashierSessionPrompt.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { cashierService } from '@/services/cashierService';
import { staffService } from '@/services/staffService';
import { 
  DollarSign, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  Calculator
} from 'lucide-react';
import { format } from 'date-fns';

interface AutoCashierSessionPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionStarted: () => void;
  onSkip: () => void;
}

export default function AutoCashierSessionPrompt({
  isOpen,
  onClose,
  onSessionStarted,
  onSkip
}: AutoCashierSessionPromptProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [loading, setLoading] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [startingAmounts, setStartingAmounts] = useState({
    lkr: 0 as number | string
  });
  const [latestSession, setLatestSession] = useState<any>(null);
  const [cashDiscrepancy, setCashDiscrepancy] = useState(false);
  const [discrepancyReason, setDiscrepancyReason] = useState("");
  const [showDiscrepancyForm, setShowDiscrepancyForm] = useState(false);

  // Load user data and latest session on mount
  useEffect(() => {
    if (isOpen && user?.uid) {
      loadUserData();
    }
  }, [isOpen, user?.uid]);

  const loadUserData = async () => {
    try {
      // Get user display name
      const staff = await staffService.getStaffById(user!.uid);
      setUserDisplayName(staff?.displayName || user!.email || 'Unknown User');

      // Get latest session for discrepancy check
      const latestSession = await cashierService.getLatestSession(user!.uid);
      if (latestSession) {
        setLatestSession(latestSession);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkCashDiscrepancy = () => {
    if (!latestSession?.endingAmounts) return false;
    
    const expectedAmount = latestSession.endingAmounts.lkr || 0;
    const actualAmount = typeof startingAmounts.lkr === 'string' ? 
      parseFloat(startingAmounts.lkr) || 0 : startingAmounts.lkr;
    
    const difference = Math.abs(expectedAmount - actualAmount);
    return difference > 0.01; // Allow for small floating point differences
  };

  const handleStartSession = async () => {
    if (!user?.uid) return;
    
    console.log('🏦 Starting cashier session...', { userId: user.uid, userDisplayName });
    setLoading(true);
    try {
      // Check for discrepancy if there's a latest session
      if (latestSession?.endingAmounts) {
        const hasDifference = checkCashDiscrepancy();
        
        if (hasDifference && !discrepancyReason.trim()) {
          setShowDiscrepancyForm(true);
          setLoading(false);
          return;
        }
        
        // Record discrepancy if there is one
        if (hasDifference) {
          await cashierService.recordCashDiscrepancy({
            userId: user.uid,
            userName: userDisplayName,
            sessionId: latestSession.id!,
            expectedAmounts: latestSession.endingAmounts,
            actualAmounts: {
              lkr: typeof startingAmounts.lkr === 'string' ? parseFloat(startingAmounts.lkr) || 0 : startingAmounts.lkr
            },
            reason: discrepancyReason,
            createdAt: Date.now()
          });
        }
      }
      
      // Start the session
      const session = {
        userId: user.uid,
        userName: userDisplayName,
        startDate: new Date(),
        startingAmounts: {
          lkr: typeof startingAmounts.lkr === 'string' ? 
               parseFloat(startingAmounts.lkr) || 0 : 
               startingAmounts.lkr
        } as { lkr: number }
      };
      
      await cashierService.startSession(session);
      
      toast({
        title: "Cashier session started!",
        description: "You can now access POS features.",
        variant: "default"
      });
      
      onSessionStarted();
      onClose();
      
    } catch (error: any) {
      console.error('Error starting cashier session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start cashier session",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    console.log('⏭️ Skipping cashier session...');
    onSkip();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Start Cashier Session
          </DialogTitle>
          <DialogDescription>
            You've been automatically clocked in. Please start your cashier session to access POS features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cashier:</span>
                <span className="font-medium">{userDisplayName}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm">{format(new Date(), 'PPP')}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">Time:</span>
                <span className="text-sm">{format(new Date(), 'p')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Starting Amount */}
          <div className="space-y-2">
            <Label htmlFor="startingAmount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Starting Amount (LKR)
            </Label>
            <Input
              id="startingAmount"
              type="number"
              value={startingAmounts.lkr}
              onChange={(e) => setStartingAmounts(prev => ({ ...prev, lkr: e.target.value }))}
              placeholder="0.00"
              className="text-lg font-medium"
            />
            {latestSession?.endingAmounts && (
              <div className="text-xs text-gray-500">
                Previous session ended with: LKR {latestSession.endingAmounts.lkr?.toFixed(2) || '0.00'}
              </div>
            )}
          </div>

          {/* Discrepancy Warning */}
          {latestSession?.endingAmounts && checkCashDiscrepancy() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Cash Discrepancy Detected</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Starting amount differs from previous session's ending amount.
              </p>
              {showDiscrepancyForm && (
                <div className="mt-3 space-y-2">
                  <Label htmlFor="discrepancyReason" className="text-xs">
                    Reason for discrepancy:
                  </Label>
                  <Input
                    id="discrepancyReason"
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Skip for Now
            </Button>
            <Button
              onClick={handleStartSession}
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Start Session
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Note</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              You can skip this for now and start a cashier session later from the POS page.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
