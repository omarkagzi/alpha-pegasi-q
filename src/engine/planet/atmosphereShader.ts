export const atmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFragmentShader = `
  varying vec3 vNormal;
  uniform vec3 uSunDirection;
  
  void main() {
    // Additive blending based on viewing angle
    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
    
    // Fade out atmosphere on the dark side of the planet
    float sunDot = dot(vNormal, normalize(uSunDirection));
    float terminator = smoothstep(-0.5, 0.5, sunDot);
    
    vec3 atmosphereColor = vec3(0.3, 0.6, 1.0) * intensity * (terminator * 1.5 + 0.1);
    
    gl_FragColor = vec4(atmosphereColor, 1.0);
  }
`;
