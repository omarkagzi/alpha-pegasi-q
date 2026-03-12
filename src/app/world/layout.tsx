export default function WorldLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-black text-white w-screen h-screen overflow-hidden relative">
      {/* 
        This layout strips standard navigation elements and provides 
        a fullscreen canvas for the planet and regional maps.
      */}
      {children}
    </div>
  );
}
