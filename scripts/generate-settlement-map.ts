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
