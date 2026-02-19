"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { useSidebar } from "@/hooks/useSidebar";
import { ChatPanel } from "./ChatPanel";
import {
  IconSidebarGlobalOpen,
  IconCheckMark,
  IconSingleSparksFilled,
} from "@mirohq/design-system-icons";

const PANEL_WIDTH = 384;
const PLAN_SIDEBAR_WIDTH = 320;
const TRANSITION = "0.25s cubic-bezier(0.25, 0.1, 0.25, 1)";

// Plan progress panel
function PlanProgressPanel({
  plan,
  isLoading,
  onToggleVisibility,
}: {
  plan: { title: string; steps: string[]; currentStep: number; pending?: boolean } | null;
  isLoading: boolean;
  onToggleVisibility?: () => void;
}) {
  if (!plan) return null;

  const isPending = plan.pending || plan.currentStep < 0;

  const getStepStatus = (index: number): 'pending' | 'running' | 'done' => {
    if (isPending) return 'pending';
    if (index < plan.currentStep) return 'done';
    if (index === plan.currentStep && isLoading) return 'running';
    return 'pending';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header — close button handled by ChatPanel overlay */}
      <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-medium text-gray-900">Plan</p>
        </div>
        {/* Spacer for the toggle button rendered by ChatPanel */}
        <div className="w-7 h-7 flex-shrink-0" />
      </div>

      {/* Steps */}
      <div className="pl-6 pr-4 pb-6 overflow-y-auto flex-1">
        {plan.steps.map((step, index) => {
          const status = getStepStatus(index);
          return (
            <div key={index} className="flex items-center gap-2 py-1.5 text-xs">
              {status === 'pending' && (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
              )}
              {status === 'running' && (
                <div className="w-4 h-4 flex-shrink-0 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              )}
              {status === 'done' && (
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white">
                  <IconCheckMark css={{ width: 10, height: 10 }} />
                </div>
              )}
              <span className={status === 'done' ? 'text-gray-400 line-through' : status === 'running' ? 'text-blue-700' : 'text-gray-600'}>
                {index + 1}. {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChatShell() {
  const pathname = usePathname();
  const {
    chatMode,
    setChatMode,
    startNewChat,
    messages,
    isLoading,
    input,
    setInput,
    append,
    activePlanDetails,
    navigateToFrames,
    navigateToCanvas,
  } = useChat();
  const { navWidth: appSidebarWidth } = useSidebar();
  const [isPlanPanelVisible, setIsPlanPanelVisible] = useState(true);
  const [shouldTransition, setShouldTransition] = useState(true);

  const handleSubmit = (text: string) => {
    append({ role: "user", content: text });
  };

  const isMinimized = chatMode === "minimized";
  const isSidePanel = chatMode === "sidepanel";
  const isFullscreen = chatMode === "fullscreen";
  const isHomePage = pathname === "/";

  // Check for immediate open flag and disable transition BEFORE paint
  // useLayoutEffect fires synchronously after DOM commit but before browser paint,
  // so the transition is killed before anything is visible on screen
  useLayoutEffect(() => {
    if (isFullscreen && typeof window !== "undefined") {
      const immediate = sessionStorage.getItem("chatOpenImmediate");
      if (immediate === "true") {
        setShouldTransition(false);
        sessionStorage.removeItem("chatOpenImmediate");
        // Re-enable transitions after the browser has painted the no-transition state
        requestAnimationFrame(() => {
          setShouldTransition(true);
        });
      }
    }
  }, [isFullscreen]);

  // Compute the left edge of the fixed chat container
  const chatLeft = isMinimized
    ? "100%"
    : isFullscreen
      ? `${appSidebarWidth}px`
      : `calc(100% - ${PANEL_WIDTH}px)`;

  return (
    <>

      {/* Flex spacer — empty div that pushes <main> content left in sidepanel mode */}
      <div
        style={{
          width: isSidePanel ? PANEL_WIDTH : 0,
          transition: `width ${TRANSITION}`,
          flexShrink: 0,
        }}
      />

      {/* Fixed chat container — single ChatPanel that animates its left edge */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          left: chatLeft,
          transition: shouldTransition ? `left ${TRANSITION}` : "none",
          visibility: isMinimized ? "hidden" : "visible",
          pointerEvents: isMinimized ? "none" : "auto",
          zIndex: 10000,
        }}
        className="border-l border-gray-200"
      >
        <ChatPanel
          isFullscreen={isFullscreen}
          isVisible={!isMinimized}
          onClose={() => setChatMode("minimized")}
          onCollapse={() => setChatMode("minimized")}
          onExpand={() => setChatMode("fullscreen")}
          onExitFullscreen={() => setChatMode("sidepanel")}
          onNewChat={startNewChat}
          messages={messages}
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onNavigateToFrames={navigateToFrames}
          onNavigateToCanvas={navigateToCanvas}
          planPanel={isFullscreen && activePlanDetails ? (
            <PlanProgressPanel
              plan={activePlanDetails}
              isLoading={isLoading}
              onToggleVisibility={() => setIsPlanPanelVisible(false)}
            />
          ) : undefined}
          isPlanPanelVisible={isPlanPanelVisible}
          onTogglePlanPanel={() => setIsPlanPanelVisible(!isPlanPanelVisible)}
        />
      </div>
    </>
  );
}
