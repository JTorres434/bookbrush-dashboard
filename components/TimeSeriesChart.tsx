'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

type Point = { date: string; cancellations: number; resubscriptions: number };

export function TimeSeriesChart({ data }: { data: Point[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), 'MMM d'),
  }));
  return (
    <div className="bg-white rounded-xl card-shadow p-5 h-80">
      <h2 className="font-semibold mb-3 text-bb-ink">Cancellations vs. Resubscriptions</h2>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={formatted}>
          <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="cancellations" stroke="#d12a72" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="resubscriptions" stroke="#5b1f9e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
