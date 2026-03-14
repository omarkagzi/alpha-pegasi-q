"use client";

import dynamic from "next/dynamic";

const WorldCanvas = dynamic(() => import("@/components/layout/WorldCanvas"), {
  ssr: false,
});

export default function WorldLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-black text-white w-screen h-screen overflow-hidden relative">
      {/* WorldCanvas owns both Three.js and Phaser renderers per PRD §8.2 */}
      <WorldCanvas />
      {/* Children render as overlays (HUD, breadcrumb, etc.) */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {children}
      </div>
    </div>
  );
}
