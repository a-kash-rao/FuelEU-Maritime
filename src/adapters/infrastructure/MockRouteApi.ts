import { IRouteRepository } from "../../core/ports/IRouteRepository";
import { RouteEntity } from "../../core/domain/Route";

const MOCK_ROUTES: RouteEntity[] = [
  { 
    routeId: "R001", 
    vesselType: "Container", 
    fuelType: "HFO", 
    year: 2024, 
    ghgIntensity: 91.0, 
    fuelConsumption: 5000, 
    distance: 12000, 
    totalEmissions: 4500, 
    isBaseline: true 
  },
  { 
    routeId: "R002", 
    vesselType: "BulkCarrier", // Note: Ensure 'BulkCarrier' is in your VesselType definition
    fuelType: "LNG", 
    year: 2024, 
    ghgIntensity: 88.0, 
    fuelConsumption: 4800, 
    distance: 11500, 
    totalEmissions: 4200, 
    isBaseline: true 
  },
  { 
    routeId: "R003", 
    vesselType: "Tanker", 
    fuelType: "MGO", // Note: Ensure 'MGO' is in your FuelType definition
    year: 2024, 
    ghgIntensity: 93.5, 
    fuelConsumption: 5100, 
    distance: 12500, 
    totalEmissions: 4700, 
    isBaseline: true 
  },
  { 
    routeId: "R004", 
    vesselType: "RoRo", 
    fuelType: "HFO", 
    year: 2025, 
    ghgIntensity: 89.2, 
    fuelConsumption: 4900, 
    distance: 11800, 
    totalEmissions: 4300, 
    isBaseline: false 
  },
  { 
    routeId: "R005", 
    vesselType: "Container", 
    fuelType: "LNG", 
    year: 2025, 
    ghgIntensity: 90.5, 
    fuelConsumption: 4950, 
    distance: 11900, 
    totalEmissions: 4400, 
    isBaseline: false 
  },
];

// -- The Adapter --
export class MockRouteApi implements IRouteRepository {
    private routes = [...MOCK_ROUTES]; // In-memory store

    async getAllRoutes(): Promise<RouteEntity[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        return this.routes;
    }

    async getRouteById(id: string): Promise<RouteEntity | null> {
        return this.routes.find(r => r.routeId === id) || null;
    }

    async setBaseline(routeId: string): Promise<void> {
        this.routes = this.routes.map(r => ({
            ...r,
            isBaseline: r.routeId === routeId
        }));
    }
}