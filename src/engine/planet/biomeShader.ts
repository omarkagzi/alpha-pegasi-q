// Biome shader uses an explicit Voronoi approach:
// Each fragment finds the nearest biome center (passed as uniforms) and
// takes that biome's color. FBM noise softens the boundaries organically.

export const biomeVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const biomeFragmentShader = `
  uniform float uTime;
  uniform vec3 uSunDirection;

  // 15 biome centers (unit sphere vectors) and their colors
  uniform vec3 uBiomeCenters[15];
  uniform vec3 uBiomeColors[15];

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  // --- Noise utilities for border blending and city lights ---

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + .1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(in vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 5; ++i) {
      v += a * noise(x);
      x = x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // --- Voronoi biome selection ---
    // Find the biome center with the highest dot product to this fragment's
    // normalized position (equivalent to smallest angular distance).
    vec3 normPos = normalize(vPosition);

    float maxDot = -2.0;
    int nearestBiome = 0;
    float secondMaxDot = -2.0;

    for (int i = 0; i < 15; i++) {
      float d = dot(normPos, uBiomeCenters[i]);
      if (d > maxDot) {
        secondMaxDot = maxDot;
        maxDot = d;
        nearestBiome = i;
      } else if (d > secondMaxDot) {
        secondMaxDot = d;
      }
    }

    vec3 biomeColor = uBiomeColors[nearestBiome];

    // --- Organic border blending ---
    // Near Voronoi edges (where maxDot ≈ secondMaxDot), blend with noise.
    float edgeProximity = 1.0 - smoothstep(0.0, 0.06, maxDot - secondMaxDot);
    float borderNoise = fbm(vPosition * 8.0);
    // Darken slightly at borders to create subtle natural boundaries
    biomeColor = mix(biomeColor, biomeColor * 0.6, edgeProximity * 0.5);
    // Add terrain variation via noise (subtle height/texture variation within biome)
    float terrainVariation = fbm(vPosition * 3.0) * 0.12 - 0.06;
    vec3 color = clamp(biomeColor + vec3(terrainVariation), 0.0, 1.0);

    // --- Day/Night Lighting ---
    vec3 normal = normalize(vNormal);
    vec3 sunDir = normalize(uSunDirection);

    float diff = max(dot(normal, sunDir), 0.0);
    float terminator = smoothstep(-0.2, 0.2, dot(normal, sunDir));

    // City lights on the night side (procedural population clusters)
    float popDensity = step(0.82, fbm(vPosition * 15.0));
    vec3 cityLights = vec3(1.0, 0.9, 0.5) * popDensity * (1.0 - terminator) * 2.0;

    vec3 finalColor = color * (diff * 0.8 + 0.1) * terminator + cityLights;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
