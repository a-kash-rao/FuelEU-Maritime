import { Pool, PoolMember } from "../domain/Pool";

export interface IPoolingService {
    createPool(members: PoolMember[]): Promise<Pool>;
    validatePool(members: PoolMember[]): boolean;
}