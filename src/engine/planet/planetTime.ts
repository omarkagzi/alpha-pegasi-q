export const DAY_CYCLE_MINUTES = 24;

export interface ServerTimeRef {
  normalizedTime: number | null;
  fetchedAt: number | null; // Date.now() at which normalizedTime was fetched
}

/**
 * Returns the current normalized day/night time (0.0–1.0).
 * If a server-synced time is available, extrapolates forward from the last
 * fetch using elapsed wall-clock time so the sun position stays consistent
 * across all connected clients.
 * Falls back to local Date.now() if server sync has not yet succeeded.
 */
export const simulatePlanetTime = (serverRef?: ServerTimeRef): number => {
  const cycleMs = DAY_CYCLE_MINUTES * 60 * 1000;

  if (
    serverRef !== undefined &&
    serverRef.normalizedTime !== null &&
    serverRef.fetchedAt !== null
  ) {
    const elapsedSinceFetch = Date.now() - serverRef.fetchedAt;
    const elapsedFraction = elapsedSinceFetch / cycleMs;
    return (serverRef.normalizedTime + elapsedFraction) % 1.0;
  }

  // Local fallback
  const now = Date.now();
  return (now % cycleMs) / cycleMs;
};

/**
 * Returns the sun's direction vector as [x, y, z] for a given
 * normalized time value (0.0–1.0 = one full day cycle).
 */
export const getSunDirection = (normalizedTime: number): [number, number, number] => {
  const angle = normalizedTime * Math.PI * 2;
  return [Math.cos(angle), 0.2, Math.sin(angle)];
};

/**
 * Fetches the authoritative server-side normalized time from the API.
 * Returns null on network failure (caller should keep the last known value).
 */
export const fetchServerTime = async (): Promise<{
  normalizedTime: number;
  fetchedAt: number;
} | null> => {
  try {
    const res = await fetch('/api/world/time');
    if (!res.ok) return null;
    const data: { normalizedTime: number } = await res.json();
    return { normalizedTime: data.normalizedTime, fetchedAt: Date.now() };
  } catch {
    return null;
  }
};
