"use client";

import dynamic from "next/dynamic";

// Dynamically import the Three.js canvas so it doesn't break SSR
const PlanetCanvas = dynamic(() => import("@/components/planet/PlanetCanvas"), {
  ssr: false,
});

export default function WorldPage() {
  return (
    <main className="w-full h-full relative">
      <PlanetCanvas />
    </main>
  );
}
