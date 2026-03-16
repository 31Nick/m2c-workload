import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { StockHistory } from '../types';

type PriceHistoryChartProps = {
  history: StockHistory | null;
  selectedSymbol: string;
};

export function PriceHistoryChart({ history, selectedSymbol }: PriceHistoryChartProps) {
  return (
    <section className="panel chart-panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Price action</span>
          <h2>{selectedSymbol} trend</h2>
        </div>
      </div>
      {history ? (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history.points}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#42d392" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#42d392" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) =>
                  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
                stroke="#94a3b8"
              />
              <YAxis stroke="#94a3b8" domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  background: '#07111f',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                }}
                formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, 'Close']}
                labelFormatter={(value) =>
                  typeof value === 'string' || typeof value === 'number'
                    ? new Date(value).toLocaleDateString()
                    : ''
                }
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#42d392"
                strokeWidth={3}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-state">Select a stock to load chart data.</div>
      )}
    </section>
  );
}
