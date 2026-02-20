"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { BoardEmoji } from "@/components/BoardEmoji";

interface SpaceHeaderProps {
  space: {
    id: string;
    name: string;
    description?: string;
    emoji?: string;
  };
  onNameChange?: (name: string) => void;
  onDescriptionChange?: (description: string) => void;
}

/** Derive a stable hue (0–359) from a string by summing char codes. */
function hueFromId(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return sum % 360;
}

/**
 * Determine whether text on an HSL background should be dark or light.
 * Uses relative luminance approximation from the HSL lightness + saturation.
 * Returns true if the background is light enough to need dark text.
 */
function needsDarkText(hue: number, saturation: number, lightness: number): boolean {
  // Convert HSL to RGB to compute relative luminance
  const s = saturation / 100;
  const l = lightness / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  const r = f(0), g = f(8), b = f(4);
  // Relative luminance (sRGB)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5;
}

export function SpaceHeader({ space, onNameChange, onDescriptionChange }: SpaceHeaderProps) {
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description ?? "");
  const nameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when space prop changes (e.g. navigating between spaces)
  useEffect(() => {
    setName(space.name);
    setDescription(space.description ?? "");
  }, [space.id, space.name, space.description]);

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
      nameDebounceRef.current = setTimeout(() => {
        if (value.trim()) onNameChange?.(value.trim());
      }, 300);
    },
    [onNameChange]
  );

  const handleDescriptionChange = useCallback(
    (value: string) => {
      setDescription(value);
      if (descDebounceRef.current) clearTimeout(descDebounceRef.current);
      descDebounceRef.current = setTimeout(() => {
        onDescriptionChange?.(value);
      }, 300);
    },
    [onDescriptionChange]
  );

  const hue = hueFromId(space.id);
  const gradientStyle = {
    background: `linear-gradient(151deg, hsl(${hue}, 65%, 43%), hsl(${hue + 12}, 65%, 43%))`,
  };
  const buttonHue = hue + 6;
  const buttonBg = `hsl(${buttonHue}, 100%, 69%)`;
  const buttonFg = needsDarkText(buttonHue, 100, 69) ? "#222428" : "white";

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6 flex flex-col justify-end"
      style={{ ...gradientStyle, minHeight: 380, padding: "32px 48px 48px" }}
    >
      {/* Bottom row: title+description on left, button on right */}
      <div className="flex items-end justify-between gap-8">
        {/* Emoji + Title + description */}
        <div className="flex flex-col gap-2 min-w-0">
          {/* Emoji — 10px above title */}
          <div
            className="bg-white flex items-center justify-center flex-shrink-0 mb-1"
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              boxShadow:
                "0 0 12px rgba(34,36,40,0.04), 0 2px 8px rgba(34,36,40,0.12)",
            }}
          >
            <BoardEmoji emoji={space.emoji} size={38} />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Untitled Space"
            className="bg-transparent border-none outline-none p-0 text-white font-semibold leading-[1.2] placeholder:text-white/40 w-full"
            style={{ fontSize: 52, letterSpacing: "-2px" }}
          />
          <input
            type="text"
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Add a description..."
            className={`bg-transparent border-none outline-none p-0 placeholder:text-white/40 w-full ${description ? "text-white/65" : "text-white/40"}`}
            style={{ fontSize: 18, lineHeight: 1.5 }}
          />
        </div>

        {/* Create new button */}
        <button
          className="flex-shrink-0 flex items-center gap-2.5 text-sm font-normal rounded-full cursor-pointer hover:brightness-110 transition-all"
          style={{
            background: buttonBg,
            color: buttonFg,
            padding: "12px 24px",
            boxShadow:
              "0 12px 32px rgba(34,36,40,0.2), 0 0 8px rgba(34,36,40,0.06)",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4V20M4 12H20"
              stroke={buttonFg}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Create new
        </button>
      </div>
    </div>
  );
}
