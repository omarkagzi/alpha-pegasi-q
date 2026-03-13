import { Biome, BiomePosition } from '@/types/biome';
import { BIOMES } from '@/lib/constants/biomes';

/**
 * Converts a lat/lon position (degrees) to a unit sphere vector.
 * Matches the Three.js/GLSL sphere convention: Y-up, right-handed.
 */
export function latLonToUnitVec(lat: number, lon: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180); // polar angle from +Y axis
  const theta = lon * (Math.PI / 180);       // azimuthal angle around Y axis

  const x = Math.sin(phi) * Math.cos(theta);
  const y = Math.cos(phi);
  const z = Math.sin(phi) * Math.sin(theta);

  return [x, y, z];
}

/**
 * Returns the biome whose center is angularly closest to the given
 * normalized 3D point on the sphere. This is the JavaScript-side
 * equivalent of the nearest-center logic in the GLSL shader.
 */
export function getNearestBiome(normPoint: [number, number, number]): Biome {
  let maxDot = -Infinity;
  let nearest = BIOMES[0];

  for (const biome of BIOMES) {
    const center = latLonToUnitVec(biome.position.lat, biome.position.lon);
    const dot =
      normPoint[0] * center[0] +
      normPoint[1] * center[1] +
      normPoint[2] * center[2];

    if (dot > maxDot) {
      maxDot = dot;
      nearest = biome;
    }
  }

  return nearest;
}

/**
 * Pre-computed flat arrays for GLSL uniforms.
 * uBiomeCenters: flat Float32Array of [x,y,z, x,y,z, ...] (15 * 3 = 45 floats)
 * uBiomeColors:  flat Float32Array of [r,g,b, r,g,b, ...] parsed from hex colors
 */
export function getBiomeUniformArrays(): {
  centers: number[][];
  colors: number[][];
} {
  const centers: number[][] = [];
  const colors: number[][] = [];

  for (const biome of BIOMES) {
    centers.push(latLonToUnitVec(biome.position.lat, biome.position.lon));

    // Parse hex color string to normalized [r, g, b]
    const hex = biome.color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    colors.push([r, g, b]);
  }

  return { centers, colors };
}
