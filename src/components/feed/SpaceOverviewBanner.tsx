"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BoardEmoji } from "@/components/BoardEmoji";
import { IconDotsThreeVertical, IconTrash } from "@mirohq/design-system-icons";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface SpaceOverviewBannerProps {
  name: string;
  description?: string;
  emoji?: string;
  color?: string;
  contributors?: { name: string; color: string }[];
  onRandomizeColor?: () => void;
  onDeleteSpace?: () => void;
  onEmojiChange?: (emoji: string) => void;
  onDescriptionChange?: (description: string) => void;
}

// ---------------------------------------------------------------------------
// Hex → HSL conversion helpers (local to avoid touching nav-palette.ts)
// ---------------------------------------------------------------------------

function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hNorm = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (hNorm < 60) {
    r = c; g = x; b = 0;
  } else if (hNorm < 120) {
    r = x; g = c; b = 0;
  } else if (hNorm < 180) {
    r = 0; g = c; b = x;
  } else if (hNorm < 240) {
    r = 0; g = x; b = c;
  } else if (hNorm < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generateBannerGradient(color?: string): string {
  if (!color) {
    return "linear-gradient(142deg, #374151, #4B5563)";
  }

  const [h, s] = hexToHsl(color);

  const stop1 = hslToHex(h - 10, Math.max(s, 0.55), 0.38);
  const stop2 = hslToHex(h + 15, Math.max(s, 0.50), 0.42);

  return `linear-gradient(142deg, ${stop1}, ${stop2})`;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const bannerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
};

const contentStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const contentItem = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
};

// ---------------------------------------------------------------------------
// Contributor avatars
// ---------------------------------------------------------------------------

function ContributorAvatars({
  contributors,
}: {
  contributors: { name: string; color: string }[];
}) {
  const maxVisible = 5;
  const visible = contributors.slice(0, maxVisible);
  const overflow = contributors.length - maxVisible;

  return (
    <div className="flex items-center">
      {visible.map((user, index) => (
        <div
          key={user.name}
          className="relative group"
          style={{
            marginLeft: index === 0 ? 0 : -8,
            zIndex: index,
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          {/* Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {user.name}
          </div>
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 text-[10px] font-semibold bg-white/20 border-2 border-white"
          style={{ marginLeft: -8, zIndex: maxVisible }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overflow menu
// ---------------------------------------------------------------------------

function BannerOverflowMenu({
  onRandomizeColor,
  onDeleteSpace,
}: {
  onRandomizeColor?: () => void;
  onDeleteSpace?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(e.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(e.target as Node)
    ) {
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, handleClickOutside]);

  if (!onRandomizeColor && !onDeleteSpace) return null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
      >
        <IconDotsThreeVertical css={{ width: 18, height: 18, color: "white" }} />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={menuRef}
            className="absolute right-0 top-full mt-1 z-[600] min-w-[160px] rounded-lg overflow-hidden bg-white border border-gray-200 shadow-elevated"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: [0.2, 0, 0, 1] } }}
            exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1, ease: [0.3, 0, 1, 1] } }}
          >
            <div className="py-1">
              {onRandomizeColor && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRandomizeColor();
                  }}
                  className="w-full flex items-center gap-2 text-left cursor-pointer border-none bg-transparent"
                  style={{ padding: "7px 12px", fontSize: 13, color: "#374151" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #F5D550, #F08080, #E07BE0, #B0A0D8, #88A8E0)",
                    }}
                  />
                  Space color
                </button>
              )}
              {onDeleteSpace && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteSpace();
                  }}
                  className="w-full flex items-center gap-2 text-left cursor-pointer border-none bg-transparent"
                  style={{ padding: "7px 12px", fontSize: 13, color: "#dc2626" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <IconTrash css={{ width: 14, height: 14, flexShrink: 0 }} />
                  Delete space
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline emoji picker
// ---------------------------------------------------------------------------

function BannerEmojiPicker({
  emoji,
  onEmojiChange,
}: {
  emoji?: string;
  onEmojiChange?: (emoji: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      pickerRef.current &&
      !pickerRef.current.contains(e.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(e.target as Node)
    ) {
      setPickerOpen(false);
    }
  }, []);

  useEffect(() => {
    if (pickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen, handleClickOutside]);

  const handleEmojiSelect = (emojiData: { native: string }) => {
    setPickerOpen(false);
    onEmojiChange?.(emojiData.native);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setPickerOpen(!pickerOpen)}
        className="w-16 h-16 bg-white rounded-[20px] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-card"
        title="Change emoji"
      >
        {emoji ? (
          <BoardEmoji emoji={emoji} size={40} />
        ) : (
          <span className="text-[32px] opacity-40">+</span>
        )}
      </button>

      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            ref={pickerRef}
            className="absolute top-full left-0 mt-2 z-[600]"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="light"
              previewPosition="none"
              skinTonePosition="search"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline description editor
// ---------------------------------------------------------------------------

function BannerDescription({
  description,
  onDescriptionChange,
}: {
  description?: string;
  onDescriptionChange?: (description: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(description || "");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(description || "");
  }, [description]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed !== (description || "")) {
      onDescriptionChange?.(trimmed);
    }
    setIsEditing(false);
  }, [editValue, description, onDescriptionChange]);

  if (isEditing) {
    return (
      <textarea
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSave();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setEditValue(description || "");
            setIsEditing(false);
          }
        }}
        className="text-lg text-white/[0.62] leading-[1.5] bg-transparent outline-none border-none resize-none w-full max-w-[733px] placeholder-white/30"
        placeholder="Add a description..."
        rows={2}
        style={{ font: "inherit" }}
      />
    );
  }

  return (
    <p
      onClick={() => setIsEditing(true)}
      className="text-lg leading-[1.5] line-clamp-2 cursor-text max-w-[733px]"
      style={{ color: description ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.3)" }}
    >
      {description || "Add a description..."}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpaceOverviewBanner({
  name,
  description,
  emoji,
  color,
  contributors,
  onRandomizeColor,
  onDeleteSpace,
  onEmojiChange,
  onDescriptionChange,
}: SpaceOverviewBannerProps) {
  const gradient = generateBannerGradient(color);

  return (
    <motion.div
      variants={bannerVariants}
      initial="hidden"
      animate="visible"
      className="relative rounded-[16px] min-h-[260px] flex flex-col justify-end p-[60px]"
      style={{ background: gradient }}
    >
      {/* Top-right toolbar */}
      {(contributors?.length || onRandomizeColor || onDeleteSpace) && (
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {contributors && contributors.length > 0 && (
            <ContributorAvatars contributors={contributors} />
          )}
          <BannerOverflowMenu
            onRandomizeColor={onRandomizeColor}
            onDeleteSpace={onDeleteSpace}
          />
        </div>
      )}

      <motion.div
        variants={contentStagger}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-2.5"
      >
        <motion.div variants={contentItem}>
          <BannerEmojiPicker emoji={emoji} onEmojiChange={onEmojiChange} />
        </motion.div>

        <motion.h1
          variants={contentItem}
          className="text-4xl font-semibold text-whiteThe font-heading"
        >
          {name}
        </motion.h1>

        <motion.div variants={contentItem}>
          <BannerDescription
            description={description}
            onDescriptionChange={onDescriptionChange}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
