'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AccountData } from '@/types/binance';

interface AccountSummaryProps {
  accountData: AccountData | null;
  prices: {[key: string]: number};
  totalAssets: number;
  totalLiabilities: number;
  netAssetValue: number;
  assetDistribution: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

const FOCUS_ASSETS = ['BTC', 'SOL', 'AAVE'];
const COLORS = {
  SOL: '#FF8C00',  // Orange
  BTC: '#9945FF',  // Purple
  AAVE: '#2172E5', // Blue
  USDT: '#26A17B'  // Tether green (only for positive balances)
};

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return '$0.00';
  return `$${value.toLocaleString(undefined, { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;
};

export default function AccountSummary({ 
  accountData, 
  prices, 
  totalAssets,
  totalLiabilities,
  netAssetValue,
  assetDistribution
}: AccountSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-card-background rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Account Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-text-secondary">Total Assets</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalAssets)}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Liabilities</p>
            <p className="text-2xl font-semibold text-red-500">
              {formatCurrency(totalLiabilities)}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-text-secondary">Net Asset Value</p>
            <p className="text-2xl font-semibold">{formatCurrency(netAssetValue)}</p>
          </div>
        </div>
      </div>

      <div className="bg-card-background rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Asset Distribution</h2>
        <div className="flex items-center justify-between">
          <div className="w-1/2 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percentage }) => 
                    `${name} (${percentage?.toFixed(1) || '0.0'}%)`
                  }
                >
                  {assetDistribution.map((entry) => (
                    <Cell 
                      key={entry.name} 
                      fill={COLORS[entry.name as keyof typeof COLORS] || '#999999'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: 'var(--card-background)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                  itemStyle={{
                    color: 'var(--text-primary)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 pl-4">
            {assetDistribution.map((asset) => (
              <div key={asset.name} className="mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[asset.name as keyof typeof COLORS] || '#999999' }}
                  />
                  <span className="font-medium">{asset.name}</span>
                </div>
                <p className="text-sm text-text-secondary ml-5">
                  {formatCurrency(asset.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 