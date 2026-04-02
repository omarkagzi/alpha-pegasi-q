// src/lib/ai/gemini.ts
// Google Gemini API implementation of the LLM provider interface.
// Uses @google/generative-ai SDK. Handles role mapping, token counting,
// and latency tracking.

import {
  GoogleGenerativeAI,
  type Content,
  type GenerateContentResult,
} from '@google/generative-ai';
import type { ChatMessage, LLMOptions, LLMProvider, LLMResponse } from './provider';

const DEFAULT_MODEL = 'gemini-2.0-flash';

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async chat(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const model = options?.model ?? DEFAULT_MODEL;

    // Separate system message from conversation history
    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    // Map to Gemini content format — Gemini uses 'user' and 'model' roles
    const contents: Content[] = conversationMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const generativeModel = this.client.getGenerativeModel({
      model,
      systemInstruction: systemMessage ? { role: 'user', parts: [{ text: systemMessage.content }] } : undefined,
      generationConfig: {
        temperature: options?.temperature,
        maxOutputTokens: options?.max_tokens,
        responseMimeType: options?.response_format === 'json' ? 'application/json' : undefined,
      },
    });

    const start = Date.now();
    let result: GenerateContentResult;

    try {
      result = await generativeModel.generateContent({ contents });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Gemini API error: ${message}`);
    }

    const latency_ms = Date.now() - start;
    const response = result.response;
    const content = response.text();
    const usage = response.usageMetadata;

    return {
      content,
      usage: {
        prompt_tokens: usage?.promptTokenCount ?? 0,
        completion_tokens: usage?.candidatesTokenCount ?? 0,
      },
      latency_ms,
    };
  }
}
