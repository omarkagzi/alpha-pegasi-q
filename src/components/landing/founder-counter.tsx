"use client"

import { useEffect, useState } from "react"

interface FounderStatus {
  seatsClaimed: number
  seatsMax: number
  seatsRemaining: number
  isFounderAvailable: boolean
}

export function FounderCounter() {
  const [status, setStatus] = useState<FounderStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch("/api/config/founder-count")
        if (!response.ok) throw new Error("Failed to fetch founder status")
        const data = await response.json()
        setStatus(data)
      } catch (error) {
        console.error("Error fetching founder status:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [])

  if (loading || !status) return null

  return (
    <div className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
      <div>{status.seatsClaimed} / {status.seatsMax} FOUNDER SEATS</div>
      {status.isFounderAvailable && (
        <div className="text-accent mt-1">{status.seatsRemaining} REMAINING</div>
      )}
    </div>
  )
}
