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
}

export function PromptBar({
  onSubmit,
  isLoading = false,
  placeholder = "Create or ask anything",
  className = "",
  autoFocus = false,
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
    <form onSubmit={handleSubmit} className={`w-full max-w-xl ${className}`}>
      <div
        className="flex items-center bg-white rounded-full border border-gray-200 shadow-card"
      >
        {/* Plus button */}
        <button
          type="button"
          className="p-3 text-black hover:text-black transition-colors duration-200 flex-shrink-0"
          title="Add"
        >
          <IconPlus size="medium" />
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 py-3 text-base bg-transparent border-0 outline-none placeholder:text-gray-400 disabled:opacity-50 min-w-0"
        />

        {/* Mic button */}
        <button
          type="button"
          className="p-3 text-black hover:text-black transition-colors duration-200 flex-shrink-0"
          title="Voice input"
        >
          <IconMicrophone size="medium" />
        </button>

        {/* Submit / Voice wave button */}
        {inputValue.trim() ? (
          <button
            type="submit"
            className="w-10 h-10 min-w-[40px] m-1 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0 transition-colors"
            title="Send"
          >
            <IconArrowUp size="medium" />
          </button>
        ) : (
          <button
            type="button"
            className="w-10 h-10 min-w-[40px] m-1 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 flex-shrink-0 transition-colors"
            title="Voice mode"
          >
            <VoiceWaveIcon />
          </button>
        )}
      </div>
    </form>
  );
}
