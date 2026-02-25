"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconMagnifyingGlass, IconCross } from "@mirohq/design-system-icons";
import miroPacks from "@/data/miroPacks.json";

type Sticker = {
  id: string;
  image: {
    url: string;
    dimensions: { width: string | number; height: string | number };
  };
  keywords: string[];
};

export interface StickerDropData {
  url: string;
  width: number;
  height: number;
  id: string;
}

interface StickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceSticker: (sticker: StickerDropData, screenPos?: { x: number; y: number }) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const popoverVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: [0.2, 0, 0, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.97,
    transition: { duration: 0.1, ease: [0.3, 0, 1, 1] as [number, number, number, number] },
  },
};

export function StickerPicker({
  isOpen,
  onClose,
  onPlaceSticker,
  triggerRef,
}: StickerPickerProps) {
  const [search, setSearch] = useState("");
  const [activePack, setActivePack] = useState("all");
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Drag state
  const dragStickerRef = useRef<StickerDropData | null>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  // Focus search when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 100);
    } else {
      setSearch("");
      setActivePack("all");
    }
  }, [isOpen]);

  // Click outside to close (but not during drag)
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (isDraggingRef.current) return;
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose, triggerRef]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Filter stickers
  const filteredStickers = useMemo(() => {
    const query = search.toLowerCase().trim();
    let stickers: (Sticker & { packName: string })[] = [];

    for (const pack of miroPacks) {
      if (activePack !== "all" && pack.id !== activePack) continue;
      for (const s of pack.stickers) {
        stickers.push({ ...s, packName: pack.name });
      }
    }

    if (query) {
      stickers = stickers.filter((s) =>
        s.keywords.some((k) => k.toLowerCase().includes(query))
      );
    }

    return stickers;
  }, [search, activePack]);

  const toDropData = useCallback((sticker: Sticker): StickerDropData => {
    const w = typeof sticker.image.dimensions.width === "number"
      ? sticker.image.dimensions.width
      : parseInt(sticker.image.dimensions.width, 10);
    const h = typeof sticker.image.dimensions.height === "number"
      ? sticker.image.dimensions.height
      : parseInt(sticker.image.dimensions.height, 10);
    return { url: sticker.image.url, width: w, height: h, id: sticker.id };
  }, []);

  // --- Drag-to-place logic ---
  const createGhost = useCallback((url: string, x: number, y: number) => {
    const ghost = document.createElement("div");
    ghost.style.cssText = `
      position: fixed; pointer-events: none; z-index: 10000;
      width: 80px; height: 80px;
      transform: translate(-50%, -50%);
      left: ${x}px; top: ${y}px;
      opacity: 0.9; transition: opacity 0.1s;
    `;
    const img = document.createElement("img");
    img.src = url;
    img.style.cssText = "width: 100%; height: 100%; object-fit: contain;";
    ghost.appendChild(img);
    document.body.appendChild(ghost);
    return ghost;
  }, []);

  const cleanupDrag = useCallback(() => {
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }
    dragStickerRef.current = null;
    dragStartRef.current = null;
    isDraggingRef.current = false;
  }, []);

  const handleStickerMouseDown = useCallback((e: React.MouseEvent, sticker: Sticker) => {
    // Only left button
    if (e.button !== 0) return;
    e.preventDefault();

    const data = toDropData(sticker);
    dragStickerRef.current = data;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;

    const onMove = (me: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;

      // Start dragging after 4px threshold
      if (!isDraggingRef.current) {
        const dist = Math.hypot(me.clientX - start.x, me.clientY - start.y);
        if (dist < 4) return;
        isDraggingRef.current = true;
        dragGhostRef.current = createGhost(data.url, me.clientX, me.clientY);
      }

      // Move ghost
      if (dragGhostRef.current) {
        dragGhostRef.current.style.left = `${me.clientX}px`;
        dragGhostRef.current.style.top = `${me.clientY}px`;
      }
    };

    const onUp = (ue: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);

      if (isDraggingRef.current && dragStickerRef.current) {
        // Dropped after dragging — place at drop position
        onPlaceSticker(dragStickerRef.current, { x: ue.clientX, y: ue.clientY });
        onClose();
      } else if (dragStickerRef.current) {
        // Just a click (no drag) — also place, using drop at click position
        onPlaceSticker(dragStickerRef.current, { x: ue.clientX, y: ue.clientY });
        onClose();
      }

      cleanupDrag();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [toDropData, createGhost, cleanupDrag, onPlaceSticker, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupDrag();
  }, [cleanupDrag]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          variants={popoverVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute bottom-full mb-3 left-0 w-[320px] bg-white border border-gray-200 overflow-hidden flex flex-col shadow-elevated"
          style={{
            maxHeight: 400,
            borderRadius: 32,
          }}
        >
          {/* Search bar */}
          <div className="px-3 pt-2.5 pb-1.5 shrink-0">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
              <IconMagnifyingGlass
                css={{ width: 16, height: 16, flexShrink: 0, color: "var(--color-gray-400)" }}
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stickers..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IconCross css={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>
          </div>

          {/* Pack tabs */}
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
            <PackTab
              label="All"
              active={activePack === "all"}
              onClick={() => setActivePack("all")}
            />
            {miroPacks.map((pack) => (
              <PackTab
                key={pack.id}
                label={pack.name}
                active={activePack === pack.id}
                onClick={() => setActivePack(pack.id)}
              />
            ))}
          </div>

          {/* Sticker grid */}
          <div className="flex-1 overflow-y-auto px-2.5 pb-2.5 pt-1">
            {filteredStickers.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-8">
                No stickers found
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-1">
                {filteredStickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    onMouseDown={(e) => handleStickerMouseDown(e, sticker)}
                    className="aspect-square rounded-lg hover:bg-gray-100 transition-colors p-1 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                    title={sticker.keywords.slice(0, 3).join(", ")}
                  >
                    <img
                      src={sticker.image.url}
                      alt={sticker.keywords[0] || "sticker"}
                      loading="lazy"
                      draggable={false}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PackTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-[13px] rounded-full whitespace-nowrap transition-all ${
        active
          ? "bg-gray-900 text-white font-medium"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}
