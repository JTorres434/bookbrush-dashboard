import { readAllSheets } from '@/lib/sheets';
import { computeKpis, dateRangePresets, timeSeriesByDay, planBreakdown } from '@/lib/metrics';
import { Header } from '@/components/Header';
import { KpiCard } from '@/components/KpiCard';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { PlanBreakdown } from '@/components/PlanBreakdown';
import { DateRangePicker } from '@/components/DateRangePicker';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const { ac, fc, fp, resub, needsReview } = await readAllSheets();
  const presets = dateRangePresets();
  const rangeKey = searchParams.range && presets[searchParams.range] ? searchParams.range : 'Last 30 days';
  const range = presets[rangeKey];

  const kpis = computeKpis({ ac, fc, fp, resub, range });
  const series = timeSeriesByDay({ ac, fc, resub, range });
  const cancelByPlan = planBreakdown(ac, range, 'Date Plan Ended');
  const resubByPlan = planBreakdown(resub, range, 'Date Plan Reactivated');

  const needsReviewCount = needsReview.length;
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${
    process.env.GOOGLE_SHEET_ID || '1DfiRBNQvXvVAiZtrV857a6TsgT8bjkEOJdjztIs5ePU'
  }/edit`;

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-bb-ink">Overview</h2>
            <p className="text-sm text-bb-ink/60 mt-1">
              Reading from the live Google Sheet — refreshes every 60 seconds.
            </p>
          </div>
          <DateRangePicker />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard label="Cancellations" value={kpis.cancellations} tone="warn" />
          <KpiCard label="Resubscriptions" value={kpis.resubscriptions} tone="positive" />
          <KpiCard
            label="Net Change"
            value={kpis.netChange > 0 ? `+${kpis.netChange}` : kpis.netChange}
            tone={kpis.netChange >= 0 ? 'positive' : 'warn'}
          />
          <KpiCard label="Win-back Rate" value={kpis.winBackRate} suffix="%" tone="neutral" />
          <KpiCard
            label="Failed Payments"
            value={kpis.failedPaymentsAwaiting}
            tone="neutral"
            hint="awaiting actual cancellation"
          />
        </div>

        <TimeSeriesChart data={series} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PlanBreakdown title="Cancellations by Plan" data={cancelByPlan} />
          <PlanBreakdown title="Resubscriptions by Plan" data={resubByPlan} />
        </div>

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
