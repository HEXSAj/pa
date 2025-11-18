// src/types/priceHistory.ts
export interface PriceHistory {
  id?: string;
  labTestId: string;
  labTestName: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string; // Staff UID
  changedByName?: string; // Staff display name for easier display
  changedAt: Date;
  reason?: string; // Optional reason for the change
}