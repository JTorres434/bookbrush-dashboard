'use client';

import { useEffect, useState } from 'react';
import { LoadingTrivia } from './LoadingTrivia';

/**
 * Loader: a 3D book opens, three pages flip, then it closes — looped.
 * Below sits the smaller BOOKBRUSH wordmark with the brush-stroke wink,
 * a subtitle, and a rotating Book Brush FAQ tip.
 *
 * The book content advances per cycle (Chapter One, p. 1 → Chapter Two, p. 12 → ...)
 * so it doesn't feel like the same page is just sitting there.
 */
const LETTERS = [
  { ch: 'B', from: '#3e1671', to: '#5b1f9e' },
  { ch: 'O', from: '#5b1f9e', to: '#6e2bb0' },
  { ch: 'O', from: '#6e2bb0', to: '#8a4cd0' },
  { ch: 'K', from: '#8a4cd0', to: '#a040b8' },
  { ch: 'B', from: '#a040b8', to: '#b8369a' },
  { ch: 'R', from: '#b8369a', to: '#c92e80' },
  { ch: 'U', from: '#c92e80', to: '#d12a72' },
  { ch: 'S', from: '#d12a72', to: '#de366f' },
  { ch: 'H', from: '#de366f', to: '#e93e6e' },
];

const CHAPTERS = [
  { name: 'One',    page: 1   },
  { name: 'Two',    page: 12  },
  { name: 'Three',  page: 27  },
  { name: 'Four',   page: 41  },
  { name: 'Five',   page: 58  },
  { name: 'Six',    page: 73  },
  { name: 'Seven',  page: 89  },
  { name: 'Eight',  page: 102 },
  { name: 'Nine',   page: 118 },
  { name: 'Ten',    page: 134 },
];

// Three different prose patterns so each chapter doesn't look identical.
const PROSE_VARIANTS: number[][] = [
  [95, 92, 88, 90, 94, 72, 0, 96, 85, 92, 80, 88, 50, 0, 93, 90, 87, 95, 68],
  [88, 96, 84, 92, 78, 90, 64, 0, 95, 89, 92, 86, 70, 0, 93, 91, 87, 80, 55],
  [92, 86, 95, 89, 83, 70, 0, 90, 95, 88, 92, 82, 60, 0, 96, 89, 84, 90, 75],
];

function BookPageContent({ chapterIdx }: { chapterIdx: number }) {
  const ch = CHAPTERS[chapterIdx % CHAPTERS.length];
  const widths = PROSE_VARIANTS[chapterIdx % PROSE_VARIANTS.length];
  return (
    <div className="bb-book-page-content" aria-hidden>
      <div className="bb-book-chapter">Chapter {ch.name}</div>
      {widths.map((w, i) =>
        w === 0 ? (
          <div key={i} className="bb-book-para-gap" />
        ) : (
          <div key={i} className="bb-book-line" style={{ width: `${w}%` }} />
        ),
      )}
      <div className="bb-book-page-number">— {ch.page} —</div>
    </div>
  );
}

function OpeningBook() {
  const [chapterIdx, setChapterIdx] = useState(0);

  useEffect(() => {
    // The book-cover/page animations run on a 4s loop; advance the chapter
    // each cycle so the book reads like progressive chapters, not a stuck page.
    const id = setInterval(() => {
      setChapterIdx((x) => (x + 1) % CHAPTERS.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bb-book" aria-hidden>
      <div className="bb-book-pages-edge" />
      <div className="bb-book-body">
        <BookPageContent chapterIdx={chapterIdx} />
      </div>
      <div className="bb-book-page" style={{ animationDelay: '0.4s' }} />
      <div className="bb-book-page" style={{ animationDelay: '0.85s' }} />
      <div className="bb-book-page" style={{ animationDelay: '1.3s' }} />
      <div className="bb-book-front">
        {/* Real Book Brush logo (white variant) on the front cover */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://bookbrush.com/custom-code/images/logo/logo-main-white-2.png"
          alt=""
          loading="eager"
          draggable={false}
        />
      </div>
    </div>
  );
}

export function BookbrushLoader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <OpeningBook />

      <div className="flex flex-col items-center gap-2">
        <div className="relative inline-block">
          <div className="flex items-baseline gap-0.5 sm:gap-1 px-1">
            {LETTERS.map((l, i) => (
              <span
                key={i}
                className="bb-letter inline-block text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={
                  {
                    animationDelay: `${i * 80}ms`,
                    ['--bb-from' as any]: l.from,
                    ['--bb-to' as any]: l.to,
                  } as React.CSSProperties
                }
              >
                {l.ch}
              </span>
            ))}
          </div>
          <svg
            className="absolute left-0 right-0 -bottom-0.5 w-full h-1.5 pointer-events-none"
            viewBox="0 0 600 24"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="bb-brush-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#5b1f9e" />
                <stop offset="50%" stopColor="#8a4cd0" />
                <stop offset="100%" stopColor="#d12a72" />
              </linearGradient>
            </defs>
            <path
              d="M 6 14 Q 80 4, 160 12 T 320 10 T 480 14 T 594 10"
              stroke="url(#bb-brush-grad)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              className="bb-brush-stroke"
            />
          </svg>
        </div>

        {subtitle && (
          <div className="text-[10px] sm:text-xs text-bb-ink/60 tracking-[0.3em] uppercase font-semibold">
            {subtitle}
          </div>
        )}
      </div>

      <LoadingTrivia />
    </div>
  );
}
