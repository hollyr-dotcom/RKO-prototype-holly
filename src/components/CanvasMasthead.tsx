"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/hooks/useSidebar";
import { useChat } from "@/hooks/useChat";
import { MastheadAvatars } from "./Avatars";
import { BoardEmoji } from "@/components/BoardEmoji";
import { generateAndSetEmoji } from "@/lib/canvasUtils";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { IconButton } from "@mirohq/design-system";
import {
  IconDotsThreeVertical,
  IconSidebarGlobalClosed,
  IconSidebarGlobalOpen,
  IconOffice,
  IconTrash,
} from "@mirohq/design-system-icons";

// ─── CanvasMasthead ────────────────────────────────────────────

type CanvasData = {
  id: string;
  spaceId: string;
  name: string;
  emoji?: string;
};

export function CanvasMasthead() {
  const params = useParams<{ spaceId: string; canvasId: string }>();
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { chatMode, setChatMode } = useChat();

  // ── Actions menu (three-dot overflow) ──
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const handleMenuClickOutside = useCallback((e: MouseEvent) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(e.target as Node) &&
      menuTriggerRef.current &&
      !menuTriggerRef.current.contains(e.target as Node)
    ) {
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener("mousedown", handleMenuClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleMenuClickOutside);
  }, [menuOpen, handleMenuClickOutside]);

  const handleDeleteBoard = useCallback(async () => {
    setMenuOpen(false);
    try {
      const res = await fetch(`/api/canvases/${params.canvasId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete board");

      window.dispatchEvent(
        new CustomEvent("canvas-updated", { detail: { canvasId: params.canvasId, deleted: true } })
      );

      router.push(`/space/${params.spaceId}`);
    } catch (err) {
      console.error("Failed to delete board:", err);
    }
  }, [params.canvasId, params.spaceId, router]);

  // ── Canvas data from API (replaces static JSON import) ──
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [canvasName, setCanvasName] = useState("Untitled");
  const [emoji, setEmoji] = useState("📋");
  const [isGeneratingEmoji, setIsGeneratingEmoji] = useState(false);

  // Fetch canvas data on mount and when canvasId changes
  const fetchCanvasData = useCallback(async () => {
    if (!params.canvasId) return;
    try {
      const res = await fetch(`/api/canvases/${params.canvasId}`);
      if (!res.ok) return;
      const data: CanvasData = await res.json();
      setCanvasData(data);
      setCanvasName(data.name || "Untitled");
      setEmoji(data.emoji || "📋");
    } catch {
      // Silently fail — keep existing state
    }
  }, [params.canvasId]);

  useEffect(() => {
    fetchCanvasData();
  }, [fetchCanvasData]);

  // Listen for canvas-updated events from SecondaryPanel / NavList
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.canvasId === params.canvasId) {
        fetchCanvasData();
      }
    };
    window.addEventListener("canvas-updated", handler);
    return () => window.removeEventListener("canvas-updated", handler);
  }, [params.canvasId, fetchCanvasData]);

  // ── Inline title editing (single click) ──
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameEditValue, setNameEditValue] = useState(canvasName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync edit value when canvasName changes externally
  useEffect(() => {
    if (!isEditingName) {
      setNameEditValue(canvasName);
    }
  }, [canvasName, isEditingName]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleSaveName = useCallback(async () => {
    const trimmed = nameEditValue.trim();
    if (!trimmed || trimmed === canvasName) {
      setNameEditValue(canvasName);
      setIsEditingName(false);
      return;
    }

    // Optimistic update
    setCanvasName(trimmed);
    setIsEditingName(false);

    try {
      await fetch(`/api/canvases/${params.canvasId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      // Notify other components immediately with new name
      window.dispatchEvent(
        new CustomEvent("canvas-updated", { detail: { canvasId: params.canvasId, name: trimmed } })
      );

      // Auto-generate emoji from new title
      setIsGeneratingEmoji(true);
      const imageUrl = await generateAndSetEmoji(params.canvasId, trimmed);
      if (imageUrl) {
        setEmoji(imageUrl);
        // Notify with updated emoji
        window.dispatchEvent(
          new CustomEvent("canvas-updated", { detail: { canvasId: params.canvasId, emoji: imageUrl } })
        );
      }
      setIsGeneratingEmoji(false);
    } catch (err) {
      console.error("Failed to rename canvas:", err);
      setIsGeneratingEmoji(false);
    }
  }, [nameEditValue, canvasName, params.canvasId]);

  const handleCancelName = useCallback(() => {
    setNameEditValue(canvasName);
    setIsEditingName(false);
  }, [canvasName]);

  // ── Emoji picker ──
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

      // Notify other components with updated emoji
      window.dispatchEvent(
        new CustomEvent("canvas-updated", { detail: { canvasId: params.canvasId, emoji: emojiData.native } })
      );
    } catch (err) {
      console.error("Failed to persist emoji:", err);
    }
  };

  const barShadow = "0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)";
  const isChatMinimized = chatMode === "minimized";

  return (
    <div className={`absolute top-3 left-3 z-[500] flex items-center justify-between pointer-events-none right-3`} onWheel={(e) => e.stopPropagation()}>
      {/* ── Left bar: Board identity ── */}
      <div
        className="h-12 bg-white border border-gray-200 flex items-center pointer-events-auto p-1.5"
        style={{ borderRadius: 16, boxShadow: barShadow }}
      >
        <div className="flex items-center gap-2 px-2 min-w-0">
          <IconButton
            variant="ghost"
            size="medium"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onPress={() => toggleSidebar()}
          >
            {isCollapsed ? <IconSidebarGlobalClosed /> : <IconSidebarGlobalOpen />}
          </IconButton>

          <div className="relative flex items-center gap-1.5 min-w-0">
            <button
              ref={emojiButtonRef}
              onClick={() => setPickerOpen(!pickerOpen)}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              title="Change icon"
            >
              <BoardEmoji emoji={emoji} size={20} loading={isGeneratingEmoji} />
            </button>

            {/* Board title — single click to edit */}
            {isEditingName ? (
              <input
                ref={nameInputRef}
                value={nameEditValue}
                onChange={(e) => setNameEditValue(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveName();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    handleCancelName();
                  }
                }}
                className="text-[14px] font-medium text-gray-900 max-w-[260px] bg-transparent outline-none border-none p-0 m-0"
                style={{ width: `${Math.max(nameEditValue.length, 1)}ch` }}
              />
            ) : (
              <span
                className="text-[14px] font-medium text-gray-900 truncate max-w-[260px] cursor-text"
                onClick={() => setIsEditingName(true)}
              >
                {canvasName}
              </span>
            )}

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

          <div className="relative">
            <IconButton
              ref={menuTriggerRef}
              variant="ghost"
              size="medium"
              aria-label="More options"
              onPress={() => setMenuOpen((prev) => !prev)}
            >
              <IconDotsThreeVertical />
            </IconButton>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  ref={menuRef}
                  className="absolute top-full right-0 mt-2 z-[600] min-w-[180px] rounded-lg overflow-hidden bg-white border border-gray-200"
                  style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)" }}
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: [0.2, 0, 0, 1] } }}
                  exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1, ease: [0.3, 0, 1, 1] } }}
                >
                  <div className="py-1">
                    <button
                      onClick={handleDeleteBoard}
                      className="w-full flex items-center gap-2 text-left cursor-pointer border-none bg-transparent"
                      style={{ padding: "7px 12px", fontSize: 13, color: "#dc2626" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <IconTrash css={{ width: 14, height: 14, flexShrink: 0 }} />
                      Delete board
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Right bar: Actions & presence ── */}
      <div
        className="h-12 bg-white border border-gray-200 flex items-center pointer-events-auto p-1.5"
        style={{ borderRadius: 16, boxShadow: barShadow }}
      >
        <div className="flex items-center gap-2 pl-1.5 pr-0">
          {/* More options */}
          <IconButton variant="ghost" size="medium" aria-label="More options">
            <IconDotsThreeVertical />
          </IconButton>

          {/* Avatars */}
          <MastheadAvatars />

          {/* Share button — opens chat sidepanel */}
          <button
            onClick={() => setChatMode(chatMode === "sidepanel" ? "minimized" : "sidepanel")}
            className="h-8 px-4 flex items-center gap-1.5 bg-[#4262ff] hover:bg-[#3b58e0] text-white text-sm font-medium transition-colors cursor-pointer border-none"
            style={{ borderRadius: 8, marginRight: 1 }}
          >
            <IconOffice css={{ width: 16, height: 16 }} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
