"use client";

import { FC } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Card } from '@/components/ui/Card';

const PortfolioSummary: FC = () => {
  const { current, history } = usePortfolio();

  if (!current || !history?.length) return null;

  const previousValue = history[history.length - 2]?.totalValue || 0;
  const change = current.totalValue - previousValue;
  const changePercentage = (change / previousValue) * 100;
  const isPositive = change >= 0;

  return (
    <Card className="mb-6">
      <div className="flex justify-between items-start p-6">
        <div>
          <h2 className="text-text-secondary text-sm">Total Portfolio Value</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-text-primary text-3xl font-semibold">
              ${current.totalValue.toLocaleString()}
            </p>
            <div className={`flex items-center ${isPositive ? 'text-accent-green' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              <span className="ml-1">{Math.abs(changePercentage).toFixed(2)}%</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-text-secondary text-sm">Net Value</p>
          <p className="text-text-primary text-xl mt-1">
            ${current.netValue.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default PortfolioSummary; 