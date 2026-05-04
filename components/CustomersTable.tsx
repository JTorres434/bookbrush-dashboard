'use client';

import { useMemo, useState } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  plan: string;
  pricing: string;
  dateLabel: string;
  dateValue: number; // unix ms for sorting; 0 if missing
  tag: string;
  source: 'Already Cancelled' | 'Future Cancellation' | 'Failed Payments' | 'Resubscriptions';
};

type SortKey = 'name' | 'plan' | 'pricing' | 'date' | 'source';
type SortDir = 'asc' | 'desc';

const SOURCE_BADGE: Record<Customer['source'], string> = {
  'Already Cancelled':  'bg-bb-magenta/15 text-bb-magenta-dark',
  'Future Cancellation': 'bg-amber-100 text-amber-800',
  'Failed Payments':    'bg-red-100 text-red-700',
  'Resubscriptions':    'bg-emerald-100 text-emerald-700',
};

function planBadgeClass(plan: string) {
  const p = plan.toLowerCase();
  if (p.includes('platinum')) return 'bg-bb-purple-dark text-white';
  if (p.includes('gold'))     return 'bg-bb-magenta text-white';
  if (p.includes('plus'))     return 'bg-bb-purple-light text-white';
  return 'bg-bb-ink/10 text-bb-ink/60';
}

const SOURCE_FILTERS: ('All' | Customer['source'])[] = [
  'All',
  'Already Cancelled',
  'Future Cancellation',
  'Failed Payments',
  'Resubscriptions',
];

export function CustomersTable({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [sourceFilter, setSourceFilter] = useState<typeof SOURCE_FILTERS[number]>('All');
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (sourceFilter !== 'All' && c.source !== sourceFilter) return false;
      if (!q) return true;
      const hay = `${c.firstName} ${c.lastName} ${c.email} ${c.plan}`.toLowerCase();
      return hay.includes(q);
    });
  }, [customers, search, sourceFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case 'name':    av = `${a.firstName} ${a.lastName}`; bv = `${b.firstName} ${b.lastName}`; break;
        case 'plan':    av = a.plan; bv = b.plan; break;
        case 'pricing': av = parseFloat(a.pricing) || 0; bv = parseFloat(b.pricing) || 0; break;
        case 'date':    av = a.dateValue; bv = b.dateValue; break;
        case 'source':  av = a.source; bv = b.source; break;
      }
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const visible = sorted.slice(0, pageSize);

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (k !== sortKey) return <ArrowUpDown className="w-3 h-3 inline-block opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 inline-block" />
      : <ArrowDown className="w-3 h-3 inline-block" />;
  };

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Plan', 'Pricing', 'Date', 'Source', 'Tag'];
    const rows = sorted.map((c) => [
      `${c.firstName} ${c.lastName}`.trim(),
      c.email,
      c.plan,
      c.pricing,
      c.dateLabel,
      c.source,
      c.tag,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookbrush-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl card-shadow p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="font-semibold text-bb-ink">Customers</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-bb-ink/40" />
            <input
              type="search"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm border border-bb-ink/15 rounded-md pl-9 pr-3 py-1.5 w-64 focus:outline-none focus:ring-2 focus:ring-bb-purple"
            />
          </div>
          <button
            onClick={exportCsv}
            className="text-sm px-3 py-1.5 rounded-md border border-bb-ink/15 hover:bg-bb-mist text-bb-ink/80"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Source filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SOURCE_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setSourceFilter(s)}
            className={`text-xs px-3 py-1 rounded-full transition ${
              sourceFilter === s
                ? 'bg-bb-gradient text-white'
                : 'bg-bb-ink/5 text-bb-ink/70 hover:bg-bb-mist'
            }`}
          >
            {s}{' '}
            <span className="opacity-70">
              ({s === 'All' ? customers.length : customers.filter((c) => c.source === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-bb-ink/60 border-b border-bb-ink/10">
              <th className="py-2 pr-4 font-medium cursor-pointer select-none" onClick={() => onSort('name')}>
                Name <SortIcon k="name" />
              </th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium cursor-pointer select-none" onClick={() => onSort('plan')}>
                Plan <SortIcon k="plan" />
              </th>
              <th className="py-2 pr-4 font-medium cursor-pointer select-none" onClick={() => onSort('pricing')}>
                Pricing <SortIcon k="pricing" />
              </th>
              <th className="py-2 pr-4 font-medium cursor-pointer select-none" onClick={() => onSort('date')}>
                Date <SortIcon k="date" />
              </th>
              <th className="py-2 pr-4 font-medium cursor-pointer select-none" onClick={() => onSort('source')}>
                Source <SortIcon k="source" />
              </th>
              <th className="py-2 pr-4 font-medium">Tag</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-bb-ink/40">
                  No customers match these filters
                </td>
              </tr>
            ) : (
              visible.map((c, i) => {
                const fullName = `${c.firstName} ${c.lastName}`.trim() || '—';
                return (
                  <tr key={`${c.email}-${i}`} className="border-b border-bb-ink/5 hover:bg-bb-mist/50">
                    <td className="py-2 pr-4 font-medium text-bb-ink">{fullName}</td>
                    <td className="py-2 pr-4 text-bb-ink/70">{c.email}</td>
                    <td className="py-2 pr-4">
                      {c.plan ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${planBadgeClass(c.plan)}`}>
                          {c.plan}
                        </span>
                      ) : (
                        <span className="text-bb-ink/30">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-bb-ink/80 tabular-nums">
                      {c.pricing && parseFloat(c.pricing) > 0 ? `$${parseFloat(c.pricing).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2 pr-4 text-bb-ink/70">{c.dateLabel || '—'}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded ${SOURCE_BADGE[c.source]}`}>
                        {c.source}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-xs text-bb-ink/60">{c.tag || '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <div className="mt-4 flex items-center justify-between text-sm text-bb-ink/60">
          <span>Showing {visible.length} of {sorted.length}</span>
          <button
            onClick={() => setPageSize((p) => p + 50)}
            className="text-bb-purple hover:underline"
          >
            Show more
          </button>
        </div>
      )}
    </div>
  );
}
