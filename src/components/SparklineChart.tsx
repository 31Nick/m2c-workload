'use client';

import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface SparklineChartProps {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
}

export default function SparklineChart({ data, isPositive, width = 120, height = 50 }: SparklineChartProps) {
  const color = isPositive ? '#22c55e' : '#ef4444';
  const gradientId = `gradient-${isPositive ? 'pos' : 'neg'}-${Math.random().toString(36).slice(2, 7)}`;

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          content={({ active, payload }) =>
            active && payload && payload.length ? (
              <div className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white">
                ${Number(payload[0].value).toFixed(2)}
              </div>
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
