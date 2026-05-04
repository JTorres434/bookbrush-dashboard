'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { CustomerDetail } from './CustomerDetail';
import type { SheetRow } from '@/lib/sheets';
import { isStandardPlan } from '@/lib/sheets';

type IndexEntry = {
  email: string;
  name: string;
  plan: string;
  source: string;
};

function buildIndex(opts: { ac: SheetRow[]; fc: SheetRow[]; fp: SheetRow[]; resub: SheetRow[] }): IndexEntry[] {
  const seen = new Map<string, IndexEntry>();
  const add = (rows: SheetRow[], source: string) => {
    for (const r of rows) {
      const email = (r['Email'] || '').trim();
      if (!email) continue;
      const key = email.toLowerCase();
      const fullName = `${r['First Name'] || ''} ${r['Last Name'] || ''}`.trim() || email;
      const plan = isStandardPlan(r['Plan Name'] || '') || (r['Plan Name'] || '').trim();
      if (!seen.has(key)) {
        seen.set(key, { email, name: fullName, plan, source });
      }
    }
  };
  add(opts.ac, 'Cancelled');
  add(opts.fc, 'Future Cancellation');
  add(opts.fp, 'Failed Payments');
  add(opts.resub, 'Returned');
  return Array.from(seen.values());
}

export function GlobalSearch({
  ac, fc, fp, resub,
}: {
  ac: SheetRow[]; fc: SheetRow[]; fp: SheetRow[]; resub: SheetRow[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [openEmail, setOpenEmail] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  const index = useMemo(() => buildIndex({ ac, fc, fp, resub }), [ac, fc, fp, resub]);

  useEffect(() => setMounted(true), []);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return index.slice(0, 0);
    return index
      .filter((c) => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term))
      .slice(0, 30);
  }, [q, index]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md transition flex items-center gap-2"
        title="Search customers (⌘K)"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden md:inline text-[10px] bg-white/20 px-1.5 py-0.5 rounded">⌘K</kbd>
      </button>

      {mounted && open && createPortal(
        <div
          className="fixed inset-0 z-[120] bg-bb-ink/60 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#211a3f] rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-bb-ink/10">
              <Search className="w-4 h-4 text-bb-ink/40" />
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or email…"
                className="flex-1 bg-transparent focus:outline-none text-bb-ink"
              />
              <button onClick={() => setOpen(false)} className="text-bb-ink/40 hover:text-bb-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {!q.trim() ? (
                <div className="p-8 text-center text-sm text-bb-ink/50">
                  Type a name or email to find any customer in your sheets.
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-sm text-bb-ink/50">
                  No matches.
                </div>
              ) : (
                <ul>
                  {results.map((r) => (
                    <li key={r.email}>
                      <button
                        onClick={() => {
                          setOpenEmail(r.email);
                          setOpen(false);
                          setQ('');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-bb-mist transition flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-bb-ink truncate">{r.name}</div>
                          <div className="text-xs text-bb-ink/60 truncate">{r.email}</div>
                        </div>
                        <div className="text-xs text-bb-ink/50 shrink-0">
                          {r.plan && <span className="mr-2">{r.plan}</span>}
                          <span>{r.source}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="px-4 py-2 border-t border-bb-ink/10 text-[11px] text-bb-ink/40 flex items-center justify-between">
              <span>{results.length > 0 ? `${results.length} match${results.length === 1 ? '' : 'es'}` : ''}</span>
              <span><kbd className="bg-bb-mist px-1 py-0.5 rounded">esc</kbd> to close</span>
            </div>
          </div>
        </div>,
        document.body,
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
    </>
  );
}
