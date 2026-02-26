"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toolCategories, type OverflowItem, type ToolCategory } from "./toolbar-data";
import { ToolTile } from "./ToolTile";
import { ToolCategory as ToolCategoryComponent } from "./ToolCategory";
import { CONTAINER_RADIUS } from "./toolbar-constants";
import { spring, duration, easing, delay as motionDelay } from "@/lib/motion";

const MENU_WIDTH = 320;

const menuVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: spring.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 8,
    transition: {
      duration: duration.fast,
      ease: easing.accelerate,
    },
  },
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: motionDelay.stagger,
      delayChildren: 0.05,
    },
  },
};

const searchResultVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: spring.snappy,
  },
};

interface PlusMenuProps {
  open: boolean;
  onClose: () => void;
  onSelectItem: (item: OverflowItem) => void;
}

export function PlusMenu({ open, onClose, onSelectItem }: PlusMenuProps) {
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Search across tool name, description, and category label
  const searchResults = useMemo(() => {
    const query = filter.toLowerCase().trim();
    if (!query) return null;

    const results: OverflowItem[] = [];
    for (const category of toolCategories) {
      const categoryMatches = category.label.toLowerCase().includes(query);
      for (const tool of category.tools) {
        if (
          categoryMatches ||
          tool.label.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query)
        ) {
          results.push(tool);
        }
      }
    }
    return results;
  }, [filter]);

  const isSearchActive = searchResults !== null;

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

  const handleSelect = (tool: OverflowItem) => {
    onSelectItem(tool);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute bottom-full mb-5 bg-white"
          style={{
            right: -12,
            width: MENU_WIDTH,
            borderRadius: CONTAINER_RADIUS,
            boxShadow:
              "0 6px 16px rgba(34,36,40,0.12), 0 0px 8px rgba(34,36,40,0.06)",
          }}
        >
          <div
            className="max-h-[400px] overflow-y-auto overflow-x-hidden"
            style={{ borderRadius: CONTAINER_RADIUS }}
          >
            {/* Search input — sticky */}
            <div
              className="sticky top-0 z-10 bg-white p-2"
              style={{
                borderRadius: `${CONTAINER_RADIUS}px ${CONTAINER_RADIUS}px 0 0`,
              }}
            >
              <div className="flex items-center rounded-full bg-gray-100 px-3 h-[36px]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="shrink-0 text-gray-400 mr-2"
                >
                  <path
                    d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM10.7 11.4a5.5 5.5 0 1 1 .7-.7l3.65 3.65a.5.5 0 0 1-.7.7L10.7 11.4Z"
                    fill="currentColor"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search tools..."
                  className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
                {filter && (
                  <button
                    onClick={() => {
                      setFilter("");
                      inputRef.current?.focus();
                    }}
                    className="shrink-0 ml-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    aria-label="Clear search"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="pb-2">
              {isSearchActive ? (
                // Flat search results
                searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    No tools found
                    <div className="mt-1 text-xs">
                      Try searching for &ldquo;text&rdquo;, &ldquo;table&rdquo;, or &ldquo;card&rdquo;
                    </div>
                  </div>
                ) : (
                  <motion.div
                    key="search-grid"
                    className="grid grid-cols-4 gap-1 px-1"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: {
                        transition: {
                          staggerChildren: motionDelay.stagger,
                          delayChildren: 0.05,
                        },
                      },
                    }}
                  >
                    {searchResults.map((tool) => (
                      <motion.div key={tool.id} variants={searchResultVariants}>
                        <ToolTile tool={tool} onSelect={handleSelect} />
                      </motion.div>
                    ))}
                  </motion.div>
                )
              ) : (
                // Categorized grid
                <motion.div
                  key="category-grid"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {toolCategories.map((category) => (
                    <motion.div key={category.id} variants={searchResultVariants}>
                      <ToolCategoryComponent
                        category={category}
                        onSelect={handleSelect}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
