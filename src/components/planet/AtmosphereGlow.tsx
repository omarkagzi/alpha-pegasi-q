"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { atmosphereVertexShader, atmosphereFragmentShader } from "@/engine/planet/atmosphereShader";
import { simulatePlanetTime, getSunDirection } from "@/engine/planet/planetTime";

export default function AtmosphereGlow() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uSunDirection: { value: new THREE.Vector3() },
    }),
    []
  );

  useFrame(() => {
    if (materialRef.current) {
      const normalizedTime = simulatePlanetTime();
      const sunDir = getSunDirection(normalizedTime);
      
      materialRef.current.uniforms.uSunDirection.value.set(
        sunDir[0],
        sunDir[1],
        sunDir[2]
      );
    }
  });

  return (
    <mesh>
      {/* Slightly larger than the main planet (radius 2) */}
      <sphereGeometry args={[2.08, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={uniforms}
        transparent={true}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  );
}
