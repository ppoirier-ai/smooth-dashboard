export interface AssetBalance {
  id: string;
  asset: string;
  quantity: number;
  entryPrice: number;
  accountType: string;
  snapshotId: string;
}

export interface MarginLoan {
  id: string;
  asset: string;
  amount: number;
  interestRate: number;
  interestPaid: number;
  healthRatio: number;
  snapshotId: string;
}

export interface PortfolioSnapshot {
  id: string;
  timestamp: Date;
  totalValue: number;
  netValue: number;
  assetBalances: AssetBalance[];
  marginLoans: MarginLoan[];
} 