'use client';

import { useState, useEffect, useCallback } from 'react';
import { StockQuote, ViewMode } from '@/types/stock';
import StockCard from './StockCard';
import StockTable from './StockTable';
import LoadingSpinner from './LoadingSpinner';

const POLL_INTERVAL = 30;

function formatTimestamp(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function Dashboard() {
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/stocks');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StockQuote[] = await res.json();
      setStocks(data);
      setLastUpdated(new Date());
      setCountdown(POLL_INTERVAL);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const positiveCount = stocks.filter((s) => s.change >= 0).length;
  const negativeCount = stocks.length - positiveCount;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800/60">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Tech Stock Dashboard
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Top 20 Global Tech Companies · Real-time quotes</p>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Market summary pills */}
              {stocks.length > 0 && (
                <div className="hidden md:flex items-center gap-2 text-xs">
                  <span className="bg-green-400/10 text-green-400 border border-green-400/20 px-2 py-1 rounded-full">
                    ▲ {positiveCount} up
                  </span>
                  <span className="bg-red-400/10 text-red-400 border border-red-400/20 px-2 py-1 rounded-full">
                    ▼ {negativeCount} down
                  </span>
                </div>
              )}

              {/* Last updated */}
              <div className="text-xs text-gray-500 whitespace-nowrap">
                Updated: <span className="text-gray-300">{formatTimestamp(lastUpdated)}</span>
              </div>

              {/* Countdown badge */}
              <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border ${countdown <= 5 ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${countdown <= 5 ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                Refresh in {countdown}s
              </div>

              {/* View toggle */}
              <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  ⊞ Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  ☰ Table
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && <LoadingSpinner />}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-red-400 text-5xl">⚠</div>
            <p className="text-gray-300 text-lg font-medium">Failed to load market data</p>
            <p className="text-gray-500 text-sm">{error}</p>
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && stocks.length > 0 && (
          <>
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {stocks.map((stock) => (
                  <StockCard key={stock.ticker} stock={stock} />
                ))}
              </div>
            ) : (
              <StockTable stocks={stocks} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/60 mt-12 py-6">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-600">
          Data provided for informational purposes only. Not financial advice.
          {!process.env.NEXT_PUBLIC_HAS_API_KEY && ' · Using simulated data'}
        </div>
      </footer>
    </div>
  );
}
