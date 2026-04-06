"use client";

import { useState, useCallback, useEffect } from "react";
import { useWorldStore } from "@/stores/worldStore";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatMessages, type ChatMessage } from "./chat/ChatMessages";
import { ChatInput } from "./chat/ChatInput";

/**
 * ChatPanel — side panel for human-to-agent conversation.
 * Overlays the settlement view on the right side.
 * Slides in when activeChat is set, slides out when closed.
 */
export default function ChatPanel() {
  const activeChat = useWorldStore((s) => s.activeChat);
  const closeChat = useWorldStore((s) => s.closeChat);
  const setChatSessionId = useWorldStore((s) => s.setChatSessionId);
  const { getToken, isSignedIn } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset messages when chat opens with a different agent
  useEffect(() => {
    if (activeChat) {
      setMessages([]);
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally reset only on agentId change
  }, [activeChat?.agentId]);

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
    <div className="absolute top-0 right-0 h-full w-[380px] z-40 flex flex-col bg-black/85 border-l border-amber-700/40 backdrop-blur-sm animate-slide-in-right pointer-events-auto">
      {/* Header with agent name, journal button, and close */}
      <ChatHeader
        agentId={activeChat.agentId}
        agentName={activeChat.agentName}
        onClose={handleCloseChat}
      />

      {/* Scrollable message list */}
      <ChatMessages
        messages={messages}
        agentName={activeChat.agentName}
        isLoading={isLoading}
        error={error}
      />

      {/* Input with file attachment, or sign-in prompt */}
      {isSignedIn === false ? (
        <div className="px-4 py-3 border-t border-amber-700/40 text-center">
          <p className="text-gray-400 text-xs font-mono mb-2">Sign in to speak with the people of Arboria.</p>
          <SignInButton mode="modal">
            <button className="px-4 py-1.5 rounded bg-amber-700/60 hover:bg-amber-700/80 text-amber-100 text-xs font-mono border border-amber-600/40 cursor-pointer transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      ) : (
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      )}
    </div>
  );
}
