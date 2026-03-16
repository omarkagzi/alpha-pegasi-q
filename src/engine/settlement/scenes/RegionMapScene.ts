import Phaser from "phaser";
import { loadRegionMap } from "@/engine/region/mapLoader";
import { useWorldStore } from "@/stores/worldStore";
import { WeatherEngine } from "@/engine/region/weatherEngine";
import { LightingEngine } from "@/engine/region/lightingEngine";
import { WeatherEffects } from "@/engine/settlement/weatherEffects";
import { getSeasonTint } from "@/engine/region/seasonEngine";

interface SettlementMarker {
  settlementId: string;
  label: string;
  accessible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * RegionMapScene — 2D pixel-art regional overview of the Arboria biome.
 * Shows terrain, settlement markers, weather overlay, and day/night lighting.
 * Clicking the market town marker transitions to SettlementScene.
 */
export class RegionMapScene extends Phaser.Scene {
  private lightingEngine!: LightingEngine;
  private weatherEffects!: WeatherEffects;
  private lastAppliedSeason = "";
  private groundLayer: Phaser.Tilemaps.TilemapLayer | null = null;

  constructor() {
    super({ key: "RegionMapScene" });
  }

  create(): void {
    // 1. Load tilemap
    const { map, groundLayer, tileset } = loadRegionMap(this);

    if (!tileset || !groundLayer) {
      this.add
        .text(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          "Region map error — check console",
          { fontSize: "10px", color: "#ff4444", fontFamily: "monospace" }
        )
        .setOrigin(0.5);
      return;
    }

    // 2. Set camera bounds to map size
    const mapWidth = map.widthInPixels;
    const mapHeight = map.heightInPixels;
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    // Center camera on the map
    this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);

    // 3. Read settlement markers from object layer
    const objectLayer = map.getObjectLayer("settlements");
    const markers: SettlementMarker[] = [];

    if (objectLayer) {
      for (const obj of objectLayer.objects) {
        const props = this.getProperties(obj);
        markers.push({
          settlementId: props.settlementId || obj.name,
          label: props.label || obj.name,
          accessible: props.accessible === "true",
          x: obj.x || 0,
          y: obj.y || 0,
          width: obj.width || 48,
          height: obj.height || 48,
        });
      }
    }

    // 4. Create visual markers for each settlement
    for (const marker of markers) {
      this.createSettlementMarker(marker);
    }

    // 5. "Return to Orbit" button
    const orbitBtn = this.add
      .text(4, 4, "← Orbit", {
        fontSize: "8px",
        color: "#aaaacc",
        fontFamily: "monospace",
        backgroundColor: "#00000080",
        padding: { x: 3, y: 2 },
      })
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive({ useHandCursor: true });

    orbitBtn.on("pointerover", () => orbitBtn.setColor("#ffffff"));
    orbitBtn.on("pointerout", () => orbitBtn.setColor("#aaaacc"));
    orbitBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", "/world");
        }
        useWorldStore.getState().returnToOrbit();
      });
    });

    // 6. Region title
    this.add
      .text(mapWidth / 2, 8, "Arboria", {
        fontSize: "10px",
        color: "#658a43",
        fontFamily: "monospace",
      })
      .setOrigin(0.5, 0)
      .setDepth(50);

    // 7. Weather & lighting engines
    let weatherEngine = this.game.registry.get(
      "weatherEngine"
    ) as WeatherEngine | undefined;
    if (!weatherEngine) {
      weatherEngine = new WeatherEngine("temperate_deciduous_forest");
      this.game.registry.set("weatherEngine", weatherEngine);
    }
    weatherEngine.start();

    // Apply season tint to ground layer
    this.groundLayer = groundLayer;
    this.lastAppliedSeason = weatherEngine.getCurrentSeason();
    groundLayer.setTint(getSeasonTint(this.lastAppliedSeason));

    this.lightingEngine = new LightingEngine(this);
    this.weatherEffects = new WeatherEffects(this, weatherEngine);

    // 8. URL sync
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/world/arboria");
    }

    // Register shutdown handler so Phaser calls it on scene.start()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    // 9. Camera fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  update(): void {
    if (this.lightingEngine) {
      this.lightingEngine.update();
    }
    if (this.weatherEffects) {
      this.weatherEffects.update();
    }
    // Check for season change and reapply tint
    const we = this.game.registry.get("weatherEngine") as
      | WeatherEngine
      | undefined;
    if (we && this.groundLayer) {
      const currentSeason = we.getCurrentSeason();
      if (currentSeason !== this.lastAppliedSeason) {
        this.lastAppliedSeason = currentSeason;
        this.groundLayer.setTint(getSeasonTint(currentSeason));
      }
    }
  }

  private shutdown(): void {
    if (this.lightingEngine) {
      this.lightingEngine.destroy();
    }
    if (this.weatherEffects) {
      this.weatherEffects.destroy();
    }
  }

  private createSettlementMarker(marker: SettlementMarker): void {
    const centerX = marker.x + marker.width / 2;
    const centerY = marker.y + marker.height / 2;

    // Background rectangle
    const color = marker.accessible ? 0xd4870a : 0x555555;
    const rect = this.add.rectangle(
      centerX,
      centerY,
      marker.width,
      marker.height,
      color,
      0.4
    );
    rect.setStrokeStyle(1, color, 0.8);
    rect.setDepth(20);

    // Label text
    const label = this.add
      .text(centerX, centerY + marker.height / 2 + 4, marker.label, {
        fontSize: "6px",
        color: marker.accessible ? "#d4870a" : "#777777",
        fontFamily: "monospace",
        align: "center",
      })
      .setOrigin(0.5, 0)
      .setDepth(20);

    if (marker.accessible) {
      // Make interactive
      rect.setInteractive({ useHandCursor: true });

      rect.on("pointerover", () => {
        rect.setFillStyle(0xffb040, 0.6);
        rect.setStrokeStyle(1, 0xffb040, 1);
        label.setColor("#ffb040");
      });

      rect.on("pointerout", () => {
        rect.setFillStyle(color, 0.4);
        rect.setStrokeStyle(1, color, 0.8);
        label.setColor("#d4870a");
      });

      rect.on("pointerdown", () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          useWorldStore
            .getState()
            .enterSettlement(marker.settlementId);
          this.scene.start("SettlementScene");
        });
      });
    } else {
      // Inaccessible: show tooltip on hover
      const tooltip = this.add
        .text(centerX, centerY - marker.height / 2 - 6, "Not yet realized", {
          fontSize: "5px",
          color: "#888888",
          fontFamily: "monospace",
          backgroundColor: "#00000080",
          padding: { x: 2, y: 1 },
        })
        .setOrigin(0.5, 1)
        .setDepth(30)
        .setVisible(false);

      rect.setInteractive();
      rect.on("pointerover", () => tooltip.setVisible(true));
      rect.on("pointerout", () => tooltip.setVisible(false));
    }
  }

  private getProperties(
    obj: Phaser.Types.Tilemaps.TiledObject
  ): Record<string, string> {
    const result: Record<string, string> = {};
    if (obj.properties) {
      for (const prop of obj.properties as Array<{
        name: string;
        value: unknown;
      }>) {
        result[prop.name] = String(prop.value);
      }
    }
    return result;
  }
}
