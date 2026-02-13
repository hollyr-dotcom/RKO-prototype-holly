"use client";

import { createContext, useCallback, useRef, useState, useMemo, useEffect, ReactNode } from "react";
import { useAgent, type Message } from "@/hooks/useAgent";
import { useSidebar } from "@/hooks/useSidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { motion, AnimatePresence } from "framer-motion";
import { IconSidebarGlobalOpen } from "@mirohq/design-system-icons";

// Types for canvas state
type ShapeInfo = {
  id: string;
  type: string;
  text?: string;
  color?: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  createdBy: string;
};

type FrameInfo = ShapeInfo & {
  children: ShapeInfo[];
  arrows: ShapeInfo[];
};

type CanvasState = {
  frames: FrameInfo[];
  orphans: ShapeInfo[];
  arrows: ShapeInfo[];
};

type UserEdit = {
  shapeId: string;
  field: string;
  oldValue: string;
  newValue: string;
};

// Tool handler types
type ToolHandler = (toolName: string, args: Record<string, unknown>) => void;
type CanvasStateGetter = () => CanvasState;
type UserEditsGetter = () => UserEdit[];

// Context type
interface ChatContextType {
  messages: Message[];
  append: (message: { role: "user"; content: string }) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  isFullscreenChat: boolean;
  openFullscreen: (fromHome?: boolean) => void;
  closeFullscreen: () => void;
  registerHandlers: (handlers: {
    handleToolCall?: ToolHandler;
    getCanvasState?: CanvasStateGetter;
    getUserEdits?: UserEditsGetter;
  }) => void;
}

export const ChatContext = createContext<ChatContextType | null>(null);

// Default safe handlers
const defaultHandlers = {
  handleToolCall: () => {},
  getCanvasState: () => ({ frames: [], orphans: [], arrows: [] }),
  getUserEdits: () => [],
};

// Plan progress panel component
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
  const completedSteps = isPending ? 0 : plan.currentStep + 1;

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
                <div className="w-4 h-4 flex-shrink-0">
                  <svg className="animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
              {status === 'done' && (
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
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

export function ChatProvider({ children }: { children: ReactNode }) {
  const { navWidth: appSidebarWidth } = useSidebar();
  const [isFullscreenChat, setIsFullscreenChat] = useState(false);
  const [isFromHome, setIsFromHome] = useState(false);
  const isFromHomeRef = useRef(false); // Use ref for immediate updates
  const [chatTitle, setChatTitle] = useState("Untitled");
  const [input, setInput] = useState("");
  const [isPlanPanelVisible, setIsPlanPanelVisible] = useState(true);

  // Ref-based tool handlers that routes can update
  const toolHandlersRef = useRef<{
    handleToolCall: ToolHandler;
    getCanvasState: CanvasStateGetter;
    getUserEdits: UserEditsGetter;
  }>(defaultHandlers);

  // useAgent with ref-based callbacks
  const { messages, append, isLoading, setMessages } = useAgent(
    (toolName, args) => toolHandlersRef.current.handleToolCall(toolName, args),
    () => toolHandlersRef.current.getCanvasState(),
    () => toolHandlersRef.current.getUserEdits(),
    (title) => {
      console.log('[ChatProvider] Title received:', title, 'isFromHomeRef.current:', isFromHomeRef.current);
      if (isFromHomeRef.current) {
        setChatTitle(title);
      }
    }
  );

  // Extract active plan details for progress panel
  const activePlanDetails = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'assistant') continue;

      const planToolIndex = msg.toolInvocations?.findIndex(t => t.toolName === 'confirmPlan');
      if (planToolIndex === undefined || planToolIndex === -1) continue;

      const planTool = msg.toolInvocations![planToolIndex];
      const args = planTool.args as { title: string; steps: string[]; summary: string };

      // Check if execution started
      const toolsAfterPlan = msg.toolInvocations!.slice(planToolIndex + 1);
      const laterMessages = messages.slice(i + 1).filter(m => m.role === 'assistant');
      const laterToolCalls = laterMessages.flatMap(m => m.toolInvocations || []);
      const allToolCalls = [...toolsAfterPlan, ...laterToolCalls];
      const progressCalls = allToolCalls.filter(t => t.toolName === 'showProgress');

      const nextUserMsg = messages.slice(i + 1).find(m => m.role === 'user');
      const userApproved = nextUserMsg?.content?.toLowerCase().includes('approve');
      const hasProgressCalls = progressCalls.length > 0;
      const executionStarted = userApproved || hasProgressCalls;

      if (!executionStarted) {
        // Pending plan — show it but with no progress
        return {
          title: args.title,
          steps: args.steps,
          currentStep: -1,
          pending: true,
        };
      }

      // Calculate current step
      let completedSteps = 0;
      let currentRunningStep = 0;
      progressCalls.forEach(call => {
        const pargs = call.args as { stepNumber?: number; status?: string };
        if (pargs.stepNumber !== undefined) {
          if (pargs.status === 'completed') {
            completedSteps = Math.max(completedSteps, pargs.stepNumber);
          } else if (pargs.status === 'starting') {
            currentRunningStep = pargs.stepNumber;
          }
        }
      });

      const currentStep = isLoading && currentRunningStep > 0
        ? currentRunningStep - 1
        : completedSteps > 0 ? completedSteps - 1 : 0;

      return {
        title: args.title,
        steps: args.steps,
        currentStep: Math.min(currentStep, args.steps.length - 1),
        pending: false,
      };
    }
    return null;
  }, [messages, isLoading]);

  // Register handlers from routes
  const registerHandlers = useCallback((handlers: {
    handleToolCall?: ToolHandler;
    getCanvasState?: CanvasStateGetter;
    getUserEdits?: UserEditsGetter;
  }) => {
    toolHandlersRef.current = {
      ...toolHandlersRef.current,
      ...handlers,
    };
  }, []);

  const openFullscreen = useCallback((fromHome = false) => {
    console.log('[ChatProvider] openFullscreen called with fromHome:', fromHome);
    setIsFullscreenChat(true);
    setIsFromHome(fromHome);
    isFromHomeRef.current = fromHome; // Update ref immediately
    if (fromHome) {
      setChatTitle("Untitled");
    }
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreenChat(false);
    setIsFromHome(false);
    isFromHomeRef.current = false; // Reset ref
  }, []);

  const handleChatSubmit = useCallback((text: string) => {
    // Generate title on first message from home
    const shouldGenerateTitle = isFromHome && messages.length === 0;
    console.log('[ChatProvider] handleChatSubmit - isFromHome:', isFromHome, 'messages.length:', messages.length, 'shouldGenerateTitle:', shouldGenerateTitle);
    append({ role: "user", content: text }, shouldGenerateTitle);
  }, [append, isFromHome, messages.length]);

  const contextValue: ChatContextType = {
    messages,
    append,
    setMessages,
    isLoading,
    isFullscreenChat,
    openFullscreen,
    closeFullscreen,
    registerHandlers,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}

      {/* Fullscreen chat overlay - persists across navigation */}
      <AnimatePresence>
        {isFullscreenChat && (
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-[1000] bg-white flex flex-col"
            style={{ left: appSidebarWidth, transition: 'left 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)' }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: [0.25, 0.1, 0.25, 1.0], duration: 0.25 }}
          >
            {/* Header */}
            <div className="border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center justify-between p-4">
                {isFromHome ? (
                  <>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <motion.span
                        key={chatTitle}
                        className="text-sm font-medium text-gray-900 block"
                        initial={{ clipPath: "inset(0 100% 0 0)" }}
                        animate={{ clipPath: "inset(0 0% 0 0)" }}
                        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        {chatTitle}
                      </motion.span>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      Move to space
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={closeFullscreen}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      title="Back"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm font-medium text-gray-900">Chat</span>
                    <span className="text-xs text-gray-500">with AI</span>
                  </div>
                )}
                {!isFromHome && (
                  <button
                    onClick={closeFullscreen}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    title="Close"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Content area: chat + plan side by side */}
            <div className="flex flex-1 min-h-0 overflow-hidden relative">
              <motion.div
                className="flex-1 overflow-hidden"
                animate={{ paddingRight: (activePlanDetails && isPlanPanelVisible) ? 320 : 0 }}
                transition={{ type: "tween", ease: [0.25, 0.1, 0.25, 1.0], duration: 0.25 }}
              >
                <ChatPanel
                  hideHeader={true}
                  isFullscreen={true}
                  messages={messages}
                  input={input}
                  setInput={setInput}
                  onSubmit={handleChatSubmit}
                  isLoading={isLoading}
                  onClose={closeFullscreen}
                  onExitFullscreen={closeFullscreen}
                />
              </motion.div>

              {/* Show plan button - positioned to match hide button in panel header */}
              {activePlanDetails && !isPlanPanelVisible && (
                <button
                  onClick={() => setIsPlanPanelVisible(true)}
                  className="absolute top-3 right-4 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 z-10"
                  title="Show plan"
                >
                  <IconSidebarGlobalOpen css={{ transform: 'rotate(180deg)', width: 18, height: 18 }} />
                </button>
              )}

              {/* Plan progress panel */}
              {activePlanDetails && (
                <motion.div
                  className="absolute top-0 right-0 h-full"
                  animate={{ x: isPlanPanelVisible ? 0 : "100%" }}
                  transition={{ type: "tween", ease: [0.25, 0.1, 0.25, 1.0], duration: 0.25 }}
                  style={{ width: 320 }}
                >
                  <PlanProgressPanel
                    plan={activePlanDetails}
                    isLoading={isLoading}
                    onToggleVisibility={() => setIsPlanPanelVisible(false)}
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ChatContext.Provider>
  );
}
