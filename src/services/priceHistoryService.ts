// src/services/priceHistoryService.ts
import { database } from '@/lib/firebase';
import { ref, set, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { PriceHistory } from '@/types/priceHistory';
import { staffService } from './staffService';

const COLLECTION = 'priceHistory';

export const priceHistoryService = {
  async recordPriceChange(change: Omit<PriceHistory, 'id' | 'changedAt' | 'changedByName'>) {
    try {
      // Get staff member details
      const staff = await staffService.getStaffById(change.changedBy);
      
      const historyData = {
        ...change,
        changedByName: staff?.displayName || staff?.email || 'Unknown',
        changedAt: Date.now()
      };

      const newHistoryRef = push(ref(database, COLLECTION));
      await set(newHistoryRef, historyData);
      
      return newHistoryRef.key;
    } catch (error) {
      console.error('Error recording price change:', error);
      throw error;
    }
  },

  async getHistoryByLabTest(labTestId: string): Promise<PriceHistory[]> {
    try {
      const historyRef = ref(database, COLLECTION);
      const labTestQuery = query(historyRef, orderByChild('labTestId'), equalTo(labTestId));
      const snapshot = await get(labTestQuery);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const history: PriceHistory[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        history.push({
          id: childSnapshot.key!,
          labTestId: data.labTestId,
          labTestName: data.labTestName,
          oldPrice: data.oldPrice,
          newPrice: data.newPrice,
          changedBy: data.changedBy,
          changedByName: data.changedByName,
          changedAt: new Date(data.changedAt),
          reason: data.reason
        });
      });
      
      // Sort by most recent first
      history.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
      
      return history;
    } catch (error) {
      console.error('Error getting price history:', error);
      throw error;
    }
  },

  async getAllHistory(): Promise<PriceHistory[]> {
    try {
      const historyRef = ref(database, COLLECTION);
      const snapshot = await get(historyRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const history: PriceHistory[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        history.push({
          id: childSnapshot.key!,
          labTestId: data.labTestId,
          labTestName: data.labTestName,
          oldPrice: data.oldPrice,
          newPrice: data.newPrice,
          changedBy: data.changedBy,
          changedByName: data.changedByName,
          changedAt: new Date(data.changedAt),
          reason: data.reason
        });
      });
      
      // Sort by most recent first
      history.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
      
      return history;
    } catch (error) {
      console.error('Error getting all price history:', error);
      throw error;
    }
  }
};