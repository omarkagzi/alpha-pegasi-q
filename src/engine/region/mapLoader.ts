import Phaser from "phaser";

/**
 * Loads and creates a Tiled tilemap for the Arboria regional overview.
 * Returns the map and ground layer for the scene to use.
 */
export function loadRegionMap(scene: Phaser.Scene): {
  map: Phaser.Tilemaps.Tilemap;
  groundLayer: Phaser.Tilemaps.TilemapLayer | null;
  tileset: Phaser.Tilemaps.Tileset | null;
} {
  const map = scene.make.tilemap({ key: "arboria-region" });

  // Bridge Phaser load key with Tiled JSON tileset name
  const tileset = map.addTilesetImage("arboria-tileset", "arboria-tiles");

  let groundLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  if (tileset) {
    groundLayer = map.createLayer("ground", tileset);
    groundLayer?.setDepth(0);
  }

  return { map, groundLayer, tileset };
}
