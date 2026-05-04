'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import type { PlanSlice } from '@/lib/metrics';
import type { SheetRow } from '@/lib/sheets';
import { CustomerDetail } from './CustomerDetail';

const COLORS: Record<string, string> = {
  Plus: '#8a4cd0',
  Gold: '#d12a72',
  Platinum: '#3e1671',
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload as PlanSlice;
  if (!data || data.value === 0) return null;
  const customers = data.customers || [];
  const top = customers.slice(0, 8);
  const more = customers.length - top.length;
  return (
    <div className="bg-white rounded-lg shadow-xl border border-bb-ink/10 p-3 max-w-xs text-xs">
      <div className="font-semibold text-bb-ink mb-2">
        {data.name} <span className="text-bb-ink/50 font-normal">· {data.value} customer{data.value === 1 ? '' : 's'}</span>
      </div>
      <ul className="space-y-1 max-h-48 overflow-y-auto">
        {top.map((c) => (
          <li key={c.email} className="flex items-baseline justify-between gap-2">
            <span className="text-bb-ink truncate">{c.name}</span>
            <span className="text-bb-ink/40 truncate text-[10px]">{c.email}</span>
          </li>
        ))}
      </ul>
      {more > 0 && <div className="text-bb-ink/40 mt-2">+{more} more</div>}
      <div className="text-[10px] text-bb-ink/40 mt-2 italic">click a slice to open the customer list</div>
    </div>
  );
}

export function PlanBreakdown({
  title, data, ac, fc, fp, resub,
}: {
  title: string;
  data: PlanSlice[];
  ac: SheetRow[]; fc: SheetRow[]; fp: SheetRow[]; resub: SheetRow[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const [openEmail, setOpenEmail] = useState<string | null>(null);
  const [activeSlice, setActiveSlice] = useState<PlanSlice | null>(null);

  return (
    <div className="bg-white rounded-xl card-shadow p-5 h-80">
      <h2 className="font-semibold mb-3 text-bb-ink">{title}</h2>
      {total === 0 ? (
        <div className="h-full flex items-center justify-center text-bb-ink/40 text-sm">
          No data in range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
              onClick={(d: any) => {
                if (d?.payload?.value > 0) setActiveSlice(d.payload as PlanSlice);
              }}
              cursor="pointer"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={COLORS[d.name] || '#cccccc'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}

      {activeSlice && (
        <SliceCustomerList
          slice={activeSlice}
          onClose={() => setActiveSlice(null)}
          onPickCustomer={(email) => {
            setActiveSlice(null);
            setOpenEmail(email);
          }}
        />
      )}

      {openEmail && (
        <CustomerDetail
          email={openEmail}
          ac={ac}
          fc={fc}
          fp={fp}
          resub={resub}
          onClose={() => setOpenEmail(null)}
        />
      )}
    </div>
  );
}

function SliceCustomerList({
  slice, onClose, onPickCustomer,
}: {
  slice: PlanSlice;
  onClose: () => void;
  onPickCustomer: (email: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[105] bg-bb-ink/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-bb-ink/10 flex items-center justify-between">
          <h3 className="font-semibold text-bb-ink">
            {slice.name} <span className="text-bb-ink/50 font-normal text-sm">· {slice.value} customer{slice.value === 1 ? '' : 's'}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-sm text-bb-ink/50 hover:text-bb-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <ul className="overflow-y-auto p-2">
          {slice.customers.map((c) => (
            <li key={c.email}>
              <button
                onClick={() => onPickCustomer(c.email)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-bb-mist transition"
              >
                <div className="text-sm font-medium text-bb-ink">{c.name}</div>
                <div className="text-xs text-bb-ink/60">{c.email}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
