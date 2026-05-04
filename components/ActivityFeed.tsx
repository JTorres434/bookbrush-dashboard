import { Activity } from 'lucide-react';
import type { SheetRow } from '@/lib/sheets';
import { parseSheetDate, isStandardPlan } from '@/lib/sheets';

type Event = {
  date: Date;
  type: 'cancelled' | 'scheduled' | 'failed_payment' | 'returned';
  email: string;
  name: string;
  plan: string;
};

const TYPE_LABEL: Record<Event['type'], { label: string; color: string; verb: string }> = {
  cancelled:        { label: 'Cancelled',        color: 'bg-bb-magenta',  verb: 'cancelled' },
  scheduled:        { label: 'Scheduled',        color: 'bg-amber-500',   verb: 'scheduled cancellation' },
  failed_payment:   { label: 'Payment Failed',   color: 'bg-red-500',     verb: 'cancelled (payment failed)' },
  returned:         { label: 'Returned',         color: 'bg-emerald-500', verb: 'came back' },
};

function buildEvents(opts: { ac: SheetRow[]; fc: SheetRow[]; fp: SheetRow[]; resub: SheetRow[] }): Event[] {
  const out: Event[] = [];
  const mkName = (r: SheetRow) =>
    `${r['First Name'] || ''} ${r['Last Name'] || ''}`.trim() || r['Email'] || 'Unknown';

  for (const r of opts.ac) {
    const d = parseSheetDate(r['Date Plan Ended'] || r['Date Contacted'] || '');
    if (!d) continue;
    out.push({ date: d, type: 'cancelled', email: r['Email'] || '', name: mkName(r),
               plan: isStandardPlan(r['Plan Name'] || '') || '' });
  }
  for (const r of opts.fc) {
    const d = parseSheetDate(r['Date clicked Cancel'] || r['Date Contacted'] || '');
    if (!d) continue;
    out.push({ date: d, type: 'scheduled', email: r['Email'] || '', name: mkName(r),
               plan: isStandardPlan(r['Plan Name'] || '') || '' });
  }
  for (const r of opts.fp) {
    const d = parseSheetDate(r['Date Contacted'] || r['Date Plan Ends'] || '');
    if (!d) continue;
    out.push({ date: d, type: 'failed_payment', email: r['Email'] || '', name: mkName(r),
               plan: isStandardPlan(r['Plan Name'] || '') || '' });
  }
  for (const r of opts.resub) {
    const d = parseSheetDate(r['Date Plan Reactivated'] || '');
    if (!d) continue;
    out.push({ date: d, type: 'returned', email: r['Email'] || '', name: mkName(r),
               plan: isStandardPlan(r['Plan Name'] || '') || '' });
  }
  out.sort((a, b) => b.date.getTime() - a.date.getTime());
  return out;
}

function relTime(d: Date): string {
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day >= 1) return `${day}d ago`;
  if (hr >= 1) return `${hr}h ago`;
  if (min >= 1) return `${min}m ago`;
  return 'just now';
}

export function ActivityFeed({
  ac, fc, fp, resub,
}: {
  ac: SheetRow[]; fc: SheetRow[]; fp: SheetRow[]; resub: SheetRow[];
}) {
  const events = buildEvents({ ac, fc, fp, resub }).slice(0, 20);

  return (
    <div className="bg-white rounded-xl card-shadow p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-bb-purple" />
        <h2 className="font-semibold text-bb-ink">Recent Activity</h2>
        <span className="text-xs text-bb-ink/50 ml-auto">last 20 events</span>
      </div>
      {events.length === 0 ? (
        <div className="text-sm text-bb-ink/50 py-4 text-center">No activity yet.</div>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {events.map((e, i) => {
            const meta = TYPE_LABEL[e.type];
            return (
              <li key={`${e.email}-${e.type}-${i}`} className="flex items-start gap-3 text-sm">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${meta.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-bb-ink">
                    <span className="font-medium">{e.name}</span>{' '}
                    <span className="text-bb-ink/60">{meta.verb}</span>
                    {e.plan && <span className="text-bb-ink/60"> ({e.plan})</span>}
                  </div>
                </div>
                <span className="text-xs text-bb-ink/50 shrink-0 whitespace-nowrap">
                  {relTime(e.date)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
