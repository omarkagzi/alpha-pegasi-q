import Phaser from "phaser";

/**
 * RegionMapScene — 2D pixel-art regional overview of the Arboria biome.
 * Shows terrain, settlement markers, weather overlay, and day/night lighting.
 * Clicking the market town marker transitions to SettlementScene.
 */
export class RegionMapScene extends Phaser.Scene {
  constructor() {
    super({ key: "RegionMapScene" });
  }

  create(): void {
    // Camera fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Placeholder — will be replaced with full tilemap in Step 4
    this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY - 20, "Arboria Region", {
        fontSize: "12px",
        color: "#658a43",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);

    // Clickable market town marker (placeholder)
    const marker = this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY + 10, "[Market Town]", {
        fontSize: "10px",
        color: "#d4870a",
        fontFamily: "monospace",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    marker.on("pointerover", () => marker.setColor("#ffb040"));
    marker.on("pointerout", () => marker.setColor("#d4870a"));
    marker.on("pointerdown", () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("SettlementScene");
      });
    });
  }
}
