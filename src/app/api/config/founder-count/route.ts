import { NextResponse } from 'next/server';
import { getFounderStatus } from '@/lib/dodo/founderCounter';

let cachedStatus: Awaited<ReturnType<typeof getFounderStatus>> | null = null;
let cachedAt = 0;
const CACHE_TTL = 60_000;

export async function GET() {
  const now = Date.now();

  if (!cachedStatus || now - cachedAt > CACHE_TTL) {
    cachedStatus = await getFounderStatus();
    cachedAt = now;
  }

  return NextResponse.json(cachedStatus, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
    },
  });
}
