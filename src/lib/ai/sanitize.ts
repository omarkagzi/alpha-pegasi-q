// src/lib/ai/sanitize.ts
// Strips embedded JSON fragments from LLM-generated prose text.
// Used at three layers: before DB storage, in ActivityFeed, and in worldEventRenderer.

/**
 * Remove JSON fragments that the narrator LLM sometimes embeds in
 * description or dialogue fields.
 *
 * Patterns caught:
 * - JSON arrays/objects with quoted keys: [{"agent_id":...}]
 * - Single-quoted JSON: [{'agent_id':...}]
 * - Unquoted keys: {agent_id: "..."}
 * - Markdown-fenced JSON: ```json ... ```
 *
 * Returns the prose portion before the JSON, trimmed.
 * Returns empty string if the entire text is JSON.
 */
export function sanitizeEventText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text;

  // Strip markdown-fenced code blocks containing JSON
  cleaned = cleaned.replace(/```json?\s*[\s\S]*?```/gi, '');

  // Strip JSON arrays: [...{...}...]
  cleaned = cleaned.replace(/\[?\s*\{["'a-z_][\s\S]*?\}\s*\]?/gi, (match) => {
    // Only strip if it looks like JSON (has key-value pairs)
    if (/["']?[a-z_]+["']?\s*:/i.test(match)) {
      return '';
    }
    return match;
  });

  // Trim trailing punctuation artifacts left after stripping
  cleaned = cleaned.replace(/[,;:\s]+$/, '');

  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
}
