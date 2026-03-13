"use client";

import { forwardRef, useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { biomeVertexShader, biomeFragmentShader } from "@/engine/planet/biomeShader";
import { getBiomeUniformArrays } from "@/engine/planet/biomePositions";
import { simulatePlanetTime, getSunDirection, fetchServerTime, ServerTimeRef } from "@/engine/planet/planetTime";

const PlanetSphere = forwardRef<THREE.Mesh>(function PlanetSphere(_, ref) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const serverTimeRef = useRef<ServerTimeRef>({ normalizedTime: null, fetchedAt: null });

  // Pre-compute biome center vectors and colors once
  const { centers, colors } = useMemo(() => getBiomeUniformArrays(), []);

  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uSunDirection: { value: new THREE.Vector3() },
      uBiomeCenters: {
        value: centers.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      },
      uBiomeColors: {
        value: colors.map(([r, g, b]) => new THREE.Vector3(r, g, b)),
      },
    };
  }, [centers, colors]);

  // Fetch server time on mount and every 60 seconds
  useEffect(() => {
    const sync = async () => {
      const result = await fetchServerTime();
      if (result !== null) {
        serverTimeRef.current = { normalizedTime: result.normalizedTime, fetchedAt: result.fetchedAt };
      }
    };
    sync();
    const interval = setInterval(sync, 60_000);
    return () => clearInterval(interval);
  }, []);

  useFrame((state) => {
    const mesh = (ref as React.RefObject<THREE.Mesh>)?.current;
    if (mesh) {
      mesh.rotation.y += 0.0005;
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

      const normalizedTime = simulatePlanetTime(serverTimeRef.current);
      const sunDir = getSunDirection(normalizedTime);

      materialRef.current.uniforms.uSunDirection.value.set(
        sunDir[0],
        sunDir[1],
        sunDir[2]
      );
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={biomeVertexShader}
        fragmentShader={biomeFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
});

export default PlanetSphere;
