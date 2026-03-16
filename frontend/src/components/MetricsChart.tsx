import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { MetricDataPoint, GranularityType } from '../api';

interface Props {
  data: MetricDataPoint[];
  granularity: GranularityType;
  loading: boolean;
  error: string | null;
  onDataPointClick: (point: MetricDataPoint, index: number) => void;
}

const GRANULARITY_COLORS: Record<GranularityType, string> = {
  '5min': '#06b6d4',
  hourly: '#6366f1',
  daily: '#8b5cf6',
  monthly: '#ec4899',
  yearly: '#f59e0b',
};

function formatXAxis(timestamp: string, granularity: GranularityType): string {
  try {
    const date = parseISO(timestamp);
    switch (granularity) {
      case '5min': return format(date, 'HH:mm');
      case 'hourly': return format(date, 'MMM d HH:mm');
      case 'daily': return format(date, 'MMM d');
      case 'monthly': return format(date, 'MMM yyyy');
      case 'yearly': return format(date, 'yyyy');
      default: return timestamp;
    }
  } catch {
    return timestamp;
  }
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: MetricDataPoint }>;
  label?: string;
  granularity: GranularityType;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label, granularity }) => {
  if (!active || !payload || payload.length === 0) return null;
  const d: MetricDataPoint = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-time">{label ? formatXAxis(label, granularity) : ''}</p>
      <p className="tooltip-value">Value: <strong>{d?.value?.toFixed(2)}</strong></p>
      {d?.min !== undefined && <p>Min: {d.min.toFixed(2)}</p>}
      {d?.max !== undefined && <p>Max: {d.max.toFixed(2)}</p>}
      {d?.avg !== undefined && <p>Avg: {d.avg.toFixed(2)}</p>}
      {d?.count !== undefined && <p>Count: {d.count}</p>}
      <p className="tooltip-hint">Click to drill down</p>
    </div>
  );
};

const MetricsChart: React.FC<Props> = ({ data, granularity, loading, error, onDataPointClick }) => {
  const color = GRANULARITY_COLORS[granularity];

  if (loading) {
    return (
      <div className="chart-state">
        <div className="spinner" />
        <p>Loading data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-state error">
        <p>⚠ {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="chart-state">
        <p>No data available for the selected range.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={380}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        onClick={(e: Record<string, unknown>) => {
          const payload = e?.activePayload as Array<{ payload: MetricDataPoint }> | undefined;
          if (payload && payload.length > 0) {
            const point = payload[0].payload;
            const index = typeof e.activeTooltipIndex === 'number' ? e.activeTooltipIndex : 0;
            onDataPointClick(point, index);
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <defs>
          <linearGradient id={`grad-${granularity}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(v) => formatXAxis(v, granularity)}
          stroke="#4a5568"
          tick={{ fill: '#9aa5b4', fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis stroke="#4a5568" tick={{ fill: '#9aa5b4', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip granularity={granularity} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${granularity})`}
          activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
          dot={data.length <= 60 ? { r: 3, fill: color } : false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default MetricsChart;
