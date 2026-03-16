'use client';

import { StockQuote } from '@/types/stock';
import SparklineChart from './SparklineChart';

interface StockCardProps {
  stock: StockQuote;
}

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return volume.toString();
}

export default function StockCard({ stock }: StockCardProps) {
  const isPositive = stock.change >= 0;
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
  const changeBg = isPositive ? 'bg-green-400/10 border-green-400/20' : 'bg-red-400/10 border-red-400/20';
  const arrow = isPositive ? '▲' : '▼';

  return (
    <div className="group relative bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 hover:bg-gray-800/80 transition-all duration-200 hover:shadow-lg hover:shadow-black/30 cursor-default">
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold px-2 py-0.5 rounded">
              {stock.ticker}
            </span>
            <span className="text-xs text-gray-500 truncate">{stock.sector}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-200 truncate" title={stock.name}>
            {stock.name}
          </h3>
        </div>
        <div className="ml-2 flex-shrink-0">
          <SparklineChart data={stock.sparkline} isPositive={isPositive} width={100} height={42} />
        </div>
      </div>

      {/* Price */}
      <div className="mb-2">
        <span className="text-2xl font-bold text-white tracking-tight">
          ${formatPrice(stock.price)}
        </span>
      </div>

      {/* Change badge */}
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-semibold ${changeBg} ${changeColor}`}>
          <span className="text-xs">{arrow}</span>
          <span>{isPositive ? '+' : ''}{formatPrice(stock.change)}</span>
          <span className="text-xs opacity-80">({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
        </div>
        <span className="text-xs text-gray-600">Vol {formatVolume(stock.volume)}</span>
      </div>

      {/* Low/High bar */}
      <div className="mt-3 pt-3 border-t border-gray-800">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>L ${formatPrice(stock.low)}</span>
          <span>H ${formatPrice(stock.high)}</span>
        </div>
        <div className="relative h-1 bg-gray-800 rounded-full overflow-hidden">
          {(() => {
            const range = stock.high - stock.low;
            const pos = range > 0 ? ((stock.price - stock.low) / range) * 100 : 50;
            return (
              <div
                className="absolute top-0 h-full w-1.5 bg-blue-400 rounded-full"
                style={{ left: `${Math.min(Math.max(pos, 0), 98)}%` }}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
}
