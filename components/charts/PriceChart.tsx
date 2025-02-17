"use client";

import { FC, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart as LineChartIcon, BarChart as BarChartIcon, CandlestickChart, Loader2 } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Card } from '@/components/ui/Card';

type ChartType = 'line' | 'columnar' | 'candles';
type TimeFrame = '24H' | '1W' | '1M' | '1Y' | 'ALL';

const PriceChart: FC = () => {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('24H');
  const { history, isLoading } = usePortfolio();

  const chartData = history?.map((snapshot) => ({
    time: new Date(snapshot.timestamp).toLocaleTimeString(),
    value: snapshot.totalValue,
  }));

  const timeFrames: TimeFrame[] = ['24H', '1W', '1M', '1Y', 'ALL'];

  if (isLoading || !chartData) {
    return (
      <Card className="w-full h-[500px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading chart data...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full bg-card-background rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        {/* Time Frame Selector */}
        <div className="flex gap-2">
          {timeFrames.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={`px-4 py-2 rounded-lg text-sm ${
                timeFrame === tf
                  ? 'bg-background-dark text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Type Selector */}
        <div className="flex gap-2 bg-background-dark rounded-lg p-1">
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded-lg ${
              chartType === 'line' ? 'bg-card-background text-accent-green' : 'text-text-secondary'
            }`}
          >
            <LineChartIcon size={20} />
          </button>
          <button
            onClick={() => setChartType('columnar')}
            className={`p-2 rounded-lg ${
              chartType === 'columnar' ? 'bg-card-background text-accent-green' : 'text-text-secondary'
            }`}
          >
            <BarChartIcon size={20} />
          </button>
          <button
            onClick={() => setChartType('candles')}
            className={`p-2 rounded-lg ${
              chartType === 'candles' ? 'bg-card-background text-accent-green' : 'text-text-secondary'
            }`}
          >
            <CandlestickChart size={20} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            />
            <YAxis
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-background)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--accent-green)"
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart; 