// src/components/CashierSessionWarningBanner.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/context/AuthContext';
import { cashierService } from '@/services/cashierService';
import { 
  AlertTriangle, 
  Calculator, 
  X,
  Clock
} from 'lucide-react';

interface CashierSessionWarningBannerProps {
  onStartSession: () => void;
  onDismiss: () => void;
}

export default function CashierSessionWarningBanner({
  onStartSession,
  onDismiss
}: CashierSessionWarningBannerProps) {
  const { user } = useAuth();
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [hasAnyActiveSession, setHasAnyActiveSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      checkActiveSession();
    }
  }, [user?.uid]);

  const checkActiveSession = async () => {
    try {
      // Check if current user has active session
      const activeSession = await cashierService.getActiveSession(user!.uid);
      setHasActiveSession(!!activeSession);
      
      // Check if any user has active session
      const anyActiveSession = await cashierService.hasAnyActiveSession();
      setHasAnyActiveSession(anyActiveSession);
    } catch (error) {
      console.error('Error checking active session:', error);
    } finally {
      setChecking(false);
    }
  };

  // Don't show banner if user has active session, any user has active session, or is checking
  if (checking || hasActiveSession || hasAnyActiveSession) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 h-16 flex items-center">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-amber-700 border-amber-300">
              <Clock className="h-3 w-3 mr-1" />
              Cashier Session Required
            </Badge>
            <span className="text-sm text-amber-800">
              Start a cashier session to access POS features
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={onStartSession}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Start Session
          </Button>
          <Button
            onClick={onDismiss}
            size="sm"
            variant="ghost"
            className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
