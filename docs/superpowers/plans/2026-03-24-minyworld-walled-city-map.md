# MinyWorld Walled City Map — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Puny World procedural settlement map with a hand-crafted MinyWorld walled city, tile-by-tile matching the reference image (`Design Assets/MinyWorld Assets/Example-maps-and-layouts/1DNf6A.png`).

**Architecture:** Single MinyWorld grass tile for the ground layer, road tiles (from `Grass.png` far-right variant) for paths, all buildings/walls/trees/decorations as 16×16 sprite objects in the Tiled JSON object layer. Multi-tile structures (barracks walls, towers) are composed of multiple 16×16 frames placed at adjacent grid positions. Puny World tileset is fully removed.

**Tech Stack:** TypeScript, Phaser 3, Tiled JSON format, MinyWorld asset pack

**Reference images:**
- Full map: `Design Assets/MinyWorld Assets/Example-maps-and-layouts/1DNf6A.png`
- **PRIMARY BLUEPRINT** (zoomed walled city interior): `Design Assets/MinyWorld Assets/Example-maps-and-layouts/1DNf6A-zoomed-in-part-1.png` — Use this as the definitive tile-by-tile reference for all building placements

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `public/sprites/tiles/minyworld-ground.png` | Create | 2-tile tileset: grass + road (16×16 each, 32×16 total) |
| `public/sprites/buildings/tower2.png` | Create (copy) | Stone guard tower sprite (from Design Assets) |
| `src/engine/settlement/assetManifest.ts` | Modify | Swap PW tileset → MW ground tileset, add tower2 entry |
| `src/engine/settlement/scenes/SettlementScene.ts` | Modify | Update tileset name reference |
| `src/engine/settlement/buildingManager.ts` | Modify | Accept "decoration" type objects (no collision) |
| `scripts/generate-settlement-map.ts` | Rewrite | Hand-crafted tile-by-tile map matching reference |

---

## Chunk 1: Infrastructure — Ground Tileset & Asset Pipeline

### Task 1: Create MinyWorld Ground Tileset

**Files:**
- Create: `public/sprites/tiles/minyworld-ground.png`
- Create: `scripts/create-ground-tileset.ts`

**Overview:** Build a tiny 2-tile tileset PNG (32×16 pixels) from MinyWorld ground sprites. Tile 1 (GID 1) = grass. Tile 2 (GID 2) = road.

- [ ] **Step 1: Write the tileset creation script**

```typescript
// scripts/create-ground-tileset.ts
/**
 * Extracts 2 tiles from MinyWorld ground sprites and combines them
 * into a single 32×16 tileset PNG for the Tiled map.
 *
 * Tile 0 (GID 1): Grass — from Grass.png, 3rd tile (bright green, index 2)
 * Tile 1 (GID 2): Road  — from Grass.png, 5th tile (tan/beige, index 4)
 *                         OR from DeadGrass.png index 0 if Grass.png has only 4 tiles
 *
 * Run: npx tsx scripts/create-ground-tileset.ts
 */
import * as fs from "fs";
import * as path from "path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

async function main() {
  const TILE = 16;
  const canvas = createCanvas(TILE * 2, TILE);
  const ctx = canvas.getContext("2d");

  // Source: MinyWorld Grass.png (4 tiles at 16×16 each = 64×16)
  const grassSheet = await loadImage(
    path.resolve(__dirname, "..", "Design Assets", "MinyWorld Assets",
      "MiniWorldSprites", "Ground", "Grass.png")
  );

  // Tile 0: Grass — 3rd tile from Grass.png (index 2, x offset = 32)
  // This is the bright green variant matching the reference map ground
  ctx.drawImage(grassSheet, 2 * TILE, 0, TILE, TILE, 0, 0, TILE, TILE);

  // Tile 1: Road — last tile from Grass.png (index 3 or 4)
  // If Grass.png has 4 tiles (64px wide), road is index 3 (x offset = 48)
  // If Grass.png has 5 tiles (80px wide), road is index 4 (x offset = 64)
  // Verify: Grass.png width determines this. Fallback: use DeadGrass.png index 0
  const grassWidth = grassSheet.width;
  const lastTileIndex = Math.floor(grassWidth / TILE) - 1;
  ctx.drawImage(grassSheet, lastTileIndex * TILE, 0, TILE, TILE, TILE, 0, TILE, TILE);

  const outPath = path.resolve(__dirname, "..", "public", "sprites", "tiles", "minyworld-ground.png");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const buf = canvas.toBuffer("image/png");
  fs.writeFileSync(outPath, buf);
  console.log(`Ground tileset written to ${outPath} (${TILE * 2}×${TILE})`);
}

main().catch(console.error);
```

- [ ] **Step 2: Install canvas dependency (if not present)**

Run: `npm install --save-dev @napi-rs/canvas`

- [ ] **Step 3: Run the script and verify output**

Run: `npx tsx scripts/create-ground-tileset.ts`
Expected: `public/sprites/tiles/minyworld-ground.png` created, 32×16 pixels.

- [ ] **Step 4: Visually verify the tileset**

Open `public/sprites/tiles/minyworld-ground.png` and confirm:
- Left tile (GID 1): Bright green grass matching reference map ground
- Right tile (GID 2): Tan/beige road matching reference map paths

If the tiles don't match, adjust the source indices in the script and re-run.

- [ ] **Step 5: Commit**

```bash
git add scripts/create-ground-tileset.ts public/sprites/tiles/minyworld-ground.png
git commit -m "feat: create MinyWorld ground tileset (grass + road)"
```

---

### Task 2: Copy Tower2 Sprite & Update Asset Manifest

**Files:**
- Create: `public/sprites/buildings/tower2.png` (copy from Design Assets)
- Modify: `src/engine/settlement/assetManifest.ts`

**Overview:** The reference map uses stone guard towers (`Tower2.png`) at wall corners/gates. This sprite isn't in `public/sprites/` yet. Also swap the tileset reference from Puny World to MinyWorld ground.

- [ ] **Step 1: Copy Tower2.png to public sprites**

Run:
```bash
cp "Design Assets/MinyWorld Assets/MiniWorldSprites/Buildings/Wood/Tower2.png" public/sprites/buildings/tower2.png
```

- [ ] **Step 2: Update assetManifest.ts — swap tileset**

In `src/engine/settlement/assetManifest.ts`, replace the TERRAIN constant:

```typescript
// ── Terrain Tileset (MinyWorld Ground) ───────────────────────────
export const TERRAIN = {
  key: "minyworld-ground",
  path: "/sprites/tiles/minyworld-ground.png",
  tileWidth: 16,
  tileHeight: 16,
  columns: 2,
  tileCount: 2,
  imageWidth: 32,
  imageHeight: 16,
} as const;
```

- [ ] **Step 3: Add tower2 to BUILDINGS in assetManifest.ts**

Add after the `tower` entry:

```typescript
tower2: { key: "bld-tower2", path: "/sprites/buildings/tower2.png", fw: 16, fh: 16, cols: 3, rows: 6 },
```

- [ ] **Step 4: Verify no other code references the old tileset name**

Search for `"punyworld-overworld"` across the codebase. Update any remaining references. Also check `scripts/pack-minyworld-assets.ts` for references to the old tileset.

- [ ] **Step 5: Commit**

```bash
git add public/sprites/buildings/tower2.png src/engine/settlement/assetManifest.ts
git commit -m "feat: swap to MinyWorld ground tileset, add tower2 sprite"
```

---

### Task 3: Update SettlementScene Tileset Loading

**Files:**
- Modify: `src/engine/settlement/scenes/SettlementScene.ts`

**Overview:** The scene references `TERRAIN.key` for tileset loading. Since we changed the TERRAIN constant in assetManifest, the scene code should work without changes IF the tilemap JSON also references the same tileset name. Verify and fix if needed.

- [ ] **Step 1: Verify SettlementScene uses TERRAIN import**

Check that `SettlementScene.ts` line 39 uses:
```typescript
const tileset = map.addTilesetImage(TERRAIN.key, TERRAIN.key);
```
This should already work since TERRAIN.key is now `"minyworld-ground"`.

- [ ] **Step 2: Verify the preloader loads the new tileset**

Search for where `TERRAIN.path` is loaded in preload. `BootScene` loads via `TERRAIN.key` and `TERRAIN.path` dynamically from `assetManifest.ts`, so no code change is needed — only update the comment on BootScene.ts from "Puny World" to "MinyWorld Ground".

- [ ] **Step 2b: Remove `pathsLayer` code from SettlementScene**

The new map no longer has a `"paths"` tile layer (roads are in the ground layer). Remove the dead code:

1. Delete lines that create `pathsLayer`:
```typescript
// REMOVE these lines:
const pathsLayer = map.createLayer("paths", tileset);
pathsLayer?.setDepth(1);
```

2. Update `tintedLayers` to only include `groundLayer`:
```typescript
this.tintedLayers = [groundLayer].filter(
  (l): l is Phaser.Tilemaps.TilemapLayer => l !== null
);
```

3. Update the comment on line 38 from "Add Puny World tileset" to "Add MinyWorld ground tileset".

- [ ] **Step 3: Remove the old Puny World tileset file (optional)**

The file `public/sprites/tiles/punyworld-overworld-tileset.png` is no longer needed. Remove it to avoid confusion:

```bash
rm public/sprites/tiles/punyworld-overworld-tileset.png
```

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "chore: remove Puny World tileset, verify MW ground loading"
```

---

### Task 4: Update BuildingManager for Decoration Support

**Files:**
- Modify: `src/engine/settlement/buildingManager.ts`
- Modify: `src/engine/settlement/scenes/SettlementScene.ts`

**Overview:** The generator will output objects with types: `"building"` (has collision), `"decoration"` (no collision), `"wall"` (has collision). BuildingManager needs to handle all three. SettlementScene needs to pass wall and decoration objects to BuildingManager.

- [ ] **Step 1: Update BuildingManager type filter**

In `buildingManager.ts`, change the type check at line 24:

```typescript
// OLD:
if (obj.type !== "building" || !obj.x || !obj.y) continue;

// NEW:
const validTypes = ["building", "decoration", "wall"];
if (!validTypes.includes(obj.type!) || !obj.x || !obj.y) continue;
```

- [ ] **Step 2: Skip collision for decorations**

After creating the sprite (line 44), conditionally add collision:

```typescript
// Add static physics body for collision (buildings and walls only)
if (obj.type !== "decoration") {
  scene.physics.add.existing(sprite, true);
  this.collisionGroup.add(sprite);
}
```

Update the BuildingInstance interface to make `body` optional:

```typescript
interface BuildingInstance {
  name: string;
  sprite: Phaser.GameObjects.Sprite;
  body?: Phaser.Physics.Arcade.StaticBody;
}
```

And update the push:

```typescript
this.buildings.push({
  name: obj.name,
  sprite,
  body: obj.type !== "decoration"
    ? (sprite.body as Phaser.Physics.Arcade.StaticBody)
    : undefined,
});
```

- [ ] **Step 3: Update SettlementScene to pass all renderable objects**

In `SettlementScene.ts`, change the building filter (line 82-84):

```typescript
// OLD:
const buildingObjects = objectLayer
  ? objectLayer.objects.filter((o) => o.type === "building")
  : [];

// NEW:
const renderableTypes = ["building", "decoration", "wall"];
const buildingObjects = objectLayer
  ? objectLayer.objects.filter((o) => renderableTypes.includes(o.type!))
  : [];
```

- [ ] **Step 4: Commit**

```bash
git add src/engine/settlement/buildingManager.ts src/engine/settlement/scenes/SettlementScene.ts
git commit -m "feat: BuildingManager supports decoration and wall types"
```

---

## Chunk 2: Generator Rewrite — Hand-Crafted Walled City

### Task 5: Rewrite Generator — Structure & Ground Layer

**Files:**
- Rewrite: `scripts/generate-settlement-map.ts`

**Overview:** Complete rewrite. The new generator hand-places every tile to match the reference. This task sets up the file structure, constants, ground layer (all grass), and road paths.

The walled city is approximately 42 tiles wide × 42 tiles tall, centered in a 100×100 map. City interior starts at roughly tile (29, 29) and extends to (71, 71).

- [ ] **Step 1: Write the new generator skeleton**

Replace the entire file with:

```typescript
// scripts/generate-settlement-map.ts
/**
 * Arboria Settlement Map Generator — MinyWorld Walled City Edition
 *
 * Hand-crafted tile-by-tile placement matching the reference map.
 * Ground layer uses MinyWorld grass + road tileset (2 tiles).
 * All buildings/walls/decorations are sprite objects.
 *
 * Run: npx tsx scripts/generate-settlement-map.ts
 */
import * as fs from "fs";
import * as path from "path";

// ── MinyWorld Ground Tileset GIDs ─────────────────────────────────
// Tileset: 2 columns, 1 row. GID = tileIndex + 1 (Tiled firstgid=1).
const MW = {
  GRASS: 1,  // Bright green grass (Grass.png tile 3)
  ROAD:  2,  // Tan/beige road (Grass.png last tile)
} as const;

const MAP_W = 100;
const MAP_H = 100;
const TILE_SIZE = 16;

// ── City bounds (walled area within the 100×100 map) ──────────────
// Approximate from reference. Adjust during visual verification.
const CITY_X = 29;  // Left edge of outer wall
const CITY_Y = 29;  // Top edge of outer wall
const CITY_W = 42;  // City width in tiles
const CITY_H = 42;  // City height in tiles

// ── Layer Data ────────────────────────────────────────────────────
const ground: number[] = new Array(MAP_W * MAP_H).fill(MW.GRASS);
const collisions: number[] = new Array(MAP_W * MAP_H).fill(0);
const COLLISION = MW.GRASS; // Any valid GID for collision marking

// ── Object layer accumulator ──────────────────────────────────────
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

function idx(x: number, y: number): number {
  return y * MAP_W + x;
}

function setGround(x: number, y: number, gid: number): void {
  if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) {
    ground[idx(x, y)] = gid;
  }
}

function fillGround(x: number, y: number, w: number, h: number, gid: number): void {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      setGround(x + dx, y + dy, gid);
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
  if (props && Object.keys(props).length > 0) {
    obj.properties = Object.entries(props).map(([name, value]) => ({
      name,
      type: typeof value === "number" ? "int" : "string",
      value,
    }));
  }
  objects.push(obj);
}

// Helper: place a grid of frames from a spritesheet as multiple objects
function placeMultiTile(
  namePrefix: string,
  type: string,
  startX: number,
  startY: number,
  cols: number,
  rows: number,
  spriteKey: string,
  startFrame: number,
  sheetCols: number
): void {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const frame = startFrame + row * sheetCols + col;
      addObject(
        `${namePrefix}_${col}_${row}`,
        type,
        startX + col,
        startY + row,
        { spriteKey, frame }
      );
    }
  }
}
```

- [ ] **Step 2: Add road/path placement**

The reference shows a grid of dirt roads inside the city walls. Main cross-road through center, plus connecting paths between building clusters.

```typescript
// ── ROAD PATHS ────────────────────────────────────────────────────
// Main N-S road through city center
fillGround(CITY_X + 20, CITY_Y + 1, 2, CITY_H - 2, MW.ROAD);

// Main E-W road through city center
fillGround(CITY_X + 1, CITY_Y + 20, CITY_W - 2, 2, MW.ROAD);

// Secondary E-W roads (upper and lower thirds)
fillGround(CITY_X + 1, CITY_Y + 10, CITY_W - 2, 1, MW.ROAD);
fillGround(CITY_X + 1, CITY_Y + 31, CITY_W - 2, 1, MW.ROAD);

// Secondary N-S roads (left and right thirds)
fillGround(CITY_X + 10, CITY_Y + 1, 1, CITY_H - 2, MW.ROAD);
fillGround(CITY_X + 31, CITY_Y + 1, 1, CITY_H - 2, MW.ROAD);

// Dirt patches around building clusters (worn ground)
// NW cluster
fillGround(CITY_X + 2, CITY_Y + 2, 8, 8, MW.ROAD);
// NE cluster
fillGround(CITY_X + 22, CITY_Y + 2, 8, 8, MW.ROAD);
// ... (additional dirt patches per cluster — refine during visual verification)
```

**Note:** Road positions are approximate from the reference. During implementation, compare against the reference image and adjust coordinates as needed.

- [ ] **Step 3: Commit skeleton**

```bash
git add scripts/generate-settlement-map.ts
git commit -m "feat: generator skeleton with ground layer and roads"
```

---

### Task 6: Generator — Wall & Tower Placement

**Files:**
- Modify: `scripts/generate-settlement-map.ts`

**Overview:** Place the city wall perimeter using Barracks frames and Tower2 frames. The reference shows stone walls with guard towers at each corner and at gate openings on each side.

**Sprite frame reference:**

Barracks.png (4 cols × 5 rows = 20 frames, key: `bld-barracks`):
```
Frame layout (reading row by row, left to right):
Row 0: [0]  [1]  [2]  [3]   ← wall-top variants (wooden upper + stone trim)
Row 1: [4]  [5]  [6]  [7]   ← wall-middle variants (large wooden panels)
Row 2: [8]  [9]  [10] [11]  ← building variant pieces (different style)
Row 3: [12] [13] [14] [15]  ← more variants (some with lit windows)
Row 4: [16] [17] [18] [19]  ← stone/castle base sections
```

Tower2.png (3 cols × 6 rows = 18 frames, key: `bld-tower2`):
```
Row 0: [0]  [1]  [2]   ← tower tops (3 variants)
Row 1: [3]  [4]  [5]   ← tower upper sections
Row 2: [6]  [7]  [8]   ← tower middle sections
Row 3: [9]  [10] [11]  ← tower lower sections
Row 4: [12] [13] [14]  ← tower bases
Row 5: [15] [16] [17]  ← tower ground sections
```

Each guard tower in the reference is approximately 3 tiles wide × 3-4 tiles tall (using a vertical strip of Tower2 frames). Wall segments between towers use Barracks frames 0-3 (top row) for the upper wall section and frames 4-7 for the lower.

- [ ] **Step 1: Place corner towers**

```typescript
// ── WALLS & TOWERS ────────────────────────────────────────────────

// Corner towers (3×3 each, using Tower2 frames)
// Top-left corner
placeMultiTile("tower-NW", "wall", CITY_X, CITY_Y, 3, 3, "bld-tower2", 0, 3);
// Top-right corner
placeMultiTile("tower-NE", "wall", CITY_X + CITY_W - 3, CITY_Y, 3, 3, "bld-tower2", 0, 3);
// Bottom-left corner
placeMultiTile("tower-SW", "wall", CITY_X, CITY_Y + CITY_H - 3, 3, 3, "bld-tower2", 0, 3);
// Bottom-right corner
placeMultiTile("tower-SE", "wall", CITY_X + CITY_W - 3, CITY_Y + CITY_H - 3, 3, 3, "bld-tower2", 0, 3);
```

- [ ] **Step 2: Place gate towers (mid-wall)**

```typescript
// Gate towers — N wall center
placeMultiTile("gate-N-L", "wall", CITY_X + 18, CITY_Y, 3, 3, "bld-tower2", 0, 3);
placeMultiTile("gate-N-R", "wall", CITY_X + 23, CITY_Y, 3, 3, "bld-tower2", 0, 3);

// Gate towers — S wall center
placeMultiTile("gate-S-L", "wall", CITY_X + 18, CITY_Y + CITY_H - 3, 3, 3, "bld-tower2", 0, 3);
placeMultiTile("gate-S-R", "wall", CITY_X + 23, CITY_Y + CITY_H - 3, 3, 3, "bld-tower2", 0, 3);

// Gate towers — W wall center
placeMultiTile("gate-W-T", "wall", CITY_X, CITY_Y + 18, 3, 3, "bld-tower2", 0, 3);
placeMultiTile("gate-W-B", "wall", CITY_X, CITY_Y + 23, 3, 3, "bld-tower2", 0, 3);

// Gate towers — E wall center
placeMultiTile("gate-E-T", "wall", CITY_X + CITY_W - 3, CITY_Y + 18, 3, 3, "bld-tower2", 0, 3);
placeMultiTile("gate-E-B", "wall", CITY_X + CITY_W - 3, CITY_Y + 23, 3, 3, "bld-tower2", 0, 3);
```

- [ ] **Step 3: Place wall segments between towers**

```typescript
// North wall segments (between towers, 2 tiles tall using barracks frames)
// Segment NW corner → N gate left tower
for (let x = CITY_X + 3; x < CITY_X + 18; x++) {
  addObject(`wall-N-top-${x}`, "wall", x, CITY_Y, { spriteKey: "bld-barracks", frame: 0 });
  addObject(`wall-N-bot-${x}`, "wall", x, CITY_Y + 1, { spriteKey: "bld-barracks", frame: 4 });
}

// Segment N gate right tower → NE corner
for (let x = CITY_X + 26; x < CITY_X + CITY_W - 3; x++) {
  addObject(`wall-N2-top-${x}`, "wall", x, CITY_Y, { spriteKey: "bld-barracks", frame: 0 });
  addObject(`wall-N2-bot-${x}`, "wall", x, CITY_Y + 1, { spriteKey: "bld-barracks", frame: 4 });
}

// South wall (same pattern)
for (let x = CITY_X + 3; x < CITY_X + 18; x++) {
  addObject(`wall-S-top-${x}`, "wall", x, CITY_Y + CITY_H - 2, { spriteKey: "bld-barracks", frame: 0 });
  addObject(`wall-S-bot-${x}`, "wall", x, CITY_Y + CITY_H - 1, { spriteKey: "bld-barracks", frame: 4 });
}
for (let x = CITY_X + 26; x < CITY_X + CITY_W - 3; x++) {
  addObject(`wall-S2-top-${x}`, "wall", x, CITY_Y + CITY_H - 2, { spriteKey: "bld-barracks", frame: 0 });
  addObject(`wall-S2-bot-${x}`, "wall", x, CITY_Y + CITY_H - 1, { spriteKey: "bld-barracks", frame: 4 });
}

// West wall (vertical, 2 tiles wide)
for (let y = CITY_Y + 3; y < CITY_Y + 18; y++) {
  addObject(`wall-W-l-${y}`, "wall", CITY_X, y, { spriteKey: "bld-barracks", frame: 0 });
  addObject(`wall-W-r-${y}`, "wall", CITY_X + 1, y, { spriteKey: "bld-barracks", frame: 1 });
}
for (let y = CITY_Y + 26; y < CITY_Y + CITY_H - 3; y++) {
  addObject(`wall-W2-l-${y}`, "wall", CITY_X, y, { spriteKey: "bld-barracks", frame: 0 });
  addObject(`wall-W2-r-${y}`, "wall", CITY_X + 1, y, { spriteKey: "bld-barracks", frame: 1 });
}

// East wall (vertical, 2 tiles wide)
for (let y = CITY_Y + 3; y < CITY_Y + 18; y++) {
  addObject(`wall-E-l-${y}`, "wall", CITY_X + CITY_W - 2, y, { spriteKey: "bld-barracks", frame: 0 });
  addObject(`wall-E-r-${y}`, "wall", CITY_X + CITY_W - 1, y, { spriteKey: "bld-barracks", frame: 1 });
}
for (let y = CITY_Y + 26; y < CITY_Y + CITY_H - 3; y++) {
  addObject(`wall-E2-l-${y}`, "wall", CITY_X + CITY_W - 2, y, { spriteKey: "bld-barracks", frame: 0 });
  addObject(`wall-E2-r-${y}`, "wall", CITY_X + CITY_W - 1, y, { spriteKey: "bld-barracks", frame: 1 });
}
```

**Critical note:** The exact Barracks/Tower2 frame numbers used for walls vs. wall tops vs. gates MUST be verified against the sprites during implementation. The frames listed above are estimates based on visual inspection. Open the sprite sheets and match frames to the reference image.

- [ ] **Step 4: Wall collision handled by BuildingManager**

Wall collision is handled entirely through BuildingManager's sprite physics bodies (type `"wall"` gets collision in Task 4). Do NOT add wall positions to the tile collision layer — double-collision (tile layer + sprite body) causes physics jitter. The tile collision layer is only needed for areas where there are no sprite objects but the player still shouldn't walk (e.g., map edges outside the city).

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-settlement-map.ts
git commit -m "feat: generator walls and towers placement"
```

---

### Task 7: Generator — Interior Building Placement

**Files:**
- Modify: `scripts/generate-settlement-map.ts`

**Overview:** Place all interior buildings matching the reference. Each building is one or more 16×16 sprite objects at specific grid positions.

**Sprite frame reference (frame indices within each spritesheet):**

Houses.png (3 cols × 4 rows, key: `bld-houses`):
```
[0] [1] [2]    ← 3 house variants (row 0)
[3] [4] [5]    ← 3 house variants (row 1)
[6] [7] [8]    ← 3 house variants (row 2)
[9] [10] [11]  ← 3 house variants (row 3)
```
Each house is a single 16×16 tile.

Market.png (3 cols × 4 rows, key: `bld-market`):
```
[0] [1] [2]    ← market tops with goods
[3] [4] [5]    ← market bases
[6] [7] [8]    ← variant tops
[9] [10] [11]  ← variant bases
```
Each market stall is 1×2 tiles (top frame + base frame below it).

Taverns.png (3 cols × 4 rows, key: `bld-taverns`):
```
[0] [1] [2]    ← tavern tops
[3] [4] [5]    ← tavern middles
[6] [7] [8]    ← tavern variant tops
[9] [10] [11]  ← tavern variant bases
```
Each tavern is 1×2 or larger.

Workshops.png (3 cols × 3 rows, key: `bld-workshops`):
```
[0] [1] [2]
[3] [4] [5]
[6] [7] [8]
```

Chapels.png (3 cols × 2 rows, key: `bld-chapels`):
```
[0] [1] [2]    ← chapel tops
[3] [4] [5]    ← chapel bases
```

Huts.png (5 cols × 1 row, key: `bld-huts`):
```
[0] [1] [2] [3] [4]  ← 5 hut variants (each 1×1 tile)
```

- [ ] **Step 1: Place NW quadrant buildings**

Based on reference: market stalls along left edge, houses in rows behind them.

```typescript
// ── INTERIOR BUILDINGS ────────────────────────────────────────────
// All positions are (tileX, tileY) relative to map origin.
// CX = CITY_X, CY = CITY_Y for brevity.
const CX = CITY_X;
const CY = CITY_Y;

// ── NW Quadrant (market district) ─────────────────────────────
// Market stalls (each 1×2: top frame + base frame below)
addObject("Market-1-top", "building", CX + 3, CY + 4, { spriteKey: "bld-market", frame: 0 });
addObject("Market-1-bot", "building", CX + 3, CY + 5, { spriteKey: "bld-market", frame: 3 });
addObject("Market-2-top", "building", CX + 4, CY + 4, { spriteKey: "bld-market", frame: 1 });
addObject("Market-2-bot", "building", CX + 4, CY + 5, { spriteKey: "bld-market", frame: 4 });
addObject("Market-3-top", "building", CX + 3, CY + 6, { spriteKey: "bld-market", frame: 2 });
addObject("Market-3-bot", "building", CX + 3, CY + 6 + 1, { spriteKey: "bld-market", frame: 5 });

// Houses (NW cluster)
addObject("House-NW-1", "building", CX + 7, CY + 4, { spriteKey: "bld-houses", frame: 0 });
addObject("House-NW-2", "building", CX + 8, CY + 4, { spriteKey: "bld-houses", frame: 1 });
addObject("House-NW-3", "building", CX + 9, CY + 4, { spriteKey: "bld-houses", frame: 2 });
addObject("House-NW-4", "building", CX + 7, CY + 5, { spriteKey: "bld-houses", frame: 3 });
addObject("House-NW-5", "building", CX + 8, CY + 5, { spriteKey: "bld-houses", frame: 4 });
addObject("House-NW-6", "building", CX + 9, CY + 5, { spriteKey: "bld-houses", frame: 5 });
addObject("House-NW-7", "building", CX + 7, CY + 7, { spriteKey: "bld-houses", frame: 6 });
addObject("House-NW-8", "building", CX + 8, CY + 7, { spriteKey: "bld-houses", frame: 7 });
addObject("House-NW-9", "building", CX + 9, CY + 7, { spriteKey: "bld-houses", frame: 8 });
```

- [ ] **Step 2: Place NE quadrant buildings**

```typescript
// ── NE Quadrant (residential) ─────────────────────────────────
addObject("House-NE-1", "building", CX + 22, CY + 4, { spriteKey: "bld-houses", frame: 0 });
addObject("House-NE-2", "building", CX + 23, CY + 4, { spriteKey: "bld-houses", frame: 1 });
addObject("House-NE-3", "building", CX + 24, CY + 4, { spriteKey: "bld-houses", frame: 2 });
addObject("House-NE-4", "building", CX + 25, CY + 4, { spriteKey: "bld-houses", frame: 3 });
addObject("House-NE-5", "building", CX + 26, CY + 4, { spriteKey: "bld-houses", frame: 4 });
addObject("House-NE-6", "building", CX + 22, CY + 5, { spriteKey: "bld-houses", frame: 5 });
addObject("House-NE-7", "building", CX + 23, CY + 5, { spriteKey: "bld-houses", frame: 6 });
addObject("House-NE-8", "building", CX + 24, CY + 5, { spriteKey: "bld-houses", frame: 7 });
addObject("House-NE-9", "building", CX + 25, CY + 5, { spriteKey: "bld-houses", frame: 8 });
addObject("House-NE-10", "building", CX + 26, CY + 5, { spriteKey: "bld-houses", frame: 9 });
// ... continue for remaining NE houses
```

- [ ] **Step 3: Place center buildings (excluding Keep)**

```typescript
// ── Center ────────────────────────────────────────────────────
// Keep placeholder — skip for now (larger sprite, handled in future task)
// Place surrounding houses and workshops

// Workshops east of center
addObject("Workshop-1", "building", CX + 25, CY + 20, { spriteKey: "bld-workshops", frame: 0 });
addObject("Workshop-2", "building", CX + 26, CY + 20, { spriteKey: "bld-workshops", frame: 1 });
addObject("Workshop-3", "building", CX + 27, CY + 20, { spriteKey: "bld-workshops", frame: 2 });
```

- [ ] **Step 4: Place W and E quadrant buildings**

```typescript
// ── W Quadrant (large houses / taverns) ───────────────────────
addObject("Tavern-W-1-top", "building", CX + 3, CY + 13, { spriteKey: "bld-taverns", frame: 0 });
addObject("Tavern-W-1-mid", "building", CX + 3, CY + 14, { spriteKey: "bld-taverns", frame: 3 });
addObject("Tavern-W-2-top", "building", CX + 4, CY + 13, { spriteKey: "bld-taverns", frame: 1 });
addObject("Tavern-W-2-mid", "building", CX + 4, CY + 14, { spriteKey: "bld-taverns", frame: 4 });

// Houses west side
addObject("House-W-1", "building", CX + 3, CY + 16, { spriteKey: "bld-houses", frame: 0 });
addObject("House-W-2", "building", CX + 4, CY + 16, { spriteKey: "bld-houses", frame: 1 });
addObject("House-W-3", "building", CX + 5, CY + 16, { spriteKey: "bld-houses", frame: 2 });

// ── E Quadrant ────────────────────────────────────────────────
addObject("House-E-1", "building", CX + 33, CY + 13, { spriteKey: "bld-houses", frame: 0 });
addObject("House-E-2", "building", CX + 34, CY + 13, { spriteKey: "bld-houses", frame: 1 });
addObject("House-E-3", "building", CX + 35, CY + 13, { spriteKey: "bld-houses", frame: 2 });
addObject("House-E-4", "building", CX + 33, CY + 14, { spriteKey: "bld-houses", frame: 3 });
addObject("House-E-5", "building", CX + 34, CY + 14, { spriteKey: "bld-houses", frame: 4 });
```

- [ ] **Step 5: Place SW, S-center, SE quadrant buildings**

```typescript
// ── SW Quadrant ───────────────────────────────────────────────
addObject("House-SW-1", "building", CX + 4, CY + 28, { spriteKey: "bld-houses", frame: 0 });
addObject("House-SW-2", "building", CX + 5, CY + 28, { spriteKey: "bld-houses", frame: 1 });
addObject("House-SW-3", "building", CX + 6, CY + 28, { spriteKey: "bld-houses", frame: 2 });
addObject("House-SW-4", "building", CX + 4, CY + 29, { spriteKey: "bld-houses", frame: 3 });
addObject("House-SW-5", "building", CX + 5, CY + 29, { spriteKey: "bld-houses", frame: 4 });
addObject("House-SW-6", "building", CX + 6, CY + 29, { spriteKey: "bld-houses", frame: 5 });
// ... more SW houses

// ── S-Center (barracks/taverns with lit windows) ──────────────
// These large buildings below the Keep area
placeMultiTile("Barracks-S", "building", CX + 17, CY + 27, 4, 2, "bld-barracks", 8, 4);

// Taverns with lit windows
addObject("Tavern-S-1-top", "building", CX + 17, CY + 31, { spriteKey: "bld-taverns", frame: 6 });
addObject("Tavern-S-1-bot", "building", CX + 17, CY + 32, { spriteKey: "bld-taverns", frame: 9 });
addObject("Tavern-S-2-top", "building", CX + 18, CY + 31, { spriteKey: "bld-taverns", frame: 7 });
addObject("Tavern-S-2-bot", "building", CX + 18, CY + 32, { spriteKey: "bld-taverns", frame: 10 });

// ── SE Quadrant ───────────────────────────────────────────────
addObject("House-SE-1", "building", CX + 33, CY + 28, { spriteKey: "bld-houses", frame: 9 });
addObject("House-SE-2", "building", CX + 34, CY + 28, { spriteKey: "bld-houses", frame: 10 });
addObject("House-SE-3", "building", CX + 35, CY + 28, { spriteKey: "bld-houses", frame: 11 });
addObject("Hut-SE-1", "building", CX + 33, CY + 30, { spriteKey: "bld-huts", frame: 0 });
addObject("Hut-SE-2", "building", CX + 34, CY + 30, { spriteKey: "bld-huts", frame: 1 });
```

**CRITICAL: All building positions above are APPROXIMATE.** During implementation, the developer MUST:

1. Open the reference image (`Design Assets/MinyWorld Assets/Example-maps-and-layouts/1DNf6A.png`) zoomed to the walled city area
2. Open each building spritesheet to identify exact frame indices
3. Count tile positions from the reference for each building
4. Place buildings iteratively: run generator → view in game → adjust positions → repeat

The positions in this plan provide the **structure and approach**, not final coordinates. Expect 2-3 rounds of visual refinement.

- [ ] **Step 6: Commit building placements**

```bash
git add scripts/generate-settlement-map.ts
git commit -m "feat: generator interior building placements (initial)"
```

---

### Task 8: Generator — Trees, Decorations, Agents & Output

**Files:**
- Modify: `scripts/generate-settlement-map.ts`

**Overview:** Add trees outside/inside walls, decorative objects, NPC agents, player spawn, and the Tiled JSON output.

- [ ] **Step 1: Place trees**

```typescript
// ── TREES ─────────────────────────────────────────────────────────
// Inside city — scattered individual trees (reference shows 2-3 green trees)
addObject("Tree-inner-1", "decoration", CX + 11, CY + 5, { spriteKey: "nat-trees", frame: 0 });
addObject("Tree-inner-2", "decoration", CX + 32, CY + 15, { spriteKey: "nat-trees", frame: 1 });

// Outside city — forest clusters along map edges
// NW forest
for (let y = 0; y < CITY_Y - 2; y++) {
  for (let x = 0; x < 15; x++) {
    if ((x + y) % 3 === 0) {
      addObject(`Tree-NW-${x}-${y}`, "decoration", x, y, {
        spriteKey: "nat-trees",
        frame: (x + y) % 4,
      });
    }
  }
}

// NE forest
for (let y = 0; y < CITY_Y - 2; y++) {
  for (let x = MAP_W - 15; x < MAP_W; x++) {
    if ((x + y) % 3 === 0) {
      addObject(`Tree-NE-${x}-${y}`, "decoration", x, y, {
        spriteKey: "nat-trees",
        frame: (x + y) % 4,
      });
    }
  }
}

// Additional forest clusters along other edges — add as needed during expansion
```

- [ ] **Step 2: Place agents (NPCs)**

```typescript
// ── AGENTS ────────────────────────────────────────────────────────
const agentPlacements = [
  { name: "Mira",   agentName: "Mira",   sprite: "chr-arthax", x: CX + 19, y: CY + 18, zone: "market_square", role: "guide" },
  { name: "Ledger", agentName: "Ledger", sprite: "chr-kanji",  x: CX + 22, y: CY + 18, zone: "market_square", role: "finance" },
  { name: "Archon", agentName: "Archon", sprite: "chr-katan",  x: CX + 30, y: CY + 10, zone: "scholars_quarter", role: "academia" },
  { name: "Forge",  agentName: "Forge",  sprite: "chr-okomo",  x: CX + 30, y: CY + 22, zone: "craftsmen_row", role: "programming" },
  { name: "Ember",  agentName: "Ember",  sprite: "chr-zhinja", x: CX + 10, y: CY + 22, zone: "commons", role: "roleplay" },
];

for (const agent of agentPlacements) {
  addObject(agent.name, "agent", agent.x, agent.y, {
    agentId: `agent-${agent.agentName.toLowerCase()}`,
    agentName: agent.agentName,
    sprite: agent.sprite,
    zone: agent.zone,
    role: agent.role,
  });
}
```

- [ ] **Step 3: Place player spawn and lots**

```typescript
// ── PLAYER SPAWN ──────────────────────────────────────────────────
// Spawn inside the south gate
addObject("Player Spawn", "player_spawn", CX + 21, CY + CITY_H - 5, {});

// ── LOTS — Buildable land ─────────────────────────────────────────
const lotPositions = [
  { x: CX + 12, y: CY + 12 },
  { x: CX + 14, y: CY + 12 },
  { x: CX + 28, y: CY + 12 },
  { x: CX + 30, y: CY + 12 },
  { x: CX + 12, y: CY + 28 },
  { x: CX + 14, y: CY + 28 },
  { x: CX + 28, y: CY + 28 },
  { x: CX + 30, y: CY + 28 },
];
for (const lot of lotPositions) {
  addObject(`Lot ${lot.x}-${lot.y}`, "lot", lot.x, lot.y, {});
}
```

- [ ] **Step 4: Write Tiled JSON output**

```typescript
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
      name: "minyworld-ground",
      tilewidth: TILE_SIZE,
      tileheight: TILE_SIZE,
      tilecount: 2,
      columns: 2,
      image: "../../sprites/tiles/minyworld-ground.png",
      imagewidth: 32,
      imageheight: 16,
      spacing: 0,
      margin: 0,
    },
  ],
  layers: [
    {
      id: 1, name: "ground", type: "tilelayer",
      width: MAP_W, height: MAP_H, data: ground,
      opacity: 1, visible: true, x: 0, y: 0,
    },
    {
      id: 2, name: "collisions", type: "tilelayer",
      width: MAP_W, height: MAP_H, data: collisions,
      opacity: 1, visible: false, x: 0, y: 0,
    },
    {
      id: 3, name: "interactions", type: "objectgroup",
      draworder: "topdown",
      objects, opacity: 1, visible: true, x: 0, y: 0,
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

**Note:** The `paths` layer has been removed. Road tiles are now in the ground layer (GID 2). Building/wall/tree sprites are all in the object layer, rendered by BuildingManager. The collision layer marks wall positions only.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-settlement-map.ts
git commit -m "feat: complete generator with trees, agents, JSON output"
```

---

## Chunk 3: Verification & Visual Refinement

### Task 9: Generate Map & Run Game

**Files:**
- No new changes (verification only)

- [ ] **Step 1: Run the generator**

Run: `npx tsx scripts/generate-settlement-map.ts`
Expected: Map generates without errors. Console reports 100×100 tiles and 100+ objects.

- [ ] **Step 2: Run the dev server**

Run: `npm run dev`
Navigate to the settlement scene.

- [ ] **Step 3: Visual verification checklist**

Compare the in-game view against the reference image. Check:

- [ ] Ground is uniform bright green grass
- [ ] Road paths visible as tan/beige tiles forming a grid inside the city
- [ ] Wall perimeter visible — stone walls enclosing the city
- [ ] Guard towers at 4 corners and 4 gate positions
- [ ] Gate openings allow player to walk through
- [ ] Interior buildings visible — houses, market, workshops, taverns
- [ ] Trees visible (inside and outside the walls)
- [ ] Player spawns inside the city
- [ ] NPCs visible and interactive
- [ ] Building collision works — player can't walk through buildings/walls
- [ ] No collision on decorations — player walks over them
- [ ] Camera follows player, bounds correct

- [ ] **Step 4: Take note of position adjustments needed**

Expect buildings to be offset from their ideal positions. Record needed adjustments:
- Which buildings need to move and in which direction
- Which frames don't match the reference (wrong building variant)
- Missing buildings that need to be added
- Extra gap/spacing issues

- [ ] **Step 5: Apply position corrections and re-generate**

Adjust coordinates in `generate-settlement-map.ts` based on visual comparison. Iterate:
1. Edit positions
2. Run: `npx tsx scripts/generate-settlement-map.ts`
3. Refresh browser
4. Compare against reference
5. Repeat until satisfied

- [ ] **Step 6: Final commit**

```bash
git add scripts/generate-settlement-map.ts public/maps/arboria/arboria-market-town.json
git commit -m "feat: MinyWorld walled city map — initial walled city layout"
```

---

## Task Dependency Order

```
Task 1 (Ground tileset)
  ↓
Task 2 (Asset manifest)  →  Task 3 (Scene updates)
  ↓                            ↓
Task 4 (BuildingManager) ─────┘
  ↓
Task 5 (Generator skeleton + ground)
  ↓
Task 6 (Generator walls)
  ↓
Task 7 (Generator buildings)
  ↓
Task 8 (Generator trees/agents/output)
  ↓
Task 9 (Verification & refinement)
```

Tasks 1-3 can be done in parallel (infrastructure). Task 4 touches SettlementScene (same as Task 3), so run Task 3 before Task 4. Tasks 5-8 are sequential (generator build-up). **Do not test the generated map until Tasks 1-4 are complete** — the JSON tileset name must match the updated `TERRAIN.key`. Task 9 is the iterative refinement loop.

---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Building positions wrong on first pass | Plan for 2-3 visual refinement cycles. This is expected. |
| Frame indices don't match reference | Open each spritesheet side-by-side with reference during implementation |
| Ground tileset extraction fails | Fallback: manually create a 32×16 PNG in any image editor |
| `@napi-rs/canvas` install issues | Fallback: use `sharp` or `jimp` for image processing, or create tileset manually |
| Tower2 frames don't match wall towers in reference | Check if Tower.png works instead; the reference may use either |
| Collision layer incomplete | Test by walking into every wall segment and building |
