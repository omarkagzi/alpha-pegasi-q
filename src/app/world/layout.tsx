"use client";

import dynamic from "next/dynamic";

const WorldCanvas = dynamic(() => import("@/components/layout/WorldCanvas"), {
  ssr: false,
});
const Breadcrumb = dynamic(() => import("@/components/layout/Breadcrumb"), {
  ssr: false,
});
const SettlementHUD = dynamic(
  () => import("@/components/settlement/SettlementHUD"),
  { ssr: false }
);
const InteractionPrompt = dynamic(
  () => import("@/components/settlement/InteractionPrompt"),
  { ssr: false }
);
const ChatPanel = dynamic(
  () => import("@/components/settlement/ChatPanel"),
  { ssr: false }
);
const ActivityFeed = dynamic(
  () => import("@/components/settlement/ActivityFeed"),
  { ssr: false }
);

export default function WorldLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-black text-white w-screen h-screen overflow-hidden relative">
      {/* WorldCanvas owns both Three.js and Phaser renderers per PRD §8.2 */}
      <WorldCanvas />
      {/* HUD overlays — each component manages its own visibility */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <Breadcrumb />
        <SettlementHUD />
        <InteractionPrompt />
        <ActivityFeed />
        <ChatPanel />
        {children}
      </div>
    </div>
  );
}
