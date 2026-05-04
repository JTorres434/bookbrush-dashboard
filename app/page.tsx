import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readAllSheets } from '@/lib/sheets';
import {
  computeKpis, computeTrend, dateRangePresets, planBreakdown,
  previousRange, timeSeriesByDay,
  detectTodaysAlerts, recoveryJourney, tenureHistogram, cancellationHeatmap,
} from '@/lib/metrics';
import { AUTH_COOKIE_NAME, isAuthCookieValid } from '@/lib/auth';
import { Header } from '@/components/Header';
import { KpiGrid } from '@/components/KpiGrid';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { PlanBreakdown } from '@/components/PlanBreakdown';
import { DateRangePicker } from '@/components/DateRangePicker';
import { CustomersTable } from '@/components/CustomersTable';
import { WatchList } from '@/components/WatchList';
import { ActivityFeed } from '@/components/ActivityFeed';
import { SystemStatus } from '@/components/SystemStatus';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TodaysAlerts } from '@/components/TodaysAlerts';
import { RecoveryJourney } from '@/components/RecoveryJourney';
import { TenureHistogram } from '@/components/TenureHistogram';
import { CalendarHeatmap } from '@/components/CalendarHeatmap';
import { NewCustomersCard } from '@/components/NewCustomersCard';
import { WinLossSection } from '@/components/WinLossSection';
import { buildCustomerList, buildKpiCustomers } from '@/lib/customers';
import { fetchNewCustomersInRange } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const cookieStore = cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const valid = await isAuthCookieValid(authCookie);
  if (!valid) redirect('/signin');

  const { ac, fc, fp, resub, needsReview } = await readAllSheets();
  const presets = dateRangePresets();
  const rangeKey = searchParams.range && presets[searchParams.range] ? searchParams.range : 'Last 30 days';
  const range = presets[rangeKey];
  const prevR = previousRange(range);

  const kpis = computeKpis({ ac, fc, fp, resub, range });
  const prevKpis = computeKpis({ ac, fc, fp, resub, range: prevR });

  const series = timeSeriesByDay({ ac, fc, fp, resub, range });
  const cancelByPlan = planBreakdown(ac, range, 'Date Plan Ended');
  const resubByPlan = planBreakdown(resub, range, 'Date Plan Reactivated');
  const kpiLists = buildKpiCustomers({ ac, fc, fp, resub, range });

  const alerts = detectTodaysAlerts({ ac, fc, fp, resub });
  const journey = recoveryJourney({ ac, fc, fp, resub, range });
  const tenure = tenureHistogram({ ac, range });
  const heatmap = cancellationHeatmap({ ac, fc, fp });

  // New customers — pre-compute three windows so the card can switch instantly.
  const now = Date.now();
  const day = 86400 * 1000;
  const [nc7, nc30, nc90] = await Promise.all([
    fetchNewCustomersInRange({ startMs: now - 7 * day, endMs: now }),
    fetchNewCustomersInRange({ startMs: now - 30 * day, endMs: now }),
    fetchNewCustomersInRange({ startMs: now - 90 * day, endMs: now }),
  ]);
  const newCustomersConfigured = nc7.configured || nc30.configured || nc90.configured;
  const newCustomersBuckets = {
    '7d': nc7.customers,
    '30d': nc30.customers,
    '90d': nc90.customers,
  };

  // New-customer count inside the user's currently selected range. Use the
  // 90-day bucket (which covers Last 7/30/90); for ranges older than 90 days
  // (e.g. Year-to-date in late months) this under-counts but it is the best
  // we have without a separate fetch.
  const rangeStartMs = range.start.getTime();
  const rangeEndMs = range.end.getTime();
  const newCustomersInRange = nc90.customers.filter(
    (c) => c.joinedAtUnixMs >= rangeStartMs && c.joinedAtUnixMs <= rangeEndMs,
  ).length;

  // Daily series per KPI for sparklines
  const sparkCancel = series.map((d) => d.cancellations);
  const sparkReturn = series.map((d) => d.resubscriptions);
  const sparkNet = series.map((d) => d.resubscriptions - d.cancellations);
  const sparkFP = series.map((d) => d.failedPayments);

  const needsReviewCount = needsReview.length;
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}/edit`;

  const kpiItems = [
    {
      label: 'Cancellations',
      value: kpis.cancellations,
      tone: 'warn' as const,
      customers: kpiLists.cancellations,
      modalTitle: `Cancellations · ${rangeKey} (${kpiLists.cancellations.length})`,
      trend: { ...computeTrend(kpis.cancellations, prevKpis.cancellations), positiveIsGood: false },
      sparkline: sparkCancel,
    },
    {
      label: 'Returning Customers',
      value: kpis.resubscriptions,
      tone: 'positive' as const,
      customers: kpiLists.resubscriptions,
      modalTitle: `Returning Customers · ${rangeKey} (${kpiLists.resubscriptions.length})`,
      trend: { ...computeTrend(kpis.resubscriptions, prevKpis.resubscriptions), positiveIsGood: true },
      sparkline: sparkReturn,
    },
    {
      label: 'Net Change',
      value: kpis.netChange > 0 ? `+${kpis.netChange}` : kpis.netChange,
      tone: (kpis.netChange >= 0 ? 'positive' : 'warn') as 'positive' | 'warn',
      customers: kpiLists.netChangeAll,
      modalTitle: `Net Change · ${rangeKey} (cancellations + returns)`,
      trend: { ...computeTrend(kpis.netChange, prevKpis.netChange), positiveIsGood: true },
      sparkline: sparkNet,
    },
    {
      label: 'Recovery Rate',
      value: kpis.winBackRate,
      suffix: '%',
      tone: 'neutral' as const,
      customers: kpiLists.resubscriptions,
      modalTitle: `Recovery Rate · ${rangeKey} (${kpiLists.resubscriptions.length} won back of ${kpiLists.cancellations.length} cancelled)`,
      trend: { ...computeTrend(kpis.winBackRate, prevKpis.winBackRate), positiveIsGood: true },
    },
    {
      label: 'Failed Payments',
      value: kpis.failedPaymentsAwaiting,
      tone: 'neutral' as const,
      hint: 'awaiting actual cancellation',
      customers: kpiLists.failedPayments,
      modalTitle: `Failed Payments · ${rangeKey} (${kpiLists.failedPayments.length})`,
      trend: { ...computeTrend(kpis.failedPaymentsAwaiting, prevKpis.failedPaymentsAwaiting), positiveIsGood: false },
      sparkline: sparkFP,
    },
  ];

  return (
    <>
      <Header ac={ac} fc={fc} fp={fp} resub={resub} />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-bb-ink">Overview</h2>
            <p className="text-sm text-bb-ink/60 mt-1 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <span className="bb-live-dot inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-bb-ink/80">Real-time customer signal</span>
              </span>
              <span className="text-bb-ink/40">·</span>
              <span>click any number to meet the people behind it.</span>
            </p>
          </div>
          <DateRangePicker />
        </div>

        <ErrorBoundary label="Today's Alerts"><TodaysAlerts alerts={alerts} /></ErrorBoundary>

        <ErrorBoundary label="KPI cards"><KpiGrid items={kpiItems} /></ErrorBoundary>

        <ErrorBoundary label="New Customers">
          <NewCustomersCard
            configured={newCustomersConfigured}
            buckets={newCustomersBuckets}
          />
        </ErrorBoundary>

        <ErrorBoundary label="Recovery Journey"><RecoveryJourney stages={journey} /></ErrorBoundary>

        <ErrorBoundary label="Time-series chart"><TimeSeriesChart data={series} /></ErrorBoundary>

        <ErrorBoundary label="Calendar heatmap"><CalendarHeatmap cells={heatmap} /></ErrorBoundary>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ErrorBoundary label="Watch List"><WatchList fc={fc} ac={ac} fp={fp} resub={resub} /></ErrorBoundary>
          <ErrorBoundary label="System Status"><SystemStatus /></ErrorBoundary>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ErrorBoundary label="Recent Activity"><ActivityFeed ac={ac} fc={fc} fp={fp} resub={resub} /></ErrorBoundary>
          <ErrorBoundary label="How Long They Stayed"><TenureHistogram buckets={tenure} /></ErrorBoundary>
        </div>

        <ErrorBoundary label="Are we winning">
          <WinLossSection
            newCustomers={newCustomersInRange}
            resubscriptions={kpis.resubscriptions}
            cancellations={kpis.cancellations}
            failedPayments={kpis.failedPaymentsAwaiting}
            rangeKey={rangeKey}
          />
        </ErrorBoundary>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ErrorBoundary label="Cancellations by Plan">
            <PlanBreakdown title="Cancellations by Plan" data={cancelByPlan} ac={ac} fc={fc} fp={fp} resub={resub} />
          </ErrorBoundary>
          <ErrorBoundary label="Returning Customers by Plan">
            <PlanBreakdown title="Returning Customers by Plan" data={resubByPlan} ac={ac} fc={fc} fp={fp} resub={resub} />
          </ErrorBoundary>
        </div>

        <ErrorBoundary label="Customers table">
          <CustomersTable customers={buildCustomerList({ ac, fc, fp, resub })} />
        </ErrorBoundary>

        {needsReviewCount > 0 && (
          <div className="bg-bb-magenta/10 border border-bb-magenta/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-bb-magenta-dark">
                {needsReviewCount} {needsReviewCount === 1 ? 'customer needs' : 'customers need'} your review
              </div>
              <div className="text-sm text-bb-ink/70 mt-0.5">
                Refunded customers, unusual cancellations, or other edge cases.
              </div>
            </div>
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener"
              className="text-sm px-4 py-2 rounded-md bg-bb-magenta text-white font-medium hover:opacity-90"
            >
              Open sheet →
            </a>
          </div>
        )}

        <footer className="text-center text-xs text-bb-ink/40 py-6">
          Range: {rangeKey} · {ac.length + fc.length + fp.length} customers in the pipeline · {resub.length} have come back
        </footer>
      </main>
    </>
  );
}
