import { NextResponse } from 'next/server';

// Single source of truth for the dashboard's view of automation health.
// Returns last-execution metadata for each workflow we care about.
// Reads N8N_API_KEY + N8N_API_URL from env vars; if not set, returns empty.

type WorkflowStatus = {
  id: string;
  name: string;
  active: boolean;
  lastExecutedAt: string | null;  // ISO
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
      // 1. Get workflow info (active flag, name)
      const wRes = await fetch(`${apiUrl}/workflows/${wf.id}`, {
        headers: { 'X-N8N-API-KEY': apiKey },
        cache: 'no-store',
      });
      const wInfo = wRes.ok ? await wRes.json() : null;

      // 2. Get latest execution
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
