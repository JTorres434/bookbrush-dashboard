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
}: {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-xl card-shadow p-5">
      <div className="text-sm text-bb-ink/60 font-medium">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${toneStyles[tone]}`}>
        {value}
        {suffix && <span className="text-lg ml-1 font-medium opacity-70">{suffix}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-bb-ink/50">{hint}</div>}
    </div>
  );
}
