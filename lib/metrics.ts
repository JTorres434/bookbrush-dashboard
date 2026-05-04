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

// Compute the SAME date range but shifted backwards by one period length.
// E.g. "Last 7 days" -> the 7 days before that.
export function previousRange(range: DateRange): DateRange {
  const ms = range.end.getTime() - range.start.getTime();
  return {
    start: new Date(range.start.getTime() - ms),
    end: new Date(range.start.getTime() - 1),
  };
}

export type KpiTrend = {
  current: number;
  previous: number;
  deltaPct: number | null;  // null if previous = 0 (can't divide)
};

export function computeTrend(current: number, previous: number): KpiTrend {
  if (previous === 0) return { current, previous, deltaPct: null };
  const deltaPct = ((current - previous) / previous) * 100;
  return { current, previous, deltaPct: Math.round(deltaPct * 10) / 10 };
}

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
  fp?: SheetRow[];
  resub: SheetRow[];
  range: DateRange;
}): { date: string; cancellations: number; resubscriptions: number; failedPayments: number }[] {
  const { ac, fc, fp = [], resub, range } = opts;
  const dayBuckets: Record<string, { cancellations: number; resubscriptions: number; failedPayments: number }> = {};

  for (let d = new Date(range.start); d <= range.end; d.setDate(d.getDate() + 1)) {
    dayBuckets[d.toISOString().slice(0, 10)] = { cancellations: 0, resubscriptions: 0, failedPayments: 0 };
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
  for (const r of fp) {
    const d = rowDate(r, ['Date Contacted', 'Date Plan Ends']);
    if (!d || !inRange(d, range)) continue;
    const key = d.toISOString().slice(0, 10);
    if (dayBuckets[key]) dayBuckets[key].failedPayments++;
  }
  return Object.entries(dayBuckets).map(([date, v]) => ({ date, ...v }));
}

// === Today's Alerts: simple anomaly detection ===
// Compares today's count of cancellations to the average of the prior 7 days.
// Returns an alert if today is meaningfully higher than usual.
export type TodayAlert = {
  type: 'spike' | 'all_quiet' | 'recovery_streak';
  severity: 'info' | 'warn';
  message: string;
};

export function detectTodaysAlerts(opts: {
  ac: SheetRow[]; fc: SheetRow[]; fp: SheetRow[]; resub: SheetRow[];
}): TodayAlert[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayMs = now.getTime();

  function countOnDay(rows: SheetRow[], fields: string[], dayMs: number): number {
    let n = 0;
    for (const r of rows) {
      const d = rowDate(r, fields);
      if (!d) continue;
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (dayStart === dayMs) n++;
    }
    return n;
  }

  const todayCancels =
    countOnDay(opts.ac, ['Date Plan Ended'], todayMs) +
    countOnDay(opts.fc, ['Date clicked Cancel'], todayMs) +
    countOnDay(opts.fp, ['Date Contacted'], todayMs);

  // Average of previous 7 days (excluding today)
  let prior7 = 0;
  for (let i = 1; i <= 7; i++) {
    const dayMs = todayMs - i * 86400000;
    prior7 +=
      countOnDay(opts.ac, ['Date Plan Ended'], dayMs) +
      countOnDay(opts.fc, ['Date clicked Cancel'], dayMs) +
      countOnDay(opts.fp, ['Date Contacted'], dayMs);
  }
  const avg = prior7 / 7;

  const todayResubs = countOnDay(opts.resub, ['Date Plan Reactivated'], todayMs);

  const alerts: TodayAlert[] = [];

  // Spike alert: today is at least 3 cancellations AND 1.5x average
  if (todayCancels >= 3 && avg > 0 && todayCancels >= avg * 1.5) {
    const pct = Math.round(((todayCancels - avg) / avg) * 100);
    alerts.push({
      type: 'spike',
      severity: 'warn',
      message: `Today's cancellations (${todayCancels}) are ${pct}% above the 7-day average. Worth checking why.`,
    });
  }

  if (todayResubs >= 3) {
    alerts.push({
      type: 'recovery_streak',
      severity: 'info',
      message: `Strong day — ${todayResubs} customers came back today.`,
    });
  }

  return alerts;
}

// === Recovery Journey: funnel from cancellation to return ===
export type RecoveryStage = { label: string; count: number; description: string };

export function recoveryJourney(opts: {
  ac: SheetRow[]; fc: SheetRow[]; fp: SheetRow[]; resub: SheetRow[]; range: DateRange;
}): RecoveryStage[] {
  const { ac, fc, fp, resub, range } = opts;
  const inR = (r: SheetRow, fields: string[]) => inRange(rowDate(r, fields), range);

  const cancelledRows = [
    ...ac.filter((r) => inR(r, ['Date Plan Ended'])),
    ...fc.filter((r) => inR(r, ['Date clicked Cancel'])),
    ...fp.filter((r) => inR(r, ['Date Contacted'])),
  ];
  const cancelledEmails = new Set(cancelledRows.map((r) => (r['Email'] || '').toLowerCase()).filter(Boolean));

  // Drafted = has Emailed (AC) or Email Exist (FC) populated
  const draftedRows = cancelledRows.filter((r) => {
    const flag = (r['Emailed'] || r['Email Exist'] || '').toString().trim();
    return flag.length > 0;
  });
  const draftedEmails = new Set(draftedRows.map((r) => (r['Email'] || '').toLowerCase()));

  // Replied = tagged with "Replied" or "Skipped - Replied"
  const repliedEmails = new Set<string>();
  for (const r of cancelledRows) {
    const tag = ((r['Tag'] || r['Tags'] || '') as string).toLowerCase();
    const e = (r['Email'] || '').toLowerCase();
    if (e && (tag.includes('replied') || tag.includes('contacted in gmail'))) {
      repliedEmails.add(e);
    }
  }

  // Returned = email is in resubscriptions sheet
  const returnedEmails = new Set(
    resub
      .filter((r) => inR(r, ['Date Plan Reactivated']))
      .map((r) => (r['Email'] || '').toLowerCase())
      .filter(Boolean)
  );
  // Intersect: only count returns of customers who were in the cancelled cohort this period
  const returnedFromCohort = new Set([...returnedEmails].filter((e) => cancelledEmails.has(e)));

  return [
    {
      label: 'Cancelled',
      count: cancelledEmails.size,
      description: 'Unique customers who left in this period',
    },
    {
      label: 'Win-back drafted',
      count: draftedEmails.size,
      description: 'Got a personalized email from us',
    },
    {
      label: 'Replied',
      count: repliedEmails.size,
      description: 'Engaged back via Gmail or support',
    },
    {
      label: 'Returned',
      count: returnedFromCohort.size,
      description: 'Came back as a paying customer',
    },
  ];
}

// === How long customers stayed before cancelling (tenure histogram) ===
export type TenureBucket = { label: string; count: number; minDays: number; maxDays: number };

export function tenureHistogram(opts: { ac: SheetRow[]; range: DateRange }): TenureBucket[] {
  const buckets: TenureBucket[] = [
    { label: '< 30d',     minDays: 0,    maxDays: 30,   count: 0 },
    { label: '1–3 mo',    minDays: 30,   maxDays: 90,   count: 0 },
    { label: '3–6 mo',    minDays: 90,   maxDays: 180,  count: 0 },
    { label: '6–12 mo',   minDays: 180,  maxDays: 365,  count: 0 },
    { label: '1–2 yr',    minDays: 365,  maxDays: 730,  count: 0 },
    { label: '2–4 yr',    minDays: 730,  maxDays: 1460, count: 0 },
    { label: '4+ yr',     minDays: 1460, maxDays: Infinity, count: 0 },
  ];

  for (const r of opts.ac) {
    const ended = parseSheetDate(r['Date Plan Ended'] || '');
    if (!ended || !inRange(ended, opts.range)) continue;
    const join = parseSheetDate(r['Join Date'] || '');
    if (!join) continue;
    const days = (ended.getTime() - join.getTime()) / 86400000;
    if (days < 0) continue;
    for (const b of buckets) {
      if (days >= b.minDays && days < b.maxDays) {
        b.count++;
        break;
      }
    }
  }
  return buckets;
}

// === Calendar heatmap: cancellations per day for the last 365 days ===
export type HeatmapCell = { date: string; count: number; weekday: number };

export function cancellationHeatmap(opts: {
  ac: SheetRow[]; fc: SheetRow[]; fp: SheetRow[];
}): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - 364 * 86400000);
  // Roll back to Sunday for clean week alignment
  start.setDate(start.getDate() - start.getDay());

  const counts: Record<string, number> = {};
  function bump(rows: SheetRow[], fields: string[]) {
    for (const r of rows) {
      const d = rowDate(r, fields);
      if (!d) continue;
      if (d > today) continue;
      const key = d.toISOString().slice(0, 10);
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  bump(opts.ac, ['Date Plan Ended']);
  bump(opts.fc, ['Date clicked Cancel']);
  bump(opts.fp, ['Date Contacted']);

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: counts[key] || 0, weekday: d.getDay() });
  }
  return cells;
}

export type PlanSlice = {
  name: string;
  value: number;
  customers: { name: string; email: string }[];
};

export function planBreakdown(rows: SheetRow[], range: DateRange, dateField: string): PlanSlice[] {
  const buckets: Record<string, PlanSlice['customers']> = { Plus: [], Gold: [], Platinum: [] };
  for (const r of rows) {
    const d = parseSheetDate(r[dateField] || '');
    if (!d || !inRange(d, range)) continue;
    const plan = isStandardPlan(r['Plan Name'] || '');
    if (!plan) continue;
    const email = (r['Email'] || '').trim();
    if (!email) continue;
    const fullName = `${r['First Name'] || ''} ${r['Last Name'] || ''}`.trim() || email;
    buckets[plan].push({ name: fullName, email });
  }
  return [
    { name: 'Plus',     value: buckets.Plus.length,     customers: buckets.Plus },
    { name: 'Gold',     value: buckets.Gold.length,     customers: buckets.Gold },
    { name: 'Platinum', value: buckets.Platinum.length, customers: buckets.Platinum },
  ];
}
