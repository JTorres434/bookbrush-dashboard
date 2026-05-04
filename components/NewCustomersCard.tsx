'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, X } from 'lucide-react';
import type { NewCustomerInfo } from '@/lib/stripe';

const planBadgeClass = (plan: string) => {
  const p = plan.toLowerCase();
  if (p.includes('platinum')) return 'bg-bb-purple-dark text-white';
  if (p.includes('gold'))     return 'bg-bb-magenta text-white';
  if (p.includes('plus'))     return 'bg-bb-purple-light text-white';
  return 'bg-bb-ink/10 text-bb-ink/60';
};

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

export function NewCustomersCard({
  configured,
  buckets,
}: {
  configured: boolean;
  buckets: NewCustomersBuckets;
}) {
  const [filter, setFilter] = useState<keyof NewCustomersBuckets>('30d');
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  return (
    <>
      <div className="bg-white rounded-xl card-shadow p-5">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
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
          className={`w-full text-left ${
            customers.length > 0
              ? 'cursor-pointer hover:opacity-90 transition'
              : 'cursor-default'
          }`}
        >
          <div className="text-4xl font-bold text-emerald-600">{customers.length}</div>
          <div className="mt-1 text-xs text-bb-ink/50">
            {customers.length === 0
              ? 'No new customers in this window.'
              : `signed up & started paying in the ${BUCKET_LABELS.find((b) => b.key === filter)?.label.toLowerCase()}`}
          </div>
          {customers.length > 0 && (
            <div className="mt-2 text-xs text-bb-purple/70">click to see who →</div>
          )}
        </button>
      </div>

      {mounted && open && createPortal(
        <div
          className="fixed inset-0 z-[110] bg-bb-ink/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-bb-mist rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-bb-ink/10 bg-white shrink-0">
              <h2 className="text-lg font-bold text-bb-ink">
                New Customers ·{' '}
                {BUCKET_LABELS.find((b) => b.key === filter)?.label}
                <span className="text-bb-ink/50 font-normal"> ({customers.length})</span>
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 hover:bg-bb-mist text-bb-ink/60 hover:text-bb-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-bb-ink/60 border-b border-bb-ink/10">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Plan</th>
                    <th className="py-2 pr-4 font-medium">Pricing</th>
                    <th className="py-2 pr-4 font-medium">Signed up</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.email + c.joinedAtUnixMs} className="border-b border-bb-ink/5 hover:bg-bb-mist/50">
                      <td className="py-2 pr-4 font-medium text-bb-ink">{c.name}</td>
                      <td className="py-2 pr-4 text-bb-ink/70">{c.email}</td>
                      <td className="py-2 pr-4">
                        {c.plan ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${planBadgeClass(c.plan)}`}>
                            {c.plan}
                          </span>
                        ) : (
                          <span className="text-bb-ink/30">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-bb-ink/80 tabular-nums">
                        {parseFloat(c.pricing) > 0 ? `$${c.pricing}` : '—'}
                      </td>
                      <td className="py-2 pr-4 text-bb-ink/70">{c.joinedLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
