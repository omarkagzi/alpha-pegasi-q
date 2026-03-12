// We use a procedural shader to generate the biomes using noise 
// since we don't have the static texture assets for the MVP.

export const biomeVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vPosition = position;
    // normalMatrix ensures normals are scaled/rotated correctly
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const biomeFragmentShader = `
  uniform float uTime;
  uniform vec3 uSunDirection;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  // Hash function for procedural noise
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + .1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  
  // Simple 3D noise
  float noise(in vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  
  // Fractional Brownian Motion
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
    // Generate height from noise (continents vs oceans)
    float height = fbm(vPosition * 2.0);
    
    // Generate temperature based on latitude (y position) and noise
    float temp = 1.0 - abs(vPosition.y); 
    temp += (fbm(vPosition * 4.0) - 0.5) * 0.5; // add local variations
    
    vec3 color = vec3(0.0);
    
    // Ocean / Deep Trench / Kelp Forest / Brine Pools
    if (height < 0.45) {
      if (height < 0.2) {
        color = vec3(0.03, 0.06, 0.1); // Abyssal Trench
      } else if (height < 0.35) {
        color = vec3(0.1, 0.3, 0.23); // Kelp Forest
      } else {
        color = vec3(0.12, 0.14, 0.21); // Brine pool
      }
    } 
    // Land biomes
    else {
      if (temp > 0.8) {
        if (height < 0.5) color = vec3(0.83, 0.39, 0.07); // Geothermal Vents
        else if (height < 0.6) color = vec3(0.89, 0.71, 0.41); // Extreme desert
        else color = vec3(0.1, 0.37, 0.12); // Tropical Rainforest
      } else if (temp > 0.5) {
        if (height < 0.6) color = vec3(0.83, 0.75, 0.66); // Mediterranean Shrubland
        else color = vec3(0.4, 0.54, 0.26); // Temperate Forest
      } else if (temp > 0.3) {
        if (height < 0.6) color = vec3(0.55, 0.64, 0.63); // Cloud Forest
        else color = vec3(0.12, 0.26, 0.18); // Boreal Taiga
      } else {
        if (height < 0.6) color = vec3(0.82, 0.9, 0.91); // Highland Tundra
        else color = vec3(0.63, 0.78, 0.85); // Mountain Glacier
      }
    }
    
    // Day/Night and terminator calculation
    vec3 normal = normalize(vNormal);
    vec3 sunDir = normalize(uSunDirection);
    
    // Calculate lighting (Lambertian)
    float diff = max(dot(normal, sunDir), 0.0);
    
    // Terminator smoothing
    float terminator = smoothstep(-0.2, 0.2, dot(normal, sunDir));
    
    // Night lights (cities) in non-ocean areas
    float popDensity = 0.0;
    if (height >= 0.45) {
       popDensity = step(0.8, fbm(vPosition * 15.0));
    }
    vec3 cityLights = vec3(1.0, 0.9, 0.5) * popDensity * (1.0 - terminator) * 2.0;
    
    vec3 finalColor = color * (diff * 0.8 + 0.1) * terminator + cityLights;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
