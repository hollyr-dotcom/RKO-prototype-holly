import { useCallback, useRef, useState } from "react";
import { Editor } from "tldraw";
import { InstancePresenceRecordType } from "@tldraw/tlschema";
import {
  type AICursorState,
  type AICursorTarget,
  isValidTransition,
  AUTO_IDLE_TIMEOUT_MS,
  MIN_DWELL_MS,
  setSharedAIState,
} from "@/lib/ai-presence";

// Re-export types for consumers
export type { AICursorState, AICursorTarget };

type TargetChangeCallback = (target: AICursorTarget | null) => void;

interface QueuedMove {
  target: AICursorTarget;
  label?: string;
}

/**
 * Hook to manage AI's collaborator cursor on the canvas.
 * Creates a fake presence record that tldraw renders as a cursor + name badge.
 *
 * Expanded to support the full AI presence state machine:
 *   idle, listening, working, pointing, asking, waiting
 */
export function useAICursor(editorRef: React.RefObject<Editor | null>) {
  const [state, setStateInternal] = useState<AICursorState>("idle");

  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dwellTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPositionRef = useRef<{ x: number; y: number } | null>(null);
  const currentTargetRef = useRef<AICursorTarget | null>(null);
  const stateRef = useRef<AICursorState>("idle");
  const moveQueueRef = useRef<QueuedMove[]>([]);
  const isProcessingQueueRef = useRef(false);
  const lastMoveTimeRef = useRef(0);
  const targetChangeCallbacksRef = useRef<Set<TargetChangeCallback>>(new Set());

  // Spring interpolation state for smooth cursor movement
  const animationFrameRef = useRef<number | null>(null);
  const animTargetRef = useRef<{ x: number; y: number } | null>(null);
  const animCurrentRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const AI_CURSOR_ID = InstancePresenceRecordType.createId("ai-cursor");
  const AI_COLOR = "#2563EB"; // blue

  // Spring parameters matching spring.snappy: stiffness 400, damping 30
  const SPRING_STIFFNESS = 400;
  const SPRING_DAMPING = 30;
  const SPRING_MASS = 1;

  /** Helper: update state in ref, React state, and shared module-level store. */
  const applyState = useCallback((s: AICursorState) => {
    stateRef.current = s;
    setStateInternal(s);
    setSharedAIState(s);
  }, []);

  // ─── Activity tracking ──────────────────────────────────────────────

  const resetAutoIdle = useCallback(() => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      if (stateRef.current !== "idle") {
        // Force transition to idle on timeout
        applyState("idle");
        removePresenceRecord();
        notifyTargetChange(null);
      }
    }, AUTO_IDLE_TIMEOUT_MS);
  }, []);

  // ─── Target change notifications ───────────────────────────────────

  const notifyTargetChange = useCallback((target: AICursorTarget | null) => {
    currentTargetRef.current = target;
    targetChangeCallbacksRef.current.forEach((cb) => cb(target));
  }, []);

  /**
   * Subscribe to target changes. Returns unsubscribe function.
   * The camera tracking system consumes this to follow the AI cursor.
   */
  const onTargetChange = useCallback(
    (callback: TargetChangeCallback): (() => void) => {
      targetChangeCallbacksRef.current.add(callback);
      return () => {
        targetChangeCallbacksRef.current.delete(callback);
      };
    },
    []
  );

  /** Get the current presence state. */
  const getCurrentState = useCallback((): AICursorState => {
    return stateRef.current;
  }, []);

  // ─── Presence record helpers ────────────────────────────────────────

  const putPresenceRecord = useCallback(
    (label: string, pos: { x: number; y: number }) => {
      const editor = editorRef.current;
      if (!editor) return;

      const presenceRecord = InstancePresenceRecordType.create({
        id: AI_CURSOR_ID,
        currentPageId: editor.getCurrentPageId(),
        userId: "ai-cursor",
        userName: label,
        cursor: { x: pos.x, y: pos.y, type: "default", rotation: 0 },
        color: AI_COLOR,
        camera: { x: 0, y: 0, z: 1 },
        selectedShapeIds: [],
        brush: null,
        scribbles: [],
        chatMessage: "",
        meta: { state: stateRef.current },
        followingUserId: null,
      });

      editor.store.put([presenceRecord]);
    },
    [editorRef, AI_CURSOR_ID, AI_COLOR]
  );

  const removePresenceRecord = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      editor.store.remove([AI_CURSOR_ID]);
    } catch {
      // Record might not exist
    }
    currentPositionRef.current = null;
  }, [editorRef, AI_CURSOR_ID]);

  // ─── Spring animation ──────────────────────────────────────────────

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const animateToPosition = useCallback(
    (targetPos: { x: number; y: number }, label: string) => {
      stopAnimation();

      animTargetRef.current = targetPos;

      // If no current position, jump immediately
      if (!currentPositionRef.current) {
        currentPositionRef.current = { ...targetPos };
        putPresenceRecord(label, targetPos);
        return;
      }

      // Initialize spring velocity state
      if (!animCurrentRef.current) {
        animCurrentRef.current = {
          x: currentPositionRef.current.x,
          y: currentPositionRef.current.y,
          vx: 0,
          vy: 0,
        };
      } else {
        animCurrentRef.current.x = currentPositionRef.current.x;
        animCurrentRef.current.y = currentPositionRef.current.y;
      }

      let lastTime = performance.now();

      const step = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, 0.064); // cap at ~16fps min
        lastTime = now;

        const anim = animCurrentRef.current!;
        const target = animTargetRef.current!;

        // Spring physics: F = -k * displacement - d * velocity
        const dx = anim.x - target.x;
        const dy = anim.y - target.y;
        const ax = (-SPRING_STIFFNESS * dx - SPRING_DAMPING * anim.vx) / SPRING_MASS;
        const ay = (-SPRING_STIFFNESS * dy - SPRING_DAMPING * anim.vy) / SPRING_MASS;

        anim.vx += ax * dt;
        anim.vy += ay * dt;
        anim.x += anim.vx * dt;
        anim.y += anim.vy * dt;

        currentPositionRef.current = { x: anim.x, y: anim.y };
        putPresenceRecord(label, { x: anim.x, y: anim.y });

        // Check if settled (close enough and velocity low)
        const distSq = dx * dx + dy * dy;
        const velSq = anim.vx * anim.vx + anim.vy * anim.vy;
        if (distSq < 1 && velSq < 1) {
          // Snap to target
          currentPositionRef.current = { ...target };
          putPresenceRecord(label, target);
          animationFrameRef.current = null;
          return;
        }

        animationFrameRef.current = requestAnimationFrame(step);
      };

      animationFrameRef.current = requestAnimationFrame(step);
    },
    [putPresenceRecord, stopAnimation]
  );

  // ─── Target resolution ─────────────────────────────────────────────

  const resolveTargetPosition = useCallback(
    (target: AICursorTarget): { x: number; y: number } | null => {
      const editor = editorRef.current;
      if (!editor) return null;

      switch (target.type) {
        case "shape": {
          if (!target.shapeId) return null;
          try {
            const bounds = editor.getShapePageBounds(target.shapeId as any);
            if (bounds) {
              return { x: bounds.center.x, y: bounds.center.y };
            }
          } catch {
            // Shape not found
          }
          return null;
        }

        case "point": {
          return target.point || null;
        }

        case "bounds": {
          if (!target.bounds) return null;
          return {
            x: target.bounds.x + target.bounds.w / 2,
            y: target.bounds.y + target.bounds.h / 2,
          };
        }

        case "shapes": {
          if (!target.shapeIds || target.shapeIds.length === 0) return null;
          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
          for (const id of target.shapeIds) {
            try {
              const bounds = editor.getShapePageBounds(id as any);
              if (bounds) {
                minX = Math.min(minX, bounds.x);
                minY = Math.min(minY, bounds.y);
                maxX = Math.max(maxX, bounds.maxX);
                maxY = Math.max(maxY, bounds.maxY);
              }
            } catch {
              // Skip missing shapes
            }
          }
          if (minX === Infinity) return null;
          return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        }

        default:
          return null;
      }
    },
    [editorRef]
  );

  // ─── Movement queue ────────────────────────────────────────────────

  const processQueue = useCallback(() => {
    if (isProcessingQueueRef.current) return;
    if (moveQueueRef.current.length === 0) return;

    isProcessingQueueRef.current = true;
    const now = Date.now();
    const timeSinceLastMove = now - lastMoveTimeRef.current;
    const delay = Math.max(0, MIN_DWELL_MS - timeSinceLastMove);

    const executeNext = () => {
      const next = moveQueueRef.current.shift();
      if (!next) {
        isProcessingQueueRef.current = false;
        return;
      }

      const pos = resolveTargetPosition(next.target);
      if (pos) {
        const label = next.label || next.target.label || "";
        animateToPosition(pos, label);
        notifyTargetChange(next.target);
        lastMoveTimeRef.current = Date.now();
      }

      isProcessingQueueRef.current = false;

      // Process next item if queue is not empty
      if (moveQueueRef.current.length > 0) {
        processQueue();
      }
    };

    if (delay > 0) {
      dwellTimeoutRef.current = setTimeout(executeNext, delay);
    } else {
      executeNext();
    }
  }, [resolveTargetPosition, animateToPosition, notifyTargetChange]);

  // ─── State transitions ─────────────────────────────────────────────

  /**
   * Transition to a new presence state. Invalid transitions are silently ignored.
   * Transitioning to "idle" hides the cursor. Other states show it.
   */
  const setState = useCallback(
    (newState: AICursorState) => {
      const current = stateRef.current;

      // Allow force-reset to idle from any state (timeout / conversation end)
      if (newState === "idle" || isValidTransition(current, newState)) {
        applyState(newState);
        resetAutoIdle();

        if (newState === "idle") {
          stopAnimation();
          removePresenceRecord();
          notifyTargetChange(null);
          moveQueueRef.current = [];
        }
      }
    },
    [resetAutoIdle, stopAnimation, removePresenceRecord, notifyTargetChange]
  );

  // ─── Public API: pointAt ───────────────────────────────────────────

  /**
   * Move cursor to a target with spring animation.
   * Queues the move if the dwell timer hasn't elapsed.
   */
  const pointAt = useCallback(
    (target: AICursorTarget) => {
      resetAutoIdle();

      // Auto-transition to pointing if needed
      if (stateRef.current === "idle") {
        applyState("listening");
      }
      if (stateRef.current !== "pointing") {
        if (isValidTransition(stateRef.current, "pointing")) {
          applyState("pointing");
        }
      }

      moveQueueRef.current.push({ target, label: target.label });
      processQueue();
    },
    [resetAutoIdle, processQueue]
  );

  // ─── Legacy API (preserved for backwards compatibility) ────────────

  const getToolLabel = useCallback(
    (toolName: string, args?: Record<string, unknown>): string => {
      const labelMap: Record<string, string> = {
        createSticky: "Creating stickies",
        createShape: "Creating shapes",
        createText: "Adding text",
        createFrame: "Creating frame",
        createArrow: "Drawing connections",
        createLayout: "Building layout",
        createWorkingNote: "Making notes",
        createSources: "Adding sources",
        deleteItem: "Cleaning up",
        deleteFrame: "Cleaning up",
        updateSticky: "Updating content",
        moveItem: "Rearranging",
        webSearch: "Searching the web",
        showProgress: args?.stepNumber
          ? `Working on step ${args.stepNumber}`
          : "Working...",
        confirmPlan: "Planning...",
        reviewCanvas: "Reviewing canvas",
      };

      return labelMap[toolName] || "Working...";
    },
    []
  );

  const getToolPosition = useCallback(
    (
      toolName: string,
      args: Record<string, unknown>,
      editor: Editor
    ): { x: number; y: number } | null => {
      if (
        "x" in args &&
        "y" in args &&
        typeof args.x === "number" &&
        typeof args.y === "number"
      ) {
        return { x: args.x - 20, y: args.y - 30 };
      }

      if ("id" in args && typeof args.id === "string") {
        try {
          const bounds = editor.getShapePageBounds(args.id as any);
          if (bounds) {
            return { x: bounds.x - 20, y: bounds.y - 30 };
          }
        } catch {
          // Shape not found
        }
      }

      if (toolName === "moveItem" && "x" in args && "y" in args) {
        return { x: (args.x as number) - 20, y: (args.y as number) - 30 };
      }

      if (["webSearch", "confirmPlan", "reviewCanvas"].includes(toolName)) {
        return currentPositionRef.current;
      }

      const viewportPageBounds = editor.getViewportPageBounds();
      return { x: viewportPageBounds.center.x, y: viewportPageBounds.center.y };
    },
    []
  );

  /**
   * Show the AI cursor with a label at a position.
   */
  const show = useCallback(
    (label: string, position?: { x: number; y: number }) => {
      const editor = editorRef.current;
      if (!editor) return;

      const pos =
        position ||
        (() => {
          const viewportPageBounds = editor.getViewportPageBounds();
          return {
            x: viewportPageBounds.center.x,
            y: viewportPageBounds.center.y,
          };
        })();

      currentPositionRef.current = pos;
      putPresenceRecord(label, pos);
      resetAutoIdle();

      // Auto-set state to working if idle
      if (stateRef.current === "idle") {
        applyState("listening");
      }
    },
    [editorRef, putPresenceRecord, resetAutoIdle, applyState]
  );

  /**
   * Update cursor for a tool call — changes label and position.
   */
  const updateForToolCall = useCallback(
    (toolName: string, args: Record<string, unknown>) => {
      const editor = editorRef.current;
      if (!editor) return;

      const label = getToolLabel(toolName, args);
      const position = getToolPosition(toolName, args, editor);

      if (position) {
        currentPositionRef.current = position;
      }

      const finalPosition =
        position ||
        currentPositionRef.current ||
        (() => {
          const viewportPageBounds = editor.getViewportPageBounds();
          return {
            x: viewportPageBounds.center.x,
            y: viewportPageBounds.center.y,
          };
        })();

      // Transition to working state during tool execution
      if (stateRef.current === "idle") {
        applyState("listening");
      }
      if (
        stateRef.current !== "working" &&
        isValidTransition(stateRef.current, "working")
      ) {
        applyState("working");
      }

      animateToPosition(finalPosition, label);
      resetAutoIdle();
    },
    [editorRef, getToolLabel, getToolPosition, animateToPosition, resetAutoIdle, applyState]
  );

  /**
   * Hide the AI cursor.
   */
  const hide = useCallback(() => {
    stopAnimation();
    removePresenceRecord();
    applyState("idle");
    notifyTargetChange(null);
    moveQueueRef.current = [];

    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  }, [stopAnimation, removePresenceRecord, applyState, notifyTargetChange]);

  /**
   * Schedule hiding the cursor after a delay (for voice mode).
   */
  const scheduleHide = useCallback(
    (delayMs: number) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = setTimeout(() => {
        hide();
      }, delayMs);
    },
    [hide]
  );

  /**
   * Cancel a scheduled hide.
   */
  const cancelScheduledHide = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  return {
    // Presence state
    state,
    setState,
    getCurrentState,
    pointAt,
    onTargetChange,

    // Legacy API
    show,
    updateForToolCall,
    hide,
    scheduleHide,
    cancelScheduledHide,
  };
}
