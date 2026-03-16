'use client';

import { useState } from 'react';
import { StockQuote, SortField, SortDirection } from '@/types/stock';
import SparklineChart from './SparklineChart';

interface StockTableProps {
  stocks: StockQuote[];
}

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return volume.toString();
}

function formatMarketCap(cap?: number): string {
  if (!cap) return '—';
  if (cap >= 1_000_000_000_000) return `$${(cap / 1_000_000_000_000).toFixed(2)}T`;
  if (cap >= 1_000_000_000) return `$${(cap / 1_000_000_000).toFixed(1)}B`;
  return `$${(cap / 1_000_000).toFixed(0)}M`;
}

const SORT_FIELDS: { field: SortField; label: string }[] = [
  { field: 'name', label: 'Company' },
  { field: 'price', label: 'Price' },
  { field: 'change', label: 'Change' },
  { field: 'changePercent', label: 'Change %' },
  { field: 'volume', label: 'Volume' },
];

export default function StockTable({ stocks }: StockTableProps) {
  const [sortField, setSortField] = useState<SortField>('changePercent');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  const sorted = [...stocks].sort((a, b) => {
    const aVal: string | number = a[sortField];
    const bVal: string | number = b[sortField];
    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  function SortIcon({ field }: { field: SortField }) {
    if (field !== sortField) return <span className="text-gray-700 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-900 border-b border-gray-800">
            <th className="text-left px-4 py-3 text-gray-500 font-medium">#</th>
            {SORT_FIELDS.map(({ field, label }) => (
              <th
                key={field}
                className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer hover:text-gray-200 transition-colors select-none whitespace-nowrap"
                onClick={() => handleSort(field)}
              >
                {label}
                <SortIcon field={field} />
              </th>
            ))}
            <th className="text-left px-4 py-3 text-gray-500 font-medium">Sector</th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">Market Cap</th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">Open</th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">High</th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium">Low</th>
            <th className="text-right px-4 py-3 text-gray-500 font-medium whitespace-nowrap">7D Trend</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((stock, idx) => {
            const isPositive = stock.change >= 0;
            const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
            const arrow = isPositive ? '▲' : '▼';

            return (
              <tr
                key={stock.ticker}
                className={`border-b border-gray-800/60 hover:bg-gray-800/50 transition-colors ${idx % 2 === 0 ? 'bg-gray-900/30' : 'bg-transparent'}`}
              >
                <td className="px-4 py-3 text-gray-600 text-xs">{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                      {stock.ticker}
                    </span>
                    <span className="text-gray-200 whitespace-nowrap">{stock.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-white font-semibold text-right whitespace-nowrap">
                  ${formatPrice(stock.price)}
                </td>
                <td className={`px-4 py-3 font-medium text-right whitespace-nowrap ${changeColor}`}>
                  <span className="mr-1 text-xs">{arrow}</span>
                  {isPositive ? '+' : ''}{formatPrice(stock.change)}
                </td>
                <td className={`px-4 py-3 font-medium text-right whitespace-nowrap ${changeColor}`}>
                  {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-gray-400 text-right whitespace-nowrap">
                  {formatVolume(stock.volume)}
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm whitespace-nowrap">{stock.sector}</td>
                <td className="px-4 py-3 text-gray-400 text-right whitespace-nowrap">
                  {formatMarketCap(stock.marketCap)}
                </td>
                <td className="px-4 py-3 text-gray-400 text-right whitespace-nowrap">
                  ${formatPrice(stock.open)}
                </td>
                <td className="px-4 py-3 text-green-500 text-right whitespace-nowrap">
                  ${formatPrice(stock.high)}
                </td>
                <td className="px-4 py-3 text-red-500 text-right whitespace-nowrap">
                  ${formatPrice(stock.low)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <SparklineChart data={stock.sparkline} isPositive={isPositive} width={80} height={36} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
