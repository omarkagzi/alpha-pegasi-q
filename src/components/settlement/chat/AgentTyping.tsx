"use client";

/**
 * AgentTyping — animated typing indicator shown while waiting for LLM response.
 * Three bouncing dots matching the agent's amber color theme.
 */
export function AgentTyping() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-800/60 border border-gray-700/40 rounded-lg px-3 py-2">
        <div className="flex gap-1">
          <span
            className="w-1.5 h-1.5 bg-amber-500/60 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-amber-500/60 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-amber-500/60 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
