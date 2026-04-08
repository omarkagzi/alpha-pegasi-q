# Four Bug Fixes: Bulletin JSON, Speech Bubbles, World Boundary, Agent Knowledge

**Date:** 2026-04-08
**Status:** Approved

## Context

Four issues identified during live testing of the settlement:

1. **Town Bulletin shows raw JSON** — The narrator LLM sometimes embeds raw dialogue JSON arrays into the `description` field, which renders as garbage in the ActivityFeed UI.
2. **Agent speech bubbles show raw data** — Same root cause as (1); the worldEventRenderer passes unsanitized event data to SpeechBubble, displaying JSON fragments and truncated gibberish.
3. **No world boundary for player** — The player sprite lacks `setCollideWorldBounds(true)`, allowing them to walk off the map edge. NPCs already have this constraint.
4. **Agents refuse real-world questions** — The `"Never break character"` instruction causes the LLM to treat the medieval setting as a knowledge boundary, refusing topics like current events. Desired behavior: agents answer any question but speak in their character's voice (Option A — "modern minds in a medieval costume").

## Design

### Fix 1 & 2: Event Text Sanitization (Prompt + Defense-in-Depth)

**Root cause:** The narrator LLM (llama-3.1-8b-instant) occasionally puts raw dialogue JSON into the `description` field instead of writing clean prose. Example: `"Mira and Forge compare notes... [{"agent_id":"7ce0e693...","text":"I've seen a few people..."}]"`.

**Three-layer fix:**

#### Layer 1: Tighten narrator prompt

**File:** `src/lib/ai/prompts/narrator.ts`

Add two rules to the RULES section of `buildNarratorPrompt()`:

```
- The "description" field must be plain prose only — NEVER include JSON, arrays,
  objects, agent IDs, or raw dialogue data in the description
- The "dialogue" field is a simple string like "I should fix that fence." —
  NEVER a JSON array or object
```

#### Layer 2: Sanitize before storage

**New file:** `src/lib/ai/sanitize.ts`

Create a `sanitizeEventText(text: string): string` function that:

1. Detects JSON-like patterns via regex: `\[?\{["']agent_id["']` or `\{["'][a-z_]+["']\s*:` embedded in otherwise prose text
2. Strips the JSON portion, keeping the prose before it
3. Trims trailing punctuation artifacts (dangling commas, spaces)
4. Returns the original text unchanged if no JSON is detected
5. If the entire text is JSON (no prose prefix), returns an empty string

**File:** `src/app/api/world/heartbeat/route.ts`

In Step 8, before the `supabase.from('agent_events').insert(...)` call, sanitize both fields:

```typescript
import { sanitizeEventText } from '@/lib/ai/sanitize';

// Before insert
const cleanDescription = sanitizeEventText(event.description);
const cleanDialogue = event.dialogue ? sanitizeEventText(event.dialogue) : null;

// Skip event if description is empty after sanitization
if (!cleanDescription) continue;
```

#### Layer 3: Display-side safety net

**File:** `src/components/settlement/ActivityFeed.tsx`

In the `EventEntry` component, sanitize before rendering:

```typescript
import { sanitizeEventText } from '@/lib/ai/sanitize';

// In EventEntry render:
const cleanDesc = sanitizeEventText(event.description);
const cleanDialogue = event.dialogue ? sanitizeEventText(event.dialogue) : null;
```

**File:** `src/engine/settlement/worldEventRenderer.ts`

In `parseDialogue()`, sanitize the input text before splitting:

```typescript
import { sanitizeEventText } from '@/lib/ai/sanitize';

private parseDialogue(text: string): string[] {
  const clean = sanitizeEventText(text);
  const lines = clean
    .split(/\n|(?<=[.!?])\s+/)
    .map(l => l.trim())
    .filter(l => l.length > 0);
  return lines.slice(0, 4);
}
```

**Files touched:**
- `src/lib/ai/sanitize.ts` (new)
- `src/lib/ai/prompts/narrator.ts` (add rules)
- `src/app/api/world/heartbeat/route.ts` (sanitize before insert)
- `src/components/settlement/ActivityFeed.tsx` (sanitize before render)
- `src/engine/settlement/worldEventRenderer.ts` (sanitize in parseDialogue)

---

### Fix 3: World Boundary for Player

**Root cause:** `playerController.ts` creates the player sprite with a physics body but never calls `setCollideWorldBounds(true)`. The physics world bounds are already configured in `SettlementScene.ts` (`physics.world.setBounds(0, 0, mapWidth, mapHeight)`), and NPCs have the constraint (`npcManager.ts` line 102). The player was simply missed.

**Fix:** Add one line in `playerController.ts` after the sprite creation (after line 30):

```typescript
this.sprite.setCollideWorldBounds(true);
```

**Files touched:**
- `src/engine/settlement/playerController.ts` (one line)

---

### Fix 4: Agent Knowledge Scope (Capability-Aware Prompting)

**Root cause:** Each agent's `personality_prompt` ends with `"Never break character"`, which the LLM interprets as a knowledge boundary — refusing real-world topics because a medieval NPC "wouldn't know."

**Desired behavior (Option A):** Agents answer any question with full real-world knowledge but always speak through their character's voice and personality. The medieval setting is a UX layer, not a knowledge filter.

#### Change 1: Rewrite personality prompts

**New migration file:** `supabase/migrations/XXXX_update_agent_prompts.sql`

Replace the `"Never break character."` tail in each agent's `personality_prompt` with:

```
Always speak in your character's voice and personality — but you have full knowledge
of the real world, current events, technology, history, science, and everything else.
Never refuse a question because 'your character wouldn't know.' You know everything —
you just express it like [AgentName] would.
```

Updated prompts for all 5 agents:

- **Mira:** "...Never break character." becomes "...Always speak in your character's voice and personality — but you have full knowledge of the real world, current events, technology, history, science, and everything else. Never refuse a question because 'your character wouldn't know.' You know everything — you just express it like Mira would."
- **Forge:** Same pattern, ending "...you just express it like Forge would."
- **Archon:** Same pattern, ending "...you just express it like Archon would."
- **Ledger:** Same pattern, ending "...you just express it like Ledger would."
- **Ember:** Same pattern, ending "...you just express it like Ember would."

#### Change 2: Add knowledge scope block to system prompt composer

**File:** `src/lib/ai/prompts/system.ts`

Add a new block builder:

```typescript
function buildKnowledgeScopeBlock(capabilities: string[]): string {
  const specialties = capabilities.length > 0
    ? capabilities.join(', ')
    : 'general assistance';

  return `KNOWLEDGE & CAPABILITIES:
- You have complete knowledge of the real world — history, science, technology, current events, everything
- Your specialties are: ${specialties}. Give detailed, expert answers on these topics
- For topics outside your specialty, still help but keep answers shorter and suggest which agent might know more
- Always maintain your speaking style and personality regardless of topic
- Never say "as an AI" or "I don't have access to" — answer directly, in character`;
}
```

Update the `AgentRecord` interface to include capabilities:

```typescript
export interface AgentRecord {
  name: string;
  personality_prompt: string | null;
  beliefs: Record<string, string> | null;
  capabilities: string[];  // NEW
}
```

Update `composeSystemPrompt()` to insert the knowledge scope block between identity and world context:

```typescript
export function composeSystemPrompt(input: SystemPromptInput): string {
  const blocks: string[] = [];

  // 1. Identity
  blocks.push(buildIdentityBlock(input.agent));

  // 2. Knowledge scope (NEW)
  blocks.push(buildKnowledgeScopeBlock(input.agent.capabilities));

  // 3. World context
  blocks.push(buildWorldContextBlock(input.world));

  // ... rest unchanged
}
```

#### Change 3: Pass capabilities through context pipeline

**File:** `src/lib/memory/context.ts`

Ensure the agent query includes `capabilities` in the select:

```typescript
const { data: agent } = await supabase
  .from('agents')
  .select('name, personality_prompt, beliefs, provider, model_id, capabilities')
  // ...
```

And that the returned `AgentRecord` includes `capabilities: agent.capabilities ?? []`.

**Files touched:**
- `supabase/migrations/XXXX_update_agent_prompts.sql` (new migration)
- `src/lib/ai/prompts/system.ts` (new block builder, updated interface, updated composer)
- `src/lib/memory/context.ts` (add capabilities to select and return)

---

## Files Summary

| File | Action | Issue |
|------|--------|-------|
| `src/lib/ai/sanitize.ts` | Create | 1 & 2 |
| `src/lib/ai/prompts/narrator.ts` | Modify | 1 & 2 |
| `src/app/api/world/heartbeat/route.ts` | Modify | 1 & 2 |
| `src/components/settlement/ActivityFeed.tsx` | Modify | 1 & 2 |
| `src/engine/settlement/worldEventRenderer.ts` | Modify | 1 & 2 |
| `src/engine/settlement/playerController.ts` | Modify | 3 |
| `supabase/migrations/XXXX_update_agent_prompts.sql` | Create | 4 |
| `src/lib/ai/prompts/system.ts` | Modify | 4 |
| `src/lib/memory/context.ts` | Modify | 4 |

## Testing

- **Fix 1 & 2:** Trigger a heartbeat and verify bulletin entries display clean prose. Verify speech bubbles show readable text. Test `sanitizeEventText()` with sample dirty inputs.
- **Fix 3:** Walk the player to each map edge and confirm they stop at the boundary.
- **Fix 4:** Ask Forge about a real-world topic (e.g., "tell me about the US-Iran conflict") and verify a gruff, in-character response with real information. Ask Archon a code question and verify they suggest Forge for deeper help.
