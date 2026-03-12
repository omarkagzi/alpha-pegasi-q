"use client";

import { useRouter } from "next/navigation";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export default function ZoomTransition() {
  const router = useRouter();
  const { gl, camera, scene } = useThree();

  useEffect(() => {
    // Basic interaction: double click anywhere on the planet transitions to Arboria for MVP
    // In a full build, we'd raycast to specific biome coordinates
    
    const handleDoubleClick = (event: MouseEvent) => {
      // Very basic raycast to see if we clicked the planet
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        // We clicked something (the planet or atmosphere)
        // Transition to Arboria for MVP
        router.push("/world/arboria");
      }
    };

    gl.domElement.addEventListener("dblclick", handleDoubleClick);
    
    return () => {
      gl.domElement.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [gl, camera, scene, router]);

  return null; // Logic only, no visual output
}
