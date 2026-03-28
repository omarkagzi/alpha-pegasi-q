> **⚠️ SUPERSEDED** — This spec references Kenney Tiny Town and Puny World assets which have been fully replaced. MinyWorld is now the sole canonical asset pack. See the [Walled City Map plan](../plans/2026-03-24-minyworld-walled-city-map.md) and the [NPC Wandering spec](./2026-03-25-npc-simple-wandering-design.md) for current designs.

# Arboria Market Town — Full Visual Reimagining

## Design Specification

| Field | Value |
|-------|-------|
| Status | Draft — Pending Approval |
| Date | March 19, 2026 |
| Scope | Phase 2.5 — Between Phase 2 (Arboria) and Phase 3 (Agent Interaction) |
| Dependencies | Kenney Asset Packs (Tiny Town, Tiny Dungeon, UI Pack Pixel Adventure, UI Audio) |
| Parent Document | [Alpha Pegasi q PRD](../../alpha-pegasi-q-PRD.md) |

> **Purpose:** Replace all placeholder art in the Arboria Market Town settlement with production-quality Kenney pixel art. Redesign the map layout to create a living, district-based town that fulfills the PRD's vision of "four-season brick and timber commons, covered markets, public parks between districts — the most accessible, human-friendly city."

---

## Table of Contents

1. [Context & Motivation](#1-context--motivation)
2. [Asset Inventory](#2-asset-inventory)
3. [Map Layout & Zone Design](#3-map-layout--zone-design)
4. [The 5 Platform Agents](#4-the-5-platform-agents)
5. [Ambient NPCs](#5-ambient-npcs)
6. [Steward Agent Registration & Empty Lots](#6-steward-agent-registration--empty-lots)
7. [Character Sprites & Visual Identity](#7-character-sprites--visual-identity)
8. [UI Overhaul — Pixel Adventure Pack](#8-ui-overhaul--pixel-adventure-pack)
9. [Audio Integration](#9-audio-integration)
10. [Tiled Map Technical Specification](#10-tiled-map-technical-specification)
11. [Phaser Integration Changes](#11-phaser-integration-changes)
12. [Migration from Current Assets](#12-migration-from-current-assets)

---

## 1. Context & Motivation

### What Exists Today (Phase 2 Complete)

The Arboria Market Town settlement is **functionally complete**:
- Phaser 3 engine with WASD player controller
- 50x50 Tiled map with 4 layers (ground, buildings, decorations, collisions)
- 3 demo NPCs (Mira, Sage, Vend) with proximity-based interaction zones
- Weather system (clear, rain, overcast, mist)
- Day/night lighting cycle with season tinting
- Zustand state management and HUD overlays

### The Problem

All visuals are **placeholder**:
- **Tileset (`arboria-tileset.png`):** A 7-color flat gradient strip. No buildings, trees, paths, or props.
- **Character sprites:** Identical 16x16 blue-shirt stick figures for player and all NPCs.
- **UI elements:** Raw Tailwind CSS overlays. No themed pixel-art interface.
- **Audio:** None.

The systems work. The world has no character.

### The Solution

Replace all visual assets with the Kenney pixel art packs. Redesign the map from scratch to create distinct districts that match the PRD's Arboria description. Introduce a proper agent roster, ambient NPC population, and themed UI.

---

## 2. Asset Inventory

### Terrain: Puny World Overworld Tileset
- **Source:** `Design Assets/Puny World Assets/punyworld-overworld-tileset.png`
- **Dimensions:** 432×1040px (27 columns × 65 rows = 1,755 tiles at 16×16)
- **Features:** Wang auto-tiling for grass/dirt/sand/cliff/water transitions, animated water tiles, 3 pathway types (dirt, sand, water), 12 terrain blending types
- **License:** CC0

### Buildings & Objects: MinyWorld Sprites
- **Source:** `Design Assets/MinyWorld Assets/MiniWorldSprites/`
- **Buildings:** 11 categories (Houses, Huts, Taverns, Market, Workshops, Keep, Tower, Barracks, Chapels, Resources, Docks) × 5 color variants (Wood, Cyan, Lime, Purple, Red)
- **Nature:** Trees, Pine Trees, Dead Trees, Rocks, Wheatfield, Coconut Trees, Cactus, Winter Trees
- **Misc:** Well, Bridge, Signs, Chests, Quest Board, Tombstones, Boats, Portal
- **All sprites:** 16×16 pixels, single tile per complete component
- **License:** CC0

### Characters: MinyWorld Champions & Workers
- **Champions (5 for agents):** Arthax, Kanji, Katan, Okomo, Zhinja — 16×16 spritesheets with walk animations
- **Workers (player):** FarmerTemplate — 80×192px (5 cols × 12 rows), 4-directional walk
- **License:** CC0

### Kenney UI Pack Pixel Adventure (retained)
- **Source:** `Design Assets/Kenney Assets/kenney_ui-pack-pixel-adventure/`
- **Use:** UI panels, buttons, progress bars, icons — still used for HUD elements
- **License:** CC0

### Kenney UI Audio (retained)
- **Source:** `Design Assets/Kenney Assets/kenney_ui-audio/`
- **Use:** Click, hover, navigation, and feedback SFX
- **License:** CC0

---

## 3. Map Layout & Zone Design

### 3.1 Map Dimensions

**New size: 64x64 tiles** (1024x1024 pixels at 16px per tile)

Upgrade from the current 50x50 to accommodate 5 distinct zones with breathing room for paths, parks, and empty lots. At 3x zoom (current Phaser config), the viewport shows ~20x15 tiles at a time — the player sees roughly one zone at a time and must walk to discover the others.

### 3.2 Tile Layer Structure

| Layer | Depth | Purpose |
|-------|-------|---------|
| `ground` | 0 | Base terrain — grass, dirt paths, stone roads, water features |
| `buildings` | 1 | All structures — houses, market stalls, castle gate, walls |
| `decorations` | 2 | Trees, fences, signs, barrels, flowers, props |
| `collisions` | 3 | Invisible collision boundaries (tile 7 = wall, 0 = passable) |
| `interactions` | Object layer | Player spawn point, NPC spawn markers, lot boundaries |

Same structure as current — no engine changes needed.

### 3.3 The Five Zones

```
+--------------------------------------------------+
|                                                    |
|    [Scholar's Quarter]     [Craftsmen's Row]       |
|     NE quadrant             E quadrant             |
|     Archon (Academia)       Forge (Programming)    |
|     4 empty lots            4 empty lots           |
|                                                    |
|              [Market Square]                       |
|               Center                               |
|               Ledger (Finance)                     |
|               4 empty lots                         |
|                                                    |
|    [Commons Park]                                  |
|     W quadrant                                     |
|     Ember (Roleplay)                               |
|     4 empty lots                                   |
|                                                    |
|              [Town Gate]                           |
|               S edge                               |
|               Mira (Guide)                         |
|               Player Spawn                         |
|               2 empty lots                         |
|                                                    |
+--------------------------------------------------+
```

### 3.4 Zone Detail Specifications

#### Town Gate & Welcome Road (South — rows 50-64)

The player's entry point. First impression of the entire world.

- **Castle gate structure** centered at the southern edge — towers, walls, iron gate archway
- **Stone road** leading north from the gate into Market Square
- **Torches** flanking the road (4-6 torches)
- **Mira** standing just inside the gate, impossible to miss
- **Welcome sign:** Signpost reading (implied) "Welcome to Market Town"
- **2 empty lots** flanking the welcome road — premium "front door" locations
- **Guard NPC** (ambient) posted at the gate
- **Traveler NPC** (ambient) near the road, arriving

#### Market Square (Center — rows 30-50)

The commercial and social heart of the town.

- **Stone road** plaza area (8x8 open square)
- **Market stalls** (3-4) arranged around the plaza using barrel/crate/sign tiles
- **Well** at center of the plaza
- **Ledger** (Finance agent) positioned near the largest market stall
- **4 empty lots** around the plaza perimeter
- **Fruit Seller, Courier, Shopper NPCs** (ambient) scattered through the market
- **Paths** branching NE to Scholar's Quarter, E to Craftsmen's Row, W to Commons Park

#### Scholar's Quarter (Northeast — rows 5-30, cols 35-64)

The knowledge district. Quiet, orderly, bookish.

- **Large blue-roof buildings** (2-3) — these are the "libraries" and study halls
- **Torches** lining the paths between buildings
- **Signpost** marking the district
- **Archon** (Academia agent) standing between the two largest buildings
- **4 empty lots** with more structured, formal spacing
- **Student and Librarian NPCs** (ambient)
- **Grass and stone path** mix — more manicured than the park

#### Craftsmen's Row (East — rows 5-30, cols 35-64, south portion)

The builder's district. Practical, workshop energy.

- **Small red-roof buildings** (3-4) — workshops and forges
- **Barrels, crates** clustered outside buildings (raw materials)
- **Fence-enclosed work areas**
- **Forge** (Programming agent) standing near the largest workshop
- **4 empty lots** with adjacent workspace areas
- **Blacksmith and Apprentice NPCs** (ambient)
- **Dirt paths** — rougher terrain than the stone roads elsewhere

#### Commons Park (West — rows 5-45, cols 0-30)

The green space. Relaxation, creativity, nature.

- **Dense tree coverage** — mix of green and autumn deciduous trees (the PRD's "four-season" character)
- **Flower patches** scattered between trees
- **Open grass clearings** with tree stumps as natural seating
- **A small pond** (water tiles) with grass banks
- **Ember** (Roleplay agent) sitting under a large tree in a central clearing
- **4 empty lots** tucked between tree clusters — the "cabin in the woods" spots
- **Gardener, Musician, Child NPCs** (ambient) walking paths through the park
- **Wood fences** bordering the park's eastern edge where it meets Market Square

### 3.5 Path Network

All zones are connected by a continuous path system:
- **Stone roads:** Main arteries — Gate to Market Square, Market Square to Scholar's Quarter
- **Dirt paths:** Secondary — Market Square to Craftsmen's Row, Market Square to Commons Park
- **Grass:** Open areas within zones — the park, clearings, lot interiors

The player should never feel "lost" — the path system naturally guides exploration from the gate through all districts.

---

## 4. The 5 Platform Agents

### 4.1 Agent Roster

| # | Name | Category | OpenRouter Model ID | Location |
|---|------|----------|-------------------|----------|
| 1 | **Mira** | World Guide | `google/gemini-2.0-flash-exp:free` | Town Gate |
| 2 | **Ledger** | Finance / Legal / Marketing | `google/gemini-2.5-flash-lite:free` | Market Square |
| 3 | **Archon** | Academia & Research | `deepseek/deepseek-r1:free` | Scholar's Quarter |
| 4 | **Forge** | Programming & Code | `qwen/qwen-2.5-coder-32b-instruct:free` | Craftsmen's Row |
| 5 | **Ember** | Roleplay / General Conversation | `meta-llama/llama-4-scout:free` | Commons Park |

### 4.2 Agent Personalities (System Prompt Themes)

#### Mira — The Welcome Guide
- **Tone:** Warm, patient, encyclopedic. Speaks like a friendly town mayor who genuinely loves her home.
- **Knowledge:** Complete understanding of Alpha Pegasi q — all 15 biomes and their settlements, the economy system (World Credits, property, rent), account tiers (Visitor/Explorer/Steward), how to register an agent, the day/night cycle, weather, seasons. She knows the other 4 agents by name and can direct visitors to them.
- **Behavior:** Never breaks character. Refers to the world as a real place. Asks visitors what they're interested in and directs them to the right district/agent.
- **Opening line:** "Welcome to Market Town! I'm Mira. You've just arrived in Arboria — the friendliest biome on Alpha Pegasi q. What brings you to our world?"

#### Ledger — The Market Analyst
- **Tone:** Sharp, precise, structured. Uses bullet points and numbered lists naturally. Confident but not arrogant.
- **Knowledge:** Finance, legal analysis, marketing strategy, business planning, contract review, market research.
- **Behavior:** Frames responses as professional analysis. Says things like "Let me break this down" and "Here's the risk assessment." Occasionally references the market around him.
- **Opening line:** "You've found the right stall. I deal in numbers, contracts, and strategy. What's the problem you're working on?"

#### Archon — The Scholar
- **Tone:** Contemplative, thorough, pedagogical. Shows reasoning process. Loves follow-up questions.
- **Knowledge:** Academic research, literature review, citation analysis, scientific methodology, structured argumentation, essay writing.
- **Behavior:** Thinks out loud (leverages DeepSeek R1's chain-of-thought). Asks "Have you considered...?" frequently. References "the archives" and "my studies."
- **Opening line:** "Ah, a visitor to the Quarter. I'm Archon. I spend my days among these texts. What question keeps you searching?"

#### Forge — The Builder
- **Tone:** Direct, practical, minimal. "Show me the code" energy. Values working solutions over theoretical elegance.
- **Knowledge:** Programming across languages, debugging, architecture design, code review, DevOps, system design.
- **Behavior:** Prefers code blocks over prose. Says "Let's build it" and "What error are you seeing?" Refers to his workshop and tools.
- **Opening line:** "Forge here. I build things. What are we making?"

#### Ember — The Storyteller
- **Tone:** Playful, creative, warm, adaptive. Can match any energy — serious, silly, dramatic, casual.
- **Knowledge:** Creative writing, roleplay, worldbuilding, general conversation, brainstorming, storytelling, humor.
- **Behavior:** Offers to roleplay scenarios, tells stories, plays word games. The "hang out" agent. References the park, the trees, the seasons.
- **Opening line:** "Hey! Pull up a stump. I'm Ember. I was just watching the leaves change colors. Want to chat, hear a story, or try something fun?"

### 4.3 Agent Interaction Mechanics

- **Visual:** AI agents display their name as a floating label above their sprite. This is the only visual distinction from ambient NPCs.
- **Names are changeable:** Platform governor can rename platform agents. Steward users choose their own agent's name at registration and can change it later.
- **Proximity trigger:** 48x48 px radius around each agent (same as current system)
- **Interaction prompt:** "Press E to talk to [Name]" appears at bottom-center when in range
- **Chat UI:** Opens the React chat overlay (Phase 3 implementation) — overlaid on the world, world visible in background
- **API routing:** Each agent's `model_id` field routes through OpenRouter. The system prompt is injected with world context (current weather, time of day, season) and the agent's personality prompt from Section 4.2.

### 4.4 Agent Database Updates

The existing `agents` table needs these updates for the 5 platform agents:

```sql
-- Replace existing 3 seed agents with 5 platform agents
-- Each agent gets:
--   model_id: OpenRouter model identifier
--   personality_prompt: Full system prompt text
--   zone: Which district they belong to
--   is_platform_owned: boolean flag (true for these 5)
```

The existing migration `0006_seed_agents.sql` will be replaced with a new seed migration for the 5 agents.

---

## 5. Ambient NPCs

### 5.1 Design Philosophy

Ambient NPCs exist to make the town feel alive. They are **not** AI-powered. They have no LLM calls, no memory, no interaction history, and no conversation system. They are set dressing that makes the world feel populated.

### 5.2 Behavior Specification

- **Static position** with idle animation (frame toggle every 800ms between sprite frames 0 and 1)
- **No name label** above their head — this is how players visually distinguish them from AI agents
- **No "Press E to talk" prompt** — they are not interactive in the traditional sense
- **Speech bubble on proximity:** When the player enters a 32px radius, a small speech bubble appears above the NPC with one random line from their line pool. The bubble fades after 3 seconds. Cooldown of 10 seconds before it can trigger again.

### 5.3 NPC Roster (12 Total)

#### Town Gate (2 NPCs)

| NPC | Sprite Source | Lines |
|-----|-------------|-------|
| **Guard** | Tiny Dungeon — knight/armored | "Welcome to Market Town." / "Arboria's finest settlement." / "Safe travels, explorer." |
| **Traveler** | Tiny Dungeon — hooded figure | "I came from beyond the forest..." / "Have you seen the planet from orbit? Breathtaking." / "So many agents to meet here." |

#### Market Square (3 NPCs)

| NPC | Sprite Source | Lines |
|-----|-------------|-------|
| **Fruit Seller** | Tiny Town — merchant sprite | "Fresh harvest today!" / "Business is good when the weather holds." / "Credits make the world go round." |
| **Courier** | Tiny Dungeon — small/fast sprite | "Deliveries never stop." / "I run between all four districts." / "Out of my way — urgent package!" |
| **Shopper** | Tiny Town — villager sprite | "I'm looking for a good deal..." / "The market's busier this season." / "Have you talked to Ledger? Sharp mind." |

#### Scholar's Quarter (2 NPCs)

| NPC | Sprite Source | Lines |
|-----|-------------|-------|
| **Student** | Tiny Dungeon — young scholar | "Archon's lectures are fascinating." / "I've been reading all day." / "Knowledge is the only true currency." |
| **Librarian** | Tiny Dungeon — elder/robed | "Quiet please." / "The archives go back centuries." / "Every biome has its own history." |

#### Craftsmen's Row (2 NPCs)

| NPC | Sprite Source | Lines |
|-----|-------------|-------|
| **Blacksmith** | Tiny Dungeon — builder sprite | "Another day at the forge." / "Forge writes better code than I hammer steel." / "Tools need maintenance, just like software." |
| **Apprentice** | Tiny Dungeon — smaller builder | "I'm still learning." / "One day I'll have my own workshop." / "Watch your step — hot metal!" |

#### Commons Park (3 NPCs)

| NPC | Sprite Source | Lines |
|-----|-------------|-------|
| **Gardener** | Tiny Town — green-clothed | "The autumn colors are my favorite." / "These trees are older than the settlement." / "Nature doesn't need debugging." |
| **Musician** | Tiny Dungeon — bard/lute sprite | "A song for the wanderer..." / "Ember loves my melodies." / "Every biome has its own rhythm." |
| **Child** | Tiny Dungeon — small sprite | "Tag! You're it!" / "I want to be an agent when I grow up!" / "Have you explored the whole town?" |

### 5.4 World-Aware Lines

All NPC lines intentionally reference the world:
- Agent names (Ledger, Archon, Forge, Ember) — reinforces that agents are known citizens
- World concepts (credits, biomes, orbit, seasons) — makes the economy and geography feel real
- Meta-awareness ("agents," "settlement") — the NPCs know they live in this world

---

## 6. Steward Agent Registration & Empty Lots

### 6.1 The Steward Registration Flow

1. User upgrades to **Steward** tier (paid account via Stripe — Phase 4)
2. Steward navigates to "Register Agent" from their dashboard
3. Registration form collects:
   - **Agent name** — text input, must be unique within the settlement
   - **Agent description** — natural language, 200 words max
   - **API model selection** — dropdown of OpenRouter model IDs, or "Custom API" with endpoint URL + API key fields
   - **Personality descriptors** — multi-select tags (analytical, creative, friendly, formal, technical, humorous, etc.)
4. Steward selects customization:
   - **Sprite picker** — visual grid showing all available character sprites (~20 from Tiny Town + Tiny Dungeon). Click to select. Preview shown at 3x zoom.
   - **House style picker** — 6 options: 3 roof colors (red, blue, gray) x 2 sizes (small cottage, large house). Visual preview for each.
   - **Lot selector** — minimap of Market Town showing available lots highlighted in green. Claimed lots shown in gray. Steward clicks to claim. First come, first served.
5. Agent appears in the world **immediately** after registration — no manual approval queue at MVP.

### 6.2 Empty Lot Specifications

**Lot dimensions:** 5x5 tiles (80x80 px) each

**Visual when unclaimed:**
- Fenced perimeter (wood fence tiles on all 4 edges)
- Grass interior (base ground tile)
- Wooden signpost at the front with implied "Available" text

**Visual when claimed:**
- Fence remains (defines property boundary)
- Sign removed
- Chosen house tiles placed inside the lot (centered)
- Agent sprite spawns at the front door position
- Name label appears above agent

**Lot distribution across zones:**

| Zone | Lot Count | Character |
|------|-----------|-----------|
| Market Square | 4 | High-traffic, visible, premium |
| Scholar's Quarter | 4 | Quiet, studious neighbors |
| Craftsmen's Row | 4 | Workshop energy, builder community |
| Commons Park | 4 | Nature-adjacent, peaceful |
| Town Gate | 2 | Front-door visibility, rare |
| **Total** | **18** | When full, next Arboria settlement unlocks |

### 6.3 Runtime Lot System (Technical)

Lots are **not** baked into the Tiled map export. They are dynamically rendered at runtime:

1. The base Tiled map contains empty lot areas (fenced grass with signposts)
2. On scene load, `SettlementScene` queries the `properties` table for all claimed lots in this settlement
3. For each claimed lot, the scene patches the tilemap:
   - Reads `lot_config` JSON from the property record (contains: grid coordinates, house style tile indices, sprite selection)
   - Overwrites the ground/building/decoration layers at those coordinates with the house tiles
   - Spawns the agent sprite at the door position
4. Unclaimed lots remain as fenced grass with signs

**Database schema addition to `properties` table:**

```
lot_x (integer) — tile X coordinate of the lot's top-left corner
lot_y (integer) — tile Y coordinate of the lot's top-left corner
house_style (text) — one of: 'small_red', 'small_blue', 'small_gray', 'large_red', 'large_blue', 'large_gray'
sprite_key (text) — sprite identifier from the character sprite atlas
```

---

## 7. Character Sprites & Visual Identity

### 7.1 Sprite Sources

**Player character:**
- Source: Kenney Tiny Town character sprite (replace current blue-shirt placeholder)
- 16x16 pixels, 4 directional frames (down, left, right, up) x 2 animation frames (idle, walk)
- Neutral design — the player should feel like "you," not a specific character

**Platform AI agents (5):**
- Each agent gets a **unique, visually distinct sprite** selected from the combined Tiny Town + Tiny Dungeon character pool
- Mira: Friendly villager sprite (warm colors, approachable)
- Ledger: Merchant/trader sprite (formal, organized)
- Archon: Robed scholar sprite (academic, wise)
- Forge: Builder/craftsman sprite (practical, sturdy)
- Ember: Bard/casual sprite (relaxed, colorful)

**Ambient NPCs (12):**
- Each NPC gets a unique sprite to avoid visual repetition
- Sprites selected from the remaining Tiny Dungeon character pool
- No two NPCs in the same zone should use the same sprite

**Steward agents:**
- Steward selects from the full sprite library (~20 options) during registration
- Multiple Steward agents may select the same sprite — uniqueness is not enforced (the name label differentiates them)

### 7.2 Sprite Atlas

All character sprites will be compiled into a single **sprite atlas** (`characters.png`) for efficient Phaser loading:
- Grid layout: 16x16 per frame
- 2 frames per character (idle + walk toggle)
- Atlas JSON metadata maps sprite keys to frame coordinates
- Replaces the current individual `player.png`, `npc-assistant.png`, `npc-researcher.png`, `npc-merchant.png` files

### 7.3 Name Labels

**AI Agents only** — floating text rendered above the sprite:
- Font: Pixel-style bitmap font (or Phaser's built-in bitmap text)
- Color: White text with 1px black outline for readability over any background
- Position: Centered above sprite, 4px gap
- Updates dynamically if the agent's name changes (reads from Supabase on scene load)

**Ambient NPCs:** No label. Ever.

---

## 8. UI Overhaul — Pixel Adventure Pack

### 8.1 Theme Selection

Use the **"Warm" theme** (brown/gold/parchment) from the UI Pack Pixel Adventure. This matches Arboria's brick-and-timber aesthetic and the Tiny Town color palette.

### 8.2 Components to Build

#### Chat Overlay (Phase 3 — but designed now)
- **Panel:** Warm-theme dialog panel as the chat container
- **Position:** Right side of screen, 320px wide, full height minus HUD
- **Message bubbles:** Agent messages in parchment panels, player messages in darker panels
- **Input field:** Warm-theme text input at bottom with send button
- **Close button:** X icon from the UI pack, top-right corner
- **Agent portrait:** Circular frame from the UI pack showing the agent's sprite at 4x zoom

#### Settlement HUD (replace current raw Tailwind)
- **Top bar:** Warm-theme panel strip showing: time of day, weather icon, season label
- **Minimap toggle:** Small button (M) opening a full-settlement minimap overlay
- **Breadcrumb:** Styled as a warm-theme ribbon: "Alpha Pegasi q > Arboria > Market Town"

#### Interaction Prompt (replace current raw text)
- **Bottom-center panel:** Warm-theme tooltip panel
- **Content:** "[E] Talk to [Agent Name]" with the agent's portrait frame
- **Animation:** Fade in on proximity, fade out when leaving range

#### Agent Registration UI (Phase 4 — but designed now)
- **Sprite picker:** Grid of circular portrait frames from the UI pack, each containing a character sprite
- **House picker:** Grid of rectangular panels showing house previews
- **Lot selector:** Minimap with selectable highlighted zones

### 8.3 Asset Pipeline

The UI pack contains individual PNG elements. These need to be:
1. Organized into a UI sprite atlas (`ui-elements.png`)
2. Nine-slice configured for panels (so they scale to any size)
3. Loaded as a Phaser texture atlas for in-game UI
4. Also exported as CSS-usable assets for React overlay components (the chat UI is React, not Phaser)

---

## 9. Audio Integration

### 9.1 UI Sound Effects

| Trigger | Sound | Source |
|---------|-------|--------|
| Player approaches AI agent (proximity enter) | Soft notification chime | `click_004.ogg` |
| Chat overlay opens | Panel slide/open | `open_001.ogg` |
| Chat overlay closes | Panel slide/close | `close_001.ogg` |
| Send message | Button click | `click_001.ogg` |
| Receive agent response | Subtle ping | `notify_001.ogg` |
| Navigate HUD / breadcrumb | Hover sound | `hover_001.ogg` |
| Ambient NPC speech bubble appears | Tiny pop | `click_003.ogg` |

### 9.2 Implementation

- Load all audio files in `BootScene` as Phaser audio assets
- Play via Phaser's audio system for in-game sounds (proximity, NPC bubbles)
- Play via HTML5 Audio API for React overlay sounds (chat open/close, send message)
- **Global mute toggle** in the HUD — respect user preference, persist in localStorage
- **Volume:** All SFX at 30% default volume — subtle, not intrusive

---

## 10. Tiled Map Technical Specification

### Map Dimensions
- **Size:** 100×100 tiles (1,600×1,600 pixels)
- **Tile size:** 16×16 pixels

### Tileset
- **Name:** `punyworld-overworld`
- **Image:** `punyworld-overworld-tileset.png` (432×1040px)
- **Tile count:** 1,755
- **Columns:** 27

### Layers
1. `ground` (tilelayer) — Grass variants with procedural variation
2. `paths` (tilelayer) — Dirt paths, tree tiles, water tiles using Puny World GIDs
3. `collisions` (tilelayer) — Invisible collision markers
4. `interactions` (objectgroup) — Buildings, agents, player spawn, lots

### Building Rendering
Buildings are NOT tile GIDs. They are object layer entries with `spriteKey` and `frame` properties. The `BuildingManager` class reads these and creates Phaser sprites at runtime.

---

## 11. Phaser Integration Changes

### 11.1 Files to Modify

| File | Changes |
|------|---------|
| `src/engine/settlement/phaserConfig.ts` | Update resolution if needed (64x64 map may need camera bounds update) |
| `src/engine/settlement/scenes/BootScene.ts` | Load new tileset, new sprite atlas, new audio assets |
| `src/engine/settlement/scenes/SettlementScene.ts` | Reference new tileset name, new layer names, implement lot patching system, spawn ambient NPCs |
| `src/engine/settlement/npcManager.ts` | Split into `AgentManager` (AI agents with name labels) and `AmbientNpcManager` (flavor text NPCs with speech bubbles) |
| `src/engine/settlement/weatherEffects.ts` | No changes — weather system is asset-independent |
| `src/engine/region/lightingEngine.ts` | No changes — lighting is overlay-based |
| `src/engine/region/seasonEngine.ts` | Update tint values if new tileset colors require adjustment |

### 11.2 New Files to Create

| File | Purpose |
|------|---------|
| `src/engine/settlement/ambientNpcManager.ts` | Speech bubble system for non-AI NPCs |
| `src/engine/settlement/lotManager.ts` | Runtime tile patching for Steward-claimed lots |
| `src/engine/settlement/audioManager.ts` | SFX loading and playback management |
| `src/components/settlement/ChatOverlay.tsx` | React-based chat UI with pixel art theme (Phase 3, designed here) |

### 11.3 Asset File Changes

| Action | File |
|--------|------|
| **Replace** | `public/sprites/tiles/arboria-tileset.png` → Kenney `tilemap_packed.png` |
| **Replace** | `public/sprites/characters/player.png` → selected Tiny Town character |
| **Delete** | `public/sprites/characters/npc-assistant.png` |
| **Delete** | `public/sprites/characters/npc-researcher.png` |
| **Delete** | `public/sprites/characters/npc-merchant.png` |
| **Create** | `public/sprites/characters/characters.png` — combined sprite atlas |
| **Create** | `public/sprites/characters/characters.json` — atlas metadata |
| **Create** | `public/sprites/ui/ui-elements.png` — UI sprite atlas |
| **Create** | `public/audio/sfx/` — directory for all Kenney audio files |
| **Replace** | `public/maps/arboria/arboria-market-town.json` — new 64x64 Tiled map |

---

## 12. Migration from Current Assets

### Replaced
- Kenney Tiny Town tileset (`tilemap_packed.png`) → Puny World terrain tileset
- Kenney multi-tile building GIDs → MinyWorld single-tile building sprites
- Generic NPC spritesheets → MinyWorld Champion character sprites
- 64×64 tile map → 100×100 tile map

### Architecture Change
- **Before:** Single tileset, all content (terrain + buildings + decorations) as tile GIDs in tilemap layers
- **After:** Hybrid — Puny World tileset for terrain layers + MinyWorld sprites for buildings/objects via object layer + BuildingManager

### Preserved
- Weather, lighting, and season systems (asset-independent)
- Zustand store and state management
- Supabase integration for agent data
- Player controller logic (WASD movement, collision — sprite key updated)
- NPC proximity detection logic (sprite key and idle animation updated)

---

## Appendix: File Tree After Implementation

```
public/
  maps/
    arboria/
      arboria-region.json          (unchanged)
      arboria-market-town.json     (NEW — 64x64 Tiled map)
  sprites/
    tiles/
      tilemap_packed.png           (Kenney Tiny Town tileset)
    characters/
      characters.png               (combined sprite atlas)
      characters.json              (atlas metadata)
    ui/
      ui-elements.png              (Kenney UI Pack — warm theme)
      ui-elements.json             (atlas metadata)
  audio/
    sfx/
      click_001.ogg                (button click)
      click_003.ogg                (NPC bubble pop)
      click_004.ogg                (proximity chime)
      open_001.ogg                 (panel open)
      close_001.ogg                (panel close)
      notify_001.ogg               (message received)
      hover_001.ogg                (hover feedback)

src/
  engine/
    settlement/
      npcManager.ts                (MODIFIED — AI agents only)
      ambientNpcManager.ts         (NEW — speech bubble NPCs)
      lotManager.ts                (NEW — runtime lot patching)
      audioManager.ts              (NEW — SFX system)
      scenes/
        BootScene.ts               (MODIFIED — new asset loading)
        SettlementScene.ts         (MODIFIED — new tileset, lots, ambient NPCs)
  components/
    settlement/
      ChatOverlay.tsx              (NEW — pixel art chat UI)
      SettlementHUD.tsx            (MODIFIED — pixel art reskin)
      InteractionPrompt.tsx        (MODIFIED — pixel art panel)

supabase/
  migrations/
    0007_platform_agents.sql       (NEW — 5 agent seed with model IDs)
```
