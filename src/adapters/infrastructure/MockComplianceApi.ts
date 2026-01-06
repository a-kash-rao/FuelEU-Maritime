import { IBankingService } from "../../core/ports/IBankingService";
import { IPoolingService } from "../../core/ports/IPoolingService";
import { ComplianceBalance } from "../../core/domain/Compliance";
import { Pool, PoolMember } from "../../core/domain/Pool";

export class MockComplianceApi implements IBankingService, IPoolingService {
    
    // Initial State: We give a Deficit (-500) but some Banked credits (2000)
    // so you can test the "Apply" feature immediately.
    private balanceStore: ComplianceBalance = { 
        year: 2025, 
        balance: -500,  // Started with a deficit to demo "Apply"
        banked: 2000    // Available from 2024
    };

    async getCurrentBalance(year: number): Promise<ComplianceBalance> {
        return { ...this.balanceStore };
    }

    async bankSurplus(amount: number, year: number): Promise<ComplianceBalance> {
        if (amount > this.balanceStore.balance) {
            throw new Error("Insufficient balance to bank.");
        }
        this.balanceStore.balance -= amount;
        this.balanceStore.banked += amount;
        return { ...this.balanceStore };
    }

    // NEW: Implementation of Apply
    async applySurplus(amount: number, year: number): Promise<ComplianceBalance> {
        if (amount > this.balanceStore.banked) {
            throw new Error("Insufficient banked amount.");
        }
        // Logic: Reduce banked, Increase current balance (reduce deficit)
        this.balanceStore.banked -= amount;
        this.balanceStore.balance += amount;
        return { ...this.balanceStore };
    }

    // --- Pooling Implementation (Unchanged) ---
    async createPool(members: PoolMember[]): Promise<Pool> {
        const total = members.reduce((sum, m) => sum + m.verifiedCb, 0);
        return {
            poolId: `POOL-${Math.floor(Math.random() * 1000)}`,
            members,
            totalBalance: total,
            isValid: total >= 0
        };
    }

    validatePool(members: PoolMember[]): boolean {
        return members.reduce((sum, m) => sum + m.verifiedCb, 0) >= 0;
    }
}