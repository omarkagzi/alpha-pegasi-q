import { NextResponse } from 'next/server';

// World epoch: Jan 1, 2026 00:00:00 UTC
// All clients compute the same normalized time relative to this shared epoch.
const WORLD_EPOCH_MS = new Date('2026-01-01T00:00:00Z').getTime();
const DAY_CYCLE_MS = 24 * 60 * 1000; // 24 real-world minutes

export async function GET() {
  const now = Date.now();
  const elapsed = now - WORLD_EPOCH_MS;
  const normalizedTime = ((elapsed % DAY_CYCLE_MS) / DAY_CYCLE_MS + 1) % 1; // always 0–1

  return NextResponse.json(
    { normalizedTime, serverTimestamp: now, cycleDurationMs: DAY_CYCLE_MS },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
