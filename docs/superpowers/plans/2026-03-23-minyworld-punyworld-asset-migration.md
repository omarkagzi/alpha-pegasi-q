# MinyWorld + Puny World Asset Migration Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Kenney Tiny Town assets with MinyWorld (buildings, characters, objects) + Puny World (terrain) assets, producing a visually rich ~100×100 settlement map inspired by the MinyWorld example maps.

**Architecture:** Hybrid tilemap + sprite approach. Puny World's 1,755-tile tileset handles all terrain via standard Tiled tilemap layers (ground, paths, water, cliffs, forest edges) using its built-in Wang auto-tiling rules. MinyWorld buildings, nature, and objects are loaded as individual Phaser sprite textures and placed via the Tiled object layer — eliminating multi-tile GID assembly entirely. Characters remain as Phaser spritesheets with walk animations.

**Tech Stack:** Phaser 3, TypeScript, Tiled JSON format, Node.js build scripts

---

## File Structure

### New Files to Create

| File | Responsibility |
|------|---------------|
| `scripts/pack-minyworld-assets.ts` | Copies selected MinyWorld PNGs to `public/sprites/` with consistent naming. No atlas packing — individual textures. |
| `scripts/generate-settlement-map.ts` | Complete map generator replacement. Produces Tiled JSON using Puny World terrain GIDs + MinyWorld object layer. |
| `src/engine/settlement/buildingManager.ts` | Loads MinyWorld building sprites from object layer, creates Phaser sprites with collision bodies. |
| `src/engine/settlement/assetManifest.ts` | Single source of truth for all MinyWorld asset keys, frame dimensions, and variant counts. |

### Files to Modify

| File | What Changes |
|------|-------------|
| `src/engine/settlement/scenes/BootScene.ts` | Replace Kenney asset loads with Puny World tileset + MinyWorld sprite loads. |
| `src/engine/settlement/scenes/SettlementScene.ts` | Replace single-tileset rendering with Puny World terrain + sprite-based buildings. |
| `src/engine/settlement/npcManager.ts` | Update sprite keys to MinyWorld character sprites, update frame indices for idle animation. |
| `src/engine/settlement/playerController.ts` | Update player sprite key and animation frame layout to match MinyWorld character format. |
| `src/engine/settlement/phaserConfig.ts` | No changes needed — 16×16 tiles, `pixelArt: true`, 3× zoom all stay the same. |

**Note:** `src/engine/region/mapLoader.ts` does NOT need changes — it uses `"arboria-tileset"` / `"arboria-tiles"` for the region map, which is unrelated to the settlement tileset migration.

### Files to Delete

| File | Reason |
|------|--------|
| `scripts/generate-arboria-map.ts` | Replaced entirely by `scripts/generate-settlement-map.ts`. |

### Assets to Deploy (copied by pack script)

| Source (Design Assets/) | Destination (public/) | Use |
|------------------------|----------------------|-----|
| `Puny World Assets/punyworld-overworld-tileset.png` | `public/sprites/tiles/punyworld-overworld-tileset.png` | Terrain tilemap |
| `Puny World Assets/Tiled/punyworld-overworld-tiles.tsx` | `public/sprites/tiles/punyworld-overworld-tiles.tsx` | Tileset definition (reference) |
| `MinyWorld Assets/.../Buildings/Wood/Houses.png` | `public/sprites/buildings/houses.png` | House building sprites |
| `MinyWorld Assets/.../Buildings/Wood/Huts.png` | `public/sprites/buildings/huts.png` | Hut building sprites |
| `MinyWorld Assets/.../Buildings/Wood/Taverns.png` | `public/sprites/buildings/taverns.png` | Tavern building sprites |
| `MinyWorld Assets/.../Buildings/Wood/Market.png` | `public/sprites/buildings/market.png` | Market building sprites |
| `MinyWorld Assets/.../Buildings/Wood/Workshops.png` | `public/sprites/buildings/workshops.png` | Workshop building sprites |
| `MinyWorld Assets/.../Buildings/Wood/Keep.png` | `public/sprites/buildings/keep.png` | Keep/castle building sprites |
| `MinyWorld Assets/.../Buildings/Wood/Tower.png` | `public/sprites/buildings/tower.png` | Tower building sprites |
| `MinyWorld Assets/.../Buildings/Wood/Barracks.png` | `public/sprites/buildings/barracks.png` | Barracks building sprites |
| `MinyWorld Assets/.../Buildings/Wood/Chapels.png` | `public/sprites/buildings/chapels.png` | Chapel building sprites |
| `MinyWorld Assets/.../Buildings/Wood/Resources.png` | `public/sprites/buildings/resources.png` | Resource building sprites |
| `MinyWorld Assets/.../Buildings/Wood/Docks.png` | `public/sprites/buildings/docks.png` | Dock building sprites |
| `MinyWorld Assets/.../Nature/Trees.png` | `public/sprites/nature/trees.png` | Deciduous trees |
| `MinyWorld Assets/.../Nature/PineTrees.png` | `public/sprites/nature/pine-trees.png` | Pine/conifer trees |
| `MinyWorld Assets/.../Nature/Rocks.png` | `public/sprites/nature/rocks.png` | Rock formations |
| `MinyWorld Assets/.../Nature/Wheatfield.png` | `public/sprites/nature/wheatfield.png` | Crop fields |
| `MinyWorld Assets/.../Nature/DeadTrees.png` | `public/sprites/nature/dead-trees.png` | Dead trees |
| `MinyWorld Assets/.../Miscellaneous/Well.png` | `public/sprites/misc/well.png` | Wells |
| `MinyWorld Assets/.../Miscellaneous/Bridge.png` | `public/sprites/misc/bridge.png` | Bridges |
| `MinyWorld Assets/.../Miscellaneous/Signs.png` | `public/sprites/misc/signs.png` | Signs |
| `MinyWorld Assets/.../Miscellaneous/Chests.png` | `public/sprites/misc/chests.png` | Chests |
| `MinyWorld Assets/.../Miscellaneous/QuestBoard.png` | `public/sprites/misc/quest-board.png` | Quest boards |
| `MinyWorld Assets/.../Miscellaneous/Tombstones.png` | `public/sprites/misc/tombstones.png` | Tombstones |
| `MinyWorld Assets/.../Characters/Champions/Arthax.png` | `public/sprites/characters/arthax.png` | Agent character (Mira) |
| `MinyWorld Assets/.../Characters/Champions/Kanji.png` | `public/sprites/characters/kanji.png` | Agent character (Ledger) |
| `MinyWorld Assets/.../Characters/Champions/Katan.png` | `public/sprites/characters/katan.png` | Agent character (Archon) |
| `MinyWorld Assets/.../Characters/Champions/Okomo.png` | `public/sprites/characters/okomo.png` | Agent character (Forge) |
| `MinyWorld Assets/.../Characters/Champions/Zhinja.png` | `public/sprites/characters/zhinja.png` | Agent character (Ember) |
| `MinyWorld Assets/.../Characters/Workers/FarmerTemplate.png` | `public/sprites/characters/farmer.png` | Player character |
| `MinyWorld Assets/.../Animals/Sheep.png` | `public/sprites/animals/sheep.png` | Ambient animal |
| `MinyWorld Assets/.../Animals/Chicken.png` | `public/sprites/animals/chicken.png` | Ambient animal |

### Documentation to Update

| File | What Changes |
|------|-------------|
| `docs/superpowers/specs/2026-03-19-arboria-visual-reimagining-design.md` | Section 2 (Asset Inventory), Section 10 (Tiled Map Tech Spec), Section 12 (Migration) — all rewritten for MinyWorld + Puny World. |
| `docs/superpowers/plans/2026-03-19-phase-2-5-arboria-visual-reimagining.md` | Mark as superseded by this plan. |
| `docs/alpha pegasi q - Implementation Plan - PHASE 2.md` | Update references to `npc-assistant`, `npc-researcher`, `npc-merchant` sprite keys (now stale). |

### Known Limitations (to address post-MVP)

1. **Animated water tiles:** The Puny World `.tsx` defines tile animations (4-frame sequences at 100-400ms) for water tiles (tileIds 270+). The MVP map generator does NOT embed animation data in the Tiled JSON. Water renders as static tiles. To enable animations, the generator must parse the `.tsx` `<tile><animation>` elements and include them as a `tiles` array in the tileset JSON block. This is a visual enhancement, not a blocker.

2. **Character animation row layout:** The plan assumes MinyWorld Farmer/Champion rows follow down/left/right/up ordering. This must be verified visually per sprite during implementation. If wrong, update the row indices in PlayerController and NpcManager.

3. **Nature sprite dual-source:** For MVP, trees/forests are rendered as **Puny World terrain tiles** (PW.TREE_1..TREE_5) placed in the `paths` tilemap layer by the map generator. The MinyWorld nature spritesheets (`Trees.png`, `PineTrees.png`, `Rocks.png`, etc.) are packed and loaded by BootScene but are NOT placed by any code in the MVP. They exist for future use — specifically for the agent economy system where agents can plant trees, clear rocks, or build farms by placing/removing nature sprites on the object layer. Do NOT confuse these two systems: terrain trees (tile layer) are static world decoration; MinyWorld nature sprites (future object layer) are interactive agent-placeable objects.

---

## Chunk 1: Asset Pipeline & Manifest

### Task 1: Create the Asset Manifest

**Files:**
- Create: `src/engine/settlement/assetManifest.ts`

The asset manifest is the single source of truth for every sprite key, file path, frame size, and variant count. Every other file imports from here — no magic strings.

- [ ] **Step 1: Write the asset manifest file**

```typescript
// src/engine/settlement/assetManifest.ts

/**
 * Asset manifest — single source of truth for all MinyWorld + Puny World
 * asset keys, paths, and frame dimensions.
 *
 * ALL other files import from here. No magic strings for asset keys.
 */

// ── Terrain Tileset (Puny World) ──────────────────────────────────
export const TERRAIN = {
  key: "punyworld-overworld",
  path: "/sprites/tiles/punyworld-overworld-tileset.png",
  tileWidth: 16,
  tileHeight: 16,
  columns: 27,
  tileCount: 1755,
  imageWidth: 432,
  imageHeight: 1040,
} as const;

// ── Building Spritesheets (MinyWorld) ─────────────────────────────
// Each building PNG is a spritesheet of 16×16 variants.
// frameWidth/frameHeight are always 16. cols × rows = total variants.
export const BUILDINGS = {
  houses:     { key: "bld-houses",     path: "/sprites/buildings/houses.png",     fw: 16, fh: 16, cols: 3, rows: 4 },
  huts:       { key: "bld-huts",       path: "/sprites/buildings/huts.png",       fw: 16, fh: 16, cols: 5, rows: 1 },
  taverns:    { key: "bld-taverns",    path: "/sprites/buildings/taverns.png",    fw: 16, fh: 16, cols: 3, rows: 4 },
  market:     { key: "bld-market",     path: "/sprites/buildings/market.png",     fw: 16, fh: 16, cols: 3, rows: 4 },
  workshops:  { key: "bld-workshops",  path: "/sprites/buildings/workshops.png",  fw: 16, fh: 16, cols: 3, rows: 3 },
  keep:       { key: "bld-keep",       path: "/sprites/buildings/keep.png",       fw: 16, fh: 16, cols: 6, rows: 4 },
  tower:      { key: "bld-tower",      path: "/sprites/buildings/tower.png",      fw: 16, fh: 16, cols: 3, rows: 6 },
  barracks:   { key: "bld-barracks",   path: "/sprites/buildings/barracks.png",   fw: 16, fh: 16, cols: 4, rows: 5 },
  chapels:    { key: "bld-chapels",    path: "/sprites/buildings/chapels.png",    fw: 16, fh: 16, cols: 3, rows: 2 },
  resources:  { key: "bld-resources",  path: "/sprites/buildings/resources.png",  fw: 16, fh: 16, cols: 3, rows: 5 },
  docks:      { key: "bld-docks",      path: "/sprites/buildings/docks.png",      fw: 16, fh: 16, cols: 4, rows: 2 },
} as const;

// ── Nature Spritesheets (MinyWorld) ───────────────────────────────
export const NATURE = {
  trees:      { key: "nat-trees",      path: "/sprites/nature/trees.png",      fw: 16, fh: 16, cols: 4, rows: 1 },
  pineTrees:  { key: "nat-pine-trees", path: "/sprites/nature/pine-trees.png", fw: 16, fh: 16, cols: 3, rows: 1 },
  rocks:      { key: "nat-rocks",      path: "/sprites/nature/rocks.png",      fw: 16, fh: 16, cols: 3, rows: 4 },
  wheatfield: { key: "nat-wheatfield", path: "/sprites/nature/wheatfield.png", fw: 16, fh: 16, cols: 4, rows: 1 },
  deadTrees:  { key: "nat-dead-trees", path: "/sprites/nature/dead-trees.png", fw: 16, fh: 16, cols: 4, rows: 1 },
} as const;

// ── Miscellaneous Spritesheets (MinyWorld) ────────────────────────
export const MISC = {
  well:       { key: "misc-well",        path: "/sprites/misc/well.png",        fw: 16, fh: 16, cols: 3, rows: 2 },
  bridge:     { key: "misc-bridge",      path: "/sprites/misc/bridge.png",      fw: 16, fh: 16, cols: 5, rows: 3 },
  signs:      { key: "misc-signs",       path: "/sprites/misc/signs.png",       fw: 16, fh: 16, cols: 4, rows: 1 },
  chests:     { key: "misc-chests",      path: "/sprites/misc/chests.png",      fw: 16, fh: 16, cols: 2, rows: 1 },
  questBoard: { key: "misc-quest-board", path: "/sprites/misc/quest-board.png", fw: 16, fh: 16, cols: 4, rows: 1 },
  tombstones: { key: "misc-tombstones",  path: "/sprites/misc/tombstones.png",  fw: 16, fh: 16, cols: 4, rows: 2 },
} as const;

// ── Character Spritesheets (MinyWorld Champions) ──────────────────
// Layout: 5 or 6 cols × 8 rows. Row 0 = idle down, Row 1 = walk down,
// Row 2 = idle right, Row 3 = walk right, etc. (verify per sprite)
export const CHARACTERS = {
  player:  { key: "player",    path: "/sprites/characters/farmer.png",  fw: 16, fh: 16, cols: 5, rows: 12 },
  arthax:  { key: "chr-arthax",  path: "/sprites/characters/arthax.png",  fw: 16, fh: 16, cols: 5, rows: 8 },
  kanji:   { key: "chr-kanji",   path: "/sprites/characters/kanji.png",   fw: 16, fh: 16, cols: 6, rows: 8 },
  katan:   { key: "chr-katan",   path: "/sprites/characters/katan.png",   fw: 16, fh: 16, cols: 6, rows: 8 },
  okomo:   { key: "chr-okomo",   path: "/sprites/characters/okomo.png",   fw: 16, fh: 16, cols: 5, rows: 12 },
  zhinja:  { key: "chr-zhinja",  path: "/sprites/characters/zhinja.png",  fw: 16, fh: 16, cols: 6, rows: 9 },
} as const;

// ── Agent-to-Character Mapping ────────────────────────────────────
// Maps agent names to their character sprite key
export const AGENT_SPRITE_MAP: Record<string, string> = {
  Mira:   CHARACTERS.arthax.key,
  Ledger: CHARACTERS.kanji.key,
  Archon: CHARACTERS.katan.key,
  Forge:  CHARACTERS.okomo.key,
  Ember:  CHARACTERS.zhinja.key,
};

// ── Animals (ambient) ─────────────────────────────────────────────
export const ANIMALS = {
  sheep:   { key: "anm-sheep",   path: "/sprites/animals/sheep.png",   fw: 16, fh: 16, cols: 4, rows: 4 },
  chicken: { key: "anm-chicken", path: "/sprites/animals/chicken.png", fw: 16, fh: 16, cols: 4, rows: 4 },
} as const;

// ── Tilemap ───────────────────────────────────────────────────────
export const TILEMAP = {
  key: "arboria-market-town",
  path: "/maps/arboria/arboria-market-town.json",
} as const;

// ── Helper: Get all spritesheet entries for bulk loading ──────────
export type SpritesheetEntry = { key: string; path: string; fw: number; fh: number };

export function getAllSpritesheets(): SpritesheetEntry[] {
  return [
    ...Object.values(BUILDINGS),
    ...Object.values(NATURE),
    ...Object.values(MISC),
    ...Object.values(CHARACTERS),
    ...Object.values(ANIMALS),
  ];
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/engine/settlement/assetManifest.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/engine/settlement/assetManifest.ts
git commit -m "feat: add MinyWorld + Puny World asset manifest"
```

---

### Task 2: Create the Asset Pack Script

**Files:**
- Create: `scripts/pack-minyworld-assets.ts`

This script copies selected assets from `Design Assets/` into `public/sprites/` with the paths matching `assetManifest.ts`. Run once during setup, or as a build step.

- [ ] **Step 1: Write the pack script**

```typescript
// scripts/pack-minyworld-assets.ts
/**
 * Copies selected MinyWorld + Puny World assets from Design Assets/ to public/sprites/.
 * Run: npx tsx scripts/pack-minyworld-assets.ts
 */
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const DESIGN = path.join(ROOT, "Design Assets");
const MINY = path.join(DESIGN, "MinyWorld Assets", "MiniWorldSprites");
const PUNY = path.join(DESIGN, "Puny World Assets");
const PUBLIC = path.join(ROOT, "public", "sprites");

interface CopyEntry {
  src: string;
  dest: string;
}

const entries: CopyEntry[] = [
  // Terrain tileset
  { src: path.join(PUNY, "punyworld-overworld-tileset.png"), dest: path.join(PUBLIC, "tiles", "punyworld-overworld-tileset.png") },

  // Buildings (Wood base — no color tint for MVP)
  { src: path.join(MINY, "Buildings", "Wood", "Houses.png"), dest: path.join(PUBLIC, "buildings", "houses.png") },
  { src: path.join(MINY, "Buildings", "Wood", "Huts.png"), dest: path.join(PUBLIC, "buildings", "huts.png") },
  { src: path.join(MINY, "Buildings", "Wood", "Taverns.png"), dest: path.join(PUBLIC, "buildings", "taverns.png") },
  { src: path.join(MINY, "Buildings", "Wood", "Market.png"), dest: path.join(PUBLIC, "buildings", "market.png") },
  { src: path.join(MINY, "Buildings", "Wood", "Workshops.png"), dest: path.join(PUBLIC, "buildings", "workshops.png") },
  { src: path.join(MINY, "Buildings", "Wood", "Keep.png"), dest: path.join(PUBLIC, "buildings", "keep.png") },
  { src: path.join(MINY, "Buildings", "Wood", "Tower.png"), dest: path.join(PUBLIC, "buildings", "tower.png") },
  { src: path.join(MINY, "Buildings", "Wood", "Barracks.png"), dest: path.join(PUBLIC, "buildings", "barracks.png") },
  { src: path.join(MINY, "Buildings", "Wood", "Chapels.png"), dest: path.join(PUBLIC, "buildings", "chapels.png") },
  { src: path.join(MINY, "Buildings", "Wood", "Resources.png"), dest: path.join(PUBLIC, "buildings", "resources.png") },
  { src: path.join(MINY, "Buildings", "Wood", "Docks.png"), dest: path.join(PUBLIC, "buildings", "docks.png") },

  // Nature
  { src: path.join(MINY, "Nature", "Trees.png"), dest: path.join(PUBLIC, "nature", "trees.png") },
  { src: path.join(MINY, "Nature", "PineTrees.png"), dest: path.join(PUBLIC, "nature", "pine-trees.png") },
  { src: path.join(MINY, "Nature", "Rocks.png"), dest: path.join(PUBLIC, "nature", "rocks.png") },
  { src: path.join(MINY, "Nature", "Wheatfield.png"), dest: path.join(PUBLIC, "nature", "wheatfield.png") },
  { src: path.join(MINY, "Nature", "DeadTrees.png"), dest: path.join(PUBLIC, "nature", "dead-trees.png") },

  // Miscellaneous
  { src: path.join(MINY, "Miscellaneous", "Well.png"), dest: path.join(PUBLIC, "misc", "well.png") },
  { src: path.join(MINY, "Miscellaneous", "Bridge.png"), dest: path.join(PUBLIC, "misc", "bridge.png") },
  { src: path.join(MINY, "Miscellaneous", "Signs.png"), dest: path.join(PUBLIC, "misc", "signs.png") },
  { src: path.join(MINY, "Miscellaneous", "Chests.png"), dest: path.join(PUBLIC, "misc", "chests.png") },
  { src: path.join(MINY, "Miscellaneous", "QuestBoard.png"), dest: path.join(PUBLIC, "misc", "quest-board.png") },
  { src: path.join(MINY, "Miscellaneous", "Tombstones.png"), dest: path.join(PUBLIC, "misc", "tombstones.png") },

  // Characters (Champions for agents, Farmer for player)
  { src: path.join(MINY, "Characters", "Champions", "Arthax.png"), dest: path.join(PUBLIC, "characters", "arthax.png") },
  { src: path.join(MINY, "Characters", "Champions", "Kanji.png"), dest: path.join(PUBLIC, "characters", "kanji.png") },
  { src: path.join(MINY, "Characters", "Champions", "Katan.png"), dest: path.join(PUBLIC, "characters", "katan.png") },
  { src: path.join(MINY, "Characters", "Champions", "Okomo.png"), dest: path.join(PUBLIC, "characters", "okomo.png") },
  { src: path.join(MINY, "Characters", "Champions", "Zhinja.png"), dest: path.join(PUBLIC, "characters", "zhinja.png") },
  { src: path.join(MINY, "Characters", "Workers", "FarmerTemplate.png"), dest: path.join(PUBLIC, "characters", "farmer.png") },

  // Animals
  { src: path.join(MINY, "Animals", "Sheep.png"), dest: path.join(PUBLIC, "animals", "sheep.png") },
  { src: path.join(MINY, "Animals", "Chicken.png"), dest: path.join(PUBLIC, "animals", "chicken.png") },
];

let copied = 0;
let failed = 0;

for (const entry of entries) {
  const destDir = path.dirname(entry.dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  if (!fs.existsSync(entry.src)) {
    console.error(`MISSING: ${entry.src}`);
    failed++;
    continue;
  }

  fs.copyFileSync(entry.src, entry.dest);
  console.log(`  OK: ${path.relative(ROOT, entry.dest)}`);
  copied++;
}

console.log(`\nDone: ${copied} copied, ${failed} failed.`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run the pack script**

Run: `npx tsx scripts/pack-minyworld-assets.ts`
Expected: All files copied successfully, 0 failures. New directories created under `public/sprites/buildings/`, `public/sprites/nature/`, `public/sprites/misc/`, `public/sprites/animals/`.

- [ ] **Step 3: Verify assets are in place**

Run: `find public/sprites -name "*.png" | sort`
Expected: All expected asset files listed under `public/sprites/tiles/`, `public/sprites/buildings/`, `public/sprites/nature/`, `public/sprites/misc/`, `public/sprites/characters/`, `public/sprites/animals/`.

- [ ] **Step 4: Add pack script to package.json**

In `package.json`, add to `"scripts"`:
```json
"pack-assets": "tsx scripts/pack-minyworld-assets.ts"
```

- [ ] **Step 5: Commit**

```bash
git add scripts/pack-minyworld-assets.ts public/sprites/ package.json
git commit -m "feat: add asset pack script and deploy MinyWorld + Puny World assets"
```

---

## Chunk 2: Map Generation Rewrite

### Task 3: Write the New Map Generator

**Files:**
- Create: `scripts/generate-settlement-map.ts`
- Output: `public/maps/arboria/arboria-market-town.json`

The new generator creates a 100×100 tile map using Puny World terrain GIDs for tilemap layers and an object layer for MinyWorld building/nature sprite placements.

**Key difference from old generator:** Buildings and decorative objects are NOT tile GIDs — they are entries in the `interactions` object layer with a `spriteKey` and `frame` property. The SettlementScene reads these and creates Phaser sprites. Only terrain is rendered via tile layers.

- [ ] **Step 1: Write terrain constants**

Create the file `scripts/generate-settlement-map.ts` with the Puny World terrain GID constants. These are derived from the `.tsx` file (27 columns, GID = tileId + 1 for Tiled firstgid=1):

```typescript
// scripts/generate-settlement-map.ts
/**
 * Arboria Settlement Map Generator — MinyWorld + Puny World Edition
 *
 * Generates a 100×100 Tiled-compatible JSON map.
 * - Terrain layers use Puny World tileset GIDs (1,755 tiles, 27 columns)
 * - Buildings/objects/NPCs are in the "interactions" object layer
 *
 * Run: npx tsx scripts/generate-settlement-map.ts
 */
import * as fs from "fs";
import * as path from "path";

// ── Puny World Terrain GIDs ───────────────────────────────────────
// tileset: 27 columns, 65 rows. GID = tileIndex + 1 (Tiled firstgid=1).
// Row = Math.floor(tileIndex / 27), Col = tileIndex % 27.
// These are the KEY terrain GIDs verified from the .tsx Wang tile definitions.

const PW = {
  // Grass variants — verified against .tsx wangset (all wangid 0,1,0,1,0,1,0,1)
  GRASS_1: 1,    // tileId 0 — plain grass
  GRASS_2: 2,    // tileId 1 — grass variant 2
  GRASS_3: 3,    // tileId 2 — grass variant 3
  GRASS_4: 29,   // tileId 28 — grass variant 4
  GRASS_5: 30,   // tileId 29 — grass variant 5
  GRASS_6: 56,   // tileId 55 — grass variant 6
  GRASS_7: 57,   // tileId 56 — grass variant 7
  GRASS_8: 58,   // tileId 57 — grass variant 8

  // Dirt path tiles (Wang edge pathways — wangset "pathways", wangcolor 1)
  // These GIDs are from the .tsx wangtile definitions for "dirt-paths"
  DIRT_PATH_S:     4,   // tileId 3  — south end (wangid 0,0,0,0,1,0,0,0)
  DIRT_PATH_SW:    5,   // tileId 4  — SW corner (wangid 0,0,1,0,1,0,0,0)
  DIRT_PATH_CROSS: 6,   // tileId 5  — crossroads (wangid 0,0,1,0,1,0,1,0)
  DIRT_PATH_SE:    7,   // tileId 6  — SE corner (wangid 0,0,0,0,1,0,1,0)
  DIRT_PATH_W:     31,  // tileId 30 — W side (wangid 1,0,0,0,1,0,0,0)
  DIRT_PATH_FULL:  32,  // tileId 31 — full intersection (wangid 1,0,1,0,1,0,0,0)
  DIRT_PATH_NS:    33,  // tileId 32 — NS straight (wangid 1,0,1,0,1,0,1,0)
  DIRT_PATH_E:     34,  // tileId 33 — E side (wangid 1,0,0,0,1,0,1,0)
  DIRT_PATH_N:     58,  // tileId 57 — north end (wangid 1,0,0,0,0,0,0,0)
  DIRT_PATH_NW:    59,  // tileId 58 — NW corner (wangid 1,0,1,0,0,0,0,0)
  DIRT_PATH_X:     60,  // tileId 59 — X intersection (wangid 1,0,1,0,0,0,1,0)
  DIRT_PATH_NE:    61,  // tileId 60 — NE corner (wangid 1,0,0,0,0,0,1,0)
  DIRT_HORIZ:      86,  // tileId 85 — horizontal segment (wangid 0,0,1,0,0,0,0,0)
  DIRT_DIAG:       87,  // tileId 86 — diagonal (wangid 0,0,1,0,0,0,1,0)
  DIRT_VERT:       88,  // tileId 87 — vertical segment (wangid 0,0,0,0,0,0,1,0)
  DIRT_END:        89,  // tileId 88 — end cap

  // River/Water tiles (Wang terrain type 7 = river)
  // Water edges defined by Wang tile mappings in .tsx
  WATER_TL: 279, // River corner top-left area
  WATER_T:  280, // River edge top
  WATER_TR: 281, // River corner top-right
  WATER_L:  306, // River edge left
  WATER_C:  307, // River center (full water)
  WATER_R:  308, // River edge right
  WATER_BL: 333, // River corner bottom-left
  WATER_B:  334, // River edge bottom
  WATER_BR: 335, // River corner bottom-right

  // Tree tiles (as terrain decoration — from Puny World)
  TREE_1: 120,   // Tree type 1
  TREE_2: 121,   // Tree type 2
  TREE_3: 122,   // Tree type 3
  TREE_4: 123,   // Tree type 4
  TREE_5: 124,   // Tree type 5

  // Cliff terrain (Wang terrain type 4 = cliff)
  CLIFF_TL: 147,
  CLIFF_T:  148,
  CLIFF_TR: 149,
  CLIFF_L:  175,
  CLIFF_C:  176,
  CLIFF_R:  151,
  CLIFF_BL: 203,
  CLIFF_B:  204,
  CLIFF_BR: 205,

  // Sand terrain (Wang terrain type 3)
  SAND: 310,  // Full sand tile

  // Animated water (uses animation frames defined in .tsx)
  WATER_ANIM_1: 271, // tileId 270 — animated water frame 1
  WATER_ANIM_2: 272, // tileId 271 — animated water frame 1
} as const;

const MAP_W = 100;
const MAP_H = 100;
const TILE_SIZE = 16;
```

- [ ] **Step 2: Write the terrain generation functions**

Add terrain generation logic — grass fill with variation, dirt path network, river system, cliff edges, and forest areas:

```typescript
// (continued in generate-settlement-map.ts)

// ── Layer Data ────────────────────────────────────────────────────
const ground: number[] = new Array(MAP_W * MAP_H).fill(PW.GRASS_1);
const paths: number[] = new Array(MAP_W * MAP_H).fill(0);
const collisions: number[] = new Array(MAP_W * MAP_H).fill(0);
const COLLISION = PW.GRASS_1; // Any valid GID; layer is invisible

// Object layer accumulator
interface MapObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: Array<{ name: string; type: string; value: string | number }>;
}
const objects: MapObject[] = [];
let nextObjId = 1;

// Seeded random for reproducibility
let seed = 42;
function rand(): number {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

function idx(x: number, y: number): number {
  return y * MAP_W + x;
}

function setTile(layer: number[], x: number, y: number, gid: number): void {
  if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) {
    layer[idx(x, y)] = gid;
  }
}

function fillRect(layer: number[], x: number, y: number, w: number, h: number, gid: number): void {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      setTile(layer, x + dx, y + dy, gid);
}

function addObject(
  name: string, type: string, tileX: number, tileY: number,
  props?: Record<string, string | number>
): void {
  const obj: MapObject = {
    id: nextObjId++,
    name,
    type,
    x: tileX * TILE_SIZE,
    y: tileY * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
  };
  if (props) {
    obj.properties = Object.entries(props).map(([name, value]) => ({
      name,
      type: typeof value === "number" ? "int" : "string",
      value,
    }));
  }
  objects.push(obj);
}

// ── 1. GROUND LAYER — Varied grass ───────────────────────────────
const grassTiles = [PW.GRASS_1, PW.GRASS_2, PW.GRASS_3, PW.GRASS_4, PW.GRASS_5, PW.GRASS_6, PW.GRASS_7, PW.GRASS_8];
for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    ground[idx(x, y)] = grassTiles[Math.floor(rand() * grassTiles.length)];
  }
}

// ── 2. RIVER — Diagonal from NW to SE ────────────────────────────
// A river running from top-left area toward bottom-right, with proper edge tiles
// (Simplified: 3-tile-wide water channel with edge tiles)
for (let i = 0; i < 80; i++) {
  const rx = Math.floor(10 + i * 0.8 + Math.sin(i * 0.15) * 4);
  const ry = Math.floor(5 + i * 1.1);
  if (ry >= MAP_H - 5) break;
  for (let w = -1; w <= 1; w++) {
    setTile(ground, rx + w, ry, PW.WATER_C);
    setTile(collisions, rx + w, ry, COLLISION);
  }
}

// ── 3. DIRT PATH NETWORK ─────────────────────────────────────────
// Main N-S road through town center (col 48-51, full height)
for (let y = 10; y < 90; y++) {
  setTile(paths, 49, y, PW.DIRT_VERT);
  setTile(paths, 50, y, PW.DIRT_VERT);
}

// E-W road through town center (row 48-51)
for (let x = 15; x < 85; x++) {
  setTile(paths, x, 49, PW.DIRT_HORIZ);
  setTile(paths, x, 50, PW.DIRT_HORIZ);
}

// Intersection
setTile(paths, 49, 49, PW.DIRT_PATH_CROSS);
setTile(paths, 50, 49, PW.DIRT_PATH_CROSS);
setTile(paths, 49, 50, PW.DIRT_PATH_CROSS);
setTile(paths, 50, 50, PW.DIRT_PATH_CROSS);

// ── 4. TREE BORDER — Ring of forest around map edges ─────────────
const treeTiles = [PW.TREE_1, PW.TREE_2, PW.TREE_3, PW.TREE_4, PW.TREE_5];
for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    const distFromEdge = Math.min(x, y, MAP_W - 1 - x, MAP_H - 1 - y);
    if (distFromEdge < 6 && rand() < 0.6 - distFromEdge * 0.08) {
      setTile(paths, x, y, treeTiles[Math.floor(rand() * treeTiles.length)]);
      setTile(collisions, x, y, COLLISION);
    }
  }
}
```

- [ ] **Step 3: Write building and NPC placement**

```typescript
// (continued in generate-settlement-map.ts)

// ── 5. BUILDINGS — Placed as objects, not tile GIDs ──────────────

// Town center buildings (around intersection)
// Houses along main road
const buildingPlacements: Array<{name: string; type: string; x: number; y: number; spriteKey: string; frame: number}> = [
  // Market square area (around 45-55, 44-48)
  { name: "Market Stall 1", type: "building", x: 44, y: 44, spriteKey: "bld-market", frame: 0 },
  { name: "Market Stall 2", type: "building", x: 46, y: 44, spriteKey: "bld-market", frame: 1 },
  { name: "Market Stall 3", type: "building", x: 55, y: 44, spriteKey: "bld-market", frame: 2 },
  { name: "Tavern", type: "building", x: 43, y: 46, spriteKey: "bld-taverns", frame: 0 },
  { name: "Chapel", type: "building", x: 56, y: 46, spriteKey: "bld-chapels", frame: 0 },

  // Residential area (north of intersection)
  { name: "House 1", type: "building", x: 44, y: 38, spriteKey: "bld-houses", frame: 0 },
  { name: "House 2", type: "building", x: 46, y: 38, spriteKey: "bld-houses", frame: 1 },
  { name: "House 3", type: "building", x: 48, y: 38, spriteKey: "bld-houses", frame: 2 },
  { name: "House 4", type: "building", x: 51, y: 38, spriteKey: "bld-houses", frame: 3 },
  { name: "House 5", type: "building", x: 53, y: 38, spriteKey: "bld-houses", frame: 4 },
  { name: "House 6", type: "building", x: 55, y: 38, spriteKey: "bld-houses", frame: 5 },
  { name: "Hut 1", type: "building", x: 44, y: 36, spriteKey: "bld-huts", frame: 0 },
  { name: "Hut 2", type: "building", x: 46, y: 36, spriteKey: "bld-huts", frame: 1 },

  // Workshop district (east of intersection)
  { name: "Workshop 1", type: "building", x: 58, y: 48, spriteKey: "bld-workshops", frame: 0 },
  { name: "Workshop 2", type: "building", x: 60, y: 48, spriteKey: "bld-workshops", frame: 1 },
  { name: "Barracks", type: "building", x: 58, y: 52, spriteKey: "bld-barracks", frame: 0 },
  { name: "Tower", type: "building", x: 62, y: 45, spriteKey: "bld-tower", frame: 0 },

  // Southern residential
  { name: "House 7", type: "building", x: 44, y: 55, spriteKey: "bld-houses", frame: 6 },
  { name: "House 8", type: "building", x: 46, y: 55, spriteKey: "bld-houses", frame: 7 },
  { name: "House 9", type: "building", x: 53, y: 55, spriteKey: "bld-houses", frame: 8 },
  { name: "House 10", type: "building", x: 55, y: 55, spriteKey: "bld-houses", frame: 9 },

  // Resources / farm area (west of intersection)
  { name: "Resource Store", type: "building", x: 38, y: 48, spriteKey: "bld-resources", frame: 0 },
  { name: "Keep", type: "building", x: 49, y: 42, spriteKey: "bld-keep", frame: 0 },

  // Wells and signs
  { name: "Town Well", type: "building", x: 48, y: 47, spriteKey: "misc-well", frame: 0 },
  { name: "Signpost N", type: "building", x: 49, y: 35, spriteKey: "misc-signs", frame: 0 },
  { name: "Signpost S", type: "building", x: 49, y: 60, spriteKey: "misc-signs", frame: 1 },
];

for (const bld of buildingPlacements) {
  addObject(bld.name, bld.type, bld.x, bld.y, {
    spriteKey: bld.spriteKey,
    frame: bld.frame,
  });
  // NOTE: Building collision is handled by BuildingManager's StaticGroup,
  // NOT the tile collision layer. Do NOT add tile collision here to avoid
  // double-collision physics jitter.
}

// ── 6. AGENTS ────────────────────────────────────────────────────
// Agent property names MUST match what npcManager.ts getProperties() reads:
//   props.agentId    — fallback ID (npcManager line 46)
//   props.agentName  — display name (npcManager line 47)
//   props.sprite     — spritesheet key (npcManager line 48)
//   props.zone       — map zone (used for context, not critical)
//   props.role       — agent role description
const agentPlacements = [
  { name: "Mira",   agentName: "Mira",   sprite: "chr-arthax", x: 47, y: 47, zone: "market_square", role: "guide" },
  { name: "Ledger", agentName: "Ledger", sprite: "chr-kanji",  x: 52, y: 47, zone: "market_square", role: "finance" },
  { name: "Archon", agentName: "Archon", sprite: "chr-katan",  x: 55, y: 40, zone: "scholars_quarter", role: "academia" },
  { name: "Forge",  agentName: "Forge",  sprite: "chr-okomo",  x: 59, y: 50, zone: "craftsmen_row", role: "programming" },
  { name: "Ember",  agentName: "Ember",  sprite: "chr-zhinja", x: 40, y: 50, zone: "commons", role: "roleplay" },
];

for (const agent of agentPlacements) {
  addObject(agent.name, "agent", agent.x, agent.y, {
    agentId: `agent-${agent.agentName.toLowerCase()}`,  // Required by npcManager fallback
    agentName: agent.agentName,
    sprite: agent.sprite,
    zone: agent.zone,
    role: agent.role,
  });
}

// ── 7. PLAYER SPAWN ──────────────────────────────────────────────
addObject("Player Spawn", "player_spawn", 49, 65, {});

// ── 8. LOTS — Buildable land ─────────────────────────────────────
const lotPositions = [
  { x: 35, y: 35 }, { x: 37, y: 35 }, { x: 62, y: 35 }, { x: 64, y: 35 },
  { x: 35, y: 55 }, { x: 37, y: 55 }, { x: 62, y: 55 }, { x: 64, y: 55 },
  { x: 30, y: 44 }, { x: 30, y: 46 }, { x: 68, y: 44 }, { x: 68, y: 46 },
];
for (const lot of lotPositions) {
  addObject(`Lot ${lot.x}-${lot.y}`, "lot", lot.x, lot.y, {});
}
```

- [ ] **Step 4: Write the JSON output**

```typescript
// (continued in generate-settlement-map.ts)

// ── OUTPUT — Tiled JSON ──────────────────────────────────────────
const tiledMap = {
  compressionlevel: -1,
  height: MAP_H,
  width: MAP_W,
  tilewidth: TILE_SIZE,
  tileheight: TILE_SIZE,
  infinite: false,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.10.2",
  version: "1.10",
  type: "map",
  tilesets: [
    {
      firstgid: 1,
      name: "punyworld-overworld",
      tilewidth: TILE_SIZE,
      tileheight: TILE_SIZE,
      tilecount: 1755,
      columns: 27,
      image: "../../sprites/tiles/punyworld-overworld-tileset.png",
      imagewidth: 432,
      imageheight: 1040,
      spacing: 0,
      margin: 0,
    },
  ],
  layers: [
    {
      id: 1,
      name: "ground",
      type: "tilelayer",
      width: MAP_W,
      height: MAP_H,
      data: ground,
      opacity: 1,
      visible: true,
      x: 0,
      y: 0,
    },
    {
      id: 2,
      name: "paths",
      type: "tilelayer",
      width: MAP_W,
      height: MAP_H,
      data: paths,
      opacity: 1,
      visible: true,
      x: 0,
      y: 0,
    },
    {
      id: 3,
      name: "collisions",
      type: "tilelayer",
      width: MAP_W,
      height: MAP_H,
      data: collisions,
      opacity: 1,
      visible: false,
      x: 0,
      y: 0,
    },
    {
      id: 4,
      name: "interactions",
      type: "objectgroup",
      objects,
      opacity: 1,
      visible: true,
      x: 0,
      y: 0,
    },
  ],
};

const outPath = path.resolve(__dirname, "..", "public", "maps", "arboria", "arboria-market-town.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(tiledMap, null, 2));
console.log(`Map written to ${outPath}`);
console.log(`  Size: ${MAP_W}×${MAP_H} tiles (${MAP_W * TILE_SIZE}×${MAP_H * TILE_SIZE}px)`);
console.log(`  Objects: ${objects.length}`);
```

- [ ] **Step 5: Run the map generator**

Run: `npx tsx scripts/generate-settlement-map.ts`
Expected: Map written to `public/maps/arboria/arboria-market-town.json` with 100×100 tiles and ~40+ objects.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-settlement-map.ts public/maps/arboria/arboria-market-town.json
git commit -m "feat: new settlement map generator using Puny World terrain + MinyWorld objects"
```

---

## Chunk 3: Engine Code Updates

### Task 4: Update BootScene to Load New Assets

**Files:**
- Modify: `src/engine/settlement/scenes/BootScene.ts`

- [ ] **Step 1: Rewrite BootScene preload to use asset manifest**

Replace the entire `preload()` method:

```typescript
// src/engine/settlement/scenes/BootScene.ts
import Phaser from "phaser";
import {
  TERRAIN, TILEMAP, getAllSpritesheets,
} from "../assetManifest";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  private loadFailed = false;

  preload(): void {
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.error(`[BootScene] Failed to load: ${file.key} (${file.url})`);
      this.loadFailed = true;
    });

    // Terrain tileset (Puny World)
    this.load.image(TERRAIN.key, TERRAIN.path);

    // All MinyWorld spritesheets (buildings, nature, misc, characters, animals)
    for (const entry of getAllSpritesheets()) {
      this.load.spritesheet(entry.key, entry.path, {
        frameWidth: entry.fw,
        frameHeight: entry.fh,
      });
    }

    // Region map assets (unchanged)
    this.load.image("arboria-tiles", "/sprites/tiles/arboria-tileset.png");
    this.load.tilemapTiledJSON("arboria-region", "/maps/arboria/arboria-region.json");

    // Settlement tilemap
    this.load.tilemapTiledJSON(TILEMAP.key, TILEMAP.path);
  }

  create(): void {
    if (this.loadFailed) {
      this.add
        .text(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          "Asset loading failed.\nCheck console for details.",
          { fontSize: "10px", color: "#ff4444", fontFamily: "monospace", align: "center" }
        )
        .setOrigin(0.5);
      return;
    }

    this.game.registry.set("bootComplete", true);
    this.game.events.emit("bootComplete");
    this.scene.start("RegionMapScene");
  }
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/engine/settlement/scenes/BootScene.ts
git commit -m "refactor: BootScene loads MinyWorld + Puny World assets via manifest"
```

---

### Task 5: Create BuildingManager

**Files:**
- Create: `src/engine/settlement/buildingManager.ts`

This new class reads building objects from the Tiled object layer and creates Phaser sprites for each one, with collision bodies.

- [ ] **Step 1: Write BuildingManager**

```typescript
// src/engine/settlement/buildingManager.ts
import Phaser from "phaser";

interface BuildingInstance {
  name: string;
  sprite: Phaser.GameObjects.Sprite;
  body: Phaser.Physics.Arcade.StaticBody;
}

/**
 * BuildingManager — creates Phaser sprites from Tiled "building" objects.
 * Each building is a single 16×16 sprite from a MinyWorld spritesheet.
 */
export class BuildingManager {
  private buildings: BuildingInstance[] = [];
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup;

  constructor(
    private scene: Phaser.Scene,
    buildingObjects: Phaser.Types.Tilemaps.TiledObject[]
  ) {
    this.collisionGroup = scene.physics.add.staticGroup();

    for (const obj of buildingObjects) {
      if (obj.type !== "building" || !obj.x || !obj.y) continue;

      const props = this.getProperties(obj);
      const spriteKey = props.spriteKey;
      const frame = parseInt(props.frame || "0", 10);

      if (!spriteKey) {
        console.warn(`[BuildingManager] Missing spriteKey for ${obj.name}`);
        continue;
      }

      const sprite = scene.add.sprite(
        obj.x + 8, // Center on tile (Tiled uses top-left origin)
        obj.y + 8,
        spriteKey,
        frame
      );
      sprite.setDepth(5);

      // Add static physics body for collision
      const body = scene.physics.add.existing(sprite, true) as unknown;
      this.collisionGroup.add(sprite);

      this.buildings.push({
        name: obj.name,
        sprite,
        body: sprite.body as Phaser.Physics.Arcade.StaticBody,
      });
    }
  }

  private getProperties(obj: Phaser.Types.Tilemaps.TiledObject): Record<string, string> {
    const result: Record<string, string> = {};
    if (obj.properties) {
      for (const prop of obj.properties as Array<{ name: string; value: string | number }>) {
        result[prop.name] = String(prop.value);
      }
    }
    return result;
  }

  getCollisionGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.collisionGroup;
  }

  destroy(): void {
    for (const bld of this.buildings) {
      bld.sprite.destroy();
    }
    this.buildings = [];
    this.collisionGroup.destroy(true);
  }
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/engine/settlement/buildingManager.ts
git commit -m "feat: add BuildingManager for sprite-based MinyWorld buildings"
```

---

### Task 6: Update SettlementScene

**Files:**
- Modify: `src/engine/settlement/scenes/SettlementScene.ts`

- [ ] **Step 1: Rewrite SettlementScene to use Puny World terrain + BuildingManager**

The key changes:
1. Tileset name changes from `"kenney-tiny-town"` to `"punyworld-overworld"`
2. Layer names change: `"ground"`, `"paths"` (was `"buildings"`, `"decorations"`)
3. Buildings come from BuildingManager, not tile layers
4. Collision uses both tile collision layer AND building collision group

```typescript
// src/engine/settlement/scenes/SettlementScene.ts
import Phaser from "phaser";
import { PlayerController } from "../playerController";
import { NpcManager } from "../npcManager";
import { BuildingManager } from "../buildingManager";
import { useWorldStore } from "@/stores/worldStore";
import { WeatherEngine } from "@/engine/region/weatherEngine";
import { LightingEngine } from "@/engine/region/lightingEngine";
import { WeatherEffects } from "../weatherEffects";
import { getSeasonTint } from "@/engine/region/seasonEngine";
import { supabaseAnon } from "@/lib/supabase/anonClient";
import { TERRAIN, TILEMAP } from "../assetManifest";

export class SettlementScene extends Phaser.Scene {
  private playerController!: PlayerController;
  private npcManager!: NpcManager;
  private buildingManager!: BuildingManager;
  private lightingEngine!: LightingEngine;
  private weatherEffects!: WeatherEffects;
  private transitioning = false;
  private lastAppliedSeason = "";
  private tintedLayers: Phaser.Tilemaps.TilemapLayer[] = [];

  constructor() {
    super({ key: "SettlementScene" });
  }

  create(): void {
    this.transitioning = false;

    // 1. Load tilemap
    const map = this.make.tilemap({ key: TILEMAP.key });

    // 2. Add Puny World tileset
    const tileset = map.addTilesetImage(TERRAIN.key, TERRAIN.key);
    if (!tileset) {
      console.error("[SettlementScene] Failed to add tileset");
      this.add
        .text(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          "Tileset error — check console",
          { fontSize: "10px", color: "#ff4444", fontFamily: "monospace" }
        )
        .setOrigin(0.5);
      return;
    }

    // 3. Create terrain layers
    const groundLayer = map.createLayer("ground", tileset);
    const pathsLayer = map.createLayer("paths", tileset);

    groundLayer?.setDepth(0);
    pathsLayer?.setDepth(1);

    // 4. Collision layer (invisible)
    const collisionLayer = map.createLayer("collisions", tileset);
    if (collisionLayer) {
      collisionLayer.setVisible(false);
      collisionLayer.setCollisionByExclusion([-1, 0]);
    }

    // 5. Get object layer
    const objectLayer = map.getObjectLayer("interactions");
    let spawnX = 49 * 16;
    let spawnY = 65 * 16;

    if (objectLayer) {
      const spawnObj = objectLayer.objects.find((o) => o.type === "player_spawn");
      if (spawnObj?.x !== undefined && spawnObj?.y !== undefined) {
        spawnX = spawnObj.x;
        spawnY = spawnObj.y;
      }
    }

    // 6. Create buildings from object layer
    const buildingObjects = objectLayer
      ? objectLayer.objects.filter((o) => o.type === "building")
      : [];
    this.buildingManager = new BuildingManager(this, buildingObjects);

    // 7. Create player
    this.playerController = new PlayerController(this, spawnX, spawnY);

    // 8. Collisions — player vs tile collision layer + building sprites
    if (collisionLayer) {
      this.physics.add.collider(this.playerController.sprite, collisionLayer);
    }
    this.physics.add.collider(
      this.playerController.sprite,
      this.buildingManager.getCollisionGroup()
    );

    // 9. NPCs
    const npcObjects = objectLayer
      ? objectLayer.objects.filter((o) => o.type === "agent")
      : [];
    this.npcManager = new NpcManager(this, npcObjects, this.playerController.sprite);
    this.fetchAndEnrichAgents();

    // 10. Camera
    const mapWidth = map.widthInPixels;
    const mapHeight = map.heightInPixels;
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    // 11. Weather & lighting
    let weatherEngine = this.game.registry.get("weatherEngine") as WeatherEngine | undefined;
    if (!weatherEngine) {
      weatherEngine = new WeatherEngine("temperate_deciduous_forest");
      this.game.registry.set("weatherEngine", weatherEngine);
    }
    weatherEngine.start();

    this.tintedLayers = [groundLayer, pathsLayer].filter(
      (l): l is Phaser.Tilemaps.TilemapLayer => l !== null
    );

    this.lastAppliedSeason = weatherEngine.getCurrentSeason();
    const seasonTint = getSeasonTint(this.lastAppliedSeason);
    for (const layer of this.tintedLayers) layer.setTint(seasonTint);

    this.lightingEngine = new LightingEngine(this);
    this.weatherEffects = new WeatherEffects(this, weatherEngine);

    // 12. M key to return to regional map
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-M", () => {
        if (this.transitioning) return;
        this.transitioning = true;
        this.playerController?.sprite?.setVelocity(0);
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.cleanup();
          useWorldStore.getState().returnToRegionMap();
          this.scene.start("RegionMapScene");
        });
      });
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.cameras.main.fadeIn(500, 0, 0, 0);

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/world/arboria/market-town");
    }
  }

  update(): void {
    if (this.transitioning) return;
    if (this.playerController) this.playerController.update();
    if (this.npcManager && this.playerController) {
      this.npcManager.update(this.playerController.sprite);
    }
    if (this.lightingEngine) this.lightingEngine.update();
    if (this.weatherEffects) this.weatherEffects.update();

    const we = this.game.registry.get("weatherEngine") as WeatherEngine | undefined;
    if (we) {
      const currentSeason = we.getCurrentSeason();
      if (currentSeason !== this.lastAppliedSeason) {
        this.lastAppliedSeason = currentSeason;
        const tint = getSeasonTint(currentSeason);
        for (const layer of this.tintedLayers) layer.setTint(tint);
      }
    }
  }

  private async fetchAndEnrichAgents(): Promise<void> {
    try {
      const { data: agents, error } = await supabaseAnon
        .from("agents")
        .select("id, name, capabilities, status")
        .eq("settlement", "arboria_market_town");

      if (error || !agents) {
        console.warn("[SettlementScene] Failed to fetch agents:", error?.message);
        return;
      }

      if (this.npcManager) {
        this.npcManager.enrichWithAgentData(agents);
      }
    } catch (err) {
      console.warn("[SettlementScene] Agent fetch error:", err);
    }
  }

  private cleanup(): void {
    if (this.lightingEngine) this.lightingEngine.destroy();
    if (this.weatherEffects) this.weatherEffects.destroy();
    if (this.buildingManager) this.buildingManager.destroy();
    if (this.npcManager) this.npcManager.destroy();
    if (this.playerController) this.playerController.destroy();
    useWorldStore.getState().setNearbyAgent(null);
  }
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/engine/settlement/scenes/SettlementScene.ts
git commit -m "refactor: SettlementScene uses Puny World terrain + BuildingManager"
```

---

### Task 7: Update NpcManager for MinyWorld Characters

**Files:**
- Modify: `src/engine/settlement/npcManager.ts`

- [ ] **Step 1: Update default sprite and idle animation**

The MinyWorld Champion spritesheets have different frame layouts than the old 2-frame Kenney sprites. Champions are 5-6 columns × 8 rows. The idle animation should cycle through the first row (frames 0-4 for a 5-column sheet, or 0-5 for 6-column).

Change line 48 (`sprite: props.sprite || "npc-assistant"`) to:
```typescript
sprite: props.sprite || "chr-arthax",
```

Change the idle animation (lines 100-108) from toggling frames 0-1 to cycling through the first row:
```typescript
    // Idle animation: cycle through first row of frames every 400ms.
    // Column count varies per champion (5 or 6), so we detect it from
    // the spritesheet's total frame count and known row count.
    const totalFrames = sprite.texture.frameTotal - 1; // Phaser adds a __BASE frame
    // Champions are either 5×8, 6×8, 5×12, or 6×9 — first row = cols frames
    // Heuristic: cols = totalFrames <= 40 ? 5 : 6 (or read from manifest)
    const cols = (totalFrames % 6 === 0 && totalFrames > 40) ? 6 : 5;
    let idleFrame = 0;
    const idleTimer = this.scene.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        idleFrame = (idleFrame + 1) % cols;
        sprite.setFrame(idleFrame);
      },
    });
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/engine/settlement/npcManager.ts
git commit -m "refactor: NpcManager uses MinyWorld character sprites"
```

---

### Task 8: Update PlayerController for MinyWorld Character

**Files:**
- Modify: `src/engine/settlement/playerController.ts`

- [ ] **Step 1: Update player sprite key and animation frames**

The MinyWorld FarmerTemplate is 80×192 = 5 cols × 12 rows at 16×16.
Row layout (typical MinyWorld): rows 0-2 = idle/walk down, rows 3-5 = idle/walk left, rows 6-8 = idle/walk right, rows 9-11 = idle/walk up.

Update line 26 to use the manifest:
```typescript
import { CHARACTERS } from "../assetManifest";
```

Change sprite creation (line 26):
```typescript
this.sprite = scene.physics.add.sprite(spawnX, spawnY, CHARACTERS.player.key, 0);
```

Update `createAnimations` to match MinyWorld Farmer frame layout:
```typescript
  private createAnimations(scene: Phaser.Scene): void {
    const cols = CHARACTERS.player.cols; // 5
    const directions: Array<{ key: string; startRow: number }> = [
      { key: "walk-down", startRow: 0 },
      { key: "walk-left", startRow: 3 },
      { key: "walk-right", startRow: 6 },
      { key: "walk-up", startRow: 9 },
    ];

    for (const dir of directions) {
      if (!scene.anims.exists(dir.key)) {
        scene.anims.create({
          key: dir.key,
          frames: scene.anims.generateFrameNumbers(CHARACTERS.player.key, {
            start: dir.startRow * cols,
            end: dir.startRow * cols + cols - 1,
          }),
          frameRate: 8,
          repeat: -1,
        });
      }
    }
  }
```

Update idle frame mapping:
```typescript
      const cols = CHARACTERS.player.cols;
      const idleFrames: Record<string, number> = {
        down: 0,
        left: 3 * cols,
        right: 6 * cols,
        up: 9 * cols,
      };
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/engine/settlement/playerController.ts
git commit -m "refactor: PlayerController uses MinyWorld Farmer sprite"
```

---

### Task 9: Delete Old Map Generator

**Files:**
- Delete: `scripts/generate-arboria-map.ts`

- [ ] **Step 1: Remove old generator**

Run: `git rm scripts/generate-arboria-map.ts`

- [ ] **Step 2: Update package.json scripts**

Replace `"generate-map"` script (if it exists) to point to the new generator:
```json
"generate-map": "tsx scripts/generate-settlement-map.ts"
```

- [ ] **Step 3: Remove old Kenney assets from public/**

```bash
rm public/sprites/tiles/tilemap_packed.png
rm public/sprites/characters/npc-assistant.png
rm public/sprites/characters/npc-researcher.png
rm public/sprites/characters/npc-merchant.png
```

Keep `public/sprites/tiles/arboria-tileset.png` (still used by region map).
Keep `public/sprites/characters/player.png` until the new farmer sprite is verified working.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove Kenney Tiny Town assets and old map generator"
```

---

## Chunk 4: Documentation Updates

### Task 10: Mark Old Plan as Superseded

**Files:**
- Modify: `docs/superpowers/plans/2026-03-19-phase-2-5-arboria-visual-reimagining.md`

- [ ] **Step 1: Add superseded notice at top of file**

Insert BEFORE the existing `# Phase 2.5` heading (the file starts with `#`, no YAML frontmatter):
```markdown
> **⚠️ SUPERSEDED** — This plan has been replaced by [2026-03-23 MinyWorld + Puny World Asset Migration](./2026-03-23-minyworld-punyworld-asset-migration.md). The Kenney Tiny Town approach was abandoned due to multi-tile assembly complexity. MinyWorld single-tile buildings + Puny World terrain provide a better path.

```
This goes above line 1. The existing `# Phase 2.5 — Arboria Visual Reimagining Implementation Plan` stays intact below it.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/2026-03-19-phase-2-5-arboria-visual-reimagining.md
git commit -m "docs: mark old Kenney visual plan as superseded"
```

---

### Task 11: Update Design Spec

**Files:**
- Modify: `docs/superpowers/specs/2026-03-19-arboria-visual-reimagining-design.md`

- [ ] **Step 1: Update Section 2 (Asset Inventory)**

Replace the Kenney asset inventory with MinyWorld + Puny World inventory:

```markdown
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
```

- [ ] **Step 2: Update Section 10 (Tiled Map Technical Specification)**

```markdown
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
```

- [ ] **Step 3: Update Section 12 (Migration)**

```markdown
## 12. Migration from Current Assets

### Replaced
- Kenney Tiny Town tileset (`tilemap_packed.png`) → Puny World terrain tileset
- Kenney multi-tile building GIDs → MinyWorld single-tile building sprites
- Generic NPC spritesheets → MinyWorld Champion character sprites
- 64×64 tile map → 100×100 tile map

### Architecture Change
- **Before:** Single tileset, all content (terrain + buildings + decorations) as tile GIDs in tilemap layers
- **After:** Hybrid — Puny World tileset for terrain layers + MinyWorld sprites for buildings/objects via object layer + BuildingManager
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-03-19-arboria-visual-reimagining-design.md
git commit -m "docs: update design spec for MinyWorld + Puny World migration"
```

---

### Task 12: Runtime Smoke Test

After all code tasks (4-9) are complete, run a visual acceptance test.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Dev server starts without errors.

- [ ] **Step 2: Open the settlement in browser**

Navigate to the settlement scene. Verify:
- [ ] Terrain renders (grass variants visible, no black/missing tiles)
- [ ] Dirt paths are visible and form a cross-shaped road network
- [ ] River/water tiles render (static is OK for MVP, animated is bonus)
- [ ] Forest border of trees around map edges
- [ ] Buildings render as single 16×16 sprites in the town area (houses, tavern, market, keep, etc.)
- [ ] Player character (Farmer) renders and walks in 4 directions with WASD
- [ ] NPC agents are visible with idle animation cycling
- [ ] Walking into buildings triggers collision (player stops)
- [ ] Walking near an agent shows "Press E to talk to [Name]" prompt
- [ ] Camera follows player and stays within map bounds
- [ ] M key transitions back to region map

- [ ] **Step 3: Check console for errors**

Open browser DevTools console. Verify:
- [ ] No `loaderror` warnings from BootScene
- [ ] No `frame out of range` errors from sprite animations
- [ ] No physics collision errors

- [ ] **Step 4: Commit if all passes**

```bash
git add -A
git commit -m "chore: verified MinyWorld + Puny World migration renders correctly"
```

---

## Execution Order Summary

| Order | Task | Depends On |
|-------|------|-----------|
| 1 | Asset Manifest | Nothing |
| 2 | Asset Pack Script | Task 1 (paths must match) |
| 3 | Map Generator | Task 1 (terrain constants) |
| 4 | BootScene Update | Task 1 (imports manifest) |
| 5 | BuildingManager | Task 1 (sprite keys) |
| 6 | SettlementScene Update | Tasks 4, 5 |
| 7 | NpcManager Update | Task 1 |
| 8 | PlayerController Update | Task 1 |
| 9 | Delete Old Assets | Tasks 4-8 all working |
| 10 | Mark Old Plan Superseded | Nothing (can run anytime) |
| 11 | Update Design Spec | After code tasks verified |
| 12 | Runtime Smoke Test | Tasks 4-9 all complete |

**Parallelizable:** Tasks 1, 10 can run immediately. Tasks 4, 5, 7, 8 can run in parallel after Task 1. Task 3 can run after Task 2. Task 12 must be last code task.

---

## Chunk 5: Map Generator Enhancement (Task 3 v2)

> **Context:** The MVP map generator (Task 3) produces a functional but visually sparse settlement. Comparing to the MinyWorld reference maps (`Design Assets/MinyWorld Assets/Example-maps-and-layouts/1DNf6A.png`), the current output is missing dense forests, organic paths, proper river bank transitions, terrain biome variation, decorative objects, and tight building clustering. This chunk rewrites the terrain/decoration generation in `generate-settlement-map.ts` to match the visual richness of the inspiration maps.

### What's Missing — Gap Analysis

| # | Element | Inspiration Map | Current Generator |
|---|---------|----------------|-------------------|
| 1 | **Dense forests** | Thick tree clusters ring the town, scattered copses throughout. Uses Wang tree tiles (color 6) for proper forest canopy with edge transitions | Thin sparse border at map edges using 5 single tree GIDs. No Wang edge transitions. No interior forest clusters |
| 2 | **Organic path network** | Winding dirt roads branch, curve, and connect organically to buildings and districts. Multiple path widths. Intersections use proper Wang corner tiles | Rigid N-S and E-W cross using only `DIRT_VERT` and `DIRT_HORIZ`. No curves, no branching, no connection to buildings |
| 3 | **River bank transitions** | Rivers use Wang corner tiles (color 7): outer corners, edge tiles, inner corners for concave bends. Smooth grass→bank→water transitions | 3-tile-wide solid `WATER_C` with no edge tiles. Harsh cyan rectangles against grass |
| 4 | **Terrain biome zones** | Multiple grass shades form natural clusters — dark meadows, light clearings. Coherent zones, not per-tile noise | Random per-tile grass variant selection creates visual static instead of natural zones |
| 5 | **Building density** | 40-60+ buildings tightly packed in a town center with organic non-grid layout. Alleys and courtyards emerge naturally | 27 buildings on a sparse grid. Too spread out. Feels empty |
| 6 | **Decorative objects** | Rocks, wheat fields, flower patches, fences scattered throughout. Every area has visual interest | Zero decoration sprites placed. Wheat, rocks, chests, tombstones loaded but never used |
| 7 | **Farm/crop areas** | Organized wheat fields and farmland near settlement edges | Wheatfield spritesheet loaded but never placed |
| 8 | **Road-to-building connection** | Paths lead TO buildings, connecting districts organically | Paths are independent of building placement — buildings float on grass |
| 9 | **Multiple forest types** | Mix of deciduous and pine trees creating varied forest character | Only Puny World tree tile variants used. No MinyWorld tree sprites |
| 10 | **Terrain transitions** | Grass→dirt areas around buildings/paths using Wang dirt tiles (color 2). Sand near water using Wang sand tiles (color 3) | No terrain transitions except paths overlay |

### Corrected Puny World GID Reference

The current PW constants have naming errors for river tiles. The correct Wang corner mappings (verified against `.tsx` wangid values) are:

**Wang corner system:** `wangid="0,TR,0,BR,0,BL,0,TL"` — only corner positions matter for corner-type wangsets. Color 1=grass, 7=river.

```
River body layout (tiles form a rectangular water area):

  OUTER_TL  OUTER_T   OUTER_TR     ← grass above, water below
  OUTER_L   CENTER    OUTER_R      ← grass on sides, water in middle
  OUTER_BL  OUTER_B   OUTER_BR     ← water above, grass below
```

```typescript
// CORRECTED river GIDs (GID = tileId + 1):
RIVER_OUTER_TL: 278,  // tileId 277 — TR=1,BR=7,BL=1,TL=1 (water starts at bottom-right)
RIVER_OUTER_T:  279,  // tileId 278 — TR=1,BR=7,BL=7,TL=1 (water below, grass above)
RIVER_OUTER_TR: 280,  // tileId 279 — TR=1,BR=1,BL=7,TL=1 (water starts at bottom-left)
RIVER_INNER_TL: 281,  // tileId 280 — TR=7,BR=7,BL=7,TL=1 (concave: grass only at TL)
RIVER_INNER_TR: 282,  // tileId 281 — TR=1,BR=7,BL=7,TL=7 (concave: grass only at TR)
RIVER_OUTER_L:  305,  // tileId 304 — TR=7,BR=7,BL=1,TL=1 (water right, grass left)
RIVER_CENTER:   306,  // tileId 305 — TR=7,BR=7,BL=7,TL=7 (full water)
RIVER_OUTER_R:  307,  // tileId 306 — TR=1,BR=1,BL=7,TL=7 (water left, grass right)
RIVER_INNER_BL: 308,  // tileId 307 — TR=7,BR=7,BL=1,TL=7 (concave: grass only at BL)
RIVER_INNER_BR: 309,  // tileId 308 — TR=7,BR=1,BL=7,TL=7 (concave: grass only at BR)
RIVER_OUTER_BL: 332,  // tileId 331 — TR=7,BR=1,BL=1,TL=1 (water above-right only)
RIVER_OUTER_B:  333,  // tileId 332 — TR=7,BR=1,BL=1,TL=7 (water above, grass below)
RIVER_OUTER_BR: 334,  // tileId 333 — TR=1,BR=1,BL=1,TL=7 (water above-left only)
```

**Wang tree tiles (color 6 on air/5 base) — for forest canopy overlay in paths layer:**

```typescript
// Forest canopy tiles — place in paths layer to create dense forests
FOREST_OUTER_TL: 190,  // tileId 189 — forest starts at BR corner
FOREST_OUTER_T:  191,  // tileId 190 — forest below, air above
FOREST_OUTER_TR: 192,  // tileId 191 — forest starts at BL corner
FOREST_INNER_TL: 193,  // tileId 192 — air only at TL (concave)
FOREST_INNER_TR: 194,  // tileId 193 — air only at TR (concave)
FOREST_OUTER_L:  217,  // tileId 216 — forest right, air left
FOREST_CENTER:   218,  // tileId 217 — full forest canopy
FOREST_OUTER_R:  219,  // tileId 218 — forest left, air right
FOREST_INNER_BL: 223,  // tileId 222 — air only at BL (concave)
FOREST_INNER_BR: 224,  // tileId 223 — air only at BR (concave)
FOREST_OUTER_BL: 244,  // tileId 243 — forest above-right only
FOREST_OUTER_B:  245,  // tileId 244 — forest above, air below
FOREST_OUTER_BR: 246,  // tileId 245 — forest above-left only
FOREST_V_STRIP:  250,  // tileId 249 — vertical 1-wide forest
FOREST_H_STRIP:  251,  // tileId 250 — horizontal 1-wide forest
```

**Wang trees2 tiles (color 12 on air/5 base) — second forest type (pine/brown):**

```typescript
FOREST2_OUTER_TL: 202,  // tileId 201
FOREST2_OUTER_T:  203,  // tileId 202
FOREST2_OUTER_TR: 204,  // tileId 203
FOREST2_INNER_TL: 205,  // tileId 204
FOREST2_INNER_TR: 206,  // tileId 205
FOREST2_OUTER_L:  226,  // tileId 225 (row below)
FOREST2_CENTER:   227,  // tileId 226
FOREST2_OUTER_R:  228,  // tileId 227
FOREST2_INNER_BL: 232,  // tileId 231
FOREST2_INNER_BR: 233,  // tileId 232
FOREST2_OUTER_BL: 253,  // tileId 252
FOREST2_OUTER_B:  254,  // tileId 253
FOREST2_OUTER_BR: 255,  // tileId 254
FOREST2_V_STRIP:  259,  // tileId 258
FOREST2_H_STRIP:  260,  // tileId 259
```

**Dirt-on-grass Wang tiles (color 2 on grass/1 base) — for dirt patches around buildings:**

```typescript
// Dirt terrain patches — place in ground layer to create worn areas around buildings
DIRT_OUTER_TL: 11,   // tileId 10 — dirt starts at BR
DIRT_OUTER_T:  12,   // tileId 11 — dirt below
DIRT_OUTER_TR: 13,   // tileId 12 — dirt starts at BL
DIRT_INNER_TL: 14,   // tileId 13 — concave (grass only at TL)
DIRT_INNER_TR: 15,   // tileId 14 — concave (grass only at TR)
DIRT_OUTER_L:  38,   // tileId 37 — dirt right
DIRT_FULL:     39,   // tileId 38 — full dirt
DIRT_OUTER_R:  40,   // tileId 39 — dirt left
DIRT_INNER_BL: 41,   // tileId 40 — concave (grass only at BL)
DIRT_INNER_BR: 42,   // tileId 41 — concave (grass only at BR)
DIRT_OUTER_BL: 65,   // tileId 64 — dirt above-right
DIRT_OUTER_B:  66,   // tileId 65 — dirt above
DIRT_OUTER_BR: 67,   // tileId 66 — dirt above-left
DIRT_V_STRIP:  68,   // tileId 67 — vertical 1-wide dirt
DIRT_H_STRIP:  69,   // tileId 68 — horizontal 1-wide dirt
```

---

### Task 13: Rewrite Map Generator — Terrain Biomes & Forest Canopy

**Files:**
- Modify: `scripts/generate-settlement-map.ts`

**Overview:** Replace the simplistic terrain generation (random grass, straight paths, bare water, thin tree border) with noise-based biome zones, Wang-tiled forest canopy, and proper river bank transitions.

- [ ] **Step 1: Add simplex noise function**

Add a 2D value noise implementation (no dependencies) at the top of the file, after the PW constants. This creates smooth, natural-looking zones instead of per-tile randomness.

```typescript
// ── Simplex-like 2D noise (self-contained, no deps) ──────────────
// Returns values in range [0, 1] for coordinates (x, y).
// Scale controls zoom level — lower = larger blobs.
function noise2D(x: number, y: number, scale: number = 0.05): number {
  const nx = x * scale;
  const ny = y * scale;
  // Multiple octaves of seeded hash for organic feel
  let val = 0;
  let amp = 1;
  let freq = 1;
  let maxAmp = 0;
  for (let o = 0; o < 4; o++) {
    val += amp * hashNoise(nx * freq, ny * freq);
    maxAmp += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return (val / maxAmp + 1) / 2; // Normalize to [0, 1]
}

function hashNoise(x: number, y: number): number {
  // Deterministic pseudo-random based on coords
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  const n2 = Math.sin(x * 269.5 + y * 183.3) * 28001.8384;
  return Math.sin(n + n2);
}
```

- [ ] **Step 2: Replace grass generation with biome zones**

Replace the current grass loop (section 1) with noise-based grass clustering:

```typescript
// ── 1. GROUND LAYER — Noise-based grass biomes ───────────────────
// Group similar grass variants into "biome" clusters using noise.
// Low noise → dark grass (variants 1-3), high noise → light grass (variants 6-8).
const darkGrass = [PW.GRASS_1, PW.GRASS_2, PW.GRASS_3];
const midGrass = [PW.GRASS_4, PW.GRASS_5];
const lightGrass = [PW.GRASS_6, PW.GRASS_7, PW.GRASS_8];

for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    const n = noise2D(x, y, 0.06);
    let pool: number[];
    if (n < 0.35) pool = darkGrass;
    else if (n < 0.65) pool = midGrass;
    else pool = lightGrass;
    ground[idx(x, y)] = pool[Math.floor(rand() * pool.length)];
  }
}
```

- [ ] **Step 3: Rewrite river with Wang bank transitions**

Replace the current river (section 2) with a wider, sinusoidal river using proper edge GIDs. First, paint the river body into a boolean grid, then resolve each tile's Wang variant by checking its 4 neighbors:

```typescript
// ── 2. RIVER — Sinusoidal with Wang bank transitions ─────────────
// Step A: Paint river body into a boolean grid
const isWater: boolean[] = new Array(MAP_W * MAP_H).fill(false);

for (let i = 0; i < 95; i++) {
  // River flows from upper-left to lower-right with sine curves
  const rx = Math.floor(12 + i * 0.85 + Math.sin(i * 0.12) * 6);
  const ry = Math.floor(3 + i * 1.0);
  if (ry >= MAP_H - 3) break;
  // River width varies 3-5 tiles
  const width = 2 + Math.floor(Math.sin(i * 0.08) + 1.5);
  for (let w = -width; w <= width; w++) {
    const wx = rx + w;
    if (wx >= 0 && wx < MAP_W && ry >= 0 && ry < MAP_H) {
      isWater[idx(wx, ry)] = true;
    }
  }
}

// Step B: Resolve each water-adjacent tile using Wang corners
// Wang corner convention: check if each corner's diagonal neighbor is water
for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    if (!isWater[idx(x, y)] && !hasWaterNeighbor(x, y)) continue;

    // Get corner states: is the terrain at each corner "water"?
    const tl = isW(x - 1, y - 1) && isW(x - 1, y) && isW(x, y - 1);
    const tr = isW(x + 1, y - 1) && isW(x + 1, y) && isW(x, y - 1);
    const bl = isW(x - 1, y + 1) && isW(x - 1, y) && isW(x, y + 1);
    const br = isW(x + 1, y + 1) && isW(x + 1, y) && isW(x, y + 1);

    const gid = resolveRiverWang(tl, tr, bl, br);
    if (gid > 0) {
      setTile(ground, x, y, gid);
      setTile(collisions, x, y, COLLISION);
    }
  }
}
```

Add helper functions:

```typescript
function isW(x: number, y: number): boolean {
  if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return false;
  return isWater[idx(x, y)];
}

function hasWaterNeighbor(x: number, y: number): boolean {
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      if (isW(x + dx, y + dy)) return true;
  return false;
}

function resolveRiverWang(tl: boolean, tr: boolean, bl: boolean, br: boolean): number {
  const key = (tl ? 8 : 0) | (tr ? 4 : 0) | (bl ? 2 : 0) | (br ? 1 : 0);
  // Map 4-bit corner mask to river GIDs
  const WANG_MAP: Record<number, number> = {
    0b1111: PW.RIVER_CENTER,     // all water
    0b0011: PW.RIVER_OUTER_T,    // water below only
    0b1100: PW.RIVER_OUTER_B,    // water above only
    0b0101: PW.RIVER_OUTER_L,    // water right only
    0b1010: PW.RIVER_OUTER_R,    // water left only
    0b0001: PW.RIVER_OUTER_TL,   // water only at BR
    0b0010: PW.RIVER_OUTER_TR,   // water only at BL
    0b0100: PW.RIVER_OUTER_BL,   // water only at TR
    0b1000: PW.RIVER_OUTER_BR,   // water only at TL
    0b1110: PW.RIVER_INNER_TL,   // grass only at BR → wait, inverted...
    0b1101: PW.RIVER_INNER_TR,   // grass only at BL
    0b1011: PW.RIVER_INNER_BL,   // grass only at TR
    0b0111: PW.RIVER_INNER_BR,   // grass only at TL
    // Strips
    0b0110: PW.RIVER_OUTER_T,    // approximate
    0b1001: PW.RIVER_OUTER_B,    // approximate
  };
  return WANG_MAP[key] || 0;
}
```

- [ ] **Step 4: Add dense forest clusters using Wang tree tiles**

Replace the thin tree border (section 4) with noise-driven forest zones. Use the Wang forest canopy tiles (color 6) for deciduous and trees2 (color 12) for pine forests:

```typescript
// ── 4. FORESTS — Noise-driven clusters with Wang canopy tiles ────
// Step A: Generate forest density map using noise
const isForest: boolean[] = new Array(MAP_W * MAP_H).fill(false);

for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    const distFromCenter = Math.sqrt((x - 50) ** 2 + (y - 50) ** 2);
    const distFromEdge = Math.min(x, y, MAP_W - 1 - x, MAP_H - 1 - y);
    const forestNoise = noise2D(x + 200, y + 200, 0.07);

    // Dense forest near edges, sparse toward center, avoid town core
    const edgeBias = distFromEdge < 15 ? 0.7 - distFromEdge * 0.03 : 0;
    const centerPenalty = distFromCenter < 20 ? 0.6 : 0;

    // Also add scattered copses in mid-distance
    const copseNoise = noise2D(x + 500, y + 500, 0.12);
    const copseChance = copseNoise > 0.7 && distFromCenter > 25 ? 0.5 : 0;

    const threshold = Math.max(edgeBias, copseChance) - centerPenalty;

    if (forestNoise > (1 - threshold) && !isWater[idx(x, y)]) {
      isForest[idx(x, y)] = true;
    }
  }
}

// Step B: Resolve Wang forest canopy tiles
// Uses same corner-resolution approach as river
for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    if (!isForest[idx(x, y)] && !hasForestNeighbor(x, y)) continue;

    const tl = isF(x - 1, y - 1) && isF(x - 1, y) && isF(x, y - 1);
    const tr = isF(x + 1, y - 1) && isF(x + 1, y) && isF(x, y - 1);
    const bl = isF(x - 1, y + 1) && isF(x - 1, y) && isF(x, y + 1);
    const br = isF(x + 1, y + 1) && isF(x + 1, y) && isF(x, y + 1);

    // Use trees2 (pine) for northern half, trees1 (deciduous) for southern
    const usePine = noise2D(x + 800, y + 800, 0.04) > 0.55;
    const gid = resolveForestWang(tl, tr, bl, br, usePine);
    if (gid > 0) {
      setTile(paths, x, y, gid);
      setTile(collisions, x, y, COLLISION);
    }
  }
}
```

Add forest helper functions (same pattern as river):

```typescript
function isF(x: number, y: number): boolean {
  if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return false;
  return isForest[idx(x, y)];
}

function hasForestNeighbor(x: number, y: number): boolean {
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      if (isF(x + dx, y + dy)) return true;
  return false;
}

function resolveForestWang(tl: boolean, tr: boolean, bl: boolean, br: boolean, pine: boolean): number {
  const key = (tl ? 8 : 0) | (tr ? 4 : 0) | (bl ? 2 : 0) | (br ? 1 : 0);
  if (key === 0) return 0;

  // Select tile set based on forest type
  const F = pine ? {
    CENTER: PW.FOREST2_CENTER, OUTER_TL: PW.FOREST2_OUTER_TL,
    OUTER_T: PW.FOREST2_OUTER_T, OUTER_TR: PW.FOREST2_OUTER_TR,
    OUTER_L: PW.FOREST2_OUTER_L, OUTER_R: PW.FOREST2_OUTER_R,
    OUTER_BL: PW.FOREST2_OUTER_BL, OUTER_B: PW.FOREST2_OUTER_B,
    OUTER_BR: PW.FOREST2_OUTER_BR, INNER_TL: PW.FOREST2_INNER_TL,
    INNER_TR: PW.FOREST2_INNER_TR, INNER_BL: PW.FOREST2_INNER_BL,
    INNER_BR: PW.FOREST2_INNER_BR,
  } : {
    CENTER: PW.FOREST_CENTER, OUTER_TL: PW.FOREST_OUTER_TL,
    OUTER_T: PW.FOREST_OUTER_T, OUTER_TR: PW.FOREST_OUTER_TR,
    OUTER_L: PW.FOREST_OUTER_L, OUTER_R: PW.FOREST_OUTER_R,
    OUTER_BL: PW.FOREST_OUTER_BL, OUTER_B: PW.FOREST_OUTER_B,
    OUTER_BR: PW.FOREST_OUTER_BR, INNER_TL: PW.FOREST_INNER_TL,
    INNER_TR: PW.FOREST_INNER_TR, INNER_BL: PW.FOREST_INNER_BL,
    INNER_BR: PW.FOREST_INNER_BR,
  };

  const WANG_MAP: Record<number, number> = {
    0b1111: F.CENTER,
    0b0011: F.OUTER_T,  0b1100: F.OUTER_B,
    0b0101: F.OUTER_L,  0b1010: F.OUTER_R,
    0b0001: F.OUTER_TL, 0b0010: F.OUTER_TR,
    0b0100: F.OUTER_BL, 0b1000: F.OUTER_BR,
    0b1110: F.INNER_TL, 0b1101: F.INNER_TR,
    0b1011: F.INNER_BL, 0b0111: F.INNER_BR,
    0b0110: F.OUTER_T,  0b1001: F.OUTER_B, // approximations
    0b0011: F.OUTER_T,  // horizontal strip fallback
  };
  return WANG_MAP[key] || F.CENTER;
}
```

- [ ] **Step 5: Update PW constants with corrected GIDs**

Replace the incorrect WATER_TL/T/TR/etc constants and add forest + dirt terrain GIDs:

```typescript
// Replace existing water constants with:
// River (Wang color 7 on grass/1 base)
RIVER_OUTER_TL: 278,  RIVER_OUTER_T:  279,  RIVER_OUTER_TR: 280,
RIVER_INNER_TL: 281,  RIVER_INNER_TR: 282,
RIVER_OUTER_L:  305,  RIVER_CENTER:   306,  RIVER_OUTER_R:  307,
RIVER_INNER_BL: 308,  RIVER_INNER_BR: 309,
RIVER_OUTER_BL: 332,  RIVER_OUTER_B:  333,  RIVER_OUTER_BR: 334,

// Forest canopy — trees type 1 (Wang color 6 on air/5)
FOREST_OUTER_TL: 190, FOREST_OUTER_T: 191, FOREST_OUTER_TR: 192,
FOREST_INNER_TL: 193, FOREST_INNER_TR: 194,
FOREST_OUTER_L: 217,  FOREST_CENTER: 218,  FOREST_OUTER_R: 219,
FOREST_INNER_BL: 223, FOREST_INNER_BR: 224,
FOREST_OUTER_BL: 244, FOREST_OUTER_B: 245, FOREST_OUTER_BR: 246,

// Forest canopy — trees type 2 / pine (Wang color 12 on air/5)
FOREST2_OUTER_TL: 202, FOREST2_OUTER_T: 203, FOREST2_OUTER_TR: 204,
FOREST2_INNER_TL: 205, FOREST2_INNER_TR: 206,
FOREST2_OUTER_L: 226,  FOREST2_CENTER: 227,  FOREST2_OUTER_R: 228,
FOREST2_INNER_BL: 232, FOREST2_INNER_BR: 233,
FOREST2_OUTER_BL: 253, FOREST2_OUTER_B: 254, FOREST2_OUTER_BR: 255,

// Dirt terrain patches (Wang color 2 on grass/1)
DIRT_OUTER_TL: 11,  DIRT_OUTER_T: 12,  DIRT_OUTER_TR: 13,
DIRT_INNER_TL: 14,  DIRT_INNER_TR: 15,
DIRT_OUTER_L: 38,   DIRT_FULL: 39,     DIRT_OUTER_R: 40,
DIRT_INNER_BL: 41,  DIRT_INNER_BR: 42,
DIRT_OUTER_BL: 65,  DIRT_OUTER_B: 66,  DIRT_OUTER_BR: 67,
```

- [ ] **Step 6: Run the updated generator and verify output**

Run: `npx tsx scripts/generate-settlement-map.ts`
Expected: Map generates without errors. Output should report 100×100 tiles and 40+ objects.

- [ ] **Step 7: Visual verification**

Run: `npm run dev` → Navigate to settlement.
Verify:
- [ ] Grass has coherent biome zones (not random noise)
- [ ] River has smooth bank transitions (no harsh blue rectangles)
- [ ] Dense forest clusters ring the town with proper canopy edge tiles
- [ ] Mix of deciduous and pine forest areas
- [ ] Town center is clear of forest (center penalty works)

---

### Task 14: Organic Path Network & Dirt Patches

**Files:**
- Modify: `scripts/generate-settlement-map.ts`

**Overview:** Replace the rigid cross-road with organic, curving dirt paths that connect to buildings. Add dirt terrain patches around building clusters.

- [ ] **Step 1: Write path routing function**

Replace the straight-line path code (section 3) with a Bresenham-based path drawer that adds gentle curves via waypoints:

```typescript
// ── 3. ORGANIC PATH NETWORK ──────────────────────────────────────

// Bresenham line with path-width support
function drawPath(x0: number, y0: number, x1: number, y1: number, width: number = 2): void {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let cx = x0, cy = y0;

  while (true) {
    // Paint path tiles in a square of given width
    for (let wy = -Math.floor(width / 2); wy < Math.ceil(width / 2); wy++) {
      for (let wx = -Math.floor(width / 2); wx < Math.ceil(width / 2); wx++) {
        setTile(paths, cx + wx, cy + wy, PW.DIRT_PATH_CROSS);
        // Clear forest from path
        if (isForest[idx(cx + wx, cy + wy)]) {
          isForest[idx(cx + wx, cy + wy)] = false;
        }
        // Clear collision from path
        setTile(collisions, cx + wx, cy + wy, 0);
      }
    }

    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }
}

// Main roads (connect map edges through town center)
// N-S main road with gentle curve
drawPath(49, 8, 47, 30, 2);
drawPath(47, 30, 49, 50, 2);
drawPath(49, 50, 51, 70, 2);
drawPath(51, 70, 49, 92, 2);

// E-W main road with curve
drawPath(12, 49, 30, 47, 2);
drawPath(30, 47, 50, 49, 2);
drawPath(50, 49, 70, 51, 2);
drawPath(70, 51, 88, 49, 2);

// Side paths to building clusters (1-tile width)
// Connect each building district to the nearest main road
drawPath(44, 38, 47, 40, 1);  // Residential N to main road
drawPath(58, 48, 55, 49, 1);  // Workshops to E-W road
drawPath(38, 48, 40, 49, 1);  // Resource store to E-W road
drawPath(44, 55, 47, 53, 1);  // Residential S to main road
drawPath(56, 46, 55, 49, 1);  // Chapel to road
drawPath(43, 46, 45, 49, 1);  // Tavern to road
```

- [ ] **Step 2: Add dirt terrain patches around buildings**

After buildings are placed, paint dirt ground tiles around each building cluster to create worn/trampled ground:

```typescript
// ── Dirt patches around buildings ────────────────────────────────
// For each building, paint a dirt patch on the ground layer within radius 2
for (const bld of buildingPlacements) {
  const radius = 2;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const bx = bld.x + dx;
      const by = bld.y + dy;
      if (bx < 0 || bx >= MAP_W || by < 0 || by >= MAP_H) continue;
      if (isWater[idx(bx, by)]) continue;
      // Use full dirt for center, transitions at edge
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        setTile(ground, bx, by, PW.DIRT_FULL);
      } else {
        // Edge tiles — simplified (full dirt is acceptable for MVP)
        setTile(ground, bx, by, PW.DIRT_FULL);
      }
    }
  }
}
```

- [ ] **Step 3: Run generator and verify**

Run: `npx tsx scripts/generate-settlement-map.ts`
Expected: Paths now curve organically and connect to buildings. Dirt patches visible around building clusters.

---

### Task 15: Decorative Object Scattering & Building Density

**Files:**
- Modify: `scripts/generate-settlement-map.ts`

**Overview:** Add decorative objects (rocks, wheat fields, flowers) and increase building count to match inspiration density.

- [ ] **Step 1: Add more buildings for density**

Expand `buildingPlacements` array to include 15-20 additional buildings:

```typescript
// Add to buildingPlacements array:

// Second residential cluster (NE quadrant)
{ name: "House 11", type: "building", x: 58, y: 38, spriteKey: "bld-houses", frame: 0 },
{ name: "House 12", type: "building", x: 60, y: 38, spriteKey: "bld-houses", frame: 2 },
{ name: "House 13", type: "building", x: 62, y: 38, spriteKey: "bld-houses", frame: 4 },
{ name: "Hut 3", type: "building", x: 58, y: 36, spriteKey: "bld-huts", frame: 2 },

// Docks near river
{ name: "Dock 1", type: "building", x: 22, y: 30, spriteKey: "bld-docks", frame: 0 },
{ name: "Dock 2", type: "building", x: 24, y: 30, spriteKey: "bld-docks", frame: 1 },

// Southern market extension
{ name: "Market Stall 4", type: "building", x: 44, y: 52, spriteKey: "bld-market", frame: 3 },
{ name: "Market Stall 5", type: "building", x: 46, y: 52, spriteKey: "bld-market", frame: 4 },

// Additional workshops
{ name: "Workshop 3", type: "building", x: 60, y: 50, spriteKey: "bld-workshops", frame: 2 },
{ name: "Workshop 4", type: "building", x: 62, y: 50, spriteKey: "bld-workshops", frame: 3 },

// Farm buildings (west)
{ name: "Farm House", type: "building", x: 35, y: 50, spriteKey: "bld-houses", frame: 3 },
{ name: "Farm Hut 1", type: "building", x: 33, y: 50, spriteKey: "bld-huts", frame: 3 },
{ name: "Farm Hut 2", type: "building", x: 33, y: 52, spriteKey: "bld-huts", frame: 4 },

// Tower/defense
{ name: "Tower 2", type: "building", x: 40, y: 35, spriteKey: "bld-tower", frame: 1 },
{ name: "Tower 3", type: "building", x: 62, y: 55, spriteKey: "bld-tower", frame: 2 },

// Additional wells and signs
{ name: "Well 2", type: "building", x: 55, y: 50, spriteKey: "misc-well", frame: 1 },
{ name: "Quest Board", type: "building", x: 47, y: 44, spriteKey: "misc-quest-board", frame: 0 },
{ name: "Signpost E", type: "building", x: 65, y: 49, spriteKey: "misc-signs", frame: 2 },
{ name: "Signpost W", type: "building", x: 35, y: 49, spriteKey: "misc-signs", frame: 3 },
```

- [ ] **Step 2: Add decorative object scattering**

After building placement, add scattered decorative objects using noise:

```typescript
// ── DECORATIONS — Rocks, wheat, chests, tombstones ───────────────

// Wheat fields near farms (west of town)
for (let y = 54; y < 62; y++) {
  for (let x = 30; x < 40; x++) {
    if (rand() < 0.4 && !isWater[idx(x, y)] && paths[idx(x, y)] === 0) {
      addObject(`Wheat ${x}-${y}`, "decoration", x, y, {
        spriteKey: "nat-wheatfield",
        frame: Math.floor(rand() * 4),
      });
    }
  }
}

// Scattered rocks in wilderness
for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    const distFromCenter = Math.sqrt((x - 50) ** 2 + (y - 50) ** 2);
    if (distFromCenter > 30 && rand() < 0.008 && !isWater[idx(x, y)] && !isForest[idx(x, y)]) {
      addObject(`Rock ${x}-${y}`, "decoration", x, y, {
        spriteKey: "nat-rocks",
        frame: Math.floor(rand() * 12),
      });
    }
  }
}

// Tombstones near chapel
for (let y = 44; y < 48; y++) {
  for (let x = 57; x < 61; x++) {
    if (rand() < 0.3) {
      addObject(`Tombstone ${x}-${y}`, "decoration", x, y, {
        spriteKey: "misc-tombstones",
        frame: Math.floor(rand() * 8),
      });
    }
  }
}

// Chests near keep/barracks
addObject("Chest 1", "decoration", 50, 43, { spriteKey: "misc-chests", frame: 0 });
addObject("Chest 2", "decoration", 59, 53, { spriteKey: "misc-chests", frame: 1 });
```

- [ ] **Step 3: Ensure BuildingManager handles "decoration" type objects**

In `src/engine/settlement/buildingManager.ts`, update the type filter to also include "decoration" objects. These render identically to buildings (sprite + optional collision) but don't need collision for most decorations:

```typescript
// In BuildingManager constructor, change:
if (obj.type !== "building" || !obj.x || !obj.y) continue;
// To:
if ((obj.type !== "building" && obj.type !== "decoration") || !obj.x || !obj.y) continue;
```

Note: Decorations should NOT have collision bodies by default. Add a check:
```typescript
// Only add collision for buildings, not decorations
if (obj.type === "building") {
  scene.physics.add.existing(sprite, true);
  this.collisionGroup.add(sprite);
}
```

- [ ] **Step 4: Run generator, verify decorations render**

Run: `npx tsx scripts/generate-settlement-map.ts && npm run dev`
Verify:
- [ ] Wheat fields visible west of town
- [ ] Scattered rocks in wilderness areas
- [ ] Tombstones near chapel
- [ ] Chests near keep/barracks
- [ ] Decorations don't block player movement

---

### Task 13-15 Execution Order

| Order | Task | Depends On |
|-------|------|-----------|
| 13 | Terrain Biomes & Forest Canopy | Tasks 1-6 complete |
| 14 | Organic Paths & Dirt Patches | Task 13 (needs isForest, isWater grids) |
| 15 | Decorations & Building Density | Task 14 (paths clear forest) |

**These tasks must be executed sequentially** — each builds on the data structures (isWater, isForest) created by the previous one.

### Visual Acceptance Criteria

After Tasks 13-15, the settlement should match these qualities from the inspiration map:

- [ ] **Dense forests** — thick canopy clusters with proper Wang edge transitions, not individual tree tiles
- [ ] **Two forest types** — deciduous (green) and pine (brown/autumn) in different regions
- [ ] **Smooth river** — sinusoidal with bank transitions, not harsh rectangles
- [ ] **Coherent terrain** — grass zones cluster naturally, not per-tile noise
- [ ] **Organic paths** — curved roads connecting buildings, not straight grid lines
- [ ] **Dirt patches** — worn ground around buildings
- [ ] **40+ buildings** — tightly clustered town center, not sparse grid
- [ ] **Decorations everywhere** — rocks, wheat, tombstones, chests scattered throughout
- [ ] **Clear town center** — forest stays outside the settlement core
