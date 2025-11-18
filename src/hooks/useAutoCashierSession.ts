// src/hooks/useAutoCashierSession.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { autoCashierSessionService } from '@/services/autoCashierSessionService';

interface UseAutoCashierSessionResult {
  shouldPromptCashier: boolean;
  showCashierPrompt: boolean;
  showWarningBanner: boolean;
  isChecking: boolean;
  promptCashierSession: () => void;
  skipCashierSession: () => void;
  dismissWarningBanner: () => void;
  startCashierSession: () => void;
  closeCashierPrompt: () => void;
}

export const useAutoCashierSession = (): UseAutoCashierSessionResult => {
  const { user, userRole } = useAuth();
  const [shouldPromptCashier, setShouldPromptCashier] = useState(false);
  const [showCashierPrompt, setShowCashierPrompt] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);

  // Check if user should be prompted for cashier session
  useEffect(() => {
    if (!user || !userRole || (userRole !== 'pharmacy' && userRole !== 'cashier' && userRole !== 'admin')) {
      return;
    }

    const checkCashierSession = async () => {
      setIsChecking(true);
      try {
        const result = await autoCashierSessionService.checkShouldPromptCashierSession(user.uid, userRole);
        setShouldPromptCashier(result.shouldPrompt);
        
        // Only auto-prompt if this is the first check (not on every page refresh)
        if (result.shouldPrompt && !hasCheckedOnce) {
          // Delay the prompt slightly to let the page load
          setTimeout(() => {
            setShowCashierPrompt(true);
          }, 2000);
        }
        
        setHasCheckedOnce(true);
      } catch (error) {
        console.error('Error checking cashier session:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkCashierSession();
  }, [user, userRole, hasCheckedOnce]);

  const promptCashierSession = () => {
    setShowCashierPrompt(true);
    setShowWarningBanner(false);
  };

  const skipCashierSession = () => {
    console.log('⏭️ Skip cashier session called - showing warning banner');
    setShowCashierPrompt(false);
    setShowWarningBanner(true); // Show warning banner when skipped
  };

  const dismissWarningBanner = () => {
    setShowWarningBanner(false);
  };

  const startCashierSession = () => {
    console.log('✅ Start cashier session called - closing prompts');
    setShowCashierPrompt(false);
    setShowWarningBanner(false);
    setShouldPromptCashier(false);
  };

  const closeCashierPrompt = () => {
    setShowCashierPrompt(false);
  };

  return {
    shouldPromptCashier,
    showCashierPrompt,
    showWarningBanner,
    isChecking,
    promptCashierSession,
    skipCashierSession,
    dismissWarningBanner,
    startCashierSession,
    closeCashierPrompt
  };
};
