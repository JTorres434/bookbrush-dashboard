'use client';

import { useEffect, useState } from 'react';

/**
 * Tips pulled from the official Book Brush FAQ
 * (https://bookbrush.freshdesk.com/support/solutions). Rotated to
 * give users something useful to read while the dashboard loads.
 */
const TIPS = [
  'Toggle the grid icon to bring up the Centering Tools and line up every element.',
  'The Cover Creator has built-in tips — look for the help bubble while editing.',
  'Use the Centering Tools to keep all your book templates the same size.',
  'Filters live one click away inside the background image options.',
  'Convert between ad sizes in a single step from the Custom Creator.',
  'Missing ad-size icons? Your pop-up blocker is probably hiding them.',
  'Clearing your browser cache occasionally keeps Book Brush running smoothly.',
  'Book Brush ships with a deep font library — there is one for every genre.',
  'Trash the covers you no longer need with the garbage-can icon to keep things tidy.',
  'Stuck on a password reset? Reach out to support and a human can help.',
];

export function LoadingTrivia() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      const t = setTimeout(() => {
        setIdx((x) => (x + 1) % TIPS.length);
        setVisible(true);
      }, 280);
      return () => clearTimeout(t);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md text-center px-4">
      <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-bb-purple/70 mb-2">
        Book Brush tip
      </div>
      <div
        className={`text-sm text-bb-ink/75 leading-relaxed min-h-[3rem] transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {TIPS[idx]}
      </div>
    </div>
  );
}
