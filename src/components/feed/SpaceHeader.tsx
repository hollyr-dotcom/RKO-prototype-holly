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

/** Avatar overrides for 1:1 spaces */
const SPACE_AVATARS: Record<string, string> = {
  "space-1on1-james": "/avatars/james-rodriguez.png",
  "space-1on1-amara": "/avatars/amara-okafor.png",
  "space-1on1-daniel": "/avatars/daniel-park.png",
};

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

  const avatar = SPACE_AVATARS[space.id];

  return (
    <div
      className="flex flex-col justify-end"
      style={{ minHeight: 380, paddingBottom: 48 }}
    >
      {/* Content row: title+description on left, button on right */}
      <div className="flex items-end justify-between gap-8">
        {/* Emoji + Title + description */}
        <div className="flex flex-col min-w-0" style={{ gap: 10 }}>
          {/* Emoji or avatar */}
          <div
            className="flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              boxShadow:
                "0 0 12px rgba(34,36,40,0.04), 0 2px 8px rgba(34,36,40,0.12)",
              ...(!avatar && { backgroundColor: "white" }),
            }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <BoardEmoji emoji={space.emoji} size={38} />
            )}
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Untitled Space"
            className="bg-transparent border-none outline-none p-0 font-semibold leading-[1.2] w-full"
            style={{ fontSize: 52, letterSpacing: "-2px", color: "var(--space-accent)" }}
          />
          <input
            type="text"
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Add a description..."
            className="bg-transparent border-none outline-none p-0 w-full"
            style={{
              fontSize: 18,
              lineHeight: 1.5,
              color: description ? "var(--space-accent)" : undefined,
            }}
          />
        </div>

        {/* Create new button — dark pill */}
        <button
          className="flex-shrink-0 flex items-center gap-2.5 text-sm font-bold text-white rounded-full cursor-pointer hover:brightness-110 transition-all"
          style={{
            background: "var(--space-accent)",
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
              stroke="white"
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
