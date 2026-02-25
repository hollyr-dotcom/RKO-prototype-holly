"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  IconHouse,
  IconChat,
  IconCheckBoxLines,
  IconMagnifyingGlass,
} from "@mirohq/design-system-icons";
import { useSidebar } from "@/hooks/useSidebar";
import { RAIL_WIDTH } from "@/providers/SidebarProvider";

const navItems = [
  { id: "home", label: "Home", href: "/", icon: IconHouse },
  { id: "chat", label: "Chat", href: "#", icon: IconChat },
  { id: "tasks", label: "Tasks", href: "/tasks", icon: IconCheckBoxLines },
  { id: "search", label: "Search", href: "#", icon: IconMagnifyingGlass },
];

// spring.snappy from motion guidelines
const indicatorTransition = { duration: 0.35, ease: [0.65, 0, 0.31, 1] as [number, number, number, number] };

export function PrimaryRail() {
  const pathname = usePathname();
  const { navPalette } = useSidebar();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Determine which item gets the indicator: hovered item wins, else active item
  const activeId = navItems.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href) && item.href !== "#"
  )?.id ?? null;

  const highlightedId = hoveredId ?? activeId;

  return (
    <aside
      className="h-full flex flex-col items-center py-4.5 px-3 gap-5 flex-shrink-0"
      style={{ width: RAIL_WIDTH, backgroundColor: navPalette.base }}
    >
      {/* Brand icon in rounded-lg tonal container */}
      <Link href="/" className="flex-shrink-0">
        <div
          className="w-10 h-10 flex items-center justify-center shadow-sm rounded-lg"
          style={{ backgroundColor: "#7A2CDD" }}
        >
          <img src="/flexfund.svg" alt="FlexFund" width={24} height={24} />
        </div>
      </Link>

      {/* Nav icon group */}
      <nav
        className="flex flex-col gap-1 w-10"
        onMouseLeave={() => setHoveredId(null)}
      >
        {navItems.map((item) => {
          const isHighlighted = highlightedId === item.id;
          const isActive = activeId === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              className="relative w-10 h-10 flex items-center justify-center rounded-full"
              onMouseEnter={() => setHoveredId(item.id)}
            >
              {/* Animated indicator circle */}
              {isHighlighted && (
                <motion.div
                  layoutId="rail-indicator"
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
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
