'use client';

import { useState } from 'react';
import { Users, TrendingUp, Activity, Target, AlertCircle } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { CustomersTable, type Customer } from './CustomersTable';
import { Dialog, DialogStat } from './Dialog';

type Tone = 'neutral' | 'positive' | 'warn';

export type KpiCardData = {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: Tone;
  hint?: string;
  customers?: Customer[];
  modalTitle?: string;
  trend?: { deltaPct: number | null; positiveIsGood?: boolean };
  sparkline?: number[];
};

const ICON_FOR: Record<string, React.ReactNode> = {
  Cancellations: <Users className="w-5 h-5" />,
  'Returning Customers': <TrendingUp className="w-5 h-5" />,
  'Net Change': <Activity className="w-5 h-5" />,
  'Recovery Rate': <Target className="w-5 h-5" />,
  'Failed Payments': <AlertCircle className="w-5 h-5" />,
};

export function KpiGrid({ items }: { items: KpiCardData[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {items.map((item, i) => {
          const hasList = !!item.customers && item.customers.length > 0;
          return (
            <div
              key={item.label}
              className="bb-fade-in-up"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <KpiCard
                label={item.label}
                value={item.value}
                suffix={item.suffix}
                tone={item.tone}
                hint={item.hint}
                clickable={hasList}
                onClick={hasList ? () => setOpenIdx(i) : undefined}
                trend={item.trend}
                sparkline={item.sparkline}
              />
            </div>
          );
        })}
      </div>

      {openIdx !== null && items[openIdx].customers && (
        <Dialog
          icon={ICON_FOR[items[openIdx].label] || <Users className="w-5 h-5" />}
          title={items[openIdx].label}
          subtitle={`${items[openIdx].customers!.length} ${items[openIdx].customers!.length === 1 ? 'customer' : 'customers'}`}
          size="lg"
          onClose={() => setOpenIdx(null)}
          stats={statsFor(items[openIdx])}
        >
          <div className="p-4">
            <CustomersTable customers={items[openIdx].customers!} />
          </div>
        </Dialog>
      )}
    </>
  );
}

function statsFor(item: KpiCardData): React.ReactNode {
  const customers = item.customers || [];
  if (customers.length === 0) return null;

  // Total revenue impact (sum of pricing)
  const total = customers.reduce((s, c) => s + (parseFloat(c.pricing) || 0), 0);

  // Plan breakdown
  const planCount: Record<string, number> = {};
  for (const c of customers) {
    if (!c.plan) continue;
    planCount[c.plan] = (planCount[c.plan] || 0) + 1;
  }
  const topPlan = Object.entries(planCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  return (
    <>
      <DialogStat label="Total" value={customers.length} tone="accent" />
      <DialogStat
        label="$$ value"
        value={`$${total.toFixed(0)}`}
        tone={item.tone === 'warn' ? 'warn' : 'positive'}
      />
      <DialogStat label="Top plan" value={topPlan} tone="accent" />
      {item.trend && item.trend.deltaPct !== null && (
        <DialogStat
          label="vs prev period"
          value={`${item.trend.deltaPct > 0 ? '+' : ''}${item.trend.deltaPct}%`}
          tone={
            item.trend.deltaPct === 0
              ? 'neutral'
              : (item.trend.deltaPct > 0) === (item.trend.positiveIsGood ?? true)
              ? 'positive'
              : 'warn'
          }
        />
      )}
    </>
  );
}
