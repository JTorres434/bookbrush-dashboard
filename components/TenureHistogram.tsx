'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Hourglass } from 'lucide-react';
import type { TenureBucket } from '@/lib/metrics';

export function TenureHistogram({ buckets }: { buckets: TenureBucket[] }) {
  const total = buckets.reduce((s, b) => s + b.count, 0);
  return (
    <div className="bg-white rounded-xl card-shadow p-5">
      <div className="flex items-center gap-2 mb-1">
        <Hourglass className="w-4 h-4 text-bb-purple" />
        <h2 className="font-semibold text-bb-ink">How Long Customers Stayed</h2>
        <span className="text-xs text-bb-ink/50">— tenure before cancelling</span>
      </div>
      <p className="text-xs text-bb-ink/60 mb-4">
        Of the people who cancelled in this period, how long had they been with you? Spotting a cluster (e.g., heavy "1–2 yr") tells you when to fight harder.
      </p>
      {total === 0 ? (
        <div className="h-40 flex items-center justify-center text-bb-ink/40 text-sm">No cancellations in range</div>
      ) : (
        <div className="h-44">
          <ResponsiveContainer>
            <BarChart data={buckets} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9c8db8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#9c8db8" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid rgba(26,19,48,0.1)' }}
                formatter={(v: number) => [v, 'customers']}
              />
              <Bar dataKey="count" fill="#8a4cd0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
