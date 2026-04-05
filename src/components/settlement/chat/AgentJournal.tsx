"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

type JournalPeriod = "today" | "week";

interface JournalEntry {
  time_of_day: string;
  text: string;
}

interface RelationshipEntry {
  name: string;
  label: string;
  count: number;
}

interface JournalData {
  period: string;
  agent_name: string;
  entries: JournalEntry[];
  journal_text: string | null;
  current_thoughts: string | null;
  relationships: RelationshipEntry[];
}

interface AgentJournalProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
}

// Cache journal data client-side for 5 minutes
const journalCache = new Map<string, { data: JournalData; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * AgentJournal — overlay component showing an agent's journal entries,
 * current thoughts, and relationships. Accessible from the chat panel header.
 */
export function AgentJournal({ agentId, agentName, onClose }: AgentJournalProps) {
  const [period, setPeriod] = useState<JournalPeriod>("today");
  const [activeTab, setActiveTab] = useState<"journal" | "relationships">("journal");
  const [journal, setJournal] = useState<JournalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchJournal = useCallback(
    async (p: JournalPeriod) => {
      const cacheKey = `${agentId}:${p}`;
      const cached = journalCache.get(cacheKey);
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        setJournal(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const res = await fetch(`/api/agents/${agentId}/journal?period=${p}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Couldn't read the journal.");
          setLoading(false);
          return;
        }

        const data: JournalData = await res.json();
        journalCache.set(cacheKey, { data, fetchedAt: Date.now() });
        setJournal(data);
      } catch {
        setError("Connection lost. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [agentId, getToken]
  );

  useEffect(() => {
    fetchJournal(period);
  }, [period, fetchJournal]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-700/30">
        <span className="font-mono text-amber-400 font-bold text-sm">
          {agentName}&apos;s Journal
        </span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 font-mono text-xs px-2 py-1 border border-gray-700 rounded hover:border-gray-500 transition-colors"
        >
          close
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-gray-800">
        <TabButton
          active={activeTab === "journal" && period === "today"}
          onClick={() => { setActiveTab("journal"); setPeriod("today"); }}
          label="Today"
        />
        <TabButton
          active={activeTab === "journal" && period === "week"}
          onClick={() => { setActiveTab("journal"); setPeriod("week"); }}
          label="This Week"
        />
        <TabButton
          active={activeTab === "relationships"}
          onClick={() => setActiveTab("relationships")}
          label="Relationships"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">
        {loading && (
          <div className="text-gray-500 text-xs font-mono text-center py-8">
            Reading journal...
          </div>
        )}

        {error && (
          <div className="text-red-400/80 text-xs font-mono text-center py-8">
            {error}
          </div>
        )}

        {!loading && !error && activeTab === "journal" && (
          <JournalContent journal={journal} />
        )}

        {!loading && !error && activeTab === "relationships" && (
          <RelationshipsContent relationships={journal?.relationships ?? []} />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-xs px-3 py-1 rounded transition-colors ${
        active
          ? "bg-amber-900/40 text-amber-400 border border-amber-700/40"
          : "text-gray-500 hover:text-gray-300 border border-transparent"
      }`}
    >
      {label}
    </button>
  );
}

function JournalContent({ journal }: { journal: JournalData | null }) {
  if (!journal) return null;

  if (journal.entries.length === 0 && !journal.journal_text) {
    return (
      <div className="text-gray-600 text-xs font-mono text-center py-8">
        No entries for this period.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Journal entries grouped by time of day */}
      {journal.entries.map((entry, i) => (
        <div key={i}>
          <div className="text-amber-500/70 text-[10px] font-mono uppercase tracking-wider mb-1">
            {entry.time_of_day}
          </div>
          <div className="text-gray-300 text-xs leading-relaxed font-sans italic">
            &ldquo;{entry.text}&rdquo;
          </div>
        </div>
      ))}

      {/* Current thoughts */}
      {journal.current_thoughts && (
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="text-amber-500/70 text-[10px] font-mono uppercase tracking-wider mb-1">
            Current Thoughts
          </div>
          <div className="text-gray-300 text-xs leading-relaxed font-sans italic">
            &ldquo;{journal.current_thoughts}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}

function RelationshipsContent({ relationships }: { relationships: RelationshipEntry[] }) {
  if (relationships.length === 0) {
    return (
      <div className="text-gray-600 text-xs font-mono text-center py-8">
        No known relationships yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {relationships.map((rel, i) => (
        <div
          key={i}
          className="flex items-center justify-between text-xs font-mono"
        >
          <span className="text-gray-300">{rel.name}</span>
          <span className="text-gray-500">
            {rel.label}{" "}
            <span className="text-gray-600">
              ({rel.count} interaction{rel.count !== 1 ? "s" : ""})
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
