// Read Google Sheet tabs without any Google Cloud project.
// Uses Google's public gviz endpoint, which works on any sheet shared as
// "Anyone with the link can view".

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
if (!SHEET_ID) {
  throw new Error('GOOGLE_SHEET_ID environment variable is required');
}

export type SheetRow = Record<string, string>;

async function fetchTabRaw(tab: string): Promise<{ cols: string[]; rows: any[] } | null> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const text = await res.text();
  // gviz wraps JSON like:  google.visualization.Query.setResponse({...});
  const match = text.match(/setResponse\(([\s\S]*)\)/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed.status === 'error') return null;
    const table = parsed.table;
    const cols = (table.cols || []).map((c: any) => (c.label || c.id || '').toString().trim());
    const rows = (table.rows || []).map((r: any) => r.c || []);
    return { cols, rows };
  } catch {
    return null;
  }
}

export async function readSheetTab(tab: string): Promise<SheetRow[]> {
  const data = await fetchTabRaw(tab);
  if (!data) return [];
  const { cols, rows } = data;
  return rows.map((row) => {
    const obj: SheetRow = {};
    cols.forEach((header, idx) => {
      const cell = row[idx];
      if (!header) return;
      // gviz returns cell as { v: rawValue, f: formattedValue } or null
      const value = cell == null ? '' : (cell.f ?? cell.v ?? '').toString();
      obj[header] = value;
    });
    return obj;
  });
}

export async function readAllSheets() {
  const [ac, fc, fp, resub, needsReview] = await Promise.all([
    readSheetTab('Already Cancelled'),
    readSheetTab('Future cancellation'),
    readSheetTab('Failed Payments'),
    readSheetTab('Resubscriptions'),
    readSheetTab('Needs Review'),
  ]);
  return { ac, fc, fp, resub, needsReview };
}

export function parseSheetDate(s: string): Date | null {
  if (!s) return null;
  const trimmed = s.trim();
  // Try MM/DD/YY or M/D/YYYY (our standard sheet format)
  const slashed = trimmed.split('/');
  if (slashed.length === 3) {
    let [m, d, y] = slashed.map((p) => parseInt(p, 10));
    if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
      if (y < 100) y += 2000;
      const dt = new Date(y, m - 1, d);
      if (!isNaN(dt.getTime())) return dt;
    }
  }
  // Try ISO format as fallback
  const iso = new Date(trimmed);
  return isNaN(iso.getTime()) ? null : iso;
}

export function isStandardPlan(plan: string): 'Plus' | 'Gold' | 'Platinum' | null {
  const lower = (plan || '').toLowerCase();
  if (lower.includes('plus')) return 'Plus';
  if (lower.includes('gold')) return 'Gold';
  if (lower.includes('platinum')) return 'Platinum';
  return null;
}
