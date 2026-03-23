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
