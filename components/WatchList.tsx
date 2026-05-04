import { AlertCircle } from 'lucide-react';
import type { SheetRow } from '@/lib/sheets';
import { parseSheetDate, isStandardPlan } from '@/lib/sheets';

type WatchItem = {
  email: string;
  name: string;
  plan: string;
  pricing: number;
  daysUntilCancel: number | null;
  reason: string;
};

function buildWatchList(fc: SheetRow[]): WatchItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const items: WatchItem[] = [];
  for (const row of fc) {
    const email = (row['Email'] || '').trim();
    if (!email) continue;
    const tag = (row['Tag'] || '').toLowerCase();
    if (tag.includes('skipped')) continue;
    const plan = isStandardPlan(row['Plan Name'] || '');
    const pricing = parseFloat(row['Pricing'] || '0');

    // Legacy Gold $146 = high-value at-risk (pricing went up to $199 for new customers)
    const isLegacyGold = plan === 'Gold' && pricing > 0 && pricing <= 150;
    if (!isLegacyGold) continue;

    const cancelDate = parseSheetDate(row['Date Plan Ends'] || '');
    const days = cancelDate ? Math.floor((cancelDate.getTime() - today.getTime()) / 86400000) : null;
    items.push({
      email,
      name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim() || email,
      plan: plan || 'Gold',
      pricing,
      daysUntilCancel: days,
      reason: 'Legacy $146/mo — losing them means a $53/mo gap',
    });
  }
  // Closest cancellation first
  items.sort((a, b) => (a.daysUntilCancel ?? 9999) - (b.daysUntilCancel ?? 9999));
  return items;
}

export function WatchList({ fc }: { fc: SheetRow[] }) {
  const items = buildWatchList(fc);

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
            <li key={item.email} className="flex items-center justify-between p-3 bg-bb-mist rounded-lg">
              <div className="min-w-0">
                <div className="font-medium text-bb-ink truncate">{item.name}</div>
                <div className="text-xs text-bb-ink/60 truncate">{item.email}</div>
              </div>
              <div className="text-right ml-3 shrink-0">
                <div className="text-sm font-semibold text-bb-magenta">
                  ${item.pricing.toFixed(0)}/mo
                </div>
                {item.daysUntilCancel !== null && (
                  <div className="text-xs text-bb-ink/60">
                    {item.daysUntilCancel <= 0
                      ? 'cancelling now'
                      : `${item.daysUntilCancel} day${item.daysUntilCancel === 1 ? '' : 's'} left`}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {items.length > 8 && (
        <div className="text-xs text-bb-ink/50 mt-3 text-center">
          +{items.length - 8} more in the Customers table below
        </div>
      )}
    </div>
  );
}
