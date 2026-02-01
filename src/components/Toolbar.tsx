"use client";

import { Editor } from "tldraw";
import { useState, useRef, useEffect } from "react";

interface ToolbarProps {
  editor: Editor | null;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function Toolbar({
  editor,
  onToggleChat,
  isChatOpen,
  onSubmit,
  isLoading,
}: ToolbarProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeTool, setActiveTool] = useState("select");
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectTool = (tool: string) => {
    if (!editor) return;
    editor.setCurrentTool(tool);
    setActiveTool(tool);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSubmit(inputValue);
    setInputValue("");
    setIsExpanded(false);
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
  };

  // Handle Escape key to collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  // Expanded state - just the input
  if (isExpanded) {
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center bg-white rounded-2xl shadow-lg border border-gray-200 p-1.5">
          <form onSubmit={handleSubmit} className="flex items-center">
            <button
              type="button"
              className="p-2 text-gray-400"
              title="Add"
            >
              <PlusSmallIcon />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isLoading ? "Thinking..." : "Where should we start?"}
              disabled={isLoading}
              className="w-80 px-2 py-1.5 text-sm bg-transparent border-0 outline-none placeholder:text-gray-400 disabled:opacity-50"
            />
            <button
              type="button"
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
              title="Voice"
            >
              <MicIcon />
            </button>
            <button
              type="button"
              className="p-2 bg-gray-900 text-white rounded-full"
              title="Voice mode"
            >
              <VoiceWaveIcon />
            </button>
          </form>
          <button
            type="button"
            onClick={handleCollapse}
            className="ml-2 p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    );
  }

  // Normal state - input + tools
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2">
        {/* Left: AI input section */}
        <div className="flex items-center bg-white rounded-2xl shadow-lg border border-gray-200 p-1.5">
          <form onSubmit={handleSubmit} className="flex items-center">
            <button
              type="button"
              className="p-2 text-gray-400"
              title="Add"
            >
              <PlusSmallIcon />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={handleExpand}
              placeholder={isLoading ? "Thinking..." : "Ask me anything"}
              disabled={isLoading}
              className="w-32 px-2 py-1.5 text-sm bg-transparent border-0 outline-none placeholder:text-gray-400 disabled:opacity-50 cursor-pointer"
              readOnly
            />
            <button
              type="button"
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
              title="Voice"
            >
              <MicIcon />
            </button>
            <button
              type="button"
              className="p-2 bg-gray-900 text-white rounded-full"
              title="Voice mode"
            >
              <VoiceWaveIcon />
            </button>
          </form>
        </div>

        {/* Right: Creation tools */}
        <div className="flex items-center bg-white rounded-2xl shadow-lg border border-gray-200 p-1.5 gap-0.5">
          <ToolButton
            active={activeTool === "select"}
            onClick={() => selectTool("select")}
            title="Select"
          >
            <PointerIcon />
          </ToolButton>

          <ToolButton
            active={isChatOpen}
            onClick={onToggleChat}
            title="Chat"
          >
            <ChatIcon />
          </ToolButton>

          <ToolButton
            active={activeTool === "draw"}
            onClick={() => selectTool("draw")}
            title="Draw"
          >
            <PenIcon />
          </ToolButton>

          <ToolButton
            active={activeTool === "geo"}
            onClick={() => selectTool("geo")}
            title="Shapes"
          >
            <ShapeIcon />
          </ToolButton>

          <ToolButton
            active={false}
            onClick={() => {}}
            title="Emoji"
          >
            <EmojiIcon />
          </ToolButton>

          <ToolButton
            active={activeTool === "note"}
            onClick={() => selectTool("note")}
            title="Sticky note"
          >
            <StickyIcon />
          </ToolButton>

          <ToolButton active={false} onClick={() => {}} title="More">
            <PlusIcon />
          </ToolButton>
        </div>
      </div>
    </div>
  );
}

// Tool button component
function ToolButton({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-xl transition-colors ${
        active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

// Icons
function PlusSmallIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PointerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4l16 8-7 2-2 7z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function VoiceWaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="9" width="2" height="6" rx="1" />
      <rect x="6" y="6" width="2" height="12" rx="1" />
      <rect x="10" y="4" width="2" height="16" rx="1" />
      <rect x="14" y="6" width="2" height="12" rx="1" />
      <rect x="18" y="9" width="2" height="6" rx="1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
    </svg>
  );
}

function StickyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10l6-6V5a2 2 0 0 0-2-2z" />
      <path d="M15 21v-6h6" />
    </svg>
  );
}

function ShapeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 22 20 2 20" />
    </svg>
  );
}

function EmojiIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" />
    </svg>
  );
}
