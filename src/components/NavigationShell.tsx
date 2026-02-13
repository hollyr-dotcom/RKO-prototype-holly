"use client";

import { useSidebar } from "@/hooks/useSidebar";
import { AppSidebar } from "@/components/AppSidebar";

// Shared transition for content surface properties that sync with the sidebar collapse
const contentTransition = "border-radius 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), background-color 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)";

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed, showSecondary, navPalette } = useSidebar();

  // Content surface gets rounding whenever the navigation is expanded
  const contentHasRounding = !isCollapsed;

  return (
    <div className="flex h-screen" style={{ backgroundColor: navPalette.base }}>
      {/* Navigation panels — stays mounted, animates width to 0 when collapsed */}
      <AppSidebar />

      {/* Wrapper sets background to mask the underlying color behind rounded corners */}
      <div
        className="flex-1 relative z-10"
        style={{
          backgroundColor: !isCollapsed
            ? showSecondary
              ? "white"
              : navPalette.base
            : undefined,
          transition: contentTransition,
        }}
      >
        <main
          className="h-full flex flex-col overflow-hidden bg-white"
          style={{
            borderRadius: contentHasRounding ? "1.5rem 0 0 1.5rem" : "0",
            border: "1px solid #f4f4f4",
            boxShadow: "0 0 24px rgba(0, 0, 0, 0.02)",
            transition: contentTransition,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
