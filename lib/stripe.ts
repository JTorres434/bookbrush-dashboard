// Server-side Stripe helpers. Reads STRIPE_SECRET_KEY from env (never exposed to browser).

export type StripeSubscription = {
  id: string;
  status: string;
  created: number;
  cancel_at_period_end?: boolean;
  items?: { data: Array<{ plan?: { nickname?: string }; price?: { unit_amount?: number } }> };
};

export type StripeCustomer = {
  id: string;
  email: string | null;
  name: string | null;
  created: number; // unix seconds
  subscriptions?: { data: StripeSubscription[] };
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

export type NewCustomerInfo = {
  email: string;
  name: string;
  plan: string;
  pricing: string;
  joinedAtUnixMs: number;  // CUSTOMER created date (their first time in Stripe)
  joinedLabel: string;
};

// "New customer" = a customer whose Stripe record was CREATED in the date range
// AND who currently has an active subscription. This catches genuine first-time
// signups; excludes returning customers (their Stripe record predates the range)
// and people who signed up but never paid (no active sub).
export async function fetchNewCustomersInRange(opts: {
  startMs: number;
  endMs: number;
}): Promise<{ configured: boolean; customers: NewCustomerInfo[] }> {
  if (!isStripeConfigured()) return { configured: false, customers: [] };

  const startSec = Math.floor(opts.startMs / 1000);
  const endSec = Math.floor(opts.endMs / 1000);

  let starting_after: string | undefined;
  const all: StripeCustomer[] = [];

  for (let page = 0; page < 10; page++) {
    const params = new URLSearchParams({
      'created[gte]': String(startSec),
      'created[lte]': String(endSec),
      'limit': '100',
      'expand[]': 'data.subscriptions',
    });
    if (starting_after) params.set('starting_after', starting_after);
    const data = await stripeGet<{ data: StripeCustomer[]; has_more: boolean }>(
      `/customers?${params.toString()}`,
    );
    if (!data) break;
    all.push(...data.data);
    if (!data.has_more || data.data.length === 0) break;
    starting_after = data.data[data.data.length - 1].id;
  }

  const customers: NewCustomerInfo[] = [];
  for (const c of all) {
    const subs = c.subscriptions?.data || [];
    const activeSub = subs.find((s) => s.status === 'active');
    if (!activeSub) continue;  // signed up but never paid → not a real new customer

    const item = activeSub.items?.data?.[0];
    const planRaw = item?.plan?.nickname || '';
    const lower = planRaw.toLowerCase();
    const plan = lower.includes('plus')     ? 'Plus' :
                 lower.includes('gold')     ? 'Gold' :
                 lower.includes('platinum') ? 'Platinum' : planRaw;
    const amount = item?.price?.unit_amount ?? 0;
    const pricing = (amount / 100).toFixed(2);

    const joinedAtUnixMs = c.created * 1000;
    const d = new Date(joinedAtUnixMs);
    const joinedLabel = d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

    customers.push({
      email: c.email || '',
      name: (c.name || '').trim() || (c.email || ''),
      plan,
      pricing,
      joinedAtUnixMs,
      joinedLabel,
    });
  }

  // Most recent first
  customers.sort((a, b) => b.joinedAtUnixMs - a.joinedAtUnixMs);
  return { configured: true, customers };
}
