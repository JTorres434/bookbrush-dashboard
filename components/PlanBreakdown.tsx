'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import type { PlanSlice } from '@/lib/metrics';
import type { SheetRow } from '@/lib/sheets';
import { CustomerDetail } from './CustomerDetail';
import { Dialog, Avatar } from './Dialog';

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
    <Dialog
      icon={<PieIcon />}
      title={slice.name}
      subtitle={`${slice.value} customer${slice.value === 1 ? '' : 's'} on this plan`}
      size="sm"
      onClose={onClose}
    >
      <div className="p-3">
        <ul className="space-y-1">
          {slice.customers.map((c) => (
            <li key={c.email}>
              <button
                onClick={() => onPickCustomer(c.email)}
                className="w-full text-left p-3 rounded-lg bg-white hover:shadow-md hover:scale-[1.005] transition flex items-center gap-3"
              >
                <Avatar name={c.name} size="sm" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-bb-ink truncate">{c.name}</div>
                  <div className="text-xs text-bb-ink/60 truncate">{c.email}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}

function PieIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
