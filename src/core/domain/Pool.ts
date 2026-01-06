export interface PoolMember {
    shipId: string;
    vesselName: string;
    verifiedCb: number; // Compliance Balance
}

export interface Pool {
    poolId: string;
    members: PoolMember[];
    totalBalance: number;
    isValid: boolean;
}