"use client";

import { Tldraw, Editor, createShapeId, toRichText, TLShapeId } from "tldraw";
import "tldraw/tldraw.css";
import { useState, useCallback, useRef, useMemo } from "react";
import { useAgent, Message } from "@/hooks/useAgent";
import { Toolbar } from "./Toolbar";
import { ChatPanel } from "./ChatPanel";
import { IconSingleSparksFilled, IconViewSideRight } from "@mirohq/design-system-icons";
import { calculateLayout, findEmptyCanvasSpace } from "@/lib/layoutEngine";
import type { LayoutType, LayoutItem, LayoutOptions } from "@/types/layout";

// Floating progress indicator when chat panel is closed
function FloatingProgressIndicator({
  messages,
  isLoading,
  onOpenPanel,
  onSubmit,
  editor,
}: {
  messages: Message[];
  isLoading: boolean;
  onOpenPanel: () => void;
  onSubmit: (text: string, options?: { openPanel?: boolean }) => void;
  editor: Editor;
}) {
  const [isCompletionDismissed, setIsCompletionDismissed] = useState(false);

  // Extract plan state and pending checkpoint from messages
  const { activePlan, pendingCheckpoint } = useMemo(() => {
    let checkpoint: { completed: string } | null = null;

    // Check for pending checkpoint first
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'assistant') continue;

      const checkpointTool = msg.toolInvocations?.find(t => t.toolName === 'checkpoint');
      if (checkpointTool) {
        // Check if user already responded
        const laterUserMsg = messages.slice(i + 1).find(m => m.role === 'user');
        if (!laterUserMsg) {
          checkpoint = {
            completed: (checkpointTool.args as { completed: string }).completed,
          };
        }
      }
      break;
    }

    // Find active plan
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

      if (!userApproved && !hasProgressCalls) break;

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
        activePlan: {
          title: args.title,
          steps: args.steps,
          currentStep: Math.min(currentStep, args.steps.length - 1),
          isExecuting: isLoading,
        },
        pendingCheckpoint: checkpoint,
      };
    }
    return { activePlan: null, pendingCheckpoint: checkpoint };
  }, [messages, isLoading]);

  // Don't show if no active plan
  if (!activePlan) return null;

  const stepNumber = activePlan.currentStep + 1;
  const totalSteps = activePlan.steps.length;
  const currentStepText = activePlan.steps[activePlan.currentStep] || "";
  const isComplete = stepNumber >= totalSteps && !isLoading;

  // If complete and dismissed, show nothing (don't fall through to checkpoint)
  if (isComplete && isCompletionDismissed) {
    return null;
  }

  // If complete, show completion toast with "View work" button
  if (isComplete) {
    // Extract all frame names created during this plan
    const frameNames: string[] = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'assistant') continue;

      msg.toolInvocations?.forEach(t => {
        if (t.toolName === 'createLayout') {
          const args = t.args as { frameName?: string };
          if (args.frameName) {
            frameNames.push(args.frameName);
          }
        }
      });
    }

    const handleViewWork = () => {
      if (frameNames.length > 0) {
        // Navigate to all created frames
        const allShapes = editor.getCurrentPageShapes();
        const frames = allShapes.filter((s) =>
          s.type === 'frame' && frameNames.some(name => s.props.name?.includes(name))
        );

        if (frames.length > 0) {
          editor.select(...frames.map((f) => f.id));
          editor.zoomToSelection({ animation: { duration: 300 } });
        }
      }
    };

    return (
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2 bg-green-600 text-white rounded-2xl shadow-lg px-4 py-3 pb-3.5">
          {/* Checkmark icon */}
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <span className="text-sm font-medium flex-1">Task completed</span>

          {/* View work button */}
          <button
            onClick={handleViewWork}
            className="px-3 py-1 text-sm font-medium bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            View work
          </button>

          {/* Open sidebar icon */}
          <button
            onClick={onOpenPanel}
            className="p-1 text-white/70 hover:text-white transition-colors flex items-center justify-center"
          >
            <IconViewSideRight size="small" />
          </button>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCompletionDismissed(true);
            }}
            className="p-1 text-white/70 hover:text-white transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // If there's a pending checkpoint (but not complete), show checkpoint UI
  if (pendingCheckpoint && !isLoading) {
    const progress = (stepNumber / totalSteps) * 100;

    // Extract frames created since last checkpoint (or from start)
    const newFrameNames: string[] = [];
    let foundCurrentCheckpoint = false;
    let passedCurrentCheckpoint = false;

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'assistant') continue;

      const hasThisCheckpoint = msg.toolInvocations?.some(t =>
        t.toolName === 'checkpoint' &&
        (t.args as { completed: string }).completed === pendingCheckpoint.completed
      );

      // If this message has the current checkpoint, collect frames from it too
      if (hasThisCheckpoint) {
        foundCurrentCheckpoint = true;
        // Collect frames from THIS message (created before checkpoint was called)
        msg.toolInvocations?.forEach(t => {
          if (t.toolName === 'createLayout') {
            const args = t.args as { frameName?: string };
            if (args.frameName) {
              newFrameNames.push(args.frameName);
            }
          }
        });
        passedCurrentCheckpoint = true;
        continue;
      }

      // After passing the current checkpoint, collect frames until previous checkpoint
      if (passedCurrentCheckpoint) {
        const hasPreviousCheckpoint = msg.toolInvocations?.some(t => t.toolName === 'checkpoint');
        if (hasPreviousCheckpoint) break; // Stop at previous checkpoint

        msg.toolInvocations?.forEach(t => {
          if (t.toolName === 'createLayout') {
            const args = t.args as { frameName?: string };
            if (args.frameName) {
              newFrameNames.push(args.frameName);
            }
          }
        });
      }
    }

    const handleReviewBatch = () => {
      const allShapes = editor.getCurrentPageShapes();

      // Try to find frames by name first
      if (newFrameNames.length > 0) {
        const frames = allShapes.filter((s) =>
          s.type === 'frame' && newFrameNames.some(name => (s.props as { name?: string }).name?.includes(name))
        );

        if (frames.length > 0) {
          editor.select(...frames.map((f) => f.id));
          editor.zoomToSelection({ animation: { duration: 300 } });
          return;
        }
      }

      // Fallback: zoom to all frames on canvas
      const allFrames = allShapes.filter((s) => s.type === 'frame');
      if (allFrames.length > 0) {
        editor.select(...allFrames.map((f) => f.id));
        editor.zoomToSelection({ animation: { duration: 300 } });
      }
    };

    return (
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div
          onClick={handleReviewBatch}
          className="bg-blue-600 text-white rounded-2xl shadow-lg overflow-hidden w-80 hover:bg-blue-700 transition-colors cursor-pointer"
        >
          {/* Progress bar at top */}
          <div className="h-1 w-full bg-blue-800">
            <div className="h-full bg-blue-300 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex items-center gap-2 px-4 py-3 pb-3.5">
            {/* Progress circle */}
            <div className="relative w-8 h-8 flex-shrink-0">
              <svg className="w-8 h-8 -rotate-90">
                <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <circle cx="16" cy="16" r="14" fill="none" stroke="white" strokeWidth="3"
                  strokeDasharray={`${(stepNumber / totalSteps) * 88} 88`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                {stepNumber}/{totalSteps}
              </span>
            </div>

            {/* Checkpoint text */}
            <span className="text-sm font-medium truncate flex-1 text-left">
              Review batch
            </span>

            {/* Continue button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSubmit("Continue", { openPanel: false });
              }}
              className="ml-2 px-3 py-1 text-sm font-medium bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Continue
            </button>

            {/* Open sidebar button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPanel();
              }}
              className="p-1 text-white/70 hover:text-white transition-colors flex items-center justify-center"
            >
              <IconViewSideRight size="small" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = (stepNumber / totalSteps) * 100;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300">
      <button
        onClick={onOpenPanel}
        className="flex flex-col bg-gray-100 text-gray-900 rounded-2xl shadow-md hover:bg-gray-200 transition-colors overflow-hidden w-80"
      >
        {/* Progress bar at top */}
        <div className="h-1 w-full bg-gray-200">
          <div
            className={`h-full transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3 pb-3.5">
          {/* Progress circle with spinner */}
          <div className="relative w-8 h-8 flex-shrink-0">
            <svg className={`w-8 h-8 ${isLoading ? 'animate-spin' : '-rotate-90'}`}>
              <circle
                cx="16" cy="16" r="14"
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="3"
              />
              <circle
                cx="16" cy="16" r="14"
                fill="none"
                stroke={isComplete ? "#22c55e" : "#3b82f6"}
                strokeWidth="3"
                strokeDasharray={isLoading ? "40 88" : `${(stepNumber / totalSteps) * 88} 88`}
                strokeLinecap="round"
                className={isLoading ? "" : "-rotate-90 origin-center"}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
              {stepNumber}/{totalSteps}
            </span>
          </div>

          {/* Step text */}
          <span className="text-sm font-medium truncate flex-1 min-w-0 text-left">
            {currentStepText}
          </span>

          {/* Open sidebar icon */}
          <span className="text-gray-400 flex-shrink-0 flex items-center justify-center">
            <IconViewSideRight size="small" />
          </span>
        </div>
      </button>
    </div>
  );
}

// Valid tldraw colors
type TLColor =
  | "yellow"
  | "blue"
  | "green"
  | "orange"
  | "violet"
  | "black"
  | "red"
  | "grey"
  | "light-blue"
  | "light-green"
  | "light-red"
  | "light-violet"
  | "white";

// Map AI color names to tldraw colors
const colorMap: Record<string, TLColor> = {
  yellow: "yellow",
  blue: "blue",
  green: "green",
  pink: "red",
  orange: "orange",
  violet: "violet",
  black: "black",
  red: "red",
  "light-blue": "light-blue",
  "light-green": "light-green",
  "light-violet": "light-violet",
  grey: "grey",
  white: "white",
};

export function Canvas() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const createdShapesRef = useRef<TLShapeId[]>([]);

  // Navigate to frames by name - zooms to fit all matching frames
  const navigateToFrames = useCallback((frameNames: string[]) => {
    if (!editor || frameNames.length === 0) return;

    const shapes = editor.getCurrentPageShapes();
    const matchingFrames = shapes.filter(
      s => s.type === "frame" && frameNames.includes((s.props as { name?: string }).name || "")
    );

    if (matchingFrames.length === 0) return;

    // Calculate bounding box of all matching frames
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    matchingFrames.forEach(frame => {
      const bounds = editor.getShapeGeometry(frame.id).bounds;
      minX = Math.min(minX, frame.x);
      minY = Math.min(minY, frame.y);
      maxX = Math.max(maxX, frame.x + bounds.width);
      maxY = Math.max(maxY, frame.y + bounds.height);
    });

    // Zoom to fit with padding
    const padding = 50;
    editor.zoomToBounds(
      { x: minX - padding, y: minY - padding, w: maxX - minX + padding * 2, h: maxY - minY + padding * 2 },
      { animation: { duration: 300 } }
    );
  }, [editor]);

  // Find a non-overlapping position for a new item
  const findNonOverlappingPosition = useCallback(
    (proposedX: number, proposedY: number, width: number, height: number, itemType: string = "default"): { x: number; y: number } => {
      if (!editor) return { x: proposedX, y: proposedY };

      const shapes = editor.getCurrentPageShapes();
      const padding = 20; // Gap between items

      // Filter shapes to check against based on item type
      // - Stickies/shapes/text should NOT collide with frames (they go inside frames)
      // - Frames should collide with other frames
      const shapesToCheck = itemType === "frame"
        ? shapes.filter(s => s.type === "frame")
        : shapes.filter(s => s.type !== "frame");

      // Get all existing bounding boxes
      const existingBoxes = shapesToCheck.map((shape) => {
        const bounds = editor.getShapeGeometry(shape.id).bounds;
        return {
          x: shape.x,
          y: shape.y,
          width: bounds.width,
          height: bounds.height,
          right: shape.x + bounds.width,
          bottom: shape.y + bounds.height,
        };
      });

      // Check if a position overlaps with any existing shape
      const hasOverlap = (x: number, y: number, w: number, h: number) => {
        return existingBoxes.some((box) => {
          return !(
            x + w + padding < box.x ||
            x > box.right + padding ||
            y + h + padding < box.y ||
            y > box.bottom + padding
          );
        });
      };

      // If no overlap, use proposed position
      if (!hasOverlap(proposedX, proposedY, width, height)) {
        return { x: proposedX, y: proposedY };
      }

      // Try to find a free position - search in a grid pattern
      const gridStep = Math.max(width, height) + padding + 30;
      for (let attempts = 0; attempts < 50; attempts++) {
        // Try positions to the right first, then below
        const offsetX = (attempts % 10) * gridStep;
        const offsetY = Math.floor(attempts / 10) * gridStep;

        const testX = proposedX + offsetX;
        const testY = proposedY + offsetY;

        if (!hasOverlap(testX, testY, width, height)) {
          return { x: testX, y: testY };
        }
      }

      // Fallback: place far to the right
      const maxRight = existingBoxes.reduce((max, box) => Math.max(max, box.right), 0);
      return { x: maxRight + 100, y: proposedY };
    },
    [editor]
  );

  // Handle tool calls from the agent
  const handleToolCall = useCallback(
    (toolName: string, args: Record<string, unknown>) => {
      if (!editor) return;

      let shapeId: TLShapeId | null = null;

      if (toolName === "createSticky") {
        const { text, x, y, color } = args as {
          text: string;
          x: number;
          y: number;
          color: string;
        };

        // Find non-overlapping position (stickies are ~200x200)
        // Pass "sticky" type so it doesn't collide with frames (stickies go inside frames)
        const pos = findNonOverlappingPosition(x || 0, y || 0, 200, 200, "sticky");

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "note",
          x: pos.x,
          y: pos.y,
          props: {
            richText: toRichText(text),
            color: colorMap[color] || "yellow",
            size: "m",
          },
        });
      }

      if (toolName === "createShape") {
        const { type, text, x, y, width, height, color } = args as {
          type: string;
          text?: string;
          x: number;
          y: number;
          width: number;
          height: number;
          color: string;
        };

        const geoMap: Record<
          string,
          "rectangle" | "ellipse" | "triangle" | "diamond"
        > = {
          rectangle: "rectangle",
          ellipse: "ellipse",
          triangle: "triangle",
          diamond: "diamond",
        };

        // Ensure valid dimensions (minimum 50px)
        const validWidth = Math.max(width || 150, 50);
        const validHeight = Math.max(height || 80, 50);

        // Find non-overlapping position (shapes can be inside frames)
        const pos = findNonOverlappingPosition(x || 0, y || 0, validWidth, validHeight, "shape");

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "geo",
          x: pos.x,
          y: pos.y,
          props: {
            geo: geoMap[type] || "rectangle",
            w: validWidth,
            h: validHeight,
            color: colorMap[color] || "black",
            richText: text ? toRichText(text) : toRichText(""),
          },
        });
      }

      if (toolName === "createText") {
        const { text, x, y } = args as {
          text: string;
          x: number;
          y: number;
        };

        // Estimate text size (roughly 10px per char width, 30px height)
        const estimatedWidth = Math.max(text.length * 10, 100);
        const estimatedHeight = 40;

        // Find non-overlapping position (text can be inside frames)
        const pos = findNonOverlappingPosition(x || 0, y || 0, estimatedWidth, estimatedHeight, "text");

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "text",
          x: pos.x,
          y: pos.y,
          props: {
            richText: toRichText(text),
            size: "m",
          },
        });
      }

      if (toolName === "createFrame") {
        const { name, x, y, width, height } = args as {
          name: string;
          x: number;
          y: number;
          width: number;
          height: number;
        };

        // Ensure valid dimensions (minimum 100px for frames)
        const validWidth = Math.max(width || 400, 100);
        const validHeight = Math.max(height || 300, 100);

        // Find non-overlapping position (frames only check against other frames)
        const pos = findNonOverlappingPosition(x || 0, y || 0, validWidth, validHeight, "frame");

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "frame",
          x: pos.x,
          y: pos.y,
          props: {
            name: name || "Frame",
            w: validWidth,
            h: validHeight,
          },
        });
      }

      if (toolName === "createArrow") {
        const { startX, startY, endX, endY } = args as {
          startX: number;
          startY: number;
          endX: number;
          endY: number;
        };

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "arrow",
          x: startX,
          y: startY,
          props: {
            start: { x: 0, y: 0 },
            end: { x: endX - startX, y: endY - startY },
          },
        });
      }

      // Working notes - larger sticky with distinct color
      if (toolName === "createWorkingNote") {
        const { title, content, x, y } = args as {
          title: string;
          content: string;
          x: number;
          y: number;
        };

        // Working notes are larger - approximately 300x300
        const pos = findNonOverlappingPosition(x || 0, y || 0, 300, 300, "note");

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "note",
          x: pos.x,
          y: pos.y,
          props: {
            richText: toRichText(`${title}\n\n${content}`),
            color: "light-violet",
            size: "l",
          },
        });
      }

      // CREATE LAYOUT - auto-positioned content with frame
      if (toolName === "createLayout") {
        // Args come directly from the tool call
        const layout = args as {
          type: LayoutType;
          frameName: string;
          items: Array<{
            type: "sticky" | "shape" | "text";
            text: string;
            color?: string;
            parentIndex?: number;
          }>;
          columns?: number;
          direction?: "down" | "right";
          spacing?: "compact" | "normal" | "spacious";
        };

        // Convert to LayoutItem array
        const layoutItems: LayoutItem[] = layout.items.map((item) => ({
          type: item.type,
          text: item.text,
          color: item.color,
          // Convert -1 to undefined for root items
          parentIndex: item.parentIndex === -1 ? undefined : item.parentIndex,
        }));

        // Build options from flat args
        const options: LayoutOptions = {
          columns: layout.columns,
          direction: layout.direction,
          spacing: layout.spacing,
        };

        // Calculate the layout
        const result = calculateLayout(layout.type, layoutItems, options);

        // Find empty space on canvas for this layout
        const canvasPos = findEmptyCanvasSpace(editor, result.frame.width, result.frame.height);

        // Create the frame
        const frameId = createShapeId();
        editor.createShape({
          id: frameId,
          type: "frame",
          x: canvasPos.x,
          y: canvasPos.y,
          props: {
            name: layout.frameName,
            w: result.frame.width,
            h: result.frame.height,
          },
        });
        createdShapesRef.current.push(frameId);

        // Create all items at calculated positions
        result.items.forEach(({ item, position }) => {
          const itemId = createShapeId();
          const itemX = canvasPos.x + position.x;
          const itemY = canvasPos.y + position.y;

          if (item.type === "sticky") {
            editor.createShape({
              id: itemId,
              type: "note",
              x: itemX,
              y: itemY,
              props: {
                richText: toRichText(item.text),
                color: colorMap[item.color || "yellow"] || "yellow",
                size: "m",
              },
            });
          } else if (item.type === "shape") {
            // Create shape with native richText label (auto-centered)
            editor.createShape({
              id: itemId,
              type: "geo",
              x: itemX,
              y: itemY,
              props: {
                geo: "rectangle",
                w: position.width,
                h: position.height,
                color: colorMap[item.color || "blue"] || "blue",
                richText: toRichText(item.text || ""),
              },
            });
          } else if (item.type === "text") {
            editor.createShape({
              id: itemId,
              type: "text",
              x: itemX,
              y: itemY,
              props: {
                richText: toRichText(item.text),
                size: "m",
              },
            });
          }

          createdShapesRef.current.push(itemId);
        });

        // Create arrows if any
        result.arrows.forEach((arrow) => {
          const arrowId = createShapeId();
          editor.createShape({
            id: arrowId,
            type: "arrow",
            x: canvasPos.x + arrow.startX,
            y: canvasPos.y + arrow.startY,
            props: {
              start: { x: 0, y: 0 },
              end: {
                x: arrow.endX - arrow.startX,
                y: arrow.endY - arrow.startY,
              },
            },
          });
          createdShapesRef.current.push(arrowId);
        });

        // Don't set shapeId since we created multiple shapes
        return;
      }

      // Delete item from canvas
      if (toolName === "deleteItem") {
        const { itemId } = args as { itemId: string };
        // Find shape by ID - tldraw IDs are prefixed with "shape:"
        const allShapes = editor.getCurrentPageShapes();
        const shapeToDelete = allShapes.find(
          (s) => s.id === itemId || s.id === `shape:${itemId}`
        );
        if (shapeToDelete) {
          editor.deleteShape(shapeToDelete.id);
        }
      }

      // Update existing sticky note
      if (toolName === "updateSticky") {
        const { itemId, newText, newColor } = args as {
          itemId: string;
          newText: string;
          newColor: string;
        };
        const allShapes = editor.getCurrentPageShapes();
        const shapeToUpdate = allShapes.find(
          (s) => s.id === itemId || s.id === `shape:${itemId}`
        );
        if (shapeToUpdate && shapeToUpdate.type === "note") {
          editor.updateShape({
            id: shapeToUpdate.id,
            type: "note",
            props: {
              richText: toRichText(newText),
              color: colorMap[newColor] || "yellow",
            },
          });
        }
      }

      // Move item to new position
      if (toolName === "moveItem") {
        const { itemId, x, y } = args as {
          itemId: string;
          x: number;
          y: number;
        };
        const allShapes = editor.getCurrentPageShapes();
        const shapeToMove = allShapes.find(
          (s) => s.id === itemId || s.id === `shape:${itemId}`
        );
        if (shapeToMove) {
          editor.updateShape({
            id: shapeToMove.id,
            type: shapeToMove.type,
            x,
            y,
          });
        }
      }

      // Track created shape (removed auto-zoom - was too jumpy)
      if (shapeId) {
        createdShapesRef.current.push(shapeId);
      }
    },
    [editor, findNonOverlappingPosition]
  );

  // Get canvas state for agent context
  const getCanvasState = useCallback(() => {
    if (!editor) return [];
    const shapes = editor.getCurrentPageShapes();
    return shapes.map((shape) => {
      const props = shape.props as Record<string, unknown>;
      // Extract text from richText if present
      let text: string | undefined;
      if (props.richText) {
        const richText = props.richText as { content?: Array<{ content?: Array<{ text?: string }> }> };
        text = richText.content
          ?.flatMap((block) => block.content?.map((inline) => inline.text) || [])
          .join("") || undefined;
      }
      // Get bounds for the shape to include width/height
      const bounds = editor.getShapeGeometry(shape.id).bounds;
      return {
        id: shape.id,
        type: shape.type,
        text,
        color: props.color as string | undefined,
        x: Math.round(shape.x),
        y: Math.round(shape.y),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
      };
    });
  }, [editor]);

  const { messages, append, isLoading } = useAgent(handleToolCall, getCanvasState);

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  const handleSubmit = useCallback(
    (text: string, options?: { openPanel?: boolean }) => {
      if (!text.trim()) return;
      append({ role: "user", content: text });
      setInput("");
      if (!isChatOpen && options?.openPanel !== false) {
        setIsChatOpen(true);
      }
    },
    [append, isChatOpen]
  );

  return (
    <div className="h-screen w-screen flex overflow-hidden relative">
      {/* Main canvas area */}
      <div className="flex-1 relative">
        <Tldraw onMount={handleMount} hideUi />

        {/* AI Chat button - top right, hidden when panel is open */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="absolute top-4 right-4 z-50 w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-800"
            style={{
              boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
            }}
            title="AI Chat"
          >
            <IconSingleSparksFilled size="medium" />
          </button>
        )}

        {/* Floating progress indicator - shown when panel closed and plan active */}
        {!isChatOpen && editor && (
          <FloatingProgressIndicator
            messages={messages}
            isLoading={isLoading}
            onOpenPanel={() => setIsChatOpen(true)}
            onSubmit={handleSubmit}
            editor={editor}
          />
        )}

        {/* Custom toolbar at bottom center */}
        <Toolbar
          editor={editor}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          isChatOpen={isChatOpen}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>

      {/* Side chat panel - overlays canvas */}
      {isChatOpen && (
        <div className="absolute top-0 right-0 h-full w-96 z-[999] animate-in slide-in-from-right duration-300">
          <ChatPanel
            onClose={() => setIsChatOpen(false)}
            messages={messages}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onNavigateToFrames={navigateToFrames}
          />
        </div>
      )}
    </div>
  );
}
