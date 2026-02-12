"use client";

import { createContext, useState, useCallback, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

export const EXPANDED_WIDTH = 240;
export const COLLAPSED_WIDTH = 52;

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  sidebarWidth: number;
}

export const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Collapse sidebar when on home page
  useEffect(() => {
    if (pathname === "/") {
      setIsCollapsed(true);
    }
  }, [pathname]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const sidebarWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}
