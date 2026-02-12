"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/hooks/useSidebar";
import { MastheadAvatars } from "./Avatars";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import canvases from "@/data/canvases.json";
import spaces from "@/data/spaces.json";
import { Button, IconButton } from "@mirohq/design-system";
import {
  IconDotsThreeVertical,
  IconTimer,
  IconVideoCamera,
  IconPlay,
  IconLinesThreeHorizontal,
} from "@mirohq/design-system-icons";

// ─── CanvasMasthead ────────────────────────────────────────────

export function CanvasMasthead() {
  const params = useParams<{ spaceId: string; canvasId: string }>();
  const { isCollapsed, toggleSidebar } = useSidebar();

  // Look up canvas and space names from static data
  const canvas = canvases.find((c) => c.id === params.canvasId);
  const space = spaces.find((s) => s.id === params.spaceId);
  const canvasName = canvas?.name || "Untitled";
  const spaceName = space?.name || "";

  // Emoji state
  const [emoji, setEmoji] = useState(canvas?.emoji || "📋");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  // Close picker on click outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      pickerRef.current &&
      !pickerRef.current.contains(e.target as Node) &&
      emojiButtonRef.current &&
      !emojiButtonRef.current.contains(e.target as Node)
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

  // Handle emoji selection
  const handleEmojiSelect = async (emojiData: { native: string }) => {
    setEmoji(emojiData.native);
    setPickerOpen(false);

    // Persist to server
    try {
      await fetch(`/api/canvases/${params.canvasId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji: emojiData.native }),
      });
    } catch (err) {
      console.error("Failed to persist emoji:", err);
    }
  };

  const barShadow = "0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)";

  return (
    <div className="absolute top-3 left-3 right-3 z-[500] flex items-center justify-between pointer-events-none">
      {/* ── Left bar: Board identity ── */}
      <div
        className="h-12 bg-white rounded-full border border-gray-200 flex items-center pointer-events-auto p-1.5"
        style={{ boxShadow: barShadow }}
      >
        <div className="flex items-center gap-2 px-2 min-w-0">
          <IconButton
            variant="ghost"
            size="medium"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onPress={() => toggleSidebar()}
          >
            <IconLinesThreeHorizontal />
          </IconButton>

          <div className="relative flex items-center gap-1.5 min-w-0">
            <button
              ref={emojiButtonRef}
              onClick={() => setPickerOpen(!pickerOpen)}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors cursor-pointer text-[20px] leading-none shrink-0"
              title="Change icon"
            >
              {emoji}
            </button>
            <span className="text-[14px] font-medium text-gray-900 truncate max-w-[260px]">
              {canvasName}
            </span>

            {/* Emoji picker popover */}
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

          {/* {spaceName && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500 whitespace-nowrap border border-gray-200/60">
              {spaceName}
            </span>
          )} */}

          <IconButton variant="ghost" size="medium" aria-label="More options">
            <IconDotsThreeVertical />
          </IconButton>
        </div>
      </div>

      {/* ── Right bar: Actions & presence ── */}
      <div
        className="h-12 bg-white rounded-full border border-gray-200 flex items-center pointer-events-auto p-1.5"
        style={{ boxShadow: barShadow }}
      >
        <div className="flex items-center gap-1 px-2">
          {/* Action icons */}
          <div className="flex items-center gap-0.5 mr-1">
            <IconButton variant="ghost" size="medium" aria-label="Timer">
              <IconTimer />
            </IconButton>
            <IconButton variant="ghost" size="medium" aria-label="Video chat">
              <IconVideoCamera />
            </IconButton>
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Avatars + count */}
          <MastheadAvatars />

          {/* Separator */}
          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Present button */}
          <Button variant="ghost" size="medium">
            <Button.IconSlot>
              <IconPlay />
            </Button.IconSlot>
            <Button.Label>Present</Button.Label>
          </Button>

          {/* Share button */}
          <Button variant="primary" size="medium" rounded>
            <Button.Label>Share</Button.Label>
          </Button>
        </div>
      </div>
    </div>
  );
}
