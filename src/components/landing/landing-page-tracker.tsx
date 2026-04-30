"use client"

import { useEffect } from "react"
import { analytics } from "@/lib/analytics/events"

export function LandingPageTracker() {
  useEffect(() => {
    analytics.landingPageView()
  }, [])

  return null
}
