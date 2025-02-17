'use client';

import { useEffect, useState } from 'react';
import { AccountData } from '@/types/binance';
import AssetTable from '@/components/trading/AssetTable';

export default function PublicDashboard({ params }: { params: { viewToken: string } }) {
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [prices, setPrices] = useState<{[key: string]: number}>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching data for viewToken:', params.viewToken);
        
        const [accountResponse, pricesResponse] = await Promise.all([
          fetch(`/api/public/${params.viewToken}`),
          fetch('/api/binance/prices')
        ]);
        
        const [accountData, pricesData] = await Promise.all([
          accountResponse.json(),
          pricesResponse.json()
        ]);

        console.log('Raw account data:', accountData);
        console.log('Raw prices data:', pricesData);
        
        if (!accountResponse.ok) {
          throw new Error(accountData.error || accountData.details || 'Failed to fetch account data');
        }

        setAccountData(accountData);
        setPrices(pricesData);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.viewToken]);

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
        <h2 className="font-semibold mb-2">Error Loading Dashboard</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!accountData) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500 text-yellow-500 rounded-lg">
        No account data available
      </div>
    );
  }

  // Add debug logging in render
  console.log('Rendering public view with:', {
    accountData,
    prices,
    hasAccountData: !!accountData,
    hasPrices: !!prices,
    pricesKeys: Object.keys(prices)
  });

  return (
    <div className="container mx-auto p-4">
      <AssetTable 
        initialData={accountData} 
        isPublicView 
        initialPrices={prices}
      />
    </div>
  );
} 