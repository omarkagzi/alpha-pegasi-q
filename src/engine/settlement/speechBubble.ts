import Phaser from "phaser";

// ── Constants ─────────────────────────────────────────────────────
const BUBBLE_MAX_WIDTH = 120;
const BUBBLE_PADDING = 6;
const BUBBLE_DEPTH = 11; // above NPCs (10), below UI (20)
const TYPEWRITER_CHAR_DELAY = 40; // ms per character
const DEFAULT_DISPLAY_MS = 3000;
const FADE_DURATION_MS = 500;
const FONT_SIZE = 8;
const LINE_HEIGHT = 10;
const BUBBLE_BG_COLOR = 0x1a1a2e;
const BUBBLE_BORDER_COLOR = 0xc8a96e;
const THOUGHT_BG_COLOR = 0x1a1a2e;
const THOUGHT_BG_ALPHA = 0.85;
const TAIL_SIZE = 4;

export type BubbleStyle = "speech" | "thought";

interface SpeechBubbleConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  text: string;
  style?: BubbleStyle;
  displayMs?: number;
  onComplete?: () => void;
}

/**
 * SpeechBubble — a pixel-art speech or thought bubble rendered as Phaser
 * graphics + bitmap text above an NPC's world position.
 *
 * Features:
 * - Typewriter effect (characters revealed over time)
 * - Auto-fade after configurable duration
 * - Follows a target sprite if attached
 */
export class SpeechBubble {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private textObj: Phaser.GameObjects.Text;
  private fullText: string;
  private revealedChars = 0;
  private typewriterTimer: Phaser.Time.TimerEvent | null = null;
  private fadeTimer: Phaser.Time.TimerEvent | null = null;
  private targetSprite: Phaser.GameObjects.Sprite | null = null;
  private onComplete?: () => void;
  private destroyed = false;

  constructor(config: SpeechBubbleConfig) {
    const { scene, x, y, text, style = "speech", displayMs = DEFAULT_DISPLAY_MS, onComplete } = config;
    this.fullText = text;
    this.onComplete = onComplete;

    // Container holds all bubble elements
    this.container = scene.add.container(x, y);
    this.container.setDepth(BUBBLE_DEPTH);

    // Text object (hidden initially for typewriter)
    this.textObj = scene.add.text(0, 0, "", {
      fontFamily: "monospace",
      fontSize: `${FONT_SIZE}px`,
      color: "#e8d5b3",
      wordWrap: { width: BUBBLE_MAX_WIDTH - BUBBLE_PADDING * 2 },
      lineSpacing: LINE_HEIGHT - FONT_SIZE,
    });
    this.textObj.setOrigin(0.5, 1);

    // Calculate bubble dimensions from full text
    const tempText = scene.add.text(0, 0, text, {
      fontFamily: "monospace",
      fontSize: `${FONT_SIZE}px`,
      wordWrap: { width: BUBBLE_MAX_WIDTH - BUBBLE_PADDING * 2 },
      lineSpacing: LINE_HEIGHT - FONT_SIZE,
    });
    const textWidth = Math.min(tempText.width, BUBBLE_MAX_WIDTH - BUBBLE_PADDING * 2);
    const textHeight = tempText.height;
    tempText.destroy();

    const bubbleWidth = textWidth + BUBBLE_PADDING * 2;
    const bubbleHeight = textHeight + BUBBLE_PADDING * 2;

    // Background graphics
    this.bg = scene.add.graphics();
    const bgAlpha = style === "thought" ? THOUGHT_BG_ALPHA : 1;
    const bgColor = style === "thought" ? THOUGHT_BG_COLOR : BUBBLE_BG_COLOR;

    this.bg.lineStyle(1, BUBBLE_BORDER_COLOR, 1);
    this.bg.fillStyle(bgColor, bgAlpha);

    // Draw rounded rectangle for bubble body
    const bx = -bubbleWidth / 2;
    const by = -(bubbleHeight + TAIL_SIZE + 2);
    this.bg.fillRoundedRect(bx, by, bubbleWidth, bubbleHeight, 3);
    this.bg.strokeRoundedRect(bx, by, bubbleWidth, bubbleHeight, 3);

    // Draw tail
    if (style === "speech") {
      // Triangle tail pointing down
      this.bg.fillStyle(bgColor, bgAlpha);
      this.bg.fillTriangle(
        -TAIL_SIZE, by + bubbleHeight,
        TAIL_SIZE, by + bubbleHeight,
        0, by + bubbleHeight + TAIL_SIZE
      );
      this.bg.lineStyle(1, BUBBLE_BORDER_COLOR, 1);
      this.bg.lineBetween(-TAIL_SIZE, by + bubbleHeight, 0, by + bubbleHeight + TAIL_SIZE);
      this.bg.lineBetween(TAIL_SIZE, by + bubbleHeight, 0, by + bubbleHeight + TAIL_SIZE);
    } else {
      // Thought bubble: small dots trailing down
      this.bg.fillStyle(bgColor, bgAlpha);
      this.bg.fillCircle(0, by + bubbleHeight + 3, 2);
      this.bg.fillCircle(2, by + bubbleHeight + 7, 1.5);
    }

    // Position text centered in bubble
    this.textObj.setPosition(0, by + bubbleHeight - BUBBLE_PADDING);

    this.container.add([this.bg, this.textObj]);

    // Start typewriter effect
    this.typewriterTimer = scene.time.addEvent({
      delay: TYPEWRITER_CHAR_DELAY,
      repeat: text.length - 1,
      callback: () => {
        if (this.destroyed) return;
        this.revealedChars++;
        this.textObj.setText(this.fullText.slice(0, this.revealedChars));
      },
    });

    // Schedule auto-fade after typewriter completes + display duration
    const totalRevealMs = text.length * TYPEWRITER_CHAR_DELAY;
    this.fadeTimer = scene.time.addEvent({
      delay: totalRevealMs + displayMs,
      callback: () => this.fadeOut(scene),
    });
  }

  /** Attach to a sprite so the bubble follows it each frame. */
  attachTo(sprite: Phaser.GameObjects.Sprite): void {
    this.targetSprite = sprite;
    this.updatePosition();
  }

  /** Call in scene update to follow target sprite. */
  update(): void {
    if (this.targetSprite && !this.destroyed) {
      this.updatePosition();
    }
  }

  private updatePosition(): void {
    if (!this.targetSprite) return;
    this.container.setPosition(
      this.targetSprite.x,
      this.targetSprite.y - this.targetSprite.displayHeight / 2
    );
  }

  private fadeOut(scene: Phaser.Scene): void {
    if (this.destroyed) return;
    scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: FADE_DURATION_MS,
      onComplete: () => this.destroy(),
    });
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.typewriterTimer?.destroy();
    this.fadeTimer?.destroy();
    this.container.destroy();
    this.onComplete?.();
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }
}
