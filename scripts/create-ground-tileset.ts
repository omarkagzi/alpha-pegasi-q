// scripts/create-ground-tileset.ts
/**
 * Extracts 2 tiles from MinyWorld Grass.png and combines them
 * into a single 32×16 tileset PNG for the Tiled map.
 *
 * Grass.png is 80×16 (5 tiles of 16×16):
 *   Index 0: Cyan/teal
 *   Index 1: Olive green
 *   Index 2: Bright green
 *   Index 3: Muted yellow-green (our GRASS tile)
 *   Index 4: Tan/beige (our ROAD tile)
 *
 * Output: 32×16 PNG with:
 *   Tile 0 (GID 1): Grass — index 3
 *   Tile 1 (GID 2): Road  — index 4
 *
 * Since indices 3 and 4 are adjacent, we just crop the rightmost 32px.
 *
 * Run: npx tsx scripts/create-ground-tileset.ts
 */
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

async function main() {
  const srcPath = path.resolve(
    __dirname, "..", "Design Assets", "MinyWorld Assets",
    "MiniWorldSprites", "Ground", "Grass.png"
  );

  const outPath = path.resolve(
    __dirname, "..", "public", "sprites", "tiles", "minyworld-ground.png"
  );

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  // Crop: start at x=48 (index 3), width=32 (2 tiles), full height
  await sharp(srcPath)
    .extract({ left: 48, top: 0, width: 32, height: 16 })
    .toFile(outPath);

  console.log(`Ground tileset written to ${outPath} (32×16)`);
  console.log("  Tile 0 (GID 1): Grass — muted yellow-green");
  console.log("  Tile 1 (GID 2): Road  — tan/beige");
}

main().catch(console.error);
