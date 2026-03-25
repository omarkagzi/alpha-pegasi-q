# NPC Simple Wandering — Design Spec

**Goal:** Make NPCs feel alive by giving them dynamic physics bodies, tilemap collision, and simple random wandering behavior within the walled city.

**Scope:** Movement + collision + spawn fixes only. Agent-to-agent interaction is out of scope (separate future design).

---

## Current State

NPCs are `staticSprite` objects frozen at hardcoded pixel coordinates. They have:
- No movement
- No collision with tilemap layers (walls, buildings, trees)
- No awareness of walkable vs. blocked tiles
- Spawn positions that land on top of buildings

The player already has dynamic physics, tilemap collision, and WASD movement — NPCs need the same foundation.

---

## Design

### 1. Dynamic Physics Bodies

Switch NPCs from `scene.physics.add.staticSprite()` to `scene.physics.add.sprite()`. This gives them velocity, acceleration, and collision response — same as the player.

The `NpcInstance` interface must update its sprite type from `Phaser.Types.Physics.Arcade.SpriteWithStaticBody` to `Phaser.Types.Physics.Arcade.SpriteWithDynamicBody`.

All NPC sprites must call `sprite.setCollideWorldBounds(true)` to prevent walking off the map edge.

### 2. Tilemap Collision

NPCs collide with the same 3 tile layers the player does:
- Wall Structure
- Buildings
- Tree

NPCs do **NOT** collide with:
- Each other (avoids stuck-in-doorway gridlock)
- The player (avoids blocking player movement)

Collision is set up in `SettlementScene.ts` by adding `physics.add.collider(npcSprite, layer)` for each NPC against each collision layer. The NpcManager must expose an array of NPC sprites (or a Phaser Group) so SettlementScene can wire up colliders.

### 3. Wandering AI

Each NPC runs an independent wander loop:

```
STATE: IDLE
  → Wait 2–5 seconds (random)
  → Pick a random target tile within 3-tile radius
  → Clamp target to map bounds (0–17 on both axes)
  → Transition to WALKING

STATE: WALKING
  → Set velocity toward target (30% of player speed)
  → Play directional walk animation
  → On arrival (within 2px of target): stop, transition to IDLE
  → On stuck (velocity magnitude < 1 px/s for > 0.5s): stop, transition to IDLE
  → On timeout (5 seconds max walk time): stop, transition to IDLE

STATE: PAUSED
  → When player is in the NPC's interaction zone, freeze wandering
  → Resume IDLE when player leaves
```

No pathfinding. If an NPC walks into a wall, the stuck detection catches it and transitions back to IDLE for a new target. On an 18×18 map with open grass areas inside the walls, this is sufficient — agents will look like they're casually strolling around.

### 4. Walk Animation

The MinyWorld character spritesheets have directional walk frames in a row-based layout. The direction mapping (verified from spritesheet structure):

| Row | Animation |
|-----|-----------|
| 0 | idle-down |
| 1 | walk-down |
| 2 | idle-right |
| 3 | walk-right |
| 4 | idle-up |
| 5 | walk-up |
| 6 | idle-left (or flip right) |
| 7 | walk-left (or flip right) |

Direction selection uses absolute velocity: if `|dx| > |dy|`, use horizontal animation (right if dx > 0, left if dx < 0); otherwise use vertical (down if dy > 0, up if dy < 0).

When an NPC stops walking, it plays the idle animation for the last walk direction (not always idle-down). This requires tracking `lastDirection` per NPC.

### 5. Spawn Position Fixes

Move all 5 agent spawn coordinates in `Walled City Map - Arboria.json` to walkable grass tiles. A tile is walkable if the Wall Structure, Buildings, and Tree layers all have value 0 (empty) at that position. Validate each spawn by cross-referencing the layer data arrays in the JSON.

### 6. Interaction Zone — Must Track NPC Position

The existing 48×48 interaction zone is a standalone `scene.add.zone()` with a **static body**. It does NOT auto-follow the NPC sprite. When NPCs start moving, the zone will stay at the original spawn point.

**Fix:** In the `update()` loop, sync each zone's position to its NPC sprite's current position every frame:
```
zone.setPosition(sprite.x, sprite.y);
```

Alternatively, replace the zone-based overlap with a simple distance check in `update()` (distance < 24px triggers interaction). Either approach works; the key requirement is that the interaction area follows the NPC.

### 7. Timer Cleanup

The wander state machine introduces timers (idle wait, walk timeout, stuck detection). All timers must be destroyed in `npcManager.destroy()` to prevent leaked callbacks when the scene transitions (e.g., player presses M to return to regional map). The current `destroy()` only cleans up `idleTimer` — extend it to cover all new timers.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/engine/settlement/npcManager.ts` | Core rewrite: static→dynamic sprites, wander state machine, walk animations, zone tracking, timer cleanup |
| `src/engine/settlement/scenes/SettlementScene.ts` | Add NPC↔tilemap collision (wall, building, tree layers), expose layers to NpcManager |
| `public/maps/arboria/Walled City Map - Arboria.json` | Fix 5 agent spawn positions to walkable tiles |

---

## Constants

| Constant | Value | Rationale |
|----------|-------|-----------|
| NPC walk speed | ~24 px/s (player is ~80) | 30% of player speed — casual stroll |
| Idle duration | 2–5s random | Feels natural, not robotic |
| Wander radius | 3 tiles (48px) | Keeps movement local, avoids edge-of-map drift |
| Walk timeout | 5s | Safety valve if NPC gets stuck |
| Stuck threshold | velocity < 1 px/s for 0.5s | Detects wall collision stalls |

---

## Out of Scope

- Pathfinding (A*, navmesh)
- Agent-to-agent interaction / communication
- Zone-based or goal-driven movement
- NPC-to-NPC collision
- NPC-to-player collision
