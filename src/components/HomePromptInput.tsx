"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconMicrophone,
  IconArrowUp,
} from "@mirohq/design-system-icons";

interface HomePromptInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  onInputChange?: (value: string) => void;
}

// Single line with py-3 + text-base line-height is ~48px
const SINGLE_LINE_THRESHOLD = 52;

export function HomePromptInput({ onSubmit, isLoading, onInputChange }: HomePromptInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const expandedRef = useRef(false);

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${scrollHeight}px`;

    const wraps = scrollHeight > SINGLE_LINE_THRESHOLD;

    if (!expandedRef.current && wraps) {
      // Text started wrapping → expand
      expandedRef.current = true;
      setIsExpanded(true);
    } else if (expandedRef.current && !wraps && inputValue.length < 20) {
      // Text is short enough to safely fit in collapsed pill → collapse
      expandedRef.current = false;
      setIsExpanded(false);
    }
  }, [inputValue.length]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    autoResize();
  }, [inputValue, autoResize]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSubmit(inputValue);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const sendButton = inputValue.trim() ? (
    <button
      type="submit"
      className="w-10 h-10 min-w-[40px] bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0 transition-colors"
      title="Send"
    >
      <IconArrowUp size="medium" />
    </button>
  ) : (
    <button
      type="button"
      className="w-10 h-10 min-w-[40px] bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0 transition-colors"
      title="Voice mode"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <rect x="2" y="9" width="2.5" height="6" rx="1.25" />
        <rect x="6.5" y="5" width="2.5" height="14" rx="1.25" />
        <rect x="11" y="3" width="2.5" height="18" rx="1.25" />
        <rect x="15.5" y="5" width="2.5" height="14" rx="1.25" />
        <rect x="20" y="9" width="2.5" height="6" rx="1.25" />
      </svg>
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div
        className={`bg-white border border-gray-200 rounded-[28px] ${
          isExpanded ? "flex flex-col" : "flex items-center"
        }`}
        style={{
          boxShadow:
            "0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {/* Collapsed: inline pill layout */}
        {!isExpanded && (
          <button
            type="button"
            className="p-3 text-black hover:text-black transition-colors duration-200 flex-shrink-0"
            title="Add"
          >
            <IconPlus size="medium" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onInputChange?.(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Create or ask anything"
          disabled={isLoading}
          rows={1}
          className={`text-base bg-transparent border-0 outline-none placeholder:text-gray-400 disabled:opacity-50 resize-none ${
            isExpanded
              ? "w-full px-4 pt-4 pb-2 max-h-48 overflow-y-auto"
              : "flex-1 py-3 min-w-0 overflow-hidden"
          }`}
        />

        {!isExpanded && (
          <>
            <button
              type="button"
              className="p-3 text-black hover:text-black transition-colors duration-200 flex-shrink-0"
              title="Voice input"
            >
              <IconMicrophone size="medium" />
            </button>
            <div className="m-1">{sendButton}</div>
          </>
        )}

        {/* Expanded: toolbar below textarea */}
        {isExpanded && (
          <div className="flex items-center justify-between px-2 pb-2">
            <button
              type="button"
              className="p-2 text-black hover:text-black transition-colors duration-200 flex-shrink-0 rounded-full hover:bg-gray-100"
              title="Add"
            >
              <IconPlus size="medium" />
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-2 text-black hover:text-black transition-colors duration-200 flex-shrink-0 rounded-full hover:bg-gray-100"
                title="Voice input"
              >
                <IconMicrophone size="medium" />
              </button>
              {sendButton}
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
