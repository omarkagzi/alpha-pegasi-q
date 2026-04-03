// POST /api/world/cleanup
// Retention cleanup — archives conversation_sessions older than 30 days.
// Keeps metadata (user_id, agent_id, created_at, summary, sentiment) but
// clears the messages array to free storage. Designed to be called via
// QStash cron (daily).

import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { createAdminClient } from '@/lib/supabase/server';

const RETENTION_DAYS = 30;

async function verifyQStashSignature(request: Request): Promise<boolean> {
  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!signingKey || !nextSigningKey) return false;

  const receiver = new Receiver({
    currentSigningKey: signingKey,
    nextSigningKey,
  });

  const signature = request.headers.get('upstash-signature');
  if (!signature) return false;

  try {
    const body = await request.text();
    await receiver.verify({ signature, body });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const isValid = await verifyQStashSignature(request.clone());
  if (!isValid) {
    console.error('[Cleanup] Invalid QStash signature');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Archive: clear messages array but keep metadata for ended sessions
    const { data: archived, error } = await supabase
      .from('conversation_sessions')
      .update({ messages: [], file_references: [] })
      .eq('status', 'ended')
      .lt('created_at', cutoff)
      .neq('messages', '[]') // only sessions that still have messages
      .select('id');

    if (error) {
      console.error('[Cleanup] Archive failed:', error.message);
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }

    const count = archived?.length ?? 0;
    console.log(`[Cleanup] Archived ${count} conversation sessions older than ${RETENTION_DAYS} days`);

    return NextResponse.json({ archived: count, cutoff });
  } catch (err) {
    console.error('[Cleanup] Error:', err);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
