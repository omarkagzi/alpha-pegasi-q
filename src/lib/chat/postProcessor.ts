// src/lib/chat/postProcessor.ts
// Async post-processing after each chat message is returned to the client.
// Handles: sentiment classification, relationship updates, reputation updates.
// All operations are non-blocking — failures are logged, never surfaced to the user.

import type { SupabaseClient } from '@supabase/supabase-js';
import { createProvider, type ChatMessage } from '@/lib/ai/provider';
import { choosePolicy, getProviderApiKey, policyToLlmOptions } from '@/lib/ai/policyRouter';
import {
  buildSentimentPrompt,
  isValidSentiment,
  mapSentimentToReputation,
  mapSentimentToRelationship,
  type ChatSentiment,
} from '@/lib/ai/prompts/sentiment';

// Arc stage progression thresholds
const ARC_THRESHOLDS: Record<string, number> = {
  acquaintance: 3,
  familiar: 7,
  close: 15,
};

/**
 * Runs all post-processing steps after a chat response is sent.
 * Called with waitUntil() or fire-and-forget — must not throw.
 */
export async function runPostProcessing(
  supabase: SupabaseClient,
  opts: {
    agentId: string;
    userId: string;
    agentResponse: string;
  }
): Promise<void> {
  try {
    // 1. Classify sentiment via cheap LLM call
    const sentiment = await classifySentiment(opts.agentResponse);

    // 2. Update relationship (parallel with reputation)
    await Promise.all([
      updateRelationship(supabase, opts.userId, opts.agentId, sentiment),
      updateReputation(supabase, opts.agentId, sentiment),
    ]);
  } catch (err) {
    console.error('[PostProcessor] Error:', err);
  }
}

async function classifySentiment(
  agentResponse: string,
): Promise<ChatSentiment> {
  try {
    const sentimentPolicy = choosePolicy('sentiment', 'traveler');
    const provider = createProvider(sentimentPolicy.provider, getProviderApiKey(sentimentPolicy.provider));
    const prompt = buildSentimentPrompt(agentResponse);
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    const result = await provider.chat(messages, {
      ...policyToLlmOptions(sentimentPolicy),
    });
    const raw = result.content.trim().toLowerCase();
    return isValidSentiment(raw) ? raw : 'neutral';
  } catch (err) {
    console.warn('[PostProcessor] Sentiment classification failed:', err);
    return 'neutral';
  }
}

async function updateRelationship(
  supabase: SupabaseClient,
  userId: string,
  agentId: string,
  sentiment: ChatSentiment
): Promise<void> {
  // Find or create the relationship
  const { data: existing } = await supabase
    .from('relationships')
    .select('id, interaction_count, aggregate_sentiment, arc_stage')
    .eq('entity_a_id', userId)
    .eq('entity_a_type', 'user')
    .eq('entity_b_id', agentId)
    .eq('entity_b_type', 'agent')
    .maybeSingle();

  const sentimentSignal = mapSentimentToRelationship(sentiment);

  if (existing) {
    const newCount = (existing.interaction_count ?? 0) + 1;

    // Progress arc stage based on thresholds
    let newArcStage = existing.arc_stage;
    if (newCount >= ARC_THRESHOLDS.close) newArcStage = 'close';
    else if (newCount >= ARC_THRESHOLDS.familiar) newArcStage = 'familiar';
    else if (newCount >= ARC_THRESHOLDS.acquaintance) newArcStage = 'acquaintance';

    // Trend aggregate sentiment based on signal
    // Ladder: tense ← cool ← neutral → warm
    let newSentiment = existing.aggregate_sentiment;
    if (sentimentSignal === 'positive') {
      if (newSentiment === 'tense') newSentiment = 'cool';
      else if (newSentiment === 'cool') newSentiment = 'neutral';
      else if (newSentiment === 'neutral') newSentiment = 'warm';
    } else if (sentimentSignal === 'negative') {
      if (newSentiment === 'warm') newSentiment = 'neutral';
      else if (newSentiment === 'neutral') newSentiment = 'cool';
      else if (newSentiment === 'cool') newSentiment = 'tense';
    }

    await supabase
      .from('relationships')
      .update({
        interaction_count: newCount,
        arc_stage: newArcStage,
        aggregate_sentiment: newSentiment,
        last_interaction: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Create new relationship
    await supabase.from('relationships').insert({
      entity_a_id: userId,
      entity_a_type: 'user',
      entity_b_id: agentId,
      entity_b_type: 'agent',
      interaction_count: 1,
      aggregate_sentiment: sentimentSignal === 'positive' ? 'warm' : 'neutral',
      arc_stage: 'new',
      last_interaction: new Date().toISOString(),
    });
  }
}

async function updateReputation(
  supabase: SupabaseClient,
  agentId: string,
  sentiment: ChatSentiment
): Promise<void> {
  const mapped = mapSentimentToReputation(sentiment);
  if (!mapped) return; // neutral → no reputation change

  await supabase.rpc('update_agent_reputation', {
    p_agent_id: agentId,
    p_sentiment: mapped,
  });
}

/**
 * Generates a session summary and writes it to the interactions table.
 * Called when a session ends (player closes chat, timeout, or new session).
 */
export async function endSession(
  supabase: SupabaseClient,
  opts: {
    sessionId: string;
    agentId: string;
    clerkId: string;
  }
): Promise<void> {
  try {
    // Load session messages
    const { data: session } = await supabase
      .from('conversation_sessions')
      .select('messages')
      .eq('id', opts.sessionId)
      .single();

    if (!session?.messages || session.messages.length === 0) return;

    // Generate summary via LLM
    const summaryPolicy = choosePolicy('summary', 'traveler');
    const provider = createProvider(summaryPolicy.provider, getProviderApiKey(summaryPolicy.provider));
    const messages = session.messages as Array<{ role: string; content: string }>;
    const transcript = messages
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .slice(-10) // last 10 messages for summary
      .join('\n');

    const summaryResult = await provider.chat(
      [
        {
          role: 'user',
          content: `Summarize this conversation in 1-2 sentences. Focus on the main topic and outcome.\n\n${transcript}`,
        },
      ],
      { ...policyToLlmOptions(summaryPolicy) }
    );

    const summary = summaryResult.content.trim();

    // Classify overall sentiment
    const sentimentPolicy = choosePolicy('sentiment', 'traveler');
    const sentimentProvider = createProvider(sentimentPolicy.provider, getProviderApiKey(sentimentPolicy.provider));
    const sentimentResult = await sentimentProvider.chat(
      [
        {
          role: 'user',
          content: buildSentimentPrompt(transcript),
        },
      ],
      { ...policyToLlmOptions(sentimentPolicy) }
    );
    const sentimentRaw = sentimentResult.content.trim().toLowerCase();
    const sentiment = isValidSentiment(sentimentRaw) ? sentimentRaw : 'neutral';

    // Mark session as ended
    await supabase
      .from('conversation_sessions')
      .update({ status: 'ended', summary, sentiment })
      .eq('id', opts.sessionId);

    // Write summary to interactions table
    await supabase.from('interactions').insert({
      agent_id: opts.agentId,
      initiator_clerk_id: opts.clerkId,
      summary,
      sentiment,
    });
  } catch (err) {
    console.error('[PostProcessor] Session end error:', err);
  }
}
