import Phaser from "phaser";
import {
  TERRAIN, TILEMAP, getAllSpritesheets,
} from "../assetManifest";

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
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.error(`[BootScene] Failed to load: ${file.key} (${file.url})`);
      this.loadFailed = true;
    });

    // Terrain tileset (MinyWorld Ground)
    this.load.image(TERRAIN.key, TERRAIN.path);

    // All MinyWorld spritesheets (buildings, nature, misc, characters, animals)
    for (const entry of getAllSpritesheets()) {
      this.load.spritesheet(entry.key, entry.path, {
        frameWidth: entry.fw,
        frameHeight: entry.fh,
      });
    }

    // Region map assets — reuse MinyWorld tileset for region map
    this.load.image("arboria-tiles", TERRAIN.path);
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
