'use client';

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

export function Sparkline({
  data,
  color = '#5b1f9e',
  height = 28,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (!data || data.length === 0) return null;
  const chartData = data.map((value, i) => ({ i, value }));
  return (
    <div style={{ height }} className="mt-1 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
