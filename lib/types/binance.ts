export interface SpotBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface MarginBalance {
  asset: string;
  borrowed: string;
  free: string;
  interest: string;
  locked: string;
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

export interface TradingBotBalance {
  asset: string;
  free: string;
  locked: string;
  total: string;
  strategyId: string;
  strategyName: string;
  type: string;
  symbol: string;
  pnl?: string;
  roi?: string;
} 