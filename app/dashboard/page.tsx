'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PriceChart from '@/components/charts/PriceChart';
import AssetTable from '@/components/trading/AssetTable';
import PortfolioSummary from '@/components/dashboard/PortfolioSummary';
import ApiKeySelector from '@/components/dashboard/ApiKeySelector';

interface SpotBalance {
  asset: string;
  free: string;
  locked: string;
  total: string;
}

interface MarginBalance {
  asset: string;
  free: string;
  locked: string;
  borrowed: string;
  interest: string;
  netAsset: string;
}

interface FuturesBalance {
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

interface AccountData {
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

interface Balance {
  asset: string;
  free: string;
  locked: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedKeyId, setSelectedKeyId] = useState<string>();

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
    
    if (status === 'unauthenticated') {
      setError('Please sign in to view your dashboard');
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    async function fetchAccountData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/binance/account${selectedKeyId ? `?keyId=${selectedKeyId}` : ''}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || data.details || 'Failed to fetch account data');
        }
        
        setAccountData(data);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch account data');
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchAccountData();
    } else {
      setLoading(false);
    }
  }, [session, selectedKeyId]);

  if (loading && status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg">
        {error}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500 text-yellow-500 rounded-lg">
        Please sign in to view your dashboard
      </div>
    );
  }

  if (!accountData) {
    return <div>No account data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <ApiKeySelector 
          currentKeyId={selectedKeyId}
          onKeyChange={setSelectedKeyId}
        />
      </div>
      <PortfolioSummary />
      <PriceChart />
      <AssetTable apiKeyId={selectedKeyId} />
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Account Overview</h1>
          <p className="text-text-secondary">
            Last updated: {new Date(accountData.updateTime).toLocaleString()}
          </p>
        </div>

        {/* Spot Account */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">Spot Account</h2>
          <div className="grid gap-4">
            {accountData.spot.balances.map((balance: SpotBalance) => (
              <div key={balance.asset} className="bg-card-background p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{balance.asset}</h3>
                  <span>Total: {parseFloat(balance.total).toFixed(8)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-text-secondary">Available</p>
                    <p>{parseFloat(balance.free).toFixed(8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Locked</p>
                    <p>{parseFloat(balance.locked).toFixed(8)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Margin Account */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">Margin Account</h2>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="bg-card-background p-4 rounded-lg">
              <p className="text-sm text-text-secondary">Total Assets (BTC)</p>
              <p>{accountData.margin.totalAssetOfBtc.toFixed(8)}</p>
            </div>
            <div className="bg-card-background p-4 rounded-lg">
              <p className="text-sm text-text-secondary">Total Liabilities (BTC)</p>
              <p>{accountData.margin.totalLiabilityOfBtc.toFixed(8)}</p>
            </div>
          </div>
          <div className="grid gap-4">
            {accountData.margin.balances.map((balance: MarginBalance) => (
              <div key={balance.asset} className="bg-card-background p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{balance.asset}</h3>
                  <span>Net: {parseFloat(balance.netAsset).toFixed(8)}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-text-secondary">Available</p>
                    <p>{parseFloat(balance.free).toFixed(8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Borrowed</p>
                    <p>{parseFloat(balance.borrowed).toFixed(8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Interest</p>
                    <p>{parseFloat(balance.interest).toFixed(8)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Futures Account */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4">Futures Account</h2>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="bg-card-background p-4 rounded-lg">
              <p className="text-sm text-text-secondary">Total Balance</p>
              <p>{accountData.futures.totalWalletBalance}</p>
            </div>
            <div className="bg-card-background p-4 rounded-lg">
              <p className="text-sm text-text-secondary">Unrealized PNL</p>
              <p>{accountData.futures.totalUnrealizedProfit}</p>
            </div>
          </div>
          <div className="grid gap-4">
            {accountData.futures.balances.map((balance: FuturesBalance) => (
              <div key={balance.asset} className="bg-card-background p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{balance.asset}</h3>
                  <span>Balance: {parseFloat(balance.walletBalance).toFixed(8)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-text-secondary">Unrealized Profit</p>
                    <p>{parseFloat(balance.unrealizedProfit).toFixed(8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Margin Balance</p>
                    <p>{parseFloat(balance.marginBalance).toFixed(8)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trading Bot Account */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">Trading Bot Account</h2>
          <div className="grid gap-4">
            {accountData.tradingBot.balances.map((balance: TradingBotBalance) => (
              <div key={balance.strategyId} className="bg-card-background p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{balance.strategyName}</h3>
                  <span>Total: {parseFloat(balance.total).toFixed(8)} {balance.asset}</span>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-text-secondary">Available</p>
                    <p>{parseFloat(balance.free).toFixed(8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Locked</p>
                    <p>{parseFloat(balance.locked).toFixed(8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">PNL</p>
                    <p>{parseFloat(balance.pnl).toFixed(8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">ROI</p>
                    <p>{parseFloat(balance.roi).toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 