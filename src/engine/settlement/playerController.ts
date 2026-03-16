import Phaser from "phaser";

const SPEED = 80;

/**
 * PlayerController — handles WASD/arrow movement, walk animations,
 * collision, and camera follow for the settlement scene.
 */
export class PlayerController {
  public sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private scene: Phaser.Scene;
  private facing: "down" | "up" | "left" | "right" = "down";
  private destroyed = false;

  constructor(scene: Phaser.Scene, spawnX: number, spawnY: number) {
    this.scene = scene;

    // Create player sprite with physics
    this.sprite = scene.physics.add.sprite(spawnX, spawnY, "player", 0);
    this.sprite.setSize(12, 12); // Slightly smaller hitbox than 16x16 for smoother movement
    this.sprite.setOffset(2, 4);
    this.sprite.setDepth(10);

    // Set up input
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Create walk animations (4 directions, 4 frames each)
    // Spritesheet layout: row 0 = down, row 1 = left, row 2 = right, row 3 = up
    this.createAnimations(scene);

    // Camera follow with deadzone
    scene.cameras.main.startFollow(this.sprite, true, 0.1, 0.1);
    scene.cameras.main.setDeadzone(80, 60);
  }

  private createAnimations(scene: Phaser.Scene): void {
    const directions: Array<{ key: string; row: number }> = [
      { key: "walk-down", row: 0 },
      { key: "walk-left", row: 1 },
      { key: "walk-right", row: 2 },
      { key: "walk-up", row: 3 },
    ];

    for (const dir of directions) {
      if (!scene.anims.exists(dir.key)) {
        scene.anims.create({
          key: dir.key,
          frames: scene.anims.generateFrameNumbers("player", {
            start: dir.row * 4,
            end: dir.row * 4 + 3,
          }),
          frameRate: 8,
          repeat: -1,
        });
      }
    }
  }

  update(): void {
    if (this.destroyed || !this.sprite.body) return;

    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;

    // Reset velocity
    this.sprite.setVelocity(0);

    // Calculate movement
    let vx = 0;
    let vy = 0;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const factor = Math.SQRT1_2; // 1/sqrt(2)
      vx *= factor;
      vy *= factor;
    }

    this.sprite.setVelocity(vx * SPEED, vy * SPEED);

    // Determine facing direction and play animation
    if (vx !== 0 || vy !== 0) {
      // Prioritize horizontal for diagonal movement
      if (Math.abs(vx) >= Math.abs(vy)) {
        this.facing = vx < 0 ? "left" : "right";
      } else {
        this.facing = vy < 0 ? "up" : "down";
      }
      this.sprite.anims.play(`walk-${this.facing}`, true);
    } else {
      // Idle: stop animation, show first frame of current direction
      this.sprite.anims.stop();
      const idleFrames: Record<string, number> = {
        down: 0,
        left: 4,
        right: 8,
        up: 12,
      };
      this.sprite.setFrame(idleFrames[this.facing]);
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.sprite.destroy();
  }
}
