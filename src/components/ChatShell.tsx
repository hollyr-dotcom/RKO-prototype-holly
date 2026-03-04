"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import { useSidebar } from "@/hooks/useSidebar";
import { ChatPanel } from "./ChatPanel";
import {
  IconSidebarGlobalOpen,
  IconCheckMark,
  IconSingleSparksFilled,
} from "@mirohq/design-system-icons";

const DEFAULT_PANEL_WIDTH = 384;
const MIN_PANEL_WIDTH = 300;
const MAX_PANEL_WIDTH = 600;
const PANEL_GAP = 8;
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
      {/* Title */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900">{plan.title}</p>
      </div>

      {/* Steps with inset divider lines */}
      <div className="overflow-y-auto flex-1 pb-4">
        {plan.steps.map((step, index) => {
          const status = getStepStatus(index);
          return (
            <div key={index}>
              <div className="mx-5 border-t border-gray-100" />
              <div className="flex items-center gap-3 px-5 py-3 text-sm">
                {status === 'pending' && (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                {status === 'running' && (
                  <div className="w-5 h-5 flex-shrink-0 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                )}
                {status === 'done' && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white">
                    <IconCheckMark css={{ width: 12, height: 12 }} />
                  </div>
                )}
                <span className={status === 'done' ? 'text-gray-400' : status === 'running' ? 'text-gray-900' : 'text-gray-600'}>
                  {step}
                </span>
              </div>
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
    setResizeHovered,
  } = useChat();
  const { navWidth: appSidebarWidth, toggleSidebar, isCollapsed } = useSidebar();
  const [isPlanPanelVisible, setIsPlanPanelVisible] = useState(true);
  const [shouldTransition, setShouldTransition] = useState(true);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(DEFAULT_PANEL_WIDTH);

  const containerRef = useRef<HTMLDivElement>(null);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    // 50% of the wrapper (canvas + sidepanel area) as max
    const parent = containerRef.current?.parentElement;
    const maxWidth = parent ? Math.floor(parent.clientWidth / 2) : MAX_PANEL_WIDTH;

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartX.current - ev.clientX;
      const newWidth = Math.min(maxWidth, Math.max(MIN_PANEL_WIDTH, dragStartWidth.current + delta));
      setPanelWidth(newWidth);
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [panelWidth]);

  const handleSubmit = (text: string) => {
    append({ role: "user", content: text });
  };

  const isMinimized = chatMode === "minimized";
  const isSidePanel = chatMode === "sidepanel";
  const isFullscreen = chatMode === "fullscreen";
  const isHomePage = pathname === "/";
  const isInsightsPage = pathname.startsWith("/insights/");

  // Auto-minimize when navigating to insights pages (they have their own AI panel)
  useEffect(() => {
    if (isInsightsPage && !isMinimized) {
      setChatMode("minimized");
    }
  }, [isInsightsPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for immediate open flag and disable transition BEFORE paint
  useLayoutEffect(() => {
    if (isFullscreen && typeof window !== "undefined") {
      const immediate = sessionStorage.getItem("chatOpenImmediate");
      if (immediate === "true") {
        setShouldTransition(false);
        sessionStorage.removeItem("chatOpenImmediate");
        requestAnimationFrame(() => {
          setShouldTransition(true);
        });
      }
    }
  }, [isFullscreen]);

  // Hide entirely on insights pages — must be after all hooks
  if (isInsightsPage) return null;

  const chatPanel = (
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
      onToggleSidebar={toggleSidebar}
      isSidebarCollapsed={isCollapsed}
    />
  );

  // Fullscreen: fixed overlay (no AnimatePresence needed — handled by CSS transition)
  if (isFullscreen) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          left: `${appSidebarWidth}px`,
          transition: shouldTransition ? `left ${TRANSITION}` : "none",
          zIndex: 10000,
          overflow: "hidden",
        }}
      >
        {chatPanel}
      </div>
    );
  }

  // Sidepanel: same pattern as AppSidebar — always in DOM, animate width, initial={false}
  // Match AppSidebar's exact transition: 0.3s, same easing
  const sidepanelTransition = isDragging.current
    ? { duration: 0 }
    : { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] };

  return (
    <motion.div
      ref={containerRef}
      className="h-full flex-shrink-0 relative"
      initial={false}
      animate={{ width: isSidePanel ? panelWidth : 0 }}
      transition={sidepanelTransition}
      style={{ overflow: "clip", overflowClipMargin: isSidePanel ? 12 : 0 }}
    >
      {/* Resize handle — sits on the canvas/panel border */}
      {isSidePanel && (
        <div
          onMouseDown={onResizeStart}
          onMouseEnter={() => setResizeHovered(true)}
          onMouseLeave={() => setResizeHovered(false)}
          className="absolute top-0 bottom-0 z-[600] flex items-center justify-center cursor-col-resize group"
          style={{ width: 20, left: -10 }}
        >
          <div className="w-2 h-10 rounded-full bg-white border border-gray-200 transition-colors group-hover:bg-gray-100 group-hover:border-gray-300" />
        </div>
      )}

      <div
        className="h-full bg-white overflow-hidden"
        style={{
          width: panelWidth,
          borderRadius: "1.5rem 0 0 1.5rem",
        }}
      >
        {chatPanel}
      </div>
    </motion.div>
  );
}
