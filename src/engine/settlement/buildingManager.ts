import Phaser from "phaser";

interface BuildingInstance {
  name: string;
  sprite: Phaser.GameObjects.Sprite;
  body?: Phaser.Physics.Arcade.StaticBody;
}

/**
 * BuildingManager — creates Phaser sprites from Tiled "building" objects.
 * Each building is a single 16×16 sprite from a MinyWorld spritesheet.
 */
export class BuildingManager {
  private buildings: BuildingInstance[] = [];
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup;

  constructor(
    private scene: Phaser.Scene,
    buildingObjects: Phaser.Types.Tilemaps.TiledObject[]
  ) {
    this.collisionGroup = scene.physics.add.staticGroup();

    for (const obj of buildingObjects) {
      const validTypes = ["building", "decoration", "wall"];
      if (!validTypes.includes(obj.type!) || !obj.x || !obj.y) continue;

      const props = this.getProperties(obj);
      const spriteKey = props.spriteKey;
      const frame = parseInt(props.frame || "0", 10);

      if (!spriteKey) {
        console.warn(`[BuildingManager] Missing spriteKey for ${obj.name}`);
        continue;
      }

      const sprite = scene.add.sprite(
        obj.x + 8, // Center on tile (Tiled uses top-left origin)
        obj.y + 8,
        spriteKey,
        frame
      );
      sprite.setDepth(5);

      // Add static physics body for collision (buildings and walls only, not decorations)
      if (obj.type !== "decoration") {
        scene.physics.add.existing(sprite, true);
        this.collisionGroup.add(sprite);
      }

      this.buildings.push({
        name: obj.name,
        sprite,
        body: obj.type !== "decoration"
          ? (sprite.body as Phaser.Physics.Arcade.StaticBody)
          : undefined,
      });
    }
  }

  private getProperties(obj: Phaser.Types.Tilemaps.TiledObject): Record<string, string> {
    const result: Record<string, string> = {};
    if (obj.properties) {
      for (const prop of obj.properties as Array<{ name: string; value: string | number }>) {
        result[prop.name] = String(prop.value);
      }
    }
    return result;
  }

  getCollisionGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.collisionGroup;
  }

  destroy(): void {
    for (const bld of this.buildings) {
      bld.sprite.destroy();
    }
    this.buildings = [];
    this.collisionGroup.destroy(true);
  }
}
