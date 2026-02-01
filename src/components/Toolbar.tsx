"use client";

import { Editor } from "tldraw";
import { useState, useRef, useEffect } from "react";
import {
  IconPlus,
  IconMicrophone,
  IconCursorFilled,
  IconPen,
  IconShapes,
  IconStickyNote,
  IconPlusSquare,
  IconShapesLinesStacked,
  IconSingleSparksFilled,
  IconArrowUp,
} from "@mirohq/design-system-icons";

// Custom voice wave icon (5 bars) - not available in Miro design system
function VoiceWaveIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="9" width="2.5" height="6" rx="1.25" />
      <rect x="6.5" y="5" width="2.5" height="14" rx="1.25" />
      <rect x="11" y="3" width="2.5" height="18" rx="1.25" />
      <rect x="15.5" y="5" width="2.5" height="14" rx="1.25" />
      <rect x="20" y="9" width="2.5" height="6" rx="1.25" />
    </svg>
  );
}

// Custom comment icon with three dots (outlined)
function CommentDotsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 0 1-4.255-.96L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

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
    if (isChatOpen) return;
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setInputValue("");
  };

  // Handle Escape key to collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        handleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  // Collapse when chat opens
  useEffect(() => {
    if (isChatOpen && isExpanded) {
      setIsExpanded(false);
    }
  }, [isChatOpen]);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
      {/* Main toolbar container */}
      <div
        className="flex items-center bg-white rounded-full border border-gray-200 p-1.5 transition-all duration-300 ease-out"
        style={{
          boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {/* Canvas Tools - on the left now */}
        <div
          className={`flex items-center gap-0.5 transition-all duration-300 ease-out ${
            isExpanded ? "opacity-0 w-0 overflow-hidden ml-0" : "opacity-100 ml-1"
          }`}
        >
          {/* Cursor / Select */}
          <ToolButton
            active={activeTool === "select"}
            onClick={() => selectTool("select")}
            title="Select"
          >
            <IconCursorFilled size="medium" />
          </ToolButton>

          {/* Comment */}
          <ToolButton active={false} onClick={() => {}} title="Comment">
            <CommentDotsIcon />
          </ToolButton>

          {/* Draw */}
          <ToolButton
            active={activeTool === "draw"}
            onClick={() => selectTool("draw")}
            title="Draw"
          >
            <IconPen size="medium" />
          </ToolButton>

          {/* Shapes */}
          <ToolButton
            active={activeTool === "geo"}
            onClick={() => selectTool("geo")}
            title="Shapes"
          >
            <IconShapes size="medium" />
          </ToolButton>

          {/* Sticky note */}
          <ToolButton
            active={activeTool === "note"}
            onClick={() => selectTool("note")}
            title="Sticky note"
          >
            <IconStickyNote size="medium" />
          </ToolButton>

          {/* More */}
          <ToolButton active={false} onClick={() => {}} title="More">
            <IconPlusSquare size="medium" />
          </ToolButton>
        </div>

        {/* Separator line - hidden when expanded or chat open */}
        {!isExpanded && !isChatOpen && (
          <div className="self-stretch w-px bg-gray-200 mx-2 my-[-6px] flex-shrink-0" />
        )}

        {/* AI Input Section - on the right now, hidden when chat is open */}
        <div
          className={`flex items-center overflow-hidden transition-all duration-300 ease-out ${
            isChatOpen
              ? "w-0 opacity-0 p-0"
              : isExpanded
                ? "w-[420px] opacity-100"
                : "w-[320px] opacity-100"
          }`}
        >
          <form onSubmit={handleSubmit} className="flex items-center w-full">
            {/* Input pill with light gray bg */}
            <div className="flex items-center bg-gray-100 rounded-full flex-1">
              {/* Plus button */}
              <button
                type="button"
                className="p-3 text-black hover:text-black transition-colors duration-200 flex-shrink-0"
                title="Add"
              >
                <IconPlus size="medium" />
              </button>

              {/* Input area */}
              {isExpanded ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isLoading ? "Thinking..." : "Where should we start?"}
                  disabled={isLoading}
                  className="flex-1 py-2 text-lg bg-transparent border-0 outline-none placeholder:text-gray-400 disabled:opacity-50 min-w-0"
                />
              ) : (
                <button
                  type="button"
                  onClick={handleExpand}
                  className="flex-1 py-2 text-lg text-gray-400 text-left hover:text-gray-500 transition-colors duration-200 whitespace-nowrap font-normal"
                >
                  {isLoading ? "Thinking..." : "Ask me anything"}
                </button>
              )}

              {/* Mic button - inside pill on right */}
              <button
                type="button"
                className="p-3 text-black hover:text-black transition-colors duration-200 flex-shrink-0"
                title="Voice input"
              >
                <IconMicrophone size="medium" />
              </button>

              {/* Voice mode / Submit button - inside pill on right */}
              {inputValue.trim() ? (
                <button
                  type="submit"
                  className="w-10 h-10 m-1 bg-gray-900 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-800 flex-shrink-0"
                  title="Send"
                >
                  <IconArrowUp size="medium" />
                </button>
              ) : (
                <button
                  type="button"
                  className="w-10 h-10 m-1 bg-gray-900 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-800 flex-shrink-0"
                  title="Voice mode"
                >
                  <VoiceWaveIcon />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Tools button - outside toolbar on the left, only when expanded */}
      {isExpanded && (
        <button
          type="button"
          onClick={handleCollapse}
          className="p-2.5 bg-white border border-gray-200 text-black rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-50 flex-shrink-0 order-first"
          style={{
            boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
          }}
          title="Show tools"
        >
          <IconShapesLinesStacked size="medium" />
        </button>
      )}
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
      className={`p-2.5 rounded-full transition-all duration-200 text-black flex items-center justify-center ${
        active ? "bg-gray-100" : "hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
