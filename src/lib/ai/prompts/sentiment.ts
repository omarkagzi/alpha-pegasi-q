// src/lib/ai/prompts/sentiment.ts
// Sentiment classification prompt — classifies agent responses into one
// of six sentiment categories. Used in post-processing after each chat message.
// Uses gemini-2.0-flash-lite for cost efficiency.

export type ChatSentiment =
  | 'helpful'
  | 'friendly'
  | 'neutral'
  | 'confused'
  | 'frustrated'
  | 'concerned';

export function buildSentimentPrompt(agentResponse: string): string {
  return `Classify the sentiment of this agent response as one of:
helpful, friendly, neutral, confused, frustrated, concerned.
Return only the single word.

Agent response: "${agentResponse}"`;
}

/**
 * Maps the six-value chat sentiment to the two-value reputation input.
 * - helpful, friendly → 'positive'
 * - confused, frustrated, concerned → 'negative'
 * - neutral → null (skip reputation update)
 */
export function mapSentimentToReputation(
  sentiment: ChatSentiment
): 'positive' | 'negative' | null {
  switch (sentiment) {
    case 'helpful':
    case 'friendly':
      return 'positive';
    case 'confused':
    case 'frustrated':
    case 'concerned':
      return 'negative';
    case 'neutral':
      return null;
  }
}

/**
 * Maps chat sentiment to relationship sentiment signal.
 * - helpful, friendly → positive signal (trend toward 'warm')
 * - confused, frustrated, concerned → negative signal (trend toward 'cool')
 * - neutral → no change
 */
export function mapSentimentToRelationship(
  sentiment: ChatSentiment
): 'positive' | 'negative' | null {
  return mapSentimentToReputation(sentiment);
}

/**
 * Validates that a string is a valid ChatSentiment.
 */
export function isValidSentiment(value: string): value is ChatSentiment {
  return ['helpful', 'friendly', 'neutral', 'confused', 'frustrated', 'concerned'].includes(value);
}
