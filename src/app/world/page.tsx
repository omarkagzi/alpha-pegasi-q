"use client";

import { useEffect } from "react";
import { useWorldStore } from "@/stores/worldStore";

/**
 * /world page — signals WorldCanvas to show the orbital (Three.js) view.
 * The actual rendering is handled by WorldCanvas in the layout.
 */
export default function WorldPage() {
  const returnToOrbit = useWorldStore((s) => s.returnToOrbit);

  useEffect(() => {
    // Ensure orbital view is active when this page mounts
    returnToOrbit();
  }, [returnToOrbit]);

  // No visible content — WorldCanvas renders the planet
  return null;
}
