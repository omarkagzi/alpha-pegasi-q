import { HeroSection } from "@/components/landing/hero-section"
import { WorkSection } from "@/components/landing/work-section"
import { PrinciplesSection } from "@/components/landing/principles-section"
import { ColophonSection } from "@/components/landing/colophon-section"
import { SideNav } from "@/components/landing/side-nav"

export default function Home() {
  return (
    <div className="landing-page">
      <main className="relative min-h-screen bg-[oklch(0.08_0_0)] text-[oklch(0.95_0_0)]">
        <SideNav />
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
        <div className="relative z-10">
          <HeroSection />
          <WorkSection />
          <PrinciplesSection />
          <ColophonSection />
        </div>
      </main>
    </div>
  )
}
