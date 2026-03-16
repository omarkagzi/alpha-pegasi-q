import Phaser from "phaser";
import { PlayerController } from "../playerController";
import { NpcManager } from "../npcManager";
import { useWorldStore } from "@/stores/worldStore";
import { WeatherEngine } from "@/engine/region/weatherEngine";
import { LightingEngine } from "@/engine/region/lightingEngine";
import { WeatherEffects } from "../weatherEffects";
import { getSeasonTint } from "@/engine/region/seasonEngine";
import { supabaseAnon } from "@/lib/supabase/anonClient";

/**
 * SettlementScene — top-down WASD walkable view of Arboria market town.
 * Renders the Tiled tilemap, player movement, NPC agents, collision,
 * weather effects, and day/night lighting.
 */
export class SettlementScene extends Phaser.Scene {
  private playerController!: PlayerController;
  private npcManager!: NpcManager;
  private lightingEngine!: LightingEngine;
  private weatherEffects!: WeatherEffects;
  private transitioning = false;
  private lastAppliedSeason = "";
  private tintedLayers: Phaser.Tilemaps.TilemapLayer[] = [];

  constructor() {
    super({ key: "SettlementScene" });
  }

  create(): void {
    this.transitioning = false;

    // 1. Load tilemap
    const map = this.make.tilemap({ key: "arboria-market-town" });

    // 2. Add tileset — bridge the Phaser load key ("arboria-tiles") with the
    //    Tiled JSON tileset name ("arboria-tileset")
    const tileset = map.addTilesetImage("arboria-tileset", "arboria-tiles");

    if (!tileset) {
      console.error("[SettlementScene] Failed to add tileset");
      this.add
        .text(
          this.cameras.main.centerX,
          this.cameras.main.centerY,
          "Tileset error — check console",
          { fontSize: "10px", color: "#ff4444", fontFamily: "monospace" }
        )
        .setOrigin(0.5);
      return;
    }

    // 3. Create visible layers
    const groundLayer = map.createLayer("ground", tileset);
    const buildingsLayer = map.createLayer("buildings", tileset);
    const decorationsLayer = map.createLayer("decorations", tileset);

    // Set depth ordering
    groundLayer?.setDepth(0);
    buildingsLayer?.setDepth(1);
    decorationsLayer?.setDepth(2);

    // 4. Create collision layer (invisible)
    const collisionLayer = map.createLayer("collisions", tileset);
    if (collisionLayer) {
      collisionLayer.setVisible(false);
      // Tile index 7 = wall/collision tiles; 0 = empty
      collisionLayer.setCollisionByExclusion([-1, 0]);
    }

    // 5. Get spawn point from interactions object layer
    const objectLayer = map.getObjectLayer("interactions");
    let spawnX = 464;
    let spawnY = 32;

    if (objectLayer) {
      const spawnObj = objectLayer.objects.find(
        (o) => o.type === "player_spawn"
      );
      if (spawnObj && spawnObj.x !== undefined && spawnObj.y !== undefined) {
        spawnX = spawnObj.x;
        spawnY = spawnObj.y;
      }
    }

    // 6. Create player controller at spawn point
    this.playerController = new PlayerController(this, spawnX, spawnY);

    // 7. Set collisions between player and collision layer
    if (collisionLayer) {
      this.physics.add.collider(
        this.playerController.sprite,
        collisionLayer
      );
    }

    // 8. Get NPC objects and create NPC manager
    const npcObjects = objectLayer
      ? objectLayer.objects.filter((o) => o.type === "npc")
      : [];

    this.npcManager = new NpcManager(
      this,
      npcObjects,
      this.playerController.sprite
    );

    // 8b. Fetch agent data from Supabase and enrich NPCs (fire-and-forget)
    this.fetchAndEnrichAgents();

    // 9. Set camera bounds to map dimensions
    const mapWidth = map.widthInPixels;
    const mapHeight = map.heightInPixels;
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    // 9b. Weather & lighting engines
    let weatherEngine = this.game.registry.get(
      "weatherEngine"
    ) as WeatherEngine | undefined;
    if (!weatherEngine) {
      weatherEngine = new WeatherEngine("temperate_deciduous_forest");
      this.game.registry.set("weatherEngine", weatherEngine);
    }
    weatherEngine.start();

    // Track layers for dynamic season tint updates
    this.tintedLayers = [groundLayer, decorationsLayer].filter(
      (l): l is Phaser.Tilemaps.TilemapLayer => l !== null
    );

    // Apply initial season tint
    this.lastAppliedSeason = weatherEngine.getCurrentSeason();
    const seasonTint = getSeasonTint(this.lastAppliedSeason);
    for (const layer of this.tintedLayers) layer.setTint(seasonTint);

    this.lightingEngine = new LightingEngine(this);
    this.weatherEffects = new WeatherEffects(this, weatherEngine);

    // 10. M key to return to regional map
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-M", () => {
        if (this.transitioning) return;
        this.transitioning = true;
        // Stop player movement immediately
        this.playerController?.sprite?.setVelocity(0);
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.cleanup();
          useWorldStore.getState().returnToRegionMap();
          this.scene.start("RegionMapScene");
        });
      });
    }

    // Register shutdown handler as safety net (cleanup also called explicitly on M key)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);

    // 11. Camera fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // 12. URL sync
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/world/arboria/market-town");
    }
  }

  update(): void {
    if (this.transitioning) return;

    if (this.playerController) {
      this.playerController.update();
    }
    if (this.npcManager && this.playerController) {
      this.npcManager.update(this.playerController.sprite);
    }
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
    if (we) {
      const currentSeason = we.getCurrentSeason();
      if (currentSeason !== this.lastAppliedSeason) {
        this.lastAppliedSeason = currentSeason;
        const tint = getSeasonTint(currentSeason);
        for (const layer of this.tintedLayers) layer.setTint(tint);
      }
    }
  }

  /**
   * Fetch agent records from Supabase and enrich NpcManager with real IDs.
   * Runs async after scene creation — NPCs work immediately from Tiled data,
   * Supabase data adds real agent IDs for interaction routing.
   */
  private async fetchAndEnrichAgents(): Promise<void> {
    try {
      const { data: agents, error } = await supabaseAnon
        .from("agents")
        .select("id, name, capabilities, status")
        .eq("settlement", "arboria_market_town");

      if (error || !agents) {
        console.warn("[SettlementScene] Failed to fetch agents:", error?.message);
        return;
      }

      // Enrich NpcManager with database IDs
      if (this.npcManager) {
        this.npcManager.enrichWithAgentData(agents);
      }
    } catch (err) {
      console.warn("[SettlementScene] Agent fetch error:", err);
    }
  }

  private cleanup(): void {
    if (this.lightingEngine) {
      this.lightingEngine.destroy();
    }
    if (this.weatherEffects) {
      this.weatherEffects.destroy();
    }
    if (this.npcManager) {
      this.npcManager.destroy();
    }
    if (this.playerController) {
      this.playerController.destroy();
    }
    useWorldStore.getState().setNearbyAgent(null);
  }
}
