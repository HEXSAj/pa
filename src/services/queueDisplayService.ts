// src/services/queueDisplayService.ts
import { database } from '@/lib/firebase';
import { ref, set, onValue, off, get } from 'firebase/database';

const QUEUE_DISPLAY_COLLECTION = 'queueDisplay';

export interface QueueDisplayData {
  sessionId: string;
  currentAppointmentNumber: number | null;
  doctorId: string;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  updatedAt: number;
  updatedBy?: string;
}

export const queueDisplayService = {
  /**
   * Set the current appointment number for a session
   */
  async setCurrentAppointment(
    sessionId: string,
    appointmentNumber: number,
    doctorId: string,
    doctorName: string,
    date: string,
    startTime: string,
    endTime: string,
    userId?: string
  ): Promise<void> {
    const queueRef = ref(database, `${QUEUE_DISPLAY_COLLECTION}/${sessionId}`);
    
    const queueData: QueueDisplayData = {
      sessionId,
      currentAppointmentNumber: appointmentNumber,
      doctorId,
      doctorName,
      date,
      startTime,
      endTime,
      updatedAt: Date.now(),
      updatedBy: userId
    };
    
    await set(queueRef, queueData);
  },

  /**
   * Get the current appointment number for a session
   */
  async getCurrentAppointment(sessionId: string): Promise<QueueDisplayData | null> {
    const queueRef = ref(database, `${QUEUE_DISPLAY_COLLECTION}/${sessionId}`);
    const snapshot = await get(queueRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as QueueDisplayData;
    }
    
    return null;
  },

  /**
   * Subscribe to real-time updates for a session's queue display
   */
  subscribeToQueueDisplay(
    sessionId: string,
    callback: (data: QueueDisplayData | null) => void
  ): () => void {
    const queueRef = ref(database, `${QUEUE_DISPLAY_COLLECTION}/${sessionId}`);
    
    const unsubscribe = onValue(queueRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as QueueDisplayData);
      } else {
        callback(null);
      }
    });
    
    return () => {
      off(queueRef);
    };
  },

  /**
   * Clear the current appointment (when session ends)
   */
  async clearCurrentAppointment(sessionId: string): Promise<void> {
    const queueRef = ref(database, `${QUEUE_DISPLAY_COLLECTION}/${sessionId}`);
    await set(queueRef, null);
  }
};

