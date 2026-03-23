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
