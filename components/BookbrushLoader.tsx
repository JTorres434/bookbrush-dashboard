import { LoadingTrivia } from './LoadingTrivia';

/**
 * Loader: a 3D book opens, three pages flip, then it closes — looped.
 * Below sits the smaller BOOKBRUSH wordmark with the brush-stroke wink,
 * a subtitle, and a rotating Book Brush FAQ tip.
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

function CoverArt() {
  return (
    <svg
      viewBox="0 0 40 60"
      className="w-7 h-10 sm:w-8 sm:h-12"
      aria-hidden
    >
      {/* Decorative top frame line */}
      <line x1="8" y1="6" x2="32" y2="6" stroke="rgba(255,255,255,0.45)" strokeWidth="0.6" />
      {/* Brush handle */}
      <rect x="17" y="10" width="6" height="20" rx="2.5" fill="rgba(255,255,255,0.55)" />
      <rect x="18.5" y="10" width="1" height="20" rx="0.5" fill="rgba(255,255,255,0.85)" />
      {/* Ferrule */}
      <rect x="14" y="29" width="12" height="3.5" fill="rgba(255,255,255,0.95)" rx="0.5" />
      {/* Bristles */}
      <path d="M 12 32.5 L 28 32.5 L 24.5 49 L 15.5 49 Z" fill="rgba(255,255,255,0.96)" />
      <line x1="15" y1="34" x2="15" y2="48" stroke="rgba(91,31,158,0.35)" strokeWidth="0.4" />
      <line x1="18" y1="34" x2="18" y2="49" stroke="rgba(91,31,158,0.35)" strokeWidth="0.4" />
      <line x1="22" y1="34" x2="22" y2="49" stroke="rgba(91,31,158,0.35)" strokeWidth="0.4" />
      <line x1="25" y1="34" x2="25" y2="48" stroke="rgba(91,31,158,0.35)" strokeWidth="0.4" />
      {/* Paint stroke at the bottom */}
      <path
        d="M 6 55 Q 20 50 34 55"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Decorative bottom frame line */}
      <line x1="8" y1="58" x2="32" y2="58" stroke="rgba(255,255,255,0.45)" strokeWidth="0.6" />
    </svg>
  );
}

function OpeningBook() {
  return (
    <div className="bb-book" aria-hidden>
      <div className="bb-book-spine" />
      <div className="bb-book-page" style={{ animationDelay: '0.2s' }} />
      <div className="bb-book-page" style={{ animationDelay: '0.55s' }} />
      <div className="bb-book-page" style={{ animationDelay: '0.9s' }} />
      <div className="bb-book-cover front-left">
        <CoverArt />
      </div>
      <div className="bb-book-cover front-right">
        <CoverArt />
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
