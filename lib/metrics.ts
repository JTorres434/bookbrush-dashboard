import type { SheetRow } from './sheets';
import { parseSheetDate, isStandardPlan } from './sheets';

export type DateRange = { start: Date; end: Date };

export function dateRangePresets(): Record<string, DateRange> {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const day = 86400 * 1000;
  return {
    'Last 7 days': { start: new Date(now.getTime() - 7 * day), end: now },
    'Last 30 days': { start: new Date(now.getTime() - 30 * day), end: now },
    'Last 90 days': { start: new Date(now.getTime() - 90 * day), end: now },
    'Year to date': { start: new Date(now.getFullYear(), 0, 1), end: now },
  };
}

function rowDate(row: SheetRow, fields: string[]): Date | null {
  for (const f of fields) {
    const d = parseSheetDate(row[f] || '');
    if (d) return d;
  }
  return null;
}

function inRange(d: Date | null, range: DateRange): boolean {
  if (!d) return false;
  return d >= range.start && d <= range.end;
}

export type Kpi = {
  cancellations: number;
  resubscriptions: number;
  netChange: number;
  winBackRate: number;        // % of cancellations that resubscribed
  failedPaymentsAwaiting: number;
};

export function computeKpis(opts: {
  ac: SheetRow[];
  fc: SheetRow[];
  fp: SheetRow[];
  resub: SheetRow[];
  range: DateRange;
}): Kpi {
  const { ac, fc, fp, resub, range } = opts;
  const cancellations = [
    ...ac.filter((r) => inRange(rowDate(r, ['Date Plan Ended', 'Date Contacted']), range)),
    ...fc.filter((r) => inRange(rowDate(r, ['Date clicked Cancel', 'Date Plan Ends']), range)),
    ...fp.filter((r) => inRange(rowDate(r, ['Date Contacted', 'Date Plan Ends']), range)),
  ].length;

  const resubscriptions = resub.filter((r) =>
    inRange(rowDate(r, ['Date Plan Reactivated']), range)
  ).length;

  const failedPaymentsAwaiting = fp.filter((r) =>
    inRange(rowDate(r, ['Date Contacted']), range)
  ).length;

  return {
    cancellations,
    resubscriptions,
    netChange: resubscriptions - cancellations,
    winBackRate: cancellations === 0 ? 0 : Math.round((resubscriptions / cancellations) * 1000) / 10,
    failedPaymentsAwaiting,
  };
}

export function timeSeriesByDay(opts: {
  ac: SheetRow[];
  fc: SheetRow[];
  resub: SheetRow[];
  range: DateRange;
}): { date: string; cancellations: number; resubscriptions: number }[] {
  const { ac, fc, resub, range } = opts;
  const dayBuckets: Record<string, { cancellations: number; resubscriptions: number }> = {};

  for (let d = new Date(range.start); d <= range.end; d.setDate(d.getDate() + 1)) {
    dayBuckets[d.toISOString().slice(0, 10)] = { cancellations: 0, resubscriptions: 0 };
  }

  for (const r of [...ac, ...fc]) {
    const d = rowDate(r, ['Date Plan Ended', 'Date clicked Cancel', 'Date Plan Ends']);
    if (!d || !inRange(d, range)) continue;
    const key = d.toISOString().slice(0, 10);
    if (dayBuckets[key]) dayBuckets[key].cancellations++;
  }
  for (const r of resub) {
    const d = rowDate(r, ['Date Plan Reactivated']);
    if (!d || !inRange(d, range)) continue;
    const key = d.toISOString().slice(0, 10);
    if (dayBuckets[key]) dayBuckets[key].resubscriptions++;
  }
  return Object.entries(dayBuckets).map(([date, v]) => ({ date, ...v }));
}

export function planBreakdown(rows: SheetRow[], range: DateRange, dateField: string) {
  const buckets: Record<string, number> = { Plus: 0, Gold: 0, Platinum: 0 };
  for (const r of rows) {
    const d = parseSheetDate(r[dateField] || '');
    if (!d || !inRange(d, range)) continue;
    const plan = isStandardPlan(r['Plan Name'] || '');
    if (plan) buckets[plan]++;
  }
  return [
    { name: 'Plus', value: buckets.Plus },
    { name: 'Gold', value: buckets.Gold },
    { name: 'Platinum', value: buckets.Platinum },
  ];
}
