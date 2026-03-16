import React from 'react';
import type { MetricDataPoint } from '../api';

interface Props {
  data: MetricDataPoint[];
  previousPeriod?: {
    min: number;
    max: number;
    avg: number;
    count: number;
  };
}

function pctChange(current: number, previous: number): string {
  if (previous === 0) return '—';
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
}

const StatsPanel: React.FC<Props> = ({ data, previousPeriod }) => {
  if (data.length === 0) {
    return <div className="stats-panel"><p className="no-data">No data</p></div>;
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const count = values.length;

  const stats = [
    { label: 'Min', value: min.toFixed(2), numericValue: min, prev: previousPeriod?.min },
    { label: 'Max', value: max.toFixed(2), numericValue: max, prev: previousPeriod?.max },
    { label: 'Avg', value: avg.toFixed(2), numericValue: avg, prev: previousPeriod?.avg },
    { label: 'Count', value: count.toString(), numericValue: count, prev: previousPeriod?.count },
  ];

  return (
    <div className="stats-panel">
      {stats.map(({ label, value, numericValue, prev }) => (
        <div className="stat-card" key={label}>
          <span className="stat-label">{label}</span>
          <span className="stat-value">{value}</span>
          {prev !== undefined && (
            <span className={`stat-change ${numericValue >= prev ? 'up' : 'down'}`}>
              {pctChange(numericValue, prev)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatsPanel;
