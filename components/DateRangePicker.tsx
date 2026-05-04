'use client';

import { useTransition, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Loader2 } from 'lucide-react';

const PRESETS = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Year to date'];

export function DateRangePicker() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get('range') || 'Last 30 days';
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<string | null>(null);

  const displayActive = optimistic || current;

  const onPick = (preset: string) => {
    if (preset === current) return;
    setOptimistic(preset);
    const next = new URLSearchParams(params.toString());
    next.set('range', preset);
    startTransition(() => {
      router.push(`/?${next.toString()}`);
    });
  };

  // Reset optimistic once URL catches up (component re-renders with new searchParams)
  if (optimistic && optimistic === current && !isPending) {
    // Schedule reset for next tick
    queueMicrotask(() => setOptimistic(null));
  }

  return (
    <div className="bg-white rounded-xl card-shadow p-3 inline-flex items-center gap-2 flex-wrap relative">
      {isPending ? (
        <Loader2 className="w-4 h-4 text-bb-purple ml-1 animate-spin" />
      ) : (
        <Calendar className="w-4 h-4 text-bb-ink/60 ml-1" />
      )}
      {PRESETS.map((preset) => {
        const active = preset === displayActive;
        const isLoading = isPending && preset === optimistic;
        return (
          <button
            key={preset}
            onClick={() => onPick(preset)}
            disabled={isPending}
            className={`text-sm px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
              active
                ? 'bg-bb-gradient text-white font-medium'
                : 'text-bb-ink/70 hover:bg-bb-mist'
            } ${isPending && !active ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {preset}
          </button>
        );
      })}
    </div>
  );
}
