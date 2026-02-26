"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { IconPlus, IconViewSideLeft } from "@mirohq/design-system-icons";
import { useSidebar } from "@/hooks/useSidebar";
import { SECONDARY_WIDTH } from "@/providers/SidebarProvider";
import { NavList, NavListItem } from "@/components/NavList";
import { BoardEmoji } from "@/components/BoardEmoji";
import { generateAndSetEmoji } from "@/lib/canvasUtils";
import { BOARD_SECTIONS } from "@/data/board-sections";
import { getSpaceHue, generateSpaceTheme } from "@/lib/space-theme";

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

// Fixed pages for a space — Overview + space-specific sections
const SPACE_SECTIONS: Record<string, { id: string; label: string }[]> = {
  // Portfolio
  "space-paygrid": [
    { id: "tasks", label: "Tasks" },
    { id: "people", label: "People" },
    { id: "budget", label: "Budget" },
  ],
  "space-firstflex": [
    { id: "tasks", label: "Tasks" },
    { id: "people", label: "People" },
    { id: "budget", label: "Budget" },
  ],
  "space-core": [
    { id: "tasks", label: "Tasks" },
    { id: "people", label: "People" },
    { id: "timeline", label: "Timeline" },
  ],
  "space-embed": [
    { id: "tasks", label: "Tasks" },
    { id: "people", label: "People" },
    { id: "partners", label: "Partners" },
  ],
  // Programs
  "space-launch-q3": [
    { id: "tasks", label: "Tasks" },
    { id: "people", label: "People" },
    { id: "timeline", label: "Timeline" },
  ],
  "space-brand": [
    { id: "tasks", label: "Tasks" },
    { id: "people", label: "People" },
    { id: "assets", label: "Assets" },
  ],
  "space-kyc": [
    { id: "tasks", label: "Tasks" },
    { id: "people", label: "People" },
    { id: "compliance", label: "Compliance" },
  ],
  "space-claims": [
    { id: "tasks", label: "Tasks" },
    { id: "people", label: "People" },
    { id: "models", label: "Models" },
  ],
  // Events
  "space-ff26": [
    { id: "schedule", label: "Schedule" },
    { id: "attendees", label: "Attendees" },
    { id: "logistics", label: "Logistics" },
  ],
  // Operations
  "space-roadmaps": [
    { id: "tasks", label: "Tasks" },
    { id: "people", label: "People" },
    { id: "priorities", label: "Priorities" },
  ],
  "space-epd": [
    { id: "people", label: "People" },
    { id: "goals", label: "Goals" },
    { id: "reviews", label: "Reviews" },
  ],
  "space-revenueops": [
    { id: "pipeline", label: "Pipeline" },
    { id: "people", label: "People" },
    { id: "metrics", label: "Metrics" },
  ],
  "space-org27": [
    { id: "people", label: "People" },
    { id: "budget", label: "Budget" },
    { id: "timeline", label: "Timeline" },
  ],
  // 1:1s
  "space-1on1-james": [
    { id: "goals", label: "Goals" },
    { id: "actions", label: "Actions" },
    { id: "notes", label: "Notes" },
  ],
  "space-1on1-amara": [
    { id: "goals", label: "Goals" },
    { id: "actions", label: "Actions" },
    { id: "notes", label: "Notes" },
  ],
  "space-1on1-daniel": [
    { id: "goals", label: "Goals" },
    { id: "actions", label: "Actions" },
    { id: "notes", label: "Notes" },
  ],
};

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
  const { toggleSidebar, navPalette } = useSidebar();

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

  const sidebarTheme = generateSpaceTheme(params.spaceId ? getSpaceHue(params.spaceId) : 260);

  return (
    <aside
      className="h-full flex-shrink-0 overflow-hidden rounded-l-[2rem] shadow-surface-nav"
      style={{ backgroundColor: "#FFFFFF", width: SECONDARY_WIDTH }}
    >
      <div className="h-full flex flex-col">
        {/* Space header — single click to edit */}
        <div className="px-6 pb-0" style={{ paddingTop: 36 }}>
          <div className="flex items-center pb-5">
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
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pt-2">
          {loading ? (
            /* Skeleton UI */
            <div className="flex flex-col">
              {/* Capability skeleton */}
              <div className="h-10 w-2/5 bg-gray-100 rounded-[8px] animate-pulse mx-1" />

              {/* Divider */}
              <div className="my-6 border-b border-black/[0.08]" />

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
              {/* Capabilities list — Overview + space-specific sections */}
              <motion.div
                className="flex flex-col gap-0.5"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={staggerItem}>
                  <CapabilityItem
                    label="Overview"
                    isSelected={selectedCapability === "overview"}
                    onClick={() => setSelectedCapability("overview")}
                    href={`/space/${params.spaceId}`}
                    highlightColor={`hsl(${sidebarTheme.tintHue}, 80%, 91%)`}
                    activeTextColor={sidebarTheme.accent}
                  />
                </motion.div>
                {(params.spaceId && SPACE_SECTIONS[params.spaceId] || []).map((section) => (
                  <motion.div key={section.id} variants={staggerItem}>
                    <CapabilityItem
                      label={section.label}
                      isSelected={false}
                      onClick={() => {}}
                      highlightColor={`hsl(${sidebarTheme.tintHue}, 80%, 91%)`}
                      activeTextColor={sidebarTheme.accent}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Divider */}
              <div className="my-6 border-b border-black/[0.08]" />

              {/* Boards section */}
              <div className="flex items-center h-8 pl-3 pr-0">
                <span className="flex-1 text-sm font-bold text-gray-900">
                  Boards
                </span>
                <button
                  onClick={handleCreateBoard}
                  className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200/60 transition-colors duration-200 -mr-1"
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
                  onReorder={handleReorderCanvases}
                  onRename={handleRenameCanvas}
                  onDelete={handleDeleteCanvas}
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
  highlightColor,
  activeTextColor,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  href?: string;
  highlightColor?: string;
  activeTextColor?: string;
}) {
  const baseClass = "w-full flex items-center rounded-[16px] text-sm transition-colors duration-200 px-4";
  const selectedStyle = isSelected
    ? { backgroundColor: highlightColor, color: activeTextColor, fontWeight: 500 }
    : undefined;

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`${baseClass} ${isSelected ? "" : "text-gray-600"}`}
        style={{ height: 40, ...selectedStyle }}
        onMouseEnter={(e) => { if (!isSelected && highlightColor) (e.currentTarget.style.backgroundColor = highlightColor); }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = ""; }}
      >
        <span className="truncate text-left">{label}</span>
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClass} ${isSelected ? "" : "text-gray-600"}`}
      style={{ height: 40, ...selectedStyle }}
      onMouseEnter={(e) => { if (!isSelected && highlightColor) (e.currentTarget.style.backgroundColor = highlightColor); }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = ""; }}
    >
      <span className="truncate text-left">{label}</span>
    </button>
  );
}

/* ── Grouped board list with collapsible sections ──────────────── */

import type { BoardSection } from "@/data/board-sections";

function GroupedBoardList({
  sections: initialSections,
  canvases,
  spaceId,
  activePath,
  generatingEmojiForCanvas,
  onReorder,
  onRename,
  onDelete,
}: {
  sections: BoardSection[];
  canvases: Canvas[];
  spaceId: string;
  activePath: string;
  generatingEmojiForCanvas: string | null;

  onReorder: (orderedIds: string[]) => void;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}) {
  const { navPalette } = useSidebar();
  const [orderedSections, setOrderedSections] = useState(initialSections);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOrderedSections(initialSections);
  }, [initialSections]);

  const toggle = useCallback((label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const canvasMap = new Map(canvases.map((c) => [c.id, c]));

  // Rebuild global canvas order from current section arrangement
  const rebuildGlobalOrder = useCallback(
    (currentSections: BoardSection[]) => {
      const allIds: string[] = [];
      for (const section of currentSections) {
        allIds.push(...section.canvasIds.filter((id) => canvasMap.has(id)));
      }
      // Include any canvases not in any section
      const sectionedIds = new Set(currentSections.flatMap((s) => s.canvasIds));
      const unsectioned = canvases.filter((c) => !sectionedIds.has(c.id));
      allIds.push(...unsectioned.map((c) => c.id));
      return allIds;
    },
    [canvases, canvasMap]
  );

  // When items within a section are reordered
  const handleSectionItemReorder = useCallback(
    (sectionLabel: string, sectionOrderedIds: string[]) => {
      const updated = orderedSections.map((s) =>
        s.label === sectionLabel ? { ...s, canvasIds: sectionOrderedIds } : s
      );
      setOrderedSections(updated);
      onReorder(rebuildGlobalOrder(updated));
    },
    [orderedSections, onReorder, rebuildGlobalOrder]
  );

  // When sections themselves are reordered
  const handleSectionsReorder = useCallback(
    (newOrder: BoardSection[]) => {
      setOrderedSections(newOrder);
      onReorder(rebuildGlobalOrder(newOrder));
    },
    [onReorder, rebuildGlobalOrder]
  );

  return (
    <Reorder.Group
      axis="y"
      values={orderedSections}
      onReorder={handleSectionsReorder}
      className="flex flex-col gap-2"
      as="div"
    >
      {orderedSections.map((section) => {
        const sectionCanvases = section.canvasIds
          .map((id) => canvasMap.get(id))
          .filter(Boolean) as Canvas[];

        if (sectionCanvases.length === 0) return null;

        const sectionNavItems: NavListItem[] = sectionCanvases.map((canvas) => ({
          id: canvas.id,
          label: canvas.name,
          href: `/space/${spaceId}/canvas/${canvas.id}`,
          icon: (
            <BoardEmoji
              emoji={canvas.emoji}
              size={16}
              loading={generatingEmojiForCanvas === canvas.id}
            />
          ),
        }));

        return (
          <BoardSectionItem
            key={section.label}
            section={section}
            isCollapsed={collapsed[section.label] ?? false}
            onToggle={() => toggle(section.label)}
            navItems={sectionNavItems}
            activePath={activePath}
            onReorderItems={(orderedIds) => handleSectionItemReorder(section.label, orderedIds)}
            onRename={onRename}
            onDelete={onDelete}
          />
        );
      })}
    </Reorder.Group>
  );
}

function BoardSectionItem({
  section,
  isCollapsed,
  onToggle,
  navItems,
  activePath,
  onReorderItems,
  onRename,
  onDelete,
}: {
  section: BoardSection;
  isCollapsed: boolean;
  onToggle: () => void;
  navItems: NavListItem[];
  activePath: string;
  onReorderItems: (orderedIds: string[]) => void;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}) {
  const didDrag = useRef(false);

  const contentTransition = { type: "spring" as const, stiffness: 400, damping: 30 };

  return (
    <Reorder.Item
      value={section}
      as="div"
      className="flex flex-col"
      layout
      transition={contentTransition}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
      style={{ position: "relative" }}
      onDragStart={() => { didDrag.current = true; }}
      onDragEnd={() => { setTimeout(() => { didDrag.current = false; }, 0); }}
    >
      {/* Section header — tap to toggle, drag to reorder */}
      <motion.div
        className="group flex items-center h-8 pl-3 pr-0 pt-2 text-sm w-full cursor-pointer font-semibold text-gray-500"
        onTap={() => { if (!didDrag.current) onToggle(); }}
      >
        <span className="text-left">{section.label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      {/* Board items — animated collapse/expand */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={contentTransition}
            className="overflow-hidden"
          >
            <div className="pt-[6px]">
              <NavList
                items={navItems}
                isActive={(item) => activePath === item.href}
                onReorder={onReorderItems}
                onRename={onRename}
                onDelete={onDelete}
                emptyMessage="No boards"
                itemColor="var(--color-gray-800)"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}
