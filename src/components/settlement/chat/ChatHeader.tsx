"use client";

import { useState } from "react";
import { AgentJournal } from "./AgentJournal";

interface ChatHeaderProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
}

/**
 * ChatHeader — displays agent name, status indicator, journal button, and close button.
 */
export function ChatHeader({ agentId, agentName, onClose }: ChatHeaderProps) {
  const [showJournal, setShowJournal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-700/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-amber-400 font-bold text-sm">
            {agentName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Journal button */}
          <button
            onClick={() => setShowJournal(true)}
            className="text-gray-500 hover:text-amber-400 transition-colors px-1.5 py-1 border border-gray-700 rounded hover:border-amber-700/50 text-xs"
            title="View journal"
          >
            <span className="text-sm">&#x1F4D6;</span>
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 font-mono text-xs px-2 py-1 border border-gray-700 rounded hover:border-gray-500 transition-colors"
            title="Close (ESC)"
          >
            ESC
          </button>
        </div>
      </div>

      {/* Journal overlay */}
      {showJournal && (
        <AgentJournal
          agentId={agentId}
          agentName={agentName}
          onClose={() => setShowJournal(false)}
        />
      )}
    </>
  );
}
