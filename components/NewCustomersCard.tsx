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

export function NewCustomersCard({
  configured,
  customers,
  rangeKey,
}: {
  configured: boolean;
  customers: NewCustomerInfo[];
  rangeKey: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!configured) {
    return (
      <div className="bg-white rounded-xl card-shadow p-5 text-left">
        <div className="text-sm text-bb-ink/60 font-medium flex items-center gap-1.5">
          New Customers
        </div>
        <div className="mt-2 text-3xl font-bold text-bb-ink/30">—</div>
        <div className="mt-2 text-xs text-bb-ink/50">
          To enable, add <code className="text-[10px]">STRIPE_SECRET_KEY</code> to Vercel env vars.
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => customers.length > 0 && setOpen(true)}
        className={`bg-white rounded-xl card-shadow p-5 text-left w-full transition ${
          customers.length > 0 ? 'hover:scale-[1.02] hover:ring-2 hover:ring-bb-purple/20 cursor-pointer' : ''
        }`}
      >
        <div className="text-sm text-bb-ink/60 font-medium flex items-center gap-1.5">
          <UserPlus className="w-4 h-4" />
          New Customers
          {customers.length > 0 && (
            <span className="text-[10px] text-bb-purple/60 ml-auto">click for details</span>
          )}
        </div>
        <div className="mt-2 text-3xl font-bold text-emerald-600">{customers.length}</div>
        <div className="mt-2 text-xs text-bb-ink/50">first-time signups in this period</div>
      </button>

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
                New Customers · {rangeKey} <span className="text-bb-ink/50 font-normal">({customers.length})</span>
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
