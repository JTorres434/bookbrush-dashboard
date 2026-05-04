'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const EXIT_MS = 220;

export function Dialog({
  title,
  subtitle,
  icon,
  stats,
  children,
  onClose,
  size = 'md',
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  stats?: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => setMounted(true), []);

  const close = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onClose, EXIT_MS);
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  const maxW = { sm: 'max-w-md', md: 'max-w-3xl', lg: 'max-w-6xl' }[size];
  const leavingCls = leaving ? 'leaving' : '';

  return createPortal(
    <div
      className={`fixed inset-0 z-[110] bg-bb-ink/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 bb-dialog-backdrop ${leavingCls}`}
      onClick={close}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl ${maxW} w-full max-h-[90vh] flex flex-col overflow-hidden relative bb-dialog-card ${leavingCls}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient accent stripe */}
        <div className="h-1 bg-bb-gradient shrink-0" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-bb-ink/10 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {icon && (
                <div className="w-10 h-10 rounded-xl bg-bb-gradient flex items-center justify-center text-white shrink-0 shadow-md">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-bb-ink leading-tight">{title}</h2>
                {subtitle && <div className="text-sm text-bb-ink/60 mt-0.5">{subtitle}</div>}
              </div>
            </div>
            <button
              onClick={close}
              className="rounded-md p-1.5 hover:bg-bb-mist text-bb-ink/60 hover:text-bb-ink shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {stats && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stats}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-bb-mist/50">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function DialogStat({
  label, value, tone = 'neutral',
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'neutral' | 'positive' | 'warn' | 'accent';
}) {
  const colors = {
    neutral: 'text-bb-ink',
    positive: 'text-emerald-600',
    warn: 'text-bb-magenta',
    accent: 'text-bb-purple',
  }[tone];
  return (
    <div className="bg-bb-mist rounded-lg p-2.5">
      <div className="text-[10px] font-semibold text-bb-ink/50 uppercase tracking-wide">{label}</div>
      <div className={`text-base font-bold ${colors} mt-0.5`}>{value}</div>
    </div>
  );
}

// Avatar circle from a name/email — deterministic color based on string hash
const AVATAR_COLORS = [
  'bg-bb-purple', 'bg-bb-magenta', 'bg-bb-purple-light',
  'bg-bb-purple-dark', 'bg-amber-500', 'bg-emerald-500',
  'bg-rose-500', 'bg-indigo-500', 'bg-pink-500', 'bg-cyan-600',
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?';
  const color = AVATAR_COLORS[hashString(name) % AVATAR_COLORS.length];
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sz} ${color} rounded-full text-white font-semibold flex items-center justify-center shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  const lower = (plan || '').toLowerCase();
  const cls = lower.includes('platinum') ? 'bg-bb-purple-dark text-white'
    : lower.includes('gold') ? 'bg-bb-magenta text-white'
    : lower.includes('plus') ? 'bg-bb-purple-light text-white'
    : 'bg-bb-ink/10 text-bb-ink/60';
  if (!plan) return <span className="text-bb-ink/30">—</span>;
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${cls}`}>
      {plan}
    </span>
  );
}
