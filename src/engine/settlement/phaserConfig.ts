import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { RegionMapScene } from "./scenes/RegionMapScene";
import { SettlementScene } from "./scenes/SettlementScene";

/**
 * Creates the Phaser.Game configuration for the Arboria 2D game layer.
 * The game renders into a provided parent DOM element.
 *
 * Base resolution: 320×240 (20×15 tiles at 16px).
 * Rendered at 3× zoom for crisp pixel art on modern displays.
 */
export function createPhaserConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: 320,
    height: 240,
    zoom: 3,
    parent,
    pixelArt: true,
    backgroundColor: "#0a0d08",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, RegionMapScene, SettlementScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: false,
      roundPixels: true,
    },
  };
}
