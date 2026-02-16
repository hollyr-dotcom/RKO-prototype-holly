"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconHouse,
  IconChat,
  IconCheckBoxLines,
  IconMagnifyingGlass,
  IconMiroMark,
  IconPlus,
  IconChevronUpDown,
  IconCheckMark,
} from "@mirohq/design-system-icons";
import { useSidebar } from "@/hooks/useSidebar";
import { EXPANDED_PRIMARY_WIDTH } from "@/providers/SidebarProvider";
import { NavList, NavListItem } from "@/components/NavList";

// Same nav items as PrimaryRail — identical icons, IDs, hrefs
const navItems = [
  { id: "home", label: "Home", href: "/", icon: IconHouse },
  { id: "chat", label: "Chat", href: "#", icon: IconChat },
  { id: "tasks", label: "Tasks", href: "#", icon: IconCheckBoxLines },
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
};

// Hardcoded workspace + teams for prototype
const WORKSPACE_NAME = "Acme Inc.";
const teams = [
  { id: "team-1", name: "Design" },
  { id: "team-2", name: "Engineering" },
  { id: "team-3", name: "Product" },
  { id: "team-4", name: "Marketing" },
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
        if (!cancelled && Array.isArray(data)) {
          setSpaces(data);
        }
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

  // Map spaces to NavListItems with initial-letter icons
  const spaceNavItems: NavListItem[] = spaces.map((space) => ({
    id: space.id,
    label: space.name,
    href: `/space/${space.id}`,
    icon: (
      <span
        className="w-5 h-5 text-xs leading-5 text-center flex-shrink-0 rounded flex items-center justify-center"
        style={{
          backgroundColor: navPalette.logoContainer,
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
          if (Array.isArray(data)) {
            setSpaces(data);
          }
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
              className="w-10 h-10 flex items-center justify-center rounded-lg shadow-sm"
              style={{ backgroundColor: navPalette.logoContainer }}
            >
              <IconMiroMark css={{ width: 24, height: 24, color: "#000000" }} />
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
              className="absolute left-0 right-0 mt-2 z-50 rounded-lg overflow-hidden"
              style={{
                backgroundColor: navPalette.logoContainer,
                boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
              }}
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
                        color: isSelected
                          ? navPalette.textPrimary
                          : navPalette.textSecondary,
                        fontWeight: isSelected ? 500 : 400,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = navPalette.hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span className="flex-1 text-left truncate">{team.name}</span>
                      {isSelected && (
                        <IconCheckMark css={{ width: 14, height: 14, flexShrink: 0, color: navPalette.iconActive }} />
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
                  className="absolute inset-0 rounded-full"
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
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center h-8 px-3 mb-1">
          <span
            className="flex-1 text-xs font-medium uppercase tracking-wider"
            style={{ color: navPalette.iconMuted }}
          >
            Spaces
          </span>
          <button
            onClick={handleCreateSpace}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors duration-200"
            style={{ color: navPalette.iconMuted }}
            title="Add space"
          >
            <IconPlus css={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Spaces list — double-click to rename */}
        <NavList
          items={spaceNavItems}
          isActive={(item) => pathname.startsWith(item.href)}
          onReorder={handleReorderSpaces}
          onRename={handleRenameSpace}
          emptyMessage="No spaces yet"
        />
      </div>
    </aside>
  );
}

function getSpaceInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}
