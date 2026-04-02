"use client";

import { useState, useRef, useCallback } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_TOKENS = 40_000; // ~10,000 tokens worth of characters

const SUPPORTED_TEXT_EXTENSIONS = new Set([
  "txt", "md", "py", "js", "ts", "tsx", "jsx", "json", "csv",
  "html", "css", "sql", "yaml", "yml", "xml", "sh", "bash",
  "java", "c", "cpp", "h", "hpp", "rs", "go", "rb", "php",
  "swift", "kt", "scala", "r", "toml", "ini", "cfg", "env",
  "log", "diff", "patch",
]);

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png", "image/jpeg", "image/gif", "image/webp",
]);

interface Attachment {
  filename: string;
  content: string;
  mime_type: string;
}

interface ChatInputProps {
  onSend: (message: string, attachment?: Attachment) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed, attachment ?? undefined);
    setText("");
    setAttachment(null);
    setFileError(null);

    // Re-focus textarea
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [text, attachment, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      // Stop E key from propagating to Phaser when typing
      e.stopPropagation();
    },
    [handleSubmit]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setFileError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      // Size check
      if (file.size > MAX_FILE_SIZE) {
        setFileError("That file is a bit too heavy to carry. Try something under 10MB.");
        e.target.value = "";
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

      // Text files
      if (SUPPORTED_TEXT_EXTENSIONS.has(ext)) {
        try {
          let content = await file.text();
          if (content.length > MAX_FILE_TOKENS) {
            content =
              content.slice(0, MAX_FILE_TOKENS) +
              "\n\n[File truncated at 10,000 tokens. Showing first portion.]";
          }
          setAttachment({
            filename: file.name,
            content,
            mime_type: file.type || `text/plain`,
          });
        } catch {
          setFileError("Couldn't read that file. Try another.");
        }
        e.target.value = "";
        return;
      }

      // Images
      if (SUPPORTED_IMAGE_TYPES.has(file.type)) {
        try {
          const buffer = await file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
          setAttachment({
            filename: file.name,
            content: base64,
            mime_type: file.type,
          });
        } catch {
          setFileError("Couldn't process that image. Try another.");
        }
        e.target.value = "";
        return;
      }

      // PDF — would need pdf.js, stub for now
      if (ext === "pdf") {
        setFileError("PDF support coming soon. Try a text file or image for now.");
        e.target.value = "";
        return;
      }

      setFileError("This file type isn't supported yet. Try text files, PDFs, or images.");
      e.target.value = "";
    },
    []
  );

  return (
    <div className="border-t border-amber-700/30 px-4 py-3">
      {/* Attachment preview */}
      {attachment && (
        <div className="flex items-center justify-between bg-amber-900/20 border border-amber-700/20 rounded px-2 py-1 mb-2 text-[10px] font-mono text-amber-400/80">
          <span className="truncate">
            📎 {attachment.filename}
          </span>
          <button
            onClick={() => setAttachment(null)}
            className="text-gray-500 hover:text-gray-300 ml-2 shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* File error */}
      {fileError && (
        <div className="text-red-400/80 text-[10px] font-mono mb-2">
          {fileError}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="text-gray-500 hover:text-amber-400 transition-colors p-1 shrink-0 disabled:opacity-30"
          title="Attach file"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-gray-900/60 border border-gray-700/50 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-amber-700/50 disabled:opacity-30"
          autoFocus
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="text-amber-500 hover:text-amber-400 transition-colors p-1 shrink-0 disabled:opacity-30"
          title="Send (Enter)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      <div className="text-[9px] text-gray-700 font-mono mt-1 text-center">
        Enter to send · Shift+Enter for new line · ESC to close
      </div>
    </div>
  );
}
