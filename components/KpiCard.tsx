type Tone = 'neutral' | 'positive' | 'warn';

const toneStyles: Record<Tone, string> = {
  neutral: 'text-bb-ink',
  positive: 'text-emerald-600',
  warn: 'text-bb-magenta',
};

export function KpiCard({
  label,
  value,
  suffix = '',
  tone = 'neutral',
  hint,
  onClick,
  clickable,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: Tone;
  hint?: string;
  onClick?: () => void;
  clickable?: boolean;
}) {
  const Wrapper: any = clickable ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`bg-white rounded-xl card-shadow p-5 text-left w-full transition ${
        clickable ? 'hover:scale-[1.02] hover:ring-2 hover:ring-bb-purple/20 cursor-pointer' : ''
      }`}
    >
      <div className="text-sm text-bb-ink/60 font-medium flex items-center gap-1.5">
        {label}
        {clickable && (
          <span className="text-[10px] text-bb-purple/60 ml-auto">click for details</span>
        )}
      </div>
      <div className={`mt-2 text-3xl font-bold ${toneStyles[tone]}`}>
        {value}
        {suffix && <span className="text-lg ml-1 font-medium opacity-70">{suffix}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-bb-ink/50">{hint}</div>}
    </Wrapper>
  );
}
