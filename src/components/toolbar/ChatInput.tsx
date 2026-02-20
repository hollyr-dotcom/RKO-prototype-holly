"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  IconArrowUp,
  IconCross,
} from "@mirohq/design-system-icons";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import Markdown from "react-markdown";
import { PromptSuggestions } from "../PromptSuggestions";
import { ICON_SIZE } from "./toolbar-constants";
import aiListeningAnimation from "./lottie/ai-listening.json";

function BlobIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      width="27"
      height="26"
      viewBox="0 0 27 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <ellipse cx="6.55805" cy="12.8569" rx="3.53571" ry="8.59625" fill="currentColor" />
      <ellipse cx="13.1158" cy="12.857" rx="3.53571" ry="12.2207" fill="currentColor" />
      <ellipse cx="19.6737" cy="12.8569" rx="3.53571" ry="10.1568" fill="currentColor" />
    </svg>
  );
}

function VoiceHoverButton({ onClick }: { onClick?: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => {
        setIsHovered(true);
        lottieRef.current?.goToAndPlay(0);
      }}
      onMouseLeave={() => setIsHovered(false)}
      className="flex shrink-0 items-center justify-center rounded-lg w-[36px] h-[36px] text-[#222428]"
    >
      {isHovered ? (
        <Lottie
          lottieRef={lottieRef}
          animationData={aiListeningAnimation}
          loop={false}
          autoplay
          style={{ width: 20, height: 23 }}
          onComplete={() => setIsHovered(false)}
        />
      ) : (
        <BlobIcon style={{ width: ICON_SIZE, height: ICON_SIZE }} />
      )}
    </button>
  );
}

interface ChatInputProps {
  onSubmit: (message: string) => void;
  onFocusChange: (focused: boolean) => void;
  onVoiceStart?: () => void;
  isLoading: boolean;
  hasMessages: boolean;
  hasPendingQuestion: boolean;
  canvasState: { frames: any[]; orphans: any[]; arrows: any[] };
  onSuggestionsVisibilityChange?: (visible: boolean) => void;
  onInputChange?: (hasText: boolean) => void;
  responseToast?: string | null;
  onDismissToast?: () => void;
  onOpenChat?: () => void;
  voiceState: "idle" | "connecting" | "listening" | "speaking" | "error";
}

export function ChatInput({
  onSubmit,
  onFocusChange,
  onVoiceStart,
  isLoading,
  hasMessages,
  hasPendingQuestion,
  canvasState,
  onSuggestionsVisibilityChange,
  onInputChange,
  responseToast,
  onDismissToast,
  onOpenChat,
  voiceState,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const showSuggestions =
    isFocused &&
    !isLoading &&
    voiceState === "idle" &&
    value.trim().length > 0 &&
    !hasPendingQuestion;

  // Notify parent of suggestions visibility
  useEffect(() => {
    onSuggestionsVisibilityChange?.(showSuggestions);
  }, [showSuggestions, onSuggestionsVisibilityChange]);

  // Notify parent of input text
  useEffect(() => {
    onInputChange?.(value.trim().length > 0);
  }, [value, onInputChange]);

  // Reset suggestion index on value change
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [value]);

  // Refocus after AI finishes
  useEffect(() => {
    if (!isLoading && isFocused) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading]);

  const handleSuggestionSelect = useCallback(
    (text: string) => {
      onSubmit(text);
      setValue("");
      setSelectedSuggestionIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [onSubmit]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (selectedSuggestionIndex >= 0 && showSuggestions) return;
    if (!value.trim()) return;
    onSubmit(value);
    setValue("");
    setSelectedSuggestionIndex(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => Math.max(-1, prev - 1));
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => prev + 1);
        return;
      }
      if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        const btn = document.querySelector(
          `[data-suggestion-index="${selectedSuggestionIndex}"]`
        ) as HTMLElement;
        if (btn) {
          const text = btn.getAttribute("data-suggestion-text");
          if (text) handleSuggestionSelect(text);
        }
        return;
      }
    }
  };

  return (
    <div className="relative">
      {/* Prompt suggestions above */}
      {showSuggestions && (
        <PromptSuggestions
          canvasState={canvasState}
          inputValue={value}
          isVisible={showSuggestions}
          onSelect={handleSuggestionSelect}
          selectedIndex={selectedSuggestionIndex}
        />
      )}

      {/* Response toast above */}
      {responseToast && !isLoading && (
        <div className="absolute bottom-full mb-4" style={{ right: -8, width: "calc(100% + 16px)" }}>
          <div className="w-full bg-white shadow-lg border border-gray-200 overflow-hidden flex flex-col max-h-[300px] relative" style={{ borderRadius: 24 }}>
            {/* spacer for removed icon */}
            {/* Sticky close button */}
            <div className="absolute top-4 right-4 z-10 bg-white">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissToast?.();
                }}
                className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded cursor-pointer"
                title="Dismiss"
              >
                <IconCross css={{ width: 14, height: 14 }} />
              </div>
            </div>
            {/* Scrollable content */}
            <div
              onClick={() => {
                onOpenChat?.();
                onDismissToast?.();
              }}
              className="overflow-y-auto p-4 pr-10 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="text-sm text-gray-700">
                <Markdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic">{children}</em>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-4 mb-2">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-4 mb-2">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="mb-0.5">{children}</li>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-base font-semibold mt-3 mb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base font-semibold mt-3 mb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold mt-3 mb-2">
                        {children}
                      </h3>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 px-1 rounded text-xs">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {responseToast}
                </Markdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input pill */}
      <form onSubmit={handleSubmit}>
        <div className="flex w-full items-center gap-1.5 rounded-[18px] h-[44px] border-none bg-[#f1f2f5] pl-4 pr-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (responseToast) onDismissToast?.();
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              onFocusChange(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              onFocusChange(false);
            }}
            placeholder={
              isLoading || hasMessages
                ? "Reply..."
                : "What shall we do next?"
            }
            disabled={isLoading}
            className="flex-1 bg-transparent text-[15px] text-[#222428] outline-none placeholder:text-[#656b81] disabled:opacity-50 min-w-0"
          />

          {value.trim() ? (
            <button
              type="submit"
              className="w-[28px] h-[28px] shrink-0 text-[#222428] hover:text-[#222428]/70 rounded-lg flex items-center justify-center transition-colors"
            >
              <IconArrowUp size="small" />
            </button>
          ) : (
            <VoiceHoverButton onClick={onVoiceStart} />
          )}
        </div>
      </form>
    </div>
  );
}
