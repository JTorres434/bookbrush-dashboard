'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff } from 'lucide-react';

const STORAGE_KEY = 'bb_live_updates';

export function LiveUpdatesToggle() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean>(true);
  const [secondsLeft, setSecondsLeft] = useState(30);

  // Hydrate preference
  useEffect(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY);
    if (stored === 'off') setEnabled(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    setSecondsLeft(30);
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          router.refresh();
          return 30;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [enabled, router]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
    }
  };

  return (
    <button
      onClick={toggle}
      className="text-sm bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md transition flex items-center gap-2"
      title={enabled ? `Auto-refreshing every 30s (next in ${secondsLeft}s)` : 'Auto-refresh paused'}
    >
      {enabled ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4 opacity-60" />}
      <span className="hidden sm:inline">
        {enabled ? `Live (${secondsLeft}s)` : 'Paused'}
      </span>
    </button>
  );
}
