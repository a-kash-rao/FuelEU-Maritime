export interface ComplianceBalance {
  year: number;
  balance: number; // Positive = Surplus, Negative = Deficit
  banked: number;
}

export interface PoolMember {
  shipId: string;
  initialCb: number;
  adjustedCb: number;
}