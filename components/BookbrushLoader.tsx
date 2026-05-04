/**
 * BOOKBRUSH letter-by-letter loader. Each letter cycles through:
 *   appear (fade + slide up + scale) → hold → disappear → repeat.
 * Letters are staggered by 100ms so the reveal sweeps left-to-right.
 *
 * The whole word is filled with the BB gradient via background-clip: text.
 */
const LETTERS = ['B', 'O', 'O', 'K', 'B', 'R', 'U', 'S', 'H'];

export function BookbrushLoader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <div className="flex items-baseline gap-1 sm:gap-2 bb-wordmark">
        {LETTERS.map((ch, i) => (
          <span
            key={i}
            className="bb-letter inline-block text-5xl sm:text-7xl font-extrabold tracking-tight"
            style={{ animationDelay: `${i * 110}ms` }}
          >
            {ch}
          </span>
        ))}
      </div>
      {subtitle && (
        <div className="text-sm text-bb-ink/60 tracking-wider uppercase font-medium">
          {subtitle}
        </div>
      )}
    </div>
  );
}
