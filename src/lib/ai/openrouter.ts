// src/lib/ai/openrouter.ts
// OpenRouter implementation of the LLM provider interface.
// Stub for future use — enables per-agent model diversity via OpenRouter's
// multi-model gateway (Gemini Flash, DeepSeek R1, Qwen Coder, Llama 4 Scout).

import type { ChatMessage, LLMOptions, LLMProvider, LLMResponse } from './provider';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';

export class OpenRouterProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const model = options?.model ?? DEFAULT_MODEL;

    const body = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature,
      max_tokens: options?.max_tokens,
      ...(options?.response_format === 'json' && {
        response_format: { type: 'json_object' },
      }),
    };

    const start = Date.now();

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://alpha-pegasi-q.vercel.app',
        'X-Title': 'Alpha Pegasi q',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const latency_ms = Date.now() - start;

    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('OpenRouter returned no choices');
    }

    return {
      content: choice.message?.content ?? '',
      usage: {
        prompt_tokens: data.usage?.prompt_tokens ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
      },
      latency_ms,
    };
  }
}
