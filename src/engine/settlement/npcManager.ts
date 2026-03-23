import Phaser from "phaser";
import { useWorldStore } from "@/stores/worldStore";

interface NpcData {
  name: string;
  agentId: string;
  agentName: string;
  sprite: string;
  x: number;
  y: number;
  /** Database UUID from Supabase agents table (set after async enrichment) */
  dbId?: string;
  capabilities?: string[];
  status?: string;
}

interface NpcInstance {
  data: NpcData;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
  zone: Phaser.GameObjects.Zone;
  idleTimer: Phaser.Time.TimerEvent;
}

/**
 * NpcManager — places NPCs from Tiled object layer data,
 * manages interaction zones and idle animations.
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
        sprite: props.sprite || "npc-assistant",
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
    // Create NPC sprite (static body — NPCs don't move in MVP)
    const sprite = this.scene.physics.add.staticSprite(
      data.x,
      data.y,
      data.sprite,
      0
    );
    sprite.setDepth(10);

    // Interaction zone (~32px radius around NPC)
    const zone = this.scene.add
      .zone(data.x, data.y, 48, 48)
      .setOrigin(0.5, 0.5);
    this.scene.physics.add.existing(zone, true); // static body

    // Detect player overlap with interaction zone
    this.scene.physics.add.overlap(
      playerSprite,
      zone,
      () => this.onPlayerNear(data),
      undefined,
      this
    );

    // Idle animation: toggle between frames 0 and 1 every 800ms
    const idleTimer = this.scene.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => {
        const currentFrame = sprite.frame.name;
        sprite.setFrame(currentFrame === "0" ? 1 : 0);
      },
    });

    this.npcs.push({ data, sprite, zone, idleTimer });
  }

  /**
   * Enrich NPC data with real agent records from Supabase.
   * Matches by name (case-insensitive). Updates agentId to the real
   * database UUID for correct interaction routing in Phase 3.
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

  private onPlayerNear(data: NpcData): void {
    if (this.currentNearby === data.agentId) return;
    this.currentNearby = data.agentId;
    useWorldStore.getState().setNearbyAgent({
      id: data.dbId || data.agentId,
      name: data.agentName,
    });
  }

  /**
   * Call in scene update() to check if player has left all NPC zones.
   */
  update(
    playerSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ): void {
    if (!this.currentNearby) return;

    // Check if player is still overlapping any NPC zone
    let stillNear = false;
    for (const npc of this.npcs) {
      const zoneBody = npc.zone.body as Phaser.Physics.Arcade.StaticBody;
      const playerBody = playerSprite.body;

      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          new Phaser.Geom.Rectangle(
            zoneBody.x,
            zoneBody.y,
            zoneBody.width,
            zoneBody.height
          ),
          new Phaser.Geom.Rectangle(
            playerBody.x,
            playerBody.y,
            playerBody.width,
            playerBody.height
          )
        )
      ) {
        stillNear = true;
        break;
      }
    }

    if (!stillNear) {
      this.currentNearby = null;
      useWorldStore.getState().setNearbyAgent(null);
    }
  }

  destroy(): void {
    for (const npc of this.npcs) {
      npc.idleTimer.destroy();
      npc.sprite.destroy();
      npc.zone.destroy();
    }
    this.npcs = [];
    this.currentNearby = null;
  }
}
