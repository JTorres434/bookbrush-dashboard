import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { MaybeCountUp } from './CountUp';

type Tone = 'neutral' | 'positive' | 'warn';

const toneStyles: Record<Tone, string> = {
  neutral: 'text-bb-ink',
  positive: 'text-emerald-600',
  warn: 'text-bb-magenta',
};

const sparkColor: Record<Tone, string> = {
  neutral: '#5b1f9e',
  positive: '#059669',
  warn: '#d12a72',
};

export type Trend = {
  deltaPct: number | null;
  positiveIsGood?: boolean;
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
  sparkline,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: Tone;
  hint?: string;
  onClick?: () => void;
  clickable?: boolean;
  trend?: Trend;
  sparkline?: number[];
}) {
  const Wrapper: any = clickable ? 'button' : 'div';
  const hasSpark = !!sparkline && sparkline.some((v) => v > 0);

  return (
    <Wrapper
      onClick={onClick}
      className={`bg-white rounded-xl card-shadow p-5 text-left w-full h-full flex flex-col transition ${
        clickable ? 'hover:scale-[1.02] hover:ring-2 hover:ring-bb-purple/20 cursor-pointer' : ''
      }`}
    >
      <div className="text-sm text-bb-ink/60 font-medium flex items-center gap-1.5 min-h-[20px]">
        <span className="truncate">{label}</span>
        {clickable && (
          <span className="text-[10px] text-bb-purple/60 ml-auto whitespace-nowrap">click for details</span>
        )}
      </div>

      <div className={`mt-2 text-3xl font-bold leading-none ${toneStyles[tone]}`}>
        <MaybeCountUp value={value} />
        {suffix && <span className="text-lg ml-1 font-medium opacity-70">{suffix}</span>}
      </div>

      {/* Reserved sparkline area — keeps every card the same height even when there's no data */}
      <div className="h-[36px] mt-2">
        {hasSpark && <Sparkline data={sparkline!} color={sparkColor[tone]} />}
      </div>

      {/* Pinned to the bottom of the card */}
      <div className="mt-auto pt-2 space-y-1">
        {trend ? (
          <TrendIndicator trend={trend} />
        ) : (
          <div className="text-xs text-bb-ink/40">&nbsp;</div>
        )}
        {hint && <div className="text-xs text-bb-ink/50">{hint}</div>}
      </div>
    </Wrapper>
  );
}

function TrendIndicator({ trend }: { trend: Trend }) {
  if (trend.deltaPct === null) {
    return <div className="text-xs text-bb-ink/40">— no prior data</div>;
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
    <div className={`text-xs font-medium flex items-center gap-1 ${color}`}>
      <Icon className="w-3 h-3" />
      {sign}{trend.deltaPct}% vs last period
    </div>
  );
}
