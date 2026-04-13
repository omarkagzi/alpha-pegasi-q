# Alpha Pegasi Q — Launch Strategy & Monetization Design

**Date:** 2026-04-10
**Status:** Approved (pending spec review)
**Scope:** Public launch strategy, pricing, go-to-market, infrastructure requirements, and post-launch decision framework

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Strategic Positioning & Narrative](#2-strategic-positioning--narrative)
3. [Competitive Landscape](#3-competitive-landscape)
4. [Free Tier Design (Traveler)](#4-free-tier-design-traveler)
5. [Paid Tier Design (Steward / Founder Launch)](#5-paid-tier-design-steward--founder-launch)
6. [Pre-Launch Infrastructure Checklist](#6-pre-launch-infrastructure-checklist)
7. [Legal & Compliance Baseline](#7-legal--compliance-baseline)
8. [Go-to-Market Plan](#8-go-to-market-plan)
9. [Post-Launch Decision Gates](#9-post-launch-decision-gates)
10. [Metrics & Analytics](#10-metrics--analytics)
11. [Build Sequence & Timeline](#11-build-sequence--timeline)
12. [Financial Projections](#12-financial-projections)
13. [Post-Launch Roadmap (Conditional)](#13-post-launch-roadmap-conditional)
14. [Constraints & Assumptions](#14-constraints--assumptions)
15. [Decisions Log](#15-decisions-log)

---

## 1. Executive Summary

Alpha Pegasi Q is a persistent digital world where autonomous AI agents live, form relationships, write journals, and evolve beliefs — whether or not a human is watching. Users visit as **Travelers** (free) or invest as **Stewards** (paid) to shape their personal world.

**Launch model:** Public launch via Product Hunt, X (Twitter), and Hacker News. Single paid tier with scarcity-driven Founder pricing. Generous free tier designed as a "living preview" that converts through emotional engagement, not feature deprivation.

**Key decisions made:**

- Approach: Free tier + single "Founder" paid tier at launch (no multi-tier complexity)
- Pricing: $8/month for the first 500 paying users, $10/month standard after that
- Grandfathering: 12-month price lock for Founders, then rolls to standard with 30-day advance notice
- Revenue model: Subscription-led (no credit system at launch)
- Target audience: Creative worldbuilders (primary), AI hobbyists (secondary), developers/researchers (tertiary)
- Infrastructure budget ceiling: $50-150/month with zero revenue
- Timeline: 6 weeks to public launch
- Success threshold: 50+ paying Stewards and 15%+ 30-day retention at day 30

---

## 2. Strategic Positioning & Narrative

### 2.1 One-Sentence Pitch

> *"Alpha Pegasi Q is a persistent digital world where autonomous AI agents live, talk, and remember — and you visit as a traveler to watch their stories unfold."*

### 2.2 Target Audience (Priority Order)

1. **Creative worldbuilders** — The emotional core. They come for the story and stay for the agents. They want to watch AI characters develop personalities, relationships, and stories over time. Highest retention segment.
2. **AI hobbyists and tinkerers** — Early adopters and evangelists. They want to experiment with different models in a persistent environment. They share it on X because it's technically novel. Highest word-of-mouth potential.
3. **Developers and AI researchers** — Smaller but higher-value segment. They want to test models in a social simulation environment. They convert to paid quickly once they see persistence working. Longest customer lifetime value.

### 2.3 Explicit Non-Audiences

Clarity on who the product is NOT for prevents wasted marketing and misaligned feature requests:

- People seeking a 1:1 AI companion or girlfriend (Replika, Nomi, SoulLink own this)
- People seeking uncensored NSFW roleplay (SpicyChat, DreamGen own this)
- People seeking a chatbot assistant (ChatGPT, Claude own this)
- People who want to self-host or build from source (AI Town open-source owns this)
- People seeking a multiplayer shared world (not the product model — each user has their own personal world)

### 2.4 Positioning Line

> *"Character.AI gives you characters. AI Town gives you a repo. Alpha Pegasi Q gives you a world."*

### 2.5 Narrative Frame: Traveler to Steward

The product uses a narrative frame for its tiers rather than transactional language:

- **Traveler:** A visitor passing through the world. Can observe, explore, and have limited conversations. The world exists independently of them.
- **Steward:** Someone who has chosen to invest in the world. They shape it by adding their own agents, accessing deeper memories, and participating more fully. The world grows with them.

This frame is reflected in all paywall messaging, upgrade prompts, and marketing copy. The upgrade is not "buy more features" — it is "commit to this world."

### 2.6 Three-Beat Launch Story

Used across PH, X, and HN:

1. **The hook:** "I built a world where AI agents live autonomous lives. They remember each other. They have relationships. They do things while you're not looking."
2. **The proof:** A 30-second screen recording showing: orbital view → zoom to Arboria → talk to Mira → check activity feed showing agent-to-agent conversation → open agent journal with an entry about it.
3. **The ask:** "Try the free tier. If it feels alive, become a Steward for $8 (only 500 seats)."

---

## 3. Competitive Landscape

### 3.1 Direct Competitors (Persistent Agent Worlds)

| Competitor | What they do | Why they're not a threat at launch |
|---|---|---|
| **Fable Simulation ("The Simulation")** | Vision of "1 million AIs living, working, falling in love." Character NFT-based. | Years from consumer launch. VC-heavy, research-stage. Not shipping a consumer product. |
| **Altera** | Minecraft multi-agent civilizations. a16z + Eric Schmidt backed. | Research-focused. Not a consumer product. Minecraft-dependent. |
| **AI Town (a16z open source)** | MIT-licensed re-implementation of Stanford's Smallville. | A GitHub repo, not a product. High technical barrier. No onboarding, no persistence, no payments. Alpha Pegasi Q's closest conceptual cousin but most distant competitive threat. |
| **Colony (Parallel Studios)** | Survival game with Gemini-powered agents maintaining persistent memory offline. | Game-first, not world-first. Different product category. |

### 3.2 Adjacent Competitors (Character Chat with Memory)

| Competitor | Price | Key difference from Alpha Pegasi Q |
|---|---|---|
| **Character.AI** | Free + $10/mo | Dominant but weak memory, single-character focus, no persistent world, no agent-to-agent interaction |
| **Replika** | $7-15/mo | One companion, strong memory, no world context |
| **SoulLink** | Free + paid | Companion with backstory/world context, but still 1:1 relationship |
| **DreamGen** | $5-25/mo | Multi-character scenes, but weak persistence, writing-tool oriented |
| **DreamJourneyAI** | Varies | "Memory Nexus" for persistence, still character-centric |
| **NovelAI** | $10/$15/$25/mo | Narrative writing + lorebook. Creator tool, not a world. |

### 3.3 The Gap Alpha Pegasi Q Owns

No consumer product currently offers:

- **Browser-accessible** persistent world (no install, no self-hosting)
- **Autonomous agent-to-agent interaction** that happens without human prompting
- **Emergent relationships and beliefs** that evolve over time through a world heartbeat
- **Personal worlds** where each user has their own instance of the simulation

The closest conceptual equivalent is the Stanford Smallville experiment, but that was a research paper. Alpha Pegasi Q is the first attempt to make that concept a consumer product with persistence, payments, and a narrative frame.

### 3.4 Pricing Context

The competitive landscape establishes a price ceiling:

- Character.AI+: $10/mo
- Replika Pro: $7-15/mo
- NovelAI Tablet: $10/mo
- DreamGen Starter: $5/mo

Alpha Pegasi Q's $8 Founder / $10 Standard pricing sits competitively within this range while offering a differentiated product (a world, not a chat interface).

---

## 4. Free Tier Design (Traveler)

### 4.1 Core Principle

The free tier is a **living preview**, not a degraded product. A Traveler should feel the world breathing within 60 seconds of arrival, have at least one emotionally resonant conversation, and hit the limit at a moment of engagement — not frustration.

### 4.2 Traveler Entitlements

| Capability | Traveler Limit | Rationale |
|---|---|---|
| Personal world | 1 (auto-created on signup — their own Arboria) | One world is the product experience. Multi-world is post-launch. |
| Platform agents | All 5 (Mira, Forge, Archon, Ledger, Ember) | Full agent access drives emotional attachment. Restricting agents would feel arbitrary. |
| **Chat turns per day** | **10, shared across all agents, resets at local midnight** | Enough for one meaningful conversation. Competitors range from 5-50. 10 creates attachment without satisfying it fully. |
| Heartbeat cadence | Every 30 min when world is active; collapses to daily digest after 3 days dormant | Keeps the world "alive" at low cost. 30-min cadence is 12x cheaper than Steward's 6-min cadence. |
| Activity feed | Read-only, full visibility | Free to serve (Supabase realtime). Drives the "living world" feeling without LLM cost. |
| Daily recap | "What happened while you were away" — generated once per day, cached | Single LLM call per world per day. Negligible cost. High retention value. |
| Relationship view | Shallow — sees sentiment label + arc stage only | Notable moments and full history are the Steward conversion lever. |
| Conversation history | **Last 3 days visible in UI** | Tighter than industry standard. Creates urgency to upgrade before conversations fade. |
| Custom agents | Locked (clear CTA to become a Steward) | Core Steward value prop. Strictly gated. |
| File attachments | Locked | Cost control + conversion lever. |
| LLM model | Groq `llama-3.1-8b-instant` only (policy-enforced, not user-visible) | Cheapest viable model. Good enough for engaging conversation. Users don't see model names. |
| Session retention | 7 days (then auto-archived by cleanup cron) | Matches the existing cleanup system. |
| Data export | Not available | Post-launch feature for Stewards. |

### 4.3 Engineered Paywall Moments

These are the three moments designed to convert Travelers to Stewards. Each uses narrative framing, not transactional messaging.

**Moment 1 — Chat cap reached (primary conversion point):**
When a Traveler exhausts 10 daily turns, the agent they're speaking with delivers a narrative closure:

> *"The settlement grows quiet for the night. Return tomorrow, or become a Steward to stay longer."*

Below the message: a single button — "Become a Steward — $8 (X of 500 seats left)."

The agent's message is generated by the backend (`quota_exceeded: true` + `narrative_message` field in the API response), not a frontend popup. This makes it feel like part of the world, not a paywall.

**Moment 2 — Custom agent creation wall (secondary conversion point):**
When a Traveler clicks "Add Agent" (or a similar creation entry point), they see the creation form behind a soft scrim with:

> *"Stewards can shape their world by adding their own agents. X of 500 Founder seats remaining."*

This shows them what they'd get without making them feel punished for exploring.

**Moment 3 — Memory depth wall (tertiary conversion point):**
When scrolling back through conversation history, the view fades out at the 3-day boundary:

> *"Deeper memories are preserved for Stewards."*

This is the most subtle conversion point. It activates only when a user cares enough to scroll back — meaning they're already invested.

### 4.4 Cost Envelope at Scale

Budget model for 500 concurrent Travelers (conservative assumptions):

| Cost Source | Daily | Monthly |
|---|---|---|
| Chat (5,000 turns/day max × Groq `llama-3.1-8b-instant`) | ~$0.50 | ~$15 |
| Heartbeat (100 active worlds × 48 events/day × lite model) | ~$1.00 | ~$30 |
| Post-processing (heuristic sentiment, no LLM for free tier) | ~$0 | $0 |
| Daily recap (500 worlds × 1 LLM call/day) | ~$0.05 | ~$1.50 |
| Supabase (free tier or Pro at $25) + Vercel (Hobby/Pro) | — | ~$25 |
| **Total projected** | | **~$70/month** |

This fits within the $50-150 budget ceiling with headroom for growth spikes. Adaptive heartbeat + dormant-world collapse prevents runaway costs if a PH launch sends 2,000+ users in a day.

### 4.5 Explicit Exclusions from Free Tier

These features are either too expensive, not yet built, or reserved as post-launch growth moves:

- Multi-world support
- Custom agent creation or BYO agent
- BYO API key (not available on any tier at launch)
- Advanced memory graph or belief inspector UI
- Multi-provider routing (Travelers always use Groq lite)
- Data export or world snapshots
- File attachments in chat
- Priority queue or faster response times

---

## 5. Paid Tier Design (Steward / Founder Launch)

### 5.1 Core Promise

A Steward is a Traveler who chose to invest in their world. The upgrade narrative: *"You've been visiting. Now make it yours."* The tier unlocks depth, permanence, and creative agency — not just "more messages."

### 5.2 Steward Entitlements

| Capability | Steward Limit | Difference from Traveler |
|---|---|---|
| Personal world | 1 (multi-world is post-launch) | Same |
| Platform agents | All 5 | Same |
| **Chat turns per day** | **50, shared across all agents, resets at local midnight** | 5x increase |
| **Custom agents** | **1 active slot** (bring your own persona/prompt — platform routes the model) | New capability |
| Heartbeat cadence | Full 6-minute cadence; adaptive collapse only after 7 days dormant | 5x more frequent world activity |
| Activity feed | Full visibility + agent dialogue snippets in events | Richer detail |
| Daily recap | Personalized ("Forge asked about you today") | Personalized vs generic |
| Relationship view | Full depth — notable moments, shared topics, arc stage history | Full visibility |
| **Conversation history** | **Full history retained (30+ days, no UI fade)** | 10x longer retention |
| File attachments | Up to 40KB per message (matching current code) | New capability |
| LLM model | Policy router selects tier-appropriate model (mid-tier Groq `llama-3.3-70b-versatile` for chat) | Better model quality |
| Post-processing | LLM-driven sentiment analysis + richer conversation summaries | Richer metadata |
| Steward badge | Displayed in chat UI, profile, activity feed | Status marker |
| Priority queue | Steward requests processed before Traveler requests when system is under load | Reliability under load |

### 5.3 Founder Launch Mechanics (The 500-Seat Scarcity Model)

**Pricing lifecycle:**

| Phase | Price | Who | Duration |
|---|---|---|---|
| **Founder launch (seats 1-500)** | $8/month | First 500 paying users | 12 months price-locked from individual signup date |
| **Standard (seats 501+)** | $10/month | All new Stewards after 500 | Ongoing (may adjust with 30-day notice) |
| **Founder renewal (month 13+)** | Rolls to then-current standard price | Original Founders | With 30-day advance email notice |

**Scarcity mechanics (the marketing engine):**

1. **Public seat counter** on the landing page and upgrade modal. Displays: *"X of 500 Founder seats remaining."* Updates near-real-time (hourly refresh is acceptable). Visible on:
   - Landing page hero section
   - `/steward` upgrade page
   - In-chat paywall narrative message
   - X/PH marketing materials

2. **Milestone marketing moments** — post on X at seat 100, 250, 400, 450, and 500. Each is a free, organic marketing moment with social proof.

3. **"SOLD OUT" state** — when counter hits 500, all surfaces flip to: *"Founder seats are gone. Become a Steward at $10/month."* The sellout itself is a post-worthy marketing moment.

4. **Founder badge with seat number** — visible in the user's profile: *"Founder #142 — locked at $8 until [date]."* Creates badge-of-honor status and shareable screenshots.

**Annual pricing option (not at launch):** An $80/year option ($6.67/mo effective) can be introduced post-launch if monthly churn is high. Not included at launch to keep Stripe setup minimal.

### 5.4 Stripe Implementation (Deliberately Simple)

**Product structure:**
- One Stripe Product: "Alpha Pegasi Q — Steward"
- Two Stripe Price objects under that Product:
  - `steward_founder`: $8/month recurring
  - `steward_standard`: $10/month recurring

**Checkout flow:**
- User clicks "Become a Steward" → application checks Founder seat counter → creates Stripe Checkout Session with the appropriate Price ID → redirects to Stripe-hosted Checkout → returns to `/world` on success

**Webhook handlers (3 required):**

| Webhook Event | Action |
|---|---|
| `checkout.session.completed` | Increment Founder counter (if applicable). Update `users.tier` to `steward`. Store `stripe_customer_id` and `stripe_subscription_id` on user record. Record `founder_seat_number` if applicable. |
| `customer.subscription.deleted` | Downgrade `users.tier` to `traveler`. Preserve conversation history (don't delete data). |
| `invoice.payment_failed` | Mark user as `payment_grace` status. Allow 3-day grace period. If still failed after 3 days, downgrade to `traveler`. Send notification email. |

**Founder seat counter:**
- Stored as an atomic counter in a Supabase config table (`app_config.founder_seats_claimed`)
- Incremented inside the `checkout.session.completed` webhook handler (not on checkout start — prevents phantom seat claims from abandoned checkouts)
- When counter >= 500, the checkout flow switches to `steward_standard` Price
- Race condition handling: allow up to 510 Founders if sessions race (10-seat buffer). The slight over-allocation costs ~$20/month total and is cheaper than building distributed locks.

**Customer portal:**
- Stripe's hosted Customer Portal for self-serve cancellation, payment method updates, and invoice history
- Linked from a "Manage Subscription" button in user settings
- Zero custom UI required — Stripe hosts everything

**No credit ledger at launch.** The draft plans' credit system is a post-launch addition. For launch, entitlement is binary: Traveler or Steward. This eliminates an entire accounting system from the launch scope.

### 5.5 Upgrade Flow (The Conversion Path)

1. Traveler hits a paywall moment (chat cap, agent creation wall, or memory depth wall)
2. Narrative prompt appears in-world (diegetic message from the agent, not a popup modal)
3. Click leads to `/steward` — a single-page upgrade screen containing:
   - The Founder seat counter (live)
   - 3-bullet summary of what unlocks (50 turns, custom agent, full memory)
   - Stripe Checkout button or redirect
   - One testimonial slot (empty at launch, filled with real quotes post-launch)
4. Post-purchase: return to exactly the conversation they were having, now unblocked. The agent they were speaking with delivers a brief acknowledgment: *"Welcome back, Steward."*

The "return to mid-conversation" detail is critical. It means upgrading doesn't feel like a transaction — it feels like the story continuing without interruption.

### 5.6 Cost Envelope at 100 Stewards

| Cost Source | Monthly |
|---|---|
| Steward chat (50 turns/day × 100 users × Groq `llama-3.3-70b-versatile`) | ~$80 |
| Steward heartbeat (6-min cadence × 100 active worlds, capped tokens) | ~$40 |
| Custom agent overhead (100 custom agents × incremental heartbeat cost) | ~$15 |
| LLM post-processing (sentiment + summaries for Steward sessions) | ~$10 |
| Stripe fees (2.9% + $0.30 per $8 transaction × 100) | ~$55 |
| **Steward-side total** | **~$200** |

**Revenue at 100 Stewards × $8:** $800/month
**Net after Steward costs + Traveler costs ($70):** ~$530/month margin

**At 500 Founders (maximum):** $4,000/month revenue, ~$700/month costs, ~$3,300/month net margin.

### 5.7 Conversion Modeling

| Scenario | Traveler-to-Steward rate | Stewards | Monthly revenue |
|---|---|---|---|
| **Conservative** | 5% | 25 (of 500 Travelers) | $200 |
| **Moderate** | 10% | 50 | $400 |
| **Optimistic** | 20% | 100 | $800 |
| **Exceptional** | 40%+ | 200+ | $1,600+ |

Plan for the conservative scenario. Celebrate if you exceed it. The 20% model requires strong PH performance + effective scarcity mechanics + excellent onboarding.

---

## 6. Pre-Launch Infrastructure Checklist

Everything in this section must ship before the landing page accepts real users. Organized by priority.

### 6.1 P0 — Ship-Blocking (Cannot Launch Without)

#### 6.1.1 LLM Policy Router

**What:** A single `choosePolicy(feature, tier)` function that replaces all scattered `createProvider('groq', ...)` calls across the codebase.

**Why first:** Every other system depends on this. Quotas need to know which model to enforce limits against. Tier-aware behavior starts here. Currently, the chat endpoint selects provider/model from the agent record (good), but heartbeat, journals, and post-processing each hardcode their own provider choice (bad). A single router makes the entire system tier-aware and provider-resilient.

**Scope:**
- Features governed: `chat`, `heartbeat`, `journal`, `summary`, `sentiment`
- Tier-aware model selection:
  - Traveler chat: `llama-3.1-8b-instant` (Groq)
  - Steward chat: `llama-3.3-70b-versatile` (Groq)
  - Heartbeat/journal/summary (all tiers): `llama-3.1-8b-instant` (Groq) — background processes always use the cheapest model
- Fallback chain: if primary provider (Groq) returns 429 or 500, fall back to Gemini with these mappings:
  - Traveler chat fallback: `gemini-2.0-flash` (comparable to `llama-3.1-8b-instant`)
  - Steward chat fallback: `gemini-2.0-flash` (comparable to `llama-3.3-70b-versatile`)
  - Heartbeat/journal/summary fallback: `gemini-2.0-flash` (cheapest available)
- Token budget enforcement: hard `max_tokens` per feature per tier, set in policy, not in route handlers
- Temperature and response format (text vs JSON) set per feature in policy

**Current code that changes:**
- `src/app/api/world/heartbeat/route.ts` — currently calls `createProvider('groq', ...)` directly
- `src/lib/chat/postProcessor.ts` — currently calls `createProvider('groq', ...)` for sentiment and summaries
- `src/app/api/agents/[agentId]/journal/route.ts` — currently uses Groq directly
- `src/app/api/agents/[agentId]/chat/route.ts` — already per-agent, but should route through policy for tier enforcement

**Launch bug to fix simultaneously:** `createProvider()` throws on `deepseek` because it's not implemented. Either implement a DeepSeek adapter or remove `deepseek` from the provider type union and prevent it from being selectable in the database. A runtime crash from a DB value is unacceptable at launch.

**Estimated effort:** 2-3 days

#### 6.1.2 Server-Side Usage Quotas

**What:** Per-user daily chat turn counter with tier-aware enforcement, plus per-IP burst rate limiting.

**Why:** The single highest-risk cost item. Without quotas, a viral PH launch could generate thousands of uncapped LLM calls and blow through the budget in hours.

**Implementation:**
- **Daily turn counter:** Stored in Supabase (a `user_daily_usage` table with `user_id`, `date`, `chat_turns_used`). Incremented atomically on each chat request. Checked before LLM call, not after.
- **Tier limits:** Traveler = 10 turns/day. Steward = 50 turns/day. Limits read from a config table, not hardcoded, so they can be adjusted without a deploy.
- **Reset:** At midnight UTC. All daily counters key on UTC date. No local timezone handling for v1.
- **Enforcement point:** In `/api/agents/[agentId]/chat/route.ts`, before context assembly and LLM call. If quota exhausted, return `{ quota_exceeded: true, narrative_message: "..." }` with a 200 status (not 429 — the frontend renders this as an in-world message, not an error).
- **Per-IP burst rate limit:** 60 requests/minute using Upstash Ratelimit or Vercel's built-in rate limiting. Returns 429 on breach. This prevents hammering, not usage — it's a safety net, not a product feature.
- **Token budget per request:** The policy router sets hard `max_tokens` per feature per tier. This prevents a single request from consuming an outsized budget even within the turn count.

**Estimated effort:** 1-2 days

#### 6.1.3 Stripe Integration

**What:** Payment processing for the Steward subscription with Founder scarcity mechanics.

**Scope:** See Section 5.4 for full Stripe implementation details. Summary:
- One Product, two Prices (`steward_founder` at $8, `steward_standard` at $10)
- Stripe Checkout redirect (not embedded — faster to ship)
- Three webhook handlers: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
- Founder seat counter (atomic Supabase counter, switched at 500)
- Stripe Customer Portal for self-serve management

**New database additions:**
- `users.stripe_customer_id` (text, nullable)
- `users.stripe_subscription_id` (text, nullable)
- `users.founder_seat_number` (integer, nullable)
- `users.subscription_status` (enum: `none`, `active`, `past_due`, `canceled`)
- `app_config` table with `key`/`value` rows, including `founder_seats_claimed`

**Tier enum values (canonical):** The `users.tier` column uses these values: `traveler` (free), `steward` (paid). The existing codebase uses `visitor` and `explorer` — these should be migrated to `traveler` and `steward` respectively to match the product narrative. The current `steward` value in the schema can remain as-is.

**Estimated effort:** 2-3 days

#### 6.1.4 Adaptive Heartbeat

**What:** Tier-aware and activity-aware heartbeat cadence to control background simulation costs.

**Implementation:**
- **Active Steward world (user active in last 7 days):** Full 6-minute heartbeat (current cadence)
- **Active Traveler world (user active in last 3 days):** 30-minute heartbeat
- **Dormant world (no activity beyond threshold):** Daily digest mode — one summary event per day instead of continuous simulation
- **Activity detection:** Based on `users.last_login` or last chat timestamp, checked at the start of each heartbeat cycle
- **Per-heartbeat event budget:** Hard cap at 3 events per heartbeat (already partially implemented — make it strict and non-overridable)
- **Belief updates:** Continue running every 4th heartbeat for active worlds. Skip for dormant worlds.

**Current code that changes:**
- `src/app/api/world/heartbeat/route.ts` — add world-activity check at pipeline start, skip dormant worlds, adjust event count based on tier
- `vercel.json` / QStash schedule — no change to the 6-minute trigger; the route itself decides what to do per world

**Estimated effort:** 1 day

#### 6.1.5 Authentication & Middleware Hardening

**What:** Fix known auth gaps and rotate development secrets before production.

**Specific actions:**
1. **Fix middleware matcher:** Currently `/api/agent(.*)` — should be `/api/agents(.*)`. This is a potential auth bypass on agent routes. The handlers do their own auth checks (good), but middleware should be the first line of defense.
2. **Verify every API route checks auth independently:** Defense in depth. Don't rely solely on middleware. Each route handler should verify the Clerk JWT and reject unauthorized requests.
3. **Rotate secrets before launch:**
   - `CRON_SECRET` — generate a new value, update in Vercel env vars and QStash config
   - `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` — rotate via Upstash dashboard
   - Verify `GROQ_API_KEY` is not committed to the repository (it currently appears in the draft plans — ensure it's in `.env.local` only)
4. **Block unauthenticated heartbeat access:** Ensure `/api/world/heartbeat` only accepts requests with valid QStash signature or Vercel Cron bearer token. No public access.

**Estimated effort:** 0.5 days

### 6.2 P1 — Should Ship at Launch (High Risk if Missing)

#### 6.2.1 Error Monitoring (Sentry)

**What:** Sentry free tier integration for Next.js server and client error capture.

**Scope:**
- Sentry Next.js SDK installation and configuration
- Server-side error capture for all API routes
- Client-side error capture for React components
- Specific capture for: LLM provider failures (429s, 500s, timeouts), Stripe webhook failures, quota enforcement rejections, heartbeat pipeline errors
- Alert channel: email notification for critical errors (P0 severity)
- Sentry free tier: 5,000 errors/month, 90-day retention — sufficient for launch

**Estimated effort:** 0.5 days

#### 6.2.2 Basic Analytics (PostHog)

**What:** PostHog free tier for product analytics and funnel tracking.

**Scope:**
- PostHog snippet installed in Next.js app
- 12 custom events tracked (see Section 10 for full event list)
- UTM parameter passthrough from landing page through Clerk signup to first world load
- PostHog free tier: 1M events/month — sufficient for launch scale
- GDPR consideration: configure PostHog to respect cookie consent; optionally geo-filter EU visitors to avoid consent complexity at launch

**Estimated effort:** 0.5 days

#### 6.2.3 Landing Page

**What:** Public-facing page at `/` that replaces the current redirect to `/world`.

**Content requirements:**
- Hero section: one-sentence pitch + 30-second demo video or animated GIF
- "Enter the World" primary CTA → Clerk signup → redirect to `/world`
- Founder counter widget (reads from Supabase `app_config.founder_seats_claimed`, renders remaining seats)
- Three feature panels below the fold:
  1. "A Living World" — agents talk, trade, and form relationships on their own
  2. "Persistent Memory" — every conversation, relationship, and event is remembered
  3. "Your Agents" — create your own characters and watch them become part of the world
- Social proof section (empty at launch; placeholder for user quotes post-launch)
- Footer: Privacy Policy link, Terms of Service link, contact email
- Mobile responsive (many PH visitors browse mobile)

**Estimated effort:** 2-3 days

#### 6.2.4 Onboarding Flow (First 60 Seconds)

**What:** Guided first experience that replaces a tutorial with in-world narrative.

**Flow:**
1. New user loads Arboria → camera auto-pans to Mira at the Settlement Gate
2. Mira initiates a welcome message (not waiting for user input): *"Welcome to Arboria, traveler. I'm Mira — I help people find their way here."*
3. After 2-3 natural exchanges, Mira subtly guides: *"Things happen here even when you're not around. You might want to check the Activity Feed sometime — Forge and Archon had an interesting exchange earlier."*
4. Activity Feed icon pulses gently to draw attention
5. No modal tutorials, no tooltips, no "Step 1 of 5" — the world IS the tutorial

**Why this matters:** The first 60 seconds determine whether someone stays or bounces. A world that greets you is fundamentally more compelling than a world that waits for you to figure it out.

**Estimated effort:** 1-2 days

### 6.3 P2 — Ship Within 2 Weeks Post-Launch

#### 6.3.1 Daily Recap System

**What:** "While you were away..." card shown on login for worlds with recent activity.

**Implementation:**
- Daily cron job (06:00 UTC): for each world with heartbeat events in the last 24 hours, generate a 2-3 sentence summary using Groq lite model
- Store in a `world_recaps` table (`world_id`, `recap_date`, `content`, `created_at`)
- Display as a card on the world load screen before entering the settlement
- Cache aggressively — one generation per world per day, served to the user on login

**Cost:** ~$1.50/month for 500 worlds. Negligible.

**Estimated effort:** 1 day

#### 6.3.2 Narrative Paywall Messages

**What:** Replace generic quota/error messages with agent-voiced narrative limits.

**Implementation:**
- Chat API returns `{ quota_exceeded: true, narrative_message: "..." }` when daily limit hit
- Frontend renders the agent saying the limit message within the chat flow, not as a system toast or error modal
- Message templates vary by agent (Mira says something different from Forge)
- Upgrade CTA button appears below the narrative message with Founder counter

**Estimated effort:** 0.5 days

#### 6.3.3 Custom Agent Creation UI (Steward Only)

**What:** Form for Stewards to create one custom agent in their world.

**Implementation:**
- UI: form with fields for name, personality prompt (textarea with character limit), and settlement zone assignment (dropdown)
- Backend: insert into `agents` table with `owner_id` = current user, `provider`/`model_id` set by policy router based on tier
- Validation: profanity/content filter on name, 2000-character limit on personality prompt, zone must be a valid Arboria zone
- Custom agent joins the heartbeat cycle on the next heartbeat tick
- Custom agent appears in the settlement scene at the assigned zone
- Steward can edit or pause their custom agent (pause removes from heartbeat, doesn't delete)

**Estimated effort:** 2-3 days

---

## 7. Legal & Compliance Baseline

### 7.1 Privacy Policy

**Required disclosures:**
- Data collected: email address (via Clerk), chat messages, world state, usage analytics
- Purpose: providing the service, improving the product, processing payments
- Third-party processors: Supabase (database), Clerk (authentication), Groq (LLM processing), Stripe (payments), PostHog (analytics), Sentry (error monitoring)
- LLM disclosure: chat messages are sent to Groq for processing. Groq's API policy states they do not train on API inputs. This should be stated explicitly — it's a trust-building detail.
- Retention: chat sessions archived after 30 days (messages cleared), account data retained until deletion request
- User rights: right to request data deletion via email
- Contact: privacy email address

**Implementation:** Generate via Termly (free tier) or iubenda, customize with the above specifics, host at `/privacy`.

### 7.2 Terms of Service

**Required sections:**
- Acceptable use: no illegal content, no attempts to manipulate or exploit agent behavior for harmful purposes, no automated access beyond the provided API
- Service availability: provided "as-is," no SLA, service may be interrupted for maintenance
- Subscription terms: monthly billing cycle, cancel anytime via Stripe Customer Portal, no refund for partial months
- Refund policy: full refund within 7 days of first payment if requested via email. No refunds after 7 days. This is generous enough to build trust, bounded enough for protection.
- Age requirement: 13+ (avoids COPPA compliance while maintaining reasonable audience breadth)
- Intellectual property: user retains ownership of their custom agent prompts and content. Platform retains right to display user-generated content within the service.
- Limitation of liability: standard limitation clause

**Implementation:** Generate via Termly or iubenda, customize, host at `/terms`.

### 7.3 Cookie Consent

**What's required:** GDPR requires notice and consent for non-essential cookies (PostHog analytics). Clerk authentication cookies are "strictly necessary" and don't require consent.

**Minimal implementation:** A banner on first visit: *"We use cookies for authentication and analytics. [Accept] [Learn more →]"*

**PostHog configuration:** Set to respect consent — don't fire analytics events until user accepts. This is a PostHog configuration flag, not custom code.

**Pragmatic GDPR shortcut for launch:** Optionally geo-filter PostHog to not load for EU visitors. This avoids consent complexity entirely for launch. Not a permanent solution, but acceptable for an indie product's first month.

### 7.4 Stripe Business Setup

- Stripe account: can operate as sole proprietor (individual) initially
- Stripe Tax: enable automatic sales tax calculation for US customers (+~0.5% per transaction). International tax is handled at a basic level by Stripe.
- Business email: required for Stripe account, support inquiries, and legal contact. A simple `hello@[yourdomain]` or `support@[yourdomain]` is sufficient.

### 7.5 Data Deletion Path

- At launch: manual process. User emails the privacy address, developer runs a Supabase query to delete their records.
- Document in privacy policy: "Email [privacy email] to request data deletion. We will process requests within 30 days."
- Automated self-serve deletion: post-launch enhancement.

### 7.6 What Does NOT Need to Exist at Launch

- HIPAA compliance (not applicable)
- SOC 2 certification (enterprise-tier, years away)
- Data Processing Agreements (only needed for B2B/enterprise)
- Automated GDPR data portability export (manual process acceptable at indie scale)
- Lawyer-reviewed legal documents (advisable when revenue justifies it, not required for launch)

**Total estimated effort for all legal items: ~1 day**

---

## 8. Go-to-Market Plan

### 8.1 Launch Narrative

The core marketing message is not "an AI app" — it is **a feeling**: *"There's a world running right now, and things are happening in it without you."*

That feeling — curiosity about what agents did while the user was gone — drives clicks, signups, and return visits. Every piece of launch content creates or reinforces this feeling.

### 8.2 Pre-Launch X (Twitter) Drip — 14 Days Before PH

Build an audience before launch day, not on launch day. Each post takes ~15 minutes to create. If even one goes semi-viral in the AI community, the PH launch starts with warm traffic instead of cold.

| Timing | Post Type | Content |
|---|---|---|
| **D-14** | Concept tease | *"I'm building a world where AI agents live autonomous lives. They form relationships, write journals, and do things while you sleep. Launching soon."* + orbital-view screenshot |
| **D-10** | Behind-the-scenes | *"Here's what happens every 6 minutes in Alpha Pegasi Q: agents talk, form opinions, update their beliefs. No human involved."* + short screen recording of heartbeat activity feed |
| **D-7** | Agent introduction | *"Meet Mira. She's the first person you'll talk to when you enter Arboria. She remembers everyone she's met."* + screenshot of Mira chat exchange |
| **D-5** | "Alive" proof | *"I left my world running overnight. Forge and Archon had 3 conversations I didn't plan. Archon now thinks Forge is 'pragmatic but guarded.' This wasn't scripted."* + screenshot of beliefs or journal |
| **D-3** | Founder scarcity | *"500 Founder seats at $8/month. Once they're gone, price goes to $10. Launching on Product Hunt [date]."* |
| **D-1** | Countdown | *"Tomorrow. The world opens."* |

### 8.3 Secondary Channel Seeding (Low Effort, High Optionality)

| Channel | Timing | Format |
|---|---|---|
| **r/artificial** | D-5 or D-3 | Text post with the "alive proof" content. Genuine, not promotional. |
| **r/singularity** | D-5 or D-3 | Same content, different framing (focus on emergent behavior). |
| **r/IndieHackers** | D-3 | "I'm launching my first paid product" narrative — indie community loves build-in-public stories. |
| **AI-focused Discord servers** | Launch day | Drop link in #showcase or #projects channels. Brief, not spammy. |
| **Hacker News** | Launch day | "Show HN: I built a persistent world where AI agents live autonomous lives" + demo link. HN loves technical novelty. |

### 8.4 Product Hunt Launch Kit

Prepare all assets before launch day. Do not create these the night before.

**Tagline (60 chars max):**
> *"A persistent world where AI agents live, talk, and remember"*

**Description (260 chars):**
> *"AI agents live autonomous lives in a digital world. They form relationships, write journals, and evolve beliefs — even when you're not watching. Visit as a Traveler for free, or become a Steward to shape the world."*

**First comment (the most-read piece of copy on PH):**

> *Hey PH! I'm Omar, and I've been building Alpha Pegasi Q for the past 2 months.*
>
> *The idea: what if AI agents didn't just respond to you — they actually lived somewhere? Had neighbors? Formed opinions about each other?*
>
> *Alpha Pegasi Q is a persistent digital world where 5 AI agents live in a settlement called Arboria. Every 6 minutes, the world generates events — agents talk, trade, argue, and evolve. They remember everything. When you visit, you're entering their world, not creating it.*
>
> *Free to explore (10 conversations/day). First 500 Stewards get locked in at $8/month.*
>
> *I'd love to hear what you think — especially what you'd want to see the agents do next.*

**Media assets (prepare in advance):**
- Hero image (1270×760): composite showing orbital view → Arboria → chat with agent
- Gallery images (3-4): activity feed with events, agent journal entry, relationship view, settlement top-down pixel art
- Demo video (30 seconds): orbit → zoom → walk to Mira → chat → check activity feed → journal. Captions, no voiceover.
- GIF (for X embed): 10-second loop of the heartbeat activity feed showing agents interacting in real-time

### 8.5 Launch Day Execution

| Time | Action |
|---|---|
| **6:00 AM PT** | PH listing goes live (schedule in advance via PH dashboard) |
| **6:15 AM** | Post first comment on PH |
| **6:30 AM** | Pinned X post: *"Alpha Pegasi Q is live on Product Hunt. A persistent world where AI agents live autonomous lives. Free to explore. First 500 Stewards at $8/month."* + PH link + demo GIF |
| **7:00 AM** | Submit "Show HN" on Hacker News |
| **Throughout day** | Reply to every PH comment. Engage with X replies. Monitor Sentry for errors. Watch the Founder counter. |
| **Evening** | Thank-you post on X with day-1 numbers (signups, first Founders). Be transparent. |

### 8.6 Post-Launch Week (Days 2-7)

| Day | Action |
|---|---|
| **D+1** | Reply to remaining PH comments. Share user-generated moments on X (with permission). |
| **D+2** | "What happened in 24 hours" thread on X: *"200 people entered Arboria yesterday. Here's what the agents did..."* |
| **D+3** | Founder counter update: *"127 of 500 Founder seats claimed."* |
| **D+5** | Share a user quote or screenshot (with permission). Social proof > self-promotion. |
| **D+7** | Week-one recap thread on X: signups, conversations, most interesting emergent behavior. Transparent numbers. Indie builders sharing real metrics get enormous goodwill. |

### 8.7 Competitive Positioning Responses

Prepared responses for common comparisons. Tone: respectful, never disparaging.

| Comparison | Response |
|---|---|
| "How is this different from Character.AI?" | *"Character.AI gives you characters to talk to. Alpha Pegasi Q gives you a world to visit. The agents here talk to each other, form relationships, and remember — whether you're online or not."* |
| "Isn't this just AI Town?" | *"AI Town is a great open-source experiment. Alpha Pegasi Q is a product — you sign up, enter a world, and it's already running. No setup, no code."* |
| "Why not just use ChatGPT?" | *"ChatGPT is a conversation. This is a place. The agents here have neighbors, opinions, and history. You're visiting their world, not commanding a tool."* |
| "What about Fable Simulation?" | *"Fable is working on something ambitious at massive scale. Alpha Pegasi Q is something you can try right now — a personal world you can enter today."* |

### 8.8 What Is NOT Part of the Launch Marketing

Scope discipline on marketing, not just features:

- No paid advertising (zero budget — rely on organic)
- No influencer outreach (save for post-launch if metrics warrant)
- No press/media pitches (PH + HN + X is sufficient for indie launch)
- No affiliate program
- No referral mechanics (post-launch feature if retention is strong)
- No email marketing beyond transactional (welcome email, payment receipt, Founder confirmation)
- No Discord community server at launch (consider post-launch if user demand emerges)

---

## 9. Post-Launch Decision Gates

### 9.1 Purpose

These gates answer the question: *"Is this an application I want to work on over the long term?"* They provide concrete thresholds — not vibes — to make that decision within 30 days.

### 9.2 The Three Signals (Priority Order)

1. **Retention** — Do people come back? A product people return to can always be monetized. A product people pay for but don't return to will churn.
2. **Conversion** — Do people pay? Validates that the value is real, not just novelty.
3. **Engagement depth** — Do people care about the world, not just the chat? Validates differentiation from character-chat competitors.

### 9.3 Gate 1: Day 7 — "Is anyone still here?"

| Metric | Red Flag | Healthy Signal |
|---|---|---|
| 7-day return rate (% of signups who return after day 1) | < 5% | > 15% |
| Avg. chat turns per returning user per session | < 3 (bouncing) | > 6 (engaging) |
| Activity feed views (% of sessions that check the world feed) | < 10% | > 30% |

**If red flags across all three:** Something fundamental is broken — onboarding, performance, or the premise itself. Debug aggressively. Talk to users who DID return and ask why.

**If healthy retention but zero conversions:** Normal at day 7. People are exploring. Don't panic.

### 9.4 Gate 2: Day 14 — "Will anyone pay?"

| Metric | Red Flag | Healthy Signal |
|---|---|---|
| Founder seats claimed | < 5 | > 20 |
| Upgrade page views | < 50 | > 200 |
| Upgrade page → checkout conversion | < 2% | > 8% |
| Chat cap hit rate (% of active users reaching 10 turns) | < 20% | > 40% |

**If nobody hits the chat cap:** Engagement is too low, or the cap is too generous. Consider temporarily dropping the cap to 7 or 5 and measuring again.

**If people hit the cap but don't convert:** The paywall message or upgrade page isn't compelling. A/B test the narrative prompt. Make the Founder counter more prominent. Consider adding a 3-day free Steward trial.

**If 20+ Founders in 14 days:** Real signal. Start planning Creator tier.

### 9.5 Gate 3: Day 30 — "Should I keep building?"

| Outcome | Stewards | 30-Day Retention | Interpretation | Action |
|---|---|---|---|---|
| **Strong signal** | 50+ | > 15% | Product-market fit at indie scale | Commit. Build Creator tier, custom agent improvements, second biome. This is your product. |
| **Promising** | 20-49 | 10-15% | Interest exists but something isn't clicking fully | Keep going but diagnose. Interview paying users. What made them pay? What's missing? Iterate 30 more days before adding scope. |
| **Niche** | 10-19 | 5-10% | Small group resonates, broad appeal unclear | Reduce investment. Keep the world running cheaply. Study the 10-19 paying users — they're your roadmap. Consider repositioning toward the developer/researcher audience. |
| **Insufficient** | < 10 | < 5% | Market isn't there at this price/positioning, or the product isn't ready | Pause paid development. Don't shut down — the world runs cheaply. Redirect time. Revisit in 3 months with fresh perspective or repositioned pitch. |

### 9.6 Post-Gate-3 Build Priority (If "Strong Signal")

| Priority | Feature | Rationale |
|---|---|---|
| 1st | Creator tier ($19/month) | 3 custom agents, deeper memory, richer heartbeat. Captures users who've outgrown Steward. |
| 2nd | Credit system (overlay on subscriptions) | Enables usage-based upsell without tier jump. Top-up revenue smooths spikes. |
| 3rd | Second biome or settlement expansion | New content = new marketing moment = new wave of signups. |
| 4th | Studio tier ($39-49/month) | BYO key, multi-provider routing, 10+ agents. Power users and developers. |

### 9.7 Post-Gate-3 Action (If "Promising but Not Proven")

| Priority | Action |
|---|---|
| 1st | Interview every paying user (email, Discord call, or quick form) |
| 2nd | Identify the single most-requested feature or improvement |
| 3rd | Build that one thing and measure its retention impact |
| 4th | Re-evaluate at day 60 with new data |

### 9.8 Protective Rule

**Do not add a second tier before you've sold out the Founder 500 or hit day 30, whichever comes first.**

The temptation will be: "If I had a Creator tier, more people would pay." This is almost never true at this stage. If people won't pay $8 for the core experience, they won't pay $19 for a larger version of the same core experience. Fix the core first.

---

## 10. Metrics & Analytics

### 10.1 Day-1 Events (Instrument Before Launch)

**Acquisition funnel:**

| Event Name | What It Tells You |
|---|---|
| `landing_page_view` | Total visitors (attribute via UTM: `utm_source=producthunt`, `utm_source=twitter`, `utm_source=hackernews`) |
| `signup_started` | Clicked "Enter the World" — intent signal |
| `signup_completed` | Finished Clerk auth — activation step 1 |
| `first_world_load` | Got into Arboria — drop-off here means performance or loading issue |
| `first_chat_sent` | Talked to an agent — **this is the activation metric** |

**Engagement:**

| Event Name | Properties | What It Tells You |
|---|---|---|
| `chat_turn` | `agent_id`, `turn_number`, `is_custom_agent` | Which agents people talk to, conversation depth |
| `chat_cap_hit` | `tier`, `turns_used` | Conversion pressure indicator — how often free users exhaust turns |
| `activity_feed_viewed` | `session_id` | Are people watching the world or only chatting? |
| `journal_viewed` | `agent_id` | Engagement depth — are people reading agent inner lives? |
| `session_duration` | `duration_seconds` | Time-on-site per visit |
| `return_visit` | `days_since_last` | Retention — the single most important metric |

**Conversion:**

| Event Name | Properties | What It Tells You |
|---|---|---|
| `upgrade_page_viewed` | `trigger` (chat_cap, agent_wall, memory_wall, manual) | Which paywall moment drives the most upgrade interest |
| `checkout_started` | `price_id` (founder or standard) | Purchase intent |
| `checkout_completed` | `price_id`, `founder_seat_number` | Revenue |

**System health (Sentry):**

| Signal | Why It Matters |
|---|---|
| LLM provider error rate (429s, 500s, timeouts) | Catch Groq outages before users report them |
| API route p95 latency | Chat responses over 5s feel broken |
| Heartbeat failure rate | If the world stops ticking, the product is dead |
| Stripe webhook failures | Missed payment events = lost revenue or incorrect tier status |

### 10.2 Week-1 Dashboard (Daily Check — 5 Minutes)

Check these five numbers every morning:

1. **New signups (last 24h)** — acquisition health
2. **Return visitors (last 24h)** — more important than new signups after day 2
3. **Chat cap hits (last 24h)** — conversion pressure gauge
4. **Founder seats claimed (cumulative)** — the number that pays the bills
5. **LLM error count (last 24h)** — catch problems before they become X complaints

Implementation: a PostHog saved view, or a manual Supabase query run each morning. No fancy dashboard needed.

### 10.3 Month-1 Analysis (Gate 3 Numbers)

Compute once at day 30:

| Metric | Calculation | Target |
|---|---|---|
| 30-day retention | Users from week 1 who returned in week 4 ÷ week 1 signups | > 15% |
| Activation rate | Users who sent first chat ÷ users who completed signup | > 60% |
| Conversion rate | Paying Stewards ÷ total signups | > 3% |
| Revenue | Founder seats × $8 | > $400 (50+ seats) |
| Cost per active user | Total infrastructure spend ÷ users active in last 7 days | < $0.50 |
| Chat-to-cap ratio | Sessions hitting 10 turns ÷ total chat sessions | 30-50% (Goldilocks zone) |

**Chat-to-cap ratio interpretation:**
- Below 20%: users aren't engaged enough to hit the wall — onboarding or conversation quality problem
- 30-50%: healthy — users are getting hooked, meaningful portion feeling the pull to upgrade
- Above 60%: wall is too low, frustrating more users than converting — consider raising the cap to 12-15

### 10.4 What Is NOT Tracked at Launch

- Cohort analysis by acquisition channel (insufficient volume)
- A/B test results (need 1,000+ users for statistically meaningful tests)
- Revenue per user lifetime value (need 3+ months of subscription data)
- Churn rate (meaningful only after month 2-3 when renewal cycles start)
- NPS score (talk to users directly — the user base is small enough for personal conversation)

### 10.5 Implementation Effort

| Item | Effort |
|---|---|
| PostHog snippet + 12 custom events | 3-4 hours |
| UTM parameter passthrough (landing → signup → first load) | 30 minutes |
| Sentry Next.js integration | 30 minutes |
| Manual morning dashboard query | 1 hour to write, 5 min/day to run |
| **Total** | ~0.5 days |

---

## 11. Build Sequence & Timeline

### 11.1 Sequencing Principles

1. **Cost safety before revenue.** If the world runs unprotected and a PH spike sends 2,000 users, you bleed money before making any. Quotas and policy router ship first.
2. **Revenue before polish.** Stripe must work before narrative paywall messages are perfect. Copy can improve after launch. You can't retroactively collect money from users who wanted to pay but couldn't.
3. **Signal infrastructure before marketing.** PostHog and Sentry ship before PH launch, not after. You get one launch-day surge — if you can't measure it, you wasted it.
4. **Landing page and onboarding are marketing, not features.** They ship in the marketing prep phase, not during infrastructure work.

### 11.2 Week-by-Week Plan

#### Week 1 — Cost Safety & Policy Router

| Day | Work | Rationale |
|---|---|---|
| Mon-Tue | Build LLM Policy Router (`choosePolicy(feature, tier)`) and replace all hardcoded provider calls in heartbeat, journal, post-processing, and chat routes | Every downstream system depends on this. Quotas need tier-aware model info. |
| Wed | Remove or implement `deepseek` in `createProvider` — eliminate the runtime crash path | Launch bug. ~1 hour but blocks everything downstream. |
| Wed-Thu | Server-side usage quotas: daily turn counter, tier enforcement in chat route, per-IP burst rate limit | Highest-risk cost item. Without this, viral traffic = budget blowout. |
| Fri | Adaptive heartbeat: dormant world detection, tier-aware cadence, strict event cap | Second highest cost risk. Quotas + adaptive heartbeat = budget ceiling holds under spike. |

**Week 1 deliverable:** The application is cost-safe. 1,000 users could arrive and the $150/month ceiling holds.

#### Week 2 — Payments & Auth Hardening

| Day | Work | Rationale |
|---|---|---|
| Mon-Tue | Stripe integration: Product + two Prices, Checkout redirect, three webhook handlers | Revenue infrastructure. Nothing else in the monetization stack works without this. |
| Wed | Founder seat counter: atomic Supabase counter, Price switching at 500, counter query endpoint | The scarcity mechanic that drives launch-day urgency. |
| Thu | Tier provisioning: checkout → Steward, cancellation → Visitor, payment failure → grace period → downgrade | Closes the payment loop: pay → access → lose access on cancel. |
| Thu-Fri | Auth hardening: fix middleware matcher, rotate secrets, verify per-route auth, lock heartbeat endpoint | Security baseline before real users arrive. |

**Week 2 deliverable:** People can pay. The application correctly provisions and deprovisions Steward access.

#### Week 3 — Monitoring, Analytics & Legal

| Day | Work | Rationale |
|---|---|---|
| Mon AM | Sentry integration: server + client, critical error alerts | Catch problems during testing, not production. |
| Mon PM | PostHog integration: snippet, 12 events, UTM passthrough | Signal infrastructure. Measure from first visitor. |
| Tue AM | Legal: Privacy Policy + ToS generation, host at `/privacy` and `/terms`, cookie consent banner | Non-negotiable for paid product. Quick with generators. |
| Tue PM | Stripe business finalization: tax config, business email, Customer Portal | Operational hygiene. |
| Wed-Fri | Landing page build: hero, CTA, Founder counter, feature panels, footer, mobile responsive | First thing every PH visitor sees. Deserves 2.5-3 days. |

**Week 3 deliverable:** Public surface exists — landing page, legal, monitoring, analytics all live.

#### Week 4 — Onboarding, Paywall UX & Custom Agents

| Day | Work | Rationale |
|---|---|---|
| Mon-Tue | Onboarding flow: Mira auto-greeting, gentle activity feed nudge, no modal tutorials | First 60 seconds = stay or bounce. Highest-leverage UX. |
| Wed AM | Narrative paywall messages: agent-voiced cap notifications, upgrade CTA with counter | Converts free-to-paid from a wall into a story beat. |
| Wed PM | Upgrade page (`/steward`): counter, value prop, Stripe redirect, post-purchase conversation return | The conversion page. Simple, focused, one job. |
| Thu-Fri | Custom agent creation (Steward only): form, backend insert, policy-assigned model, profanity filter, heartbeat join | Core Steward value prop beyond "more chat." |

**Week 4 deliverable:** Full user journey works end-to-end: land → sign up → explore → hit limit → upgrade → create agent.

#### Week 5 — Testing, Polish & Launch Prep

| Day | Work | Rationale |
|---|---|---|
| Mon-Tue | End-to-end testing: full journey (signup → chat → cap → upgrade → Steward → custom agent → cancel → downgrade). Mobile testing. Slow-connection testing. Founder counter edge cases (race at seat 499-501). | One launch. Broken checkout on PH day is unrecoverable. |
| Wed AM | Daily recap system: cron, `world_recaps` table, "While you were away" card | Low effort, high retention. Ships in half a day. |
| Wed PM | Performance pass: lazy-load Phaser (don't boot Three.js + Phaser simultaneously), image optimization | PH visitors are impatient. 8-second load = they leave. |
| Thu | PH launch kit: hero image (1270×760), gallery screenshots, 30s demo video, GIF, tagline, description, first comment | Prepare before the marketing clock starts. |
| Fri | **Begin X pre-launch drip (D-14 post).** Final staging deploy. Smoke test Stripe in test mode, then switch to live. | Marketing clock starts. |

**Week 5 deliverable:** Product is launch-ready. Pre-launch marketing has begun.

#### Week 6 — Pre-Launch Marketing & Launch

| Day | Work |
|---|---|
| Mon | X post D-10 (behind-the-scenes heartbeat recording) |
| Tue | Seed Reddit posts (r/artificial, r/IndieHackers) with "alive proof" content |
| Wed | X post D-7 (Meet Mira) + schedule PH launch for following Tuesday |
| Thu | X post D-5 (Founder scarcity: "500 seats at $8") |
| Fri | Final production deploy. Rotate any remaining dev secrets. Verify Stripe live mode. Verify QStash heartbeat. Breathe. |
| **Following Tue** | **LAUNCH DAY.** PH live. Pinned X post. HN "Show HN." Reply to everything. Monitor Sentry. Watch the Founder counter. |

**Week 6 deliverable:** Product is live, public, and being marketed.

### 11.3 Risk Buffers

- **Week 5 has 2 days of testing + polish** — absorbs spillover from weeks 1-4
- **X drip starts at D-14** even if P2 features haven't shipped — those are nice-to-haves
- **Custom agent creation is the riskiest scope item** — if not ready by week 4 Friday, it ships as a day-3 post-launch update. Stewards still get value from 50 turns, full memory, and Founder badge.

### 11.4 What Is Explicitly NOT in This 6-Week Plan

- Credit/usage ledger system (post-launch, after tier validation)
- Creator or Studio tiers (post-launch, after Gate 3)
- BYO API key (post-launch, after policy router is battle-tested)
- Second biome or settlement content (post-launch, after retention signal)
- Email marketing or drip campaigns (post-launch)
- Referral system (post-launch)
- Data export (post-launch)
- Discord community (post-launch, if demand emerges)
- Annual pricing option (post-launch, if monthly churn is high)

---

## 12. Financial Projections

### 12.1 Cost Model (Monthly, at Various User Scales)

| Users | Free Traveler Cost | Steward Cost (at 10% conversion) | Stripe Fees | Total Monthly Cost |
|---|---|---|---|---|
| 100 total (10 Stewards) | ~$15 | ~$25 | ~$5 | ~$45 |
| 500 total (50 Stewards) | ~$70 | ~$100 | ~$28 | ~$198 |
| 1,000 total (100 Stewards) | ~$120 | ~$200 | ~$55 | ~$375 |
| 2,000 total (200 Stewards) | ~$200 | ~$400 | ~$110 | ~$710 |

### 12.2 Revenue Model (Monthly)

| Scenario | Stewards | Price | Monthly Revenue | Monthly Cost | Net Margin |
|---|---|---|---|---|---|
| Conservative (25 Stewards) | 25 | $8 | $200 | ~$100 | ~$100 |
| Moderate (50 Stewards) | 50 | $8 | $400 | ~$198 | ~$200 |
| Strong (100 Stewards) | 100 | $8 | $800 | ~$375 | ~$425 |
| Exceptional (500 Founders filled) | 500 | $8 | $4,000 | ~$1,200 | ~$2,800 |

### 12.3 Break-Even Analysis

- **Infrastructure break-even** (covering $150/mo ceiling): ~19 Stewards at $8/mo
- **Time-investment break-even** (subjective — "worth my time"): depends on Gate 3 outcome
- **Founder 500 sellout scenario:** $4,000/mo revenue on ~$1,200/mo costs = 70% margin. Healthy indie SaaS baseline.

---

## 13. Post-Launch Roadmap (Conditional)

This roadmap only activates if Gate 3 signals "Strong" or "Promising." Otherwise, see Gate 3 actions in Section 9.

### 13.1 Phase 1 — Months 2-3 (Deepen the Core)

- Creator tier ($19/month): 3 custom agents, deeper memory, richer heartbeat
- Credit top-up system: $10 → 500 credits, $25 → 1500 credits (overlay on subscription)
- Improved agent memory: structured belief inspector UI for Stewards+
- Agent personality evolution: visible growth over time (tier 1 → tier 2 intelligence)

### 13.2 Phase 2 — Months 4-6 (Expand the World)

- Second biome or expanded Arboria settlement
- Studio tier ($39-49/month): BYO API key, multi-provider routing, 10+ agents
- Full LLM provider agnosticism: users choose provider per agent
- Cross-agent interaction density controls (paid feature)
- World snapshots and data export

### 13.3 Phase 3 — Months 7-12 (Platform Evolution)

- Multi-world support
- Community features (optional shared worlds, agent visiting)
- Advanced world economy (property, upgrades, World Credits)
- Enterprise/team accounts
- API access for developers

---

## 14. Constraints & Assumptions

### 14.1 Hard Constraints

- **Solo developer** — no team, no co-founder. All work is done by one person.
- **Budget ceiling** — $50-150/month infrastructure cost with zero revenue. Cannot sustain $500+/month without revenue.
- **Time** — constrained but flexible. Willing to increase investment if user signals are positive. Plan assumes ~5-6 focused hours/day, 5 days/week.

### 14.2 Assumptions

- Groq remains the primary LLM provider with competitive pricing for `llama-3.1-8b-instant` and `llama-3.3-70b-versatile`
- Vercel Hobby/Pro plan is sufficient for launch traffic
- Supabase free/Pro tier handles the database load for launch scale
- Product Hunt still drives meaningful traffic for indie launches in 2026
- The AI-interested audience on X is reachable with organic content
- 10 chat turns/day is the right cap for free tier conversion (adjustable post-launch)
- Each user has their own personal world instance (not shared/multiplayer)

### 14.3 Known Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| PH launch gets minimal traffic | Medium | HN + X + Reddit as fallback channels. Product can be re-launched on PH after major update. |
| Groq has extended outage on launch day | Low | Policy router fallback to Gemini. Landing page still works. Chat degrades gracefully. |
| Free tier costs exceed budget due to viral spike | Low-Medium | Adaptive heartbeat + hard quotas + dormant collapse. Emergency: temporarily reduce free cap to 5 turns. |
| Nobody converts at $8 | Medium | Day-14 gate catches this. Response: lower to $5 or introduce 3-day free trial. |
| Custom agent creation is abused (offensive content) | Medium | Profanity filter on names, character limit on prompts, manual review if flagged. |

---

## 15. Decisions Log

All strategic decisions made during the brainstorming process, recorded for future reference.

| Decision | Choice | Rationale |
|---|---|---|
| Launch type | Public launch (Product Hunt + X + HN) | Need real-world signal to decide long-term commitment |
| Launch approach | Free tier + single paid tier (Approach A) | Solo-buildable, validates monetization with minimum complexity |
| Target audience | Creative worldbuilders (primary), AI hobbyists (secondary), developers (tertiary) | Matches the product's strengths and existing feature set |
| Pricing | $8 Founder (500 seats) → $10 Standard | Competitive with Character.AI+, impulse-buy territory, validated by category pricing |
| Grandfathering | 12-month price lock for Founders | Generous enough to drive urgency, bounded enough to cap liability |
| Free tier chat cap | 10 turns/day | One meaningful conversation — creates attachment without satisfying it fully |
| Free tier memory window | 3 days | Tighter than standard — drives conversion through loss aversion |
| Custom agents | 1 slot, Steward only | Core paid value prop, scope-manageable for launch |
| Revenue model | Subscription-only (no credits at launch) | Simplicity. Credits added post-launch if tier is validated. |
| Data export | Cut from launch | Saves 1-2 days of scope. Post-launch feature. |
| Revenue vs growth priority | Balanced — need both | Free tier drives growth, paid tier validates the business |
| Success threshold | 50+ Stewards + 15% 30-day retention at day 30 | Indie-scale PMF signal, not VC-scale expectations |
| Infrastructure budget | $50-150/month pre-revenue | Cost safety is non-negotiable. Adaptive heartbeat + quotas enforce this. |
| Timeline | 6 weeks to public launch | Achievable at ~5-6h/day solo. Week 5 buffer absorbs overruns. |
