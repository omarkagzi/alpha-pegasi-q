"use client";

import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import PlanetSphere from "./PlanetSphere";
import AtmosphereGlow from "./AtmosphereGlow";
import StarField from "./StarField";
import ZoomTransition from "./ZoomTransition";
import BiomeLabelOverlay from "./BiomeLabelOverlay";
import { Biome } from "@/types/biome";
import { Suspense } from "react";

export default function PlanetCanvas() {
  const planetMeshRef = useRef<THREE.Mesh | null>(null);

  const [hoveredBiome, setHoveredBiome] = useState<Biome | null>(null);
  const [labelPos, setLabelPos] = useState<{ x: number; y: number } | null>(null);
  const [clickedNonRealized, setClickedNonRealized] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  const handleBiomeHover = (
    biome: Biome | null,
    screenPos: { x: number; y: number } | null
  ) => {
    setHoveredBiome(biome);
    setLabelPos(screenPos);
    if (!biome) setClickedNonRealized(false);
  };

  const handleBiomeClick = (biome: Biome) => {
    setClickedNonRealized(true);
    setHoveredBiome(biome);
  };

  const handleZoomStart = () => {
    setIsZooming(true);
    setHoveredBiome(null);
    setLabelPos(null);
    // Animate fade overlay to black over ~1.1 seconds
    let start: number | null = null;
    const duration = 1100;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const opacity = Math.min(elapsed / duration, 1);
      setFadeOpacity(opacity);
      if (opacity < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  // Hint text based on state
  const hintText = isZooming
    ? null
    : hoveredBiome
    ? hoveredBiome.realized
      ? "Click to enter Arboria"
      : `${hoveredBiome.settlementName} — not yet realized`
    : "Click a biome to explore";

  return (
    <div className="w-full h-full absolute inset-0 bg-black">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <StarField />
          <group>
            <PlanetSphere ref={planetMeshRef} />
            <AtmosphereGlow />
          </group>
          <ZoomTransition
            planetMeshRef={planetMeshRef}
            onBiomeHover={handleBiomeHover}
            onBiomeClick={handleBiomeClick}
            onZoomStart={handleZoomStart}
          />
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={2.5}
            maxDistance={15}
            zoomSpeed={0.5}
            rotateSpeed={0.6}
            autoRotate={false}
          />
        </Suspense>
      </Canvas>

      {/* Biome label tooltip */}
      <BiomeLabelOverlay
        biome={hoveredBiome}
        screenPos={labelPos}
        notRealized={clickedNonRealized}
      />

      {/* Hint text */}
      {hintText && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white/50 text-sm tracking-widest uppercase pointer-events-none">
          {hintText}
        </div>
      )}

      {/* Black fade overlay for zoom transition */}
      {isZooming && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: fadeOpacity }}
        />
      )}
    </div>
  );
}
