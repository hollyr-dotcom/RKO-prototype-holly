"use client";

import { useState } from "react";
import { useChat } from "@/hooks/useChat";
import { useSidebar } from "@/hooks/useSidebar";
import { ChatPanel } from "./ChatPanel";
import {
  IconSidebarGlobalOpen,
  IconSpinner,
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
    <div className="w-80 bg-gray-50 border-l border-gray-200 h-full flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-medium text-gray-900">Plan</p>
        </div>

        {onToggleVisibility && (
          <button
            onClick={onToggleVisibility}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
            title="Hide plan"
          >
            <IconSidebarGlobalOpen css={{ transform: 'rotate(180deg)', width: 18, height: 18 }} />
          </button>
        )}
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
                <div className="w-4 h-4 flex-shrink-0 text-blue-500 animate-spin">
                  <IconSpinner css={{ width: 16, height: 16 }} />
                </div>
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
  const { sidebarWidth: appSidebarWidth } = useSidebar();
  const [isPlanPanelVisible, setIsPlanPanelVisible] = useState(true);

  const handleSubmit = (text: string) => {
    append({ role: "user", content: text });
  };

  const isMinimized = chatMode === "minimized";
  const isSidePanel = chatMode === "sidepanel";
  const isFullscreen = chatMode === "fullscreen";

  // Compute the left edge of the fixed chat container
  const chatLeft = isMinimized
    ? "100%"
    : isFullscreen
      ? `${appSidebarWidth}px`
      : `calc(100% - ${PANEL_WIDTH}px)`;

  return (
    <>
      {/* Floating spark button — visible only when chat is minimized */}
      {isMinimized && (
        <button
          onClick={() => setChatMode("sidepanel")}
          className="fixed top-4 right-4 z-[9900] w-10 h-10 bg-gray-900 rounded-full shadow-md flex items-center justify-center text-white hover:bg-gray-700 hover:shadow-lg transition-all"
          title="Open AI chat"
        >
          <IconSingleSparksFilled css={{ width: 20, height: 20 }} />
        </button>
      )}

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
          transition: `left ${TRANSITION}`,
          visibility: isMinimized ? "hidden" : "visible",
          pointerEvents: isMinimized ? "none" : "auto",
          zIndex: 10000,
        }}
        className="border-l border-gray-200"
      >
        <div className="flex h-full">
          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
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
            />
          </div>

          {/* Plan sidebar — fullscreen only, slides in/out */}
          {isFullscreen && activePlanDetails && (
            <div
              style={{
                width: PLAN_SIDEBAR_WIDTH,
                marginRight: isPlanPanelVisible ? 0 : -PLAN_SIDEBAR_WIDTH,
                transition: `margin-right ${TRANSITION}`,
              }}
              className="flex-shrink-0"
            >
              <PlanProgressPanel
                plan={activePlanDetails}
                isLoading={isLoading}
                onToggleVisibility={() => setIsPlanPanelVisible(false)}
              />
            </div>
          )}
        </div>

        {/* Show plan toggle — when plan exists but panel is hidden */}
        {isFullscreen && activePlanDetails && !isPlanPanelVisible && (
          <button
            onClick={() => setIsPlanPanelVisible(true)}
            className="absolute top-3 right-4 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 z-10"
            title="Show plan"
          >
            <IconSidebarGlobalOpen css={{ transform: 'rotate(180deg)', width: 18, height: 18 }} />
          </button>
        )}
      </div>
    </>
  );
}
