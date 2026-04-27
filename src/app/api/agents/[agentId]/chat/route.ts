// POST /api/agents/[agentId]/chat
// Human-to-agent conversation endpoint.
// Steps: Auth → Session Mgmt → Context Assembly → LLM Call → Store → Post-Process → Return

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { assembleAgentContext } from '@/lib/memory/context';
import { createProvider, type ChatMessage } from '@/lib/ai/provider';
import { choosePolicy, getProviderApiKey, policyToLlmOptions, type Tier } from '@/lib/ai/policyRouter';
import { runPostProcessing } from '@/lib/chat/postProcessor';
import { checkAndIncrementQuota } from '@/lib/quota/usageQuota';
import { checkRateLimit } from '@/lib/quota/rateLimiter';

const MAX_CONVERSATION_HISTORY = 30;
const LLM_TIMEOUT_MS = 30_000;

interface ChatRequestBody {
  message: string;
  session_id?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    mime_type: string;
  }>;
}

// Themed error messages
const ERRORS = {
  unauthenticated: 'Sign in to speak with the people of Arboria.',
  agent_not_found: 'This agent seems to have wandered off.',
  timeout: (name: string) => `${name} seems lost in thought... try again in a moment.`,
  rate_limit: 'The settlement is busy right now. Try again shortly.',
  server_error: "Something went wrong. Your message wasn't lost — try sending again.",
} as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  // ── Step 0: Per-IP Burst Rate Limiting ──
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  const supabase = createAdminClient();

  // ── Step 1: Authentication ──
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json(
      { error: ERRORS.unauthenticated },
      { status: 401 }
    );
  }

  // Look up user record — auto-provision if Clerk user has no Supabase row yet
  let { data: user } = await supabase
    .from('users')
    .select('id, tier')
    .eq('clerk_id', clerkId)
    .single();

  if (!user) {
    // First interaction: create the user record with 'traveler' tier
    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({ clerk_id: clerkId, tier: 'traveler' })
      .select('id, tier')
      .single();

    if (insertErr || !newUser) {
      console.error('[Chat] Failed to auto-provision user:', insertErr?.message);
      return NextResponse.json(
        { error: ERRORS.server_error },
        { status: 500 }
      );
    }
    user = newUser;
  }

  // Tier mapping: post-migration all non-steward users are travelers.
  // Quota enforcement for travelers is handled by checkAndIncrementQuota below.
  const userTier: Tier = (user.tier === 'steward') ? 'steward' : 'traveler';

  // Update last_login so the adaptive heartbeat sees this user as active.
  // last_login defaults to created_at and is never otherwise updated — without this,
  // the heartbeat treats all users as dormant after their first day and drops to
  // traveler-only 30-minute cadence even when a steward is actively using the app.
  void Promise.resolve(
    supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id)
  ).catch((err) => console.error('[Chat] Failed to update last_login:', err));

  // ── Step 2: Parse Request ──
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
    return NextResponse.json(
      { error: 'Message is required.' },
      { status: 400 }
    );
  }

  // ── Step 3: Session Management ──
  let sessionId = body.session_id;
  let sessionMessages: Array<{ role: string; content: string; timestamp: string }> = [];
  let isNewSession = false;

  if (sessionId) {
    // Load existing session
    const { data: session } = await supabase
      .from('conversation_sessions')
      .select('id, messages, status, user_id, agent_id')
      .eq('id', sessionId)
      .single();

    if (
      session &&
      session.user_id === user.id &&
      session.agent_id === agentId &&
      session.status === 'active'
    ) {
      sessionMessages = session.messages ?? [];
    } else {
      // Invalid session — create new
      sessionId = undefined;
      console.warn(`[Chat] Invalid session ${body.session_id}, creating new`);
    }
  }

  if (!sessionId) {
    // Check for existing active session with this agent
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('conversation_sessions')
      .select('id, messages')
      .eq('user_id', user.id)
      .eq('agent_id', agentId)
      .eq('status', 'active')
      .gte('updated_at', thirtyMinAgo)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      sessionId = existing.id;
      sessionMessages = existing.messages ?? [];
    } else {
      // Create new session
      const { data: newSession, error: insertError } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: user.id,
          agent_id: agentId,
          messages: [],
          status: 'active',
        })
        .select('id')
        .single();

      if (insertError || !newSession) {
        console.error('[Chat] Failed to create session:', insertError);
        return NextResponse.json(
          { error: ERRORS.server_error },
          { status: 500 }
        );
      }

      sessionId = newSession.id;
      isNewSession = true;
    }
  }

  // ── Step 4: Context Assembly ──
  let contextResult;
  try {
    contextResult = await assembleAgentContext(supabase, agentId, user.id, clerkId);
  } catch {
    return NextResponse.json(
      { error: ERRORS.agent_not_found },
      { status: 404 }
    );
  }

  // ── Step 4b: Quota Enforcement (before any LLM call) ──
  // DEV: Quota check commented out for testing — re-enable before production launch
  // const quotaResult = await checkAndIncrementQuota(user.id, userTier, agentName);
  // if (!quotaResult.allowed) {
  //   return NextResponse.json({
  //     session_id: sessionId ?? null,
  //     reply: null,
  //     agent_name: agentName,
  //     sentiment: null,
  //     quota_exceeded: true,
  //     narrative_message: quotaResult.narrativeMessage,
  //     turns_used: quotaResult.turnsUsed,
  //     turns_limit: quotaResult.turnsLimit,
  //   });
  // }
  const agentName = contextResult.agent.name;

  // ── Step 5: Build LLM Messages ──
  const llmMessages: ChatMessage[] = [
    { role: 'system', content: contextResult.systemPrompt },
  ];

  // Add conversation history (rolling window)
  const historyWindow = sessionMessages.slice(-MAX_CONVERSATION_HISTORY);
  for (const msg of historyWindow) {
    llmMessages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  }

  // Build current user message (with file attachment if present)
  let userMessageContent = body.message.trim();
  const fileReferences: Array<{ filename: string; mime_type: string; summary: string; message_index: number }> = [];

  if (body.attachments && body.attachments.length > 0) {
    const attachment = body.attachments[0]; // max 1 file per message
    const truncatedContent = attachment.content.length > 40_000
      ? attachment.content.slice(0, 40_000) + '\n\n[File truncated at 10,000 tokens. Showing first portion.]'
      : attachment.content;

    userMessageContent = `[User attached: ${attachment.filename} (${attachment.mime_type})]\n\n--- File Content ---\n${truncatedContent}\n--- End File ---\n\nUser message: ${userMessageContent}`;

    // Count lines as rough summary
    const lineCount = attachment.content.split('\n').length;
    fileReferences.push({
      filename: attachment.filename,
      mime_type: attachment.mime_type,
      summary: `${attachment.filename}, ${lineCount} lines`,
      message_index: sessionMessages.length,
    });
  }

  // If new session, generate opening line instead of echoing user message
  if (isNewSession && sessionMessages.length === 0) {
    // Check if this is a returning visitor
    const { data: pastInteractions } = await supabase
      .from('interactions')
      .select('summary, sentiment')
      .eq('agent_id', agentId)
      .eq('initiator_clerk_id', clerkId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let openingInstruction: string;
    if (pastInteractions?.summary) {
      openingInstruction = `A visitor you've spoken with before has returned. Your last conversation was about: "${pastInteractions.summary}" and was ${pastInteractions.sentiment ?? 'neutral'}. Greet them briefly, in character, then address their message.`;
    } else {
      openingInstruction = 'A new visitor has approached you. Greet them briefly, in character, then address their message.';
    }

    // Prepend the opening instruction to the user message
    userMessageContent = `[Context: ${openingInstruction}]\n\n${userMessageContent}`;
  }

  llmMessages.push({ role: 'user', content: userMessageContent });

  // ── Step 6: LLM Call ──
  const chatPolicy = choosePolicy('chat', userTier);
  const apiKey = getProviderApiKey(chatPolicy.provider);
  if (!apiKey) {
    console.error(`[Chat] Missing API key for provider: ${chatPolicy.provider}`);
    return NextResponse.json(
      { error: ERRORS.server_error },
      { status: 503 }
    );
  }
  const llmOptions = policyToLlmOptions(chatPolicy);
  let reply: string;

  const callLLM = async () => {
    const provider = createProvider(chatPolicy.provider, apiKey);
    const llmPromise = provider.chat(llmMessages, llmOptions);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), LLM_TIMEOUT_MS)
    );
    return Promise.race([llmPromise, timeoutPromise]);
  };

  const callFallbackLLM = async () => {
    const fallbackProvider = createProvider(chatPolicy.fallbackProvider, getProviderApiKey(chatPolicy.fallbackProvider));
    const llmPromise = fallbackProvider.chat(llmMessages, { ...llmOptions, model: chatPolicy.fallbackModel });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), LLM_TIMEOUT_MS)
    );
    return Promise.race([llmPromise, timeoutPromise]);
  };

  try {
    const result = await callLLM();
    reply = result.content;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Chat] LLM call failed (${chatPolicy.provider}):`, message);

    if (message === 'timeout') {
      return NextResponse.json(
        { error: ERRORS.timeout(contextResult.agent.name) },
        { status: 504 }
      );
    }

    // Retry once on rate-limit (429) using fallback provider
    if (message.includes('429') || message.toLowerCase().includes('rate limit')) {
      console.warn('[Chat] Rate limited, retrying with fallback provider...');
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const retryResult = await callFallbackLLM();
        reply = retryResult.content;
      } catch (retryErr) {
        console.error('[Chat] Fallback retry also failed:', retryErr);
        return NextResponse.json(
          { error: ERRORS.rate_limit },
          { status: 429 }
        );
      }
    } else {
      console.error('[Chat] LLM error detail:', message);
      return NextResponse.json(
        { error: ERRORS.server_error },
        { status: 503 }
      );
    }
  }

  // ── Step 7: Store Response ──
  const now = new Date().toISOString();
  const updatedMessages = [
    ...sessionMessages,
    { role: 'user', content: body.message.trim(), timestamp: now },
    { role: 'assistant', content: reply, timestamp: now },
  ];

  const updatePayload: Record<string, unknown> = {
    messages: updatedMessages,
    updated_at: now,
  };

  // Append file references if any
  if (fileReferences.length > 0) {
    const { data: currentSession } = await supabase
      .from('conversation_sessions')
      .select('file_references')
      .eq('id', sessionId)
      .single();

    const existingRefs = (currentSession?.file_references as unknown[]) ?? [];
    updatePayload.file_references = [...existingRefs, ...fileReferences];
  }

  await supabase
    .from('conversation_sessions')
    .update(updatePayload)
    .eq('id', sessionId);

  // ── Step 8: Post-Processing (async, non-blocking) ──
  // Fire and forget — do not await
  runPostProcessing(supabase, {
    agentId,
    userId: user.id,
    agentResponse: reply,
  }).catch((err) => console.error('[Chat] Post-processing error:', err));

  // ── Step 9: Return Response ──
  return NextResponse.json({
    session_id: sessionId,
    reply,
    agent_name: contextResult.agent.name,
    sentiment: 'neutral', // Real sentiment computed async
  });
}
