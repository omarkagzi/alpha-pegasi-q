export type Feature = 'chat' | 'heartbeat' | 'journal' | 'summary' | 'sentiment';
export type Tier = 'traveler' | 'steward';

export interface LlmPolicy {
  provider: 'groq' | 'gemini' | 'openrouter';
  model: string;
  maxTokens: number;
  temperature: number;
  responseFormat: 'text' | 'json';
  fallbackProvider: 'groq' | 'gemini' | 'openrouter';
  fallbackModel: string;
}

/**
 * Policy table: defines provider, model, and limits for every feature×tier combination.
 * Background features (heartbeat, journal, summary, sentiment) always use the cheapest model
 * regardless of tier — they are system costs, not user-facing quality differentiators.
 */
const POLICY_TABLE: Record<Feature, Record<Tier, LlmPolicy>> = {
  chat: {
    traveler: {
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      maxTokens: 1024,
      temperature: 0.7,
      responseFormat: 'text',
      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-2.0-flash',
    },
    steward: {
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      maxTokens: 2048,
      temperature: 0.7,
      responseFormat: 'text',
      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-2.0-flash',
    },
  },
  heartbeat: {
    traveler: {
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      maxTokens: 512,
      temperature: 0.8,
      responseFormat: 'json',
      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-2.0-flash',
    },
    steward: {
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      maxTokens: 512,
      temperature: 0.8,
      responseFormat: 'json',
      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-2.0-flash',
    },
  },
  journal: {
    traveler: {
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      maxTokens: 768,
      temperature: 0.7,
      responseFormat: 'text',
      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-2.0-flash',
    },
    steward: {
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      maxTokens: 768,
      temperature: 0.7,
      responseFormat: 'text',
      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-2.0-flash',
    },
  },
  summary: {
    traveler: {
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      maxTokens: 512,
      temperature: 0.3,
      responseFormat: 'text',
      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-2.0-flash',
    },
    steward: {
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      maxTokens: 512,
      temperature: 0.3,
      responseFormat: 'text',
      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-2.0-flash',
    },
  },
  sentiment: {
    traveler: {
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      maxTokens: 128,
      temperature: 0.1,
      responseFormat: 'json',
      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-2.0-flash',
    },
    steward: {
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      maxTokens: 128,
      temperature: 0.1,
      responseFormat: 'json',
      fallbackProvider: 'gemini',
      fallbackModel: 'gemini-2.0-flash',
    },
  },
};

/**
 * Returns the LLM policy for a given feature and user tier.
 * This is the ONLY function that should decide which provider/model to use.
 * All LLM calls must go through this — no hardcoded provider choices in route handlers.
 */
export function choosePolicy(feature: Feature, tier: Tier): LlmPolicy {
  return POLICY_TABLE[feature][tier];
}

/**
 * Helper: resolves the API key for a provider from environment variables.
 * Centralizes the env var → key mapping that was previously in chat/route.ts.
 */
export function getProviderApiKey(provider: 'groq' | 'gemini' | 'openrouter'): string {
  switch (provider) {
    case 'groq':
      return process.env.GROQ_API_KEY ?? '';
    case 'gemini':
      return process.env.GEMINI_API_KEY ?? '';
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY ?? '';
  }
}

/**
 * Helper: converts policy fields to the LLMOptions shape used by provider.chat().
 * Policy uses camelCase (maxTokens), LLMOptions uses snake_case (max_tokens).
 */
export function policyToLlmOptions(policy: LlmPolicy) {
  return {
    model: policy.model,
    temperature: policy.temperature,
    max_tokens: policy.maxTokens,
    response_format: policy.responseFormat as 'text' | 'json',
  };
}
