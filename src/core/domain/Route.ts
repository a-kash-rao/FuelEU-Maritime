export type VesselType = 'Container' | 'Bulker' | 'BulkCarrier' | 'Tanker' | 'RoRo';
export type FuelType = 'HFO' | 'MDO' | 'MGO' | 'LNG' | 'Methanol';

export interface RouteEntity {
  routeId: string;
  vesselType: VesselType;
  fuelType: FuelType;
  year: number;
  ghgIntensity: number; // gCO₂e/MJ
  fuelConsumption: number; // tonnes
  distance: number; // km
  totalEmissions: number; // tonnes
  isBaseline: boolean;
}

export const TARGET_GHG = 89.3368; // 2025 Target