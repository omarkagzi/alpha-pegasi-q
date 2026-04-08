import Phaser from "phaser";
import { PlayerController } from "../playerController";
import { NpcManager } from "../npcManager";
import { BuildingManager } from "../buildingManager";
import { WorldEventRenderer } from "../worldEventRenderer";
import { useWorldStore, type WorldEvent } from "@/stores/worldStore";
import { WeatherEngine } from "@/engine/region/weatherEngine";
import { LightingEngine } from "@/engine/region/lightingEngine";
import { WeatherEffects } from "../weatherEffects";
import { getSeasonTint } from "@/engine/region/seasonEngine";
import { supabaseAnon } from "@/lib/supabase/anonClient";
import { TERRAIN, TILEMAP } from "../assetManifest";

/**
 * SettlementScene — top-down WASD walkable view of Arboria market town.
 * Renders the Tiled tilemap, player movement, NPC agents, collision,
 * weather effects, and day/night lighting.
 */
export class SettlementScene extends Phaser.Scene {
  private playerController!: PlayerController;
  private npcManager!: NpcManager;
  private buildingManager!: BuildingManager;
  private worldEventRenderer!: WorldEventRenderer;
  private lightingEngine!: LightingEngine;
  private weatherEffects!: WeatherEffects;
  private transitioning = false;
  private _chatUnsub?: () => void;
  private _realtimeChannel?: ReturnType<typeof supabaseAnon.channel>;
  private lastAppliedSeason = "";
  private tintedLayers: Phaser.Tilemaps.TilemapLayer[] = [];

  constructor() {
    super({ key: "SettlementScene" });
  }

  create(): void {
    this.transitioning = false;

    // 1. Load tilemap
    const map = this.make.tilemap({ key: TILEMAP.key });

    // 2. Add MinyWorld full tileset (AllAssetsPreview.png)
    const tileset = map.addTilesetImage(TERRAIN.key, TERRAIN.key);

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

    // 3. Create tile layers (matching Tiled export layer names)
    const grassLayer = map.createLayer("Grass", tileset);
    const roadLayer = map.createLayer("Road", tileset);
    const waterLayer = map.createLayer("Water", tileset);
    const wallLayer = map.createLayer("Wall Structure", tileset);
    const buildingsLayer = map.createLayer("Buildings", tileset);
    const treeLayer = map.createLayer("Tree", tileset);
    const wheatLayer = map.createLayer("Wheat", tileset);

    grassLayer?.setDepth(0);
    roadLayer?.setDepth(1);
    waterLayer?.setDepth(2);
    wallLayer?.setDepth(3);
    buildingsLayer?.setDepth(4);
    treeLayer?.setDepth(5);
    wheatLayer?.setDepth(6);

    // 4. Collision — wall, building, tree, and water tiles block the player
    wallLayer?.setCollisionByExclusion([-1, 0]);
    buildingsLayer?.setCollisionByExclusion([-1, 0]);
    treeLayer?.setCollisionByExclusion([-1, 0]);
    waterLayer?.setCollisionByExclusion([-1, 0]);

    // 4a. Bridge/gate tiles on the wall layer should be walkable.
    // These tile IDs form the gate/bridge structures in the MinyWorld tileset.
    const BRIDGE_TILE_IDS = [
      890,
      1032, 1033, 1034, 1035, 1036,
      1103, 1104, 1105, 1106, 1107,
      1174, 1175, 1176, 1177, 1178,
    ];
    if (wallLayer) {
      for (const tileId of BRIDGE_TILE_IDS) {
        wallLayer.setCollision(tileId, false);
      }
    }

    // 4b. Remove water collision under bridge positions (where bridge wall tiles exist)
    if (waterLayer && wallLayer) {
      for (let ty = 0; ty < map.height; ty++) {
        for (let tx = 0; tx < map.width; tx++) {
          const wallTile = wallLayer.getTileAt(tx, ty);
          if (wallTile && BRIDGE_TILE_IDS.includes(wallTile.index)) {
            const waterTile = waterLayer.getTileAt(tx, ty);
            if (waterTile) {
              waterTile.setCollision(false, false, false, false);
            }
          }
        }
      }
    }

    // 5. Get object layer
    const objectLayer = map.getObjectLayer("interactions");
    let spawnX = 29 * 16;  // center of 58-wide map
    let spawnY = 40 * 16; // near south gate area

    if (objectLayer) {
      const spawnObj = objectLayer.objects.find((o) => o.type === "player_spawn");
      if (spawnObj?.x !== undefined && spawnObj?.y !== undefined) {
        spawnX = spawnObj.x;
        spawnY = spawnObj.y;
      }
    }

    // 6. Create buildings from object layer
    const renderableTypes = ["building", "decoration", "wall"];
    const buildingObjects = objectLayer
      ? objectLayer.objects.filter((o) => renderableTypes.includes(o.type!))
      : [];
    this.buildingManager = new BuildingManager(this, buildingObjects);

    // 7. Create player
    this.playerController = new PlayerController(this, spawnX, spawnY);

    // 8. Collisions — player vs wall/building/tree/water tile layers + building sprites
    const collisionLayers = [wallLayer, buildingsLayer, treeLayer, waterLayer].filter(
      (l): l is Phaser.Tilemaps.TilemapLayer => l !== null
    );
    for (const layer of collisionLayers) {
      this.physics.add.collider(this.playerController.sprite, layer);
    }
    this.physics.add.collider(
      this.playerController.sprite,
      this.buildingManager.getCollisionGroup()
    );

    // 9. NPCs
    const npcObjects = objectLayer
      ? objectLayer.objects.filter((o) => o.type === "agent")
      : [];
    this.npcManager = new NpcManager(this, npcObjects, this.playerController.sprite);

    // 9a. NPC collision with tile layers (same as player)
    for (const npcSprite of this.npcManager.getNpcSprites()) {
      for (const layer of collisionLayers) {
        this.physics.add.collider(npcSprite, layer);
      }
    }

    // 9a-2. World event renderer — plays heartbeat events as visual sequences
    this.worldEventRenderer = new WorldEventRenderer(this, this.npcManager);

    this.fetchAndEnrichAgents();

    // 9a-3. Subscribe to Supabase Realtime for world events
    this.subscribeToWorldEvents();

    // 9. Set camera and physics world bounds to map dimensions
    const mapWidth = map.widthInPixels;
    const mapHeight = map.heightInPixels;
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

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
    this.tintedLayers = [grassLayer, roadLayer, waterLayer, wallLayer, buildingsLayer, treeLayer, wheatLayer].filter(
      (l): l is Phaser.Tilemaps.TilemapLayer => l !== null
    );

    // Apply initial season tint
    this.lastAppliedSeason = weatherEngine.getCurrentSeason();
    const seasonTint = getSeasonTint(this.lastAppliedSeason);
    for (const layer of this.tintedLayers) layer.setTint(seasonTint);

    this.lightingEngine = new LightingEngine(this);
    this.weatherEffects = new WeatherEffects(this, weatherEngine);

    // 10a. E key to interact with nearby agent (open chat)
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-E", () => {
        if (this.transitioning) return;
        const store = useWorldStore.getState();
        if (store.activeChat) return; // already in chat
        if (!store.nearbyAgent) return; // no agent nearby

        // Disable player movement and open chat
        this.playerController.disable();
        store.openChat(store.nearbyAgent.id, store.nearbyAgent.name);
      });
    }

    // 10b. Listen for chat close to re-enable player
    let wasChatOpen = false;
    const unsubChat = useWorldStore.subscribe((state) => {
      const isChatOpen = state.activeChat !== null;
      if (wasChatOpen && !isChatOpen && this.playerController) {
        this.playerController.enable();
      }
      wasChatOpen = isChatOpen;
    });
    // Store unsub for cleanup
    this._chatUnsub = unsubChat;

    // 10c. M key to return to regional map
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-M", () => {
        if (this.transitioning) return;
        if (useWorldStore.getState().activeChat) return; // block map exit while chatting
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
    if (this.worldEventRenderer) {
      this.worldEventRenderer.update();
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

  /**
   * Subscribe to Supabase Realtime channel for world heartbeat events.
   * Events are enqueued into the WorldEventRenderer and added to the store
   * for the Activity Feed.
   */
  private subscribeToWorldEvents(): void {
    const settlement = useWorldStore.getState().currentSettlement || "arboria_market_town";
    this._realtimeChannel = supabaseAnon.channel(`world-events:${settlement}`);

    this._realtimeChannel
      .on("broadcast", { event: "heartbeat" }, (payload) => {
        const events = payload.payload?.events as WorldEvent[] | undefined;
        if (!events || events.length === 0) return;

        // Feed into Phaser event renderer
        this.worldEventRenderer.enqueue(events);

        // Feed into Zustand store for React Activity Feed
        useWorldStore.getState().addWorldEvents(events);
      })
      .subscribe();

    // Load recent events so the bulletin isn't empty on arrival
    this.loadRecentEvents();
  }

  /** Fetch the most recent events from the database to seed the Town Bulletin. */
  private async loadRecentEvents(): Promise<void> {
    try {
      const { data: events, error } = await supabaseAnon
        .from("agent_events")
        .select("id, event_type, event_category, involved_agents, location, description, dialogue, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error || !events || events.length === 0) return;

      useWorldStore.getState().addWorldEvents(events as WorldEvent[]);
    } catch (err) {
      console.warn("[SettlementScene] Failed to load recent events:", err);
    }
  }

  private cleanup(): void {
    if (this._chatUnsub) this._chatUnsub();
    if (this._realtimeChannel) {
      supabaseAnon.removeChannel(this._realtimeChannel);
    }
    if (this.worldEventRenderer) this.worldEventRenderer.destroy();
    if (this.lightingEngine) this.lightingEngine.destroy();
    if (this.weatherEffects) this.weatherEffects.destroy();
    if (this.buildingManager) this.buildingManager.destroy();
    if (this.npcManager) this.npcManager.destroy();
    if (this.playerController) this.playerController.destroy();
    useWorldStore.getState().setNearbyAgent(null);
    useWorldStore.getState().closeChat();
  }
}
