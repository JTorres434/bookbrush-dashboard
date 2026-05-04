'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';

const PRESETS = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Year to date'];

export function DateRangePicker() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get('range') || 'Last 30 days';

  return (
    <div className="bg-white rounded-xl card-shadow p-3 inline-flex items-center gap-2 flex-wrap">
      <Calendar className="w-4 h-4 text-bb-ink/60 ml-1" />
      {PRESETS.map((preset) => {
        const active = preset === current;
        return (
          <button
            key={preset}
            onClick={() => {
              const next = new URLSearchParams(params.toString());
              next.set('range', preset);
              router.push(`/?${next.toString()}`);
            }}
            className={`text-sm px-3 py-1.5 rounded-md transition ${
              active
                ? 'bg-bb-gradient text-white font-medium'
                : 'text-bb-ink/70 hover:bg-bb-mist'
            }`}
          >
            {preset}
          </button>
        );
      })}
    </div>
  );
}
