"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  IconHouse,
  IconChat,
  IconCheckBoxLines,
  IconMagnifyingGlass,
  IconPlus,
  IconChevronUpDown,
  IconCheckMark,
  IconTrash,
} from "@mirohq/design-system-icons";
import { useSidebar } from "@/hooks/useSidebar";
import { EXPANDED_PRIMARY_WIDTH } from "@/providers/SidebarProvider";
import { NavList, NavListItem, NavMenuAction } from "@/components/NavList";
import { BoardEmoji } from "@/components/BoardEmoji";
import { SPACE_SECTIONS } from "@/data/space-sections";

// Same nav items as PrimaryRail — identical icons, IDs, hrefs
const navItems = [
  { id: "home", label: "Home", href: "/", icon: IconHouse },
  { id: "chat", label: "Chat", href: "#", icon: IconChat },
  { id: "tasks", label: "Tasks", href: "/tasks", icon: IconCheckBoxLines },
  { id: "search", label: "Search", href: "#", icon: IconMagnifyingGlass },
];

// Same indicator transition as PrimaryRail
const indicatorTransition = {
  duration: 0.35,
  ease: [0.65, 0, 0.31, 1] as [number, number, number, number],
};


type Space = {
  id: string;
  name: string;
  description: string;
  emoji?: string;
  color?: string;
};

// Hardcoded workspace + teams for prototype
const WORKSPACE_NAME = "FlexFund";
const teams = [
  { id: "team-1", name: "Flex Tech" },
  { id: "team-2", name: "Engineering" },
  { id: "team-3", name: "Product" },
  { id: "team-4", name: "Marketing" },
];

// Sticky note color palette for space colors
const STICKY_COLORS = [
  { bg: "#F5D550", text: "#5D4E00" },
  { bg: "#F08080", text: "#5C1A1A" },
  { bg: "#E07BE0", text: "#5C1060" },
  { bg: "#B0A0D8", text: "#2E1A5E" },
  { bg: "#88A8E0", text: "#1A2E5C" },
];

// Popover animation
const popoverVariants = {
  hidden: { opacity: 0, y: -4, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: [0.2, 0, 0, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.97,
    transition: { duration: 0.1, ease: [0.3, 0, 1, 1] as [number, number, number, number] },
  },
};

export function ExpandedPrimaryPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar, navPalette } = useSidebar();
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0].id);
  const [teamPopoverOpen, setTeamPopoverOpen] = useState(false);
  const teamPopoverRef = useRef<HTMLDivElement>(null);
  const teamTriggerRef = useRef<HTMLButtonElement>(null);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? teams[0];

  // Close team popover on click outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      teamPopoverRef.current &&
      !teamPopoverRef.current.contains(e.target as Node) &&
      teamTriggerRef.current &&
      !teamTriggerRef.current.contains(e.target as Node)
    ) {
      setTeamPopoverOpen(false);
    }
  }, []);

  useEffect(() => {
    if (teamPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [teamPopoverOpen, handleClickOutside]);

  // Fetch spaces list
  useEffect(() => {
    let cancelled = false;
    fetch("/api/spaces")
      .then((res) => {
        if (!res.ok) throw new Error(`Spaces API returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data.spaces || [];
        setSpaces(list);
      })
      .catch((err) => console.error("Failed to load spaces:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Create a new space with a default board and navigate into it
  const handleCreateSpace = useCallback(async () => {
    try {
      // 1. Create the space
      const spaceRes = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Space" }),
      });
      if (!spaceRes.ok) throw new Error("Failed to create space");
      const newSpace = await spaceRes.json();

      // 2. Create a default board inside the new space
      const canvasRes = await fetch("/api/canvases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Board", spaceId: newSpace.id }),
      });
      if (!canvasRes.ok) throw new Error("Failed to create board");
      const newCanvas = await canvasRes.json();

      // 3. Update local state so the sidebar reflects the new space immediately
      setSpaces((prev) => [...prev, newSpace]);

      // 4. Navigate into the new board
      router.push(`/space/${newSpace.id}/canvas/${newCanvas.id}`);
    } catch (err) {
      console.error("Failed to create space:", err);
    }
  }, [router]);

  // Map spaces to NavListItems with emoji or initial-letter icons
  const spaceNavItems: NavListItem[] = spaces.map((space) => ({
    id: space.id,
    label: space.name,
    href: `/space/${space.id}`,
    icon: space.emoji ? (
      <BoardEmoji emoji={space.emoji} size={20} />
    ) : (
      <span
        className="w-5 h-5 text-xs leading-5 text-center flex-shrink-0 rounded flex items-center justify-center"
        style={{
          backgroundColor: space.color || navPalette.logoContainer,
          color: navPalette.textPrimary,
        }}
      >
        {getSpaceInitial(space.name)}
      </span>
    ),
  }));

  // Rename a space (double-click in NavList)
  const handleRenameSpace = useCallback(
    async (spaceId: string, newName: string) => {
      // Optimistic update
      setSpaces((prev) =>
        prev.map((s) => (s.id === spaceId ? { ...s, name: newName } : s))
      );

      try {
        await fetch(`/api/spaces/${spaceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        });

        // Notify other components (e.g. SecondaryPanel header)
        window.dispatchEvent(
          new CustomEvent("space-updated", { detail: { spaceId } })
        );
      } catch (err) {
        console.error("Failed to rename space:", err);
      }
    },
    []
  );

  // Listen for space-updated events from SecondaryPanel
  useEffect(() => {
    const handler = () => {
      fetch("/api/spaces")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          const list = Array.isArray(data) ? data : data.spaces || [];
          setSpaces(list);
        })
        .catch(() => {});
    };
    window.addEventListener("space-updated", handler);
    return () => window.removeEventListener("space-updated", handler);
  }, []);

  // Persist reordered spaces
  const handleReorderSpaces = useCallback(
    async (orderedIds: string[]) => {
      // Optimistic: reorder local state
      const reordered = orderedIds
        .map((id) => spaces.find((s) => s.id === id))
        .filter(Boolean) as Space[];
      setSpaces(reordered);

      try {
        await fetch("/api/spaces/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds }),
        });
      } catch (err) {
        console.error("Failed to persist space order:", err);
      }
    },
    [spaces]
  );

  // Delete a space and its canvases
  const handleDeleteSpace = useCallback(
    async (spaceId: string) => {
      setSpaces((prev) => prev.filter((s) => s.id !== spaceId));

      try {
        await fetch(`/api/spaces/${spaceId}`, { method: "DELETE" });
      } catch (err) {
        console.error("Failed to delete space:", err);
      }

      if (pathname.startsWith(`/space/${spaceId}`)) {
        router.push("/");
      }
    },
    [pathname, router]
  );

  // Randomize space color from sticky palette
  const handleRandomizeColor = useCallback(
    async (spaceId: string) => {
      const space = spaces.find((s) => s.id === spaceId);
      const available = STICKY_COLORS.filter((c) => c.bg !== space?.color);
      const picked =
        available[Math.floor(Math.random() * available.length)] ||
        STICKY_COLORS[0];

      setSpaces((prev) =>
        prev.map((s) =>
          s.id === spaceId ? { ...s, color: picked.bg } : s
        )
      );

      try {
        await fetch(`/api/spaces/${spaceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ color: picked.bg }),
        });
        window.dispatchEvent(
          new CustomEvent("space-updated", { detail: { spaceId } })
        );
      } catch (err) {
        console.error("Failed to update space color:", err);
      }
    },
    [spaces]
  );

  // Menu actions for space overflow
  const spaceMenuActions: NavMenuAction[] = [
    {
      label: "Space color",
      icon: (
        <span
          className="w-3.5 h-3.5 rounded-full"
          style={{
            background:
              "linear-gradient(135deg, #F5D550, #F08080, #E07BE0, #B0A0D8, #88A8E0)",
          }}
        />
      ),
      onClick: handleRandomizeColor,
    },
    {
      label: "Delete space",
      icon: <IconTrash css={{ width: 14, height: 14, flexShrink: 0 }} />,
      onClick: handleDeleteSpace,
      danger: true,
    },
  ];

  // Active nav item based on current route
  const activeNavId =
    navItems.find((item) =>
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href) && item.href !== "#"
    )?.id ?? null;

  const highlightedNavId = hoveredNavId ?? activeNavId;

  return (
    <aside
      className="h-full flex flex-col py-5 px-3 flex-shrink-0"
      style={{ width: EXPANDED_PRIMARY_WIDTH, backgroundColor: navPalette.base }}
    >
      {/* Brand header: logo + workspace name + team switcher */}
      <div className="relative mb-5">
        <div className="flex items-center gap-2.5">
          {/* Logo in rounded-lg tonal container */}
          <Link href="/" className="flex-shrink-0">
            <div
              className="w-10 h-10 flex items-center justify-center rounded-[16px] shadow-sm"
              style={{ backgroundColor: "#7A2CDD" }}
            >
              <img src="/flexfund.svg" alt="FlexFund" width={24} height={24} />
            </div>
          </Link>

          {/* Workspace + team name */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate leading-tight"
              style={{ color: navPalette.textPrimary }}
            >
              {WORKSPACE_NAME}
            </p>
            <button
              ref={teamTriggerRef}
              onClick={() => setTeamPopoverOpen((prev) => !prev)}
              className="flex items-center gap-1 mt-0.5 rounded transition-colors duration-150 group"
              style={{ color: navPalette.textSecondary }}
            >
              <span className="text-xs truncate">{selectedTeam.name}</span>
              <IconChevronUpDown css={{ width: 12, height: 12, flexShrink: 0, opacity: 0.7 }} />
            </button>
          </div>
        </div>

        {/* Team switcher popover */}
        <AnimatePresence>
          {teamPopoverOpen && (
            <motion.div
              ref={teamPopoverRef}
              variants={popoverVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute left-0 right-0 mt-2 z-50 rounded-lg overflow-hidden bg-white shadow-elevated"
            >
              <div className="py-1">
                {teams.map((team) => {
                  const isSelected = team.id === selectedTeamId;
                  return (
                    <button
                      key={team.id}
                      onClick={() => {
                        setSelectedTeamId(team.id);
                        setTeamPopoverOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 h-8 text-sm transition-colors duration-150"
                      style={{
                        color: isSelected ? "#050038" : "#6B6B6B",
                        fontWeight: isSelected ? 500 : 400,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#F5F5F5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span className="flex-1 text-left truncate">{team.name}</span>
                      {isSelected && (
                        <IconCheckMark css={{ width: 14, height: 14, flexShrink: 0, color: "#050038" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items with labels */}
      <nav
        className="flex flex-col gap-1"
        onMouseLeave={() => setHoveredNavId(null)}
      >
        {navItems.map((item) => {
          const isHighlighted = highlightedNavId === item.id;
          const isActive = activeNavId === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              className="relative flex items-center gap-3 h-10 px-2.5 rounded-full"
              onMouseEnter={() => setHoveredNavId(item.id)}
            >
              {/* Animated indicator — fully rounded to match PrimaryRail */}
              {isHighlighted && (
                <motion.div
                  layoutId="expanded-nav-indicator"
                  className="absolute inset-0 rounded-[16px]"
                  style={{ backgroundColor: navPalette.indicator }}
                  transition={indicatorTransition}
                />
              )}

              {/* Icon */}
              <div
                className="relative z-10 w-5 h-5 flex items-center justify-center transition-colors duration-150"
                style={{
                  color: isHighlighted || isActive
                    ? navPalette.iconActive
                    : navPalette.iconDefault,
                }}
              >
                <item.icon css={{ width: 20, height: 20 }} />
              </div>

              {/* Label */}
              <span
                className="relative z-10 text-sm transition-colors duration-150"
                style={{
                  color: isHighlighted || isActive
                    ? navPalette.textPrimary
                    : navPalette.textSecondary,
                  fontWeight: isHighlighted || isActive ? 500 : 400,
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-1 my-3 border-t" style={{ borderColor: navPalette.divider }} />

      {/* Spaces section */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {/* Header */}
        <div className="flex items-center h-8 pl-3 pr-1 mb-1">
          <span
            className="flex-1 text-sm font-bold"
            style={{ color: navPalette.textPrimary }}
          >
            Spaces
          </span>
          <button
            onClick={handleCreateSpace}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors duration-200 -mr-1"
            style={{ color: navPalette.iconMuted }}
            title="Add space"
          >
            <IconPlus css={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Spaces list — grouped by section */}
        <GroupedSpaceList
          sections={SPACE_SECTIONS}
          spaces={spaces}
          activePath={pathname}
          navPalette={navPalette}
          onReorder={handleReorderSpaces}
          onRename={handleRenameSpace}
          menuActions={spaceMenuActions}
        />
      </div>
    </aside>
  );
}

function getSpaceInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

/* ── Grouped space list with collapsible sections ──────────────── */

import type { SpaceSection } from "@/data/space-sections";

type NavPalette = ReturnType<typeof useSidebar>["navPalette"];

function GroupedSpaceList({
  sections: initialSections,
  spaces,
  activePath,
  navPalette,
  onReorder,
  onRename,
  menuActions,
}: {
  sections: SpaceSection[];
  spaces: Space[];
  activePath: string;
  navPalette: NavPalette;
  onReorder: (orderedIds: string[]) => void;
  onRename?: (id: string, newName: string) => void;
  menuActions?: NavMenuAction[];
}) {
  const [orderedSections, setOrderedSections] = useState(initialSections);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Sync if initial sections change
  useEffect(() => {
    setOrderedSections(initialSections);
  }, [initialSections]);

  const toggle = useCallback((label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const spaceMap = new Map(spaces.map((s) => [s.id, s]));

  // Rebuild global space order from current section arrangement
  const rebuildGlobalOrder = useCallback(
    (currentSections: SpaceSection[]) => {
      const allIds: string[] = [];
      for (const section of currentSections) {
        const sectionSpaces = section.spaceIds
          .map((id) => spaceMap.get(id))
          .filter(Boolean) as Space[];
        allIds.push(...sectionSpaces.map((s) => s.id));
      }
      // Include any spaces not in any section
      const sectionedIds = new Set(currentSections.flatMap((s) => s.spaceIds));
      const unsectioned = spaces.filter((s) => !sectionedIds.has(s.id));
      allIds.push(...unsectioned.map((s) => s.id));
      return allIds;
    },
    [spaces, spaceMap]
  );

  // When items within a section are reordered
  const handleSectionItemReorder = useCallback(
    (sectionLabel: string, sectionOrderedIds: string[]) => {
      const updated = orderedSections.map((s) =>
        s.label === sectionLabel ? { ...s, spaceIds: sectionOrderedIds } : s
      );
      setOrderedSections(updated);
      onReorder(rebuildGlobalOrder(updated));
    },
    [orderedSections, onReorder, rebuildGlobalOrder]
  );

  // When sections themselves are reordered
  const handleSectionsReorder = useCallback(
    (newOrder: SpaceSection[]) => {
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
      className="flex flex-col gap-3"
      as="div"
    >
      {orderedSections.map((section) => {
        const sectionSpaces = section.spaceIds
          .map((id) => spaceMap.get(id))
          .filter(Boolean) as Space[];

        if (sectionSpaces.length === 0) return null;

        const sectionNavItems: NavListItem[] = sectionSpaces.map((space) => ({
          id: space.id,
          label: space.name,
          href: `/space/${space.id}`,
          icon: space.emoji ? (
            <BoardEmoji emoji={space.emoji} size={16} />
          ) : (
            <span
              className="w-4 h-4 text-[10px] leading-4 text-center rounded flex items-center justify-center"
              style={{
                backgroundColor: space.color || navPalette.logoContainer,
                color: navPalette.textPrimary,
              }}
            >
              {getSpaceInitial(space.name)}
            </span>
          ),
        }));

        return (
          <SpaceSectionItem
            key={section.label}
            section={section}
            isCollapsed={collapsed[section.label] ?? false}
            onToggle={() => toggle(section.label)}
            navItems={sectionNavItems}
            activePath={activePath}
            onReorderItems={(orderedIds) => handleSectionItemReorder(section.label, orderedIds)}
            onRename={onRename}
            menuActions={menuActions}
          />
        );
      })}
    </Reorder.Group>
  );
}

function SpaceSectionItem({
  section,
  isCollapsed,
  onToggle,
  navItems,
  activePath,
  onReorderItems,
  onRename,
  menuActions,
}: {
  section: SpaceSection;
  isCollapsed: boolean;
  onToggle: () => void;
  navItems: NavListItem[];
  activePath: string;
  onReorderItems: (orderedIds: string[]) => void;
  onRename?: (id: string, newName: string) => void;
  menuActions?: NavMenuAction[];
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
        className="flex items-center h-8 pl-3 pr-1 pt-2 text-xs font-bold w-full cursor-pointer text-gray-400"
        onTap={() => { if (!didDrag.current) onToggle(); }}
      >
        <span className="flex-1 text-left">{section.label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`flex-shrink-0 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
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

      {/* Space items — animated collapse/expand */}
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
                isActive={(item) => activePath.startsWith(item.href)}
                onReorder={onReorderItems}
                onRename={onRename}
                menuActions={menuActions}
                emptyMessage="No spaces"
                itemColor="#222428"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}
