import { appointmentService } from './appointmentService';
import { cashierService } from './cashierService';

export const appointmentRefreshService = {
  // Refresh all appointment data for a cashier session
  async refreshSessionData(sessionId: string) {
    try {
      // Update the session appointment count and payment totals
      await cashierService.updateSessionAppointmentCount(sessionId);
      
      // Get the updated session data by getting all sessions and finding the specific one
      const allSessions = await cashierService.getAllSessions();
      const updatedSession = allSessions.find(session => session.id === sessionId);
      
      return updatedSession;
    } catch (error) {
      console.error('Error refreshing session data:', error);
      throw error;
    }
  },

  // Refresh appointment counts for a specific user's active session
  async refreshUserActiveSession(userId: string) {
    try {
      const activeSession = await cashierService.getActiveSession(userId);
      
      if (activeSession?.id) {
        await cashierService.updateSessionAppointmentCount(activeSession.id);
        
        // Return the refreshed session
        const refreshedSession = await cashierService.getActiveSession(userId);
        return refreshedSession;
      }
      
      return null;
    } catch (error) {
      console.error('Error refreshing user active session:', error);
      throw error;
    }
  },

  // Refresh appointment counts for all sessions (if needed for admin purposes)
  async refreshAllSessions() {
    try {
      const allSessions = await cashierService.getAllSessions();
      
      // Filter only active sessions
      const activeSessions = allSessions.filter(session => session.isActive);
      
      for (const session of activeSessions) {
        if (session.id) {
          await cashierService.updateSessionAppointmentCount(session.id);
        }
      }
      
      return activeSessions.length;
    } catch (error) {
      console.error('Error refreshing all sessions:', error);
      throw error;
    }
  },

  // Simple refresh for current session
  async refreshCurrentSession(sessionId: string) {
    try {
      await cashierService.updateSessionAppointmentCount(sessionId);
      return true;
    } catch (error) {
      console.error('Error refreshing current session:', error);
      return false;
    }
  }
};