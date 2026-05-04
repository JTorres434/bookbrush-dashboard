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

function OpeningBook() {
  return (
    <div className="bb-book" aria-hidden>
      <div className="bb-book-pages-edge" />
      <div className="bb-book-body" />
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
