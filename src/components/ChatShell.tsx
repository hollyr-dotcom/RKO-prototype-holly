"use client";

import { useState, useEffect, useLayoutEffect } from "react";
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

const PANEL_WIDTH = 384;
const PANEL_GAP = 16;
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
  } = useChat();
  const { navWidth: appSidebarWidth, toggleSidebar, isCollapsed } = useSidebar();
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

  // Sidepanel: outer container animates width so canvas reflows,
  // inner panel has fixed width and translates in/out
  return (
    <AnimatePresence>
      {isSidePanel && (
        <motion.div
          key="chat-sidepanel-container"
          className="h-full flex-shrink-0 overflow-hidden"
          initial={{ width: 0, marginLeft: 0 }}
          animate={{ width: PANEL_WIDTH + PANEL_GAP, marginLeft: 0 }}
          exit={{ width: 0, marginLeft: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.div
            className="h-full bg-white overflow-hidden"
            initial={{ x: PANEL_WIDTH + PANEL_GAP }}
            animate={{ x: 0 }}
            exit={{ x: PANEL_WIDTH + PANEL_GAP }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              width: PANEL_WIDTH,
              marginLeft: PANEL_GAP,
              borderRadius: "1.5rem 0 0 1.5rem",
              border: "1px solid #e5e7eb",
              borderRight: "none",
            }}
          >
            {chatPanel}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
