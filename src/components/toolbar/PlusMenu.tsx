"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { overflowItems, primaryTools, type OverflowItem } from "./toolbar-data";
import { ICON_SIZE, CONTAINER_RADIUS, CELL_W, CONTAINER_PADDING } from "./toolbar-constants";

interface PlusMenuProps {
  open: boolean;
  onClose: () => void;
  onSelectItem: (item: OverflowItem) => void;
}

export function PlusMenu({ open, onClose, onSelectItem }: PlusMenuProps) {
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const query = filter.toLowerCase().trim();
    if (!query) return overflowItems;
    return overflowItems.filter((t) =>
      t.label.toLowerCase().includes(query)
    );
  }, [filter]);

  const customItems = filtered.filter((t) => t.group === "custom");
  const tldrawItems = filtered.filter((t) => t.group === "tldraw");

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setFilter("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const renderItem = (tool: OverflowItem) => {
    const Icon = tool.icon;
    return (
      <button
        key={tool.id}
        onClick={() => {
          onSelectItem(tool);
          onClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[#222428] transition-colors hover:bg-[#f1f2f5] rounded-lg mx-0"
      >
        <span
          className="flex items-center justify-center shrink-0"
          style={{ width: ICON_SIZE, height: ICON_SIZE }}
        >
          <Icon />
        </span>
        <span>{tool.label}</span>
      </button>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute bottom-full mb-5 bg-white"
          style={{
            right: -12,
            width: primaryTools.length * CELL_W + CONTAINER_PADDING + 12,
            borderRadius: CONTAINER_RADIUS,
            boxShadow:
              "0 6px 16px rgba(34,36,40,0.12), 0 0px 8px rgba(34,36,40,0.06)",
          }}
        >
          <div className="max-h-[380px] overflow-y-auto overflow-x-hidden" style={{ borderRadius: CONTAINER_RADIUS }}>
            {/* Filter input — sticky grey pill */}
            <div className="sticky top-0 z-10 bg-white p-2" style={{ borderRadius: `${CONTAINER_RADIUS}px ${CONTAINER_RADIUS}px 0 0` }}>
              <div className="flex items-center rounded-lg bg-[#f1f2f5] px-3 h-[36px]">
                <input
                  ref={inputRef}
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Find a tool..."
                  className="w-full bg-transparent text-sm text-[#222428] outline-none placeholder:text-[#656b81]"
                />
              </div>
            </div>

            {/* Tool list */}
            <div className="p-2 pt-0">
            {filtered.length === 0 ? (
              <div className="px-4 py-4 text-center text-sm text-[#656b81]">
                No tools found
              </div>
            ) : (
              <>
                {/* Custom shapes section */}
                {customItems.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 text-xs font-medium text-[#656b81] uppercase tracking-wide">
                      Custom shapes
                    </div>
                    {customItems.map(renderItem)}
                  </>
                )}

                {/* Separator */}
                {customItems.length > 0 && tldrawItems.length > 0 && (
                  <div className="my-1.5 border-t border-[#e9eaef]" />
                )}

                {/* tldraw tools section */}
                {tldrawItems.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 text-xs font-medium text-[#656b81] uppercase tracking-wide">
                      Canvas tools
                    </div>
                    {tldrawItems.map(renderItem)}
                  </>
                )}
              </>
            )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
