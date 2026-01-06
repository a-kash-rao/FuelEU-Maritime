import { RouteEntity, TARGET_GHG } from '../domain/Route';
import { PoolMember } from '../domain/Compliance';

export const calculateDiff = (current: number, baseline: number) => {
  if (baseline === 0) return 0;
  return ((current / baseline) - 1) * 100;
};

export const isCompliant = (intensity: number) => intensity <= TARGET_GHG;

export const validatePool = (members: PoolMember[]): { isValid: boolean; message: string } => {
  const poolSum = members.reduce((sum, m) => sum + m.adjustedCb, 0);
  
  // Rule: Sum(adjustedCB) >= 0
  if (poolSum < 0) return { isValid: false, message: "Pool total balance is negative." };
  
  // Rule Check: Logic typically requires checking against a baseline scenario
  // For this demo, we check if the sum is positive.
  
  return { isValid: true, message: "Pool configuration is valid." };
};