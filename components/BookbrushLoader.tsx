import { LoadingTrivia } from './LoadingTrivia';

/**
 * BOOKBRUSH letter-by-letter loader.
 * Each letter has its own gradient slice (so the spectrum reads B→H from
 * deep purple to magenta-pink), bounces in with a back-ease, holds, then
 * lifts off. A brush stroke SVG sweeps left-to-right beneath them, painting
 * the wordmark — a wink at "Book Brush".
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

export function BookbrushLoader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <div className="relative inline-block">
        <div className="flex items-baseline gap-1 sm:gap-2 px-2">
          {LETTERS.map((l, i) => (
            <span
              key={i}
              className="bb-letter inline-block text-6xl sm:text-8xl font-extrabold tracking-tight"
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
        {/* Brush stroke painting the wordmark left-to-right */}
        <svg
          className="absolute left-0 right-0 -bottom-1 sm:-bottom-2 w-full h-3 sm:h-4 pointer-events-none"
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
        <div className="text-xs sm:text-sm text-bb-ink/60 tracking-[0.25em] uppercase font-semibold">
          {subtitle}
        </div>
      )}
      <LoadingTrivia />
    </div>
  );
}
