import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readAllSheets } from '@/lib/sheets';
import { computeKpis, dateRangePresets, timeSeriesByDay, planBreakdown } from '@/lib/metrics';
import { AUTH_COOKIE_NAME, isAuthCookieValid } from '@/lib/auth';
import { Header } from '@/components/Header';
import { KpiGrid } from '@/components/KpiGrid';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { PlanBreakdown } from '@/components/PlanBreakdown';
import { DateRangePicker } from '@/components/DateRangePicker';
import { CustomersTable } from '@/components/CustomersTable';
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

  const kpis = computeKpis({ ac, fc, fp, resub, range });
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
    },
    {
      label: 'Resubscriptions',
      value: kpis.resubscriptions,
      tone: 'positive' as const,
      customers: kpiLists.resubscriptions,
      modalTitle: `Resubscriptions · ${rangeKey} (${kpiLists.resubscriptions.length})`,
    },
    {
      label: 'Net Change',
      value: kpis.netChange > 0 ? `+${kpis.netChange}` : kpis.netChange,
      tone: (kpis.netChange >= 0 ? 'positive' : 'warn') as 'positive' | 'warn',
      customers: kpiLists.netChangeAll,
      modalTitle: `Net Change · ${rangeKey} (cancellations + resubscriptions)`,
    },
    {
      label: 'Win-back Rate',
      value: kpis.winBackRate,
      suffix: '%',
      tone: 'neutral' as const,
      customers: kpiLists.resubscriptions,
      modalTitle: `Win-back Rate · ${rangeKey} (${kpiLists.resubscriptions.length} won back of ${kpiLists.cancellations.length} cancelled)`,
    },
    {
      label: 'Failed Payments',
      value: kpis.failedPaymentsAwaiting,
      tone: 'neutral' as const,
      hint: 'awaiting actual cancellation',
      customers: kpiLists.failedPayments,
      modalTitle: `Failed Payments · ${rangeKey} (${kpiLists.failedPayments.length})`,
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
              Reading from the live Google Sheet — refreshes every 60 seconds. Click any number to see the customer list.
            </p>
          </div>
          <DateRangePicker />
        </div>

        <KpiGrid items={kpiItems} />

        <TimeSeriesChart data={series} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PlanBreakdown title="Cancellations by Plan" data={cancelByPlan} />
          <PlanBreakdown title="Resubscriptions by Plan" data={resubByPlan} />
        </div>

        <CustomersTable customers={buildCustomerList({ ac, fc, fp, resub })} />

        {needsReviewCount > 0 && (
          <div className="bg-bb-magenta/10 border border-bb-magenta/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-bb-magenta-dark">
                {needsReviewCount} {needsReviewCount === 1 ? 'customer' : 'customers'} in Needs Review
              </div>
              <div className="text-sm text-bb-ink/70 mt-0.5">
                Refunded customers, annual short-tenure cancellations, or other edge cases.
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
          Range: {rangeKey} · {ac.length + fc.length + fp.length} total tracked customers · {resub.length} resubscriptions on file
        </footer>
      </main>
    </>
  );
}
