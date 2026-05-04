import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Tone = 'neutral' | 'positive' | 'warn';

const toneStyles: Record<Tone, string> = {
  neutral: 'text-bb-ink',
  positive: 'text-emerald-600',
  warn: 'text-bb-magenta',
};

export type Trend = {
  deltaPct: number | null;  // null = no comparison available
  positiveIsGood?: boolean; // false for cancellations etc.
};

export function KpiCard({
  label,
  value,
  suffix = '',
  tone = 'neutral',
  hint,
  onClick,
  clickable,
  trend,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: Tone;
  hint?: string;
  onClick?: () => void;
  clickable?: boolean;
  trend?: Trend;
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
      {trend && <TrendIndicator trend={trend} />}
      {hint && <div className="mt-1 text-xs text-bb-ink/50">{hint}</div>}
    </Wrapper>
  );
}

function TrendIndicator({ trend }: { trend: Trend }) {
  if (trend.deltaPct === null) {
    return <div className="mt-2 text-xs text-bb-ink/40">— no prior data</div>;
  }
  const isUp = trend.deltaPct > 0;
  const isFlat = trend.deltaPct === 0;
  const positiveIsGood = trend.positiveIsGood ?? true;
  const color = isFlat
    ? 'text-bb-ink/50'
    : (isUp === positiveIsGood ? 'text-emerald-600' : 'text-bb-magenta');
  const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
  const sign = trend.deltaPct > 0 ? '+' : '';
  return (
    <div className={`mt-2 text-xs font-medium flex items-center gap-1 ${color}`}>
      <Icon className="w-3 h-3" />
      {sign}{trend.deltaPct}% vs last period
    </div>
  );
}
