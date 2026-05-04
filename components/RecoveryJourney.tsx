import { Filter } from 'lucide-react';
import type { RecoveryStage } from '@/lib/metrics';

const COLORS = ['#5b1f9e', '#8a4cd0', '#d12a72', '#059669'];

export function RecoveryJourney({ stages }: { stages: RecoveryStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <div className="bg-white rounded-xl card-shadow p-5">
      <div className="flex items-center gap-2 mb-1">
        <Filter className="w-4 h-4 text-bb-purple" />
        <h2 className="font-semibold text-bb-ink">Recovery Journey</h2>
        <span className="text-xs text-bb-ink/50">— how the win-back pipeline performs</span>
      </div>
      <p className="text-xs text-bb-ink/60 mb-4">
        From cancellation to a customer coming back. Each step shows how many people made it through, plus the % that converted from the previous step.
      </p>
      <ul className="space-y-3">
        {stages.map((s, i) => {
          const pct = (s.count / max) * 100;
          const conv =
            i === 0 || stages[i - 1].count === 0
              ? null
              : Math.round((s.count / stages[i - 1].count) * 100);
          return (
            <li key={s.label}>
              <div className="flex items-baseline justify-between text-sm">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="font-medium text-bb-ink">{s.label}</span>
                  <span className="text-xs text-bb-ink/50 truncate">{s.description}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {conv !== null && (
                    <span
                      className={`text-xs font-medium ${
                        conv >= 50 ? 'text-emerald-600' : conv >= 20 ? 'text-amber-600' : 'text-bb-magenta'
                      }`}
                    >
                      {conv}% from previous
                    </span>
                  )}
                  <span className="text-lg font-bold text-bb-ink tabular-nums">{s.count}</span>
                </div>
              </div>
              <div className="mt-1.5 h-2 bg-bb-mist rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: COLORS[i % COLORS.length],
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
