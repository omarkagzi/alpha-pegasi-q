import Phaser from "phaser";

/**
 * SettlementScene — top-down WASD walkable view of Arboria market town.
 * Renders the Tiled tilemap, player movement, NPC agents, collision,
 * weather effects, and day/night lighting.
 */
export class SettlementScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() {
    super({ key: "SettlementScene" });
  }

  create(): void {
    // Camera fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Placeholder — will be replaced with full tilemap in Step 5
    this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY - 20, "Arboria Market Town", {
        fontSize: "12px",
        color: "#658a43",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);

    this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY + 5, "WASD to move (coming soon)", {
        fontSize: "8px",
        color: "#ffffff80",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);

    // M key to return to regional map
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-M", () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("RegionMapScene");
        });
      });
    }

    // Hint for M key
    this.add
      .text(this.cameras.main.centerX, this.cameras.main.height - 15, "Press M for map", {
        fontSize: "8px",
        color: "#ffffff40",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);
  }
}
