// POST /api/agents/[agentId]/chat/end
// Ends a chat session — generates summary, writes to interactions table,
// updates relationship. Called when the player closes the chat panel.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { endSession } from '@/lib/chat/postProcessor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  let body: { session_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!body.session_id) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify session belongs to this user
  const { data: session } = await supabase
    .from('conversation_sessions')
    .select('id, user_id, messages')
    .eq('id', body.session_id)
    .single();

  if (!session) {
    return NextResponse.json({ ok: true }); // Already gone, no-op
  }

  // Look up user to verify ownership
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  if (!user || session.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Only end if there are messages to summarize
  const messages = session.messages as unknown[];
  if (!messages || messages.length === 0) {
    // Mark as ended but skip summary generation
    await supabase
      .from('conversation_sessions')
      .update({ status: 'ended' })
      .eq('id', body.session_id);

    return NextResponse.json({ ok: true });
  }

  // Fire and forget — endSession handles its own errors
  const geminiApiKey = process.env.GEMINI_API_KEY ?? '';
  endSession(supabase, {
    sessionId: body.session_id,
    agentId,
    clerkId,
    geminiApiKey,
  }).catch((err) => console.error('[ChatEnd] endSession error:', err));

  return NextResponse.json({ ok: true });
}
