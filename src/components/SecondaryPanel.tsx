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
import { generateSpaceTheme, spaceThemeToCssVars, parseSpaceColor } from "@/lib/space-theme";

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
const SPACE_SECTIONS: Record<string, { id: string; label: string; href?: string }[]> = {
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
  // Insights
  "space-insights": [
    { id: "overview",      label: "Overview",      href: "/insights/overview" },
    { id: "opportunities", label: "Insights", href: "/insights/themes" },
    { id: "signals",       label: "Signals",       href: "/insights/signals" },
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
  // Derive selected capability from pathname rather than local state
  const selectedCapability = (() => {
    if (isOnCanvas) return null;
    const spaceRoot = `/space/${params.spaceId}`;
    if (pathname === spaceRoot || pathname === `${spaceRoot}/`) return "overview";
    const suffix = pathname.slice(spaceRoot.length + 1); // e.g. "schedule"
    return suffix || "overview";
  })();

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

  const { hue: sidebarHue, chroma: sidebarChroma } = parseSpaceColor(space?.color, params.spaceId || "");
  const sidebarTheme = generateSpaceTheme(sidebarHue, sidebarChroma);
  const sidebarCssVars = spaceThemeToCssVars(sidebarTheme);

  return (
    <aside
      className="h-full flex-shrink-0 overflow-hidden rounded-l-[2rem] shadow-surface-nav"
      style={{ backgroundColor: "#FFFFFF", width: SECONDARY_WIDTH, ...sidebarCssVars } as React.CSSProperties}
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
                {!(SPACE_SECTIONS[params.spaceId ?? ""] ?? []).some(s => s.id === "overview") && (
                  <motion.div variants={staggerItem}>
                    <CapabilityItem
                      label="Overview"
                      isSelected={selectedCapability === "overview"}
                      onClick={() => {}}
                      href={`/space/${params.spaceId}`}
                      highlightColor="var(--space-100)"
                      activeTextColor="var(--space-accent)"
                    />
                  </motion.div>
                )}
                {(params.spaceId && SPACE_SECTIONS[params.spaceId] || []).map((section) => (
                  <motion.div key={section.id} variants={staggerItem}>
                    <CapabilityItem
                      label={section.label}
                      isSelected={selectedCapability === section.id}
                      onClick={() => {}}
                      href={section.href ?? `/space/${params.spaceId}/${section.id}`}
                      highlightColor={params.spaceId === "space-insights" ? "#E7E7E5" : "var(--space-100)"}
                      activeTextColor={params.spaceId === "space-insights" ? "#222428" : "var(--space-accent)"}
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
              {params.spaceId === "space-insights" ? (
                <InsightsBoardList canvases={canvases} activePath={pathname} />
              ) : params.spaceId && BOARD_SECTIONS[params.spaceId] ? (
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

/* ── Static insights board list ────────────────────────────────── */

const INSIGHTS_STATIC_SECTIONS = [
  {
    label: "Research",
    items: [
      {
        label: "Interview Synthesis",
        icon: <path fill="currentColor" d="M20 12a8 8 0 1 0-14.816 4.19l.103.82-.764 2.458 2.431-.77.83.103A7.976 7.976 0 0 0 12 20a8 8 0 0 0 8-8Zm2 0c0 5.523-4.477 10-10 10a9.973 9.973 0 0 1-4.864-1.263l-3.833 1.216-1.258-1.25 1.201-3.867A9.958 9.958 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10ZM7.95 8h2v2h-2V8Zm6 0h2v2h-2V8Zm2.949 5a5 5 0 0 1-9.797 0H9.17a2.998 2.998 0 0 0 5.655 0H16.9Z" />,
      },
      {
        label: "Survey Analysis — Q1",
        icon: <path fill="currentColor" d="M11.625 9.219l4.122 3.299 4.405-7.048 1.696 1.06-5 8-1.473.251-4.148-3.319-3.395 5.092-1.664-1.109 4-6 1.457-.226Z" />,
      },
    ],
  },
  {
    label: "Analysis",
    items: [
      {
        label: "Opportunity Clustering",
        icon: <><path fill="currentColor" d="M5.5 16A2.5 2.5 0 0 0 8 18.5v1A2.5 2.5 0 0 0 5.5 22h-1A2.5 2.5 0 0 0 2 19.5v-1A2.5 2.5 0 0 0 4.5 16h1Z" /><path fill="currentColor" d="M10.678 5.207c.325-1.368 2.319-1.37 2.644 0l.027.142.042.255a6.26 6.26 0 0 0 5.26 5.046c1.553.224 1.561 2.473 0 2.699a6.26 6.26 0 0 0-5.302 5.301c-.225 1.563-2.475 1.554-2.699 0a6.26 6.26 0 0 0-5.3-5.3c-1.56-.225-1.557-2.474 0-2.699l.255-.042a6.26 6.26 0 0 0 5.046-5.26l.028-.141Z" /><path fill="currentColor" d="M19.5 2A2.5 2.5 0 0 0 22 4.5v1A2.5 2.5 0 0 0 19.5 8h-1A2.5 2.5 0 0 0 16 5.5v-1A2.5 2.5 0 0 0 18.5 2h1Z" /></>,
      },
      {
        label: "Sentiment Trends",
        icon: <path fill="currentColor" fillRule="evenodd" d="m9 20.868.438.292a5 5 0 0 0 2.773.84h4.29a5.5 5.5 0 0 0 5.5-5.5V12a4 4 0 0 0-4-4h-3.147l.853-2.772a3.35 3.35 0 0 0-6.352-2.13l-.867 2.384A6.61 6.61 0 0 1 7.7 7H3L2 8v12l1 1h6v-.132Zm3.797-17.944a1.35 1.35 0 0 0-1.562.857l-.868 2.385A8.609 8.609 0 0 1 9 8.6v9.864l1.547 1.031a3 3 0 0 0 1.664.504h4.29a3.5 3.5 0 0 0 3.5-3.5V12a2 2 0 0 0-2-2h-4.5l-.957-1.294 1.252-4.066a1.351 1.351 0 0 0-.999-1.716ZM4 19V9h3v10H4Z" clipRule="evenodd" />,
      },
      {
        label: "Competitor Signals",
        icon: <path fill="currentColor" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2ZM9.043 13c.245 2.895 1.524 5.343 3.016 6.744 1.465-1.392 2.673-3.832 2.902-6.744H9.043Zm-4.979 0a8.006 8.006 0 0 0 5.197 6.519C8.065 17.772 7.218 15.497 7.037 13H4.064Zm12.9 0c-.168 2.465-.95 4.723-2.099 6.469A8.004 8.004 0 0 0 19.935 13h-2.97Zm-2.226-8.52c1.196 1.748 2.044 4.023 2.225 6.52h2.973a8.007 8.007 0 0 0-5.198-6.52ZM12 4.312C10.534 5.723 9.285 8.145 9.043 11h5.914c-.242-2.856-1.49-5.277-2.957-6.688Zm-2.74.168A8.007 8.007 0 0 0 4.065 11h2.973c.181-2.497 1.028-4.772 2.224-6.52Z" />,
      },
    ],
  },
  {
    label: "Outcomes",
    items: [
      {
        label: "Roadmap Recommendations",
        icon: <path fill="currentColor" fillRule="evenodd" d="M19.274 2.961a11.706 11.706 0 0 1 .765.038l.049.005h.014l.005.002h.002l.883.87.001.003v.005l.002.014a3.545 3.545 0 0 1 .019.204c.01.132.02.32.025.551a12.12 12.12 0 0 1-.11 1.857c-.203 1.486-.75 3.437-2.16 5.13l-.062.067-.622.621.895 4.476-.273.903-4 4-1.688-.51-.94-4.705-4.572-4.571-4.703-.94-.511-1.688 4-4 .903-.273 4.475.894.622-.621.283-.267c1.444-1.278 3.3-1.769 4.733-1.956a13.589 13.589 0 0 1 1.965-.109Zm-5.189 13.367.528 2.644 2.301-2.301-.528-2.644-2.301 2.301ZM19.039 4.96c-.401 0-.912.02-1.473.094-1.263.165-2.651.575-3.662 1.468l-.197.185L9.414 11 13 14.586l4.25-4.251c1.075-1.302 1.525-2.84 1.696-4.096.067-.49.09-.929.093-1.279ZM5.027 9.386l2.644.528 2.3-2.3-2.643-.529-2.3 2.3Zm1.68 6.321c-.782.782-1.136 1.153-1.36 1.645-.16.353-.271.82-.32 1.62.8-.049 1.268-.159 1.621-.32.492-.223.863-.577 1.645-1.359l1.414 1.414c-.718.718-1.347 1.364-2.23 1.766C6.585 20.878 5.529 21 4 21l-1-1c0-1.53.122-2.585.527-3.477.402-.883 1.048-1.512 1.766-2.23l1.414 1.414Z" clipRule="evenodd" />,
      },
      {
        label: "Stakeholder Readout",
        icon: <path fill="currentColor" d="M20 12a8 8 0 1 0-14.953 3.959l.137.23.103.822-.764 2.457 2.431-.77.83.103.282.167A7.965 7.965 0 0 0 12 20a8 8 0 0 0 8-8Zm2 0c0 5.523-4.477 10-10 10a9.971 9.971 0 0 1-4.864-1.263l-3.833 1.216-1.258-1.25 1.201-3.867A9.958 9.958 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10ZM7 11h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z" />,
      },
    ],
  },
];

function InsightsBoardList({ canvases, activePath }: { canvases: Canvas[]; activePath: string }) {
  return (
    <div className="flex flex-col gap-2 mt-1">
      {INSIGHTS_STATIC_SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col">
          <div className="group flex items-center h-8 pl-3 pr-0 pt-2 text-sm w-full font-semibold text-gray-500">
            <span className="flex-1 text-left">{section.label}</span>
          </div>
          <div className="pt-[6px]">
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <a
                  key={item.label}
                  href="#"
                  className="flex items-center gap-3 h-9 px-3 rounded-lg text-sm transition-colors duration-200 text-gray-700 hover:bg-gray-100"
                >
                  <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-gray-400">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" style={{ width: 20, height: 20 }}>
                      {item.icon}
                    </svg>
                  </span>
                  <span className="truncate flex-1">{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Dynamic boards from "Open in Canvas" */}
      {canvases.length > 0 && (
        <div className="flex flex-col">
          <div className="group flex items-center h-8 pl-3 pr-0 pt-2 text-sm w-full font-semibold text-gray-500">
            <span className="flex-1 text-left">Saved</span>
          </div>
          <div className="pt-[6px]">
            <div className="flex flex-col gap-0.5">
              {canvases.map((canvas) => {
                const href = `/space/space-insights/canvas/${canvas.id}`;
                const isActive = activePath === href;
                return (
                  <Link
                    key={canvas.id}
                    href={href}
                    className="flex items-center gap-3 h-9 px-3 rounded-lg text-sm transition-colors duration-200"
                    style={{
                      color: isActive ? "rgb(56,56,56)" : "rgb(107,107,107)",
                      fontWeight: isActive ? 500 : 400,
                      backgroundColor: isActive ? "var(--color-gray-200)" : "transparent",
                    }}
                  >
                    <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-gray-400">
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" style={{ width: 20, height: 20 }}>
                        <path fill="currentColor" fillRule="evenodd" d="M18 14h-7v-2h7v2ZM13 3h6a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2.584l1.25 3H15.5l-1.25-3h-4.5L8.5 22H6.333l1.25-3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h6V1h2v2ZM5 5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H5Z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="truncate flex-1">{canvas.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
