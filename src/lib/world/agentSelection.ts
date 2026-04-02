// src/lib/world/agentSelection.ts
// Agent fairness scheduling — ensures even participation in heartbeat events.
// No agent goes >3 heartbeats (~18 min) without appearing in an event.

export interface HeartbeatAgent {
  id: string;
  name: string;
  last_heartbeat: string | null; // ISO timestamp or null if never
  beliefs: Record<string, string> | null;
  zone?: string;
}

/**
 * Selects 2-4 agents for a heartbeat, prioritizing those who
 * haven't acted recently. The least-recently-active agent is
 * always included to prevent any agent from going silent.
 */
export function selectAgentsForHeartbeat(agents: HeartbeatAgent[]): HeartbeatAgent[] {
  if (agents.length <= 2) return agents;

  // Sort by last_heartbeat ascending (least recently active first)
  const sorted = [...agents].sort((a, b) => {
    const aTime = a.last_heartbeat ? new Date(a.last_heartbeat).getTime() : 0;
    const bTime = b.last_heartbeat ? new Date(b.last_heartbeat).getTime() : 0;
    return aTime - bTime;
  });

  // Always include the least-recently-active agent
  const selected: HeartbeatAgent[] = [sorted[0]];

  // Add 1-3 more randomly from the rest
  const remaining = sorted.slice(1);
  const additionalCount = Math.floor(Math.random() * 3) + 1; // 1-3
  const shuffled = remaining.sort(() => Math.random() - 0.5);
  selected.push(...shuffled.slice(0, additionalCount));

  return selected;
}
