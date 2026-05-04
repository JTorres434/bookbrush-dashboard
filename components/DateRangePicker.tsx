'use client';

import { useTransition, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { BBSpinner } from './Spinner';
import { TopProgressBar } from './TopProgressBar';
import { BookbrushLoader } from './BookbrushLoader';

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
    <>
      {isPending && <TopProgressBar />}
      {isPending && <FilterLoadingOverlay />}
    <div className="bg-white rounded-xl card-shadow p-3 inline-flex items-center gap-2 flex-wrap relative">
      {isPending ? (
        <BBSpinner size="sm" className="ml-1" />
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
            } ${isLoading ? 'bb-pill-loading' : ''} ${
              isPending && !active ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading && <BBSpinner size="xs" className="text-white" />}
            {preset}
          </button>
        );
      })}
    </div>
    </>
  );
}

/**
 * Fixed-screen BOOKBRUSH overlay shown while a date-filter transition is in
 * flight. Rendered into a portal so it floats above all dashboard content.
 * Fades in via the same dialog-backdrop keyframe.
 */
function FilterLoadingOverlay() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bb-loader-bg bb-dialog-backdrop">
      <BookbrushLoader subtitle="updating your range" />
    </div>,
    document.body,
  );
}
