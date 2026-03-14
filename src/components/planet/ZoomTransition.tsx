"use client";

import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getNearestBiome } from "@/engine/planet/biomePositions";
import { Biome } from "@/types/biome";
import { useWorldStore } from "@/stores/worldStore";

interface ZoomTransitionProps {
  planetMeshRef: React.RefObject<THREE.Mesh | null>;
  onBiomeHover: (biome: Biome | null, screenPos: { x: number; y: number } | null) => void;
  onBiomeClick: (biome: Biome) => void;
  onZoomStart: () => void; // signals PlanetCanvas to begin fade overlay
}

export default function ZoomTransition({
  planetMeshRef,
  onBiomeHover,
  onBiomeClick,
  onZoomStart,
}: ZoomTransitionProps) {
  const enterBiome = useWorldStore((s) => s.enterBiome);
  const { gl, camera } = useThree();

  const isZooming = useRef(false);
  const zoomFrames = useRef(0);
  const ZOOM_DURATION = 70; // frames (~1.2s at 60fps)
  const ZOOM_TARGET_Z = 2.5;
  const ZOOM_START_Z = useRef(6);

  // Detect nearest biome from a normalized local-space point on the sphere
  const getBiomeAtPoint = (worldPoint: THREE.Vector3): Biome | null => {
    const mesh = planetMeshRef.current;
    if (!mesh) return null;

    const localPoint = mesh.worldToLocal(worldPoint.clone());
    const norm = localPoint.normalize();
    return getNearestBiome([norm.x, norm.y, norm.z]);
  };

  // Shared raycast helper
  const raycastPlanet = (
    event: MouseEvent | PointerEvent
  ): THREE.Intersection | null => {
    const mesh = planetMeshRef.current;
    if (!mesh) return null;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(mesh, false);
    return hits.length > 0 ? hits[0] : null;
  };

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerMove = (event: PointerEvent) => {
      if (isZooming.current) return;
      const hit = raycastPlanet(event);
      if (!hit) {
        onBiomeHover(null, null);
        canvas.style.cursor = "default";
        return;
      }
      const biome = getBiomeAtPoint(hit.point);
      if (biome) {
        onBiomeHover(biome, { x: event.clientX, y: event.clientY });
        canvas.style.cursor = "pointer";
      }
    };

    const handlePointerLeave = () => {
      if (!isZooming.current) {
        onBiomeHover(null, null);
        canvas.style.cursor = "default";
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (isZooming.current) return;
      const hit = raycastPlanet(event);
      if (!hit) return;

      const biome = getBiomeAtPoint(hit.point);
      if (!biome) return;

      if (biome.realized) {
        // Begin zoom animation toward Arboria
        isZooming.current = true;
        zoomFrames.current = 0;
        ZOOM_START_Z.current = camera.position.z;
        onZoomStart();
        canvas.style.cursor = "default";
      } else {
        onBiomeClick(biome);
      }
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("click", handleClick);

    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener("click", handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, camera]);

  // Camera dolly-in animation
  useFrame(() => {
    if (!isZooming.current) return;

    zoomFrames.current += 1;
    const progress = Math.min(zoomFrames.current / ZOOM_DURATION, 1.0);
    // Ease-in-out cubic
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    camera.position.z =
      ZOOM_START_Z.current + (ZOOM_TARGET_Z - ZOOM_START_Z.current) * eased;

    if (progress >= 1.0) {
      isZooming.current = false;
      // Signal WorldCanvas to transition from Three.js to Phaser
      enterBiome("temperate_deciduous_forest");
    }
  });

  return null;
}
