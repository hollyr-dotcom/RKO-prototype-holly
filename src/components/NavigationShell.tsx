"use client";

import { useSidebar } from "@/hooks/useSidebar";
import { useChat } from "@/hooks/useChat";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatShell } from "@/components/ChatShell";

// Shared transition for content surface properties that sync with the sidebar collapse
const contentTransition = "border-radius 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), background-color 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)";

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed, showSecondary, navPalette } = useSidebar();
  const { chatMode, resizeHovered } = useChat();

  const isChatSidePanel = chatMode === "sidepanel";
  // Content surface gets rounding whenever the navigation is expanded
  const contentHasRounding = !isCollapsed;

  return (
    <div className="flex h-screen overflow-x-hidden" style={{ backgroundColor: navPalette.base }}>
      {/* Navigation panels — stays mounted, animates width to 0 when collapsed */}
      <AppSidebar />

      {/* Wrapper: horizontal flex so ChatShell spacer can push main content left */}
      <div
        className="flex-1 flex relative z-10"
        style={{
          backgroundColor: !isCollapsed
            ? (showSecondary || isChatSidePanel)
              ? "white"
              : navPalette.base
            : isChatSidePanel
              ? "white"
              : undefined,
          transition: contentTransition,
        }}
      >
        <main
          className="h-full flex-1 flex flex-col overflow-hidden bg-white"
          style={{
            borderRadius: contentHasRounding && isChatSidePanel
              ? "1.5rem"
              : contentHasRounding
                ? "1.5rem 0 0 1.5rem"
                : isChatSidePanel
                  ? "0 1.5rem 1.5rem 0"
                  : "0",
            border: `1px solid ${resizeHovered ? "#d1d5db" : "#e5e7eb"}`,
            boxShadow: "0 0 24px rgba(0, 0, 0, 0.02)",
            transition: `${contentTransition}, border-color 0.15s ease`,
          }}
        >
          {children}
        </main>

        {/* Chat panel — spark button (fixed), spacer (flex), chat container (fixed) */}
        <ChatShell />
      </div>
    </div>
  );
}
