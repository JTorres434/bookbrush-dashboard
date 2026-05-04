import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, isAuthCookieValid } from '@/lib/auth';

// Returns last-execution metadata for each workflow we care about.
// Locked behind the dashboard password so only signed-in viewers can see it.

type WorkflowStatus = {
  id: string;
  name: string;
  active: boolean;
  lastExecutedAt: string | null;
  lastStatus: string | null;
};

const WORKFLOWS = [
  { id: '84o8Crr9to5Hy3hI', label: 'Cancellations Tracker' },
  { id: 'X0iiGY3Ki7HUK2LX', label: 'Resubscriptions Tracker' },
  { id: 'foFSwEzCLwW6beRC', label: 'Daily Follow-up Scheduler' },
  { id: 'lWwCsKD9ERRYJFBg', label: 'Daily Reconciliation' },
  { id: 'CoqzqmWiH7Vi7Qoq', label: 'Reply Scanner' },
  { id: '9B5my6hGRah7Tkok',  label: 'Weekly Audit' },
];

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET() {
  // Auth gate — only signed-in users can read this
  const cookieStore = cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const valid = await isAuthCookieValid(authCookie);
  if (!valid) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.N8N_API_KEY;
  const apiUrl = process.env.N8N_API_URL;
  if (!apiKey || !apiUrl) {
    return NextResponse.json({
      configured: false,
      message: 'N8N_API_KEY / N8N_API_URL env vars not set — System Status disabled.',
      workflows: [],
    });
  }

  const results: WorkflowStatus[] = [];
  for (const wf of WORKFLOWS) {
    try {
      const wRes = await fetch(`${apiUrl}/workflows/${wf.id}`, {
        headers: { 'X-N8N-API-KEY': apiKey },
        cache: 'no-store',
      });
      const wInfo = wRes.ok ? await wRes.json() : null;

      const eRes = await fetch(
        `${apiUrl}/executions?workflowId=${wf.id}&limit=1`,
        { headers: { 'X-N8N-API-KEY': apiKey }, cache: 'no-store' },
      );
      const eData = eRes.ok ? await eRes.json() : null;
      const last = eData?.data?.[0];

      results.push({
        id: wf.id,
        name: wf.label,
        active: wInfo?.active ?? false,
        lastExecutedAt: last?.startedAt ?? null,
        lastStatus: last?.status ?? null,
      });
    } catch {
      results.push({ id: wf.id, name: wf.label, active: false, lastExecutedAt: null, lastStatus: 'unreachable' });
    }
  }

  return NextResponse.json({ configured: true, workflows: results });
}
