"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

// Same stagger variants as SecondaryPanel
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
              <IconMiroMark css={{ width: 24, height: 24, color: navPalette.iconActive }} />
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
            className="flex items-center justify-center w-6 h-6 rounded transition-colors duration-200"
            style={{ color: navPalette.iconMuted }}
            title="Add space"
          >
            <IconPlus css={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Spaces list */}
        {spaces.length > 0 ? (
          <motion.div
            className="flex flex-col gap-0.5"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {spaces.map((space) => {
              const isSpaceActive = pathname.startsWith(`/space/${space.id}`);
              return (
                <motion.div key={space.id} variants={staggerItem}>
                  <Link
                    href={`/space/${space.id}`}
                    className="flex items-center gap-3 h-9 px-3 rounded-lg text-sm transition-colors duration-200"
                    style={{
                      color: isSpaceActive
                        ? navPalette.textPrimary
                        : navPalette.textSecondary,
                      fontWeight: isSpaceActive ? 500 : 400,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = navPalette.hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span
                      className="w-5 h-5 text-xs leading-5 text-center flex-shrink-0 rounded flex items-center justify-center"
                      style={{
                        backgroundColor: navPalette.logoContainer,
                        color: navPalette.textPrimary,
                      }}
                    >
                      {getSpaceInitial(space.name)}
                    </span>
                    <span className="truncate">{space.name}</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <p className="px-3 text-sm" style={{ color: navPalette.iconMuted }}>No spaces yet</p>
        )}
      </div>
    </aside>
  );
}

function getSpaceInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}
