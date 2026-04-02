"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWorldStore } from "@/stores/worldStore";
import { useAuth } from "@clerk/nextjs";
import { ChatInput } from "./ChatInput";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  attachment?: {
    filename: string;
    type: string;
  };
}

/**
 * ChatPanel — side panel for human-to-agent conversation.
 * Overlays the settlement view on the right side.
 * Slides in when activeChat is set, slides out when closed.
 */
export default function ChatPanel() {
  const activeChat = useWorldStore((s) => s.activeChat);
  const closeChat = useWorldStore((s) => s.closeChat);
  const setChatSessionId = useWorldStore((s) => s.setChatSessionId);
  const { getToken } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset messages when chat opens with a different agent
  useEffect(() => {
    if (activeChat) {
      setMessages([]);
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally reset only on agentId change
  }, [activeChat?.agentId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // End session on the server when chat closes
  const handleCloseChat = useCallback(async () => {
    if (activeChat?.sessionId && activeChat?.agentId) {
      const token = await getToken();
      fetch(`/api/agents/${activeChat.agentId}/chat/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: activeChat.sessionId }),
      }).catch(() => {}); // fire and forget
    }
    closeChat();
  }, [activeChat, closeChat, getToken]);

  // ESC key to close chat
  useEffect(() => {
    if (!activeChat) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseChat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeChat, handleCloseChat]);

  const sendMessage = useCallback(
    async (
      text: string,
      attachment?: { filename: string; content: string; mime_type: string }
    ) => {
      if (!activeChat || isLoading) return;

      setError(null);

      // Add user message to UI immediately
      const userMsg: ChatMessage = {
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
        attachment: attachment
          ? { filename: attachment.filename, type: attachment.mime_type }
          : undefined,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const token = await getToken();

        const body: Record<string, unknown> = {
          message: text,
        };
        if (activeChat.sessionId) {
          body.session_id = activeChat.sessionId;
        }
        if (attachment) {
          body.attachments = [attachment];
        }

        const res = await fetch(`/api/agents/${activeChat.agentId}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Something went wrong.");
          setIsLoading(false);
          return;
        }

        // Store session ID for subsequent messages
        if (data.session_id && data.session_id !== activeChat.sessionId) {
          setChatSessionId(data.session_id);
        }

        // Add agent reply
        const agentMsg: ChatMessage = {
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, agentMsg]);
      } catch {
        setError("Connection lost. Try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [activeChat, isLoading, getToken, setChatSessionId]
  );

  if (!activeChat) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-0 right-0 h-full w-[380px] z-40 flex flex-col bg-black/85 border-l border-amber-700/40 backdrop-blur-sm animate-slide-in-right pointer-events-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-700/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-amber-400 font-bold text-sm">
            {activeChat.agentName}
          </span>
        </div>
        <button
          onClick={handleCloseChat}
          className="text-gray-500 hover:text-gray-300 font-mono text-xs px-2 py-1 border border-gray-700 rounded hover:border-gray-500 transition-colors"
          title="Close (ESC)"
        >
          ESC
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
        {messages.length === 0 && !isLoading && (
          <div className="text-gray-600 text-xs font-mono text-center mt-8">
            Start a conversation with {activeChat.agentName}
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
                  <span>📎</span>
                  <span>{msg.attachment.filename}</span>
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800/60 border border-gray-700/40 rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-amber-500/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-amber-500/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center">
            <span className="text-red-400/80 text-xs font-mono bg-red-900/20 border border-red-800/30 rounded px-2 py-1">
              {error}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
