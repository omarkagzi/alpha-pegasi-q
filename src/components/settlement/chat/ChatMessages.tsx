"use client";

import { useRef, useEffect } from "react";
import { SignInButton } from "@clerk/nextjs";
import { AgentTyping } from "./AgentTyping";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  attachment?: {
    filename: string;
    type: string;
  };
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  agentName: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * ChatMessages — scrollable message list with user and agent message bubbles.
 */
export function ChatMessages({ messages, agentName, isLoading, error }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
      {messages.length === 0 && !isLoading && (
        <div className="text-gray-600 text-xs font-mono text-center mt-8">
          Start a conversation with {agentName}
        </div>
      )}

      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-lg px-3 py-2 font-mono text-xs leading-relaxed ${
              msg.role === "user"
                ? "bg-amber-900/40 border border-amber-700/30 text-gray-200"
                : "bg-gray-800/60 border border-gray-700/40 text-gray-300"
            }`}
          >
            {msg.attachment && (
              <div className="text-[10px] text-amber-500/70 mb-1 flex items-center gap-1">
                <span>&#x1F4CE;</span>
                <span>{msg.attachment.filename}</span>
              </div>
            )}
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
          </div>
        </div>
      ))}

      {isLoading && <AgentTyping />}

      {error && (
        <div className="text-center space-y-2">
          <span className="text-red-400/80 text-xs font-mono bg-red-900/20 border border-red-800/30 rounded px-2 py-1">
            {error}
          </span>
          {error.toLowerCase().includes("sign in") && (
            <div>
              <SignInButton mode="modal">
                <button className="px-4 py-1.5 rounded bg-amber-700/60 hover:bg-amber-700/80 text-amber-100 text-xs font-mono border border-amber-600/40 cursor-pointer transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </div>
          )}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
