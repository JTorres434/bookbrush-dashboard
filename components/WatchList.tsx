'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { SheetRow } from '@/lib/sheets';
import { parseSheetDate, isStandardPlan } from '@/lib/sheets';
import { CustomerDetail } from './CustomerDetail';

type WatchItem = {
  email: string;
  name: string;
  plan: string;
  pricing: number;
  daysUntilCancel: number;
};

function buildWatchList(fc: SheetRow[], ac: SheetRow[], resub: SheetRow[]): WatchItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const alreadyCancelled = new Set(
    ac.map((r) => (r['Email'] || '').trim().toLowerCase()).filter(Boolean),
  );
  const alreadyReturned = new Set(
    resub.map((r) => (r['Email'] || '').trim().toLowerCase()).filter(Boolean),
  );

  const items: WatchItem[] = [];
  for (const row of fc) {
    const email = (row['Email'] || '').trim();
    if (!email) continue;
    const emailLower = email.toLowerCase();
    if (alreadyCancelled.has(emailLower)) continue;
    if (alreadyReturned.has(emailLower)) continue;
    const tag = (row['Tag'] || '').toLowerCase();
    if (tag.includes('skipped')) continue;
    if (tag.includes('deferred')) continue;

    const plan = isStandardPlan(row['Plan Name'] || '');
    const pricing = parseFloat(row['Pricing'] || '0');
    const isLegacyGold = plan === 'Gold' && pricing > 0 && pricing <= 150;
    if (!isLegacyGold) continue;

    const cancelDate = parseSheetDate(row['Date Plan Ends'] || '');
    if (!cancelDate) continue;
    const days = Math.floor((cancelDate.getTime() - today.getTime()) / 86400000);
    if (days < 0) continue;

    items.push({
      email,
      name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim() || email,
      plan: plan || 'Gold',
      pricing,
      daysUntilCancel: days,
    });
  }
  items.sort((a, b) => a.daysUntilCancel - b.daysUntilCancel);
  return items;
}

export function WatchList({
  fc, ac, fp, resub,
}: {
  fc: SheetRow[]; ac: SheetRow[]; fp: SheetRow[]; resub: SheetRow[];
}) {
  const items = buildWatchList(fc, ac, resub);
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl card-shadow p-5">
      <div className="flex items-center gap-2 mb-1">
        <AlertCircle className="w-4 h-4 text-bb-magenta" />
        <h2 className="font-semibold text-bb-ink">Watch List</h2>
        <span className="text-xs text-bb-ink/50">— high-value customers about to cancel</span>
      </div>
      <p className="text-xs text-bb-ink/60 mb-4">
        Legacy Gold members (still at $146/month) with a scheduled cancellation. Worth a personal note.
      </p>
      {items.length === 0 ? (
        <div className="text-sm text-bb-ink/50 py-4 text-center">No high-value customers at risk right now. 🎉</div>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 8).map((item) => (
            <li key={item.email}>
              <button
                onClick={() => setOpenEmail(item.email)}
                className="w-full flex items-center justify-between p-3 bg-bb-mist hover:bg-bb-purple/10 rounded-lg text-left transition"
              >
                <div className="min-w-0">
                  <div className="font-medium text-bb-ink truncate">{item.name}</div>
                  <div className="text-xs text-bb-ink/60 truncate">{item.email}</div>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <div className="text-sm font-semibold text-bb-magenta">${item.pricing.toFixed(0)}/mo</div>
                  <div className="text-xs text-bb-ink/60">
                    {item.daysUntilCancel === 0
                      ? 'cancels today'
                      : `${item.daysUntilCancel} day${item.daysUntilCancel === 1 ? '' : 's'} left`}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length > 8 && (
        <div className="text-xs text-bb-ink/50 mt-3 text-center">
          +{items.length - 8} more in the Customers table below
        </div>
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
