# Settlement Map Bugfixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 runtime bugs in the settlement scene: walk-on-water, bridge crossing blocked, agents spawning at wrong location, and missing world edge boundaries.

**Architecture:** All fixes are in the settlement engine layer (Phaser scene + managers). No backend/Supabase changes needed. The root cause of 2 of the 4 bugs is the same: physics world bounds default to 320x240 (the game viewport) instead of the actual map size (928x928 pixels).

**Tech Stack:** Phaser 3.90.0, TypeScript, Tiled .tmj tilemap

---

## Root Cause Analysis

### Bug (a): Player walks on water
**Symptom:** Player can walk freely over water tiles.
**Root cause:** Water layer collision was removed entirely at line 74 of `SettlementScene.ts`. The original `waterLayer?.setCollisionByExclusion([-1, 0])` was deleted to fix a bridge-crossing issue, but this overcorrected — now nothing blocks water.
**Fix:** Re-enable water collision, then selectively disable it on bridge tiles (see bug b).

### Bug (b): Cannot cross bridges
**Symptom:** Player is blocked when trying to walk across bridges over water.
**Root cause:** Bridge tiles exist on the Road layer, but water tiles exist on the Water layer at the same tile coordinates. When water collision was enabled, the Water layer blocked movement even where bridges (Road tiles) sit above them. The fix requires checking both layers: if a tile position has BOTH a water tile AND a road tile, the water tile's collision should be disabled at that position.
**Fix:** After enabling water collision, iterate through all water tiles and disable collision where the Road layer has a non-empty tile at the same (col, row).

### Bug (c): All agents spawn at the same wrong location
**Symptom:** All 5 NPC agents appear clustered at the same position near the edge of the map, despite having unique coordinates in the Tiled JSON (Mira: 344,535 / Ledger: 344,378 / Archon: 489,377 / Forge: 535,553 / Ember: 456,428).
**Root cause:** `npcManager.ts` line 101 calls `sprite.setCollideWorldBounds(true)` on every NPC. The physics world bounds default to the game config size: **320x240 pixels**. ALL 5 agents have coordinates exceeding both 320 (x) and 240 (y), so Phaser clamps every single one to the bottom-right corner of the tiny 320x240 world — position (320, 240). This is why they all appear at the exact same "wrong" location.
The player spawn (457, 631) works correctly because `playerController.ts` does NOT call `setCollideWorldBounds(true)`.
**Fix:** Set `physics.world.setBounds(0, 0, mapWidth, mapHeight)` in `SettlementScene.create()` BEFORE creating NPCs, so the world bounds match the actual 928x928 map.

### Bug (d): Player walks off the edge of the map
**Symptom:** Player can walk past the map boundary into empty space.
**Root cause:** Same as bug (c) — the physics world bounds are 320x240 (game viewport), not 928x928 (map size). Camera bounds are set correctly (`cameras.main.setBounds`), but physics world bounds are separate and were never set. Additionally, `playerController.ts` never calls `sprite.setCollideWorldBounds(true)`.
**Fix:** (1) Set physics world bounds in SettlementScene, (2) add `setCollideWorldBounds(true)` in PlayerController.

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `src/engine/settlement/scenes/SettlementScene.ts` | Modify | Set physics world bounds, re-enable water collision with bridge exceptions |
| `src/engine/settlement/playerController.ts` | Modify | Add `setCollideWorldBounds(true)` |
| `src/engine/settlement/npcManager.ts` | Modify | Fix `!obj.x` falsy guard (preventive) |

---

## Chunk 1: Implementation Tasks

### Task 1: Set physics world bounds in SettlementScene (fixes bugs c + d)

**Files:**
- Modify: `src/engine/settlement/scenes/SettlementScene.ts:128-131`

This is the highest-impact fix — it resolves both the agent spawn bug and the walk-off-map bug with a single line.

- [ ] **Step 1: Add physics world bounds after map dimensions are calculated**

In `SettlementScene.ts`, after line 130 (`const mapHeight = map.heightInPixels;`), add one line to set the physics world bounds. This MUST come before NPC creation, but currently NPC creation is at line 117 and map dimensions are at line 129. We need to move the world bounds setup earlier OR move NPC creation later. The simplest approach: add `this.physics.world.setBounds()` right after the map is created (after line 36), using `map.widthInPixels` and `map.heightInPixels` directly.

Find this block (around lines 128-131):
```typescript
// 9. Set camera bounds to map dimensions
const mapWidth = map.widthInPixels;
const mapHeight = map.heightInPixels;
this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
```

Replace with:
```typescript
// 9. Set camera and physics world bounds to map dimensions
const mapWidth = map.widthInPixels;
const mapHeight = map.heightInPixels;
this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
```

**BUT** — this code runs at line 128, AFTER NPCs are created at line 117. The `setCollideWorldBounds(true)` in npcManager fires during `createNpc()` at construction time. By then, the world bounds are still 320x240.

**Solution:** Move the physics world bounds setup to BEFORE NPC creation. Add it right after the tilemap is created (after line 36):

After `const map = this.make.tilemap({ key: TILEMAP.key });` (line 36), add:
```typescript
// Set physics world bounds to match map dimensions immediately
this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
```

This ensures the physics world is 928x928 BEFORE any sprites with `setCollideWorldBounds` are created.

- [ ] **Step 2: Verify the change doesn't conflict with the later camera bounds code**

The existing lines 128-131 set camera bounds. Keep those as-is — camera bounds and physics world bounds are independent. No conflict.

- [ ] **Step 3: Commit**

```bash
git add src/engine/settlement/scenes/SettlementScene.ts
git commit -m "fix: set physics world bounds to map size before NPC creation

Fixes agents all spawning at (320,240) due to setCollideWorldBounds
clamping to default 320x240 game viewport instead of 928x928 map."
```

---

### Task 2: Add player world bounds collision (fixes bug d fully)

**Files:**
- Modify: `src/engine/settlement/playerController.ts:30`

- [ ] **Step 1: Add setCollideWorldBounds to player sprite**

In `playerController.ts`, after line 30 (`this.sprite.setDepth(10);`), add:
```typescript
this.sprite.setCollideWorldBounds(true);
```

This works because Task 1 already set the physics world bounds to the full map size.

- [ ] **Step 2: Commit**

```bash
git add src/engine/settlement/playerController.ts
git commit -m "fix: prevent player from walking off map edge

Add setCollideWorldBounds(true) to player sprite."
```

---

### Task 3: Fix water collision with bridge exceptions (fixes bugs a + b)

**Files:**
- Modify: `src/engine/settlement/scenes/SettlementScene.ts:71-77`

- [ ] **Step 1: Re-enable water layer collision**

In `SettlementScene.ts`, find the collision setup block (around lines 71-76):
```typescript
// 4. Collision — wall, building, and tree tiles block the player
// Water does NOT collide — bridges are placed over water tiles,
// and blanket water collision would block bridge crossings.
wallLayer?.setCollisionByExclusion([-1, 0]);
buildingsLayer?.setCollisionByExclusion([-1, 0]);
treeLayer?.setCollisionByExclusion([-1, 0]);
```

Replace with:
```typescript
// 4. Collision — wall, building, tree, and water tiles block movement
wallLayer?.setCollisionByExclusion([-1, 0]);
buildingsLayer?.setCollisionByExclusion([-1, 0]);
treeLayer?.setCollisionByExclusion([-1, 0]);
waterLayer?.setCollisionByExclusion([-1, 0]);

// 4a. Disable water collision where bridges (Road tiles) exist
// Bridges are Road-layer tiles placed over Water-layer tiles.
// We walk the water layer and clear collision at any (col,row)
// that also has a non-empty Road tile — allowing bridge crossing.
if (waterLayer && roadLayer) {
  const mapCols = map.width;   // 58
  const mapRows = map.height;  // 58
  for (let row = 0; row < mapRows; row++) {
    for (let col = 0; col < mapCols; col++) {
      const roadTile = roadLayer.getTileAt(col, row);
      if (roadTile && roadTile.index > 0) {
        const waterTile = waterLayer.getTileAt(col, row);
        if (waterTile) {
          waterTile.setCollision(false, false, false, false);
        }
      }
    }
  }
}
```

- [ ] **Step 2: Add water layer to the collision layers array**

Find the collision layers array (around line 102):
```typescript
const collisionLayers = [wallLayer, buildingsLayer, treeLayer].filter(
  (l): l is Phaser.Tilemaps.TilemapLayer => l !== null
);
```

Replace with:
```typescript
const collisionLayers = [wallLayer, buildingsLayer, treeLayer, waterLayer].filter(
  (l): l is Phaser.Tilemaps.TilemapLayer => l !== null
);
```

This ensures both player AND NPC colliders include the water layer.

- [ ] **Step 3: Remove the stale comment about water not colliding**

The old comment at line 72-73 is now incorrect. The new comment from Step 1 already replaces it.

- [ ] **Step 4: Commit**

```bash
git add src/engine/settlement/scenes/SettlementScene.ts
git commit -m "fix: block water tiles but allow bridge crossing

Re-enable water collision and selectively disable it at tile
positions where the Road layer has a bridge tile."
```

---

### Task 4: Fix falsy coordinate guard in npcManager (preventive)

**Files:**
- Modify: `src/engine/settlement/npcManager.ts:63`

- [ ] **Step 1: Replace falsy check with undefined check**

The current guard `!obj.x || !obj.y` would incorrectly filter out an NPC placed at coordinate 0. While no current NPCs sit at x=0 or y=0, this is a bug waiting to happen.

Find line 63:
```typescript
if (obj.type !== "agent" || !obj.x || !obj.y) continue;
```

Replace with:
```typescript
if (obj.type !== "agent" || obj.x == null || obj.y == null) continue;
```

(`== null` catches both `undefined` and `null` but allows `0`.)

- [ ] **Step 2: Commit**

```bash
git add src/engine/settlement/npcManager.ts
git commit -m "fix: use null check instead of falsy check for NPC coordinates

Prevents filtering out NPCs placed at coordinate 0."
```

---

## Verification

After all 4 tasks, manually test in the browser:

1. **Water collision (bug a):** Walk toward open water — player should be blocked.
2. **Bridge crossing (bug b):** Walk onto a bridge — player should cross freely.
3. **Agent positions (bug c):** All 5 NPCs should appear at their unique Tiled coordinates inside the walled city, NOT clustered together.
4. **World edge (bug d):** Walk to any edge of the 58x58 map — player should stop at the boundary.
5. **NPC wandering:** NPCs should still wander, pause near player, and resume. Their wander bounds (tiles 19-46) keep them inside the walls.
6. **NPC collision:** NPCs should also be blocked by water and stopped at world edges.

---

## Summary of Changes

| Bug | Root Cause | Fix | File | Lines Changed |
|-----|-----------|-----|------|---------------|
| (a) Walk on water | Water collision removed | Re-enable `waterLayer.setCollisionByExclusion` | SettlementScene.ts | ~2 |
| (b) Can't cross bridges | Water blocks bridges | Disable water collision where Road tile exists at same position | SettlementScene.ts | ~15 |
| (c) Agents wrong position | Physics world = 320x240, `setCollideWorldBounds` clamps all NPCs | `physics.world.setBounds(0,0,mapW,mapH)` before NPC creation | SettlementScene.ts | ~2 |
| (d) No world edge | Physics world = 320x240, player has no bounds | Set world bounds + `setCollideWorldBounds(true)` on player | SettlementScene.ts + playerController.ts | ~3 |
