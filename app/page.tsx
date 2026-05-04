import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readAllSheets } from '@/lib/sheets';
import {
  computeKpis, computeTrend, dateRangePresets, planBreakdown,
  previousRange, timeSeriesByDay,
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
import { buildCustomerList, buildKpiCustomers } from '@/lib/customers';

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

  const series = timeSeriesByDay({ ac, fc, resub, range });
  const cancelByPlan = planBreakdown(ac, range, 'Date Plan Ended');
  const resubByPlan = planBreakdown(resub, range, 'Date Plan Reactivated');
  const kpiLists = buildKpiCustomers({ ac, fc, fp, resub, range });

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
    },
    {
      label: 'Returning Customers',
      value: kpis.resubscriptions,
      tone: 'positive' as const,
      customers: kpiLists.resubscriptions,
      modalTitle: `Returning Customers · ${rangeKey} (${kpiLists.resubscriptions.length})`,
      trend: { ...computeTrend(kpis.resubscriptions, prevKpis.resubscriptions), positiveIsGood: true },
    },
    {
      label: 'Net Change',
      value: kpis.netChange > 0 ? `+${kpis.netChange}` : kpis.netChange,
      tone: (kpis.netChange >= 0 ? 'positive' : 'warn') as 'positive' | 'warn',
      customers: kpiLists.netChangeAll,
      modalTitle: `Net Change · ${rangeKey} (cancellations + returns)`,
      trend: { ...computeTrend(kpis.netChange, prevKpis.netChange), positiveIsGood: true },
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
    },
  ];

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-bb-ink">Overview</h2>
            <p className="text-sm text-bb-ink/60 mt-1">
              Live from the Google Sheet · click any number to see the customers behind it.
            </p>
          </div>
          <DateRangePicker />
        </div>

        <ErrorBoundary label="KPI cards"><KpiGrid items={kpiItems} /></ErrorBoundary>

        <ErrorBoundary label="Time-series chart"><TimeSeriesChart data={series} /></ErrorBoundary>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ErrorBoundary label="Watch List"><WatchList fc={fc} ac={ac} fp={fp} resub={resub} /></ErrorBoundary>
          <ErrorBoundary label="System Status"><SystemStatus /></ErrorBoundary>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ErrorBoundary label="Recent Activity"><ActivityFeed ac={ac} fc={fc} fp={fp} resub={resub} /></ErrorBoundary>
          <div className="grid grid-cols-1 gap-4">
            <ErrorBoundary label="Cancellations by Plan">
              <PlanBreakdown title="Cancellations by Plan" data={cancelByPlan} ac={ac} fc={fc} fp={fp} resub={resub} />
            </ErrorBoundary>
            <ErrorBoundary label="Returning Customers by Plan">
              <PlanBreakdown title="Returning Customers by Plan" data={resubByPlan} ac={ac} fc={fc} fp={fp} resub={resub} />
            </ErrorBoundary>
          </div>
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
