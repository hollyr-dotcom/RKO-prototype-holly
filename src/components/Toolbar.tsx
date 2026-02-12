"use client";

import { Editor } from "tldraw";
import { useState, useRef, useEffect, useCallback } from "react";
import Markdown from "react-markdown";
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
  IconChatLinesDot,
  IconArticle,
  IconTable,
  IconCross,
} from "@mirohq/design-system-icons";
import { PromptSuggestions } from "./PromptSuggestions";

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


interface ToolbarProps {
  editor: Editor | null;
  onToggleChat: () => void;
  isChatOpen: boolean;
  hideInput?: boolean;
  onSubmit: (text: string) => void;
  isLoading: boolean;
  voiceState?: "idle" | "connecting" | "listening" | "speaking" | "error";
  onVoiceToggle?: () => void;
  canvasState?: { frames: any[]; orphans: any[]; arrows: any[] };
  onExpandedChange?: (expanded: boolean) => void;
  responseToast?: string | null;
  onDismissToast?: () => void;
  onOpenChat?: () => void;
  hasMessages?: boolean;
  hasPendingQuestion?: boolean;
  onSuggestionsVisibilityChange?: (visible: boolean) => void;
  onInputChange?: (hasText: boolean) => void;
  onCreateDocument?: () => void;
  onCreateDataTable?: () => void;
  isCommentMode?: boolean;
  onToggleCommentMode?: () => void;
}

export function Toolbar({
  editor,
  onToggleChat,
  isChatOpen,
  hideInput = false,
  onSubmit,
  isLoading,
  voiceState = "idle",
  onVoiceToggle,
  canvasState = { frames: [], orphans: [], arrows: [] },
  onExpandedChange,
  responseToast,
  onDismissToast,
  onOpenChat,
  hasMessages = false,
  hasPendingQuestion = false,
  onSuggestionsVisibilityChange,
  onInputChange,
  onCreateDocument,
  onCreateDataTable,
  isCommentMode = false,
  onToggleCommentMode,
}: ToolbarProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeTool, setActiveTool] = useState("select");
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const selectTool = (tool: string) => {
    if (!editor) return;
    editor.setCurrentTool(tool);
    setActiveTool(tool);
    // Exit comment mode when selecting any other tool
    if (isCommentMode) {
      onToggleCommentMode?.();
    }
  };

  const showSuggestions = isExpanded && isInputFocused && !isLoading && voiceState === "idle" && inputValue.trim().length > 0 && !hasPendingQuestion;

  // Notify parent when suggestions visibility changes
  useEffect(() => {
    onSuggestionsVisibilityChange?.(showSuggestions);
  }, [showSuggestions, onSuggestionsVisibilityChange]);

  // Notify parent when input has text
  useEffect(() => {
    onInputChange?.(inputValue.trim().length > 0);
  }, [inputValue, onInputChange]);

  const handleSuggestionSelect = useCallback((text: string) => {
    console.log('[TOOLBAR] Suggestion selected:', text);
    console.log('[TOOLBAR] onSubmit function:', typeof onSubmit, onSubmit);
    onSubmit(text);
    setInputValue("");
    setSelectedSuggestionIndex(-1);
    // Keep expanded + refocus input
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [onSubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // If a suggestion is selected via keyboard, use that
    if (selectedSuggestionIndex >= 0 && showSuggestions) {
      return;
    }

    if (!inputValue.trim()) return;
    onSubmit(inputValue);
    setInputValue("");
    setSelectedSuggestionIndex(-1);
    // Keep expanded + refocus input - use requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleExpand = () => {
    if (isChatOpen) return;
    setIsExpanded(true);
    onExpandedChange?.(true);
    setSelectedSuggestionIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    onExpandedChange?.(false);
    setInputValue("");
    setSelectedSuggestionIndex(-1);
  };

  // Reset selected suggestion when input changes
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [inputValue]);

  // Handle Escape and arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        handleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  // Collapse when chat opens or floating UI takes over (Q&A modal, plan approval)
  useEffect(() => {
    if ((isChatOpen || hideInput) && isExpanded) {
      setIsExpanded(false);
      onExpandedChange?.(false);
    }
  }, [isChatOpen, hideInput]);

  // Handle click outside to dismiss autocomplete only (keep toolbar expanded and text)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node) && isExpanded) {
        // Just blur the input to hide autocomplete, don't collapse toolbar
        inputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  // Refocus input after AI finishes replying (in toast mode)
  useEffect(() => {
    if (!isLoading && isExpanded && !isChatOpen && !hideInput) {
      // Small delay to ensure toast renders first
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isLoading, isExpanded, isChatOpen, hideInput]);

  return (
    <div ref={toolbarRef} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[70]">
      {/* Tools button - positioned absolutely to the left */}
      {isExpanded && (
        <button
          type="button"
          onClick={handleCollapse}
          className="absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 p-2.5 bg-white border border-gray-200 text-black rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-50 flex-shrink-0"
          style={{
            boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
          }}
          title="Show tools"
        >
          <IconShapesLinesStacked size="medium" />
        </button>
      )}

      {/* Main toolbar container - always centered */}
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
          <ToolButton
            active={isCommentMode}
            onClick={() => {
              onToggleCommentMode?.();
              // When entering comment mode, deselect tldraw tools
              if (!isCommentMode && editor) {
                editor.setCurrentTool("select");
                setActiveTool("select");
              }
            }}
            title="Comment"
          >
            <IconChatLinesDot size="medium" />
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

          {/* Document */}
          <ToolButton active={false} onClick={() => onCreateDocument?.()} title="Document">
            <IconArticle size="medium" />
          </ToolButton>

          {/* DataTable */}
          <ToolButton active={false} onClick={() => onCreateDataTable?.()} title="Table">
            <IconTable size="medium" />
          </ToolButton>
        </div>

        {/* Separator line - hidden when expanded, chat open, or floating UI showing */}
        {!isExpanded && !isChatOpen && !hideInput && (
          <div className="self-stretch w-px bg-gray-200 mx-2 my-[-6px] flex-shrink-0" />
        )}

        {/* AI Input Section - hidden when chat open or floating UI showing */}
        <div
          className={`relative transition-all duration-300 ease-out ${
            isChatOpen || hideInput
              ? "w-0 opacity-0"
              : isExpanded
                ? "w-[420px] opacity-100"
                : "w-[320px] opacity-100"
          }`}
        >
          {/* Suggestions dropdown - positioned above the entire section */}
          {showSuggestions && (
            <PromptSuggestions
              canvasState={canvasState}
              inputValue={inputValue}
              isVisible={showSuggestions}
              onSelect={handleSuggestionSelect}
              selectedIndex={selectedSuggestionIndex}
            />
          )}

          {/* Response toast - shown when AI responds and sidebar is closed */}
          {responseToast && !isLoading && (
            <div className="absolute bottom-full left-0 right-0 mb-4">
              <div className="w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col max-h-[300px] relative">
                {/* Sticky icon */}
                <div className="absolute top-4 left-4 z-10 bg-white">
                  <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center">
                    <IconSingleSparksFilled size="small" />
                  </div>
                </div>
                {/* Sticky close button */}
                <div className="absolute top-4 right-4 z-10 bg-white">
                  <div
                    onClick={(e) => { e.stopPropagation(); onDismissToast?.(); }}
                    className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded cursor-pointer"
                    title="Dismiss"
                  >
                    <IconCross css={{ width: 14, height: 14 }} />
                  </div>
                </div>
                {/* Scrollable content */}
                <div
                  onClick={() => { onOpenChat?.(); onDismissToast?.(); }}
                  className="overflow-y-auto p-4 pl-14 pr-10 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="text-sm text-gray-700">
                    <Markdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                        h1: ({ children }) => <h1 className="text-base font-semibold mt-3 mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-2">{children}</h3>,
                        code: ({ children }) => <code className="bg-gray-100 px-1 rounded text-xs">{children}</code>,
                      }}
                    >
                      {responseToast}
                    </Markdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={`flex items-center overflow-hidden ${isChatOpen || hideInput ? "w-0" : ""}`}>
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
                  onChange={(e) => { setInputValue(e.target.value); if (responseToast) onDismissToast?.(); }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyDown={(e) => {
                    if (!showSuggestions) return;
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setSelectedSuggestionIndex((prev) => Math.max(-1, prev - 1));
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setSelectedSuggestionIndex((prev) => prev + 1);
                    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
                      e.preventDefault();
                      const btn = document.querySelector(`[data-suggestion-index="${selectedSuggestionIndex}"]`) as HTMLElement;
                      if (btn) {
                        const text = btn.getAttribute("data-suggestion-text");
                        if (text) handleSuggestionSelect(text);
                      }
                    }
                  }}
                  placeholder={isLoading || hasMessages ? "Reply..." : "Ask me anything"}
                  disabled={isLoading}
                  className="flex-1 py-2 text-lg bg-transparent border-0 outline-none placeholder:text-gray-400 disabled:opacity-50 min-w-0"
                />
              ) : (
                <button
                  type="button"
                  onClick={handleExpand}
                  className="flex-1 py-2 text-lg text-gray-400 text-left hover:text-gray-500 transition-colors duration-200 whitespace-nowrap font-normal"
                >
                  {isLoading || hasMessages ? "Reply..." : "Ask me anything"}
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
                  className="w-10 h-10 min-w-[40px] m-1 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0"
                  title="Send"
                >
                  <IconArrowUp size="medium" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onVoiceToggle}
                  className={`w-10 h-10 min-w-[40px] m-1 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    voiceState === "listening" || voiceState === "speaking"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : voiceState === "connecting"
                        ? "bg-gray-500 text-white cursor-wait"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                  title={
                    voiceState === "listening" ? "Listening... (click to stop)" :
                    voiceState === "speaking" ? "Speaking... (click to stop)" :
                    voiceState === "connecting" ? "Connecting..." :
                    "Voice mode"
                  }
                  disabled={voiceState === "connecting"}
                >
                  <VoiceWaveIcon />
                </button>
              )}
            </div>
            </form>
          </div>
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
      className={`p-2.5 rounded-full transition-all duration-200 text-black flex items-center justify-center ${
        active ? "bg-gray-100" : "hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
