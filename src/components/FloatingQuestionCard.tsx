"use client";

import { useState, useEffect } from "react";
import {
  IconCross,
  IconArrowRight,
  IconSquarePencil,
} from "@mirohq/design-system-icons";

export function FloatingQuestionCard({
  question,
  options,
  onSelect,
  onSkip,
}: {
  question: string;
  options: string[];
  onSelect: (answer: string) => void;
  onSkip: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Reset state when question changes (e.g. advancing to next question)
  useEffect(() => {
    setSelectedIndex(0);
    setCustomInput("");
    setShowCustomInput(false);
  }, [question]);

  // Filter out "something else" from options since we have built-in custom input
  const filteredOptions = options.filter(opt => !opt.toLowerCase().includes('something else'));

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in input
      if (showCustomInput) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(filteredOptions.length, prev + 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex === filteredOptions.length) {
          setShowCustomInput(true);
        } else {
          onSelect(filteredOptions[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, filteredOptions, onSelect, onSkip, showCustomInput]);

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      onSelect(customInput.trim());
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white text-gray-900 shadow-elevated overflow-hidden border border-gray-200" style={{ borderRadius: 24 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-base font-medium flex-1 pr-4">{question}</p>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <IconCross css={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Options or Custom Input */}
        {showCustomInput ? (
          <div className="px-4 pb-4">
            <input
              autoFocus
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customInput.trim()) {
                  e.preventDefault();
                  handleCustomSubmit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setShowCustomInput(false);
                  setCustomInput("");
                }
              }}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 bg-gray-100 text-gray-900 placeholder-gray-400 outline-none border border-gray-200 focus:border-gray-300"
              style={{ borderRadius: 24 }}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomInput("");
                }}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCustomSubmit}
                disabled={!customInput.trim()}
                className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-3 py-2 space-y-1">
              {filteredOptions.map((option, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(option)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors animate-slideInFromLeft ${
                    selectedIndex === i ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 text-sm font-medium text-gray-600">
                    {i + 1}
                  </span>
                  <span className="text-left flex-1">{option}</span>
                  {selectedIndex === i && (
                    <IconArrowRight css={{ width: 18, height: 18, color: '#9ca3af' }} />
                  )}
                </button>
              ))}

              {/* Something else + Skip row */}
              <div className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                selectedIndex === filteredOptions.length ? "bg-gray-100" : ""
              }`}>
                <button
                  onClick={() => setShowCustomInput(true)}
                  onMouseEnter={() => setSelectedIndex(filteredOptions.length)}
                  className="flex items-center gap-3 flex-1"
                >
                  <span className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 text-gray-500">
                    <IconSquarePencil css={{ width: 14, height: 14 }} />
                  </span>
                  <span className="text-gray-400">Something else</span>
                </button>
                <button
                  onClick={onSkip}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-500 transition-colors flex-shrink-0"
                >
                  Skip
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Keyboard hints — below the card */}
      <div className="py-2 text-xs text-gray-400 text-center">
        ↑↓ to navigate · Enter to select · Esc to skip
      </div>
    </div>
  );
}
