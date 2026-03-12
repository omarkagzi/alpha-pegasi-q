"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { biomeVertexShader, biomeFragmentShader } from "@/engine/planet/biomeShader";
import { simulatePlanetTime, getSunDirection } from "@/engine/planet/planetTime";

export default function PlanetSphere() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunDirection: { value: new THREE.Vector3() },
    }),
    []
  );

  useFrame((state) => {
    // Rotate the planet slowly
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005;
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
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
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={biomeVertexShader}
        fragmentShader={biomeFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
