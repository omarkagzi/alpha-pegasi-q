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
