'use client';

import { CalendarDays } from 'lucide-react';
import type { HeatmapCell } from '@/lib/metrics';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function colorFor(count: number, max: number): string {
  if (count === 0) return '#f0eaf7';
  const ratio = Math.min(1, count / max);
  // Interpolate from light lavender to magenta
  if (ratio < 0.25) return '#e8c5dd';
  if (ratio < 0.5) return '#d894c0';
  if (ratio < 0.75) return '#cd5b9a';
  return '#a4205a';
}

export function CalendarHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const max = Math.max(1, ...cells.map((c) => c.count));

  // Group into columns of 7 (weeks)
  const weeks: HeatmapCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // Compute month label positions
  const monthLabels: { idx: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, idx) => {
    const m = new Date(week[0].date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ idx, label: MONTHS[m] });
      lastMonth = m;
    }
  });

  return (
    <div className="bg-white rounded-xl card-shadow p-5">
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays className="w-4 h-4 text-bb-purple" />
        <h2 className="font-semibold text-bb-ink">Cancellation Calendar</h2>
        <span className="text-xs text-bb-ink/50">— last 12 months</span>
      </div>
      <p className="text-xs text-bb-ink/60 mb-4">
        Each square is a day. Darker = more cancellations. Spot patterns (end of month? quarterly? right after a promo?).
      </p>
      <div className="overflow-x-auto pb-2">
        <div className="inline-block">
          {/* Month labels row */}
          <div className="flex text-[10px] text-bb-ink/50 mb-1 ml-6">
            {weeks.map((_, i) => {
              const lbl = monthLabels.find((m) => m.idx === i);
              return (
                <div key={i} style={{ width: 14 }} className="text-left">
                  {lbl?.label || ''}
                </div>
              );
            })}
          </div>
          <div className="flex">
            {/* Weekday labels column */}
            <div className="flex flex-col justify-between mr-1 text-[10px] text-bb-ink/40">
              {WEEKDAYS.map((w, i) => (
                <div key={i} style={{ height: 12 }}>
                  {i % 2 === 1 ? w : ''}
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="flex gap-[2px]">
              {weeks.map((week, w) => (
                <div key={w} className="flex flex-col gap-[2px]">
                  {Array.from({ length: 7 }).map((_, d) => {
                    const cell = week[d];
                    if (!cell) return <div key={d} style={{ width: 12, height: 12 }} />;
                    return (
                      <div
                        key={d}
                        title={`${cell.date}: ${cell.count} cancellation${cell.count === 1 ? '' : 's'}`}
                        style={{ width: 12, height: 12, backgroundColor: colorFor(cell.count, max) }}
                        className="rounded-sm"
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 text-[11px] text-bb-ink/50">
        <span>Less</span>
        {[0, 0.2, 0.5, 0.8, 1].map((r, i) => (
          <span
            key={i}
            style={{ width: 12, height: 12, backgroundColor: colorFor(r * max, max) }}
            className="rounded-sm"
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
