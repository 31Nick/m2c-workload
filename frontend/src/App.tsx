import { useEffect, useMemo, useState } from 'react';

import { CurrencyRatesPanel } from './components/CurrencyRatesPanel';
import { PerformanceTable } from './components/PerformanceTable';
import { PriceHistoryChart } from './components/PriceHistoryChart';
import { StockGrid } from './components/StockGrid';
import { StockHero } from './components/StockHero';
import type { CurrencyExchangeRate, DashboardResponse, StockHistory, StockOverview } from './types';

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 2,
});

function App() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [history, setHistory] = useState<StockHistory | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [forexRates, setForexRates] = useState<CurrencyExchangeRate[]>([]);
  const [forexLoading, setForexLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stocks/overview');
        if (!response.ok) {
          throw new Error('Unable to load dashboard data.');
        }

        const data = (await response.json()) as DashboardResponse;
        setDashboard(data);
        if (data.stocks[0]) {
          setSelectedSymbol((current: string) => current || data.stocks[0].symbol);
        }
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  useEffect(() => {
    const loadForex = async () => {
      try {
        setForexLoading(true);
        const response = await fetch('/api/forex/rates');
        if (!response.ok) {
          throw new Error('Unable to load forex rate data.');
        }
        const data = (await response.json()) as CurrencyExchangeRate[];
        setForexRates(data);
      } catch {
        setForexRates([]);
      } finally {
        setForexLoading(false);
      }
    };

    void loadForex();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedSymbol) {
        return;
      }

      try {
        setHistoryLoading(true);
        const response = await fetch(`/api/stocks/history/${selectedSymbol}`);
        if (!response.ok) {
          throw new Error(`Unable to load history for ${selectedSymbol}.`);
        }

        const data = (await response.json()) as StockHistory;
        setHistory(data);
        setError(null);
      } catch (loadError) {
        setHistory(null);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load chart data.');
      } finally {
        setHistoryLoading(false);
      }
    };

    void loadHistory();
  }, [selectedSymbol]);

  const sortedStocks = useMemo<StockOverview[]>(() => {
    if (!dashboard) {
      return [];
    }

    return [...dashboard.stocks].sort((a, b) => b.change_percent - a.change_percent);
  }, [dashboard]);

  if (loading) {
    return <div className="app-shell loading-screen">Loading market dashboard…</div>;
  }

  if (error && !dashboard) {
    return <div className="app-shell loading-screen error-state">{error}</div>;
  }

  if (!dashboard) {
    return <div className="app-shell loading-screen error-state">No data available.</div>;
  }

  return (
    <div className="app-shell">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <main className="dashboard-layout">
        <StockHero
          generatedAt={dashboard.generated_at}
          averageChangePercent={dashboard.market_summary.average_change_percent}
        />

        <section className="summary-strip">
          <div className="summary-card">
            <span>Advancers</span>
            <strong>{dashboard.market_summary.advancers}</strong>
          </div>
          <div className="summary-card">
            <span>Decliners</span>
            <strong>{dashboard.market_summary.decliners}</strong>
          </div>
          <div className="summary-card">
            <span>Combined market cap</span>
            <strong>{compactFormatter.format(dashboard.market_summary.total_market_cap)}</strong>
          </div>
          <div className="summary-card">
            <span>Total volume</span>
            <strong>{compactFormatter.format(dashboard.market_summary.total_volume)}</strong>
          </div>
        </section>

        <StockGrid
          stocks={sortedStocks}
          selectedSymbol={selectedSymbol}
          onSelect={setSelectedSymbol}
        />

        <div className="chart-row">
          <PriceHistoryChart history={history} selectedSymbol={selectedSymbol} />
          <section className="panel spotlight-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Selection</span>
                <h2>{selectedSymbol} spotlight</h2>
              </div>
            </div>
            {historyLoading ? (
              <div className="empty-state">Loading history…</div>
            ) : (
              (() => {
                const selectedStock = sortedStocks.find((stock) => stock.symbol === selectedSymbol);
                if (!selectedStock) {
                  return <div className="empty-state">Select a stock to inspect.</div>;
                }

                const positive = selectedStock.change_percent >= 0;
                return (
                  <div className="spotlight-body">
                    <div className="spotlight-price">${selectedStock.current_price.toFixed(2)}</div>
                    <div className={`spotlight-change ${positive ? 'positive' : 'negative'}`}>
                      {positive ? '+' : ''}
                      {selectedStock.change_percent.toFixed(2)}% today
                    </div>
                    <dl>
                      <div>
                        <dt>Day range</dt>
                        <dd>
                          {selectedStock.day_low ? `$${selectedStock.day_low.toFixed(2)}` : '—'} -{' '}
                          {selectedStock.day_high ? `$${selectedStock.day_high.toFixed(2)}` : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt>Volume</dt>
                        <dd>{compactFormatter.format(selectedStock.volume ?? 0)}</dd>
                      </div>
                      <div>
                        <dt>Exchange</dt>
                        <dd>{selectedStock.exchange ?? '—'}</dd>
                      </div>
                    </dl>
                    {error ? <p className="inline-error">{error}</p> : null}
                  </div>
                );
              })()
            )}
          </section>
        </div>

        <PerformanceTable stocks={sortedStocks} />

        <CurrencyRatesPanel rates={forexRates} loading={forexLoading} />
      </main>
    </div>
  );
}

export default App;
