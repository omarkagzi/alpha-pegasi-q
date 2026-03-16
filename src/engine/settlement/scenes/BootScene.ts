import Phaser from "phaser";

/**
 * BootScene — preloads all tilesets, spritesheets, and map data.
 * Transitions to RegionMapScene when loading completes.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  private loadFailed = false;

  preload(): void {
    // Handle asset load errors gracefully
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.error(`[BootScene] Failed to load: ${file.key} (${file.url})`);
      this.loadFailed = true;
    });

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
    if (this.loadFailed) {
      this.add
        .text(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          "Asset loading failed.\nCheck console for details.",
          {
            fontSize: "10px",
            color: "#ff4444",
            fontFamily: "monospace",
            align: "center",
          }
        )
        .setOrigin(0.5);
      return;
    }

    // Signal that Phaser is ready via game registry
    this.game.registry.set("bootComplete", true);
    this.game.events.emit("bootComplete");

    this.scene.start("RegionMapScene");
  }
}
