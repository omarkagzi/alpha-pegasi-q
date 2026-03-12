"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import PlanetSphere from "./PlanetSphere";
import AtmosphereGlow from "./AtmosphereGlow";
import StarField from "./StarField";
import ZoomTransition from "./ZoomTransition";
import { Suspense } from "react";

export default function PlanetCanvas() {
  return (
    <div className="w-full h-full absolute inset-0 bg-black">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <StarField />
          <group>
            <PlanetSphere />
            <AtmosphereGlow />
          </group>
          <ZoomTransition />
          
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
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white/50 text-sm tracking-widest uppercase pointer-events-none">
        Double click planet to descend
      </div>
    </div>
  );
}
