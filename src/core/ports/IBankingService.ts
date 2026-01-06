import { ComplianceBalance } from "../domain/Compliance";

export interface IBankingService {
    getCurrentBalance(year: number): Promise<ComplianceBalance>;
    bankSurplus(amount: number, year: number): Promise<ComplianceBalance>;
    applySurplus(amount: number, year: number): Promise<ComplianceBalance>;
}