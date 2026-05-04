'use client';

import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#8a4cd0', '#d12a72', '#3e1671'];

type Slice = { name: string; value: number };

export function PlanBreakdown({ title, data }: { title: string; data: Slice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="bg-white rounded-xl card-shadow p-5 h-80">
      <h2 className="font-semibold mb-3 text-bb-ink">{title}</h2>
      {total === 0 ? (
        <div className="h-full flex items-center justify-center text-bb-ink/40 text-sm">No data in range</div>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
