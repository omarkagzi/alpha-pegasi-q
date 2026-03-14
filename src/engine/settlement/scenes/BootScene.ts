import Phaser from "phaser";

/**
 * BootScene — preloads all tilesets, spritesheets, and map data.
 * Transitions to RegionMapScene when loading completes.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Tileset
    this.load.image("arboria-tiles", "/sprites/tiles/arboria-tileset.png");

    // Player spritesheet (16×16 frames, 4 directions × 4 walk frames)
    this.load.spritesheet("player", "/sprites/characters/player.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    // NPC spritesheets
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

    // Tiled map data (JSON exports)
    this.load.tilemapTiledJSON("arboria-region", "/maps/arboria/arboria-region.json");
    this.load.tilemapTiledJSON("arboria-market-town", "/maps/arboria/arboria-market-town.json");
  }

  create(): void {
    this.scene.start("RegionMapScene");
  }
}
