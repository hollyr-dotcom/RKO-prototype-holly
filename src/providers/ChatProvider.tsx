"use client";

import { createContext, useCallback, useRef, useState, useMemo, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAgent, type Message } from "@/hooks/useAgent";

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
type FrameNavigator = (frameNames: string[]) => void;

// Workspace context sent to the API
export type WorkspaceContext = {
  currentSurface: string;
  canvasId?: string;
  spaceId?: string;
  availableSpaces: Array<{ id: string; name: string }>;
  availableCanvases: Array<{ id: string; name: string; spaceId: string }>;
};

// Chat mode enum — single source of truth
export type ChatMode = "minimized" | "sidepanel" | "fullscreen";

// Context type
interface ChatContextType {
  messages: Message[];
  append: (message: { role: "user"; content: string }, generateTitle?: boolean) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  chatMode: ChatMode;
  setChatMode: (mode: ChatMode) => void;
  startNewChat: () => void;
  navigateToFrames: FrameNavigator;
  navigateToCanvas: (canvasId?: string) => void;
  registerHandlers: (handlers: {
    handleToolCall?: ToolHandler;
    getCanvasState?: CanvasStateGetter;
    getUserEdits?: UserEditsGetter;
    navigateToFrames?: FrameNavigator;
  }, isCanvasReady?: boolean) => void;
  activePlanDetails: {
    title: string;
    steps: string[];
    currentStep: number;
    pending?: boolean;
  } | null;
  input: string;
  setInput: (input: string) => void;
  activeCanvas: { canvasId: string; spaceId: string } | null;
  setActiveCanvas: (canvas: { canvasId: string; spaceId: string } | null) => void;
  openFullscreen: (immediate?: boolean) => void;
  closeFullscreen: () => void;
}

export const ChatContext = createContext<ChatContextType | null>(null);

// Default safe handlers
const defaultHandlers = {
  handleToolCall: () => {},
  getCanvasState: () => ({ frames: [], orphans: [], arrows: [] }),
  getUserEdits: () => [],
  navigateToFrames: () => {},
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [chatMode, setChatModeState] = useState<ChatMode>("minimized");

  // Restore chatMode from localStorage after hydration (but not on home page)
  useEffect(() => {
    if (pathname === "/") {
      // Always start minimized on home page
      setChatModeState("minimized");
      return;
    }

    // Check for canvas handoff from navigation
    const handoffData = sessionStorage.getItem("canvas-handoff");
    if (handoffData) {
      try {
        const handoff = JSON.parse(handoffData);
        // Set chat mode based on handoff data — also update localStorage to stay in sync
        const mode = handoff.isFullscreenChat ? "fullscreen" : "sidepanel";
        setChatModeState(mode);
        localStorage.setItem("chatMode", mode);
        // Clear handoff after using it
        sessionStorage.removeItem("canvas-handoff");
        return;
      } catch {
        // If parsing fails, fall through to normal restoration
      }
    }

    const stored = localStorage.getItem("chatMode");
    if (stored === "sidepanel" || stored === "fullscreen") {
      setChatModeState(stored);
    }
  }, [pathname]);
  const [input, setInput] = useState("");
  const [activeCanvas, setActiveCanvasState] = useState<{ canvasId: string; spaceId: string } | null>(null);

  // Ref-based tool handlers that routes can update
  const toolHandlersRef = useRef<{
    handleToolCall: ToolHandler;
    getCanvasState: CanvasStateGetter;
    getUserEdits: UserEditsGetter;
    navigateToFrames: FrameNavigator;
  }>(defaultHandlers);

  // Navigation queuing — tool calls during navigation are buffered
  const isNavigatingRef = useRef(false);
  const pendingToolCallsRef = useRef<Array<{ toolName: string; args: Record<string, unknown> }>>([]);
  const pendingFrameNavigationRef = useRef<string[] | null>(null);
  // Track which canvas we're navigating TO (prevents double-navigation)
  const navigationTargetRef = useRef<string | null>(null);

  // Workspace data — fetched on mount and navigation
  const workspaceDataRef = useRef<{
    spaces: Array<{ id: string; name: string }>;
    canvases: Array<{ id: string; name: string; spaceId: string }>;
  }>({ spaces: [], canvases: [] });

  useEffect(() => {
    Promise.all([
      fetch("/api/spaces").then(r => r.json()),
      fetch("/api/canvases").then(r => r.json()),
    ]).then(([spacesData, canvasesData]) => {
      const spaces = Array.isArray(spacesData) ? spacesData : spacesData.spaces || [];
      const canvases = Array.isArray(canvasesData) ? canvasesData : canvasesData.canvases || [];
      workspaceDataRef.current = {
        spaces: spaces.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })),
        canvases: canvases.map((c: { id: string; name: string; spaceId: string }) => ({ id: c.id, name: c.name, spaceId: c.spaceId })),
      };
    }).catch(() => {
      // Silently handle fetch failures
    });
  }, [pathname]);

  // Build workspace context for the API
  const getWorkspaceContext = useCallback((): WorkspaceContext => {
    let currentSurface = "home";
    let canvasId: string | undefined;
    let spaceId: string | undefined;

    const parts = pathname.split("/");
    if (parts[1] === "space") {
      spaceId = parts[2];
      if (parts[3] === "canvas" && parts[4]) {
        canvasId = parts[4];
        currentSurface = "canvas";
      } else {
        currentSurface = "space";
      }
    }

    return {
      currentSurface,
      canvasId,
      spaceId,
      availableSpaces: workspaceDataRef.current.spaces,
      availableCanvases: workspaceDataRef.current.canvases,
    };
  }, [pathname]);

  // Track the canvas for this session (set when createCanvas result arrives or auto-created)
  const sessionCanvasRef = useRef<{ canvasId: string; spaceId: string } | null>(null);
  // Track pathname in a ref so the callback always sees the latest value
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Canvas tools that need a Canvas component to be mounted
  const CANVAS_TOOLS = ['createLayout', 'createSticky', 'createText', 'createShape', 'createFrame', 'createArrow', 'createWorkingNote', 'deleteItem', 'updateSticky', 'moveItem', 'organizeIntoFrame', 'createDocument', 'createDataTable', '_streaming_start', '_streaming_scalars', '_streaming_item', '_streaming_content', '_streaming_done'];

  // Workspace-aware tool call handler — intercepts navigation tools, queues during navigation
  const handleToolCallWithWorkspace = useCallback((toolName: string, args: Record<string, unknown>) => {
    // Server-side tool result — the server already created the canvas, navigate to it
    if (toolName === "createCanvas_result") {
      const { canvasId, spaceId, navigate } = args as { canvasId: string; spaceId: string; navigate?: boolean };
      if (navigate === false) return;
      sessionCanvasRef.current = { canvasId, spaceId: spaceId || "" };
      if (canvasId) {
        isNavigatingRef.current = true;
        navigationTargetRef.current = canvasId;
        sessionStorage.setItem("canvas-handoff", JSON.stringify({ isFullscreenChat: false }));
        router.push(`/space/${spaceId || "unassigned"}/canvas/${canvasId}`);
      }
      return;
    }

    // createCanvas tool call — server creates the canvas, we just flag as navigating
    // so subsequent tool calls get queued until we arrive at the canvas page
    if (toolName === "createCanvas") {
      const { navigate } = args as { navigate?: boolean };
      if (navigate !== false) {
        isNavigatingRef.current = true;
      }
      return;
    }

    if (toolName === "navigateToCanvas") {
      const { canvasId } = args as { canvasId: string };
      isNavigatingRef.current = true;
      navigationTargetRef.current = canvasId;
      const canvas = workspaceDataRef.current.canvases.find(c => c.id === canvasId);
      const space = canvas?.spaceId || "unassigned";
      router.push(`/space/${space}/canvas/${canvasId}`);
      return;
    }

    // SAFETY NET: canvas tool arrived but we're NOT on a canvas page and NOT already navigating
    // → auto-create a canvas and navigate, queue this tool call for later
    if (CANVAS_TOOLS.includes(toolName) && !pathnameRef.current.includes('/canvas/') && !isNavigatingRef.current) {
      isNavigatingRef.current = true;
      pendingToolCallsRef.current.push({ toolName, args });
      // If on home page, store handoff so chat transitions from fullscreen → sidepanel
      if (pathnameRef.current === "/") {
        sessionStorage.setItem("canvas-handoff", JSON.stringify({ isFullscreenChat: false }));
      }
      fetch('/api/canvases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'AI Canvas', prompt: latestUserPromptRef.current }),
      })
        .then(r => r.json())
        .then(canvas => {
          sessionCanvasRef.current = { canvasId: canvas.id, spaceId: canvas.spaceId || '' };
          navigationTargetRef.current = canvas.id;
          router.push(`/space/${canvas.spaceId || 'unassigned'}/canvas/${canvas.id}`);
        })
        .catch(() => { isNavigatingRef.current = false; });
      return;
    }

    // For canvas tools: queue if navigating, otherwise execute immediately
    if (isNavigatingRef.current) {
      pendingToolCallsRef.current.push({ toolName, args });
    } else {
      toolHandlersRef.current.handleToolCall(toolName, args);
    }
  }, [router]);

  // Track the latest user prompt so the safety net can generate an intelligent canvas name
  const latestUserPromptRef = useRef<string>('');

  // useAgent with workspace-aware tool handler
  const { messages, append: rawAppend, isLoading, setMessages } = useAgent(
    handleToolCallWithWorkspace,
    () => toolHandlersRef.current.getCanvasState(),
    () => toolHandlersRef.current.getUserEdits(),
    undefined, // onTitleGenerated
    getWorkspaceContext
  );

  // Wrap append to capture the latest user prompt
  const append = useCallback(async (message: { role: "user"; content: string }, generateTitle?: boolean) => {
    latestUserPromptRef.current = message.content;
    return rawAppend(message, generateTitle);
  }, [rawAppend]);

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
        return {
          title: args.title,
          steps: args.steps,
          currentStep: -1,
          pending: true,
        };
      }

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

      // Plan is complete if all steps marked done OR a checkpoint was called (AI wraps up)
      const hasCheckpoint = allToolCalls.some(t => t.toolName === 'checkpoint');
      const planComplete = completedSteps >= args.steps.length || hasCheckpoint;
      if (planComplete) {
        // Check if user sent a NEW request after completion — dismiss the plan panel
        const laterUserMsgs = messages.slice(i + 1).filter(m => m.role === 'user');
        const lastUserMsg = laterUserMsgs[laterUserMsgs.length - 1];
        const isNewRequest = lastUserMsg
          && !lastUserMsg.content?.toLowerCase().includes('approve')
          && lastUserMsg.content?.toLowerCase() !== 'continue';
        if (isNewRequest) {
          return null; // Plan is done and dismissed — don't show progress panel
        }
      }

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

  // Navigate to frames — if on canvas, zoom directly; if not, navigate there first
  const navigateToFrames = useCallback<FrameNavigator>((frameNames) => {
    const isOnCanvas = pathname.includes('/canvas/');
    if (isOnCanvas) {
      toolHandlersRef.current.navigateToFrames(frameNames);
      return;
    }

    // Not on a canvas — navigate to session canvas, then zoom after Canvas mounts
    pendingFrameNavigationRef.current = frameNames;

    if (sessionCanvasRef.current) {
      const { canvasId, spaceId } = sessionCanvasRef.current;
      router.push(`/space/${spaceId || 'unassigned'}/canvas/${canvasId}`);
    } else {
      // No session canvas yet — find most recently created via API
      fetch('/api/canvases')
        .then(r => r.json())
        .then(data => {
          const canvases = Array.isArray(data) ? data : [];
          if (canvases.length > 0) {
            const canvas = canvases[canvases.length - 1];
            sessionCanvasRef.current = { canvasId: canvas.id, spaceId: canvas.spaceId || '' };
            router.push(`/space/${canvas.spaceId || 'unassigned'}/canvas/${canvas.id}`);
          }
        })
        .catch(() => {});
    }
  }, [pathname, router]);

  // Navigate to a specific canvas (by ID) or the current session canvas
  const navigateToCanvas = useCallback((canvasId?: string) => {
    if (canvasId) {
      const canvas = workspaceDataRef.current.canvases.find(c => c.id === canvasId);
      const space = canvas?.spaceId || "unassigned";
      router.push(`/space/${space}/canvas/${canvasId}`);
    } else if (sessionCanvasRef.current) {
      const { canvasId: cid, spaceId } = sessionCanvasRef.current;
      router.push(`/space/${spaceId || "unassigned"}/canvas/${cid}`);
    }
  }, [router]);

  // Register handlers from routes — also drains pending queue after navigation
  // isCanvasReady: only the Canvas component passes true — signals it's safe to drain pending tools
  const registerHandlers = useCallback((handlers: {
    handleToolCall?: ToolHandler;
    getCanvasState?: CanvasStateGetter;
    getUserEdits?: UserEditsGetter;
    navigateToFrames?: FrameNavigator;
  }, isCanvasReady = false) => {
    toolHandlersRef.current = {
      ...toolHandlersRef.current,
      ...handlers,
    };

    // Only drain pending tools + clear navigation state when the canvas is ready.
    // The home page also calls registerHandlers with no-op defaults — we must NOT
    // clear navigation state there, or pending tool calls will be lost.
    if (!isCanvasReady) return;

    // Drain pending tool calls after navigation completes
    if (isNavigatingRef.current && pendingToolCallsRef.current.length > 0) {
      isNavigatingRef.current = false;
      navigationTargetRef.current = null;
      const pending = [...pendingToolCallsRef.current];
      pendingToolCallsRef.current = [];
      // Canvas page has extra render cycle + tldraw init + Liveblocks — needs more time
      setTimeout(() => {
        pending.forEach(({ toolName, args }) => {
          toolHandlersRef.current.handleToolCall(toolName, args);
        });
      }, 800);
    } else {
      isNavigatingRef.current = false;
      navigationTargetRef.current = null;
    }

    // Drain pending frame navigation (from arrow button clicked while on home page)
    if (pendingFrameNavigationRef.current && handlers.navigateToFrames) {
      const frameNames = pendingFrameNavigationRef.current;
      pendingFrameNavigationRef.current = null;
      setTimeout(() => {
        toolHandlersRef.current.navigateToFrames(frameNames);
      }, 500);
    }
  }, []);

  const setActiveCanvas = useCallback((canvas: { canvasId: string; spaceId: string } | null) => {
    setActiveCanvasState(canvas);
  }, []);

  const setChatMode = useCallback((mode: ChatMode) => {
    setChatModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("chatMode", mode);
    }
  }, []);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setInput("");
    sessionCanvasRef.current = null;
    navigationTargetRef.current = null;
  }, [setMessages]);

  const openFullscreen = useCallback((immediate = false) => {
    setChatMode("fullscreen");
    // Store immediate flag in sessionStorage for ChatShell to read
    if (immediate && typeof window !== "undefined") {
      sessionStorage.setItem("chatOpenImmediate", "true");
    }
  }, [setChatMode]);

  const closeFullscreen = useCallback(() => {
    setChatMode("minimized");
  }, [setChatMode]);

  const contextValue: ChatContextType = {
    messages,
    append,
    setMessages,
    isLoading,
    chatMode,
    setChatMode,
    startNewChat,
    registerHandlers,
    navigateToFrames,
    navigateToCanvas,
    activePlanDetails,
    input,
    setInput,
    activeCanvas,
    setActiveCanvas,
    openFullscreen,
    closeFullscreen,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}
