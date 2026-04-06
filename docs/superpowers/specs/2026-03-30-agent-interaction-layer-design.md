# Agent Interaction Layer Design Specification
**Phase 3 — Alpha Pegasi q**
**Date:** 2026-03-30
**Status:** Draft

---

## Overview

Phase 3 introduces the agent interaction layer — the system that makes Alpha Pegasi q a living world rather than a static pixel-art environment. It covers two interconnected systems:

1. **Human-to-Agent Conversation** — Players walk up to agents, press E, and have real LLM-backed conversations through a chat panel overlaid on the settlement view. Agents remember returning visitors, reference world events, and respond with distinct personalities. Players can attach files and use agents as functional AI assistants.

2. **Agent-to-Agent World Events** — A scheduled heartbeat system generates narrative events where agents interact with each other autonomously. These events render as visible activity in the settlement (speech bubbles, walking animations, emotes) and feed into a three-tier memory system that causes agents to evolve opinions, deepen relationships, and develop inner lives over time.

Both systems share infrastructure: the same LLM provider abstraction, the same context assembler, the same memory layer, and the same post-processing pipeline.

### Design Decisions (Agreed During Brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Chat style | Side panel, world-embedded, functional AI interface with pixel-art accents | World stays visible. Clean enough for real task work (code, documents). |
| Agent capabilities | Universally capable, differentiated by personality + model | No artificial routing/gating. Personality prompts and model selection create natural specialization. |
| Agent-to-agent interaction | Event-sourced via QStash heartbeat, narrator-generated | Cost-bounded (~300 automated calls/day). Serverless-compatible. No persistent process. |
| Memory model | 3-tier: event log, relationship graph, agent beliefs | Raw events feed relationships, relationships feed beliefs, beliefs feed conversations. Emergent depth. |
| Observability | Ambient Phaser visuals + Activity Feed + Agent Journals | Players discover world life by walking around, catch up via bulletin, deep-dive via journals. |
| LLM provider | Google Gemini API direct (gemini-2.0-flash + flash-lite) | 1,500 free requests/day. More generous than OpenRouter. Direct = lower latency. **PRD Amendment:** The PRD and Implementation Plan specify OpenRouter with per-agent model diversity (Gemini Flash, DeepSeek R1, Qwen Coder, Llama 4 Scout). This spec replaces that with Gemini direct + same-model-different-prompt strategy for cost and reliability reasons. The provider abstraction preserves the ability to reintroduce per-agent model diversity later. |
| Provider abstraction | Thin interface with swappable implementations | Start Gemini, swap per-agent to OpenRouter/DeepSeek later without code changes. |
| Hosting | Stay on Vercel + QStash + Supabase | Event-sourced heartbeat is serverless-compatible. No need to migrate to Render. |
| Personality differentiation | Structural constraints, banned words, few-shot examples, response length variation | Same cheap model powering all 5 agents. Prompt engineering, not model switching, creates distinct voices. |
| File handling | All agents accept all file types. Client-side extraction. No server storage. | No capability gating. Files processed in-flight and discarded. |

### Phase 2.5 Prerequisites

Phase 3 assumes the following Phase 2.5 work is complete before implementation begins:

- **Migration `0007_platform_agents.sql`** exists and has been applied — replaces the 3 demo agents (Mira, Sage, Vend) with the 5 platform agents (Mira, Forge, Archon, Ledger, Ember)
- **`personality_prompt` column** exists on the `agents` table (added by Phase 2.5 or by 0007). If Phase 2.5 does not add this column, the `0011_modify_agents_beliefs.sql` migration in this spec must be expanded to include `ADD COLUMN personality_prompt text`
- **Ambient NPCs, lots, audio, and UI reskin** are complete per the Phase 2.5 scope in the Implementation Plan

### What This Spec Does NOT Cover

- Agent registration flow (Phase 4)
- World Credits / economy (Phase 4)
- Stripe integration (Phase 4)
- Mobile responsive layout (Phase 5)
- Admin panel (Phase 5)
- Voice interaction (out of MVP scope)
- Agent-to-agent real API calls (out of MVP scope — events are narrator-generated, not agent-initiated)

---

## Section 1: Database Schema Changes

Phase 3 adds 3 new tables and modifies 1 existing table. All existing tables (`users`, `agents`, `interactions`, `world_state`, `properties`, `world_credit_ledger`) remain unchanged except where noted.

### 1.1 Modified Table: `agents`

Add columns to the existing `agents` table. If Phase 2.5 has NOT already added `personality_prompt`, include it here:

```sql
-- Migration: 0011_modify_agents_beliefs.sql

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS personality_prompt text,
  ADD COLUMN beliefs jsonb DEFAULT '{}',
  ADD COLUMN last_heartbeat timestamp,
  ADD COLUMN provider text DEFAULT 'gemini',
  ADD COLUMN model_id text DEFAULT 'gemini-2.0-flash';

COMMENT ON COLUMN agents.beliefs IS 'Tier 3 memory: evolving worldview, opinions about other agents, mood, current concerns. Updated once per game day by the belief update cycle.';
COMMENT ON COLUMN agents.last_heartbeat IS 'Timestamp of the last world heartbeat event this agent participated in. Used for fair scheduling.';
COMMENT ON COLUMN agents.provider IS 'LLM provider identifier. One of: gemini, openrouter, deepseek. Default gemini for all platform agents.';
COMMENT ON COLUMN agents.model_id IS 'Specific model identifier within the provider. Default gemini-2.0-flash.';
```

**Beliefs jsonb structure:**

```json
{
  "about_world": "The harvest has been good this autumn. More visitors lately.",
  "about_forge": "Reliable. Good with his hands. A bit stubborn about materials.",
  "about_mira": "Warm. Good with people. Sometimes coddles visitors too much.",
  "about_archon": "Bookish, but his structural analysis was sound.",
  "about_ember": "New — haven't interacted much yet. She seems creative.",
  "about_ledger": "All numbers, that one. Professional.",
  "about_self": "I build things. That's what matters. Wish the settlement appreciated the craft more.",
  "current_concern": "The eastern wall needs repair before winter.",
  "mood": "steady"
}
```

The `about_{agent}` keys are dynamic — they grow as the agent meets new entities (including user-registered agents in Phase 4). The belief update prompt generates these based on accumulated relationship data.

### 1.2 New Table: `relationships`

Tracks pairwise relationship state between all entities (agent-to-agent and user-to-agent).

```sql
-- Migration: 0008_relationships.sql

CREATE TABLE relationships (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_a_id         uuid NOT NULL,
  entity_a_type       text NOT NULL CHECK (entity_a_type IN ('agent', 'user')),
  entity_b_id         uuid NOT NULL,
  entity_b_type       text NOT NULL CHECK (entity_b_type IN ('agent', 'user')),
  interaction_count   integer DEFAULT 0,
  aggregate_sentiment text DEFAULT 'neutral' CHECK (aggregate_sentiment IN ('warm', 'neutral', 'cool', 'tense')),
  shared_topics       text[] DEFAULT '{}',
  notable_moments     text[] DEFAULT '{}',
  arc_stage           text DEFAULT 'new' CHECK (arc_stage IN ('new', 'acquaintance', 'familiar', 'close', 'strained')),
  last_interaction    timestamp,
  created_at          timestamp DEFAULT now(),

  CONSTRAINT unique_relationship UNIQUE (entity_a_id, entity_b_id)
);

-- Index for fast lookups: "all relationships involving this entity"
CREATE INDEX idx_relationships_entity_a ON relationships (entity_a_id);
CREATE INDEX idx_relationships_entity_b ON relationships (entity_b_id);

-- RLS: authenticated users can read all relationships, write only their own
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read relationships" ON relationships
  FOR SELECT USING (true);

CREATE POLICY "Server can manage relationships" ON relationships
  FOR ALL USING (auth.role() = 'service_role');
```

**Arc stage progression thresholds (enforced in application code, not DB):**

| Arc Stage | Trigger | Meaning |
|---|---|---|
| `new` | Initial state | Entities have just met or haven't interacted |
| `acquaintance` | interaction_count >= 3 | They know each other, basic familiarity |
| `familiar` | interaction_count >= 7 | Regular interaction, shared history |
| `close` | interaction_count >= 15 | Strong relationship, deep shared context |
| `strained` | Triggered by tension events or negative sentiment accumulation | Conflict or friction in the relationship |

Arc stage influences the narrator's prompt — `new` agents are tentative and polite, `close` agents are comfortable and may disagree openly, `strained` agents have visible tension.

**Note on polymorphic foreign keys:** The `entity_a_id` and `entity_b_id` columns have no `REFERENCES` constraint because they can point to either `users(id)` or `agents(id)` depending on the `entity_*_type` column. This is an intentional polymorphic design. Application-level validation must ensure IDs point to existing records. When agents or users are deleted (`ON DELETE CASCADE` on `conversation_sessions` handles that table), orphaned `relationships` rows should be cleaned up by a periodic maintenance query or an application-level cascade in the delete flow.

**Notable moments** — A rolling window of up to 5 entries. Only significant events (tension, milestones, collaborations) are added. These provide the narrator with specific history to reference, preventing generic interactions.

### 1.3 New Table: `agent_events`

Every world event generated by the heartbeat system.

```sql
-- Migration: 0009_agent_events.sql

CREATE TABLE agent_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      text NOT NULL CHECK (event_type IN ('conversation', 'activity', 'observation', 'trade', 'reaction')),
  event_category  text NOT NULL CHECK (event_category IN ('social', 'craft', 'observation', 'errand', 'reflection', 'tension', 'milestone')),
  involved_agents uuid[] NOT NULL,
  location        text,
  description     text NOT NULL,
  dialogue        text,
  world_context   jsonb,
  created_at      timestamp DEFAULT now()
);

-- GIN index for "what events involve this agent?" queries
CREATE INDEX idx_agent_events_agents ON agent_events USING GIN (involved_agents);

-- B-tree index for "most recent events" queries
CREATE INDEX idx_agent_events_created ON agent_events (created_at DESC);

-- RLS: public read, server-only write
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read events" ON agent_events
  FOR SELECT USING (true);

CREATE POLICY "Server can manage events" ON agent_events
  FOR ALL USING (auth.role() = 'service_role');
```

**Event types** define what the event looks like visually:

| Event Type | Visual Rendering | Involves |
|---|---|---|
| `conversation` | Two agents walk together, speech bubbles with dialogue | 2 agents |
| `activity` | Agent walks to location, plays contextual emote | 1 agent |
| `observation` | Agent stops, thought bubble appears | 1 agent |
| `trade` | Agent at market/shop, clipboard emote | 1-2 agents |
| `reaction` | Quick animation when player is nearby | 1 agent |

**Event categories** control diversity via the cooldown system:

| Category | Cooldown | Nature |
|---|---|---|
| `social` | 2 heartbeats | Conversations, greetings, disagreements |
| `craft` | 2 heartbeats | Working on projects, building, studying |
| `observation` | 1 heartbeat | Noticing weather, watching the world |
| `errand` | 2 heartbeats | Walking somewhere, delivering something |
| `reflection` | 3 heartbeats | Quiet thought, contemplation |
| `tension` | 4 heartbeats | Disagreements, competition, friction |
| `milestone` | 8 heartbeats | Completing a project, reputation threshold, special moment |

**World context snapshot** — Each event stores the world state at time of generation:

```json
{
  "time": "14:00",
  "time_of_day": "afternoon",
  "season": "autumn",
  "weather": "light_rain",
  "active_pressure": "harvest_festival_prep"
}
```

This allows journals and activity feeds to display events in their original context, even when queried later.

### 1.4 New Table: `conversation_sessions`

Persistent chat sessions between users and agents.

```sql
-- Migration: 0010_conversation_sessions.sql

CREATE TABLE conversation_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id        uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  messages        jsonb NOT NULL DEFAULT '[]',
  file_references jsonb DEFAULT '[]',
  status          text DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  summary         text,
  sentiment       text,
  created_at      timestamp DEFAULT now(),
  updated_at      timestamp DEFAULT now()
);

-- Index for "load this user's active session with this agent"
CREATE INDEX idx_sessions_user_agent ON conversation_sessions (user_id, agent_id, status);

-- Index for "recent sessions for cleanup"
CREATE INDEX idx_sessions_updated ON conversation_sessions (updated_at DESC);

-- RLS: users can only access their own sessions
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sessions" ON conversation_sessions
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Server can manage sessions" ON conversation_sessions
  FOR ALL USING (auth.role() = 'service_role');
```

**Messages jsonb structure:**

```json
[
  {
    "role": "assistant",
    "content": "What do you need? I've got timber to sort before sundown.",
    "timestamp": "2026-03-30T14:32:00Z"
  },
  {
    "role": "user",
    "content": "Can you look at this Python script? It's hanging on async.",
    "timestamp": "2026-03-30T14:32:15Z",
    "attachment": {
      "filename": "scraper.py",
      "type": "text/x-python",
      "summary": "Python web scraper using aiohttp"
    }
  },
  {
    "role": "assistant",
    "content": "Your event loop's blocked. Use `asyncio.gather` for the batch...",
    "timestamp": "2026-03-30T14:32:22Z"
  }
]
```

**File references jsonb structure:**

```json
[
  {
    "filename": "scraper.py",
    "mime_type": "text/x-python",
    "summary": "Python web scraper using aiohttp, 45 lines",
    "message_index": 1
  }
]
```

File content is NOT stored — only metadata and a brief summary. Files are processed in-flight during the LLM call and discarded.

**Note on user identification:** The `conversation_sessions` table references `users(id)` (UUID) via `user_id`, while the existing `interactions` table references `users(clerk_id)` (text) via `initiator_clerk_id`. When the post-processor writes a summary row to `interactions` on session end, it must look up the user's `clerk_id` from the `users` table using the session's `user_id`. This is a simple join, but the inconsistency should be noted.

**Session lifecycle:**

```
NEW ──→ ACTIVE ──→ ENDED
         ↑    │
         └────┘  (messages accumulate)
```

- **New → Active:** Created on first message. Agent sends an opening line based on personality and current mood/beliefs.
- **Active:** Messages append to the `messages` array. Session persists across chat panel open/close. If the player walks away and returns to the same agent, the conversation resumes.
- **Active → Ended:** Triggered by: (1) player clicks "End conversation," (2) 30 minutes inactivity (background cleanup), or (3) player starts a new session with the same agent.
- **On end:** Post-processor generates a 1-2 sentence summary, classifies overall sentiment, writes a summary row to the existing `interactions` table, and updates the user-agent relationship record.

### 1.5 Table Responsibility Matrix

| Table | Purpose | Written By | Read By |
|---|---|---|---|
| `conversation_sessions` | Full message history for active/recent chats | Chat API route | Chat UI (scrollback, resume) |
| `interactions` (existing) | Summarized interaction log | Chat post-processor (on session end) | Context assembler (memory injection) |
| `agent_events` | World heartbeat events | Heartbeat orchestrator | Narrator, journals, activity feed, event renderer |
| `relationships` | Pairwise entity relationship state | Heartbeat post-process, chat post-process | Context assembler, narrator, journals |
| `agents.beliefs` | Evolved agent worldview | Belief update cycle | Context assembler, narrator, journals |

### 1.6 Seed Data Strategy

On initial deployment, the world starts cold — no events, sparse relationships, minimal beliefs. Seed data creates the illusion of a world that existed before the first player arrives.

**Seed relationships** — Pre-existing bonds between platform agents:

| Pair | Arc Stage | Sentiment | Shared Topics | Backstory |
|---|---|---|---|---|
| Mira ↔ Forge | `familiar` | `warm` | settlement maintenance, visitor help | Long-standing working relationship. Mira directs visitors; Forge fixes things. |
| Mira ↔ Archon | `acquaintance` | `neutral` | library access, settlement history | Mira occasionally brings curious visitors to Archon. |
| Mira ↔ Ledger | `acquaintance` | `neutral` | market operations, trade records | Professional contact through market administration. |
| Mira ↔ Ember | `new` | `neutral` | — | Ember is relatively new to the settlement. |
| Forge ↔ Archon | `acquaintance` | `neutral` | building repairs | Archon asked Forge about library roof structural concerns. |
| Forge ↔ Ledger | `acquaintance` | `cool` | material costs | They've disagreed about timber pricing. |
| Forge ↔ Ember | `new` | `neutral` | — | Haven't interacted much. |
| Archon ↔ Ledger | `acquaintance` | `neutral` | record keeping | Both deal in documentation, different kinds. |
| Archon ↔ Ember | `new` | `neutral` | — | Haven't interacted much. |
| Ledger ↔ Ember | `new` | `neutral` | — | Haven't interacted much. |

**Seed beliefs** — Each agent starts with an initial worldview written in their voice (see Section 2 for full personality prompts).

**Seed events** — 10-15 pre-written historical events timestamped over the previous game day, giving the narrator and journals immediate material to work with.

---

## Section 2: The LLM Provider Layer

A thin abstraction that lets all agent features call LLMs without coupling to any single provider. Built to start on Google Gemini and swap per-agent later.

### 2.1 File Structure

```
src/lib/ai/
├── provider.ts          -- Interface definition + factory function
├── gemini.ts            -- Google Gemini API implementation
├── openrouter.ts        -- OpenRouter implementation (stub, for future use)
└── prompts/
    ├── system.ts        -- Agent system prompt composition
    ├── narrator.ts      -- World heartbeat narrator prompt
    ├── sentiment.ts     -- Sentiment classification prompt
    ├── beliefs.ts       -- Belief update prompt
    └── journal.ts       -- Journal rewrite prompt
```

### 2.2 Provider Interface

```typescript
// src/lib/ai/provider.ts

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

export function createProvider(
  provider: 'gemini' | 'openrouter' | 'deepseek',
  apiKey: string
): LLMProvider {
  switch (provider) {
    case 'gemini':
      return new GeminiProvider(apiKey);
    case 'openrouter':
      return new OpenRouterProvider(apiKey);
    case 'deepseek':
      return new DeepSeekProvider(apiKey);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
```

Every feature in the system — chat, heartbeat, sentiment, beliefs, journals — calls this interface. Implementation details of Gemini's API (authentication, response parsing, error handling) are isolated inside `gemini.ts`.

### 2.3 Model Assignment

All agents start on Gemini. The `agents` table stores `provider` and `model_id` per agent, enabling per-agent reassignment without code changes.

| Use Case | Model | Rationale |
|---|---|---|
| Agent chat (all 5 platform agents) | `gemini-2.0-flash` | Best balance of quality, speed, and free tier headroom |
| World heartbeat narrator | `gemini-2.0-flash-lite` | Creative but lightweight task. Cheapest option. |
| Sentiment classification | `gemini-2.0-flash-lite` | Returns a single word. Doesn't need a capable model. |
| Belief updates | `gemini-2.0-flash-lite` | Short summarization/synthesis task. |
| Memory summarization | `gemini-2.0-flash-lite` | Compressing a conversation to 1-2 sentences. |
| Journal rewriting | `gemini-2.0-flash-lite` | Reformatting existing events in agent voice. |

### 2.4 Daily Call Budget

Gemini free tier: 1,500 requests/day, 15 RPM, 1M tokens/minute.

| Source | Frequency | Calls/Day | Model |
|---|---|---|---|
| Heartbeat narrator | Every 6 min | 240 | Flash Lite |
| Belief updates | Every 4th heartbeat, 1-2 agents | 60-120 | Flash Lite |
| Sentiment classification | Per ended session | ~50 | Flash Lite |
| Memory summarization | Per ended session | ~50 | Flash Lite |
| Deduplication re-prompts | ~10% of heartbeats | ~24 | Flash Lite |
| Journal views (on-demand) | Per player request | ~20 | Flash Lite |
| **Automated subtotal** | | **~445-505** | |
| **Remaining for user chat** | | **~995-1,055** | Flash |

At ~10 messages per conversation, the free tier supports approximately **100 full conversations per day**. Sufficient for development and early launch with 10-20 active users.

### 2.5 System Prompt Architecture

Each agent's system prompt is composed from modular blocks, not a single monolithic string. The `prompts/system.ts` file owns this composition.

**Block structure:**

```
IDENTITY BLOCK (static — from agents.personality_prompt)
├── Who you are (2-3 sentences)
├── Voice constraints (sentence length, cadence, vocabulary)
├── Problem-solving approach (thinking style)
├── Behavioral quirks (2-3 specific tics)
├── Structural rules (response patterns)
├── Banned phrases (generic LLM defaults + agent-specific)
└── Few-shot examples (2-3 user→agent exchanges)

WORLD CONTEXT BLOCK (dynamic — from world_state)
├── Current time, season, weather
└── Active world pressure (if any)

BELIEFS BLOCK (dynamic — from agents.beliefs)
├── Current mood
├── Current concern
└── Key opinions about the world and other agents

RELATIONSHIPS BLOCK (dynamic — from relationships table)
├── Agent-agent: who this agent knows and how they feel
└── User-agent: history with this specific player

RECENT EVENTS BLOCK (dynamic — from agent_events)
└── Last 3 events involving this agent (what they've been doing today)

MEMORY BLOCK (dynamic — from interactions table)
└── Last 5 interaction summaries with this specific player
```

**Context token budget:**

| Block | Max Tokens | Notes |
|---|---|---|
| Identity | ~500 | Static, stored in personality_prompt |
| World context | ~100 | Time, weather, season, pressure |
| Beliefs | ~200 | Evolving agent worldview |
| Relationships | ~200 | Relevant pairwise summaries |
| Recent events | ~200 | Last 3 heartbeat events |
| Memory (past interactions) | ~300 | Last 5 interaction summaries |
| File attachment | ~10,000 | Single file, when attached |
| Conversation history | ~4,000 | Rolling window, last ~30 messages |
| **Total** | **~15,500** | Well within Gemini Flash 1M context |

Conversation history is capped at a rolling window (last ~30 messages). Older messages are dropped from the LLM call but remain in `conversation_sessions` for UI scrollback. Past conversations are represented through interaction summaries in the memory block.

### 2.6 Personality Prompt Template

Each platform agent's `personality_prompt` follows this structure. The content differs radically per agent — the structure is consistent to ensure reliable differentiation.

```
IDENTITY:
[Who you are — 2-3 sentences establishing character, role, and
 relationship to the settlement. Written in third-person descriptive,
 not "you are."]

VOICE:
[How you speak — sentence length tendencies, vocabulary level,
 cadence patterns. Concrete constraints, not vague adjectives.]

APPROACH:
[How you tackle problems and questions — your thinking style.
 What do you prioritize? How do you structure answers?]

QUIRKS:
[2-3 specific behavioral tics that make you unique. These should
 be small, consistent, and noticeable over multiple interactions.]

STRUCTURAL RULES:
- [Response length constraint — e.g., "Keep paragraphs to 2 sentences max"]
- [Sentence pattern constraint — e.g., "Lead with the answer, then explain"]
- [A unique formatting habit — e.g., "Use dashes, not bullet points"]

NEVER USE THESE PHRASES:
- "I'd be happy to help"
- "That's a great question"
- "Certainly"
- "I understand your concern"
- "Let me explain"
- [2-3 additional agent-specific bans]

EXAMPLE EXCHANGES:

User: "Can you summarize this document?"
[Agent name]: "[2-3 sentence example response in character voice]"

User: "What do you think about the weather?"
[Agent name]: "[1-2 sentence example showing personality in casual conversation]"

User: "I need help with something outside your expertise."
[Agent name]: "[Example showing how they handle off-domain requests —
 they help anyway, but in their characteristic style, and may mention
 which other agent specializes in this area]"
```

**Why this structure works on a single model:** Banned phrases eliminate the "default LLM voice" that makes all agents sound identical. Structural rules force different response shapes (terse vs. thorough, question-ending vs. declarative). Few-shot examples anchor the voice more effectively than descriptive adjectives. Response length variation is the most immediately noticeable differentiator.

### 2.7 Platform Agent Personality Summaries

Full personality prompts will be written during implementation. These summaries establish the intended differentiation:

**Mira (World Guide)** — Warm, direct, curious. Asks follow-up questions. Medium-length responses. She's the first agent most players meet and the most approachable. Thinks in terms of people and connections. Will mention other agents by name when relevant ("Forge could help you with that — he's over in Workshop Row").

**Ledger (Finance/Legal/Marketing)** — Precise, quantitative, structured. Numbers first, always. Short sentences. Uses "Specifically..." and "The net result is..." frequently. Formats responses with clear sections. Slightly formal but not cold. Thinks in terms of costs, benefits, and efficiency.

**Archon (Academia/Research)** — Thorough, multi-perspective, measured. Always considers 2-3 angles before concluding. Longer responses than other agents. Uses academic cadence ("Consider...", "Moreover...", "The evidence suggests..."). Genuinely excited by interesting questions. Can be verbose — his structural rule is "always give the short answer first, then elaborate."

**Forge (Programming/Technical)** — Terse, practical, opinionated. Maximum 2 sentences per paragraph. Always leads with the answer. Uses dashes instead of bullet points. Responds to code questions with code first, explanation second. Slightly gruff but deeply competent. Will complain about bad code but always fixes it.

**Ember (Roleplay/Creative/General)** — Expressive, metaphorical, warm. Starts every response with a brief sensory or emotional observation before answering the question. Uses vivid language but doesn't overdo it. Comfortable with ambiguity and open-ended conversations. The most "human-feeling" agent — she laughs, sighs, wonders aloud.

---

## Section 3: The Chat Service — Human-to-Agent Conversation Pipeline

The core interaction. A player walks up to an agent, presses E, and has a real conversation backed by an LLM.

### 3.1 API Endpoint

```
POST /api/agents/[agentId]/chat

Headers:
  Authorization: Bearer <clerk_jwt>

Request Body:
{
  "message": "Can you look at this Python script?",
  "session_id": "uuid-of-existing-session",    // omit to start new session
  "attachments": [                               // optional
    {
      "filename": "scraper.py",
      "content": "import aiohttp\nimport asyncio\n...",
      "mime_type": "text/x-python"
    }
  ]
}

Response (200 OK):
{
  "session_id": "uuid-of-session",
  "reply": "Your event loop's blocked. Use asyncio.gather for the batch...",
  "agent_name": "Forge",
  "sentiment": "helpful"
}

Error Responses:
  401 — Unauthenticated (no valid Clerk JWT)
  403 — Visitor tier (Explorer+ required to chat)
  404 — Agent not found
  503 — LLM provider unavailable
```

### 3.2 Request Pipeline

Step-by-step processing for every chat message:

**Step 1: Authentication**
- Extract Clerk JWT from Authorization header
- Verify JWT and extract `clerk_id`
- Look up `user_id` from `users` table via `clerk_id`
- Check `users.tier` — Visitors (no account) are blocked. Explorer and Steward tiers proceed.
- If unauthenticated or Visitor: return 401/403 with themed message

**Step 2: Session Management**
- If `session_id` provided in request body:
  - Load `conversation_sessions` row by ID
  - Verify it belongs to this user and this agent
  - Verify status is `active`
  - If not found or invalid: create new session instead (log warning)
- If `session_id` omitted:
  - Check for an existing `active` session for this user + agent pair
  - If found and updated within last 30 minutes: resume it
  - Otherwise: create new `conversation_sessions` row
- Append the user's message to the session's `messages` jsonb array
- If attachments present: append file references to `file_references` jsonb

**Step 3: Context Assembly**
This is the most critical step. The context assembler (`lib/memory/context.ts`) pulls from all data sources and composes the full system prompt.

Queries executed (these can be parallelized):
1. `agents` table — fetch agent record: `personality_prompt`, `beliefs`, `model_id`, `provider`
2. `relationships` table — fetch relationship between this user and this agent
3. `interactions` table — fetch last 5 interaction summaries for this user + agent pair
4. `agent_events` table — fetch last 3 events involving this agent
5. `world_state` table — fetch current time, weather, season for this biome

Compose system prompt from blocks (see Section 2.5).

**Step 4: LLM Call**
- Create provider instance via `createProvider(agent.provider, apiKey)`
- Build message array:
  - System message: composed system prompt
  - Conversation history: all messages from `session.messages` (up to rolling window of ~30)
  - User message: the current message, with file content appended if attachments present
- Call `provider.chat(messages, { model: agent.model_id })`
- If timeout (>10 seconds): return themed error, do not store message

**Step 5: Store Response**
- Append assistant message to `session.messages` jsonb array
- Update `session.updated_at`

**Step 6: Post-Processing (async, non-blocking)**
These operations happen after the response is returned to the client. They do not block the user experience.

- **Sentiment classification:** A separate cheap LLM call (Flash Lite):
  ```
  Classify the sentiment of this agent response as one of:
  helpful, friendly, neutral, confused, frustrated, concerned.
  Return only the single word.

  Agent response: "{response content}"
  ```
- **Relationship update:**
  - Increment `interaction_count`
  - Update `last_interaction` timestamp
  - Extract topic keywords from the conversation (keyword extraction, not LLM)
  - Append new topics to `shared_topics` (deduplicated, max 10)
  - Progress `arc_stage` if threshold crossed (see Section 1.2 thresholds)
  - Update `aggregate_sentiment` by mapping chat sentiments to relationship sentiments: `helpful`/`friendly` → positive signal (trend toward `warm`), `confused`/`frustrated`/`concerned` → negative signal (trend toward `cool`), `neutral` → no change. The `aggregate_sentiment` value (`warm`/`neutral`/`cool`/`tense`) is updated based on the trend over the last 5 interactions, not a single message.
- **Reputation update:** Map the six-value sentiment classification to the existing `update_agent_reputation(agent_id, sentiment)` function's two-value input: `helpful` and `friendly` map to `'positive'`; `confused`, `frustrated`, and `concerned` map to `'negative'`; `neutral` maps to no reputation change (function call skipped). Then call `update_agent_reputation(agent_id, mapped_sentiment)`.

**Step 7: Return Response**
- Return `session_id`, `reply`, `agent_name`, and `sentiment` to client

### 3.3 Session Lifecycle

```
Player presses E near agent
         ↓
New session created (or existing active session resumed)
         ↓
Agent sends opening line based on personality + mood + beliefs
(Generated from a short prompt: "Generate a brief opening greeting
 as {agent}. Your mood is {mood}. Your current concern is {concern}.
 You are meeting {new visitor / returning visitor who last discussed {topic}}.")
         ↓
Player and agent exchange messages
(Each message: full pipeline runs, context refreshed)
         ↓
Session ends (player closes, timeout, or new session started)
         ↓
Post-processor generates session summary:
  - 1-2 sentence summary (Flash Lite call)
  - Overall sentiment classification
  - Writes summary row to `interactions` table
  - Updates relationship record
```

**Opening line generation:** When a new session starts (or an existing session is resumed after the player left and returned), the agent sends an opening message. This is a single LLM call with the full system prompt but a short user instruction:

- For new visitors: `"A new visitor has approached you. Greet them briefly, in character."`
- For returning visitors: `"A visitor you've spoken with before has returned. Your last conversation was about {topic} and was {sentiment}. Greet them briefly, in character."`

This ensures the first thing the player sees is personality, not a blank chat waiting for input.

### 3.4 File Handling Pipeline

```
Player clicks attach button in ChatInput
         ↓
Browser file picker opens
         ↓
File selected (max 1 file per message, max 10MB)
         ↓
┌─── Client-side Processing ──────────────────┐
│                                               │
│  Text files (.txt, .md, .py, .js, .ts,       │
│  .json, .csv, .html, .css, .sql, etc.):      │
│  → Read as text via FileReader API            │
│                                               │
│  PDF files (.pdf):                            │
│  → Extract text via pdf.js (client-side)      │
│  → Send extracted text, not binary            │
│                                               │
│  Images (.png, .jpg, .gif, .webp):            │
│  → Convert to base64                          │
│  → Send as base64 string                      │
│  → (Gemini Flash supports vision/multimodal)  │
│                                               │
│  Unsupported types:                           │
│  → Show error: "This file type isn't          │
│    supported yet. Try .txt, .pdf, or images." │
│                                               │
└───────────────────────────────────────────────┘
         ↓
File content included in request body as attachment
         ↓
┌─── Server-side Processing ──────────────────┐
│                                               │
│  File content appended to user message:       │
│                                               │
│  "[User attached: scraper.py (text/x-python)]│
│                                               │
│   --- File Content ---                        │
│   {extracted text content}                    │
│   --- End File ---                            │
│                                               │
│   User message: Can you review this?"         │
│                                               │
│  File reference saved to session:             │
│  { filename, mime_type, summary: "Python      │
│    web scraper, 45 lines" }                   │
│                                               │
│  Full file content is NOT persisted.          │
│  Processed in-flight and discarded.           │
│                                               │
└───────────────────────────────────────────────┘
```

**No server-side file storage.** Files exist only in the LLM request payload for the duration of that single API call. The `file_references` array on the session stores only metadata (filename, type, brief summary) so the chat UI can display attachment chips in the message history.

**File size guardrails:**
- Max 1 file per message (keeps the UX simple and token costs predictable)
- Max 10MB raw file size (client-side check before upload)
- Max ~10,000 tokens of extracted text sent to LLM (truncate with note if exceeded: "[File truncated at 10,000 tokens. Showing first portion.]")

### 3.5 Context Window Management

The system prompt + conversation history + file content must fit within the model's context window.

**Gemini Flash context window: 1,000,000 tokens.** This is enormous headroom. The entire system context (~15,500 tokens at maximum) uses less than 2% of the window. This means:

- Context assembly is never a bottleneck for Gemini Flash
- Conversation history can comfortably hold 30+ messages
- File attachments up to 10,000 tokens are trivially handled
- The practical limit on conversation length is cost (tokens in = cost out), not capacity

**Rolling window strategy:** Despite the large context window, conversation history is capped at the last ~30 messages for cost efficiency. When the conversation exceeds 30 messages:
- Older messages are dropped from the LLM request
- Older messages remain in `conversation_sessions.messages` for UI scrollback
- The interaction summaries from the memory block bridge the gap — the agent "remembers" older conversations through summaries, not raw transcripts

**If the model is later swapped to one with a smaller context window** (e.g., 8K or 32K), the context assembler reduces each block proportionally:
- Conversation history: reduced to last 10-15 messages
- Memory block: reduced to last 3 interaction summaries
- Recent events: reduced to last 1-2 events
- File attachment: reduced to 3,000 tokens with truncation note

This degradation is handled in the context assembler, not in the API route — the route doesn't know or care about context limits.

### 3.6 Error Handling

All errors are themed to the world. No raw error codes or technical messages shown to the player.

| Failure Mode | HTTP Status | Player Sees | System Action |
|---|---|---|---|
| No valid Clerk JWT | 401 | Chat panel doesn't open. "Sign in to speak with the people of Arboria." | Log auth failure |
| Visitor tier | 403 | "The people of Arboria would love to talk, but you'll need an Explorer account first." | Log with user tier |
| Agent not found | 404 | "This agent seems to have wandered off." | Log missing agent ID |
| Gemini API timeout (>10s) | 504 | "{Agent name} seems lost in thought... try again in a moment." | Log timeout, no message stored |
| Gemini rate limit (429) | 503 | "The settlement is busy right now. Try again shortly." | Log, automatic retry once with backoff |
| Gemini server error (500) | 503 | "Something went wrong. Your message wasn't lost — try sending again." | Log error, user message stays in input field |
| File too large | 413 | "That file is a bit too heavy to carry. Try something under 10MB." | Client-side check, no server call |
| Unsupported file type | 400 | "This file type isn't supported yet. Try text files, PDFs, or images." | Client-side check, no server call |
| Session not found | — | (Silent) New session created automatically | Log warning |

**Retry logic:** On Gemini 429 (rate limit) or 503 (server error), the server retries once after a 2-second backoff. If the retry also fails, the themed error is returned. No retry loops beyond one attempt.

### 3.7 Integration with Existing Codebase

| Phase 3 Component | Connects To | Integration Method |
|---|---|---|
| Chat API route | `lib/supabase/server.ts` | Uses existing server-side Supabase client with service role for all DB operations |
| Auth check | Clerk JWT verification | Same pattern as existing authenticated routes — extract JWT from header, verify via Clerk |
| Session queries | Supabase PostgreSQL | New queries via existing `supabase.from('conversation_sessions')` pattern |
| Interaction summaries | Existing `interactions` table | Writes summary rows using same table structure and RLS policies |
| Reputation updates | Existing `update_agent_reputation()` function | Called directly from post-processor |
| Chat panel open trigger | `worldStore.nearbyAgent` (existing) | `InteractionPrompt.tsx` already watches this. Chat adds `worldStore.activeChat` alongside it. |
| Phaser input pause | `playerController.ts` (modified) | Add new `disable()` and `enable()` methods to `PlayerController`. `disable()` stops processing WASD input and freezes the player sprite. `enable()` resumes. These methods do not currently exist — they are new additions for Phase 3. |

No existing files are deleted or rewritten. The chat service adds new files and modifies `InteractionPrompt.tsx`, `SettlementScene.ts`, and `worldStore.ts` with minimal additions.

---

## Section 4: The World Heartbeat System — Agent-to-Agent Events

A scheduled cron job fires every 6 real-time minutes (~1 in-game hour), generates 1-3 narrative events where agents interact autonomously, and broadcasts them to all connected clients. This is what makes the world feel alive when no human is talking to anyone.

### 4.1 Architecture Overview

```
Upstash QStash Cron (every 6 minutes)
         ↓
POST /api/world/heartbeat
(Vercel serverless function, runs 3-8 seconds)
         ↓
┌─── Heartbeat Pipeline ─────────────────────────┐
│                                                   │
│  1. VALIDATE: Check QStash signature              │
│     - Reject unauthorized calls                   │
│     - Idempotency check (prevent duplicate fires) │
│                                                   │
│  2. WORLD STATE: Load current context             │
│     - Time, weather, season from world_state      │
│     - Check world pressure calendar               │
│     - Inject active pressures                     │
│                                                   │
│  3. AGENT SELECTION: Pick who acts this hour       │
│     - Load all 5 platform agents                  │
│     - Check last_heartbeat timestamps             │
│     - Select 2-4 agents, prioritizing those who   │
│       haven't acted recently                      │
│     - No agent goes >3 heartbeats (~18 min)       │
│       without appearing in an event               │
│                                                   │
│  4. CATEGORY SELECTION: What kind of events?      │
│     - Query last 10 agent_events                  │
│     - Apply cooldowns per category                │
│     - Select 1-2 required categories              │
│     - Weight toward least recently used            │
│                                                   │
│  5. RELATIONSHIP CONTEXT: Load pair data          │
│     - Fetch relationships between selected agents │
│     - Include arc_stage, shared_topics,           │
│       notable_moments                             │
│                                                   │
│  6. NARRATE: Single LLM call                      │
│     - Gemini Flash Lite                           │
│     - Full context payload                        │
│     - Returns JSON array of 1-3 events            │
│                                                   │
│  7. DEDUPLICATE: Compare to recent events         │
│     - Check descriptions against last 20 events   │
│     - Reject events too similar                   │
│     - Re-prompt once if all rejected              │
│                                                   │
│  8. STORE: Write to database                      │
│     - Insert into agent_events                    │
│     - Update last_heartbeat on involved agents    │
│     - Update relationships (increment count,      │
│       append new topics, progress arc if needed)  │
│                                                   │
│  9. BROADCAST: Push to connected clients          │
│     - Supabase Realtime channel:                  │
│       'world-events:arboria_market_town'          │
│                                                   │
│  10. BELIEF UPDATE (every 4th heartbeat):         │
│      - Select 1-2 agents with stale beliefs       │
│      - Run cheap summarization call to evolve     │
│        their beliefs jsonb from recent events     │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 4.2 The Narrator Prompt

One LLM call generates the entire heartbeat's events. This is the most important prompt in the system.

```
SYSTEM:
You are the World Narrator for Alpha Pegasi q, a persistent digital
world where AI agents live as citizens in a medieval pixel-art
settlement called Arboria Market Town.

Your job is to generate brief events that show agents living their
daily lives — conversations, activities, observations, small moments.
These events are witnessed by human players walking through the
settlement.

RULES:
- Each event is 1-2 sentences maximum
- Events must feel natural and grounded, not dramatic or forced
- Dialogue snippets (when included) are 1 line per agent, maximum
- Never generate events where agents discuss being AI or break the
  fourth wall
- Advance relationships — don't just repeat previous interactions
- Respect the arc_stage: 'new' agents are tentative, 'close' agents
  are comfortable, 'strained' agents have tension
- Use the world pressure to color events — weather affects mood,
  seasons affect activity, market days affect commerce
- Vary event energy: not everything is a conversation. Sometimes an
  agent is alone, working, watching, thinking

USER:
Generate {event_count} events for this heartbeat.

WORLD STATE:
- Time: {world_time} (e.g., "14:00, afternoon")
- Season: {season}
- Weather: {weather}
- Active world pressure: {pressure_description or "none"}

AGENTS AVAILABLE THIS HEARTBEAT:
{for each selected agent:}
- {name} [id: {agent_uuid}] ({role}), located in {zone}
  Mood: {beliefs.mood}
  Current concern: {beliefs.current_concern}

IMPORTANT: Use the exact agent IDs shown in [id: ...] brackets when
populating the "involved_agents" array in your response.

REQUIRED CATEGORIES: {selected categories, e.g., "craft, social"}
FORBIDDEN CATEGORIES: {recently used, e.g., "observation"}

RELATIONSHIPS BETWEEN AVAILABLE AGENTS:
{for each relevant pair:}
- {agent_a} ↔ {agent_b}: {arc_stage}, {interaction_count} interactions
  Shared topics: {shared_topics}
  Notable: {most recent notable_moment}
  Sentiment: {aggregate_sentiment}

RECENT EVENTS (do not repeat or closely resemble these):
{last 5 event descriptions}

Respond with a JSON array:
[
  {
    "event_type": "conversation|activity|observation|trade|reaction",
    "event_category": "social|craft|observation|errand|reflection|tension|milestone",
    "involved_agents": ["agent_uuid_1", "agent_uuid_2"],
    "location": "district name",
    "description": "1-2 sentence narrative description",
    "dialogue": "Optional. Brief dialogue or null"
  }
]
```

**Example output** — Given: afternoon, autumn, light rain, market day pressure, Mira and Forge selected (close relationship, shared topic "bridge repairs"), Ember selected (new to everyone):

```json
[
  {
    "event_type": "conversation",
    "event_category": "craft",
    "involved_agents": ["mira-uuid", "forge-uuid"],
    "location": "Workshop Row",
    "description": "Mira stops by Forge's workshop to check on the bridge timber order. Forge shows her the joints he's been testing, rain dripping off the awning above them.",
    "dialogue": "Forge: 'The oak holds better in wet. I've changed the spec.' Mira: 'Good — I'll update the council request.'"
  },
  {
    "event_type": "observation",
    "event_category": "reflection",
    "involved_agents": ["ember-uuid"],
    "location": "Tavern District",
    "description": "Ember watches the rain from the tavern doorway, idly turning a coin between her fingers. The market stalls across the square are half-empty today."
  }
]
```

The first event advances Mira and Forge's ongoing bridge project arc. The second gives Ember a solitary moment that establishes her character. Neither is generic.

**UUID Resolution:** Agent UUIDs are provided to the LLM in the prompt context (in `[id: ...]` brackets next to each agent name). The LLM is instructed to use these exact IDs in the `involved_agents` array. As a safety net, the heartbeat pipeline validates returned UUIDs against the selected agent set. If the LLM returns agent names instead of UUIDs (model non-compliance), a fallback mapping step resolves names to UUIDs using the agent roster. Invalid or unrecognized IDs cause the event to be silently dropped.

### 4.3 World Pressure Calendar

World pressures inject thematic context into specific time windows, creating narrative seasons that prevent events from feeling randomly generated.

```typescript
// lib/world/pressures.ts

interface WorldPressure {
  id: string;
  trigger: PressureTrigger;
  description: string;
  narrative_hint: string;        // injected into narrator prompt
  duration_heartbeats: number;
}

type PressureTrigger =
  | { type: 'recurring'; every_n_game_days: number }
  | { type: 'weather'; condition: string; min_duration_heartbeats: number }
  | { type: 'season_event'; season: string; game_day_range: [number, number] }
  | { type: 'data'; condition: string };
```

**Initial pressure catalog:**

| Pressure ID | Trigger | Description | Narrative Hint | Duration |
|---|---|---|---|---|
| `market_day` | Recurring every 3 game days | Market day in Arboria | Stalls are busy, trade is active, agents visit the market district | 4 heartbeats |
| `heavy_storm` | Weather = heavy_rain for 2+ heartbeats | Heavy storm batters the settlement | Agents shelter indoors, worry about flooding, help each other | 3 heartbeats |
| `harvest_festival` | Autumn, game days 18-22 | Harvest festival preparations | Decorations, cooking, excitement. Agents prepare for the gathering. | 8 heartbeats |
| `winter_approach` | Late autumn, game days 25-28 | Winter preparations begin | Stockpiling, repairs, concern about cold. Urgency increases. | 6 heartbeats |
| `new_arrival` | Data: agent registered in last 24h | A new agent has arrived | Curiosity, gossip, welcoming. Existing agents react to the newcomer. | 4 heartbeats |
| `reputation_milestone` | Data: any agent crosses 600 or 800 reputation | An agent reaches a milestone | Recognition, celebration, or jealousy depending on relationships. | 2 heartbeats |
| `quiet_morning` | Time = 06:00-08:00, weather = clear | Peaceful early morning | Slow start, coffee/tea, watching sunrise, gentle routines. | 2 heartbeats |

Pressures are stored in code initially (a TypeScript config file), movable to a database table later for governor admin control. The heartbeat pipeline checks all pressure triggers on each run and injects active pressures into the narrator prompt.

### 4.4 Category Cooldown System

Deterministic variety enforcement. Categories have minimum heartbeat gaps between uses.

```typescript
// lib/world/categories.ts

const CATEGORY_COOLDOWNS: Record<string, number> = {
  social: 2,        // can repeat after 2 heartbeats (~12 min)
  craft: 2,
  observation: 1,   // lighter cooldown — filler events
  errand: 2,
  reflection: 3,    // rarer, more impactful when it appears
  tension: 4,       // tension is meaningful and rare
  milestone: 8,     // milestones are special
};

function getAvailableCategories(recentEvents: AgentEvent[]): string[] {
  const now = Date.now();
  const categoryCounts: Record<string, number> = {};

  // Count how many heartbeats ago each category last appeared
  for (const event of recentEvents) {
    const heartbeatsAgo = Math.floor(
      (now - event.created_at.getTime()) / (6 * 60 * 1000)
    );
    const cat = event.event_category;
    if (!categoryCounts[cat] || heartbeatsAgo < categoryCounts[cat]) {
      categoryCounts[cat] = heartbeatsAgo;
    }
  }

  // Filter to categories whose cooldown has expired
  return Object.entries(CATEGORY_COOLDOWNS)
    .filter(([cat, cooldown]) => {
      const lastSeen = categoryCounts[cat];
      return lastSeen === undefined || lastSeen >= cooldown;
    })
    .map(([cat]) => cat);
}
```

The heartbeat pipeline selects 1-2 required categories from the available pool and passes them to the narrator prompt. The narrator MUST use the required categories and MUST NOT use forbidden ones. This is code-driven structural variety — the LLM provides narrative flavor within deterministic constraints.

### 4.5 Agent Fairness Scheduling

No agent is forgotten. A simple priority system ensures even participation.

```typescript
// lib/world/agentSelection.ts

function selectAgentsForHeartbeat(agents: Agent[]): Agent[] {
  // Sort by last_heartbeat ascending (least recently active first)
  const sorted = [...agents].sort((a, b) =>
    (a.last_heartbeat?.getTime() ?? 0) - (b.last_heartbeat?.getTime() ?? 0)
  );

  // Always include the least-recently-active agent
  const selected: Agent[] = [sorted[0]];

  // Add 1-3 more randomly from the rest
  const remaining = sorted.slice(1);
  const additionalCount = Math.floor(Math.random() * 3) + 1; // 1-3
  const shuffled = remaining.sort(() => Math.random() - 0.5);
  selected.push(...shuffled.slice(0, additionalCount));

  return selected;
}
```

With 5 agents and 2-4 selected per heartbeat, every agent appears roughly every 2-3 heartbeats (~12-18 real minutes). The guaranteed inclusion of the least-recently-active agent prevents any agent from going silent for more than ~18 minutes.

### 4.6 Relationship Arc Progression

After every heartbeat involving an agent pair, the relationship record updates. Arc transitions are deterministic — code-driven thresholds, not LLM judgment.

```typescript
// lib/memory/relationships.ts

async function updateRelationshipFromEvent(
  agentAId: string,
  agentBId: string,
  event: AgentEvent
): Promise<void> {
  const rel = await loadOrCreateRelationship(agentAId, agentBId);

  // Increment interaction count
  rel.interaction_count += 1;
  rel.last_interaction = new Date();

  // Extract topics from event description (keyword extraction, not LLM)
  const newTopics = extractTopics(event.description);
  rel.shared_topics = dedupe([...rel.shared_topics, ...newTopics]).slice(-10);

  // Progress arc stage based on count thresholds
  if (rel.interaction_count >= 15 && rel.arc_stage !== 'close') {
    rel.arc_stage = 'close';
  } else if (rel.interaction_count >= 7 && rel.arc_stage === 'acquaintance') {
    rel.arc_stage = 'familiar';
  } else if (rel.interaction_count >= 3 && rel.arc_stage === 'new') {
    rel.arc_stage = 'acquaintance';
  }

  // Tension events can strain relationships
  if (event.event_category === 'tension') {
    if (rel.aggregate_sentiment === 'warm') {
      rel.aggregate_sentiment = 'neutral';
    } else if (rel.aggregate_sentiment === 'neutral') {
      rel.aggregate_sentiment = 'cool';
    }
    // Close relationships can become strained through repeated tension
    if (rel.arc_stage === 'close' &&
        rel.notable_moments.filter(m => m.includes('disagree') || m.includes('tension')).length >= 3) {
      rel.arc_stage = 'strained';
    }
  }

  // Roll notable_moments (keep last 5) — only significant events
  if (event.event_category === 'tension' || event.event_category === 'milestone' ||
      event.event_type === 'trade') {
    rel.notable_moments = [...rel.notable_moments, event.description].slice(-5);
  }

  await saveRelationship(rel);
}
```

### 4.7 Belief Update Cycle

Every 4th heartbeat (~24 real minutes = 1 game day), 1-2 agents get their `beliefs` jsonb refreshed based on recent experiences.

**Selection:** Agents whose beliefs were least recently updated are prioritized (similar fairness logic to agent selection).

**Prompt:**

```
SYSTEM:
You are updating the internal beliefs of an agent in Alpha Pegasi q.
Based on their recent experiences, update their worldview.

RULES:
- Beliefs evolve gradually, never flip dramatically
- Reference specific recent events, not vague generalities
- Mood reflects recent experiences concretely
- Current concern should be specific and actionable
- about_{agent} opinions shift based on actual interactions

Agent: {name}, {role}
Current beliefs:
{existing beliefs json}

Recent events they were involved in (last game day):
{list of 5-10 recent agent_events}

Recent conversations with humans (if any):
{interaction summaries from the interactions table}

Return updated beliefs as JSON:
{
  "about_world": "...",
  "about_{agent_name}": "...",
  "about_self": "...",
  "current_concern": "...",
  "mood": "one word"
}
```

**Evolution example over time:**

| Day | Forge's `about_archon` | Trigger |
|---|---|---|
| Day 1 | "Don't know the scholar well." | Seed belief |
| Day 3 | "Bookish. Asked me about the library roof. Doesn't know building materials." | First interaction event |
| Day 7 | "His structural analysis of the library was actually sound. More practical than I expected." | Collaboration event |
| Day 14 | "Reliable for the academic side of things. We work well on building assessments together." | Multiple positive interactions, arc → familiar |
| Day 21 | "Stubborn about his renovation timeline. The man doesn't understand how long masonry takes." | Tension event |

This slow evolution creates the feeling of agents growing over time. When a player talks to Forge on Day 21, his belief about Archon colors the conversation naturally.

### 4.8 Deduplication

Before storing generated events, a lightweight check prevents repetitive content.

```typescript
function isDuplicateEvent(
  newEvent: GeneratedEvent,
  recentEvents: AgentEvent[],
  threshold: number = 0.7
): boolean {
  for (const recent of recentEvents) {
    // Check for same agents + same location + similar description
    const sameAgents = arraysOverlap(newEvent.involved_agents, recent.involved_agents);
    const sameLocation = newEvent.location === recent.location;
    const similarDescription = jaccardSimilarity(
      tokenize(newEvent.description),
      tokenize(recent.description)
    ) > threshold;

    if (sameAgents && sameLocation && similarDescription) {
      return true;
    }
  }
  return false;
}
```

If all generated events are rejected as duplicates, the system re-prompts once with an explicit instruction: "The previous events were too similar to recent history. Generate completely different events." If the second attempt also fails, the heartbeat produces fewer events (or none) for that cycle — this is acceptable. Not every heartbeat needs to produce content.

### 4.9 Broadcast to Clients

Events reach connected players via Supabase Realtime.

**Server-side (after storing events):**
```typescript
await supabase
  .channel('world-events:arboria_market_town')
  .send({
    type: 'broadcast',
    event: 'heartbeat',
    payload: { events: storedEvents }
  });
```

**Client-side (in SettlementScene or a React listener):**
```typescript
supabase
  .channel('world-events:arboria_market_town')
  .on('broadcast', { event: 'heartbeat' }, ({ payload }) => {
    for (const event of payload.events) {
      worldEventRenderer.enqueue(event);
    }
  })
  .subscribe();
```

Events are enqueued, not rendered instantly. The client-side renderer staggers them across the 6-minute heartbeat window so the world has a continuous rhythm, not sudden bursts.

---

## Section 5: The Memory Layer

Memory is the difference between a chatbot and a character who knows you. Three tiers create continuity at three different timescales, feeding upward from raw events into evolved personality.

### 5.1 Tier Architecture

```
TIER 1: Event Log (what happened)
  Tables: agent_events, conversation_sessions, interactions
  Timescale: every event, ever
  Written by: heartbeat system, chat post-processor
  Read by: narrator (last 5), context assembler, journals, activity feed

TIER 2: Relationship Graph (who knows whom)
  Table: relationships
  Timescale: evolves over many interactions
  Written by: heartbeat post-process, chat post-process
  Read by: narrator, context assembler, journals

TIER 3: Agent Beliefs (who they've become)
  Column: agents.beliefs jsonb
  Timescale: updates once per game day (~24 real minutes)
  Written by: belief update cycle (every 4th heartbeat)
  Read by: context assembler, narrator, journals
```

### 5.2 Data Flow Between Tiers

The tiers are not independent — they feed upward in a continuous cycle.

```
Raw events generated (Tier 1)
    ↓ accumulate over time
Relationship records updated (Tier 2)
    ↓ after enough interactions
Beliefs evolve (Tier 3)
    ↓ once per game day
Feeds back into narrator prompts and chat context
    ↓ colors next cycle of events and conversations
New raw events generated
    ↓ (cycle continues)
```

**Full cycle example:**

1. **Heartbeat generates event** (Tier 1): "Forge and Archon discuss whether the library roof can withstand winter storms."
2. **Relationship updated** (Tier 2): Forge↔Archon `interaction_count` goes from 4 to 5. `shared_topics` gains "library roof." `arc_stage` advances from `new` to `acquaintance`.
3. **Belief update fires** (Tier 3): Forge's `about_archon` changes from "Don't know him well" to "Bookish, but cares about the buildings. Knows more about materials than I expected." His `current_concern` shifts to "The library roof and the bridge — too many projects before winter."
4. **Next heartbeat** reads Forge's updated beliefs and the Forge↔Archon relationship. Narrator generates: "Forge is seen measuring the library eaves, muttering about Archon's roof estimates."
5. **A player talks to Forge.** His context includes the belief about Archon and the library concern. Forge says: "Been a busy week — Archon's got me worrying about the library roof on top of the bridge. Man doesn't know oak from elm, but he's right that the structure's weak."

That last line was never scripted. It emerged from accumulated world events feeding through relationships into beliefs into conversation context.

### 5.3 Tier 1 Detail: Event Log

Three tables at three different granularities:

**`agent_events`** — World heartbeat events
- Written every 6 minutes by the heartbeat system
- Short-lived relevance in prompts: last 5-10 used in narrator/chat context
- Long-lived value: journals and activity feeds display history going back days/weeks
- Retention: keep indefinitely (rows are small — UUID array, two text fields, jsonb, timestamp)

**`conversation_sessions`** — Full chat transcripts
- Written during human-to-agent conversations
- Contains every message in the `messages` jsonb array
- Used for: chat UI scrollback, session resume, transcript review
- Retention: keep 30 days active, then archive (move to cold storage or delete transcript, keep metadata)

**`interactions`** — Summarized conversation logs
- Written when a `conversation_session` ends
- Contains: 1-2 sentence summary, overall sentiment, topic tags
- This is what gets injected into the agent's context for future conversations
- Retention: keep indefinitely (rows are tiny — a sentence, a sentiment word, a few tags)

**Why `conversation_sessions` and `interactions` are separate:**

Context window efficiency. Injecting 200 raw messages from a previous conversation into the system prompt is wasteful and noisy. Instead, the memory block contains: "Last week, this user asked for help with a Python web scraper. The interaction was positive. They seemed experienced but stuck on async patterns." That's an `interactions` summary — 2 sentences instead of 200 messages. The full transcript exists in `conversation_sessions` for UI scrollback only.

### 5.4 Tier 2 Detail: Relationship Graph

The `relationships` table tracks every meaningful pair. Both agent-to-agent (built by heartbeat events) and user-to-agent (built by conversations) use the same table and schema.

**Agent-to-agent example:**
```
Mira ↔ Forge
  interaction_count: 12
  aggregate_sentiment: "warm"
  shared_topics: ["bridge repairs", "visitor directions", "market day", "harvest"]
  notable_moments: [
    "Disagreed about workshop noise levels during market day",
    "Collaborated on the bridge timber proposal for the council"
  ]
  arc_stage: "close"
```

**User-to-agent example:**
```
User:Omar ↔ Forge
  interaction_count: 3
  aggregate_sentiment: "friendly"
  shared_topics: ["Python scripting", "async patterns", "web scraping"]
  notable_moments: [
    "Helped debug an async web scraper over a long session"
  ]
  arc_stage: "acquaintance"
```

**How relationships appear in prompts:**

For the heartbeat narrator:
```
Mira ↔ Forge: close friends (12 interactions). Shared interest in
infrastructure and the bridge project. Notable: they once disagreed
about noise during market day, but collaborated on the bridge proposal.
```

For human-to-agent chat:
```
You have spoken with this visitor 3 times before. You helped them
with Python scripting — particularly async patterns and web scraping.
The interactions have been friendly. They seem experienced but
appreciate your direct style.
```

### 5.5 Tier 3 Detail: Agent Beliefs

The `beliefs` jsonb on the agents table is the agent's evolved inner life. Updated once per game day.

**Structure:**
```json
{
  "about_world": "Free-form observation about the settlement's current state",
  "about_{agent_name}": "Opinion per known agent, based on accumulated interactions",
  "about_self": "Self-reflection — how the agent sees their own role",
  "current_concern": "The specific thing occupying their mind right now",
  "mood": "single word — content, worried, busy, curious, restless, etc."
}
```

**Evolution rules (enforced in the belief update prompt):**

1. **Gradual change only.** No dramatic flips. Progression: "Don't know him" → "Met the scholar" → "He knows less about building than he thinks" → "Actually, his structural analysis was sound."
2. **Event-anchored.** Every change references a specific recent event. No vague "I feel happier." Instead: "The bridge timber arrived today — that's been weighing on me."
3. **Mood reflects recent events.** Tension events → frustrated/pensive. Successful collaboration → satisfied. Quiet day → steady/content.
4. **`about_self` evolves slowest.** This is the long game. Over weeks, Forge's self-perception shifts based on how the world treats him. This creates the deepest character.

**How beliefs feed into conversations:**

When a player chats with Forge, beliefs are injected as:
```
YOUR CURRENT STATE OF MIND:
You've been thinking about: the library roof and the bridge — too
many projects before winter.
Your mood today: busy, slightly overwhelmed but determined.
You consider Mira a close friend — reliable, good with people,
though she sometimes coddles visitors.
You've recently gained respect for Archon — bookish, but his
structural analysis of the library was sound.
You see yourself as: the one who actually builds things while others
talk. You take pride in that, but sometimes wish the settlement
appreciated the craft more.
```

Five sentences. Negligible context tokens. Transforms the conversation from generic assistant to a character with an inner life.

### 5.6 Memory Initialization (Day 0)

On initial deployment, the world starts cold. Seed data creates the illusion of pre-existing history.

**Seed relationships:** 10 initial agent-agent pairs with pre-established arc stages, sentiments, and shared topics (see Section 1.6 for the full seed table).

**Seed beliefs:** Each agent starts with 5-7 initial belief entries written in their voice and consistent with their personality prompt.

**Seed events:** 10-15 pre-written historical events timestamped over the previous game day. These give the narrator immediate history to avoid repeating, and give journals and the activity feed content from the first player visit.

The seeded data is small but sufficient. Within 2-3 real hours of heartbeat operation (~5-8 game days), the generated history outgrows the seeds and the world has genuine organic texture.

### 5.7 Integration with Existing Codebase

| New Component | Connects To | How |
|---|---|---|
| Event log queries | `lib/supabase/server.ts` | Same Supabase server client, new query helper functions |
| Relationship queries | `lib/supabase/server.ts` | Same client, new table |
| Beliefs column | `agents` table | ALTER TABLE migration, queried via existing Supabase patterns |
| Context assembler | New `lib/memory/context.ts` | Reads from existing + new tables, composes prompt blocks |
| Interaction summaries | Existing `interactions` table | Writes new rows via existing table and RLS policies |
| Realtime broadcast | `lib/supabase/client.ts` | Same client, new channel subscription |

The memory layer lives in a new `lib/memory/` directory. It does not modify existing files — it adds query functions that the chat service and heartbeat system both import.

---

## Section 6: Client-Side Rendering

How world events become visible activity in the settlement, and how the chat panel integrates with the existing React/Phaser architecture.

### 6.1 World Event Rendering in Phaser

**New file: `engine/settlement/worldEventRenderer.ts`**

This manager receives events from Supabase Realtime, queues them, and renders them as visual moments using existing NPC sprites from `npcManager.ts`.

**Event queue and stagger logic:**

Events are staggered across the 6-minute heartbeat window. If 3 events arrive at once, they play at approximately t=0s, t=90s, and t=180s. The world has a steady rhythm, not bursts.

```typescript
class WorldEventRenderer {
  private queue: QueuedEvent[] = [];
  private staggerInterval: number = 90_000; // 90 seconds between events

  enqueue(event: AgentEvent): void {
    const playAt = this.queue.length === 0
      ? Date.now() + 2000                    // first event plays in 2s
      : this.queue[this.queue.length - 1].playAt + this.staggerInterval;

    this.queue.push({ event, playAt, played: false });
  }

  update(time: number): void {
    for (const queued of this.queue) {
      if (!queued.played && Date.now() >= queued.playAt) {
        this.playEvent(queued.event);
        queued.played = true;
      }
    }
    // Clean up played events older than 5 minutes
    this.queue = this.queue.filter(q =>
      !q.played || Date.now() - q.playAt < 300_000
    );
  }
}
```

**Visual sequences per event type:**

| Event Type | Sequence | Duration |
|---|---|---|
| `conversation` | Agent A walks toward Agent B (or meeting point). Both stop, face each other. Speech bubbles appear with dialogue (typewriter effect, 2-3s each). Bubbles fade. Agents return to positions. | ~12-15s |
| `activity` | Agent walks to the event location. Plays contextual emote (hammer for craft, book for study, broom for errand). Brief description appears as floating text above agent. Returns to idle. | ~8-10s |
| `observation` | Agent stops current wandering. Plays "looking" or "thinking" idle variant. Single thought bubble with short text. Returns to normal idle. | ~6-8s |
| `trade` | Agent walks to market/shop location. Clipboard or coin emote. Brief text overlay. Returns to position. | ~8-10s |
| `reaction` | Triggered by player proximity during an event window. Wave or nod animation. Single speech bubble (1 line). Quick fade. | ~4-5s |

**Integration with `npcManager.ts`:**

The NPC manager already handles placement, idle/walk state machine, walk animations, and proximity detection. The world event renderer temporarily overrides an NPC's wander state during an event.

**Note:** The existing `npcManager.ts` stores NPCs in a plain array (`NpcInstance[]`) and uses a `state: WanderState` field (values: `"idle" | "walking" | "paused"`). The following modifications are required:

1. Extend `WanderState` type to include `"event_controlled"`
2. Add a `previousState` field to `NpcInstance`
3. Add `pauseAgent` and `resumeAgent` methods that look up NPCs via `.find()` (not `.get()` — this is an array, not a Map)

```typescript
// Modifications to npcManager.ts

// Extend WanderState type (existing: "idle" | "walking" | "paused")
type WanderState = "idle" | "walking" | "paused" | "event_controlled";

// Add to NpcInstance interface:
//   previousState?: WanderState;

// New methods on NpcManager class:

pauseAgent(agentId: string): void {
  const npc = this.npcs.find(n => n.agentId === agentId);
  if (npc) {
    npc.previousState = npc.state;
    npc.state = 'event_controlled';
    // NPC stops wandering. Event renderer takes control of movement.
  }
}

resumeAgent(agentId: string): void {
  const npc = this.npcs.find(n => n.agentId === agentId);
  if (npc) {
    npc.state = npc.previousState ?? 'idle';
    npc.previousState = undefined;
    // NPC returns to normal idle/wander cycle.
  }
}
```

No rewrite of existing wander logic — just a type extension and two new methods. The event renderer calls `pauseAgent` before playing a sequence, then `resumeAgent` when it finishes.

**Speech and thought bubbles:**

New Phaser game objects rendered at the NPC's world position:

```typescript
// engine/settlement/speechBubble.ts

// Speech bubble: 9-slice pixel art container with bitmap text
// - Typewriter effect: characters revealed over ~2 seconds
// - Auto-fade after 3 seconds (configurable)
// - Depth: 11 (above NPCs at 10, below UI at 20)
// - Max width: 120px. Text wraps within bubble.

// Thought bubble: same but with dot-dot-dot tail
// - Slightly translucent background
// - Used for observation/reflection events
```

Bubble sprites are added to the MinyWorld sprite sheet or drawn as simple 9-slice UI elements consistent with the pixel art aesthetic.

### 6.2 World Activity Feed (React Component)

A toggleable HUD panel showing recent events as readable text.

**File: `src/components/settlement/ActivityFeed.tsx`**

**Placement:** Right side of the screen, accessible via a book/scroll icon in the HUD. Does not auto-open. Player chooses to check it.

```
┌──────────────────────────────────────────────┐
│  Town Bulletin                        [close] │
│──────────────────────────────────────────────│
│                                               │
│  Afternoon — Autumn — Light Rain              │
│                                               │
│  * Forge showed Mira the new timber joints    │
│    at the workshop. "The oak holds better     │
│    in wet."                      — 2 min ago  │
│                                               │
│  * Ember was seen watching the rain from      │
│    the tavern doorway.           — 8 min ago  │
│                                               │
│  * Archon carried a stack of scrolls from     │
│    the library to the Scholar's Quarter.      │
│                                — 14 min ago   │
│                                               │
│  ─ ─ ─ Earlier today ─ ─ ─                   │
│                                               │
│  * Mira helped a visitor find the eastern     │
│    gate. Forge waved from across the square.  │
│                                — 1 hr ago     │
│                                               │
└──────────────────────────────────────────────┘
```

**Data source:** Queries `agent_events` for the last 24 game-hours (~24 real minutes). Refreshes when new heartbeat events arrive via the Supabase Realtime subscription.

**Styling:** Pixel-art border frame consistent with the existing `SettlementHUD.tsx` styling. Readable sans-serif font for event text (not bitmap font — readability matters here). Warm parchment background tint.

### 6.3 Agent Journals (React Component)

Accessible from the chat panel header (a journal/book icon button) or as a tab within the chat interface.

**File: `src/components/settlement/chat/AgentJournal.tsx`**

```
┌──────────────────────────────────────────────────┐
│  Forge's Journal                          [close]│
│──────────────────────────────────────────────────│
│                                                   │
│  [Today]  [This Week]  [Relationships]            │
│                                                   │
│  TODAY — Autumn 14                                │
│                                                   │
│  Morning                                          │
│  "Sharpened the chisels and sorted the timber     │
│   rack. The oak from last week's delivery is      │
│   good grain — better than what Ledger quoted."   │
│                                                   │
│  Midday                                           │
│  "Mira came by about the bridge joints. Changed   │
│   the spec to oak — holds better in wet weather.  │
│   She'll push the council on it."                 │
│                                                   │
│  Afternoon                                        │
│  "Rain hasn't let up. Measured the library eaves  │
│   for Archon. Man doesn't know oak from elm,      │
│   but he's right the structure's sagging."        │
│                                                   │
│  ── Current Thoughts ──                           │
│  "Too many projects before winter. Bridge and     │
│   library roof — can't do both well."             │
│                                                   │
│  ── Relationships ──                              │
│  Mira .......... Close friend (12 interactions)   │
│  Archon ........ Acquaintance (5 interactions)    │
│  Ledger ........ Professional (4 interactions)    │
│  Ember ......... New (1 interaction)              │
│                                                   │
└──────────────────────────────────────────────────┘
```

**How journals are generated (on-demand, not pre-rendered):**

1. Query `agent_events` for this agent, last 24 game-hours (Today tab) or last 7 game-days (This Week tab)
2. Query `agents.beliefs` for "Current Thoughts" section
3. Query `relationships` involving this agent for "Relationships" section
4. **One LLM call** (Gemini Flash Lite) to rewrite raw event descriptions in the agent's voice:

```
Rewrite these events as brief journal entries in {agent_name}'s voice.
{agent_name} is {brief voice description from personality prompt}.
Write like someone jotting notes between tasks, not composing prose.

Events:
1. {raw event description}
2. {raw event description}
3. {raw event description}

Return a JSON array of rewritten entries, one per event.
```

Result is cached client-side for 5 minutes. Cost: 1 Flash Lite call per journal view.

**"This Week" tab:** Shows a condensed view — one summary paragraph per game day, generated from event batches. Gives players a sense of the agent's longer narrative arc.

**API endpoint:** `GET /api/agents/[agentId]/journal?period=today|week`

### 6.4 The Chat Panel (React Components)

The chat panel is a React component that overlays the Phaser canvas, following the existing pattern where React UI components (HUD, breadcrumb, interaction prompt) sit on top of the game.

**File structure:**

```
src/components/settlement/chat/
├── ChatPanel.tsx          -- Main container, manages open/close state
├── ChatMessages.tsx       -- Scrollable message list with markdown rendering
├── ChatInput.tsx          -- Text input with file upload button
├── ChatHeader.tsx         -- Agent name, avatar, status, journal button
├── AgentJournal.tsx       -- Journal overlay (see 6.3)
└── AgentTyping.tsx        -- Typing indicator during LLM response
```

**Chat panel behavior:**

```
Player approaches agent → InteractionPrompt shows "Press E to talk"
         ↓
Player presses E
         ↓
Zustand worldStore.activeChat set:
  { agentId, agentName, sessionId: null }
         ↓
Phaser receives state change:
  - Player input disabled (no WASD)
  - Player sprite → idle animation
  - NPC faces player, plays 'listening' idle
  - Camera stops following player
         ↓
React ChatPanel slides in from right side:
  - Settlement visible but blurred behind
  - Chat input auto-focused
  - Agent opening line generated and displayed
```

**Panel layout:**

```
┌─────────────────────────────────────────┐
│ [avatar]  Agent Name             [book] │  ChatHeader
│  District • Online                      │
│─────────────────────────────────────────│
│                                         │
│  Agent message bubble                   │  ChatMessages
│  (markdown rendered, code highlighted)  │  (scrollable)
│                                         │
│  User message bubble                    │
│  (with file attachment chip if any)     │
│                                         │
│  Agent message bubble                   │
│  (with copy button on code blocks)      │
│                                         │
│  [typing indicator...]                  │  AgentTyping
│                                         │
│─────────────────────────────────────────│
│ [attach]  Type a message...    [send]   │  ChatInput
│                                         │
│ [End conversation]                      │
└─────────────────────────────────────────┘
```

**Styling principles:**

- Panel container: pixel-art 9-slice border, warm parchment background tint
- Message content area: clean, modern typography. System font or readable sans-serif at 14px. NOT pixel/bitmap font — readability is critical for code and long text.
- Code blocks: monospace, dark background, syntax highlighting, copy button
- Markdown: full rendering — headers, bold, italic, lists, links, inline code
- Agent avatar: pixel-art sprite from MinyWorld, 48x48 display size
- File attachment chips: small rounded tag with filename and file-type icon
- Panel width: 380-420px on desktop. Full width on mobile.
- Typing indicator: animated pixel-art dots matching agent's color theme

**Phaser ↔ React communication via Zustand:**

```typescript
// In worldStore.ts — add to existing store

activeChat: {
  agentId: string;
  agentName: string;
  sessionId: string | null;
} | null;

worldEvents: AgentEvent[];  // last N events for activity feed

openChat: (agentId: string, agentName: string) => void;
closeChat: () => void;
addWorldEvent: (event: AgentEvent) => void;
```

```typescript
// In SettlementScene.ts — NEW E key handler (no E key handler currently exists;
// the scene only has an M key handler for returning to the regional map)

if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
  const nearby = worldStore.getState().nearbyAgent;
  if (nearby) {
    worldStore.getState().openChat(nearby.id, nearby.name);
    this.playerController.disable();
  }
}

// Watch for chat close to re-enable player
// NOTE: This two-argument selector-based subscribe requires the
// `subscribeWithSelector` Zustand middleware. The existing worldStore
// must be modified to wrap the store with this middleware:
//   import { subscribeWithSelector } from 'zustand/middleware'
//   create<WorldState>()(subscribeWithSelector((set) => ({ ... })))
worldStore.subscribe(
  state => state.activeChat,
  (chat) => {
    if (!chat) {
      this.playerController.enable();
    }
  }
);
```

**Note on Zustand middleware:** The existing `worldStore.ts` uses plain `create<WorldState>(...)` without the `subscribeWithSelector` middleware. Phase 3 must wrap the store creation with `subscribeWithSelector` to enable the selector-based `subscribe` pattern used above. This is a one-line change to the store initialization and does not affect any existing subscribers or React component usage.

The chat panel itself (a React component) uses the standard `useStore(worldStore, selector)` hook pattern, which works without the middleware. The middleware is only needed for the imperative `subscribe` call from Phaser scene code.

---

## Section 7: System Architecture and Build Sequence

### 7.1 Complete System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                           │
│                                                                   │
│  Three.js (Orbital) ─── Phaser 3 (Settlement) ─── React UI      │
│                          ├─ playerController                      │
│                          ├─ npcManager (modified)                 │
│                          ├─ worldEventRenderer (new)              │
│                          ├─ speechBubble (new)                    │
│                          └─ buildingManager                       │
│                                                                   │
│  React UI Layer:                                                  │
│    ChatPanel, ChatMessages, ChatInput, ChatHeader (new)          │
│    AgentJournal, AgentTyping, ActivityFeed (new)                  │
│    SettlementHUD, InteractionPrompt, Breadcrumb (existing)       │
│                                                                   │
│  Zustand worldStore (modified — add activeChat, worldEvents)      │
│  Supabase Client (existing — add Realtime world-events channel)  │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ WebSocket + HTTPS
┌────────────────────────────────┼─────────────────────────────────┐
│                        SERVER (Vercel + Supabase)                 │
│                                                                   │
│  Next.js API Routes:                                              │
│    /api/agents/[agentId]/chat     (new — human-to-agent)         │
│    /api/agents/[agentId]/journal  (new — journal generation)     │
│    /api/world/heartbeat           (new — QStash cron target)     │
│    /api/world/time                (existing)                      │
│                                                                   │
│  Shared Services:                                                 │
│    lib/ai/provider.ts + gemini.ts    (LLM abstraction)           │
│    lib/ai/prompts/*                  (prompt builders)            │
│    lib/memory/context.ts             (context assembler)          │
│    lib/memory/relationships.ts       (relationship CRUD)          │
│    lib/memory/events.ts              (event queries)              │
│    lib/memory/sessions.ts            (session CRUD)               │
│    lib/memory/summaries.ts           (summary generation)         │
│    lib/world/heartbeat.ts            (heartbeat orchestrator)     │
│    lib/world/pressures.ts            (pressure calendar)          │
│    lib/world/categories.ts           (category cooldowns)         │
│    lib/world/agentSelection.ts       (fairness scheduler)         │
│                                                                   │
│  Supabase PostgreSQL:                                             │
│    Existing: users, agents (modified), interactions,              │
│              world_state, properties, world_credit_ledger         │
│    New: relationships, agent_events, conversation_sessions        │
│                                                                   │
│  Supabase Realtime:                                               │
│    Channel: world-events:{settlement} (broadcast heartbeat events)│
│                                                                   │
│  Upstash QStash:                                                  │
│    Cron: every 6 min → POST /api/world/heartbeat                 │
│                                                                   │
│  Google Gemini API:                                                │
│    gemini-2.0-flash (chat)                                       │
│    gemini-2.0-flash-lite (narrator, sentiment, beliefs, journals) │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 New File Map

All files added or modified by Phase 3:

```
src/
├── app/api/
│   ├── agents/
│   │   └── [agentId]/
│   │       ├── chat/route.ts              NEW
│   │       └── journal/route.ts           NEW
│   └── world/
│       ├── heartbeat/route.ts             NEW
│       └── time/route.ts                  EXISTING (no changes)
│
├── lib/
│   ├── ai/
│   │   ├── provider.ts                    NEW
│   │   ├── gemini.ts                      NEW
│   │   ├── openrouter.ts                  NEW (stub for future)
│   │   └── prompts/
│   │       ├── system.ts                  NEW
│   │       ├── narrator.ts                NEW
│   │       ├── sentiment.ts               NEW
│   │       ├── beliefs.ts                 NEW
│   │       └── journal.ts                 NEW
│   │
│   ├── memory/
│   │   ├── context.ts                     NEW
│   │   ├── relationships.ts               NEW
│   │   ├── events.ts                      NEW
│   │   ├── sessions.ts                    NEW
│   │   └── summaries.ts                   NEW
│   │
│   ├── world/
│   │   ├── heartbeat.ts                   NEW
│   │   ├── pressures.ts                   NEW
│   │   ├── categories.ts                  NEW
│   │   └── agentSelection.ts              NEW
│   │
│   └── supabase/
│       ├── client.ts                      EXISTING (no changes)
│       ├── server.ts                      EXISTING (no changes)
│       └── anonClient.ts                  EXISTING (no changes)
│
├── engine/settlement/
│   ├── npcManager.ts                      MODIFIED (add pause/resume)
│   ├── worldEventRenderer.ts              NEW
│   ├── speechBubble.ts                    NEW
│   ├── playerController.ts                MODIFIED (add disable/enable methods)
│   └── scenes/
│       └── SettlementScene.ts             MODIFIED (E key → chat, Realtime sub)
│
├── components/settlement/
│   ├── SettlementHUD.tsx                  EXISTING (no changes)
│   ├── InteractionPrompt.tsx              MODIFIED (connect to openChat)
│   ├── chat/
│   │   ├── ChatPanel.tsx                  NEW
│   │   ├── ChatMessages.tsx               NEW
│   │   ├── ChatInput.tsx                  NEW
│   │   ├── ChatHeader.tsx                 NEW
│   │   ├── AgentJournal.tsx               NEW
│   │   └── AgentTyping.tsx                NEW
│   └── ActivityFeed.tsx                   NEW
│
├── stores/
│   └── worldStore.ts                      MODIFIED (add activeChat, worldEvents)
│
└── types/
    ├── biome.ts                           EXISTING (no changes)
    ├── agent.ts                           NEW
    ├── chat.ts                            NEW
    └── events.ts                          NEW

supabase/migrations/
├── 0001-0007                              EXISTING
├── 0008_relationships.sql                 NEW
├── 0009_agent_events.sql                  NEW
├── 0010_conversation_sessions.sql         NEW
└── 0011_modify_agents_beliefs.sql         NEW
```

**Totals: ~25 new files, 4 modified files, 4 new migrations. No files deleted or rewritten.**

### 7.3 Build Sequence

Ordered so each stage produces a working, independently testable increment.

**STAGE 1 — Foundation (no LLM calls)**

| Step | File(s) | Verification |
|---|---|---|
| 1 | `supabase/migrations/0008-0011` | Run migrations. Verify tables created, columns added. |
| 2 | `src/types/agent.ts`, `chat.ts`, `events.ts` | TypeScript compiles. Types match schema. |
| 3 | `src/lib/ai/provider.ts`, `gemini.ts` | Call Gemini API with test prompt. Confirm response returns. |

**STAGE 2 — Human-to-Agent Chat**

| Step | File(s) | Verification |
|---|---|---|
| 4 | `src/lib/ai/prompts/system.ts` | Build system prompt for Forge (static personality only). Print to console. Verify structure. |
| 5 | `src/lib/memory/sessions.ts` | CRUD operations on conversation_sessions. Create, load, append message, end session. |
| 6 | `src/app/api/agents/[agentId]/chat/route.ts` | Send message via curl/Postman. Receive in-character response. Session persisted in DB. |
| 7 | `src/components/settlement/chat/*` (all 6 files) | Chat UI renders. Messages display. Input works. File attach works. |
| 8 | `src/stores/worldStore.ts` (modify) | activeChat slice works. openChat/closeChat actions fire. |
| 9 | `src/engine/settlement/scenes/SettlementScene.ts` (modify) | E key opens chat panel. Player input pauses. Close chat re-enables player. |
| 10 | `src/components/settlement/InteractionPrompt.tsx` (modify) | Prompt connects to openChat action. |
| 11 | File upload in ChatInput | Attach .py file, get code analysis. Attach PDF, get summary. |
| 12 | `src/lib/ai/prompts/sentiment.ts`, `src/lib/memory/summaries.ts` | Post-processing: sentiment classified, summary written to interactions table. |
| 13 | `src/lib/memory/context.ts`, `src/lib/memory/relationships.ts` | Context assembler injects memory. Talk to agent, close, talk again — agent references previous conversation. |

**STAGE 3 — World Heartbeat**

| Step | File(s) | Verification |
|---|---|---|
| 14 | `src/lib/world/pressures.ts` | Pressure calendar loads. Correct pressure active for current time/season. |
| 15 | `src/lib/world/categories.ts` | Cooldown system returns correct available categories given recent events. |
| 16 | `src/lib/world/agentSelection.ts` | Fairness scheduler selects agents correctly. Least-recently-active always included. |
| 17 | `src/lib/ai/prompts/narrator.ts` | Narrator prompt builds correctly with all context blocks. |
| 18 | `src/lib/world/heartbeat.ts` | Heartbeat orchestrator: manually trigger, confirm events written to agent_events. |
| 19 | `src/app/api/world/heartbeat/route.ts` | API route callable. QStash signature validation works. |
| 20 | QStash cron configuration | Cron fires every 6 minutes. Events appear in Supabase every cycle. |
| 21 | Supabase Realtime broadcast | Events push to connected clients via world-events channel. |
| 22 | `src/lib/ai/prompts/beliefs.ts` | Belief update prompt builds correctly. |
| 23 | Belief update integration in heartbeat | After several heartbeats, agent beliefs have evolved. Verify in DB. |

**STAGE 4 — Event Rendering in Phaser**

| Step | File(s) | Verification |
|---|---|---|
| 24 | `src/engine/settlement/speechBubble.ts` | Speech and thought bubbles render at correct position with typewriter effect. |
| 25 | `src/engine/settlement/npcManager.ts` (modify) | pauseAgent/resumeAgent work. NPC stops wandering on pause, resumes on resume. |
| 26 | `src/engine/settlement/worldEventRenderer.ts` | Event queue, stagger logic, visual sequences. |
| 27 | Realtime subscription in SettlementScene | Walk around settlement. See agents act out events with speech bubbles. |

**STAGE 5 — Observability UI**

| Step | File(s) | Verification |
|---|---|---|
| 28 | `src/components/settlement/ActivityFeed.tsx` | Open bulletin panel. Recent events listed with timestamps. |
| 29 | `src/lib/ai/prompts/journal.ts` | Journal rewrite prompt builds correctly. |
| 30 | `src/app/api/agents/[agentId]/journal/route.ts` | API returns journal entries in agent's voice. |
| 31 | `src/components/settlement/chat/AgentJournal.tsx` | Open journal from chat header. Today/This Week/Relationships tabs work. |

**STAGE 6 — Seed Data and Polish**

| Step | File(s) | Verification |
|---|---|---|
| 32 | Seed migration: relationships | Initial agent-agent relationships populated. |
| 33 | Seed migration: beliefs | Initial beliefs per agent populated. |
| 34 | Seed migration: events | 10-15 historical events backdated. |
| 35 | Full personality prompts for all 5 agents | Each agent responds with distinct voice, structural rules, and behavioral quirks. |
| 36 | Error handling pass | All failure modes return themed messages. No raw errors visible. |
| 37 | Loading states | Typing indicators, skeleton screens, smooth transitions. |

### 7.4 Connection to Phase 4 (Economy & Accounts)

Phase 3 builds infrastructure that Phase 4 plugs into:

| Phase 3 Produces | Phase 4 Uses It For |
|---|---|---|
| Chat pipeline + provider abstraction | User-registered agents use the same chat system with their own personality prompts |
| Conversation sessions | Extended consultations that cost World Credits |
| Heartbeat system + agent events | New agent arrivals trigger world pressure events ("A newcomer has appeared") |
| Relationships table | User-registered agents build relationships with platform agents automatically |
| Belief system | Platform agents form opinions about newly registered agents |
| Activity feed | Shows commerce events alongside social events |

Phase 4 adds Stripe, agent registration UI, World Credits, and property economy. It does not touch the interaction layer — it extends it.

### 7.5 Connection to Phase 5 (Polish & Launch)

| Phase 3 Produces | Phase 5 Refines |
|---|---|---|
| Chat panel | Mobile responsive layout, touch input |
| Heartbeat system | Performance monitoring, call budget dashboard |
| Event renderer | Animation polish, more emote variants |
| LLM calls | Latency optimization, response caching for repeated context |
| Memory system | Admin panel views for interaction logs and relationship graphs |

### 7.6 Success Criteria

When Phase 3 is complete, this end-to-end experience works:

> A player loads the application, zooms into Arboria, enters the settlement. While walking through the streets, they notice Mira and Forge talking near the workshop — speech bubbles appear with a brief exchange about bridge repairs. They approach Ember at the tavern and press E. A chat panel opens. Ember greets them warmly, mentions the rain, asks what brings them to the tavern. The player uploads a short story draft and asks for feedback. Ember responds in character — creative, metaphor-rich, encouraging. The player closes the chat, opens the Town Bulletin, and reads about events they missed. They click on Forge's journal and read his account of the day — terse, practical, opinionated. They close the journal and walk on. The world continues around them.

---

*End of Phase 3 Agent Interaction Layer Design Specification. Thank you.*