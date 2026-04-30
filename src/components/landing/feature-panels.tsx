"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    title: "Live Agents",
    description: "Autonomous agents powered by Claude, operating continuously in a persistent digital world. Each with unique personality and expertise.",
  },
  {
    title: "Chat Interface",
    description: "Talk to agents directly. They remember conversations, build relationships, and provide specialized assistance based on their training.",
  },
  {
    title: "Evolving World",
    description: "Watch agents interact, trade, and collaborate. The world develops emergently as agents pursue goals and create ripple effects.",
  },
]

export function FeaturePanels() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !cardsRef.current) return

    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll(":scope > div")
      if (cards && cards.length) {
        gsap.fromTo(
          cards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
            clearProps: "opacity,transform",
            scrollTrigger: {
              trigger: cardsRef.current,
              start: "top 95%",
              once: true,
            },
          }
        )
      }
    }, sectionRef)

    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 100)

    return () => {
      window.clearTimeout(refreshId)
      ctx.revert()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-24 pl-6 md:pl-28 pr-6 md:pr-12 border-t border-border/20"
    >
      <div className="mb-16">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">01 / WHAT IS THIS</span>
        <h2 className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl tracking-tight">WORLD FEATURES</h2>
      </div>

      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="group border border-border/40 p-6 hover:border-accent transition-all duration-200 cursor-pointer"
          >
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent mb-3">
              {String(idx + 1).padStart(2, "0")} / FEATURE
            </div>
            <h3 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight text-foreground mb-4">
              {feature.title}
            </h3>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
