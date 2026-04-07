// src/lib/ai/groq.ts
// Groq implementation of the LLM provider interface.
// Uses Groq's OpenAI-compatible REST API for ultra-fast inference.
// Supports Llama, Mixtral, and other models hosted on Groq's LPU hardware.

import type { ChatMessage, LLMOptions, LLMProvider, LLMResponse } from './provider';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export class GroqProvider implements LLMProvider {
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

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const latency_ms = Date.now() - start;

    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('Groq returned no choices');
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
