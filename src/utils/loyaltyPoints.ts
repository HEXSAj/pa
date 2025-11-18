// utils/loyaltyPoints.ts
export const LOYALTY_RATE = 0.5; // Rs 0.50 per 1000 points
export const POINTS_PER_THOUSAND = 1000;

export const calculateLoyaltyPoints = (saleAmount: number): number => {
  // For every Rs. 1000, generate 1000 points
  return Math.floor(saleAmount / 1000) * POINTS_PER_THOUSAND;
};

export const getPointsValue = (points: number): number => {
  // Convert points to rupees (0.50 per 1000 points)
  return (points / POINTS_PER_THOUSAND) * LOYALTY_RATE;
};

export const getValidLoyaltyPoints = (points?: number): number => {
  if (!points || points < 0) return 0;
  return points;
};