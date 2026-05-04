'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 → target over `duration` ms using requestAnimationFrame.
 * Falls back to instant render for prefers-reduced-motion.
 */
export function CountUp({
  value,
  duration = 900,
  prefix = '',
  suffix = '',
  formatter,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (n: number) => string;
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(value);
      return;
    }
    fromRef.current = display;
    startRef.current = null;
    let raf = 0;
    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      const next = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(next);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const isInt = Number.isInteger(value);
  const text = formatter
    ? formatter(display)
    : isInt
    ? Math.round(display).toLocaleString()
    : display.toFixed(1);

  return (
    <span className="tabular-nums">
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

/**
 * Renders the value as a CountUp if it's numeric, otherwise as plain text.
 * Handles "+12" style strings by stripping the leading sign and re-applying it.
 */
export function MaybeCountUp({ value }: { value: string | number }) {
  if (typeof value === 'number') {
    return <CountUp value={value} />;
  }
  // Strings like "+5" or "-3" or "92"
  const trimmed = value.trim();
  const m = /^([+-]?)(\d+(?:\.\d+)?)$/.exec(trimmed);
  if (m) {
    const sign = m[1] === '+' ? '+' : '';
    const num = parseFloat(m[1] === '-' ? `-${m[2]}` : m[2]);
    return <CountUp value={num} prefix={sign && num >= 0 ? sign : ''} />;
  }
  return <span>{value}</span>;
}
