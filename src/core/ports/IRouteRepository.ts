import { RouteEntity } from "../domain/Route";

export interface IRouteRepository {
    getAllRoutes(): Promise<RouteEntity[]>;
    getRouteById(id: string): Promise<RouteEntity | null>;
    setBaseline(routeId: string): Promise<void>;
}