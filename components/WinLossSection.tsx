'use client';

import { Trophy, Frown, Minus } from 'lucide-react';
import { MaybeCountUp } from './CountUp';

/**
 * "Are we winning?" — at-a-glance verdict comparing customer inflow
 * (new + returning) against outflow (cancellations + failed payments)
 * for the currently selected date range.
 */
export function WinLossSection({
  newCustomers,
  resubscriptions,
  cancellations,
  failedPayments,
  rangeKey,
}: {
  newCustomers: number;
  resubscriptions: number;
  cancellations: number;
  failedPayments: number;
  rangeKey: string;
}) {
  const gained = newCustomers + resubscriptions;
  const lost = cancellations + failedPayments;
  const net = gained - lost;
  const total = Math.max(1, gained + lost);
  const gainedPct = (gained / total) * 100;
  const lostPct = (lost / total) * 100;

  const verdict =
    net > 0 ? 'winning' : net < 0 ? 'losing' : 'breaking even';
  const Icon = net > 0 ? Trophy : net < 0 ? Frown : Minus;
  const verdictColor =
    net > 0 ? 'text-emerald-600' : net < 0 ? 'text-bb-magenta' : 'text-bb-ink/60';
  const accentBg =
    net > 0 ? 'bg-emerald-50' : net < 0 ? 'bg-bb-magenta/5' : 'bg-bb-mist';
  const accentRing =
    net > 0 ? 'ring-emerald-200' : net < 0 ? 'ring-bb-magenta/20' : 'ring-bb-ink/10';

  const headline =
    net > 0
      ? `+${net} customers ahead`
      : net < 0
      ? `${net} customers behind`
      : 'dead even';

  return (
    <div className="bg-white rounded-xl card-shadow p-5 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-lg ${accentBg} ring-1 ${accentRing} flex items-center justify-center`}
          >
            <Icon className={`w-5 h-5 ${verdictColor}`} />
          </div>
          <div>
            <h2 className="font-semibold text-bb-ink leading-tight">
              Are we winning?
            </h2>
            <div className="text-xs text-bb-ink/50">
              {rangeKey.toLowerCase()} · gained vs. lost
            </div>
          </div>
        </div>
        <div className={`text-right ${verdictColor}`}>
          <div className="text-3xl font-extrabold tabular-nums leading-none">
            <MaybeCountUp value={net > 0 ? `+${net}` : `${net}`} />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider mt-1">
            {verdict}
          </div>
        </div>
      </div>

      {/* Visual balance bar */}
      <div className="rounded-full overflow-hidden bg-bb-mist h-3 flex">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-[flex-basis] duration-500"
          style={{ flexBasis: `${gainedPct}%` }}
          title={`${gained} gained`}
        />
        <div
          className="h-full bg-gradient-to-r from-bb-magenta to-bb-magenta-dark transition-[flex-basis] duration-500"
          style={{ flexBasis: `${lostPct}%` }}
          title={`${lost} lost`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Gained */}
        <div className="rounded-lg bg-emerald-50/60 ring-1 ring-emerald-100 p-3">
          <div className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 mb-1">
            Customers gained
          </div>
          <div className="text-2xl font-bold text-emerald-700 leading-none">
            +<MaybeCountUp value={gained} />
          </div>
          <div className="mt-2 space-y-1 text-xs text-bb-ink/70">
            <Row label="New customers" value={newCustomers} sign="+" />
            <Row label="Returning customers" value={resubscriptions} sign="+" />
          </div>
        </div>

        {/* Lost */}
        <div className="rounded-lg bg-bb-magenta/5 ring-1 ring-bb-magenta/15 p-3">
          <div className="text-[10px] font-bold tracking-wider uppercase text-bb-magenta-dark mb-1">
            Customers lost
          </div>
          <div className="text-2xl font-bold text-bb-magenta leading-none">
            −<MaybeCountUp value={lost} />
          </div>
          <div className="mt-2 space-y-1 text-xs text-bb-ink/70">
            <Row label="Cancellations" value={cancellations} sign="−" />
            <Row label="Failed payments" value={failedPayments} sign="−" />
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-bb-ink/60 flex items-center gap-2">
        <span className="font-semibold text-bb-ink">{headline}</span>
        <span>· {gained} in / {lost} out</span>
      </div>
    </div>
  );
}

function Row({ label, value, sign }: { label: string; value: number; sign: '+' | '−' }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-bb-ink/65 truncate">{label}</span>
      <span className="font-semibold tabular-nums text-bb-ink">
        {sign}
        {value}
      </span>
    </div>
  );
}
