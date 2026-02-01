"use client";

import { Editor } from "tldraw";
import { useState } from "react";

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
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-white rounded-2xl shadow-lg border border-gray-200 p-1.5">
        {/* Left section: Select & Comment */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
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
        </div>

        {/* Center section: AI input */}
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isLoading ? "Thinking..." : "Make anything"}
            disabled={isLoading}
            className="w-40 px-3 py-1.5 text-sm bg-gray-100 rounded-full border-0 outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-500 disabled:opacity-50"
          />
          <button
            type="button"
            className="ml-1 p-1.5 rounded-full hover:bg-gray-100"
            title="Voice (coming soon)"
          >
            <MicIcon />
          </button>
        </form>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Right section: Creation tools */}
        <div className="flex items-center gap-0.5">
          <ToolButton
            active={activeTool === "draw"}
            onClick={() => selectTool("draw")}
            title="Draw"
          >
            <PenIcon />
          </ToolButton>

          <ToolButton
            active={activeTool === "note"}
            onClick={() => selectTool("note")}
            title="Sticky note"
          >
            <StickyIcon />
          </ToolButton>

          <ToolButton
            active={activeTool === "geo"}
            onClick={() => selectTool("geo")}
            title="Shapes"
          >
            <ShapeIcon />
          </ToolButton>

          <ToolButton
            active={activeTool === "text"}
            onClick={() => selectTool("text")}
            title="Text"
          >
            <TextIcon />
          </ToolButton>

          <ToolButton
            active={activeTool === "arrow"}
            onClick={() => selectTool("arrow")}
            title="Connector"
          >
            <ConnectorIcon />
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

// Icons (simple SVGs matching the design)
function PointerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4l16 8-7 2-2 7z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
    </svg>
  );
}

function StickyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10l6-6V5a2 2 0 0 0-2-2z" />
      <path d="M15 21v-6h6" />
    </svg>
  );
}

function ShapeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="12 2 22 20 2 20" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="8" y1="20" x2="16" y2="20" />
    </svg>
  );
}

function ConnectorIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="5" cy="12" r="3" />
      <circle cx="19" cy="12" r="3" />
      <line x1="8" y1="12" x2="16" y2="12" />
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
