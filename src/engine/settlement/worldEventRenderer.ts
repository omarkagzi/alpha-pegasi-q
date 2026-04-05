import Phaser from "phaser";
import { NpcManager } from "./npcManager";
import { SpeechBubble } from "./speechBubble";
import type { WorldEvent } from "@/stores/worldStore";

// ── Constants ─────────────────────────────────────────────────────
const STAGGER_INTERVAL_MS = 90_000; // 90 seconds between events
const FIRST_EVENT_DELAY_MS = 2_000; // first event plays 2s after arrival
const PLAYED_CLEANUP_MS = 300_000; // remove played events after 5 min

// Event type durations (ms)
const EVENT_DURATIONS: Record<string, number> = {
  conversation: 14_000,
  activity: 9_000,
  observation: 7_000,
  trade: 9_000,
  reaction: 4_500,
};

interface QueuedEvent {
  event: WorldEvent;
  playAt: number;
  played: boolean;
}

/**
 * WorldEventRenderer — receives world events from Supabase Realtime broadcasts,
 * queues them, and renders visual sequences using NPC sprites from npcManager.
 *
 * Events are staggered across the 6-minute heartbeat window so the world
 * has a steady rhythm, not bursts.
 */
export class WorldEventRenderer {
  private scene: Phaser.Scene;
  private npcManager: NpcManager;
  private queue: QueuedEvent[] = [];
  private activeBubbles: SpeechBubble[] = [];
  private playingEvent = false;

  constructor(scene: Phaser.Scene, npcManager: NpcManager) {
    this.scene = scene;
    this.npcManager = npcManager;
  }

  /**
   * Enqueue one or more events from a heartbeat broadcast.
   * Events are staggered so they play out over time.
   */
  enqueue(events: WorldEvent[]): void {
    for (const event of events) {
      // Skip if already queued
      if (this.queue.some(q => q.event.id === event.id)) continue;

      const playAt = this.queue.length === 0
        ? Date.now() + FIRST_EVENT_DELAY_MS
        : this.queue[this.queue.length - 1].playAt + STAGGER_INTERVAL_MS;

      this.queue.push({ event, playAt, played: false });
    }
  }

  /**
   * Call in scene update() every frame.
   * Checks if any queued events should play, and updates active bubbles.
   */
  update(): void {
    const now = Date.now();

    // Play next event if ready and nothing currently playing
    if (!this.playingEvent) {
      for (const queued of this.queue) {
        if (!queued.played && now >= queued.playAt) {
          this.playEvent(queued);
          break;
        }
      }
    }

    // Update active bubbles (follow their target sprites)
    for (const bubble of this.activeBubbles) {
      bubble.update();
    }

    // Clean up played events older than 5 minutes
    this.queue = this.queue.filter(
      q => !q.played || now - q.playAt < PLAYED_CLEANUP_MS
    );

    // Clean up destroyed bubbles
    this.activeBubbles = this.activeBubbles.filter(b => !b.isDestroyed());
  }

  private playEvent(queued: QueuedEvent): void {
    queued.played = true;
    const event = queued.event;

    switch (event.event_type) {
      case "conversation":
        this.playConversation(event);
        break;
      case "activity":
        this.playActivity(event);
        break;
      case "observation":
        this.playObservation(event);
        break;
      case "trade":
        this.playTrade(event);
        break;
      case "reaction":
        this.playReaction(event);
        break;
      default:
        this.playActivity(event);
    }
  }

  /**
   * Conversation: Both agents stop, speech bubbles show dialogue.
   */
  private playConversation(event: WorldEvent): void {
    const agentIds = event.involved_agents;
    if (agentIds.length < 2) {
      this.playActivity(event);
      return;
    }

    const [agentA, agentB] = agentIds;
    const spriteA = this.npcManager.pauseAgent(agentA);
    const spriteB = this.npcManager.pauseAgent(agentB);

    if (!spriteA || !spriteB) {
      // Can't find both NPCs, fall back to simpler rendering
      if (spriteA) this.npcManager.resumeAgent(agentA);
      if (spriteB) this.npcManager.resumeAgent(agentB);
      this.playActivity(event);
      return;
    }

    this.playingEvent = true;

    // Parse dialogue lines if available
    const lines = this.parseDialogue(event.dialogue || event.description);
    const totalDuration = EVENT_DURATIONS.conversation!;
    const lineDelay = Math.floor(totalDuration / (lines.length + 1));

    // Show dialogue bubbles one at a time
    lines.forEach((line, i) => {
      this.scene.time.addEvent({
        delay: lineDelay * (i + 1),
        callback: () => {
          // Alternate between the two agents
          const targetSprite = i % 2 === 0 ? spriteA : spriteB;
          const bubble = new SpeechBubble({
            scene: this.scene,
            x: targetSprite.x,
            y: targetSprite.y - targetSprite.displayHeight / 2,
            text: this.truncateText(line, 60),
            style: "speech",
            displayMs: lineDelay - 500,
          });
          bubble.attachTo(targetSprite);
          this.activeBubbles.push(bubble);
        },
      });
    });

    // Release agents after sequence
    this.scene.time.addEvent({
      delay: totalDuration,
      callback: () => {
        this.npcManager.resumeAgent(agentA);
        this.npcManager.resumeAgent(agentB);
        this.playingEvent = false;
      },
    });
  }

  /**
   * Activity: Single agent stops, floating text shows description.
   */
  private playActivity(event: WorldEvent): void {
    const agentId = event.involved_agents[0];
    if (!agentId) return;

    const sprite = this.npcManager.pauseAgent(agentId);
    if (!sprite) return;

    this.playingEvent = true;

    // Show activity description as speech bubble
    const bubble = new SpeechBubble({
      scene: this.scene,
      x: sprite.x,
      y: sprite.y - sprite.displayHeight / 2,
      text: this.truncateText(event.description, 80),
      style: "speech",
      displayMs: EVENT_DURATIONS.activity! - 2000,
    });
    bubble.attachTo(sprite);
    this.activeBubbles.push(bubble);

    this.scene.time.addEvent({
      delay: EVENT_DURATIONS.activity!,
      callback: () => {
        this.npcManager.resumeAgent(agentId);
        this.playingEvent = false;
      },
    });
  }

  /**
   * Observation: Agent pauses, thought bubble appears.
   */
  private playObservation(event: WorldEvent): void {
    const agentId = event.involved_agents[0];
    if (!agentId) return;

    const sprite = this.npcManager.pauseAgent(agentId);
    if (!sprite) return;

    this.playingEvent = true;

    const bubble = new SpeechBubble({
      scene: this.scene,
      x: sprite.x,
      y: sprite.y - sprite.displayHeight / 2,
      text: this.truncateText(event.description, 60),
      style: "thought",
      displayMs: EVENT_DURATIONS.observation! - 2000,
    });
    bubble.attachTo(sprite);
    this.activeBubbles.push(bubble);

    this.scene.time.addEvent({
      delay: EVENT_DURATIONS.observation!,
      callback: () => {
        this.npcManager.resumeAgent(agentId);
        this.playingEvent = false;
      },
    });
  }

  /**
   * Trade: Agent stops, speech bubble with trade description.
   */
  private playTrade(event: WorldEvent): void {
    this.playActivity(event); // same visual treatment as activity
  }

  /**
   * Reaction: Brief bubble, quick fade.
   */
  private playReaction(event: WorldEvent): void {
    const agentId = event.involved_agents[0];
    if (!agentId) return;

    const sprite = this.npcManager.pauseAgent(agentId);
    if (!sprite) return;

    this.playingEvent = true;

    const bubble = new SpeechBubble({
      scene: this.scene,
      x: sprite.x,
      y: sprite.y - sprite.displayHeight / 2,
      text: this.truncateText(event.description, 40),
      style: "speech",
      displayMs: EVENT_DURATIONS.reaction! - 1500,
    });
    bubble.attachTo(sprite);
    this.activeBubbles.push(bubble);

    this.scene.time.addEvent({
      delay: EVENT_DURATIONS.reaction!,
      callback: () => {
        this.npcManager.resumeAgent(agentId);
        this.playingEvent = false;
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────

  private parseDialogue(text: string): string[] {
    // Split on newlines or sentence-like boundaries
    const lines = text
      .split(/\n|(?<=[.!?])\s+/)
      .map(l => l.trim())
      .filter(l => l.length > 0);
    // Limit to 4 lines max for conversation bubbles
    return lines.slice(0, 4);
  }

  private truncateText(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen - 3) + "...";
  }

  destroy(): void {
    for (const bubble of this.activeBubbles) {
      bubble.destroy();
    }
    this.activeBubbles = [];
    this.queue = [];
  }
}
