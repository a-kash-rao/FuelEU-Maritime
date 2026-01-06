import { useState, useEffect } from 'react';
import { MockRouteApi } from '../../infrastructure/MockRouteApi';
import { MockComplianceApi } from '../../infrastructure/MockComplianceApi';
import { RouteEntity } from '../../../core/domain/Route';
import { ComplianceBalance } from '../../../core/domain/Compliance';
import { PoolMember, Pool } from '../../../core/domain/Pool';

// Instantiate adapters (Singleton pattern)
const routeApi = new MockRouteApi();
const complianceApi = new MockComplianceApi();

export const useFuelEU = () => {
    const [routes, setRoutes] = useState<RouteEntity[]>([]);
    const [balance, setBalance] = useState<ComplianceBalance | null>(null);
    const [loading, setLoading] = useState(false);
    
    // --- Pooling State ---
    // We start with one "Self" member (the user's ship)
    const [poolDraft, setPoolDraft] = useState<PoolMember[]>([
        { shipId: "MY-FLEET-01", vesselName: "My Current Fleet", verifiedCb: -500 } // Example deficit
    ]);
    const [activePool, setActivePool] = useState<Pool | null>(null);

    // Initial Fetch
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const r = await routeApi.getAllRoutes();
            const b = await complianceApi.getCurrentBalance(2025);
            setRoutes(r);
            setBalance(b);
            setLoading(false);
        };
        init();
    }, []);

    // --- Actions ---

    const setBaseline = async (id: string) => {
        await routeApi.setBaseline(id);
        const updated = await routeApi.getAllRoutes();
        setRoutes(updated);
    };

    const bankSurplus = async (amount: number) => {
        if (!balance) return;
        try {
            const newBalance = await complianceApi.bankSurplus(amount, 2025);
            setBalance(newBalance);
        } catch (e) {
            alert((e as Error).message);
        }
    };

    const applySurplus = async (amount: number) => {
        if (!balance) return;
        try {
            const newBalance = await complianceApi.applySurplus(amount, 2025);
            setBalance(newBalance);
        } catch (e) {
            alert((e as Error).message);
        }
    };

    // POOLING ACTIONS
    const addPoolMember = (member: PoolMember) => {
        setPoolDraft(prev => [...prev, member]);
    };

    const removePoolMember = (shipId: string) => {
        setPoolDraft(prev => prev.filter(m => m.shipId !== shipId));
    };

    const createPool = async () => {
        try {
            const pool = await complianceApi.createPool(poolDraft);
            setActivePool(pool);
            alert(`Pool Created Successfully! ID: ${pool.poolId}`);
        } catch (e) {
            alert("Failed to create pool");
        }
    };

    return {
        routes,
        balance,
        pooling: {
            draft: poolDraft,
            activePool,
        },
        loading,
        actions: {
            setBaseline,
            bankSurplus,
            applySurplus,
            addPoolMember,
            removePoolMember,
            createPool
        }
    };
};