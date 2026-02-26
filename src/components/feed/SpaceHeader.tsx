"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { BoardEmoji } from "@/components/BoardEmoji";
import { SPACE_MEMBERS } from "@/data/space-members";
import { PageHeader } from "@/components/PageHeader";
import { SpaceColorSettings } from "./SpaceColorSettings";

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

interface SpaceHeaderBarProps {
  space: { id: string };
  hue?: number;
  chroma?: number;
  onHueChange?: (hue: number) => void;
  onChromaChange?: (chroma: number) => void;
}

/** Avatar overrides for 1:1 spaces */
const SPACE_AVATARS: Record<string, string> = {
  "space-1on1-james": "/avatars/james-rodriguez.png",
  "space-1on1-amara": "/avatars/amara-okafor.png",
  "space-1on1-daniel": "/avatars/daniel-park.png",
};

function MembersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.33366 4.66667C7.33366 3.8978 6.76919 3.33333 6.00033 3.33333C5.23146 3.33333 4.66699 3.8978 4.66699 4.66667C4.66699 5.43553 5.23146 6 6.00033 6C6.76919 6 7.33366 5.43553 7.33366 4.66667ZM8.66699 4.66667C8.66699 6.17191 7.50557 7.33333 6.00033 7.33333C4.49508 7.33333 3.33366 6.17191 3.33366 4.66667C3.33366 3.16142 4.49508 2 6.00033 2C7.50557 2 8.66699 3.16142 8.66699 4.66667Z" fill="currentColor"/>
      <path d="M6.00033 8C8.22824 8 10.0773 9.72176 10.236 11.944L10.3317 13.2858L9.00228 13.3809L8.90592 12.0391C8.79703 10.5145 7.52873 9.33333 6.00033 9.33333C4.47192 9.33333 3.20362 10.5145 3.09473 12.0391L2.99837 13.3809L1.66895 13.2858L1.76465 11.944C1.92339 9.72176 3.77241 8 6.00033 8Z" fill="currentColor"/>
      <path d="M12.0003 6.66667C12.0003 6.29848 11.7018 6 11.3337 6C10.9655 6 10.667 6.29848 10.667 6.66667C10.667 7.03486 10.9655 7.33333 11.3337 7.33333C11.7018 7.33333 12.0003 7.03486 12.0003 6.66667ZM13.3337 6.66667C13.3337 7.77124 12.4382 8.66667 11.3337 8.66667C10.2291 8.66667 9.33366 7.77124 9.33366 6.66667C9.33366 5.5621 10.2291 4.66667 11.3337 4.66667C12.4382 4.66667 13.3337 5.5621 13.3337 6.66667Z" fill="currentColor"/>
      <path d="M11.3337 9.33333C12.8115 9.33333 14.0492 10.4533 14.1963 11.9238L14.3304 13.2669L13.0036 13.3997L12.8695 12.0566C12.7906 11.2677 12.1265 10.6667 11.3337 10.6667V9.33333Z" fill="currentColor"/>
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M8.00228 1.33337C5.57825 1.33337 3.54861 3.17018 3.30741 5.58218L2.73229 11.3334H1.33301V12.6667H14.6689V11.3334H13.2723L12.6972 5.58217C12.456 3.17018 10.4263 1.33337 8.00228 1.33337ZM11.3704 5.71485L11.9323 11.3334H4.07227L4.63412 5.71485C4.80716 3.98445 6.26325 2.66671 8.00228 2.66671C9.7413 2.66671 11.1974 3.98445 11.3704 5.71485Z" fill="currentColor"/>
      <path d="M6.66634 13.3334H9.33301V14L8.66634 14.6667H7.33301L6.66634 14V13.3334Z" fill="currentColor"/>
    </svg>
  );
}

/** Edge-to-edge header bar with avatars, notification, and create button */
export function SpaceHeader({ space, hue, chroma, onHueChange, onChromaChange }: SpaceHeaderBarProps) {
  const members = SPACE_MEMBERS[space.id];
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <PageHeader
      actions={
        <div className="flex items-center gap-3">
          {/* Avatar stack */}
          {members && (
            <div className="flex items-center">
              {members.avatars.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="rounded-full object-cover"
                  style={{
                    width: 32,
                    height: 32,
                    marginLeft: i > 0 ? -10 : 0,
                    zIndex: members.avatars.length - i,
                    position: "relative",
                  }}
                />
              ))}
            </div>
          )}

          {/* Bell / settings icon */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen((prev) => !prev)}
              className="flex items-center justify-center rounded-full transition-colors hover:bg-black/[0.04]"
              style={{ width: 32, height: 32, color: "var(--color-gray-800)" }}
            >
              <NotificationIcon />
            </button>
            {settingsOpen && hue !== undefined && chroma !== undefined && onHueChange && onChromaChange && (
              <SpaceColorSettings
                hue={hue}
                chroma={chroma}
                onHueChange={onHueChange}
                onChromaChange={onChromaChange}
                onClose={() => setSettingsOpen(false)}
              />
            )}
          </div>

          {/* Create button */}
          <button
            className="flex items-center gap-1 text-md font-heading font-medium text-white rounded-full cursor-pointer hover:brightness-110 transition-all"
            style={{
              background: "var(--space-700)",
              padding: "8px 16px",
            }}
          >
            <svg
              width="16"
              height="16"
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
            Create
          </button>
        </div>
      }
    >
      {/* Empty children — header bar only carries actions */}
      <span />
    </PageHeader>
  );
}

/** Space icon + editable title + description — sits in the page body flow */
export function SpaceTitleBlock({ space, onNameChange, onDescriptionChange }: SpaceHeaderProps) {
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description ?? "");
  const nameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    <div className="flex flex-col" style={{ gap: 10 }}>
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
        className="bg-transparent border-none outline-none p-0 font-heading font-medium leading-[1.2] w-full"
        style={{ fontSize: 52, letterSpacing: "-2px", color: "var(--space-accent)" }}
      />
      <textarea
        value={description}
        onChange={(e) => handleDescriptionChange(e.target.value)}
        placeholder="Add a description..."
        rows={1}
        className="bg-transparent border-none outline-none p-0 w-full resize-none"
        style={{
          fontSize: 18,
          lineHeight: 1.5,
          color: description ? "var(--space-accent)" : undefined,
          fieldSizing: "content",
        } as React.CSSProperties}
      />
    </div>
  );
}
