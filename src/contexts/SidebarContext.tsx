"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  /** Width of the sidebar in pixels (0 collapsed/hidden, 240 expanded) */
  sidebarWidth: number;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
  sidebarWidth: 0,
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 0 : 240;

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
