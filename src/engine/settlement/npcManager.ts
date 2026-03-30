import Phaser from "phaser";
import { useWorldStore } from "@/stores/worldStore";

// ── Constants ─────────────────────────────────────────────────────
const NPC_SPEED = 24; // ~30% of player speed (80)
const IDLE_MIN_MS = 2000;
const IDLE_MAX_MS = 5000;
const WANDER_RADIUS_TILES = 3;
const WALK_TIMEOUT_MS = 5000;
const STUCK_THRESHOLD_MS = 500;
const STUCK_VELOCITY = 1; // px/s
const TILE_SIZE = 16;
const MAP_TILES = 58; // map is 58x58

// ── Types ─────────────────────────────────────────────────────────
type WanderState = "idle" | "walking" | "paused";

interface NpcData {
  name: string;
  agentId: string;
  agentName: string;
  sprite: string;
  x: number;
  y: number;
  dbId?: string;
  capabilities?: string[];
  status?: string;
}

interface NpcInstance {
  data: NpcData;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  zone: Phaser.GameObjects.Zone;
  // Wander state
  state: WanderState;
  idleTimer: Phaser.Time.TimerEvent | null;
  walkTimer: Phaser.Time.TimerEvent | null;
  targetX: number;
  targetY: number;
  stuckTime: number; // ms accumulated at near-zero velocity
  lastDirection: "down" | "up" | "left" | "right";
  cols: number; // spritesheet columns for animation
  playerInZone: boolean;
}

/**
 * NpcManager — places NPCs from Tiled object layer data,
 * manages wandering AI, interaction zones, and animations.
 */
export class NpcManager {
  private scene: Phaser.Scene;
  private npcs: NpcInstance[] = [];
  private currentNearby: string | null = null;

  constructor(
    scene: Phaser.Scene,
    npcObjects: Phaser.Types.Tilemaps.TiledObject[],
    playerSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ) {
    this.scene = scene;

    for (const obj of npcObjects) {
      if (obj.type !== "agent" || !obj.x || !obj.y) continue;

      const props = this.getProperties(obj);
      const npcData: NpcData = {
        name: obj.name,
        agentId: props.agentId || `agent-${obj.name.toLowerCase()}`,
        agentName: props.agentName || obj.name,
        sprite: props.sprite || "chr-arthax",
        x: obj.x,
        y: obj.y,
      };

      this.createNpc(npcData, playerSprite);
    }
  }

  private getProperties(
    obj: Phaser.Types.Tilemaps.TiledObject
  ): Record<string, string> {
    const result: Record<string, string> = {};
    if (obj.properties) {
      for (const prop of obj.properties as Array<{
        name: string;
        value: string;
      }>) {
        result[prop.name] = String(prop.value);
      }
    }
    return result;
  }

  private createNpc(
    data: NpcData,
    playerSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ): void {
    // Create NPC sprite with dynamic body (same as player)
    const sprite = this.scene.physics.add.sprite(data.x, data.y, data.sprite, 0);
    sprite.setDepth(10);
    sprite.setCollideWorldBounds(true);

    // Detect spritesheet columns for animation
    const totalFrames = sprite.texture.frameTotal - 1;
    const cols = (totalFrames % 6 === 0 && totalFrames > 40) ? 6 : 5;

    // Interaction zone (~48px radius around NPC)
    const zone = this.scene.add
      .zone(data.x, data.y, 48, 48)
      .setOrigin(0.5, 0.5);
    this.scene.physics.add.existing(zone, true);

    // Detect player overlap with interaction zone
    this.scene.physics.add.overlap(
      playerSprite,
      zone,
      () => this.onPlayerNear(npc),
      undefined,
      this
    );

    const npc: NpcInstance = {
      data,
      sprite,
      zone,
      state: "idle",
      idleTimer: null,
      walkTimer: null,
      targetX: data.x,
      targetY: data.y,
      stuckTime: 0,
      lastDirection: "down",
      cols,
      playerInZone: false,
    };

    this.npcs.push(npc);

    // Start idle cycle
    this.startIdle(npc);
  }

  // ── Wander State Machine ──────────────────────────────────────

  private startIdle(npc: NpcInstance): void {
    npc.state = "idle";
    npc.sprite.setVelocity(0, 0);
    npc.stuckTime = 0;

    // Play idle animation for last direction
    this.playIdleAnim(npc);

    // Clear any existing timers
    npc.walkTimer?.destroy();
    npc.walkTimer = null;

    const delay = IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS);
    npc.idleTimer = this.scene.time.addEvent({
      delay,
      callback: () => {
        if (npc.state === "idle") {
          this.startWalking(npc);
        }
      },
    });
  }

  private startWalking(npc: NpcInstance): void {
    // If player is in zone, pause instead
    if (npc.playerInZone) {
      this.pauseWandering(npc);
      return;
    }

    npc.state = "walking";
    npc.stuckTime = 0;

    // Pick random target within wander radius, clamped to map bounds
    const currentTileX = Math.floor(npc.sprite.x / TILE_SIZE);
    const currentTileY = Math.floor(npc.sprite.y / TILE_SIZE);

    const offsetX = Math.floor(Math.random() * (WANDER_RADIUS_TILES * 2 + 1)) - WANDER_RADIUS_TILES;
    const offsetY = Math.floor(Math.random() * (WANDER_RADIUS_TILES * 2 + 1)) - WANDER_RADIUS_TILES;

    // Clamp to walled city interior (tiles 19–46) to keep NPCs inside walls
    const INNER_MIN = 19;
    const INNER_MAX = 46;
    const targetTileX = Math.max(INNER_MIN, Math.min(INNER_MAX, currentTileX + offsetX));
    const targetTileY = Math.max(INNER_MIN, Math.min(INNER_MAX, currentTileY + offsetY));

    npc.targetX = targetTileX * TILE_SIZE + TILE_SIZE / 2;
    npc.targetY = targetTileY * TILE_SIZE + TILE_SIZE / 2;

    // Set velocity toward target
    const dx = npc.targetX - npc.sprite.x;
    const dy = npc.targetY - npc.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 4) {
      // Already at target, just idle again
      this.startIdle(npc);
      return;
    }

    const vx = (dx / dist) * NPC_SPEED;
    const vy = (dy / dist) * NPC_SPEED;
    npc.sprite.setVelocity(vx, vy);

    // Determine direction for animation
    npc.lastDirection = this.getDirection(vx, vy);
    this.playWalkAnim(npc);

    // Walk timeout safety valve
    npc.walkTimer = this.scene.time.addEvent({
      delay: WALK_TIMEOUT_MS,
      callback: () => {
        if (npc.state === "walking") {
          this.startIdle(npc);
        }
      },
    });
  }

  private pauseWandering(npc: NpcInstance): void {
    npc.state = "paused";
    npc.sprite.setVelocity(0, 0);
    npc.idleTimer?.destroy();
    npc.idleTimer = null;
    npc.walkTimer?.destroy();
    npc.walkTimer = null;
    this.playIdleAnim(npc);
  }

  private resumeWandering(npc: NpcInstance): void {
    if (npc.state === "paused") {
      this.startIdle(npc);
    }
  }

  // ── Animation Helpers ─────────────────────────────────────────

  private getDirection(vx: number, vy: number): "down" | "up" | "left" | "right" {
    if (Math.abs(vx) > Math.abs(vy)) {
      return vx > 0 ? "right" : "left";
    }
    return vy > 0 ? "down" : "up";
  }

  private getRowForDirection(dir: "down" | "up" | "left" | "right"): number {
    // MinyWorld champion spritesheet row layout:
    // Row 0: walk down,  Row 1: walk right,  Row 2: walk up,  Row 3: walk left
    // Row 4+: attack animations (not used for wandering)
    switch (dir) {
      case "down": return 0;
      case "right": return 1;
      case "up": return 2;
      case "left": return 3;
    }
  }

  private playIdleAnim(npc: NpcInstance): void {
    const row = this.getRowForDirection(npc.lastDirection);
    const startFrame = row * npc.cols;
    // Set to first frame of walk row (standing still = idle)
    npc.sprite.setFrame(startFrame);
  }

  private playWalkAnim(npc: NpcInstance): void {
    const row = this.getRowForDirection(npc.lastDirection);
    const startFrame = row * npc.cols;
    const animKey = `npc-walk-${npc.data.agentId}-${npc.lastDirection}`;

    // Create animation if it doesn't exist yet
    if (!this.scene.anims.exists(animKey)) {
      const frames: number[] = [];
      for (let i = 0; i < npc.cols; i++) {
        frames.push(startFrame + i);
      }
      this.scene.anims.create({
        key: animKey,
        frames: frames.map(f => ({ key: npc.data.sprite, frame: f })),
        frameRate: 8,
        repeat: -1,
      });
    }

    npc.sprite.play(animKey, true);
  }

  // ── Interaction ───────────────────────────────────────────────

  private onPlayerNear(npc: NpcInstance): void {
    npc.playerInZone = true;

    // Pause wandering when player approaches
    if (npc.state === "walking") {
      this.pauseWandering(npc);
    } else if (npc.state === "idle") {
      this.pauseWandering(npc);
    }

    if (this.currentNearby === npc.data.agentId) return;
    this.currentNearby = npc.data.agentId;
    useWorldStore.getState().setNearbyAgent({
      id: npc.data.dbId || npc.data.agentId,
      name: npc.data.agentName,
    });
  }

  /**
   * Enrich NPC data with real agent records from Supabase.
   */
  enrichWithAgentData(
    agents: Array<{
      id: string;
      name: string;
      capabilities: string[] | null;
      status: string | null;
    }>
  ): void {
    for (const npc of this.npcs) {
      const match = agents.find(
        (a) => a.name.toLowerCase() === npc.data.agentName.toLowerCase()
      );
      if (match) {
        npc.data.dbId = match.id;
        npc.data.agentId = match.id;
        npc.data.capabilities = match.capabilities ?? undefined;
        npc.data.status = match.status ?? undefined;
      }
    }
  }

  /**
   * Get all NPC sprites for collision setup in SettlementScene.
   */
  getNpcSprites(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] {
    return this.npcs.map(n => n.sprite);
  }

  /**
   * Call in scene update() — handles zone tracking, stuck detection, arrival.
   */
  update(
    playerSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ): void {
    const dt = this.scene.game.loop.delta; // ms since last frame

    for (const npc of this.npcs) {
      // Sync interaction zone position to follow NPC
      npc.zone.setPosition(npc.sprite.x, npc.sprite.y);
      (npc.zone.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();

      // Check if player is still in zone
      const zoneBody = npc.zone.body as Phaser.Physics.Arcade.StaticBody;
      const playerBody = playerSprite.body;
      const inZone = Phaser.Geom.Intersects.RectangleToRectangle(
        new Phaser.Geom.Rectangle(zoneBody.x, zoneBody.y, zoneBody.width, zoneBody.height),
        new Phaser.Geom.Rectangle(playerBody.x, playerBody.y, playerBody.width, playerBody.height)
      );

      if (!inZone && npc.playerInZone) {
        npc.playerInZone = false;
        this.resumeWandering(npc);
      }

      // Walking state: check arrival and stuck detection
      if (npc.state === "walking") {
        const dx = npc.targetX - npc.sprite.x;
        const dy = npc.targetY - npc.sprite.y;
        const distToTarget = Math.sqrt(dx * dx + dy * dy);

        // Arrival check
        if (distToTarget < 4) {
          this.startIdle(npc);
          continue;
        }

        // Stuck detection: if velocity is near-zero for too long
        const vel = npc.sprite.body.velocity;
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        if (speed < STUCK_VELOCITY) {
          npc.stuckTime += dt;
          if (npc.stuckTime > STUCK_THRESHOLD_MS) {
            this.startIdle(npc);
            continue;
          }
        } else {
          npc.stuckTime = 0;
        }

        // Update walk animation direction if velocity changed significantly
        const newDir = this.getDirection(vel.x, vel.y);
        if (newDir !== npc.lastDirection && speed > STUCK_VELOCITY) {
          npc.lastDirection = newDir;
          this.playWalkAnim(npc);
        }
      }
    }

    // Clear nearby agent if player left all zones
    if (this.currentNearby) {
      const anyNear = this.npcs.some(n => n.playerInZone);
      if (!anyNear) {
        this.currentNearby = null;
        useWorldStore.getState().setNearbyAgent(null);
      }
    }
  }

  destroy(): void {
    for (const npc of this.npcs) {
      npc.idleTimer?.destroy();
      npc.walkTimer?.destroy();
      npc.sprite.destroy();
      npc.zone.destroy();
    }
    this.npcs = [];
    this.currentNearby = null;
  }
}
