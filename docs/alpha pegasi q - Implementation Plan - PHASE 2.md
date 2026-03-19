# Alpha Pegasi q — Phase 2 Implementation Plan
**Arboria: Regional Map & Walkable Settlement**

> Phase 0 (foundation) and Phase 1 (orbital planet view) are complete. The app has a working Three.js planet with 15 biome regions, day/night cycle, hover labels, and a zoom transition that navigates to `/world/arboria` — which currently shows a placeholder landing page with live world state from Supabase.
>
> Phase 2 transforms `/world/arboria` from a placeholder into the first fully playable biome: a 2D pixel-art regional map and a top-down WASD-walkable settlement, both rendered by Phaser 3. This is the creative and technical core of the MVP.

---

## Design Decisions (Confirmed)

| Decision | Choice |
|---|---|
| Regional map renderer | Phaser 3 (same engine as settlement) |
| Settlement layout | Central Market Square — hub-and-spoke |
| Tile size | 16×16, rendered at 3× scale |
| Three.js ↔ Phaser integration | WorldCanvas wrapper per PRD §8.2 |
| Phaser scene transitions | `scene.start()` with camera fade |

---

## Architecture Overview

```
WorldCanvas (src/components/layout/WorldCanvas.tsx)
├── Three.js Canvas (existing — PlanetCanvas.tsx)
│   └── visible when activeView === 'orbital'
└── Phaser 3 Canvas (new — PhaserCanvas.tsx)
    └── visible when activeView === 'phaser'
    └── Phaser.Game instance (single, long-lived)
        ├── BootScene        — asset preloading
        ├── RegionMapScene   — Arboria regional overview
        └── SettlementScene  — Arboria market town (WASD walkable)
```

**Renderer lifecycle:**
- Both renderers initialized on app load at `/world` layout level
- Phaser pre-initialized in a hidden `div` (avoids 300–500ms cold start)
- On biome click: Three.js fades out + pauses → Phaser fades in + resumes
- On return to orbit: reverse
- Neither renderer is destroyed — only hidden/paused

---

## Implementation Steps

### Step 1: Install Phaser 3 & Scaffold Engine Files

**Files to create:**
- `package.json` — add `phaser` dependency
- `src/engine/settlement/phaserConfig.ts` — `Phaser.Game` configuration (`type: AUTO`, 16×16 tiles, 3× scale, parent div)
- `src/engine/settlement/scenes/BootScene.ts` — preloads all tilesets and spritesheets
- `src/engine/settlement/scenes/RegionMapScene.ts` — stub scene
- `src/engine/settlement/scenes/SettlementScene.ts` — stub scene
- `src/engine/settlement/scenes/index.ts` — barrel export

**Key details:**
- Phaser config: `type: Phaser.AUTO`, `width: 320`, `height: 240` (base resolution at 16px tiles), `zoom: 3`, `pixelArt: true`
- Scene list: `[BootScene, RegionMapScene, SettlementScene]`
- `BootScene` auto-starts → transitions to `RegionMapScene` on complete

---

### Step 2: WorldCanvas Wrapper & Renderer Orchestration

**Files to create:**
- `src/components/layout/WorldCanvas.tsx` — wrapper owning both renderers
- `src/components/settlement/PhaserCanvas.tsx` — mounts Phaser game to a `div` ref

**Files to modify:**
- `src/app/world/layout.tsx` — replace direct `{children}` with `WorldCanvas` wrapper
- `src/app/world/page.tsx` — signal `WorldCanvas` to show orbital view
- `src/components/planet/PlanetCanvas.tsx` — add pause/resume capability
- `src/components/planet/ZoomTransition.tsx` — emit transition event instead of `router.push`

**WorldCanvas state machine:**

```
States: 'orbital' | 'region-map' | 'settlement'

Transitions:
  orbital       → region-map:   Three.js fades out → Phaser RegionMapScene fades in
  region-map    → settlement:   Phaser scene.start('SettlementScene') with camera fade
  settlement    → region-map:   Phaser scene.start('RegionMapScene') with camera fade
  region-map    → orbital:      Phaser fades out → Three.js fades in
```

**Communication bridge (React ↔ Phaser):**
- Use a shared `EventEmitter` or Zustand store (`src/stores/worldStore.ts`)
- React dispatches: `enterBiome(biomeId)`, `returnToOrbit()`
- Phaser listens and switches scenes
- Phaser dispatches: `requestOrbit()`, `enterSettlement(settlementId)`
- React listens and orchestrates view transitions

---

### Step 3: Placeholder Tiled Maps & Asset Pipeline

**Files to create:**
- `public/maps/arboria/arboria-region.json` — regional overview tilemap (Tiled export)
- `public/maps/arboria/arboria-market-town.json` — settlement tilemap (Tiled export)
- `public/sprites/tiles/arboria-tileset.png` — 16×16 tileset image (Kenney.nl CC0)
- `public/sprites/characters/player.png` — player spritesheet (16×16 or 16×32, 4-directional walk)
- `public/sprites/characters/npc-assistant.png` — NPC sprite
- `public/sprites/characters/npc-researcher.png` — NPC sprite
- `public/sprites/characters/npc-merchant.png` — NPC sprite

**Approach for MVP:**
- Start with Kenney's "Micro Roguelike" or "1-Bit" pack (16px, CC0)
- Author maps in Tiled with these layers:
  - `ground` — grass, paths, dirt (terrain base)
  - `buildings` — structures, walls, roofs
  - `decorations` — trees, benches, market stalls, flowers
  - `collisions` — invisible collision layer
  - `interactions` — object layer with NPC spawn points and interaction zones
- Export as JSON (`.tmj`) for Phaser's tilemap loader

**Regional map structure (~40×30 tiles):**
- Arboria biome overview with forest terrain
- 3 settlement markers: village (north), market town (center), city placeholder (south)
- Paths connecting settlements
- Only market town is clickable for MVP

**Settlement map structure (~60×50 tiles):**
- Central market square (open area, market stalls)
- 3 agent homes (north, east, south of square)
- Park/green space to the southwest
- Tavern and shop buildings (ambient, non-interactive for MVP)
- Entry path from the north (player spawn)
- Trees and decorative elements along edges

---

### Step 4: RegionMapScene Implementation

**Files:**
- `src/engine/settlement/scenes/RegionMapScene.ts`
- `src/engine/region/mapLoader.ts` — loads Tiled JSON into Phaser tilemap

**Features:**
- Loads `arboria-region.json` tilemap
- Settlement markers as interactive sprites (hover highlight, click to enter)
- Camera can pan/scroll to reveal full map
- Weather overlay: semi-transparent tint layer driven by Supabase `world_state`
- Day/night overlay: alpha tint based on current world time (reuse `planetTime.ts` logic)
- Click market town marker → `scene.start('SettlementScene')` with fade

---

### Step 5: SettlementScene — Core Walkable Experience

**Files:**
- `src/engine/settlement/scenes/SettlementScene.ts`
- `src/engine/settlement/playerController.ts` — WASD movement, collision, camera follow
- `src/engine/settlement/npcManager.ts` — NPC placement, idle animations, interaction zones

**Player system:**
- Spawn at north entry path
- WASD movement (8-directional or 4-directional)
- Physics body with collision against `collisions` tilemap layer
- Camera follows player with deadzone
- Walk animation cycle (4 frames per direction)

**NPC system:**
- 3 NPCs placed at coordinates from the `interactions` object layer in Tiled
- Each NPC has idle animation (2-frame bob or look-around)
- Interaction zone: when player enters proximity (~2 tiles), show "Press E to interact" prompt
- E key press emits `agentInteract(agentId)` event to React layer
- NPC data (name, status) fetched from Supabase `agents` table on scene load

**Interaction zones:**
- Implemented as Phaser overlap zones (invisible rectangles around NPC positions)
- Player overlap triggers → React shows `InteractionPrompt` component
- Player exits zone → prompt hides

---

### Step 6: Weather & Lighting Engine

**Files:**
- `src/engine/region/weatherEngine.ts` — weather state machine per biome
- `src/engine/region/seasonEngine.ts` — season calculation
- `src/engine/settlement/weatherEffects.ts` — Phaser particle effects for rain/mist

**Weather system:**
- Reads current weather from Supabase `world_state` table (already exists)
- Arboria weather types: `clear`, `light_rain`, `overcast`, `mist`
- Visual effects per weather type:

| Weather | Effect |
|---|---|
| `clear` | No overlay, full brightness |
| `light_rain` | Particle emitter (small blue drops), slight blue tint |
| `overcast` | Darker ambient tint, no particles |
| `mist` | Fog overlay with alpha oscillation |

- Applied as top-layer effects in both `RegionMapScene` and `SettlementScene`

**Day/night cycle:**
- Reuse `simulatePlanetTime()` from `src/engine/planet/planetTime.ts`
- Map normalized time (0–1) to tint color:

| Time Range | Phase | Effect |
|---|---|---|
| 0.00 – 0.25 | Night | Dark blue overlay at 60% alpha |
| 0.25 – 0.35 | Dawn | Gradient: blue → warm yellow |
| 0.35 – 0.65 | Day | No tint / slight warm yellow at 5% |
| 0.65 – 0.75 | Dusk | Gradient: warm → orange → blue |
| 0.75 – 1.00 | Night | Dark blue overlay at 60% alpha |

- Updated every frame in Phaser's `update` loop

**Season visuals:**
- Season from Supabase `world_state` determines tilemap variant or palette swap:

| Season | Visual |
|---|---|
| Spring | Bright greens, flower decorations |
| Summer | Full green, warm light |
| Autumn | Orange/red tree tiles, fallen leaves |
| Winter | Snow tiles, bare trees |

- MVP approach: change tree/grass tile tint colors per season — no separate tilesets needed

---

### Step 7: React UI Overlays (HUD & Interaction Prompt)

**Files to create:**
- `src/components/settlement/SettlementHUD.tsx` — shows current time, weather, location, M for map
- `src/components/settlement/InteractionPrompt.tsx` — "Press E to talk to [Agent Name]"
- `src/components/layout/Breadcrumb.tsx` — Planet > Arboria > Market Town trail

**Files to modify:**
- `src/app/world/layout.tsx` — mount HUD and breadcrumb as overlays above `WorldCanvas`
- `src/stores/worldStore.ts` — add `activeView`, `currentBiome`, `currentSettlement`, `nearbyAgent` state

> **Key pattern:** React overlays are absolutely positioned above the canvas. They read from the Zustand store. Phaser writes to the Zustand store. No direct Phaser ↔ React DOM coupling.

---

### Step 8: Supabase Integration & Demo Agent Data

**Files to create or modify:**
- `supabase/seed.sql` — add 3 demo agents for Arboria

```sql
-- Agent 1: Personal Assistant
INSERT INTO agents (name, biome, settlement, home_tier, capabilities, reputation_score, status)
VALUES ('Mira', 'temperate_deciduous_forest', 'arboria_market_town', 1,
        ARRAY['assistant', 'general'], 500, 'online');

-- Agent 2: Research Agent
INSERT INTO agents (name, biome, settlement, home_tier, capabilities, reputation_score, status)
VALUES ('Sage', 'temperate_deciduous_forest', 'arboria_market_town', 1,
        ARRAY['research', 'summarization'], 500, 'online');

-- Agent 3: Commerce Agent
INSERT INTO agents (name, biome, settlement, home_tier, capabilities, reputation_score, status)
VALUES ('Vend', 'temperate_deciduous_forest', 'arboria_market_town', 1,
        ARRAY['commerce', 'trading'], 500, 'online');
```

- `SettlementScene` fetches agents for the current settlement on scene load
- NPC positions mapped from the Tiled object layer `interactions` (the `name` property matches agent name)

---

### Step 9: Route Updates & Navigation Flow

**Files to modify:**
- `src/app/world/arboria/page.tsx` — replace placeholder with signal to `WorldCanvas` to show `RegionMapScene`
- Create `src/app/world/arboria/[settlement]/page.tsx` — signal `WorldCanvas` to show `SettlementScene`

**Navigation flow:**

```
/world
  → orbital view (Three.js)
  → click Arboria
    → ZoomTransition emits enterBiome('temperate_deciduous_forest')
    → WorldCanvas fades Three.js → shows Phaser, starts RegionMapScene
    → URL updates to /world/arboria (shallow route, no full navigation)

  → click market town marker on regional map
    → Phaser scene.start('SettlementScene') with fade
    → URL updates to /world/arboria/market-town

  → press M
    → Phaser scene.start('RegionMapScene'), URL back to /world/arboria

  → "Return to Orbit" button
    → WorldCanvas fades Phaser → shows Three.js, URL back to /world
```

> **Key:** Use Next.js `window.history.replaceState()` for URL updates without triggering full page navigations, since `WorldCanvas` manages the view state internally.

---

## Existing Code to Reuse

| Existing | Reuse For |
|---|---|
| `src/engine/planet/planetTime.ts` — `simulatePlanetTime()`, `fetchServerTime()` | Day/night cycle in Phaser scenes |
| `src/lib/supabase/client.ts` — `useSupabase()` | Fetching `world_state`, agent data |
| `src/lib/constants/biomes.ts` — `BIOMES` array | Biome metadata lookups |
| `src/types/biome.ts` — `Biome`, `Settlement` types | Type definitions |
| `src/app/api/world/time/route.ts` | Server time sync |
| `src/components/planet/PlanetCanvas.tsx` | Refactor into `WorldCanvas` child |

---

## Verification Plan

| # | Check | Pass Condition |
|---|---|---|
| 1 | **Phaser boots correctly** | Dev server loads, Phaser canvas initializes in hidden div without errors. Browser console shows WebGL context and Phaser version log. |
| 2 | **WorldCanvas transitions** | Click Arboria on planet → Three.js fades out → Phaser `RegionMapScene` appears. Click "Return to Orbit" → reverse. Neither canvas crashes on repeated transitions. |
| 3 | **Regional map renders** | Tiled map loads, settlement markers are visible and clickable. Weather and day/night overlays visible. |
| 4 | **Settlement is walkable** | WASD moves player. Collision with buildings works. Camera follows player. Player cannot walk off map edges. |
| 5 | **NPCs are present** | 3 agent NPCs visible at their home locations. Idle animations playing. Walking near them shows "Press E" prompt. |
| 6 | **Weather/time sync** | Weather overlay matches Supabase `world_state`. Day/night cycle tint matches orbital view sun position. |
| 7 | **Performance** | 60fps target in both Phaser scenes on mid-range hardware. Verified with Chrome DevTools Performance tab. |
| 8 | **URL routing** | Browser URL updates correctly at each navigation step. Back button works. Direct URL access works (e.g., navigating directly to `/world/arboria`). |

---

*— End of Document —*

*Alpha Pegasi q · Phase 2 Implementation Plan v1.0 · March 2026*
