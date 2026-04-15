// src/lib/ai/provider.ts
// Thin LLM provider abstraction — all agent features call this interface.

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: 'text' | 'json';
}

export interface LLMResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  latency_ms: number;
}

export interface LLMProvider {
  chat(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResponse>;
}

// Lazy imports to avoid loading unused provider SDKs
export function createProvider(
  provider: 'gemini' | 'openrouter' | 'groq',
  apiKey: string
): LLMProvider {
  switch (provider) {
    case 'gemini': {
      const { GeminiProvider } = require('./gemini');
      return new GeminiProvider(apiKey);
    }
    case 'openrouter': {
      const { OpenRouterProvider } = require('./openrouter');
      return new OpenRouterProvider(apiKey);
    }
    case 'groq': {
      const { GroqProvider } = require('./groq');
      return new GroqProvider(apiKey);
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
