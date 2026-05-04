'use client';

import { useEffect, useState } from 'react';
import { Heart, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BBSpinner, BBSkeleton } from './Spinner';

type WorkflowStatus = {
  id: string;
  name: string;
  active: boolean;
  lastExecutedAt: string | null;
  lastStatus: string | null;
};

type ApiResp = {
  configured: boolean;
  message?: string;
  workflows: WorkflowStatus[];
};

function relTime(iso: string | null): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day >= 1) return `${day}d ago`;
  if (hr >= 1) return `${hr}h ago`;
  if (min >= 1) return `${min}m ago`;
  return 'just now';
}

// Health classification per workflow.
// "Real-time" workflows can sit idle a long time legitimately (no Stripe events).
// Scheduled workflows should run at known cadence.
type HealthRule = {
  realtime?: boolean;
  expectedHours?: number;  // alert if no run within this many hours
};

const HEALTH_RULES: Record<string, HealthRule> = {
  '84o8Crr9to5Hy3hI': { realtime: true },                 // Cancellations Tracker
  'X0iiGY3Ki7HUK2LX': { realtime: true },                 // Resubscriptions Tracker
  'foFSwEzCLwW6beRC': { expectedHours: 25 },              // Daily 9am
  'lWwCsKD9ERRYJFBg': { expectedHours: 25 },              // Daily 6am
  'CoqzqmWiH7Vi7Qoq': { expectedHours: 25 },              // Daily 8am
  '9B5my6hGRah7Tkok':  { expectedHours: 24 * 8 },         // Weekly Monday 5am — give 8 days slack
};

function healthFor(w: WorkflowStatus): { tone: 'good' | 'warn' | 'bad'; reason: string } {
  if (!w.active) return { tone: 'bad', reason: 'turned off' };
  const rule = HEALTH_RULES[w.id] || {};
  if (w.lastStatus === 'error') return { tone: 'bad', reason: 'last run errored' };
  if (rule.realtime) {
    return { tone: 'good', reason: 'on standby — fires when Stripe sends events' };
  }
  if (!w.lastExecutedAt) return { tone: 'warn', reason: 'has not run yet' };
  if (rule.expectedHours) {
    const hoursAgo = (Date.now() - new Date(w.lastExecutedAt).getTime()) / 3600000;
    if (hoursAgo > rule.expectedHours) {
      return { tone: 'bad', reason: 'has not run on schedule' };
    }
  }
  return { tone: 'good', reason: 'running on schedule' };
}

export function SystemStatus() {
  const [data, setData] = useState<ApiResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/system-status');
        const json = (await res.json()) as ApiResp;
        if (mounted) {
          setData(json);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(e.message || 'failed to load');
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="bg-white rounded-xl card-shadow p-5">
      <div className="flex items-center gap-2 mb-1">
        <Heart className="w-4 h-4 text-bb-purple" />
        <h2 className="font-semibold text-bb-ink">System Status</h2>
        <span className="text-xs text-bb-ink/50">— is the automation healthy?</span>
      </div>

      {error && (
        <div className="text-sm text-bb-magenta py-2">{error}</div>
      )}

      {!data && !error && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-bb-ink/50">
            <BBSpinner size="xs" />
            <span>Checking workflow health…</span>
          </div>
          <BBSkeleton className="h-9 w-full" />
          <BBSkeleton className="h-9 w-full" />
          <BBSkeleton className="h-9 w-3/4" />
        </div>
      )}

      {data && !data.configured && (
        <div className="text-xs text-bb-ink/70 mt-3 p-3 rounded-md bg-bb-mist/60 flex items-start gap-2">
          <span className="bb-live-dot inline-block w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
          <div>
            <div className="font-medium text-bb-ink">JC is hooking this up.</div>
            <div className="text-bb-ink/60 mt-0.5">Live workflow health will land here shortly.</div>
          </div>
        </div>
      )}

      {data?.configured && (
        <ul className="space-y-2 mt-3">
          {data.workflows.map((w) => {
            const h = healthFor(w);
            const Icon = h.tone === 'good' ? CheckCircle2 : AlertTriangle;
            const color =
              h.tone === 'good' ? 'text-emerald-600' :
              h.tone === 'warn' ? 'text-amber-600' : 'text-bb-magenta';
            return (
              <li key={w.id} className="flex items-center gap-3 text-sm">
                <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-bb-ink">{w.name}</div>
                  <div className="text-xs text-bb-ink/60">{h.reason}</div>
                </div>
                <div className="text-xs text-bb-ink/50 shrink-0 whitespace-nowrap">
                  {w.lastExecutedAt ? relTime(w.lastExecutedAt) : '—'}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
