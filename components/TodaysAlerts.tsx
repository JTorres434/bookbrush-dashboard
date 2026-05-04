import { AlertTriangle, Sparkles } from 'lucide-react';
import type { TodayAlert } from '@/lib/metrics';

export function TodaysAlerts({ alerts }: { alerts: TodayAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => {
        const isWarn = a.severity === 'warn';
        const Icon = isWarn ? AlertTriangle : Sparkles;
        return (
          <div
            key={i}
            className={`rounded-xl p-4 flex items-start gap-3 ${
              isWarn
                ? 'bg-bb-magenta/10 border border-bb-magenta/30'
                : 'bg-emerald-50 border border-emerald-200'
            }`}
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isWarn ? 'text-bb-magenta' : 'text-emerald-600'}`} />
            <div className="flex-1">
              <div className={`font-semibold ${isWarn ? 'text-bb-magenta-dark' : 'text-emerald-700'}`}>
                {isWarn ? "Today's Alert" : "Nice work"}
              </div>
              <div className="text-sm text-bb-ink/80 mt-0.5">{a.message}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
