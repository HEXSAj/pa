// src/services/autoCashierSessionService.ts
import { cashierService } from './cashierService';
import { UserRole } from '@/context/AuthContext';

export interface AutoCashierSessionResult {
  shouldPrompt: boolean;
  hasActiveSession: boolean;
  message: string;
}

export const autoCashierSessionService = {
  /**
   * Check if user should be prompted to start a cashier session
   * Only for pharmacy, cashier and admin users who are clocked in but don't have an active cashier session
   * Also checks if any other user already has an active session
   */
  async checkShouldPromptCashierSession(userId: string, userRole: UserRole): Promise<AutoCashierSessionResult> {
    try {
      // Only prompt pharmacy, cashier and admin users
      if (userRole !== 'pharmacy' && userRole !== 'cashier' && userRole !== 'admin') {
        return {
          shouldPrompt: false,
          hasActiveSession: false,
          message: 'Auto cashier session prompt only available for pharmacy, cashier and admin roles'
        };
      }

      console.log('🔍 Checking cashier session status for user:', userId, 'role:', userRole);

      // Check if user already has an active cashier session
      const activeSession = await cashierService.getActiveSession(userId);
      
      if (activeSession) {
        console.log('ℹ️ User already has active cashier session');
        return {
          shouldPrompt: false,
          hasActiveSession: true,
          message: 'User already has an active cashier session'
        };
      }

      // Check if any other user has an active cashier session
      const hasAnyActiveSession = await cashierService.hasAnyActiveSession();
      
      if (hasAnyActiveSession) {
        console.log('ℹ️ Another user already has an active cashier session - no need to prompt');
        return {
          shouldPrompt: false,
          hasActiveSession: false,
          message: 'Another user already has an active cashier session'
        };
      }

      console.log('✅ User needs cashier session - should prompt');
      return {
        shouldPrompt: true,
        hasActiveSession: false,
        message: 'User should be prompted to start cashier session'
      };

    } catch (error: any) {
      console.error('❌ Error checking cashier session status:', error);
      return {
        shouldPrompt: false,
        hasActiveSession: false,
        message: 'Error checking cashier session status',
        error: error.message || 'Unknown error'
      };
    }
  },

  /**
   * Get user's latest cashier session for discrepancy checking
   */
  async getLatestSession(userId: string): Promise<any | null> {
    try {
      const latestSession = await cashierService.getLatestSession(userId);
      return latestSession;
    } catch (error) {
      console.error('Error getting latest session:', error);
      return null;
    }
  }
};
