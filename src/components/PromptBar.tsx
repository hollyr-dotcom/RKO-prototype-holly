"use client";

import { useState, useRef, useEffect } from "react";
import {
  IconPlus,
  IconMicrophone,
  IconArrowUp,
} from "@mirohq/design-system-icons";

// Voice wave icon (5 bars)
function VoiceWaveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="9" width="2.5" height="6" rx="1.25" />
      <rect x="6.5" y="5" width="2.5" height="14" rx="1.25" />
      <rect x="11" y="3" width="2.5" height="18" rx="1.25" />
      <rect x="15.5" y="5" width="2.5" height="14" rx="1.25" />
      <rect x="20" y="9" width="2.5" height="6" rx="1.25" />
    </svg>
  );
}

interface PromptBarProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  /** Background color for the inner input area (defaults to #efedfd) */
  inputBg?: string;
}

export function PromptBar({
  onSubmit,
  isLoading = false,
  placeholder = "Create or ask anything",
  className = "",
  autoFocus = false,
  inputBg = "#efedfd",
}: PromptBarProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSubmit(inputValue);
    setInputValue("");
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div
        className="flex items-center bg-white rounded-full"
        style={{
          padding: "8px 18px 8px 10px",
          boxShadow:
            "0px 6px 16px 0px rgba(34,36,40,0.12), 0px 0px 8px 0px rgba(34,36,40,0.06)",
        }}
      >
        {/* Inner input area with tinted background */}
        <div
          className="flex-1 flex items-center rounded-full min-w-0"
          style={{
            backgroundColor: inputBg,
            height: 56,
            paddingLeft: 24,
            paddingRight: 4,
            paddingTop: 4,
            paddingBottom: 4,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 text-base bg-transparent border-0 outline-none disabled:opacity-50 min-w-0"
            style={{ color: "rgba(34,36,40,0.8)" }}
          />

          {/* Mic button inside the input area */}
          <button
            type="button"
            className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full text-gray-700 hover:text-gray-900 transition-colors duration-200"
            title="Voice input"
          >
            <IconMicrophone size="medium" />
          </button>
        </div>

        {/* Submit / Voice wave button — outside the input area */}
        {inputValue.trim() ? (
          <button
            type="submit"
            className="w-10 h-10 min-w-[40px] ml-2 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0 transition-colors"
            title="Send"
          >
            <IconArrowUp size="medium" />
          </button>
        ) : (
          <button
            type="button"
            className="w-10 h-10 min-w-[40px] ml-2 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0 transition-colors"
            title="Voice mode"
          >
            <VoiceWaveIcon />
          </button>
        )}
      </div>
    </form>
  );
}
