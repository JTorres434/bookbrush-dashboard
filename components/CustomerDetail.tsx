'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, ExternalLink, Calendar, AlertCircle, Tag } from 'lucide-react';
import type { SheetRow } from '@/lib/sheets';
import { parseSheetDate, isStandardPlan } from '@/lib/sheets';

type Event = {
  date: Date;
  type: 'joined' | 'cancelled' | 'scheduled' | 'failed_payment' | 'returned' | 'contacted';
  label: string;
  detail?: string;
};

const TYPE_STYLE: Record<Event['type'], { color: string; verb: string }> = {
  joined:         { color: 'bg-bb-purple',     verb: 'Joined Bookbrush' },
  scheduled:      { color: 'bg-amber-500',     verb: 'Scheduled cancellation' },
  cancelled:      { color: 'bg-bb-magenta',    verb: 'Subscription cancelled' },
  failed_payment: { color: 'bg-red-500',       verb: 'Cancelled — payment failed' },
  returned:       { color: 'bg-emerald-500',   verb: 'Came back' },
  contacted:      { color: 'bg-bb-purple-light', verb: 'Win-back email sent' },
};

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildTimeline(opts: {
  email: string;
  ac: SheetRow[]; fc: SheetRow[]; fp: SheetRow[]; resub: SheetRow[];
}): Event[] {
  const e = opts.email.toLowerCase();
  const match = (rows: SheetRow[]) => rows.filter((r) => (r['Email'] || '').toLowerCase() === e);
  const out: Event[] = [];

  for (const r of match(opts.ac)) {
    const join = parseSheetDate(r['Join Date'] || '');
    if (join) out.push({ date: join, type: 'joined', label: 'Joined', detail: r['Plan Name'] });
    const ended = parseSheetDate(r['Date Plan Ended'] || '');
    if (ended) out.push({ date: ended, type: 'cancelled', label: 'Cancelled', detail: `${r['Plan Name'] || ''} · $${r['Pricing'] || '?'}/mo` });
    const contacted = parseSheetDate(r['Date Contacted'] || '');
    if (contacted && r['Emailed']) out.push({ date: contacted, type: 'contacted', label: 'Win-back email sent' });
  }
  for (const r of match(opts.fc)) {
    const clicked = parseSheetDate(r['Date clicked Cancel'] || '');
    if (clicked) out.push({ date: clicked, type: 'scheduled', label: 'Scheduled cancellation', detail: `Ends: ${r['Date Plan Ends'] || '?'}` });
  }
  for (const r of match(opts.fp)) {
    const ended = parseSheetDate(r['Date Plan Ends'] || '');
    if (ended) out.push({ date: ended, type: 'failed_payment', label: 'Payment failed cancellation', detail: r['Plan Name'] });
  }
  for (const r of match(opts.resub)) {
    const reac = parseSheetDate(r['Date Plan Reactivated'] || '');
    if (reac) out.push({ date: reac, type: 'returned', label: 'Returned to Bookbrush', detail: `${r['Plan Name'] || ''} · $${r['Pricing'] || '?'}/mo` });
  }

  out.sort((a, b) => b.date.getTime() - a.date.getTime());
  // Dedupe by (type, date.toISOString.slice(0,10))
  const seen = new Set<string>();
  return out.filter((ev) => {
    const k = `${ev.type}|${ev.date.toISOString().slice(0, 10)}|${ev.detail || ''}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

type Snapshot = {
  fullName: string;
  email: string;
  plans: Set<string>;
  pricings: Set<string>;
  appearsIn: Array<'Already Cancelled' | 'Future Cancellation' | 'Failed Payments' | 'Resubscriptions'>;
  tags: string[];
  daysSinceFirstCancel: number | null;
  daysSinceLastEvent: number | null;
};

function buildSnapshot(opts: {
  email: string;
  ac: SheetRow[]; fc: SheetRow[]; fp: SheetRow[]; resub: SheetRow[];
}): Snapshot {
  const e = opts.email.toLowerCase();
  const matchInfo = [
    { rows: opts.ac, label: 'Already Cancelled' as const },
    { rows: opts.fc, label: 'Future Cancellation' as const },
    { rows: opts.fp, label: 'Failed Payments' as const },
    { rows: opts.resub, label: 'Resubscriptions' as const },
  ];

  const plans = new Set<string>();
  const pricings = new Set<string>();
  const appearsIn: Snapshot['appearsIn'] = [];
  const tags = new Set<string>();
  let firstName = '';
  let lastName = '';
  const allDates: number[] = [];

  for (const m of matchInfo) {
    const rows = m.rows.filter((r) => (r['Email'] || '').toLowerCase() === e);
    if (rows.length > 0) appearsIn.push(m.label);
    for (const r of rows) {
      firstName = firstName || (r['First Name'] || '').trim();
      lastName = lastName || (r['Last Name'] || '').trim();
      const planNorm = isStandardPlan(r['Plan Name'] || '') || (r['Plan Name'] || '').trim();
      if (planNorm) plans.add(planNorm);
      const p = (r['Pricing'] || '').toString().replace(/[^\d.]/g, '');
      if (p && parseFloat(p) > 0) pricings.add(`$${parseFloat(p).toFixed(2)}`);
      const tagField = m.label === 'Failed Payments' ? 'Tags' : 'Tag';
      const tag = (r[tagField] || '').trim();
      if (tag) tags.add(tag);
      for (const fld of ['Date Plan Ended', 'Date Plan Ends', 'Date clicked Cancel', 'Date Contacted', 'Date Plan Reactivated', 'Join Date']) {
        const d = parseSheetDate(r[fld] || '');
        if (d) allDates.push(d.getTime());
      }
    }
  }

  const fullName = `${firstName} ${lastName}`.trim() || opts.email;
  const now = Date.now();
  const minDate = allDates.length ? Math.min(...allDates) : null;
  const maxDate = allDates.length ? Math.max(...allDates) : null;

  return {
    fullName,
    email: opts.email,
    plans,
    pricings,
    appearsIn,
    tags: Array.from(tags),
    daysSinceFirstCancel: minDate ? Math.floor((now - minDate) / 86400000) : null,
    daysSinceLastEvent: maxDate ? Math.floor((now - maxDate) / 86400000) : null,
  };
}

export function CustomerDetail({
  email, ac, fc, fp, resub, onClose,
}: {
  email: string;
  ac: SheetRow[]; fc: SheetRow[]; fp: SheetRow[]; resub: SheetRow[];
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [onClose]);

  if (!mounted) return null;
  const snap = buildSnapshot({ email, ac, fc, fp, resub });
  const events = buildTimeline({ email, ac, fc, fp, resub });
  const gmailUrl = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email)}`;
  const stripeUrl = `https://dashboard.stripe.com/customers?email=${encodeURIComponent(email)}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-bb-ink/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-bb-mist rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-bb-ink/10 bg-white shrink-0">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-bb-ink truncate">{snap.fullName}</h2>
            <a
              href={`mailto:${snap.email}`}
              className="text-sm text-bb-purple hover:underline inline-flex items-center gap-1.5 mt-0.5"
            >
              <Mail className="w-3.5 h-3.5" />
              {snap.email}
            </a>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-bb-mist text-bb-ink/60 hover:text-bb-ink shrink-0 ml-4"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Snapshot */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Plans seen" value={Array.from(snap.plans).join(', ') || '—'} />
            <Stat label="Pricing seen" value={Array.from(snap.pricings).join(', ') || '—'} />
            <Stat
              label="In sheets"
              value={snap.appearsIn.length ? snap.appearsIn.join(', ') : '—'}
            />
            <Stat
              label="Last activity"
              value={
                snap.daysSinceLastEvent === null
                  ? '—'
                  : snap.daysSinceLastEvent === 0
                  ? 'today'
                  : `${snap.daysSinceLastEvent}d ago`
              }
            />
          </section>

          {/* Tags */}
          {snap.tags.length > 0 && (
            <section>
              <div className="text-xs font-semibold text-bb-ink/60 mb-2 flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                NOTES & TAGS
              </div>
              <div className="flex flex-wrap gap-2">
                {snap.tags.map((t) => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-bb-purple/10 text-bb-purple-dark">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Timeline */}
          <section>
            <div className="text-xs font-semibold text-bb-ink/60 mb-3 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              TIMELINE
            </div>
            {events.length === 0 ? (
              <div className="text-sm text-bb-ink/40 py-4">No timeline events recorded.</div>
            ) : (
              <ol className="space-y-3 relative pl-5">
                <div className="absolute left-1.5 top-2 bottom-2 w-px bg-bb-ink/10" aria-hidden />
                {events.map((ev, i) => {
                  const meta = TYPE_STYLE[ev.type];
                  return (
                    <li key={i} className="relative">
                      <span className={`absolute -left-5 top-1.5 w-3 h-3 rounded-full ${meta.color}`} />
                      <div className="text-sm">
                        <span className="font-medium text-bb-ink">{ev.label}</span>
                        {ev.detail && <span className="text-bb-ink/60"> · {ev.detail}</span>}
                      </div>
                      <div className="text-xs text-bb-ink/50">{fmtDate(ev.date)}</div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* Quick links */}
          <section className="flex flex-wrap gap-2 pt-2 border-t border-bb-ink/10">
            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener"
              className="text-sm px-3 py-2 rounded-md bg-bb-purple text-white font-medium hover:opacity-90 inline-flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              Search Gmail
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
            <a
              href={stripeUrl}
              target="_blank"
              rel="noopener"
              className="text-sm px-3 py-2 rounded-md bg-white border border-bb-ink/15 hover:bg-bb-mist text-bb-ink font-medium inline-flex items-center gap-1.5"
            >
              Search Stripe
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
            <a
              href={`mailto:${snap.email}`}
              className="text-sm px-3 py-2 rounded-md bg-white border border-bb-ink/15 hover:bg-bb-mist text-bb-ink font-medium inline-flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              Email directly
            </a>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-bb-ink/5">
      <div className="text-[10px] font-semibold text-bb-ink/50 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-bb-ink font-medium mt-0.5 break-words">{value}</div>
    </div>
  );
}
