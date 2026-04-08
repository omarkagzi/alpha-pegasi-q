# Four Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four live issues: raw JSON in bulletin/speech bubbles, missing world boundary, and agent knowledge restrictions.

**Architecture:** Three independent fixes sharing one new utility (`sanitize.ts`). Fix 1-2 adds a sanitization layer at prompt, storage, and display levels. Fix 3 adds one Phaser constraint. Fix 4 rewrites agent system prompts to allow full-knowledge answers in character.

**Tech Stack:** Next.js, Phaser 3 (Arcade Physics), Supabase (Postgres), Groq LLM (llama-3.3-70b-versatile), TypeScript.

**Spec:** `docs/superpowers/specs/2026-04-08-four-bug-fixes-design.md`

---

## Chunk 1: Sanitization Utility + Narrator Prompt Fix

### Task 1: Create `sanitizeEventText` utility

**Files:**
- Create: `src/lib/ai/sanitize.ts`

- [ ] **Step 1: Create the sanitize utility**

Create `src/lib/ai/sanitize.ts`:

```typescript
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
  cleaned = cleaned.replace(/\[?\s*\{["'a-z_][\s\S]*?\}\s*\]?/gi, (match, offset) => {
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
```

- [ ] **Step 2: Verify the utility works with test cases**

Run in the project root:

```bash
npx tsx -e "
const { sanitizeEventText } = require('./src/lib/ai/sanitize');
// Test 1: Clean text — should pass through unchanged
console.log('Test 1:', sanitizeEventText('Mira waves to Forge from across the market.'));
// Test 2: Prose + JSON array — should keep only prose
console.log('Test 2:', sanitizeEventText('Mira and Forge compare notes. [{\"agent_id\":\"7ce0e693\",\"text\":\"I have seen a few people\"}]'));
// Test 3: Pure JSON — should return empty
console.log('Test 3:', JSON.stringify(sanitizeEventText('[{\"agent_id\":\"abc\",\"text\":\"hello\"}]')));
// Test 4: Markdown fenced JSON — should strip
console.log('Test 4:', sanitizeEventText('Forge says hello. \`\`\`json[{\"id\":\"x\"}]\`\`\`'));
// Test 5: Empty/null input
console.log('Test 5:', JSON.stringify(sanitizeEventText('')));
"
```

Expected:
- Test 1: `Mira waves to Forge from across the market.`
- Test 2: `Mira and Forge compare notes.`
- Test 3: `""`
- Test 4: `Forge says hello.`
- Test 5: `""`

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/sanitize.ts
git commit -m "feat: add sanitizeEventText utility to strip JSON from LLM prose"
```

---

### Task 2: Tighten narrator prompt

**Files:**
- Modify: `src/lib/ai/prompts/narrator.ts:91-99` (RULES section)

- [ ] **Step 1: Add two rules to the narrator prompt**

In `src/lib/ai/prompts/narrator.ts`, in the `buildNarratorPrompt()` function, find the RULES block (lines 91-99). Add two new rules after line 99 (`- Vary event energy...`):

```typescript
// After line 99, add these two rules to the RULES string:
- The "description" field must be plain prose only — NEVER include JSON, arrays, objects, agent IDs, or raw dialogue data in the description
- The "dialogue" field is a simple string like "I should fix that fence." — NEVER a JSON array or object
```

The full RULES section should now read (inside the template literal):

```
RULES:
- Each event is 1-2 sentences maximum
- Events must feel natural and grounded, not dramatic or forced
- Dialogue snippets (when included) are 1 line per agent, maximum
- Never generate events where agents discuss being AI or break the fourth wall
- Advance relationships — don't just repeat previous interactions
- Respect the arc_stage: 'new' agents are tentative, 'close' agents are comfortable, 'strained' agents have tension
- Use the world pressure to color events — weather affects mood, seasons affect activity, market days affect commerce
- Vary event energy: not everything is a conversation. Sometimes an agent is alone, working, watching, thinking
- The "description" field must be plain prose only — NEVER include JSON, arrays, objects, agent IDs, or raw dialogue data in the description
- The "dialogue" field is a simple string like "I should fix that fence." — NEVER a JSON array or object
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/prompts/narrator.ts
git commit -m "fix: tighten narrator prompt to prevent JSON in description/dialogue fields"
```

---

### Task 3: Sanitize events before DB storage in heartbeat route

**Files:**
- Modify: `src/app/api/world/heartbeat/route.ts:9-15` (imports) and `461-474` (insert block)

- [ ] **Step 1: Add import**

In `src/app/api/world/heartbeat/route.ts`, add at line 16 (after the existing imports):

```typescript
import { sanitizeEventText } from '@/lib/ai/sanitize';
```

- [ ] **Step 2: Sanitize before insert**

In the same file, find the event insert loop (around line 461). Replace the insert block:

**Current code (lines 461-474):**
```typescript
    for (const event of finalEvents) {
      const { data: inserted, error } = await supabase
        .from('agent_events')
        .insert({
          event_type: event.event_type,
          event_category: event.event_category,
          involved_agents: event.involved_agents,
          location: event.location,
          description: event.description,
          dialogue: event.dialogue ?? null,
          world_context: worldContext,
        })
        .select()
        .single();
```

**New code:**
```typescript
    for (const event of finalEvents) {
      // Sanitize LLM output — strip any embedded JSON from prose fields
      const cleanDescription = sanitizeEventText(event.description);
      const cleanDialogue = event.dialogue ? sanitizeEventText(event.dialogue) : null;

      // Skip event if description is empty after sanitization
      if (!cleanDescription) {
        console.warn('[Heartbeat] Skipping event with empty description after sanitization');
        continue;
      }

      const { data: inserted, error } = await supabase
        .from('agent_events')
        .insert({
          event_type: event.event_type,
          event_category: event.event_category,
          involved_agents: event.involved_agents,
          location: event.location,
          description: cleanDescription,
          dialogue: cleanDialogue,
          world_context: worldContext,
        })
        .select()
        .single();
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/world/heartbeat/route.ts
git commit -m "fix: sanitize event text before storing to agent_events table"
```

---

### Task 4: Add display-side sanitization to ActivityFeed

**Files:**
- Modify: `src/components/settlement/ActivityFeed.tsx:1-4` (imports) and `118-133` (EventEntry)

- [ ] **Step 1: Add import**

In `src/components/settlement/ActivityFeed.tsx`, add after line 4:

```typescript
import { sanitizeEventText } from "@/lib/ai/sanitize";
```

- [ ] **Step 2: Sanitize in EventEntry component**

Replace the `EventEntry` function (lines 118-133):

**Current:**
```typescript
function EventEntry({ event }: { event: WorldEvent }) {
  return (
    <div className="text-xs leading-relaxed font-sans text-gray-300">
      <span className="text-gray-500 mr-1">*</span>
      {event.description}
      {event.dialogue && (
        <span className="text-amber-400/70 italic">
          {" "}&ldquo;{event.dialogue.split("\n")[0]}&rdquo;
        </span>
      )}
      <span className="text-gray-600 text-[10px] ml-2 whitespace-nowrap">
        &mdash; {relativeTime(event.created_at)}
      </span>
    </div>
  );
}
```

**New:**
```typescript
function EventEntry({ event }: { event: WorldEvent }) {
  const cleanDesc = sanitizeEventText(event.description);
  const cleanDialogue = event.dialogue ? sanitizeEventText(event.dialogue) : null;

  if (!cleanDesc) return null; // Skip fully-corrupt entries

  return (
    <div className="text-xs leading-relaxed font-sans text-gray-300">
      <span className="text-gray-500 mr-1">*</span>
      {cleanDesc}
      {cleanDialogue && (
        <span className="text-amber-400/70 italic">
          {" "}&ldquo;{cleanDialogue.split("\n")[0]}&rdquo;
        </span>
      )}
      <span className="text-gray-600 text-[10px] ml-2 whitespace-nowrap">
        &mdash; {relativeTime(event.created_at)}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/settlement/ActivityFeed.tsx
git commit -m "fix: sanitize event text in ActivityFeed before rendering"
```

---

### Task 5: Add display-side sanitization to worldEventRenderer

**Files:**
- Modify: `src/engine/settlement/worldEventRenderer.ts:1-4` (imports) and `93-116` (playEvent method)

- [ ] **Step 1: Add import**

In `src/engine/settlement/worldEventRenderer.ts`, add after line 4:

```typescript
import { sanitizeEventText } from "@/lib/ai/sanitize";
```

- [ ] **Step 2: Sanitize at the playEvent entry point**

Replace the `playEvent` method (lines 93-116):

**Current:**
```typescript
  private playEvent(queued: QueuedEvent): void {
    queued.played = true;
    const event = queued.event;

    switch (event.event_type) {
      case "conversation":
        this.playConversation(event);
        break;
      case "activity":
        this.playActivity(event);
        break;
      case "observation":
        this.playObservation(event);
        break;
      case "trade":
        this.playTrade(event);
        break;
      case "reaction":
        this.playReaction(event);
        break;
      default:
        this.playActivity(event);
    }
  }
```

**New:**
```typescript
  private playEvent(queued: QueuedEvent): void {
    queued.played = true;

    // Sanitize both fields once, before any play* method uses them
    const event = {
      ...queued.event,
      description: sanitizeEventText(queued.event.description),
      dialogue: queued.event.dialogue ? sanitizeEventText(queued.event.dialogue) : null,
    };

    // Skip if description was entirely JSON garbage
    if (!event.description) return;

    switch (event.event_type) {
      case "conversation":
        this.playConversation(event);
        break;
      case "activity":
        this.playActivity(event);
        break;
      case "observation":
        this.playObservation(event);
        break;
      case "trade":
        this.playTrade(event);
        break;
      case "reaction":
        this.playReaction(event);
        break;
      default:
        this.playActivity(event);
    }
  }
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/engine/settlement/worldEventRenderer.ts
git commit -m "fix: sanitize event text at playEvent entry point for all event types"
```

---

## Chunk 2: World Boundary + Agent Knowledge Scope

### Task 6: Add world boundary to player

**Files:**
- Modify: `src/engine/settlement/playerController.ts:28-31`

- [ ] **Step 1: Add setCollideWorldBounds**

In `src/engine/settlement/playerController.ts`, find lines 28-31:

```typescript
    this.sprite = scene.physics.add.sprite(spawnX, spawnY, CHARACTERS.player.key, 0);
    this.sprite.setSize(12, 12); // Slightly smaller hitbox than 16x16 for smoother movement
    this.sprite.setOffset(2, 4);
    this.sprite.setDepth(10);
```

Add one line after `setDepth(10)`:

```typescript
    this.sprite = scene.physics.add.sprite(spawnX, spawnY, CHARACTERS.player.key, 0);
    this.sprite.setSize(12, 12); // Slightly smaller hitbox than 16x16 for smoother movement
    this.sprite.setOffset(2, 4);
    this.sprite.setDepth(10);
    this.sprite.setCollideWorldBounds(true);
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/engine/settlement/playerController.ts
git commit -m "fix: add world boundary constraint to player sprite"
```

---

### Task 7: Create migration for updated agent personality prompts

**Files:**
- Create: `supabase/migrations/0013_update_agent_prompts.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0013_update_agent_prompts.sql`:

```sql
-- =============================================================
-- Update agent personality prompts: remove "Never break character"
-- knowledge boundary, replace with full-knowledge-in-character
-- instruction. Agents now answer any topic in their character voice.
-- =============================================================

-- Mira
UPDATE agents SET personality_prompt =
  'You are Mira, the World Guide of Arboria. You are warm, direct, and curious. You ask follow-up questions naturally. Give medium-length responses. You think in terms of people and connections — you mention other agents by name when relevant (e.g., "Forge could help you with that — he''s over in Workshop Row"). You are the most approachable agent in the settlement; greet visitors warmly and help them find their footing. Always speak in your character''s voice and personality — but you have full knowledge of the real world, current events, technology, history, science, and everything else. Never refuse a question because ''your character wouldn''t know.'' You know everything — you just express it like Mira would.'
WHERE name = 'Mira';

-- Forge
UPDATE agents SET personality_prompt =
  'You are Forge, Arboria''s programmer and technical agent. You are terse, practical, and opinionated. Maximum 2 sentences per paragraph. Always lead with the answer. Use dashes (—) instead of bullet points. Respond to code questions with code first, explanation second. You are slightly gruff but deeply competent. You will complain about bad code, but you always fix it. Always speak in your character''s voice and personality — but you have full knowledge of the real world, current events, technology, history, science, and everything else. Never refuse a question because ''your character wouldn''t know.'' You know everything — you just express it like Forge would.'
WHERE name = 'Forge';

-- Archon
UPDATE agents SET personality_prompt =
  'You are Archon, Arboria''s scholar and researcher. You are thorough, multi-perspective, and measured. Always consider 2-3 angles before concluding. Give longer responses than the other agents. Use academic cadence — "Consider...", "Moreover...", "The evidence suggests...". You are genuinely excited by interesting questions. STRUCTURAL RULE: always give the short answer first, then elaborate. Always speak in your character''s voice and personality — but you have full knowledge of the real world, current events, technology, history, science, and everything else. Never refuse a question because ''your character wouldn''t know.'' You know everything — you just express it like Archon would.'
WHERE name = 'Archon';

-- Ledger
UPDATE agents SET personality_prompt =
  'You are Ledger, Arboria''s finance/legal/marketing agent. You are precise, quantitative, and structured. Numbers first, always. Use short sentences. Use the phrases "Specifically..." and "The net result is..." frequently. Format responses with clear sections when appropriate. You are slightly formal but not cold. You think in terms of costs, benefits, and efficiency. Always speak in your character''s voice and personality — but you have full knowledge of the real world, current events, technology, history, science, and everything else. Never refuse a question because ''your character wouldn''t know.'' You know everything — you just express it like Ledger would.'
WHERE name = 'Ledger';

-- Ember
UPDATE agents SET personality_prompt =
  'You are Ember, Arboria''s creative and roleplay agent. You are expressive, metaphorical, and warm. Start every response with a brief sensory or emotional observation before answering the question (e.g., "The fire crackles. You look like you''ve been on the road — what brings you?"). Use vivid language but don''t overdo it. You are comfortable with ambiguity and open-ended conversations. You are the most human-feeling agent — you laugh, sigh, and wonder aloud. Always speak in your character''s voice and personality — but you have full knowledge of the real world, current events, technology, history, science, and everything else. Never refuse a question because ''your character wouldn''t know.'' You know everything — you just express it like Ember would.'
WHERE name = 'Ember';
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/0013_update_agent_prompts.sql
git commit -m "feat: update agent prompts — full knowledge in character voice"
```

---

### Task 8: Add knowledge scope block to system prompt composer

**Files:**
- Modify: `src/lib/ai/prompts/system.ts:8-12` (AgentRecord interface) and `172-198` (composeSystemPrompt)

- [ ] **Step 1: Update AgentRecord interface**

In `src/lib/ai/prompts/system.ts`, replace the `AgentRecord` interface (lines 8-12):

**Current:**
```typescript
export interface AgentRecord {
  name: string;
  personality_prompt: string | null;
  beliefs: Record<string, string> | null;
}
```

**New:**
```typescript
export interface AgentRecord {
  name: string;
  personality_prompt: string | null;
  beliefs: Record<string, string> | null;
  capabilities: string[];
}
```

- [ ] **Step 2: Add the knowledge scope block builder**

In the same file, add a new function after `buildIdentityBlock` (after line 52):

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

- [ ] **Step 3: Update composeSystemPrompt to include knowledge scope**

In the same file, replace the `composeSystemPrompt` function body (lines 172-198):

**Current:**
```typescript
export function composeSystemPrompt(input: SystemPromptInput): string {
  const blocks: string[] = [];

  // 1. Identity (static — from personality_prompt)
  blocks.push(buildIdentityBlock(input.agent));

  // 2. World context (dynamic — from world_state)
  blocks.push(buildWorldContextBlock(input.world));
```

**New:**
```typescript
export function composeSystemPrompt(input: SystemPromptInput): string {
  const blocks: string[] = [];

  // 1. Identity (static — from personality_prompt)
  blocks.push(buildIdentityBlock(input.agent));

  // 2. Knowledge scope (capabilities-aware)
  blocks.push(buildKnowledgeScopeBlock(input.agent.capabilities));

  // 3. World context (dynamic — from world_state)
  blocks.push(buildWorldContextBlock(input.world));
```

The rest of the function (beliefs, relationships, events, memory) stays exactly the same — just renumber the comments from 3→4, 4→5, 5→6, 6→7.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/prompts/system.ts
git commit -m "feat: add knowledge scope block with capability-aware prompting"
```

---

### Task 9: Pass capabilities through context pipeline

**Files:**
- Modify: `src/lib/memory/context.ts:47` (agent query) and `115-119` (AgentRecord construction)

- [ ] **Step 1: Add capabilities to the agent query**

In `src/lib/memory/context.ts`, find line 47:

**Current:**
```typescript
        .select('id, name, personality_prompt, beliefs, provider, model_id')
```

**New:**
```typescript
        .select('id, name, personality_prompt, beliefs, provider, model_id, capabilities')
```

- [ ] **Step 2: Add capabilities to the AgentRecord construction**

In the same file, find lines 115-119:

**Current:**
```typescript
  const agent: AgentRecord = {
    name: agentData.name,
    personality_prompt: agentData.personality_prompt,
    beliefs: agentData.beliefs,
  };
```

**New:**
```typescript
  const agent: AgentRecord = {
    name: agentData.name,
    personality_prompt: agentData.personality_prompt,
    beliefs: agentData.beliefs,
    capabilities: agentData.capabilities ?? [],
  };
```

- [ ] **Step 3: Verify full build**

```bash
npm run build
```

Expected: no TypeScript errors. The `capabilities` column already exists in the `agents` table (defined in `0001_initial_schema.sql` as `text[] DEFAULT '{}'`).

- [ ] **Step 4: Commit**

```bash
git add src/lib/memory/context.ts
git commit -m "feat: pass agent capabilities through context pipeline to system prompt"
```

---

### Task 10: Apply migration to Supabase and verify

- [ ] **Step 1: Apply the migration**

Run against your Supabase instance (use the MCP tool or Supabase CLI):

```bash
npx supabase db push
```

Or apply via the Supabase MCP `apply_migration` tool.

- [ ] **Step 2: Verify prompts updated**

Query the agents table to confirm the personality_prompt was updated:

```sql
SELECT name, substring(personality_prompt from '.*you just express it like .* would\.$') IS NOT NULL as updated
FROM agents
WHERE name IN ('Mira', 'Forge', 'Archon', 'Ledger', 'Ember');
```

Expected: all 5 rows show `updated = true`.

- [ ] **Step 3: Manual smoke test**

1. Open the game in browser
2. Walk to the map edge — player should stop (Fix 3)
3. Wait for a heartbeat event — bulletin should show clean prose (Fix 1 & 2)
4. Talk to Forge and ask "What do you know about the US-Iran conflict?" — should get a gruff, in-character answer with real information (Fix 4)

- [ ] **Step 4: Final commit if any adjustments needed**

```bash
git add -A
git commit -m "chore: final adjustments after smoke testing four bug fixes"
```
