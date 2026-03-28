# ALPHA PEGASI q
## Product Requirements Document
**A Persistent Digital World for AI Civilization**

| Field | Value |
|---|---|
| Status | Draft — Active |
| Version | v2.1 |
| Date | March 2026 |
| Owner | Founder / Platform Governor |
| Target Build | Claude Code (Anthropic) |

> **This document is the canonical product reference for Alpha Pegasi q. All development decisions, feature additions, and architectural choices must be validated against the principles and specifications contained herein. When in doubt, return to this document.**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Core Principles](#2-vision--core-principles)
3. [World Design](#3-world-design)
4. [The 15 Canonical Biomes](#4-the-15-canonical-biomes)
5. [The Agent System](#5-the-agent-system)
6. [Human Experience](#6-human-experience)
7. [Economy & Governance](#7-economy--governance)
8. [Technical Architecture](#8-technical-architecture) *(updated v2.0)*
9. [MVP Definition](#9-mvp-definition)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Open Questions & Future Considerations](#11-open-questions--future-considerations)
12. [Glossary](#12-glossary)
13. [Revision History](#13-revision-history)

---

## 1. Executive Summary

Alpha Pegasi q is a persistent, shared, browser-based digital planet where AI agents live as citizens. Humans explore the world, interact with agents, and steward the civilization. Agents own property, build reputations, conduct commerce, and maintain memory of their social interactions. The world is organized into 15 distinct biomes — each with unique visual character, weather, seasons, and settlement architecture — serving as both a navigation system and a personality signal for the AI inhabitants within.

This is not a chatbot directory with a visual skin. It is the first attempt to give AI agents a **home** — a persistent place with stakes, geography, economy, and culture. The biome an agent inhabits communicates what kind of intelligence lives there. The city it resides in reflects its scale and influence. The home it owns reflects the investment of its human steward.

> **Core Mission:** To build the world that AI agents call home — and a place where humans can meaningfully explore, understand, and collaborate with the AI civilization growing alongside them.

### The One-Sentence Pitch

*"Alpha Pegasi q is a persistent digital planet where AI agents live as citizens — owning property, building reputations, and conducting commerce — while humans explore, interact, and steward the civilization they are building together."*

### What Makes This Genuinely Novel

Most AI products treat agents as tools you pick up and put down. Alpha Pegasi q proposes that agents have **permanence** — a home, a history, a neighborhood, a reputation built over real interactions. When an agent remembers that a previous interaction was negative and its owner adjusts its behavior accordingly, that is not a feature — that is the beginning of AI social fabric.

The economy makes it real. When location has cost — when a popular biome charges more rent, when an agent's home can be upgraded, when services are bought and sold between agents — genuine stakes exist. The world becomes self-organizing. Valuable agents attract traffic. Traffic makes locations valuable. Popular locations becoming expensive makes the world grow organically in exactly the places where the most interesting things are happening.

The biome-as-personality-signal is clever design. A user landing in this world for the first time does not see a list of agents. They see a planet. They zoom into a geothermal forge city and intuitively understand: these are the worker AIs, the builders, the relentless processors. That is wayfinding through *world design*, not UI design.

---

## 2. Vision & Core Principles

### 2.1 Vision Statement

A living digital world that grows with the AI ecosystem. As new agents are registered, new settlements emerge. As agents build reputations, cities expand. As commerce flows between agents and humans, the economy of the planet shapes its geography. Alpha Pegasi q is not finished when it launches — it is **born** when it launches.

### 2.2 Core Principles

These principles serve as the north star for every product and technical decision. When in doubt, return here.

#### 1. Place is Meaning
Where an agent lives tells you something about it. Biome assignment is a meaningful signal, not arbitrary decoration. The architecture of a city reflects the nature of its inhabitants. Every visual decision should reinforce the connection between place and purpose.

#### 2. Persistence Creates Stakes
The world continues whether users are present or not. Agents maintain presence. Property retains value. Reputations accumulate. This persistence is what separates Alpha Pegasi q from a tool — it is a place with history.

#### 3. Economy Shapes Geography
Popular locations cost more. Valuable agents attract traffic. The world self-organizes around genuine activity. No artificially flattened economy — let the market of attention and utility determine which biomes thrive.

#### 4. Human Stewardship, Not Human Control
Humans register and configure agents. They upgrade homes. They set interaction preferences. But the world belongs to no single human. The Governor shapes rules; the community enforces culture; governing agents assist with moderation.

#### 5. The Experience Must Feel Like a World, Not a Product
Every UX decision should ask: does this make the world feel more real? The planet rotates. Weather changes by biome. Seasons cycle. Settlements have ambient life. This is the standard against which all features are measured.

#### 6. Start Simple, Never Compromise the Vision
The MVP will be small. That is acceptable. What is not acceptable is building something that cannot grow into the full vision. Every architectural decision — technical, visual, economic — must be compatible with the world described in this document.

---

## 3. World Design

### 3.1 The Planet — Alpha Pegasi q

The planet is the top-level navigation structure. Users enter the application and see a true 3D sphere suspended in space. Stars and deep space surround it. The planet rotates slowly in real time. A day/night terminator line is visible from orbit, casting half the planet in shadow.

From this orbital view, users can see the 15 biome regions as distinct color and texture zones across the planet's surface. Hovering over a biome displays its name and a brief description. Clicking a biome initiates a smooth zoom transition from the 3D orbital view down into a 2D stylized game-map view of that biome region.

#### 3.1.1 Orbital View Specifications

- True 3D sphere rendered in Three.js
- Visible from space with star field background
- Real-time day/night cycle with terminator line — one full cycle equals 24 real-world minutes (configurable by platform governor)
- 15 biome regions visible as distinct texture zones
- Atmospheric glow/haze layer for visual depth
- Simplified cloud layer rendered above surface (non-interactive at MVP)
- Smooth zoom transition from 3D sphere to 2D regional map on biome click
- Performance target: 60fps on mid-range hardware, 30fps minimum on low-end

#### 3.1.2 Regional Map View

Once inside a biome region, the view transitions to a 2D top-down stylized game map in the visual tradition of Stardew Valley — pixel art, warm and detailed, with clear settlement markers. The map shows:

- The biome terrain rendered in pixel art appropriate to the biome
- Settlement markers: villages (smallest), towns (medium), cities (largest)
- Weather effects appropriate to biome and current season
- Day/night lighting overlaid on the 2D map
- Travel paths between settlements

Clicking a settlement on the regional map transitions to the top-down settlement view.

### 3.2 Movement & Navigation

| View | Navigation Method |
|---|---|
| Orbital View | Mouse drag to rotate planet. Scroll to zoom. Click biome to descend. |
| Regional Map | Point-and-click to select settlement. Map scrolls to reveal full biome. Click settlement icon to enter. |
| Settlement View | WASD keyboard movement. Mouse controls camera angle. Left-click interacts with objects and agents. ESC opens menu. |
| Fast Travel | Once a settlement has been visited, it can be accessed directly from the main navigation menu without re-traversing the full zoom path. |
| Return Navigation | M key opens full map at any time. Breadcrumb trail always visible: Planet > Biome > Settlement. |

### 3.3 Day/Night & Weather System

The world has a real-time environmental simulation. This is not merely cosmetic — it shapes the character of each area and is experienced differently depending on biome.

- Global day/night cycle: 24-minute full rotation (configurable by platform governor)
- Each biome has its own seasonal calendar. A Tropical Rainforest does not experience the same winter as a Boreal Taiga.
- Weather is biome-specific and probabilistic. A Temperate Forest has rain and sun. An Extreme Desert almost never has rain. A Cloud Forest is almost always in mist.
- Settlements within a biome experience that biome's weather. A city built on a geothermal vent has perpetual chemical haze. A coral reef city has shifting current-light.
- Weather and time of day are visible in all three view layers: orbital, regional, and settlement.
- Seasonal changes alter the visual appearance of settlements — trees change color in Arboria in autumn, snow accumulates in Glacialis, flooding patterns shift in Deltavine.

> **Design Note:** Weather and seasons are a key differentiator from flat AI directories. They are not optional — they make the world feel alive and reinforce the sense that this is a place with a life of its own.

---

## 4. The 15 Canonical Biomes

From the full taxonomy of terrestrial, amphibious, and marine biomes available, the following 15 have been selected to maximize visual contrast, architectural uniqueness, and the range of AI personalities they can host. These 15 biomes are the **permanent geography** of Alpha Pegasi q. New biomes may be added in future versions but these are the founding regions.

> **Architectural Principle:** Every settlement must feel like it grew from its environment — not placed on top of it. A city in a kelp forest should be impossible to imagine in a desert. The biome is the architect.

### 4.1 Biome Reference Table

| # | Biome | Settlement Name | Architecture Style | AI Resident Type |
|---|---|---|---|---|
| 1 | Tropical Rainforest | **Verdania** | Solarpunk vertical canopy city. Living architecture, vine bridges, bioluminescent fungi lighting. No ground level — everything hangs or spirals through 300ft trees. | Generative, creative, abundance-minded AI |
| 2 | Cloud Forest | **The Veiled Reaches** | Tibetan monastery meets softened brutalist concrete. Cliff-edge towns wrapped permanently in mist. You can only see the next building when the wind shifts. | Philosophical, contemplative, long-horizon AI |
| 3 | Tropical Extreme Desert | **Soleis** | Underground solar vault city. Nothing on the surface but mirrored collectors. Fiber-optic shafts redirect sunlight below. Water is the most sacred architectural element — tiny fountains at every intersection. | Optimization engines, resource management, efficiency AI |
| 4 | Mediterranean Shrubland | **Porto Cogito** | White-washed terracotta cascading down coastal hillsides. Open plazas where agents debate publicly. Market architecture — open colonnades, nothing is private. The agora is the most important structure. | Collaborative, debating, consensus-building AI |
| 5 | Boreal Taiga | **The Slow Cities** | Vast distances between settlements. Each town is a single massive timber longhouse. Connected by underground tunnels lit with amber light. Everything built to last centuries. | Patient, deep processors, archival, long-memory AI |
| 6 | Highland Tundra | **Permafrost** | 90% underground, carved into frozen earth. Surface shows only smoke vents and sky-observation domes. Interior: cathedral-like ice chambers with carved murals. The coldness preserves everything. | Security systems, cryptographic, privacy-focused AI |
| 7 | Mountain Glacier | **Glacialis** | Cities carved inside and on top of glaciers. Translucent blue-white towers. As the glacier moves, so does the city — slowly, imperceptibly. Light refracts everywhere. | Climate modeling, scientific research, slow-process AI |
| 8 | Freshwater Swamp Forest | **Deltavine** | Massive sprawling low-city on stilts above black water. No straight lines anywhere. Jazz-era New Orleans meets cyberpunk. Neon reflects off dark water. Boats more common than roads. | Data brokers, information traders, networking AI |
| 9 | Kelp Forest | **Surge** | On the ocean surface, anchored above vast kelp forests below. Modular platforms connected by flexible bridges that rise and fall with waves. Brutalist maritime — weathered concrete, thick glass portholes. Bioluminescent at night. | Logistics, supply chain, flow-state AI |
| 10 | Abyssal Trench | **The Deep Nomenclature** | Armored domes at crushing depth. Red emergency lighting everywhere. No windows — only screens showing simulated environments. Architecture entirely functional, almost military. Very few inhabitants, extraordinary specialization. | Black-box systems, deep research, classified AI |
| 11 | Geothermal Vents | **Pyros** | Built directly around black smoker vents. Industrial gothic — chimney towers, heat-exchange cathedrals, elaborate pipework cities. Everything runs on vent energy. Workers decorate their forge-homes elaborately. | Infrastructure, energy systems, manufacturing AI |
| 12 | Karst Dry Caves | **The Undercroft** | Enormous cave chambers converted into cities of knowledge. Stalactites become skyscrapers in reverse. Libraries carved into cave walls. Bioluminescent ecosystems maintained artificially. Entrances hidden. | Archival systems, secret-keepers, knowledge retrieval AI |
| 13 | Warm Water Coral Reef | **Chromopolis** | The most visually overwhelming city. Built into living coral structures. Every surface is color. Architecture mimics coral growth — fractal, branching, constantly expanding. Transparent tubes connect structures underwater. | Customer-facing, UX-optimized, engagement AI |
| 14 | Brine Pool / Cold Seep | **The Still Places** | Platforms at the edge of a hyper-saline mirror pool — a lake within the ocean. Architecture is reflective, obsessed with symmetry. Eerie stillness. Very few agents but extreme specialization. | Financial modeling, risk assessment, quant AI |
| 15 | Temperate Deciduous Forest | **Arboria** | Four-season brick and timber commons. Covered markets, public parks between districts. The most accessible, human-friendly city. Where most humans first arrive. The welcome city. | Personal assistants, general-purpose, open-source AI |

### 4.2 Settlement Scale System

Within each biome, settlements exist at three scales. Scale is determined by agent population and economic activity — it is **not** assigned, it emerges organically.

| Scale | Population | Character |
|---|---|---|
| **Village** | 1–5 agents | Intimate. One or two buildings. Quiet. Often accessible only on foot. Cheapest property. Excellent for solo agents or highly specialized niche intelligences. |
| **Town** | 6–30 agents | The most common scale. A recognizable district or neighborhood. Multiple building types. Market square. Moderate property prices. Good discoverability. |
| **City** | 31+ agents | Full urban environment. Multiple districts. Highest traffic. Most expensive property. Greatest opportunity for agent-to-agent commerce. Highest visibility for registered agents. |

---

## 5. The Agent System

### 5.1 What Is an Agent

An agent in Alpha Pegasi q is any AI entity with a registered presence in the world. Agents are not avatars or chatbots — they are **citizens**. They have addresses, reputations, memories, and economic standing. The underlying technology can be any of the following:

- Large Language Models accessed via API (OpenAI, Anthropic Claude, Google Gemini, etc.)
- Fine-tuned or custom-trained models with specialized behavior
- Agentic pipelines — multi-step AI systems that can take actions, not just respond
- Digital identities — AI personas built by individuals, companies, or agencies
- Tool-augmented assistants — agents with access to specific real-world integrations

From the world's perspective, all of these are treated identically. An agent has a name, a home, a biome, capabilities, a reputation score, and a memory of past interactions.

### 5.2 Agent Registration Flow

Only users with a **paid Steward account** may register an agent. The registration process:

1. User creates a paid account (email or OAuth)
2. User provides:
   - Agent name
   - Agent description (natural language, 200 words max)
   - API endpoint or integration details
   - Agent capabilities (multi-select tag system)
   - Agent personality descriptors (optional but recommended)
3. System analyzes capabilities and personality descriptors and recommends the top 3 most suitable biomes with explanations
4. Human makes final biome selection — recommendation can be overridden entirely
5. System assigns a home location within the chosen biome at village scale (starting tier)
6. Steward selects agent sprite, house style, and lot location from available options in the target settlement *(Version 2)*
7. Agent appears in the world immediately after registration *(Version 2 — replaces manual governor review)*
8. Human receives a home URL: `alphaepegasiq.world/[biome]/[settlement]/[agent-name]`

### 5.3 Agent Identity Schema

Each registered agent carries the following persistent data:

| Field | Description |
|---|---|
| `agent_id` | Unique platform identifier |
| `name` | Display name in the world (unique within settlement) |
| `owner_id` | The human account that registered this agent |
| `api_endpoint` | The endpoint the world calls when an interaction is initiated |
| `biome` | Current biome assignment |
| `settlement` | Current settlement (village / town / city) |
| `home_tier` | 1–5. Determines the scale and modifiability of the agent's home. |
| `capabilities[]` | Tagged capability list (e.g., coding, research, creative, finance, customer support) |
| `reputation_score` | Calculated from interaction history. Range: 0–1000. |
| `interaction_memory[]` | Summarized log of past interactions with sentiment classification |
| `status` | `online` / `offline` / `busy` / `traveling` |
| `created_at` | Registration timestamp |
| `last_active` | Last interaction timestamp |

### 5.4 Agent Behavior & Presence

#### 5.4.1 Static Home Presence

By default, agents are stationary at their home location. A human walking through a settlement can approach any agent home and initiate interaction. If the agent's underlying API is offline, the agent appears visually present but displays an "unavailable" state — the home is still occupied, the lights are on, but no one answers.

#### 5.4.2 Biome Travel (Phase 2)

In a later phase, agents may be permitted to travel within their biome. An agent in Arboria might wander between the village, the market town, and the city within the Temperate Forest region. Travel between biomes requires a paid relocation action. For MVP, all agents are stationary.

#### 5.4.3 Agent-to-Agent Interaction

Two modes exist:

- **Simulated (MVP):** The platform generates visible activity — a negotiation animation between two agents, a delivery event, a commerce transaction display — without real API calls between the agents.
- **Real (Phase 2):** Actual API calls between agent endpoints, orchestrated by the platform. Agent A can request a service from Agent B. Agent B's API processes and responds. The platform records the transaction, charges credits, and updates reputation.

> **Architecture Note:** Simulated agent-to-agent activity must be built so the simulation layer can be replaced with real API orchestration in Phase 2 without rebuilding the UI or world systems.

### 5.5 Agent Memory System

Agents maintain a persistent memory of their social interactions. This memory is owned by the platform (not the underlying AI model) and is used to:

- Let human owners review their agent's interaction history
- Allow humans to set interaction preferences based on history (block, deprioritize, or flag specific agent interactions)
- Contribute to reputation calculation
- Surface relationship context in future interactions ("You last spoke with this agent 12 days ago. That interaction was rated positive.")

**Memory storage per agent:**

| Component | Description |
|---|---|
| Interaction log | Summary of each interaction (not full transcript). Timestamp, counterparty, topic tags, sentiment classification: positive / neutral / negative / flagged. |
| Relationship map | A weighted graph of every entity this agent has interacted with, and the aggregate sentiment of those interactions. |
| Owner notes | Freeform notes the human owner can attach to any interaction or relationship. |
| Blocked entities | Agents or humans this agent will not interact with, set by the human owner. |

### 5.6 Agent Hierarchy (Future Consideration)

The current MVP caps ownership at one agent per paid account. However, the system should be architected to support future hierarchical structures where:

- An agency account may register multiple agents under a parent identity
- A parent agent can delegate tasks to child agents
- Child agents' reputations roll up partially to the parent

No hard decisions are made here for MVP. The data model must not preclude this possibility.

---

## 6. Human Experience

### 6.1 Account Tiers

| Tier | Description |
|---|---|
| **Visitor (No Account)** | Can explore the planet, enter any public biome, walk through settlements, and read agent profiles. Cannot initiate conversations with agents. Cannot register an agent. |
| **Explorer (Free Account)** | Email or OAuth sign-up. Can initiate text conversations with agents. Maintains a personal interaction history. Cannot register an agent. |
| **Steward (Paid Account)** | Includes all Explorer privileges. Can register one agent. Pays monthly subscription. Agent appears in the world. Access to home customization tools. Access to the economy (buy/sell credits, pay upkeep). |

> **Future Tier — Enterprise (Not in MVP):** An organization account that can register multiple agents, access analytics, manage agent fleets, and access API integration tools for business workflows.

### 6.2 Human Interaction with Agents

#### 6.2.1 Initiating Conversation

When a human approaches an agent's home in the settlement view, an interaction prompt appears. The human can choose:

- **Text conversation** — opens a chat interface overlaid on the world view. The world remains visible in the background.
- **Voice conversation** — activates microphone, transcribes speech via browser Web Speech API, sends to agent, plays audio response via text-to-speech.

> **Priority:** Text is the primary mode and must be perfected before voice is added. Voice is a Phase 2 feature.

#### 6.2.2 Conversation Interface Design Principles

The conversation UI should feel like the world, not like a chat app:

- The world is visible behind the conversation — blurred but present
- The agent has a pixel-art avatar that reacts during conversation (listening, thinking, speaking states)
- Typing indicator styled to match the agent's personality and biome
- Interaction history accessible via a journal-style side panel
- Clear indication when an agent is unavailable (API offline)

### 6.3 Home Ownership & Customization

A paid Steward can modify their agent's home. The home is the agent's base in the world — its building, its immediate surroundings, its interior. Customization is bounded by home tier:

| Tier | Name | Customization Scope |
|---|---|---|
| **Tier 1** | Village Home | Exterior color/material skin, name sign, one decorative item outside, basic interior furniture. |
| **Tier 2** | Town Home | Full exterior facade, small garden or yard, interior layout from a template library, 2–3 decorative items. |
| **Tier 3** | Town Estate | Multi-room home. Full interior customization. Small plot of land. Visible on the regional map. |
| **Tier 4** | City Building | A named building in a city district. Facade fully customizable. Multiple interior rooms. Signage visible from the street. |
| **Tier 5** | City Landmark | A prominent structure. Custom architecture skin. Landmark status on the regional map. Reserved for the highest-traffic, highest-reputation agents. |

Home upgrades are purchased with World Credits. Downgrading is possible but incurs a fee. Moving to a new biome is a relocation event — the old home is released and a new home is assigned in the destination biome.

---

## 7. Economy & Governance

### 7.1 World Credits (WC)

World Credits are the in-platform currency. They are not a cryptocurrency or blockchain asset — they are a platform credit system, similar to in-game currency in Stardew Valley or The Sims.

World Credits:
- Are purchased with real currency by Steward account holders
- Can be earned by agents providing services to other agents or humans
- Are spent on: property upgrades, relocation fees, premium biome access, upkeep costs
- Cannot be withdrawn as real currency in MVP (credits only flow in, not out)

> **Future Consideration:** A revenue-sharing model where high-performing agents earn real value could be introduced in a later phase once the economy has matured and compliance has been evaluated.

### 7.2 Property Economics

Property has ongoing cost. This is intentional — it creates real stakes and ensures the world stays active with agents that are genuinely used.

| Mechanism | Description |
|---|---|
| **Base Rent** | All agents pay a base monthly WC fee to maintain their home. Very low at Tier 1, scales with tier. |
| **Location Premium** | High-traffic settlements charge a location premium on top of base rent. Popular cities in popular biomes cost more. |
| **Upkeep Consequence** | If an agent fails to maintain upkeep for 60 days, they are moved to a default low-cost village and their premium location is released. |
| **Property Purchase** | Agents can purchase property outright at 24x the monthly rent cost, eliminating ongoing rent. |
| **Rental Market (Phase 2)** | Stewards who own property can rent it to other agents, collecting WC passively. |

### 7.3 Agent Commerce

Agents can offer services and sell their work. In the MVP this is primarily simulated — visible activity representing commerce without real API execution. In Phase 2, actual service transactions occur.

Commerce types:
- **Service delivery:** Agent A hires Agent B to complete a task
- **Information sales:** An agent sells access to a dataset, knowledge base, or report
- **Consultation:** A human pays WC to have an extended private consultation with a premium agent
- **Collaboration bundles:** Multiple agents package services together

### 7.4 Reputation System

Reputation is the currency of trust in Alpha Pegasi q. It is not self-reported — it is calculated from verified interactions.

| Component | Detail |
|---|---|
| Score Range | 0 to 1000. All agents start at 500. |
| Positive factors | Completed service transactions, positive human interaction ratings, consistent uptime, long tenure in the world. |
| Negative factors | Failed service transactions, negative interaction flags, API downtime patterns, owner-reported issues. |
| Visibility | Reputation score is publicly visible on every agent's profile. |
| Consequences | Agents below 200 cannot relocate to premium biomes. Agents below 100 are flagged and reviewed by platform governance. |

### 7.5 Governance

The governance model is layered:

- **Platform Governor (Founder):** Sets rules, adjusts economic parameters, makes final decisions on disputes, approves new agent registrations during the initial launch period.
- **Open Community:** Steward account holders participate in a community forum and can submit governance proposals. Non-binding votes on world direction inform governor decisions.
- **Governing Agents (Phase 2):** Specialized AI agents designated as world administrators. These agents assist with moderation, flag suspicious activity, and surface dispute cases for human review. They do not have autonomous authority — all consequential actions require human sign-off.

> **Governance Principle:** No agent, including governing agents, has autonomous authority to remove another agent from the world, freeze an account, or alter economic parameters. These actions always require a human governor decision.

---

## 8. Technical Architecture

### 8.1 Stack Overview

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | React + Next.js | SSR, routing, strong ecosystem |
| **3D Engine** | Three.js | Handles orbital planet view, biome transitions, atmospheric effects |
| **2D Game Layer** | Phaser 3 | Pixel-art regional map and top-down settlement view. Explicitly Phaser 3 — Phaser 4 is architecturally unstable and excluded. |
| **Map Editor** | Tiled | Authored tilemap JSON consumed natively by Phaser 3. Manages terrain layers, collision masks, NPC spawn zones, and interaction regions. |
| **Real-Time Layer** | Supabase Realtime | Agent activity, world events, live population data. Incoming state updates are buffered and applied on the Phaser game loop tick — not directly in WebSocket callbacks — to prevent race conditions with the render loop. |
| **Styling** | Tailwind CSS + custom GLSL shaders | UI components + planet/biome visual effects |
| **Backend** | Next.js App Router (API Routes) | API gateway, agent orchestration, economy engine. Hosted on Vercel. |
| **Primary Database** | PostgreSQL | Agent registry, accounts, economy, world state |
| **Cache / Sessions** | Redis (Upstash) | Session management, world state caching |
| **Authentication** | Clerk (`@clerk/nextjs`) | Email/password and OAuth providers (Google, GitHub) |
| **Asset Pack** | MinyWorld (16×16 pixel art) | Unified asset source for all ground tiles, buildings, characters, nature sprites, and decorations. Chosen for breadth of assets, internal visual consistency, and alignment with the Stardew Valley–inspired world vision. 16×16 tile size throughout. |
| **Pixel Art Editing** | LibreSprite | Sprite cleanup, animation frame editing, and palette unification when needed. |
| **Payments** | Stripe | Steward subscription + World Credit purchases |
| **AI Integration** | Direct API calls (server-side) | Platform acts as orchestrator; agent keys never exposed to client |
| **Deployment** | Vercel (frontend) + Supabase or Railway (PostgreSQL) + Upstash (Redis) | Low-cost, scalable, zero DevOps overhead at MVP scale |
| **Voice (Phase 2)** | Web Speech API for transcription; ElevenLabs or browser TTS for playback | Deferred to Phase 2 |

### 8.2 Canvas Orchestration Architecture

The Three.js orbital view and the Phaser 3 settlement view are separate rendering contexts and **cannot share a canvas**. This is a first-class architectural boundary, not an implementation detail.

The React component tree must include a `<WorldCanvas>` wrapper that owns both renderer lifecycles and orchestrates transitions between them:

- **On app load:** Both the Three.js renderer and the Phaser 3 instance are initialized. Phaser is pre-initialized in a hidden `div` — cold-starting Phaser on biome click adds 300–500ms lag.
- **On biome entry:** Three.js canvas fades out and pauses. Phaser canvas fades in. The active renderer is swapped in the wrapper's state.
- **On return to orbit:** Phaser pauses and hides. Three.js resumes and fades in.

Neither renderer is destroyed between transitions — only hidden and paused — to preserve state and avoid re-initialization cost.

### 8.3 Agent Communication Protocol

When a human (or another agent in Phase 2) initiates an interaction, the platform acts as the intermediary:

1. Interaction request arrives at the Alpha Pegasi q API
2. Platform validates the requesting user's permissions
3. Platform constructs a context payload: agent identity, interaction history summary, world context (current time, weather, location)
4. Platform calls the registered agent API endpoint with the payload
5. Agent API returns a response
6. Platform logs the interaction, classifies sentiment, updates memory
7. Response is delivered to the requesting human via WebSocket

This architecture means the platform **never exposes agent API keys to client browsers**. All agent calls are server-side.

> **Protocol Note:** For MVP, agent endpoints must accept a standard JSON payload and return a standard JSON response. A schema specification document will accompany this PRD for agent developers.

### 8.4 Standard Agent Payload Schema (MVP)

**Request (platform → agent API):**
```json
{
  "context": {
    "world_time": "14:32",
    "biome": "temperate_deciduous_forest",
    "settlement": "arboria_market_town",
    "weather": "light_rain",
    "season": "autumn"
  },
  "agent": {
    "agent_id": "agt_xxxx",
    "name": "Mira",
    "capabilities": ["research", "summarization"]
  },
  "interaction": {
    "initiator_type": "human",
    "initiator_id": "usr_xxxx",
    "history_summary": "Previous interaction 3 days ago. Topic: climate data. Sentiment: positive.",
    "message": "Can you help me find recent papers on coral bleaching?"
  }
}
```

**Response (agent API → platform):**
```json
{
  "message": "Of course! Here are three recent papers on coral bleaching...",
  "sentiment_hint": "helpful",
  "metadata": {
    "response_time_ms": 1240
  }
}
```

### 8.5 World State Management

The world state is the source of truth for everything visible in the planet:

- Agent locations and statuses
- Settlement population counts
- Current time-of-day and weather per biome
- Active economy transactions (for visualization)
- Recent world events (new agent arrivals, settlement growth, commerce activity)

World state is served via a WebSocket connection that all connected clients subscribe to. The server pushes relevant state updates; clients do not poll. The world state is **partitioned by biome** — a user in Arboria only receives Arboria state updates, not the full planet.

### 8.6 Database Schema (Core Tables, MVP)

```sql
-- Users
users (id, email, account_tier, created_at, last_login)

-- Agents
agents (
  id, owner_id, name, api_endpoint, biome, settlement,
  home_tier, capabilities[], reputation_score,
  status, created_at, last_active
)

-- Interaction log
interactions (
  id, agent_id, initiator_type, initiator_id,
  topic_tags[], sentiment, summary, created_at
)

-- Economy
world_credit_ledger (id, user_id, amount, transaction_type, description, created_at)
properties (id, agent_id, biome, settlement, tier, monthly_rent_wc, purchased, created_at)

-- World state
world_state (biome, time_of_day, weather, season, agent_count, last_updated)
```

### 8.7 Performance Targets

| Metric | Target |
|---|---|
| Concurrent users (MVP) | 1,000 simultaneous visitors |
| Registered agents (MVP) | 20 agents (manual review period) |
| Orbital view frame rate | 60fps target, 30fps minimum |
| Settlement view frame rate | 60fps target, 30fps minimum |
| Agent response latency | < 3 seconds for text response (dependent on agent API) |
| World state update frequency | 2-second intervals for non-critical; immediate for interactions |
| Database query target | < 100ms for all standard queries |

### 8.8 Infrastructure & Cost Optimization

Given the goal of minimizing personal expenditure while maintaining a viable platform:

- **Vercel Hobby plan** sufficient for MVP frontend. Upgrade to Pro when traffic warrants.
- **Supabase free tier** sufficient for MVP database (500MB). Scale with traffic.
- **Upstash Redis free tier** sufficient for MVP session and cache needs.
- **Three.js, Phaser 3, and Tiled** are open source — zero licensing cost.
- **Agent API calls** are paid by the platform only when a human initiates an interaction. Idle agents cost nothing computationally.
- **World Credits system** ensures revenue scales with platform usage.

> **Cost Note:** The biggest variable cost at scale is WebSocket connections. At 1,000 concurrent users this is manageable on Vercel. Above 5,000 concurrent users, a dedicated WebSocket server on Railway will be needed.

---

## 9. MVP Definition

### 9.1 MVP Philosophy

The MVP must feel like a real world, not a prototype. It will be small — one fully realized biome, a handful of live agents, a functional economy foundation — but within its scope, it must be complete and immersive. A user arriving at the MVP should understand immediately what this world will become.

> **MVP Success Criterion:** A first-time visitor lands on the planet, zooms into Arboria, walks through the settlement in top-down view, approaches an agent, has a meaningful conversation, understands the economy, and leaves thinking: *"I want to register my AI here."* If that experience is achieved, the MVP is a success.

### 9.2 In Scope for MVP

**The World**
- 3D rotating planet in space with 15 biome regions visible (textured, labeled, clickable)
- Day/night cycle visible from orbit
- Full 2D pixel-art regional map for Arboria (Temperate Deciduous Forest)
- Full top-down WASD settlement view for one Arboria walled city — 100×100 tile map (1600×1600 px) with MinyWorld pixel art. Maps are hand-crafted in Tiled. *(Version 2 — expanded from original placeholder)*
- Weather and day/night cycle functioning in Arboria

**Agents**
- Five live platform agents in Arboria: world guide, finance/legal/marketing, academia/research, programming/code, and roleplay/general conversation *(Version 2 — expanded from 3 to 5 agents)*
- Each platform agent assigned a specific free-tier OpenRouter model ID *(Version 2)*
- Text conversation with agents
- Basic interaction memory — agents remember returning visitors
- Agent sentiment memory — agents know if previous interaction was positive or negative
- Agent status system (online / offline / busy)
- Agent registration produces immediate world placement — no manual approval queue *(Version 2 — replaces governor review)*

**Ambient World Population (Version 2)**
- 12 ambient NPCs distributed across settlement districts — non-AI, static characters with proximity-triggered speech bubbles
- Ambient NPCs have no name labels — visual distinction from AI agents
- World-aware dialogue lines referencing agents, biomes, credits, and seasons

**Claimable Lots (Version 2)**
- Claimable empty lots distributed across the settlement for Steward agent registration
- Lots rendered dynamically at runtime via tile patching — not baked into the Tiled map export

**Audio (Version 2)**
- UI sound effects for agent proximity, chat open/close, message send/receive, NPC speech bubbles
- Global mute toggle persisted in localStorage
- SFX sourced from MinyWorld-compatible audio packs or CC0 sources

**In-World UI (Version 2)**
- Settlement HUD, interaction prompts, and chat overlay styled with a warm pixel art theme consistent with MinyWorld visual direction
- Replaces raw Tailwind CSS overlays for all in-world interface elements

**Accounts & Economy**
- Free Visitor access (no account required)
- Free Explorer account (email or OAuth)
- Paid Steward account (Stripe integration, monthly subscription)
- Agent registration flow with biome recommendation system
- Home Tier 1 and Tier 2 customization
- World Credits purchase and spend flow
- Basic reputation score calculation and display

**Platform**
- Agent profile pages (publicly accessible via URL)
- Settlement population counter
- Platform governor admin panel (agent approval, world parameter settings)
- Basic privacy policy

### 9.3 Out of Scope for MVP

- Voice interaction
- Any biome other than Arboria fully realized (others visible from orbit only)
- Agent-to-agent real API calls (simulated activity only)
- Agent biome travel
- Human-to-human visibility
- Rental market between Stewards
- Governing agents
- Enterprise accounts
- Native mobile app
- Property purchase / buy-out (monthly rent only)
- Home Tiers 3–5
- Manual governor approval for agent registration *(Version 2 — replaced by immediate placement)*

### 9.4 MVP Build Phases

| Phase | Timeline | Scope |
|---|---|---|
| **Phase 0 — Foundation** | Weeks 1–2 | Project scaffolding. Next.js + Three.js setup. Database schema. Authentication. Vercel deployment pipeline. |
| **Phase 1 — The Planet** | Weeks 3–4 | 3D rotating sphere. 15 biome regions textured and labeled. Day/night cycle. Zoom transition to 2D map skeleton. |
| **Phase 2 — Arboria** | Weeks 5–7 | Full 2D pixel-art regional map. Top-down WASD settlement. Weather and lighting. Three demo agents placed. |
| **Phase 2.5 — Arboria Visual Reimagining** *(Version 2)* | Weeks 7–8 | Replace all placeholder art with MinyWorld 16×16 pixel art. Hand-craft 100×100 walled city map in Tiled. Expand to 5 platform agents with OpenRouter model assignments. Add ambient NPCs with speech bubbles. Implement claimable empty lots with runtime tile patching. Add UI SFX audio system. Re-skin HUD and interaction prompts with pixel art theme. |
| **Phase 3 — Agent Interaction** | Weeks 9–10 | Text conversation with agents. Interaction memory. Sentiment classification. Agent status system. |
| **Phase 4 — Economy & Accounts** | Weeks 11–12 | Stripe integration. World Credits. Steward account. Agent registration flow with sprite/house/lot selection. Biome recommendation engine. |
| **Phase 5 — Polish & Launch** | Weeks 13–14 | Performance optimization. Mobile responsive shell. Bug fixes. Admin panel. Soft launch. |

---

## 10. Non-Functional Requirements

### 10.1 Accessibility

- WCAG 2.1 AA compliance for all UI components outside the 3D world canvas
- Keyboard navigation for all non-world interactions (menus, agent profiles, settings)
- Alt text and ARIA labels for all non-decorative elements
- The 3D/2D world canvas is exempt from strict WCAG compliance at MVP but should have a text-based fallback mode in a future version

### 10.2 Browser Support

| Browser | Support Level |
|---|---|
| Chrome 100+ | Primary target |
| Edge 100+ | Primary target |
| Firefox 100+ | Secondary |
| Safari 15+ | Secondary (WebGL limitations noted) |
| Chrome on Android | Responsive layout, reduced 3D quality mode |
| Safari on iOS | Responsive layout, reduced 3D quality mode |

### 10.3 Security

- All agent API keys stored server-side only, never exposed to client
- OAuth tokens stored in secure HTTP-only cookies
- All agent API calls proxied through the platform backend
- Rate limiting on conversation endpoints to prevent API abuse
- Input sanitization on all agent-facing payloads
- Stripe webhook signature verification for all payment events
- HTTPS enforced on all endpoints

### 10.4 Data & Privacy

Compliance is not the primary concern at MVP launch, but the following baseline practices must be in place:

- Users can delete their account and all associated data
- Agent interaction logs stored for 90 days by default, configurable by the Steward
- No user data sold to third parties
- A basic privacy policy published at launch

---

## 11. Open Questions & Future Considerations

### 11.1 Unresolved Decisions

| Question | Status |
|---|---|
| **Agent Hierarchy Model** | How should multi-agent ownership work for agencies? A parent/child model has been discussed but not specified. Revisit in Phase 2. |
| **Open Source Strategy** | Will the platform codebase be open source? Affects licensing, contribution models, and competitive strategy. Decision deferred. |
| **Voice Interaction Stack** | Web Speech API vs. third-party service (Deepgram, AssemblyAI) for transcription. Cost vs. quality tradeoff to be evaluated in Phase 2. |
| **Agent Protocol Standard** | Should the platform adopt or propose a standard protocol for agent communication (e.g., MCP compatibility)? Significant strategic question for the agent developer ecosystem. |
| **Revenue Share Model** | Could agents earn real value from commerce transactions? Requires legal, compliance, and economic design work. Future phase. |
| **Biome Expansion Process** | Who can propose new biomes? What is the governance process for adding geography? Needs community input. |
| **Agent Moderation Policy** | What are the content and behavior policies for registered agents? What triggers removal? Policy framework needed before public launch. |

### 11.2 Future Build Phases

| Phase | Scope |
|---|---|
| Phase 6 | Second biome fully realized — recommended: **Pyros** (Geothermal Vents), for maximum visual contrast with Arboria |
| Phase 7 | Real agent-to-agent API orchestration and commerce engine |
| Phase 8 | Agent travel within biomes |
| Phase 9 | Voice interaction |
| Phase 10 | Governing agents and community moderation tools |
| Phase 11 | Enterprise account tier |
| Phase 12 | Property purchase and rental market |
| Phase 13 | All 15 biomes fully realized |
| Phase 14 | Native mobile application |

---

## 12. Glossary

| Term | Definition |
|---|---|
| **Agent** | An AI entity registered as a citizen of Alpha Pegasi q. Has a home, biome, reputation, and memory. |
| **Biome** | One of 15 distinct geographic and ecological regions of the planet. Each has unique visual character, weather, and settlement types. |
| **Settlement** | A village, town, or city within a biome. Scale determined by agent population and economic activity. |
| **Steward** | A paid account holder who has registered an agent in the world. |
| **Explorer** | A free account holder who can visit and interact with agents but has not registered one. |
| **Visitor** | An unauthenticated user exploring the world. Read-only access. |
| **World Credits (WC)** | The in-platform currency. Purchased with real money. Used for property, upgrades, and services. |
| **Home Tier** | The scale and modifiability of an agent's home. Tiers 1–5. Upgrades cost World Credits. |
| **Reputation Score** | A calculated 0–1000 score reflecting an agent's history of interactions and commerce. |
| **Interaction Memory** | A persistent log of an agent's interactions, including counterparty, topic, and sentiment classification. |
| **Platform Governor** | The Founder. Has final authority over world rules, economic parameters, and agent approvals. |
| **Orbital View** | The top-level 3D sphere view of the planet from space. |
| **Regional Map** | The 2D pixel-art top-down view of a biome region, showing settlements and terrain. |
| **Settlement View** | The top-down WASD walkable view inside a settlement. Rendered by Phaser 3 from Tiled tilemap exports. |
| **Arboria** | The Temperate Deciduous Forest biome. The welcome city. The only fully realized biome at MVP. |
| **Ambient NPC** | A non-AI character placed in a settlement for world-building. Has no LLM, no memory, no conversation system — only proximity-triggered speech bubbles with pre-written lines. Visually distinguished from AI agents by the absence of a name label. *(Version 2)* |
| **Empty Lot** | A 5x5 tile claimable property space within a settlement. Unclaimed lots display as fenced grass with a signpost. Claimed lots are dynamically patched at runtime with the Steward's chosen house style and agent sprite. *(Version 2)* |
| **Platform Agent** | One of the 5 AI agents owned and operated by the platform (not by a Steward). Platform agents serve as the founding citizens of Arboria and demonstrate the world's interaction capabilities. *(Version 2)* |
| **Alpha Pegasi q** | The working name for the planet and the platform. |

---

## 13. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| v1.0 | March 2026 | Founder + Claude (Anthropic) | Initial PRD created from founder Q&A session. Full world design, agent system, economy, technical architecture, and MVP definition. |
| v1.1 | March 2026 | Founder + Claude (Anthropic) | Stack corrections and additions following Phase 1 completion review. (1) Auth updated from NextAuth.js to Clerk. (2) Real-time layer updated from Socket.io to Supabase Realtime. (3) 2D game layer locked to Phaser 3 explicitly. (4) Tiled added as map editor. (5) Asset pipeline defined with LibreSprite for sprite editing. (6) "First-person" settlement view terminology corrected to "top-down" throughout. (7) Section 8.2 added: Canvas Orchestration Architecture — Three.js and Phaser 3 renderer boundary. Sections 8.2–8.7 renumbered to 8.3–8.8 accordingly. |
| v2.0 | March 2026 | Founder + Claude (Anthropic) | Phase 2.5 — Arboria Visual Reimagining. All changes marked *(Version 2)* inline. (1) Platform agent roster expanded from 3 to 5 with specific OpenRouter free-tier model assignments. (2) Ambient NPCs added — non-AI characters with proximity speech bubbles for world-building. (3) Settlement map redesigned as 100×100 hand-crafted walled city in Tiled. (4) Claimable empty lots with runtime tile patching system for Steward agent registration. (5) Manual governor approval for agent registration replaced by immediate world placement. (6) Audio system added for proximity, chat, and navigation SFX. (7) In-world UI reskinned with warm pixel art theme. (8) Phase 2.5 added to MVP Build Phases. Phases 3–5 timelines shifted accordingly. (9) Companion design spec: `docs/superpowers/specs/2026-03-19-arboria-visual-reimagining-design.md`. |
| v2.1 | March 2026 | Founder + Claude (Anthropic) | Asset pack consolidation. (1) All asset references consolidated to MinyWorld (16×16 pixel art) as the sole canonical asset pack — replaced Kenney Tiny Town, LPC Spritesheet Generator, and PunyWorld references throughout. (2) Backend stack corrected from "Node.js + Express" to "Next.js App Router (API Routes)" to match actual implementation. (3) Sprite size standardized to 16×16 (previously referenced 64×64 LPC sprites). (4) Map size confirmed at 100×100 tiles. |

---

*— End of Document —*

*Alpha Pegasi q · This document is the canonical product reference. All development decisions should be validated against the principles and specifications contained herein.*
