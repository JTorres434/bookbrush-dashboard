'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { CustomersTable, type Customer } from './CustomersTable';

type Tone = 'neutral' | 'positive' | 'warn';

export type KpiCardData = {
  label: string;
  value: string | number;
  suffix?: string;
  tone?: Tone;
  hint?: string;
  customers?: Customer[];
  modalTitle?: string;
  trend?: { deltaPct: number | null; positiveIsGood?: boolean };
  sparkline?: number[];
};

export function KpiGrid({ items }: { items: KpiCardData[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    if (openIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenIdx(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openIdx]);

  useEffect(() => {
    if (openIdx !== null) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [openIdx]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {items.map((item, i) => {
          const hasList = !!item.customers && item.customers.length > 0;
          return (
            <KpiCard
              key={item.label}
              label={item.label}
              value={item.value}
              suffix={item.suffix}
              tone={item.tone}
              hint={item.hint}
              clickable={hasList}
              onClick={hasList ? () => setOpenIdx(i) : undefined}
              trend={item.trend}
              sparkline={item.sparkline}
            />
          );
        })}
      </div>

      {openIdx !== null && items[openIdx].customers && (
        <Modal
          title={items[openIdx].modalTitle || `${items[openIdx].label} (${items[openIdx].customers!.length})`}
          onClose={() => setOpenIdx(null)}
        >
          <CustomersTable customers={items[openIdx].customers!} />
        </Modal>
      )}
    </>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  // Render via portal so modal escapes any parent stacking context / transform / filter
  // that would otherwise contain `position: fixed`.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-bb-ink/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-bb-mist rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-bb-ink/10 bg-white shrink-0">
          <h2 className="text-lg font-bold text-bb-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-bb-mist text-bb-ink/60 hover:text-bb-ink"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
