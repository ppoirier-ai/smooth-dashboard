export interface SpotBalance {
  asset: string;
  free: string;
  locked: string;
  total?: number;
}

export interface MarginBalance {
  asset: string;
  free: string;
  locked: string;
  borrowed: string;
  interest: string;
  netAsset: string;
}

export interface FuturesBalance {
  asset: string;
  walletBalance: string;
  unrealizedProfit: string;
  marginBalance: string;
  maintMargin: string;
  initialMargin: string;
}

interface TradingBotBalance {
  strategyId: string;
  strategyName: string;
  asset: string;
  free: string;
  locked: string;
  total: string;
  pnl: string;
  roi: string;
}

export interface AccountData {
  spot: {
    balances: SpotBalance[];
    canTrade: boolean;
  };
  margin: {
    balances: MarginBalance[];
    totalAssetOfBtc: number;
    totalLiabilityOfBtc: number;
    totalNetAssetOfBtc: number;
    marginRatio: number;
    marginLevel: number;
    totalCollateralValueInUSDT: number;
  };
  futures: {
    balances: FuturesBalance[];
    totalWalletBalance: number;
    totalUnrealizedProfit: number;
    totalMarginBalance: number;
  };
  tradingBot: {
    balances: TradingBotBalance[];
  };
  updateTime: number;
} 