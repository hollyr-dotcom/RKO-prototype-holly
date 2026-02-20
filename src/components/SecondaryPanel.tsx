"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { IconPlus, IconViewSideLeft } from "@mirohq/design-system-icons";
import { useSidebar } from "@/hooks/useSidebar";
import { SECONDARY_WIDTH } from "@/providers/SidebarProvider";
import { NavList, NavListItem } from "@/components/NavList";
import { BoardEmoji } from "@/components/BoardEmoji";
import { generateAndSetEmoji } from "@/lib/canvasUtils";
import { BOARD_SECTIONS } from "@/data/board-sections";

type Canvas = {
  id: string;
  spaceId: string;
  name: string;
  emoji?: string;
};

type Space = {
  id: string;
  name: string;
  description: string;
  emoji?: string;
  color?: string;
};

// Fixed pages for a space — only Overview
const capabilities = [
  { id: "overview", label: "Overview" },
];

// Motion: stagger container + items (spring.snappy: stiffness 400, damping 30)
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
};

export function SecondaryPanel() {
  const pathname = usePathname();
  const params = useParams<{ spaceId: string; canvasId?: string }>();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  const [space, setSpace] = useState<Space | null>(null);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  // Derive which capability is active from the route.
  // On a canvas route, no capability is selected. On the space root, default to "overview".
  const isOnCanvas = pathname.includes("/canvas/");
  const [selectedCapability, setSelectedCapability] = useState<string | null>("overview");

  // Clear capability selection when navigating to a canvas, restore when back on space root
  useEffect(() => {
    if (isOnCanvas) {
      setSelectedCapability(null);
    } else {
      setSelectedCapability((prev) => prev ?? "overview");
    }
  }, [isOnCanvas]);

  // Fetch space data
  useEffect(() => {
    if (!params.spaceId) return;
    let cancelled = false;
    setLoading(true);

    fetch(`/api/spaces/${params.spaceId}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data) {
          setSpace(data);
          setCanvases(data.canvases || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.spaceId]);

  // ── Board rename state (used by NavList icons below) ──
  const [generatingEmojiForCanvas, setGeneratingEmojiForCanvas] = useState<string | null>(null);

  // Create a new board in the current space and navigate to it
  const handleCreateBoard = useCallback(async () => {
    if (!params.spaceId) return;
    try {
      const res = await fetch("/api/canvases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Board", spaceId: params.spaceId }),
      });
      if (!res.ok) throw new Error("Failed to create board");
      const newCanvas = await res.json();

      // Update local state so the sidebar reflects the new board immediately
      setCanvases((prev) => [...prev, newCanvas]);

      // Navigate to the new board
      router.push(`/space/${params.spaceId}/canvas/${newCanvas.id}`);
    } catch (err) {
      console.error("Failed to create board:", err);
    }
  }, [params.spaceId, router]);

  // Map canvases to NavListItems with emoji icons (using BoardEmoji for loading support)
  const canvasNavItems: NavListItem[] = canvases.map((canvas) => ({
    id: canvas.id,
    label: canvas.name,
    href: `/space/${params.spaceId}/canvas/${canvas.id}`,
    icon: (
      <BoardEmoji
        emoji={canvas.emoji}
        size={20}
        loading={generatingEmojiForCanvas === canvas.id}
      />
    ),
  }));

  // Persist reordered canvases
  const handleReorderCanvases = useCallback(
    async (orderedIds: string[]) => {
      // Optimistic: reorder local state
      const reordered = orderedIds
        .map((id) => canvases.find((c) => c.id === id))
        .filter(Boolean) as Canvas[];
      setCanvases(reordered);

      try {
        await fetch("/api/canvases/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spaceId: params.spaceId, orderedIds }),
        });
      } catch (err) {
        console.error("Failed to persist canvas order:", err);
      }
    },
    [canvases, params.spaceId]
  );

  // ── Board rename (double-click in NavList) ──
  const handleRenameCanvas = useCallback(
    async (canvasId: string, newName: string) => {
      // Optimistic update
      setCanvases((prev) =>
        prev.map((c) => (c.id === canvasId ? { ...c, name: newName } : c))
      );

      try {
        await fetch(`/api/canvases/${canvasId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        });

        // Auto-generate emoji
        setGeneratingEmojiForCanvas(canvasId);
        const imageUrl = await generateAndSetEmoji(canvasId, newName);
        if (imageUrl) {
          setCanvases((prev) =>
            prev.map((c) => (c.id === canvasId ? { ...c, emoji: imageUrl } : c))
          );
        }
        setGeneratingEmojiForCanvas(null);

        // Notify other components
        window.dispatchEvent(
          new CustomEvent("canvas-updated", { detail: { canvasId } })
        );
      } catch (err) {
        console.error("Failed to rename canvas:", err);
        setGeneratingEmojiForCanvas(null);
      }
    },
    []
  );

  // ── Delete a board ──
  const handleDeleteCanvas = useCallback(
    async (canvasId: string) => {
      try {
        const res = await fetch(`/api/canvases/${canvasId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete board");

        // Optimistic: remove from local state
        setCanvases((prev) => prev.filter((c) => c.id !== canvasId));

        // Notify other components
        window.dispatchEvent(
          new CustomEvent("canvas-updated", { detail: { canvasId, deleted: true } })
        );

        // If we're currently viewing the deleted board, navigate to space overview
        if (params.canvasId === canvasId) {
          router.push(`/space/${params.spaceId}`);
        }
      } catch (err) {
        console.error("Failed to delete board:", err);
      }
    },
    [params.canvasId, params.spaceId, router]
  );

  // ── Space title rename (single-click on header) ──
  const [isEditingSpaceName, setIsEditingSpaceName] = useState(false);
  const [spaceNameEditValue, setSpaceNameEditValue] = useState(space?.name || "");
  const spaceNameInputRef = useRef<HTMLInputElement>(null);

  // Sync edit value when space data loads
  useEffect(() => {
    if (!isEditingSpaceName && space) {
      setSpaceNameEditValue(space.name);
    }
  }, [space, isEditingSpaceName]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingSpaceName && spaceNameInputRef.current) {
      spaceNameInputRef.current.focus();
      spaceNameInputRef.current.select();
    }
  }, [isEditingSpaceName]);

  const handleSaveSpaceName = useCallback(async () => {
    const trimmed = spaceNameEditValue.trim();
    if (!trimmed || trimmed === space?.name) {
      setSpaceNameEditValue(space?.name || "");
      setIsEditingSpaceName(false);
      return;
    }

    // Optimistic update
    setSpace((prev) => (prev ? { ...prev, name: trimmed } : prev));
    setIsEditingSpaceName(false);

    try {
      await fetch(`/api/spaces/${params.spaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      // Notify other components
      window.dispatchEvent(
        new CustomEvent("space-updated", { detail: { spaceId: params.spaceId } })
      );
    } catch (err) {
      console.error("Failed to rename space:", err);
    }
  }, [spaceNameEditValue, space?.name, params.spaceId]);

  const handleCancelSpaceName = useCallback(() => {
    setSpaceNameEditValue(space?.name || "");
    setIsEditingSpaceName(false);
  }, [space?.name]);

  // Listen for canvas-updated events from masthead
  useEffect(() => {
    const handler = (e: Event) => {
      if (!params.spaceId) return;
      const detail = (e as CustomEvent).detail;

      // Optimistic local update from event detail
      if (detail?.canvasId) {
        if (detail.deleted) {
          setCanvases((prev) => prev.filter((c) => c.id !== detail.canvasId));
        } else if (detail.name || detail.emoji) {
          setCanvases((prev) =>
            prev.map((c) =>
              c.id === detail.canvasId
                ? {
                    ...c,
                    ...(detail.name ? { name: detail.name } : {}),
                    ...(detail.emoji ? { emoji: detail.emoji } : {}),
                  }
                : c
            )
          );
        }
      }

      // Also refetch to stay fully in sync
      fetch(`/api/spaces/${params.spaceId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setSpace(data);
            setCanvases(data.canvases || []);
          }
        })
        .catch(() => {});
    };
    window.addEventListener("canvas-updated", handler);
    return () => window.removeEventListener("canvas-updated", handler);
  }, [params.spaceId]);

  // Listen for space-updated events from ExpandedPrimaryPanel
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.spaceId === params.spaceId) {
        fetch(`/api/spaces/${params.spaceId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              setSpace(data);
            }
          })
          .catch(() => {});
      }
    };
    window.addEventListener("space-updated", handler);
    return () => window.removeEventListener("space-updated", handler);
  }, [params.spaceId]);

  const spaceName = space?.name || "Space";

  return (
    <aside
      className="h-full flex-shrink-0 overflow-hidden bg-white rounded-l-3xl shadow-[0px_0px_8px_0px_rgba(34,36,40,0.06),0px_12px_32px_0px_rgba(34,36,40,0.1)]"
      style={{ width: SECONDARY_WIDTH }}
    >
      <div className="h-full flex flex-col">
        {/* Space header — single click to edit */}
        <div className="flex items-center px-6 pt-6 pb-5">
          {loading ? (
            <div className="h-5 w-3/5 bg-gray-100 rounded animate-pulse" />
          ) : isEditingSpaceName ? (
            <input
              ref={spaceNameInputRef}
              value={spaceNameEditValue}
              onChange={(e) => setSpaceNameEditValue(e.target.value)}
              onBlur={handleSaveSpaceName}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveSpaceName();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  handleCancelSpaceName();
                }
              }}
              className="flex-1 text-md font-semibold text-gray-900 truncate bg-transparent outline-none border-none p-0 m-0"
            />
          ) : (
            <h2
              className="flex-1 text-md font-semibold text-gray-900 truncate cursor-text"
              onClick={() => setIsEditingSpaceName(true)}
            >
              {spaceName}
            </h2>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pt-2">
          {loading ? (
            /* Skeleton UI */
            <div className="flex flex-col">
              {/* Capability skeleton */}
              <div className="h-8 w-2/5 bg-gray-100 rounded-lg animate-pulse mx-1" />

              {/* Divider */}
              <div className="my-8 border-gray-200" />

              {/* Boards header — label only, no + button */}
              <div className="flex items-center h-8 px-3">
                <span className="flex-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Boards
                </span>
              </div>

              {/* Board skeleton rows */}
              <div className="flex flex-col gap-1 mt-1 px-1">
                {[0.65, 0.45, 0.75].map((width, i) => (
                  <div key={i} className="flex items-center gap-3 h-8 px-2">
                    <div className="w-5 h-5 bg-gray-100 rounded animate-pulse flex-shrink-0" />
                    <div
                      className="h-4 bg-gray-100 rounded animate-pulse"
                      style={{ width: `${width * 100}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Capabilities list */}
              <motion.div
                className="flex flex-col gap-0.5"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {capabilities.map((cap) => (
                  <motion.div key={cap.id} variants={staggerItem}>
                    <CapabilityItem
                      label={cap.label}
                      isSelected={selectedCapability === cap.id}
                      onClick={() => setSelectedCapability(cap.id)}
                      href={cap.id === "overview" ? `/space/${params.spaceId}` : undefined}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Divider */}
              <div className="my-8  border-gray-200" />

              {/* Boards section */}
              <div className="flex items-center h-8 px-3">
                <span className="flex-1 text-sm font-bold text-gray-900">
                  Boards
                </span>
                <button
                  onClick={handleCreateBoard}
                  className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200/60 transition-colors duration-200"
                  title="Add board"
                >
                  <IconPlus css={{ width: 16, height: 16 }} />
                </button>
              </div>

              {/* Board items — grouped by section or flat list */}
              {params.spaceId && BOARD_SECTIONS[params.spaceId] ? (
                <GroupedBoardList
                  sections={BOARD_SECTIONS[params.spaceId]}
                  canvases={canvases}
                  spaceId={params.spaceId}
                  activePath={pathname}
                  generatingEmojiForCanvas={generatingEmojiForCanvas}
                />
              ) : (
                <NavList
                  items={canvasNavItems}
                  isActive={(item) => pathname === item.href}
                  onReorder={handleReorderCanvases}
                  onRename={handleRenameCanvas}
                  onDelete={handleDeleteCanvas}
                  emptyMessage="No boards yet"
                />
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function CapabilityItem({
  label,
  isSelected,
  onClick,
  href,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  href?: string;
}) {
  const className = `w-full flex items-center h-8 rounded-lg text-sm transition-colors duration-200 px-4 ${
    isSelected
      ? "bg-gray-100 text-gray-900 font-medium"
      : "text-gray-600 hover:bg-gray-100"
  }`;

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        <span className="truncate text-left">{label}</span>
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      <span className="truncate text-left">{label}</span>
    </button>
  );
}

/* ── Grouped board list with collapsible sections ──────────────── */

import type { BoardSection } from "@/data/board-sections";

function GroupedBoardList({
  sections,
  canvases,
  spaceId,
  activePath,
  generatingEmojiForCanvas,
}: {
  sections: BoardSection[];
  canvases: Canvas[];
  spaceId: string;
  activePath: string;
  generatingEmojiForCanvas: string | null;
}) {
  // All sections start expanded
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = useCallback((label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  // Build a lookup for canvases by ID
  const canvasMap = new Map(canvases.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => {
        const isCollapsed = collapsed[section.label] ?? false;
        const sectionCanvases = section.canvasIds
          .map((id) => canvasMap.get(id))
          .filter(Boolean) as Canvas[];

        if (sectionCanvases.length === 0) return null;

        return (
          <div key={section.label} className="flex flex-col">
            {/* Section header */}
            <button
              onClick={() => toggle(section.label)}
              className="flex items-center gap-2 h-8 px-3 pt-2 text-sm text-gray-900 cursor-pointer bg-transparent border-none"
            >
              {/* Chevron */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className={`flex-shrink-0 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke="#222428"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm text-gray-900">{section.label}</span>
            </button>

            {/* Board items */}
            {!isCollapsed && (
              <div className="flex flex-col gap-0.5 pl-9 pr-2 pt-[6px]">
                {sectionCanvases.map((canvas) => {
                  const href = `/space/${spaceId}/canvas/${canvas.id}`;
                  const isActive = activePath === href;

                  return (
                    <Link
                      key={canvas.id}
                      href={href}
                      className="flex items-center gap-3 h-10 px-2 rounded text-sm transition-colors duration-200"
                      style={{
                        color: isActive ? "#222428" : "#222428",
                        fontWeight: isActive ? 500 : 400,
                        backgroundColor: isActive ? "#f3f4f6" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = "#f3f4f6";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        <BoardEmoji
                          emoji={canvas.emoji}
                          size={16}
                          loading={generatingEmojiForCanvas === canvas.id}
                        />
                      </span>
                      <span className="truncate">{canvas.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
