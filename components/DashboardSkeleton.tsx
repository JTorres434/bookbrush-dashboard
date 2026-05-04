import { BBSkeleton } from './Spinner';
import { TopProgressBar } from './TopProgressBar';

/**
 * Full-page dashboard skeleton shown by app/loading.tsx during route
 * transitions. Mirrors the live dashboard layout so the page never feels
 * empty — header strip, KPI cards, charts, and tables shimmer in place.
 */
export function DashboardSkeleton() {
  return (
    <>
      <TopProgressBar />

      {/* Header strip — gradient brand bar */}
      <div className="bg-bb-gradient h-16 w-full flex items-center px-6">
        <div className="bg-white/20 h-7 w-40 rounded-md bb-shimmer" />
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Title row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <BBSkeleton className="h-7 w-40" />
            <BBSkeleton className="h-4 w-72" />
          </div>
          <BBSkeleton className="h-12 w-[420px] max-w-full rounded-xl" />
        </div>

        {/* KPI grid — 5 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl card-shadow p-5 space-y-3 bb-fade-in-up"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <BBSkeleton className="h-3 w-24" />
              <BBSkeleton className="h-8 w-20" />
              <BBSkeleton className="h-2 w-full" />
              <BBSkeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* New Customers card placeholder */}
        <div className="bg-white rounded-xl card-shadow p-5 space-y-3">
          <div className="flex items-center justify-between">
            <BBSkeleton className="h-4 w-48" />
            <div className="flex gap-1">
              <BBSkeleton className="h-7 w-20 rounded-full" />
              <BBSkeleton className="h-7 w-20 rounded-full" />
              <BBSkeleton className="h-7 w-20 rounded-full" />
            </div>
          </div>
          <BBSkeleton className="h-12 w-24" />
        </div>

        {/* Big chart skeleton — bars at varied heights */}
        <div className="bg-white rounded-xl card-shadow p-5">
          <BBSkeleton className="h-4 w-40 mb-4" />
          <div className="flex items-end gap-2 h-48">
            {Array.from({ length: 24 }).map((_, i) => {
              const h = 25 + ((i * 37) % 70);
              return (
                <div key={i} className="flex-1 flex items-end" style={{ height: '100%' }}>
                  <BBSkeleton className="w-full rounded-t-md" rounded="" style={{ height: `${h}%` }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-column lower row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-xl card-shadow p-5 space-y-3">
              <BBSkeleton className="h-4 w-36" />
              <BBSkeleton className="h-12 w-full" />
              <BBSkeleton className="h-12 w-full" />
              <BBSkeleton className="h-12 w-3/4" />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
