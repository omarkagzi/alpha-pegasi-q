// scripts/generate-settlement-map.ts
/**
 * Arboria Settlement Map Generator — MinyWorld Walled City Edition
 *
 * Hand-crafted tile-by-tile placement matching the reference map:
 *   Design Assets/MinyWorld Assets/Example-maps-and-layouts/1DNf6A-zoomed-in-part-1.png
 *
 * Ground layer uses MinyWorld grass + road tileset (2 tiles).
 * All buildings/walls/decorations are sprite objects in the Tiled object layer.
 *
 * Run: npx tsx scripts/generate-settlement-map.ts
 */
import * as fs from "fs";
import * as path from "path";

// ── MinyWorld Ground Tileset GIDs ─────────────────────────────────
// Tileset: 2 columns, 1 row. GID = tileIndex + 1 (Tiled firstgid=1).
const MW = {
  GRASS: 1,  // Tile 0 — muted yellow-green grass (Grass.png index 3)
  ROAD:  2,  // Tile 1 — tan/beige road (Grass.png index 4)
} as const;

const MAP_W = 100;
const MAP_H = 100;
const TILE_SIZE = 16;

// ── City bounds (walled area within the 100×100 map) ──────────────
// The walled city is ~42 tiles wide × 42 tall, centered in the map.
const CITY_X = 29;  // Left edge of outer wall
const CITY_Y = 29;  // Top edge of outer wall
const CITY_W = 42;  // City width in tiles
const CITY_H = 42;  // City height in tiles

// Shorthand for city-relative positioning
const CX = CITY_X;
const CY = CITY_Y;

// ── Layer Data ────────────────────────────────────────────────────
const ground: number[] = new Array(MAP_W * MAP_H).fill(MW.GRASS);
const collisions: number[] = new Array(MAP_W * MAP_H).fill(0);

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

// ═══════════════════════════════════════════════════════════════════
// 1. GROUND LAYER — Grass base + road grid
// ═══════════════════════════════════════════════════════════════════
// Ground is pre-filled with MW.GRASS. Now add road/dirt areas.

// ── Main N-S road through city center (2 tiles wide) ─────────────
fillGround(CX + 20, CY, 2, CITY_H, MW.ROAD);

// ── Main E-W road through city center (2 tiles wide) ─────────────
fillGround(CX, CY + 20, CITY_W, 2, MW.ROAD);

// ── Secondary N-S roads (left and right thirds, 1 tile wide) ─────
fillGround(CX + 10, CY, 1, CITY_H, MW.ROAD);
fillGround(CX + 31, CY, 1, CITY_H, MW.ROAD);

// ── Secondary E-W roads (upper and lower thirds, 1 tile wide) ────
fillGround(CX, CY + 10, CITY_W, 1, MW.ROAD);
fillGround(CX, CY + 31, CITY_W, 1, MW.ROAD);

// ── Dirt patches around building clusters (worn ground) ──────────
// NW cluster area
fillGround(CX + 2, CY + 2, 8, 8, MW.ROAD);
// N-center cluster
fillGround(CX + 12, CY + 2, 8, 8, MW.ROAD);
// NE cluster
fillGround(CX + 22, CY + 2, 8, 8, MW.ROAD);

// W-center cluster
fillGround(CX + 2, CY + 12, 8, 8, MW.ROAD);
// Center area (around keep)
fillGround(CX + 15, CY + 14, 12, 8, MW.ROAD);
// E-center cluster
fillGround(CX + 32, CY + 12, 8, 8, MW.ROAD);

// SW cluster
fillGround(CX + 2, CY + 22, 8, 8, MW.ROAD);
// S-center cluster (barracks/taverns)
fillGround(CX + 14, CY + 24, 14, 8, MW.ROAD);
// SE cluster
fillGround(CX + 32, CY + 22, 8, 8, MW.ROAD);

// Bottom row clusters
fillGround(CX + 2, CY + 32, 8, 8, MW.ROAD);
fillGround(CX + 14, CY + 33, 14, 6, MW.ROAD);
fillGround(CX + 32, CY + 32, 8, 8, MW.ROAD);


// ═══════════════════════════════════════════════════════════════════
// 2. WALLS & TOWERS
// ═══════════════════════════════════════════════════════════════════
// The reference shows stone walls (using Barracks frames for wall segments)
// with guard towers (Tower2) at corners and gate positions.

// ── Corner towers (each 3×3 using Tower2 top frames) ─────────────
// Tower2.png: 3 cols × 6 rows = 18 frames
// Use rows 0-2 (frames 0-8) for the 3×3 tower block
placeMultiTile("tower-NW", "wall", CX, CY, 3, 3, "bld-tower2", 0, 3);
placeMultiTile("tower-NE", "wall", CX + CITY_W - 3, CY, 3, 3, "bld-tower2", 0, 3);
placeMultiTile("tower-SW", "wall", CX, CY + CITY_H - 3, 3, 3, "bld-tower2", 0, 3);
placeMultiTile("tower-SE", "wall", CX + CITY_W - 3, CY + CITY_H - 3, 3, 3, "bld-tower2", 0, 3);

// ── Gate towers (mid-wall, flanking each gate opening) ───────────
// North wall gates
placeMultiTile("gate-N-L", "wall", CX + 18, CY, 3, 3, "bld-tower2", 0, 3);
placeMultiTile("gate-N-R", "wall", CX + 23, CY, 3, 3, "bld-tower2", 0, 3);
// South wall gates
placeMultiTile("gate-S-L", "wall", CX + 18, CY + CITY_H - 3, 3, 3, "bld-tower2", 0, 3);
placeMultiTile("gate-S-R", "wall", CX + 23, CY + CITY_H - 3, 3, 3, "bld-tower2", 0, 3);
// West wall gates
placeMultiTile("gate-W-T", "wall", CX, CY + 18, 3, 3, "bld-tower2", 0, 3);
placeMultiTile("gate-W-B", "wall", CX, CY + 23, 3, 3, "bld-tower2", 0, 3);
// East wall gates
placeMultiTile("gate-E-T", "wall", CX + CITY_W - 3, CY + 18, 3, 3, "bld-tower2", 0, 3);
placeMultiTile("gate-E-B", "wall", CX + CITY_W - 3, CY + 23, 3, 3, "bld-tower2", 0, 3);

// ── Wall segments (between towers) ───────────────────────────────
// Barracks.png: 4 cols × 5 rows = 20 frames
// Row 0 (frames 0-3): wall top sections
// Row 4 (frames 16-19): stone base sections

// North wall: NW corner → N-gate-left, N-gate-right → NE corner
for (let x = CX + 3; x < CX + 18; x++) {
  addObject(`wall-N-top-${x}`, "wall", x, CY, { spriteKey: "bld-barracks", frame: x % 4 });
  addObject(`wall-N-bot-${x}`, "wall", x, CY + 1, { spriteKey: "bld-barracks", frame: 4 + (x % 4) });
}
for (let x = CX + 26; x < CX + CITY_W - 3; x++) {
  addObject(`wall-N2-top-${x}`, "wall", x, CY, { spriteKey: "bld-barracks", frame: x % 4 });
  addObject(`wall-N2-bot-${x}`, "wall", x, CY + 1, { spriteKey: "bld-barracks", frame: 4 + (x % 4) });
}

// South wall
for (let x = CX + 3; x < CX + 18; x++) {
  addObject(`wall-S-top-${x}`, "wall", x, CY + CITY_H - 2, { spriteKey: "bld-barracks", frame: x % 4 });
  addObject(`wall-S-bot-${x}`, "wall", x, CY + CITY_H - 1, { spriteKey: "bld-barracks", frame: 4 + (x % 4) });
}
for (let x = CX + 26; x < CX + CITY_W - 3; x++) {
  addObject(`wall-S2-top-${x}`, "wall", x, CY + CITY_H - 2, { spriteKey: "bld-barracks", frame: x % 4 });
  addObject(`wall-S2-bot-${x}`, "wall", x, CY + CITY_H - 1, { spriteKey: "bld-barracks", frame: 4 + (x % 4) });
}

// West wall (vertical, 2 tiles wide)
for (let y = CY + 3; y < CY + 18; y++) {
  addObject(`wall-W-l-${y}`, "wall", CX, y, { spriteKey: "bld-barracks", frame: 0 });
  addObject(`wall-W-r-${y}`, "wall", CX + 1, y, { spriteKey: "bld-barracks", frame: 1 });
}
for (let y = CY + 26; y < CY + CITY_H - 3; y++) {
  addObject(`wall-W2-l-${y}`, "wall", CX, y, { spriteKey: "bld-barracks", frame: 0 });
  addObject(`wall-W2-r-${y}`, "wall", CX + 1, y, { spriteKey: "bld-barracks", frame: 1 });
}

// East wall (vertical, 2 tiles wide)
for (let y = CY + 3; y < CY + 18; y++) {
  addObject(`wall-E-l-${y}`, "wall", CX + CITY_W - 2, y, { spriteKey: "bld-barracks", frame: 2 });
  addObject(`wall-E-r-${y}`, "wall", CX + CITY_W - 1, y, { spriteKey: "bld-barracks", frame: 3 });
}
for (let y = CY + 26; y < CY + CITY_H - 3; y++) {
  addObject(`wall-E2-l-${y}`, "wall", CX + CITY_W - 2, y, { spriteKey: "bld-barracks", frame: 2 });
  addObject(`wall-E2-r-${y}`, "wall", CX + CITY_W - 1, y, { spriteKey: "bld-barracks", frame: 3 });
}


// ═══════════════════════════════════════════════════════════════════
// 3. INTERIOR BUILDINGS
// ═══════════════════════════════════════════════════════════════════
// Positions mapped from the reference image (1DNf6A-zoomed-in-part-1.png).
// Each building is one or more 16×16 sprite frames.
//
// Sprite frame reference:
//   Houses.png: 3c×4r=12 frames, each 1×1 tile
//   Market.png: 3c×4r=12 frames, stalls are 1w×2h (top+base)
//   Taverns.png: 3c×4r=12 frames, 1w×2h
//   Workshops.png: 3c×3r=9 frames, each 1×1
//   Barracks.png: 4c×5r=20 frames (also used for interior buildings)
//   Chapels.png: 3c×2r=6 frames
//   Huts.png: 5c×1r=5 frames, each 1×1

// ── NW Quadrant — Market district ────────────────────────────────
// Reference: barracks-style wall top-left, market stalls below, then houses

// Barracks/warehouse top-left (4×2 block)
placeMultiTile("Barracks-NW", "building", CX + 3, CY + 3, 4, 2, "bld-barracks", 0, 4);

// Small hut next to barracks
addObject("Hut-NW-1", "building", CX + 8, CY + 3, { spriteKey: "bld-huts", frame: 0 });

// Market stalls (each 1w×2h: top frame + base frame)
addObject("Market-1-top", "building", CX + 3, CY + 6, { spriteKey: "bld-market", frame: 0 });
addObject("Market-1-bot", "building", CX + 3, CY + 7, { spriteKey: "bld-market", frame: 3 });
addObject("Market-2-top", "building", CX + 4, CY + 6, { spriteKey: "bld-market", frame: 1 });
addObject("Market-2-bot", "building", CX + 4, CY + 7, { spriteKey: "bld-market", frame: 4 });
addObject("Market-3-top", "building", CX + 3, CY + 8, { spriteKey: "bld-market", frame: 2 });
addObject("Market-3-bot", "building", CX + 3, CY + 9, { spriteKey: "bld-market", frame: 5 });
addObject("Market-4-top", "building", CX + 4, CY + 8, { spriteKey: "bld-market", frame: 6 });
addObject("Market-4-bot", "building", CX + 4, CY + 9, { spriteKey: "bld-market", frame: 9 });

// Houses in NW area (rows of houses below market)
addObject("House-NW-1", "building", CX + 6, CY + 6, { spriteKey: "bld-houses", frame: 0 });
addObject("House-NW-2", "building", CX + 7, CY + 6, { spriteKey: "bld-houses", frame: 1 });
addObject("House-NW-3", "building", CX + 8, CY + 6, { spriteKey: "bld-houses", frame: 2 });
addObject("House-NW-4", "building", CX + 6, CY + 7, { spriteKey: "bld-houses", frame: 3 });
addObject("House-NW-5", "building", CX + 7, CY + 7, { spriteKey: "bld-houses", frame: 4 });
addObject("House-NW-6", "building", CX + 8, CY + 7, { spriteKey: "bld-houses", frame: 5 });
addObject("House-NW-7", "building", CX + 6, CY + 8, { spriteKey: "bld-houses", frame: 6 });
addObject("House-NW-8", "building", CX + 7, CY + 8, { spriteKey: "bld-houses", frame: 7 });
addObject("House-NW-9", "building", CX + 8, CY + 8, { spriteKey: "bld-houses", frame: 8 });

// ── N-Center — Dense house rows ──────────────────────────────────
// Reference shows ~5 houses across, 3 rows deep
addObject("House-NC-1", "building", CX + 13, CY + 4, { spriteKey: "bld-houses", frame: 0 });
addObject("House-NC-2", "building", CX + 14, CY + 4, { spriteKey: "bld-houses", frame: 1 });
addObject("House-NC-3", "building", CX + 15, CY + 4, { spriteKey: "bld-houses", frame: 2 });
addObject("House-NC-4", "building", CX + 16, CY + 4, { spriteKey: "bld-houses", frame: 0 });
addObject("House-NC-5", "building", CX + 17, CY + 4, { spriteKey: "bld-houses", frame: 1 });

addObject("House-NC-6", "building", CX + 13, CY + 5, { spriteKey: "bld-houses", frame: 3 });
addObject("House-NC-7", "building", CX + 14, CY + 5, { spriteKey: "bld-houses", frame: 4 });
addObject("House-NC-8", "building", CX + 15, CY + 5, { spriteKey: "bld-houses", frame: 5 });
addObject("House-NC-9", "building", CX + 16, CY + 5, { spriteKey: "bld-houses", frame: 3 });
addObject("House-NC-10", "building", CX + 17, CY + 5, { spriteKey: "bld-houses", frame: 4 });

addObject("House-NC-11", "building", CX + 12, CY + 7, { spriteKey: "bld-houses", frame: 6 });
addObject("House-NC-12", "building", CX + 13, CY + 7, { spriteKey: "bld-houses", frame: 7 });
addObject("House-NC-13", "building", CX + 14, CY + 7, { spriteKey: "bld-houses", frame: 8 });
addObject("House-NC-14", "building", CX + 15, CY + 7, { spriteKey: "bld-houses", frame: 9 });
addObject("House-NC-15", "building", CX + 16, CY + 7, { spriteKey: "bld-houses", frame: 10 });
addObject("House-NC-16", "building", CX + 17, CY + 7, { spriteKey: "bld-houses", frame: 11 });

addObject("House-NC-17", "building", CX + 12, CY + 8, { spriteKey: "bld-houses", frame: 0 });
addObject("House-NC-18", "building", CX + 13, CY + 8, { spriteKey: "bld-houses", frame: 1 });
addObject("House-NC-19", "building", CX + 14, CY + 8, { spriteKey: "bld-houses", frame: 2 });
addObject("House-NC-20", "building", CX + 15, CY + 8, { spriteKey: "bld-houses", frame: 3 });
addObject("House-NC-21", "building", CX + 16, CY + 8, { spriteKey: "bld-houses", frame: 4 });
addObject("House-NC-22", "building", CX + 17, CY + 8, { spriteKey: "bld-houses", frame: 5 });

// ── NE Quadrant — Houses + huts ──────────────────────────────────
// Reference: houses in rows, similar density to NW
addObject("House-NE-1", "building", CX + 23, CY + 3, { spriteKey: "bld-houses", frame: 0 });
addObject("House-NE-2", "building", CX + 24, CY + 3, { spriteKey: "bld-houses", frame: 1 });
addObject("House-NE-3", "building", CX + 25, CY + 3, { spriteKey: "bld-houses", frame: 2 });
addObject("Hut-NE-1", "building", CX + 26, CY + 3, { spriteKey: "bld-huts", frame: 1 });

addObject("House-NE-4", "building", CX + 22, CY + 5, { spriteKey: "bld-houses", frame: 3 });
addObject("House-NE-5", "building", CX + 23, CY + 5, { spriteKey: "bld-houses", frame: 4 });
addObject("House-NE-6", "building", CX + 24, CY + 5, { spriteKey: "bld-houses", frame: 5 });
addObject("House-NE-7", "building", CX + 25, CY + 5, { spriteKey: "bld-houses", frame: 6 });
addObject("House-NE-8", "building", CX + 26, CY + 5, { spriteKey: "bld-houses", frame: 7 });

addObject("House-NE-9", "building", CX + 22, CY + 6, { spriteKey: "bld-houses", frame: 8 });
addObject("House-NE-10", "building", CX + 23, CY + 6, { spriteKey: "bld-houses", frame: 9 });
addObject("House-NE-11", "building", CX + 24, CY + 6, { spriteKey: "bld-houses", frame: 10 });
addObject("House-NE-12", "building", CX + 25, CY + 6, { spriteKey: "bld-houses", frame: 11 });
addObject("House-NE-13", "building", CX + 26, CY + 6, { spriteKey: "bld-houses", frame: 0 });

addObject("House-NE-14", "building", CX + 22, CY + 8, { spriteKey: "bld-houses", frame: 1 });
addObject("House-NE-15", "building", CX + 23, CY + 8, { spriteKey: "bld-houses", frame: 2 });
addObject("House-NE-16", "building", CX + 24, CY + 8, { spriteKey: "bld-houses", frame: 3 });
addObject("House-NE-17", "building", CX + 25, CY + 8, { spriteKey: "bld-houses", frame: 4 });

// ── W-Center — Dense house cluster ───────────────────────────────
// Reference: 3×4 block of houses left of center
addObject("House-W-1", "building", CX + 3, CY + 13, { spriteKey: "bld-houses", frame: 0 });
addObject("House-W-2", "building", CX + 4, CY + 13, { spriteKey: "bld-houses", frame: 1 });
addObject("House-W-3", "building", CX + 5, CY + 13, { spriteKey: "bld-houses", frame: 2 });
addObject("House-W-4", "building", CX + 6, CY + 13, { spriteKey: "bld-houses", frame: 3 });

addObject("House-W-5", "building", CX + 3, CY + 14, { spriteKey: "bld-houses", frame: 4 });
addObject("House-W-6", "building", CX + 4, CY + 14, { spriteKey: "bld-houses", frame: 5 });
addObject("House-W-7", "building", CX + 5, CY + 14, { spriteKey: "bld-houses", frame: 6 });
addObject("House-W-8", "building", CX + 6, CY + 14, { spriteKey: "bld-houses", frame: 7 });

addObject("House-W-9", "building", CX + 3, CY + 16, { spriteKey: "bld-houses", frame: 8 });
addObject("House-W-10", "building", CX + 4, CY + 16, { spriteKey: "bld-houses", frame: 9 });
addObject("House-W-11", "building", CX + 5, CY + 16, { spriteKey: "bld-houses", frame: 10 });
addObject("House-W-12", "building", CX + 6, CY + 16, { spriteKey: "bld-houses", frame: 11 });

addObject("House-W-13", "building", CX + 3, CY + 17, { spriteKey: "bld-houses", frame: 0 });
addObject("House-W-14", "building", CX + 4, CY + 17, { spriteKey: "bld-houses", frame: 1 });
addObject("House-W-15", "building", CX + 5, CY + 17, { spriteKey: "bld-houses", frame: 2 });
addObject("House-W-16", "building", CX + 6, CY + 17, { spriteKey: "bld-houses", frame: 3 });

// ── E-Center — House cluster ─────────────────────────────────────
// Reference: houses right of center, with a single tree
addObject("House-E-1", "building", CX + 33, CY + 13, { spriteKey: "bld-houses", frame: 4 });
addObject("House-E-2", "building", CX + 34, CY + 13, { spriteKey: "bld-houses", frame: 5 });
addObject("House-E-3", "building", CX + 35, CY + 13, { spriteKey: "bld-houses", frame: 6 });

addObject("House-E-4", "building", CX + 33, CY + 14, { spriteKey: "bld-houses", frame: 7 });
addObject("House-E-5", "building", CX + 34, CY + 14, { spriteKey: "bld-houses", frame: 8 });
addObject("House-E-6", "building", CX + 35, CY + 14, { spriteKey: "bld-houses", frame: 9 });

addObject("House-E-7", "building", CX + 32, CY + 16, { spriteKey: "bld-houses", frame: 10 });
addObject("House-E-8", "building", CX + 33, CY + 16, { spriteKey: "bld-houses", frame: 11 });
addObject("Hut-E-1", "building", CX + 35, CY + 16, { spriteKey: "bld-huts", frame: 2 });

// ── Far-left houses (outside main blocks, against west wall) ─────
addObject("House-FW-1", "building", CX + 3, CY + 22, { spriteKey: "bld-houses", frame: 0 });
addObject("House-FW-2", "building", CX + 3, CY + 23, { spriteKey: "bld-houses", frame: 3 });

// ── Far-right houses (against east wall) ─────────────────────────
addObject("House-FE-1", "building", CX + 38, CY + 13, { spriteKey: "bld-huts", frame: 3 });
addObject("House-FE-2", "building", CX + 38, CY + 22, { spriteKey: "bld-huts", frame: 4 });

// ── S-Center — Barracks complex ──────────────────────────────────
// Reference: large 4×2 barracks structure below the keep area
placeMultiTile("Barracks-SC-top", "building", CX + 16, CY + 23, 4, 2, "bld-barracks", 0, 4);
placeMultiTile("Barracks-SC-bot", "building", CX + 16, CY + 25, 4, 2, "bld-barracks", 8, 4);

// Hut next to barracks
addObject("Hut-SC-1", "building", CX + 21, CY + 24, { spriteKey: "bld-huts", frame: 0 });

// ── S-Center — Taverns with lit windows ──────────────────────────
// Reference: 4×2 building block with yellow glowing windows
placeMultiTile("Tavern-SC", "building", CX + 16, CY + 28, 4, 2, "bld-taverns", 6, 3);

// ── SW Quadrant — Houses ─────────────────────────────────────────
addObject("House-SW-1", "building", CX + 4, CY + 28, { spriteKey: "bld-houses", frame: 0 });
addObject("House-SW-2", "building", CX + 5, CY + 28, { spriteKey: "bld-houses", frame: 1 });
addObject("House-SW-3", "building", CX + 6, CY + 28, { spriteKey: "bld-houses", frame: 2 });

addObject("House-SW-4", "building", CX + 4, CY + 29, { spriteKey: "bld-houses", frame: 3 });
addObject("House-SW-5", "building", CX + 5, CY + 29, { spriteKey: "bld-houses", frame: 4 });
addObject("House-SW-6", "building", CX + 6, CY + 29, { spriteKey: "bld-houses", frame: 5 });

addObject("House-SW-7", "building", CX + 3, CY + 33, { spriteKey: "bld-houses", frame: 6 });
addObject("House-SW-8", "building", CX + 4, CY + 33, { spriteKey: "bld-houses", frame: 7 });
addObject("House-SW-9", "building", CX + 5, CY + 33, { spriteKey: "bld-houses", frame: 8 });

addObject("House-SW-10", "building", CX + 3, CY + 34, { spriteKey: "bld-houses", frame: 9 });
addObject("House-SW-11", "building", CX + 4, CY + 34, { spriteKey: "bld-houses", frame: 10 });
addObject("House-SW-12", "building", CX + 5, CY + 34, { spriteKey: "bld-houses", frame: 11 });

addObject("House-SW-13", "building", CX + 3, CY + 36, { spriteKey: "bld-houses", frame: 0 });
addObject("House-SW-14", "building", CX + 4, CY + 36, { spriteKey: "bld-houses", frame: 1 });
addObject("Hut-SW-1", "building", CX + 5, CY + 36, { spriteKey: "bld-huts", frame: 0 });

// ── SE Quadrant — Mixed houses, workshops, huts ──────────────────
addObject("House-SE-1", "building", CX + 33, CY + 25, { spriteKey: "bld-houses", frame: 9 });
addObject("House-SE-2", "building", CX + 34, CY + 25, { spriteKey: "bld-houses", frame: 10 });
addObject("House-SE-3", "building", CX + 35, CY + 25, { spriteKey: "bld-houses", frame: 11 });

addObject("House-SE-4", "building", CX + 33, CY + 26, { spriteKey: "bld-houses", frame: 0 });
addObject("House-SE-5", "building", CX + 34, CY + 26, { spriteKey: "bld-houses", frame: 1 });
addObject("House-SE-6", "building", CX + 35, CY + 26, { spriteKey: "bld-houses", frame: 2 });

addObject("House-SE-7", "building", CX + 32, CY + 28, { spriteKey: "bld-houses", frame: 3 });
addObject("House-SE-8", "building", CX + 33, CY + 28, { spriteKey: "bld-houses", frame: 4 });
addObject("House-SE-9", "building", CX + 34, CY + 28, { spriteKey: "bld-houses", frame: 5 });
addObject("House-SE-10", "building", CX + 35, CY + 28, { spriteKey: "bld-houses", frame: 6 });

addObject("Workshop-SE-1", "building", CX + 32, CY + 33, { spriteKey: "bld-workshops", frame: 0 });
addObject("Workshop-SE-2", "building", CX + 33, CY + 33, { spriteKey: "bld-workshops", frame: 1 });
addObject("Workshop-SE-3", "building", CX + 34, CY + 33, { spriteKey: "bld-workshops", frame: 2 });
addObject("Workshop-SE-4", "building", CX + 32, CY + 34, { spriteKey: "bld-workshops", frame: 3 });
addObject("Workshop-SE-5", "building", CX + 33, CY + 34, { spriteKey: "bld-workshops", frame: 4 });
addObject("Workshop-SE-6", "building", CX + 34, CY + 34, { spriteKey: "bld-workshops", frame: 5 });

// ── Bottom edge buildings (near south wall) ──────────────────────
addObject("Hut-S-1", "building", CX + 3, CY + 39, { spriteKey: "bld-huts", frame: 0 });
addObject("Hut-S-2", "building", CX + 4, CY + 39, { spriteKey: "bld-huts", frame: 1 });

addObject("House-S-1", "building", CX + 14, CY + 38, { spriteKey: "bld-houses", frame: 0 });
addObject("House-S-2", "building", CX + 15, CY + 38, { spriteKey: "bld-houses", frame: 1 });
addObject("Hut-S-3", "building", CX + 24, CY + 38, { spriteKey: "bld-huts", frame: 2 });

addObject("House-S-3", "building", CX + 33, CY + 38, { spriteKey: "bld-houses", frame: 7 });
addObject("Hut-S-4", "building", CX + 34, CY + 38, { spriteKey: "bld-huts", frame: 3 });
addObject("Hut-S-5", "building", CX + 35, CY + 38, { spriteKey: "bld-huts", frame: 4 });


// ═══════════════════════════════════════════════════════════════════
// 4. TREES — Inside and outside city walls
// ═══════════════════════════════════════════════════════════════════
// Trees.png: 4 cols × 1 row = 4 frames
//   [0] green deciduous, [1] bright green, [2] darker green, [3] brown/autumn

// Inside city — reference shows 2-3 scattered green trees
addObject("Tree-inner-1", "decoration", CX + 9, CY + 5, { spriteKey: "nat-trees", frame: 0 });
addObject("Tree-inner-2", "decoration", CX + 36, CY + 15, { spriteKey: "nat-trees", frame: 0 });

// Outside city — NE corner (reference shows 2 trees: green + brown)
addObject("Tree-NE-ext-1", "decoration", CX + 39, CY - 2, { spriteKey: "nat-trees", frame: 0 });
addObject("Tree-NE-ext-2", "decoration", CX + 40, CY - 2, { spriteKey: "nat-trees", frame: 3 });
addObject("Tree-NE-ext-3", "decoration", CX + 39, CY - 1, { spriteKey: "nat-trees", frame: 1 });

// Outside city — NW forest cluster
for (let y = CY - 4; y < CY; y++) {
  for (let x = CX - 4; x < CX + 6; x++) {
    if ((x + y) % 2 === 0) {
      addObject(`Tree-NW-${x}-${y}`, "decoration", x, y, {
        spriteKey: "nat-trees", frame: (x + y) % 4,
      });
    }
  }
}

// Outside city — SE forest cluster
for (let y = CY + CITY_H; y < CY + CITY_H + 4; y++) {
  for (let x = CX + CITY_W - 6; x < CX + CITY_W + 4; x++) {
    if ((x + y) % 2 === 0) {
      addObject(`Tree-SE-${x}-${y}`, "decoration", x, y, {
        spriteKey: "nat-trees", frame: (x + y) % 4,
      });
    }
  }
}

// Pine trees outside east wall
for (let y = CY + 2; y < CY + CITY_H - 2; y += 2) {
  addObject(`Pine-E-${y}`, "decoration", CX + CITY_W + 1, y, {
    spriteKey: "nat-pine-trees", frame: y % 3,
  });
}


// ═══════════════════════════════════════════════════════════════════
// 5. AGENTS (NPCs)
// ═══════════════════════════════════════════════════════════════════
// Property names MUST match npcManager.ts getProperties():
//   agentId, agentName, sprite, zone, role
const agentPlacements = [
  { name: "Mira",   agentName: "Mira",   sprite: "chr-arthax", x: CX + 19, y: CY + 18, zone: "market_square", role: "guide" },
  { name: "Ledger", agentName: "Ledger", sprite: "chr-kanji",  x: CX + 22, y: CY + 18, zone: "market_square", role: "finance" },
  { name: "Archon", agentName: "Archon", sprite: "chr-katan",  x: CX + 30, y: CY + 10, zone: "scholars_quarter", role: "academia" },
  { name: "Forge",  agentName: "Forge",  sprite: "chr-okomo",  x: CX + 30, y: CY + 26, zone: "craftsmen_row", role: "programming" },
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


// ═══════════════════════════════════════════════════════════════════
// 6. PLAYER SPAWN
// ═══════════════════════════════════════════════════════════════════
// Spawn inside the south gate
addObject("Player Spawn", "player_spawn", CX + 21, CY + CITY_H - 5, {});


// ═══════════════════════════════════════════════════════════════════
// 7. LOTS — Buildable land
// ═══════════════════════════════════════════════════════════════════
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


// ═══════════════════════════════════════════════════════════════════
// OUTPUT — Tiled JSON
// ═══════════════════════════════════════════════════════════════════
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
      draworder: "topdown" as const,
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
