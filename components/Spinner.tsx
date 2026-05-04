'use client';

import * as React from 'react';

const SIZE_PX = { xs: 12, sm: 16, md: 24, lg: 40, xl: 64 } as const;
type Size = keyof typeof SIZE_PX;

/**
 * Branded gradient spinner — a conic-gradient ring (purple → magenta) that rotates.
 * Uses a radial mask to cut out the center, giving a clean arc effect.
 */
export function BBSpinner({
  size = 'sm',
  className = '',
}: { size?: Size; className?: string }) {
  const px = SIZE_PX[size];
  const ringWidth = Math.max(2, Math.round(px / 8));
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block bb-spinner ${className}`}
      style={
        {
          width: px,
          height: px,
          ['--bb-ring' as any]: `${ringWidth}px`,
        } as React.CSSProperties
      }
    />
  );
}

/**
 * Three pulsing dots in the BB gradient — playful, low-noise loading indicator.
 */
export function BBDots({ className = '' }: { className?: string }) {
  return (
    <span role="status" aria-label="Loading" className={`bb-dots ${className}`}>
      <span /><span /><span />
    </span>
  );
}

/**
 * Animated shimmer block for skeleton placeholders. Fills its parent.
 */
export function BBSkeleton({
  className = '',
  rounded = 'rounded-lg',
}: { className?: string; rounded?: string }) {
  return <div className={`bb-shimmer ${rounded} ${className}`} aria-hidden />;
}

/**
 * Full-section centered loader with logo-style gradient halo.
 * Use for Suspense fallbacks on substantial sections.
 */
export function BBSectionLoader({
  label = 'Loading…',
  className = '',
}: { label?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 gap-3 ${className}`}>
      <div className="relative">
        <span className="absolute inset-0 rounded-full bb-halo" aria-hidden />
        <BBSpinner size="lg" />
      </div>
      <div className="text-xs text-bb-ink/50 font-medium tracking-wide uppercase">
        {label}
      </div>
    </div>
  );
}

/**
 * Full-page loader used by app/loading.tsx during route transitions.
 * Shows the BB logo over a soft animated gradient backdrop.
 */
export function BBPageLoader({
  label = 'Refreshing data…',
}: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bb-loader-bg">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl card-shadow px-8 py-10 flex flex-col items-center gap-5 min-w-[260px]">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bb-halo" aria-hidden />
          <BBSpinner size="xl" />
        </div>
        <div className="text-center">
          <div className="text-bb-ink font-semibold">{label}</div>
          <BBDots className="mt-2 justify-center" />
        </div>
      </div>
    </div>
  );
}
