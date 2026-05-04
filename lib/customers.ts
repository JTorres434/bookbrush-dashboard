import type { SheetRow } from './sheets';
import { parseSheetDate, isStandardPlan } from './sheets';
import type { Customer } from '@/components/CustomersTable';

const SOURCE_DATE_FIELDS: Record<Customer['source'], string[]> = {
  'Already Cancelled':   ['Date Plan Ended', 'Date Contacted'],
  'Future Cancellation': ['Date Plan Ends', 'Date clicked Cancel', 'Date Contacted'],
  'Failed Payments':     ['Date Plan Ends', 'Date Contacted'],
  'Resubscriptions':     ['Date Plan Reactivated'],
};

function rowToCustomer(row: SheetRow, source: Customer['source']): Customer | null {
  const email = (row['Email'] || '').trim();
  if (!email) return null;
  const planRaw = row['Plan Name'] || '';
  const planNorm = isStandardPlan(planRaw) || '';
  // Pricing: strip non-numeric, keep dot
  const pricingRaw = (row['Pricing'] || '').toString().replace(/[^\d.]/g, '');
  const tagField = source === 'Failed Payments' ? 'Tags' : 'Tag';
  const tag = (row[tagField] || '').trim();

  let date: Date | null = null;
  for (const field of SOURCE_DATE_FIELDS[source]) {
    const d = parseSheetDate(row[field] || '');
    if (d) { date = d; break; }
  }

  return {
    firstName: (row['First Name'] || '').trim(),
    lastName: (row['Last Name'] || '').trim(),
    email,
    plan: planNorm,
    pricing: pricingRaw,
    dateLabel: date ? formatDate(date) : '',
    dateValue: date ? date.getTime() : 0,
    tag,
    source,
  };
}

function formatDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const y = String(d.getFullYear()).slice(-2);
  return `${m}/${day}/${y}`;
}

export function buildCustomerList(opts: {
  ac: SheetRow[];
  fc: SheetRow[];
  fp: SheetRow[];
  resub: SheetRow[];
}): Customer[] {
  const out: Customer[] = [];
  for (const r of opts.ac)    { const c = rowToCustomer(r, 'Already Cancelled');   if (c) out.push(c); }
  for (const r of opts.fc)    { const c = rowToCustomer(r, 'Future Cancellation'); if (c) out.push(c); }
  for (const r of opts.fp)    { const c = rowToCustomer(r, 'Failed Payments');    if (c) out.push(c); }
  for (const r of opts.resub) { const c = rowToCustomer(r, 'Resubscriptions');    if (c) out.push(c); }
  return out;
}

// Build customer lists for each KPI, filtered to the date range.
export function buildKpiCustomers(opts: {
  ac: SheetRow[];
  fc: SheetRow[];
  fp: SheetRow[];
  resub: SheetRow[];
  range: { start: Date; end: Date };
}) {
  const startMs = opts.range.start.getTime();
  const endMs = opts.range.end.getTime();
  const inRange = (c: Customer) =>
    c.dateValue > 0 && c.dateValue >= startMs && c.dateValue <= endMs;

  const acCustomers = opts.ac
    .map((r) => rowToCustomer(r, 'Already Cancelled'))
    .filter((c): c is Customer => !!c);
  const fcCustomers = opts.fc
    .map((r) => rowToCustomer(r, 'Future Cancellation'))
    .filter((c): c is Customer => !!c);
  const fpCustomers = opts.fp
    .map((r) => rowToCustomer(r, 'Failed Payments'))
    .filter((c): c is Customer => !!c);
  const resubCustomers = opts.resub
    .map((r) => rowToCustomer(r, 'Resubscriptions'))
    .filter((c): c is Customer => !!c);

  const cancellations = [...acCustomers, ...fcCustomers, ...fpCustomers].filter(inRange);
  const resubscriptions = resubCustomers.filter(inRange);
  const failedPayments = fpCustomers.filter(inRange);
  // Net change = combine resubs + cancellations together so user can see both sides
  const netChangeAll = [...cancellations, ...resubscriptions];

  return { cancellations, resubscriptions, failedPayments, netChangeAll };
}
