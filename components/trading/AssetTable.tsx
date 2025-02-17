"use client";

import { useEffect, useState, useMemo } from 'react';
import { AccountData } from '@/types/binance';
import AccountSummary from '@/components/dashboard/AccountSummary';

interface CombinedAsset {
  asset: string;
  positions: {
    spot?: {
      total: number;
    };
    margin?: {
      total: number;
      borrowed: number;
      netAsset: number;
    };
    futures?: {
      balance: number;
      pnl: number;
    };
  };
  avgPrice?: number;
  currentPrice?: number;
  pnlPercentage?: number;
  totalValue: number;
}

interface Props {
  initialData?: AccountData;
  isPublicView?: boolean;
  initialPrices?: {[key: string]: number};
  initialTotalAssets?: number;
  apiKeyId?: string;
}

const FOCUS_ASSETS = ['BTC', 'SOL', 'AAVE', 'USDT'];

interface MarginBalance {
  asset: string;
  free: string;
  locked: string;
  borrowed: string;
  interest: string;
  netAsset: string;
}

const calculateTotalAssets = (
  accountData: AccountData | null,
  prices: {[key: string]: number} | null
) => {
  if (!accountData || !prices) return 0;

  // Calculate spot total
  const spotTotal = accountData.spot.balances.reduce((sum, balance) => {
    const total = parseFloat(balance.free) + parseFloat(balance.locked);
    const price = prices[balance.asset] || 0;
    const value = total * price;
    return sum + (value > 0 ? value : 0);
  }, 0);

  // Calculate margin total
  const marginTotal = accountData.margin.balances.reduce((sum, balance) => {
    const netAsset = parseFloat(balance.netAsset);
    const price = prices[balance.asset] || 0;
    const value = netAsset * price;
    return sum + (value > 0 ? value : 0);
  }, 0);

  // Calculate futures total
  const futuresTotal = accountData.futures.balances.reduce((sum, balance) => {
    const total = parseFloat(balance.walletBalance) + parseFloat(balance.unrealizedProfit);
    const price = prices[balance.asset] || 0;
    const value = total * price;
    return sum + (value > 0 ? value : 0);
  }, 0);

  return spotTotal + marginTotal + futuresTotal;
};

const parseBalanceValue = (value: string): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export default function AssetTable({ 
  initialData, 
  isPublicView,
  initialPrices,
  initialTotalAssets,
  apiKeyId
}: Props = {}) {
  const [accountData, setAccountData] = useState<AccountData | null>(initialData || null);
  const [prices, setPrices] = useState<{[key: string]: number}>(initialPrices || {});
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const pricesResponse = await fetch('/api/binance/prices');
        const pricesData = await pricesResponse.json();
        setPrices(pricesData);
      } catch (err) {
        console.error('Error fetching prices:', err);
      }
    }

    async function fetchData() {
      try {
        setLoading(true);
        const [accountResponse, pricesResponse] = await Promise.all([
          fetch(`/api/binance/account${apiKeyId ? `?keyId=${apiKeyId}` : ''}`),
          fetch('/api/binance/prices')
        ]);
        
        const accountData = await accountResponse.json();
        const pricesData = await pricesResponse.json();
        
        if (!accountResponse.ok) {
          throw new Error(accountData.error || accountData.details || 'Failed to fetch account data');
        }
        
        setAccountData(accountData);
        setPrices(pricesData);
      } catch (err) {
        console.error('Asset table error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    // Only fetch if we don't have initial data
    if (!initialPrices && isPublicView) {
      fetchPrices();
    } else if (!isPublicView) {
      fetchData();
    }
  }, [isPublicView, initialPrices, apiKeyId]);

  const combinedAssets = useMemo(() => {
    if (!accountData || !prices) {
      console.log('No account data or prices available');
      return [];
    }

    // Add this debug logging
    console.log('Raw margin account data:', accountData);

    const marginBalances = accountData?.margin?.balances || [];

    const assetMap = new Map<string, CombinedAsset>();

    // Initialize map with focus assets
    FOCUS_ASSETS.forEach(asset => {
      assetMap.set(asset, {
        asset,
        positions: {},
        totalValue: 0
      });
    });

    // Helper function to normalize asset symbols
    const normalizeAsset = (asset: string) => {
      // Temporary AAVE debug
      if (asset.toLowerCase() === 'aave') {
        console.log('AAVE normalization check:', {
          input: asset,
          focusAssets: FOCUS_ASSETS,
          match: FOCUS_ASSETS.find(a => a.toUpperCase() === asset.toUpperCase())
        });
      }
      
      const normalized = FOCUS_ASSETS.find(a => a.toUpperCase() === asset.toUpperCase()) || asset;
      console.log(`Normalizing asset: ${asset} -> ${normalized}`);
      return normalized;
    };

    // First pass: collect all assets with non-zero balances across all account types
    const relevantAssets = new Set<string>();

    // Check spot balances
    accountData.spot.balances.forEach(balance => {
      const total = parseBalanceValue(balance.free) + parseBalanceValue(balance.locked);
      if (total > 0) {
        const normalized = normalizeAsset(balance.asset);
        relevantAssets.add(normalized);
        console.log(`Found spot asset: ${balance.asset} -> ${normalized}, total: ${total}`);
      }
    });

    // Check margin balances
    console.log('Checking margin balances:', marginBalances);
    marginBalances.forEach(balance => {
      const total = parseBalanceValue(balance.free) + parseBalanceValue(balance.locked);
      const borrowed = parseBalanceValue(balance.borrowed);
      const netAsset = parseBalanceValue(balance.netAsset);
      const normalized = normalizeAsset(balance.asset);
      
      // Log raw values before parsing
      console.log(`Raw margin values for ${balance.asset}:`, {
        free: balance.free,
        locked: balance.locked,
        borrowed: balance.borrowed,
        netAsset: balance.netAsset
      });
      
      // Log parsed values
      console.log(`Parsed margin values for ${balance.asset}:`, {
        total,
        borrowed,
        netAsset
      });

      // More lenient check - include any non-zero value
      if (total !== 0 || borrowed !== 0 || netAsset !== 0) {
        relevantAssets.add(normalized);
        console.log(`Added margin asset: ${normalized} with netAsset: ${netAsset}`);
      }

      if (balance.asset.toUpperCase() === 'AAVE') {
        console.log('AAVE margin balance details:', {
          free: balance.free,
          locked: balance.locked,
          borrowed: balance.borrowed,
          netAsset: balance.netAsset
        });
      }
    });

    // Check futures balances
    accountData.futures.balances.forEach(balance => {
      const total = parseBalanceValue(balance.walletBalance);
      const pnl = parseBalanceValue(balance.unrealizedProfit);
      if (total > 0 || pnl !== 0) {
        const normalized = normalizeAsset(balance.asset);
        relevantAssets.add(normalized);
        console.log(`Found futures asset: ${balance.asset} -> ${normalized}, total: ${total}, pnl: ${pnl}`);
      }
    });

    console.log('Found relevant assets across all accounts:', Array.from(relevantAssets));

    // Process spot balances
    accountData.spot.balances.forEach(balance => {
      const normalizedAsset = normalizeAsset(balance.asset);
      const total = parseBalanceValue(balance.free) + parseBalanceValue(balance.locked);
      const price = prices[normalizedAsset] || 0;
      const totalValue = total * price;

      if (total > 0) {
        console.log(`Spot ${normalizedAsset}:`, {
          total,
          price,
          totalValue
        });
        
        const existing = assetMap.get(normalizedAsset) || {
          asset: normalizedAsset,
          positions: {},
          totalValue: 0
        };

        existing.positions.spot = { total };
        existing.totalValue = totalValue;
        assetMap.set(normalizedAsset, existing);
      }
    });

    // Process margin balances
    marginBalances.forEach(balance => {
      const normalizedAsset = normalizeAsset(balance.asset);
      const total = parseBalanceValue(balance.free) + parseBalanceValue(balance.locked);
      const borrowed = parseBalanceValue(balance.borrowed);
      const netAsset = parseBalanceValue(balance.netAsset);
      const price = prices[normalizedAsset] || 0;
      const totalValue = netAsset * price;
      
      if (total > 0 || borrowed > 0) {
        console.log(`Margin ${normalizedAsset}:`, {
          total,
          borrowed,
          netAsset,
          price,
          totalValue
        });

        const existing = assetMap.get(normalizedAsset) || {
          asset: normalizedAsset,
          positions: {},
          totalValue: 0
        };
        
        existing.positions.margin = {
          total,
          borrowed,
          netAsset
        };
        
        // Add margin value to existing total
        existing.totalValue += totalValue;
        
        assetMap.set(normalizedAsset, existing);
      }
    });

    // Process futures balances
    accountData.futures.balances.forEach(balance => {
      const normalizedAsset = normalizeAsset(balance.asset);
      const walletBalance = parseBalanceValue(balance.walletBalance);
      const pnl = parseBalanceValue(balance.unrealizedProfit);
      const price = prices[normalizedAsset] || 0;
      const totalValue = (walletBalance + pnl) * price;
      
      if (walletBalance > 0 || pnl !== 0) {
        console.log(`Futures ${normalizedAsset}:`, {
          walletBalance,
          pnl,
          price,
          totalValue
        });

        const existing = assetMap.get(normalizedAsset) || {
          asset: normalizedAsset,
          positions: {},
          totalValue: 0
        };
        
        existing.positions.futures = {
          balance: walletBalance,
          pnl
        };
        
        // Add futures value to existing total
        existing.totalValue += totalValue;
        
        assetMap.set(normalizedAsset, existing);
      }
    });

    const assets = Array.from(assetMap.values())
      .filter(asset => {
        const hasBalance = 
          (asset.positions.spot?.total || 0) > 0 ||
          (asset.positions.margin?.netAsset || 0) > 0 ||
          (asset.positions.futures?.balance || 0) > 0 ||
          relevantAssets.has(asset.asset);
        
        console.log(`Filtering asset ${asset.asset}:`, {
          hasSpot: !!asset.positions.spot,
          hasMargin: !!asset.positions.margin,
          hasFutures: !!asset.positions.futures,
          inRelevantAssets: relevantAssets.has(asset.asset),
          hasBalance,
          spotTotal: asset.positions.spot?.total || 0,
          marginNet: asset.positions.margin?.netAsset || 0,
          futuresBalance: asset.positions.futures?.balance || 0
        });

        return FOCUS_ASSETS.includes(asset.asset) && hasBalance;
      })
      .sort((a, b) => b.totalValue - a.totalValue);

    console.log('Final processed assets:', assets.map(asset => ({
      asset: asset.asset,
      spotValue: asset.positions.spot ? asset.positions.spot.total * (prices[asset.asset] || 0) : 0,
      marginValue: asset.positions.margin ? asset.positions.margin.netAsset * (prices[asset.asset] || 0) : 0,
      futuresValue: asset.positions.futures ? 
        (asset.positions.futures.balance + asset.positions.futures.pnl) * (prices[asset.asset] || 0) : 0,
      totalValue: asset.totalValue,
      price: prices[asset.asset] || 0
    })));

    return assets;
  }, [accountData, prices]);

  const totalAssets = useMemo(() => {
    console.log('Calculating total assets with:', {
      hasAccountData: !!accountData,
      hasPrices: !!prices,
      pricesKeys: prices ? Object.keys(prices) : [],
      initialTotalAssets
    });

    if (initialTotalAssets !== undefined) return initialTotalAssets;
    return calculateTotalAssets(accountData, prices);
  }, [accountData, prices, initialTotalAssets]);

  const totalLiabilities = useMemo(() => {
    if (!accountData || !prices) return 0;
    return combinedAssets.reduce((sum, asset) => {
      const price = prices[asset.asset] || 0;
      const borrowed = (asset.positions.margin?.borrowed || 0) * price;
      return sum + borrowed;
    }, 0);
  }, [accountData, prices, combinedAssets]);

  const netAssetValue = totalAssets - totalLiabilities;

  const assetDistribution = useMemo(() => {
    if (!accountData || !prices) return [];
    
    // Filter assets to only include positive values and map to correct structure
    const positiveAssets = combinedAssets
      .filter(asset => {
        const value = (
          (asset.positions.spot?.total || 0) * (prices[asset.asset] || 0) +
          (asset.positions.margin?.netAsset || 0) * (prices[asset.asset] || 0) +
          ((asset.positions.futures?.balance || 0) + (asset.positions.futures?.pnl || 0)) * (prices[asset.asset] || 0)
        );
        return value > 0;
      })
      .map(asset => {
        const value = (
          (asset.positions.spot?.total || 0) * (prices[asset.asset] || 0) +
          (asset.positions.margin?.netAsset || 0) * (prices[asset.asset] || 0) +
          ((asset.positions.futures?.balance || 0) + (asset.positions.futures?.pnl || 0)) * (prices[asset.asset] || 0)
        );
        return {
          name: asset.asset,
          value: value,
          percentage: 0 // Will be calculated next
        };
      });

    // Calculate total of positive values
    const positiveTotal = positiveAssets.reduce((sum, asset) => sum + asset.value, 0);

    // Calculate percentages based on positive total
    return positiveAssets.map(asset => ({
      name: asset.name,
      value: asset.value,
      percentage: (asset.value / positiveTotal) * 100
    }));
  }, [accountData, prices, combinedAssets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg">
        <h2 className="font-semibold mb-2">Error Loading Data</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!accountData || combinedAssets.length === 0) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500 text-yellow-500 rounded-lg">
        No assets found in this account
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AccountSummary 
        accountData={accountData} 
        prices={prices}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        netAssetValue={netAssetValue}
        assetDistribution={assetDistribution}
      />
      
      {/* Main Assets Table */}
      <div className="bg-card-background rounded-lg shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Asset Positions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="p-4">Asset</th>
                  <th className="p-4">Account Type</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4">Borrowed</th>
                  <th className="p-4">Net Value</th>
                  <th className="p-4">Current Price</th>
                  <th className="p-4">USD Value</th>
                </tr>
              </thead>
              <tbody>
                {combinedAssets.map((asset, index) => {
                  // Special handling for AAVE
                  if (asset.asset === 'AAVE' && !asset.positions.spot && !asset.positions.margin && !asset.positions.futures) {
                    return (
                      <tr key={`${asset.asset}-${index}`} className="border-b border-border hover:bg-background/50">
                        <td className="p-4 font-semibold">AAVE</td>
                        <td className="p-4">-</td>
                        <td className="p-4">0.00000000</td>
                        <td className="p-4">-</td>
                        <td className="p-4">0.00000000</td>
                        <td className="p-4">${(prices.AAVE || 0).toFixed(2)}</td>
                        <td className="p-4">$0.00</td>
                      </tr>
                    );
                  }

                  return (
                    <>
                      {asset.positions.spot && (
                        <tr key={`${asset.asset}-${index}-spot`} className="border-b border-border hover:bg-background/50">
                          <td className="p-4 font-semibold">{asset.asset}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm">
                              Spot
                            </span>
                          </td>
                          <td className="p-4">{asset.positions.spot.total.toFixed(8)}</td>
                          <td className="p-4">-</td>
                          <td className="p-4">{asset.positions.spot.total.toFixed(8)}</td>
                          <td className="p-4">${(prices[asset.asset] || 0).toFixed(2)}</td>
                          <td className="p-4">
                            ${(asset.positions.spot.total * (prices[asset.asset] || 0)).toFixed(2)}
                          </td>
                        </tr>
                      )}

                      {asset.positions.margin && (
                        <tr key={`${asset.asset}-${index}-margin`} className="border-b border-border hover:bg-background/50">
                          <td className="p-4 font-semibold">{asset.asset}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm">
                              Margin
                            </span>
                          </td>
                          <td className="p-4">{asset.positions.margin.total.toFixed(8)}</td>
                          <td className="p-4 text-red-500">
                            {asset.positions.margin.borrowed > 0 ? 
                              `-${asset.positions.margin.borrowed.toFixed(8)}` : 
                              '-'
                            }
                          </td>
                          <td className="p-4">{asset.positions.margin.netAsset.toFixed(8)}</td>
                          <td className="p-4">${(prices[asset.asset] || 0).toFixed(2)}</td>
                          <td className="p-4">
                            ${(asset.positions.margin.netAsset * (prices[asset.asset] || 0)).toFixed(2)}
                          </td>
                        </tr>
                      )}

                      {asset.positions.futures && (
                        <tr key={`${asset.asset}-${index}-futures`} className="border-b border-border hover:bg-background/50">
                          <td className="p-4 font-semibold">{asset.asset}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded-full text-sm">
                              Futures
                            </span>
                          </td>
                          <td className="p-4">{asset.positions.futures.balance.toFixed(8)}</td>
                          <td className="p-4">-</td>
                          <td className="p-4">
                            {(asset.positions.futures.balance + asset.positions.futures.pnl).toFixed(8)}
                          </td>
                          <td className="p-4">${(prices[asset.asset] || 0).toFixed(2)}</td>
                          <td className="p-4">
                            ${((asset.positions.futures.balance + asset.positions.futures.pnl) * 
                               (prices[asset.asset] || 0)).toFixed(2)}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Total Portfolio Value Card */}
      <div className="bg-card-background rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Portfolio Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-text-secondary">Total Portfolio Value</p>
            <p className="text-2xl font-semibold">
              ${totalAssets.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Assets</p>
            <p className="text-2xl font-semibold">{combinedAssets.length}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Last Updated</p>
            <p className="text-2xl font-semibold">
              {new Date(accountData?.updateTime || Date.now()).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 