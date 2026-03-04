"use client";

import { createContext, useState, useCallback, useMemo, useEffect, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { generateNavPalette, type NavPalette } from "@/lib/nav-palette";

// Navigation dimension constants (from Figma)
export const RAIL_WIDTH = 72;
export const SECONDARY_WIDTH = 240;
export const EXPANDED_PRIMARY_WIDTH = 260;

// Default navigation base color — customisable per-prototype
const DEFAULT_NAV_COLOR = "#FFFFFF";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  showSecondary: boolean;
  navWidth: number;
  navPalette: NavPalette;
}

export const SidebarContext = createContext<SidebarContextType | null>(null);

interface SidebarProviderProps {
  children: ReactNode;
  /** Base hex color for the primary navigation. Defaults to #18f9e3 */
  navColor?: string;
}

export function SidebarProvider({ children, navColor = DEFAULT_NAV_COLOR }: SidebarProviderProps) {
  const pathname = usePathname();
  const isOnCanvas = pathname.includes("/canvas/");
  const [isCollapsed, setIsCollapsed] = useState(isOnCanvas);

  // Auto-collapse when navigating to a canvas, auto-expand when leaving
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    const wasOnCanvas = prevPathnameRef.current.includes("/canvas/");
    prevPathnameRef.current = pathname;

    if (isOnCanvas && !wasOnCanvas) {
      setIsCollapsed(true);
    } else if (!isOnCanvas && wasOnCanvas) {
      setIsCollapsed(false);
    }
  }, [pathname, isOnCanvas]);

  // Secondary panel is visible when inside a space or insights route
  const showSecondary = !isCollapsed && (pathname.startsWith("/space/") || pathname.startsWith("/insights/"));

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // Total navigation width: collapsed = 0, space = rail + secondary, home = expanded primary
  const navWidth = isCollapsed
    ? 0
    : showSecondary
      ? RAIL_WIDTH + SECONDARY_WIDTH
      : EXPANDED_PRIMARY_WIDTH;

  // Generate tonal palette from the base nav color
  const navPalette = useMemo(() => generateNavPalette(navColor), [navColor]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, showSecondary, navWidth, navPalette }}>
      {children}
    </SidebarContext.Provider>
  );
}
