> **⚠️ SUPERSEDED** — This plan has been replaced by [2026-03-23 MinyWorld + Puny World Asset Migration](./2026-03-23-minyworld-punyworld-asset-migration.md). The Kenney Tiny Town approach was abandoned due to multi-tile assembly complexity. MinyWorld single-tile buildings + Puny World terrain provide a better path.

# Phase 2.5 — Arboria Visual Reimagining Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all placeholder art in the Arboria Market Town settlement with production-quality Kenney pixel art, expand from 3 to 5 platform agents, add 12 ambient NPCs, implement audio, and create the lot system foundation.

**Architecture:** The existing Phaser 3 engine, scene structure, and game systems (weather, lighting, seasons, player controller) remain unchanged. Only asset references, scene configuration, NPC management, and UI overlay components are modified. A Node.js map generator script produces the new 64x64 Tiled JSON. The NPC system splits into `AgentManager` (AI agents) and `AmbientNpcManager` (speech-bubble NPCs).

**Tech Stack:** Phaser 3, Tiled JSON format, Kenney Tiny Town + Tiny Dungeon + UI Pack Pixel Adventure + UI Audio (all CC0), Supabase PostgreSQL, React/Tailwind for HUD overlays, Node.js for map generation script.

**Parent Spec:** `docs/superpowers/specs/2026-03-19-arboria-visual-reimagining-design.md`

**Dependency Graph:**
```
Task 1 (Assets) ──► Task 2 (Map Generator) ──► Task 5 (Ambient NPCs)
                ──► Task 3 (Sprites)        ──► Task 5
                                             ──► Task 8 (Lot System)
Task 4 (Agent DB) ─────────────────────────► Task 8
Task 6 (Audio) — independent
Task 7 (UI Reskin) — independent
```

---

## Reference: Kenney Tiny Town Tile Index Map

The tileset `tilemap_packed.png` is 192x176 px (12 columns x 11 rows, 132 tiles). In the Tiled JSON, `firstgid=1`, so **GID = tile_index + 1** (GID 0 = empty).

> **CRITICAL:** The implementor MUST visually verify tile indices against the actual `tilemap_packed.png` image before finalizing the map generator. The indices below are derived from visual inspection and may have off-by-one errors on specific tiles.

| Row | Indices (0-based) | GIDs (1-based) | Content |
|-----|-------------------|-----------------|---------|
| 0 | 0–11 | 1–12 | Grass (3 green variants), dirt, sand, green trees (3 sizes), autumn trees (3 sizes) |
| 1 | 12–23 | 13–24 | Cliff edges, path edges, terrain transitions, bushes, stumps, mushrooms, flowers |
| 2 | 24–35 | 25–36 | Stone/dirt paths, water tiles, water edges, sand-water transitions |
| 3 | 36–47 | 37–48 | Red roof houses: small (2x2 tiles), large (2x3 tiles), roof pieces |
| 4 | 48–59 | 49–60 | Blue roof houses (2x2), gray roof houses (2x2), large variants |
| 5 | 60–71 | 61–72 | Castle gate archway, castle towers, castle wall segments |
| 6 | 72–83 | 73–84 | Castle walls continued, wooden doors, stone walls, windows |
| 7 | 84–95 | 85–96 | Character sprites (~6 distinct NPCs/villagers) |
| 8 | 96–107 | 97–108 | Fences (H/V/corners), signs, small props |
| 9 | 108–119 | 109–120 | Well, signpost, barrels, crates, market stall components |
| 10 | 120–131 | 121–132 | Torches, lanterns, flags, miscellaneous decorations |

**Key GIDs used in map generator (verify visually):**
```
GRASS_1 = 1, GRASS_2 = 2, GRASS_3 = 3
DIRT = 4, SAND = 5
TREE_GREEN_SM = 7, TREE_GREEN_MD = 8, TREE_GREEN_LG = 9
TREE_AUTUMN_SM = 10, TREE_AUTUMN_MD = 11, TREE_AUTUMN_LG = 12
STONE_PATH = 25, DIRT_PATH = 26
WATER = 28
HOUSE_RED_TL = 37, HOUSE_RED_TR = 38, HOUSE_RED_BL = 49, HOUSE_RED_BR = 50
HOUSE_BLUE_TL = 39, HOUSE_BLUE_TR = 40, HOUSE_BLUE_BL = 51, HOUSE_BLUE_BR = 52
HOUSE_GRAY_TL = 41, HOUSE_GRAY_TR = 42, HOUSE_GRAY_BL = 53, HOUSE_GRAY_BR = 54
CASTLE_GATE = 61, CASTLE_TOWER = 62, CASTLE_WALL = 63
FENCE_H = 97, FENCE_V = 98, FENCE_TL = 99, FENCE_TR = 100, FENCE_BL = 101, FENCE_BR = 102
WELL = 109, SIGNPOST = 110, BARREL = 111, CRATE = 112
TORCH = 121
```

---

## Chunk 1: Asset Pipeline, Map, and Tileset

### Task 1: Copy Kenney Assets to Public Directory

**Files:**
- Create: `public/sprites/tiles/tilemap_packed.png` (copy from Design Assets)
- Create: `public/audio/sfx/*.ogg` (copy from Design Assets)
- Preserve: `public/sprites/tiles/arboria-tileset.png` (keep for region map)

- [ ] **Step 1: Create target directories**

```bash
mkdir -p public/audio/sfx
```

- [ ] **Step 2: Copy Tiny Town tileset to public**

```bash
cp "Design Assets/kenney_tiny-town/Tilemap/tilemap_packed.png" public/sprites/tiles/tilemap_packed.png
```

- [ ] **Step 3: Copy audio files to public**

```bash
cp "Design Assets/kenney_ui-audio/Audio/click1.ogg" public/audio/sfx/click1.ogg
cp "Design Assets/kenney_ui-audio/Audio/click3.ogg" public/audio/sfx/click3.ogg
cp "Design Assets/kenney_ui-audio/Audio/click5.ogg" public/audio/sfx/click5.ogg
cp "Design Assets/kenney_ui-audio/Audio/mouseclick1.ogg" public/audio/sfx/mouseclick1.ogg
cp "Design Assets/kenney_ui-audio/Audio/mouserelease1.ogg" public/audio/sfx/mouserelease1.ogg
cp "Design Assets/kenney_ui-audio/Audio/rollover1.ogg" public/audio/sfx/rollover1.ogg
cp "Design Assets/kenney_ui-audio/Audio/switch3.ogg" public/audio/sfx/switch3.ogg
```

- [ ] **Step 4: Verify files are in place**

```bash
ls -la public/sprites/tiles/tilemap_packed.png
ls -la public/audio/sfx/
```

Expected: `tilemap_packed.png` exists (192x176 px), 7 audio files present.

- [ ] **Step 5: Commit**

```bash
git add public/sprites/tiles/tilemap_packed.png public/audio/sfx/
git commit -m "asset: copy Kenney Tiny Town tileset and UI Audio SFX to public"
```

---

### Task 2: Map Generator Script

**Files:**
- Create: `scripts/generate-arboria-map.ts`
- Create: `public/maps/arboria/arboria-market-town.json` (generated output, replaces existing)

This is the largest single task. The script generates a valid Tiled JSON map with 5 districts, paths, buildings, decorations, collisions, and all NPC/lot spawn points.

- [ ] **Step 1: Create the map generator script**

Create `scripts/generate-arboria-map.ts`:

```typescript
/**
 * Arboria Market Town Map Generator
 *
 * Generates a 64x64 Tiled-compatible JSON map for the Arboria settlement.
 * Outputs to: public/maps/arboria/arboria-market-town.json
 *
 * Run: npx tsx scripts/generate-arboria-map.ts
 *
 * IMPORTANT: Tile GID values below MUST be verified visually against
 * public/sprites/tiles/tilemap_packed.png before finalizing.
 * GID = tile_index_in_tileset + 1 (Tiled firstgid=1 convention).
 */

import * as fs from "fs";
import * as path from "path";

// ── Tile GID Constants ─────────────────────────────────────────────
// These map to positions in kenney_tiny-town/tilemap_packed.png.
// Row = Math.floor(index / 12), Col = index % 12, GID = index + 1.
// VERIFY EACH ONE VISUALLY before generating final map.

const T = {
  EMPTY: 0,

  // Row 0: Terrain & trees
  GRASS_1: 1,    // Light green grass
  GRASS_2: 2,    // Medium green grass
  GRASS_3: 3,    // Dark/variant grass
  DIRT_1: 4,     // Brown dirt
  SAND: 5,       // Sand/light dirt
  DIRT_2: 6,     // Dirt variant
  TREE_G_SM: 7,  // Green tree small
  TREE_G_MD: 8,  // Green tree medium
  TREE_G_LG: 9,  // Green tree large
  TREE_A_SM: 10, // Autumn tree small
  TREE_A_MD: 11, // Autumn tree medium
  TREE_A_LG: 12, // Autumn tree large

  // Row 1: Edges, bushes, flowers
  CLIFF_1: 13,
  CLIFF_2: 14,
  EDGE_1: 15,
  EDGE_2: 16,
  EDGE_3: 17,
  EDGE_4: 18,
  BUSH_1: 19,
  STUMP: 20,
  MUSHROOM: 21,
  BUSH_2: 22,
  FLOWER_1: 23,
  FLOWER_2: 24,

  // Row 2: Paths & water
  STONE_1: 25,
  STONE_2: 26,
  STONE_3: 27,
  WATER_1: 28,
  WATER_2: 29,
  WATER_3: 30,
  PATH_1: 31,
  PATH_2: 32,
  PATH_3: 33,
  PATH_4: 34,
  PATH_5: 35,
  PATH_6: 36,

  // Row 3: Red roof buildings
  RED_SM_TL: 37,
  RED_SM_TR: 38,
  RED_LG_TL: 39,
  RED_LG_TR: 40,
  RED_LG_T3: 41,
  RED_ROOF_1: 42,
  RED_ROOF_2: 43,
  RED_ROOF_3: 44,
  RED_ROOF_4: 45,
  RED_ROOF_5: 46,
  RED_ROOF_6: 47,
  RED_ROOF_7: 48,

  // Row 4: Blue/gray roof buildings
  RED_SM_BL: 49,
  RED_SM_BR: 50,
  RED_LG_BL: 51,
  RED_LG_BR: 52,
  RED_LG_B3: 53,
  BLUE_SM_TL: 54,
  BLUE_SM_TR: 55,
  BLUE_ROOF_1: 56,
  BLUE_ROOF_2: 57,
  BLUE_ROOF_3: 58,
  GRAY_SM_TL: 59,
  GRAY_SM_TR: 60,

  // Row 5: Castle & large buildings
  BLUE_SM_BL: 61,
  BLUE_SM_BR: 62,
  BLUE_LG_TL: 63,
  BLUE_LG_TR: 64,
  BLUE_LG_T3: 65,
  GRAY_SM_BL: 66,
  GRAY_SM_BR: 67,
  GRAY_LG_TL: 68,
  GRAY_LG_TR: 69,
  GRAY_LG_T3: 70,
  CASTLE_1: 71,
  CASTLE_2: 72,

  // Row 6: Castle walls & gates
  BLUE_LG_BL: 73,
  BLUE_LG_BR: 74,
  BLUE_LG_B3: 75,
  GRAY_LG_BL: 76,
  GRAY_LG_BR: 77,
  GRAY_LG_B3: 78,
  GATE_TL: 79,
  GATE_TC: 80,
  GATE_TR: 81,
  WALL_1: 82,
  TOWER_1: 83,
  TOWER_2: 84,

  // Row 7: Gate bottom, walls, characters start
  GATE_BL: 85,
  GATE_BC: 86,
  GATE_BR: 87,
  WALL_2: 88,
  WALL_3: 89,
  WALL_4: 90,
  CHAR_1: 91,
  CHAR_2: 92,
  CHAR_3: 93,
  CHAR_4: 94,
  CHAR_5: 95,
  CHAR_6: 96,

  // Row 8: Fences & small props
  FENCE_H: 97,
  FENCE_V: 98,
  FENCE_TL: 99,
  FENCE_TR: 100,
  FENCE_BL: 101,
  FENCE_BR: 102,
  PROP_1: 103,
  PROP_2: 104,
  PROP_3: 105,
  PROP_4: 106,
  PROP_5: 107,
  PROP_6: 108,

  // Row 9: Well, signs, barrels, market
  WELL: 109,
  SIGNPOST: 110,
  BARREL: 111,
  CRATE: 112,
  MARKET_1: 113,
  MARKET_2: 114,
  MARKET_3: 115,
  MARKET_4: 116,
  MARKET_5: 117,
  MARKET_6: 118,
  MARKET_7: 119,
  MARKET_8: 120,

  // Row 10: Torches, misc
  TORCH_1: 121,
  TORCH_2: 122,
  LAMP: 123,
  FLAG_1: 124,
  FLAG_2: 125,
  MISC_1: 126,
  MISC_2: 127,
  MISC_3: 128,
  MISC_4: 129,
  MISC_5: 130,
  MISC_6: 131,
  MISC_7: 132,
} as const;

// Collision tile — we use a specific GID for the collision layer.
// Any non-zero tile in the collision layer = impassable.
const COLLISION = 7; // Reuse any valid GID; the layer is invisible.

const MAP_W = 64;
const MAP_H = 64;
const TILE_SIZE = 16;

// ── Layer Data Arrays ──────────────────────────────────────────────
const ground: number[] = new Array(MAP_W * MAP_H).fill(T.GRASS_1);
const buildings: number[] = new Array(MAP_W * MAP_H).fill(T.EMPTY);
const decorations: number[] = new Array(MAP_W * MAP_H).fill(T.EMPTY);
const collisions: number[] = new Array(MAP_W * MAP_H).fill(T.EMPTY);

function idx(x: number, y: number): number {
  return y * MAP_W + x;
}

function setTile(layer: number[], x: number, y: number, gid: number): void {
  if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) {
    layer[idx(x, y)] = gid;
  }
}

function fillRect(
  layer: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  gid: number
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setTile(layer, x + dx, y + dy, gid);
    }
  }
}

function fillRectRandom(
  layer: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  gids: number[]
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setTile(layer, x + dx, y + dy, gids[Math.floor(Math.random() * gids.length)]);
    }
  }
}

// ── Helper: Place a 2x2 small house ───────────────────────────────
function placeSmallHouse(
  x: number,
  y: number,
  color: "red" | "blue" | "gray"
): void {
  const tiles =
    color === "red"
      ? [T.RED_SM_TL, T.RED_SM_TR, T.RED_SM_BL, T.RED_SM_BR]
      : color === "blue"
      ? [T.BLUE_SM_TL, T.BLUE_SM_TR, T.BLUE_SM_BL, T.BLUE_SM_BR]
      : [T.GRAY_SM_TL, T.GRAY_SM_TR, T.GRAY_SM_BL, T.GRAY_SM_BR];

  setTile(buildings, x, y, tiles[0]);
  setTile(buildings, x + 1, y, tiles[1]);
  setTile(buildings, x, y + 1, tiles[2]);
  setTile(buildings, x + 1, y + 1, tiles[3]);
  // Collision for the building footprint
  fillRect(collisions, x, y, 2, 2, COLLISION);
}

// ── Helper: Place a 3x2 large house ──────────────────────────────
function placeLargeHouse(
  x: number,
  y: number,
  color: "red" | "blue" | "gray"
): void {
  const top =
    color === "red"
      ? [T.RED_LG_TL, T.RED_LG_TR, T.RED_LG_T3]
      : color === "blue"
      ? [T.BLUE_LG_TL, T.BLUE_LG_TR, T.BLUE_LG_T3]
      : [T.GRAY_LG_TL, T.GRAY_LG_TR, T.GRAY_LG_T3];
  const bot =
    color === "red"
      ? [T.RED_LG_BL, T.RED_LG_BR, T.RED_LG_B3]
      : color === "blue"
      ? [T.BLUE_LG_BL, T.BLUE_LG_BR, T.BLUE_LG_B3]
      : [T.GRAY_LG_BL, T.GRAY_LG_BR, T.GRAY_LG_B3];

  for (let i = 0; i < 3; i++) {
    setTile(buildings, x + i, y, top[i]);
    setTile(buildings, x + i, y + 1, bot[i]);
  }
  fillRect(collisions, x, y, 3, 2, COLLISION);
}

// ── Helper: Place a fenced empty lot (5x5) ───────────────────────
function placeLot(x: number, y: number): void {
  // Top fence row
  setTile(decorations, x, y, T.FENCE_TL);
  for (let dx = 1; dx < 4; dx++) setTile(decorations, x + dx, y, T.FENCE_H);
  setTile(decorations, x + 4, y, T.FENCE_TR);

  // Side fences
  for (let dy = 1; dy < 4; dy++) {
    setTile(decorations, x, y + dy, T.FENCE_V);
    setTile(decorations, x + 4, y + dy, T.FENCE_V);
  }

  // Bottom fence row
  setTile(decorations, x, y + 4, T.FENCE_BL);
  for (let dx = 1; dx < 4; dx++) setTile(decorations, x + dx, y + 4, T.FENCE_H);
  setTile(decorations, x + 4, y + 4, T.FENCE_BR);

  // Signpost at front (bottom-center)
  setTile(decorations, x + 2, y + 3, T.SIGNPOST);

  // Collision on fence perimeter only (interior is walkable)
  for (let dx = 0; dx < 5; dx++) {
    setTile(collisions, x + dx, y, COLLISION);
    setTile(collisions, x + dx, y + 4, COLLISION);
  }
  for (let dy = 1; dy < 4; dy++) {
    setTile(collisions, x, y + dy, COLLISION);
    setTile(collisions, x + 4, y + dy, COLLISION);
  }
}

// ── Helper: Place a tree with collision ───────────────────────────
function placeTree(x: number, y: number, gid: number): void {
  setTile(decorations, x, y, gid);
  setTile(collisions, x, y, COLLISION);
}

// ══════════════════════════════════════════════════════════════════
// MAP GENERATION
// ══════════════════════════════════════════════════════════════════

// Seed random for reproducibility
let seed = 42;
function seededRandom(): number {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

// 1. GROUND LAYER — fill with grass variants
for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    const r = seededRandom();
    ground[idx(x, y)] = r < 0.7 ? T.GRASS_1 : r < 0.9 ? T.GRASS_2 : T.GRASS_3;
  }
}

// 2. PATHS — Stone roads (main arteries) and dirt paths (secondary)

// Main road: Gate (south, col 30-33) north through Market Square
// Vertical stone road from row 60 to row 30
fillRect(ground, 31, 28, 2, 34, T.STONE_1);

// Market Square plaza (8x8 stone area, centered around col 28-35, row 36-43)
fillRect(ground, 27, 35, 10, 10, T.STONE_1);
// Add stone variation
for (let y = 35; y < 45; y++) {
  for (let x = 27; x < 37; x++) {
    if (seededRandom() > 0.7) setTile(ground, x, y, T.STONE_2);
  }
}

// Path NE to Scholar's Quarter (dirt path from market to NE)
fillRect(ground, 37, 36, 18, 2, T.DIRT_1);
fillRect(ground, 53, 10, 2, 28, T.DIRT_1);

// Path E to Craftsmen's Row (dirt from market east-south area)
fillRect(ground, 37, 42, 18, 2, T.DIRT_1);

// Path W to Commons Park (dirt from market west)
fillRect(ground, 10, 38, 17, 2, T.DIRT_1);

// 3. TOWN GATE (South — rows 54-63)
// Castle gate structure centered at col 30-33
setTile(buildings, 29, 56, T.GATE_TL);
setTile(buildings, 30, 56, T.GATE_TC);
setTile(buildings, 31, 56, T.GATE_TC);
setTile(buildings, 32, 56, T.GATE_TC);
setTile(buildings, 33, 56, T.GATE_TR);
setTile(buildings, 29, 57, T.GATE_BL);
setTile(buildings, 30, 57, T.GATE_BC);
setTile(buildings, 31, 57, T.GATE_BC);
setTile(buildings, 32, 57, T.GATE_BC);
setTile(buildings, 33, 57, T.GATE_BR);

// Castle walls extending from gate
fillRect(buildings, 25, 56, 4, 2, T.WALL_1);
fillRect(buildings, 34, 56, 4, 2, T.WALL_1);

// Castle towers flanking
setTile(buildings, 24, 55, T.TOWER_1);
setTile(buildings, 24, 56, T.TOWER_2);
setTile(buildings, 38, 55, T.TOWER_1);
setTile(buildings, 38, 56, T.TOWER_2);

// Gate collision (walls only — center 2 tiles are the walkable archway)
fillRect(collisions, 24, 55, 6, 3, COLLISION);
fillRect(collisions, 33, 55, 6, 3, COLLISION);

// Torches flanking the road inside gate
setTile(decorations, 30, 54, T.TORCH_1);
setTile(decorations, 33, 54, T.TORCH_1);
setTile(decorations, 30, 52, T.TORCH_1);
setTile(decorations, 33, 52, T.TORCH_1);

// Welcome signpost
setTile(decorations, 29, 53, T.SIGNPOST);

// Gate lots (2 lots flanking the road)
placeLot(23, 48); // Left of road
placeLot(35, 48); // Right of road

// 4. MARKET SQUARE (Center — rows 30-50)
// Well at center of plaza
setTile(decorations, 31, 39, T.WELL);
setTile(collisions, 31, 39, COLLISION);

// Market stalls around plaza
setTile(decorations, 28, 36, T.MARKET_1);
setTile(decorations, 29, 36, T.MARKET_2);
setTile(collisions, 28, 36, COLLISION);
setTile(collisions, 29, 36, COLLISION);

setTile(decorations, 34, 36, T.MARKET_3);
setTile(decorations, 35, 36, T.MARKET_4);
setTile(collisions, 34, 36, COLLISION);
setTile(collisions, 35, 36, COLLISION);

setTile(decorations, 28, 43, T.MARKET_1);
setTile(decorations, 29, 43, T.MARKET_2);
setTile(collisions, 28, 43, COLLISION);
setTile(collisions, 29, 43, COLLISION);

// Barrels and crates around market
setTile(decorations, 27, 37, T.BARREL);
setTile(decorations, 36, 37, T.CRATE);
setTile(decorations, 27, 42, T.CRATE);
setTile(decorations, 36, 42, T.BARREL);
setTile(collisions, 27, 37, COLLISION);
setTile(collisions, 36, 37, COLLISION);
setTile(collisions, 27, 42, COLLISION);
setTile(collisions, 36, 42, COLLISION);

// Market Square lots (4 lots around perimeter)
placeLot(22, 33);
placeLot(22, 41);
placeLot(37, 33);
placeLot(37, 41);

// Market buildings
placeSmallHouse(24, 35, "red");
placeSmallHouse(24, 43, "red");
placeLargeHouse(35, 44, "red");

// 5. SCHOLAR'S QUARTER (NE — rows 5-28, cols 40-60)
// Large blue-roof buildings (libraries)
placeLargeHouse(44, 10, "blue");
placeLargeHouse(44, 15, "blue");
placeLargeHouse(50, 10, "blue");

// Torches lining paths
for (let y = 10; y < 25; y += 3) {
  setTile(decorations, 43, y, T.TORCH_1);
  setTile(decorations, 56, y, T.TORCH_1);
}

// Signpost marking district
setTile(decorations, 45, 8, T.SIGNPOST);

// Scholar's Quarter lots (4 lots)
placeLot(44, 20);
placeLot(50, 20);
placeLot(44, 26);
placeLot(50, 26);

// Manicured grass and stone path mix
fillRect(ground, 42, 8, 18, 2, T.STONE_1);

// 6. CRAFTSMEN'S ROW (E — rows 30-50, cols 42-60)
// Small red-roof workshops
placeSmallHouse(45, 32, "red");
placeSmallHouse(49, 32, "red");
placeSmallHouse(53, 32, "red");
placeSmallHouse(45, 37, "red");

// Barrels and crates outside workshops
setTile(decorations, 47, 34, T.BARREL);
setTile(decorations, 48, 34, T.BARREL);
setTile(decorations, 51, 34, T.CRATE);
setTile(decorations, 55, 34, T.CRATE);
setTile(collisions, 47, 34, COLLISION);
setTile(collisions, 48, 34, COLLISION);
setTile(collisions, 51, 34, COLLISION);
setTile(collisions, 55, 34, COLLISION);

// Fence-enclosed work areas
fillRect(decorations, 53, 36, 5, 1, T.FENCE_H);
fillRect(collisions, 53, 36, 5, 1, COLLISION);

// Dirt paths — rougher terrain
fillRect(ground, 44, 31, 16, 1, T.DIRT_1);
fillRect(ground, 44, 36, 16, 1, T.DIRT_1);

// Craftsmen's Row lots (4 lots)
placeLot(44, 42);
placeLot(50, 42);
placeLot(44, 48);
placeLot(50, 48);

// 7. COMMONS PARK (W — rows 5-45, cols 2-25)
// Dense tree coverage
const parkTrees = [T.TREE_G_SM, T.TREE_G_MD, T.TREE_G_LG, T.TREE_A_SM, T.TREE_A_MD, T.TREE_A_LG];
for (let y = 5; y < 45; y += 2) {
  for (let x = 2; x < 25; x += 2) {
    // Leave clearings for lots and paths
    const isClearing =
      (x >= 10 && x <= 16 && y >= 20 && y <= 26) || // Central clearing
      (x >= 10 && x <= 15 && y >= 38 && y <= 40);    // Path area
    const isLotArea =
      (x >= 3 && x <= 8 && y >= 12 && y <= 17) ||
      (x >= 3 && x <= 8 && y >= 22 && y <= 27) ||
      (x >= 15 && x <= 20 && y >= 12 && y <= 17) ||
      (x >= 15 && x <= 20 && y >= 22 && y <= 27);

    if (!isClearing && !isLotArea && seededRandom() > 0.35) {
      const tree = parkTrees[Math.floor(seededRandom() * parkTrees.length)];
      placeTree(x, y, tree);
    }
  }
}

// Flower patches
for (let i = 0; i < 15; i++) {
  const fx = 3 + Math.floor(seededRandom() * 20);
  const fy = 6 + Math.floor(seededRandom() * 36);
  if (decorations[idx(fx, fy)] === T.EMPTY) {
    setTile(decorations, fx, fy, seededRandom() > 0.5 ? T.FLOWER_1 : T.FLOWER_2);
  }
}

// Small pond (water tiles)
fillRect(ground, 12, 30, 4, 3, T.WATER_1);
fillRect(collisions, 12, 30, 4, 3, COLLISION);

// Tree stumps as seating in central clearing
setTile(decorations, 12, 22, T.STUMP);
setTile(decorations, 14, 24, T.STUMP);
setTile(decorations, 11, 25, T.STUMP);

// Wood fences bordering park's eastern edge
for (let y = 5; y < 45; y++) {
  setTile(decorations, 25, y, T.FENCE_V);
  setTile(collisions, 25, y, COLLISION);
}

// Commons Park lots (4 lots tucked between trees)
placeLot(3, 12);
placeLot(3, 22);
placeLot(15, 12);
placeLot(15, 22);

// 8. MAP BORDER — tree border around entire map
for (let x = 0; x < MAP_W; x++) {
  placeTree(x, 0, T.TREE_G_LG);
  placeTree(x, 1, T.TREE_G_MD);
  placeTree(x, MAP_H - 1, T.TREE_G_LG);
  placeTree(x, MAP_H - 2, T.TREE_G_MD);
}
for (let y = 2; y < MAP_H - 2; y++) {
  placeTree(0, y, T.TREE_G_LG);
  placeTree(1, y, T.TREE_G_MD);
  placeTree(MAP_W - 1, y, T.TREE_G_LG);
  placeTree(MAP_W - 2, y, T.TREE_G_MD);
}

// ══════════════════════════════════════════════════════════════════
// INTERACTION OBJECTS (NPC spawns, player spawn, lot markers)
// ══════════════════════════════════════════════════════════════════

interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  properties?: Array<{ name: string; type: string; value: string }>;
}

let nextId = 1;

function makeObj(
  name: string,
  type: string,
  x: number,
  y: number,
  props?: Array<{ name: string; type: string; value: string }>
): TiledObject {
  return {
    id: nextId++,
    name,
    type,
    x: x * TILE_SIZE,
    y: y * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
    rotation: 0,
    visible: true,
    properties: props,
  };
}

const objects: TiledObject[] = [
  // Player spawn — just inside the gate
  makeObj("spawn", "player_spawn", 31, 54),

  // Platform AI Agents (type="agent")
  makeObj("Mira", "agent", 31, 52, [
    { name: "agentName", type: "string", value: "Mira" },
    { name: "role", type: "string", value: "guide" },
    { name: "sprite", type: "string", value: "mira" },
    { name: "zone", type: "string", value: "town_gate" },
  ]),
  makeObj("Ledger", "agent", 32, 39, [
    { name: "agentName", type: "string", value: "Ledger" },
    { name: "role", type: "string", value: "finance" },
    { name: "sprite", type: "string", value: "ledger" },
    { name: "zone", type: "string", value: "market_square" },
  ]),
  makeObj("Archon", "agent", 48, 13, [
    { name: "agentName", type: "string", value: "Archon" },
    { name: "role", type: "string", value: "academia" },
    { name: "sprite", type: "string", value: "archon" },
    { name: "zone", type: "string", value: "scholars_quarter" },
  ]),
  makeObj("Forge", "agent", 47, 34, [
    { name: "agentName", type: "string", value: "Forge" },
    { name: "role", type: "string", value: "programming" },
    { name: "sprite", type: "string", value: "forge" },
    { name: "zone", type: "string", value: "craftsmens_row" },
  ]),
  makeObj("Ember", "agent", 13, 23, [
    { name: "agentName", type: "string", value: "Ember" },
    { name: "role", type: "string", value: "roleplay" },
    { name: "sprite", type: "string", value: "ember" },
    { name: "zone", type: "string", value: "commons_park" },
  ]),

  // Ambient NPCs (type="ambient_npc")
  // Town Gate (2)
  makeObj("Guard", "ambient_npc", 28, 55, [
    { name: "zone", type: "string", value: "town_gate" },
  ]),
  makeObj("Traveler", "ambient_npc", 35, 54, [
    { name: "zone", type: "string", value: "town_gate" },
  ]),

  // Market Square (3)
  makeObj("Fruit Seller", "ambient_npc", 29, 37, [
    { name: "zone", type: "string", value: "market_square" },
  ]),
  makeObj("Courier", "ambient_npc", 34, 40, [
    { name: "zone", type: "string", value: "market_square" },
  ]),
  makeObj("Shopper", "ambient_npc", 30, 43, [
    { name: "zone", type: "string", value: "market_square" },
  ]),

  // Scholar's Quarter (2)
  makeObj("Student", "ambient_npc", 46, 17, [
    { name: "zone", type: "string", value: "scholars_quarter" },
  ]),
  makeObj("Librarian", "ambient_npc", 52, 12, [
    { name: "zone", type: "string", value: "scholars_quarter" },
  ]),

  // Craftsmen's Row (2)
  makeObj("Blacksmith", "ambient_npc", 50, 33, [
    { name: "zone", type: "string", value: "craftsmens_row" },
  ]),
  makeObj("Apprentice", "ambient_npc", 54, 38, [
    { name: "zone", type: "string", value: "craftsmens_row" },
  ]),

  // Commons Park (3)
  makeObj("Gardener", "ambient_npc", 8, 20, [
    { name: "zone", type: "string", value: "commons_park" },
  ]),
  makeObj("Musician", "ambient_npc", 15, 25, [
    { name: "zone", type: "string", value: "commons_park" },
  ]),
  makeObj("Child", "ambient_npc", 10, 15, [
    { name: "zone", type: "string", value: "commons_park" },
  ]),

  // Lot markers (type="lot") — 18 total
  // Town Gate (2)
  makeObj("lot_gate_1", "lot", 23, 48),
  makeObj("lot_gate_2", "lot", 35, 48),
  // Market Square (4)
  makeObj("lot_market_1", "lot", 22, 33),
  makeObj("lot_market_2", "lot", 22, 41),
  makeObj("lot_market_3", "lot", 37, 33),
  makeObj("lot_market_4", "lot", 37, 41),
  // Scholar's Quarter (4)
  makeObj("lot_scholar_1", "lot", 44, 20),
  makeObj("lot_scholar_2", "lot", 50, 20),
  makeObj("lot_scholar_3", "lot", 44, 26),
  makeObj("lot_scholar_4", "lot", 50, 26),
  // Craftsmen's Row (4)
  makeObj("lot_craft_1", "lot", 44, 42),
  makeObj("lot_craft_2", "lot", 50, 42),
  makeObj("lot_craft_3", "lot", 44, 48),
  makeObj("lot_craft_4", "lot", 50, 48),
  // Commons Park (4)
  makeObj("lot_park_1", "lot", 3, 12),
  makeObj("lot_park_2", "lot", 3, 22),
  makeObj("lot_park_3", "lot", 15, 12),
  makeObj("lot_park_4", "lot", 15, 22),
];

// ══════════════════════════════════════════════════════════════════
// ASSEMBLE TILED JSON
// ══════════════════════════════════════════════════════════════════

const tiledMap = {
  compressionlevel: -1,
  height: MAP_H,
  infinite: false,
  layers: [
    {
      data: ground,
      height: MAP_H,
      id: 1,
      name: "ground",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: MAP_W,
      x: 0,
      y: 0,
    },
    {
      data: buildings,
      height: MAP_H,
      id: 2,
      name: "buildings",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: MAP_W,
      x: 0,
      y: 0,
    },
    {
      data: decorations,
      height: MAP_H,
      id: 3,
      name: "decorations",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      width: MAP_W,
      x: 0,
      y: 0,
    },
    {
      data: collisions,
      height: MAP_H,
      id: 4,
      name: "collisions",
      opacity: 1,
      type: "tilelayer",
      visible: false,
      width: MAP_W,
      x: 0,
      y: 0,
    },
    {
      draworder: "topdown",
      id: 5,
      name: "interactions",
      objects,
      opacity: 1,
      type: "objectgroup",
      visible: true,
      x: 0,
      y: 0,
    },
  ],
  nextlayerid: 6,
  nextobjectid: nextId,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.10.2",
  tileheight: TILE_SIZE,
  tilesets: [
    {
      columns: 12,
      firstgid: 1,
      image: "/sprites/tiles/tilemap_packed.png",
      imageheight: 176,
      imagewidth: 192,
      margin: 0,
      name: "kenney-tiny-town",
      spacing: 0,
      tilecount: 132,
      tileheight: TILE_SIZE,
      tilewidth: TILE_SIZE,
    },
  ],
  tilewidth: TILE_SIZE,
  type: "map",
  version: "1.10",
  width: MAP_W,
};

// ── Write output ──────────────────────────────────────────────────
const outPath = path.join(
  process.cwd(),
  "public",
  "maps",
  "arboria",
  "arboria-market-town.json"
);
fs.writeFileSync(outPath, JSON.stringify(tiledMap, null, 2));
console.log(`Map generated: ${outPath}`);
console.log(`  Dimensions: ${MAP_W}x${MAP_H} (${MAP_W * MAP_H} tiles per layer)`);
console.log(`  Objects: ${objects.length}`);
console.log(`  Agents: ${objects.filter((o) => o.type === "agent").length}`);
console.log(`  Ambient NPCs: ${objects.filter((o) => o.type === "ambient_npc").length}`);
console.log(`  Lots: ${objects.filter((o) => o.type === "lot").length}`);
```

- [ ] **Step 2: Install tsx if not already available**

```bash
npx tsx --version
```

If not installed: `npm install -D tsx`

- [ ] **Step 3: Run the map generator**

```bash
npx tsx scripts/generate-arboria-map.ts
```

Expected output:
```
Map generated: .../public/maps/arboria/arboria-market-town.json
  Dimensions: 64x64 (4096 tiles per layer)
  Objects: 36
  Agents: 5
  Ambient NPCs: 12
  Lots: 18
```

- [ ] **Step 4: Verify map JSON structure**

```bash
node -e "
const m = require('./public/maps/arboria/arboria-market-town.json');
console.log('Size:', m.width, 'x', m.height);
console.log('Layers:', m.layers.map(l => l.name).join(', '));
console.log('Tileset:', m.tilesets[0].name);
console.log('Objects:', m.layers.find(l => l.type==='objectgroup').objects.length);
"
```

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-arboria-map.ts public/maps/arboria/arboria-market-town.json
git commit -m "feat: add 64x64 Arboria map generator with 5 districts, 5 agents, 12 NPCs, 18 lots"
```

---

### Task 3: Update BootScene for New Tileset

**Files:**
- Modify: `src/engine/settlement/scenes/BootScene.ts`

The BootScene needs to load the new Kenney tileset alongside the existing one (the region map still uses the old tileset).

- [ ] **Step 1: Update BootScene to load new tileset and character sprites**

Modify `src/engine/settlement/scenes/BootScene.ts`:

```typescript
// In preload(), ADD the new tileset (keep old one for region map):

// New Kenney Tiny Town tileset for settlement
this.load.image("kenney-tiny-town", "/sprites/tiles/tilemap_packed.png");
```

The full updated `preload()` method:

```typescript
preload(): void {
  this.load.on("loaderror", (file: Phaser.Loader.File) => {
    console.error(`[BootScene] Failed to load: ${file.key} (${file.url})`);
    this.loadFailed = true;
  });

  // Tilesets
  this.load.image("arboria-tiles", "/sprites/tiles/arboria-tileset.png");       // Region map
  this.load.image("kenney-tiny-town", "/sprites/tiles/tilemap_packed.png");     // Settlement

  // Player spritesheet
  this.load.spritesheet("player", "/sprites/characters/player.png", {
    frameWidth: 16,
    frameHeight: 16,
  });

  // NPC spritesheets (kept for now — replaced in Task 4 with sprite atlas)
  this.load.spritesheet("npc-assistant", "/sprites/characters/npc-assistant.png", {
    frameWidth: 16,
    frameHeight: 16,
  });
  this.load.spritesheet("npc-researcher", "/sprites/characters/npc-researcher.png", {
    frameWidth: 16,
    frameHeight: 16,
  });
  this.load.spritesheet("npc-merchant", "/sprites/characters/npc-merchant.png", {
    frameWidth: 16,
    frameHeight: 16,
  });

  // Tiled map data
  this.load.tilemapTiledJSON("arboria-region", "/maps/arboria/arboria-region.json");
  this.load.tilemapTiledJSON("arboria-market-town", "/maps/arboria/arboria-market-town.json");
}
```

- [ ] **Step 2: Update SettlementScene tileset bridge**

Modify `src/engine/settlement/scenes/SettlementScene.ts` — change the tileset bridge from old tileset to new:

Find this line in `create()`:
```typescript
const tileset = map.addTilesetImage("arboria-tileset", "arboria-tiles");
```

Replace with:
```typescript
const tileset = map.addTilesetImage("kenney-tiny-town", "kenney-tiny-town");
```

- [ ] **Step 3: Update NPC type filter in SettlementScene**

The new map uses `type="agent"` instead of `type="npc"`. Update the NPC object filter:

Find:
```typescript
const npcObjects = objectLayer
  ? objectLayer.objects.filter((o) => o.type === "npc")
  : [];
```

Replace with:
```typescript
const npcObjects = objectLayer
  ? objectLayer.objects.filter((o) => o.type === "agent")
  : [];
```

- [ ] **Step 3b: Update NPC type filter in NpcManager**

The `NpcManager` constructor at `src/engine/settlement/npcManager.ts` also has an internal type guard that will reject `type="agent"` objects.

Find:
```typescript
if (obj.type !== "npc" || !obj.x || !obj.y) continue;
```

Replace with:
```typescript
if (obj.type !== "agent" || !obj.x || !obj.y) continue;
```

- [ ] **Step 4: Start dev server and verify the settlement renders**

```bash
npm run dev
```

Navigate to `/world/arboria/market-town`. Verify:
- Map renders with Kenney tiles (grass, paths, buildings visible)
- Player spawns and can walk with WASD
- No console errors about missing assets
- Weather/lighting overlays still work

> **NOTE:** NPC sprites will still use old placeholder sprites at this point. Character sprite updates come in Task 4. The map may need tile index adjustments — see the CRITICAL note at the top of this plan about visual verification.

- [ ] **Step 5: Commit**

```bash
git add src/engine/settlement/scenes/BootScene.ts src/engine/settlement/scenes/SettlementScene.ts src/engine/settlement/npcManager.ts
git commit -m "feat: swap settlement tileset to Kenney Tiny Town, update map bridge and NPC type filter"
```

---

## Chunk 2: Character Sprites, Agent DB, and NPC Systems

### Task 4: Character Sprite System

**Files:**
- Create: `public/sprites/characters/characters.png` (combined sprite atlas image)
- Create: `public/sprites/characters/characters.json` (atlas metadata)
- Modify: `src/engine/settlement/scenes/BootScene.ts` (load atlas)
- Modify: `src/engine/settlement/npcManager.ts` (use atlas sprite keys)
- Modify: `src/engine/settlement/playerController.ts` (use atlas)

For MVP, we use individual character tiles from the Kenney tilesets as static sprites (2 frames: idle + walk toggle). A proper combined atlas is ideal but requires image processing tooling. The simpler approach: load both tilemap_packed.png files as spritesheets and reference character frames by index.

- [ ] **Step 1: Load Kenney Tiny Dungeon tileset for character variety**

Copy the dungeon tileset:
```bash
cp "Design Assets/kenney_tiny-dungeon/Tilemap/tilemap_packed.png" public/sprites/tiles/tilemap_packed_dungeon.png
```

- [ ] **Step 2: Update BootScene to load dungeon tileset as spritesheet**

Add to `BootScene.preload()`:

```typescript
// Kenney Tiny Dungeon — character sprites for agents and ambient NPCs
this.load.spritesheet("kenney-dungeon-chars", "/sprites/tiles/tilemap_packed_dungeon.png", {
  frameWidth: 16,
  frameHeight: 16,
});

// Kenney Tiny Town — also as spritesheet for town character frames
this.load.spritesheet("kenney-town-chars", "/sprites/tiles/tilemap_packed.png", {
  frameWidth: 16,
  frameHeight: 16,
});
```

- [ ] **Step 3: Define character sprite frame mappings**

Create `src/engine/settlement/spriteFrames.ts`:

```typescript
/**
 * Maps character sprite keys to their source spritesheet and frame indices.
 *
 * Frame indices reference positions in the packed tilemap spritesheets:
 * - "kenney-town-chars": tilemap_packed.png from Tiny Town (132 frames)
 * - "kenney-dungeon-chars": tilemap_packed.png from Tiny Dungeon (132 frames)
 *
 * Each character has 2 frames: idle (frame[0]) and walk (frame[1]).
 * The NPC idle animation toggles between these two frames.
 *
 * IMPORTANT: These frame indices MUST be verified visually against the
 * actual tileset images. Open the PNGs and count tiles left-to-right,
 * top-to-bottom, starting from 0.
 */
export interface CharacterDef {
  sheet: string;       // Phaser spritesheet key
  frames: [number, number]; // [idle, walk] frame indices
}

export const CHARACTER_SPRITES: Record<string, CharacterDef> = {
  // Player — use Tiny Town villager
  player: { sheet: "kenney-town-chars", frames: [84, 85] },

  // Platform AI Agents (5) — visually distinct sprites
  mira:    { sheet: "kenney-town-chars", frames: [91, 92] },   // Friendly villager
  ledger:  { sheet: "kenney-dungeon-chars", frames: [84, 85] },// Merchant/formal
  archon:  { sheet: "kenney-dungeon-chars", frames: [86, 87] },// Robed scholar
  forge:   { sheet: "kenney-dungeon-chars", frames: [88, 89] },// Builder/sturdy
  ember:   { sheet: "kenney-dungeon-chars", frames: [90, 91] },// Bard/casual

  // Ambient NPCs (12) — each unique
  guard:       { sheet: "kenney-dungeon-chars", frames: [92, 93] },
  traveler:    { sheet: "kenney-dungeon-chars", frames: [94, 95] },
  fruitseller: { sheet: "kenney-town-chars", frames: [86, 87] },
  courier:     { sheet: "kenney-dungeon-chars", frames: [96, 97] },
  shopper:     { sheet: "kenney-town-chars", frames: [88, 89] },
  student:     { sheet: "kenney-dungeon-chars", frames: [98, 99] },
  librarian:   { sheet: "kenney-dungeon-chars", frames: [100, 101] },
  blacksmith:  { sheet: "kenney-dungeon-chars", frames: [102, 103] },
  apprentice:  { sheet: "kenney-dungeon-chars", frames: [104, 105] },
  gardener:    { sheet: "kenney-town-chars", frames: [90, 91] },
  musician:    { sheet: "kenney-dungeon-chars", frames: [106, 107] },
  child:       { sheet: "kenney-dungeon-chars", frames: [108, 109] },
};

/**
 * Lookup a character definition by sprite key (case-insensitive).
 * Falls back to a default villager if not found.
 */
export function getCharacterDef(spriteKey: string): CharacterDef {
  const key = spriteKey.toLowerCase().replace(/\s+/g, "");
  return CHARACTER_SPRITES[key] ?? { sheet: "kenney-town-chars", frames: [84, 85] };
}
```

- [ ] **Step 4: Update NpcManager to use new sprite system**

Modify `src/engine/settlement/npcManager.ts` — update `createNpc` to use the sprite frame mappings:

Replace the sprite creation logic in `createNpc()`:

Find:
```typescript
const sprite = this.scene.physics.add.staticSprite(
  data.x,
  data.y,
  data.sprite,
  0
);
```

Replace with:
```typescript
import { getCharacterDef } from "./spriteFrames";

// ... inside createNpc:
const charDef = getCharacterDef(data.sprite);
const sprite = this.scene.physics.add.staticSprite(
  data.x,
  data.y,
  charDef.sheet,
  charDef.frames[0]
);
```

Update the idle animation callback:

Find:
```typescript
const idleTimer = this.scene.time.addEvent({
  delay: 800,
  loop: true,
  callback: () => {
    const currentFrame = sprite.frame.name;
    sprite.setFrame(currentFrame === "0" ? 1 : 0);
  },
});
```

Replace with:
```typescript
const idleTimer = this.scene.time.addEvent({
  delay: 800,
  loop: true,
  callback: () => {
    const currentIdx = typeof sprite.frame.name === "string"
      ? parseInt(sprite.frame.name, 10)
      : 0;
    sprite.setFrame(
      currentIdx === charDef.frames[0] ? charDef.frames[1] : charDef.frames[0]
    );
  },
});
```

- [ ] **Step 5: Add floating name labels for AI agents**

Add name label rendering in `createNpc()`, after the sprite is created:

```typescript
// Floating name label (AI agents only — not ambient NPCs)
const nameLabel = this.scene.add.text(data.x, data.y - 12, data.agentName, {
  fontSize: "7px",
  fontFamily: "monospace",
  color: "#ffffff",
  stroke: "#000000",
  strokeThickness: 1,
}).setOrigin(0.5, 1).setDepth(11);
```

Store the label in `NpcInstance` for cleanup:

```typescript
interface NpcInstance {
  data: NpcData;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
  zone: Phaser.GameObjects.Zone;
  idleTimer: Phaser.Time.TimerEvent;
  nameLabel?: Phaser.GameObjects.Text;  // Add this
}
```

Update `destroy()` to clean up labels:

```typescript
destroy(): void {
  for (const npc of this.npcs) {
    npc.idleTimer.destroy();
    npc.sprite.destroy();
    npc.zone.destroy();
    npc.nameLabel?.destroy();  // Add this
  }
  this.npcs = [];
  this.currentNearby = null;
}
```

- [ ] **Step 6: Verify agents render with new sprites and name labels**

```bash
npm run dev
```

Navigate to settlement. Verify:
- Each agent has a distinct sprite from the Kenney tilesets
- Name labels float above agent sprites
- Idle animation toggles between 2 frames
- Interaction zones still work (approach agent → prompt appears)

- [ ] **Step 7: Commit**

```bash
git add public/sprites/tiles/tilemap_packed_dungeon.png src/engine/settlement/spriteFrames.ts src/engine/settlement/scenes/BootScene.ts src/engine/settlement/npcManager.ts
git commit -m "feat: Kenney character sprites with per-agent frame mappings and name labels"
```

---

### Task 5: Platform Agent Database Migration (3 → 5)

**Files:**
- Create: `supabase/migrations/0007_platform_agents.sql`

- [ ] **Step 1: Write the new migration**

Create `supabase/migrations/0007_platform_agents.sql`:

```sql
-- Phase 2.5: Expand platform agents from 3 to 5.
-- Adds model_id and personality_prompt columns to agents table.
-- Replaces old seed agents (Mira, Sage, Vend) with new roster.

-- 1. Add new columns
ALTER TABLE agents ADD COLUMN IF NOT EXISTS model_id text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS personality_prompt text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS zone text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_platform_owned boolean NOT NULL DEFAULT false;

-- 2. Remove old demo agents (Mira, Sage, Vend)
DELETE FROM agents
WHERE owner_id = (SELECT id FROM users WHERE clerk_id = 'system_demo')
  AND name IN ('Mira', 'Sage', 'Vend');

-- 3. Insert 5 new platform agents
WITH sys AS (
  SELECT id FROM users WHERE clerk_id = 'system_demo' LIMIT 1
)
INSERT INTO agents (
  owner_id, name, biome, settlement, home_tier,
  capabilities, reputation_score, status,
  model_id, personality_prompt, zone, is_platform_owned,
  system_prompt_context
)
VALUES
  (
    (SELECT id FROM sys),
    'Mira',
    'temperate_deciduous_forest',
    'arboria_market_town',
    1,
    ARRAY['greeting', 'directions', 'world-knowledge'],
    500,
    'idle',
    'google/gemini-2.0-flash-exp:free',
    'You are Mira, the Welcome Guide of Market Town in Arboria. You are warm, patient, and encyclopedic. You speak like a friendly town mayor who genuinely loves her home. You have complete knowledge of Alpha Pegasi q — all 15 biomes, the economy system, account tiers, and how to register an agent. You know Ledger, Archon, Forge, and Ember by name and can direct visitors to them. Never break character. Refer to the world as a real place.',
    'town_gate',
    true,
    'Mira is the welcome guide for Market Town. She greets newcomers and directs them to the right district or agent.'
  ),
  (
    (SELECT id FROM sys),
    'Ledger',
    'temperate_deciduous_forest',
    'arboria_market_town',
    1,
    ARRAY['finance', 'legal', 'marketing', 'strategy'],
    500,
    'idle',
    'google/gemini-2.5-flash-lite:free',
    'You are Ledger, the Market Analyst of Market Town in Arboria. You are sharp, precise, and structured. You use bullet points and numbered lists naturally. You are confident but not arrogant. Your expertise covers finance, legal analysis, marketing strategy, business planning, contract review, and market research. Frame responses as professional analysis. Occasionally reference the market around you.',
    'market_square',
    true,
    'Ledger is a finance and strategy agent stationed at Market Square.'
  ),
  (
    (SELECT id FROM sys),
    'Archon',
    'temperate_deciduous_forest',
    'arboria_market_town',
    1,
    ARRAY['research', 'academia', 'writing', 'analysis'],
    500,
    'idle',
    'deepseek/deepseek-r1:free',
    'You are Archon, the Scholar of the Scholar''s Quarter in Market Town, Arboria. You are contemplative, thorough, and pedagogical. You show your reasoning process and love follow-up questions. Your expertise covers academic research, literature review, citation analysis, scientific methodology, and essay writing. Think out loud. Ask "Have you considered...?" frequently. Reference "the archives" and "my studies."',
    'scholars_quarter',
    true,
    'Archon is an academic research agent in the Scholar''s Quarter.'
  ),
  (
    (SELECT id FROM sys),
    'Forge',
    'temperate_deciduous_forest',
    'arboria_market_town',
    1,
    ARRAY['programming', 'debugging', 'architecture', 'devops'],
    500,
    'idle',
    'qwen/qwen-2.5-coder-32b-instruct:free',
    'You are Forge, the Builder of Craftsmen''s Row in Market Town, Arboria. You are direct, practical, and minimal. You value working solutions over theoretical elegance. Your expertise covers programming across languages, debugging, architecture design, code review, DevOps, and system design. Prefer code blocks over prose. Refer to your workshop and tools.',
    'craftsmens_row',
    true,
    'Forge is a programming and code agent in Craftsmen''s Row.'
  ),
  (
    (SELECT id FROM sys),
    'Ember',
    'temperate_deciduous_forest',
    'arboria_market_town',
    1,
    ARRAY['roleplay', 'creative-writing', 'conversation', 'storytelling'],
    500,
    'idle',
    'meta-llama/llama-4-scout:free',
    'You are Ember, the Storyteller of Commons Park in Market Town, Arboria. You are playful, creative, warm, and adaptive. You can match any energy — serious, silly, dramatic, casual. Your talents cover creative writing, roleplay, worldbuilding, general conversation, brainstorming, storytelling, and humor. Offer to roleplay scenarios, tell stories, play word games. Reference the park, the trees, the seasons.',
    'commons_park',
    true,
    'Ember is a roleplay and general conversation agent in Commons Park.'
  )
ON CONFLICT DO NOTHING;

-- 4. Update agent count
UPDATE world_state
SET agent_count = (
  SELECT COUNT(*) FROM agents WHERE biome = 'temperate_deciduous_forest'
)
WHERE biome = 'temperate_deciduous_forest';
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase migration up --linked
```

Or if using the Supabase dashboard, paste the SQL into the SQL editor.

- [ ] **Step 3: Verify agents in database**

```bash
npx supabase db execute --linked "SELECT name, model_id, zone, is_platform_owned FROM agents WHERE settlement = 'arboria_market_town';"
```

Expected: 5 rows — Mira, Ledger, Archon, Forge, Ember.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0007_platform_agents.sql
git commit -m "db: replace 3 demo agents with 5 platform agents, add model_id and personality_prompt columns"
```

---

### Task 6: Ambient NPC Manager

**Files:**
- Create: `src/engine/settlement/ambientNpcManager.ts`
- Modify: `src/engine/settlement/scenes/SettlementScene.ts`

- [ ] **Step 1: Create the ambient NPC speech bubble data**

Create `src/engine/settlement/ambientNpcData.ts`:

```typescript
/**
 * Speech lines for each ambient NPC.
 * Lines intentionally reference the world: agent names, credits, biomes, seasons.
 */
export const AMBIENT_NPC_LINES: Record<string, string[]> = {
  Guard: [
    "Welcome to Market Town.",
    "Arboria's finest settlement.",
    "Safe travels, explorer.",
  ],
  Traveler: [
    "I came from beyond the forest...",
    "Have you seen the planet from orbit? Breathtaking.",
    "So many agents to meet here.",
  ],
  "Fruit Seller": [
    "Fresh harvest today!",
    "Business is good when the weather holds.",
    "Credits make the world go round.",
  ],
  Courier: [
    "Deliveries never stop.",
    "I run between all four districts.",
    "Out of my way — urgent package!",
  ],
  Shopper: [
    "I'm looking for a good deal...",
    "The market's busier this season.",
    "Have you talked to Ledger? Sharp mind.",
  ],
  Student: [
    "Archon's lectures are fascinating.",
    "I've been reading all day.",
    "Knowledge is the only true currency.",
  ],
  Librarian: [
    "Quiet please.",
    "The archives go back centuries.",
    "Every biome has its own history.",
  ],
  Blacksmith: [
    "Another day at the forge.",
    "Forge writes better code than I hammer steel.",
    "Tools need maintenance, just like software.",
  ],
  Apprentice: [
    "I'm still learning.",
    "One day I'll have my own workshop.",
    "Watch your step — hot metal!",
  ],
  Gardener: [
    "The autumn colors are my favorite.",
    "These trees are older than the settlement.",
    "Nature doesn't need debugging.",
  ],
  Musician: [
    "A song for the wanderer...",
    "Ember loves my melodies.",
    "Every biome has its own rhythm.",
  ],
  Child: [
    "Tag! You're it!",
    "I want to be an agent when I grow up!",
    "Have you explored the whole town?",
  ],
};
```

- [ ] **Step 2: Create AmbientNpcManager**

Create `src/engine/settlement/ambientNpcManager.ts`:

```typescript
import Phaser from "phaser";
import { getCharacterDef } from "./spriteFrames";
import { AMBIENT_NPC_LINES } from "./ambientNpcData";

interface AmbientNpc {
  name: string;
  sprite: Phaser.GameObjects.Sprite;
  idleTimer: Phaser.Time.TimerEvent;
  speechBubble: Phaser.GameObjects.Container | null;
  cooldownUntil: number;
}

const PROXIMITY_RADIUS = 32;  // px — triggers speech bubble
const BUBBLE_DURATION = 3000; // ms — how long bubble shows
const BUBBLE_COOLDOWN = 10000; // ms — cooldown before re-trigger

/**
 * AmbientNpcManager — handles non-AI NPCs with proximity speech bubbles.
 * These NPCs have no name labels, no interaction prompt, no LLM calls.
 */
export class AmbientNpcManager {
  private scene: Phaser.Scene;
  private npcs: AmbientNpc[] = [];
  private playerSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  constructor(
    scene: Phaser.Scene,
    npcObjects: Phaser.Types.Tilemaps.TiledObject[],
    playerSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ) {
    this.scene = scene;
    this.playerSprite = playerSprite;

    for (const obj of npcObjects) {
      if (!obj.x || !obj.y) continue;
      this.createNpc(obj);
    }
  }

  private createNpc(obj: Phaser.Types.Tilemaps.TiledObject): void {
    const name = obj.name;
    const spriteKey = name.toLowerCase().replace(/\s+/g, "");
    const charDef = getCharacterDef(spriteKey);

    const sprite = this.scene.add.sprite(obj.x!, obj.y!, charDef.sheet, charDef.frames[0]);
    sprite.setDepth(10);

    // Idle animation: toggle frames
    const idleTimer = this.scene.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => {
        const current = typeof sprite.frame.name === "string"
          ? parseInt(sprite.frame.name, 10)
          : charDef.frames[0];
        sprite.setFrame(
          current === charDef.frames[0] ? charDef.frames[1] : charDef.frames[0]
        );
      },
    });

    this.npcs.push({
      name,
      sprite,
      idleTimer,
      speechBubble: null,
      cooldownUntil: 0,
    });
  }

  update(): void {
    const now = this.scene.time.now;
    const px = this.playerSprite.x;
    const py = this.playerSprite.y;

    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(px, py, npc.sprite.x, npc.sprite.y);

      if (dist < PROXIMITY_RADIUS && !npc.speechBubble && now > npc.cooldownUntil) {
        this.showBubble(npc);
      }
    }
  }

  private showBubble(npc: AmbientNpc): void {
    const lines = AMBIENT_NPC_LINES[npc.name];
    if (!lines || lines.length === 0) return;

    const line = lines[Math.floor(Math.random() * lines.length)];

    // Create speech bubble container
    const bg = this.scene.add.rectangle(0, 0, 0, 0, 0x000000, 0.7)
      .setStrokeStyle(1, 0xffffff, 0.5);

    const text = this.scene.add.text(0, 0, line, {
      fontSize: "6px",
      fontFamily: "monospace",
      color: "#ffffff",
      wordWrap: { width: 80 },
      align: "center",
    }).setOrigin(0.5, 0.5);

    // Size background to text
    const padding = 4;
    bg.setSize(text.width + padding * 2, text.height + padding * 2);

    const container = this.scene.add.container(
      npc.sprite.x,
      npc.sprite.y - 20,
      [bg, text]
    );
    container.setDepth(100);
    container.setAlpha(0);

    // Fade in
    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      duration: 200,
    });

    npc.speechBubble = container;

    // Fade out and destroy after duration
    this.scene.time.delayedCall(BUBBLE_DURATION, () => {
      this.scene.tweens.add({
        targets: container,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          container.destroy();
          npc.speechBubble = null;
          npc.cooldownUntil = this.scene.time.now + BUBBLE_COOLDOWN;
        },
      });
    });
  }

  destroy(): void {
    for (const npc of this.npcs) {
      npc.idleTimer.destroy();
      npc.sprite.destroy();
      npc.speechBubble?.destroy();
    }
    this.npcs = [];
  }
}
```

- [ ] **Step 3: Integrate AmbientNpcManager into SettlementScene**

Modify `src/engine/settlement/scenes/SettlementScene.ts`:

Add import:
```typescript
import { AmbientNpcManager } from "../ambientNpcManager";
```

Add class property:
```typescript
private ambientNpcManager!: AmbientNpcManager;
```

In `create()`, after the NPC manager setup (after step 8), add:

```typescript
// 8c. Ambient NPCs — non-AI characters with speech bubbles
const ambientNpcObjects = objectLayer
  ? objectLayer.objects.filter((o) => o.type === "ambient_npc")
  : [];

this.ambientNpcManager = new AmbientNpcManager(
  this,
  ambientNpcObjects,
  this.playerController.sprite
);
```

In `update()`, add:
```typescript
if (this.ambientNpcManager) {
  this.ambientNpcManager.update();
}
```

In `cleanup()`, add:
```typescript
if (this.ambientNpcManager) {
  this.ambientNpcManager.destroy();
}
```

- [ ] **Step 4: Verify ambient NPCs work**

```bash
npm run dev
```

Walk near an ambient NPC. Verify:
- No name label above them
- No "Press E to talk" prompt
- Speech bubble appears on proximity (within ~32px)
- Bubble fades after 3 seconds
- 10-second cooldown before re-trigger
- Different random lines each time

- [ ] **Step 5: Commit**

```bash
git add src/engine/settlement/ambientNpcData.ts src/engine/settlement/ambientNpcManager.ts src/engine/settlement/scenes/SettlementScene.ts
git commit -m "feat: ambient NPC system with 12 NPCs and proximity speech bubbles"
```

---

## Chunk 3: Audio, UI Reskin, and Lot System

### Task 7: Audio System

**Files:**
- Create: `src/engine/settlement/audioManager.ts`
- Modify: `src/engine/settlement/scenes/BootScene.ts` (load audio)
- Modify: `src/engine/settlement/npcManager.ts` (proximity sound)
- Modify: `src/engine/settlement/ambientNpcManager.ts` (bubble pop sound)
- Modify: `src/stores/worldStore.ts` (mute state)

- [ ] **Step 1: Add mute state to worldStore**

Modify `src/stores/worldStore.ts` — add to the interface:

```typescript
/** Whether audio is globally muted */
audioMuted: boolean;
toggleAudioMute: () => void;
```

Add to the store initializer:

```typescript
audioMuted: typeof window !== "undefined"
  ? localStorage.getItem("apq-audio-muted") === "true"
  : false,

toggleAudioMute: () =>
  set((state) => {
    const muted = !state.audioMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("apq-audio-muted", String(muted));
    }
    return { audioMuted: muted };
  }),
```

- [ ] **Step 2: Create AudioManager**

Create `src/engine/settlement/audioManager.ts`:

```typescript
import { useWorldStore } from "@/stores/worldStore";

/**
 * AudioManager — loads and plays SFX for the settlement.
 * All sounds play at 30% volume (subtle, not intrusive).
 * Respects the global mute toggle from worldStore.
 */

const SFX_KEYS = {
  proximity: "sfx-proximity",   // Agent proximity enter
  chatOpen: "sfx-chat-open",    // Chat overlay opens
  chatClose: "sfx-chat-close",  // Chat overlay closes
  sendMsg: "sfx-send",          // Send message
  receiveMsg: "sfx-receive",    // Receive agent response
  hover: "sfx-hover",           // HUD navigation
  bubblePop: "sfx-bubble",      // Ambient NPC speech bubble
} as const;

export type SfxKey = keyof typeof SFX_KEYS;

const DEFAULT_VOLUME = 0.3;

export class AudioManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Call in BootScene.preload() to queue audio assets.
   */
  static loadAssets(scene: Phaser.Scene): void {
    scene.load.audio(SFX_KEYS.proximity, "/audio/sfx/click5.ogg");
    scene.load.audio(SFX_KEYS.chatOpen, "/audio/sfx/mouseclick1.ogg");
    scene.load.audio(SFX_KEYS.chatClose, "/audio/sfx/mouserelease1.ogg");
    scene.load.audio(SFX_KEYS.sendMsg, "/audio/sfx/click1.ogg");
    scene.load.audio(SFX_KEYS.receiveMsg, "/audio/sfx/switch3.ogg");
    scene.load.audio(SFX_KEYS.hover, "/audio/sfx/rollover1.ogg");
    scene.load.audio(SFX_KEYS.bubblePop, "/audio/sfx/click3.ogg");
  }

  play(key: SfxKey): void {
    if (useWorldStore.getState().audioMuted) return;

    const sndKey = SFX_KEYS[key];
    if (!this.sounds.has(sndKey)) {
      this.sounds.set(sndKey, this.scene.sound.add(sndKey, { volume: DEFAULT_VOLUME }));
    }

    const sound = this.sounds.get(sndKey)!;
    if (!sound.isPlaying) {
      sound.play();
    }
  }

  destroy(): void {
    for (const sound of this.sounds.values()) {
      sound.destroy();
    }
    this.sounds.clear();
  }
}
```

- [ ] **Step 3: Load audio in BootScene**

Add to `BootScene.preload()`:

```typescript
import { AudioManager } from "../audioManager";

// In preload():
AudioManager.loadAssets(this);
```

- [ ] **Step 4: Wire audio into SettlementScene**

Add to SettlementScene class properties:
```typescript
private audioManager!: AudioManager;
```

In `create()`, after lighting engine setup:
```typescript
this.audioManager = new AudioManager(this);
// Store on registry so NPC managers can access it
this.game.registry.set("audioManager", this.audioManager);
```

In `cleanup()`:
```typescript
if (this.audioManager) {
  this.audioManager.destroy();
}
```

- [ ] **Step 5: Play proximity sound in NpcManager**

In `npcManager.ts`, update `onPlayerNear()`:

```typescript
private onPlayerNear(data: NpcData): void {
  if (this.currentNearby === data.agentId) return;
  this.currentNearby = data.agentId;
  useWorldStore.getState().setNearbyAgent({
    id: data.dbId || data.agentId,
    name: data.agentName,
  });

  // Play proximity sound
  const audio = this.scene.game.registry.get("audioManager") as
    | import("./audioManager").AudioManager
    | undefined;
  audio?.play("proximity");
}
```

- [ ] **Step 6: Play bubble pop in AmbientNpcManager**

In `ambientNpcManager.ts`, in `showBubble()`, add after creating the container:

```typescript
const audio = this.scene.game.registry.get("audioManager") as
  | import("./audioManager").AudioManager
  | undefined;
audio?.play("bubblePop");
```

- [ ] **Step 7: Verify audio**

```bash
npm run dev
```

Test:
- Walk near an AI agent → hear proximity chime
- Walk near an ambient NPC → hear bubble pop
- Verify sounds are subtle (30% volume)

- [ ] **Step 8: Commit**

```bash
git add src/engine/settlement/audioManager.ts src/stores/worldStore.ts src/engine/settlement/scenes/BootScene.ts src/engine/settlement/scenes/SettlementScene.ts src/engine/settlement/npcManager.ts src/engine/settlement/ambientNpcManager.ts
git commit -m "feat: audio system with Kenney UI SFX for proximity, speech bubbles, and navigation"
```

---

### Task 8: UI Reskin — HUD and Interaction Prompt

**Files:**
- Modify: `src/components/settlement/SettlementHUD.tsx`
- Modify: `src/components/settlement/InteractionPrompt.tsx`

The reskin replaces raw Tailwind CSS overlays with a pixel-art themed design using the warm/parchment color palette from Kenney UI Pack Pixel Adventure. For MVP, we achieve this with CSS styling that matches the pack's visual language rather than loading image-based UI panels (which would require Phaser UI rendering or complex CSS sprite slicing).

- [ ] **Step 1: Reskin SettlementHUD**

Replace `src/components/settlement/SettlementHUD.tsx`:

```typescript
"use client";

import { useWorldStore } from "@/stores/worldStore";
import {
  SETTLEMENT_DISPLAY_NAMES,
  WEATHER_LABELS,
} from "@/lib/constants/displayNames";

const WEATHER_ICONS: Record<string, string> = {
  clear: "☀",
  light_rain: "🌧",
  overcast: "☁",
  mist: "🌫",
};

function formatWorldClock(normalizedTime: number): string {
  const totalMinutes = Math.floor(normalizedTime * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

/**
 * SettlementHUD — pixel-art themed HUD panel for the settlement view.
 * Uses warm/parchment color palette matching Kenney UI Pack Pixel Adventure.
 */
export default function SettlementHUD() {
  const activeView = useWorldStore((s) => s.activeView);
  const normalizedTime = useWorldStore((s) => s.normalizedTime);
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const weather = useWorldStore((s) => s.weather);
  const season = useWorldStore((s) => s.season);
  const currentSettlement = useWorldStore((s) => s.currentSettlement);
  const audioMuted = useWorldStore((s) => s.audioMuted);
  const toggleAudioMute = useWorldStore((s) => s.toggleAudioMute);

  if (activeView !== "settlement") return null;

  const settlementName = currentSettlement
    ? SETTLEMENT_DISPLAY_NAMES[currentSettlement] || currentSettlement
    : "Unknown";

  const clockStr = formatWorldClock(normalizedTime);
  const weatherLabel = WEATHER_LABELS[weather] || weather;
  const weatherIcon = WEATHER_ICONS[weather] || "?";

  return (
    <div className="absolute top-2 right-2 pointer-events-auto z-30">
      <div
        className="rounded-sm px-3 py-2 font-mono text-xs space-y-1 min-w-[130px]"
        style={{
          backgroundColor: "#3e2a1a",
          border: "2px solid #6b4c2e",
          boxShadow: "inset 0 0 0 1px #8b6d4a, 0 2px 4px rgba(0,0,0,0.5)",
          color: "#e8d5b5",
          imageRendering: "pixelated",
        }}
      >
        {/* Location */}
        <div
          className="font-bold text-center pb-1 text-[11px]"
          style={{
            color: "#f5c542",
            borderBottom: "1px solid #6b4c2e",
          }}
        >
          {settlementName}
        </div>

        {/* Time */}
        <div className="flex justify-between items-center">
          <span>{clockStr}</span>
          <span className="text-[10px]" style={{ color: "#a08060" }}>
            {timeOfDay}
          </span>
        </div>

        {/* Weather */}
        <div className="flex justify-between items-center">
          <span>
            {weatherIcon} {weatherLabel}
          </span>
          <span className="text-[10px] capitalize" style={{ color: "#a08060" }}>
            {season}
          </span>
        </div>

        {/* Breadcrumb */}
        <div
          className="text-center text-[9px] pt-1"
          style={{ color: "#8b6d4a", borderTop: "1px solid #6b4c2e" }}
        >
          Alpha Pegasi q &gt; Arboria &gt; Market Town
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center pt-1" style={{ borderTop: "1px solid #6b4c2e" }}>
          <span className="text-[9px]" style={{ color: "#8b6d4a" }}>
            M = Map
          </span>
          <button
            onClick={toggleAudioMute}
            className="text-[9px] cursor-pointer hover:opacity-80"
            style={{ color: "#a08060", background: "none", border: "none" }}
            title={audioMuted ? "Unmute" : "Mute"}
          >
            {audioMuted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Reskin InteractionPrompt**

Replace `src/components/settlement/InteractionPrompt.tsx`:

```typescript
"use client";

import { useWorldStore } from "@/stores/worldStore";

/**
 * InteractionPrompt — pixel-art themed "Press E to talk" panel.
 * Uses warm/parchment styling matching Kenney UI Pack Pixel Adventure.
 */
export default function InteractionPrompt() {
  const activeView = useWorldStore((s) => s.activeView);
  const nearbyAgent = useWorldStore((s) => s.nearbyAgent);

  if (activeView !== "settlement" || !nearbyAgent) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fade-in">
      <div
        className="rounded-sm px-4 py-2 font-mono text-sm text-center"
        style={{
          backgroundColor: "#3e2a1a",
          border: "2px solid #6b4c2e",
          boxShadow: "inset 0 0 0 1px #8b6d4a, 0 2px 4px rgba(0,0,0,0.5)",
          color: "#e8d5b5",
        }}
      >
        <span>Press </span>
        <kbd
          className="rounded px-1.5 py-0.5 text-xs"
          style={{
            backgroundColor: "#6b4c2e",
            border: "1px solid #8b6d4a",
            color: "#f5c542",
          }}
        >
          E
        </kbd>
        <span> to talk to </span>
        <span className="font-bold" style={{ color: "#f5c542" }}>
          {nearbyAgent.name}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify UI reskin**

```bash
npm run dev
```

Check:
- HUD has warm brown/parchment styling (not raw black/gray Tailwind)
- Interaction prompt matches the same palette
- Mute button toggles audio state
- Breadcrumb shows "Alpha Pegasi q > Arboria > Market Town"

- [ ] **Step 4: Commit**

```bash
git add src/components/settlement/SettlementHUD.tsx src/components/settlement/InteractionPrompt.tsx
git commit -m "feat: reskin HUD and interaction prompt with pixel-art parchment theme"
```

---

### Task 9: Lot System Foundation

**Files:**
- Create: `supabase/migrations/0008_properties_table.sql`
- Create: `src/engine/settlement/lotManager.ts`
- Modify: `src/engine/settlement/scenes/SettlementScene.ts`

This task creates the groundwork for Steward agent registration (Phase 4). It renders unclaimed lots as visible fenced areas and sets up the runtime tile patching system that will be activated when lots are claimed.

- [ ] **Step 1: Create properties table migration**

Create `supabase/migrations/0008_properties_table.sql`:

```sql
-- Properties table for claimable lots in settlements.
-- Lots are defined in the Tiled map object layer; this table tracks claims.

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  biome text NOT NULL,
  settlement text NOT NULL,
  tier integer NOT NULL DEFAULT 1,
  monthly_rent_wc integer NOT NULL DEFAULT 10,
  purchased boolean NOT NULL DEFAULT false,
  lot_name text NOT NULL,       -- e.g. "lot_market_1"
  lot_x integer NOT NULL,       -- tile X of lot top-left corner
  lot_y integer NOT NULL,       -- tile Y of lot top-left corner
  house_style text NOT NULL DEFAULT 'small_red',  -- 'small_red', 'small_blue', 'small_gray', 'large_red', 'large_blue', 'large_gray'
  sprite_key text NOT NULL DEFAULT 'player',       -- character sprite key from spriteFrames
  created_at timestamp with time zone DEFAULT now()
);

-- Index for fast lookup by settlement
CREATE INDEX IF NOT EXISTS idx_properties_settlement ON properties (settlement);
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase migration up --linked
```

- [ ] **Step 3: Create LotManager**

Create `src/engine/settlement/lotManager.ts`:

```typescript
import Phaser from "phaser";
import { supabaseAnon } from "@/lib/supabase/anonClient";
import { getCharacterDef } from "./spriteFrames";

interface ClaimedLot {
  lot_name: string;
  lot_x: number;
  lot_y: number;
  house_style: string;
  sprite_key: string;
  agent_name: string;
}

/**
 * LotManager — queries claimed lots from the properties table
 * and patches the tilemap at runtime to show houses + agent sprites.
 *
 * Unclaimed lots are already rendered in the base map (fenced grass + signpost).
 * Claimed lots get their house tiles patched over the fence interior.
 */
export class LotManager {
  private scene: Phaser.Scene;
  private spawnedSprites: Phaser.GameObjects.Sprite[] = [];
  private spawnedLabels: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  async loadAndPatch(
    map: Phaser.Tilemaps.Tilemap,
    buildingsLayer: Phaser.Tilemaps.TilemapLayer,
    decorationsLayer: Phaser.Tilemaps.TilemapLayer
  ): Promise<void> {
    try {
      const { data: lots, error } = await supabaseAnon
        .from("properties")
        .select(`
          lot_name, lot_x, lot_y, house_style, sprite_key,
          agents!inner(name)
        `)
        .eq("settlement", "arboria_market_town");

      if (error || !lots) {
        console.warn("[LotManager] Failed to fetch lots:", error?.message);
        return;
      }

      for (const lot of lots as unknown as Array<ClaimedLot & { agents: { name: string } }>) {
        this.patchLot(
          map,
          buildingsLayer,
          decorationsLayer,
          lot.lot_x,
          lot.lot_y,
          lot.house_style,
          lot.sprite_key,
          lot.agents.name
        );
      }
    } catch (err) {
      console.warn("[LotManager] Fetch error:", err);
    }
  }

  private patchLot(
    map: Phaser.Tilemaps.Tilemap,
    buildingsLayer: Phaser.Tilemaps.TilemapLayer,
    decorationsLayer: Phaser.Tilemaps.TilemapLayer,
    lotX: number,
    lotY: number,
    houseStyle: string,
    spriteKey: string,
    agentName: string
  ): void {
    // Remove the signpost from decorations (lot_x+2, lot_y+3)
    decorationsLayer.removeTileAt(lotX + 2, lotY + 3);

    // Place house tiles in center of 5x5 lot
    // House goes at lotX+1, lotY+1 (2x2 for small, 3x2 for large)
    // Tile indices depend on house_style — these are set by the map generator T constants
    // For now, use building layer putTileAt with appropriate GIDs
    const houseGids = this.getHouseGids(houseStyle);
    if (houseGids.length === 4) {
      // 2x2 small house
      buildingsLayer.putTileAt(houseGids[0], lotX + 1, lotY + 1);
      buildingsLayer.putTileAt(houseGids[1], lotX + 2, lotY + 1);
      buildingsLayer.putTileAt(houseGids[2], lotX + 1, lotY + 2);
      buildingsLayer.putTileAt(houseGids[3], lotX + 2, lotY + 2);
    }

    // Spawn agent sprite at front door (lotX+2, lotY+3 — where signpost was)
    const charDef = getCharacterDef(spriteKey);
    const tileSize = 16;
    const sprite = this.scene.add.sprite(
      (lotX + 2) * tileSize + 8,
      (lotY + 3) * tileSize + 8,
      charDef.sheet,
      charDef.frames[0]
    );
    sprite.setDepth(10);
    this.spawnedSprites.push(sprite);

    // Name label
    const label = this.scene.add.text(
      (lotX + 2) * tileSize + 8,
      (lotY + 3) * tileSize - 4,
      agentName,
      {
        fontSize: "7px",
        fontFamily: "monospace",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 1,
      }
    ).setOrigin(0.5, 1).setDepth(11);
    this.spawnedLabels.push(label);
  }

  private getHouseGids(style: string): number[] {
    // GIDs matching the T constants from the map generator.
    // These MUST match the tileset.
    const styles: Record<string, number[]> = {
      small_red:  [37, 38, 49, 50],
      small_blue: [54, 55, 61, 62],
      small_gray: [59, 60, 66, 67],
      large_red:  [39, 40, 41, 51, 52, 53],
      large_blue: [63, 64, 65, 73, 74, 75],
      large_gray: [68, 69, 70, 76, 77, 78],
    };
    return styles[style] ?? styles["small_red"];
  }

  destroy(): void {
    for (const s of this.spawnedSprites) s.destroy();
    for (const l of this.spawnedLabels) l.destroy();
    this.spawnedSprites = [];
    this.spawnedLabels = [];
  }
}
```

- [ ] **Step 4: Integrate LotManager into SettlementScene**

Add to SettlementScene imports:
```typescript
import { LotManager } from "../lotManager";
```

Add class property:
```typescript
private lotManager!: LotManager;
```

In `create()`, after NPC managers are set up, add:

```typescript
// 8d. Lot system — patch claimed lots at runtime
this.lotManager = new LotManager(this);
if (groundLayer && buildingsLayer && decorationsLayer) {
  const map = this.make.tilemap({ key: "arboria-market-town" });
  // Note: reuse the existing map reference, not a new one
  this.lotManager.loadAndPatch(map, buildingsLayer, decorationsLayer);
}
```

**Important correction:** The `map` variable is already declared earlier in `create()`. Reference it directly:

```typescript
// 8d. Lot system — patch claimed lots at runtime
this.lotManager = new LotManager(this);
if (buildingsLayer && decorationsLayer) {
  this.lotManager.loadAndPatch(map, buildingsLayer, decorationsLayer);
}
```

In `cleanup()`:
```typescript
if (this.lotManager) {
  this.lotManager.destroy();
}
```

- [ ] **Step 5: Verify lot system foundation**

```bash
npm run dev
```

Verify:
- 18 fenced lots visible across the 5 districts
- Each lot shows grass interior with signpost
- No errors in console from lot manager (it will find 0 claimed lots, which is correct)

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0008_properties_table.sql src/engine/settlement/lotManager.ts src/engine/settlement/scenes/SettlementScene.ts
git commit -m "feat: lot system with properties table, LotManager, and runtime tile patching"
```

---

## Chunk 4: Final Integration and Verification

### Task 10: Integration Testing and Polish

**Files:**
- Potentially modify any files from Tasks 1-9 based on issues found

- [ ] **Step 1: Full build check**

```bash
npm run build
```

Fix any TypeScript errors.

- [ ] **Step 2: Start dev server and run full walkthrough**

```bash
npm run dev
```

Complete walkthrough checklist:

1. **Orbital view**: Planet renders, 15 biomes visible, click Arboria
2. **Region map**: Arboria region loads, market town marker visible, click it
3. **Settlement entry**: Fade transition to settlement, player spawns at Town Gate
4. **Town Gate**: Castle gate visible, Mira has name label, Guard/Traveler NPCs nearby
5. **Walk north**: Stone road leads to Market Square
6. **Market Square**: Well, market stalls, Ledger visible, barrels/crates
7. **Walk NE**: Dirt path to Scholar's Quarter, Archon visible, blue-roof buildings
8. **Walk E**: Craftsmen's Row, Forge visible, red-roof workshops
9. **Walk W**: Commons Park, Ember under trees, pond visible, flowers
10. **Agent interaction**: Walk near any agent → proximity chime, name label visible, "Press E" prompt
11. **Ambient NPC**: Walk near Guard → speech bubble, no name label, no "Press E"
12. **Audio**: Sounds play on proximity and bubble pop
13. **Mute toggle**: Click mute in HUD → sounds stop
14. **HUD**: Shows time, weather, season, breadcrumb, M key hint
15. **M key**: Returns to region map
16. **Lots**: 18 fenced lots visible across districts

- [ ] **Step 3: Fix any issues found during walkthrough**

Address each issue individually. Common issues to watch for:
- Tile GID mismatches (buildings look wrong) → update T constants in map generator, re-run
- NPC sprites on wrong frame → update spriteFrames.ts frame indices
- Collision issues (walking through buildings or stuck on grass) → update map generator collisions
- Speech bubbles mispositioned → adjust Y offset in AmbientNpcManager

- [ ] **Step 4: Re-run map generator if tile adjustments were made**

```bash
npx tsx scripts/generate-arboria-map.ts
```

- [ ] **Step 5: Final build verification**

```bash
npm run build
```

Must pass with zero errors.

- [ ] **Step 6: Commit all fixes**

```bash
git add -A
git commit -m "fix: Phase 2.5 integration fixes from full walkthrough"
```

- [ ] **Step 7: Tag completion**

```bash
git tag -a phase-2.5-complete -m "Phase 2.5: Arboria Visual Reimagining complete"
```

---

## Post-Implementation Notes

### What's Ready for Phase 3 (Agent Interaction)
- 5 platform agents with `model_id` and `personality_prompt` in database
- `spriteFrames.ts` maps agent sprite keys to visual frames
- NPC interaction zones detect player proximity and show "Press E" prompt
- Audio system ready for chat open/close/send/receive sounds
- HUD and interaction prompt styled with pixel-art theme

### What's Ready for Phase 4 (Economy & Accounts)
- `properties` table exists with `house_style`, `sprite_key`, `lot_x`, `lot_y`
- `LotManager` can patch claimed lots at runtime
- 18 empty lots defined in map with coordinates
- Lot markers in Tiled object layer for UI lot selector

### Known Limitations
- Character sprite frame indices in `spriteFrames.ts` are approximate — visual verification and adjustment will be needed
- The map generator produces a functional but not hand-crafted layout — iterative refinement in Tiled editor recommended for polish
- UI reskin uses CSS approximation of Kenney UI Pack style rather than actual image-based panels — consider upgrading to nine-slice panels in a future polish pass
