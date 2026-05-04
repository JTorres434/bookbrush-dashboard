// Server-side Stripe helpers. Reads STRIPE_SECRET_KEY from env (never exposed to browser).

export type StripeCustomer = {
  id: string;
  email: string | null;
  name: string | null;
  created: number; // unix seconds
};

export type StripeSub = {
  id: string;
  customer: string | StripeCustomer;
  status: string;
  created: number;
  items: { data: Array<{ plan?: { nickname?: string }; price?: { unit_amount?: number } }> };
};

const STRIPE_API = 'https://api.stripe.com/v1';

function getKey(): string | null {
  return process.env.STRIPE_SECRET_KEY || null;
}

export function isStripeConfigured(): boolean {
  return !!getKey();
}

async function stripeGet<T>(path: string): Promise<T | null> {
  const key = getKey();
  if (!key) return null;
  try {
    const res = await fetch(`${STRIPE_API}${path}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// List subscriptions created in [startMs, endMs], expanding customer details.
// We use subscriptions (not customers) because Bookbrush customers = subscribers.
export async function listNewSubscriptions(opts: {
  startMs: number;
  endMs: number;
  limit?: number;
}): Promise<{ subs: StripeSub[]; configured: boolean }> {
  if (!isStripeConfigured()) return { subs: [], configured: false };

  const startSec = Math.floor(opts.startMs / 1000);
  const endSec = Math.floor(opts.endMs / 1000);
  const limit = opts.limit ?? 100;

  // Paginate up to 5 pages (500 subs) to handle busy windows
  let starting_after: string | undefined;
  const all: StripeSub[] = [];
  for (let page = 0; page < 5; page++) {
    const params = new URLSearchParams({
      'created[gte]': String(startSec),
      'created[lte]': String(endSec),
      'limit': String(limit),
      'expand[]': 'data.customer',
    });
    if (starting_after) params.set('starting_after', starting_after);
    const data = await stripeGet<{ data: StripeSub[]; has_more: boolean }>(
      `/subscriptions?${params.toString()}`,
    );
    if (!data) break;
    all.push(...data.data);
    if (!data.has_more || data.data.length === 0) break;
    starting_after = data.data[data.data.length - 1].id;
  }
  return { subs: all, configured: true };
}

export type NewCustomerInfo = {
  email: string;
  name: string;
  plan: string;
  pricing: string;
  joinedAtUnixMs: number;
  joinedLabel: string;
  isReturning: boolean;
};

// Build a list of "new customer" entries — first-time subscribers in the range.
// Excludes customers we know came back via the Resubscriptions sheet (those are returns, not new).
export async function fetchNewCustomersInRange(opts: {
  startMs: number;
  endMs: number;
  knownReturningEmails: Set<string>;
}): Promise<{ configured: boolean; customers: NewCustomerInfo[] }> {
  const { subs, configured } = await listNewSubscriptions({
    startMs: opts.startMs,
    endMs: opts.endMs,
  });
  if (!configured) return { configured: false, customers: [] };

  // Group by customer — count first sub per customer in range.
  const seenCustomers = new Set<string>();
  const customers: NewCustomerInfo[] = [];

  for (const s of subs) {
    const cust = (typeof s.customer === 'string' ? null : s.customer) as StripeCustomer | null;
    if (!cust) continue;
    if (seenCustomers.has(cust.id)) continue;
    seenCustomers.add(cust.id);

    const email = (cust.email || '').toLowerCase();
    const isReturning = email ? opts.knownReturningEmails.has(email) : false;

    const item = s.items?.data?.[0];
    const planRaw = item?.plan?.nickname || '';
    const lower = planRaw.toLowerCase();
    const plan = lower.includes('plus')     ? 'Plus' :
                 lower.includes('gold')     ? 'Gold' :
                 lower.includes('platinum') ? 'Platinum' : planRaw;
    const amount = item?.price?.unit_amount ?? 0;
    const pricing = (amount / 100).toFixed(2);

    const joinedAtUnixMs = (s.created || cust.created || 0) * 1000;
    const d = new Date(joinedAtUnixMs);
    const joinedLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    customers.push({
      email: cust.email || '',
      name: (cust.name || '').trim() || (cust.email || ''),
      plan,
      pricing,
      joinedAtUnixMs,
      joinedLabel,
      isReturning,
    });
  }
  // Filter out returning customers (they're tracked elsewhere)
  return { configured: true, customers: customers.filter((c) => !c.isReturning) };
}
