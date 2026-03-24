// scripts/generate-settlement-map.ts
/**
 * Arboria Settlement Map Generator — MinyWorld Edition
 *
 * Generates a 100×100 Tiled-compatible JSON map.
 * - Ground layer uses MinyWorld ground tileset (2 tiles: grass=1, road=2)
 * - Buildings/objects/NPCs are in the "interactions" object layer
 *
 * Run: npx tsx scripts/generate-settlement-map.ts
 */
import * as fs from "fs";
import * as path from "path";

// ── MinyWorld Ground GIDs ─────────────────────────────────────────
// Tileset: 2 columns, 1 row. GID = tileIndex + 1 (Tiled firstgid=1).
const MW = {
  GRASS: 1,  // Tile 0 — muted yellow-green grass
  ROAD:  2,  // Tile 1 — tan/beige road
} as const;

const MAP_W = 100;
const MAP_H = 100;
const TILE_SIZE = 16;

// ── Layer Data ────────────────────────────────────────────────────
const ground: number[] = new Array(MAP_W * MAP_H).fill(MW.GRASS);
const collisions: number[] = new Array(MAP_W * MAP_H).fill(0);
const COLLISION = MW.GRASS; // Any valid GID; layer is invisible

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

// ── 1. GROUND LAYER — Single grass tile ──────────────────────────
// Ground is already filled with MW.GRASS. No variation needed.

// ── 2. ROAD NETWORK — Using MW.ROAD on ground layer ─────────────
// Main N-S road through town center (col 49-50, full height)
for (let y = 10; y < 90; y++) {
  setTile(ground, 49, y, MW.ROAD);
  setTile(ground, 50, y, MW.ROAD);
}

// E-W road through town center (row 49-50)
for (let x = 15; x < 85; x++) {
  setTile(ground, x, 49, MW.ROAD);
  setTile(ground, x, 50, MW.ROAD);
}

// ── 3. (Trees/forest will be sprite objects in Chunk 2) ──────────

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
      id: 3,
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
