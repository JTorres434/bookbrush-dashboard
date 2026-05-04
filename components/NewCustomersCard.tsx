'use client';

import { useState } from 'react';
import { UserPlus, DollarSign, TrendingUp, Sparkles } from 'lucide-react';
import { Dialog, DialogStat, Avatar, PlanBadge } from './Dialog';
import type { NewCustomerInfo } from '@/lib/stripe';

export type NewCustomersBuckets = {
  '7d': NewCustomerInfo[];
  '30d': NewCustomerInfo[];
  '90d': NewCustomerInfo[];
};

const BUCKET_LABELS: { key: keyof NewCustomersBuckets; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
];

function summarize(customers: NewCustomerInfo[]) {
  const total = customers.reduce((s, c) => s + (parseFloat(c.pricing) || 0), 0);
  const avg = customers.length === 0 ? 0 : total / customers.length;
  const planCount: Record<string, number> = {};
  for (const c of customers) {
    if (!c.plan) continue;
    planCount[c.plan] = (planCount[c.plan] || 0) + 1;
  }
  const topPlan = Object.entries(planCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  return {
    monthlyAdded: total,
    avgValue: avg,
    topPlan,
  };
}

export function NewCustomersCard({
  configured,
  buckets,
}: {
  configured: boolean;
  buckets: NewCustomersBuckets;
}) {
  const [filter, setFilter] = useState<keyof NewCustomersBuckets>('30d');
  const [open, setOpen] = useState(false);

  if (!configured) {
    return (
      <div className="bg-white rounded-xl card-shadow p-5">
        <div className="flex items-center gap-2 text-sm text-bb-ink/60 font-medium">
          <UserPlus className="w-4 h-4" />
          New Customers
        </div>
        <div className="mt-2 text-3xl font-bold text-bb-ink/30">—</div>
        <div className="mt-2 text-xs text-bb-ink/50">
          To enable, add <code className="text-[10px]">STRIPE_SECRET_KEY</code> to Vercel env vars (use a restricted read-only key).
        </div>
      </div>
    );
  }

  const customers = buckets[filter];
  const summary = summarize(customers);
  const filterLabel = BUCKET_LABELS.find((b) => b.key === filter)?.label || '';

  return (
    <>
      <div className="bg-white rounded-xl card-shadow p-5 relative overflow-hidden">
        {/* Subtle gradient accent in corner */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-bb-gradient opacity-5 rounded-full blur-3xl" aria-hidden />
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap relative">
          <div className="flex items-center gap-2 text-sm text-bb-ink/60 font-medium">
            <UserPlus className="w-4 h-4" />
            New Customers
            <span className="text-xs text-bb-ink/40 font-normal">— first-time signups, paid</span>
          </div>
          <div className="flex gap-1">
            {BUCKET_LABELS.map((b) => (
              <button
                key={b.key}
                onClick={() => setFilter(b.key)}
                className={`text-xs px-2.5 py-1 rounded-full transition ${
                  filter === b.key
                    ? 'bg-bb-gradient text-white'
                    : 'bg-bb-mist text-bb-ink/70 hover:bg-bb-purple/10'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => customers.length > 0 && setOpen(true)}
          disabled={customers.length === 0}
          className={`w-full text-left relative ${
            customers.length > 0 ? 'cursor-pointer hover:opacity-90 transition' : 'cursor-default'
          }`}
        >
          <div className="text-4xl font-bold text-emerald-600">{customers.length}</div>
          <div className="mt-1 text-xs text-bb-ink/50">
            {customers.length === 0
              ? 'No new customers in this window.'
              : `signed up & started paying in the ${filterLabel.toLowerCase()}`}
          </div>
          {customers.length > 0 && (
            <div className="mt-2 text-xs text-bb-purple/70">click to see who →</div>
          )}
        </button>
      </div>

      {open && (
        <Dialog
          icon={<UserPlus className="w-5 h-5" />}
          title="New Customers"
          subtitle={`${filterLabel} · ${customers.length} signed up & started paying`}
          size="md"
          onClose={() => setOpen(false)}
          stats={
            <>
              <DialogStat label="Customers" value={customers.length} tone="positive" />
              <DialogStat
                label="Monthly Added"
                value={`$${summary.monthlyAdded.toFixed(0)}`}
                tone="positive"
              />
              <DialogStat
                label="Avg per customer"
                value={`$${summary.avgValue.toFixed(0)}`}
                tone="accent"
              />
              <DialogStat label="Top plan" value={summary.topPlan} tone="accent" />
            </>
          }
        >
          <div className="p-4">
            <ul className="space-y-1">
              {customers.map((c) => (
                <li
                  key={c.email + c.joinedAtUnixMs}
                  className="bg-white rounded-lg p-3 flex items-center gap-3 hover:shadow-md hover:scale-[1.005] transition"
                >
                  <Avatar name={c.name || c.email} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-bb-ink truncate">{c.name}</div>
                    <div className="text-xs text-bb-ink/60 truncate">{c.email}</div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 text-xs">
                    <PlanBadge plan={c.plan} />
                    <div className="text-bb-ink/50">{c.joinedLabel}</div>
                  </div>
                  <div className="text-bb-ink font-semibold tabular-nums shrink-0 ml-2">
                    {parseFloat(c.pricing) > 0 ? `$${c.pricing}` : '—'}
                  </div>
                </li>
              ))}
            </ul>
            {customers.length === 0 && (
              <div className="text-center py-12 text-bb-ink/50 text-sm flex flex-col items-center gap-2">
                <Sparkles className="w-8 h-8 text-bb-ink/20" />
                No new paying customers in this window yet.
              </div>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
